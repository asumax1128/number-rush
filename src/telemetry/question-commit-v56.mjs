/** Vol.56: stable question IDs at the generator's authoritative commit point.
 * Caller supplies a stable questionKey and MUST call commit only AFTER Safety
 * and Variety have finalized the question. Duplicate calls are coalesced.
 * IDs are valid for the persistent TRIPLE recorder (<=96 chars).
 */
import {createAnswerIdFactory} from './answer-id-v52.mjs';
import {mountTripleStatusInGame} from './triple-hud-mount-v54.mjs';
export function createQuestionCommitter({hud,storage,locks,cryptoProvider,onWarning=()=>{},maxSettled=512,questionLedger=null}){
 if(!Number.isInteger(maxSettled)||maxSettled<1)throw new RangeError('maxSettled');
 const ids=createAnswerIdFactory({cryptoProvider});
 const ui=mountTripleStatusInGame({hud,storage,locks,onWarning});
 const inFlight=new Map(),settled=new Map();
 const commit=({questionKey,finalized,...event})=>{
  if(typeof questionKey!=='string'||!/^[-_A-Za-z0-9]{1,96}$/.test(questionKey))throw new TypeError('stable questionKey required');
  if(finalized!==true)throw new TypeError('question must be finalized');
  if(!['EASY','NORMAL','HARD'].includes(event.difficulty))throw new TypeError('difficulty');
  if(!Array.isArray(event.safeMissions)||!event.safeMissions.includes(event.selectedMission))throw new TypeError('safety-certified selected mission required');
  if(!Number.isInteger(event.missionClearSolutions)||event.missionClearSolutions<0)throw new TypeError('solution count');
  if(!Number.isInteger(event.targetTileCountKinds)||event.targetTileCountKinds<0||event.targetTileCountKinds>6)throw new TypeError('tile-count kinds');
  const fingerprint=JSON.stringify(event);
  const cached=inFlight.get(questionKey)||settled.get(questionKey);
  if(cached){
   if(cached.fingerprint!==fingerprint)throw new Error('questionKey conflict');
   return cached.promise;
  }
  const questionId='q_'+ids.next().slice(2);
  const promise=Promise.resolve().then(async()=>{
   if(!questionLedger)return {questionId,result:await ui.commitQuestion(questionId,event)};
   const reserved=await questionLedger.reserve({questionKey,fingerprint});
   if(reserved.duplicate){
    // Reservation proves the ID exists, NOT that telemetry was saved.
    // Fail closed: never write a second telemetry event for this key.
    return {questionId:reserved.questionId,result:{saved:false,recorded:false,status:'duplicate-reservation-unverified'}};
   }
   return {questionId:reserved.questionId,result:await ui.commitQuestion(reserved.questionId,event)};
  });
  const entry={fingerprint,promise};
  inFlight.set(questionKey,entry);
  promise.then(()=>{
   inFlight.delete(questionKey);settled.set(questionKey,entry);
   while(settled.size>maxSettled)settled.delete(settled.keys().next().value);
  },()=>{inFlight.delete(questionKey);});
  return promise;
 };
 return {ready:ui.ready,commit,getView:ui.getView,element:ui.element};
}
