import test from 'node:test';
import assert from 'node:assert/strict';
import { TripleTelemetry } from './triple-telemetry.mjs';
import { exportTripleCSV,exportTripleJSON,renderTripleHTML } from './triple-export.mjs';
test('exports only observed data and preserves zero-observation states',()=>{
 const t=new TripleTelemetry();
 t.recordQuestion({difficulty:'EASY',safeMissions:['FREE','TRIPLE'],selectedMission:'TRIPLE',missionClearSolutions:2,targetTileCountKinds:3});
 const csv=exportTripleCSV(t),json=JSON.parse(exportTripleJSON(t)),html=renderTripleHTML(t);
 assert.match(csv,/"EASY","1","true","true","2","3"/);
 assert.equal(csv.trim().split('\n').length,2);
 assert.equal(json.difficulties.HARD.observed,0);
 assert.equal(json.correctionEnabled,false);
 assert.match(html,/TRIPLE出題統計/);
 assert.match(html,/100\.0%/);
 assert.match(html,/0問/);
});
test('export reflects rolling limit',()=>{
 const t=new TripleTelemetry();
 for(let i=0;i<110;i++)t.recordQuestion({difficulty:'NORMAL',safeMissions:['FREE'],selectedMission:'FREE',missionClearSolutions:1,targetTileCountKinds:1});
 assert.equal(exportTripleCSV(t).trim().split('\n').length,101);
});
