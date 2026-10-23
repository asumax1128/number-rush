import test from 'node:test';import assert from 'node:assert/strict';
import {createDurableVarietyPendingStore,PENDING_KEY_V59} from './variety-pending-store-v59.mjs';
function storage(){const m=new Map();return {m,getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
function locks(){let tail=Promise.resolve();return {request:(_n,_o,fn)=>{const p=tail.then(fn);tail=p.then(()=>{},()=>{});return p;}};}
const e={answerId:'session_1',outcome:'MISSION_CLEAR',consumedTileCount:3};
test('stage before history; restart restores same ID and acknowledges after save',async()=>{
 const s=storage(),l=locks(),a=createDurableVarietyPendingStore({storage:s,locks:l});
 assert.equal((await a.stage(e)).status,'staged');
 const b=createDurableVarietyPendingStore({storage:s,locks:l});let id;
 const r=await b.recover(async original=>{id=original.answerId;return {saved:true};});
 assert.equal(id,e.answerId);assert.equal(r.saved,1);assert.deepEqual((await b.list()).entries,[]);
});
test('retry failure retains pending; same ID is idempotent',async()=>{
 const s=storage(),l=locks(),a=createDurableVarietyPendingStore({storage:s,locks:l});
 await a.stage(e);assert.equal((await a.stage(e)).status,'already-staged');
 assert.equal((await a.recover(async()=>({saved:false}))).remaining,1);
 assert.equal((await a.list()).entries[0].answerId,e.answerId);
});
test('lock missing refuses writes; corrupt raw is never overwritten',async()=>{
 const s=storage(),disabled=createDurableVarietyPendingStore({storage:s,locks:null});
 assert.equal((await disabled.stage(e)).status,'lock-unavailable');assert.equal(s.getItem(PENDING_KEY_V59),null);
 s.setItem(PENDING_KEY_V59,'{broken');
 const a=createDurableVarietyPendingStore({storage:s,locks:locks()});
 assert.equal((await a.stage(e)).ok,false);assert.equal(s.getItem(PENDING_KEY_V59),'{broken');
});
test('two-tab concurrent stage serialized and conflicting ID fails closed',async()=>{
 const s=storage(),l=locks();
 const a=createDurableVarietyPendingStore({storage:s,locks:l}),b=createDurableVarietyPendingStore({storage:s,locks:l});
 const result=await Promise.all([a.stage(e),b.stage(e)]);
 assert.deepEqual(result.map(x=>x.status).sort(),['already-staged','staged']);
 assert.equal((await a.list()).entries.length,1);
 assert.equal((await a.stage({...e,consumedTileCount:2})).ok,false);
});
test('full queue refuses overwrite',async()=>{
 const a=createDurableVarietyPendingStore({storage:storage(),locks:locks(),maxPending:1});
 await a.stage(e);assert.equal((await a.stage({...e,answerId:'session_2'})).status,'pending-full');
});
