import test from 'node:test';import assert from 'node:assert/strict';
import {createVarietyRetryQueue,createVarietyRetryCoordinator} from './variety-retry-queue-v57.mjs';
const event=(id='a_session_1')=>Object.freeze({answerId:id,outcome:'MISSION_CLEAR',consumedTileCount:3});
test('same original event ID retained; duplicate enqueue coalesced',async()=>{
 let available=false,seen=[];
 const q=createVarietyRetryQueue({retry:async e=>{seen.push(e.answerId);return {saved:available,status:available?'ok':'lock-unavailable'};}});
 assert.equal(q.enqueue(event()),true);assert.equal(q.enqueue(event()),false);
 assert.equal((await q.drain()).remaining,1);
 available=true;const done=await q.drain();
 assert.deepEqual(done,{attempted:1,saved:1,remaining:0});
 assert.deepEqual(seen,['a_session_1','a_session_1']);
});
test('bounded capacity and conflicting IDs fail closed',()=>{
 const q=createVarietyRetryQueue({retry:async()=>({saved:true}),maxPending:1});
 assert.equal(q.enqueue(event('id_1')),true);assert.equal(q.enqueue(event('id_2')),false);
 assert.throws(()=>q.enqueue(Object.freeze({answerId:'id_1',outcome:'TARGET_CLEAR',consumedTileCount:2})),/conflict/);
 assert.equal(q.size,1);
});
test('parallel drain shares one promise and preserves failed events',async()=>{
 let calls=0;
 const q=createVarietyRetryQueue({retry:async()=>{calls++;await Promise.resolve();throw Error('temporary');}});
 q.enqueue(event());const a=q.drain(),b=q.drain();assert.equal(a,b);
 assert.equal((await a).remaining,1);assert.equal(calls,1);
});
test('MISS and mutable events are never enqueued',()=>{
 const q=createVarietyRetryQueue({retry:async()=>({saved:true})});
 assert.throws(()=>q.enqueue({answerId:'x',outcome:'MISSION_CLEAR',consumedTileCount:1}),TypeError);
 assert.throws(()=>q.enqueue(Object.freeze({answerId:'x',outcome:'MISS',consumedTileCount:0})),TypeError);
});
test('coordinator queues failed committed event and drains with original ID',async()=>{
 const e=event();let retried=null;
 const committer={commit:async()=>({event:e,persistence:{saved:false,status:'lock-unavailable'}}),retry:async x=>{retried=x;return {saved:true};}};
 const c=createVarietyRetryCoordinator({committer});
 await c.commit({answerKey:'answer_1'});assert.equal(c.pendingCount,1);
 assert.equal((await c.drain()).saved,1);assert.equal(retried,e);assert.equal(c.pendingCount,0);
});
