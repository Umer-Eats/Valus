// Ranked test runner: a locked, full-screen, timed test. The test fills the whole screen.
// Pressing Esc, leaving full screen, switching tabs or windows, or closing the page submits it
// at once. If questions were still blank the server locks it until the teacher reopens it.
import {session} from './session.js';

const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LETTERS = ['A','B','C','D','E'];
const clock = ms => {const s = Math.max(0, Math.round(ms/1000)), h = Math.floor(s/3600), m = Math.floor(s%3600/60); return (h ? h+':'+String(m).padStart(2,'0') : m)+':'+String(s%60).padStart(2,'0');};
const REASON = {
 exited_fullscreen:'you left full screen',
 switched_away:'you switched to another tab or window',
 closed:'the test page was closed or reloaded',
 timeout:'time ran out',
 finished:'you submitted it',
};
const fullscreenOn = () => document.fullscreenElement || document.webkitFullscreenElement;
const canFullscreen = () => document.fullscreenEnabled || document.webkitFullscreenEnabled;
function enterFullscreen(el) {
 const go = el.requestFullscreen || el.webkitRequestFullscreen;
 if(!go) return Promise.reject(new Error('Full screen is not available.'));
 // Some browsers never settle the request; give up after a few seconds instead of hanging.
 return Promise.race([Promise.resolve(go.call(el, {navigationUI:'hide'})), new Promise((_, no) => setTimeout(() => no(new Error('Full screen timed out.')), 4000))])
  .then(() => {if(!fullscreenOn()) throw new Error('Full screen did not start.');});
}
function leaveFullscreen() {
 if(!fullscreenOn()) return;
 const out = document.exitFullscreen || document.webkitExitFullscreen;
 try {Promise.resolve(out.call(document)).catch(() => {});} catch {}
}

export function resultHtml(r, {title='', place=null, of=null}={}) {
 const locked = r.state === 'locked', why = REASON[r.reason] || 'the test ended';
 const head = locked
  ? `<span class="eyebrow">RANKED TEST · LOCKED</span><h2>Your test was submitted because ${e(why)}.</h2><p>You answered ${r.answered} of ${r.total} questions. An unfinished ranked test stays locked until your teacher reopens it. Ask your teacher to reopen it so you can finish with the time you had left.</p>`
  : `<span class="eyebrow">RANKED TEST · SUBMITTED</span><h2>${r.reason === 'finished' ? 'Test submitted.' : 'Your test was submitted because '+e(why)+'.'}</h2>`;
 const score = locked ? '' : `<div class="pt-score"><div class="pt-ring" style="--p:${r.score}"><strong>${r.score}%</strong></div><div><h3>${r.correct} of ${r.total} correct</h3><p>${clock(r.secondsUsed*1000)} used${place ? ` · Place ${place} of ${of} in your chapter` : ''}</p><p class="subtle">Your score counts toward your global ranking. Questions stay private so the test is fair for everyone.</p></div></div>
  <h3>By test plan area</h3><div class="pt-areas">${r.areas.map(a => `<div class="pt-area"><div class="pt-area-row"><strong>${e(a.area)} <small>${a.weight}% of test</small></strong><span>${a.correct}/${a.total}</span><span class="pt-meter" aria-hidden="true"><span style="width:${a.total?100*a.correct/a.total:0}%"></span></span></div></div>`).join('')}</div>`;
 return `${title?`<p class="subtle">${e(title)}</p>`:''}${head}${score}`;
}

// Starts (or resumes) the ranked test for an assignment. Must be called from a click so the
// browser allows full screen.
export function startRankedTest({id, title, api, onClose}) {
 const shell = document.createElement('div');
 shell.className = 'ranked-shell';
 shell.setAttribute('role', 'dialog');
 shell.setAttribute('aria-modal', 'true');
 shell.setAttribute('aria-label', 'Ranked test');
 shell.innerHTML = `<div class="ranked-inner"><p class="ranked-loading">Opening your ranked test…</p></div>`;
 document.body.append(shell);
 document.documentElement.classList.add('ranked-open');
 const inner = shell.querySelector('.ranked-inner');
 let armed = false, closed = false, st = null, ticker = null, saveTimer = null, token = null, tokenTimer = null, offset = 0;

 const refreshToken = () => session.user?.getIdToken().then(t => {token = t;}).catch(() => {});
 function close() {
  disarm(); leaveFullscreen();
  shell.remove(); document.documentElement.classList.remove('ranked-open');
  onClose?.();
 }
 function showResult(r) {
  disarm(); leaveFullscreen();
  inner.innerHTML = `<section class="course-card ranked-result">${resultHtml(r, {title})}<div class="course-actions"><button class="button" type="button" data-ranked-close>Back to assignments</button></div></section>`;
  inner.querySelector('[data-ranked-close]').addEventListener('click', close);
  inner.querySelector('[data-ranked-close]').focus();
 }
 function failStart(message, retry) {
  inner.innerHTML = `<section class="course-card ranked-result"><span class="eyebrow">RANKED TEST</span><h2>The test did not start.</h2><p>${e(message)}</p><div class="course-actions">${retry?'<button class="button" type="button" data-ranked-retry>Try again</button>':''}<button class="button secondary" type="button" data-ranked-close>Back to assignments</button></div></section>`;
  inner.querySelector('[data-ranked-close]').addEventListener('click', close);
  inner.querySelector('[data-ranked-retry]')?.addEventListener('click', begin);
 }

 // ----- leaving the test submits it -----
 const onFullscreen = () => {if(armed && !fullscreenOn()) leave('exited_fullscreen');};
 const onVisibility = () => {if(armed && document.visibilityState === 'hidden') leave('switched_away');};
 const onBlur = () => {if(armed) setTimeout(() => {if(armed && !document.hasFocus()) leave('switched_away');}, 150);};
 const onPageHide = () => {if(armed) leave('closed', true);};
 const onBeforeUnload = () => {if(armed) leave('closed', true);};
 const block = ev => {if(armed) ev.preventDefault();};
 const onKey = ev => {
  if(!armed) return;
  const k = ev.key.toLowerCase();
  if((ev.ctrlKey || ev.metaKey) && ['c','v','x','p','s','f','u','a'].includes(k) && !(k === 'a' && ev.target.matches?.('input'))) ev.preventDefault();
  if(['f5','f12','printscreen'].includes(k)) ev.preventDefault();
  // Developer tools: Ctrl+Shift+I/J/C/K on Windows and Linux, Cmd+Option+I/J/C on a Mac.
  // ev.code is used because Option changes ev.key on a Mac.
  if(((ev.ctrlKey && ev.shiftKey) || (ev.metaKey && ev.altKey)) && ['KeyI','KeyJ','KeyC','KeyK'].includes(ev.code)) {ev.preventDefault(); ev.stopPropagation();}
 };
 function arm() {
  armed = true;
  document.addEventListener('fullscreenchange', onFullscreen);
  document.addEventListener('webkitfullscreenchange', onFullscreen);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('blur', onBlur);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('beforeunload', onBeforeUnload);
  document.addEventListener('keydown', onKey, true);
  for(const t of ['contextmenu','copy','cut','paste','dragstart']) shell.addEventListener(t, block);
 }
 function disarm() {
  armed = false; clearInterval(ticker); clearTimeout(saveTimer); clearInterval(tokenTimer);
  document.removeEventListener('fullscreenchange', onFullscreen);
  document.removeEventListener('webkitfullscreenchange', onFullscreen);
  document.removeEventListener('visibilitychange', onVisibility);
  window.removeEventListener('blur', onBlur);
  window.removeEventListener('pagehide', onPageHide);
  window.removeEventListener('beforeunload', onBeforeUnload);
  document.removeEventListener('keydown', onKey, true);
 }

 const path = p => '/assignments/'+encodeURIComponent(id)+'/ranked/'+p;
 // While the page is being closed, only a keepalive request can still reach the server.
 function beacon(reason) {
  try {
   fetch('/api'+path('submit'), {method:'POST', keepalive:true, headers:{'Content-Type':'application/json', ...(token && {Authorization:'Bearer '+token})}, body:JSON.stringify({answers:st.answers, reason})});
  } catch {}
 }
 let submitting = false;
 async function leave(reason, unloading=false) {
  if(!armed || submitting || closed) return;
  submitting = true; disarm();
  if(unloading) {
   beacon(reason); closed = true;
   inner.innerHTML = `<section class="course-card ranked-result"><span class="eyebrow">RANKED TEST</span><h2>Your test was submitted because the page was closed or reloaded.</h2><p>If questions were still blank, your teacher has to reopen it.</p><div class="course-actions"><button class="button" type="button" data-ranked-close>Back to assignments</button></div></section>`;
   inner.querySelector('[data-ranked-close]').addEventListener('click', close);
   return;
  }
  inner.innerHTML = `<p class="ranked-loading">Submitting your test…</p>`;
  for(let tries = 0; tries < 3; tries++) {
   try {const r = await api('POST', path('submit'), {answers:st.answers, reason}); closed = true; showResult(r); return;}
   catch(err) {if(tries === 2) {closed = true; failStart(err.message+' Your answers were saved as you went. Ask your teacher to check this test.', false);}}
  }
 }
 const saveSoon = () => {clearTimeout(saveTimer); saveTimer = setTimeout(() => {api('PUT', path('answers'), {answers:st.answers}).catch(() => {});}, 500);};

 function play() {
  const Q = st.questions, N = Q.length;
  inner.innerHTML = `<header class="ranked-bar">
    <div><span class="eyebrow">RANKED TEST · ${e(st.event)}</span><strong>${e(st.title)}</strong></div>
    <div class="ranked-meta"><span class="pt-answered"></span><span class="pt-clock ranked-clock" role="timer" aria-live="off"></span></div>
   </header>
   <div class="cp-bar" aria-hidden="true"><span></span></div>
   <p class="ranked-warning">${'Stay on this screen. Pressing Esc, leaving full screen or switching tabs submits your test right away.'}</p>
   <div class="ranked-body">
    <nav class="cp-dots ranked-map" aria-label="Test questions">${Q.map((_,i) => `<button type="button" class="cp-dot" data-go="${i}" aria-label="Question ${i+1}">${i+1}</button>`).join('')}</nav>
    <section class="course-card pt ranked-card">
     <div class="pt-stage"></div>
     <div class="cp-nav"><button type="button" class="button secondary" data-prev>← Previous</button><span class="pt-mid"><button type="button" class="text-button" data-flag aria-pressed="false">Flag for review</button></span><button type="button" class="button" data-next>Next →</button></div>
     <div class="pt-submit"><p class="pt-msg" role="status" aria-live="polite"></p><div class="course-actions"><button type="button" class="button secondary" data-submit>Submit test</button></div></div>
    </section>
   </div>`;
  const stage = inner.querySelector('.pt-stage'), dots = [...inner.querySelectorAll('[data-go]')], msg = inner.querySelector('.pt-msg');
  const prev = inner.querySelector('[data-prev]'), next = inner.querySelector('[data-next]'), submit = inner.querySelector('[data-submit]'), flag = inner.querySelector('[data-flag]');
  let confirming = false;
  const status = () => {
   const answered = st.answers.filter(a => a !== null).length;
   inner.querySelector('.pt-answered').textContent = `${answered} of ${N} answered`;
   inner.querySelector('.cp-bar span').style.width = (100*answered/N)+'%';
   dots.forEach((d,i) => {d.classList.toggle('on', i === st.at); d.toggleAttribute('aria-current', i === st.at); d.classList.toggle('answered', st.answers[i] !== null); d.classList.toggle('flagged', !!st.flags[i]);});
   prev.disabled = st.at === 0; next.disabled = st.at === N-1;
   flag.setAttribute('aria-pressed', String(!!st.flags[st.at])); flag.textContent = st.flags[st.at] ? '⚑ Flagged' : 'Flag for review';
  };
  const renderQ = focus => {
   const i = st.at, q = Q[i];
   const answer = q.input
    ? `<div class="pt-input"><label for="rk-in-${i}">Your answer <small>Numbers only. Round as the question asks.</small></label><div class="pt-input-row">${q.prefix?`<span class="pt-unit">${e(q.prefix)}</span>`:''}<input id="rk-in-${i}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" maxlength="20" value="${e(st.answers[i] ?? '')}">${q.unit?`<span class="pt-unit">${e(q.unit)}</span>`:''}</div></div>`
    : q.options.map((o,j) => `<label class="mcq-option"><input type="radio" name="rk-q" value="${j}" ${st.answers[i]===j?'checked':''}><span><b class="pt-letter">${LETTERS[j]}.</b> ${e(o)}</span></label>`).join('');
   stage.innerHTML = `<fieldset class="pt-q" tabindex="-1"><legend><span class="cp-qnum">Question ${i+1} of ${N}</span>${e(q.prompt)}</legend>${answer}</fieldset>`;
   stage.querySelectorAll('[name="rk-q"]').forEach(r => r.addEventListener('change', () => {st.answers[i] = Number(r.value); confirming = false; msg.textContent = ''; submit.textContent = 'Submit test'; saveSoon(); status();}));
   const box = stage.querySelector('.pt-input input');
   box?.addEventListener('input', () => {const v = box.value.trim().slice(0, 20); st.answers[i] = v || null; confirming = false; msg.textContent = ''; saveSoon(); status();});
   box?.addEventListener('keydown', ev => {if(ev.key === 'Enter') {ev.preventDefault(); go(st.at+1);}});
   if(focus) (box || stage.querySelector('.pt-q')).focus({preventScroll:true});
  };
  const go = i => {if(i < 0 || i >= N || i === st.at) return; st.at = i; renderQ(true); status(); inner.scrollTo?.({top:0});};
  prev.addEventListener('click', () => go(st.at-1));
  next.addEventListener('click', () => go(st.at+1));
  dots.forEach(d => d.addEventListener('click', () => go(Number(d.dataset.go))));
  flag.addEventListener('click', () => {st.flags[st.at] = !st.flags[st.at]; status();});
  submit.addEventListener('click', () => {
   const blank = st.answers.map((a,i) => a === null ? i+1 : 0).filter(Boolean);
   dots.forEach((d,i) => d.classList.toggle('missing', st.answers[i] === null));
   if(!confirming) {
    confirming = true;
    msg.textContent = (blank.length ? `${blank.length} question${blank.length===1?' is':'s are'} unanswered (${blank.slice(0,12).join(', ')}${blank.length>12?'…':''}) and will be marked wrong. ` : 'All questions answered. ') + 'You only get one attempt. Select Submit test again to finish.';
    submit.textContent = 'Submit test for good'; return;
   }
   leave('finished');
  });
  const tick = () => {
   const left = st.endsAt - (Date.now() + offset), el = inner.querySelector('.ranked-clock');
   if(el) {el.textContent = clock(left)+' left'; el.classList.toggle('low', left < 5*60000);}
   if(left <= 0) leave('timeout');
  };
  renderQ(false); status(); tick(); ticker = setInterval(tick, 1000);
 }

 async function begin() {
  inner.innerHTML = `<p class="ranked-loading">Opening your ranked test…</p>`;
  // Full screen is requested first, while the click still counts as a user action.
  if(canFullscreen()) {
   try {await enterFullscreen(shell);}
   catch {failStart('Your browser blocked full screen. Ranked tests must be taken in full screen. Allow it and try again.', true); return;}
  }
  await refreshToken();
  let r;
  try {r = await api('POST', path('start'));}
  catch(err) {leaveFullscreen(); failStart(err.message, true); return;}
  if(r.state !== 'in_progress') {showResult(r); return;}
  offset = r.serverNow - Date.now();
  st = {...r, at:Math.max(0, r.answers.findIndex(a => a === null)), flags:Array(r.questions.length).fill(false)};
  play();
  tokenTimer = setInterval(refreshToken, 5*60000);
  // Without a full screen API (some phones), switching away still submits the test.
  arm();
  if(canFullscreen() && !fullscreenOn()) leave('exited_fullscreen');
 }
 begin();
}
