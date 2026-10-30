// Practice tests: full-length Round One simulations for written-test events.
// Before starting, students choose to check each answer as they go or to be graded at the end.
// Submitted attempts are graded and saved by the server (GET/POST /practice/...), so students can
// review any past submission and their scores feed the dashboards. An unfinished test is kept in this browser.
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LETTERS = ['A','B','C','D','E'];
// One entry per test. Imports are written out so the server bundler can find every file.
const REGISTRY = {};
for(const [event, id, load] of [
 ['CPR/First Aid', 'cpr-first-aid-1', () => import('./practice/cpr-first-aid-1.js')],
 ['Medical Terminology', 'medical-terminology-1', () => import('./practice/medical-terminology-1.js')],
 ['Pathophysiology', 'pathophysiology-1', () => import('./practice/pathophysiology-1.js')],
 ['Medical Math', 'medical-math-1', () => import('./practice/medical-math-1.js')],
 ['Pharmacology', 'pharmacology-1', () => import('./practice/pharmacology-1.js')],
 ['Nutrition', 'nutrition-1', () => import('./practice/nutrition-1.js')],
 ['Phlebotomy', 'phlebotomy-1', () => import('./practice/phlebotomy-1.js')],
 ['Emergency Medical Technician', 'emergency-medical-technician-1', () => import('./practice/emergency-medical-technician-1.js')],
 ['Medical Law & Ethics', 'medical-law-ethics-1', () => import('./practice/medical-law-ethics-1.js')],
 ['Human Growth & Development', 'human-growth-development-1', () => import('./practice/human-growth-development-1.js')],
 ['Behavioral Health', 'behavioral-health-1', () => import('./practice/behavioral-health-1.js')],
 ['Nursing Assisting', 'nursing-assisting-1', () => import('./practice/nursing-assisting-1.js')],
 ['Home Health Aide', 'home-health-aide-1', () => import('./practice/home-health-aide-1.js')],
 ['Medical Assisting', 'medical-assisting-1', () => import('./practice/medical-assisting-1.js')],
 ['Patient Care Technician', 'patient-care-technician-1', () => import('./practice/patient-care-technician-1.js')],
 ['Pharmacy Science', 'pharmacy-science-1', () => import('./practice/pharmacy-science-1.js')],
 ['Clinical Lab Science (Medical Lab Scientist)', 'clinical-lab-science-1', () => import('./practice/clinical-lab-science-1.js')],
 ['Respiratory Therapy', 'respiratory-therapy-1', () => import('./practice/respiratory-therapy-1.js')],
 ['Sports Medicine', 'sports-medicine-1', () => import('./practice/sports-medicine-1.js')],
 ['Physical Therapy', 'physical-therapy-1', () => import('./practice/physical-therapy-1.js')],
 ['Occupational Therapy', 'occupational-therapy-1', () => import('./practice/occupational-therapy-1.js')],
 ['Surgical Technologist', 'surgical-technologist-1', () => import('./practice/surgical-technologist-1.js')],
 ['Dental Science', 'dental-science-1', () => import('./practice/dental-science-1.js')],
 ['Dental Terminology', 'dental-terminology-1', () => import('./practice/dental-terminology-1.js')],
 ['Clinical Nursing', 'clinical-nursing-1', () => import('./practice/clinical-nursing-1.js')],
 ['Genetics', 'genetics-1', () => import('./practice/genetics-1.js')],
 ['Veterinary Science', 'veterinary-science-1', () => import('./practice/veterinary-science-1.js')],
 ['CERT Skills', 'cert-skills-1', () => import('./practice/cert-skills-1.js')],
 ['Forensic Science', 'forensic-science-1', () => import('./practice/forensic-science-1.js')],
 ['Biotechnology', 'biotechnology-1', () => import('./practice/biotechnology-1.js')],
 ['Physician Assistant - Medical Case Challenge', 'physician-assistant-1', () => import('./practice/physician-assistant-1.js')],
 ['Epidemiology', 'epidemiology-1', () => import('./practice/epidemiology-1.js')],
 ['Healthcare Administration', 'healthcare-administration-1', () => import('./practice/healthcare-administration-1.js')],
 ['Health Informatics', 'health-informatics-1', () => import('./practice/health-informatics-1.js')],
 ['Parliamentary Procedure', 'parliamentary-procedure-1', () => import('./practice/parliamentary-procedure-1.js')],
 ['Organizational Leadership', 'organizational-leadership-1', () => import('./practice/organizational-leadership-1.js')],
 ['Medical Spelling', 'medical-spelling-1', () => import('./practice/medical-spelling-1.js')],
 ['HOSA Bowl', 'hosa-bowl-1', () => import('./practice/hosa-bowl-1.js')],
 ['Creative Problem Solving', 'creative-problem-solving-1', () => import('./practice/creative-problem-solving-1.js')],
 ['Medical Reading', 'medical-reading-1', () => import('./practice/medical-reading-1.js')],
 ['World Health & Disparities', 'world-health-disparities-1', () => import('./practice/world-health-disparities-1.js')],
 ['Biomedical Equipment Technician', 'biomedical-equipment-technician-1', () => import('./practice/biomedical-equipment-technician-1.js')],
 ['Healthy Living', 'healthy-living-1', () => import('./practice/healthy-living-1.js')],
 ['Biomedical Debate', 'biomedical-debate-1', () => import('./practice/biomedical-debate-1.js')],
 // Practice Test 2 for each event.
 ['CPR/First Aid', 'cpr-first-aid-2', () => import('./practice/cpr-first-aid-2.js')],
 ['Medical Terminology', 'medical-terminology-2', () => import('./practice/medical-terminology-2.js')],
 ['Pathophysiology', 'pathophysiology-2', () => import('./practice/pathophysiology-2.js')],
 ['Medical Math', 'medical-math-2', () => import('./practice/medical-math-2.js')],
 ['Pharmacology', 'pharmacology-2', () => import('./practice/pharmacology-2.js')],
 ['Nutrition', 'nutrition-2', () => import('./practice/nutrition-2.js')],
 ['Phlebotomy', 'phlebotomy-2', () => import('./practice/phlebotomy-2.js')],
 ['Emergency Medical Technician', 'emergency-medical-technician-2', () => import('./practice/emergency-medical-technician-2.js')],
 ['Nursing Assisting', 'nursing-assisting-2', () => import('./practice/nursing-assisting-2.js')],
 ['Home Health Aide', 'home-health-aide-2', () => import('./practice/home-health-aide-2.js')],
 ['Medical Assisting', 'medical-assisting-2', () => import('./practice/medical-assisting-2.js')],
 ['Patient Care Technician', 'patient-care-technician-2', () => import('./practice/patient-care-technician-2.js')],
 ['Clinical Nursing', 'clinical-nursing-2', () => import('./practice/clinical-nursing-2.js')],
 ['Medical Law & Ethics', 'medical-law-ethics-2', () => import('./practice/medical-law-ethics-2.js')],
 ['Human Growth & Development', 'human-growth-development-2', () => import('./practice/human-growth-development-2.js')],
 ['Behavioral Health', 'behavioral-health-2', () => import('./practice/behavioral-health-2.js')],
 ['Pharmacy Science', 'pharmacy-science-2', () => import('./practice/pharmacy-science-2.js')],
 ['Clinical Lab Science (Medical Lab Scientist)', 'clinical-lab-science-2', () => import('./practice/clinical-lab-science-2.js')],
 ['Respiratory Therapy', 'respiratory-therapy-2', () => import('./practice/respiratory-therapy-2.js')],
 ['Sports Medicine', 'sports-medicine-2', () => import('./practice/sports-medicine-2.js')],
 ['Physical Therapy', 'physical-therapy-2', () => import('./practice/physical-therapy-2.js')],
 ['Occupational Therapy', 'occupational-therapy-2', () => import('./practice/occupational-therapy-2.js')],
 ['Surgical Technologist', 'surgical-technologist-2', () => import('./practice/surgical-technologist-2.js')],
 ['Dental Science', 'dental-science-2', () => import('./practice/dental-science-2.js')],
 ['Dental Terminology', 'dental-terminology-2', () => import('./practice/dental-terminology-2.js')],
 ['Genetics', 'genetics-2', () => import('./practice/genetics-2.js')],
 ['Veterinary Science', 'veterinary-science-2', () => import('./practice/veterinary-science-2.js')],
 ['CERT Skills', 'cert-skills-2', () => import('./practice/cert-skills-2.js')],
 ['Forensic Science', 'forensic-science-2', () => import('./practice/forensic-science-2.js')],
 ['Biotechnology', 'biotechnology-2', () => import('./practice/biotechnology-2.js')],
 ['Physician Assistant - Medical Case Challenge', 'physician-assistant-2', () => import('./practice/physician-assistant-2.js')],
 ['Epidemiology', 'epidemiology-2', () => import('./practice/epidemiology-2.js')],
 ['Healthcare Administration', 'healthcare-administration-2', () => import('./practice/healthcare-administration-2.js')],
 ['Health Informatics', 'health-informatics-2', () => import('./practice/health-informatics-2.js')],
 ['World Health & Disparities', 'world-health-disparities-2', () => import('./practice/world-health-disparities-2.js')],
 ['Healthy Living', 'healthy-living-2', () => import('./practice/healthy-living-2.js')],
 ['Biomedical Equipment Technician', 'biomedical-equipment-technician-2', () => import('./practice/biomedical-equipment-technician-2.js')],
 ['Parliamentary Procedure', 'parliamentary-procedure-2', () => import('./practice/parliamentary-procedure-2.js')],
 ['Organizational Leadership', 'organizational-leadership-2', () => import('./practice/organizational-leadership-2.js')],
 ['Medical Spelling', 'medical-spelling-2', () => import('./practice/medical-spelling-2.js')],
 ['HOSA Bowl', 'hosa-bowl-2', () => import('./practice/hosa-bowl-2.js')],
 ['Creative Problem Solving', 'creative-problem-solving-2', () => import('./practice/creative-problem-solving-2.js')],
 ['Medical Reading', 'medical-reading-2', () => import('./practice/medical-reading-2.js')],
 ['Biomedical Debate', 'biomedical-debate-2', () => import('./practice/biomedical-debate-2.js')],
]) (REGISTRY[event] ||= []).push({id, load});
const loaded = {};
export const practiceTests = name => REGISTRY[name] || [];
export const hasPracticeTests = name => practiceTests(name).length > 0;
export const testsReady = name => practiceTests(name).every(t => loaded[t.id]);
export const loadTests = name => Promise.all(practiceTests(name).filter(t => !loaded[t.id]).map(t => t.load().then(m => {loaded[t.id] = m.default;})));
export const loadAllTests = () => Promise.all(Object.keys(REGISTRY).map(loadTests));
export const getPracticeTest = id => loaded[id] || null;
export const practiceTestList = () => Object.entries(REGISTRY).flatMap(([event, list]) => list.map(t => ({event, id:t.id})));
export const practiceHref = (name, id='', attemptId='') => testHref(name, id) + (id && attemptId ? '/'+encodeURIComponent(attemptId) : '');

// Write-in answers are compared as numbers, so "70", "70.0", "+70" and "1,000" all read correctly.
const typed = s => String(s ?? '').trim().replace(/[\s,]/g, '').replace(/−/g, '-').replace(/^\+/, '');
const NUMBER = /^-?(\d+\.?\d*|\.\d+)$/;
export const isRight = (q, a) => {
 if(!q.input) return a === q.answer;
 if(typeof a !== 'string') return false;
 const s = typed(a);
 if((q.accept || []).some(x => typed(x) === s)) return true;
 return NUMBER.test(s) && Number(s) === Number(typed(q.answer));
};
// The correct answer as students see it, with its unit.
export const answerText = (q, a = q.answer) => q.input ? [q.prefix, a, q.unit].filter(Boolean).join(' ') : LETTERS[a]+'. '+q.options[a];
const writeIn = test => test.questions.every(q => q.input);

// Grades a list of answers (null = unanswered): option indexes, or typed text for write-in questions.
// Used by the server and by teacher previews.
export function gradeAnswers(test, answers) {
 const correct = test.questions.filter((q,i) => isRight(q, answers[i])).length, total = test.questions.length;
 return {correct, total, score:Math.round(100*correct/total), areas:breakdown(test, answers)};
}

const testHref = (name, id='') => '#/event/'+encodeURIComponent(name)+'/tests'+(id?'/'+encodeURIComponent(id):'');
const draftKey = (uid,id) => 'valus-practice:'+(uid||'guest')+':'+id;
const read = key => {try {return JSON.parse(localStorage.getItem(key));} catch {return null;}};
const write = (key,value) => {try {localStorage.setItem(key, JSON.stringify(value)); return true;} catch {return false;}};
const drop = key => {try {localStorage.removeItem(key);} catch {}};
const clock = ms => {const s = Math.max(0, Math.round(ms/1000)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const MODE_LABEL = {check:'Check as I go', exam:'Grade at the end'};
export const when = iso => new Date(iso).toLocaleString([], {month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit'});
// The app re-renders the page on window focus. Remember which screen each test was on so a
// re-render keeps the student in the test or on their results. Navigating elsewhere resets it.
const VIEW = {};
if(typeof window !== 'undefined') window.addEventListener('hashchange', () => {for(const k in VIEW) delete VIEW[k];});

export function breakdown(test, answers) {
 // An area without listed subtopics is its own single topic.
 return test.plan.map(p => {
  const topics = (p.topics || [p.area]).map(topic => {
   const qs = test.questions.map((q,i) => ({q,i})).filter(x => x.q.topic === topic);
   return {topic, total:qs.length, correct:answers ? qs.filter(x => isRight(x.q, answers[x.i])).length : 0};
  });
  return {area:p.area, weight:p.weight, topics, total:topics.reduce((a,t) => a+t.total, 0), correct:topics.reduce((a,t) => a+t.correct, 0)};
 });
}

function planHtml(test) {
 const areas = breakdown(test), nested = areas.some(a => a.topics.length > 1);
 // Two or three areas fit a labeled bar with topic columns; longer plans read better as a list.
 if(areas.length > 3) return `<section class="pt-plan" aria-labelledby="pt-plan-title"><h3 id="pt-plan-title">Matches the official test plan</h3>
  <ul class="pt-plan-list">${areas.map(a => `<li><span class="pt-plan-name">${e(a.area)}${a.topics.length > 1 ? `<small>${a.topics.map(t => e(t.topic)+' ('+t.total+')').join(' · ')}</small>` : ''}</span><span class="pt-plan-pct">${a.weight}%</span><span class="pt-meter" aria-hidden="true"><span style="width:${Math.min(100, a.weight*2)}%"></span></span><span class="pt-plan-n">${a.total} Q</span></li>`).join('')}</ul>
  <p class="subtle">HOSA sets the weight of each area. When a weight does not divide evenly into ${test.questions.length} questions, Valus rounds to the nearest whole question${nested ? ' and chooses how questions are split among subtopics' : ''}.</p></section>`;
 return `<section class="pt-plan" aria-labelledby="pt-plan-title"><h3 id="pt-plan-title">Matches the official test plan</h3>
  <div class="pt-plan-bar" aria-hidden="true">${areas.map((a,i) => `<span class="pt-plan-seg seg-${i}" style="flex:${a.weight}"><strong>${a.weight}%</strong> ${e(a.area)}</span>`).join('')}</div>
  <div class="pt-plan-areas">${areas.map((a,i) => `<div class="pt-plan-area seg-${i}"><h4>${e(a.area)} · ${a.weight}% <small>${a.total} questions</small></h4><ul>${a.topics.map(t => `<li><span>${e(t.topic)}</span><span>${t.total}</span></li>`).join('')}</ul></div>`).join('')}</div>
  <p class="subtle">HOSA sets the weight of each area. Valus chose how questions are split among the topics inside each area.</p></section>`;
}

export function practiceTestsPage(name, testId, {userId, attempts=[], teacher=false}={}) {
 const tests = practiceTests(name);
 if(!tests.length) return `<section class="event-coming-soon" aria-labelledby="tool-title"><span class="eyebrow">YOUR EVENT TOOLKIT</span><h2 id="tool-title">Practice Tests</h2><h3>Coming soon.</h3><p>A little room for what comes next. This section is being prepared.</p></section>`;
 if(testId) {
  const test = loaded[testId];
  if(!test || test.event !== name) return `<section class="course-card"><h2>Practice test not found</h2><p><a href="${testHref(name)}">See all practice tests</a></p></section>`;
  return `<section class="course-card pt" data-practice="${e(test.id)}" aria-live="off"></section>`;
 }
 const first = loaded[tests[0].id];
 return `<section class="course-card pt-overview"><span class="eyebrow">PRACTICE TESTS · ROUND ONE</span><h2>Train under test conditions.</h2><p>Round One is a ${first.questions.length}-question ${writeIn(first)?'write-in':'multiple-choice'} test with a ${first.minutes}-minute limit. Each Valus practice test follows the same format and the same weights as the official HOSA test plan. Choose to check answers as you go or to be graded at the end.</p>
  <ol class="pt-list">${tests.map(t => {const test = loaded[t.id], hist = attempts.filter(a => a.testId === t.id), draft = read(draftKey(userId,t.id)), best = hist.length ? Math.max(...hist.map(h => h.score)) : null;
   return `<li><a href="${testHref(name,test.id)}"><span class="pt-list-num">${String(tests.indexOf(t)+1).padStart(2,'0')}</span><span><strong>${e(test.title)}</strong><small>${e(test.subtitle)} · ${test.questions.length} questions · ${test.minutes} min${draft?' · In progress':''}${hist.length?' · Last '+hist.at(-1).score+'% · Best '+best+'%':''}</small></span><span class="pt-list-go">${draft?'Resume':hist.length?'Retake':'Start'} →</span></a></li>`;}).join('')}</ol>
  <p class="subtle">${teacher?'Teacher preview: your attempts are graded but not saved. Student scores appear in Analytics and the student directory.':'Every submission is saved to your account, so you can review it later and track your scores in Analytics. An unfinished test stays on this device.'}</p></section>${planHtml(first)}`;
}

export function mountPracticeTest(root, {userId, api, attempts=[], teacher=false, attemptId=null, onSubmitted}={}) {
 const host = root.querySelector('[data-practice]');
 if(!host) return;
 const test = loaded[host.dataset.practice], Q = test.questions, N = Q.length;
 const sk = draftKey(userId,test.id), overview = testHref(test.event);
 const mine = () => attempts.filter(a => a.testId === test.id).slice().reverse();
 let st = read(sk), ticker = null;
 if(st && (!Array.isArray(st.answers) || st.answers.length !== N)) st = null;
 const save = () => write(sk, st);
 const stop = () => {clearInterval(ticker); ticker = null;};
 const top = () => {if(host.getBoundingClientRect().top < 0) host.scrollIntoView({behavior:'smooth', block:'start'});};

 function setup() {
  stop(); VIEW[test.id] = {view:'setup'};
  const hist = mine();
  const resume = st ? `<div class="callout pt-resume"><strong>You have a test in progress.</strong><p>${st.answers.filter(a => a !== null).length} of ${N} answered · ${MODE_LABEL[st.mode]}${st.mode==='exam'?' · '+clock(st.endsAt-Date.now())+' left':''}</p><button class="button" type="button" data-pt-resume>Resume test →</button><p class="subtle">Or choose a grading option below to start over.</p></div>` : '';
  host.innerHTML = `<span class="eyebrow">${e(test.event)} · ${e(test.title)}</span><h2>${e(test.title)}</h2><p>${e(test.subtitle)}: ${N} ${writeIn(test)?'write-in questions (type each answer as a number, like the real test),':'multiple-choice questions,'} written slightly above the difficulty of the HOSA sample questions and drawn from the official references (${e(test.sources)}).</p>${resume}${teacher?'<p class="callout">Teacher preview: you can take this test and see your results, but your attempts are not saved.</p>':''}
   <fieldset class="pt-modes"><legend>How do you want to be graded?</legend>
    <label class="pt-mode"><input type="radio" name="pt-mode" value="check"><span><strong>Check as I go</strong><small>Check each answer as you go and see why it is right or wrong before moving on. A clock counts up so you can track your pace. Best for learning.</small></span></label>
    <label class="pt-mode"><input type="radio" name="pt-mode" value="exam"><span><strong>Grade at the end</strong><small>Answer all ${N} questions, then submit for your score, like Round One. A ${test.minutes}-minute countdown submits the test when time runs out. Best for test practice.</small></span></label>
   </fieldset>
   <p class="pt-msg" role="status" aria-live="polite"></p>
   <div class="course-actions"><button class="button" type="button" data-pt-begin>Begin test →</button><a class="text-button" href="${overview}">← All practice tests</a></div>
   ${hist.length?`<section class="pt-history" aria-labelledby="pt-history-title"><h3 id="pt-history-title">Your submissions</h3><p class="subtle">Open any attempt to review every question, your answer and the explanation.</p><ol class="pt-history-list">${hist.map((a,i) => `<li><button type="button" data-pt-open="${e(a.id)}"><span class="pt-history-num">#${hist.length-i}</span><span class="pt-history-main"><strong>${e(when(a.date))}</strong><small>${MODE_LABEL[a.mode]} · ${clock(a.seconds*1000)}${a.timedOut?' · time ran out':''}</small></span><span class="pt-history-score"><strong>${a.score}%</strong><small>${a.correct}/${a.total}</small></span><span class="pt-history-go">Review →</span></button></li>`).join('')}</ol></section>`:''}`;
  host.querySelector('[data-pt-resume]')?.addEventListener('click', play);
  host.querySelectorAll('[data-pt-open]').forEach(b => b.addEventListener('click', () => {const a = hist.find(x => x.id === b.dataset.ptOpen); if(a) {results(a); top();}}));
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
   host.querySelector('.pt-answered').textContent = check ? `${st.checked.filter((c,i) => c && isRight(Q[i], st.answers[i])).length} correct · ${st.checked.filter(Boolean).length} checked` : `${answered} of ${N} answered`;
   host.querySelector('.cp-bar span').style.width = (100*answered/N)+'%';
   dots.forEach((d,i) => {
    d.classList.toggle('on', i === st.at); d.toggleAttribute('aria-current', i === st.at);
    d.classList.toggle('answered', st.answers[i] !== null); d.classList.toggle('flagged', !!st.flags[i]);
    if(check && st.checked[i]) d.dataset.state = isRight(Q[i], st.answers[i]) ? 'good' : 'bad'; else delete d.dataset.state;
   });
   prev.disabled = st.at === 0; next.disabled = st.at === N-1;
   if(checkBtn) {checkBtn.disabled = st.answers[st.at] === null || st.checked[st.at]; checkBtn.textContent = st.checked[st.at] ? 'Answer checked' : 'Check answer';}
   if(flagBtn) {flagBtn.setAttribute('aria-pressed', String(!!st.flags[st.at])); flagBtn.textContent = st.flags[st.at] ? '⚑ Flagged' : 'Flag for review';}
   submit.classList.toggle('secondary', st.at !== N-1 && answered < N);
  };
  const renderQ = (focus) => {
   const i = st.at, q = Q[i], done = check && st.checked[i];
   const answer = q.input
    ? `<div class="pt-input"${done?` data-state="${isRight(q, st.answers[i])?'good':'bad'}"`:''}><label for="pt-in-${i}">Your answer <small>Numbers only. Round as the question asks.</small></label><div class="pt-input-row">${q.prefix?`<span class="pt-unit">${e(q.prefix)}</span>`:''}<input id="pt-in-${i}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" maxlength="20" value="${e(st.answers[i] ?? '')}" ${done?'disabled':''}>${q.unit?`<span class="pt-unit">${e(q.unit)}</span>`:''}</div></div>`
    : q.options.map((o,j) => `<label class="mcq-option"${done?` data-state="${j===q.answer?'good':j===st.answers[i]?'bad':''}"`:''}><input type="radio" name="pt-q" value="${j}" ${st.answers[i]===j?'checked':''} ${done?'disabled':''}><span><b class="pt-letter">${LETTERS[j]}.</b> ${e(o)}</span></label>`).join('');
   stage.innerHTML = `<fieldset class="pt-q" tabindex="-1"><legend><span class="cp-qnum">Question ${i+1} of ${N}</span>${e(q.prompt)}</legend>${answer}${done?feedback(q, st.answers[i]):''}</fieldset>`;
   stage.querySelectorAll('[name="pt-q"]').forEach(r => r.addEventListener('change', () => {st.answers[i] = Number(r.value); confirming = false; msg.textContent = ''; save(); status();}));
   const box = stage.querySelector('.pt-input input');
   box?.addEventListener('input', () => {const v = box.value.trim(); st.answers[i] = v || null; confirming = false; msg.textContent = ''; save(); status();});
   // Enter checks the answer in check mode, or moves to the next question.
   box?.addEventListener('keydown', ev => {if(ev.key !== 'Enter') return; ev.preventDefault(); if(checkBtn && !checkBtn.disabled) checkBtn.click(); else go(st.at+1);});
   if(focus) (box && !box.disabled ? box : stage.querySelector('.pt-q')).focus({preventScroll:true});
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
  const ok = isRight(q, picked);
  return `<div class="question-feedback pt-feedback" data-state="${ok?'good':'bad'}" tabindex="-1"><strong>${ok?'Correct.':'Not quite. The answer is '+e(q.input ? answerText(q) : LETTERS[q.answer])+'.'}</strong> ${e(q.explain)}<small>Topic: ${e(q.topic)} · Reference: ${e(q.ref)}</small></div>`;
 }

 let submitting = false;
 async function finish(timedOut) {
  if(!st || submitting) return;
  stop(); submitting = true;
  if(timedOut) {st.timedOut = true; save();}
  const msg = host.querySelector('.pt-submit .pt-msg'), button = host.querySelector('[data-pt-submit]');
  if(msg) msg.textContent = 'Submitting your test…';
  if(button) button.disabled = true;
  const body = {mode:st.mode, answers:st.answers, seconds:Math.round(((st.mode==='exam'?Math.min(Date.now(),st.endsAt):Date.now())-st.startedAt)/1000), timedOut:!!st.timedOut};
  try {
   const r = await api('POST', '/practice/'+encodeURIComponent(test.id)+'/attempts', body);
   drop(sk); st = null;
   if(r.recorded) onSubmitted?.(r.attempt);
   results(r.attempt, {recorded:r.recorded});
  } catch(error) {
   if(msg) msg.textContent = error.message + ' Your answers are still saved on this device. Select Submit test to try again.';
   if(button) {button.disabled = false; button.textContent = 'Submit test';}
  } finally {submitting = false;}
 }

 function results(a, {scroll=true, recorded=true}={}) {
  stop(); VIEW[test.id] = {view:'results', attempt:a, recorded};
  const answers = a.answers || [], areas = breakdown(test, answers), missed = Q.filter((q,i) => !isRight(q, answers[i])).length;
  const bar = (c,t) => `<span class="pt-meter" aria-hidden="true"><span style="width:${t?100*c/t:0}%"></span></span>`;
  host.innerHTML = `<span class="eyebrow">RESULTS · ${e(test.title)} · ${e(when(a.date))}</span>${recorded?'':'<p class="callout">Teacher preview: this attempt was graded but not saved.</p>'}
   <div class="pt-score"><div class="pt-ring" style="--p:${a.score}"><strong>${a.score}%</strong></div><div><h2>${a.correct} of ${a.total} correct</h2><p>${MODE_LABEL[a.mode]} · ${clock(a.seconds*1000)} ${a.mode==='exam'?'of '+test.minutes+':00 used':'total'}${a.timedOut?' · Time ran out, so the test was submitted automatically':''}</p><p class="subtle">HOSA has no set passing score for Round One: the top scores advance to the next round or to awards. Aim to improve your weakest topics below.</p></div></div>
   <h3>By test plan area</h3>
   <div class="pt-areas">${areas.map(ar => `<div class="pt-area"><div class="pt-area-row"><strong>${e(ar.area)} <small>${ar.weight}% of test</small></strong><span>${ar.correct}/${ar.total}</span>${bar(ar.correct,ar.total)}</div><ul>${ar.topics.length < 2 ? '' : ar.topics.map(t => `<li class="pt-area-row"><span>${e(t.topic)}</span><span>${t.correct}/${t.total}</span>${bar(t.correct,t.total)}</li>`).join('')}</ul></div>`).join('')}</div>
   <h3>Review your answers</h3>
   <div class="pt-filter" role="group" aria-label="Filter questions"><button type="button" class="cp-dot on" data-filter="all" aria-pressed="true">All ${N}</button><button type="button" class="cp-dot" data-filter="missed" aria-pressed="false">Missed ${missed}</button></div>
   <ol class="pt-review">${Q.map((q,i) => {const p = answers[i], ok = isRight(q, p);
    return `<li data-ok="${ok}"><p class="pt-review-q"><span class="cp-qnum">Question ${i+1} · ${ok?'Correct':p===null||p===undefined?'Not answered':'Missed'}</span>${e(q.prompt)}</p><ul class="pt-review-opts">${q.input ? (p===null||p===undefined ? '' : `<li class="${ok?'is-answer':'is-wrong'}">${e(answerText(q, p))} <em>${ok?'Your answer, correct':'Your answer'}</em></li>`) + (ok ? '' : `<li class="is-answer">${e(answerText(q))} <em>Correct answer</em></li>`) : q.options.map((o,j) => `<li class="${j===q.answer?'is-answer':''} ${j===p&&!ok?'is-wrong':''}"><b class="pt-letter">${LETTERS[j]}.</b> ${e(o)}${j===q.answer?' <em>Correct answer</em>':''}${j===p&&!ok?' <em>Your answer</em>':''}</li>`).join('')}</ul><p class="pt-explain">${e(q.explain)}<small>Topic: ${e(q.topic)} · Reference: ${e(q.ref)}</small></p></li>`;}).join('')}</ol>
   <div class="course-actions"><button class="button" type="button" data-pt-retake>Retake test →</button>${mine().length?'<button class="text-button" type="button" data-pt-all>All my submissions</button>':''}<a class="text-button" href="${overview}">← All practice tests</a></div>`;
  host.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
   const missedOnly = b.dataset.filter === 'missed';
   host.querySelectorAll('[data-filter]').forEach(x => {x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b));});
   host.querySelectorAll('.pt-review>li').forEach(li => {li.hidden = missedOnly && li.dataset.ok === 'true';});
  }));
  host.querySelector('[data-pt-retake]').addEventListener('click', () => {setup(); top();});
  host.querySelector('[data-pt-all]')?.addEventListener('click', () => {setup(); host.querySelector('.pt-history')?.scrollIntoView({behavior:'smooth', block:'start'});});
  if(scroll) top();
 }

 const was = VIEW[test.id], linked = attemptId && attempts.find(a => a.id === attemptId && a.testId === test.id);
 if(was?.view === 'play' && st) play();
 else if(was?.view === 'results') results(was.attempt, {scroll:false, recorded:was.recorded});
 else if(linked) results(linked, {scroll:false});
 else {setup(); if(attemptId) host.querySelector('.pt-msg').textContent = 'That submission was not found. Choose one from your submissions below.';}
}
