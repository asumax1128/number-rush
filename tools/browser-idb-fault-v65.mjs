/** Vol.65 browser fault-injection and restart regression for Vol.64 IndexedDB atomic store.
 * Playwright Chromium required; does not touch production browser data.
 */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=resolve('.');
const server=createServer(async(req,res)=>{try{
 const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
 res.writeHead(200,{'content-type':path.endsWith('.html')?'text/html':'text/javascript','cache-control':'no-store'}).end(await readFile(path));
}catch{res.writeHead(404).end('not found');}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext();
 const url=`http://127.0.0.1:${server.address().port}/tests/browser/vol64-idb-fixture.html`;
 const p=await context.newPage();await p.goto(url);await p.waitForFunction(()=>!!window.vol64);
 const result=await p.evaluate(async()=>{
  const s=window.vol64.store;
  const seed=await s.commit({answerKey:'seed_65',answerId:'seed_id_65',outcome:'MISSION_CLEAR',consumedTileCount:2});
  const before=await s.snapshot();
  let conflictRejected=false;
  try{await s.commit({answerKey:'seed_65',answerId:'other_id_65',outcome:'TARGET_CLEAR',consumedTileCount:3});}
  catch{conflictRejected=true;}
  const afterConflict=await s.snapshot();
  const original=IDBObjectStore.prototype.add;
  // Inject a native IndexedDB constraint failure, ensuring the transaction aborts.
  IDBObjectStore.prototype.add=function(value,...args){
   if(this.name==='answers'&&value.answerKey==='fault_65')
    return original.call(this,{answerKey:'seed_65',answerId:'injected_id_65',outcome:'TARGET_CLEAR',consumedTileCount:1},...args);
   return original.call(this,value,...args);
  };
  let injectedRejected=false;
  try{await s.commit({answerKey:'fault_65',answerId:'fault_id_65',outcome:'MISSION_CLEAR',consumedTileCount:3});}
  catch{injectedRejected=true;}
  finally{IDBObjectStore.prototype.add=original;}
  const afterFault=await s.snapshot();
  return {seed,conflictRejected,injectedRejected,before,afterConflict,afterFault};
 });
 assert.equal(result.seed.saved,true);assert.equal(result.conflictRejected,true);
 assert.equal(result.injectedRejected,true);assert.deepEqual(result.before,result.afterConflict);
 assert.deepEqual(result.before,result.afterFault);
 await p.reload();await p.waitForFunction(()=>!!window.vol64);
 const restarted=await p.evaluate(async()=>({
  history:await window.vol64.store.snapshot(),
  original:await window.vol64.store.getAnswer('seed_65'),
  failed:await window.vol64.store.getAnswer('fault_65')
 }));
 assert.deepEqual(restarted.history,result.before);
 assert.equal(restarted.original.answerId,'seed_id_65');assert.equal(restarted.failed,null);
 console.log(JSON.stringify({status:'passed',conflictRollback:true,injectedConstraintRollback:true,restartPersistence:true}));
 await context.close();
}finally{await browser?.close();await new Promise(done=>server.close(done));}
