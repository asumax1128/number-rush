import test from 'node:test';import assert from 'node:assert/strict';
import {createQuestionCommitter} from './question-commit-v56.mjs';
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
function dom(){const doc={createElement(tag){return {tag,ownerDocument:doc,attributes:{},dataset:{},setAttribute(k,v){this.attributes[k]=v;},replaceChildren(...v){this.children=v;}};}};
 return {ownerDocument:doc,children:[],appendChild(x){this.children.push(x);},querySelector(){return null;}};}
const event={questionKey:'q_v67',finalized:true,difficulty:'NORMAL',safeMissions:['FREE','TRIPLE'],selectedMission:'TRIPLE',missionClearSolutions:2,targetTileCountKinds:2};
test('atomic backend routes commit without legacy recorder double-writing',async()=>{
 const calls=[];const atomicTripleStore={commit:async e=>{calls.push(e);return {saved:true,duplicate:false,questionId:'q_atomic_67'};}};
 const g=createQuestionCommitter({hud:dom(),storage:storage(),locks:null,atomicTripleStore});
 const result=await g.commit(event);
 assert.equal(result.questionId,'q_atomic_67');assert.equal(result.result.saved,true);assert.equal(calls.length,1);
 assert.equal((await g.commit(event)).questionId,'q_atomic_67');assert.equal(calls.length,1);
});
test('cannot enable two mutually incompatible persistence paths',()=>{
 assert.throws(()=>createQuestionCommitter({hud:dom(),storage:storage(),atomicTripleStore:{},questionLedger:{}}),TypeError);
});
test('atomic backend failures propagate instead of pretending to have saved',async()=>{
 const atomicTripleStore={commit:async()=>{throw Error('aborted');}};
 const g=createQuestionCommitter({hud:dom(),storage:storage(),locks:null,atomicTripleStore});
 await assert.rejects(()=>g.commit(event),/aborted/);
});
