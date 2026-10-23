/** Vol.64: reproducible sampled benchmark of Vol.63 repeated REFRESH verifier.
 * Run: node tools/benchmark-refresh-v64.mjs
 * Never report sampled rates as full-state exhaustive G3 guarantees.
 */
import {performance} from 'node:perf_hooks';
import {createRepeatedRefreshVerifierV63} from '../src/safety/safety-refresh-repeat-v63.mjs';
const t=(value,kind='NORMAL')=>({value,kind});
const scenarios=[
 {id:'uniform-one',board:[1,1,1,1,1,1],queue:[1,1,1,1,1,1],target:1,mission:'FREE',next:{mission:'FREE',target:1}},
 {id:'mixed',board:[1,2,3,1,2,3],queue:[1,2,3,1,2,3],target:6,mission:'FREE',next:{mission:'FREE',target:6}},
 {id:'even-required',board:[1,2,1,2,1,2],queue:[1,2,1,2,1,2],target:2,mission:'EVEN',next:{mission:'FREE',target:2}},
 {id:'triple',board:[1,2,3,1,2,3],queue:[1,2,3,1,2,3],target:6,mission:'TRIPLE',next:{mission:'FREE',target:6}},
 {id:'odd-required',board:[1,2,3,1,2,3],queue:[1,2,3,1,2,3],target:3,mission:'ODD',next:{mission:'FREE',target:3}},
];
const budget=Number(process.env.NR64_MAX_STATES??20000);
const rows=[];
for(const s of scenarios){
 for(const depth of [1,2]){
  const v=createRepeatedRefreshVerifierV63({target:s.target,currentMission:s.mission,publishedNext:s.next,maxRefreshes:depth,maxStates:budget});
  const start=performance.now();
  const r=v.check({board:s.board.map(n=>t(n)),reservedQueue:s.queue.map(n=>t(n))});
  const elapsedMs=performance.now()-start;
  rows.push({scenario:s.id,depth,elapsedMs:+elapsedMs.toFixed(2),statesChecked:r.statesChecked,
   budgetExhausted:r.budgetExhausted,unknown:r.unknown,rootStopSafe:r.safe,
   certifiedMasks:r.certifiedMasks.length,maskCount:62,
   lowerBoundCertifiedRate:+(r.certifiedMasks.length/62).toFixed(4),
   rateExact:!r.unknown&&r.safe});
 }
}
console.log(JSON.stringify({model:'digits1-3,NORMAL/DOUBLE,6-board,6-reserved',budget,scope:'five handpicked scenarios; NOT full enumeration',rows},null,2));
