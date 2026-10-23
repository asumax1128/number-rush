/** Vol.57: bounded, in-memory, fail-closed retry queue for Variety persistence.
 * Does not write unencrypted events to localStorage. Retains the ORIGINAL event
 * (and answerId), never creates a new ID. No automatic background retries.
 * Caller explicitly drains after connectivity/storage capability is restored.
 * Scope: one runtime; pending events are lost on reload.
 */
export function createVarietyRetryQueue({retry,maxPending=128,onWarning=()=>{}}){
 if(typeof retry!=='function')throw new TypeError('retry callback required');
 if(!Number.isInteger(maxPending)||maxPending<1)throw new RangeError('maxPending');
 const pending=new Map();let draining=null;
 const validate=event=>{
  if(!event||!Object.isFrozen(event)||typeof event.answerId!=='string'||!/^[-_A-Za-z0-9]{1,96}$/.test(event.answerId))throw new TypeError('original committed event required');
  if(!['MISSION_CLEAR','TARGET_CLEAR'].includes(event.outcome)||!Number.isInteger(event.consumedTileCount)||event.consumedTileCount<1||event.consumedTileCount>6)throw new TypeError('invalid retry event');
 };
 const enqueue=(event)=>{
  validate(event);
  const previous=pending.get(event.answerId);
  if(previous){
   if(previous.outcome!==event.outcome||previous.consumedTileCount!==event.consumedTileCount)throw new Error('answerId conflict');
   return false;
  }
  if(pending.size>=maxPending){onWarning('retry-queue-full');return false;}
  pending.set(event.answerId,event);return true;
 };
 const drain=()=>{
  if(draining)return draining;
  draining=(async()=>{
   const result={attempted:0,saved:0,remaining:0};
   for(const [id,event] of [...pending]){
    result.attempted++;
    try{
     const outcome=await retry(event);
     if(outcome?.saved===true){pending.delete(id);result.saved++;}
     else onWarning('retry-not-saved',outcome?.status??'unknown');
    }catch(error){onWarning('retry-threw',error);}
   }
   result.remaining=pending.size;return result;
  })().finally(()=>{draining=null;});
  return draining;
 };
 return Object.freeze({enqueue,drain,get size(){return pending.size;},get ids(){return [...pending.keys()];}});
}
/** Attach queue to Vol.56 guarded answer committer without changing game results. */
export function createVarietyRetryCoordinator({committer,maxPending=128,onWarning=()=>{}}){
 if(!committer||typeof committer.commit!=='function'||typeof committer.retry!=='function')throw new TypeError('committer');
 const queue=createVarietyRetryQueue({retry:event=>committer.retry(event),maxPending,onWarning});
 const commit=async adjudication=>{
  const value=await committer.commit(adjudication);
  if(value?.persistence?.saved===false&&value.event?.outcome!=='MISS')queue.enqueue(value.event);
  return value;
 };
 return {ready:committer.ready,commit,drain:queue.drain,get pendingCount(){return queue.size;},get pendingIds(){return queue.ids;}};
}
