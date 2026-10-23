import test from 'node:test';
import assert from 'node:assert/strict';
import {TriplePersistentRecorder,KEY_V2} from './triple-idempotent.mjs';
const event={difficulty:'EASY',safeMissions:['FREE','TRIPLE'],selectedMission:'TRIPLE',missionClearSolutions:3,targetTileCountKinds:2};
function memory(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data};}
test('deduplicates after restart',()=>{
 const s=memory(),a=new TriplePersistentRecorder(s).restore();
 assert.equal(a.commit('sessionA_0001',event).recorded,true);
 const b=new TriplePersistentRecorder(s).restore();
 assert.equal(b.commit('sessionA_0001',event).recorded,false);
 assert.equal(b.telemetry.summary('EASY').observed,1);
 b.commit('sessionA_0002',event);
 assert.equal(new TriplePersistentRecorder(s).restore().telemetry.summary('EASY').observed,2);
});
test('failed write does not change history',()=>{
 const s=memory();let fail=true;
 const storage={getItem:s.getItem,setItem:(k,v)=>{if(fail)throw Error('quota');s.setItem(k,v);}};
 const a=new TriplePersistentRecorder(storage).restore();
 assert.equal(a.commit('s_1',event).recorded,false);
 assert.equal(a.telemetry.summary('EASY').observed,0);
 fail=false;assert.equal(a.commit('s_1',event).recorded,true);
});
test('corrupt bytes preserved until explicit reset',()=>{
 const s=memory();s.setItem(KEY_V2,'bad json');
 const a=new TriplePersistentRecorder(s).restore();
 assert.equal(a.status,'corrupt');assert.throws(()=>a.commit('s_1',event));
 assert.equal(a.exportRaw(),'bad json');assert.equal(a.resetCorrupt(),'bad json');
 assert.equal(a.commit('s_1',event).recorded,true);
});
test('invalid IDs rejected',()=>{
 const a=new TriplePersistentRecorder(memory()).restore();
 assert.throws(()=>a.commit('name with spaces',event));
});
