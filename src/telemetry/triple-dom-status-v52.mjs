/** Vol.52: DOM rendering of the TRIPLE persistence status view-model.
 * This is an opt-in UI component. It never uses innerHTML, and does not block play.
 * Parent provides a dedicated DOM element in the game HUD/settings.
 */
export function renderTripleStorageStatus(element,view){
 if(!element||typeof element.replaceChildren!=='function'||!element.ownerDocument)throw TypeError('DOM element required');
 const doc=element.ownerDocument;
 const severity=['ok','pending','unavailable','recovery','retry'].includes(view?.severity)?view.severity:'retry';
 const title=doc.createElement('strong');
 title.textContent=String(view?.title??'統計の保存状況を確認できません');
 const message=doc.createElement('span');
 message.textContent=String(view?.message??'');
 element.replaceChildren(title,message);
 element.dataset.tripleStorage=severity;
 element.setAttribute('role','status');
 element.setAttribute('aria-live','polite');
 element.setAttribute('aria-atomic','true');
 element.hidden=false;
 return element;
}
export function mountTripleStorageStatus({element,ui}){
 if(!ui||typeof ui.getView!=='function')throw TypeError('UI adapter required');
 // onChange must be connected by the caller when creating createTripleStorageUIAdapter.
 renderTripleStorageStatus(element,ui.getView());
 return {update:view=>renderTripleStorageStatus(element,view)};
}
