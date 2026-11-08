// Valus mock procedure lab engine for spec-driven labs (see mock-lab-grade.js and mock-labs/).
// Same three modes, shell and scoring flow as the Dental Science lab: Learn (coached),
// Practice (live rating sheet) and Graded (hidden sheet, hard clock). The student clicks
// stations in the scene, answers each tool's panel, and types what they would say.
import {MASTERY, actData, applyWear, partMiss, rightAnswer} from './mock-lab-grade.js';
import {PIECES, DECO, roomSvg, operatorSvg, patientSvg} from './mock-lab-kit.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmt = s => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
const MODES = {learn: 'Learn', practice: 'Practice', graded: 'Graded'};
const PT_HOT = {stand: [-17, 258, 34, 124], walk: [-17, 258, 64, 124], sit: [-18, 262, 46, 118], wheel: [-18, 262, 46, 118], edge: [-18, 244, 46, 116], lie: [-100, 284, 214, 34], floor: [-70, 350, 145, 32], dog: [-56, 258, 120, 64]};
const PPE_NAME = {gloves: {exam: 'exam gloves', sterile: 'sterile gloves', utility: 'utility gloves'}, gown: 'gown', mask: 'mask', eyewear: 'eye protection', cap: 'cap'};

export function mountSpecLab(el, L, opts = {}) {
  const ranked = opts.ranked;
  const screen = el.querySelector('[data-mlab-screen]');
  const storeKey = 'valus-mocklab-' + L.id;
  const LIMIT = fmt(L.limitSec), TOTAL = L.total, LEARN = L.learn, ACTS = L.acts, ST = L.stations;
  const PT = L.patient || {};
  const ptKey = Object.keys(ST).find(k => ST[k].patient);
  let S = null, disposed = false, tickId = 0, fitObs = null, chosenMode = null;
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!disposed) fn(); }, ms); timers.add(id); return id; };
  const $ = sel => el.querySelector(sel);
  const $$ = sel => [...el.querySelectorAll(sel)];
  const history = () => { try { return JSON.parse(localStorage.getItem(storeKey) || '[]'); } catch { return []; } };
  const saveRun = run => { try { const h = history(); h.push(run); localStorage.setItem(storeKey, JSON.stringify(h.slice(-20))); } catch {} };
  const showIntro = () => { stopAll(); fitObs?.disconnect(); fitObs = null; S = null; chosenMode = null; screen.innerHTML = introHtml(); };
  const has = id => !!S?.log.some(e => e.type === id);
  const count = id => S ? S.log.filter(e => e.type === id).length : 0;
  const phases = [];
  for (const st of LEARN) { let p = phases.find(x => x[0] === st.phase); if (!p) phases.push(p = [st.phase, []]); if (!p[1].includes(st.act)) p[1].push(st.act); }

  // ---------- intro ----------
  function introHtml() {
    const h = history(), best = h.filter(x => x.mode === 'graded').sort((a, b) => b.earned - a.earned)[0];
    return `<div class="mlab-intro">
      <div class="mlab-intro-head"><span class="eyebrow">MOCK PROCEDURE · ${esc(L.event.toUpperCase())} · LAB ${esc(L.number)}</span><h2>${esc(L.heading || L.title)}</h2><p>${esc(L.intro)} You’re scored against the official HOSA rating ${L.sheets.length > 1 ? 'sheets' : 'sheet'}.</p></div>
      <div class="mlab-chart">
        <div><span>Skills on this station</span><ul>${L.skills.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
        <div><span>Team</span><b>${esc(L.team?.[0] || 'Just you')}</b><small>${esc(L.team?.[1] || `You are the ${L.role.toLowerCase()}.`)}</small></div>
        <div><span>Time</span><b>${LIMIT}</b><small>${esc(L.timeNote || 'The HOSA time for these skills. Typing time is paused.')}</small></div>
        <div><span>Scoring</span><b>${TOTAL} points</b><small>${Math.round(MASTERY * 100)}% mastery = ${(TOTAL * MASTERY).toFixed(1)} points</small></div>
      </div>
      <ol class="mlab-how"><li><b>Read the secret scenario.</b> You see it when the clock starts, just like at competition.</li><li><b>Click to act.</b> Hover over anything in the scene to see what it is, then click it for its actions. You walk to the right spot on your own.</li><li><b>Say it out loud by typing.</b> After each action, type what you would say or do for the judge. Verbal steps only count if your words cover them.</li><li><b>Finish and grade.</b> Choose Finish &amp; grade when the skill is complete.</li></ol>
      <fieldset class="mlab-modes"><legend>How do you want to run this lab?</legend>
        <label><input type="radio" name="mlab-mode" value="learn"><span><em>Start here</em><b>Learn</b><small>A coach walks you through every step in order: what to click, why it matters, and what to say. Correct choices are marked. No time limit.</small></span></label>
        <label><input type="radio" name="mlab-mode" value="practice"><span><b>Practice</b><small>Do it yourself in any order with a live rating sheet, hints and example phrases. The clock keeps counting past ${LIMIT}.</small></span></label>
        <label><input type="radio" name="mlab-mode" value="graded"><span><b>Graded</b><small>Competition rules: hard ${LIMIT} limit, rating sheet hidden, no hints. Scored when you finish or time runs out.</small></span></label>
      </fieldset>
      <div class="mlab-start-row"><button class="mlab-btn primary" type="button" data-act="start" disabled>Choose a mode to start</button>${best ? `<span class="mlab-best">Best graded run: <b>${best.earned}/${TOTAL}</b> (${Math.round(best.pct * 100)}%)</span>` : ''}</div>
      ${h.length ? `<div class="mlab-history"><span>Recent runs</span>${h.slice(-5).reverse().map(x => `<div><em>${MODES[x.mode] || x.mode}</em><b>${x.earned}/${TOTAL}</b><small>${Math.round(x.pct * 100)}% · ${fmt(x.secs)} · ${new Date(x.at).toLocaleDateString()}</small></div>`).join('')}</div>` : ''}
    </div>`;
  }

  // ---------- scene ----------
  function sceneSvg() {
    const sc = L.scene, back = [], front = [], hots = [];
    for (const d of sc.deco || []) back.push(DECO[d[0]](...d.slice(1)));
    for (const [key, s] of Object.entries(ST)) {
      if (!s.art && !s.hot) continue;
      // A piece can be mirrored (flip) so it faces left; its click target mirrors with it.
      const p = s.art ? PIECES[s.art](s.x, s.o || {}) : {svg: '', hot: s.hot};
      const wrap = svg => svg && s.flip ? `<g transform="translate(${2 * s.x} 0) scale(-1 1)">${svg}</g>` : svg;
      back.push(wrap(p.svg)); if (p.front) front.push(wrap(p.front));
      let [x, y, w, h] = s.hot || p.hot;
      if (s.flip && !s.hot) x = 2 * s.x - x - w;
      if (!s.nohot) hots.push(`<rect class="ml-hot" data-hot="${key}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`);
    }
    const used = Object.values(ST).map(s => s.pose).filter(Boolean);
    const poses = used.includes('dog') ? ['dog'] : ['stand', 'sit', 'edge', 'lie', 'floor', 'walk', 'wheel'];
    return `<svg class="kit-scene room-${sc.room}" viewBox="0 0 1000 440" role="img" aria-label="${esc(sc.label || L.title)}" style="--scrub:${L.scrub || '#2f8f8a'};--scrub2:${L.scrub2 || '#246c69'}">
      ${roomSvg(sc.room)}${back.join('')}${sc.extra || ''}<g class="ml-hots">${hots.join('')}</g>
      ${ptKey ? patientSvg(PT.look || {}, poses) : ''}${front.join('')}${operatorSvg()}${sc.top || ''}</svg>`;
  }

  // ---------- session ----------
  function fresh(mode) {
    return {mode, learn: mode === 'learn', help: mode !== 'graded', t0: performance.now(), pausedMs: 0, pauseAt: 0,
      log: [], pending: null, step: 0, coachMsg: '', coachTone: '', snap: null, judged: {}, panel: null, menu: null, side: 'sheet', earned: new Set(), done: false,
      wear: {gloves: null, gown: false, mask: false, eyewear: false, cap: false, ...(L.wear || {})}, loc: L.start || Object.keys(ST)[0], st: {pt: PT.at, ...(L.state || {})}};
  }
  const now = () => S ? Math.max(0, (performance.now() - S.t0 - S.pausedMs - (S.pauseAt ? performance.now() - S.pauseAt : 0)) / 1000) : 0;
  const clock = () => { const c = L.startClock || {h: 9, m: 0}; const m = c.h * 60 + c.m + Math.floor(now() / 60); const h = Math.floor(m / 60) % 24, mm = m % 60; return `${(h + 11) % 12 + 1}:${String(mm).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
  const step = () => S?.learn ? LEARN[S.step] : null;
  const snapshot = () => JSON.parse(JSON.stringify({wear: S.wear, st: S.st, loc: S.loc}));

  function start(mode) {
    S = fresh(mode);
    screen.innerHTML = labHtml();
    openModal('scenario');
    tickId = setInterval(tick, 250);
    if (S.learn) { S.coachMsg = 'Welcome! Follow the coach one step at a time. Glowing gold outlines show what to click.'; S.coachTone = 'ok'; }
    const svg = $('.kit-scene'); svg.classList.add('ml-noanim');
    fitObs?.disconnect();
    if (window.ResizeObserver) { fitObs = new ResizeObserver(fitScene); fitObs.observe($('[data-wrap]')); }
    fitScene(); updateAll();
    requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.remove('ml-noanim')));
  }
  function fitScene() {
    const wrap = $('[data-wrap]'), svg = $('.kit-scene'), ov = $('[data-ov]');
    if (!wrap || !svg) return;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const vh = w ? Math.max(440, 1000 * h / w) : 440, extra = vh - 440, top = extra * .25;
    svg.setAttribute('viewBox', `0 ${(-top).toFixed(1)} 1000 ${vh.toFixed(1)}`);
    if (ov) { ov.style.top = (top / vh * 100) + '%'; ov.style.height = (440 / vh * 100) + '%'; }
  }
  function labHtml() {
    return `<div class="mlab-shell kit-shell is-${S.mode}">
      <header class="mlab-top">
        <div class="mlab-id"><span>${esc(L.event.toUpperCase())} · LAB ${esc(L.number)}</span><b>${esc(L.title)}</b></div>
        <span class="mlab-mode-chip">${MODES[S.mode]}</span>
        <div class="mlab-who dl-who"><div class="dl-me"><b>You · ${esc(L.role)}</b><small data-wholoc></small></div></div>
        <div class="mlab-timer" data-timer aria-label="${S.learn ? 'Time elapsed' : 'Time remaining'}">${S.learn ? '0:00' : LIMIT}</div>
        <div class="mlab-top-actions"><button type="button" class="mlab-btn ghost" data-act="scenario">Scenario</button><button type="button" class="mlab-btn primary" data-act="finish">Finish &amp; grade</button></div>
      </header>
      <section class="mlab-coach" data-coach ${S.learn ? '' : 'hidden'} aria-live="polite"></section>
      <div class="mlab-stage" data-stage>
        <div class="mlab-scene-wrap" data-wrap>
          ${sceneSvg()}
          <div class="mlab-clock" data-clock></div>
          <div class="mlab-ov" data-ov>
            ${ptKey ? '<div class="mlab-ptag dl-ptag" data-ptag></div>' : ''}
            <div class="mlab-say r1" data-say hidden></div>
            <div class="mlab-bubble patient" data-pbubble hidden></div>
          </div>
          <div class="mlab-bubble judge" data-judge hidden></div>
          <div class="mlab-tip" data-tip hidden></div>
          <div class="mlab-menu" data-menu hidden role="menu"></div>
          <p class="mlab-scene-help">Hover to inspect · click a person or object to act</p>
        </div>
        <div class="mlab-panel" data-panel hidden></div>
      </div>
      <form class="mlab-narrate" data-narrate hidden autocomplete="off">
        <div class="mlab-narrate-head"><span class="pulse"></span><b data-narr-label></b><small>Clock paused · type what you say or do for the judge</small></div>
        <div class="mlab-narrate-row"><input name="say" maxlength="400" aria-label="Narration for the judge"><button class="mlab-btn primary" type="submit">Log it</button><button class="mlab-btn ghost" type="button" data-act="skipNarr">Skip</button></div>
        <div class="mlab-narr-foot"><small class="mlab-narr-ex" data-narr-ex></small><button type="button" class="mlab-btn ghost small" data-act="useWords" hidden>Use the coach’s words</button></div>
      </form>
      <div class="mlab-status"><ol class="mlab-phases" data-phases aria-label="Procedure progress"></ol><div class="mlab-vitals" data-vitals></div><div class="mlab-hint" data-hint role="status" aria-live="polite"></div></div>
      <div class="mlab-lower">
        <aside class="mlab-side">
          <div class="mlab-side-tabs" role="tablist"><button type="button" data-act="side" data-v="sheet">Rating sheet</button><button type="button" data-act="side" data-v="log">Action log</button><button type="button" data-act="side" data-v="pts">${esc(L.infoTab || 'Patient')}</button></div>
          <div class="mlab-side-body" data-side></div>
        </aside>
      </div>
      <div class="mlab-modal" data-modal hidden></div>
    </div>`;
  }

  // ---------- logging, narration, judge ----------
  function record(type, d = {}, opt = {}) {
    const a = ACTS[type];
    if (a) applyWear(a, S.wear, d);
    if (a?.info) d.info = a.info.text;
    const ev = {i: S.log.length, t: +now().toFixed(2), r: 1, type, d, say: opt.say ?? ''};
    S.log.push(ev);
    const st = step();
    if (st && st.act === type && a?.panel && !d.good) {
      S.log.pop();
      if (S.snap) Object.assign(S, S.snap);
      S.panel = null; renderPanel();
      const bad = a.panel.map(p => partMiss(p, d[p.k])).find(Boolean) || 'One choice was wrong.';
      coach('Not quite. ' + bad + ' Try again.', 'warn'); updateAll(); return null;
    }
    if (a?.set) Object.assign(S.st, typeof a.set === 'function' ? a.set(d, S) : a.set);
    if (!opt.quiet && !a?.quiet && opt.say == null) {
      S.pending = ev; S.pauseAt = performance.now();
      const f = $('[data-narrate]'); f.hidden = false;
      $('[data-narr-label]').textContent = `You · ${a?.label || type}`;
      const coachSay = st && st.act === type && st.say;
      $('[data-narr-ex]').textContent = coachSay ? 'Coach: “' + coachSay + '”' : S.help && a?.ex ? 'Example: ' + a.ex : '';
      $('[data-act="useWords"]').hidden = !coachSay;
      const input = f.querySelector('input'); input.value = ''; input.placeholder = 'What do you say or do?';
      setTimeout(() => input.focus({preventScroll: true}), 30);
      f.scrollIntoView({block: 'nearest', behavior: 'smooth'});
    } else afterAction(ev);
    updateAll();
    return ev;
  }
  function closeNarration(text) {
    const ev = S.pending; if (!ev) return;
    ev.say = text.trim(); S.pending = null;
    if (S.pauseAt) { S.pausedMs += performance.now() - S.pauseAt; S.pauseAt = 0; }
    $('[data-narrate]').hidden = true;
    if (ev.say) sayBubble(ev.say);
    afterAction(ev); updateAll();
  }
  function afterAction(ev) {
    const a = ACTS[ev.type]; if (!a) return;
    if (a.talk) { const g = $('[data-s="op"]'); g?.classList.add('talk'); later(() => g?.classList.remove('talk'), 1600); }
    if (a.pt) later(() => patientSays(typeof a.pt === 'function' ? a.pt(ev.d) : a.pt), 500);
    if (a.info) { const b = $('[data-judge]'); b.innerHTML = `<span>${esc(a.info.who)}</span>${esc(a.info.text)}`; b.hidden = false; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); later(() => { if (b.textContent.endsWith(a.info.text)) b.hidden = true; }, 7000); }
    if (a.judge) later(() => { if (!S) return; judge(a.judge.key, a.judge.text); updateAll(); if (S.learn && a.judge.coach) coach(a.judge.coach, 'ok'); }, a.judge.delay ?? 700);
    if (S.help && !S.learn) feedback();
    learnCheck(ev);
  }
  function sayBubble(text) {
    const b = $('[data-say]'); if (!b) return;
    b.textContent = text.length > 110 ? text.slice(0, 107) + '…' : text; b.hidden = false; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    clearTimeout(b._t); b._t = later(() => { b.hidden = true; }, 4200);
  }
  function judge(key, text) {
    if (S.judged[key]) return; S.judged[key] = true;
    S.log.push({i: S.log.length, t: +now().toFixed(2), r: 0, type: 'judge', d: {key, text}, say: ''});
    const b = $('[data-judge]'); b.innerHTML = `<span>JUDGE</span>${esc(text)}`; b.hidden = false; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    later(() => { if (b.textContent.endsWith(text)) b.hidden = true; }, 6500);
  }
  function patientSays(text) {
    const b = $('[data-pbubble]'); if (!b) return;
    b.innerHTML = `<span>${esc((PT.short || 'Patient').toUpperCase())}</span>${esc(text)}`; b.hidden = false; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    later(() => { if (b.textContent.endsWith(text)) b.hidden = true; }, 5000);
  }
  function hint(text, tone = '') { const h = $('[data-hint]'); if (!h) return; h.className = 'mlab-hint ' + tone; h.textContent = text; }
  function feedback() {
    const g = L.grade(S.log); const gained = [], misses = [];
    for (const sh of g.sheets) for (const it of sh.items) {
      if (it.earned && !S.earned.has(it.id)) { S.earned.add(it.id); gained.push(`+${it.pts} ${sh.id} #${it.n}`); }
      if (!it.earned && /narration did not mention/.test(it.note) && !S.earned.has('miss:' + it.id)) { S.earned.add('miss:' + it.id); misses.push(it.note.replace('Done, but your narration', 'Narration')); }
    }
    if (gained.length || misses.length) hint([gained.length ? 'Rating sheet: ' + gained.join(' · ') : '', misses[0] ? 'Tip: ' + misses[0] : ''].filter(Boolean).join('   '), misses.length && !gained.length ? 'warn' : 'ok');
  }

  // ---------- Learn mode coach ----------
  function coach(msg, tone = '') { S.coachMsg = msg; S.coachTone = tone; renderCoach(); }
  function learnCheck(ev) {
    const st = step(); if (!st || ev.type !== st.act) return;
    const miss = (st.need || []).filter(([re]) => !re.test(ev.say || '')).map(n => n[1]);
    S.step++;
    const nx = step();
    if (S.panel && (!nx || nx.act !== S.panel.id)) { S.panel = null; renderPanel(); }
    coach(miss.length ? `Step done. For full points, your words should include ${miss.join(' and ')}.` : `✓ ${st.title} — done.`, miss.length ? 'warn' : 'ok');
  }
  function renderCoach() {
    const c = $('[data-coach]'); if (!c || !S.learn) return;
    const st = step(), n = LEARN.length;
    const msg = S.coachMsg ? `<p class="coach-msg ${S.coachTone}">${esc(S.coachMsg)}</p>` : '';
    if (!st) { c.innerHTML = `<div class="coach-head"><span>LEARN · COMPLETE</span></div><div class="coach-prog"><i style="width:100%"></i></div><h3>You finished the whole station.</h3>${msg}<p class="coach-lead">You did every step on the rating ${L.sheets.length > 1 ? 'sheets' : 'sheet'}. Grade the run to see your score, then try Practice mode without the coach.</p><div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="finishYes">See my rating sheet</button></div>`; return; }
    c.innerHTML = `<div class="coach-head"><span>LEARN · STEP ${S.step + 1} OF ${n}${st.phase ? ' · ' + esc(st.phase.toUpperCase()) : ''}</span></div>
      <div class="coach-prog"><i style="width:${S.step / n * 100}%"></i></div>
      <h3>${esc(st.title)}</h3>${msg}
      <div class="coach-grid"><p><b>Do</b>${esc(st.do)}</p>${st.why ? `<details class="coach-why" ${matchMedia('(max-width:640px)').matches ? '' : 'open'}><summary><b>Why</b></summary>${esc(st.why)}</details>` : ''}${st.say && !ACTS[st.act].quiet ? `<p><b>Say</b>“${esc(st.say)}”</p>` : ''}</div>
      <div class="mlab-row"><button type="button" class="mlab-btn ghost small" data-act="showMe">Show me where</button></div>`;
  }
  function flashTarget() {
    const st = step(); if (!st) return;
    $('[data-wrap]')?.scrollIntoView({block: 'nearest', behavior: 'smooth'});
    const hotKey = ACTS[st.act].at;
    const hots = hotKey ? $$(`[data-hot="${hotKey}"]`) : [];
    const panel = S.panel && st.act === S.panel.id ? $('[data-panel]') : null;
    for (const h of [...hots, panel].filter(Boolean)) { h.classList.remove('flash'); void h.getBoundingClientRect(); h.classList.add('flash'); later(() => h.classList.remove('flash'), 1900); }
  }

  // ---------- gating ----------
  function gate(id) {
    const a = ACTS[id];
    if (S.pending) return 'Log your narration first (or skip it).';
    if (S.done) return 'This run is finished.';
    if (!a.repeat && has(id)) return a.doneMsg || 'Already done.';
    if (a.bare && S.wear.gloves) return 'Take your gloves off first.';
    for (const r of a.req || []) if (!has(r)) return a.reqMsg || `First: ${ACTS[r]?.label?.toLowerCase() || r}.`;
    if (a.cue && !S.judged[a.cue]) return a.cueMsg || 'Wait for the judge’s cue.';
    for (const r of a.not || []) if (has(r)) return a.notMsg || 'Not at this point.';
    if (a.gate) { const m = a.gate(S, has, count); if (m) return m; }
    return null;
  }

  // ---------- tools ----------
  function useTool(id) {
    closeMenu();
    if (S.learn) {
      const st = step();
      if (!st) return hint('Lesson complete. Press “See my rating sheet”.', 'ok');
      if (id !== st.act) { coach(`Follow the coach: this step is “${st.title}”. ${st.do}`, 'warn'); flashTarget(); return; }
    }
    const block = gate(id);
    if (block) { hint(block, 'warn'); if (S.learn) coach(block, 'warn'); return; }
    hint('');
    S.snap = snapshot();
    moveTo(ACTS[id].at);
    if (!ACTS[id].panel) return record(id, actData(ACTS[id], {}));
    openPanel(id);
  }
  function moveTo(key) {
    if (!key || S.loc === key) return;
    S.loc = key;
    S.log.push({i: S.log.length, t: +now().toFixed(2), r: 1, type: 'move', d: {to: key}, say: ''});
  }

  // ---------- scene menu + hover ----------
  function menuTools(key) { return Object.values(ACTS).filter(a => a.at === key && !a.hidden).map(a => a.id); }
  function openMenu(key, x, y) {
    if (!S || S.done) return;
    if (S.pending) return hint('Log your narration first (or skip it).', 'warn');
    if (!ST[key]) return;
    S.menu = {key, x, y}; renderMenu();
  }
  function renderMenu() {
    const m = $('[data-menu]'); if (!m || !S.menu) return;
    const H = ST[S.menu.key], st = step();
    m.innerHTML = `<header><div><b>${esc(stName(S.menu.key))}</b><small>${esc(H.tip || '')}</small></div><button type="button" class="mlab-x" data-act="closeMenu" aria-label="Close">×</button></header>
      <div class="mlab-menu-list">${menuTools(S.menu.key).map(id => { const why = gate(id); return `<button type="button" role="menuitem" class="${why ? 'off' : ''} ${st && st.act === id ? 'coach' : ''}" data-tool="${id}"><b>${esc(ACTS[id].label)}</b><small>${esc(why || ACTS[id].sub || '')}</small></button>`; }).join('')}</div>`;
    m.hidden = false;
    const wrap = $('[data-wrap]').getBoundingClientRect();
    const w = m.offsetWidth, h = m.offsetHeight;
    let left = S.menu.x - wrap.left + 12, top = S.menu.y - wrap.top - 20;
    if (left + w > wrap.width - 8) left = S.menu.x - wrap.left - w - 12;
    left = Math.max(8, Math.min(left, wrap.width - w - 8));
    top = Math.max(8, Math.min(top, wrap.height - h - 8));
    m.style.left = left + 'px'; m.style.top = top + 'px';
    hideTip();
  }
  const stName = key => ST[key].patient && PT.name ? `${PT.name}${PT.age ? ' · ' + PT.age.split('·')[0].trim() : ''}` : ST[key].name;
  function closeMenu() { if (!S) return; S.menu = null; const m = $('[data-menu]'); if (m) m.hidden = true; }
  function showTip(hot) {
    if (!S || S.menu) return;
    const key = hot.dataset.hot, H = ST[key]; if (!H) return;
    const tip = $('[data-tip]'), wrap = $('[data-wrap]').getBoundingClientRect(), b = hot.getBoundingClientRect();
    const st = step();
    tip.innerHTML = `<b>${esc(stName(key))}</b><small>${esc(H.tip || '')}</small>${st && ACTS[st.act].at === key ? '<em>Next step is here</em>' : ''}`;
    tip.hidden = false;
    const w = tip.offsetWidth;
    tip.style.left = Math.max(6, Math.min(b.left - wrap.left + b.width / 2 - w / 2, wrap.width - w - 6)) + 'px';
    tip.style.top = Math.max(6, b.top - wrap.top - tip.offsetHeight - 8) + 'px';
  }
  function hideTip() { const t = $('[data-tip]'); if (t) t.hidden = true; }

  // ---------- panels ----------
  function openPanel(id) {
    const a = ACTS[id];
    S.panel = {id, ans: {}, view: {}};
    for (const p of a.panel) {
      if (p.q) S.panel.view[p.k] = p.q.map(q => shuffle(q.slice(1).map((t, i) => [i === 0 ? '1' : String(i + 1), t])));
      if (p.pick) S.panel.view[p.k] = shuffle(p.pick);
      if (p.order) S.panel.view[p.k] = shuffle(p.order);
      if (p.choose) S.panel.view[p.k] = p.keep ? p.choose : shuffle(p.choose);
      if (p.pick || p.order) S.panel.ans[p.k] = [];
      if (p.q) S.panel.ans[p.k] = p.q.map(() => null);
      if (p.num && p.num.init != null) S.panel.ans[p.k] = String(p.num.init);
    }
    renderPanel();
    $('[data-panel]').scrollIntoView({block: 'nearest', behavior: 'smooth'});
  }
  const single = a => a.panel.length === 1 && a.panel[0].choose;
  const answered = (p, v) => p.q ? v.every(x => x != null) : p.pick ? true : p.order ? v.length === p.order.length : p.text ? String(v || '').trim().length > 1 : v != null && v !== '';
  const star = on => S.learn && on ? ' pick' : '';
  function partHtml(p, n) {
    const P = S.panel, v = P.ans[p.k], view = P.view[p.k], lbl = p.label ? `<label class="mlab-lbl">${n ? n + ' · ' : ''}${esc(p.label)}</label>` : '';
    if (p.q) return lbl + p.q.map((q, i) => `<div class="mlab-q"><small>${esc(q[0])}</small><div class="mlab-choices">${view[i].map(([val, t]) => `<button type="button" class="mlab-choice ${v[i] === val ? 'on' : ''}${star(val === '1')}" data-q="${p.k}" data-i="${i}" data-v="${val}">${esc(t)}</button>`).join('')}</div></div>`).join('');
    if (p.choose) return lbl + `<div class="mlab-choices ${p.row ? 'row' : ''}">${view.map(([val, t]) => `<button type="button" class="mlab-choice ${v === val ? 'on' : ''}${star(p.right.includes(val))}" data-pset="${p.k}" data-v="${val}">${esc(t)}</button>`).join('')}</div>`;
    if (p.pick) return lbl + `<div class="mlab-choices row">${view.map(([val, t]) => `<button type="button" class="mlab-choice dl-tog ${v.includes(val) ? 'on' : ''}${star(p.need.includes(val))}" data-tog="${p.k}" data-v="${val}" aria-pressed="${v.includes(val)}">${esc(t)}</button>`).join('')}</div><p class="mlab-note">${v.length} selected</p>`;
    if (p.order) return lbl + `<ol class="kit-seq">${v.map((k, i) => `<li><i>${i + 1}</i>${esc(p.order.find(o => o[0] === k)[1])}</li>`).join('') || '<li class="empty">Tap the steps below in order.</li>'}</ol>
      <div class="mlab-choices row">${view.filter(([k]) => !v.includes(k)).map(([val, t]) => `<button type="button" class="mlab-choice${star(S.learn && p.right[v.length] === val)}" data-ord="${p.k}" data-v="${val}">${esc(t)}</button>`).join('')}</div>${v.length ? `<div class="mlab-row"><button type="button" class="mlab-btn ghost small" data-act="ordUndo" data-k="${p.k}">Undo last</button></div>` : ''}`;
    if (p.num) return lbl + `${p.num.show ? `<div class="kit-reading"><small>${esc(p.num.showLabel || 'Reading')}</small><b>${p.num.show}</b></div>` : ''}<div class="kit-num"><input type="number" inputmode="decimal" step="${p.num.step ?? 'any'}" ${p.num.min != null ? `min="${p.num.min}"` : ''} ${p.num.max != null ? `max="${p.num.max}"` : ''} value="${esc(v ?? '')}" data-num="${p.k}" aria-label="${esc(p.label || 'Value')}">${p.num.unit ? `<span>${esc(p.num.unit)}</span>` : ''}</div>${S.learn ? `<div class="mlab-range-note">★ ${esc(p.num.say || p.num.ok.join('–'))}</div>` : ''}`;
    if (p.text) return lbl + `<textarea class="kit-text" rows="3" maxlength="300" data-txt="${p.k}" placeholder="${esc(p.text.ph || '')}">${esc(v || '')}</textarea>${S.learn && p.text.model ? `<div class="mlab-range-note">★ For example: ${esc(p.text.model)}</div>` : ''}`;
    return '';
  }
  function renderPanel() {
    const box = $('[data-panel]'), stage = $('[data-stage]');
    const P = S.panel;
    if (!P) { box.hidden = true; box.innerHTML = ''; stage.classList.remove('has-panel'); return; }
    const a = ACTS[P.id];
    box.hidden = false; stage.classList.add('has-panel');
    const tip = S.learn && a.tip ? `<div class="mlab-ptip"><b>Coach</b>${esc(a.tip)}<small>★ marks the correct choice.</small></div>` : '';
    const many = a.panel.length > 1;
    const ok = a.panel.every(p => answered(p, P.ans[p.k]));
    box.innerHTML = `<div class="mlab-panel-in"><header><div><span>YOU · ${esc((ACTS[P.id].kind || 'TOOL').toUpperCase())}</span><h3>${esc(a.panelTitle || a.label)}</h3>${a.ask ? `<p>${esc(a.ask)}</p>` : ''}</div><button type="button" class="mlab-x" data-act="closePanel" aria-label="Close tool">×</button></header>${tip}
      ${a.panel.map((p, i) => partHtml(p, many ? i + 1 : 0)).join('')}
      ${single(a) ? '' : `<div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="panelDone" ${ok ? '' : 'disabled'}>${esc(a.doLabel || 'Done')}</button></div>`}</div>`;
  }
  function submitPanel() {
    const P = S.panel, a = ACTS[P.id];
    const d = actData(a, P.ans);
    S.panel = null; renderPanel();
    record(a.id, d);
  }

  // ---------- rendering ----------
  function updateScene() {
    const svg = $('.kit-scene'); if (!svg || !S) return;
    // state classes
    svg.setAttribute('class', `kit-scene room-${L.scene.room} ` + Object.entries(S.st).filter(([, v]) => v != null && v !== false).map(([k, v]) => `s-${k}-${v === true ? 'on' : String(v).replace(/\W/g, '')}`).join(' ') + (svg.classList.contains('ml-noanim') ? ' ml-noanim' : ''));
    $$('[data-show]').forEach(n => { const [k, v] = n.dataset.show.split('='); const cur = S.st[k]; n.classList.toggle('off', v == null ? !cur : String(cur) !== v); });
    // patient
    let ptX = 0;
    if (ptKey) {
      const at = ST[S.st.pt] || {}, pose = S.st.pose || at.pose || 'stand';
      ptX = at.px ?? at.x ?? 0;
      const g = $('[data-s="pt"]'); g.dataset.pose = pose; g.style.transform = `translate(${ptX}px,${at.py ?? 0}px)`;
      g.classList.toggle('flip', (at.pflip ?? 1) < 0); g.classList.toggle('gone', S.st.pt === 'gone');
      const [x, y, w, h] = PT_HOT[pose] || PT_HOT.stand;
      g.querySelector('.kit-pt-hot').innerHTML = `<rect class="ml-hot" data-hot="${ptKey}" x="${(at.pflip ?? 1) < 0 ? -x - w : x}" y="${y}" width="${w}" height="${h}" rx="12"/>`;
    }
    // operator
    const here = ST[S.loc] || {};
    const ox = here.patient ? (ST[S.st.pt]?.side ?? ptX - 40) : (here.stand ?? here.x ?? 100);
    const face = here.face ?? (here.patient ? (ox <= ptX ? 1 : -1) : 1);
    const op = $('[data-s="op"]'); op.style.transform = `translate(${ox}px,0px)`;
    op.querySelector('.kit-face').style.transform = `scaleX(${face})`;
    const W = S.wear, oc = (c, on) => op.classList.toggle(c, !!on);
    oc('gowned', W.gown); oc('sterile-gown', W.gown === 'sterile'); oc('masked', W.mask); oc('eyes', W.eyewear); oc('capped', W.cap);
    oc('gl-exam', W.gloves === 'exam'); oc('gl-sterile', W.gloves === 'sterile'); oc('gl-utility', W.gloves === 'utility');
    const say = $('[data-say]'); if (say) say.style.left = Math.max(8, Math.min(78, ox / 10 - 6)) + '%';
    const pb = $('[data-pbubble]'); if (pb) pb.style.left = Math.max(6, Math.min(70, ptX / 10 - 4)) + '%';
    // Learn: outline the next click.
    const st = step();
    $$('.ml-hot.target').forEach(h => h.classList.remove('target'));
    if (st && !(S.panel && st.act === S.panel.id) && !S.pending) $$(`[data-hot="${ACTS[st.act].at}"]`).forEach(h => h.classList.add('target'));
    const tag = $('[data-ptag]');
    if (tag) { tag.innerHTML = `<b>${esc(PT.short || 'Patient')}</b>${esc(L.ptStatus ? L.ptStatus(S) : PT.status || '')}`; tag.hidden = S.st.pt === 'gone';
      // Center the tag over the patient, but keep it fully inside the scene.
      const box = tag.parentElement.clientWidth, half = tag.offsetWidth / 2;
      tag.style.left = (box ? Math.max(half + 4, Math.min(box - half - 4, box * (ptX / 10 - 5) / 100)) + 'px' : Math.max(4, Math.min(86, ptX / 10 - 5)) + '%'); }
  }
  function updatePhases() {
    const box = $('[data-phases]'); if (!box) return;
    const types = new Set(S.log.map(e => e.type));
    box.innerHTML = phases.map(([name, evs], i) => { const n = evs.filter(e => types.has(e)).length, p = n / evs.length; return `<li class="${p === 1 ? 'done' : p ? 'part' : ''}" style="--p:${p}"><i>${p === 1 ? '✓' : i + 1}</i><span>${esc(name)}</span></li>`; }).join('');
  }
  function updateTop() { const l = $('[data-wholoc]'); if (l) l.textContent = 'At the ' + (ST[S.loc]?.patient ? (PT.short || 'patient') : (ST[S.loc]?.name || '').toLowerCase()); }
  function updateVitals() {
    const v = $('[data-vitals]'); if (!v) return; const W = S.wear;
    const ppe = [W.gown && (W.gown === 'sterile' ? 'sterile gown' : 'gown'), W.cap && 'cap', W.mask && 'mask', W.eyewear && 'eye protection', W.gloves && PPE_NAME.gloves[W.gloves]].filter(Boolean);
    v.innerHTML = `<span class="vt"><small>YOU ARE WEARING</small>${ppe.length ? esc(ppe.join(' · ')) : 'No PPE'}</span>` + (L.status || []).map(([k, f]) => `<span class="vt"><small>${esc(k)}</small>${esc(f(S, has))}</span>`).join('');
  }
  function updateSide() {
    $$('.mlab-side-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.v === S.side));
    const box = $('[data-side]'); if (!box) return;
    const logRow = e => e.type === 'judge' ? `<li class="j"><time>${fmt(e.t)}</time><b>Judge</b> ${esc(e.d.text)}</li>` : `<li class="r1"><time>${fmt(e.t)}</time><b>You</b> ${esc(e.type === 'move' ? 'Moved to the ' + (ST[e.d.to]?.patient ? (PT.short || 'patient') : (ST[e.d.to]?.name || e.d.to).toLowerCase()) : (ACTS[e.type]?.label || e.type) + (e.d?.info ? " · " + e.d.info : ""))}${e.say ? `<q>${esc(e.say)}</q>` : ''}</li>`;
    if (S.side === 'log') { box.innerHTML = S.log.length ? `<ol class="mlab-log">${S.log.slice().reverse().map(logRow).join('')}</ol>` : '<p class="mlab-empty">Actions you take appear here with your narration.</p>'; return; }
    if (S.side === 'pts') { box.innerHTML = `<div class="mlab-pt"><span>${esc((L.infoTab || 'Patient').toUpperCase())}</span><b>${esc(PT.name || L.title)}</b>${PT.age ? `<small>${esc(PT.age)}</small>` : ''}<dl>${(PT.facts || []).map(([k, val]) => `<dt>${esc(k)}</dt><dd>${esc(val)}</dd>`).join('')}</dl></div>`; return; }
    if (!S.help) { box.innerHTML = `<div class="mlab-locked"><b>Rating sheet hidden</b><p>Graded runs work like competition: you see your scores after you finish.</p><p>${TOTAL} points · ${Math.round(MASTERY * 100)}% mastery.</p></div>`; return; }
    const g = L.grade(S.log);
    box.innerHTML = `<div class="mlab-sheet-top"><div class="mlab-score"><b>${g.earned}</b><span>/ ${TOTAL} pts</span><div class="mlab-bar"><i style="width:${g.pct * 100}%"></i><em style="left:${MASTERY * 100}%"></em></div></div></div>
      <div class="mlab-sheets">${g.sheets.map(sh => `<details open><summary><b>${esc(sh.title)}</b><small>${esc(sh.who || '')} · ${sh.earned}/${sh.possible}</small></summary><ul class="mlab-sheet">${sh.items.map(it => `<li class="${it.earned ? 'ok' : ''}" ${it.earned ? '' : `title="${esc(it.note)}"`}><i>${it.earned ? '✓' : ''}</i><span>${esc(it.n)}</span><p>${esc(it.text)}</p><em>${it.pts}</em></li>`).join('')}</ul></details>`).join('')}</div>`;
  }
  function updateAll() { if (!S || !$('.mlab-shell')) return; updateScene(); updateTop(); updateVitals(); updatePhases(); updateSide(); renderCoach(); if (S.menu) renderMenu(); }

  function tick() {
    if (!S || S.done) return;
    const t = now(), left = L.limitSec - t;
    const tm = $('[data-timer]');
    if (tm) {
      tm.textContent = S.learn ? fmt(t) : left >= 0 ? fmt(left) : '+' + fmt(-left);
      tm.classList.toggle('low', !S.learn && left < 60); tm.classList.toggle('over', !S.learn && left < 0); tm.classList.toggle('paused', !!S.pauseAt);
    }
    const c = $('[data-clock]'); if (c) c.textContent = `${clock()} · ${L.place}`;
    if (S.mode === 'graded' && left <= 0) finish(true);
  }

  // ---------- modal, finish, report ----------
  function openModal(kind) {
    const m = $('[data-modal]'); if (!m) return;
    if (kind === 'scenario') m.innerHTML = `<div class="mlab-dialog scen" role="dialog" aria-label="Scenario"><span class="eyebrow">${S.learn ? 'SCENARIO · LEARN MODE' : 'SECRET SCENARIO · CLOCK RUNNING'}</span><h3>${esc(L.title)}</h3>${L.scenario.map(p => `<p>${esc(p)}</p>`).join('')}<dl><dt>Setting</dt><dd>${esc(L.place)}</dd>${PT.name ? `<dt>${esc(L.infoTab || 'Patient')}</dt><dd>${esc(PT.name)}${PT.age ? ', ' + esc(PT.age) : ''}</dd>` : ''}<dt>Skills</dt><dd>${L.skills.map(esc).join('<br>')}</dd></dl>${S.learn ? '<p class="mlab-note">The coach above the scene tells you exactly what to click, why, and what to say. Gold outlines show where to click.</p>' : '<p class="mlab-note">Tip: hover over anything in the scene to see what it is. Click it to act.</p>'}<div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="modalClose">${S.learn ? 'Start the lesson' : 'Begin'}</button></div></div>`;
    if (kind === 'finish') m.innerHTML = `<div class="mlab-dialog" role="dialog" aria-label="Finish"><h3>Finish and grade this run?</h3><p>You can’t add more actions after grading. Steps you have not done score zero.</p><div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="finishYes">Grade my run</button><button type="button" class="mlab-btn ghost" data-act="modalClose">Keep working</button></div></div>`;
    m.hidden = false; m.querySelector('button')?.focus();
  }
  function finish(timeUp) {
    if (!S || S.done) return; S.done = true;
    if (S.pending) { S.pending.say = $('[data-narrate] input')?.value || ''; S.pending = null; }
    if (S.pauseAt) { S.pausedMs += performance.now() - S.pauseAt; S.pauseAt = 0; }
    const secs = now(); stopAll();
    if (ranked) { ranked.onFinish({log: S.log, secs, timeUp}); return; }
    const g = L.grade(S.log);
    saveRun({mode: S.mode, earned: g.earned, pct: g.pct, secs, at: Date.now()});
    const log = S.log.filter(e => e.type !== 'move');
    const row = e => e.type === 'judge' ? `<li class="j"><time>${fmt(e.t)}</time><b>Judge</b> ${esc(e.d.text)}</li>` : `<li class="r1"><time>${fmt(e.t)}</time><b>You</b> ${esc((ACTS[e.type]?.label || e.type) + (e.d?.info ? " · " + e.d.info : ""))}${e.say ? `<q>${esc(e.say)}</q>` : ''}</li>`;
    screen.innerHTML = `<div class="mlab-report">
      <header><span class="eyebrow">${MODES[S.mode].toUpperCase()} RESULT · ${esc(L.event.toUpperCase())} LAB ${esc(L.number)}</span><h2>${esc(L.title)}</h2>${timeUp ? `<p class="mlab-timeup">Time! The ${LIMIT} limit ended the run.</p>` : ''}</header>
      <div class="mlab-result"><div class="ring" style="--p:${g.pct * 100}"><b>${Math.round(g.pct * 100)}%</b><small>${g.earned} / ${TOTAL}</small></div>
        <div><h3>${g.pass ? 'Mastery met' : 'Below mastery'}</h3><p>${g.pass ? 'You cleared the 70% mastery line HOSA uses for recognition.' : `You need ${(TOTAL * MASTERY).toFixed(1)} points (70%) for recognition. Review the missed steps below.`}${S.learn ? ' Next, try Practice mode without the coach.' : ''}</p><p class="mlab-note">Time used: ${fmt(secs)}${S.learn ? '' : ' of ' + LIMIT} · ${log.filter(e => e.say).length} narrated actions</p></div></div>
      ${g.sheets.map(sh => `<section class="mlab-rsheet"><header><b>${esc(sh.title)}</b><small>${esc(sh.who || '')}</small><span class="${sh.mastery ? 'ok' : 'no'}">${sh.earned} / ${sh.possible}</span></header>
        <table><thead><tr><th>#</th><th>Task</th><th>Possible</th><th>Awarded</th></tr></thead><tbody>${sh.items.map(it => `<tr class="${it.earned ? 'ok' : 'miss'}"><td>${esc(it.n)}</td><td>${esc(it.text)}${it.note ? `<small>${esc(it.note)}</small>` : ''}</td><td>${it.pts}</td><td>${it.earned}</td></tr>`).join('')}</tbody></table></section>`).join('')}
      <details class="mlab-rlog"><summary>Full action log (${log.length})</summary><ol class="mlab-log">${log.map(row).join('')}</ol></details>
      <div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="again">Run the lab again</button></div></div>`;
    screen.scrollIntoView({block: 'start', behavior: 'smooth'});
  }
  function stopAll() { clearInterval(tickId); tickId = 0; for (const id of timers) clearTimeout(id); timers.clear(); }

  // ---------- events ----------
  function onClick(e) {
    const hot = e.target.closest('[data-hot]');
    if (hot && el.contains(hot)) { e.preventDefault(); return openMenu(hot.dataset.hot, e.clientX, e.clientY); }
    const t = e.target.closest('[data-act],[data-tool],[data-pset],[data-tog],[data-q],[data-ord]');
    if (S?.menu && !e.target.closest('[data-menu]')) closeMenu();
    if (!t || !el.contains(t)) return;
    if (t.dataset.tool) return useTool(t.dataset.tool);
    const P = S?.panel;
    if (P && (t.dataset.pset || t.dataset.tog || t.dataset.q || t.dataset.ord)) {
      if (S.pending) return hint('Log your narration first.', 'warn');
      if (t.dataset.pset) { P.ans[t.dataset.pset] = t.dataset.v; if (single(ACTS[P.id])) return submitPanel(); return renderPanel(); }
      if (t.dataset.tog) { const a = P.ans[t.dataset.tog], v = t.dataset.v; a.includes(v) ? a.splice(a.indexOf(v), 1) : a.push(v); return renderPanel(); }
      if (t.dataset.q) { P.ans[t.dataset.q][+t.dataset.i] = t.dataset.v; return renderPanel(); }
      if (t.dataset.ord) { P.ans[t.dataset.ord].push(t.dataset.v); return renderPanel(); }
    }
    const a = t.dataset.act;
    switch (a) {
      case 'start': if (chosenMode) start(chosenMode); break;
      case 'again': showIntro(); break;
      case 'closeMenu': closeMenu(); break;
      case 'side': S.side = t.dataset.v; updateSide(); break;
      case 'scenario': openModal('scenario'); break;
      case 'finish': openModal('finish'); break;
      case 'finishYes': $('[data-modal]').hidden = true; finish(false); break;
      case 'modalClose': $('[data-modal]').hidden = true; if (S.learn) flashTarget(); break;
      case 'closePanel': S.panel = null; renderPanel(); updateScene(); break;
      case 'panelDone': if (P && !S.pending) submitPanel(); break;
      case 'ordUndo': if (P) { P.ans[t.dataset.k].pop(); renderPanel(); } break;
      case 'skipNarr': closeNarration(''); break;
      case 'useWords': { const st = step(), inp = $('[data-narrate] input'); if (st?.say && inp) { inp.value = st.say; inp.focus(); } break; }
      case 'showMe': flashTarget(); break;
    }
  }
  function onSubmit(e) {
    if (!e.target.matches('[data-narrate]')) return; e.preventDefault();
    const text = e.target.querySelector('input').value;
    if (!text.trim()) return hint('Type what you say or do, or press Skip.', 'warn');
    closeNarration(text);
  }
  function onInput(e) {
    const P = S?.panel; if (!P) return;
    const k = e.target.dataset.num || e.target.dataset.txt; if (!k) return;
    P.ans[k] = e.target.value;
    const btn = $('[data-act="panelDone"]'); if (btn) btn.disabled = !ACTS[P.id].panel.every(p => answered(p, P.ans[p.k]));
  }
  function onChange(e) {
    if (e.target.name === 'mlab-mode') { chosenMode = e.target.value; const b = $('[data-act="start"]'); b.disabled = false; b.textContent = `Start ${MODES[chosenMode].toLowerCase()} mode`; }
  }
  function onOver(e) { if (e.pointerType === 'touch') return; const hot = e.target.closest?.('[data-hot]'); if (hot && el.contains(hot)) showTip(hot); }
  function onOut(e) { const hot = e.target.closest?.('[data-hot]'); if (hot && !hot.contains(e.relatedTarget)) hideTip(); }
  function onKey(e) {
    if (!S || S.done || !$('.mlab-shell')) return;
    if (e.key === 'Escape') { if (S.menu) return closeMenu(); if (S.panel && !S.pending) { S.panel = null; renderPanel(); } }
  }

  el.addEventListener('click', onClick); el.addEventListener('submit', onSubmit); el.addEventListener('input', onInput); el.addEventListener('change', onChange);
  el.addEventListener('pointerover', onOver); el.addEventListener('pointerout', onOut);
  document.addEventListener('keydown', onKey);
  if (ranked) { ranked.getRun = () => ({log: S ? S.log : []}); start('graded'); } else showIntro();
  return () => { disposed = true; stopAll(); fitObs?.disconnect(); document.removeEventListener('keydown', onKey); };
}

export {rightAnswer};
