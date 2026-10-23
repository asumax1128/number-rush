/** Vol.64 prototype: atomic IndexedDB commit of answerKey, answerId, event and last-20 history.
 * Independent of the existing localStorage v62 writer. No implicit migration.
 * Cross-tab deduplication is keyed by the authoritative stable answerKey.
 */
export const DB_NAME_V64='number-rush-variety-v64-prototype';
const KEY=/^[A-Za-z0-9_-]{1,96}$/;
function open(indexedDB,name){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(name,1);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains('answers'))db.createObjectStore('answers',{keyPath:'answerKey'});
   if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta');
  };
  req.onerror=()=>reject(req.error);
  req.onsuccess=()=>resolve(req.result);
  req.onblocked=()=>reject(Error('database upgrade blocked'));
 });
}
export async function createAtomicVarietyStoreV64({indexedDB,dbName=DB_NAME_V64}={}){
 if(typeof indexedDB?.open!=='function')throw TypeError('IndexedDB required');
 const db=await open(indexedDB,dbName);
 function commit({answerKey,answerId,outcome,consumedTileCount}){
  if(!KEY.test(answerKey??'')||!KEY.test(answerId??'')||!['MISSION_CLEAR','TARGET_CLEAR'].includes(outcome)||!Number.isInteger(consumedTileCount)||consumedTileCount<1||consumedTileCount>6)throw TypeError('invalid finalized answer');
  return new Promise((resolve,reject)=>{
   let tx;
   try{tx=db.transaction(['answers','meta'],'readwrite');}catch(e){reject(e);return;}
   const answers=tx.objectStore('answers'),meta=tx.objectStore('meta');
   const event={answerKey,answerId,outcome,consumedTileCount};
   let result;
   tx.oncomplete=()=>resolve(result);
   tx.onabort=()=>reject(tx.error??Error('atomic commit aborted'));
   tx.onerror=()=>{}; // abort handler owns failure
   const read=answers.get(answerKey);
   read.onsuccess=()=>{
    const previous=read.result;
    if(previous){
     if(previous.outcome!==outcome||previous.consumedTileCount!==consumedTileCount){tx.abort();return;}
     result={saved:true,duplicate:true,answerId:previous.answerId};
     return;
    }
    const historyReq=meta.get('recent');
    historyReq.onsuccess=()=>{
     const history=historyReq.result??[];
     answers.add(event);
     meta.put([...history,{answerKey,answerId,outcome,consumedTileCount}].slice(-20),'recent');
     result={saved:true,duplicate:false,answerId};
    };
   };
  });
 }
 function snapshot(){
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(['meta'],'readonly');
   const req=tx.objectStore('meta').get('recent');
   tx.oncomplete=()=>resolve(req.result??[]);
   tx.onabort=()=>reject(tx.error??Error('read aborted'));
  });
 }
 function getAnswer(answerKey){
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(['answers'],'readonly');
   const req=tx.objectStore('answers').get(answerKey);
   tx.oncomplete=()=>resolve(req.result??null);
   tx.onabort=()=>reject(tx.error??Error('read aborted'));
  });
 }
 return Object.freeze({commit,snapshot,getAnswer,close:()=>db.close()});
}
