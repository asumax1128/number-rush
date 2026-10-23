import test from 'node:test';
import assert from 'node:assert/strict';
import {TripleTelemetry} from './triple-telemetry.mjs';
import {serializeTelemetry,deserializeTelemetry,saveTelemetry,loadTelemetry,STORAGE_KEY} from './triple-storage.mjs';
const ev=(difficulty='EASY')=>({difficulty,safeMissions:['FREE','TRIPLE'],selectedMission:'TRIPLE',missionClearSolutions:2,targetTileCountKinds:3});
test('roundtrip and isolated local adapter',()=>{
 const t=new TripleTelemetry();t.recordQuestion(ev());
 const data=new Map();
 const storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)??null};
 saveTelemetry(storage,t);
 assert.equal(data.has(STORAGE_KEY),true);
 assert.equal(loadTelemetry(storage).summary('EASY').selected,1);
 assert.equal(loadTelemetry(storage).summary('HARD').observed,0);
});
test('rejects malformed, oversized and future schema payloads',()=>{
 const t=new TripleTelemetry();t.recordQuestion(ev());
 const raw=serializeTelemetry(t);
 assert.throws(()=>deserializeTelemetry(raw.replace('"schemaVersion":1','"schemaVersion":2')));
 assert.throws(()=>deserializeTelemetry('x'.repeat(65537)));
 const obj=JSON.parse(raw);obj.events.EASY[0].selected=true;obj.events.EASY[0].available=false;
 assert.throws(()=>deserializeTelemetry(JSON.stringify(obj)));
});
test('empty storage produces empty histories',()=>{
 const t=loadTelemetry({getItem:()=>null});
 assert.equal(t.summary('NORMAL').observed,0);
});
