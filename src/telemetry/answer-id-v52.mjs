/** Vol.52: session-scoped answer IDs.
 * IDs use a cryptographically random 128-bit session nonce + monotonically
 * increasing per-session answer ordinal. Do not reset ordinal on game restart.
 * Persist IDs with the authoritative answer event before retrying storage.
 */
export function createAnswerIdFactory({cryptoProvider=globalThis.crypto}={}){
 if(typeof cryptoProvider?.getRandomValues!=='function')throw new Error('secure-random-unavailable');
 const bytes=new Uint8Array(16);cryptoProvider.getRandomValues(bytes);
 const session=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 let ordinal=0;
 return Object.freeze({
  next(){
   if(ordinal>=Number.MAX_SAFE_INTEGER)throw new RangeError('answer ordinal exhausted');
   ordinal+=1;
   return 'a_'+session+'_'+ordinal.toString(36);
  },
  get session(){return session;},
  get issued(){return ordinal;}
 });
}
/** Stable across retries; create only once at adjudication, not on save attempt. */
export function makeCommittedAnswer(factory,{outcome,consumedTileCount}){
 if(!factory||typeof factory.next!=='function')throw new TypeError('factory');
 if(!['MISSION_CLEAR','TARGET_CLEAR','MISS'].includes(outcome))throw new TypeError('outcome');
 if(!Number.isInteger(consumedTileCount)||consumedTileCount<0||consumedTileCount>6)throw new TypeError('consumedTileCount');
 if(outcome==='MISS'&&consumedTileCount!==0)throw new TypeError('MISS tile count');
 if(outcome!=='MISS'&&consumedTileCount===0)throw new TypeError('TARGET tile count');
 return Object.freeze({answerId:factory.next(),outcome,consumedTileCount});
}
