/** Vol.51: adapter for the game's authoritative answer-committed event.
 * Caller emits once after answer adjudication, never on tile selection or animation.
 * Persistence failures do not modify game scoring or board transitions.
 */
import {initializeLockedVariety} from './variety-tab-lock-v50.mjs';
const OUTCOMES=new Set(['MISSION_CLEAR','TARGET_CLEAR','MISS']);
export function createVarietyAnswerAdapter({storage,locks,onWarning=()=>{},onPersistenceStatus=()=>{}}){
 const runtime=initializeLockedVariety({storage,locks,onWarning});
 const committed=async event=>{
  if(!event||typeof event!=='object'||!OUTCOMES.has(event.outcome))throw new TypeError('invalid committed outcome');
  const {answerId,outcome,consumedTileCount}=event;
  if(typeof answerId!=='string'||!Number.isInteger(consumedTileCount))throw new TypeError('invalid committed event');
  if(outcome==='MISS'&&consumedTileCount!==0)throw new TypeError('MISS cannot consume tiles');
  if(outcome!=='MISS'&&(consumedTileCount<1||consumedTileCount>6))throw new TypeError('invalid consumed tile count');
  // No storage write for MISS. No game state changes for any outcome.
  if(outcome==='MISS')return {status:'ignored-miss',recorded:false,saved:true};
  const result=await runtime.recordAnswer({answerId,outcome,consumedTileCount});
  if(!result.saved)onPersistenceStatus(result.status);
  return result;
 };
 return {ready:runtime.ready,committed,snapshot:runtime.snapshot};
}
