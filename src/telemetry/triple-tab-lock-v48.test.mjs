import test from 'node:test';
import assert from 'node:assert/strict';
import {commitTripleWithLock,LOCK_NAME} from './triple-tab-lock-v48.mjs';
import {TriplePersistentRecorder} from './triple-idempotent.mjs';
const event={difficulty:'EASY',safeMissions:['FREE','TRIPLE'],selectedMission:'TRIPLE',missionClearSolutions:2,targetTileCountKinds:2};
function memory(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
function lock(){let tail=Promise.resolve();return {request:(name,opts,fn)=>{assert.equal(name,LOCK_NAME);assert.equal(opts.mode,'exclusive');const p=tail.then(fn);tail=p.then(()=>{},()=>{});return p;}};}
test('concurrent duplicate commits serialize and record only once',async()=>{
 const storage=memory(),locks=lock(),args={storage,locks,questionId:'s_q1',event};
 const [a,b]=await Promise.all([commitTripleWithLock(args),commitTripleWithLock(args)]);
 assert.deepEqual([a.recorded,b.recorded],[true,false]);
 assert.equal(new TriplePersistentRecorder(storage).restore().telemetry.summary('EASY').observed,1);
});
test('concurrent distinct commits preserve both',async()=>{
 const storage=memory(),locks=lock();
 await Promise.all(['s_q1','s_q2'].map(questionId=>commitTripleWithLock({storage,locks,questionId,event})));
 assert.equal(new TriplePersistentRecorder(storage).restore().telemetry.summary('EASY').observed,2);
});
test('no lock means no unsafe write',async()=>{
 const storage=memory();
 assert.equal((await commitTripleWithLock({storage,locks:null,questionId:'s_q1',event})).status,'lock-unavailable');
 assert.equal(new TriplePersistentRecorder(storage).restore().telemetry.summary('EASY').observed,0);
});
