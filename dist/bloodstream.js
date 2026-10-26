// Bloodstream study: erythrocytes, leukocytes, platelets, IgG and insulin.
// Molecular species are enlarged for visibility; cells retain approximate relative sizes.

const BG_FRAG = `
precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform float uDark; uniform vec3 uPath;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 f = gl_FragCoord.xy / uRes; f.y = 1. - f.y;
  vec3 hi = mix(vec3(.957,.957,.95), vec3(.062,.066,.076), uDark);
  vec3 lo = mix(vec3(.9,.905,.91), vec3(.034,.037,.044), uDark);
  vec3 col = mix(hi, lo, pow(f.y, 1.4));
  float yc = uPath.x + uPath.y * f.x + .05 * sin(f.x * 4.2 + uTime * .25);
  float d = (f.y - yc) / uPath.z;
  col += vec3(.85, .1, .16) * exp(-d*d*1.6) * mix(.045, .09, uDark);
  col = mix(col, mix(vec3(1.), vec3(.16,.05,.07), uDark), exp(-d*d*3.) * mix(.22, .25, uDark));
  col += (hash(gl_FragCoord.xy + fract(uTime)) - .5) * .014;
  gl_FragColor = vec4(col, 1.);
}`;

const CELL_VERT = `
attribute vec2 aPos; attribute vec2 aUv; attribute vec3 aAxis; attribute vec2 aP; attribute float aKind;
uniform vec2 uRes;
varying vec2 vUv; varying vec3 vAxis; varying vec2 vP; varying float vKind;
void main(){ vUv = aUv; vAxis = aAxis; vP = aP; vKind = aKind; vec2 c = aPos / uRes * 2. - 1.; gl_Position = vec4(c.x, -c.y, 0., 1.); }`;

const CELL_FRAG = `
precision highp float;
varying vec2 vUv; varying vec3 vAxis; varying vec2 vP; varying float vKind; // vP: blur, fog
uniform float uDark;
vec3 AX; float KIND;
float smin(float a, float b, float k){ float h = clamp(.5 + .5*(b - a)/k, 0., 1.); return mix(b, a, h) - k*h*(1. - h); }
float ellipsoid(vec3 p, vec3 r){ return (length(p/r) - 1.) * min(min(r.x,r.y),r.z); }
float capsule(vec3 p, vec3 a, vec3 b, float r){ vec3 d=b-a; return length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.,1.))-r; }
vec3 orient(vec3 p){
  float a=atan(AX.y,AX.x), ca=cos(a), sa=sin(a);
  p.xy=mat2(ca,-sa,sa,ca)*p.xy;
  float b=acos(clamp(AX.z,-1.,1.)), cb=cos(b), sb=sin(b);
  p.yz=mat2(cb,-sb,sb,cb)*p.yz;
  return p;
}
float insulinA(vec3 p){
  float d=capsule(p,vec3(-.64,.08,-.13),vec3(-.47,.39,.06),.115);
  d=min(d,capsule(p,vec3(-.47,.39,.06),vec3(-.2,.55,.18),.125));
  d=min(d,capsule(p,vec3(-.2,.55,.18),vec3(.13,.48,.2),.125));
  d=min(d,capsule(p,vec3(.13,.48,.2),vec3(.43,.24,.03),.115));
  return min(d,capsule(p,vec3(.43,.24,.03),vec3(.23,-.12,-.16),.105));
}
float insulinB(vec3 p){
  float d=capsule(p,vec3(.59,-.28,.14),vec3(.38,-.54,.06),.105);
  d=min(d,capsule(p,vec3(.38,-.54,.06),vec3(.02,-.6,-.12),.12));
  d=min(d,capsule(p,vec3(.02,-.6,-.12),vec3(-.32,-.42,-.2),.125));
  d=min(d,capsule(p,vec3(-.32,-.42,-.2),vec3(-.53,-.11,.02),.115));
  return min(d,capsule(p,vec3(-.53,-.11,.02),vec3(-.64,.08,-.13),.095));
}
float insulinBridge(vec3 p){
  float d=capsule(p,vec3(-.46,.39,.07),vec3(-.52,-.08,.01),.055);
  d=min(d,capsule(p,vec3(.29,.34,.13),vec3(.4,-.5,.05),.055));
  return min(d,capsule(p,vec3(-.35,.49,.13),vec3(-.12,.52,.19),.05));
}
float iggHeavy(vec3 q){
  float d=capsule(q,vec3(-.09,-.9,0.),vec3(-.08,.02,0.),.095);
  d=min(d,capsule(q,vec3(.09,-.9,0.),vec3(.08,.02,0.),.095));
  d=min(d,capsule(q,vec3(-.08,.03,0.),vec3(-.77,.82,-.03),.105));
  d=min(d,capsule(q,vec3(.08,.03,0.),vec3(.77,.82,.03),.105));
  d=min(d,ellipsoid(q-vec3(-.1,-.62,0.),vec3(.15,.21,.15)));
  d=min(d,ellipsoid(q-vec3(.1,-.62,0.),vec3(.15,.21,.15)));
  d=min(d,ellipsoid(q-vec3(-.11,-.3,0.),vec3(.14,.2,.15)));
  d=min(d,ellipsoid(q-vec3(.11,-.3,0.),vec3(.14,.2,.15)));
  d=min(d,ellipsoid(q-vec3(-.39,.37,-.02),vec3(.19,.24,.15)));
  d=min(d,ellipsoid(q-vec3(.39,.37,.02),vec3(.19,.24,.15)));
  d=min(d,ellipsoid(q-vec3(-.68,.72,-.02),vec3(.17,.22,.15)));
  return min(d,ellipsoid(q-vec3(.68,.72,.02),vec3(.17,.22,.15)));
}
float iggLight(vec3 q){
  float d=capsule(q,vec3(-.23,.18,.1),vec3(-.79,.8,.1),.07);
  d=min(d,capsule(q,vec3(.23,.18,.1),vec3(.79,.8,.1),.07));
  d=min(d,ellipsoid(q-vec3(-.49,.46,.1),vec3(.13,.19,.11)));
  d=min(d,ellipsoid(q-vec3(.49,.46,.1),vec3(.13,.19,.11)));
  d=min(d,ellipsoid(q-vec3(-.78,.78,.1),vec3(.12,.17,.11)));
  return min(d,ellipsoid(q-vec3(.78,.78,.1),vec3(.12,.17,.11)));
}
float iggGlycan(vec3 q){
  float d=length(q-vec3(-.23,-.34,.13))-.07;
  d=min(d,length(q-vec3(.23,-.34,.13))-.07);
  d=min(d,length(q-vec3(-.3,-.24,.18))-.055);
  return min(d,length(q-vec3(.3,-.24,.18))-.055);
}
float nucleus(vec3 p){
  if(KIND<1.5){
    float d=ellipsoid(p-vec3(-.36,.08,0.),vec3(.3,.36,.31));
    d=smin(d,ellipsoid(p-vec3(.2,.32,.04),vec3(.31,.31,.29)),.1);
    d=smin(d,ellipsoid(p-vec3(.32,-.32,-.03),vec3(.31,.3,.29)),.1);
    return smin(d,ellipsoid(p-vec3(-.2,-.38,.02),vec3(.27,.25,.27)),.09);
  }
  if(KIND<2.5) return ellipsoid(p-vec3(.05,.02,0.),vec3(.71,.7,.65));
  float bean=ellipsoid(p-vec3(-.08,0.,0.),vec3(.67,.62,.52));
  return max(bean,-ellipsoid(p-vec3(.42,.12,0.),vec3(.42,.4,.6)));
}
// A shared signed-distance scene lets every species tumble as a solid 3D object.
float sdCell(vec3 p){
  if(KIND<.5){
    float y=dot(p,AX), r=length(p-AX*y);
    return smin(length(vec2(r-.64,y))-.34,length(vec2(max(r-.64,0.),y))-.15,.3);
  }
  vec3 q=orient(p);
  if(KIND<1.5) return length(q)-.94 + .012*sin(q.x*12.)*sin(q.y*9.)*sin(q.z*11.) + .002*sin(q.x*25.+q.y*21.)*sin(q.z*19.);
  if(KIND<2.5) return length(q)-.94 + .004*sin(q.x*12.)*sin(q.y*9.);
  if(KIND<3.5) return length(q)-.94 + .023*sin(q.x*9.+q.y*4.)*sin(q.y*10.+q.z*3.);
  if(KIND<4.5) return ellipsoid(q,vec3(.76,.56,.24)) + .014*sin(q.x*17.)*sin(q.y*13.) + .009*sin(q.x*37.+q.y*31.);
  if(KIND<5.5){
    return min(min(iggHeavy(q),iggLight(q)),iggGlycan(q));
  }
  return min(min(insulinA(q),insulinB(q)),insulinBridge(q));
}
vec3 nrm(vec3 p){
  const vec2 k = vec2(1., -1.); const float e = .002;
  return normalize(k.xyy*sdCell(p + k.xyy*e) + k.yyx*sdCell(p + k.yyx*e) + k.yxy*sdCell(p + k.yxy*e) + k.xxx*sdCell(p + k.xxx*e));
}
void main(){
  AX = normalize(vAxis); KIND = vKind;
  float blur = vP.x, fog = vP.y;
  vec3 ro = vec3(vUv.x, -vUv.y, 2.), rd = vec3(0., 0., -1.);
  float t = 0., minD = 1e3; bool hit = false;
  for (int i = 0; i < 40; i++) {
    float d = sdCell(ro + rd*t);
    minD = min(minD, d);
    if (d < .0015) { hit = true; break; }
    t += d;
    if (t > 4.) break;
  }
  float aa = .015 + blur * .5;
  float a = hit ? 1. : 1. - smoothstep(0., aa, minD);
  if (a < .004) discard;

  vec3 col;
  if (hit && KIND < .5) {
    vec3 p = ro + rd*t;
    vec3 n = nrm(p);
    vec3 V = vec3(0., 0., 1.);
    vec3 L = normalize(vec3(-.5, .72, .62));
    // thickness along the view ray: thin centre glows, plump rim is deep red
    float th = 0.; vec3 q = p - n*.01;
    for (int i = 0; i < 12; i++) { float d = -sdCell(q); if (d < .002) break; float s = max(d, .02); q += rd*s; th += s; }
    float ao = .5 + .5*clamp(sdCell(p + n*.22) / .22, 0., 1.);
    float diff = clamp(dot(n, L)*.6 + .4, 0., 1.);
    float ndv = max(dot(n, V), 0.);
    float fres = pow(1. - ndv, 3.);
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(n, H), 0.), 48.)*.75 + pow(max(dot(n, H), 0.), 8.)*.12;
    vec3 deep = vec3(.4, .015, .045), lite = vec3(.98, .34, .37);
    col = mix(lite, deep, 1. - exp(-th*1.5));
    col *= diff * ao;
    col += vec3(1., .26, .32) * fres * .35;
    col += vec3(1., .88, .88) * spec * (1. - blur*.8);
    col += vec3(.9, .1, .15) * pow(max(dot(-n, L), 0.), 2.) * .12;
  } else if(hit) {
    vec3 p=ro+rd*t, q=orient(p), n=nrm(p);
    vec3 L=normalize(vec3(-.5,.72,.62)), V=vec3(0.,0.,1.);
    float light=.38+.62*max(dot(n,L),0.);
    float gloss=pow(max(dot(n,normalize(L+V)),0.),35.)*.46;
    if(KIND<3.5){
      vec3 shell=KIND<1.5 ? vec3(.86,.84,.86) : KIND<2.5 ? vec3(.74,.84,.91) : vec3(.71,.79,.85);
      vec3 inside=p+rd*(p.z+.08);
      float core=1.-smoothstep(-.025,.12,nucleus(orient(inside)));
      vec3 nuclear=KIND<1.5 ? vec3(.31,.25,.49) : KIND<2.5 ? vec3(.24,.27,.48) : vec3(.29,.31,.49);
      float chromatin=.5+.5*sin(inside.x*28.)*sin(inside.y*34.)*sin(inside.z*29.);
      nuclear*=mix(.76,1.15,chromatin);
      float membrane=pow(1.-max(dot(n,V),0.),2.);
      col=mix(shell,nuclear,core*.94)*light + vec3(1.)*gloss;
      float granule=sin(q.x*55.)*sin(q.y*47.)*sin(q.z*41.);
      if(KIND<1.5) col-=vec3(.15,.11,.14)*max(granule-.32,0.)*(1.-core)*.95;
      if(KIND>2.5) col+=vec3(.08,.1,.12)*max(granule-.55,0.);
      col+=shell*membrane*.28;
    } else if(KIND<4.5){
      float fleck=sin(q.x*38.)*sin(q.y*31.);
      float pore=sin(q.x*56.+q.y*9.)*sin(q.y*49.);
      float marginal=exp(-pow((length(q.xy)-.62)/.075,2.));
      col=(vec3(.64,.59,.77)+vec3(.2,.14,.24)*max(fleck-.35,0.)-vec3(.1)*max(pore-.76,0.)+vec3(.12,.13,.2)*marginal)*light+vec3(1.)*gloss;
    } else if(KIND<5.5){
      float lightChain=iggLight(q), heavyChain=iggHeavy(q), sugar=iggGlycan(q);
      float tip=smoothstep(.48,.79,q.y);
      vec3 chain=lightChain<heavyChain ? vec3(.72,.88,.84) : mix(vec3(.24,.57,.67),vec3(.39,.7,.75),tip);
      if(sugar<min(lightChain,heavyChain)) chain=vec3(.91,.72,.42);
      float strands=.94+.06*sin(q.y*52.+q.x*27.)*sin(q.z*31.);
      col=chain*light*strands+vec3(1.)*gloss;
    } else {
      float da=insulinA(q), db=insulinB(q), bridge=insulinBridge(q);
      vec3 chain=da<db ? vec3(.35,.68,.76) : vec3(.82,.57,.32);
      float fold=.91+.09*sin(q.x*36.+q.y*43.)*sin(q.z*35.);
      col=(bridge<min(da,db) ? vec3(.96,.81,.43) : chain)*light*fold+vec3(1.)*gloss;
    }
  } else {
    col = KIND<.5 ? vec3(.78,.1,.15) : KIND<3.5 ? vec3(.73,.77,.83) : KIND<4.5 ? vec3(.64,.59,.77) : KIND<5.5 ? vec3(.38,.67,.7) : vec3(.7,.65,.5);
  }
  if(KIND<.5) col = mix(col, vec3(.78, .12, .17), clamp(blur*1.15, 0., 1.)*.85);
  vec3 bg = mix(vec3(.95, .95, .945), vec3(.05, .055, .066), uDark);
  col = mix(col, bg, fog);
  a *= mix(1., .5, clamp(blur, 0., 1.));
  gl_FragColor = vec4(col*a, a);
}`;

const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

export function mountBloodstream(canvas) {
  const gl = canvas.getContext('webgl', {antialias: true, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance'});
  if (!gl) { canvas.dataset.renderer='unavailable'; canvas.closest('.hero')?.classList.add('no-webgl'); return () => {}; }
  const program = (vs, fs) => {
    const p = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    }
    gl.linkProgram(p); return p;
  };
  let bgProg, cellProg;
  try { bgProg = program(VERT, BG_FRAG); cellProg = program(CELL_VERT, CELL_FRAG); }
  catch (err) { console.warn('Valus bloodstream disabled:', err.message); canvas.dataset.renderer='unavailable'; canvas.closest('.hero')?.classList.add('no-webgl'); return () => {}; }

  const triBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const cellBuf = gl.createBuffer();
  const bgU = n => gl.getUniformLocation(bgProg, n), cU = n => gl.getUniformLocation(cellProg, n);
  const loc = {bgA: gl.getAttribLocation(bgProg, 'a'), pos: gl.getAttribLocation(cellProg, 'aPos'), uv: gl.getAttribLocation(cellProg, 'aUv'), axis: gl.getAttribLocation(cellProg, 'aAxis'), p: gl.getAttribLocation(cellProg, 'aP'), kind: gl.getAttribLocation(cellProg, 'aKind')};

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let still = motion.matches;
  const onMotion = () => { still = motion.matches; };
  motion.addEventListener('change', onMotion);
  canvas.dataset.renderer='bloodstream';
  // Full-bleed: the vessel fills the whole opening instead of a narrow band.
  const fullBleed = Boolean(canvas.closest('.organism-hero'));
  const rand = (a, b) => a + Math.random() * (b - a);
  let W = 1, H = 1, dpr = 1, maxDpr = Math.min(devicePixelRatio || 1, 1.75), slow = 0, wide = true, frame = 0, last = performance.now(), clock = 0, visible = true;
  const mouse = {x: -9999, y: -9999, lastMove: 0};

  // 0 erythrocyte, 1 neutrophil, 2 lymphocyte, 3 monocyte,
  // 4 platelet, 5 IgG antibody, 6 insulin (the two molecular kinds are enlarged).
  const spawn = (cell, anywhere, kind = cell.kind ?? 0) => {
    cell.kind = kind;
    const fore = kind === 0 && Math.random() < .07;
    cell.z = fore ? rand(1.15, 1.75) : rand(-.9, .9);
    cell.lane = rand(-1, 1) * (fore ? 1.4 : 1);
    cell.s = anywhere ? rand(-.1, 1.1) : rand(-.2, -.1);
    cell.speed = rand(.8, 1.2) * (kind > 4 ? 1.12 : 1);
    cell.phase = rand(0, Math.PI * 2); cell.spin = rand(.2, .7) * (Math.random() < .5 ? -1 : 1);
    cell.rot = rand(0, Math.PI); cell.drift = rand(-.15, .15);
    cell.ox = 0; cell.oy = 0; cell.vx = 0; cell.vy = 0;
    return cell;
  };
  let cells = [];
  const populate = () => {
    const red = fullBleed ? (wide ? 145 : 84) : wide ? 80 : 43;
    cells = Array.from({length: red}, () => spawn({}, true, 0));
    const counts = wide ? [2, 1, 1, 17, 5, 4] : [1, 1, 0, 9, 3, 2];
    counts.forEach((count, index) => {
      for (let i = 0; i < count; i++) cells.push(spawn({}, true, index + 1));
    });
  };

  const path = () => canvas.dataset.centered === 'true' ? [.5, 0, .3] : fullBleed ? (wide ? [.53, -.06, .4] : [.5, 0, .42]) : wide ? [.25, .2, .14] : [.27, .05, .11];
  const size = () => {
    dpr = maxDpr;
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    const nowWide = W / H > 1.1; if (nowWide !== wide || !cells.length) { wide = nowWide; populate(); }
  };

  const STRIDE = 10;
  const verts = new Float32Array(220 * 6 * STRIDE);
  const cellPosition = (c, base, slope, half) => {
    const persp = 1 / (1.25 - c.z * .5);
    const xf = c.s * 1.3 - .15;
    const yc = base + slope * xf + .05 * Math.sin(xf * 4.2 + clock * .25);
    return [xf * W, (yc + c.lane * half * Math.min(persp, 1.15)) * H];
  };
  const step = dt => {
    const [base, slope, half] = path();
    for (const c of cells) {
      const persp = 1 / (1.25 - c.z * .5);
      c.s += (.035 * c.speed * (1 - .55 * Math.min(c.lane * c.lane, 1)) * persp) * dt;
      c.phase += c.spin * dt; c.rot += c.drift * dt;
      if (c.s > 1.18) spawn(c, false);
    }
    cells.sort((a, b) => a.z - b.z);
    let i = 0;
    for (const c of cells) {
      const persp = 1 / (1.25 - c.z * .5);
      let [x, y] = cellPosition(c, base, slope, half);
      if (dt > 0) {
        // Keep moving after the stroke, then settle back into the flow lane.
        c.vx -= c.ox * 15 * dt; c.vy -= c.oy * 15 * dt;
        const drag = Math.exp(-dt * 4.5);
        c.vx *= drag; c.vy *= drag;
        c.ox += c.vx * dt; c.oy += c.vy * dt;
      }
      x += c.ox; y += c.oy;
      const scale = [1, 1.7, 1.18, 1.95, .4, 1.12, .92][c.kind];
      const rad = (fullBleed ? (wide ? .034 : .024) : wide ? .03 : .021) * H * persp * scale, ext = rad * 1.35;
      const blur = Math.min(Math.abs(c.z - .12) * .5 + (c.z > 1.1 ? .35 : 0), 1);
      const fog = Math.max(0, Math.min((-c.z - .1) * .55, .6));
      const st = Math.sin(c.phase), ax = st * Math.cos(c.rot), ay = st * Math.sin(c.rot), az = Math.cos(c.phase);
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
      for (const [u, v] of corners) {
        verts.set([(x + u * ext) * dpr, (y + v * ext) * dpr, u * 1.35, v * 1.35, ax, ay, az, blur, fog, c.kind], i); i += STRIDE;
      }
    }
    return i / STRIDE;
  };

  const draw = () => {
    const dark = canvas.dataset.palette === 'light' ? 0 : document.documentElement.dataset.theme === 'dark' ? 1 : 0;
    gl.disable(gl.BLEND);
    gl.useProgram(bgProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, triBuf);
    gl.enableVertexAttribArray(loc.bgA); gl.vertexAttribPointer(loc.bgA, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(bgU('uRes'), canvas.width, canvas.height); gl.uniform1f(bgU('uTime'), clock); gl.uniform1f(bgU('uDark'), dark);
    gl.uniform3f(bgU('uPath'), ...path());
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disableVertexAttribArray(loc.bgA);

    const count = step(0);
    gl.useProgram(cellProg);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER, cellBuf); gl.bufferData(gl.ARRAY_BUFFER, verts.subarray(0, count * STRIDE), gl.DYNAMIC_DRAW);
    const F = 4;
    gl.enableVertexAttribArray(loc.pos); gl.vertexAttribPointer(loc.pos, 2, gl.FLOAT, false, STRIDE * F, 0);
    gl.enableVertexAttribArray(loc.uv); gl.vertexAttribPointer(loc.uv, 2, gl.FLOAT, false, STRIDE * F, 2 * F);
    gl.enableVertexAttribArray(loc.axis); gl.vertexAttribPointer(loc.axis, 3, gl.FLOAT, false, STRIDE * F, 4 * F);
    gl.enableVertexAttribArray(loc.p); gl.vertexAttribPointer(loc.p, 2, gl.FLOAT, false, STRIDE * F, 7 * F);
    gl.enableVertexAttribArray(loc.kind); gl.vertexAttribPointer(loc.kind, 1, gl.FLOAT, false, STRIDE * F, 9 * F);
    gl.uniform2f(cU('uRes'), canvas.width, canvas.height); gl.uniform1f(cU('uDark'), dark);
    gl.drawArrays(gl.TRIANGLES, 0, count);
    for (const l of [loc.pos, loc.uv, loc.axis, loc.p, loc.kind]) gl.disableVertexAttribArray(l);
  };

  const loop = now => {
    frame = requestAnimationFrame(loop);
    const dt = Math.min(now - last, 60) / 1000; last = now;
    if (!visible || document.hidden) return;
    if (canvas.dataset.paused !== 'true' && (!still || canvas.dataset.paused === 'false')) {
      clock += dt;
      step(dt);
    }
    draw();
    if (clock > 2 && dt > .028) { if (++slow > 45 && maxDpr > .75) { maxDpr = Math.max(.75, maxDpr - .25); size(); slow = 0; } } else slow = Math.max(0, slow - 1);
  };
  const hero = canvas.closest('.hero') || canvas;
  const onMove = e => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
    if (!still && canvas.dataset.paused !== 'true' && mouse.lastMove && now - mouse.lastMove < 100) {
      const dx = x - mouse.x, dy = y - mouse.y, distance = Math.hypot(dx, dy);
      if (distance > 1) {
        const ux = dx / distance, uy = dy / distance;
        const reach = Math.min(135, H * .23), stroke = Math.min(distance, 45);
        const [base, slope, half] = path();
        for (const c of cells) {
          const [cx, cy] = cellPosition(c, base, slope, half);
          const px = cx + c.ox - mouse.x, py = cy + c.oy - mouse.y;
          const along = Math.max(0, Math.min(distance, px * ux + py * uy));
          const sideX = px - along * ux, sideY = py - along * uy;
          const separation = Math.hypot(sideX, sideY);
          if (separation >= reach) continue;
          // Open a wake on both sides of the moving cursor path. A stopped
          // cursor cannot attract cells into an orbit or keep pushing them.
          const side = ux * sideY - uy * sideX < 0 ? -1 : 1;
          const falloff = Math.pow(1 - separation / reach, 2);
          const depth = 1 / (1 + Math.abs(c.z) * .5);
          const impulse = stroke * 18 * falloff * depth;
          c.vx = Math.max(-480, Math.min(480, c.vx + (-uy * side + ux * .22) * impulse));
          c.vy = Math.max(-480, Math.min(480, c.vy + (ux * side + uy * .22) * impulse));
        }
      }
    }
    mouse.x = x; mouse.y = y; mouse.lastMove = now;
  };
  const onLeave = () => { mouse.x = mouse.y = -9999; mouse.lastMove = 0; };
  hero.addEventListener('pointermove', onMove, {passive: true}); hero.addEventListener('pointerleave', onLeave);
  const ro = new ResizeObserver(() => { size(); draw(); }); ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(canvas);
  size(); draw(); frame = requestAnimationFrame(loop);
  requestAnimationFrame(() => canvas.classList.add('ready'));

  return () => {
    cancelAnimationFrame(frame); ro.disconnect(); io.disconnect();
    motion.removeEventListener('change', onMotion);
    hero.removeEventListener('pointermove', onMove); hero.removeEventListener('pointerleave', onLeave);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
