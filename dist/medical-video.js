// Locally hosted, licensed medical animation excerpts. See medical-credits.html.
export function mountMedicalVideo(canvas, source){
 const ctx=canvas.getContext('2d');if(!ctx)return()=>{};
 canvas.dataset.renderer='loading';canvas.dataset.scene=source;
 const video=document.createElement('video');
 video.muted=true;video.loop=true;video.playsInline=true;video.preload='auto';
 video.src=new URL(`./assets/medical/${source}-loop.webm`,import.meta.url).href;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let disposed=false,visible=true,frame=0,w=1,h=1,last=0;
 function draw(){
  if(disposed)return;
  const dark=document.documentElement.dataset.theme==='dark',rgb=dark?'9,12,21':'237,240,245';
  ctx.fillStyle=`rgb(${rgb})`;ctx.fillRect(0,0,w,h);
  if(video.readyState<2)return;
  // Center the full composition; keep the source aspect ratio on narrow screens.
  const scale=Math.min(w/video.videoWidth,h/video.videoHeight);
  const width=video.videoWidth*scale,height=video.videoHeight*scale,x=(w-width)/2,y=(h-height)/2;
  ctx.drawImage(video,x,y,width,height);
  // Theme-aware veil retains detail while keeping glass surfaces readable.
  ctx.fillStyle=`rgba(${rgb},${dark?.16:.28})`;ctx.fillRect(0,0,w,h);
  ctx.save();ctx.translate(w/2,h/2);ctx.scale(width/2,height/2);
  const edge=ctx.createRadialGradient(0,0,.48,0,0,1.28);
  edge.addColorStop(0,`rgba(${rgb},0)`);edge.addColorStop(1,`rgba(${rgb},1)`);
  ctx.fillStyle=edge;ctx.fillRect(-1,-1,2,2);ctx.restore();
 }
 function loop(now){frame=0;if(disposed||motion.matches||document.hidden||!visible)return;if(now-last>30){draw();last=now;}frame=requestAnimationFrame(loop);}
 function resume(){cancelAnimationFrame(frame);if(disposed)return;if(motion.matches||document.hidden||!visible){video.pause();draw();return;}draw();video.play().catch(()=>{});frame=requestAnimationFrame(loop);}
 function size(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);w=Math.max(1,r.width);h=Math.max(1,r.height);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw();}
 video.addEventListener('loadeddata',()=>{if(disposed)return;canvas.dataset.renderer='medical-video';resume();});
 video.addEventListener('seeked',draw);video.addEventListener('error',()=>{if(!disposed)canvas.dataset.renderer='unavailable';});
 const ro=new ResizeObserver(size);ro.observe(canvas);
 const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;resume();});io.observe(canvas);
 const theme=new MutationObserver(draw);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 motion.addEventListener('change',resume);document.addEventListener('visibilitychange',resume);size();
 return()=>{disposed=true;cancelAnimationFrame(frame);video.pause();video.removeAttribute('src');video.load();ro.disconnect();io.disconnect();theme.disconnect();motion.removeEventListener('change',resume);document.removeEventListener('visibilitychange',resume);};
}
