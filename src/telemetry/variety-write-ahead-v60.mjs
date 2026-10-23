/** Vol.60: new write-ahead answer boundary. Never use old Vol.56 commit()
 * to write before stage(). Use the Vol.50 locked history adapter via recordAnswer.
 * stage -> recordAnswer -> acknowledge, preserving original answerId.
 * If stage fails, do not write history: the game can proceed without telemetry.
 */
import {createAnswerIdFactory,makeCommittedAnswer} from './answer-id-v52.mjs';
import {createDurableVarietyPendingStore} from './variety-pending-store-v59.mjs';
import {initializeLockedVariety} from './variety-tab-lock-v50.mjs';
export function createWriteAheadVarietyBridge({storage,locks,cryptoProvider,onWarning=()=>{},maxPending=128}){
 const ids=createAnswerIdFactory({cryptoProvider});
 const pending=createDurableVarietyPendingStore({storage,locks,maxPending,onWarning});
 const history=initializeLockedVariety({storage,locks,onWarning});
 const inFlight=new Map(),settled=new Map();
 const commit=({answerKey,finalized,outcome,consumedTileCount})=>{
  if(typeof answerKey!=='string'||!/^[-_A-Za-z0-9]{1,96}$/.test(answerKey)||finalized!==true)throw TypeError('authoritative answerKey/finalized required');
  const fingerprint=JSON.stringify([outcome,consumedTileCount]);
  const cached=inFlight.get(answerKey)||settled.get(answerKey);
  if(cached){if(cached.fingerprint!==fingerprint)throw Error('answerKey conflict');return cached.promise;}
  const event=makeCommittedAnswer(ids,{outcome,consumedTileCount});
  const promise=(async()=>{
   if(event.outcome==='MISS')return {event,stage:{ok:true,status:'miss-not-staged'},persistence:{saved:true,recorded:false},ack:null};
   const stage=await pending.stage(event);
   if(!stage.ok)return {event,stage,persistence:{saved:false,recorded:false,status:'stage-failed'},ack:null};
   const persistence=await history.recordAnswer(event);
   const ack=persistence.saved===true?await pending.acknowledge(event.answerId):null;
   return {event,stage,persistence,ack};
  })();
  const entry={fingerprint,promise};inFlight.set(answerKey,entry);
  promise.finally(()=>{inFlight.delete(answerKey);settled.set(answerKey,entry);while(settled.size>512)settled.delete(settled.keys().next().value);}).catch(()=>{});
  return promise;
 };
 const recover=()=>pending.recover(event=>history.recordAnswer(event));
 return Object.freeze({ready:history.ready,commit,recover,pending,historySnapshot:history.snapshot});
}
