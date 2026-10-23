/** Vol.46: conservative, non-destructive migration from TRIPLE v1 to v2.
 * v1 has no question IDs, so import old events and start a fresh v2 ID ring.
 * No overwrite of v1. v2 takes precedence and must not be overwritten.
 */
import {STORAGE_KEY,deserializeTelemetry,serializeTelemetry} from './triple-storage.mjs';
import {KEY_V2,TriplePersistentRecorder} from './triple-idempotent.mjs';
export function migrateTripleV1ToV2(storage,{onWarning=()=>{}}={}){
 if(typeof storage?.getItem!=='function'||typeof storage?.setItem!=='function')throw new TypeError('storage');
 let old,newData;
 try{old=storage.getItem(STORAGE_KEY);newData=storage.getItem(KEY_V2);}
 catch(e){onWarning('read-failed',e);return {status:'read-failed'};}
 if(newData!==null){
  const v2=new TriplePersistentRecorder(storage,{onWarning}).restore();
  return {status:v2.status==='corrupt'?'v2-corrupt':'v2-already-present'};
 }
 if(old===null)return {status:'no-v1'};
 let history;
 try{history=deserializeTelemetry(old);}
 catch(e){onWarning('invalid-v1',e);return {status:'invalid-v1'};}
 // v1 cannot prove whether a historical question ID was already counted.
 // Do not invent IDs for imported records; record this as an explicit limitation.
 const payload=JSON.stringify({schemaVersion:2,kind:'number-rush-triple-telemetry-v2',recentQuestionIds:[],telemetryV1:serializeTelemetry(history)});
 try{storage.setItem(KEY_V2,payload);}
 catch(e){onWarning('write-failed',e);return {status:'write-failed'};}
 return {status:'migrated',importedQuestions:history.snapshot().EASY.observed+history.snapshot().NORMAL.observed+history.snapshot().HARD.observed,oldDataPreserved:true};
}
