import * as THREE from './vendor/three.module.js';
// Measured morphology: NeuroMorpho.Org NMO_1, Wearne/Hof cnic_001 (CC BY 4.0).
// Spines, organelles, fluorescent color and traveling activity are illustrative additions.
export function mountNeurons(canvas){
 let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});}catch{canvas.dataset.renderer='unavailable';return()=>{};}
 canvas.dataset.renderer='loading';renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,40);camera.position.set(0,0,6.2);
 const group=new THREE.Group();scene.add(group);
 scene.add(new THREE.HemisphereLight(0xaadfff,0x171129,2));
 for(const [color,intensity,pos] of [[0x68cdff,8,[-3,3,3]],[0xff4c95,5,[3,-1,2]],[0x2d66ff,10,[0,2,-3]]]){const light=new THREE.PointLight(color,intensity,20,1);light.position.set(...pos);scene.add(light);}
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),abort=new AbortController();let disposed=false,visible=true,frame=0,time=0,last=0;const materials=[],geometries=[];
 const uniforms={time:{value:0},dark:{value:1}};
 function tissue(){const m=new THREE.MeshPhysicalMaterial({color:0x538bb4,roughness:.38,metalness:.1,clearcoat:.55,clearcoatRoughness:.28});materials.push(m);
 m.onBeforeCompile=shader=>{shader.uniforms.neuralTime=uniforms.time;shader.vertexShader='attribute float routeDistance; attribute float cellPhase; varying float vRoute; varying float vPhase; varying vec3 vTissue;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRoute=routeDistance;vPhase=cellPhase;vTissue=position;');shader.fragmentShader='uniform float neuralTime; varying float vRoute; varying float vPhase; varying vec3 vTissue;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat grain=sin(vTissue.x*410.+sin(vTissue.y*170.))*sin(vTissue.y*390.+vTissue.z*270.);diffuseColor.rgb*=.85+.15*grain;');
 shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat wave=mod(neuralTime*.75-vPhase+12.,4.5);float pulse=exp(-pow((vRoute-wave)/.07,2.));totalEmissiveRadiance+=vec3(.13,.65,1.)*pulse*3.2+vec3(.02,.06,.1);');};return m;}
 function attr(geometry,distance=0,phase=0){const n=geometry.attributes.position.count;geometry.setAttribute('routeDistance',new THREE.Float32BufferAttribute(new Float32Array(n).fill(distance),1));geometry.setAttribute('cellPhase',new THREE.Float32BufferAttribute(new Float32Array(n).fill(phase),1));return geometry;}
 let seed=1201;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const built=[];
 fetch('./assets/medical/cnic_001.CNG.swc',{signal:abort.signal}).then(r=>{if(!r.ok)throw Error('Morphology unavailable');return r.text();}).then(text=>{
 if(disposed)return;const nodes=new Map();for(const line of text.split(/\r?\n/)){if(!line.trim()||line.startsWith('#'))continue;const [id,type,x,y,z,r,parent]=line.trim().split(/\s+/).map(Number);nodes.set(id,{id,type,p:new THREE.Vector3(x/140,y/140,z/140),r:Math.max(.0045,r/140*1.7),parent,dist:0});}
 const segments=[];for(const n of nodes.values()){const parent=nodes.get(n.parent);if(!parent||n.type===1)continue;n.dist=parent.dist+n.p.distanceTo(parent.p);segments.push([parent,n]);}
 const membrane=tissue();
 for(const [index,pose] of [[0,[-.22,.08,.2,-.4]],[1,[1.4,-.8,-.8,2.4]],[2,[-1.5,-1.1,-1.1,1.2]]]){
 const cell=new THREE.Group();cell.position.set(...pose.slice(0,3));cell.rotation.z=pose[3];cell.rotation.y=index*.65;group.add(cell);built.push(cell);
 const pos=[],norm=[],dist=[],phase=[];
 function vertex(p,n,d){pos.push(p.x,p.y,p.z);norm.push(n.x,n.y,n.z);dist.push(d);phase.push(index*1.35);}
 for(const [a,b] of segments){const axis=b.p.clone().sub(a.p).normalize();const u=new THREE.Vector3(0,0,1);if(Math.abs(axis.z)>.95)u.set(1,0,0);u.cross(axis).normalize();const v=axis.clone().cross(u).normalize();const sides=10;
 for(let j=0;j<sides;j++){const angle=j/sides*Math.PI*2,next=(j+1)/sides*Math.PI*2;const n1=u.clone().multiplyScalar(Math.cos(angle)).addScaledVector(v,Math.sin(angle)),n2=u.clone().multiplyScalar(Math.cos(next)).addScaledVector(v,Math.sin(next));const p1=a.p.clone().addScaledVector(n1,a.r),p2=a.p.clone().addScaledVector(n2,a.r),p3=b.p.clone().addScaledVector(n1,b.r),p4=b.p.clone().addScaledVector(n2,b.r);vertex(p1,n1,a.dist);vertex(p3,n1,b.dist);vertex(p2,n2,a.dist);vertex(p2,n2,a.dist);vertex(p3,n1,b.dist);vertex(p4,n2,b.dist);}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));geo.setAttribute('routeDistance',new THREE.Float32BufferAttribute(dist,1));geo.setAttribute('cellPhase',new THREE.Float32BufferAttribute(phase,1));geometries.push(geo);cell.add(new THREE.Mesh(geo,membrane));
 const somaGeo=attr(new THREE.SphereGeometry(.11,64,48),0,index*1.35);const a=somaGeo.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),f=1+.075*Math.sin(x*90)*Math.cos(y*67)*Math.sin(z*81);a.setXYZ(i,x*f,y*f*1.35,z*f);}somaGeo.computeVertexNormals();geometries.push(somaGeo);cell.add(new THREE.Mesh(somaGeo,membrane));
 const nucleusGeo=attr(new THREE.SphereGeometry(.056,32,24),0,index*1.35),nucleusMat=new THREE.MeshPhysicalMaterial({color:0x5a92d8,emissive:0x183a60,roughness:.25,metalness:.2,clearcoat:1});geometries.push(nucleusGeo);materials.push(nucleusMat);const nucleus=new THREE.Mesh(nucleusGeo,nucleusMat);nucleus.position.z=.075;cell.add(nucleus);
 const organelleGeo=attr(new THREE.SphereGeometry(.008,12,8),0,index*1.35);geometries.push(organelleGeo);
 for(let j=0;j<35;j++){const organelle=new THREE.Mesh(organelleGeo,nucleusMat),angle=j*2.399963,r=.07*Math.sqrt(j/35);organelle.position.set(Math.cos(angle)*r,Math.sin(angle)*r*1.2,.08+rand()*.02);organelle.scale.set(1,.5+rand(),.5);cell.add(organelle);}
 // Dense mushroom-shaped dendritic spines, distinct from the measured SWC skeleton.
 const spineGeo=new THREE.SphereGeometry(1,8,6);geometries.push(spineGeo);const spineMat=new THREE.MeshStandardMaterial({color:0x7ac8e0,roughness:.48,metalness:.12});materials.push(spineMat);const count=segments.length*2,spines=new THREE.InstancedMesh(spineGeo,spineMat,count),matrix=new THREE.Matrix4(),quat=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);
 segments.forEach(([a,b],i)=>{for(let j=0;j<2;j++){const d=new THREE.Vector3(rand()-.5,rand()-.5,rand()-.5).normalize(),p=a.p.clone().lerp(b.p,rand()).addScaledVector(d,a.r+.009);quat.setFromUnitVectors(up,d);matrix.compose(p,quat,new THREE.Vector3(.006,.018,.006));spines.setMatrixAt(i*2+j,matrix);}});cell.add(spines);
 }
 canvas.dataset.renderer='neuron3d';canvas.dataset.model='NMO_1';canvas.dataset.segments=String(segments.length*3);resume();
 }).catch(e=>{if(e.name!=='AbortError'&&!disposed){canvas.dataset.renderer='unavailable';console.warn('Neural reconstruction could not load',e.message);}});
 function theme(){const dark=document.documentElement.dataset.theme==='dark';uniforms.dark.value=dark?1:0;scene.background=new THREE.Color(dark?0x030817:0xe5edf4);scene.fog=new THREE.FogExp2(dark?0x030817:0xe5edf4,dark?.065:.045);draw();}
 function draw(){if(disposed)return;uniforms.time.value=time;group.rotation.y=Math.sin(time*.09)*.12;group.rotation.x=Math.sin(time*.07)*.035;renderer.render(scene,camera);}
 function size(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.position.z=r.width<600?5.1:3.5;camera.updateProjectionMatrix();draw();}
 function loop(now){frame=0;if(disposed||motion.matches||document.hidden||!visible)return;if(now-last>32){time+=Math.min((now-last)/1000,.08);last=now;draw();}frame=requestAnimationFrame(loop);}
 function resume(){cancelAnimationFrame(frame);last=performance.now();draw();if(!disposed&&!motion.matches&&!document.hidden&&visible)frame=requestAnimationFrame(loop);}
 const ro=new ResizeObserver(size);ro.observe(canvas);const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;resume();});io.observe(canvas);const observer=new MutationObserver(theme);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});motion.addEventListener('change',resume);document.addEventListener('visibilitychange',resume);theme();size();resume();
 return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);ro.disconnect();io.disconnect();observer.disconnect();motion.removeEventListener('change',resume);document.removeEventListener('visibilitychange',resume);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();};
}
