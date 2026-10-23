/** Vol.66 reproducible side-by-side benchmark (same input and budget).
 * Run: node tools/benchmark-refresh-compare-v66.mjs
 * Reports UNKNOWN separately; no unsafe "speedup" conclusions if states differ.
 */
import {performance} from 'node:perf_hooks';
import {createRepeatedRefreshVerifierV63} from '../src/safety/safety-refresh-repeat-v63.mjs';
import {createOptimizedRefreshVerifierV65} from '../src/safety/safety-refresh-optimized-v65.mjs';
const tile=n=>({value:n,kind:'NORMAL'});
const cases=[
 {name:'uniform-1',board:[1,1,1,1,1,1],queue:[1,1,1,1,1,1],target:1,mission:'FREE',next:1},
 {name:'mixed-123',board:[1,2,3,1,2,3],queue:[1,2,3,1,2,3],target:6,mission:'FREE',next:6},
 {name:'EVEN',board:[1,2,1,2,1,2],queue:[1,2,1,2,1,2],target:2,mission:'EVEN',next:2},
 {name:'TRIPLE',board:[1,2,3,1,2,3],queue:[1,2,3,1,2,3],target:6,mission:'TRIPLE',next:6}
];
const maxStates=Number(process.env.NR66_MAX_STATES??1000);
const iterations=Number(process.env.NR66_ITERATIONS??2);
const rows=[];
for(const s of cases)for(const depth of [1,2]){
 const options={target:s.target,currentMission:s.mission,publishedNext:{mission:'FREE',target:s.next},maxRefreshes:depth,maxStates};
 const state={board:s.board.map(tile),reservedQueue:s.queue.map(tile)};
 const results=[];
 for(const [version,factory] of [['v63',createRepeatedRefreshVerifierV63],['v65',createOptimizedRefreshVerifierV65]]){
  const times=[];let result;
  for(let i=0;i<iterations;i++){
   const start=performance.now();result=factory(options).check(state);times.push(performance.now()-start);
  }
  times.sort((a,b)=>a-b);
  results.push({version,medianMs:+times[Math.floor(times.length/2)].toFixed(2),
   statesChecked:result.statesChecked,unknown:result.unknown,
   certifiedMasks:(result.certifiedMasks??[]).length,
   rateLowerBound:+((result.certifiedMasks??[]).length/62).toFixed(4),
   cacheHits:result.cacheHits??null});
 }
 const [old,optimized]=results;
 // Under incomplete search, differences in certified sets can arise from exploration order.
 const comparable=!old.unknown&&!optimized.unknown;
 rows.push({scenario:s.name,depth,comparable,results,
  speedupIfComplete:comparable?+(old.medianMs/optimized.medianMs).toFixed(2):null});
}
console.log(JSON.stringify({scope:'4 representative cases x depth 1/2; not full enumeration',maxStates,iterations,rows},null,2));
