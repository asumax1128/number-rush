/** Vol.64 Chromium E2E: two tabs commit SAME questionKey simultaneously.
 * Run: npm install --no-save playwright && npx playwright install chromium
 * node tools/browser-e2e-vol64.mjs
 */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=resolve('.');
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=createServer(async(req,res)=>{
 try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
 res.writeHead(200,{'content-type':mime[extname(path)]??'application/octet-stream','cache-control':'no-store'}).end(await readFile(path));
 }catch{res.writeHead(404).end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
let browser;
try{
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext(),errors=[];
 const a=await context.newPage(),b=await context.newPage();
 for(const p of [a,b])p.on('pageerror',e=>errors.push(e.message));
 const url=`http://127.0.0.1:${server.address().port}/tests/browser/vol64-idb-fixture.html`;
 await Promise.all([a.goto(url),b.goto(url)]);
 await Promise.all([a.waitForFunction(()=>!!window.vol64),b.waitForFunction(()=>!!window.vol64)]);
 await Promise.all([a.click('#commit'),b.click('#commit')]);
 await Promise.all([a.waitForFunction(()=>document.querySelector('#result').textContent.length>0),b.waitForFunction(()=>document.querySelector('#result').textContent.length>0)]);
 const x=JSON.parse(await a.locator('#result').textContent()),y=JSON.parse(await b.locator('#result').textContent());
 assert.equal(x.saved,true);assert.equal(y.saved,true);
 assert.equal(x.answerId,y.answerId,'one canonical answerId for same questionKey');
 assert.equal([x.duplicate,y.duplicate].filter(Boolean).length,1,'exactly one duplicate');
 const snap=await a.evaluate(()=>window.vol64.store.snapshot());
 assert.equal(snap.length,1,'no duplicate statistics');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'passed',sameQuestionKey:true,canonicalAnswerId:x.answerId,historyCount:snap.length,duplicates:1}));
 await context.close();
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
