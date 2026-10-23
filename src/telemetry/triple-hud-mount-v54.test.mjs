import test from 'node:test';import assert from 'node:assert/strict';
import {mountTripleStatusInGame} from './triple-hud-mount-v54.mjs';
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
function dom(){
 const doc={createElement(tag){return {tag,ownerDocument:doc,dataset:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;},replaceChildren(...v){this.children=v;}};}};
 return {ownerDocument:doc,children:[],appendChild(v){this.children.push(v);},querySelector(){return this.children.find(x=>Object.hasOwn(x.attributes,'data-number-rush-triple-status'))??null;}};
}
test('adds HUD element and shows unavailable state when Web Locks absent',async()=>{
 const hud=dom();const a=mountTripleStatusInGame({hud,storage:storage(),locks:null});
 assert.equal(hud.children.length,1);await a.ready;
 assert.equal(a.element.dataset.tripleStorage,'unavailable');
 assert.equal(a.getView().canPlay,true);
});
test('does not duplicate HUD element',async()=>{
 const hud=dom();const s=storage();
 const a=mountTripleStatusInGame({hud,storage:s,locks:null});
 const b=mountTripleStatusInGame({hud,storage:s,locks:null});
 await Promise.all([a.ready,b.ready]);assert.equal(hud.children.length,1);
});
