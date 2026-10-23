/** Vol.66: atomic TRIPLE question reservation + statistics commit.
 * Both stores updated in ONE IndexedDB readwrite transaction.
 * Distinct from legacy localStorage recorder; no automatic migration.
 * A stable questionKey is authoritative and MUST uniquely identify a finalized question.
 */
const KEY=/^[-_A-Za-z0-9]{1,96}$/;
const DIFFICULTIES=new Set(['EASY','NORMAL','HARD']);
function openDb(idb,name){
 return new Promise((resolve,reject)=>{
  const req=idb.open(name,1);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains('questions'))db.createObjectStore('questions',{keyPath:'questionKey'});
   if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta');
  };
  req.onerror=()=>reject(req.error);
  req.onblocked=()=>reject(Error('upgrade blocked'));
  req.onsuccess=()=>resolve(req.result);
 });
}
export async function createAtomicTripleStoreV66({indexedDB,dbName='number-rush-triple-atomic-v66',newQuestionId}={}){
 if(typeof indexedDB?.open!=='function'||typeof newQuestionId!=='function')throw TypeError('indexedDB and newQuestionId required');
 const db=await openDb(indexedDB,dbName);
 function commit({questionKey,finalized,difficulty,selectedMission,safeMissions,missionClearSolutions,targetTileCountKinds}){
  if(!KEY.test(questionKey??'')||finalized!==true||!DIFFICULTIES.has(difficulty)||
   !Array.isArray(safeMissions)||!safeMissions.includes(selectedMission)||
   !Number.isInteger(missionClearSolutions)||missionClearSolutions<0||
   !Number.isInteger(targetTileCountKinds)||targetTileCountKinds<0||targetTileCountKinds>6)throw TypeError('invalid certified question');
  // Sorted safe missions make semantically identical events hash identically.
  const fingerprint=JSON.stringify({difficulty,selectedMission,safeMissions:[...new Set(safeMissions)].sort(),missionClearSolutions,targetTileCountKinds});
  return new Promise((resolve,reject)=>{
   let tx;try{tx=db.transaction(['questions','meta'],'readwrite');}catch(e){reject(e);return;}
   const questions=tx.objectStore('questions'),meta=tx.objectStore('meta');
   let result;
   tx.oncomplete=()=>resolve(result);
   tx.onabort=()=>reject(tx.error??Error('TRIPLE atomic commit aborted'));
   const req=questions.get(questionKey);
   req.onsuccess=()=>{
    const prior=req.result;
    if(prior){
     if(prior.fingerprint!==fingerprint){tx.abort();return;}
     result={saved:true,duplicate:true,questionId:prior.questionId};
     return;
    }
    const historyReq=meta.get('recent');
    historyReq.onsuccess=()=>{
     const history=historyReq.result??[];
     const questionId=newQuestionId();
     if(!KEY.test(questionId)){tx.abort();return;}
     const row={questionKey,questionId,fingerprint,difficulty,selectedMission,missionClearSolutions,targetTileCountKinds};
     questions.add(row);
     meta.put([...history,row].slice(-100),'recent');
     result={saved:true,duplicate:false,questionId};
    };
   };
  });
 }
 function snapshot(){return new Promise((resolve,reject)=>{
  const tx=db.transaction('meta','readonly'),req=tx.objectStore('meta').get('recent');
  tx.oncomplete=()=>resolve(req.result??[]);
  tx.onabort=()=>reject(tx.error??Error('snapshot aborted'));
 });}
 function lookup(questionKey){return new Promise((resolve,reject)=>{
  const tx=db.transaction('questions','readonly'),req=tx.objectStore('questions').get(questionKey);
  tx.oncomplete=()=>resolve(req.result??null);
  tx.onabort=()=>reject(tx.error??Error('lookup aborted'));
 });}
 return Object.freeze({commit,snapshot,lookup,close:()=>db.close()});
}
