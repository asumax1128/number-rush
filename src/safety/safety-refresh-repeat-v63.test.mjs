import test from 'node:test';import assert from 'node:assert/strict';
import {createRepeatedRefreshVerifierV63} from './safety-refresh-repeat-v63.mjs';
const t=(value,kind='NORMAL')=>({value,kind});
test('zero refresh verifies published next under all TARGET routes',()=>{
 const v=createRepeatedRefreshVerifierV63({target:1,currentMission:'FREE',publishedNext:{mission:'FREE',target:1},maxRefreshes:0});
 const r=v.check({board:Array(6).fill(t(1)),reservedQueue:Array(6).fill(t(1))});
 assert.equal(r.safe,true);assert.equal(r.unknown,false);
});
test('one refresh universally quantifies unseen tails and reports certified masks',()=>{
 const v=createRepeatedRefreshVerifierV63({target:1,currentMission:'FREE',publishedNext:{mission:'FREE',target:1},maxRefreshes:1,maxStates:100000});
 const r=v.check({board:Array(6).fill(t(1)),reservedQueue:Array(6).fill(t(1))});
 assert.equal(r.safe,true);assert.ok(r.certifiedMasks.includes(1));
});
test('two refreshes fail closed on insufficient proof budget',()=>{
 const v=createRepeatedRefreshVerifierV63({target:1,currentMission:'FREE',publishedNext:{mission:'FREE',target:1},maxRefreshes:2,maxStates:1});
 const r=v.check({board:Array(6).fill(t(1)),reservedQueue:Array(6).fill(t(1))});
 assert.equal(r.unknown,true);assert.equal(r.allMasksClassified,false);
});
test('unsafe STOP rejects all REFRESH masks',()=>{
 const v=createRepeatedRefreshVerifierV63({target:1,currentMission:'EVEN',publishedNext:{mission:'FREE',target:1},maxRefreshes:2});
 const r=v.check({board:Array(6).fill(t(1)),reservedQueue:Array(6).fill(t(1))});
 assert.equal(r.safe,false);assert.deepEqual(r.certifiedMasks,[]);
});
