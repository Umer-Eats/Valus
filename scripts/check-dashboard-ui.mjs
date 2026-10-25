// Local browser QA with an isolated in-memory session, never production accounts.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_ENTRY).href);
const sessionSource=`
const profile={uid:'qa-student',role:'student',event:null,displayName:'Maya Patel',community:{name:'Valus Test Chapter'}};
export const session={ready:true,enrolled:true,user:{uid:'qa-student',email:'qa@example.com'},profile};
const listeners=[];
export const onSession=fn=>listeners.push(fn);
export const setProfile=p=>{session.profile=p;listeners.forEach(fn=>fn());};
export const startSession=()=>{};
export async function api(method,url,body){
 if(url==='/me/event'){if(window.failSave)throw Error('Could not save. Try again.');profile.event=body.event;return {profile:{...profile}};}
 if(url==='/me')return {profile:session.profile};
 if(url==='/rankings')return {students:profile.event?[{displayName:'Maya Patel',event:profile.event,isYou:true}]:[]};
 if(url==='/students')return {students:[{uid:'qa-student',displayName:'Maya Patel',email:'qa@example.com',event:profile.event,progress:0,lastQuizScore:null}]};
 if(url==='/assignments')return {assignments:[]};
 if(url==='/posts')return {posts:[]};
 return {completed:[],progress:0,quizHistory:[]};
}
export const googleSignIn=()=>{},emailSignIn=()=>{},resetPassword=()=>{},createAccount=()=>{},enroll=()=>{},signOut=()=>{};
window.becomeTeacher=()=>{setProfile({...session.profile,role:'instructor'});};
`;
const root=path.resolve('dist');
const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/session.js'){res.setHeader('Content-Type','text/javascript');res.end(sessionSource);return;}
  const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const data=await fs.readFile(target);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.ttf':'font/ttf'})[path.extname(target)]||'application/octet-stream');res.end(data);}
  catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=`http://127.0.0.1:${server.address().port}/`;
 for(const role of ['student','teacher']){
  await page.goto(base+'#/student');
  if(role==='teacher'){await page.evaluate(()=>window.becomeTeacher());await page.evaluate(()=>location.hash='/teacher');}
  for(const route of [role,'assignments','analytics','community',role==='student'?'my-event':'students']){
   await page.evaluate(r=>location.hash='/'+r,route);
   await page.locator('.workspace-main:not(:has(.loading-panel))').waitFor();
   for(const theme of ['light','dark']){
    await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
    await page.waitForTimeout(850);
    assert.equal(await page.locator('[data-medical]').count(),1);
    if(route!==role)assert.equal(await page.locator('[data-medical]').getAttribute('data-renderer'),route==='analytics'?'neuron3d':'webgl','medical renderer initialized');
    if(role==='student'&&route==='student')assert.equal(await page.locator('.greeting-focus').count(),1);
    await page.screenshot({path:`outputs/dashboard-${role}-${route}-${theme}.png`});
   }
  }
 }
 await page.evaluate(()=>location.hash='/teacher');
 await page.locator('.roster-panel').waitFor();
 await page.evaluate(async()=>{const {api}=await import('/session.js');await api('PUT','/me/event',{event:'Medical Terminology'});});
 await page.getByRole('link',{name:'Medical Terminology',exact:true}).waitFor({timeout:20000});
 await page.evaluate(()=>location.hash='/mission');await page.waitForTimeout(900);
 await page.evaluate(()=>location.hash='/leaderboard');await page.waitForTimeout(900);
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>location.hash='/teacher');await page.waitForTimeout(900);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile layout fits');
 await page.screenshot({path:'outputs/dashboard-mobile.png'});
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>location.hash='/analytics');await page.waitForTimeout(300);
 assert.deepEqual(errors,[]);
 console.log('Both roles, all background routes, both themes, mobile and reduced motion passed.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}

