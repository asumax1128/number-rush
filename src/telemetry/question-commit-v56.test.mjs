import test from 'node:test';import assert from 'node:assert/strict';
import {createQuestionCommitter} from './question-commit-v56.mjs';
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
function locks(){let tail=Promise.resolve();return {request:(_n,_o,fn)=>{const p=tail.then(fn);tail=p.then(()=>{},()=>{});return p;}};}
function dom(){const doc={createElement(tag){return {tag,ownerDocument:doc,attributes:{},dataset:{},setAttribute(k,v){this.attributes[k]=v;},replaceChildren(...v){this.children=v;}};}};
 return {ownerDocument:doc,children:[],appendChild(x){this.children.push(x);},querySelector(){return this.children.find(x=>Object.hasOwn(x.attributes,'data-number-rush-triple-status'))??null;}};}
const cryptoProvider={getRandomValues:b=>b.fill(8)};
const event={questionKey:'game_1_q1',finalized:true,difficulty:'HARD',safeMissions:['FREE','TRIPLE'],selectedMission:'TRIPLE',missionClearSolutions:1,targetTileCountKinds:2};
test('question commit creates stable ID and records once',async()=>{
 const g=createQuestionCommitter({hud:dom(),storage:storage(),locks:locks(),cryptoProvider});
 const p=g.commit(event);assert.equal(p,g.commit(event));
 const a=await p,b=await g.commit(event);
 assert.equal(a.questionId,b.questionId);assert.equal(a.result.recorded,true);
 assert.equal(g.getView().severity,'ok');
});
test('same key with changed question data is rejected',async()=>{
 const g=createQuestionCommitter({hud:dom(),storage:storage(),locks:locks(),cryptoProvider});
 await g.commit(event);
 assert.throws(()=>g.commit({...event,selectedMission:'FREE'}),/conflict/);
});
test('cannot commit unfinalized or unsafe question',()=>{
 const g=createQuestionCommitter({hud:dom(),storage:storage(),locks:locks(),cryptoProvider});
 assert.throws(()=>g.commit({...event,finalized:false}),TypeError);
 assert.throws(()=>g.commit({...event,selectedMission:'EVEN'}),TypeError);
});
test('locks absent: no save but same question ID on retry',async()=>{
 const g=createQuestionCommitter({hud:dom(),storage:storage(),locks:null,cryptoProvider});
 const a=await g.commit(event),b=await g.commit(event);
 assert.equal(a.questionId,b.questionId);assert.equal(a.result.saved,false);
 assert.equal(g.getView().canPlay,true);
});
