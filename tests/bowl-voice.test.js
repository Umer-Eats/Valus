import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseBowlVoices,mountBowlVoice} from '../dist/bowl-voice.js';

const voices=[{voiceURI:'one',name:'Moderator',lang:'en-US',localService:true},{voiceURI:'two',name:'Robot',lang:'en-GB',localService:true}];
function harness({recognition=true}={}) {
 const nodes=new Map(),listeners=new Map(),spoken=[],answers=[],transcripts=[],speakers=[],timers=new Map();
 const node=()=>({textContent:'',value:'',disabled:false,innerHTML:'',setAttribute(){}});
 const panel={querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},classList:{add(){},remove(){}},addEventListener(k,v){listeners.set(k,v);},removeEventListener(k){listeners.delete(k);}};
 let activeRecognition=null,permissions=0,stoppedTracks=0,cancels=0,nextTimer=0;
 class FakeRecognition{constructor(){activeRecognition=this;}start(){this.onstart?.();}abort(){this.aborted=true;}}
 const env={speechSynthesis:{getVoices:()=>voices,speak:u=>{spoken.push(u);u.onstart?.();},cancel:()=>{cancels++;},addEventListener(){},removeEventListener(){}},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},SpeechRecognition:recognition?FakeRecognition:undefined,navigator:{mediaDevices:{getUserMedia:async()=>{permissions++;return {getTracks:()=>[{stop(){stoppedTracks++;}}]};}}},document:{hidden:false,addEventListener(){},removeEventListener(){}},setTimeout:fn=>{timers.set(++nextTimer,fn);return nextTimer;},clearTimeout:id=>timers.delete(id)};
 const controller=mountBowlVoice({querySelector:()=>panel},{env,onAnswer:(...a)=>answers.push(a),onTranscript:(...a)=>transcripts.push(a),onSpeaker:s=>speakers.push(s)});
 const click=action=>listeners.get('click')({target:{closest:()=>({dataset:{voice:action}})}});
 return {controller,click,spoken,answers,transcripts,speakers,nodes,timers,get recognition(){return activeRecognition;},get permissions(){return permissions;},get stoppedTracks(){return stoppedTracks;},get cancels(){return cancels;}};
}
const reading={code:'ABC234',you:'host',status:'playing',stage:'question',questionIndex:0,serverNow:1100,reading:{id:'0:1000',text:'What is the basic functional unit of the kidney?',at:1000,until:6000}};
const answering={...reading,stage:'answer',buzz:{user:'host',seat:0},deadline:6100};

test('moderator and robot use distinct voices, with a one-voice fallback',()=>{
 assert.notEqual(chooseBowlVoices(voices).moderator.voiceURI,chooseBowlVoices(voices).robot.voiceURI);
 assert.equal(chooseBowlVoices(voices,'two','two').robot.voiceURI,'one');
 assert.equal(chooseBowlVoices([voices[0]]).robot,voices[0]);
 assert.equal(chooseBowlVoices([]).moderator,undefined);
});
test('speech requires opt-in, narrates once per reading, and stops on a human buzzer',async()=>{
 const h=harness();h.controller.update(reading);assert.equal(h.spoken.length,0);
 await h.click('sound');assert.equal(h.spoken.length,1);
 h.controller.update({...reading,serverNow:1800});assert.equal(h.spoken.length,1);
 const cancels=h.cancels;h.controller.update(answering);assert.ok(h.cancels>cancels);
 h.controller.update({...reading,stage:'robot-answer',robotSpeech:{id:'r1',text:'nephron',seat:2}});
 assert.equal(h.spoken.at(-1).text,'nephron');assert.equal(h.spoken.at(-1).voice.voiceURI,'two');
 assert.notEqual(h.spoken[0].pitch,h.spoken.at(-1).pitch);
 h.controller.dispose();
});
test('microphone is opt-in, closes the permission-check stream, and submits once for the buzzer owner',async()=>{
 const h=harness();h.controller.update(answering);assert.equal(h.permissions,0);assert.equal(h.recognition,null);
 await h.click('mic');assert.equal(h.permissions,1);assert.equal(h.stoppedTracks,1);
 const recognition=h.recognition;assert.ok(recognition);
 const handler=recognition.onresult;
 handler({results:[Object.assign([{transcript:'nephron'}],{isFinal:true})]});
 handler({results:[Object.assign([{transcript:'second answer'}],{isFinal:true})]});
 assert.deepEqual(h.answers,[['nephron',0]]);assert.equal(recognition.aborted,true);
 h.controller.dispose();
});
test('late transcripts, other players and typed submission cannot submit a spoken answer',async()=>{
 const h=harness();await h.click('mic');
 h.controller.update({...answering,buzz:{user:'other',seat:0}});assert.equal(h.recognition,null);
 h.controller.update(answering);const late=h.recognition.onresult;
 h.controller.update({...reading,questionIndex:1});
 late({results:[Object.assign([{transcript:'late'}],{isFinal:true})]});assert.equal(h.answers.length,0);
 h.controller.update({...answering,questionIndex:1,deadline:9000});const typedRace=h.recognition.onresult;
 h.controller.stopAnswer();typedRace({results:[Object.assign([{transcript:'duplicate'}],{isFinal:true})]});
 assert.equal(h.answers.length,0);h.controller.dispose();
});
test('interim speech submits before the deadline, and unsupported browsers retain typing',async()=>{
 const h=harness();await h.click('mic');h.controller.update(answering);
 h.recognition.onresult({results:[Object.assign([{transcript:'left ventricle'}],{isFinal:false})]});
 assert.deepEqual(h.transcripts,[['left ventricle',0]]);
 [...h.timers.values()][0]();assert.deepEqual(h.answers,[['left ventricle',0]]);h.controller.dispose();
 const unsupported=harness({recognition:false});assert.equal(unsupported.nodes.get('[data-voice="mic"]').disabled,true);unsupported.controller.dispose();
});
