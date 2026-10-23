import test from 'node:test';import assert from 'node:assert/strict';
import {createGameQuestionTelemetryAdapter} from './triple-question-adapter-v58.mjs';
const valid={questionKey:'session_1_q_1',finalized:true,safetyCertified:true,boardCommitted:true,targetCommitted:true,missionCommitted:true,queueReservationLocked:true,publishedQueue:[1,2,3,1,2],reservedSixth:3,difficulty:'NORMAL',safeMissions:['FREE','TRIPLE'],selectedMission:'TRIPLE',missionClearSolutions:3,targetTileCountKinds:2};
test('commits after all authoritative flags and reserved queue are present',async()=>{
 const calls=[];const a=createGameQuestionTelemetryAdapter({committer:{commit:async e=>{calls.push(e);return {questionId:'q1',result:{saved:true}};}}});
 const result=await a.onQuestionFinalized(valid);
 assert.equal(result.questionId,'q1');assert.equal(calls.length,1);assert.equal(calls[0].questionKey,'session_1_q_1');
 assert.equal(Object.hasOwn(calls[0],'publishedQueue'),false);
});
test('rejects premature commit, missing sixth reservation, and unsafe state',async()=>{
 const a=createGameQuestionTelemetryAdapter({committer:{commit:async()=>{throw Error('should not call');}}});
 for(const patch of [{queueReservationLocked:false},{safetyCertified:false},{publishedQueue:[1,2]},{reservedSixth:null},{finalized:false}]){
  await assert.rejects(()=>a.onQuestionFinalized({...valid,...patch}),TypeError);
 }
});
test('telemetry failure is reported but never changes game state',async()=>{
 let warnings=0;const board=[1,2,3,1,2,3];
 const a=createGameQuestionTelemetryAdapter({committer:{commit:async()=>{throw Error('quota');}},onWarning:()=>warnings++});
 const result=await a.onQuestionFinalized(valid);
 assert.equal(result.result.saved,false);assert.equal(warnings,1);assert.deepEqual(board,[1,2,3,1,2,3]);
});
