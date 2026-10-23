/** Vol.60: safety-first non-FREE consecutive mission publication.
 * Limited certificate: 6 positional tiles, value 1..3, NORMAL/DOUBLE,
 * immutable six-tile reserved queue; all TARGET-matching subsets (63).
 * Safe candidate (next mission,target) requires G1 for every successor board.
 * Infinite continuation follows Vol.58 FREE core only under its assumptions.
 */
export const MISSION_V60=Object.freeze(['FREE','PAIR','TRIPLE','ODD','EVEN']);
function checkTile(x){return x&&Number.isInteger(x.value)&&x.value>=1&&x.value<=3&&['NORMAL','DOUBLE'].includes(x.kind);}
function effective(x){return x.value*(x.kind==='DOUBLE'?2:1);}
function missionOK(m,chosen){
 return m==='FREE'||(m==='PAIR'&&chosen.length===2)||(m==='TRIPLE'&&chosen.length===3)||
 (m==='ODD'&&chosen.some(x=>x.value%2===1))||(m==='EVEN'&&chosen.some(x=>x.value%2===0));
}
export function missionTargetsV60(board,mission){
 if(!MISSION_V60.includes(mission)||!Array.isArray(board)||board.length!==6||!board.every(checkTile))throw TypeError('limited model board/mission');
 const result=new Set();
 for(let mask=1;mask<64;mask++){
  const chosen=board.filter((_,i)=>mask&(1<<i));
  if(missionOK(mission,chosen))result.add(chosen.reduce((s,x)=>s+effective(x),0));
 }
 return result;
}
export function safeNextMissionCandidatesV60({board,reservedQueue,target,currentMission}){
 if(!Array.isArray(board)||board.length!==6||!board.every(checkTile)||!Array.isArray(reservedQueue)||reservedQueue.length!==6||!reservedQueue.every(checkTile))throw TypeError('six limited-model board/queue tiles required');
 if(!MISSION_V60.includes(currentMission)||!Number.isInteger(target)||target<1)throw TypeError('mission/target');
 if(!missionTargetsV60(board,currentMission).has(target))throw Error('G1 current mission unsatisfied');
 const successors=[];
 for(let mask=1;mask<64;mask++){
  const selected=board.filter((_,i)=>mask&(1<<i));
  if(selected.reduce((s,x)=>s+effective(x),0)!==target)continue;
  const next=board.slice();let j=0;
  for(let i=0;i<6;i++)if(mask&(1<<i))next[i]=reservedQueue[j++];
  successors.push({mask,board:next,missionClear:missionOK(currentMission,selected)});
 }
 const options=[];
 for(const mission of MISSION_V60){
  let common=null;
  for(const successor of successors){
   const possible=missionTargetsV60(successor.board,mission);
   common=common===null?possible:new Set([...common].filter(t=>possible.has(t)));
  }
  for(const nextTarget of [...common].sort((a,b)=>a-b))options.push({mission,target:nextTarget,branchCount:successors.length});
 }
 const nonFree=options.filter(o=>o.mission!=='FREE');
 return {options,nonFree,free:options.filter(o=>o.mission==='FREE'),branches:successors,
  certifiedUnder:'Vol.58 FREE-core closure for 6-tile 1..3 NORMAL/DOUBLE fixed reserved queue'};
}
/** Variety may choose only among certified options. Never force non-FREE. */
export function chooseNextMissionV60(state,{rank=(a,b)=>0}={}){
 const checked=safeNextMissionCandidatesV60(state);
 if(!checked.options.length)throw Error('no certified continuation; fail closed');
 const pool=checked.nonFree.length?checked.nonFree:checked.free;
 return {chosen:[...pool].sort(rank)[0],fallbackToFree:checked.nonFree.length===0,
  certifiedOptions:checked.options,branchesChecked:checked.branches.length};
}
