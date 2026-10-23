/** Vol.46: versioned, bounded browser storage for last 20 TARGET-matching answers.
 * MISSION_CLEAR and TARGET_CLEAR only; MISS is excluded.
 */
export const VARIETY_HISTORY_KEY='number-rush:variety-target-history:v1';
const MAX=20;
function validate(v){
 if(!v||v.schemaVersion!==1||!Array.isArray(v.counts)||v.counts.length>MAX)throw new Error('invalid history schema');
 if(v.counts.some(n=>!Number.isInteger(n)||n<1||n>6))throw new Error('invalid tile count');
 return [...v.counts];
}
export class PersistentTargetHistory {
 constructor(storage,{onWarning=()=>{}}={}){
  if(typeof storage?.getItem!=='function'||typeof storage?.setItem!=='function')throw new TypeError('storage');
  this.storage=storage;this.onWarning=onWarning;this.counts=[];this.status='new';
 }
 restore(){
  let raw;
  try{raw=this.storage.getItem(VARIETY_HISTORY_KEY);}
  catch(e){this.status='storage-unavailable';this.onWarning('read-failed',e);return this;}
  if(raw===null){this.status='empty';return this;}
  try{
   if(typeof raw!=='string'||raw.length>1024)throw Error('oversized');
   this.counts=validate(JSON.parse(raw));this.status='restored';
  }catch(e){this.status='corrupt';this.onWarning('corrupt',e);}
  return this;
 }
 record({outcome,consumedTileCount}){
  if(this.status==='corrupt')throw Error('explicit reset required');
  if(!['MISSION_CLEAR','TARGET_CLEAR','MISS'].includes(outcome))throw Error('invalid outcome');
  if(outcome==='MISS'){
   if(consumedTileCount!==0)throw Error('MISS consumes no tiles');
   return {recorded:false,saved:true};
  }
  if(!Number.isInteger(consumedTileCount)||consumedTileCount<1||consumedTileCount>6)throw Error('invalid count');
  const next=[...this.counts,consumedTileCount].slice(-MAX);
  try{
   this.storage.setItem(VARIETY_HISTORY_KEY,JSON.stringify({schemaVersion:1,counts:next}));
   this.counts=next;this.status='saved';return {recorded:true,saved:true};
  }catch(e){
   this.status='save-failed';this.onWarning('write-failed',e);
   return {recorded:false,saved:false};
  }
 }
 snapshot(){return [...this.counts];}
 exportRaw(){return this.storage.getItem(VARIETY_HISTORY_KEY);}
 resetCorrupt(){
  if(this.status!=='corrupt')throw Error('not corrupt');
  const raw=this.exportRaw();
  this.storage.setItem(VARIETY_HISTORY_KEY,JSON.stringify({schemaVersion:1,counts:[]}));
  this.counts=[];this.status='saved';return raw;
 }
}
