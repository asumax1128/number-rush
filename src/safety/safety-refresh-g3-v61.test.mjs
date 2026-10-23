import test from 'node:test';import assert from 'node:assert/strict';
import {verifyRefreshG3V61,enumerateRefreshG3V61} from './safety-refresh-g3-v61.mjs';
const t=(value,kind='NORMAL')=>({value,kind});
test('enumerates 62 refresh masks and never changes published next',()=>{
 const state={board:[1,2,3,1,2,3].map(v=>t(v)),queuePrefix:Array.from({length:11},(_,i)=>t(i%3+1)),target:6,currentMission:'FREE',publishedNext:{mission:'FREE',target:6}};
 const result=enumerateRefreshG3V61(state);
 assert.equal(result.checked,62);assert.equal(result.allowed.length+result.rejected.length,62);
 assert.deepEqual(state.publishedNext,{mission:'FREE',target:6});
});
test('rejects refresh that destroys current ODD solution',()=>{
 const board=[t(1),t(2),t(2),t(2),t(2),t(2)];
 const r=verifyRefreshG3V61({board,queuePrefix:Array(11).fill(t(2)),target:1,currentMission:'ODD',publishedNext:{mission:'FREE',target:2},refreshMask:1});
 assert.equal(r.allowed,false);assert.equal(r.reason,'current-G1-failed');
});
test('requires enough immutable queue; refuses a guessed hidden tail',()=>{
 const s={board:Array(6).fill(t(1)),queuePrefix:Array(6).fill(t(1)),target:1,currentMission:'FREE',publishedNext:{mission:'FREE',target:1},refreshMask:1};
 assert.throws(()=>verifyRefreshG3V61(s),/11 immutable/);
});
