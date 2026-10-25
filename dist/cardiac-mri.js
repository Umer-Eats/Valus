// Actual published real-time cardiac MRI, Zhang et al., CC BY 2.0.
// Drawn without synthetic tissue or interpolated anatomy. See medical-credits.html.
export function mountCardiacMRI(canvas){
 const ctx=canvas.getContext('2d');if(!ctx)return()=>{};
 canvas.dataset.renderer='loading';const video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.preload='auto';video.src='./assets/medical/cardiac-mri.webm';
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let disposed=false,visible=true,frame=0,w=1,h=1,last=0;
 function draw(){if(disposed)return;const dark=document.documentElement.dataset.theme==='dark';ctx.fillStyle=dark?'#06080b':'#e3e8ec';ctx.fillRect(0,0,w,h);if(video.readyState<2)return;
 const side=Math.min(w*.94,h*.96,780),x=(w-side)/2,y=(h-side)/2;ctx.save();ctx.drawImage(video,x,y,side,side);
 // Feather the image perimeter into the theme without altering the scan's center.
 const mask=ctx.createRadialGradient(w/2,h/2,side*.32,w/2,h/2,side*.64);const rgb=dark?'6,8,11':'227,232,236';mask.addColorStop(0,`rgba(${rgb},0)`);mask.addColorStop(1,`rgba(${rgb},1)`);ctx.fillStyle=mask;ctx.fillRect(x,y,side,side);ctx.restore();}
 function loop(now){frame=0;if(disposed||motion.matches||document.hidden||!visible)return;if(now-last>30){draw();last=now;}frame=requestAnimationFrame(loop);}
 function resume(){cancelAnimationFrame(frame);if(disposed)return;draw();if(motion.matches||document.hidden||!visible){video.pause();return;}video.play().catch(()=>{});frame=requestAnimationFrame(loop);}
 function size(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);w=r.width;h=r.height;canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw();}
 video.addEventListener('loadeddata',()=>{if(disposed)return;canvas.dataset.renderer='cardiac-mri';resume();});video.addEventListener('seeked',draw);video.addEventListener('error',()=>{if(!disposed)canvas.dataset.renderer='unavailable';});
 const ro=new ResizeObserver(size);ro.observe(canvas);const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;resume();});io.observe(canvas);const theme=new MutationObserver(draw);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});motion.addEventListener('change',resume);document.addEventListener('visibilitychange',resume);size();
 return()=>{disposed=true;cancelAnimationFrame(frame);video.pause();video.removeAttribute('src');video.load();ro.disconnect();io.disconnect();theme.disconnect();motion.removeEventListener('change',resume);document.removeEventListener('visibilitychange',resume);};
}
