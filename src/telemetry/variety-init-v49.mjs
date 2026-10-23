/** Vol.49: non-destructive boot path for Variety v1 -> v2.
 * Do not permit recording until migration and v2 validation have succeeded.
 */
import {migrateVarietyHistoryV1ToV2} from './variety-history-migrate-v48.mjs';
import {IdempotentTargetHistory} from './variety-history-idempotent-v47.mjs';
export function initializeVarietyHistory(storage,{onWarning=()=>{}}={}){
 if(typeof storage?.getItem!=='function'||typeof storage?.setItem!=='function')throw new TypeError('storage');
 const migration=migrateVarietyHistoryV1ToV2(storage,{onWarning});
 if(['invalid-v1','read-failed','write-failed'].includes(migration.status)){
  return {ready:false,status:migration.status,migration,history:null};
 }
 const history=new IdempotentTargetHistory(storage,{onWarning}).restore();
 if(['corrupt','storage-unavailable','v1-needs-migration'].includes(history.status)){
  return {ready:false,status:history.status,migration,history:null};
 }
 return {ready:true,status:history.status,migration,history};
}
