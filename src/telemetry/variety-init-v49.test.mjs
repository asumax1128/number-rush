import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeVarietyHistory} from './variety-init-v49.mjs';
import {VARIETY_HISTORY_KEY} from './variety-history-storage.mjs';
import {VARIETY_V2_KEY} from './variety-history-idempotent-v47.mjs';
function memory(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map};}
test('boot migrates v1 and subsequent TARGET CLEAR persists across restart',()=>{
 const s=memory(),raw=JSON.stringify({schemaVersion:1,counts:[2,3,2]});
 s.setItem(VARIETY_HISTORY_KEY,raw);
 const boot=initializeVarietyHistory(s);
 assert.equal(boot.ready,true);assert.equal(boot.migration.status,'migrated');
 assert.deepEqual(boot.history.snapshot(),[2,3,2]);
 assert.equal(boot.history.record({answerId:'s1_a1',outcome:'TARGET_CLEAR',consumedTileCount:4}).recorded,true);
 const reboot=initializeVarietyHistory(s);
 assert.equal(reboot.ready,true);assert.equal(reboot.migration.status,'v2-already-present');
 assert.deepEqual(reboot.history.snapshot(),[2,3,2,4]);
 assert.equal(reboot.history.record({answerId:'s1_a1',outcome:'TARGET_CLEAR',consumedTileCount:4}).recorded,false);
 assert.equal(s.getItem(VARIETY_HISTORY_KEY),raw);
});
test('corrupt v1 blocks boot without mutation',()=>{
 const s=memory();s.setItem(VARIETY_HISTORY_KEY,'{bad');
 const x=initializeVarietyHistory(s);
 assert.equal(x.ready,false);assert.equal(x.status,'invalid-v1');
 assert.equal(s.getItem(VARIETY_V2_KEY),null);
});
test('corrupt v2 is never overwritten by valid v1',()=>{
 const s=memory();s.setItem(VARIETY_HISTORY_KEY,JSON.stringify({schemaVersion:1,counts:[3]}));
 s.setItem(VARIETY_V2_KEY,'{bad');
 const x=initializeVarietyHistory(s);
 assert.equal(x.ready,false);assert.equal(x.status,'corrupt');
 assert.equal(s.getItem(VARIETY_V2_KEY),'{bad');
});
test('empty store starts fresh',()=>{
 const x=initializeVarietyHistory(memory());
 assert.equal(x.ready,true);assert.equal(x.migration.status,'no-v1');
});
test('failed migration write blocks boot and retains v1',()=>{
 const s=memory(),raw=JSON.stringify({schemaVersion:1,counts:[1]});
 s.setItem(VARIETY_HISTORY_KEY,raw);
 const storage={getItem:s.getItem,setItem:()=>{throw Error('quota');}};
 const x=initializeVarietyHistory(storage);
 assert.equal(x.ready,false);assert.equal(x.status,'write-failed');
 assert.equal(s.getItem(VARIETY_HISTORY_KEY),raw);
});
