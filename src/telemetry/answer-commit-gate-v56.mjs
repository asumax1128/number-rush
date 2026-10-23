/** Vol.56: in-runtime idempotency gate for authoritative answer commits.
 * Caller MUST supply a stable answerKey for each adjudicated answer.
 * In-flight duplicate calls share the same Promise; settled duplicates reuse
 * the original committed event, never mint a new answerId.
 * Scope: one page runtime, not crash-safe or cross-tab exactly-once.
 */
import {connectVarietyToAdjudication} from './variety-adjudication-v54.mjs';

export function createGuardedAnswerCommitter({storage,locks,cryptoProvider,onWarning=()=>{},onPersistenceStatus=()=>{},maxSettled=512}){
 if(!Number.isInteger(maxSettled)||maxSettled<1)throw new RangeError('maxSettled');
 const bridge=connectVarietyToAdjudication({storage,locks,cryptoProvider,onWarning,onPersistenceStatus});
 const inFlight=new Map(),settled=new Map();
 const commit=({answerKey,...adjudication})=>{
  if(typeof answerKey!=='string'||!/^[-_A-Za-z0-9]{1,96}$/.test(answerKey))throw new TypeError('stable answerKey required');
  if(adjudication.finalized!==true)throw new TypeError('finalized adjudication required');
  if(!['MISSION_CLEAR','TARGET_CLEAR','MISS'].includes(adjudication.outcome))throw new TypeError('invalid outcome');
  if(!Number.isInteger(adjudication.consumedTileCount)||adjudication.consumedTileCount<0||adjudication.consumedTileCount>6)throw new TypeError('invalid tile count');
  if(adjudication.outcome==='MISS'&&adjudication.consumedTileCount!==0)throw new TypeError('MISS tile count');
  if(adjudication.outcome!=='MISS'&&adjudication.consumedTileCount===0)throw new TypeError('CLEAR tile count');
  const fingerprint=adjudication.outcome+':'+adjudication.consumedTileCount;
  const cached=settled.get(answerKey)||inFlight.get(answerKey);
  if(cached){
   if(cached.fingerprint!==fingerprint)throw new Error('answerKey conflict');
   return cached.promise;
  }
  const promise=Promise.resolve().then(()=>bridge.onAdjudicated(adjudication));
  const entry={fingerprint,promise};
  inFlight.set(answerKey,entry);
  promise.then(()=>{
   inFlight.delete(answerKey);settled.set(answerKey,entry);
   while(settled.size>maxSettled)settled.delete(settled.keys().next().value);
  },()=>{inFlight.delete(answerKey);});
  return promise;
 };
 return {ready:bridge.ready,commit,retry:bridge.retry,snapshot:bridge.snapshot};
}
