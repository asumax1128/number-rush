/** Vol.66 Chromium E2E: atomic questionId + TRIPLE stats and restart. */
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
 browser=await chromium.launch({headless:true});const context=await browser.newContext();
 const url=`http://127.0.0.1:${server.address().port}/tests/browser/vol66-triple-atomic-fixture.html`;
 const a=await context.newPage(),b=await context.newPage();
 await Promise.all([a.goto(url),b.goto(url)]);
 await Promise.all([a.waitForFunction(()=>!!window.vol66),b.waitForFunction(()=>!!window.vol66)]);
 const commit=p=>p.evaluate(()=>window.vol66.store.commit(window.vol66.question));
 const [x,y]=await Promise.all([commit(a),commit(b)]);
 assert.equal(x.saved,true);assert.equal(y.saved,true);assert.equal(x.questionId,y.questionId);
 assert.equal([x.duplicate,y.duplicate].filter(Boolean).length,1);
 const snapshot=await a.evaluate(()=>window.vol66.store.snapshot());
 assert.equal(snapshot.length,1);assert.equal(snapshot[0].questionId,x.questionId);
 await a.reload();await a.waitForFunction(()=>!!window.vol66);
 const persisted=await a.evaluate(async()=>({history:await window.vol66.store.snapshot(),record:await window.vol66.store.lookup('shared_question_v66')}));
 assert.equal(persisted.history.length,1);assert.equal(persisted.record.questionId,x.questionId);
 let conflicting=false;
 try{await b.evaluate(()=>window.vol66.store.commit({...window.vol66.question,missionClearSolutions:999}));}catch{conflicting=true;}
 assert.equal(conflicting,true);
 const after=await a.evaluate(()=>window.vol66.store.snapshot());assert.equal(after.length,1);
 console.log(JSON.stringify({status:'passed',sameKeyDeduplicated:true,atomicHistory:true,restartPersistence:true,conflictRejected:true}));
 await context.close();
}finally{await browser?.close();await new Promise(done=>server.close(done));}
