import test from 'node:test';
import assert from 'node:assert/strict';
import {TripleAutoSave} from './triple-autosave.mjs';
import {STORAGE_KEY} from './triple-storage.mjs';
const event={difficulty:'EASY',safeMissions:['FREE','TRIPLE'],selectedMission:'TRIPLE',missionClearSolutions:3,targetTileCountKinds:2};
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),map:m}};
test('saves on commit, restores, ignores duplicate question id',()=>{
 const storage=memory();const s=new TripleAutoSave(storage);
 s.restore();assert.equal(s.commitQuestion('q1',event).saved,true);
 assert.equal(s.commitQuestion('q1',event).recorded,false);
 const restored=new TripleAutoSave(storage);restored.restore();
 assert.equal(restored.telemetry.summary('EASY').selected,1);
});
test('corrupt data is preserved and cannot be overwritten without explicit reset',()=>{
 const storage=memory();storage.setItem(STORAGE_KEY,'{corrupt');
 const warnings=[];const s=new TripleAutoSave(storage,{onWarning:(code)=>warnings.push(code)});
 s.restore();assert.equal(s.status,'corrupt');assert.equal(storage.getItem(STORAGE_KEY),'{corrupt');
 assert.throws(()=>s.commitQuestion('q1',event));
 assert.equal(s.resetCorruptData(),'{corrupt');
 assert.equal(s.commitQuestion('q1',event).saved,true);
 assert.deepEqual(warnings,['corrupt-telemetry']);
});
test('quota or storage failure does not change game result',()=>{
 const storage={getItem:()=>null,setItem:()=>{throw new Error('quota')}};
 const s=new TripleAutoSave(storage);s.restore();
 assert.deepEqual(s.commitQuestion('q1',event),{recorded:true,saved:false});
 assert.equal(s.telemetry.summary('EASY').selected,1);
});
