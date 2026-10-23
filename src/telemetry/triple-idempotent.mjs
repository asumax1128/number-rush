/** Vol.45: restart-safe, bounded question-ID deduplication.
 * One atomic storage write holds both events and the recent ID ring.
 */
import {TripleTelemetry} from './triple-telemetry.mjs';
import {serializeTelemetry,deserializeTelemetry} from './triple-storage.mjs';
export const KEY_V2='number-rush:triple-telemetry:v2';
const MAX_IDS=300;
const validId=id=>{if(typeof id!=='string'||!/^[A-Za-z0-9_-]{1,96}$/.test(id))throw new TypeError('invalid questionId');return id;};
const encode=(telemetry,ids)=>JSON.stringify({schemaVersion:2,kind:'number-rush-triple-telemetry-v2',recentQuestionIds:ids,telemetryV1:serializeTelemetry(telemetry)});
function parse(raw){
 if(typeof raw!=='string'||raw.length>131072)throw new Error('invalid payload size');
 const x=JSON.parse(raw);
 if(x?.schemaVersion!==2||x?.kind!=='number-rush-triple-telemetry-v2')throw new Error('unsupported version');
 if(!Array.isArray(x.recentQuestionIds)||x.recentQuestionIds.length>MAX_IDS)throw new Error('invalid IDs');
 const ids=x.recentQuestionIds.map(validId);
 if(new Set(ids).size!==ids.length)throw new Error('duplicate IDs');
 return {ids,telemetry:deserializeTelemetry(x.telemetryV1)};
}
export class TriplePersistentRecorder {
 constructor(storage,{onWarning=()=>{}}={}){
  if(typeof storage?.getItem!=='function'||typeof storage?.setItem!=='function')throw new TypeError('storage');
  this.storage=storage;this.onWarning=onWarning;this.telemetry=new TripleTelemetry();this.ids=[];this.status='new';
 }
 restore(){
  let raw;try{raw=this.storage.getItem(KEY_V2);}
  catch(e){this.status='storage-unavailable';this.onWarning('read-failed',e);return this;}
  if(raw===null){this.status='empty';return this;}
  try{const v=parse(raw);this.telemetry=v.telemetry;this.ids=v.ids;this.status='restored';}
  catch(e){this.status='corrupt';this.onWarning('corrupt',e);}
  return this;
 }
 /** Generate an opaque session nonce + monotonic question index in the caller. */
 commit(questionId,event){
  validId(questionId);
  if(this.status==='corrupt')throw new Error('explicit recovery required');
  if(this.ids.includes(questionId))return {recorded:false,saved:true};
  const next=deserializeTelemetry(serializeTelemetry(this.telemetry));
  next.recordQuestion(event);
  const ids=[...this.ids,questionId].slice(-MAX_IDS);
  try{
   this.storage.setItem(KEY_V2,encode(next,ids));
   this.telemetry=next;this.ids=ids;this.status='saved';
   return {recorded:true,saved:true};
  }catch(e){
   this.status='save-failed';this.onWarning('write-failed',e);
   return {recorded:false,saved:false};
  }
 }
 exportRaw(){return this.storage.getItem(KEY_V2);}
 resetCorrupt(){
  if(this.status!=='corrupt')throw new Error('not corrupt');
  const old=this.exportRaw();
  this.storage.setItem(KEY_V2,encode(new TripleTelemetry(),[]));
  this.telemetry=new TripleTelemetry();this.ids=[];this.status='saved';return old;
 }
}
