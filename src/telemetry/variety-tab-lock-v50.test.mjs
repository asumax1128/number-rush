import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeLockedVariety,VARIETY_LOCK_NAME} from './variety-tab-lock-v50.mjs';
import {VARIETY_HISTORY_KEY} from './variety-history-storage.mjs';
function memory(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),m};}
function lock(){let tail=Promise.resolve();return {request:(name,opts,fn)=>{
 assert.equal(name,VARIETY_LOCK_NAME);assert.equal(opts.mode,'exclusive');
 const p=tail.then(fn);tail=p.then(()=>{},()=>{});return p;
}};}
test('two tabs with same answer ID record exactly once',async()=>{
 const storage=memory(),locks=lock(),a=initializeLockedVariety({storage,locks}),b=initializeLockedVariety({storage,locks});
 assert.equal(await a.ready,true);assert.equal(await b.ready,true);
 const ev={answerId:'s1_a1',outcome:'TARGET_CLEAR',consumedTileCount:3};
 const results=await Promise.all([a.recordAnswer(ev),b.recordAnswer(ev)]);
 assert.deepEqual(results.map(x=>x.recorded).sort(),[false,true]);
 assert.deepEqual(await b.snapshot(),[3]);
});
test('two distinct answers survive concurrent writes and reload',async()=>{
 const storage=memory(),locks=lock(),a=initializeLockedVariety({storage,locks}),b=initializeLockedVariety({storage,locks});
 await Promise.all([
  a.recordAnswer({answerId:'a_1',outcome:'MISSION_CLEAR',consumedTileCount:2}),
  b.recordAnswer({answerId:'a_2',outcome:'TARGET_CLEAR',consumedTileCount:4})
 ]);
 assert.deepEqual((await a.snapshot()).sort(),[2,4]);
});
test('v1 migration is protected by same lock',async()=>{
 const storage=memory(),locks=lock(),raw=JSON.stringify({schemaVersion:1,counts:[2,3]});
 storage.setItem(VARIETY_HISTORY_KEY,raw);
 const a=initializeLockedVariety({storage,locks}),b=initializeLockedVariety({storage,locks});
 assert.equal(await a.ready,true);assert.equal(await b.ready,true);
 assert.deepEqual(await a.snapshot(),[2,3]);assert.equal(storage.getItem(VARIETY_HISTORY_KEY),raw);
});
test('without locks no migration or writes occur',async()=>{
 const storage=memory();storage.setItem(VARIETY_HISTORY_KEY,JSON.stringify({schemaVersion:1,counts:[3]}));
 const r=initializeLockedVariety({storage,locks:null});
 assert.equal(await r.ready,false);
 assert.equal((await r.recordAnswer({answerId:'a_1',outcome:'TARGET_CLEAR',consumedTileCount:2})).status,'lock-unavailable');
 assert.equal(storage.getItem('number-rush:variety-target-history:v2'),null);
});
test('corrupt data blocks writes without overwriting',async()=>{
 const storage=memory(),locks=lock();storage.setItem('number-rush:variety-target-history:v2','bad');
 const r=initializeLockedVariety({storage,locks});
 assert.equal(await r.ready,false);
 assert.equal((await r.recordAnswer({answerId:'a_1',outcome:'TARGET_CLEAR',consumedTileCount:2})).status,'corrupt');
});
