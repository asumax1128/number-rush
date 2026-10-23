/** Vol.60 opt-in real Chromium E2E harness.
 * Prerequisites: npm install --no-save playwright; npx playwright install chromium
 * Run: node tools/browser-e2e-vol60.mjs (from repo root).
 * The script starts a loopback-only static server. Not run in normal safety CI.
 */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=resolve('.');
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');const path=resolve(root,'.'+decodeURIComponent(url.pathname));
  if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  const bytes=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]??'application/octet-stream','cache-control':'no-store'}).end(bytes);
 }catch{res.writeHead(404).end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const port=server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext();
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${port}/tests/browser/vol60-fixture.html`);
 await page.waitForFunction(()=>!!window.numberRushE2E);
 await page.click('#commit');
 await page.waitForFunction(()=>document.querySelector('#result').textContent.includes('questionId'));
 const first=JSON.parse(await page.locator('#result').textContent());
 assert.equal(first.result.saved,true);
 await page.click('#duplicate');
 const second=JSON.parse(await page.locator('#result').textContent());
 assert.equal(second.questionId,first.questionId);
 assert.equal(errors.length,0,errors.join('\n'));
 console.log(JSON.stringify({status:'passed',browser:'chromium',sameQuestionId:true,questionId:first.questionId}));
 await context.close();
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
