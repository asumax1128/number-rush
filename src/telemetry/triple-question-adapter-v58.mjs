/** Vol.58: authoritative question-finalization adapter.
 * Must be called ONLY by the game generator after board/target/mission and
 * published 5 + reserved 6th queue tiles have been committed. No game writes.
 * The game itself is not present in this repository; this is the integration seam.
 */
import {createQuestionCommitter} from './question-commit-v56.mjs';
const KEY=/^[-_A-Za-z0-9]{1,96}$/;
export function createGameQuestionTelemetryAdapter({committer,onWarning=()=>{}}){
 if(!committer||typeof committer.commit!=='function')throw new TypeError('question committer required');
 const onQuestionFinalized=async snapshot=>{
  if(!snapshot||typeof snapshot!=='object'||snapshot.finalized!==true||snapshot.safetyCertified!==true||
    snapshot.boardCommitted!==true||snapshot.targetCommitted!==true||snapshot.missionCommitted!==true||
    snapshot.queueReservationLocked!==true)throw new TypeError('authoritative safe question finalization required');
  if(typeof snapshot.questionKey!=='string'||!KEY.test(snapshot.questionKey))throw new TypeError('stable questionKey required');
  if(!Array.isArray(snapshot.publishedQueue)||snapshot.publishedQueue.length!==5||
    !Object.hasOwn(snapshot,'reservedSixth'))throw new TypeError('five published and sixth reserved tiles required');
  if(snapshot.publishedQueue.some(x=>x===undefined||x===null)||snapshot.reservedSixth===undefined||snapshot.reservedSixth===null)throw new TypeError('invalid queue reservation');
  const {questionKey,difficulty,safeMissions,selectedMission,missionClearSolutions,targetTileCountKinds}=snapshot;
  try{
   return await committer.commit({questionKey,finalized:true,difficulty,safeMissions,selectedMission,missionClearSolutions,targetTileCountKinds});
  }catch(error){onWarning('triple-question-commit-failed',error);return {questionId:null,result:{saved:false,recorded:false,status:'telemetry-failed'}};}
 };
 return Object.freeze({onQuestionFinalized});
}
export function initializeGameQuestionTelemetry({hud,storage,locks,cryptoProvider,onWarning=()=>{},questionLedger=null,atomicTripleStore=null}){
 const committer=createQuestionCommitter({hud,storage,locks,cryptoProvider,onWarning,questionLedger,atomicTripleStore});
 return {...createGameQuestionTelemetryAdapter({committer,onWarning}),ready:committer.ready,getView:committer.getView,element:committer.element};
}
