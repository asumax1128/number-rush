/** Vol.54: create and mount a TRIPLE status element in an existing HUD.
 * No layout or game controls are replaced. Caller supplies the actual HUD node.
 */
import {connectTripleHUD} from './triple-hud-bridge-v53.mjs';
export function mountTripleStatusInGame({hud,storage,locks,onWarning=()=>{}}){
 if(!hud||!hud.ownerDocument||typeof hud.appendChild!=='function')throw TypeError('HUD required');
 let element=hud.querySelector?.('[data-number-rush-triple-status]')??null;
 if(!element){
  element=hud.ownerDocument.createElement('div');
  element.setAttribute('data-number-rush-triple-status','');
  element.className='number-rush-triple-status';
  hud.appendChild(element);
 }
 const bridge=connectTripleHUD({element,storage,locks,onWarning});
 return {element,ready:bridge.ready,commitQuestion:bridge.commitQuestion,getView:bridge.getView};
}
