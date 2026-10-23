import test from 'node:test';import assert from 'node:assert/strict';
import {safeNextMissionCandidatesV60,chooseNextMissionV60} from './safety-consecutive-missions-v60.mjs';
const t=(value,kind='NORMAL')=>({value,kind});
test('all TARGET matching routes including TARGET CLEAR are included',()=>{
 const s={board:[t(1),t(2),t(3),t(1),t(2),t(3)],reservedQueue:[t(1),t(2),t(3),t(1),t(2),t(3)],target:6,currentMission:'TRIPLE'};
 const r=safeNextMissionCandidatesV60(s);
 assert.ok(r.branches.some(x=>!x.missionClear));
 assert.ok(r.free.length>0);assert.ok(r.nonFree.length>0);
 for(const c of r.options)for(const b of r.branches){
  // brute force independently enumerate selected routes on successor
  let found=false;
  for(let mask=1;mask<64;mask++){
   const selected=b.board.filter((_,i)=>mask&(1<<i));
   const sum=selected.reduce((x,v)=>x+v.value*(v.kind==='DOUBLE'?2:1),0);
   const ok=c.mission==='FREE'||(c.mission==='PAIR'&&selected.length===2)||(c.mission==='TRIPLE'&&selected.length===3)||(c.mission==='ODD'&&selected.some(v=>v.value%2))||(c.mission==='EVEN'&&selected.some(v=>v.value%2===0));
   if(sum===c.target&&ok)found=true;
  }
  assert.equal(found,true);
 }
});
test('no EVEN next when all successor boards odd; fallback is safety based',()=>{
 const s={board:Array(6).fill(t(1)),reservedQueue:Array(6).fill(t(1)),target:1,currentMission:'FREE'};
 const r=safeNextMissionCandidatesV60(s);
 assert.equal(r.options.some(x=>x.mission==='EVEN'),false);
 assert.ok(r.free.length>0);
 const picked=chooseNextMissionV60(s);assert.ok(picked.certifiedOptions.some(x=>x.mission===picked.chosen.mission&&x.target===picked.chosen.target));
});
test('reject G1 violation and unsupported tiles',()=>{
 const s={board:Array(6).fill(t(1)),reservedQueue:Array(6).fill(t(1)),target:1,currentMission:'EVEN'};
 assert.throws(()=>safeNextMissionCandidatesV60(s),/G1/);
 assert.throws(()=>safeNextMissionCandidatesV60({...s,currentMission:'FREE',board:[t(4),...s.board.slice(1)]}),TypeError);
});
