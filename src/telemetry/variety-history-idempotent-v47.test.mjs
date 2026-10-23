import test from 'node:test';
import assert from 'node:assert/strict';
import {IdempotentTargetHistory,VARIETY_V1_KEY,VARIETY_V2_KEY} from './variety-history-idempotent-v47.mjs';
function memory(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),m};}
test('deduplicates TARGET CLEAR after restart',()=>{
 const s=memory(),a=new IdempotentTargetHistory(s).restore();
 assert.equal(a.record({answerId:'s1_a1',outcome:'TARGET_CLEAR',consumedTileCount:3}).recorded,true);
 const b=new IdempotentTargetHistory(s).restore();
 assert.equal(b.record({answerId:'s1_a1',outcome:'TARGET_CLEAR',consumedTileCount:3}).recorded,false);
 assert.deepEqual(b.snapshot(),[3]);
 b.record({answerId:'s1_a2',outcome:'MISSION_CLEAR',consumedTileCount:2});
 assert.deepEqual(new IdempotentTargetHistory(s).restore().snapshot(),[3,2]);
});
test('MISS excluded and bounded to 20',()=>{
 const s=memory(),h=new IdempotentTargetHistory(s).restore();
 for(let i=0;i<25;i++)h.record({answerId:'a_'+i,outcome:'MISSION_CLEAR',consumedTileCount:i%6+1});
 h.record({answerId:'miss',outcome:'MISS',consumedTileCount:0});
 assert.equal(h.snapshot().length,20);
 assert.equal(h.entries[0].id,'a_5');
});
test('v1 data is not silently overwritten',()=>{
 const s=memory();s.setItem(VARIETY_V1_KEY,'old data');
 const h=new IdempotentTargetHistory(s).restore();
 assert.equal(h.status,'v1-needs-migration');
 assert.throws(()=>h.record({answerId:'a_1',outcome:'TARGET_CLEAR',consumedTileCount:2}));
 assert.equal(s.getItem(VARIETY_V2_KEY),null);
});
test('storage failure leaves history unchanged',()=>{
 const s={getItem:()=>null,setItem:()=>{throw Error('quota')}};
 const h=new IdempotentTargetHistory(s).restore();
 assert.equal(h.record({answerId:'a_1',outcome:'MISSION_CLEAR',consumedTileCount:2}).saved,false);
 assert.deepEqual(h.snapshot(),[]);
});
