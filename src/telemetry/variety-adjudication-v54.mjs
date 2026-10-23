/** Vol.54: opt-in integration at the game's authoritative adjudication boundary.
 * Call once when creating the game runtime; call onAdjudicated only after scoring
 * and board transition have been committed. This module does not adjudicate answers.
 */
import {createCommittedAnswerBridge} from './committed-answer-bridge-v53.mjs';
export function connectVarietyToAdjudication({storage,locks,cryptoProvider,onWarning=()=>{},onPersistenceStatus=()=>{}}){
 const bridge=createCommittedAnswerBridge({storage,locks,cryptoProvider,onWarning,onPersistenceStatus});
 const onAdjudicated=async result=>{
  if(!result||result.finalized!==true)throw new TypeError('authoritative finalized adjudication required');
  if(!['MISSION_CLEAR','TARGET_CLEAR','MISS'].includes(result.outcome))throw new TypeError('invalid outcome');
  const count=result.outcome==='MISS'?0:result.consumedTileCount;
  if(!Number.isInteger(count))throw new TypeError('consumedTileCount required');
  return bridge.commit({outcome:result.outcome,consumedTileCount:count});
 };
 return {ready:bridge.ready,onAdjudicated,retry:bridge.retry,snapshot:bridge.snapshot};
}
