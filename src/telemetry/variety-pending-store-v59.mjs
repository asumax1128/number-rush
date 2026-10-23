/** Vol.59 minimal durable write-ahead pending store.
 * A record MUST be durably staged BEFORE the Variety history write.
 * Browser localStorage + Web Locks are required; never fall back to unsafe writes.
 * Existing Vol.56 commit() is NOT write-ahead compatible: caller must generate
 * the original event/answerId first, then stage, then call retry(originalEvent).
 */
export const PENDING_KEY_V59='number-rush:variety-pending:v1';
export const PENDING_LOCK_V59='number-rush:variety-pending:v1:write';
const ID=/^[A-Za-z0-9_-]{1,96}$/;
function clean(e){
 if(!e||!ID.test(e.answerId??'')||!['MISSION_CLEAR','TARGET_CLEAR'].includes(e.outcome)||
 !Number.isInteger(e.consumedTileCount)||e.consumedTileCount<1||e.consumedTileCount>6)throw new TypeError('invalid committed CLEAR event');
 return {answerId:e.answerId,outcome:e.outcome,consumedTileCount:e.consumedTileCount};
}
function decode(raw,limit){
 if(raw===null)return [];
 if(raw.length>32768)throw Error('pending payload too large');
 const obj=JSON.parse(raw);
 if(obj?.schemaVersion!==1||!Array.isArray(obj.entries)||obj.entries.length>limit)throw Error('pending schema invalid');
 const ids=new Set();
 return obj.entries.map(e=>{const c=clean(e);if(ids.has(c.answerId))throw Error('duplicate pending ID');ids.add(c.answerId);return c;});
}
export function createDurableVarietyPendingStore({storage,locks,maxPending=128,onWarning=()=>{}}){
 if(typeof storage?.getItem!=='function'||typeof storage?.setItem!=='function'||typeof storage?.removeItem!=='function')throw TypeError('storage required');
 if(!Number.isInteger(maxPending)||maxPending<1||maxPending>128)throw RangeError('maxPending');
 const enabled=typeof locks?.request==='function';
 const guarded=async fn=>{
  if(!enabled)return {ok:false,status:'lock-unavailable'};
  try{return await locks.request(PENDING_LOCK_V59,{mode:'exclusive'},()=>{
   const entries=decode(storage.getItem(PENDING_KEY_V59),maxPending);
   return fn(entries);
  });}
  catch(error){onWarning('pending-store-error',error);return {ok:false,status:'storage-or-schema-failed'};}
 };
 const write=entries=>{
  const value=JSON.stringify({schemaVersion:1,entries});
  storage.setItem(PENDING_KEY_V59,value);
 };
 const stage=event=>guarded(entries=>{
  const e=clean(event),previous=entries.find(x=>x.answerId===e.answerId);
  if(previous){
   if(previous.outcome!==e.outcome||previous.consumedTileCount!==e.consumedTileCount)throw Error('pending answerId conflict');
   return {ok:true,status:'already-staged'};
  }
  if(entries.length>=maxPending)return {ok:false,status:'pending-full'};
  write([...entries,e]);return {ok:true,status:'staged'};
 });
 const list=()=>guarded(entries=>({ok:true,status:'ok',entries:entries.map(e=>Object.freeze({...e}))}));
 const acknowledge=id=>guarded(entries=>{
  if(!ID.test(id))throw TypeError('answerId');
  const next=entries.filter(e=>e.answerId!==id);
  if(next.length!==entries.length)write(next);
  return {ok:true,status:'acknowledged',removed:next.length!==entries.length};
 });
 const recover=async retry=>{
  if(typeof retry!=='function')throw TypeError('retry');
  const state=await list();
  if(!state.ok)return {...state,attempted:0,saved:0};
  let saved=0,attempted=0;
  for(const e of state.entries){
   attempted++;
   try{
    const result=await retry(Object.freeze({...e}));
    if(result?.saved===true){
     const ack=await acknowledge(e.answerId);
     if(ack.ok)saved++;
    }
   }catch(error){onWarning('pending-retry-failed',error);}
  }
  return {ok:true,status:'recovery-attempted',attempted,saved,remaining:(await list()).entries?.length??null};
 };
 return Object.freeze({stage,list,acknowledge,recover,get enabled(){return enabled;}});
}
