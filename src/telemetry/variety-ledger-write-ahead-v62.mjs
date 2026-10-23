/** Vol.62 coordinated NEW answer writes and recovery share one global lock.
 * Ledger STARTED is written before history; ambiguity is quarantined, not replayed.
 * The latest-20 history is display-only; ledger IDs are never automatically evicted.
 * Integration requires ALL tabs to use this bridge, not the old Vol.60 writer.
 */
import {createAnswerIdFactory,makeCommittedAnswer} from './answer-id-v52.mjs';
import {createDurableVarietyPendingStore} from './variety-pending-store-v59.mjs';
import {initializeLockedVariety} from './variety-tab-lock-v50.mjs';
import {createSafeVarietyRecoveryV61,RECOVERY_LOCK_V61,LEDGER_KEY_V61} from './variety-safe-recovery-v61.mjs';
const valid=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,96}$/.test(id);
function readLedger(storage){
 const raw=storage.getItem(LEDGER_KEY_V61);
 if(raw===null)return {};
 if(raw.length>1500000)throw Error('ledger-too-large');
 const x=JSON.parse(raw);
 if(x?.version!==1||!x.ids||Array.isArray(x.ids)||typeof x.ids!=='object')throw Error('ledger-corrupt');
 for(const [id,status] of Object.entries(x.ids))if(!valid(id)||!['started','saved'].includes(status))throw Error('ledger-corrupt');
 return x.ids;
}
function writeLedger(storage,ids){storage.setItem(LEDGER_KEY_V61,JSON.stringify({version:1,ids}));}
export function createLedgerWriteAheadVarietyV62({storage,locks,cryptoProvider,onWarning=()=>{},maxIds=10000}){
 if(typeof locks?.request!=='function')throw Error('Web Locks required for coordinated write-ahead');
 const factory=createAnswerIdFactory({cryptoProvider});
 const pending=createDurableVarietyPendingStore({storage,locks,onWarning});
 const history=initializeLockedVariety({storage,locks,onWarning});
 const recovery=createSafeVarietyRecoveryV61({storage,locks,pending,recordAnswer:event=>history.recordAnswer(event),onWarning,maxIds});
 const inFlight=new Map(),settled=new Map();
 async function write(event){
  return locks.request(RECOVERY_LOCK_V61,{mode:'exclusive'},async()=>{
   const ledger=readLedger(storage);
   if(ledger[event.answerId])return {event,saved:ledger[event.answerId]==='saved',status:'already-in-ledger'};
   if(Object.keys(ledger).length>=maxIds)return {event,saved:false,status:'ledger-full'};
   const stage=await pending.stage(event);
   if(!stage.ok)return {event,saved:false,status:'pending-stage-failed',stage};
   ledger[event.answerId]='started';
   writeLedger(storage,ledger);
   let result;
   try{result=await history.recordAnswer(event);}catch(error){onWarning('history-write-failed',error);return {event,saved:false,status:'ambiguous-history-write'};}
   if(result.saved!==true)return {event,saved:false,status:'ambiguous-history-write'};
   ledger[event.answerId]='saved';
   writeLedger(storage,ledger);
   const ack=await pending.acknowledge(event.answerId);
   return {event,saved:true,status:ack.ok?'saved':'saved-pending-ack',ack};
  });
 }
 function commit({answerKey,finalized,outcome,consumedTileCount}){
  if(!valid(answerKey)||finalized!==true)throw TypeError('finalized answerKey required');
  const signature=JSON.stringify([outcome,consumedTileCount]);
  const existing=inFlight.get(answerKey)||settled.get(answerKey);
  if(existing){if(existing.signature!==signature)throw Error('answerKey conflict');return existing.promise;}
  const event=makeCommittedAnswer(factory,{outcome,consumedTileCount});
  const promise=event.outcome==='MISS'?Promise.resolve({event,saved:true,status:'miss-not-recorded'}):
   write(event).catch(error=>{onWarning('write-ahead-failed',error);return {event,saved:false,status:'write-ahead-failed'};});
  const entry={signature,promise};inFlight.set(answerKey,entry);
  promise.finally(()=>{inFlight.delete(answerKey);settled.set(answerKey,entry);while(settled.size>512)settled.delete(settled.keys().next().value);}).catch(()=>{});
  return promise;
 }
 return Object.freeze({ready:history.ready,commit,recover:recovery.recover,inspectLedger:recovery.inspect,pending,historySnapshot:history.snapshot});
}
