/** Vol.53: bridge authoritative adjudication to Variety persistence.
 * The game owns adjudication and passes an immutable committed event.
 * One factory per page runtime; retries MUST reuse the same event object.
 */
import {createAnswerIdFactory,makeCommittedAnswer} from './answer-id-v52.mjs';
import {createVarietyAnswerAdapter} from './variety-game-adapter-v51.mjs';
export function createCommittedAnswerBridge({storage,locks,cryptoProvider,onWarning=()=>{},onPersistenceStatus=()=>{}}){
 const ids=createAnswerIdFactory({cryptoProvider});
 const variety=createVarietyAnswerAdapter({storage,locks,onWarning,onPersistenceStatus});
 const commit=async adjudication=>{
  const event=makeCommittedAnswer(ids,adjudication);
  const persistence=await variety.committed(event);
  return {event,persistence};
 };
 const retry=async event=>{
  if(!event||!Object.isFrozen(event)||typeof event.answerId!=='string')throw TypeError('original committed event required');
  return variety.committed(event);
 };
 return {ready:variety.ready,commit,retry,snapshot:variety.snapshot};
}
