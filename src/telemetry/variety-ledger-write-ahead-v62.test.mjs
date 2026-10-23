import test from 'node:test';import assert from 'node:assert/strict';
import {createLedgerWriteAheadVarietyV62} from './variety-ledger-write-ahead-v62.mjs';
import {LEDGER_KEY_V61} from './variety-safe-recovery-v61.mjs';
import {PENDING_KEY_V59} from './variety-pending-store-v59.mjs';
function storage(){const m=new Map();return {m,getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
function locks(){let p=Promise.resolve();return {request:(_name,_opt,fn)=>{const q=p.then(fn);p=q.then(()=>{},()=>{});return q;}};}
const cryptoProvider={getRandomValues:b=>b.fill(7)};
test('commit stages then ledger-started then history then ledger-saved then ack',async()=>{
 const s=storage(),writes=[],set=s.setItem;s.setItem=(k,v)=>{writes.push([k,v]);set(k,v);};
 const bridge=createLedgerWriteAheadVarietyV62({storage:s,locks:locks(),cryptoProvider});
 const r=await bridge.commit({answerKey:'q1',finalized:true,outcome:'MISSION_CLEAR',consumedTileCount:3});
 assert.equal(r.saved,true);const keys=writes.map(x=>x[0]);
 const stage=keys.indexOf(PENDING_KEY_V59),started=writes.findIndex(x=>x[0]===LEDGER_KEY_V61&&x[1].includes('started')),history=keys.findIndex(k=>k.endsWith('target-history:v2')),saved=writes.findIndex(x=>x[0]===LEDGER_KEY_V61&&x[1].includes('saved'));
 assert.ok(stage>=0&&stage<started&&started<history&&history<saved);
 assert.deepEqual(await bridge.historySnapshot(),[3]);assert.deepEqual((await bridge.pending.list()).entries,[]);
});
test('new writes and recovery share lock and retain old IDs beyond history 20',async()=>{
 const s=storage(),l=locks(),bridge=createLedgerWriteAheadVarietyV62({storage:s,locks:l,cryptoProvider});
 for(let i=0;i<24;i++)assert.equal((await bridge.commit({answerKey:'q'+i,finalized:true,outcome:'TARGET_CLEAR',consumedTileCount:1})).saved,true);
 const ledger=JSON.parse(s.getItem(LEDGER_KEY_V61)).ids;
 assert.equal(Object.keys(ledger).length,24);assert.equal((await bridge.historySnapshot()).length,20);
 assert.equal((await bridge.recover()).ok,true);
});
test('crash-ambiguous started is never replayed automatically',async()=>{
 const s=storage(),l=locks(),set=s.setItem;let fail=true;
 s.setItem=(k,v)=>{if(fail&&k.endsWith('target-history:v2'))throw Error('simulated failure');set(k,v);};
 const bridge=createLedgerWriteAheadVarietyV62({storage:s,locks:l,cryptoProvider});
 const r=await bridge.commit({answerKey:'qX',finalized:true,outcome:'TARGET_CLEAR',consumedTileCount:2});
 assert.equal(r.saved,false);fail=false;
 const restarted=createLedgerWriteAheadVarietyV62({storage:s,locks:l,cryptoProvider});
 const recovery=await restarted.recover();
 assert.equal(recovery.uncertain,1);assert.equal((await restarted.historySnapshot()).length,0);
});
