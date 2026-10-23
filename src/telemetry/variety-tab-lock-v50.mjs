/** Vol.50: serialize Variety migration and writes across cooperating same-origin tabs.
 * Both initialization and record must use this API; legacy direct writers are unsafe.
 */
import {initializeVarietyHistory} from './variety-init-v49.mjs';
import {IdempotentTargetHistory} from './variety-history-idempotent-v47.mjs';
export const VARIETY_LOCK_NAME='number-rush:variety-target-history:v2:write';
const failed=status=>({status,recorded:false,saved:false});
export function initializeLockedVariety({storage,locks,onWarning=()=>{}}){
 if(typeof storage?.getItem!=='function'||typeof storage?.setItem!=='function')throw TypeError('storage');
 if(typeof locks?.request!=='function'){
  return {ready:Promise.resolve(false),status:Promise.resolve('lock-unavailable'),snapshot:async()=>[],
   recordAnswer:async()=>failed('lock-unavailable')};
 }
 const init=locks.request(VARIETY_LOCK_NAME,{mode:'exclusive'},()=>initializeVarietyHistory(storage,{onWarning}))
  .catch(e=>{onWarning('init-lock-failed',e);return {ready:false,status:'init-lock-failed'};});
 const snapshot=async()=>{
  const boot=await init;
  if(!boot.ready)return [];
  try{
   return await locks.request(VARIETY_LOCK_NAME,{mode:'exclusive'},()=>{
    const h=new IdempotentTargetHistory(storage,{onWarning}).restore();
    if(['corrupt','storage-unavailable','v1-needs-migration'].includes(h.status))return [];
    return h.snapshot();
   });
  }catch(e){onWarning('snapshot-failed',e);return [];}
 };
 const recordAnswer=async({answerId,outcome,consumedTileCount})=>{
  const boot=await init;
  if(!boot.ready)return failed(boot.status);
  try{
   return await locks.request(VARIETY_LOCK_NAME,{mode:'exclusive'},()=>{
    const h=new IdempotentTargetHistory(storage,{onWarning}).restore();
    if(['corrupt','storage-unavailable','v1-needs-migration'].includes(h.status))return failed(h.status);
    try{
     const result=h.record({answerId,outcome,consumedTileCount});
     return {status:result.saved?'ok':'save-failed',...result};
    }catch(e){onWarning('record-failed',e);return failed('invalid-event');}
   });
  }catch(e){onWarning('lock-failed',e);return failed('lock-failed');}
 };
 return {ready:init.then(x=>x.ready),status:init.then(x=>x.status),snapshot,recordAnswer};
}
