import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@libsql/client';
import {ensureSchema} from '../server/db.js';
import {createGame,actGame,advanceGame,publicGame,LEVELS,robotAttempt,bowlRequest} from '../server/bowl.js';
import {BOWL_QUESTIONS} from '../server/bowl-questions.js';
import {parseEventRoute} from '../dist/event-workspace.js';
const host={id:'host',display_name:'Host'},guest={id:'guest',display_name:'Guest'};
const start=()=>actGame(createGame('ABC234',host,1,1000),host,'start',{},1000);

test('game includes all 300 practice questions alongside the original 65 with correct answer mapping',async()=>{
 const {isCorrect}=await import('../server/bowl-questions.js');
 assert.equal(BOWL_QUESTIONS.length,365);
 assert.equal(new Set(BOWL_QUESTIONS.map(q=>q.id)).size,365);
 assert.equal(BOWL_QUESTIONS[0].prompt,'What is the basic functional unit of the kidney?');
 for(let i=1;i<=6;i++){
  const {default:practice}=await import('../dist/practice/hosa-bowl-'+i+'.js');
  const imported=BOWL_QUESTIONS.filter(q=>q.sourceTest===practice.id);
  assert.equal(imported.length,50);
  imported.forEach(q=>{
   const original=practice.questions[q.sourceQuestion];
   assert.ok(q.prompt.startsWith(original.prompt));
   original.options.forEach(option=>assert.ok(q.prompt.includes(option)));
   assert.equal(isCorrect(q,original.options[original.answer]),true);
   assert.equal(isCorrect(q,'ABCD'[original.answer]),true);
   original.options.forEach((option,j)=>{if(j!==original.answer){assert.equal(isCorrect(q,option),false);assert.equal(isCorrect(q,'ABCD'[j]),false);}});
  });
 }
 assert.equal(createGame('ABC234',host,1).deck.length,365);
});

test('game tool belongs only to HOSA Bowl',()=>{
 assert.equal(parseEventRoute('/event/HOSA%20Bowl/bowl').valid,true);
 assert.equal(parseEventRoute('/event/Medical%20Terminology/bowl').valid,false);
});
test('seven progressively faster and more accurate difficulty levels',()=>{
 assert.equal(LEVELS.length,7);
 for(let i=1;i<7;i++){
  assert.ok(LEVELS[i].accuracy>LEVELS[i-1].accuracy);
  assert.ok(LEVELS[i].min<LEVELS[i-1].min);
  assert.ok(LEVELS[i].max<LEVELS[i-1].max);
 }
 assert.equal(robotAttempt(1,()=>0).correct,true);
 assert.equal(robotAttempt(7,()=>.999).correct,false);
 assert.ok(robotAttempt(1,()=>.9).delay>robotAttempt(1,()=>.1).delay);
 assert.throws(()=>createGame('ABC234',host,8));
});
test('host authority, four-player capacity, randomized seats and solo coverage',()=>{
 const g=createGame('ABC234',host,3,1000);
 actGame(g,guest,'join',{},1000);
 assert.throws(()=>actGame(g,guest,'start',{},1000),/Only the host/);
 assert.throws(()=>actGame(g,guest,'end',{},1000),/Only the host/);
 actGame(g,{id:'third'},'join',{},1000);actGame(g,{id:'fourth'},'join',{},1000);
 assert.throws(()=>actGame(g,{id:'fifth'},'join',{},1000),/filled/);
 actGame(g,host,'start',{},1000);
 assert.equal(new Set(g.seats).size,4);
 assert.deepEqual(start().seats,['host','host','host','host']);
 assert.throws(()=>actGame(g,{id:'late'},'join',{},1000),/already/);
});
test('normal round rotates A B C D and only buzz owner can answer',()=>{
 const g=start();
 for(let i=0;i<5;i++){
  const now=g.questionAt+100;
  assert.equal(publicGame(g,host,now).activeSeat,i%4);
  assert.throws(()=>actGame(g,host,'buzz',{question:i,seat:(i+1)%4},now),/letter/);
  actGame(g,host,'buzz',{question:i,seat:i%4},now);
  assert.throws(()=>actGame(g,host,'buzz',{question:i,seat:i%4},now),/cannot buzz/);
  actGame(g,host,'answer',{question:i,answer:BOWL_QUESTIONS[g.deck[i]].answers[0]},now+10);
  assert.equal(g.score[0],i+1);
  advanceGame(g,g.deadline);
 }
});
test('wrong answers and timeouts give the robot a chance without double scoring',()=>{
 const g=start();actGame(g,host,'buzz',{seat:0,question:0},1100);
 advanceGame(g,6100);assert.deepEqual(g.tried,[0]);
 assert.throws(()=>actGame(g,host,'buzz',{seat:0,question:0},6101),/cannot buzz/);
 g.robot.correct=true;advanceGame(g,g.robot.at);assert.equal(g.stage,'robot-answer');advanceGame(g,g.deadline);
 assert.equal(g.score[1],1);assert.equal(g.stage,'result');
 advanceGame(g,g.deadline-1);assert.equal(g.score[1],1);
});
test('robot miss permits the human rebound and hides answer keys and random outcomes',()=>{
 const g=start();g.robot.correct=false;advanceGame(g,g.robot.at);advanceGame(g,g.deadline);
 assert.deepEqual(g.tried,[1]);
 const view=publicGame(g,host,g.questionAt);
 assert.equal(view.mayBuzz,true);
 assert.equal(view.robot,undefined);assert.equal(view.deck,undefined);
 assert.equal(view.answers,undefined);
 actGame(g,host,'buzz',{question:0,seat:0},g.questionAt+100);
 actGame(g,host,'answer',{question:0,answer:'wrong'},g.questionAt+200);
 assert.equal(g.stage,'result');assert.deepEqual(g.score,[0,0]);
});
test('flash opens all seats, end is enforced and tie ends after five items',()=>{
 const g=start();g.stage='result';g.deadline=g.started+480000;
 advanceGame(g,g.deadline);
 assert.equal(publicGame(g,host,g.questionAt).phase,'Flash rapid fire');
 actGame(g,host,'buzz',{seat:3,question:g.questionIndex},g.questionAt+100);
 g.stage='result';g.deadline=g.started+600000;g.score=[2,2];
 advanceGame(g,g.deadline);assert.equal(g.round,'Tiebreaker');
 for(let i=0;i<5;i++){g.stage='result';g.deadline+=100;advanceGame(g,g.deadline);}
 assert.equal(g.status,'ended');assert.match(g.reason,/Draw/);
});
test('stale answers, unassigned seats and non-buzzer responses are rejected',()=>{
 const g=createGame('ABC234',host,1,1000);actGame(g,guest,'join',{},1000);actGame(g,host,'start',{},1000);
 const who=g.seats[0]===host.id?host:guest,other=who===host?guest:host;
 assert.throws(()=>actGame(g,other,'buzz',{seat:0,question:0},1100),/assigned/);
 actGame(g,who,'buzz',{seat:0,question:0},1100);
 assert.throws(()=>actGame(g,other,'answer',{question:0,answer:'x'},1200),/Only the player/);
 assert.throws(()=>actGame(g,who,'answer',{question:99,answer:'x'},1200),/finished/);
});

test('robot speech is published only after buzzing and blocks overlapping human answers',()=>{
 const g=start();const before=publicGame(g,host,g.questionAt);
 assert.equal(before.robotSpeech,null);assert.equal(before.reading.text,BOWL_QUESTIONS[g.deck[0]].prompt);
 g.robot.correct=true;g.robot.answer=BOWL_QUESTIONS[g.deck[0]].answers[0];
 advanceGame(g,g.robot.at);
 const during=publicGame(g,host,g.robot.at);
 assert.equal(during.stage,'robot-answer');assert.equal(during.robotSpeech.text,g.robot.answer);
 assert.equal(during.mayBuzz,false);assert.equal(during.reading,null);
 assert.throws(()=>actGame(g,host,'buzz',{seat:0,question:0},g.robot.at+100),/cannot buzz/);
 advanceGame(g,g.deadline);assert.equal(g.score[1],1);
});
test('durable multiplayer state serializes concurrent joins and buzzes across clients',async()=>{
 const db=createClient({url:':memory:'});await ensureSchema(db);
 try{
  const call=(user,action,body={},code='')=>bowlRequest({db,body,params:{code}},user,action);
  const room=await call(host,'create',{level:2});
  const players=[guest,{id:'third',display_name:'Third'},{id:'fourth',display_name:'Fourth'}];
  await Promise.all(players.map(p=>call(p,'join',{},room.code)));
  let g=await call(host,'state',{},room.code);assert.equal(g.players.length,4);
  await assert.rejects(call({id:'outsider'},'state',{},room.code),/Join/);
  await assert.rejects(call(guest,'start',{},room.code),/Only the host/);
  g=await call(host,'start',{},room.code);
  const owner=[host,...players].find(p=>p.id===g.seats[0]);
  const results=await Promise.allSettled([call(owner,'buzz',{seat:0,question:0},room.code),call(owner,'buzz',{seat:0,question:0},room.code)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  g=await call(guest,'state',{},room.code);assert.equal(g.buzz.user,owner.id);
  await call(host,'end',{},room.code);
  assert.equal((await call(guest,'state',{},room.code)).status,'ended');
 }finally{db.close();}
});
