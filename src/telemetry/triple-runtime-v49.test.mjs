import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeTripleRuntime} from './triple-runtime-v49.mjs';
import {TripleTelemetry} from './triple-telemetry.mjs';
import {STORAGE_KEY,serializeTelemetry} from './triple-storage.mjs';
import {TriplePersistentRecorder} from './triple-idempotent.mjs';
function memory(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),m};}
function lock(){let tail=Promise.resolve();return {request:(name,opts,fn)=>{
 assert.equal(name,'number-rush:triple-telemetry:v2:write');
 assert.equal(opts.mode,'exclusive');const p=tail.then(fn);tail=p.then(()=>{},()=>{});return p;
}};}
const ev={difficulty:'EASY',safeMissions:['FREE','TRIPLE'],selectedMission:'TRIPLE',missionClearSolutions:3,targetTileCountKinds:2};
test('startup migration then two concurrent tabs serialize commits and dedupe',async()=>{
 const s=memory(),locks=lock(),t=new TripleTelemetry();t.recordQuestion(ev);
 const raw=serializeTelemetry(t);s.setItem(STORAGE_KEY,raw);
 const a=initializeTripleRuntime({storage:s,locks}),b=initializeTripleRuntime({storage:s,locks});
 assert.equal(await a.ready,true);assert.equal(await b.ready,true);
 const [x,y]=await Promise.all([a.commitQuestion('s_q2',ev),b.commitQuestion('s_q2',ev)]);
 assert.deepEqual([x.recorded,y.recorded].sort(),[false,true]);
 assert.equal(new TriplePersistentRecorder(s).restore().telemetry.summary('EASY').observed,2);
 assert.equal(s.getItem(STORAGE_KEY),raw);
});
test('no lock refuses initialization and writes',async()=>{
 const s=memory(),r=initializeTripleRuntime({storage:s,locks:null});
 assert.equal(r.ready,false);
 assert.equal((await r.commitQuestion('s_q1',ev)).status,'lock-unavailable');
});
test('corrupt old data prevents commits without overwriting',async()=>{
 const s=memory(),locks=lock();s.setItem(STORAGE_KEY,'bad');
 const r=initializeTripleRuntime({storage:s,locks});
 assert.equal(await r.ready,false);
 assert.equal((await r.commitQuestion('s_q1',ev)).status,'invalid-v1');
 assert.equal(s.getItem(STORAGE_KEY),'bad');
});
