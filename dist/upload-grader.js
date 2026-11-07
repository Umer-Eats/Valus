// Valus AI graders on each event page, all scored against the event's official HOSA rating sheet:
// - upload: Online Upload Grader. Digital submissions, with where to improve and an improved version.
// - speech: Speech Grader. A recorded speech or presentation, broken down with timestamps.
// - video: Skills Video Grader. A recorded skill, scored step by step with timestamps.
import {uploadFile} from './session.js';

const e = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bytes = n => n >= 1e9 ? +(n/1e9).toFixed(1)+' GB' : n >= 1e6 ? +(n/1e6).toFixed(1)+' MB' : Math.max(1, Math.round(n/1e3))+' KB';
const pts = n => Number.isInteger(n) ? String(n) : n.toFixed(1);
const when = iso => new Date(iso).toLocaleString(undefined, {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'});
const clock = s => {s = Math.max(0, Math.round(s)); const h = Math.floor(s/3600), m = Math.floor(s/60) % 60, x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`;};
const newId = () => {const a = new Uint8Array(15); crypto.getRandomValues(a); return [...a].map(b => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 62]).join('') + Date.now().toString(36);};
const youtubeId = link => link?.match(/[?&]v=([\w-]{6,20})/)?.[1] || null;
const POLL_MS = 5000;

const COPY = {
  upload: {
    label: 'Online Upload Grader', title: 'Get your upload graded.', again: 'Grade another upload', what: 'submission',
    intro: event => `Upload the same work you will submit to HOSA. Valus AI scores it against the ${e(event)} rating sheet in the official guidelines, shows where you can improve, and writes an improved version you can learn from.`,
    accept: 'application/pdf,image/png,image/jpeg,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp4,audio/wav',
    note: 'Valus AI gives a practice estimate, not an official HOSA score. Parts judged live, such as your presentation, are not scored here.',
  },
  speech: {
    label: 'Speech Grader', title: 'Get your speech graded.', again: 'Grade another speech', what: 'speech',
    intro: event => `Record yourself giving your ${e(event)} speech or presentation the way you would for the judges. Valus AI watches it, scores every item on the official rating sheet, and points to the exact moments in your video where you earned or lost points.`,
    tips: ['Film from where a judge would sit, with your face, hands and any visuals in frame.', 'Use a quiet room so every word can be heard.', 'Record the whole timed part in one take, so your time can be checked against the limit.'],
    notes: 'Anything Valus AI should know (optional)', notesHint: 'For example the topic you were given, or which round this is',
    note: 'Valus AI gives a practice estimate, not an official HOSA score. Items a judge scores in person, such as answering questions, are not scored here.',
  },
  video: {
    label: 'Skills Video Grader', title: 'Get your skill graded.', again: 'Grade another skill', what: 'skill',
    intro: event => `Record yourself performing a ${e(event)} skill from start to finish. Valus AI checks every step on that skill's official rating sheet and shows the moment in your video where each step was done, done out of order, or missed.`,
    tips: ['Keep your hands, the equipment and the patient or manikin in frame the whole time.', 'Say each judge statement out loud, or pause briefly where the judge would speak.', 'Say the skill name at the start, or type it below.'],
    notes: 'Anything Valus AI should know (optional)', notesHint: 'For example whether you follow ARC or AHA, or a step the camera could not see',
    note: 'Valus AI gives a practice estimate, not an official HOSA score. Steps the camera cannot see are not scored.',
  },
};
const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm,video/x-m4v,video/mpeg,video/3gpp';
const isVideo = mode => mode === 'speech' || mode === 'video';

export const uploadGraderPage = (event, mode = 'upload') => `<section class="course-card ug" data-ug data-event="${e(event)}" data-mode="${e(mode)}" aria-label="${e(COPY[mode]?.label || 'Valus AI grader')}"><div data-ug-screen><p class="subtle">Loading the grader…</p></div></section>`;

// The site redraws the page at times, for example when the window regains focus after the file
// picker closes. Each grader's files, text and any grade in progress are kept here so a redraw
// does not lose them, and uploads keep running.
const kept = new Map();

export function mountUploadGrader(root, {api, userId}) {
  const host = root.querySelector('[data-ug]');
  if(!host) return () => {};
  const mode = COPY[host.dataset.mode] ? host.dataset.mode : 'upload';
  const owner = (userId || '') + '|', key = owner + mode + '|' + host.dataset.event;
  for(const [k, g] of kept) if(!k.startsWith(owner)) {g.cancel(); kept.delete(k);}
  if(!kept.has(key)) kept.set(key, grader(host.dataset.event, mode, api));
  const g = kept.get(key);
  g.attach(host);
  return () => g.detach(host);
}

function grader(event, mode, api) {
  const copy = COPY[mode], video = isVideo(mode);
  let host = null, screen = null, info = null, loading = null, files = [], link = '', text = '', skill = '', grading = false, shown = null;
  // A speech or skill video being processed: {id, phase, error}. local keeps the student's own video
  // file so the result can play it and jump to each timestamp.
  let job = null, polling = false, local = null;
  const uploads = new Set();
  const q = '/grader?event=' + encodeURIComponent(event) + '&mode=' + mode;
  const on = () => Boolean(screen?.isConnected);

  const failed = msg => {screen.innerHTML = `<h2>The grader could not load.</h2><p>${e(msg)}</p><div class="course-actions"><button type="button" class="button" data-retry>Try again</button></div>`; screen.querySelector('[data-retry]').onclick = load;};
  function load() {
    if(on()) screen.innerHTML = '<p class="subtle">Loading the grader…</p>';
    loading ??= api('GET', q).then(r => {
      info = r;
      // A video that was still being graded when the page closed picks up where it left off.
      if(video && !job && r.pending?.length) job = {id:r.pending[0].id, phase:'processing'};
      if(on()) show();
    }, err => {if(on()) failed(err.message);}).finally(() => {loading = null;});
  }
  function show() {
    if(!info) return load();
    if(job) {waiting(); poll();}
    else if(grading) waiting();
    else if(shown) result(shown);
    else form();
  }

  function waiting() {
    if(job?.error) {
      screen.innerHTML = `<div class="ug-wait"><h2>Grading stopped.</h2><p>${e(job.error)}</p><div class="course-actions"><button type="button" class="button" data-retry>Try again</button><button type="button" class="text-button" data-back>Back</button></div></div>`;
      screen.querySelector('[data-retry]').onclick = () => {job.error = ''; show();};
      screen.querySelector('[data-back]').onclick = () => {job = null; form();};
      return;
    }
    const phase = job?.phase || 'sending';
    const steps = video ? [['sending', 'Sending your video to Valus AI'], ['processing', 'Valus AI is watching your video'], ['grading', 'Scoring it against the rating sheet']] : null;
    const at = steps ? steps.findIndex(s => s[0] === phase) : 0;
    screen.innerHTML = `<div class="ug-wait" role="status" aria-live="polite"><span class="ug-spinner" aria-hidden="true"></span>
     <h2>Grading your ${copy.what}…</h2>
     ${steps ? `<ol class="ug-steps">${steps.map(([, label], i) => `<li class="${i < at ? 'is-done' : i === at ? 'is-now' : ''}">${label}</li>`).join('')}</ol>
      <p>Longer videos can take a few minutes. If you leave, come back to this page to finish grading.</p>`
     : `<p>Valus AI is reading your submission against the ${e(event)} rating sheet. This usually takes under a minute. Keep this page open.</p>`}</div>`;
  }

  // Asks the server about the video every few seconds, only while this page is open.
  async function poll() {
    if(polling || !job || job.error) return;
    polling = true;
    try {
      while(job && !job.error && on()) {
        let r;
        try {r = await api('POST', '/grader/jobs/' + encodeURIComponent(job.id));}
        catch(err) {
          if(!job) break;
          job.error = err.message;
          if(err.message && /not found|could not read/i.test(err.message)) {info.pending = []; const msg = err.message; job = null; grading = false; if(on()) {form(); screen.querySelector('.pt-msg').textContent = msg;} break;}
          if(on()) waiting();
          break;
        }
        if(r.status === 'done') {
          if(r.remaining != null) info.remaining = r.remaining;
          info.pending = (info.pending || []).filter(p => p.id !== job.id);
          if(!info.attempts.some(a => a.id === r.attempt.id)) info.attempts = [summary(r.attempt), ...info.attempts];
          if(local && local.id !== job.id) dropLocal();
          job = null; grading = false; shown = r.attempt;
          if(on()) {result(shown); host.scrollIntoView({block:'start', behavior:'smooth'});}
          break;
        }
        if(job.phase !== r.status) {job.phase = r.status; if(on()) waiting();}
        await new Promise(res => setTimeout(res, POLL_MS));
      }
    } finally {polling = false;}
  }
  const summary = a => ({id:a.id, score:a.score, files:a.files, createdAt:a.createdAt});

  function form() {
    shown = null;
    const ready = files.filter(f => f.done), busy = files.some(f => !f.done && !f.error);
    const total = ready.reduce((n, f) => n + f.size, 0);
    const full = files.filter(f => !f.error).length >= info.maxFiles;
    const fileList = `<ul class="rk-files" data-files>${files.map(f => `<li class="${f.error ? 'rk-error' : ''}"><span class="rk-file-name">${e(f.name)}</span><small>${f.error ? e(f.error) : f.done ? bytes(f.size)+' · ready' : `Uploading ${Math.round(f.pct*100)}%`}</small>${f.done || f.error ? `<button type="button" class="text-button" data-remove="${e(f.key)}">Remove</button>` : `<span class="pt-meter" aria-hidden="true"><span style="width:${f.pct*100}%"></span></span>`}</li>`).join('')}</ul>`;
    const picker = !info.uploads
      ? `<p class="ug-note">File uploads are not set up yet. ${video ? 'Paste a YouTube link to your video below.' : 'Paste your written work below to have it graded.'}</p>`
      : video
        ? `<div class="ug-drop"><input type="file" hidden accept="${VIDEO_ACCEPT}" data-file>
           <div><strong>Your video</strong><small>MP4, MOV or WEBM · one video up to ${bytes(info.maxBytes)}</small></div>
           <button type="button" class="button secondary" data-pick ${full ? 'disabled' : ''}>Choose video</button></div>
           ${local?.url && files.some(f => f.key === local.key && !f.error) ? `<video class="ug-video" src="${e(local.url)}" controls playsinline preload="metadata"></video>` : ''}${fileList}`
        : `<div class="ug-drop"><input type="file" multiple hidden accept="${copy.accept}" data-file>
           <div><strong>Your files</strong><small>PDF, images or a short video · up to ${info.maxFiles} files, ${bytes(info.maxBytes)} in total</small></div>
           <button type="button" class="button secondary" data-pick ${full ? 'disabled' : ''}>Choose files</button></div>${fileList}`;
    screen.innerHTML = `<span class="eyebrow">VALUS AI · OFFICIAL RATING SHEET</span>
     <h2>${copy.title}</h2>
     <p>${copy.intro(event)}</p>
     ${copy.tips ? `<ul class="ug-tips">${copy.tips.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
     <div class="ug-form">
      ${picker}
      <label class="field">${video ? 'Or a YouTube link' : 'Video link (optional)'}<input type="url" inputmode="url" maxlength="300" placeholder="https://youtu.be/…" value="${e(link)}" data-link><small class="subtle">${video ? 'Use a Public or Unlisted YouTube video instead of uploading a file.' : 'For video events, paste a Public or Unlisted YouTube link so Valus AI can watch it.'}</small></label>
      ${mode === 'video' ? `<label class="field">Which skill is in your video? (optional)<input maxlength="200" placeholder="For example: Skill III, Pulse Oximetry" value="${e(skill)}" data-skill></label>` : ''}
      ${video
        ? `<label class="field">${copy.notes}<textarea rows="3" maxlength="4000" placeholder="${e(copy.notesHint)}" data-text>${e(text)}</textarea></label>`
        : `<label class="field">Or paste your written work (optional)<textarea rows="6" maxlength="40000" placeholder="Paste your essay, script, poster text or any part of your submission" data-text>${e(text)}</textarea></label>`}
     </div>
     <div class="pt-submit"><p class="pt-msg" role="status" aria-live="polite">${total > info.maxBytes ? `Your files add up to ${bytes(total)}. Keep them under ${bytes(info.maxBytes)}.` : ''}</p>
      <div class="course-actions"><button type="button" class="button" data-grade ${busy || !info.remaining ? 'disabled' : ''}>${busy ? 'Waiting for upload…' : video ? 'Grade my video' : 'Grade my work'}</button><span class="subtle">${info.remaining} of ${info.dailyLimit} grades left today</span></div>
      <p class="subtle ug-small">${copy.note}</p></div>
     ${history()}`;
    const input = screen.querySelector('[data-file]');
    screen.querySelector('[data-pick]')?.addEventListener('click', () => {input.value = ''; input.click();});
    input?.addEventListener('change', () => {
      const room = info.maxFiles - files.filter(f => !f.error).length;
      [...input.files].slice(0, Math.max(0, room)).forEach(send);
      form();
    });
    screen.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => {files = files.filter(f => f.key !== b.dataset.remove); if(local?.key === b.dataset.remove) dropLocal(); form();});
    screen.querySelector('[data-link]').oninput = ev => {link = ev.target.value;};
    screen.querySelector('[data-text]').oninput = ev => {text = ev.target.value;};
    const sk = screen.querySelector('[data-skill]'); if(sk) sk.oninput = ev => {skill = ev.target.value;};
    screen.querySelector('[data-grade]').onclick = grade;
    bindHistory();
  }
  function dropLocal() {if(local?.url) URL.revokeObjectURL(local.url); local = null;}

  // Each file uploads straight to Firebase Storage as soon as it is chosen.
  function send(file) {
    const f = {key:newId(), name:file.name.slice(0, 200), size:file.size, pct:0, done:false, error:''};
    files.push(f);
    if(file.size > info.maxBytes) {f.error = `Too large: keep ${video ? 'your video' : 'files'} under ${bytes(info.maxBytes)}.`; return;}
    if(file.type && !info.types.includes(file.type)) {f.error = video ? 'Use an MP4, MOV or WEBM video.' : 'Use a PDF, an image, or a short video.'; return;}
    if(video) {dropLocal(); local = {key:f.key, url:URL.createObjectURL(file), id:null};}
    const up = uploadFile(info.folder + f.key, file, pct => {f.pct = pct; if(on() && !grading && !shown && !job) refreshFile(f);});
    uploads.add(up);
    up.done.then(() => {f.done = true;}, err => {f.error = err.message;}).finally(() => {uploads.delete(up); if(on() && !grading && !shown && !job) form();});
  }
  // Updates one progress bar without redrawing the form, so typing is not interrupted.
  function refreshFile(f) {
    const i = files.indexOf(f), li = screen.querySelectorAll('[data-files] li')[i];
    li?.querySelector('small')?.replaceChildren(`Uploading ${Math.round(f.pct*100)}%`);
    const bar = li?.querySelector('.pt-meter span'); if(bar) bar.style.width = f.pct*100 + '%';
  }

  async function grade() {
    const ready = files.filter(f => f.done), msg = screen.querySelector('.pt-msg');
    if(video && !ready.length && !link.trim()) {msg.textContent = 'Upload your video or paste a YouTube link first.'; return;}
    if(video && ready.length && link.trim()) {msg.textContent = 'Choose either your uploaded video or a YouTube link, not both.'; return;}
    if(!ready.length && !link.trim() && !text.trim()) {msg.textContent = 'Upload your work, paste it, or add a video link first.'; return;}
    grading = true;
    waiting();
    try {
      const r = await api('POST', '/grader', {event, mode, files:ready.map(f => ({path:info.folder + f.key, name:f.name})), link:link.trim() || null, text:text.trim() || null, ...(mode === 'video' && {skill:skill.trim() || null})});
      info.remaining = r.remaining;
      if(local) local.id = r.job?.id || r.attempt?.id;
      if(!ready.length) dropLocal();
      files = []; link = ''; text = ''; skill = '';
      if(r.job) {job = {id:r.job.id, phase:'processing'}; info.pending = [r.job, ...(info.pending || [])]; if(on()) show(); return;}
      info.attempts = [summary(r.attempt), ...info.attempts];
      grading = false; shown = r.attempt;
      if(on()) {result(shown); host.scrollIntoView({block:'start', behavior:'smooth'});}
    } catch(err) {
      grading = false;
      if(!on()) return;
      form();
      screen.querySelector('.pt-msg').textContent = err.message;
    }
  }

  function history() {
    if(!info.attempts.length) return '';
    return `<div class="ug-history"><h3>Your past grades</h3><ul>${info.attempts.map(a => `<li><button type="button" class="ug-past" data-open="${e(a.id)}"><strong>${a.score}%</strong><span>${e(a.files.join(', ') || (video ? 'YouTube video' : 'Pasted work or video link'))}</span><small>${e(when(a.createdAt))}</small></button></li>`).join('')}</ul></div>`;
  }
  function bindHistory() {
    screen.querySelectorAll('[data-open]').forEach(b => b.onclick = async () => {
      b.disabled = true;
      try {const r = await api('GET', '/grader/attempts/' + encodeURIComponent(b.dataset.open)); shown = r.attempt; if(on()) {result(shown); host.scrollIntoView({block:'start', behavior:'smooth'});}}
      catch(err) {b.disabled = false; const m = screen.querySelector('.pt-msg'); if(m) m.textContent = err.message;}
    });
  }

  function result(a) {
    shown = a;
    const timed = isVideo(a.mode);
    // Timestamps jump the player when the student's own video is here (same visit) or on YouTube.
    const own = timed && local?.url && local.id === a.id ? local.url : null, yt = timed && !own ? youtubeId(a.link) : null;
    const seekable = Boolean(own || yt);
    const stamp = m => seekable
      ? `<button type="button" class="ug-time ${m.good ? 'is-good' : 'is-miss'}" data-seek="${m.at}" title="Play from ${clock(m.at)}">${clock(m.at)}</button>`
      : `<span class="ug-time ${m.good ? 'is-good' : 'is-miss'}">${clock(m.at)}</span>`;
    const level = c => c.assessable ? e(c.level || '') : (timed ? 'Not scored from video' : 'Judged live');
    const player = own ? `<video class="ug-video" src="${e(own)}" controls playsinline preload="metadata" data-player></video>`
      : yt ? `<div class="ug-frame"><iframe src="https://www.youtube-nocookie.com/embed/${e(yt)}?enablejsapi=1&rel=0" title="Your video" allow="encrypted-media; picture-in-picture" allowfullscreen data-player></iframe></div>` : '';
    screen.innerHTML = `<span class="eyebrow">VALUS AI GRADE · ${e(when(a.createdAt))}</span>
     <div class="pt-score"><div class="pt-ring" style="--p:${a.score}"><strong>${a.score}%</strong></div><div><h2>${pts(a.earned)} of ${pts(a.possible)} points</h2><p>${e(a.skill && !a.rubricTitle.includes(a.skill) ? a.skill + ' · ' : '')}${e(a.rubricTitle)}${a.videoLength ? ' · ' + clock(a.videoLength) + ' video' : ''}</p><p class="subtle">A practice estimate from Valus AI, not an official HOSA score.${a.criteria.some(c => !c.assessable) ? (timed ? ' Items that cannot be scored from the video are not counted.' : ' Criteria judged live are not counted.') : ''}</p></div></div>
     ${a.summary ? `<p class="ug-summary">${e(a.summary)}</p>` : ''}
     ${a.missingRequirements.length ? `<div class="ug-missing"><strong>${timed ? 'Rules and time to fix' : 'Missing or out of guidelines'}</strong><ul>${a.missingRequirements.map(m => `<li>${e(m)}</li>`).join('')}</ul></div>` : ''}
     ${player}
     ${timed && a.timeline?.length ? `<h3>Timeline</h3>${seekable ? '' : '<p class="subtle">Times count from the start of your video.</p>'}<ol class="ug-timeline">${a.timeline.map(m => `<li>${stamp(m)}<span>${e(m.note)}</span></li>`).join('')}</ol>` : ''}
     <h3>Rating sheet${timed ? ' breakdown' : ''}</h3>
     <div class="ug-criteria">${a.criteria.map(c => `<div class="ug-criterion ${c.assessable ? '' : 'is-live'}"><div class="pt-area-row"><strong>${e(c.name)} <small>${level(c)}</small></strong><span>${c.assessable ? pts(c.awarded) : '–'}/${pts(c.possible)}</span><span class="pt-meter" aria-hidden="true"><span style="width:${c.assessable ? c.awarded / c.possible * 100 : 0}%"></span></span></div>${c.feedback ? `<p>${e(c.feedback)}</p>` : ''}${c.moments?.length ? `<ul class="ug-moments">${c.moments.map(m => `<li>${stamp(m)}<span>${e(m.note)}</span></li>`).join('')}</ul>` : ''}</div>`).join('')}</div>
     ${a.strengths.length ? `<h3>What is working</h3><ul class="ug-list">${a.strengths.map(s => `<li>${e(s)}</li>`).join('')}</ul>` : ''}
     ${a.improvements.length ? `<h3>Where to improve</h3><ol class="ug-list">${a.improvements.map(i => `<li>${i.area ? `<strong>${e(i.area)}.</strong> ` : ''}${e(i.fix)}</li>`).join('')}</ol>` : ''}
     ${a.improvedVersion ? `<div class="ug-improved"><div class="ug-improved-head"><h3>Improved version</h3><div class="course-actions"><button type="button" class="text-button" data-copy>Copy</button><button type="button" class="text-button" data-download>Download</button></div></div><p class="subtle">Use it to learn what stronger work looks like, then revise in your own words. Fill in every [bracketed] placeholder with your own cited research.</p><pre class="ug-text">${e(a.improvedVersion)}</pre></div>` : ''}
     <div class="course-actions ug-end"><button type="button" class="button" data-again>${copy.again}</button></div>`;
    screen.querySelector('[data-again]').onclick = () => {if(local?.id === a.id) dropLocal(); form();};
    const p = screen.querySelector('[data-player]');
    screen.querySelectorAll('[data-seek]').forEach(b => b.onclick = () => {
      const t = Number(b.dataset.seek);
      if(p?.tagName === 'VIDEO') {p.currentTime = t; p.play().catch(() => {});}
      else p?.contentWindow?.postMessage(JSON.stringify({event:'command', func:'seekTo', args:[t, true]}), '*');
      p?.scrollIntoView({block:'nearest', behavior:'smooth'});
    });
    const cp = screen.querySelector('[data-copy]');
    if(cp) cp.onclick = () => navigator.clipboard?.writeText(a.improvedVersion).then(() => {cp.textContent = 'Copied';}, () => {cp.textContent = 'Copy failed';});
    const dl = screen.querySelector('[data-download]');
    if(dl) dl.onclick = () => {const url = URL.createObjectURL(new Blob([a.improvedVersion], {type:'text/plain'})); const anchor = Object.assign(document.createElement('a'), {href:url, download:event.replace(/[^\w]+/g, '-') + '-improved.txt'}); anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);};
  }

  return {
    attach(h) {host = h; screen = h.querySelector('[data-ug-screen]'); show();},
    detach(h) {if(host === h) host = screen = null;},
    cancel() {uploads.forEach(u => u.cancel()); dropLocal(); job = null;},
  };
}
