import test from 'node:test';
import assert from 'node:assert/strict';
import {TripleTelemetry} from './triple-telemetry.mjs';
import {STORAGE_KEY,serializeTelemetry} from './triple-storage.mjs';
import {KEY_V2,TriplePersistentRecorder} from './triple-idempotent.mjs';
import {migrateTripleV1ToV2} from './triple-migrate-v46.mjs';
function memory(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),m};}
test('preserves old bytes and imports all three difficulties',()=>{
 const s=memory(),t=new TripleTelemetry();
 t.recordQuestion({difficulty:'EASY',safeMissions:['FREE','TRIPLE'],selectedMission:'TRIPLE',missionClearSolutions:2,targetTileCountKinds:2});
 const raw=serializeTelemetry(t);s.setItem(STORAGE_KEY,raw);
 const result=migrateTripleV1ToV2(s);
 assert.deepEqual(result,{status:'migrated',importedQuestions:1,oldDataPreserved:true});
 assert.equal(s.getItem(STORAGE_KEY),raw);
 assert.equal(new TriplePersistentRecorder(s).restore().telemetry.summary('EASY').observed,1);
 assert.equal(migrateTripleV1ToV2(s).status,'v2-already-present');
});
test('refuses corrupt v1 and never overwrites v2',()=>{
 const s=memory();s.setItem(STORAGE_KEY,'invalid');
 assert.equal(migrateTripleV1ToV2(s).status,'invalid-v1');
 assert.equal(s.getItem(KEY_V2),null);
 s.setItem(KEY_V2,'bad');
 assert.equal(migrateTripleV1ToV2(s).status,'v2-corrupt');
 assert.equal(s.getItem(KEY_V2),'bad');
});
test('failed write preserves v1',()=>{
 const s=memory(),raw=serializeTelemetry(new TripleTelemetry());s.setItem(STORAGE_KEY,raw);
 const fail={getItem:s.getItem,setItem:()=>{throw Error('quota')}};
 assert.equal(migrateTripleV1ToV2(fail).status,'write-failed');
 assert.equal(s.getItem(STORAGE_KEY),raw);
});
