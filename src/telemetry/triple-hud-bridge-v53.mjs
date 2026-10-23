/** Vol.53: wire TRIPLE runtime -> UI adapter -> existing game HUD element.
 * Caller supplies an actual HUD container, storage and navigator.locks.
 * No game scoring/mission-selection behavior is modified.
 */
import {initializeTripleRuntime} from './triple-runtime-v49.mjs';
import {createTripleStorageUIAdapter} from './triple-game-ui-adapter-v51.mjs';
import {renderTripleStorageStatus} from './triple-dom-status-v52.mjs';
export function connectTripleHUD({element,storage,locks,onWarning=()=>{}}){
 if(!element||typeof element.replaceChildren!=='function')throw TypeError('HUD element required');
 const runtime=initializeTripleRuntime({storage,locks,onWarning});
 const ui=createTripleStorageUIAdapter({runtime,onChange:view=>renderTripleStorageStatus(element,view)});
 // Show pending state immediately, before async initialization finishes.
 renderTripleStorageStatus(element,ui.getView());
 return {ready:ui.ready,commitQuestion:ui.commitQuestion,getView:ui.getView};
}
