import test from 'node:test';import assert from 'node:assert/strict';
import {createGuardedAnswerCommitter} from './answer-commit-gate-v56.mjs';
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
function locks(){let tail=Promise.resolve();return {request:(_n,_o,fn)=>{const p=tail.then(fn);tail=p.then(()=>{},()=>{});return p;}};}
const cryptoProvider={getRandomValues:b=>b.fill(5)};
const make=()=>createGuardedAnswerCommitter({storage:storage(),locks:locks(),cryptoProvider});
test('two concurrent commits share same event and save once',async()=>{
 const g=make(),e={answerKey:'round_1_answer_1',finalized:true,outcome:'MISSION_CLEAR',consumedTileCount:3};
 const a=g.commit(e),b=g.commit(e);assert.equal(a,b);
 const [x,y]=await Promise.all([a,b]);assert.equal(x.event.answerId,y.event.answerId);
 assert.deepEqual(await g.snapshot(),[3]);
 const later=await g.commit(e);assert.equal(later.event.answerId,x.event.answerId);
 assert.deepEqual(await g.snapshot(),[3]);
});
test('conflicting duplicate key rejected',async()=>{
 const g=make();await g.commit({answerKey:'k',finalized:true,outcome:'MISS',consumedTileCount:0});
 assert.throws(()=>g.commit({answerKey:'k',finalized:true,outcome:'TARGET_CLEAR',consumedTileCount:2}),/conflict/);
});
test('premature and invalid adjudication cannot enter gate',()=>{
 const g=make();
 assert.throws(()=>g.commit({answerKey:'x',outcome:'MISS',consumedTileCount:0}),TypeError);
 assert.throws(()=>g.commit({answerKey:'x',finalized:true,outcome:'MISS',consumedTileCount:2}),TypeError);
});
