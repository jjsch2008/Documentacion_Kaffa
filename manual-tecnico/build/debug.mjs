import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const CHROME = process.env.CHROME_BIN || `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const input = path.resolve(process.argv[2]);
const profile = await mkdtemp(path.join(tmpdir(), 'kaffa-debug-'));
const port = 9444;
const chrome = spawn(CHROME, ['--headless=new','--no-sandbox','--disable-gpu',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'], {stdio:['ignore','ignore','ignore']});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let ws;
for(let i=0;i<80;i++){try{const r=await fetch(`http://127.0.0.1:${port}/json/list`);const l=await r.json();const p=l.find(t=>t.type==='page');if(p){ws=p.webSocketDebuggerUrl;break;}}catch{}await sleep(250);}
const sock=new WebSocket(ws); let id=0; const pend=new Map();
sock.addEventListener('message',e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);p.resolve(m.result);}});
await new Promise(r=>sock.addEventListener('open',r));
const send=(method,params={})=>new Promise(res=>{const i=++id;pend.set(i,{resolve:res});sock.send(JSON.stringify({id:i,method,params}));});
await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate',{url:`file://${input}`});
for(let i=0;i<120;i++){const r=await send('Runtime.evaluate',{expression:'window.__KAFFA_READY===true',returnByValue:true});if(r.result.value)break;await sleep(500);}
const expr=`(() => {
  const pages=[...document.querySelectorAll('.pagedjs_page')];
  return JSON.stringify({
    ready: window.__KAFFA_READY, error: window.__KAFFA_ERROR, previews: window.__PREVIEW_COUNT,
    bodyChildren: [...document.body.children].map(e=>({tag:e.tagName,id:e.id,cls:e.className,display:getComputedStyle(e).display, kids:e.children.length})),
    pagedContainers: [...document.querySelectorAll('.pagedjs_pages')].map(e=>({cls:e.className, kids:e.children.length, display:getComputedStyle(e).display, parent:e.parentElement.tagName+'.'+e.parentElement.className})),
    pages: pages.length,
    pageTexts: pages.slice(0,6).map(p=>p.innerText.slice(0,60).replace(/\\n/g,' | ')),
    sourceDisplay: document.getElementById('manual-source')?.style.display,
    sourceParent: document.getElementById('manual-source')?.parentElement?.tagName,
  },null,1);
})()`;
const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true});
console.log(r.result.value);
chrome.kill('SIGTERM'); await sleep(300); await rm(profile,{recursive:true,force:true});
process.exit(0);
