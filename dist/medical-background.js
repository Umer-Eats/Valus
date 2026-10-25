import {mountCardiacMRI} from './cardiac-mri.js';
import {mountBloodstream} from './bloodstream.js';

// Solid, ray-marched 3D studies: surface normals, tissue microstructure,
// occlusion, subsurface-style fill and moving highlights, like the bloodstream.
const vertex=`attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
const common=`precision highp float;
uniform vec2 resolution;uniform float time;uniform float dark;
float smoothMin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float ell(vec3 p,vec3 r){return (length(p/r)-1.)*min(r.x,min(r.y,r.z));}
float tube(vec3 p,vec3 a,vec3 b,float r){vec3 v=b-a;return length(p-a-v*clamp(dot(p-a,v)/dot(v,v),0.,1.))-r;}
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float texture3(vec3 p){return sin(p.x*38.+sin(p.y*24.))*sin(p.y*35.+p.z*17.)*sin(p.z*33.+p.x*9.);}
vec3 orient(vec3 p){p.xz=rot(sin(time*.16)*.55+time*.035)*p.xz;p.xy=rot(.12*sin(time*.2))*p.xy;return p;}
`;
const scenes={
 assignments:`
vec2 model(vec3 p){
 p.xy=rot(-.2)*p.xy;
 float angle=p.y*4.3;
 vec2 h=vec2(cos(angle),sin(angle))*.62;
 float rail=min(length(p.xz-h),length(p.xz+h))-.095;
 rail=max(rail,abs(p.y)-1.65);
 float level=floor(p.y/.22+.5)*.22;
 float a=level*4.3;vec3 v=vec3(cos(a)*.62,level,sin(a)*.62);
 float rung=tube(p,v,vec3(0.,level,0.),.048);
 float other=tube(p,vec3(0.,level,0.),vec3(-v.x,level,-v.z),.048);
 float beads=min(length(p-v),length(p-vec3(-v.x,level,-v.z)))-.125;
 beads=max(beads,abs(p.y)-1.68);
 rung=max(rung,abs(p.y)-1.58);other=max(other,abs(p.y)-1.58);
 float d=min(rail,beads);
 if(rung<min(d,other))return vec2(rung,3.);
 if(other<d)return vec2(other,4.);
 return vec2(d,p.x*cos(angle)+p.z*sin(angle)>0.?1.:2.);
}`,
 community:`
vec2 model(vec3 p){
 float d=10.;float material=2.;
 for(int i=0;i<5;i++){
 float f=float(i),a=f*6.28318/5.+time*.08;
 vec3 center=vec3(cos(a)*.85,sin(a)*.85,sin(a*2.)*.32);
 vec3 q=p-center;
 float cell=length(q)-(.42+.025*sin(time*.8+f));
 cell+=.012*texture3(q*1.5);
 // Embedded, raised nucleus and granular membrane detail.
 float nucleus=ell(q-vec3(.04,.04,.32),vec3(.17,.19,.13));
 if(min(cell,nucleus)<d){d=min(cell,nucleus);material=nucleus<cell?1.:2.;}
 }
 return vec2(d,material);
}`};
const lighting=`
vec2 scene(vec3 p){return model(orient(p));}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*resolution)/min(resolution.x,resolution.y);
 vec3 bg=mix(vec3(.94,.93,.94),vec3(.055,.038,.048),dark);
 bg+=mix(vec3(.02,.025,.035),vec3(.02,.035,.05),dark)*exp(-dot(uv,uv)*2.);
 vec3 origin=vec3(0.,0.,4.6),ray=normalize(vec3(uv*3.6,-4.6));
 float travel=0.;vec2 hit=vec2(0.);vec3 p;
 for(int i=0;i<80;i++){p=origin+ray*travel;hit=scene(p);if(hit.x<.003||travel>7.)break;travel+=max(hit.x*.75,.003);}
 vec3 col=bg;
 if(travel<7.&&hit.x<.012){
  vec2 e=vec2(.004,0.);vec3 n=normalize(vec3(scene(p+e.xyy).x-scene(p-e.xyy).x,scene(p+e.yxy).x-scene(p-e.yxy).x,scene(p+e.yyx).x-scene(p-e.yyx).x));
  vec3 light=normalize(vec3(-.7,1.2,2.));float diffuse=max(dot(n,light),0.);
  float spec=pow(max(dot(reflect(-light,n),-ray),0.),38.);
  float rim=pow(1.-max(dot(n,-ray),0.),3.);
  float ao=clamp(scene(p+n*.12).x/.12,.25,1.);
  vec3 tissue=vec3(.64,.12,.22);
  if(hit.y>1.5)tissue=vec3(.17,.49,.63);
  if(hit.y>2.5)tissue=vec3(.85,.47,.22);
  if(hit.y>3.5)tissue=vec3(.48,.32,.68);
  if(hit.y>4.5)tissue=vec3(.73,.4,.42);
  vec3 local=orient(p);tissue*=1.+.055*texture3(local);
  col=tissue*(.32+.72*diffuse)*ao+vec3(1.,.87,.8)*spec*.52+vec3(.22,.43,.55)*rim*.45;
  col+=tissue*.2*max(0.,dot(-n,light));
  if(hit.y>4.5){float signal=pow(max(0.,sin(local.x*28.+local.y*23.+local.z*19.-time*3.)),30.);float lanes=pow(max(0.,sin(local.y*19.+sin(local.z*12.)*1.8+sin(local.x*13.))),10.);col+=vec3(.16,.7,1.)*signal*lanes*.8;}
  col=mix(col,bg,smoothstep(4.8,7.,travel)*.35);
 }
 gl_FragColor=vec4(col,1.);
}`;
export function mountMedicalBackground(canvas,kind){
 if(kind==='event')return mountCardiacMRI(canvas);
 if(kind==='analytics'){let stop,disposed=false;canvas.dataset.renderer='loading';import('./neurons.js').then(m=>{if(!disposed)stop=m.mountNeurons(canvas);}).catch(()=>{if(!disposed)canvas.dataset.renderer='unavailable';});return()=>{disposed=true;stop?.();};}
 if(kind==='overview'){canvas.dataset.centered='true';return mountBloodstream(canvas);}
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
 if(!gl){canvas.dataset.renderer='unavailable';return()=>{};}
 const shaders=[];const program=gl.createProgram();let buffer;
 try{
  for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,common+(scenes[kind]||scenes.community)+lighting]]){
   const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);canvas.dataset.renderer='webgl';
 }catch(error){console.warn('Medical background unavailable:',error.message);shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);canvas.dataset.renderer='unavailable';return()=>{};}
 const uniforms=Object.fromEntries(['resolution','time','dark'].map(n=>[n,gl.getUniformLocation(program,n)]));
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,t=0,last=0,visible=true,disposed=false;
 function draw(){if(disposed||gl.isContextLost())return;gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);gl.uniform1f(uniforms.time,t);gl.uniform1f(uniforms.dark,document.documentElement.dataset.theme==='dark'?1:0);gl.drawArrays(gl.TRIANGLES,0,3);}
 function size(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1,1000/Math.max(r.width,r.height));canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));gl.viewport(0,0,canvas.width,canvas.height);draw();}
 function loop(now){frame=0;if(disposed||motion.matches||document.hidden||!visible)return;if(now-last>32){t+=Math.min((now-last)/1000,.07);last=now;draw();}frame=requestAnimationFrame(loop);}
 function resume(){cancelAnimationFrame(frame);last=performance.now();draw();if(!motion.matches&&!document.hidden&&visible)frame=requestAnimationFrame(loop);}
 const ro=new ResizeObserver(size);ro.observe(canvas);const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;resume();});io.observe(canvas);
 const theme=new MutationObserver(draw);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 motion.addEventListener('change',resume);document.addEventListener('visibilitychange',resume);size();resume();
 return()=>{disposed=true;cancelAnimationFrame(frame);ro.disconnect();io.disconnect();theme.disconnect();motion.removeEventListener('change',resume);document.removeEventListener('visibilitychange',resume);gl.deleteBuffer(buffer);shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();};
}
