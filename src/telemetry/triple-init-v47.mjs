/** Vol.47: initialize TRIPLE telemetry with v1->v2 migration, then persistent recorder.
 * The caller must use the returned recorder for all new commits, never v1 autosave.
 * Existing v1 data is preserved. Corruption never triggers automatic reset.
 */
import {migrateTripleV1ToV2} from './triple-migrate-v46.mjs';
import {TriplePersistentRecorder} from './triple-idempotent.mjs';
export function initializeTripleTelemetry(storage,{onWarning=()=>{}}={}){
 if(typeof storage?.getItem!=='function'||typeof storage?.setItem!=='function')throw TypeError('storage');
 const migration=migrateTripleV1ToV2(storage,{onWarning});
 if(['invalid-v1','v2-corrupt','read-failed','write-failed'].includes(migration.status)){
  return {ready:false,status:migration.status,migration,recorder:null};
 }
 const recorder=new TriplePersistentRecorder(storage,{onWarning}).restore();
 if(['corrupt','storage-unavailable'].includes(recorder.status)){
  return {ready:false,status:recorder.status,migration,recorder:null};
 }
 return {ready:true,status:recorder.status,migration,recorder};
}
