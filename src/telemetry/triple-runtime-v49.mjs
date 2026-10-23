/** Vol.49: single public entry point for TRIPLE initialization and locked commits.
 * Call initializeTripleRuntime once at game startup, then runtime.commitQuestion
 * when a NEW question is committed. Never write directly via old v1/v2 recorders.
 */
import {initializeTripleTelemetry} from './triple-init-v47.mjs';
import {commitTripleWithLock} from './triple-tab-lock-v48.mjs';
export function initializeTripleRuntime({storage,locks,onWarning=()=>{}}){
 if(typeof storage?.getItem!=='function'||typeof storage?.setItem!=='function')throw new TypeError('storage');
 // Fail closed if no cross-tab lock. Do not migrate data without serialization.
 if(typeof locks?.request!=='function'){
  return {ready:false,status:'lock-unavailable',migration:null,
    commitQuestion:async()=>({status:'lock-unavailable',recorded:false,saved:false})};
 }
 // Initialization is async because migration must also be protected by the same lock.
 const initPromise=locks.request('number-rush:triple-telemetry:v2:write',{mode:'exclusive'},
   ()=>initializeTripleTelemetry(storage,{onWarning}));
 const commitQuestion=async(questionId,event)=>{
  let init;
  try{init=await initPromise;}
  catch(e){onWarning('init-lock-failed',e);return {status:'init-lock-failed',recorded:false,saved:false};}
  if(!init.ready)return {status:init.status,recorded:false,saved:false};
  return commitTripleWithLock({storage,locks,questionId,event,onWarning});
 };
 return {ready:Promise.resolve(initPromise).then(x=>x.ready,()=>false),
   status:Promise.resolve(initPromise).then(x=>x.status,()=> 'init-lock-failed'),
   migration:Promise.resolve(initPromise).then(x=>x.migration,()=>null),commitQuestion};
}
