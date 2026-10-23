import test from 'node:test';import assert from 'node:assert/strict';
import {verifyUniversalRefreshG3V62} from './safety-refresh-universal-v62.mjs';
const t=(value,kind='NORMAL')=>({value,kind});
test('quantifies all six unseen one-tile tails',()=>{
 const b=Array(6).fill(t(1));
 const r=verifyUniversalRefreshG3V62({board:b,reservedQueue:b,target:1,currentMission:'FREE',publishedNext:{mission:'FREE',target:1},refreshMask:1});
 assert.equal(r.allowed,true);assert.equal(r.tailsChecked,6);assert.equal(r.theoreticalTailCount,6);
});
test('fails closed with concrete unseen-tail counterexample',()=>{
 const b=Array(6).fill(t(1));
 const r=verifyUniversalRefreshG3V62({board:b,reservedQueue:b,target:1,currentMission:'FREE',publishedNext:{mission:'EVEN',target:2},refreshMask:1});
 assert.equal(r.allowed,false);assert.equal(r.reason,'G2-counterexample');assert.equal(r.counterexample.length,1);
});
test('rejects unsupported board and unreserved prefix',()=>{
 const b=Array(6).fill(t(1));
 assert.throws(()=>verifyUniversalRefreshG3V62({board:b,reservedQueue:b.slice(0,5),target:1,currentMission:'FREE',publishedNext:{mission:'FREE',target:1},refreshMask:1}),TypeError);
});
