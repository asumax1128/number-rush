import test from 'node:test';
import assert from 'node:assert/strict';
import {connectTripleHUD} from './triple-hud-bridge-v53.mjs';
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
function dom(){const d={createElement:t=>({tag:t,textContent:''})};return {ownerDocument:d,dataset:{},hidden:true,attributes:{},replaceChildren(...x){this.children=x;},setAttribute(k,v){this.attributes[k]=v;}};}
function lock(){let tail=Promise.resolve();return {request:(_n,_o,fn)=>{const p=tail.then(fn);tail=p.then(()=>{},()=>{});return p;}};}
test('HUD shows unavailable when Web Locks absent, game remains playable',async()=>{
 const element=dom(),ui=connectTripleHUD({element,storage:storage(),locks:null});
 assert.equal(element.dataset.tripleStorage,'pending');
 await ui.ready;
 assert.equal(element.dataset.tripleStorage,'unavailable');
 assert.equal(ui.getView().canPlay,true);
});
test('HUD moves from pending to ready with locks',async()=>{
 const element=dom(),ui=connectTripleHUD({element,storage:storage(),locks:lock()});
 assert.equal(element.dataset.tripleStorage,'pending');
 await ui.ready;
 assert.equal(element.dataset.tripleStorage,'ok');
 assert.equal(element.attributes.role,'status');
});
