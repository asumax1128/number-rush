import test from 'node:test';
import assert from 'node:assert/strict';
import { TripleTelemetry } from './triple-telemetry.mjs';
const sample = (selectedMission = 'FREE') => ({ difficulty: 'EASY', safeMissions: ['FREE','TRIPLE'], selectedMission, missionClearSolutions: 3, targetTileCountKinds: 2 });
test('independent rolling 100-question histories', () => {
 const t = new TripleTelemetry();
 for (let i=0; i<110; i++) t.recordQuestion(sample(i%2 ? 'TRIPLE':'FREE'));
 assert.equal(t.summary('EASY').observed,100);
 assert.equal(t.summary('EASY').selected,50);
 assert.equal(t.summary('HARD').observed,0);
 assert.equal(t.summary('EASY').correctionMultiplier,1);
 assert.equal(t.summary('EASY').correctionEnabled,false);
});
test('rejects unsafe selected mission', () => {
 const t=new TripleTelemetry();
 assert.throws(()=>t.recordQuestion({...sample('TRIPLE'),safeMissions:['FREE']}));
 assert.equal(t.summary('EASY').observed,0);
});
test('distinguishes opportunity from selection', () => {
 const t=new TripleTelemetry();
 t.recordQuestion({...sample('FREE'),safeMissions:['FREE']});
 t.recordQuestion(sample('TRIPLE'));
 assert.deepEqual([t.summary('EASY').observed,t.summary('EASY').available,t.summary('EASY').selected],[2,1,1]);
});
