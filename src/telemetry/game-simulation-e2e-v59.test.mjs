import test from 'node:test';import assert from 'node:assert/strict';
import {initializeGameQuestionTelemetry} from './triple-question-adapter-v58.mjs';
import {createDurableVarietyPendingStore} from './variety-pending-store-v59.mjs';
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
function locks(){let tail=Promise.resolve();return {request:(_n,_o,fn)=>{const p=tail.then(fn);tail=p.then(()=>{},()=>{});return p;}};}
function dom(){const doc={createElement(tag){return {tag,ownerDocument:doc,dataset:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;},replaceChildren(...x){this.children=x;}};}};return {ownerDocument:doc,children:[],appendChild(x){this.children.push(x);},querySelector(){return this.children.find(x=>Object.hasOwn(x.attributes,'data-number-rush-triple-status'))??null;}};}
const cryptoProvider={getRandomValues:b=>b.fill(9)};
function game(){return {board:[1,2,3,1,2,3],target:6,mission:'TRIPLE',queue:[1,2,3,1,2,3],score:0};}
function snapshot(g,key){return {questionKey:key,finalized:true,safetyCertified:true,boardCommitted:true,targetCommitted:true,missionCommitted:true,queueReservationLocked:true,publishedQueue:g.queue.slice(0,5),reservedSixth:g.queue[5],difficulty:'NORMAL',safeMissions:['FREE','TRIPLE'],selectedMission:g.mission,missionClearSolutions:3,targetTileCountKinds:2};}
test('mock game finalize -> real TRIPLE persistence -> HUD; duplicate same question',async()=>{
 const g=game(),s=storage(),l=locks(),hud=dom();
 const bridge=initializeGameQuestionTelemetry({hud,storage:s,locks:l,cryptoProvider});
 await bridge.ready;
 const a=await bridge.onQuestionFinalized(snapshot(g,'game_1_question_1'));
 const b=await bridge.onQuestionFinalized(snapshot(g,'game_1_question_1'));
 assert.equal(a.questionId,b.questionId);assert.equal(a.result.saved,true);
 assert.equal(bridge.element.dataset.tripleStorage,'ok');
 assert.deepEqual(g,game());assert.equal(hud.children.length,1);
});
test('mock game refuses precommit and fails closed without Web Locks',async()=>{
 const g=game(),s=storage();
 const bridge=initializeGameQuestionTelemetry({hud:dom(),storage:s,locks:null,cryptoProvider});
 await bridge.ready;
 await assert.rejects(()=>bridge.onQuestionFinalized({...snapshot(g,'game_2_q_1'),queueReservationLocked:false}),TypeError);
 const result=await bridge.onQuestionFinalized(snapshot(g,'game_2_q_1'));
 assert.equal(result.result.saved,false);assert.deepEqual(g,game());
});
test('mock game crash after WAL stage then recovery with same answer ID',async()=>{
 const s=storage(),l=locks();
 const first=createDurableVarietyPendingStore({storage:s,locks:l});
 const e={answerId:'game_3_answer_1',outcome:'TARGET_CLEAR',consumedTileCount:2};
 assert.equal((await first.stage(e)).ok,true);
 const restarted=createDurableVarietyPendingStore({storage:s,locks:l});
 let original=null;
 const recovered=await restarted.recover(async ev=>{original=ev;return {saved:true};});
 assert.equal(recovered.saved,1);assert.equal(original.answerId,e.answerId);
});
