import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTripleStorageStatus,mountTripleStorageStatus} from './triple-dom-status-v52.mjs';
function dom(){
 const doc={createElement:tag=>({tag,textContent:''})};
 const el={ownerDocument:doc,dataset:{},hidden:true,attributes:{},
  replaceChildren(...xs){this.children=xs;},
  setAttribute(k,v){this.attributes[k]=v;}};
 return el;
}
test('renders safe text nodes and accessible status',()=>{
 const el=dom();
 renderTripleStorageStatus(el,{severity:'unavailable',title:'統計の保存は利用できません',message:'ゲームは続けられます。'});
 assert.equal(el.children[0].textContent,'統計の保存は利用できません');
 assert.equal(el.dataset.tripleStorage,'unavailable');
 assert.equal(el.attributes['aria-live'],'polite');
 assert.equal(el.hidden,false);
});
test('untrusted title remains text, not markup',()=>{
 const el=dom();
 renderTripleStorageStatus(el,{severity:'ok',title:'<img src=x onerror=alert(1)>',message:'ok'});
 assert.equal(el.children[0].textContent,'<img src=x onerror=alert(1)>');
 assert.equal(el.children[0].tag,'strong');
});
test('mount displays initial state and supports updates',()=>{
 const el=dom(),ui={getView:()=>({severity:'pending',title:'確認中',message:'...'})};
 const m=mountTripleStorageStatus({element:el,ui});
 assert.equal(el.dataset.tripleStorage,'pending');
 m.update({severity:'ok',title:'有効',message:'保存可能'});
 assert.equal(el.dataset.tripleStorage,'ok');
});
