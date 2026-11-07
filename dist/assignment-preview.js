// Teacher preview of an assignment: the screen students see, plus what only the teacher sees:
// the answer key, the rating sheet or the scoring guide. Practice tests and ranked tests can
// also be edited here by removing questions or adding others from the event's practice tests.
import {pickQuestion, questionBank, breakdown, answerText, scaledMinutes, getPracticeTest} from './practice-tests.js';
import {LAB, SHEETS as CPR_SHEETS, MASTERY as CPR_MASTERY} from './mock-lab-cpr.js';
import {DENTAL, SHEETS as DENTAL_SHEETS, MASTERY as DENTAL_MASTERY} from './mock-lab-dental-rubric.js';
import {EVENT_RULES} from './event-rules.js';
import {EVENT_DETAILS, TOOL_LABELS} from './event-details.js';
import {eventHref} from './event-workspace.js';

const e = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LETTERS = ['A','B','C','D','E'];
const RUBRICS = {[LAB.event]:{sheets:CPR_SHEETS, mastery:CPR_MASTERY, title:LAB.title}, [DENTAL.event]:{sheets:DENTAL_SHEETS, mastery:DENTAL_MASTERY, title:DENTAL.title}};
const key = r => r[0]+'#'+r[1];
const BANK_PAGE = 25;

// Unsaved edits survive the app re-rendering the page (it re-renders on window focus).
const drafts = new Map();
export const QUESTION_TYPES = new Set(['Practice test', 'Ranked test']);

function draftFor(a, data) {
 let d = drafts.get(a.id);
 if(!d || d.base !== data) {d = {base:data, refs:data.refs.slice(), area:'', search:'', shown:BANK_PAGE, saving:false}; drafts.set(a.id, d);}
 return d;
}
const dirty = d => d.refs.length !== d.base.refs.length || d.refs.some((r,i) => key(r) !== key(d.base.refs[i]));
export const discardPreview = id => drafts.delete(id);

// One question as students see it, with the correct answer marked and the explanation shown.
function questionCard(q, n, total, {ref, editable, source}) {
 const answer = q.input
  ? `<div class="pt-input" data-state="good"><label>Correct answer</label><div class="pt-input-row">${q.prefix?`<span class="pt-unit">${e(q.prefix)}</span>`:''}<input type="text" value="${e(q.answer)}" disabled aria-label="Correct answer">${q.unit?`<span class="pt-unit">${e(q.unit)}</span>`:''}</div>${q.accept?.length?`<small class="subtle">Also accepted: ${q.accept.map(e).join(', ')}</small>`:''}</div>`
  : q.options.map((o,j) => `<label class="mcq-option"${j===q.answer?' data-state="good"':''}><input type="radio" disabled ${j===q.answer?'checked':''}><span><b class="pt-letter">${LETTERS[j]}.</b> ${e(o)}${j===q.answer?' <em class="ap-correct">Correct answer</em>':''}</span></label>`).join('');
 return `<li class="ap-question"><fieldset class="pt-q"><legend><span class="cp-qnum">Question ${n} of ${total}</span>${e(q.prompt)}</legend>${answer}
  <div class="question-feedback pt-feedback" data-state="good"><strong>Answer: ${e(answerText(q))}.</strong> ${e(q.explain)}<small>Topic: ${e(q.topic)} · Reference: ${e(q.ref)}${source?' · From '+e(source):''}</small></div></fieldset>
  ${editable?`<div class="ap-q-actions"><button type="button" class="text-button" data-ap-remove="${e(key(ref))}">Remove question</button></div>`:''}</li>`;
}

// Questions per area against the official plan, so a teacher can see the effect of an edit.
function areaSummary(template, questions) {
 const areas = breakdown({plan:template.plan, questions}, null);
 return `<ul class="ap-areas">${areas.map(a => `<li><span>${e(a.area)}</span><small>${a.weight}% of HOSA test</small><strong>${a.total} Q</strong></li>`).join('')}</ul>`;
}

function bankList(a, d) {
 const inSet = new Set(d.refs.map(key)), words = d.search.trim().toLowerCase();
 const list = questionBank(a.event).filter(b => !inSet.has(key(b.ref)) && (!d.area || areaOf(d.base, b.q) === d.area) && (!words || (b.q.prompt+' '+b.q.topic+' '+(b.q.options||[]).join(' ')).toLowerCase().includes(words)));
 if(!list.length) return `<p class="subtle">${inSet.size && !words && !d.area ? 'Every question for this event is already in the test.' : 'No questions match.'}</p>`;
 return `<p class="subtle">${list.length} question${list.length===1?'':'s'} you can add</p><ul class="ap-bank-list">${list.slice(0, d.shown).map(b => `<li><div><strong>${e(b.q.prompt)}</strong><small>${e(b.q.topic)} · Answer: ${e(answerText(b.q))} · ${e(b.test.title)}</small></div><button type="button" class="button secondary" data-ap-add="${e(key(b.ref))}">Add</button></li>`).join('')}</ul>${list.length > d.shown ? `<button type="button" class="text-button" data-ap-more>Show more</button>` : ''}`;
}
const areaOf = (data, q) => {const t = getPracticeTest(data.template); return t?.plan.find(p => (p.topics || [p.area]).includes(q.topic))?.area || q.topic;};

function questionsSection(a, data) {
 const d = draftFor(a, data), template = getPracticeTest(data.template);
 if(!template) return `<section class="panel full-width"><h2>Questions</h2><p>These questions could not load. Reload the page to try again.</p></section>`;
 const ranked = data.type === 'Ranked test', editable = data.editable;
 const items = d.refs.map(r => ({ref:r, q:pickQuestion(r), source:getPracticeTest(r[0])?.title})).filter(x => x.q);
 const minutes = ranked && !dirty(d) ? data.minutes : scaledMinutes(template, items.length);
 const note = ranked
  ? (editable ? 'Students see these questions in this order, with answer choices shuffled as shown. You can change them until the first student starts.' : `${data.started} student${data.started===1?' has':'s have'} started this ranked test, so its questions are locked. Everyone is ranked on the same test.`)
  : data.edited ? 'You edited this test. Students take your version from the assignment.' : 'This is the practice test as assigned. Remove or add questions to make your own version for this assignment.';
 return `<section class="panel full-width ap-questions" data-ap-questions>
  <div class="ap-section-head"><div><span class="eyebrow">ANSWER KEY · ONLY YOU SEE THIS</span><h2>${items.length} question${items.length===1?'':'s'} · ${minutes} minutes</h2><p class="subtle">${e(note)}</p></div>
   ${editable && !ranked ? `<button type="button" class="text-button" data-ap-restore>Restore original questions</button>` : ''}</div>
  ${areaSummary(template, items.map(x => x.q))}
  ${editable ? `<div class="ap-savebar" data-ap-savebar ${dirty(d)?'':'hidden'}><span><strong>Unsaved changes.</strong> ${items.length} question${items.length===1?'':'s'}, ${minutes}-minute time limit.${!ranked?' Students’ earlier attempts on the original test stop counting toward this assignment.':''}</span><span class="ap-save-actions"><button type="button" class="button secondary" data-ap-discard>Discard</button><button type="button" class="button" data-ap-save ${d.saving||!items.length?'disabled':''}>${d.saving?'Saving…':'Save questions'}</button></span></div>` : ''}
  <ol class="ap-question-list">${items.map((x,i) => questionCard(x.q, i+1, items.length, {ref:x.ref, editable, source:x.source})).join('')}</ol>
  ${editable ? `<div class="ap-bank"><h3>Add questions</h3><p class="subtle">From every ${e(a.event)} practice test. Added ranked questions get shuffled answer choices.</p>
   <div class="ap-bank-tools"><label class="field">Area<select data-ap-area><option value="">All areas</option>${template.plan.map(p => `<option value="${e(p.area)}"${d.area===p.area?' selected':''}>${e(p.area)}</option>`).join('')}</select></label>
   <label class="field">Search<input type="search" data-ap-search placeholder="Search questions" value="${e(d.search)}"></label></div>
   <div data-ap-bank>${bankList(a, d)}</div></div>` : ''}
 </section>`;
}

function rubricSection(a) {
 const r = RUBRICS[a.event];
 if(!r) return '';
 const total = r.sheets.reduce((s, sh) => s + sh.items.reduce((n, i) => n + i.pts, 0), 0);
 return `<section class="panel full-width"><span class="eyebrow">RATING SHEET · HIDDEN FROM STUDENTS UNTIL THEY FINISH</span><h2>${e(r.title)} · ${total} points</h2>
  <p class="subtle">Valus grades the student’s run against these HOSA rating sheet items. Mastery is ${Math.round(r.mastery*100)}% (${Math.ceil(total*r.mastery)} points). The score is the share of points earned.</p>
  ${r.sheets.map(sh => `<div class="ap-sheet"><h3>${e(sh.title)}</h3>${sh.who?`<small class="subtle">${e(sh.who)}</small>`:''}<ol class="ap-sheet-items">${sh.items.map(i => `<li><span class="ap-item-n">${e(i.n)}</span><span>${e(i.text)}</span><strong>${i.pts} pt${i.pts===1?'':'s'}</strong></li>`).join('')}</ol></div>`).join('')}</section>`;
}

// The ranked skill upload covers skills and speeches; online submissions have their own grader.
function scoringSection(a) {
 const rules = EVENT_RULES[a.event], tools = (EVENT_DETAILS[a.event]?.tools || []).filter(t => (a.type === 'Ranked skill' || a.type === 'Skill' ? ['video','speech'] : ['upload']).includes(t));
 return `<section class="panel full-width"><span class="eyebrow">SCORING GUIDE · ONLY YOU SEE THIS</span><h2>How this work is scored</h2>
  <ul class="ap-guide">
   <li>You score each submission from 0 to 100% in the assignment’s response list.${a.type.startsWith('Ranked')?' The score counts toward global rankings.':''}</li>
   <li>Use the official ${e(a.event||'HOSA')} rating sheet in the event guidelines. Score the share of rating-sheet points the work earns.</li>
   ${a.goal==='accuracy'?`<li>Students meet the goal at ${a.target}% or higher.</li>`:''}
   ${a.minutes?`<li>Students have ${a.minutes} minutes once they start, and only files uploaded during that time count.</li>`:''}
  </ul>
  <div class="ap-links">${rules?.url?`<a class="button secondary" href="${e(rules.url)}" target="_blank" rel="noreferrer">Open official guidelines ↗</a>`:''}${tools.map(t => `<a class="button secondary" href="${eventHref(a.event,t)}">${e(TOOL_LABELS[t])}</a>`).join('')}</div>
  ${tools.length?`<p class="subtle">Students see ${tools.map(t => e(TOOL_LABELS[t])).join(' and ')} in their event space for practice before the ranked upload.</p>`:''}</section>`;
}

// studentView is the student's assignment screen, built by the app so it stays identical.
export function previewPage(a, {studentView, data, header, work = ''}) {
 const kind = QUESTION_TYPES.has(a.type) ? 'questions' : a.type === 'Ranked mock procedure' ? 'rubric' : 'scoring';
 return `${header}<div class="ap-layout">
  <section class="panel full-width ap-student"><span class="eyebrow">STUDENT VIEW</span><p class="subtle">Exactly what students see when they open this assignment. Buttons are turned off in your preview.</p>
   <div class="ap-student-card"><h2>${e(a.title)}</h2>${studentView}</div></section>
  ${work}
  ${kind==='questions' ? (data ? questionsSection(a, data) : '') : kind==='rubric' ? rubricSection(a) : scoringSection(a)}</div>`;
}

// Wires the question editor. save(refs) stores the list and resolves with the new data.
export function mountPreview(root, a, data, {save, toast}) {
 const host = root.querySelector('[data-ap-questions]');
 if(!host || !data) return;
 const d = draftFor(a, data);
 const redraw = () => {
  const y = window.scrollY;
  host.outerHTML = questionsSection(a, data);
  mountPreview(root, a, data, {save, toast});
  window.scrollTo(0, y);
 };
 const bank = () => {const b = host.querySelector('[data-ap-bank]'); if(b) b.innerHTML = bankList(a, d);};
 host.addEventListener('click', async ev => {
  const t = ev.target.closest('button');
  if(!t || t.disabled) return;
  if(t.dataset.apRemove) {d.refs = d.refs.filter(r => key(r) !== t.dataset.apRemove); redraw(); return;}
  if(t.dataset.apAdd) {const [id, i] = t.dataset.apAdd.split('#'); d.refs.push([id, Number(i)]); redraw(); toast('Question added to the end of the test.'); return;}
  if(t.hasAttribute('data-ap-more')) {d.shown += BANK_PAGE; bank(); return;}
  if(t.hasAttribute('data-ap-discard')) {d.refs = data.refs.slice(); redraw(); return;}
  if(t.hasAttribute('data-ap-restore')) {const tpl = getPracticeTest(data.template); d.refs = tpl.questions.map((_, i) => [tpl.id, i]); redraw(); return;}
  if(t.hasAttribute('data-ap-save')) {
   d.saving = true; redraw();
   try {await save(d.refs.map(r => [r[0], r[1]])); drafts.delete(a.id); toast('Questions saved. Students see the new version.');}
   catch(err) {d.saving = false; redraw(); toast(err.message);}
  }
 });
 host.querySelector('[data-ap-search]')?.addEventListener('input', ev => {d.search = ev.target.value; d.shown = BANK_PAGE; bank();});
 host.querySelector('[data-ap-area]')?.addEventListener('change', ev => {d.area = ev.target.value; d.shown = BANK_PAGE; bank();});
}
