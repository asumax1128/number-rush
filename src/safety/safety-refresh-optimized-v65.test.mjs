import test from 'node:test';import assert from 'node:assert/strict';
import {createOptimizedRefreshVerifierV65} from './safety-refresh-optimized-v65.mjs';
import {createRepeatedRefreshVerifierV63} from './safety-refresh-repeat-v63.mjs';
const tile=value=>({value,kind:'NORMAL'});
const base={target:1,currentMission:'FREE',publishedNext:{mission:'FREE',target:1}};
test('depth zero agrees with original stop-safety oracle',()=>{
 const state={board:Array(6).fill(tile(1)),reservedQueue:Array(6).fill(tile(1))};
 const a=createRepeatedRefreshVerifierV63({...base,maxRefreshes:0}).check(state);
 const b=createOptimizedRefreshVerifierV65({...base,maxRefreshes:0}).check(state);
 assert.equal(a.safe,b.safe);assert.deepEqual(b.certifiedMasks,[]);
});
test('depth one agrees with original certified masks when both complete',()=>{
 const state={board:Array(6).fill(tile(1)),reservedQueue:Array(6).fill(tile(1))};
 const a=createRepeatedRefreshVerifierV63({...base,maxRefreshes:1,maxStates:100000}).check(state);
 const b=createOptimizedRefreshVerifierV65({...base,maxRefreshes:1,maxStates:100000}).check(state);
 assert.deepEqual(b.certifiedMasks,a.certifiedMasks);
});
test('depth two never certifies an unknown branch',()=>{
 const state={board:Array(6).fill(tile(1)),reservedQueue:Array(6).fill(tile(1))};
 const r=createOptimizedRefreshVerifierV65({...base,maxRefreshes:2,maxStates:1}).check(state);
 assert.equal(r.unknown,true);assert.deepEqual(r.certifiedMasks,[]);
});
