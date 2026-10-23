import test from 'node:test';
import assert from 'node:assert/strict';
import {PersistentTargetHistory,VARIETY_HISTORY_KEY} from './variety-history-storage.mjs';
function memory(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),m};}
test('records TARGET and MISSION CLEAR, skips MISS, retains last 20',()=>{
 const s=memory(),h=new PersistentTargetHistory(s).restore();
 for(let i=0;i<25;i++)h.record({outcome:i%2?'TARGET_CLEAR':'MISSION_CLEAR',consumedTileCount:i%6+1});
 h.record({outcome:'MISS',consumedTileCount:0});
 assert.equal(h.snapshot().length,20);
 assert.deepEqual(new PersistentTargetHistory(s).restore().snapshot(),h.snapshot());
});
test('corrupt saved data is never silently overwritten',()=>{
 const s=memory();s.setItem(VARIETY_HISTORY_KEY,'bad');
 const h=new PersistentTargetHistory(s).restore();
 assert.equal(h.status,'corrupt');
 assert.throws(()=>h.record({outcome:'TARGET_CLEAR',consumedTileCount:2}));
 assert.equal(h.resetCorrupt(),'bad');
 assert.equal(h.snapshot().length,0);
});
test('failed write does not mutate history',()=>{
 const h=new PersistentTargetHistory({getItem:()=>null,setItem:()=>{throw Error('quota');}}).restore();
 assert.equal(h.record({outcome:'MISSION_CLEAR',consumedTileCount:2}).saved,false);
 assert.deepEqual(h.snapshot(),[]);
});
