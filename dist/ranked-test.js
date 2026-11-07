// Ranked work runner: a locked, full-screen, timed session for ranked tests, ranked mock
// procedures and ranked uploads (skills and online submissions). The session fills the whole
// screen. Pressing Esc, leaving full screen, switching tabs or windows, or closing the page
// submits it at once. Unfinished work is locked by the server until the teacher reopens it.
// Choosing files to upload is the one exception: the file picker may pull the page out of
// full screen, so the student gets a short window to return instead of being submitted.
import {session, uploadFile} from './session.js';
import {mountMockLab, mockLabPage} from './mock-lab.js';

const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LETTERS = ['A','B','C','D','E'];
const clock = ms => {const s = Math.max(0, Math.round(ms/1000)), h = Math.floor(s/3600), m = Math.floor(s%3600/60); return (h ? h+':'+String(m).padStart(2,'0') : m)+':'+String(s%60).padStart(2,'0');};
const bytes = n => n >= 1e9 ? +(n/1e9).toFixed(1)+' GB' : n >= 1e6 ? +(n/1e6).toFixed(1)+' MB' : Math.max(1, Math.round(n/1e3))+' KB';
const RETURN_SECONDS = 20, PICKER_LIMIT_MS = 2*60000;
const REASON = {
 exited_fullscreen:'you left full screen',
 switched_away:'you switched to another tab or window',
 closed:'the page was closed or reloaded',
 timeout:'time ran out',
 finished:'you submitted it',
};
// What each kind is called on screen.
const NOUN = {test:'test', mock:'procedure', upload:'work'};
const LABEL = {'Ranked test':'RANKED TEST', 'Ranked mock procedure':'RANKED MOCK PROCEDURE', 'Ranked skill':'RANKED SKILL UPLOAD', 'Ranked online submission':'RANKED ONLINE SUBMISSION'};
const kindOf = type => type === 'Ranked mock procedure' ? 'mock' : type === 'Ranked skill' || type === 'Ranked online submission' ? 'upload' : 'test';

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

// The finished screen. Tests show areas, procedures show rating sheets, uploads list files.
export function resultHtml(r, {title='', type='Ranked test', place=null, of=null}={}) {
 const kind = r.kind || kindOf(type), noun = NOUN[kind], why = REASON[r.reason] || 'the session ended';
 const label = LABEL[type] || 'RANKED WORK';
 if(r.state === 'locked') {
  const detail = kind === 'test' ? `You answered ${r.answered} of ${r.total} questions.` : kind === 'mock' ? 'The procedure was not finished.' : 'No file had been uploaded.';
  const after = kind === 'mock' ? 'If your teacher reopens it, you start a fresh run.' : 'If your teacher reopens it, you continue with the time you had left.';
  return `${title?`<p class="subtle">${e(title)}</p>`:''}<span class="eyebrow">${label} · LOCKED</span><h2>Your ${noun} was submitted because ${e(why)}.</h2><p>${detail} Unfinished ranked work stays locked until your teacher reopens it. ${after}</p>`;
 }
 const head = `${title?`<p class="subtle">${e(title)}</p>`:''}<span class="eyebrow">${label} · SUBMITTED</span><h2>${r.reason === 'finished' ? 'Submitted.' : `Your ${noun} was submitted because ${e(why)}.`}</h2>`;
 const placeText = place ? ` · Place ${place} of ${of} in your chapter` : '';
 if(kind === 'upload') return head + `<p>${r.score == null ? 'Your teacher will score your submission. The score counts toward your global ranking.' : `Your teacher scored this <strong>${r.score}%</strong>${placeText}.`}</p>
  <ul class="rk-files rk-files-done">${(r.files||[]).map(f => `<li><span class="rk-file-name">${e(f.name)}</span><small>${bytes(f.size)}</small></li>`).join('')}</ul>${r.notes ? `<p class="subtle">Notes: ${e(r.notes)}</p>` : ''}`;
 const ring = `<div class="pt-score"><div class="pt-ring" style="--p:${r.score}"><strong>${r.score}%</strong></div><div><h3>${kind === 'mock' ? `${r.earned} of ${r.possible} points` : `${r.correct} of ${r.total} correct`}</h3><p>${clock(r.secondsUsed*1000)} used${placeText}</p><p class="subtle">Your score counts toward your global ranking.${kind === 'test' ? ' Questions stay private so the test is fair for everyone.' : ''}</p></div></div>`;
 const rows = kind === 'mock'
  ? `<h3>By rating sheet</h3><div class="pt-areas">${(r.sheets||[]).map(s => `<div class="pt-area"><div class="pt-area-row"><strong>${e(s.title)}</strong><span>${s.earned}/${s.possible}</span><span class="pt-meter" aria-hidden="true"><span style="width:${s.possible?100*s.earned/s.possible:0}%"></span></span></div></div>`).join('')}</div>`
  : `<h3>By test plan area</h3><div class="pt-areas">${(r.areas||[]).map(a => `<div class="pt-area"><div class="pt-area-row"><strong>${e(a.area)} <small>${a.weight}% of test</small></strong><span>${a.correct}/${a.total}</span><span class="pt-meter" aria-hidden="true"><span style="width:${a.total?100*a.correct/a.total:0}%"></span></span></div></div>`).join('')}</div>`;
 return head + ring + rows;
}

// Starts (or resumes) ranked work for an assignment. Must be called from a click so the
// browser allows full screen.
export function startRankedTest({id, title, type='Ranked test', api, onClose}) {
 const kind = kindOf(type), noun = NOUN[kind], label = LABEL[type] || 'RANKED WORK';
 const shell = document.createElement('div');
 shell.className = 'ranked-shell';
 shell.setAttribute('role', 'dialog');
 shell.setAttribute('aria-modal', 'true');
 shell.setAttribute('aria-label', title || 'Ranked work');
 shell.innerHTML = `<div class="ranked-inner"><p class="ranked-loading">Opening your ranked ${noun}…</p></div>`;
 document.body.append(shell);
 document.documentElement.classList.add('ranked-open');
 const inner = shell.querySelector('.ranked-inner');
 let armed = false, closed = false, st = null, ticker = null, saveTimer = null, token = null, tokenTimer = null, offset = 0;
 let lab = null, stopLab = null, pickerOpen = false, pickerTimer = null, gateTimer = null, afterPicker = null;
 const uploads = new Set();

 const refreshToken = () => session.user?.getIdToken().then(t => {token = t;}).catch(() => {});
 function dropLab() {try {stopLab?.();} catch {} stopLab = null;}
 function close() {
  disarm(); dropLab(); leaveFullscreen();
  shell.remove(); document.documentElement.classList.remove('ranked-open');
  onClose?.();
 }
 function showResult(r) {
  disarm(); dropLab(); leaveFullscreen();
  inner.innerHTML = `<section class="course-card ranked-result">${resultHtml(r, {title, type})}<div class="course-actions"><button class="button" type="button" data-ranked-close>Back to assignments</button></div></section>`;
  inner.querySelector('[data-ranked-close]').addEventListener('click', close);
  inner.querySelector('[data-ranked-close]').focus();
 }
 function failStart(message, retry) {
  inner.innerHTML = `<section class="course-card ranked-result"><span class="eyebrow">${label}</span><h2>This did not start.</h2><p>${e(message)}</p><div class="course-actions">${retry?'<button class="button" type="button" data-ranked-retry>Try again</button>':''}<button class="button secondary" type="button" data-ranked-close>Back to assignments</button></div></section>`;
  inner.querySelector('[data-ranked-close]').addEventListener('click', close);
  inner.querySelector('[data-ranked-retry]')?.addEventListener('click', begin);
 }

 // ----- leaving the session submits it -----
 // While the file picker is open the page may lose focus or full screen; that is allowed.
 const onFullscreen = () => {if(armed && !pickerOpen && !fullscreenOn()) leave('exited_fullscreen');};
 const onVisibility = () => {if(armed && !pickerOpen && document.visibilityState === 'hidden') leave('switched_away');};
 const onBlur = () => {if(armed && !pickerOpen) setTimeout(() => {if(armed && !pickerOpen && !document.hasFocus()) leave('switched_away');}, 150);};
 const onPageHide = () => {if(armed) leave('closed', true);};
 const onBeforeUnload = () => {if(armed) leave('closed', true);};
 // Some browsers never fire the picker's cancel event; focus coming back means it closed.
 const onFocusBack = () => {if(pickerOpen) setTimeout(() => afterPicker?.(), 1500);};
 const block = ev => {if(armed) ev.preventDefault();};
 const onKey = ev => {
  if(!armed) return;
  const k = ev.key.toLowerCase();
  if((ev.ctrlKey || ev.metaKey) && ['c','v','x','p','s','f','u','a'].includes(k) && !(k === 'a' && ev.target.matches?.('input,textarea'))) ev.preventDefault();
  if(['f5','f12','printscreen'].includes(k)) ev.preventDefault();
  // Developer tools: Ctrl+Shift+I/J/C/K on Windows and Linux, Cmd+Option+I/J/C on a Mac.
  // ev.code is used because Option changes ev.key on a Mac.
  if(((ev.ctrlKey && ev.shiftKey) || (ev.metaKey && ev.altKey)) && ['KeyI','KeyJ','KeyC','KeyK'].includes(ev.code)) {ev.preventDefault(); ev.stopPropagation();}
 };
 const BLOCKED = ['contextmenu','copy','cut','paste','dragstart','dragover','drop'];
 function arm() {
  armed = true;
  document.addEventListener('fullscreenchange', onFullscreen);
  document.addEventListener('webkitfullscreenchange', onFullscreen);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocusBack);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('beforeunload', onBeforeUnload);
  document.addEventListener('keydown', onKey, true);
  // Dropping a file on the page would open it and leave the session.
  for(const t of BLOCKED) window.addEventListener(t, block, true);
 }
 function disarm() {
  armed = false; clearInterval(ticker); clearTimeout(saveTimer); clearInterval(tokenTimer); clearTimeout(pickerTimer); clearInterval(gateTimer);
  document.removeEventListener('fullscreenchange', onFullscreen);
  document.removeEventListener('webkitfullscreenchange', onFullscreen);
  document.removeEventListener('visibilitychange', onVisibility);
  window.removeEventListener('blur', onBlur);
  window.removeEventListener('focus', onFocusBack);
  window.removeEventListener('pagehide', onPageHide);
  window.removeEventListener('beforeunload', onBeforeUnload);
  document.removeEventListener('keydown', onKey, true);
  for(const t of BLOCKED) window.removeEventListener(t, block, true);
 }

 const path = p => '/assignments/'+encodeURIComponent(id)+'/ranked/'+p;
 // What gets sent when the session closes.
 function payload(reason) {
  if(kind === 'test') return {answers:st.answers, reason};
  if(kind === 'mock') {
   const log = (lab?.getRun?.().log || []).slice(0, 1500).map(x => ({...x, say: typeof x.say === 'string' ? x.say.slice(0, 500) : x.say}));
   return {log, reason};
  }
  return {notes:st.notes, reason};
 }
 // While the page is being closed, only a keepalive request can still reach the server.
 function beacon(reason) {
  try {
   fetch('/api'+path('submit'), {method:'POST', keepalive:true, headers:{'Content-Type':'application/json', ...(token && {Authorization:'Bearer '+token})}, body:JSON.stringify(payload(reason))});
  } catch {}
 }
 let submitting = false;
 async function leave(reason, unloading=false) {
  if(!armed || submitting || closed) return;
  submitting = true;
  const body = payload(reason);
  disarm(); dropLab();
  for(const u of uploads) u.cancel();
  if(unloading) {
   beacon(reason); closed = true;
   inner.innerHTML = `<section class="course-card ranked-result"><span class="eyebrow">${label}</span><h2>Your ${noun} was submitted because the page was closed or reloaded.</h2><p>If it was unfinished, your teacher has to reopen it.</p><div class="course-actions"><button class="button" type="button" data-ranked-close>Back to assignments</button></div></section>`;
   inner.querySelector('[data-ranked-close]').addEventListener('click', close);
   return;
  }
  inner.innerHTML = `<p class="ranked-loading">Submitting your ${noun}…</p>`;
  for(let tries = 0; tries < 3; tries++) {
   try {const r = await api('POST', path('submit'), body); closed = true; showResult(r); return;}
   catch(err) {if(tries === 2) {closed = true; failStart(err.message+' Your work was saved as you went. Ask your teacher to check it.', false);}}
  }
 }

 const bar = (meta='') => `<header class="ranked-bar">
   <div><span class="eyebrow">${label} · ${e(st.event)}</span><strong>${e(st.title)}</strong></div>
   <div class="ranked-meta">${meta}<span class="pt-clock ranked-clock" role="timer" aria-live="off"></span></div>
  </header>`;
 const warning = extra => `<p class="ranked-warning">Stay on this screen. Pressing Esc, leaving full screen or switching tabs submits your ${noun} right away.${extra ? ' '+extra : ''}</p>`;
 function startClock() {
  const tick = () => {
   const left = st.endsAt - (Date.now() + offset), el = inner.querySelector('.ranked-clock');
   if(el) {el.textContent = clock(left)+' left'; el.classList.toggle('low', left < 5*60000);}
   if(left <= 0) leave('timeout');
  };
  tick(); ticker = setInterval(tick, 1000);
 }

 // ----- ranked test -----
 const saveAnswersSoon = () => {clearTimeout(saveTimer); saveTimer = setTimeout(() => {api('PUT', path('answers'), {answers:st.answers}).catch(() => {});}, 500);};
 function playTest() {
  const Q = st.questions, N = Q.length;
  inner.innerHTML = `${bar('<span class="pt-answered"></span>')}
   <div class="cp-bar" aria-hidden="true"><span></span></div>
   ${warning()}
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
   stage.querySelectorAll('[name="rk-q"]').forEach(r => r.addEventListener('change', () => {st.answers[i] = Number(r.value); confirming = false; msg.textContent = ''; submit.textContent = 'Submit test'; saveAnswersSoon(); status();}));
   const box = stage.querySelector('.pt-input input');
   box?.addEventListener('input', () => {const v = box.value.trim().slice(0, 20); st.answers[i] = v || null; confirming = false; msg.textContent = ''; saveAnswersSoon(); status();});
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
  renderQ(false); status(); startClock();
 }

 // ----- ranked mock procedure: the lab's own graded run, finished by the lab -----
 function playMock() {
  inner.innerHTML = `${bar()}${warning('Finish & grade when you are done. You get one run.')}<div class="ranked-lab">${mockLabPage(st.event)}</div>`;
  lab = {onFinish: ({timeUp}) => leave(timeUp ? 'timeout' : 'finished')};
  stopLab = mountMockLab(inner.querySelector('.ranked-lab'), {ranked:lab});
  startClock();
 }

 // ----- ranked upload -----
 const saveNotesSoon = () => {clearTimeout(saveTimer); saveTimer = setTimeout(() => {api('PUT', path('notes'), {notes:st.notes}).catch(() => {});}, 600);};
 const newId = () => {const a = new Uint8Array(15); crypto.getRandomValues(a); return [...a].map(b => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 62]).join('') + Date.now().toString(36);};
 function playUpload() {
  const skill = type === 'Ranked skill';
  inner.innerHTML = `${bar('<span class="rk-count"></span>')}${warning('Choosing files is allowed and does not submit your work.')}
   <section class="course-card ranked-card rk-upload">
    <h2>${skill ? 'Upload your skill or speech video' : 'Upload your submission'}</h2>
    <p>${skill ? 'Upload the video of your skill or speech and any files your teacher asked for.' : 'Upload your project files.'} Up to ${st.maxFiles} files, ${bytes(st.maxBytes)} each. Only files uploaded during this session count, and uploads cannot be changed once they finish.</p>
    <input type="file" multiple hidden data-file>
    <div class="course-actions"><button type="button" class="button secondary" data-pick>Choose files</button></div>
    <ul class="rk-files" data-files></ul>
    <label class="field">Notes for your teacher (optional)<textarea rows="4" maxlength="4000" data-notes placeholder="${skill ? 'Anything your teacher should know about your video' : 'Links, instructions or anything your teacher should know'}">${e(st.notes)}</textarea></label>
    <div class="pt-submit"><p class="pt-msg" role="status" aria-live="polite"></p><div class="course-actions"><button type="button" class="button" data-submit>Submit</button></div></div>
   </section>`;
  const input = inner.querySelector('[data-file]'), list = inner.querySelector('[data-files]'), msg = inner.querySelector('.pt-msg'), submit = inner.querySelector('[data-submit]');
  const pending = new Map();
  let confirming = false;
  const render = () => {
   inner.querySelector('.rk-count').textContent = `${st.files.length} of ${st.maxFiles} files`;
   list.innerHTML = st.files.map(f => `<li><span class="rk-file-name">${e(f.name)}</span><small>${bytes(f.size)} · uploaded</small><button type="button" class="text-button" data-remove="${e(f.id)}">Remove</button></li>`).join('')
    + [...pending.values()].map(p => `<li class="${p.error?'rk-error':''}"><span class="rk-file-name">${e(p.name)}</span><small>${p.error ? e(p.error) : `Uploading ${Math.round(p.pct*100)}%`}</small>${p.error ? `<button type="button" class="text-button" data-dismiss="${e(p.key)}">Dismiss</button>` : `<span class="pt-meter" aria-hidden="true"><span style="width:${p.pct*100}%"></span></span>`}</li>`).join('');
   inner.querySelector('[data-pick]').disabled = st.files.length + [...pending.values()].filter(p => !p.error).length >= st.maxFiles;
  };
  const busy = () => [...pending.values()].some(p => !p.error);
  async function send(file) {
   const key = newId(), item = {key, name:file.name, pct:0, error:''};
   pending.set(key, item); render();
   if(file.size > st.maxBytes) {item.error = `Too large: the limit is ${bytes(st.maxBytes)}.`; render(); return;}
   const up = uploadFile(st.folder + key, file, pct => {item.pct = pct; render();});
   uploads.add(up);
   try {
    await up.done;
    const r = await api('POST', path('files'), {path:st.folder + key, name:file.name.slice(0, 200)});
    st.files = r.files; pending.delete(key);
   } catch(err) {item.error = err.message;}
   finally {uploads.delete(up);}
   if(armed) render();
  }
  // The picker can take the page out of focus or full screen. That is allowed while it is open;
  // afterwards the student has a short time to return to full screen.
  function pickerClosed() {
   if(!pickerOpen) return;
   pickerOpen = false; clearTimeout(pickerTimer);
   if(!armed) return;
   setTimeout(() => {
    if(!armed) return;
    if(document.visibilityState === 'hidden') return leave('switched_away');
    if(canFullscreen() && !fullscreenOn()) returnGate();
   }, 300);
  }
  inner.querySelector('[data-pick]').addEventListener('click', () => {
   pickerOpen = true; clearTimeout(pickerTimer);
   pickerTimer = setTimeout(() => {pickerClosed(); if(armed && !document.hasFocus()) leave('switched_away');}, PICKER_LIMIT_MS);
   input.value = ''; input.click();
  });
  input.addEventListener('change', () => {
   const room = st.maxFiles - st.files.length - [...pending.values()].filter(p => !p.error).length;
   const files = [...input.files];
   if(files.length > room) msg.textContent = `Only ${room} more file${room===1?'':'s'} can be added.`;
   files.slice(0, Math.max(0, room)).forEach(send);
   pickerClosed();
  });
  input.addEventListener('cancel', pickerClosed);
  afterPicker = pickerClosed;
  list.addEventListener('click', async ev => {
   const rm = ev.target.closest('[data-remove]'), dis = ev.target.closest('[data-dismiss]');
   if(dis) {pending.delete(dis.dataset.dismiss); render(); return;}
   if(!rm) return;
   rm.disabled = true;
   try {st.files = (await api('DELETE', path('files/'+encodeURIComponent(rm.dataset.remove)))).files;} catch(err) {msg.textContent = err.message;}
   render();
  });
  inner.querySelector('[data-notes]').addEventListener('input', ev => {st.notes = ev.target.value.slice(0, 4000); confirming = false; submit.textContent = 'Submit'; saveNotesSoon();});
  submit.addEventListener('click', () => {
   if(busy()) {msg.textContent = 'Wait for your uploads to finish before you submit.'; return;}
   if(!confirming) {
    confirming = true;
    msg.textContent = (st.files.length ? `${st.files.length} file${st.files.length===1?'':'s'} will be submitted. ` : 'You have not uploaded any files. ') + 'You only get one attempt. Select Submit again to finish.';
    submit.textContent = 'Submit for good'; return;
   }
   leave('finished');
  });
  render(); startClock();
 }

 // Shown after the file picker took the page out of full screen.
 function returnGate() {
  if(inner.querySelector('.ranked-gate')) return;
  let left = RETURN_SECONDS;
  const gate = document.createElement('div');
  gate.className = 'ranked-gate';
  gate.innerHTML = `<div class="course-card"><h2>Return to full screen</h2><p>Choosing files took you out of full screen. Return within <strong data-left>${left}</strong> seconds or your work will be submitted.</p><div class="course-actions"><button type="button" class="button" data-return>Return to full screen</button></div></div>`;
  shell.append(gate);
  const done = () => {clearInterval(gateTimer); gate.remove();};
  gate.querySelector('[data-return]').addEventListener('click', () => enterFullscreen(shell).then(done, () => {}));
  gate.querySelector('[data-return]').focus();
  gateTimer = setInterval(() => {
   if(!armed) return done();
   if(fullscreenOn()) return done();
   left--; const n = gate.querySelector('[data-left]'); if(n) n.textContent = left;
   if(left <= 0) {done(); leave('exited_fullscreen');}
  }, 1000);
 }

 async function begin() {
  inner.innerHTML = `<p class="ranked-loading">Opening your ranked ${noun}…</p>`;
  // Full screen is requested first, while the click still counts as a user action.
  if(canFullscreen()) {
   try {await enterFullscreen(shell);}
   catch {failStart('Your browser blocked full screen. Ranked work must be done in full screen. Allow it and try again.', true); return;}
  }
  await refreshToken();
  let r;
  try {r = await api('POST', path('start'));}
  catch(err) {leaveFullscreen(); failStart(err.message, true); return;}
  if(r.state !== 'in_progress') {showResult(r); return;}
  offset = r.serverNow - Date.now();
  st = r.kind === 'test' ? {...r, at:Math.max(0, r.answers.findIndex(a => a === null)), flags:Array(r.questions.length).fill(false)} : {...r};
  if(r.kind === 'mock') playMock(); else if(r.kind === 'upload') playUpload(); else playTest();
  tokenTimer = setInterval(refreshToken, 5*60000);
  // Without a full screen API (some phones), switching away still submits.
  arm();
  if(canFullscreen() && !fullscreenOn()) leave('exited_fullscreen');
 }
 begin();
}
