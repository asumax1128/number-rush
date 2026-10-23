/** Vol.61 G3 refresh certificate, finite NORMAL/DOUBLE digits 1..3 model.
 * REFRESH consumes 1..5 queue tiles. To prove a proposed refresh, caller must
 * provide the entire 6+5 immutable reservation prefix (11 tiles). Remaining
 * queue after refresh must cover any subsequent six-tile answer.
 * The published next target/mission is never changed.
 */
import {missionTargetsV60,safeNextMissionCandidatesV60} from './safety-consecutive-missions-v60.mjs';
const tile=x=>x&&Number.isInteger(x.value)&&x.value>=1&&x.value<=3&&['NORMAL','DOUBLE'].includes(x.kind);
export function verifyRefreshG3V61({board,queuePrefix,target,currentMission,publishedNext,refreshMask}){
 if(!Array.isArray(board)||board.length!==6||!board.every(tile)||
 !Array.isArray(queuePrefix)||queuePrefix.length<11||!queuePrefix.every(tile)||
 !Number.isInteger(refreshMask)||refreshMask<1||refreshMask>=63||
 !publishedNext||!Number.isInteger(publishedNext.target)||typeof publishedNext.mission!=='string')
 throw TypeError('G3 requires 6 board tiles, >=11 immutable queue tiles, mask 1..62, published next');
 const after=board.slice();let consumed=0;
 for(let i=0;i<6;i++)if(refreshMask&(1<<i))after[i]=queuePrefix[consumed++];
 const remaining=queuePrefix.slice(consumed,consumed+6);
 if(!missionTargetsV60(after,currentMission).has(target))
  return {allowed:false,reason:'current-G1-failed',consumed};
 const checked=safeNextMissionCandidatesV60({board:after,reservedQueue:remaining,target,currentMission});
 const nextIsSafe=checked.options.some(x=>x.mission===publishedNext.mission&&x.target===publishedNext.target);
 return {allowed:nextIsSafe,reason:nextIsSafe?'G1-G2-and-FREE-return':'published-next-not-universally-safe',
 consumed,afterBoard:after,branchesChecked:checked.branches.length};
}
export function enumerateRefreshG3V61(state){
 const allowed=[],rejected=[];
 for(let mask=1;mask<63;mask++){
  const result=verifyRefreshG3V61({...state,refreshMask:mask});
  (result.allowed?allowed:rejected).push({mask,...result});
 }
 return {allowed,rejected,checked:62};
}
