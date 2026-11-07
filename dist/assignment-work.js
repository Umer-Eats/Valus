// A student's finished work for one assignment, graded and with the answer key. Teachers see it
// for any student; a student sees their own once the teacher sends the results.
const e = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LETTERS = ['A','B','C','D','E'];
const when = iso => iso ? new Date(iso).toLocaleString('en-US', {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}) : '';
const bytes = n => n >= 1e6 ? +(n/1e6).toFixed(1)+' MB' : Math.max(1, Math.round(n/1e3))+' KB';
const clock = s => Math.floor(s/60)+'m '+String(s%60).padStart(2,'0')+'s';
// Escaped text with web links made clickable, so a pasted video or project link opens.
const linked = t => e(t).replace(/https?:\/\/[^\s<]+/g, u => '<a href="'+u+'" target="_blank" rel="noreferrer noopener">'+u+'</a>');
const STATE = {submitted:'Submitted', locked:'Locked (left before finishing)', reopened:'Reopened', in_progress:'In progress'};
const shown = (q, a) => q.input ? [q.prefix, a, q.unit].filter(Boolean).join(' ') : LETTERS[a]+'. '+q.options[a];

// One question with the student's answer and the correct answer marked.
function questionReview(q, n, total, who) {
 const unanswered = q.given === null || q.given === undefined || q.given === '';
 const body = q.input
  ? `<div class="aw-written"><p><span>${e(who)} answer</span><strong data-state="${q.right?'good':'bad'}">${unanswered?'No answer':e(shown(q, q.given))}</strong></p><p><span>Correct answer</span><strong data-state="good">${e(shown(q, q.answer))}</strong></p></div>`
  : q.options.map((o,j) => {const mine = j === q.given, right = j === q.answer;
     return `<div class="mcq-option aw-option"${right?' data-state="good"':mine?' data-state="bad"':''}><span><b class="pt-letter">${LETTERS[j]}.</b> ${e(o)}${right?' <em class="aw-tag good">Correct answer</em>':''}${mine?` <em class="aw-tag ${right?'good':'bad'}">${e(who)} answer</em>`:''}</span></div>`;}).join('');
 const verdict = q.right === null ? 'Answer not saved' : unanswered ? 'Not answered' : q.right ? 'Correct' : 'Incorrect';
 return `<li class="ap-question aw-q"><div class="pt-q"><p class="aw-q-head"><span class="cp-qnum">Question ${n} of ${total}</span><span class="aw-verdict" data-state="${q.right?'good':'bad'}">${verdict}</span></p><p class="aw-prompt">${e(q.prompt)}</p>${body}
  ${q.explain?`<div class="question-feedback pt-feedback" data-state="good"><strong>Why:</strong> ${e(q.explain)}${q.topic||q.ref?`<small>${q.topic?'Topic: '+e(q.topic):''}${q.topic&&q.ref?' · ':''}${q.ref?'Reference: '+e(q.ref):''}</small>`:''}</div>`:''}</div></li>`;
}
const questionList = (list, who) => `<ol class="ap-question-list">${list.map((q,i) => questionReview(q, i+1, list.length, who)).join('')}</ol>`;
const areaList = areas => areas?.length ? `<ul class="ap-areas">${areas.map(a => `<li><span>${e(a.area)}</span><small>${a.correct} of ${a.total} correct</small><strong>${a.total?Math.round(100*a.correct/a.total):0}%</strong></li>`).join('')}</ul>` : '';
const stats = list => `<div class="aw-stats">${list.filter(Boolean).map(([k,v]) => `<div><span>${e(k)}</span><strong>${e(v)}</strong></div>`).join('')}</div>`;
const panel = (eyebrow, title, body) => `<section class="panel full-width aw-panel"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2>${body}</section>`;

export function workDetail(w, {teacher}) {
 const who = teacher ? 'Their' : 'Your', x = w.work;
 if(!x) return panel('THE WORK', 'Nothing turned in yet.', `<p class="subtle">${teacher?e(w.student.displayName)+' has not started this assignment.':'You have not started this assignment.'}</p>`);
 if(w.kind === 'test') return panel('RANKED TEST · ANSWER KEY', `${x.score}% · ${x.correct} of ${x.total} correct`,
  stats([['Status', STATE[x.state]||x.state], ['Submitted', when(x.submittedAt)||'—'], ['Time used', clock(x.secondsUsed||0)], ['Answered', x.questions.filter(q => q.given !== null).length+' of '+x.total]])+areaList(x.areas)+questionList(x.questions, who));
 if(w.kind === 'practice') return panel('PRACTICE TEST · ANSWER KEY', `Best attempt: ${x.best.score}% · ${x.best.correct} of ${x.best.total} correct`,
  stats([['Attempts', String(x.attempts.length)], ['Best attempt', when(x.best.date)], ['Mode', x.best.mode==='exam'?'Graded at the end':'Checked as they went'], ['Time', clock(x.best.seconds||0)]])
  +(x.attempts.length > 1 ? `<p class="subtle">Every attempt: ${x.attempts.map(a => a.score+'% ('+when(a.date)+')').join(' · ')}. The best attempt is shown below.</p>` : '')
  +areaList(x.best.areas)+(x.best.questions.length ? questionList(x.best.questions, who) : '<p class="subtle">The questions for this attempt are no longer available.</p>'));
 if(w.kind === 'mock') return panel('MOCK PROCEDURE · RATING SHEET', `${x.score}% · ${x.earned} of ${x.possible} points`,
  stats([['Status', STATE[x.state]||x.state], ['Submitted', when(x.submittedAt)||'—'], ['Time used', clock(x.secondsUsed||0)]])
  +x.sheets.map(sh => `<div class="ap-sheet"><h3>${e(sh.title)} · ${sh.earned} of ${sh.possible}</h3>${sh.who?`<small class="subtle">${e(sh.who)}</small>`:''}<ol class="ap-sheet-items">${sh.items.map(i => `<li data-result="${i.earned===i.pts?'good':'bad'}"><span class="ap-item-n">${e(i.n)}</span><span>${e(i.text)}${i.note?`<small class="aw-note">${e(i.note)}</small>`:''}</span><strong>${i.earned} / ${i.pts}</strong></li>`).join('')}</ol></div>`).join(''));
 if(w.kind === 'upload') return panel('UPLOADED WORK', x.score == null ? (teacher ? 'Not scored yet' : 'Waiting for a score') : `Score: ${x.score}%`,
  stats([['Status', STATE[x.state]||x.state], ['Submitted', when(x.submittedAt)||'—'], ['Files', String(x.files.length)]])
  +(x.files.length ? `<ul class="rk-files aw-files">${x.files.map(f => `<li><span class="rk-file-name">${e(f.name)}</span><small>${bytes(f.size||0)}</small><button type="button" class="text-button" data-action="open-ranked-file" data-id="${e(w.assignment.id)}" data-uid="${e(w.student.uid)}" data-file="${e(f.id)}">Open file</button></li>`).join('')}</ul>` : '<p class="subtle">No files were uploaded.</p>')
  +(x.notes ? `<div class="aw-text"><h3>Notes from ${teacher?'the student':'you'}</h3><p>${linked(x.notes)}</p></div>` : ''));
 if(w.kind === 'checkpoint') {
  const g = x.frq.grade;
  return panel('LESSON PRACTICE · ANSWER KEY', `${x.accuracy}% · ${e(x.lessonTitle)}`,
   stats([['Multiple choice', x.mcqCorrect+' of '+x.mcqTotal], ['Written response', x.frqScore == null ? 'Not graded' : x.frqScore+'%'], ['Submitted', when(x.submittedAt)]])
   +(x.answersSaved ? '' : '<p class="subtle">This attempt was made before Valus saved each answer choice, so only the correct answers are shown.</p>')
   +questionList(x.questions, who)
   +`<div class="aw-text"><h3>Written response</h3><p class="subtle">${e(x.frq.prompt)}</p><blockquote>${e(x.frq.response)}</blockquote>${g?`<p><strong>Valus AI feedback (${g.points ?? '—'} of ${g.maximum ?? '—'} points):</strong> ${e(g.feedback)}</p>${(g.criteria||[]).length?`<ul class="aw-criteria">${g.criteria.map(c => `<li><strong>${e(c.label)} · ${c.score}/2</strong><span>${e(c.feedback)}</span></li>`).join('')}</ul>`:''}`:''}</div>`);
 }
 if(w.kind === 'lesson') return panel('LESSON', 'Lesson complete', `<p class="subtle">Marked complete ${e(when(x.completedAt))}.</p>`);
 return panel('SUBMITTED WORK', x.score == null ? (teacher ? 'Not scored yet' : 'Waiting for a score') : `Score: ${x.score}%`,
  stats([['Submitted', when(x.submittedAt)]])+`<div class="aw-text"><blockquote>${linked(x.body)}</blockquote></div>`);
}
