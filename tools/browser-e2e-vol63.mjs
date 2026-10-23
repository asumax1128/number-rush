/** Vol.63 real Chromium reload + multi-tab TRIPLE telemetry scenarios.
 * Run after: npm install --no-save playwright && npx playwright install chromium
 * node tools/browser-e2e-vol63.mjs
 * This is an integration fixture, not the production game.
 */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=resolve('.'),errors=[];
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const path=resolve(root,'.'+decodeURIComponent(url.pathname));
  if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  res.writeHead(200,{'content-type':mime[extname(path)]??'application/octet-stream','cache-control':'no-store'}).end(await readFile(path));
 }catch{res.writeHead(404).end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
let browser;
try{
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext();
 const url=`http://127.0.0.1:${server.address().port}/tests/browser/vol60-fixture.html`;
 const tabA=await context.newPage(),tabB=await context.newPage();
 for(const p of [tabA,tabB])p.on('pageerror',e=>errors.push(e.message));
 await tabA.goto(url);await tabA.waitForFunction(()=>!!window.numberRushE2E);
 await tabA.click('#commit');
 await tabA.waitForFunction(()=>document.querySelector('#result').textContent.includes('questionId'));
 const first=JSON.parse(await tabA.locator('#result').textContent());
 assert.equal(first.result.saved,true);
 const before=await tabA.evaluate(()=>Object.keys(localStorage).sort());
 await tabA.reload();await tabA.waitForFunction(()=>!!window.numberRushE2E);
 const after=await tabA.evaluate(()=>Object.keys(localStorage).sort());
 assert.deepEqual(after,before,'localStorage keys survive reload');
 await tabB.goto(url);await tabB.waitForFunction(()=>!!window.numberRushE2E);
 // Distinct question keys avoid claiming cross-tab dedup for same questionKey.
 await tabA.evaluate(()=>window.numberRushE2E.snapshot.questionKey='fixture_question_A_63');
 await tabB.evaluate(()=>window.numberRushE2E.snapshot.questionKey='fixture_question_B_63');
 await Promise.all([tabA.click('#commit'),tabB.click('#commit')]);
 await Promise.all([tabA.waitForFunction(()=>document.querySelector('#result').textContent.includes('questionId')),
 tabB.waitForFunction(()=>document.querySelector('#result').textContent.includes('questionId'))]);
 const a=JSON.parse(await tabA.locator('#result').textContent());
 const b=JSON.parse(await tabB.locator('#result').textContent());
 assert.equal(a.result.saved,true);assert.equal(b.result.saved,true);
 assert.notEqual(a.questionId,b.questionId);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'passed',browser:'chromium',reloadPersistence:true,twoTabDistinctQuestionIds:true,questionIds:[a.questionId,b.questionId]}));
 await context.close();
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
