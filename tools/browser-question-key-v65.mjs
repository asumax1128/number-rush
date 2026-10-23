/** Vol.65 Chromium same-questionKey concurrent reservation.
 * Exercises the new ledger that can be injected into question-commit-v56.
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
 browser=await chromium.launch({headless:true});const context=await browser.newContext();
 const url=`http://127.0.0.1:${server.address().port}/tests/browser/vol64-idb-fixture.html`;
 const a=await context.newPage(),b=await context.newPage();
 await Promise.all([a.goto(url),b.goto(url)]);
 const reserve=()=>({questionKey:'shared_question_65',fingerprint:JSON.stringify({difficulty:'NORMAL',selectedMission:'TRIPLE',missionClearSolutions:3})});
 const invoke=page=>page.evaluate(async input=>{
  const {createQuestionKeyLedgerV65}=await import('/src/telemetry/triple-question-ledger-v65.mjs');
  const ledger=await createQuestionKeyLedgerV65({indexedDB,newQuestionId:()=> 'q_'+crypto.randomUUID().replaceAll('-','')});
  const result=await ledger.reserve(input);
  ledger.close();return result;
 },reserve());
 const [x,y]=await Promise.all([invoke(a),invoke(b)]);
 assert.equal(x.questionId,y.questionId);
 assert.equal([x.duplicate,y.duplicate].filter(Boolean).length,1);
 const collision=await b.evaluate(async()=>{
  const {createQuestionKeyLedgerV65}=await import('/src/telemetry/triple-question-ledger-v65.mjs');
  const ledger=await createQuestionKeyLedgerV65({indexedDB,newQuestionId:()=> 'q_new'});
  try{await ledger.reserve({questionKey:'shared_question_65',fingerprint:'conflicting'});return false;}catch{return true;}finally{ledger.close();}
 });
 assert.equal(collision,true);
 console.log(JSON.stringify({status:'passed',sameQuestionKey:true,oneCanonicalQuestionId:true,conflictingPayloadRejected:true}));
 await context.close();
}finally{await browser?.close();await new Promise(done=>server.close(done));}
