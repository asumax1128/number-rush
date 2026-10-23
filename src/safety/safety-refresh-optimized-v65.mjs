/** Vol.65 optimized depth<=2 REFRESH verification.
 * Safety semantics: STOP must satisfy current G1 and published NEXT G2.
 * Each certified mask is universally safe for every unreserved tail.
 * Depth 2 means a player may STOP or REFRESH again once.
 * Incomplete budget => mask is NOT certified.
 */
import {missionTargetsV60,safeNextMissionCandidatesV60} from './safety-consecutive-missions-v60.mjs';
const TYPES=[1,2,3].flatMap(value=>['NORMAL','DOUBLE'].map(kind=>Object.freeze({value,kind})));
const encode=xs=>xs.map(x=>2*(x.value-1)+(x.kind==='DOUBLE'?1:0)).join('');
const valid=x=>x&&Number.isInteger(x.value)&&x.value>=1&&x.value<=3&&['NORMAL','DOUBLE'].includes(x.kind);
const masks=Array.from({length:62},(_,i)=>i+1).map(mask=>({mask,positions:Array.from({length:6},(_,i)=>i).filter(i=>mask&(1<<i))}));
export function createOptimizedRefreshVerifierV65({target,currentMission,publishedNext,maxRefreshes=2,maxStates=100000}){
 if(!Number.isInteger(maxRefreshes)||maxRefreshes<0||maxRefreshes>2||!Number.isInteger(maxStates)||maxStates<1||!Number.isInteger(target)||target<1||
 !publishedNext||!Number.isInteger(publishedNext.target)||typeof publishedNext.mission!=='string')throw TypeError('invalid options');
 const stopCache=new Map(),stateCache=new Map(),targetCache=new Map();
 let states=0,cacheHits=0,stopHits=0,unknowns=0;
 const hasTarget=(b,m,t)=>{
  const k=encode(b)+'|'+m;
  let v=targetCache.get(k);
  if(!v){v=missionTargetsV60(b,m);targetCache.set(k,v);}
  return v.has(t);
 };
 const stop=(b,q)=>{
  const k=encode(b)+'|'+encode(q);
  if(stopCache.has(k)){stopHits++;return stopCache.get(k);}
  const ok=hasTarget(b,currentMission,target)&&safeNextMissionCandidatesV60({board:b,reservedQueue:q,target,currentMission}).options
   .some(x=>x.mission===publishedNext.mission&&x.target===publishedNext.target);
  stopCache.set(k,ok);return ok;
 };
 const visit=(b,q,depth)=>{
  const k=encode(b)+'|'+encode(q)+'|'+depth;
  if(stateCache.has(k)){cacheHits++;return stateCache.get(k);}
  if(states>=maxStates){unknowns++;return {safe:false,unknown:true,certifiedMasks:[]};}
  states++;
  if(!stop(b,q)){const r={safe:false,unknown:false,certifiedMasks:[]};stateCache.set(k,r);return r;}
  if(depth===0){const r={safe:true,unknown:false,certifiedMasks:[]};stateCache.set(k,r);return r;}
  const certifiedMasks=[];let unknown=false;
  for(const {mask,positions} of masks){
   const kCount=positions.length,nb=b.slice();
   positions.forEach((pos,j)=>{nb[pos]=q[j];});
   if(!hasTarget(nb,currentMission,target))continue; // G1 prune
   const fixed=q.slice(kCount);
   let indeterminate=false;
   function universal(tail){
    if(tail.length===kCount){
     const child=visit(nb,fixed.concat(tail),depth-1);
     if(child.unknown)indeterminate=true;
     return child.safe&&!child.unknown;
    }
    for(const type of TYPES)if(!universal([...tail,type]))return false;
    return true;
   }
   if(universal([]))certifiedMasks.push(mask);
   if(indeterminate)unknown=true;
  }
  const r={safe:true,unknown,certifiedMasks};
  stateCache.set(k,r);return r;
 };
 function check({board,reservedQueue}){
  if(!Array.isArray(board)||board.length!==6||!board.every(valid)||!Array.isArray(reservedQueue)||reservedQueue.length!==6||!reservedQueue.every(valid))throw TypeError('six board and six reserved tiles required');
  const r=visit(board,reservedQueue,maxRefreshes);
  return {...r,statesChecked:states,cacheHits,stopCacheHits:stopHits,unknownBranches:unknowns,
   stopCacheSize:stopCache.size,stateCacheSize:stateCache.size,targetCacheSize:targetCache.size,
   allMasksClassified:!r.unknown,certifiedRateLowerBound:r.certifiedMasks.length/62};
 }
 return Object.freeze({check});
}
