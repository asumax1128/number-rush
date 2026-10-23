import test from 'node:test';import assert from 'node:assert/strict';
import {createSafeVarietyRecoveryV61,LEDGER_KEY_V61} from './variety-safe-recovery-v61.mjs';
function storage(){const m=new Map();return {m,getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
function locks(){let p=Promise.resolve();return {request:(_k,_o,fn)=>{const r=p.then(fn);p=r.then(()=>{},()=>{});return r;}};}
const e={answerId:'a_old_beyond20',outcome:'TARGET_CLEAR',consumedTileCount:2};
function pending(){let entries=[e];return {list:async()=>({ok:true,entries:[...entries]}),acknowledge:async id=>{entries=entries.filter(x=>x.answerId!==id);return {ok:true};}};}
test('two tabs recover same pending event only once',async()=>{
 const s=storage(),l=locks(),p=pending();let calls=0;
 const mk=()=>createSafeVarietyRecoveryV61({storage:s,locks:l,pending:p,recordAnswer:async()=>{calls++;return {saved:true};}});
 const [a,b]=await Promise.all([mk().recover(),mk().recover()]);
 assert.equal(calls,1);assert.equal(a.saved+b.saved,1);assert.equal(JSON.parse(s.getItem(LEDGER_KEY_V61)).ids[e.answerId],'saved');
});
test('ambiguous started marker blocks replay beyond 20-item history window',async()=>{
 const s=storage(),l=locks(),p=pending();s.setItem(LEDGER_KEY_V61,JSON.stringify({version:1,ids:{[e.answerId]:'started'}}));let calls=0;
 const r=await createSafeVarietyRecoveryV61({storage:s,locks:l,pending:p,recordAnswer:async()=>{calls++;return {saved:true};}}).recover();
 assert.equal(r.uncertain,1);assert.equal(calls,0);assert.equal((await p.list()).entries.length,1);
});
test('unknown schema fails closed; lock absence fails closed',async()=>{
 const s=storage(),p=pending();s.setItem(LEDGER_KEY_V61,'{broken');
 const a=createSafeVarietyRecoveryV61({storage:s,locks:locks(),pending:p,recordAnswer:async()=>({saved:true})});
 assert.equal((await a.recover()).ok,false);assert.equal(s.getItem(LEDGER_KEY_V61),'{broken');
 const b=createSafeVarietyRecoveryV61({storage:s,locks:null,pending:p,recordAnswer:async()=>({saved:true})});
 assert.equal((await b.recover()).status,'lock-unavailable');
});
