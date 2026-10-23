import test from 'node:test';
import assert from 'node:assert/strict';
import {createAnswerIdFactory,makeCommittedAnswer} from './answer-id-v52.mjs';
function random(fill){return {getRandomValues:bytes=>{bytes.fill(fill);return bytes;}};}
test('monotonic and stable event ID for retry',()=>{
 const f=createAnswerIdFactory({cryptoProvider:random(7)});
 const a=makeCommittedAnswer(f,{outcome:'MISSION_CLEAR',consumedTileCount:2});
 const b=makeCommittedAnswer(f,{outcome:'TARGET_CLEAR',consumedTileCount:3});
 assert.notEqual(a.answerId,b.answerId);
 assert.match(a.answerId,/^a_[a-f0-9]{32}_[a-z0-9]+$/);
 assert.equal(a.answerId,a.answerId);
 assert.equal(f.issued,2);
 assert.ok(Object.isFrozen(a));
});
test('distinct random sessions use distinct namespace',()=>{
 const a=createAnswerIdFactory({cryptoProvider:random(1)});
 const b=createAnswerIdFactory({cryptoProvider:random(2)});
 assert.notEqual(a.next(),b.next());
});
test('fail closed without secure random source',()=>{
 assert.throws(()=>createAnswerIdFactory({cryptoProvider:null}),/secure-random-unavailable/);
});
test('invalid events do not consume an ID',()=>{
 const f=createAnswerIdFactory({cryptoProvider:random(3)});
 assert.throws(()=>makeCommittedAnswer(f,{outcome:'MISS',consumedTileCount:2}),TypeError);
 assert.equal(f.issued,0);
});
