import test from 'node:test';
import assert from 'node:assert/strict';
import {mountTripleStatusInGame} from './triple-hud-mount-v54.mjs';
import {KEY_V2} from './triple-idempotent.mjs';

function storage(){
 const values=new Map();
 return {
  values,
  getItem:key=>values.get(key)??null,
  setItem:(key,value)=>values.set(key,value)
 };
}
function dom(){
 const document={createElement(tag){return {
  tag,ownerDocument:document,dataset:{},attributes:{},children:[],textContent:'',
  setAttribute(name,value){this.attributes[name]=value;},
  replaceChildren(...children){this.children=children;}
 };}};
 return {ownerDocument:document,children:[],
  appendChild(child){this.children.push(child);},
  querySelector(selector){return this.children.find(x=>selector==='[data-number-rush-triple-status]'&&Object.hasOwn(x.attributes,'data-number-rush-triple-status'))??null;}
 };
}
function locks(){
 let previous=Promise.resolve();
 return {request:(_name,_options,fn)=>{
  const next=previous.then(fn);
  previous=next.then(()=>{},()=>{});
  return next;
 }};
}
const event={difficulty:'NORMAL',safeMissions:['FREE','TRIPLE'],selectedMission:'TRIPLE',missionClearSolutions:3,targetTileCountKinds:2};

test('question saved: HUD pending to ok; retry does not double-count',async()=>{
 const hud=dom(),s=storage(),l=locks();
 const ui=mountTripleStatusInGame({hud,storage:s,locks:l});
 assert.equal(ui.element.dataset.tripleStorage,'pending');
 await ui.ready;
 assert.equal(ui.element.dataset.tripleStorage,'ok');
 const first=await ui.commitQuestion('question_1',event);
 assert.equal(first.saved,true);
 assert.equal(first.recorded,true);
 assert.equal(ui.element.dataset.tripleStorage,'ok');
 const retry=await ui.commitQuestion('question_1',event);
 assert.equal(retry.saved,true);
 assert.equal(retry.recorded,false);
 assert.equal(ui.element.dataset.tripleStorage,'ok');
 assert.ok(s.values.has(KEY_V2));
 assert.equal(hud.children.length,1);
});
test('two HUD instances sharing storage and locks do not double-save question',async()=>{
 const s=storage(),l=locks();
 const a=mountTripleStatusInGame({hud:dom(),storage:s,locks:l});
 const b=mountTripleStatusInGame({hud:dom(),storage:s,locks:l});
 await Promise.all([a.ready,b.ready]);
 const outcomes=await Promise.all([a.commitQuestion('question_2',event),b.commitQuestion('question_2',event)]);
 assert.deepEqual(outcomes.map(x=>x.recorded).sort(),[false,true]);
});
test('Web Locks absent: no storage write, unavailable HUD, gameplay allowed',async()=>{
 const hud=dom(),s=storage();
 const ui=mountTripleStatusInGame({hud,storage:s,locks:null});
 await ui.ready;
 const result=await ui.commitQuestion('question_3',event);
 assert.equal(result.saved,false);
 assert.equal(ui.element.dataset.tripleStorage,'unavailable');
 assert.equal(ui.getView().canPlay,true);
 assert.equal(s.values.has(KEY_V2),false);
});
test('corrupt v2 is preserved and HUD warns',async()=>{
 const hud=dom(),s=storage(),bad='{"invalid":true}';
 s.setItem(KEY_V2,bad);
 const ui=mountTripleStatusInGame({hud,storage:s,locks:locks()});
 await ui.ready;
 const result=await ui.commitQuestion('question_4',event);
 assert.equal(result.saved,false);
 assert.equal(s.getItem(KEY_V2),bad);
 assert.notEqual(ui.element.dataset.tripleStorage,'ok');
});
test('storage write failure: HUD warning and no false success',async()=>{
 const s=storage();
 s.setItem=()=>{throw Error('quota');};
 const ui=mountTripleStatusInGame({hud:dom(),storage:s,locks:locks()});
 await ui.ready;
 const result=await ui.commitQuestion('question_5',event);
 assert.equal(result.saved,false);
 assert.notEqual(ui.element.dataset.tripleStorage,'ok');
 assert.equal(ui.getView().canPlay,true);
});
