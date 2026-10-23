import test from 'node:test';
import assert from 'node:assert/strict';
import {TripleTelemetry} from './triple-telemetry.mjs';
import {STORAGE_KEY,serializeTelemetry} from './triple-storage.mjs';
import {KEY_V2} from './triple-idempotent.mjs';
import {initializeTripleTelemetry} from './triple-init-v47.mjs';
function memory(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),m};}
const ev={difficulty:'NORMAL',safeMissions:['FREE','TRIPLE'],selectedMission:'TRIPLE',missionClearSolutions:3,targetTileCountKinds:2};
test('v1 migrated then v2 commits deduplicate after restart',()=>{
 const s=memory(),t=new TripleTelemetry();t.recordQuestion(ev);
 const raw=serializeTelemetry(t);s.setItem(STORAGE_KEY,raw);
 const init=initializeTripleTelemetry(s);
 assert.equal(init.ready,true);assert.equal(init.migration.status,'migrated');
 assert.equal(init.recorder.telemetry.summary('NORMAL').observed,1);
 assert.equal(init.recorder.commit('s1_q2',ev).recorded,true);
 const next=initializeTripleTelemetry(s);
 assert.equal(next.migration.status,'v2-already-present');
 assert.equal(next.recorder.commit('s1_q2',ev).recorded,false);
 assert.equal(next.recorder.telemetry.summary('NORMAL').observed,2);
 assert.equal(s.getItem(STORAGE_KEY),raw);
});
test('corrupt v1 blocks initialization without destroying bytes',()=>{
 const s=memory();s.setItem(STORAGE_KEY,'bad');
 const x=initializeTripleTelemetry(s);
 assert.equal(x.ready,false);assert.equal(x.status,'invalid-v1');
 assert.equal(s.getItem(KEY_V2),null);
});
test('corrupt v2 is never replaced by v1',()=>{
 const s=memory();s.setItem(STORAGE_KEY,serializeTelemetry(new TripleTelemetry()));s.setItem(KEY_V2,'bad');
 const x=initializeTripleTelemetry(s);
 assert.equal(x.ready,false);assert.equal(x.status,'v2-corrupt');
 assert.equal(s.getItem(KEY_V2),'bad');
});
test('empty storage starts fresh',()=>{
 const x=initializeTripleTelemetry(memory());
 assert.equal(x.ready,true);assert.equal(x.migration.status,'no-v1');
 assert.equal(x.recorder.commit('s_q1',ev).recorded,true);
});
