// Practice tests: full-length Round One simulations for written-test events.
// Before starting, students choose to check each answer as they go or to be graded at the end.
// Progress and scores are kept in this browser's storage.
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LETTERS = ['A','B','C','D','E'];
const REGISTRY = {
 'CPR/First Aid': [{id:'cpr-first-aid-1', load:()=>import('./practice/cpr-first-aid-1.js')}]
};
const loaded = {};
export const practiceTests = name => REGISTRY[name] || [];
export const hasPracticeTests = name => practiceTests(name).length > 0;
export const testsReady = name => practiceTests(name).every(t => loaded[t.id]);
export const loadTests = name => Promise.all(practiceTests(name).filter(t => !loaded[t.id]).map(t => t.load().then(m => {loaded[t.id] = m.default;})));

const testHref = (name, id='') => '#/event/'+encodeURIComponent(name)+'/tests'+(id?'/'+encodeURIComponent(id):'');
const draftKey = (uid,id) => 'valus-practice:'+(uid||'guest')+':'+id;
const historyKey = (uid,id) => 'valus-practice-history:'+(uid||'guest')+':'+id;
const read = key => {try {return JSON.parse(localStorage.getItem(key));} catch {return null;}};
const write = (key,value) => {try {localStorage.setItem(key, JSON.stringify(value)); return true;} catch {return false;}};
const drop = key => {try {localStorage.removeItem(key);} catch {}};
const clock = ms => {const s = Math.max(0, Math.round(ms/1000)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const MODE_LABEL = {check:'Check as I go', exam:'Grade at the end'};
// The app re-renders the page on window focus. Remember which screen each test was on so a
// re-render keeps the student in the test or on their results. Navigating elsewhere resets it.
const VIEW = {};
if(typeof window !== 'undefined') window.addEventListener('hashchange', () => {for(const k in VIEW) delete VIEW[k];});

function breakdown(test, answers) {
 return test.plan.map(p => {
  const topics = p.topics.map(topic => {
   const qs = test.questions.map((q,i) => ({q,i})).filter(x => x.q.topic === topic);
   return {topic, total:qs.length, correct:answers ? qs.filter(x => answers[x.i] === x.q.answer).length : 0};
  });
  return {area:p.area, weight:p.weight, topics, total:topics.reduce((a,t) => a+t.total, 0), correct:topics.reduce((a,t) => a+t.correct, 0)};
 });
}

function planHtml(test) {
 const areas = breakdown(test);
 return `<section class="pt-plan" aria-labelledby="pt-plan-title"><h3 id="pt-plan-title">Matches the official test plan</h3>
  <div class="pt-plan-bar" aria-hidden="true">${areas.map((a,i) => `<span class="pt-plan-seg seg-${i}" style="flex:${a.weight}"><strong>${a.weight}%</strong> ${e(a.area)}</span>`).join('')}</div>
  <div class="pt-plan-areas">${areas.map((a,i) => `<div class="pt-plan-area seg-${i}"><h4>${e(a.area)} · ${a.weight}% <small>${a.total} questions</small></h4><ul>${a.topics.map(t => `<li><span>${e(t.topic)}</span><span>${t.total}</span></li>`).join('')}</ul></div>`).join('')}</div>
  <p class="subtle">HOSA sets the weight of each area. Valus chose how questions are split among the topics inside each area.</p></section>`;
}

export function practiceTestsPage(name, testId, {userId}={}) {
 const tests = practiceTests(name);
 if(!tests.length) return `<section class="event-coming-soon" aria-labelledby="tool-title"><span class="eyebrow">YOUR EVENT TOOLKIT</span><h2 id="tool-title">Practice Tests</h2><h3>Coming soon.</h3><p>A little room for what comes next. This section is being prepared.</p></section>`;
 if(testId) {
  const test = loaded[testId];
  if(!test || test.event !== name) return `<section class="course-card"><h2>Practice test not found</h2><p><a href="${testHref(name)}">See all practice tests</a></p></section>`;
  return `<section class="course-card pt" data-practice="${e(test.id)}" aria-live="off"></section>`;
 }
 const first = loaded[tests[0].id];
 return `<section class="course-card pt-overview"><span class="eyebrow">PRACTICE TESTS · ROUND ONE</span><h2>Train under test conditions.</h2><p>Round One is a ${first.questions.length}-question multiple-choice test with a ${first.minutes}-minute limit. Each Valus practice test follows the same format and the same weights as the official HOSA test plan. Choose to check answers as you go or to be graded at the end.</p>
  <ol class="pt-list">${tests.map(t => {const test = loaded[t.id], hist = read(historyKey(userId,t.id)) || [], draft = read(draftKey(userId,t.id)), best = hist.length ? Math.max(...hist.map(h => h.score)) : null;
   return `<li><a href="${testHref(name,test.id)}"><span class="pt-list-num">${String(tests.indexOf(t)+1).padStart(2,'0')}</span><span><strong>${e(test.title)}</strong><small>${e(test.subtitle)} · ${test.questions.length} questions · ${test.minutes} min${draft?' · In progress':''}${hist.length?' · Last '+hist.at(-1).score+'% · Best '+best+'%':''}</small></span><span class="pt-list-go">${draft?'Resume':hist.length?'Retake':'Start'} →</span></a></li>`;}).join('')}</ol>
  <p class="subtle">Scores and unfinished tests are saved in this browser.</p></section>${planHtml(first)}`;
}

export function mountPracticeTest(root, {userId}={}) {
 const host = root.querySelector('[data-practice]');
 if(!host) return;
 const test = loaded[host.dataset.practice], Q = test.questions, N = Q.length;
 const sk = draftKey(userId,test.id), hk = historyKey(userId,test.id), overview = testHref(test.event);
 let st = read(sk), ticker = null;
 if(st && (!Array.isArray(st.answers) || st.answers.length !== N)) st = null;
 const save = () => write(sk, st);
 const stop = () => {clearInterval(ticker); ticker = null;};
 const top = () => {if(host.getBoundingClientRect().top < 0) host.scrollIntoView({behavior:'smooth', block:'start'});};

 function setup() {
  stop(); VIEW[test.id] = {view:'setup'};
  const hist = read(hk) || [], last = hist.at(-1);
  const resume = st ? `<div class="callout pt-resume"><strong>You have a test in progress.</strong><p>${st.answers.filter(a => a !== null).length} of ${N} answered · ${MODE_LABEL[st.mode]}${st.mode==='exam'?' · '+clock(st.endsAt-Date.now())+' left':''}</p><button class="button" type="button" data-pt-resume>Resume test →</button><p class="subtle">Or choose a grading option below to start over.</p></div>` : '';
  host.innerHTML = `<span class="eyebrow">${e(test.event)} · ${e(test.title)}</span><h2>${e(test.title)}</h2><p>${e(test.subtitle)}: ${N} multiple-choice questions, written to the difficulty of the HOSA sample questions and the official references (AHA and American Red Cross BLS and First Aid, DHO: Health Science).</p>${resume}
   <fieldset class="pt-modes"><legend>How do you want to be graded?</legend>
    <label class="pt-mode"><input type="radio" name="pt-mode" value="check"><span><strong>Check as I go</strong><small>Check each answer as you go and see why it is right or wrong before moving on. A clock counts up so you can track your pace. Best for learning.</small></span></label>
    <label class="pt-mode"><input type="radio" name="pt-mode" value="exam"><span><strong>Grade at the end</strong><small>Answer all ${N} questions, then submit for your score, like Round One. A ${test.minutes}-minute countdown submits the test when time runs out. Best for test practice.</small></span></label>
   </fieldset>
   <p class="pt-msg" role="status" aria-live="polite"></p>
   <div class="course-actions"><button class="button" type="button" data-pt-begin>Begin test →</button>${last?`<button class="text-button" type="button" data-pt-last>Review last attempt (${last.score}%)</button>`:''}<a class="text-button" href="${overview}">← All practice tests</a></div>`;
  host.querySelector('[data-pt-resume]')?.addEventListener('click', play);
  host.querySelector('[data-pt-last]')?.addEventListener('click', () => results(last));
  host.querySelector('[data-pt-begin]').addEventListener('click', () => {
   const mode = host.querySelector('[name="pt-mode"]:checked')?.value;
   if(!mode) {host.querySelector('.pt-msg').textContent = 'Choose how you want to be graded first.'; host.querySelector('.pt-modes').classList.add('missing'); return;}
   const now = Date.now();
   st = {mode, answers:Array(N).fill(null), checked:Array(N).fill(false), flags:Array(N).fill(false), at:0, startedAt:now, endsAt:mode==='exam'?now+test.minutes*60000:null};
   save(); play();
  });
  host.querySelectorAll('[name="pt-mode"]').forEach(r => r.addEventListener('change', () => {host.querySelector('.pt-modes').classList.remove('missing'); host.querySelector('.pt-msg').textContent = '';}));
 }

 function play() {
  VIEW[test.id] = {view:'play'};
  const check = st.mode === 'check';
  host.innerHTML = `<div class="pt-top">
    <div class="pt-meta"><span class="pt-count"></span><span class="pt-answered"></span><span class="pt-clock" role="timer"></span></div>
    <div class="cp-bar" aria-hidden="true"><span></span></div>
   </div>
   <details class="pt-map" open><summary>Question map</summary><nav class="cp-dots" aria-label="Test questions">${Q.map((_,i) => `<button type="button" class="cp-dot" data-go="${i}" aria-label="Question ${i+1}">${i+1}</button>`).join('')}</nav><p class="pt-legend">${check?'Green: correct · Red underline: missed · Filled: answered, not checked':'Filled: answered · Dashed: flagged for review'}</p></details>
   <div class="pt-stage"></div>
   <div class="cp-nav"><button type="button" class="button secondary" data-pt-prev>← Previous</button><span class="pt-mid">${check?'<button type="button" class="button" data-pt-check>Check answer</button>':'<button type="button" class="text-button" data-pt-flag aria-pressed="false">Flag for review</button>'}</span><button type="button" class="button${check?' secondary':''}" data-pt-next>Next →</button></div>
   <div class="pt-submit"><p class="pt-msg" role="status" aria-live="polite"></p><div class="course-actions"><button type="button" class="button secondary" data-pt-submit>Submit test</button><button type="button" class="text-button" data-pt-exit>Save and exit</button></div></div>`;
  const stage = host.querySelector('.pt-stage'), dots = [...host.querySelectorAll('[data-go]')], msg = host.querySelector('.pt-submit .pt-msg');
  const prev = host.querySelector('[data-pt-prev]'), next = host.querySelector('[data-pt-next]'), submit = host.querySelector('[data-pt-submit]');
  const checkBtn = host.querySelector('[data-pt-check]'), flagBtn = host.querySelector('[data-pt-flag]');
  let confirming = false;
  const status = () => {
   const answered = st.answers.filter(a => a !== null).length;
   host.querySelector('.pt-count').textContent = `Question ${st.at+1} of ${N}`;
   host.querySelector('.pt-answered').textContent = check ? `${st.checked.filter((c,i) => c && st.answers[i] === Q[i].answer).length} correct · ${st.checked.filter(Boolean).length} checked` : `${answered} of ${N} answered`;
   host.querySelector('.cp-bar span').style.width = (100*answered/N)+'%';
   dots.forEach((d,i) => {
    d.classList.toggle('on', i === st.at); d.toggleAttribute('aria-current', i === st.at);
    d.classList.toggle('answered', st.answers[i] !== null); d.classList.toggle('flagged', !!st.flags[i]);
    if(check && st.checked[i]) d.dataset.state = st.answers[i] === Q[i].answer ? 'good' : 'bad'; else delete d.dataset.state;
   });
   prev.disabled = st.at === 0; next.disabled = st.at === N-1;
   if(checkBtn) {checkBtn.disabled = st.answers[st.at] === null || st.checked[st.at]; checkBtn.textContent = st.checked[st.at] ? 'Answer checked' : 'Check answer';}
   if(flagBtn) {flagBtn.setAttribute('aria-pressed', String(!!st.flags[st.at])); flagBtn.textContent = st.flags[st.at] ? '⚑ Flagged' : 'Flag for review';}
   submit.classList.toggle('secondary', st.at !== N-1 && answered < N);
  };
  const renderQ = (focus) => {
   const i = st.at, q = Q[i], done = check && st.checked[i];
   stage.innerHTML = `<fieldset class="pt-q" tabindex="-1"><legend><span class="cp-qnum">Question ${i+1} of ${N}</span>${e(q.prompt)}</legend>${q.options.map((o,j) => `<label class="mcq-option"${done?` data-state="${j===q.answer?'good':j===st.answers[i]?'bad':''}"`:''}><input type="radio" name="pt-q" value="${j}" ${st.answers[i]===j?'checked':''} ${done?'disabled':''}><span><b class="pt-letter">${LETTERS[j]}.</b> ${e(o)}</span></label>`).join('')}${done?feedback(q, st.answers[i]):''}</fieldset>`;
   stage.querySelectorAll('[name="pt-q"]').forEach(r => r.addEventListener('change', () => {st.answers[i] = Number(r.value); confirming = false; msg.textContent = ''; save(); status();}));
   if(focus) stage.querySelector('.pt-q').focus({preventScroll:true});
  };
  const go = i => {
   if(i < 0 || i >= N || i === st.at) return;
   const dir = i > st.at ? 1 : -1; st.at = i; save(); renderQ(true); status();
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches) stage.firstElementChild.animate([{opacity:0,transform:`translateX(${dir*28}px)`},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});
   top();
  };
  prev.addEventListener('click', () => go(st.at-1));
  next.addEventListener('click', () => go(st.at+1));
  dots.forEach(d => d.addEventListener('click', () => go(Number(d.dataset.go))));
  checkBtn?.addEventListener('click', () => {if(st.answers[st.at] === null) return; st.checked[st.at] = true; save(); renderQ(false); status(); stage.querySelector('.question-feedback')?.focus?.();});
  flagBtn?.addEventListener('click', () => {st.flags[st.at] = !st.flags[st.at]; save(); status();});
  host.querySelector('[data-pt-exit]').addEventListener('click', () => {save(); stop(); location.hash = overview;});
  submit.addEventListener('click', () => {
   const blank = st.answers.map((a,i) => a === null ? i+1 : 0).filter(Boolean), flagged = check ? [] : st.flags.map((f,i) => f ? i+1 : 0).filter(Boolean);
   dots.forEach((d,i) => d.classList.toggle('missing', st.answers[i] === null));
   if(!confirming && (blank.length || flagged.length)) {
    confirming = true;
    msg.textContent = (blank.length ? `${blank.length} question${blank.length===1?' is':'s are'} unanswered (${blank.slice(0,12).join(', ')}${blank.length>12?'…':''}) and will be marked wrong. ` : '') + (flagged.length ? `You flagged ${flagged.join(', ')} for review. ` : '') + 'Select Submit test again to finish, or use the question map to go back.';
    submit.textContent = 'Submit test anyway'; return;
   }
   finish(false);
  });
  const tick = () => {
   if(!host.isConnected) return stop();
   const el = host.querySelector('.pt-clock');
   if(check) {el.textContent = 'Time ' + clock(Date.now()-st.startedAt); return;}
   const left = st.endsAt - Date.now();
   el.textContent = clock(left) + ' left'; el.classList.toggle('low', left < 5*60000);
   if(left <= 0) finish(true);
  };
  stop(); tick(); if(st) ticker = setInterval(tick, 1000);
  if(st) {renderQ(false); status();}
 }

 function feedback(q, picked) {
  const ok = picked === q.answer;
  return `<div class="question-feedback pt-feedback" data-state="${ok?'good':'bad'}" tabindex="-1"><strong>${ok?'Correct.':'Not quite. The answer is '+LETTERS[q.answer]+'.'}</strong> ${e(q.explain)}<small>Topic: ${e(q.topic)} · Reference: ${e(q.ref)}</small></div>`;
 }

 function finish(timedOut) {
  if(!st) return;
  stop();
  const correct = Q.filter((q,i) => st.answers[i] === q.answer).length;
  const attempt = {date:Date.now(), mode:st.mode, correct, total:N, score:Math.round(100*correct/N), seconds:Math.round(((st.mode==='exam'?Math.min(Date.now(),st.endsAt):Date.now())-st.startedAt)/1000), timedOut, answers:st.answers};
  const hist = (read(hk) || []).map(({answers, ...rest}) => rest);
  hist.push(attempt); write(hk, hist.slice(-20));
  drop(sk); st = null;
  results(attempt);
 }

 function results(a, scroll=true) {
  stop(); VIEW[test.id] = {view:'results', attempt:a};
  const answers = a.answers || [], areas = breakdown(test, answers), missed = Q.filter((q,i) => answers[i] !== q.answer).length;
  const bar = (c,t) => `<span class="pt-meter" aria-hidden="true"><span style="width:${t?100*c/t:0}%"></span></span>`;
  host.innerHTML = `<span class="eyebrow">RESULTS · ${e(test.title)}</span>
   <div class="pt-score"><div class="pt-ring" style="--p:${a.score}"><strong>${a.score}%</strong></div><div><h2>${a.correct} of ${a.total} correct</h2><p>${MODE_LABEL[a.mode]} · ${clock(a.seconds*1000)} ${a.mode==='exam'?'of '+test.minutes+':00 used':'total'}${a.timedOut?' · Time ran out, so the test was submitted automatically':''}</p><p class="subtle">HOSA has no set passing score for Round One: the highest-scoring teams advance to the skills round. Aim to improve your weakest topics below.</p></div></div>
   <h3>By test plan area</h3>
   <div class="pt-areas">${areas.map(ar => `<div class="pt-area"><div class="pt-area-row"><strong>${e(ar.area)} <small>${ar.weight}% of test</small></strong><span>${ar.correct}/${ar.total}</span>${bar(ar.correct,ar.total)}</div><ul>${ar.topics.map(t => `<li class="pt-area-row"><span>${e(t.topic)}</span><span>${t.correct}/${t.total}</span>${bar(t.correct,t.total)}</li>`).join('')}</ul></div>`).join('')}</div>
   <h3>Review your answers</h3>
   <div class="pt-filter" role="group" aria-label="Filter questions"><button type="button" class="cp-dot on" data-filter="all" aria-pressed="true">All ${N}</button><button type="button" class="cp-dot" data-filter="missed" aria-pressed="false">Missed ${missed}</button></div>
   <ol class="pt-review">${Q.map((q,i) => {const p = answers[i], ok = p === q.answer;
    return `<li data-ok="${ok}"><p class="pt-review-q"><span class="cp-qnum">Question ${i+1} · ${ok?'Correct':p===null||p===undefined?'Not answered':'Missed'}</span>${e(q.prompt)}</p><ul class="pt-review-opts">${q.options.map((o,j) => `<li class="${j===q.answer?'is-answer':''} ${j===p&&!ok?'is-wrong':''}"><b class="pt-letter">${LETTERS[j]}.</b> ${e(o)}${j===q.answer?' <em>Correct answer</em>':''}${j===p&&!ok?' <em>Your answer</em>':''}</li>`).join('')}</ul><p class="pt-explain">${e(q.explain)}<small>Topic: ${e(q.topic)} · Reference: ${e(q.ref)}</small></p></li>`;}).join('')}</ol>
   <div class="course-actions"><button class="button" type="button" data-pt-retake>Retake test →</button><a class="text-button" href="${overview}">← All practice tests</a></div>`;
  host.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
   const missedOnly = b.dataset.filter === 'missed';
   host.querySelectorAll('[data-filter]').forEach(x => {x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b));});
   host.querySelectorAll('.pt-review>li').forEach(li => {li.hidden = missedOnly && li.dataset.ok === 'true';});
  }));
  host.querySelector('[data-pt-retake]').addEventListener('click', () => {setup(); top();});
  if(scroll) top();
 }

 const was = VIEW[test.id];
 if(was?.view === 'play' && st) play();
 else if(was?.view === 'results') results(was.attempt, false);
 else setup();
}
