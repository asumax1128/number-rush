/** Vol.48: cross-tab write serialization for TRIPLE via an injected exclusive lock.
 * Browser caller supplies navigator.locks; fail closed if unavailable.
 * Lock must cover restore -> duplicate check -> commit, not just setItem.
 * This cannot protect writes by legacy code that bypasses the lock.
 */
import {KEY_V2,TriplePersistentRecorder} from './triple-idempotent.mjs';
export const LOCK_NAME='number-rush:triple-telemetry:v2:write';
export async function commitTripleWithLock({storage,locks,questionId,event,onWarning=()=>{}}){
 if(typeof locks?.request!=='function')return {status:'lock-unavailable',recorded:false,saved:false};
 try{
  return await locks.request(LOCK_NAME,{mode:'exclusive'},async()=>{
   const recorder=new TriplePersistentRecorder(storage,{onWarning}).restore();
   if(['corrupt','storage-unavailable'].includes(recorder.status))return {status:recorder.status,recorded:false,saved:false};
   const result=recorder.commit(questionId,event);
   return {status:result.saved?'ok':'save-failed',...result};
  });
 }catch(e){onWarning('lock-or-commit-failed',e);return {status:'lock-failed',recorded:false,saved:false};}
}
