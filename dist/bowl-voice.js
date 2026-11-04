const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function chooseBowlVoices(voices,moderatorURI='',robotURI='') {
 const english=voices.filter(v=>/^en(?:-|_)/i.test(v.lang)||v.lang==='en');
 const pool=english.length?english:voices;
 const moderator=voices.find(v=>v.voiceURI===moderatorURI)||pool.find(v=>v.localService)||pool[0];
 const robot=voices.find(v=>v.voiceURI===robotURI&&v.voiceURI!==moderator?.voiceURI)||pool.find(v=>v.voiceURI!==moderator?.voiceURI)||moderator;
 return {moderator,robot};
}
export const bowlVoicePanel=()=>`<div class="bowl-voice-panel" data-bowl-voice><div class="bowl-voice-buttons"><button type="button" data-voice="sound" aria-pressed="false">Enable sound</button><button type="button" data-voice="mic" aria-pressed="false">Enable voice answers</button><details><summary>Voice settings</summary><div class="bowl-voice-settings"><label>Moderator voice<select data-voice-select="moderator"><option value="">Automatic</option></select></label><label>Robot voice<select data-voice-select="robot"><option value="">Automatic · different voice</option></select></label><button type="button" data-voice="test">Preview both voices</button></div></details></div><p data-voice-status role="status" aria-live="polite">Enable sound to hear the moderator and robot team. Microphone is off.</p><small>Voice answers are optional. Your browser may process speech online. Valus receives the transcript, not a recording. Once enabled, the microphone listens only during your answer window and submits your first recognized answer.</small></div>`;

export function mountBowlVoice(root,{onAnswer,onTranscript,onSpeaker=()=>{},env=globalThis}) {
 const panel=root.querySelector('[data-bowl-voice]'),synth=env.speechSynthesis;
 const Recognition=env.SpeechRecognition||env.webkitSpeechRecognition;
 const status=panel.querySelector('[data-voice-status]'),soundButton=panel.querySelector('[data-voice="sound"]'),micButton=panel.querySelector('[data-voice="mic"]');
 let sound=false,mic=false,disposed=false,game=null,recognition=null,recognitionKey='',generation=0,utteranceGeneration=0;
 let speechKey='',recognized='',submitted=false,deadlineTimer=null,utterance=null,permissionPending=false,stream=null;
 let choices={moderator:'',robot:''};
 const sayStatus=text=>{if(!disposed)status.textContent=text;};
 function cancelSpeech(){utteranceGeneration++;if(synth)synth.cancel();utterance=null;onSpeaker(null);}
 function speak(text,role,seat=null,after=null) {
  if(!sound||!synth||!text||disposed)return;
  cancelSpeech();const generation=utteranceGeneration;
  const voices=chooseBowlVoices(synth.getVoices(),choices.moderator,choices.robot);
  utterance=new env.SpeechSynthesisUtterance(text);utterance.lang='en-US';
  if(voices[role])utterance.voice=voices[role];
  // Pitch/rate still distinguish the robot when a device exposes only one voice.
  utterance.pitch=role==='robot'?.62:1.06;utterance.rate=role==='robot'?1.18:1.08;
  utterance.onstart=()=>{if(!disposed&&generation===utteranceGeneration)onSpeaker({role,seat});};
  utterance.onend=()=>{if(disposed||generation!==utteranceGeneration)return;utterance=null;onSpeaker(null);after?.();};
  utterance.onerror=e=>{if(disposed||generation!==utteranceGeneration)return;onSpeaker(null);if(!['canceled','interrupted'].includes(e.error))sayStatus('Speech playback is unavailable. You can still read and answer on screen.');};
  synth.speak(utterance);
 }
 function populate(){
  const voices=synth?.getVoices()||[];
  for(const role of ['moderator','robot']){
   const select=panel.querySelector(`[data-voice-select="${role}"]`);
   select.innerHTML=`<option value="">Automatic${role==='robot'?' · different voice':''}</option>`+voices.map(v=>`<option value="${esc(v.voiceURI)}">${esc(v.name)} (${esc(v.lang)})</option>`).join('');select.value=choices[role];
  }
 }
 function stopListening(){
  generation++;env.clearTimeout(deadlineTimer);deadlineTimer=null;
  const old=recognition;recognition=null;
  if(old){old.onresult=null;old.onend=null;old.onerror=null;try{old.abort();}catch{}}
  panel.classList.remove('is-listening');onSpeaker(null);
 }
 const ownWindow=g=>g?.status==='playing'&&g.stage==='answer'&&g.buzz?.user===g.you;
 function beginListening(g){
  if(!mic||!Recognition||!ownWindow(g)||disposed)return;
  const key=`${g.code}:${g.questionIndex}:${g.deadline}`;if(recognitionKey===key)return;
  stopListening();cancelSpeech();recognitionKey=key;recognized='';submitted=false;
  const token=generation,question=g.questionIndex,code=g.code;
  const eligible=()=>!disposed&&token===generation&&ownWindow(game)&&game.code===code&&game.questionIndex===question;
  const submit=()=>{
   if(!eligible()||submitted||!recognized.trim())return;
   submitted=true;const text=recognized.trim().slice(0,180);stopListening();sayStatus('Submitting: “'+text+'”');onAnswer(text,question);
  };
  recognition=new Recognition();recognition.lang='en-US';recognition.continuous=false;recognition.interimResults=true;recognition.maxAlternatives=1;
  recognition.onstart=()=>{if(!eligible())return;panel.classList.add('is-listening');sayStatus('Listening — say your answer now.');onSpeaker({role:'student',seat:g.buzz.seat});};
  recognition.onresult=e=>{
   if(!eligible()||submitted)return;
   let transcript='',final=false;
   for(let i=0;i<e.results.length;i++){transcript+=e.results[i][0].transcript+' ';if(e.results[i].isFinal){final=true;break;}}
   recognized=transcript.trim();onTranscript(recognized,question);sayStatus('Heard: “'+recognized+'”');
   if(final)submit();
  };
  recognition.onerror=e=>{if(!eligible())return;const messages={'not-allowed':'Microphone permission was denied. Type your answer or enable voice answers again.','service-not-allowed':'Speech recognition is unavailable in this browser. Type your answer.','audio-capture':'No microphone is available. Type your answer.','network':'Speech recognition could not connect. Type your answer.','no-speech':'No speech detected. Type your answer before time runs out.'};sayStatus(messages[e.error]||'Voice recognition stopped. Type your answer.');stopListening();if(['not-allowed','service-not-allowed'].includes(e.error)){mic=false;syncButtons();}};
  recognition.onend=()=>{if(!eligible())return;if(recognized.trim())submit();else {stopListening();sayStatus('No answer heard. Type your answer before time runs out.');}};
  // Submit the latest transcript before the server deadline, allowing for transit time.
  deadlineTimer=env.setTimeout(()=>{if(!eligible())return;if(recognized.trim())submit();else {stopListening();sayStatus('No speech captured. You can still type before the clock expires.');}},Math.max(0,g.deadline-g.serverNow-700));
  try{recognition.start();}catch{stopListening();sayStatus('Voice recognition could not start. Type your answer.');}
 }
 function syncButtons(){soundButton.textContent=sound?'Sound on · Mute':'Enable sound';soundButton.setAttribute('aria-pressed',String(sound));micButton.textContent=mic?'Voice answers on · Turn off':'Enable voice answers';micButton.setAttribute('aria-pressed',String(mic));micButton.disabled=permissionPending||!Recognition;}
 function update(g){
  game=g;
  if(!ownWindow(g)&&recognition)stopListening();
  if(!g||g.status!=='playing'){if(utterance)cancelSpeech();speechKey='';return;}
  if(ownWindow(g)){if(utterance)cancelSpeech();beginListening(g);return;}
  if(g.stage==='answer'){if(utterance)cancelSpeech();return;}
  if(!sound)return;
  if(g.stage==='robot-answer'&&g.robotSpeech){
   const key='robot:'+g.code+':'+g.robotSpeech.id;
   if(speechKey!==key){speechKey=key;speak(g.robotSpeech.text,'robot',g.robotSpeech.seat);}return;
  }
  if(g.stage==='question'&&g.reading){
   const key='moderator:'+g.code+':'+g.reading.id;
   if(speechKey!==key){
    speechKey=key;
    if(g.serverNow<g.reading.until){
     const elapsed=g.serverNow-g.reading.at;
     const words=g.reading.text.split(' '),skip=elapsed<1500?0:Math.floor(elapsed/450);
     speak(words.slice(skip).join(' '),'moderator');
    }else if(utterance)cancelSpeech();
   }
  }else if(g.stage==='result'&&utterance)cancelSpeech();
 }
 async function click(e){
  const action=e.target.closest('[data-voice]')?.dataset.voice;if(!action)return;
  if(action==='sound'){sound=!sound;if(!sound)cancelSpeech();syncButtons();sayStatus(sound?'Sound enabled. Moderator and robot voices are ready.':'Sound muted.');speechKey='';update(game);return;}
  if(action==='test'){
   if(game?.status==='playing'){sayStatus('Preview voices in the lobby or after the match.');return;}
   sound=true;syncButtons();speak('Welcome to HOSA Bowl. I am your moderator.','moderator',null,()=>speak('Robot team ready. Let the match begin.','robot',0));return;
  }
  if(action==='mic'){
   if(mic){mic=false;stopListening();syncButtons();sayStatus('Microphone off. Use typed answers.');return;}
   if(!Recognition)return;
   permissionPending=true;syncButtons();sayStatus('Allow microphone access to enable voice answers.');
   try{
    if(!env.navigator?.mediaDevices?.getUserMedia)throw new Error('unavailable');
    const acquired=await env.navigator.mediaDevices.getUserMedia({audio:true});
    acquired.getTracks().forEach(t=>t.stop()); // Permission check only; do not leave the mic running.
    if(disposed)return;stream=null;mic=true;recognitionKey='';sayStatus('Voice answers ready. Buzz first, then speak. Your first recognized answer submits automatically.');update(game);
   }catch{sayStatus('Microphone access is unavailable or was denied. Typed answers still work.');}
   finally{permissionPending=false;if(!disposed)syncButtons();}
  }
 }
 function change(e){const role=e.target.dataset.voiceSelect;if(!role)return;choices[role]=e.target.value;}
 const hidden=()=>{if(env.document?.hidden){cancelSpeech();stopListening();}};
 panel.addEventListener('click',click);panel.addEventListener('change',change);synth?.addEventListener?.('voiceschanged',populate);env.document?.addEventListener('visibilitychange',hidden);
 if(!synth||!env.SpeechSynthesisUtterance){soundButton.disabled=true;panel.querySelector('[data-voice="test"]').disabled=true;sayStatus('Spoken playback is unavailable in this browser.');}
 if(!Recognition){micButton.disabled=true;sayStatus('This browser does not support voice answers. Typed answers remain available.');}
 populate();syncButtons();
 return {update,prepareBuzz:cancelSpeech,stopAnswer:stopListening,dispose(){disposed=true;cancelSpeech();stopListening();stream?.getTracks().forEach(t=>t.stop());panel.removeEventListener('click',click);panel.removeEventListener('change',change);synth?.removeEventListener?.('voiceschanged',populate);env.document?.removeEventListener('visibilitychange',hidden);}};
}
