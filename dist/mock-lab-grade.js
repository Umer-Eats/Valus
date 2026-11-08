// Shared core for spec-driven mock procedure labs (every event except CPR/First Aid and Dental Science).
// A lab spec lists stations, actions, the Learn-mode order and the HOSA rating sheets.
// Everything here is pure, so the server grades a run with the same code the browser uses.

export const MASTERY = .7;
const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;

// Narration patterns used across labs. Specs add their own.
export const RX = {
  hygiene: /wash|rub|sanitiz|hygiene|soap|clean (my )?hands/i,
  name: /my name|\bi'?m\b|\bi am\b|this is/i,
  identify: /name|birth|dob|date of birth|wristband|id band|\bid\b|confirm|verify/i,
  explain: /going to|will|explain|procedure|need to|today|let me|i'?ll/i,
  privacy: /curtain|privacy|door|close|screen|cover/i,
  record: /record|chart|document|log|note|enter|write/i,
  report: /report|tell|notify|nurse|supervisor|doctor|physician|judge/i,
  comfort: /comfort|okay|ok\b|how (do|does|are)|feel|pillow|position|call (light|button)|anything else/i,
  question: /question|\?|any(thing)? else|concern|ask/i,
  safety: /call (light|button)|bed (low|down|lowest)|rails?|brakes?|lock|safe/i,
  dispose: /dispos|discard|throw|trash|waste|biohazard|sharps|bag|bin/i
};

// ---------- panel parts ----------
// Each part of an action's panel turns the student's answer into {ok: [bool...]} plus details.
export function partResult(p, ans) {
  if (p.q) { const a = ans || []; return {ok: p.q.map((_, i) => a[i] === '1')}; }
  if (p.choose) return {v: ans ?? null, ok: [p.right.includes(ans)]};
  if (p.pick) {
    const sel = [...(ans || [])], name = k => p.pick.find(i => i[0] === k)?.[1] || k;
    const missing = p.need.filter(k => !sel.includes(k)).map(name), extra = sel.filter(k => !p.need.includes(k)).map(name);
    return {sel, missing, extra, ok: [!missing.length && !extra.length]};
  }
  if (p.num) { const v = ans === '' || ans == null ? null : Number(ans); return {v, ok: [v != null && v >= p.num.ok[0] && v <= p.num.ok[1]]}; }
  if (p.order) { const seq = [...(ans || [])]; return {seq, ok: [seq.length === p.right.length && seq.every((k, i) => k === p.right[i])]}; }
  if (p.text) { const v = String(ans || ''); return {v, ok: (p.need || []).map(([re]) => re.test(v))}; }
  return {ok: []};
}
// The answer a perfect run gives for a part (used by Learn hints and tests).
export function rightAnswer(p) {
  if (p.q) return p.q.map(() => '1');
  if (p.choose) return p.right[0];
  if (p.pick) return p.need.slice();
  if (p.num) return String(p.num.ans ?? (p.num.ok[0] + p.num.ok[1]) / 2);
  if (p.order) return p.right.slice();
  if (p.text) return p.text.model || '';
  return null;
}
// Why a part is wrong, in words.
export function partMiss(p, r) {
  if (r.ok.every(Boolean)) return '';
  if (p.pick) return r.missing.length ? `Missing: ${r.missing.join(', ')}.` : `Not needed: ${r.extra.join(', ')}.`;
  if (p.num) return r.v == null ? 'No value was entered.' : `You entered ${r.v}${p.num.unit ? ' ' + p.num.unit : ''}; the correct value is ${p.num.say || p.num.ok.join('–')}.`;
  if (p.order) return p.fix || 'The order was not correct.';
  if (p.text) return `Your entry did not include ${(p.need || []).filter(([re]) => !re.test(r.v)).map(n => n[1]).join(' and ')}.`;
  return p.fix || 'Incorrect choice for this step.';
}
export function actData(act, answers) {
  const d = {};
  for (const p of act.panel || []) d[p.k] = partResult(p, answers?.[p.k]);
  d.good = (act.panel || []).every(p => d[p.k].ok.every(Boolean));
  return d;
}

// ---------- log queries ----------
const base = ref => String(ref).split(/[#>$]/)[0];
function tools(log) {
  const acts = log.filter(e => e.type !== 'judge' && e.type !== 'move');
  const of = type => acts.filter(e => e.type === type);
  // 'a' first a · 'a$' last a · 'a#2' second a · 'a>b' first a after the first b · '^' start · '$' end
  const find = ref => {
    if (ref == null || ref === '$') return null;
    if (ref === '^') return null;
    const s = String(ref), cut = s.indexOf('>');
    const head = cut < 0 ? s : s.slice(0, cut), after = cut < 0 ? null : s.slice(cut + 1);
    const from = after ? pos(after) : -1;
    if (from === null) return null;
    const m = /^([\w-]+)(\$|#(\d+))?$/.exec(head); if (!m) return null;
    const list = of(m[1]).filter(e => e.i > from);
    if (m[2] === '$') return list.at(-1) || null;
    return list[(m[3] ? +m[3] : 1) - 1] || null;
  };
  const pos = (ref, dflt = -1) => {
    if (ref == null) return dflt;
    if (ref === '^') return -1;
    if (ref === '$') return Infinity;
    const e = find(ref); return e ? e.i : null;
  };
  const judge = key => log.find(e => e.type === 'judge' && e.d?.key === key);
  return {log, acts, of, find, pos, judge};
}

// ---------- rating sheet items ----------
// Narration requirements of an item: say is one [regex, hint]; says is a list of them.
const saysOf = it => [...(it.say ? [it.say] : []), ...(it.says || [])];
// A regex matching any whole number from lo to hi (for counts spoken within a tolerance).
export const inRange = (lo, hi) => new RegExp(String.raw`(^|[^\d.])(` + Array.from({length: hi - lo + 1}, (_, i) => lo + i).join('|') + String.raw`)(?![\d.]\d|\d)`);
const HYG_OK = new Set(['wash', 'rub']);
function hygBetween(q, from, to, what) {
  const a = from == null ? -1 : q.pos(from), b = to == null ? Infinity : q.pos(to, Infinity);
  if (a === null) return `Not performed: ${what || 'the step this hand hygiene follows'}.`;
  if (b === null) return `Not performed: ${what || 'the step this hand hygiene comes before'}.`;
  const e = q.of('hygiene').filter(x => x.i > a && x.i < b).at(-1);
  if (!e) return 'No hand hygiene at this point.';
  return HYG_OK.has(e.d.m?.v) ? true : 'Rinsing with water alone is not hand hygiene. Wash with soap or use alcohol-based hand rub.';
}
function commsCheck(q, spec) {
  const ev = q.acts.filter(e => !spec.acts[e.type]?.quiet);
  const ratio = ev.length ? ev.filter(e => words(e.say) >= 3).length / ev.length : 0;
  if (ratio < .75) return `Only ${Math.round(ratio * 100)}% of actions were narrated (75% needed).`;
  const talk = new Set(q.acts.filter(e => spec.acts[e.type]?.talk).map(e => e.type)).size;
  const need = Math.min(2, Object.values(spec.acts).filter(a => a.talk).length);
  return talk >= need ? true : 'Talk with the patient more: explain what you are doing and check on them.';
}
function precCheck(q, spec) {
  const b = q.acts.find(e => e.d?.breach);
  if (b) return b.d.breach;
  if (q.of('hygiene').some(e => !HYG_OK.has(e.d.m?.v))) return 'Water alone is not hand hygiene.';
  const g = q.acts.filter(e => spec.acts[e.type]?.wear?.gloves !== undefined && e.type !== 'hygiene').at(-1);
  if (g && spec.acts[g.type].wear.gloves) return 'Gloves were still on at the end.';
  if (!q.of('hygiene').length) return 'No hand hygiene was done.';
  return true;
}
function checkItem(it, q, spec) {
  if (it.fn) return it.fn(q, spec);
  if (it.comms) return commsCheck(q, spec);
  if (it.prec) return precCheck(q, spec);
  const out = [];
  if (it.act) {
    const refs = [].concat(it.act);
    const e = refs.map(r => q.find(r)).find(Boolean);
    const label = spec.acts[base(refs[0])]?.label?.toLowerCase() || base(refs[0]);
    if (!e) return it.missing || `Not performed: ${label}.`;
    if (it.after) { const p = q.pos(it.after); if (p === null || e.i < p) return it.order || `Do this after: ${spec.acts[base(it.after)]?.label?.toLowerCase() || it.after}.`; }
    if (it.before) { const p = q.pos(it.before, Infinity); if (p !== null && e.i > p) return it.order || `Do this before: ${spec.acts[base(it.before)]?.label?.toLowerCase() || it.before}.`; }
    if (it.part && it.sel) {
      // Only some of a pick list belongs to this item (equipment shared by combined skills).
      const p = spec.acts[e.type].panel.find(x => x.k === it.part), r = e.d[it.part] || {sel: []};
      const name = k => p.pick.find(i => i[0] === k)?.[1] || k;
      const miss = it.sel.filter(k => !r.sel.includes(k)).map(name), extra = r.sel.filter(k => !p.need.includes(k)).map(name);
      if (miss.length) return `Missing: ${miss.join(', ')}.`;
      if (extra.length) return `Not needed: ${extra.join(', ')}.`;
    } else if (it.part) {
      const act = spec.acts[e.type], p = act.panel.find(x => x.k === it.part), r = e.d[it.part];
      if (!r) return 'Not performed.';
      const ok = it.qi == null ? r.ok.every(Boolean) : !!r.ok[it.qi];
      if (!ok) return it.miss || (it.qi == null ? partMiss(p, r) : (p.fixes?.[it.qi] || p.fix || 'Incorrect choice for this step.'));
    }
    if (it.good && !e.d.good) return it.miss || 'One or more choices in this step were wrong.';
    for (const sy of saysOf(it)) if (!sy[0].test(e.say || '')) return `Done, but your narration did not mention ${sy[1]}.`;
    out.push(true);
  }
  for (const r of it.also || []) if (!q.find(r)) return `Not performed: ${spec.acts[base(r)]?.label?.toLowerCase() || r}.`;
  if (it.hyg) { const r = hygBetween(q, it.hyg[0], it.hyg[1], it.hygWhat); if (r !== true) return r; }
  if (it.gloved) { const e = q.find(it.gloved); if (e?.d?.breach) return e.d.breach; }
  return true;
}

// ---------- building a lab ----------
// Common actions every lab can use. `sink` is where hand hygiene happens; `glovesAt` where gloves are kept.
export function stdActs({sink = 'sink', gloves: glovesAt = sink, waste = null} = {}) {
  return {
    hygiene: {at: sink, label: 'Hand hygiene', sub: 'Wash or hand rub', repeat: true, bare: true, ex: '“Washing my hands with soap and water for at least 20 seconds.”',
      do: 'Click the sink and choose Hand hygiene. Pick soap and water or alcohol-based hand rub.',
      why: 'Hand hygiene comes before and after patient contact and every time gloves come off.', say: 'Using alcohol-based hand rub until my hands are dry.',
      panel: [{k: 'm', label: 'How do you clean your hands?', choose: [['wash', 'Wash with soap and water, then dry with a paper towel'], ['rub', 'Alcohol-based hand rub, rubbed in until dry'], ['rinse', 'Rinse with water only']], right: ['wash', 'rub'], fix: 'Water alone is not hand hygiene. Choose soap and water or hand rub.'}]},
    gloves: {at: glovesAt, label: 'Put on gloves', sub: 'Clean exam gloves', repeat: true, wear: {gloves: 'exam'}, ex: '“Putting on clean gloves.”',
      gate: S => S.wear.gloves ? 'You already have gloves on.' : null, do: 'Choose Put on gloves.', why: 'Gloves protect you and the patient whenever you may touch body fluids, broken skin or contaminated items.', say: 'Putting on clean gloves.'},
    glovesOff: {at: waste || glovesAt, label: 'Remove gloves', sub: 'Inside out, into the trash', repeat: true, wear: {gloves: null}, ex: '“Removing my gloves inside out and discarding them.”',
      gate: S => S.wear.gloves ? null : 'You are not wearing gloves.', why: 'Gloves come off inside out so the dirty outside never touches your skin. Hand hygiene follows right away.', say: 'Removing my gloves inside out and throwing them away.',
      panel: [{k: 'g', label: 'How do you take them off?', choose: [['peel', 'Pinch one glove at the palm and peel it off inside out, then slide bare fingers under the other cuff and peel it off over the first'], ['pull', 'Pull each glove off by the fingertips'], ['snap', 'Roll them off together and shake out your hands']], right: ['peel'], fix: 'Peel gloves off inside out, glove-to-glove then skin-to-skin.'}]}
  };
}

export function lab(spec) {
  const acts = spec.acts;
  for (const [id, a] of Object.entries(acts)) { a.id = id; a.panel = a.panel || null; }
  const sheets = spec.sheets.map(sh => ({...sh, items: sh.items.map(it => ({...it, id: `${sh.id}-${it.n}`}))}));
  const total = sheets.reduce((s, sh) => s + sh.items.reduce((a, i) => a + i.pts, 0), 0);
  // Learn steps follow the flow; narration requirements come from the rating sheet items for that action.
  const learn = spec.flow.map(f => {
    const st = typeof f === 'string' ? {act: f} : {...f};
    const a = acts[st.act]; if (!a) throw new Error(`${spec.id}: flow names unknown action ${st.act}`);
    const need = [];
    for (const sh of sheets) for (const it of sh.items) if ([].concat(it.act || []).some(r => base(r) === st.act)) for (const sy of saysOf(it)) if (!need.some(n => n[1] === sy[1])) need.push(sy);
    const station = spec.stations[a.at];
    return {act: st.act, phase: st.phase || a.phase || '', title: st.title || a.title || a.label,
      do: st.do || a.do || `Click the ${station?.name?.toLowerCase() || 'station'} and choose ${a.label}.`,
      why: st.why || a.why || '', say: st.say ?? a.say ?? '', need: st.need || need};
  });
  const out = {...spec, sheets, total, learn, possible: total};
  out.grade = log => grade(out, log);
  return out;
}

export function grade(spec, log) {
  const q = tools(Array.isArray(log) ? log : []);
  const sheets = spec.sheets.map(sh => {
    const items = sh.items.map(it => {
      let res; try { res = checkItem(it, q, spec); } catch { res = 'Not performed.'; }
      return {id: it.id, n: it.n, text: it.text, pts: it.pts, earned: res === true ? it.pts : 0, note: res === true ? '' : res};
    });
    const possible = items.reduce((a, i) => a + i.pts, 0), earned = items.reduce((a, i) => a + i.earned, 0);
    return {id: sh.id, title: sh.title, who: sh.who, items, possible, earned, mastery: earned >= possible * MASTERY};
  });
  const earned = sheets.reduce((a, s) => a + s.earned, 0);
  return {sheets, earned, possible: spec.total, pct: spec.total ? earned / spec.total : 0, pass: earned >= spec.total * MASTERY};
}

// What wearing state an action needs and changes. A gloved action done bare-handed is a breach of standard precautions.
export function applyWear(a, W, d) {
  if (a.gloved && !W.gloves) d.breach = `${a.label}: done without gloves.`;
  if (a.wear) Object.assign(W, a.wear);
}

// A run that follows the Learn flow with every choice right and the coach's words (tests use it).
export function perfectLog(spec) {
  const log = []; let t = 0;
  const fired = new Set(), W = {};
  for (const st of spec.learn) {
    const a = spec.acts[st.act];
    const answers = Object.fromEntries((a.panel || []).map(p => [p.k, rightAnswer(p)]));
    const d = actData(a, answers); applyWear(a, W, d);
    log.push({i: log.length, t: (t += 3), r: 1, type: st.act, d, say: a.quiet ? '' : st.say});
    if (a.judge && !fired.has(a.judge.key)) { fired.add(a.judge.key); log.push({i: log.length, t: (t += 1), r: 0, type: 'judge', d: {key: a.judge.key, text: a.judge.text}, say: ''}); }
  }
  return log;
}
