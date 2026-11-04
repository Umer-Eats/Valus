import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createClient} from '@libsql/client';
import {ensureSchema} from '../server/db.js';
import {createApp} from '../server/app.js';
const db=createClient({url:':memory:'});await ensureSchema(db);
for(const [id,name] of [['host','Practice Host'],['guest','Practice Teammate']])await db.execute({sql:'INSERT INTO users (id,email,display_name,role,community_id) VALUES (?,?,?,?,?)',args:[id,id+'@example.test',name,'student','ppchs']});
const api=createApp({db,verifyToken:async uid=>({uid})});
const root=path.resolve('dist');
const html=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>HOSA Bowl · Local verification</title><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/events.css"><link rel="stylesheet" href="/bowl-game.css"></head><body><div id="app"></div><script type="module">
import {eventWorkspace,parseEventRoute} from '/event-workspace.js';
import {mountBowl} from '/bowl-game.js';
const userId=new URLSearchParams(location.search).get('user')==='guest'?'guest':'host';
const root=document.querySelector('#app');root.innerHTML=eventWorkspace(parseEventRoute('/event/HOSA%20Bowl/bowl'),{brand:'<b>valus · LOCAL TEST</b>',theme:'',userId});
mountBowl(root,{userId,api:async(method,path,body)=>{const res=await fetch('/api'+path,{method,headers:{Authorization:'Bearer '+userId,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const data=await res.json();if(!res.ok)throw Object.assign(new Error(data.error),{status:res.status});return data;}});
</script></body></html>`;
http.createServer(async(req,res)=>{if(req.url.startsWith('/api/'))return api(req,res);const url=new URL(req.url,'http://localhost');if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}try{const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}const data=await readFile(file);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404).end();}}).listen(4175,'127.0.0.1',()=>console.log('Local game verification: http://127.0.0.1:4175'));
