import test from 'node:test';import assert from 'node:assert/strict';
import {connectVarietyToAdjudication} from './variety-adjudication-v54.mjs';
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
function lock(){let tail=Promise.resolve();return {request:(_n,_o,fn)=>{const p=tail.then(fn);tail=p.then(()=>{},()=>{});return p;}};}
const cryptoProvider={getRandomValues:b=>b.fill(4)};
test('finalized event recorded once; retry retains ID',async()=>{
 const v=connectVarietyToAdjudication({storage:storage(),locks:lock(),cryptoProvider});
 const {event,persistence}=await v.onAdjudicated({finalized:true,outcome:'TARGET_CLEAR',consumedTileCount:3});
 assert.equal(persistence.recorded,true);assert.equal((await v.retry(event)).recorded,false);
 assert.deepEqual(await v.snapshot(),[3]);
});
test('premature event is rejected',async()=>{
 const v=connectVarietyToAdjudication({storage:storage(),locks:lock(),cryptoProvider});
 await assert.rejects(()=>v.onAdjudicated({outcome:'TARGET_CLEAR',consumedTileCount:3}),TypeError);
});
