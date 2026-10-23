/** Vol.48: conservative, non-destructive Variety v1 -> v2 migration.
 * v1 contains only tile counts, not answer IDs. Do not invent historical IDs.
 * The v2 schema supports legacy entries with null IDs only for migration.
 */
import {VARIETY_HISTORY_KEY} from './variety-history-storage.mjs';
import {VARIETY_V2_KEY} from './variety-history-idempotent-v47.mjs';
export function migrateVarietyHistoryV1ToV2(storage,{onWarning=()=>{}}={}){
 if(typeof storage?.getItem!=='function'||typeof storage?.setItem!=='function')throw TypeError('storage');
 let old,existing;
 try{old=storage.getItem(VARIETY_HISTORY_KEY);existing=storage.getItem(VARIETY_V2_KEY);}
 catch(e){onWarning('read-failed',e);return {status:'read-failed'};}
 if(existing!==null)return {status:'v2-already-present'};
 if(old===null)return {status:'no-v1'};
 let counts;
 try{
  if(typeof old!=='string'||old.length>1024)throw Error('invalid size');
  const v=JSON.parse(old);
  if(!v||v.schemaVersion!==1||!Array.isArray(v.counts)||v.counts.length>20||
    v.counts.some(n=>!Number.isInteger(n)||n<1||n>6))throw Error('invalid v1');
  counts=v.counts;
 }catch(e){onWarning('invalid-v1',e);return {status:'invalid-v1'};}
 // Use a distinct v2 migration envelope rather than corrupting the strict v2 schema.
 // The v2 recorder must explicitly opt in to interpreting these legacy counts.
 const payload=JSON.stringify({schemaVersion:2,kind:'variety-target-history-migrated',legacyCounts:[...counts],entries:[]});
 try{storage.setItem(VARIETY_V2_KEY,payload);}
 catch(e){onWarning('write-failed',e);return {status:'write-failed'};}
 return {status:'migrated',importedCounts:counts.length,oldDataPreserved:true};
}
