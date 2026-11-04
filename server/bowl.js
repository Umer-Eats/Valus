import {randomInt} from 'node:crypto';
import {AppError} from './http.js';
import {BOWL_QUESTIONS, isCorrect} from './bowl-questions.js';

export const LEVELS = [
 {name:'Easy',accuracy:.30,min:3300,max:4800},
 {name:'Beginner',accuracy:.42,min:2800,max:4200},
 {name:'Developing',accuracy:.55,min:2300,max:3600},
 {name:'Competitive',accuracy:.68,min:1800,max:3000},
 {name:'Advanced',accuracy:.80,min:1300,max:2400},
 {name:'Expert',accuracy:.90,min:800,max:1700},
 {name:'Extremely difficult',accuracy:.97,min:350,max:1000},
];
const random = () => randomInt(1_000_000)/1_000_000;
export function robotAttempt(level, rng=random) {
 const d=LEVELS[level-1];
 return {correct:rng()<d.accuracy,delay:Math.round(d.min+rng()*(d.max-d.min))};
}
const shuffle = values => {
 const result=[...values];
 for(let i=result.length-1;i>0;i--){const j=randomInt(i+1);[result[i],result[j]]=[result[j],result[i]];}
 return result;
};
export function createGame(code,user,level,now=Date.now()) {
 if(!Number.isInteger(level)||level<1||level>7)throw new AppError(400,'Choose a robot level from 1 to 7.');
 return {code,host:user.id,level,status:'lobby',players:[{id:user.id,name:user.display_name}],seats:[],score:[0,0],created:now,expires:now+2*60*60_000,questionIndex:-1,deck:shuffle(BOWL_QUESTIONS.map(q=>q.id)),log:[]};
}
const fail=(status,message)=>{throw new AppError(status,message);};
const question=g=>BOWL_QUESTIONS[g.deck[g.questionIndex]];
const readingDuration=g=>Math.max(4500,question(g).prompt.split(' ').length*450);
export const phase = g => g.round || 'Normal round';
function scheduleRobot(g,at) {
 const seats=phase(g)==='Normal round'?[g.questionIndex%4]:[0,1,2,3];
 g.robot=seats.map(seat=>{const attempt=robotAttempt(g.level);return {...attempt,at:at+attempt.delay,seat};})
  .sort((a,b)=>a.at-b.at)[0];
 const wrong=BOWL_QUESTIONS.filter(q=>q.id!==question(g).id&&!isCorrect(question(g),q.answers[0]));
 g.robot.answer=g.robot.correct?question(g).answers[0]:wrong[randomInt(wrong.length)].answers[0];
}
function nextQuestion(g,at) {
 if(g.questionIndex>=0 && (at>=g.started+600_000||g.questionIndex>=49) && !g.tie) {
  if(g.score[0]!==g.score[1]){g.status='ended';g.reason='Match complete';return;}
  g.tie=true;g.tieStart=g.questionIndex+1;
 }
 if(g.tie&&g.questionIndex>=g.tieStart+4){g.status='ended';g.reason=g.score[0]===g.score[1]?'Draw after five tiebreakers (written-test seeding is not simulated)':'Tiebreaker complete';return;}
 g.questionIndex++;g.questionAt=at;g.stage='question';g.tried=[];g.buzz=null;g.feedback='';
 g.lastBuzzer=null;
 g.robotSpeech=null;
 g.round=g.tie?'Tiebreaker':at>=g.started+480_000?'Flash rapid fire':'Normal round';
 g.readUntil=at+readingDuration(g);
 g.deadline=g.readUntil+5000;
 scheduleRobot(g,g.readUntil);
}
function finishQuestion(g,at,message) {
 g.stage='result';g.feedback=message;g.deadline=at+2200;
 g.log.unshift({number:g.questionIndex+1,message,score:[...g.score]});g.log=g.log.slice(0,8);
}
function result(g,team,correct,at) {
 if(correct){g.score[team]++;finishQuestion(g,at,`${team===0?'Your team':'Robot team'} earns 1 point.`);return;}
 g.tried.push(team);g.buzz=null;
 if(g.tried.length===2){finishQuestion(g,at,'Both teams missed. No point.');return;}
 g.stage='question';g.feedback=`${team===0?'Your team':'Robot team'} missed. ${team===0?'Robot team':'Your team'} may answer the reread.`;
 g.questionAt=at;
 g.readUntil=at+readingDuration(g);g.deadline=g.readUntil+5000;
 if(team===0)scheduleRobot(g,g.readUntil);
}
// Deadlines, random outcomes and first-buzzer ownership are decided only on the server.
// Catch-up uses event timestamps, so disconnected clients cannot pause the match.
export function advanceGame(g,now=Date.now()) {
 for(let i=0;g.status==='playing'&&i<250;i++) {
  if(g.stage==='result'){if(now<g.deadline)break;nextQuestion(g,g.deadline);continue;}
  if(g.stage==='answer'){if(now<g.deadline)break;result(g,0,false,g.deadline);continue;}
  if(g.stage==='robot-answer'){if(now<g.deadline)break;result(g,1,g.robot.correct,g.deadline);continue;}
  if(!g.tried.includes(1)&&g.robot.at<=now&&g.robot.at<=g.deadline){
   g.lastBuzzer={team:1,seat:g.robot.seat};g.stage='robot-answer';
   const answer=g.robot.answer||(g.robot.correct?question(g).answers[0]:'I do not know');
   g.deadline=g.robot.at+Math.max(2400,answer.split(' ').length*450+1200);
   g.robotSpeech={id:`${g.questionIndex}:${g.robot.at}`,text:answer,seat:g.robot.seat,at:g.robot.at,until:g.deadline};
   continue;
  }
  if(now<g.deadline)break;
  finishQuestion(g,g.deadline,'No answer in time. No point.');
 }
 if(g.status==='playing'&&!g.tie&&now>=g.started+480_000)g.round='Flash rapid fire';
 return g;
}
export function actGame(g,user,action,body={},now=Date.now()) {
 advanceGame(g,now);
 const player=g.players.find(p=>p.id===user.id);
 if(action==='join') {
  if(player)return g;
  if(g.status!=='lobby')fail(409,'This match has already started or ended.');
  if(g.players.length>=4)fail(409,'All four player seats are filled.');
  g.players.push({id:user.id,name:user.display_name});return g;
 }
 if(!player)fail(403,'Join this game first.');
 if(['start','end','level'].includes(action)&&g.host!==user.id)fail(403,'Only the host can do that.');
 if(action==='end'){g.status='ended';g.reason='Ended by the host';return g;}
 if(action==='level'){
  if(g.status!=='lobby')fail(409,'Difficulty is locked during the match.');
  if(!Number.isInteger(body.level)||body.level<1||body.level>7)fail(400,'Choose a level from 1 to 7.');
  g.level=body.level;return g;
 }
 if(action==='leave'){
  if(g.host===user.id){g.status='ended';g.reason='The host left the game';}
  else {g.players=g.players.filter(p=>p.id!==user.id);g.seats=g.seats.map(id=>id===user.id?g.host:id);}
  return g;
 }
 if(action==='start'){
  if(g.status!=='lobby')fail(409,'This game has already started.');
  g.seats=shuffle([...g.players.map(p=>p.id),...Array(4-g.players.length).fill(g.host)]);
  g.status='playing';g.started=now;nextQuestion(g,now);return g;
 }
 if(!['buzz','answer'].includes(action))fail(400,'Unknown game action.');
 if(g.status!=='playing')fail(409,'The match is not running.');
 if(body.question!==g.questionIndex)fail(409,'That question has already finished.');
 if(action==='buzz'){
  if(g.stage!=='question'||g.tried.includes(0))fail(409,'Your team cannot buzz now.');
  const seat=body.seat;
  if(!Number.isInteger(seat)||seat<0||seat>3||g.seats[seat]!==user.id)fail(403,'Use your assigned seat.');
  if(phase(g)==='Normal round'&&seat!==g.questionIndex%4)fail(409,'Wait for your letter to answer.');
  g.frozenWords=Math.max(1,Math.floor((now-g.questionAt)/450));
  g.lastBuzzer={team:0,seat};
  g.stage='answer';g.buzz={user:user.id,seat};g.deadline=now+5000;return g;
 }
 if(g.stage!=='answer'||g.buzz?.user!==user.id)fail(403,'Only the player who buzzed may answer.');
 if(typeof body.answer!=='string'||body.answer.length>180)fail(400,'Enter a short answer (up to 180 characters).');
 result(g,0,isCorrect(question(g),body.answer),now);return g;
}
export function publicGame(g,user,now=Date.now()) {
 const {code,host,level,status,players,seats,score,questionIndex,started,stage,deadline,buzz,feedback,reason,log,expires,lastBuzzer}=g;
 let prompt=null;
 if(status==='playing') {
  const words=question(g).prompt.split(' ');
  const visible=stage==='question'?Math.max(1,Math.floor((now-g.questionAt)/450)):stage==='answer'?g.frozenWords:words.length;
  prompt=words.slice(0,visible).join(' ')+(visible<words.length?' …':'');
 }
 return {code,host,level,status,players,seats,score,questionIndex,started,stage,deadline,buzz,feedback,reason,log,expires,lastBuzzer,
  phase:phase(g),activeSeat:questionIndex%4,prompt,serverNow:now,you:user.id,
  reading:status==='playing'&&stage==='question'?{id:`${questionIndex}:${g.questionAt}`,text:question(g).prompt,at:g.questionAt,until:g.readUntil}:null,
  robotSpeech:g.robotSpeech||null,
  mayBuzz:status==='playing'&&stage==='question'&&!g.tried.includes(0),levels:LEVELS};
}
export async function bowlRequest(ctx,user,action) {
 const now=Date.now();
 if(action==='create') {
  await ctx.db.execute({sql:'DELETE FROM bowl_games WHERE expires <= ?',args:[now]});
  const count=await ctx.db.execute({sql:'SELECT COUNT(*) AS n FROM bowl_games WHERE host = ? AND expires > ?',args:[user.id,now]});
  if(Number(count.rows[0].n)>=12)fail(429,'You have created several recent games. Rejoin one or try again later.');
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for(let attempt=0;attempt<5;attempt++) {
   const code=Array.from({length:6},()=>alphabet[randomInt(alphabet.length)]).join('');
   const g=createGame(code,user,ctx.body.level,now);
   const insert=await ctx.db.execute({sql:'INSERT OR IGNORE INTO bowl_games (code,host,state,version,expires) VALUES (?,?,?,0,?)',args:[code,user.id,JSON.stringify(g),g.expires]});
   if(insert.rowsAffected)return publicGame(g,user,now);
  }
  fail(503,'Could not create a game. Please try again.');
 }
 const code=String(ctx.params.code||'').toUpperCase();
 if(!/^[A-Z2-9]{6}$/.test(code))fail(400,'Enter the six-character game code.');
 // Optimistic compare-and-swap works across serverless instances and serializes buzzes.
 for(let retry=0;retry<12;retry++) {
  const record=(await ctx.db.execute({sql:'SELECT state,version FROM bowl_games WHERE code = ? AND expires > ?',args:[code,Date.now()]})).rows[0];
  if(!record)fail(404,'Game not found or expired. Check your code.');
  const g=JSON.parse(record.state), tick=Date.now();
  if(action!=='join'&&!g.players.some(p=>p.id===user.id))fail(403,'Join this game first.');
  if(action==='state')advanceGame(g,tick);else actGame(g,user,action,ctx.body,tick);
  const state=JSON.stringify(g);
  if(state===record.state)return publicGame(g,user,tick);
  const saved=await ctx.db.execute({sql:'UPDATE bowl_games SET state = ?, version = version + 1 WHERE code = ? AND version = ?',args:[state,code,Number(record.version)]});
  if(saved.rowsAffected)return publicGame(g,user,tick);
 }
 fail(409,'Another player acted at the same time. Please try again.');
}
