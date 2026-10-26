// User-supplied colored side-view brain reference; not verified PET acquisition.
export function mountBrainScan(canvas){
 const ctx=canvas.getContext('2d');if(!ctx)return()=>{};
 canvas.dataset.renderer='loading';canvas.dataset.scene='brain-scan';
 const scan=new Image();scan.src=new URL('./assets/medical/brain-scan-reference.png',import.meta.url).href;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let disposed=false,visible=true,frame=0,w=1,h=1,time=0,last=0;
 function draw(){
  if(disposed)return;
  const dark=document.documentElement.dataset.theme==='dark',rgb=dark?'9,12,21':'237,240,245';
  ctx.fillStyle=`rgb(${rgb})`;ctx.fillRect(0,0,w,h);
  if(!scan.complete||!scan.naturalWidth)return;
  const scale=Math.min(w*.96/scan.naturalWidth,h*.88/scan.naturalHeight)*(1+.012*Math.sin(time*.25));
  const width=scan.naturalWidth*scale,height=scan.naturalHeight*scale,x=(w-width)/2,y=(h-height)/2;
  ctx.drawImage(scan,x,y,width,height);
  ctx.fillStyle=`rgba(${rgb},${dark?.12:.3})`;ctx.fillRect(x,y,width,height);
  ctx.save();ctx.translate(w/2,h/2);ctx.scale(width/2,height/2);
  const edge=ctx.createRadialGradient(0,0,.5,0,0,1.2);edge.addColorStop(0,`rgba(${rgb},0)`);edge.addColorStop(1,`rgba(${rgb},1)`);
  ctx.fillStyle=edge;ctx.fillRect(-1,-1,2,2);ctx.restore();
 }
 function loop(now){frame=0;if(disposed||motion.matches||document.hidden||!visible)return;if(now-last>32){time+=Math.min((now-last)/1000,.1);last=now;draw();}frame=requestAnimationFrame(loop);}
 function resume(){cancelAnimationFrame(frame);last=performance.now();draw();if(!disposed&&!motion.matches&&!document.hidden&&visible)frame=requestAnimationFrame(loop);}
 function size(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);w=Math.max(1,r.width);h=Math.max(1,r.height);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw();}
 scan.onload=()=>{if(!disposed){canvas.dataset.renderer='brain-scan';resume();}};
 scan.onerror=()=>{if(!disposed)canvas.dataset.renderer='unavailable';};
 const ro=new ResizeObserver(size);ro.observe(canvas);const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;resume();});io.observe(canvas);
 const theme=new MutationObserver(draw);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 motion.addEventListener('change',resume);document.addEventListener('visibilitychange',resume);size();
 return()=>{disposed=true;cancelAnimationFrame(frame);scan.onload=scan.onerror=null;ro.disconnect();io.disconnect();theme.disconnect();motion.removeEventListener('change',resume);document.removeEventListener('visibilitychange',resume);};
}
