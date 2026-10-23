import test from 'node:test';
import assert from 'node:assert/strict';
import {createVarietyAnswerAdapter} from './variety-game-adapter-v51.mjs';
function memory(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
function lock(){let tail=Promise.resolve();return {request:(_n,_o,fn)=>{const p=tail.then(fn);tail=p.then(()=>{},()=>{});return p;}};}
test('committed outcomes feed persistent history, MISS ignored, duplicate ID ignored',async()=>{
 const a=createVarietyAnswerAdapter({storage:memory(),locks:lock()});
 assert.equal(await a.ready,true);
 assert.equal((await a.committed({answerId:'a1',outcome:'MISSION_CLEAR',consumedTileCount:2})).recorded,true);
 assert.equal((await a.committed({answerId:'a1',outcome:'MISSION_CLEAR',consumedTileCount:2})).recorded,false);
 assert.equal((await a.committed({answerId:'a2',outcome:'MISS',consumedTileCount:0})).status,'ignored-miss');
 assert.equal((await a.committed({answerId:'a3',outcome:'TARGET_CLEAR',consumedTileCount:4})).recorded,true);
 assert.deepEqual(await a.snapshot(),[2,4]);
});
test('failed persistence reports status but does not throw or change game event',async()=>{
 const warnings=[],event=Object.freeze({answerId:'a1',outcome:'TARGET_CLEAR',consumedTileCount:3});
 const a=createVarietyAnswerAdapter({storage:memory(),locks:null,onPersistenceStatus:s=>warnings.push(s)});
 assert.equal(await a.ready,false);
 assert.equal((await a.committed(event)).saved,false);
 assert.deepEqual(warnings,['lock-unavailable']);
 assert.equal(event.consumedTileCount,3);
});
test('rejects premature or malformed events',async()=>{
 const a=createVarietyAnswerAdapter({storage:memory(),locks:lock()});
 await assert.rejects(()=>a.committed({answerId:'a1',outcome:'MISS',consumedTileCount:2}),TypeError);
 await assert.rejects(()=>a.committed({answerId:'a1',outcome:'SELECTED',consumedTileCount:2}),TypeError);
});
