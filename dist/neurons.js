// Microscopy-inspired neural tissue: 3D branching arbors and propagating impulses.
// Stylized visualization, with deterministic geometry for stable navigation.
export function mountNeurons(canvas){
 const ctx=canvas.getContext('2d');if(!ctx)return()=>{};
 canvas.dataset.renderer='neuron3d';
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let width=1,height=1,t=0,last=0,frame=0,visible=true,disposed=false;
 let seed=91;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const neurons=Array.from({length:10},(_,i)=>({x:(i%3-1)*.85+(random()-.5)*.3,y:(Math.floor(i/3)-1.5)*.7+(random()-.5)*.3,z:(random()-.5)*1.5,phase:i*.47,r:.10+random()*.04}));
 const paths=[];
 function branch(origin,angle,length,depth,owner,start=0){
  const end={x:origin.x+Math.cos(angle)*length,y:origin.y+Math.sin(angle)*length,z:origin.z+(random()-.5)*.25};
  const points=Array.from({length:19},(_,i)=>{const u=i/18,bend=Math.sin(u*Math.PI)*length*.16;return {x:origin.x+(end.x-origin.x)*u-Math.sin(angle)*bend,y:origin.y+(end.y-origin.y)*u+Math.cos(angle)*bend,z:origin.z+(end.z-origin.z)*u};});
  paths.push({points,owner,start,length,depth});
  if(depth>0){branch(end,angle+(random()*.55+.2),length*.58,depth-1,owner,start+length);branch(end,angle-(random()*.55+.2),length*.6,depth-1,owner,start+length);}
 }
 neurons.forEach((n,i)=>{for(let b=0;b<5;b++)branch(n,b*Math.PI*2/5,.22+random()*.18,2,i);const target=neurons[(i+4)%neurons.length];const points=Array.from({length:45},(_,k)=>{const u=k/44;return{x:n.x+(target.x-n.x)*u+Math.sin(u*Math.PI)*.14,y:n.y+(target.y-n.y)*u,z:n.z+(target.z-n.z)*u};});paths.push({points,owner:i,start:0,length:1.25,depth:1,axon:true});});
 function project(p){const a=Math.sin(t*.08)*.11,c=Math.cos(a),s=Math.sin(a),z=p.z*c-p.x*s,k=3.5/(3.5-z);const scale=Math.min(width,height)*.39;return{x:width*.5+(p.x*c+p.z*s)*scale*k,y:height*.5+p.y*scale*k,z,r:scale*k};}
 function glow(x,y,r,color,alpha){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.22,`rgba(${color},${alpha*.6})`);g.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
 function draw(){
  const dark=document.documentElement.dataset.theme==='dark';ctx.globalCompositeOperation='source-over';ctx.fillStyle=dark?'#060b22':'#e8eef7';ctx.fillRect(0,0,width,height);
  const blue=dark?'46,136,245':'29,92,164',cyan=dark?'100,231,255':'0,103,169';
  for(const path of paths){const points=path.points.map(project),depth=points[0].z,alpha=depth<-.3?.25:.58;ctx.lineCap='round';ctx.lineJoin='round';
   ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=`rgba(${blue},${alpha*.15})`;ctx.lineWidth=path.depth*2+5;ctx.stroke();ctx.strokeStyle=`rgba(${blue},${alpha})`;ctx.lineWidth=.65+path.depth*.65;ctx.stroke();
   points.forEach((p,i)=>{if(i%2)return;ctx.fillStyle=`rgba(${i%3?'90,155,231':'236,94,140'},${alpha*.8})`;ctx.beginPath();ctx.arc(p.x+Math.sin(i*14+path.owner)*2,p.y+Math.cos(i*7)*2,.65,0,Math.PI*2);ctx.fill();});
   // A neuron's burst launches down its axon and branches; distance delays arrival.
   const cycle=((t*.62-neurons[path.owner].phase)%3.4+3.4)%3.4;const u=(cycle-path.start)/path.length;
   if(u>=0&&u<=1){const index=u*(points.length-1),i=Math.min(points.length-2,Math.floor(index)),f=index-i,p={x:points[i].x+(points[i+1].x-points[i].x)*f,y:points[i].y+(points[i+1].y-points[i].y)*f};glow(p.x,p.y,12,cyan,.8);ctx.fillStyle=dark?'#d7fbff':'#087ca9';ctx.beginPath();ctx.arc(p.x,p.y,1.5,0,Math.PI*2);ctx.fill();}
  }
  neurons.slice().sort((a,b)=>a.z-b.z).forEach(n=>{const p=project(n),r=n.r*p.r,burst=Math.exp(-Math.pow((((t*.62-n.phase)%3.4+3.4)%3.4)/.16,2));glow(p.x,p.y,r*2.3,blue,.15+burst*.4);
   ctx.beginPath();for(let j=0;j<=80;j++){const a=j/80*Math.PI*2,rad=r*(.5+.6*Math.pow(Math.max(0,Math.cos(a*5)),7)+.045*Math.sin(a*9));const x=p.x+Math.cos(a)*rad,y=p.y+Math.sin(a)*rad;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();
   const g=ctx.createRadialGradient(p.x,p.y,r*.1,p.x,p.y,r);g.addColorStop(0,`rgba(${blue},.35)`);g.addColorStop(1,`rgba(${blue},.07)`);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=`rgba(${cyan},.65)`;ctx.lineWidth=1.2;ctx.stroke();
   for(let j=0;j<48;j++){const a=j*2.39996,rr=r*.7*Math.sqrt(j/48),x=p.x+Math.cos(a)*rr,y=p.y+Math.sin(a)*rr;ctx.fillStyle=j%4?`rgba(${cyan},.45)`:'rgba(243,99,144,.7)';ctx.fillRect(x,y,1.1,1.1);}
   glow(p.x,p.y,r*.45,cyan,.45+burst*.5);ctx.strokeStyle=`rgba(${cyan},.7)`;ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(p.x,p.y,r*.26,r*.32,.4,0,Math.PI*2);ctx.stroke();
  });
 }
 function size(){const b=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);width=b.width;height=b.height;canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);draw();}
 function loop(now){frame=0;if(disposed||motion.matches||document.hidden||!visible)return;if(now-last>32){t+=Math.min((now-last)/1000,.1);last=now;draw();}frame=requestAnimationFrame(loop);}
 function resume(){cancelAnimationFrame(frame);last=performance.now();draw();if(!disposed&&!motion.matches&&!document.hidden&&visible)frame=requestAnimationFrame(loop);}
 const ro=new ResizeObserver(size);ro.observe(canvas);const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;resume();});io.observe(canvas);const theme=new MutationObserver(draw);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});motion.addEventListener('change',resume);document.addEventListener('visibilitychange',resume);size();resume();
 return()=>{disposed=true;cancelAnimationFrame(frame);ro.disconnect();io.disconnect();theme.disconnect();motion.removeEventListener('change',resume);document.removeEventListener('visibilitychange',resume);};
}

