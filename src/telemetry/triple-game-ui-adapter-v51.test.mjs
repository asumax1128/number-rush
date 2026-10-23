import test from 'node:test';
import assert from 'node:assert/strict';
import {createTripleStorageUIAdapter} from './triple-game-ui-adapter-v51.mjs';
test('no Web Locks shows clear message while gameplay remains enabled',async()=>{
 const changes=[],runtime={ready:false,status:'lock-unavailable',commitQuestion:async()=>({status:'lock-unavailable',saved:false})};
 const ui=createTripleStorageUIAdapter({runtime,onChange:v=>changes.push(v)});
 const initial=await ui.ready;
 assert.equal(initial.code,'lock-unavailable');assert.equal(initial.canPlay,true);
 assert.equal((await ui.commitQuestion('q1',{})).saved,false);
 assert.equal(ui.getView().code,'lock-unavailable');
 assert.ok(changes.length>=1);
});
test('normal save remains enabled; later failure becomes warning',async()=>{
 let failed=false;
 const runtime={ready:Promise.resolve(true),status:Promise.resolve('restored'),commitQuestion:async()=>failed?{status:'save-failed',saved:false}:{status:'ok',saved:true,recorded:true}};
 const ui=createTripleStorageUIAdapter({runtime});
 assert.equal((await ui.ready).severity,'ok');
 assert.equal((await ui.commitQuestion('q1',{})).saved,true);
 failed=true;await ui.commitQuestion('q2',{});
 assert.equal(ui.getView().code,'save-failed');assert.equal(ui.getView().canPlay,true);
});
test('corrupt data is not hidden by UI',async()=>{
 const ui=createTripleStorageUIAdapter({runtime:{ready:Promise.resolve(false),status:Promise.resolve('v2-corrupt'),commitQuestion:async()=>({status:'v2-corrupt',saved:false})}});
 assert.equal((await ui.ready).severity,'recovery');
});
