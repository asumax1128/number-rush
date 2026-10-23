/** Vol.62: universal G3 REFRESH over ALL unreserved tail assignments.
 * Six reserved tiles remain unchanged. After a refresh of k tiles, the
 * subsequent six-tile answer can consume k not-yet-reserved tiles.
 * Quantification is over all 6^k tails (k<=5), never a favorable sample.
 * No claim about repeated REFRESH before answering or actual spawn weights.
 */
import {missionTargetsV60,safeNextMissionCandidatesV60} from './safety-consecutive-missions-v60.mjs';
const KINDS=['NORMAL','DOUBLE'];
const TYPES=[1,2,3].flatMap(value=>KINDS.map(kind=>Object.freeze({value,kind})));
const valid=x=>x&&Number.isInteger(x.value)&&x.value>=1&&x.value<=3&&KINDS.includes(x.kind);
export function verifyUniversalRefreshG3V62({board,reservedQueue,target,currentMission,publishedNext,refreshMask}){
 if(!Array.isArray(board)||board.length!==6||!board.every(valid)||!Array.isArray(reservedQueue)||reservedQueue.length!==6||!reservedQueue.every(valid)||
 !Number.isInteger(refreshMask)||refreshMask<1||refreshMask>=63||!publishedNext||!Number.isInteger(publishedNext.target)||typeof publishedNext.mission!=='string')
 throw TypeError('requires six fixed reserved tiles, six board tiles, mask 1..62 and published next');
 const after=board.slice();let k=0;
 for(let i=0;i<6;i++)if(refreshMask&(1<<i))after[i]=reservedQueue[k++];
 if(!missionTargetsV60(after,currentMission).has(target))return {allowed:false,reason:'G1-failed',tailsChecked:0,refreshCount:k};
 const prefix=reservedQueue.slice(k);
 let checked=0,counterexample=null,branchesChecked=0;
 function recurse(tail){
  if(tail.length===k){
   checked++;
   const nextQueue=[...prefix,...tail];
   const result=safeNextMissionCandidatesV60({board:after,reservedQueue:nextQueue,target,currentMission});
   branchesChecked+=result.branches.length;
   if(!result.options.some(o=>o.mission===publishedNext.mission&&o.target===publishedNext.target)){
    counterexample=tail.map(x=>({...x}));
    return false;
   }
   return true;
  }
  for(const type of TYPES)if(!recurse([...tail,type]))return false;
  return true;
 }
 const allowed=recurse([]);
 return {allowed,reason:allowed?'universally-safe':'G2-counterexample',tailsChecked:checked,
  theoreticalTailCount:6**k,refreshCount:k,branchesChecked,counterexample};
}
export function enumerateUniversalRefreshG3V62(state){
 const allowed=[],rejected=[];
 for(let mask=1;mask<63;mask++){
  const r=verifyUniversalRefreshG3V62({...state,refreshMask:mask});
  (r.allowed?allowed:rejected).push({mask,...r});
 }
 return {allowed,rejected,checked:62};
}
