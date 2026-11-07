// Online Upload Grader: students upload their digital submission and Valus AI grades it against
// the event's official HOSA rating sheet, shows where to improve, and writes an improved version.
import {uploadFile} from './session.js';

const e = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bytes = n => n >= 1e6 ? +(n/1e6).toFixed(1)+' MB' : Math.max(1, Math.round(n/1e3))+' KB';
const pts = n => Number.isInteger(n) ? String(n) : n.toFixed(1);
const when = iso => new Date(iso).toLocaleString(undefined, {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'});
const newId = () => {const a = new Uint8Array(15); crypto.getRandomValues(a); return [...a].map(b => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 62]).join('') + Date.now().toString(36);};
const ACCEPT = 'application/pdf,image/png,image/jpeg,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp4,audio/wav';

export const uploadGraderPage = event => `<section class="course-card ug" data-ug data-event="${e(event)}" aria-label="Online Upload Grader"><div data-ug-screen><p class="subtle">Loading the grader…</p></div></section>`;

export function mountUploadGrader(root, {api}) {
  const host = root.querySelector('[data-ug]');
  if(!host) return () => {};
  const screen = host.querySelector('[data-ug-screen]'), event = host.dataset.event;
  let alive = true, info = null, files = [], link = '', text = '', grading = false;
  const uploads = new Set();
  const q = '/grader?event=' + encodeURIComponent(event);

  const failed = msg => {screen.innerHTML = `<h2>The grader could not load.</h2><p>${e(msg)}</p><div class="course-actions"><button type="button" class="button" data-retry>Try again</button></div>`; screen.querySelector('[data-retry]').onclick = load;};
  async function load() {
    screen.innerHTML = '<p class="subtle">Loading the grader…</p>';
    try {info = await api('GET', q);} catch(err) {if(alive) failed(err.message); return;}
    if(alive) form();
  }

  function form() {
    const ready = files.filter(f => f.done), busy = files.some(f => !f.done && !f.error);
    const total = ready.reduce((n, f) => n + f.size, 0);
    screen.innerHTML = `<span class="eyebrow">VALUS AI · OFFICIAL RATING SHEET</span>
     <h2>Get your upload graded.</h2>
     <p>Upload the same work you will submit to HOSA. Valus AI scores it against the ${e(event)} rating sheet in the official guidelines, shows where you can improve, and writes an improved version you can learn from.</p>
     <div class="ug-form">
      ${info.uploads ? `<div class="ug-drop">
        <input type="file" multiple hidden accept="${ACCEPT}" data-file>
        <div><strong>Your files</strong><small>PDF, images or a short video · up to ${info.maxFiles} files, ${bytes(info.maxBytes)} in total</small></div>
        <button type="button" class="button secondary" data-pick ${files.filter(f => !f.error).length >= info.maxFiles ? 'disabled' : ''}>Choose files</button>
       </div>
       <ul class="rk-files" data-files>${files.map(f => `<li class="${f.error ? 'rk-error' : ''}"><span class="rk-file-name">${e(f.name)}</span><small>${f.error ? e(f.error) : f.done ? bytes(f.size)+' · ready' : `Uploading ${Math.round(f.pct*100)}%`}</small>${f.done || f.error ? `<button type="button" class="text-button" data-remove="${e(f.key)}">Remove</button>` : `<span class="pt-meter" aria-hidden="true"><span style="width:${f.pct*100}%"></span></span>`}</li>`).join('')}</ul>`
      : '<p class="ug-note">File uploads are not set up yet. Paste your written work below to have it graded.</p>'}
      <label class="field">Video link (optional)<input type="url" inputmode="url" maxlength="300" placeholder="https://youtu.be/…" value="${e(link)}" data-link><small class="subtle">For video events, paste a Public or Unlisted YouTube link so Valus AI can watch it.</small></label>
      <label class="field">Or paste your written work (optional)<textarea rows="6" maxlength="40000" placeholder="Paste your essay, script, poster text or any part of your submission" data-text>${e(text)}</textarea></label>
     </div>
     <div class="pt-submit"><p class="pt-msg" role="status" aria-live="polite">${total > info.maxBytes ? `Your files add up to ${bytes(total)}. Keep them under ${bytes(info.maxBytes)}.` : ''}</p>
      <div class="course-actions"><button type="button" class="button" data-grade ${busy || !info.remaining ? 'disabled' : ''}>${busy ? 'Waiting for uploads…' : 'Grade my work'}</button><span class="subtle">${info.remaining} of ${info.dailyLimit} grades left today</span></div>
      <p class="subtle ug-small">Valus AI gives a practice estimate, not an official HOSA score. Parts judged live, such as your presentation, are not scored here.</p></div>
     ${history()}`;
    const input = screen.querySelector('[data-file]');
    screen.querySelector('[data-pick]')?.addEventListener('click', () => {input.value = ''; input.click();});
    input?.addEventListener('change', () => {
      const room = info.maxFiles - files.filter(f => !f.error).length;
      [...input.files].slice(0, Math.max(0, room)).forEach(send);
      form();
    });
    screen.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => {files = files.filter(f => f.key !== b.dataset.remove); form();});
    screen.querySelector('[data-link]').oninput = ev => {link = ev.target.value;};
    screen.querySelector('[data-text]').oninput = ev => {text = ev.target.value;};
    screen.querySelector('[data-grade]').onclick = grade;
    bindHistory();
  }

  // Each file uploads straight to Firebase Storage as soon as it is chosen.
  function send(file) {
    const f = {key:newId(), name:file.name.slice(0, 200), size:file.size, pct:0, done:false, error:''};
    files.push(f);
    if(file.size > info.maxBytes) {f.error = `Too large: keep files under ${bytes(info.maxBytes)}.`; return;}
    if(file.type && !info.types.includes(file.type)) {f.error = 'Use a PDF, an image, or a short video.'; return;}
    const up = uploadFile(info.folder + f.key, file, pct => {f.pct = pct; if(alive && !grading) refreshFile(f);});
    uploads.add(up);
    up.done.then(() => {f.done = true;}, err => {f.error = err.message;}).finally(() => {uploads.delete(up); if(alive && !grading) form();});
  }
  // Updates one progress bar without redrawing the form, so typing is not interrupted.
  function refreshFile(f) {
    const i = files.indexOf(f), li = screen.querySelectorAll('[data-files] li')[i];
    li?.querySelector('small')?.replaceChildren(`Uploading ${Math.round(f.pct*100)}%`);
    const bar = li?.querySelector('.pt-meter span'); if(bar) bar.style.width = f.pct*100 + '%';
  }

  async function grade() {
    const ready = files.filter(f => f.done), msg = screen.querySelector('.pt-msg');
    if(!ready.length && !link.trim() && !text.trim()) {msg.textContent = 'Upload your work, paste it, or add a video link first.'; return;}
    grading = true;
    screen.innerHTML = `<div class="ug-wait" role="status" aria-live="polite"><span class="ug-spinner" aria-hidden="true"></span><h2>Grading your work…</h2><p>Valus AI is reading your submission against the ${e(event)} rating sheet. This usually takes under a minute. Keep this page open.</p></div>`;
    try {
      const r = await api('POST', '/grader', {event, files:ready.map(f => ({path:info.folder + f.key, name:f.name})), link:link.trim() || null, text:text.trim() || null});
      if(!alive) return;
      info.remaining = r.remaining;
      info.attempts = [{id:r.attempt.id, score:r.attempt.score, files:r.attempt.files, createdAt:r.attempt.createdAt}, ...info.attempts];
      files = []; link = ''; text = '';
      grading = false; result(r.attempt);
    } catch(err) {
      if(!alive) return;
      grading = false; form();
      screen.querySelector('.pt-msg').textContent = err.message;
    }
  }

  function history() {
    if(!info.attempts.length) return '';
    return `<div class="ug-history"><h3>Your past grades</h3><ul>${info.attempts.map(a => `<li><button type="button" class="ug-past" data-open="${e(a.id)}"><strong>${a.score}%</strong><span>${e(a.files.join(', ') || 'Pasted work or video link')}</span><small>${e(when(a.createdAt))}</small></button></li>`).join('')}</ul></div>`;
  }
  function bindHistory() {
    screen.querySelectorAll('[data-open]').forEach(b => b.onclick = async () => {
      b.disabled = true;
      try {const r = await api('GET', '/grader/attempts/' + encodeURIComponent(b.dataset.open)); if(alive) result(r.attempt);}
      catch(err) {b.disabled = false; const m = screen.querySelector('.pt-msg'); if(m) m.textContent = err.message;}
    });
  }

  function result(a) {
    const level = c => c.assessable ? e(c.level || '') : 'Judged live';
    screen.innerHTML = `<span class="eyebrow">VALUS AI GRADE · ${e(when(a.createdAt))}</span>
     <div class="pt-score"><div class="pt-ring" style="--p:${a.score}"><strong>${a.score}%</strong></div><div><h2>${pts(a.earned)} of ${pts(a.possible)} points</h2><p>${e(a.rubricTitle)}</p><p class="subtle">A practice estimate from Valus AI, not an official HOSA score.${a.criteria.some(c => !c.assessable) ? ' Criteria judged live are not counted.' : ''}</p></div></div>
     ${a.summary ? `<p class="ug-summary">${e(a.summary)}</p>` : ''}
     ${a.missingRequirements.length ? `<div class="ug-missing"><strong>Missing or out of guidelines</strong><ul>${a.missingRequirements.map(m => `<li>${e(m)}</li>`).join('')}</ul></div>` : ''}
     <h3>Rating sheet</h3>
     <div class="ug-criteria">${a.criteria.map(c => `<div class="ug-criterion ${c.assessable ? '' : 'is-live'}"><div class="pt-area-row"><strong>${e(c.name)} <small>${level(c)}</small></strong><span>${c.assessable ? pts(c.awarded) : '–'}/${pts(c.possible)}</span><span class="pt-meter" aria-hidden="true"><span style="width:${c.assessable ? c.awarded / c.possible * 100 : 0}%"></span></span></div>${c.feedback ? `<p>${e(c.feedback)}</p>` : ''}</div>`).join('')}</div>
     ${a.strengths.length ? `<h3>What is working</h3><ul class="ug-list">${a.strengths.map(s => `<li>${e(s)}</li>`).join('')}</ul>` : ''}
     ${a.improvements.length ? `<h3>Where to improve</h3><ol class="ug-list">${a.improvements.map(i => `<li>${i.area ? `<strong>${e(i.area)}.</strong> ` : ''}${e(i.fix)}</li>`).join('')}</ol>` : ''}
     ${a.improvedVersion ? `<div class="ug-improved"><div class="ug-improved-head"><h3>Improved version</h3><div class="course-actions"><button type="button" class="text-button" data-copy>Copy</button><button type="button" class="text-button" data-download>Download</button></div></div><p class="subtle">Use it to learn what stronger work looks like, then revise in your own words. Fill in every [bracketed] placeholder with your own cited research.</p><pre class="ug-text">${e(a.improvedVersion)}</pre></div>` : ''}
     <div class="course-actions ug-end"><button type="button" class="button" data-again>Grade another upload</button></div>`;
    screen.querySelector('[data-again]').onclick = form;
    const copy = screen.querySelector('[data-copy]');
    if(copy) copy.onclick = () => navigator.clipboard?.writeText(a.improvedVersion).then(() => {copy.textContent = 'Copied';}, () => {copy.textContent = 'Copy failed';});
    const dl = screen.querySelector('[data-download]');
    if(dl) dl.onclick = () => {const url = URL.createObjectURL(new Blob([a.improvedVersion], {type:'text/plain'})); const link = Object.assign(document.createElement('a'), {href:url, download:event.replace(/[^\w]+/g, '-') + '-improved.txt'}); link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);};
    host.scrollIntoView({block:'start', behavior:'smooth'});
  }

  load();
  return () => {alive = false; uploads.forEach(u => u.cancel());};
}
