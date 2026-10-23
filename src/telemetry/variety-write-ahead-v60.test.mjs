import test from 'node:test';import assert from 'node:assert/strict';
import {createWriteAheadVarietyBridge} from './variety-write-ahead-v60.mjs';
import {PENDING_KEY_V59} from './variety-pending-store-v59.mjs';
function storage(){const m=new Map();return {m,getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
function locks(){let tail=Promise.resolve();return {request:(_n,_o,fn)=>{const p=tail.then(fn);tail=p.then(()=>{},()=>{});return p;}};}
const cryptoProvider={getRandomValues:b=>b.fill(5)};
test('WAL is durable before v2 history write; duplicate answerKey coalesces',async()=>{
 const s=storage(),order=[],original=s.setItem;
 s.setItem=(k,v)=>{order.push(k);original(k,v);};
 const b=createWriteAheadVarietyBridge({storage:s,locks:locks(),cryptoProvider});
 const a=b.commit({answerKey:'answer_1',finalized:true,outcome:'TARGET_CLEAR',consumedTileCount:2});
 assert.equal(a,b.commit({answerKey:'answer_1',finalized:true,outcome:'TARGET_CLEAR',consumedTileCount:2}));
 const result=await a;
 assert.equal(result.persistence.saved,true);assert.equal(result.ack.ok,true);
 assert.equal(order[0],PENDING_KEY_V59);assert.match(order[1],/target-history:v2$/);
 assert.deepEqual(await b.historySnapshot(),[2]);
 assert.equal((await b.pending.list()).entries.length,0);
});
test('stage fails closed before history write when Web Locks absent',async()=>{
 const s=storage(),b=createWriteAheadVarietyBridge({storage:s,locks:null,cryptoProvider});
 const r=await b.commit({answerKey:'answer_2',finalized:true,outcome:'MISSION_CLEAR',consumedTileCount:3});
 assert.equal(r.stage.ok,false);assert.equal(r.persistence.saved,false);
 assert.equal(s.m.size,0);
});
test('failed history write retains staged answer and recovery uses same ID',async()=>{
 const s=storage(),l=locks();let fail=true;
 const set=s.setItem;
 s.setItem=(k,v)=>{if(fail&&k.endsWith('target-history:v2'))throw Error('quota');set(k,v);};
 const b=createWriteAheadVarietyBridge({storage:s,locks:l,cryptoProvider});
 const r=await b.commit({answerKey:'answer_3',finalized:true,outcome:'TARGET_CLEAR',consumedTileCount:1});
 assert.equal(r.persistence.saved,false);
 assert.equal((await b.pending.list()).entries[0].answerId,r.event.answerId);
 fail=false;
 const restarted=createWriteAheadVarietyBridge({storage:s,locks:l,cryptoProvider});
 const recovery=await restarted.recover();
 assert.equal(recovery.saved,1);assert.deepEqual(await restarted.historySnapshot(),[1]);
 assert.deepEqual((await restarted.pending.list()).entries,[]);
});
test('MISS is not staged and contradictory answerKey rejected',async()=>{
 const b=createWriteAheadVarietyBridge({storage:storage(),locks:locks(),cryptoProvider});
 const r=await b.commit({answerKey:'answer_4',finalized:true,outcome:'MISS',consumedTileCount:0});
 assert.equal(r.stage.status,'miss-not-staged');
 assert.throws(()=>b.commit({answerKey:'answer_4',finalized:true,outcome:'TARGET_CLEAR',consumedTileCount:1}),/conflict/);
});
