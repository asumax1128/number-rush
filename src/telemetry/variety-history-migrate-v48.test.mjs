import test from 'node:test';
import assert from 'node:assert/strict';
import {migrateVarietyHistoryV1ToV2} from './variety-history-migrate-v48.mjs';
import {VARIETY_HISTORY_KEY} from './variety-history-storage.mjs';
import {VARIETY_V2_KEY} from './variety-history-idempotent-v47.mjs';
function memory(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),m};}
test('preserves v1 and creates migration envelope with original counts',()=>{
 const s=memory(),raw=JSON.stringify({schemaVersion:1,counts:[2,3,2]});s.setItem(VARIETY_HISTORY_KEY,raw);
 assert.deepEqual(migrateVarietyHistoryV1ToV2(s),{status:'migrated',importedCounts:3,oldDataPreserved:true});
 assert.equal(s.getItem(VARIETY_HISTORY_KEY),raw);
 assert.deepEqual(JSON.parse(s.getItem(VARIETY_V2_KEY)).legacyCounts,[2,3,2]);
 assert.equal(migrateVarietyHistoryV1ToV2(s).status,'v2-already-present');
});
test('corrupt source and existing v2 are not overwritten',()=>{
 const s=memory();s.setItem(VARIETY_HISTORY_KEY,'bad');
 assert.equal(migrateVarietyHistoryV1ToV2(s).status,'invalid-v1');
 assert.equal(s.getItem(VARIETY_V2_KEY),null);
 s.setItem(VARIETY_V2_KEY,'bad');
 assert.equal(migrateVarietyHistoryV1ToV2(s).status,'v2-already-present');
 assert.equal(s.getItem(VARIETY_V2_KEY),'bad');
});
test('write failure leaves v1 untouched',()=>{
 const s=memory(),raw=JSON.stringify({schemaVersion:1,counts:[1]});s.setItem(VARIETY_HISTORY_KEY,raw);
 const x={getItem:s.getItem,setItem:()=>{throw Error('quota')}};
 assert.equal(migrateVarietyHistoryV1ToV2(x).status,'write-failed');
 assert.equal(s.getItem(VARIETY_HISTORY_KEY),raw);
});
