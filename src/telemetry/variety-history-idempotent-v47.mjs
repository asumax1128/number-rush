/** Vol.47: durable deduplication of TARGET-matching answer sizes.
 * An answer ID and its tile count are persisted in the same localStorage value.
 * v1 is preserved; v2 does not silently import v1 because v1 lacks answer IDs.
 */
export const VARIETY_V2_KEY='number-rush:variety-target-history:v2';
export const VARIETY_V1_KEY='number-rush:variety-target-history:v1';
const ID=/^[A-Za-z0-9_-]{1,96}$/;
const MAX=20;
function parse(raw){
 if(typeof raw!=='string'||raw.length>4096)throw Error('invalid payload length');
 const x=JSON.parse(raw);
 if(x?.schemaVersion!==2||!Array.isArray(x.entries)||x.entries.length>MAX)throw Error('invalid history schema');
 if(x.kind!==undefined&&x.kind!=='variety-target-history-migrated')throw Error('invalid kind');
 if(x.legacyCounts!==undefined&&(!Array.isArray(x.legacyCounts)||x.legacyCounts.length>MAX||x.legacyCounts.some(n=>!Number.isInteger(n)||n<1||n>6)))throw Error('invalid legacy counts');
 const seen=new Set();
 const entries=x.entries.map(e=>{
  if(!e||(e.id!==null&&(typeof e.id!=='string'||!ID.test(e.id)||seen.has(e.id))))throw Error('invalid/duplicate answer ID');
  if(!Number.isInteger(e.count)||e.count<1||e.count>6)throw Error('invalid tile count');
  if(e.id!==null)seen.add(e.id);return {id:e.id,count:e.count};
 });
 const legacy=x.legacyCounts??[];
 return [...legacy.map((count,i)=>({id:null,count})),...entries].slice(-MAX);
}
export class IdempotentTargetHistory {
 constructor(storage,{onWarning=()=>{}}={}){
  if(typeof storage?.getItem!=='function'||typeof storage?.setItem!=='function')throw TypeError('storage');
  this.storage=storage;this.onWarning=onWarning;this.entries=[];this.status='new';
 }
 restore(){
  let raw;
  try{raw=this.storage.getItem(VARIETY_V2_KEY);}
  catch(e){this.status='storage-unavailable';this.onWarning('read-failed',e);return this;}
  if(raw===null){
   // Do not overwrite or implicitly discard the v1 history.
   try{this.status=this.storage.getItem(VARIETY_V1_KEY)===null?'empty':'v1-needs-migration';}
   catch(e){this.status='storage-unavailable';this.onWarning('read-failed',e);}
   return this;
  }
  try{this.entries=parse(raw);this.status='restored';}
  catch(e){this.status='corrupt';this.onWarning('corrupt',e);}
  return this;
 }
 record({answerId,outcome,consumedTileCount}){
  if(this.status==='corrupt'||this.status==='v1-needs-migration'||this.status==='storage-unavailable')throw Error('storage requires recovery');
  if(typeof answerId!=='string'||!ID.test(answerId))throw TypeError('answerId');
  if(!['MISSION_CLEAR','TARGET_CLEAR','MISS'].includes(outcome))throw Error('outcome');
  if(outcome==='MISS'){
   if(consumedTileCount!==0)throw Error('MISS must consume zero tiles');
   return {recorded:false,saved:true};
  }
  if(!Number.isInteger(consumedTileCount)||consumedTileCount<1||consumedTileCount>6)throw Error('tile count');
  if(this.entries.some(e=>e.id===answerId))return {recorded:false,saved:true};
  const next=[...this.entries,{id:answerId,count:consumedTileCount}].slice(-MAX);
  try{
   this.storage.setItem(VARIETY_V2_KEY,JSON.stringify({schemaVersion:2,entries:next}));
   this.entries=next;this.status='saved';return {recorded:true,saved:true};
  }catch(e){this.status='save-failed';this.onWarning('write-failed',e);return {recorded:false,saved:false};}
 }
 snapshot(){return this.entries.map(e=>e.count);}
 exportRaw(){return this.storage.getItem(VARIETY_V2_KEY);}
}
