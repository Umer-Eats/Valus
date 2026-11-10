// Attendance background: public-domain (CC0) chest radiograph with a slow scanner sweep.
// The sweep and gentle breathing are presentation motion on a still image. See medical-credits.html.
export function mountXrayScan(canvas){
 const ctx=canvas.getContext('2d');if(!ctx)return()=>{};
 canvas.dataset.renderer='loading';canvas.dataset.scene='xray';
 const film=new Image();film.src=new URL('./assets/medical/chest-xray.png',import.meta.url).href;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let disposed=false,visible=true,frame=0,w=1,h=1,time=0,last=0,red='225,29,72';
 function readRed(){
  const probe=getComputedStyle(document.documentElement).getPropertyValue('--red').trim();
  const hex=/^#([0-9a-f]{6})$/i.exec(probe);
  if(hex){const n=parseInt(hex[1],16);red=`${n>>16&255},${n>>8&255},${n&255}`;}
 }
 function drawFilm(dark,x,y,width,height){
  // Light theme shows the film as a negative so bones read dark on the light page.
  ctx.filter=dark?'none':'invert(1)';
  ctx.drawImage(film,x,y,width,height);
  ctx.filter='none';
 }
 function draw(){
  if(disposed)return;
  const dark=document.documentElement.dataset.theme==='dark',rgb=dark?'9,12,21':'237,240,245';
  ctx.fillStyle=`rgb(${rgb})`;ctx.fillRect(0,0,w,h);
  if(!film.complete||!film.naturalWidth)return;
  const breath=1+.008*Math.sin(time*.9);
  const scale=Math.min(w*.98/film.naturalWidth,h*.94/film.naturalHeight);
  const width=film.naturalWidth*scale,height=film.naturalHeight*scale*breath,x=(w-width)/2,y=(h-film.naturalHeight*scale)/2;
  drawFilm(dark,x,y,width,height);
  ctx.fillStyle=`rgba(${rgb},${dark?.26:.42})`;ctx.fillRect(0,0,w,h);
  // Scanner band: re-exposes the film at full contrast as it passes, led by a thin Valus-red line.
  if(!motion.matches){
   const period=9,p=(time%period)/period,lineY=y-40+(height+80)*p,band=Math.max(60,height*.16);
   ctx.save();ctx.beginPath();ctx.rect(0,lineY-band,w,band);ctx.clip();
   drawFilm(dark,x,y,width,height);
   const fade=ctx.createLinearGradient(0,lineY-band,0,lineY);
   fade.addColorStop(0,`rgba(${rgb},${dark?.26:.42})`);fade.addColorStop(1,`rgba(${rgb},0)`);
   ctx.fillStyle=fade;ctx.fillRect(0,lineY-band,w,band);ctx.restore();
   const glow=ctx.createLinearGradient(0,lineY-18,0,lineY+2);
   glow.addColorStop(0,`rgba(${red},0)`);glow.addColorStop(1,`rgba(${red},${dark?.32:.22})`);
   ctx.fillStyle=glow;ctx.fillRect(x,lineY-18,width,20);
   ctx.fillStyle=`rgba(${red},${dark?.7:.55})`;ctx.fillRect(x,lineY,width,1.2);
  }
  ctx.save();ctx.translate(w/2,y+height/2);ctx.scale(width/2,height/2);
  const edge=ctx.createRadialGradient(0,0,.45,0,0,1.18);edge.addColorStop(0,`rgba(${rgb},0)`);edge.addColorStop(1,`rgba(${rgb},1)`);
  ctx.fillStyle=edge;ctx.fillRect(-1.5,-1.5,3,3);ctx.restore();
 }
 function loop(now){frame=0;if(disposed||motion.matches||document.hidden||!visible)return;if(now-last>32){time+=Math.min((now-last)/1000,.1);last=now;draw();}frame=requestAnimationFrame(loop);}
 function resume(){cancelAnimationFrame(frame);last=performance.now();draw();if(!disposed&&!motion.matches&&!document.hidden&&visible)frame=requestAnimationFrame(loop);}
 function size(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);w=Math.max(1,r.width);h=Math.max(1,r.height);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw();}
 function retheme(){readRed();draw();}
 film.onload=()=>{if(!disposed){canvas.dataset.renderer='xray-scan';resume();}};
 film.onerror=()=>{if(!disposed)canvas.dataset.renderer='unavailable';};
 const ro=new ResizeObserver(size);ro.observe(canvas);const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;resume();});io.observe(canvas);
 const theme=new MutationObserver(retheme);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 motion.addEventListener('change',resume);document.addEventListener('visibilitychange',resume);readRed();size();
 return()=>{disposed=true;cancelAnimationFrame(frame);film.onload=film.onerror=null;ro.disconnect();io.disconnect();theme.disconnect();motion.removeEventListener('change',resume);document.removeEventListener('visibilitychange',resume);};
}
