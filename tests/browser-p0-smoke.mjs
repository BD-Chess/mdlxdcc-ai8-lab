// One bounded loopback browser smoke: actual handler + actual browser assets, mock provider only.
// LAB rewrite 2026-11-03 (guide r3.6): the scripted mock speaks the current tool protocol (R3.3 assess_challenge,
// R3.4 ask_understanding idea + question_closed, R3.5 held reveal after a low card, R3.6 reveal on the player's
// choice without a model call). Every changed check says why next to it; reports/CLOUD_browser-smoke-r36_20261103.md.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { makeHandler } from '../functions/game-guide.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)), evidence=path.join(process.env.AI8_TEST_EVIDENCE_DIR||root,'evidence');
const profile=path.join(evidence,`browser-profile-${process.pid}`);await mkdir(profile,{recursive:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
// c4 has a third key idea so that one milestone is a low card that is still coded (Kartica A 1/3): R3.5 holds that reveal.
const game={schema:'ai8.game.v1',slug:'_fixture',title:'Pet mehanizmov',acts:[1,2,3,4,5].map(act=>({act})),steps:[
 {id:'s1',act:1,kind:'story',title:'Prolog',for_agent:'Začni.',text:'V delavnici preizkušava zamisli.'},
 ...[1,2,3,4,5].flatMap(n=>[
  {id:`c${n}`,act:n,kind:'challenge',title:`Izziv ${n}`,for_agent:'Vprašanje je na strani.',text:`Kako bi preizkusil mehanizem ${n}?`,key_ideas:['Gibanje spremeni stanje.','Preizkus pokaže razliko.',...(n===4?['Meritev pokaže, koliko.']:[])],alternatives_ok:['Katapult in en propeler sta veljavni alternativi.']},
  {id:`h${n}`,act:n,kind:'hint',for:`c${n}`,title:`Namig ${n}`,for_agent:'Premisli o gibanju.',text:'Pomisliva, kaj se premika.'},
  {id:`r${n}`,act:n,kind:'reveal',for:`c${n}`,title:`Razkritje ${n}`,for_agent:'Zgodovinski preizkus.',text:'Gibanje spremeni stanje; preizkus pokaže razliko.'}
 ]),{id:'end',act:5,kind:'epilogue',title:'Epilog',for_agent:'Končala sva.',text:'Vseh pet poti je pred nama.'}
]};
const html=`<!doctype html><html lang="sl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Guide smoke</title><link rel="stylesheet" href="/assets/game-guide/game-guide.css"><style>body{margin:0;background:#f3f0e8;color:#20242b;font:18px/1.6 Georgia}main{padding:20px 32px;max-width:850px}.g-step{padding:16px 0 50px;scroll-margin-top:20px}button{font:inherit}h2{line-height:1.2}</style><main data-game-page>${game.steps.map((s,i)=>`<section class="g-step" data-kind="${s.kind}" id="${s.id}" ${i?'hidden':''}><h2>${s.title}</h2><p>${s.text}</p>${i?'':'<div data-gg-start hidden><button type="button" data-gg-action="start">Začniva igro</button></div>'}</section>`).join('')}</main><script type="module" src="/assets/game-guide/game-guide.js"></script></html>`;
let access='owner', modelCalls=0, clientPosts=[], browser, browserError, socket, sequence=0, markResultOffered=false;const pending=new Map();
const logID='12345678-1234-4234-8234-123456789abc', logs=[], assessments=[];
const report={kind:'one-bounded-loopback-smoke',checks:[],screenshots:[]};
// A protocol slip: a refused tool call, a suppressed reply, a stopped turn or a recovered answer. The scripted mock must cause none.
const slip=e=>e.kind==='error'||e.payload?.recovered===true||e.payload?.phase==='turn_stopped'||e.payload?.tool_uses?.some(t=>t.result?.error);
const handler=makeHandler({accessFactory:async()=>{if(access!=='owner')throw Object.assign(Error(),{code:'AUTH_REQUIRED'});return{role:'owner',id:'fixture'};},
 configured:{claude:true,gpt:true},continuationSecret:()=> 'local-browser-secret-only-'.repeat(3),gameFactory:async()=>structuredClone(game),clientFactory:async()=>({}),budgetFactory:()=>({}),
 logStore:{start:async()=>({id:logID}),append:async(_,events)=>{logs.push(...events);}},
 round:async({provider,system,input,tools,onText})=>{
  modelCalls++;const ctx=JSON.parse(system.split('KONTEKST IGRE (podatki):\n')[1]);if(tools.some(t=>t.name==='mark_result'))markResultOffered=true;
  const message=input.filter(m=>m.role==='user'&&typeof m.content==='string').map(m=>{try{return JSON.parse(m.content).message;}catch{return null;}}).find(Boolean);
  const results=input.flatMap(m=>m.type==='function_call_output'?[JSON.parse(m.output)]:Array.isArray(m.content)?m.content.filter(c=>c.type==='tool_result').map(c=>JSON.parse(c.content)):[]);
  const last=results.at(-1), displayed=results.some(r=>r.visible===true&&!r.already_open), noOp=last?.already_open;if(last?.card_prepared)assessments.push(last);
  let text='',calls=[];const use=(name,args)=>calls.push({name,arguments:args,call_id:`call_${modelCalls}`});
  if(displayed)text='**To besedilo modela se ob odprtju ne sme prikazati.** '+('Podvajanje vsebine. '.repeat(20));
  else if(noOp)text='To je odjemalec že odprl.';
  // R3.5: after a low card the guide does not open the reveal; it acknowledges and the server appends the add-or-reveal choice.
  else if(last?.next==='offer_continue_or_reveal')text='Dobro, prvi mejnik je tu.';
  else if(/Markdown/.test(message))text='**Krepko** *poševno* `koda`\n- Prva vrstica\n- <img src=x onerror="window.PWNED=1">\n<script>window.PWNED=1</script>';
  else if(/Ponovi/.test(message))use('open_step',{id:ctx.opened.at(-1).id});
  else if(ctx.sealed_key){
   const id=ctx.sealed_key.challenge, ideas=ctx.sealed_key.key_ideas;
   if(ctx.learning.cards[id])use('open_step',{id:ctx.sealed_key.reveal[0].id});
   else if(/Namig/.test(message))use('open_step',{id:ctx.sealed_key.hints.find(h=>!ctx.opened.some(s=>s.id===h.id)).id});
   // Changed (R3.3): the model names achieved key_ideas, path and why; the server derives card, score and stars.
   // Before: card/stars/bonus/explanation and achieved:2 (a number), which the server rejects, so no card was made.
   // R3.4: question_closed (or next: assess_challenge) means assess now instead of asking again.
   else if(/Razlaga/.test(message)||last?.question_closed||last?.details?.next==='assess_challenge')use('assess_challenge',{step:id,path:id==='c2'?'own':'historical',achieved:id==='c2'?[]:id==='c4'?ideas.slice(0,1):ideas,why:id==='c4'?'Gibanje je razloženo, preizkus še ne.':'Preizkus pokaže razliko.',advantages:[]});
   // Changed (R3.3/R3.4): the question names the missing key idea. Before: no idea, so UNKNOWN_IDEA, question_closed and ROUND_LIMIT.
   else if(!ctx.learning.asked.includes(id))use('ask_understanding',{step:id,idea:ideas[1],question:'Zakaj bi tvoja zamisel delovala?'});
   else text='Zakaj bi tvoja zamisel delovala?';
  }else if(ctx.next)use('open_step',{id:ctx.next.id});else text='Kaj želiš raziskati?';
  onText(text);
  const response=provider==='claude'?{content:[...(text?[{type:'text',text}]:[]),...calls.map(c=>({type:'tool_use',id:c.call_id,name:c.name,input:c.arguments}))]}
   :{output:[...(text?[{type:'message',role:'assistant',content:[{type:'output_text',text}]}]:[]),...calls.map(c=>({type:'function_call',...c,arguments:JSON.stringify(c.arguments)}))]};
  return{text,calls:provider==='claude'?calls:calls.map(c=>({...c,arguments:JSON.stringify(c.arguments)})),response};
 }});
const server=createServer(async(req,res)=>{
 try{
  if(req.url.startsWith('/.netlify/functions/')){
   let raw='';for await(const chunk of req)raw+=chunk;
   if(req.method==='POST'){const b=JSON.parse(raw);clientPosts.push(b);}
   const request=new Request(`http://${req.headers.host}${req.url}`,{method:req.method,headers:req.headers,...(raw?{body:raw}:{})});
   const answer=await handler(request);res.writeHead(answer.status,Object.fromEntries(answer.headers));res.end(Buffer.from(await answer.arrayBuffer()));return;
  }
  if(req.url==='/game/_fixture/'||req.url==='/game/_fixture/index.html'){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);return;}
  if(req.url==='/game/_fixture/game.json'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(game));return;}
  if(req.url==='/favicon.ico'){res.writeHead(404);res.end();return;}
  const pathname=new URL(req.url,'http://localhost').pathname, file=path.resolve(root,'public','.'+pathname);
  if(!file.startsWith(path.join(root,'public')+path.sep))throw Error();
  const bytes=await readFile(file);res.writeHead(200,{'Content-Type':pathname.endsWith('.css')?'text/css':'text/javascript'});res.end(bytes);
 }catch(error){res.writeHead(500);res.end('fixture error');report.server_error=String(error);}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}/game/_fixture/`;
// Portable browser: GAME_GUIDE_BROWSER, else Playwright's Chromium, else the cloud container's preinstalled Chromium.
function browserPath(){
 if(process.env.GAME_GUIDE_BROWSER)return process.env.GAME_GUIDE_BROWSER;
 const load=createRequire(import.meta.url);
 for(const name of ['playwright','playwright-core']){try{const exe=load(name).chromium.executablePath();if(exe&&existsSync(exe))return exe;}catch{}}
 return '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
}
async function connect(wsURL){const ws=new WebSocket(wsURL);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});ws.onmessage=e=>{const data=JSON.parse(e.data),p=pending.get(data.id);if(!p)return;pending.delete(data.id);clearTimeout(p.timer);data.error?p.reject(Error(JSON.stringify(data.error))):p.resolve(data.result);};return ws;}
function send(method,params={}){const id=++sequence;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},5000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function until(expression,label){for(let i=0;i<200;i++){if(await evaluate(expression))return;await pause(25);}throw Error('Timed out: '+label);}
async function navigate(reset=true){if(reset)await evaluate('if(location.protocol==="http:")sessionStorage.clear()');await send('Page.navigate',{url});await pause(50);await until(`document.getElementById('gg-status')&&!document.getElementById('gg-status').textContent.includes('Preverjam')`,'ready');}
// One player turn through the real panel; it must end idle, without a stuck notice and without a protocol slip.
async function turn(script){const seen=logs.length;await evaluate(script);await until(`!document.getElementById('gg-mode').disabled`,'turn');const status=await evaluate(`document.getElementById('gg-status').textContent`);assert.ok(!/ni dokončan|trenutno ni/.test(status),status);const slips=logs.slice(seen).filter(slip);assert.ok(!slips.length,'protocol slip: '+JSON.stringify(slips).slice(0,800));}
async function compose(message){await turn(`document.getElementById('gg-input').value=${JSON.stringify(message)};document.getElementById('gg-compose').requestSubmit()`);}
const lastAssistant=()=>evaluate(`document.querySelector('.gg-message[data-role=assistant]:last-child')?.textContent||''`);
const hidden=id=>evaluate(`document.getElementById(${JSON.stringify(id)}).hidden`);
async function screenshot(file){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(path.join(evidence,file),Buffer.from(r.data,'base64'));report.screenshots.push(file);}
try{
 const exe=browserPath();report.browser=path.basename(exe);assert.ok(existsSync(exe),`browser not found: ${exe} (set GAME_GUIDE_BROWSER)`);
 browser=spawn(exe,['--headless','--no-sandbox','--disable-gpu','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-sync','--disable-extensions','about:blank'],{windowsHide:true,stdio:'ignore',env:{...process.env,TEMP:profile,TMP:profile}});
 browser.once('error',error=>{browserError=error;});
 let port;for(let i=0;i<200&&!browserError;i++){try{port=(await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];if(port)break;}catch{}await pause(50);}assert.ok(port,'browser start'+(browserError?': '+browserError.message:''));
 const pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();socket=await connect(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await navigate();
 assert.equal(await evaluate(`document.getElementById('gg-mode').value`),'IZUMLJAJ');assert.equal(await evaluate(`document.querySelector('label[for=gg-input]').textContent`),'Tvoje sporočilo');await screenshot('guide-390.png');
 await turn(`document.querySelector('[data-gg-start] button').click();document.getElementById('gg-start').click()`);
 assert.equal(clientPosts.filter(b=>!b.continuation&&!b.operation).length,1,'single first turn');assert.equal(await hidden('c1'),false);
 const firstReceipt=clientPosts.find(b=>b.continuation)?.receipts[0];assert.equal(firstReceipt.visible,true);assert.equal(firstReceipt.opened,'c1');
 assert.equal(await evaluate(`document.querySelector('#c1 h2').hasAttribute('data-gg-opened')`),true);
 assert.equal(await evaluate(`document.querySelector('[data-gg-start]').hidden`),true);
 assert.equal(await evaluate(`document.querySelector('.gg-message[data-role=assistant]').textContent`),'Na desni se je odprl nov korak. Preberi ga, nato napiši svojo zamisel.');
 report.checks.push('both start buttons dispatch once; challenge opens through real handler; actual visible receipt; scroll/title glow; one-line invitation; exact input label; Invent default');
 const cards=[];
 for(let n=1;n<=5;n++){
  if(n>1)await compose('Naprej.');assert.equal(await hidden(`c${n}`),false);
  if(n===3){await compose('Namig prosim.');assert.equal(await hidden('h3'),false);}
  await compose('Moja zamisel.');assert.equal(await hidden(`r${n}`),true,'reveal waits for understanding');assert.equal(await lastAssistant(),'Zakaj bi tvoja zamisel delovala?');
  await compose('Razlaga: gibanje spremeni stanje, preizkus pa pokaže razliko med potema.');
  if(n===4){
   // Changed (R3.5 + R3.6): a low card (1 of 3 milestones) no longer opens the reveal in the assessment turn. The server adds the
   // add-or-reveal choice, the panel shows Dopolni/Razkrij, and the player's choice opens the reveal without a model call.
   // Full A and B cards (c1, c2, c3, c5) still open the reveal in the assessment turn (r35 test: SESTRA_0217).
   assert.equal(await hidden('r4'),true,'low card holds the reveal');assert.match(await lastAssistant(),/»razkrij«/);
   const calls=modelCalls,posts=clientPosts.length;
   await turn(`[...document.querySelectorAll('.gg-message[data-role=assistant]:last-child .gg-choice-actions button')].find(b=>b.textContent==='Razkrij').click()`);
   assert.equal(modelCalls,calls,'R3.6 choice opens the reveal without a model call');assert.equal(clientPosts.length,posts+1,'one request, no continuation');
  }
  assert.equal(await hidden(`r${n}`),false);
  const card=await lastAssistant();assert.match(card,new RegExp(`Kartica ${n===2?'B':'A'}`));cards.push(card);
  if(n===3){await navigate(false);const restored=await evaluate(`JSON.parse(sessionStorage.getItem('ai8.game.v1:_fixture:development'))`);assert.ok(!('learning'in restored));}
 }
 // Changed (R3.3): stars come from the server, not from the mock. A hint covers its milestones, so c3 (hint opened) has no ✦.
 assert.match(cards[0],/mejniki 2\/2 ✦✦ · 5\/5/);assert.ok(cards[2].includes('mejniki 2/2') && !cards[2].includes('✦'),cards[2]);assert.match(cards[3],/mejniki 1\/3 ✦ · 1,5\/5 \(delno\)/);
 await compose('Naprej.');const summary=await lastAssistant();
 for(let n=1;n<=5;n++)assert.ok(summary.includes(`Izziv ${n} · Kartica`));assert.ok(summary.includes('Kartica B · tvoja pot'));
 assert.equal(clientPosts.filter(b=>!b.continuation&&/Razlaga/.test(b.message||'')).length,5);
 assert.deepEqual(await evaluate(`['h1','h2','h3','h4','h5'].filter(id=>!document.getElementById(id).hidden)`),['h3'],'requested hint only');
 report.checks.push('five challenge openings; requested hint only; understanding before reveal; A/B cards with server-derived stars; low card holds the reveal until the Razkrij choice, which opens it without a model call; coded final summary has all five cards; development produces no mark_result');
 assert.ok(!logs.some(e=>e.kind==='mark_result'));assert.equal(markResultOffered,false,'development tools omit mark_result');
 assert.equal(assessments.length,5);assert.ok(assessments.every(a=>a.record_result===false),'development records no results');
 await compose('Markdown prosim.');assert.equal(await evaluate(`!!document.querySelector('.gg-message:last-child strong')`),true);assert.equal(await evaluate(`!!document.querySelector('.gg-message:last-child em')`),true);assert.equal(await evaluate(`!!document.querySelector('.gg-message:last-child code')`),true);assert.equal(await evaluate(`!!document.querySelector('.gg-message:last-child ul')`),true);
 assert.equal(await evaluate(`!!document.querySelector('.gg-message:last-child img,.gg-message:last-child script')`),false);assert.equal(await evaluate(`window.PWNED||0`),0);
 const messages=await evaluate(`document.querySelectorAll('.gg-message').length`);await compose('Ponovi.');assert.equal(await evaluate(`document.querySelectorAll('.gg-message').length`),messages+1,'no assistant bubble for no-op');
 const snapshot=`({id:JSON.parse(sessionStorage.getItem('ai8.game.v1:_fixture:development')).game_session_id,count:document.querySelectorAll('.gg-message').length,steps:[...document.querySelectorAll('section.g-step')].filter(s=>!s.hidden).map(s=>s.id).join()})`;
 const before=await evaluate(snapshot);await navigate(false);const after=await evaluate(snapshot);assert.deepEqual(after,before);assert.equal(after.id,logID);
 const saved=await evaluate(`JSON.parse(sessionStorage.getItem('ai8.game.v1:_fixture:development'))`);assert.ok(!('results'in saved));assert.ok(!('learning'in saved));
 report.checks.push('escaped markdown rendered; no executable HTML; no-op has no new assistant bubble; reload restores conversation/open steps/same game_session_id; no structured development results');
 await send('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false});await screenshot('guide-1366.png');
 access='anonymous';await navigate();const posts=clientPosts.length;const calls=modelCalls;
 await evaluate(`document.getElementById('gg-start').click();document.getElementById('gg-read-yes').click()`);assert.equal(await hidden('c1'),false);assert.equal(clientPosts.length,posts);assert.equal(modelCalls,calls);
 assert.equal(await evaluate(`document.getElementById('gg-login-details').open`),false);report.checks.push('anonymous reader still warns, opens locally and makes zero POST/provider calls; login folded');
 assert.deepEqual(logs.filter(slip),[],'no protocol slip in the whole run');
 report.model_calls_mock_only=modelCalls;report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error.stack||error);process.exitCode=1;}
finally{
 if(socket){try{await send('Browser.close');}catch{}socket.close();}
 if(browser&&browser.exitCode===null&&browser.signalCode===null&&!browserError){const exited=new Promise(resolve=>browser.once('exit',resolve));await Promise.race([exited,pause(100)]);if(browser.exitCode===null&&browser.signalCode===null){browser.kill();await Promise.race([exited,pause(2000)]);}}
 await rm(profile,{recursive:true,force:true,maxRetries:3}).catch(()=>{});
 server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await writeFile(path.join(evidence,'BROWSER_SMOKE.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
