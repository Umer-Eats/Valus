import {bowlVoicePanel,mountBowlVoice} from './bowl-voice.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const letters=['A','B','C','D'];
const names=['Easy','Beginner','Developing','Competitive','Advanced','Expert','Extremely difficult'];
export const bowlGamePage=()=>`<section class="bowl-game" data-bowl><header class="bowl-heading"><span class="eyebrow">THE TEAM BUZZER ARENA</span><h2>HOSA Bowl Game</h2><p>Four seats. Two teams. One buzzer at a time.</p></header>${bowlVoicePanel()}<div data-bowl-status role="status" aria-live="polite"></div><div data-bowl-content></div></section>`;
export function mountBowl(root,{api,userId}) {
 const el=root.querySelector('[data-bowl]');if(!el)return ()=>{};
 const content=el.querySelector('[data-bowl-content]'),status=el.querySelector('[data-bowl-status]');
 const key='valus-bowl-'+userId;
 let game=null,code='',timer,clock,disposed=false,seq=0,busy=false,drawKey='',offset=0,lastSuccess=0;
 const voice=mountBowlVoice(el,{onAnswer:(answer,question)=>action('answer',{answer,question}),onTranscript:(text,question)=>{if(game?.questionIndex===question){const input=el.querySelector('[name=answer]');if(input)input.value=text;}}});
 try{code=sessionStorage.getItem(key)||'';}catch{}
 const remember=()=>{try{if(code)sessionStorage.setItem(key,code);else sessionStorage.removeItem(key);}catch{}};
 const button=(label,action,disabled=false,extra='')=>`<button class="button ${extra}" type="button" data-bowl-action="${action}" ${disabled?'disabled':''}>${label}</button>`;
 function setup(mode='choose') {
  drawKey='';voice.update(null);delete el.dataset.playing;
  content.innerHTML=`<div class="bowl-intro"><span class="bowl-badge">LIVE TEAM PRACTICE</span><h3>Bring your team to the table.</h3><p>Host a match against four robots, or join your teammates with a game code. Play solo or with up to four people.</p><div class="bowl-choices">${button('Host a game','host-form')}${button('Join a game','join-form',false,'secondary')}</div></div>
   ${mode==='host'?`<form data-bowl-form="host" class="bowl-setup"><h3>Choose your opponent</h3><p>Higher levels answer more accurately and buzz faster. The host chooses the level for everyone.</p><fieldset class="bowl-levels"><legend>Robot difficulty</legend>${names.map((n,i)=>`<label><input type="radio" name="level" value="${i+1}" ${i===0?'checked':''}><span><b>${i+1}</b>${n}</span></label>`).join('')}</fieldset><button class="button">Create game</button></form>`:mode==='join'?`<form data-bowl-form="join" class="bowl-setup"><h3>Take your seat</h3><label>Game code<input name="code" class="bowl-code-input" placeholder="ABC234" pattern="[A-Za-z2-9]{6}" maxlength="6" required autocomplete="off" autocapitalize="characters"></label><p>The host chooses the robot difficulty. You’ll see it in the lobby before the match starts.</p><button class="button">Join game</button></form>`:''}
   <details class="bowl-rules"><summary>How the match works</summary><p>Normal round: 8 minutes of A → B → C → D matchups. Flash rapid fire: the final 2 minutes are open to everyone. Buzz, then give a short spoken or typed answer within 5 seconds. Correct answers earn 1 point; a miss gives the other team a chance. Maximum 50 questions, with 5 tiebreakers if needed.</p><p>Seats are drawn when the host starts. The host covers unfilled seats for solo or small-team practice. The player who buzzes must answer. Questions are read progressively; an early buzz stops the reading.</p><p>This is a practice simulation with original questions and automatic short-answer matching. It does not simulate the written qualifying test or a tournament bracket. Accepted wording is limited; use the standard term. Live updates refresh about once a second.</p><a href="rules/HOSA-Bowl-26-27.pdf" target="_blank" rel="noreferrer">Read the official event format ↗</a></details>`;
 }
 function render() {
  if(!game)return;
  const g=game,host=g.host===userId;el.dataset.playing=String(g.status==='playing');
  const nextKey=JSON.stringify([g.status,g.stage,g.questionIndex,g.players,g.seats,g.level,g.buzz,g.feedback,g.mayBuzz,g.phase,busy]);
  if(nextKey===drawKey){updateClock();return;}drawKey=nextKey;
  const shared=`<div class="bowl-room-bar"><div><span class="eyebrow">GAME CODE</span><strong class="bowl-code">${esc(g.code)}</strong></div>${button('Copy code','copy',false,'secondary')}<span class="bowl-connection" data-connection>Connected</span>${button(host?'End game':'Leave game',host?'end':'leave',busy,'secondary')}</div>`;
  const level=g.levels[g.level-1];
  if(g.status==='lobby') {
   content.innerHTML=shared+`<div class="bowl-lobby"><span class="bowl-badge">WAITING ROOM · ${g.players.length}/4 PLAYERS</span><h3>Your table is ready.</h3><p>Share the code with teammates. Everyone opens HOSA Bowl Game and selects Join a game.</p><div class="bowl-roster">${g.players.map(p=>`<div><span class="bowl-avatar">${esc(p.name.slice(0,1))}</span><b>${esc(p.name)}</b><small>${p.id===g.host?'Host':'Player'}${p.id===userId?' · You':''}</small></div>`).join('')}</div><label>Robot difficulty<select data-bowl-level ${!host||busy?'disabled':''}>${names.map((n,i)=>`<option value="${i+1}" ${i+1===g.level?'selected':''}>Level ${i+1} · ${n}</option>`).join('')}</select></label><p>Target accuracy: <b>${Math.round(level.accuracy*100)}%</b> · Response time: <b>${(level.min/1000).toFixed(2)}–${(level.max/1000).toFixed(2)} seconds</b> after reading. Each question gets a fresh random outcome and speed.</p><p>Seats A–D are drawn at start. ${g.players.length<4?'The host will cover the empty seats.':''}</p>${host?button('Start game','start',busy):'<p class="bowl-wait">Waiting for the host to start…</p>'}</div>`;
   return;
  }
  if(g.status==='ended') {
   content.innerHTML=`<div class="bowl-summary"><span class="bowl-badge">MATCH ENDED</span><h3>${g.score[0]===g.score[1]?'A tied match.':g.score[0]>g.score[1]?'Your team wins!':'The robot team wins.'}</h3><div class="bowl-final-score">${g.score[0]} <span>–</span> ${g.score[1]}</div><p>Your team / Robot team · Level ${g.level}</p><p>${esc(g.reason)}</p>${button('Back to game setup','reset')}</div>`;return;
  }
  const seats=(robot)=>letters.map((letter,i)=>{
   const p=g.players.find(p=>p.id===g.seats[i]),active=g.phase!=='Normal round'||i===g.activeSeat;
   const own=!robot&&g.seats[i]===userId;
   return `<div class="bowl-seat ${active?'is-active':''} ${own?'is-yours':''} ${!robot&&g.buzz?.seat===i?'is-buzzed':''}"><span class="bowl-seat-person" aria-hidden="true">${robot?'◈':'●'}</span><b>${letter}</b><span>${robot?'Robot '+letter:esc(p?.name||'Host')}</span><small>${own?'Your seat':robot?'Level '+g.level:'Teammate'}</small></div>`;
  }).join('');
  const mySeats=g.seats.map((id,i)=>id===userId?i:-1).filter(i=>i>=0);
  const canBuzz=mySeats.find(i=>g.phase!=='Normal round'||i===g.activeSeat);
  content.innerHTML=shared+`<div class="bowl-scoreboard"><div><span>YOUR TEAM</span><strong>${g.score[0]}</strong></div><div class="bowl-round"><span>${esc(g.phase)}</span><strong data-match-clock></strong><small>Question ${g.questionIndex+1} · ${g.phase==='Normal round'?letters[g.activeSeat]+' vs '+letters[g.activeSeat]:'All seats may buzz'}</small></div><div><span>ROBOT TEAM · L${g.level}</span><strong>${g.score[1]}</strong></div></div>
   <div class="bowl-arena bowl-seat-strip" aria-label="Team seat assignments"><div class="bowl-moderator"><span>MODERATOR</span><b>${g.stage==='answer'?'Player '+letters[g.buzz.seat]+', answer now':g.stage==='result'?'Scorekeeper':'Listen to the question'}</b></div><div class="bowl-tables"><div><p>YOUR TEAM</p><div class="bowl-table">${seats(false)}</div></div><div><p>ROBOT TEAM</p><div class="bowl-table">${seats(true)}</div></div></div></div>
   <div class="bowl-question"><div class="bowl-question-meta"><span>${g.stage==='result'?'QUESTION COMPLETE':g.stage==='answer'?'ANSWER WINDOW':g.stage==='robot-answer'?'ROBOT ANSWERING':'ON THE BUZZER'}</span><span data-question-clock></span></div><h3 data-prompt>${esc(g.prompt)}</h3><p role="status">${esc(g.feedback||'')}</p><div class="bowl-controls">${g.stage==='robot-answer'?'<p class="bowl-spoken-answer">Robot '+letters[g.robotSpeech?.seat??0]+': &ldquo;'+esc(g.robotSpeech?.text||'…')+'&rdquo;</p>':g.stage==='answer'&&g.buzz.user===userId?'<form data-bowl-form="answer"><label class="sr-only" for="bowl-answer">Your answer</label><input id="bowl-answer" name="answer" placeholder="Type your answer…" maxlength="180" required autocomplete="off"><button class="button">Submit answer</button></form>':g.stage==='answer'?'<p>Waiting for the player who buzzed to answer…</p>':g.stage==='result'?'<p>The next question starts automatically.</p>':button(canBuzz===undefined?'Wait for your letter':'BUZZ IN · '+letters[canBuzz],'buzz',busy||!g.mayBuzz||canBuzz===undefined,'bowl-buzzer')}</div></div>
   <p class="bowl-hint">${g.phase==='Normal round'?'No team discussion in the normal round.':'Team discussion is allowed; the player who buzzes must answer.'} You control ${mySeats.map(i=>letters[i]).join(', ')}.</p><details class="bowl-rules"><summary>Recent scoring</summary>${g.log.map(l=>`<p>Q${l.number}: ${esc(l.message)} (${l.score.join('–')})</p>`).join('')||'<p>No points awarded yet.</p>'}</details>`;
  updateClock();
  if(g.stage==='answer'&&g.buzz.user===userId)el.querySelector('[name=answer]')?.focus();
 }
 function updateClock(){
  if(!game)return;const now=Date.now()+offset;
  const remaining=Math.max(0,Math.ceil((game.started+600000-now)/1000));
  const match=content.querySelector('[data-match-clock]');if(match)match.textContent=game.phase==='Tiebreaker'?'TIE':`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`;
  const q=el.querySelector('[data-question-clock]');if(q)q.textContent=game.stage==='answer'?Math.max(0,Math.ceil((game.deadline-now)/1000))+'s to answer':game.stage==='question'?Math.max(0,Math.ceil((game.deadline-now)/1000))+'s remaining':'';
  const prompt=el.querySelector('[data-prompt]');if(prompt)prompt.textContent=game.prompt;
  const connection=content.querySelector('[data-connection]');if(connection)connection.textContent=Date.now()-lastSuccess>4000?'Reconnecting…':'Connected';
 }
 function accept(g){game=g;code=g.code;remember();offset=g.serverNow-Date.now();lastSuccess=Date.now();status.textContent='';render();voice.update(g);}
 async function poll(){
  if(disposed)return;
  if(code&&!busy&&game?.status!=='ended'){
   const request=++seq;
   try{const g=await api('GET','/bowl/'+code);if(!disposed&&request===seq)accept(g);}
   catch(e){if(!disposed&&request===seq){status.textContent=e.message;if(e.status===404||e.status===403){code='';game=null;remember();setup();}}}
  }
  if(!disposed)timer=setTimeout(poll,750);
 }
 async function action(name,body={}) {
  if(busy||disposed)return;busy=true;const request=++seq;
  try{
   const path=name==='create'?'/bowl':'/bowl/'+(body.code||code)+'/'+name;
   const g=await api('POST',path,body);
   if(disposed||request!==seq)return;
   busy=false;
   if(name==='leave'){code='';game=null;remember();setup();}else accept(g);
  }catch(e){if(!disposed){status.textContent=e.message;}}
  finally{busy=false;}
 }
 const click=async e=>{
  const a=e.target.closest('[data-bowl-action]')?.dataset.bowlAction;if(!a)return;
  if(a==='host-form'||a==='join-form'){setup(a==='host-form'?'host':'join');return;}
  if(a==='reset'){game=null;code='';remember();setup();return;}
  if(a==='copy'){try{await navigator.clipboard.writeText(code);status.textContent='Game code copied.';}catch{status.textContent='Your game code is '+code;}return;}
  if(a==='buzz'){voice.prepareBuzz();const seat=game.seats.findIndex((id,i)=>id===userId&&(game.phase!=='Normal round'||i===game.activeSeat));await action('buzz',{seat,question:game.questionIndex});return;}
  await action(a);
 };
 const submit=e=>{
  const form=e.target.closest('[data-bowl-form]');if(!form)return;e.preventDefault();
  const data=new FormData(form),kind=form.dataset.bowlForm;
  if(kind==='host')action('create',{level:Number(data.get('level'))});
  if(kind==='join')action('join',{code:String(data.get('code')).trim().toUpperCase()});
  if(kind==='answer'){voice.stopAnswer();action('answer',{question:game.questionIndex,answer:data.get('answer')});}
 };
 const change=e=>{if(e.target.matches('[data-bowl-level]'))action('level',{level:Number(e.target.value)});};
 el.addEventListener('click',click);el.addEventListener('submit',submit);el.addEventListener('change',change);
 if(code)content.innerHTML='<p>Reconnecting to your game…</p>';else setup();
 poll();clock=setInterval(updateClock,200);
 return ()=>{disposed=true;voice.dispose();clearTimeout(timer);clearInterval(clock);el.removeEventListener('click',click);el.removeEventListener('submit',submit);el.removeEventListener('change',change);};
}
