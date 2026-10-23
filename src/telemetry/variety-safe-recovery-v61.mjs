/** Vol.61: cross-tab recovery coordinator and non-evicting answer-ID ledger.
 * A conservative at-most-once gate, not exactly-once: after a crash in the
 * ambiguous window it refuses automatic replay and requires reconciliation.
 * All cooperating writers MUST use the same Web Locks protocol.
 */
export const RECOVERY_LOCK_V61='number-rush:variety-recovery:v61:global';
export const LEDGER_KEY_V61='number-rush:variety-answer-ledger:v1';
const valid=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,96}$/.test(id);
export function createSafeVarietyRecoveryV61({storage,locks,pending,recordAnswer,onWarning=()=>{},maxIds=10000}){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||!pending||typeof pending.list!=='function'||typeof pending.acknowledge!=='function'||typeof recordAnswer!=='function')throw TypeError('storage/pending/recordAnswer required');
 if(!Number.isInteger(maxIds)||maxIds<1)throw RangeError('maxIds');
 const exclusive=async fn=>{
  if(typeof locks?.request!=='function')return {ok:false,status:'lock-unavailable'};
  try{return await locks.request(RECOVERY_LOCK_V61,{mode:'exclusive'},fn);}
  catch(e){onWarning('recovery-error',e);return {ok:false,status:'recovery-error'};}
 };
 const read=()=>{
  const raw=storage.getItem(LEDGER_KEY_V61);
  if(raw===null)return {};
  if(raw.length>1500000)throw Error('ledger-too-large');
  const obj=JSON.parse(raw);
  if(obj?.version!==1||!obj.ids||Array.isArray(obj.ids)||typeof obj.ids!=='object')throw Error('ledger-corrupt');
  for(const [id,status] of Object.entries(obj.ids))if(!valid(id)||!['started','saved'].includes(status))throw Error('ledger-corrupt');
  return obj.ids;
 };
 const write=ids=>storage.setItem(LEDGER_KEY_V61,JSON.stringify({version:1,ids}));
 const recover=()=>exclusive(async()=>{
  const pendingState=await pending.list();
  if(!pendingState.ok)return {...pendingState,ok:false};
  let ids=read(),saved=0,already=0,uncertain=0,failed=0;
  for(const event of pendingState.entries){
   if(!valid(event.answerId)){failed++;continue;}
   const status=ids[event.answerId];
   if(status==='saved'){
    const ack=await pending.acknowledge(event.answerId);
    if(ack.ok)already++;else failed++;
    continue;
   }
   if(status==='started'){uncertain++;continue;} // crash after started, no automatic replay
   if(Object.keys(ids).length>=maxIds){failed++;continue;} // never evict old IDs
   // Durable STARTED marker BEFORE history write; ambiguous crash => fail closed.
   ids={...ids,[event.answerId]:'started'};
   write(ids);
   let result;
   try{result=await recordAnswer(Object.freeze({...event}));}
   catch(e){onWarning('history-retry-failed',e);uncertain++;continue;}
   if(result?.saved===true){
    ids={...ids,[event.answerId]:'saved'};write(ids);
    const ack=await pending.acknowledge(event.answerId);
    if(ack.ok)saved++;else failed++;
   }else uncertain++;
  }
  return {ok:true,status:'recovery-complete',saved,already,uncertain,failed};
 });
 return Object.freeze({recover,inspect:()=>exclusive(()=>({ok:true,ids:read()}))});
}
