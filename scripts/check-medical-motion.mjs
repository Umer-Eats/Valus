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
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const route of ['student','assignments','analytics','community','my-event','rankings']){
  await page.goto(`http://127.0.0.1:${server.address().port}/#/${route}`);
  const canvas=page.locator('[data-medical]');await canvas.waitFor();
  await page.waitForFunction(()=>['medical-video','cardiac-mri','bloodstream','brain-scan'].includes(document.querySelector('[data-medical]')?.dataset.renderer));
  await page.addStyleTag({content:'body *{visibility:hidden!important} canvas[data-medical]{visibility:visible!important}'});
  await page.evaluate(()=>document.documentElement.dataset.theme='dark');
  await page.waitForTimeout(600);
  const before=await canvas.screenshot();await page.waitForTimeout(400);const after=await canvas.screenshot();
  assert.ok(!before.equals(after),route+' animates');
  await canvas.screenshot({path:`outputs/${route}-medical-detail.png`});
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(250);
  const still=await canvas.screenshot();await page.waitForTimeout(300);
  assert.ok(still.equals(await canvas.screenshot()),route+' respects reduced motion');
  await page.emulateMedia({reducedMotion:'no-preference'});
 }
 assert.deepEqual(errors,[]);console.log('All six medical animation frames change; reduced-motion frames remain still.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
