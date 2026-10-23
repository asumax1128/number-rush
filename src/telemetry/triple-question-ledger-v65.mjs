/** Vol.65 cross-tab TRIPLE question-key ledger.
 * Same-key concurrent commits are serialized in ONE IndexedDB readwrite transaction.
 * The durable record contains the complete immutable question fingerprint.
 * Telemetry delivery is not atomic with this ledger: uncertain delivery is quarantined.
 */
const KEY=/^[-_A-Za-z0-9]{1,96}$/;
const STORE='questions';
const open=(indexedDB,name)=>new Promise((resolve,reject)=>{
 const req=indexedDB.open(name,1);
 req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'questionKey'});};
 req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('upgrade blocked'));req.onsuccess=()=>resolve(req.result);
});
export async function createQuestionKeyLedgerV65({indexedDB,dbName='number-rush-triple-question-ledger-v65',newQuestionId}={}){
 if(typeof indexedDB?.open!=='function'||typeof newQuestionId!=='function')throw TypeError('indexedDB and newQuestionId required');
 const db=await open(indexedDB,dbName);
 const transact=(questionKey,fingerprint)=>new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
  let result;
  tx.oncomplete=()=>resolve(result);
  tx.onabort=()=>reject(tx.error??Error('question ledger transaction aborted'));
  const get=store.get(questionKey);
  get.onsuccess=()=>{
   const prior=get.result;
   if(prior){
    if(prior.fingerprint!==fingerprint){tx.abort();return;}
    result={questionId:prior.questionId,duplicate:true};
    return;
   }
   const questionId=newQuestionId();
   if(!KEY.test(questionId)){tx.abort();return;}
   store.add({questionKey,questionId,fingerprint});
   result={questionId,duplicate:false};
  };
 });
 function reserve({questionKey,fingerprint}){
  if(!KEY.test(questionKey??'')||typeof fingerprint!=='string'||fingerprint.length>16000)throw TypeError('questionKey/fingerprint');
  return transact(questionKey,fingerprint);
 }
 function lookup(questionKey){return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(questionKey);
  tx.oncomplete=()=>resolve(req.result??null);tx.onabort=()=>reject(tx.error??Error('lookup aborted'));
 });}
 return Object.freeze({reserve,lookup,close:()=>db.close()});
}
