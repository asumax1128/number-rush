/** Vol.63: repeated REFRESH safety game, conservative universal closure.
 * 6 reserved tiles, 6 position-labeled board, values 1..3 NORMAL/DOUBLE.
 * Each refresh consumes k<=5 queue tiles; unseen k-tail is universally
 * quantified and then becomes the next immutable 6-reservation.
 * At each node the player may STOP refreshing and answer, so STOP must be safe.
 * For every permitted refresh mask, EVERY possible generated tail must lead
 * to a safe node for all remaining refresh opportunities.
 * Budget exhaustion is UNKNOWN => do not authorize; never treat as success.
 */
import {missionTargetsV60,safeNextMissionCandidatesV60} from './safety-consecutive-missions-v60.mjs';
const TYPES=Object.freeze([1,2,3].flatMap(value=>['NORMAL','DOUBLE'].map(kind=>Object.freeze({value,kind}))));
const valid=t=>t&&Number.isInteger(t.value)&&t.value>=1&&t.value<=3&&['NORMAL','DOUBLE'].includes(t.kind);
const key=x=>x.map(t=>t.value+(t.kind==='DOUBLE'?'D':'N')).join(',');
const bitCount=n=>{let c=0;for(;n;n&=n-1)c++;return c;};
export function createRepeatedRefreshVerifierV63({target,currentMission,publishedNext,maxRefreshes=2,maxStates=100000}){
 if(!Number.isInteger(maxRefreshes)||maxRefreshes<0||maxRefreshes>2||!Number.isInteger(maxStates)||maxStates<1||
 !Number.isInteger(target)||target<1||!publishedNext||!Number.isInteger(publishedNext.target))throw TypeError('invalid verifier options');
 const cache=new Map();let statesChecked=0,budgetExhausted=false;
 function stopSafe(board,queue){
  if(!missionTargetsV60(board,currentMission).has(target))return false;
  return safeNextMissionCandidatesV60({board,reservedQueue:queue,target,currentMission}).options
   .some(x=>x.mission===publishedNext.mission&&x.target===publishedNext.target);
 }
 function visit(board,queue,remaining){
  const stateKey=key(board)+'|'+key(queue)+'|'+remaining;
  if(cache.has(stateKey))return cache.get(stateKey);
  if(statesChecked>=maxStates){budgetExhausted=true;return {safe:false,unknown:true,allowedMasks:[]};}
  statesChecked++;
  if(!stopSafe(board,queue)){
   const r={safe:false,unknown:false,allowedMasks:[],reason:'unsafe-stop'};cache.set(stateKey,r);return r;
  }
  if(remaining===0){const r={safe:true,unknown:false,allowedMasks:[]};cache.set(stateKey,r);return r;}
  const allowedMasks=[];
  let unknown=false;
  for(let mask=1;mask<63;mask++){
   const k=bitCount(mask),nextBoard=board.slice();
   let cursor=0;
   for(let i=0;i<6;i++)if(mask&(1<<i))nextBoard[i]=queue[cursor++];
   if(!missionTargetsV60(nextBoard,currentMission).has(target))continue;
   const fixedPrefix=queue.slice(k);
   let good=true,undetermined=false;
   function allTails(tail){
    if(tail.length===k){
     const child=visit(nextBoard,[...fixedPrefix,...tail],remaining-1);
     if(child.unknown){undetermined=true;return false;}
     return child.safe;
    }
    for(const type of TYPES)if(!allTails([...tail,type]))return false;
    return true;
   }
   good=allTails([]);
   if(good)allowedMasks.push(mask);
   if(undetermined)unknown=true;
  }
  const r={safe:true,unknown,allowedMasks};
  cache.set(stateKey,r);return r;
 }
 function check({board,reservedQueue}){
  if(!Array.isArray(board)||board.length!==6||!board.every(valid)||!Array.isArray(reservedQueue)||reservedQueue.length!==6||!reservedQueue.every(valid))throw TypeError('six board and six reserved tiles required');
  const result=visit(board,reservedQueue,maxRefreshes);
  return {...result,statesChecked,budgetExhausted,cacheSize:cache.size,
   // Unknown means no general proof; individually completed masks may be safe.
   certifiedMasks:result.allowedMasks,allMasksClassified:!result.unknown};
 }
 return Object.freeze({check});
}
