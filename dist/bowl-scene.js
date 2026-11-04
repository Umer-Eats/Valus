import {drawBowlPortrait} from './bowl-art.js';
import * as THREE from './vendor/three.module.js';

// A local, procedural competition room: no remote models, textures or accounts.
export function mountBowlScene(container,{onBuzz}) {
 const canvas=container.querySelector('canvas');
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});}
 catch{container.classList.add('bowl-no-webgl');container.querySelector('[data-scene-help]').textContent='3D is unavailable on this device. All game controls remain available below.';return {update(){},setSpeaker(){},dispose(){}};}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#111b30');scene.fog=new THREE.Fog('#111b30',24,52);
 const camera=new THREE.PerspectiveCamera(42,1,.1,100);
 const materials=[],geometries=[],textures=[],clickables=[],contestants=[];
 const bands=new THREE.DataTexture(new Uint8Array([65,65,65,255,155,155,155,255,255,255,255,255]),3,1,THREE.RGBAFormat);bands.minFilter=THREE.NearestFilter;bands.magFilter=THREE.NearestFilter;bands.needsUpdate=true;textures.push(bands);
 const material=(color,extra={})=>{const {roughness,metalness,...props}=extra;const m=new THREE.MeshToonMaterial({color,gradientMap:bands,...props});materials.push(m);return m;};
 const M={floor:material('#202b40'),wall:material('#182237'),trim:material('#33435e'),wood:material('#65493f'),desk:material('#202b3e',{metalness:.35}),red:material('#cf3154'),teal:material('#39bdbd'),gold:material('#e5bd7f',{metalness:.5}),black:material('#101725'),white:material('#eee9dd'),metal:material('#8595ac',{metalness:.7}),screen:material('#0b1522'),shoe:material('#111a28')};
 const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.SphereGeometry(1,20,14),cylGeo=new THREE.CylinderGeometry(1,1,1,24),capsuleGeo=new THREE.CapsuleGeometry(.14,.35,5,10);
 geometries.push(boxGeo,sphereGeo,cylGeo,capsuleGeo);
 function mesh(parent,geo,mat,pos,scale){const o=new THREE.Mesh(geo,mat);o.position.set(...pos);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const box=(p,m,pos,size)=>mesh(p,boxGeo,m,pos,size);
 const sphere=(p,m,pos,size)=>mesh(p,sphereGeo,m,pos,size);
 const cyl=(p,m,pos,size)=>mesh(p,cylGeo,m,pos,size);
 const group=(parent,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;};
 function textPanel(parent,width,height,pos,lines,{bg='#111115',color='#fff8e6',size=55}={}) {
  const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);
  const mat=new THREE.MeshBasicMaterial({map:t});materials.push(mat);
  const geo=new THREE.PlaneGeometry(width,height);geometries.push(geo);const panel=mesh(parent,geo,mat,pos,[1,1,1]);panel.castShadow=false;
  const draw=(text)=>{ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.textAlign='center';ctx.textBaseline='middle';text.forEach((line,i)=>{ctx.font=`italic 900 ${i===0?size:size*.65}px Arial`;ctx.fillStyle=color;ctx.fillText(line,512,128+(i-(text.length-1)/2)*78,950);});t.needsUpdate=true;};draw(lines);
  return {panel,draw};
 }
 scene.add(new THREE.HemisphereLight('#ffffff','#69606b',2.1));
 const keyLight=new THREE.DirectionalLight('#fff7e7',3.5);keyLight.position.set(2,13,7);keyLight.castShadow=true;keyLight.shadow.mapSize.set(2048,2048);Object.assign(keyLight.shadow.camera,{left:-13,right:13,top:10,bottom:-10,near:1,far:35});keyLight.shadow.bias=-.001;scene.add(keyLight);
 const rim=new THREE.DirectionalLight('#ffffff',2);rim.position.set(-8,5,-6);scene.add(rim);
 const glow=(color)=>material(color,{emissive:color,emissiveIntensity:1.5});
 const redGlow=glow('#ed426b'),blueGlow=glow('#46dddd'),warmGlow=glow('#edbd73');
 // Raised competition platform, inlaid carpet, and architectural light rails.
 box(scene,M.floor,[0,-.28,0],[19,.5,15]);box(scene,M.black,[0,-.04,.1],[17.5,.08,12.6]);
 box(scene,material('#29344a'),[0,.015,.1],[17.1,.04,12.2]);
 box(scene,M.wall,[0,3.2,-6.7],[19,6.7,.35]);
 for(const x of [-9.2,9.2]){
  box(scene,M.wall,[x,1.3,-2.5],[.3,2.8,8]);
  box(scene,M.trim,[x,2.75,-2.5],[.4,.08,8]);
 }
 for(const x of [-8,-6,-3,3,6,8]){box(scene,M.trim,[x,3,-6.43],[.12,5.8,.2]);box(scene,x<0?redGlow:blueGlow,[x+.2,3,-6.35],[.035,4.8,.05]);}
 box(scene,M.trim,[0,6.3,-6.3],[18,.15,.4]);
 for(const x of [-8.5,8.5])box(scene,x<0?redGlow:blueGlow,[x,.06,0],[.045,.025,11.8]);
 for(let z=-5;z<7;z+=2)box(scene,M.trim,[0,.045,z],[.6,.012,.035]);
 // Back-wall broadcast display, plus a physical moderator podium.
 box(scene,M.black,[0,4.7,-6.35],[8.6,2.2,.32]);
 const scoreboard=textPanel(scene,8.2,1.85,[0,4.7,-6.16],['HOSA BOWL','THE COMPETITION ROOM'],{size:82});
 box(scene,M.trim,[0,.18,-4],[3.3,.3,2.3]);
 box(scene,M.desk,[0,.93,-3.65],[1.7,1.4,.9]);box(scene,M.wood,[0,1.68,-3.6],[2,.12,1.15]);
 box(scene,warmGlow,[0,.95,-3.185],[.035,1.15,.03]);
 textPanel(scene,1.45,.34,[0,1.3,-3.18],['MODERATOR'],{size:85});
 const moderator=character(scene,0,0,-4.05,false,0,true);
 moderator.body.position.y+=.38;
 // Microphone, cue screen and paper stack.
 cyl(scene,M.metal,[.65,1.95,-3.5],[.025,.55,.025]);sphere(scene,M.black,[.65,2.23,-3.5],[.09,.11,.09]);
 const cue=box(scene,M.black,[-.2,1.81,-3.55],[.7,.07,.4]);cue.rotation.x=.18;
 box(scene,M.white,[.38,1.77,-3.4],[.35,.025,.3]);
 function character(parent,x,y,z,robot,index,moderator=false){
  const root=group(parent,x,y,z),body=group(root),head=group(body,0,2.18,0);
  const cloth=moderator?M.white:robot?M.white:M.black;
  const skin=material(robot?'#f5eee2':['#d99c79','#edc3a0','#ab7156','#d8aa89'][index]);
  const portrait=document.createElement('canvas');drawBowlPortrait(portrait,{robot,index,moderator});
  const texture=new THREE.CanvasTexture(portrait);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
  const faceMaterial=new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.2,side:THREE.DoubleSide});materials.push(faceMaterial);
  const faceGeometry=new THREE.PlaneGeometry(.83,.98);geometries.push(faceGeometry);
  mesh(head,faceGeometry,faceMaterial,[0,0,.085],[1,1,1]);
  // A tapered jacket and slender articulated limbs support the inked face.
  const jacketGeometry=new THREE.CylinderGeometry(.32,.24,.7,5);geometries.push(jacketGeometry);
  const jacket=mesh(body,jacketGeometry,cloth,[0,1.46,0],[1,1,.67]);jacket.rotation.y=Math.PI/5;
  cyl(body,skin,[0,1.86,0],[.075,.18,.075]);
  const lapelGeo=new THREE.BufferGeometry();lapelGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.24,1.77,.21,-.04,1.4,.22,-.06,1.74,.22,.24,1.77,.21,.06,1.74,.22,.04,1.4,.22],3));lapelGeo.computeVertexNormals();geometries.push(lapelGeo);
  mesh(body,lapelGeo,robot?M.black:M.white,[0,0,0],[1,1,1]);
  box(body,M.red,[0,1.56,.23],[.055,.32,.025]);
  const arms=[];
  for(const side of [-1,1]){
   const arm=group(body,side*.32,1.71,0);arms.push(arm);
   mesh(arm,capsuleGeo,cloth,[0,-.22,0],[.63,1.18,.63]);
   const forearm=mesh(arm,capsuleGeo,cloth,[0,-.43,.18],[.58,1.1,.58]);forearm.rotation.x=-Math.PI/2;
   sphere(arm,skin,[0,-.43,.43],[.075,.055,.1]);
   const thigh=mesh(body,capsuleGeo,M.black,[side*.15,.96,.19],[.72,1.05,.72]);thigh.rotation.x=Math.PI/2;
   mesh(body,capsuleGeo,M.black,[side*.15,.6,.42],[.62,1.2,.62]);
   sphere(body,M.shoe,[side*.15,.26,.51],[.12,.09,.22]);
  }
  const outline=new THREE.MeshBasicMaterial({color:'#09090c',side:THREE.BackSide});materials.push(outline);
  const solids=[];body.traverse(o=>{if(o.isMesh&&o.material!==faceMaterial&&o.geometry!==lapelGeo)solids.push(o);});
  for(const solid of solids){const edge=new THREE.Mesh(solid.geometry,outline);edge.scale.setScalar(1.055);solid.add(edge);}
  // Mouth motion stays restrained; expression comes from head and shoulder poses.
  const mouth=box(head,robot?M.black:material('#703b3b'),[0,-.145,.09],[.05,.006,.005]);mouth.visible=false;
  return {root,body,head,arms,mouth,mouthHeight:mouth.scale.y};
 }
 // Two teams, each with an actual desk, chairs, letter cards and clickable buzzers.
 for(let team=0;team<2;team++){
  const robot=team===1,base=group(scene,robot?4.3:-4.3,0,.15);base.rotation.y=robot?-.13:.13;
  const teamMat=robot?M.teal:M.red,teamGlow=robot?blueGlow:redGlow;
  box(base,M.wood,[0,1.2,.6],[7.3,.18,1.6]);
  box(base,M.desk,[0,.72,1.12],[7.1,.95,.15]);
  box(base,teamGlow,[0,1.14,1.21],[6.9,.045,.035]);
  for(const x of [-3.15,3.15]){box(base,M.metal,[x,.55,.55],[.14,1.1,1.1]);box(base,M.black,[x,.04,.6],[.4,.08,1.4]);}
  textPanel(base,3.4,.38,[0,.67,1.21],[robot?'NOVA / ROBOT TEAM':'VALUS / YOUR TEAM'],{size:65,color:robot?'#fff6e8':'#fff6e8'});
  for(let i=0;i<4;i++){
   const x=(i-1.5)*1.75;
   // Upholstered chairs with backs, chrome legs and armrests.
   box(base,M.black,[x,.83,-.48],[.82,.17,.74]);box(base,teamMat,[x,1.23,-.81],[.8,.8,.13]);
   for(const dx of [-.31,.31])for(const dz of [-.73,-.23])cyl(base,M.metal,[x+dx,.39,dz],[.035,.75,.035]);
   for(const dx of [-.44,.44]){box(base,M.black,[x+dx,1.05,-.42],[.09,.1,.65]);cyl(base,M.metal,[x+dx,.92,-.48],[.025,.3,.025]);}
   const person=character(base,x,0,-.45,robot,i);
   const haloGeo=new THREE.RingGeometry(.43,.48,36);geometries.push(haloGeo);
   const halo=mesh(base,haloGeo,teamGlow,[x,.07,-.4],[1,1,1]);halo.rotation.x=-Math.PI/2;
   const ring=cyl(base,M.black,[x,1.34,.87],[.27,.09,.27]);
   const buttonMat=material(robot?'#ece6d8':'#e91b38',{emissive:robot?'#ece6d8':'#e91b38',emissiveIntensity:.3,roughness:.25});
   const buzzer=cyl(base,buttonMat,[x,1.43,.87],[.215,.12,.215]);
   buzzer.userData={seat:i,robot};clickables.push(buzzer);
   const name=textPanel(base,.75,.26,[x,1.05,1.215],[String.fromCharCode(65+i)],{size:125,color:robot?'#fff6e8':'#fff6e8'});
   const plate=textPanel(base,1.42,.22,[x,.32,1.215],[robot?'ROBOT '+String.fromCharCode(65+i):'SEAT '+String.fromCharCode(65+i)],{size:70});
   contestants.push({team,seat:i,...person,halo,buzzer,buttonMat,plate,name,ring});
  }
 }
 // Auditorium details: two speakers, warm stage lamps, plants and ceiling pendants.
 for(const side of [-1,1]){
  const x=side*7.6;
  box(scene,M.black,[x,1.45,-5.6],[.7,2.8,.65]);
  for(const y of [.7,1.6,2.3]){const speaker=cyl(scene,M.trim,[x,y,-5.25],[.23,.04,.23]);speaker.rotation.x=Math.PI/2;}
  const blade=box(scene,M.red,[side*8.5,1.1,4.7],[.15,2.6,.6]);blade.rotation.z=side*.5;
  for(const z of [-4,2]){cyl(scene,M.black,[side*6,5.7,z],[.018,1.3,.018]);cyl(scene,M.gold,[side*6,5,z],[.35,.18,.35]);cyl(scene,warmGlow,[side*6,4.9,z],[.27,.035,.27]);}
 }
 const cutin=document.createElement('div');cutin.className='bowl-ink-cutin';cutin.setAttribute('aria-hidden','true');cutin.innerHTML='<canvas></canvas><b></b><span></span>';container.append(cutin);
 let burstKey='';
 let state=null,speaker=null,frame=0,disposed=false,last=0,visible=true,hover=null,scoreKey='',labelKey='';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let orbit={theta:-.12,phi:1.2,radius:18},goal={...orbit},target=new THREE.Vector3(0,1.2,-.7),targetGoal=target.clone();
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function canBuzz(seat){return state?.mayBuzz&&state.seats[seat]===state.you&&(state.phase!=='Normal round'||state.activeSeat===seat);}
 function update(g){
  state=g;
  const nextBurst=g?.status==='playing'&&['answer','robot-answer','result'].includes(g.stage)?g.code+':'+g.questionIndex+':'+g.stage+':'+g.feedback:'';
  if(nextBurst&&nextBurst!==burstKey){
   const robot=g.stage==='robot-answer'||g.lastBuzzer?.team===1,seat=g.buzz?.seat??g.robotSpeech?.seat??0;
   drawBowlPortrait(cutin.querySelector('canvas'),{robot,index:seat});
   cutin.querySelector('b').textContent=g.stage==='result'?(g.feedback?.includes('1 point')?'POINT!':'NEXT!'):'BUZZ!';
   cutin.querySelector('span').textContent=(robot?'NOVA ':'PLAYER ')+String.fromCharCode(65+seat);
   cutin.classList.remove('is-burst');void cutin.offsetWidth;cutin.classList.add('is-burst');
  }
  burstKey=nextBurst;
  if(!g||g.status!=='playing')cutin.classList.remove('is-burst');
  const status=container.querySelector('[data-scene-phase]');status.textContent=g?.status==='playing'?g.phase:g?.status==='ended'?'MATCH COMPLETE':'PRACTICE ARENA';
  const hint=container.querySelector('[data-scene-turn]');hint.textContent=g?.status==='playing'?(g.stage==='robot-answer'?'ROBOT '+String.fromCharCode(65+g.robotSpeech.seat)+' IS ANSWERING':g.stage==='answer'?'Player '+String.fromCharCode(65+g.buzz.seat)+' has the buzzer':g.phase==='Normal round'?'SEAT '+String.fromCharCode(65+g.activeSeat)+' ON THE BUZZER':'ALL SEATS LIVE'):'Take a look around. Your team is up next.';
  const score=g?g.score.join(' — '):'0 — 0',key=score+'|'+g?.level;
  if(scoreKey!==key){scoreboard.draw(['HOSA BOWL',score+'     /     '+(g?'LEVEL '+g.level:'READY TO PLAY')]);scoreKey=key;}
  const labels=JSON.stringify([g?.players,g?.seats,g?.level]);
  if(labels!==labelKey){labelKey=labels;for(const c of contestants){if(c.team===0){const name=g?.players.find(p=>p.id===g.seats[c.seat])?.name||'SEAT '+String.fromCharCode(65+c.seat);c.plate.draw([name.slice(0,19)]);}}}
 }
 const resize=()=>{const w=container.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
 const observer=new ResizeObserver(resize);observer.observe(container);
 const visibility=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});visibility.observe(container);
 function pick(e){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(clickables,false)[0]?.object;}
 let drag=null;
 function down(e){drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};canvas.setPointerCapture(e.pointerId);}
 function move(e){
  if(drag){goal.theta-=(e.clientX-drag.x)*.006;goal.phi=THREE.MathUtils.clamp(goal.phi+(e.clientY-drag.y)*.004,.4,1.32);goal.theta=THREE.MathUtils.clamp(goal.theta,-1.3,1.3);drag.x=e.clientX;drag.y=e.clientY;}
  else {hover=pick(e);canvas.style.cursor=hover&&!hover.userData.robot&&canBuzz(hover.userData.seat)?'pointer':'grab';}
 }
 function up(e){if(drag&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<6){const hit=pick(e);if(hit&&!hit.userData.robot&&canBuzz(hit.userData.seat))onBuzz(hit.userData.seat);}drag=null;}
 function wheel(e){e.preventDefault();goal.radius=THREE.MathUtils.clamp(goal.radius+e.deltaY*.014,10,29);}
 function preset(e){const view=e.target.closest('[data-camera]')?.dataset.camera;if(!view)return;
  container.querySelectorAll('[data-camera]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.camera===view)));
  if(view==='room'){goal={theta:-.12,phi:1.2,radius:18};targetGoal.set(0,1.2,-.7);}
  if(view==='team'){goal={theta:-.2,phi:1.13,radius:12};targetGoal.set(-4,1.1,.2);}
  if(view==='robot'){goal={theta:.2,phi:1.13,radius:12};targetGoal.set(4,1.1,.2);}
  if(view==='moderator'){goal={theta:.05,phi:1.18,radius:10};targetGoal.set(0,1.8,-3.6);}
 }
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',()=>{drag=null;});canvas.addEventListener('wheel',wheel,{passive:false});container.addEventListener('click',preset);
 const lost=e=>{e.preventDefault();container.querySelector('[data-scene-help]').textContent='3D view paused. Reload to restore it; game controls below still work.';};canvas.addEventListener('webglcontextlost',lost);
 function animate(time){
  if(disposed)return;frame=requestAnimationFrame(animate);if(!visible||document.hidden||time-last<32)return;last=time;
  const t=Math.floor(time/1000*12)/12,speed=reduced.matches?1:.18;
  for(const k of ['theta','phi','radius'])orbit[k]=THREE.MathUtils.lerp(orbit[k],goal[k],speed);
  target.lerp(targetGoal,speed);
  const radius=orbit.radius*(camera.aspect<1.1?1.28:1);
  camera.position.set(target.x+radius*Math.sin(orbit.phi)*Math.sin(orbit.theta),target.y+radius*Math.cos(orbit.phi),target.z+radius*Math.sin(orbit.phi)*Math.cos(orbit.theta));camera.lookAt(target);camera.rotateZ(reduced.matches?0:-.025);
  for(const c of contestants){
   const active=state?.status==='playing'&&(state.phase!=='Normal round'||state.activeSeat===c.seat);
   const buzzed=(c.team===0&&state?.stage==='answer'&&state.buzz?.seat===c.seat)||(c.team===1&&state?.stage==='robot-answer'&&state.robotSpeech?.seat===c.seat)||
    (state?.stage==='result'&&state.lastBuzzer?.team===c.team&&state.lastBuzzer?.seat===c.seat);
   c.halo.visible=active;c.halo.scale.setScalar(reduced.matches?1:1+Math.sin(t*3)*.05);
   c.buttonMat.emissiveIntensity=buzzed?2.4:c.buzzer===hover&&canBuzz(c.seat)&&!c.team?1.6:active ? .75 : .15;
   c.buzzer.position.y=THREE.MathUtils.lerp(c.buzzer.position.y,buzzed?1.38:1.43,.2);
   c.body.position.y=reduced.matches?0:Math.sin(t*1.8+c.seat)*.013;
   c.head.rotation.y=reduced.matches?0:Math.sin(t*.7+c.seat)*.045;
   c.arms[1].rotation.x=THREE.MathUtils.lerp(c.arms[1].rotation.x,buzzed?-.38:0,.15);
   const talking=speaker?.seat===c.seat&&((c.team===1&&speaker.role==='robot')||(c.team===0&&speaker.role==='student'));
   c.mouth.scale.y=c.mouthHeight*(talking&&!reduced.matches?1+Math.abs(Math.sin(t*16))*3:1);
  }
  moderator.head.rotation.y=reduced.matches?0:Math.sin(t*.45)*.17;
  moderator.arms[0].rotation.z=reduced.matches?0:Math.sin(t*1.5)*.07;
  moderator.mouth.scale.y=moderator.mouthHeight*(speaker?.role==='moderator'&&!reduced.matches?1+Math.abs(Math.sin(t*15))*3:1);
  renderer.render(scene,camera);
 }
 resize();update(null);frame=requestAnimationFrame(animate);
 return {update,setSpeaker(value){speaker=value;},dispose(){disposed=true;cutin.remove();cancelAnimationFrame(frame);observer.disconnect();visibility.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('webglcontextlost',lost);container.removeEventListener('click',preset);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();}};
}
