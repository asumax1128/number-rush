import test from 'node:test';
import assert from 'node:assert/strict';
import {createCommittedAnswerBridge} from './committed-answer-bridge-v53.mjs';
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
function lock(){let tail=Promise.resolve();return {request:(_n,_o,fn)=>{const p=tail.then(fn);tail=p.then(()=>{},()=>{});return p;}};}
const cryptoProvider={getRandomValues:b=>b.fill(7)};
test('committed answer receives stable ID; retry does not double record',async()=>{
 const bridge=createCommittedAnswerBridge({storage:storage(),locks:lock(),cryptoProvider});
 assert.equal(await bridge.ready,true);
 const {event,persistence}=await bridge.commit({outcome:'MISSION_CLEAR',consumedTileCount:2});
 assert.equal(persistence.recorded,true);
 assert.equal((await bridge.retry(event)).recorded,false);
 assert.deepEqual(await bridge.snapshot(),[2]);
});
test('MISS is not recorded; TARGET CLEAR is recorded',async()=>{
 const bridge=createCommittedAnswerBridge({storage:storage(),locks:lock(),cryptoProvider});
 await bridge.commit({outcome:'MISS',consumedTileCount:0});
 await bridge.commit({outcome:'TARGET_CLEAR',consumedTileCount:4});
 assert.deepEqual(await bridge.snapshot(),[4]);
});
test('storage unavailable does not prevent returning adjudicated event',async()=>{
 const bridge=createCommittedAnswerBridge({storage:storage(),locks:null,cryptoProvider});
 const result=await bridge.commit({outcome:'TARGET_CLEAR',consumedTileCount:3});
 assert.equal(result.persistence.saved,false);
 assert.ok(result.event.answerId.startsWith('a_'));
});
