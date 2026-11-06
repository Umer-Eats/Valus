// Dental Science mock lab 01: scenario, rubric, and grading.
// Rubric items follow the HOSA 2026-27 Dental Science rating sheets for
// Skill VIII (PPE donning & doffing), Skill IV (surface barriers) and
// Skill III (seat, prepare and dismiss patient). The sheets are combined into
// one visit, so a shared step (like hand hygiene) only has to be done once.
// Grading is pure: it reads the action log the lab records and returns points per item.

export const DENTAL = {
  id: 'dental-01',
  event: 'Dental Science',
  number: '01',
  title: 'Six-Month Checkup',
  skills: ['Skill VIII · PPE: Donning & Doffing', 'Skill IV · Placing & Removing Surface Barriers', 'Skill III · Seat, Prepare & Dismiss Patient'],
  limitSec: 22 * 60,
  startClock: {h: 9, m: 0},
  scenario: [
    'It is 9:00 AM at Lakeview Family Dental. You are the dental assistant for Dr. Okafor. Operatory 2 has already been cleaned and disinfected.',
    'First, place surface barriers on the operatory. Then seat and prepare your patient for a periodic oral evaluation. Put on full PPE before treatment begins.',
    'Patient: Mrs. Elena Ruiz, 64, is here for her six-month checkup. She carries a handbag.',
    'When the judge says treatment is complete, dismiss Mrs. Ruiz, remove your PPE, and finish her records. After she leaves, remove the surface barriers. This state treats used barriers as regular waste.'
  ],
  patient: {name: 'Mrs. Elena Ruiz', age: '64 · female', visit: 'Periodic oral evaluation (six-month checkup)'}
};

const RX = {
  clean: /clean|disinfect|prepar|ready|wiped|sanitiz/i,
  secure: /secure|tug|check|tight|snug|won'?t (come|slip|fall)|in place|stay/i,
  name: /my name|\bi'?m\b|\bi am\b|this is/i,
  question: /question|concern|\?|anything|worr|ask/i,
  chain: /chain|clip|clamp/i,
  napkin: /napkin|bib|drape/i,
  inform: /chair|back|lower|recline|tilt|move|going to/i,
  warn: /wait|stay|remain|don'?t (get|stand|move)|do not (get|stand|move)|until|stops?/i,
  record: /record|chart|note|document|enter|log/i,
  postop: /brush|floss|next|appointment|call|six|\b6\b|month|instruction|sensitiv|rinse|eat|drink/i,
  items: /item|purse|bag|handbag|belong|glasses|things/i,
  office: /office|front|desk|check ?out|business|reception/i,
  review: /review|check|ready|organiz|set|prepared/i,
  light: /light/i,
  barrier: /barrier|cover|sleeve|plastic|wrap/i,
  hygiene: /wash|rub|sanitiz|hygiene|clean (my )?hands|soap/i,
  disinfect: /disinfect|clean|wipe/i
};
export const DENTAL_PATTERNS = RX;

const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const QUIET = new Set(['move']);
const HYGIENE_OK = new Set(['wash', 'rub']);

function tools(log) {
  const all = (type, f = () => true) => log.filter(e => (!type || e.type === type) && f(e));
  const first = (type, f) => all(type, f)[0];
  const last = (type, f) => all(type, f).at(-1);
  const judge = key => log.find(e => e.type === 'judge' && e.d?.key === key);
  return {all, first, last, judge, log};
}

// Check helpers return true when earned, or a short reason when not.
const need = (e, what) => e ? true : `Not performed: ${what}.`;
const voice = (e, re, hint) => !e ? 'Not performed.' : re.test(e.say || '') ? true : `Done, but your narration did not mention ${hint}.`;
const both = (...rs) => rs.find(r => r !== true) ?? true;
const at = e => e?.i ?? Infinity;
const okHygiene = e => !!e && HYGIENE_OK.has(e.d.method);
// Hand hygiene somewhere in (after, before), using an approved method.
const hygieneBetween = (q, after, before, what) => {
  const e = q.last('hygiene', x => x.i > after && x.i < before);
  if (!e) return `No hand hygiene ${what}.`;
  return okHygiene(e) ? true : 'Rinsing with water alone is not hand hygiene. Wash with soap or use alcohol-based hand rub.';
};

// The PPE put on for the patient: first exam-glove donning and the gown, mask and eyewear before it.
const patientGloves = q => q.first('gloves', e => e.d.kind === 'exam');
const treatAt = q => at(q.judge('treatment'));
const patientDoff = q => q.first('doff', e => e.i > treatAt(q));
const removeAt = q => at(q.judge('remove'));
const barrierRemoval = q => q.first('removeBarriers', e => e.i > removeAt(q));
const finalDoff = q => { const r = barrierRemoval(q); return r ? q.first('doff', e => e.i > r.i) : null; };

const donItem = (key, idx, text) => ({check: q => { const e = q.first(key, x => x.i < at(patientGloves(q)) || !patientGloves(q)); if (!e) return `The ${key === 'eyewear' ? 'protective eyewear was' : key + ' was'} never put on.`; return e.d.ok[idx] ? true : 'Incorrect choice for this step.'; }, text});
const doffItem = (part, idx, text) => ({check: q => { const e = patientDoff(q); if (!e) return 'PPE was not removed after treatment.'; if (!e.d.seq.includes(part)) return `The ${part} was never removed.`; return e.d[part]?.[idx] ? true : 'Incorrect choice for this step.'; }, text});

const VIII = [
  {n: '1', text: 'Washed hands or used alcohol-based hand rub for hand hygiene.', check: q => { const g = q.first('gown'); if (!g) return 'The gown was never put on.'; return hygieneBetween(q, -1, g.i, 'before putting on the gown'); }},
  {n: '2a', ...donItem('gown', 0, 'Gown: fully covered torso from neck to knees, arms to end of wrists, and wrapped around back.')},
  {n: '2b', ...donItem('gown', 1, 'Gown: fastened in back of neck and waist.')},
  {n: '3a', ...donItem('mask', 0, 'Mask: secured ties or elastic bands at middle of head and neck or around ears.')},
  {n: '3b', ...donItem('mask', 1, 'Mask: fitted flexible band to the bridge of the nose.')},
  {n: '3c', ...donItem('mask', 2, 'Mask: fitted snug to the face and below the chin.')},
  {n: '4a', ...donItem('eyewear', 0, 'Eyewear: placed over the face and eyes.')},
  {n: '4b', text: 'Eyewear: adjusted over the mask.', check: q => { const e = q.first('eyewear'), m = q.first('mask'); if (!e) return 'Protective eyewear was never put on.'; if (!m || m.i > e.i) return 'Put the mask on before the eyewear so the eyewear sits over it.'; return e.d.ok[1] ? true : 'Incorrect choice for this step.'; }},
  {n: '5', text: 'Washed hands or used alcohol-based hand rub for hand hygiene.', check: q => { const g = patientGloves(q), e = q.first('eyewear'); if (!g) return 'Exam gloves were never put on.'; return hygieneBetween(q, e ? e.i : -1, g.i, 'between the eyewear and the gloves'); }},
  {n: '6a', text: 'Donning gloves: gloved hands.', check: q => need(patientGloves(q), 'put on exam gloves')},
  {n: '6b', text: 'Made sure the gloves extended over the cuff of the gown.', check: q => { const g = patientGloves(q); if (!g) return 'Exam gloves were never put on.'; if (!q.first('gown', e => e.i < g.i)) return 'Gloves went on before the gown.'; return g.d.ok[0] ? true : 'The glove cuff must go over the gown cuff.'; }},
  {n: '7a', text: 'Removing gloves: using a gloved hand, grasped the palm area of the other gloved hand and peeled off the first glove.', check: q => { const e = patientDoff(q); if (!e) return 'PPE was not removed after treatment.'; if (e.d.seq[0] !== 'gloves') return 'Gloves must come off first (they are the most contaminated).'; return e.d.gloves?.[0] ? true : 'Incorrect choice for this step.'; }},
  {n: '7b', ...doffItem('gloves', 1, 'Held the removed glove in the gloved hand.')},
  {n: '7c', ...doffItem('gloves', 2, 'Slid the fingers of the ungloved hand under the remaining glove at the wrist.')},
  {n: '7d', ...doffItem('gloves', 3, 'Pulled downward to remove the glove, turning it inside out.')},
  {n: '7e', ...doffItem('gloves', 4, 'Disposed of gloves in the waste container.')},
  {n: '8a', ...doffItem('eyewear', 0, 'Removing eyewear: removed from the back, touching only the ear rests.')},
  {n: '8b', ...doffItem('eyewear', 1, 'Placed the eyewear on a disposable towel until it can be cleaned and disinfected.')},
  {n: '9a', ...doffItem('mask', 0, 'Removing mask: slid fingers under the elastic strap in front of the ears, or untied, to remove.')},
  {n: '9b', ...doffItem('mask', 1, 'Discarded the mask in the waste receptacle.')},
  {n: '10a', ...doffItem('gown', 0, 'Removing gown: unfastened gown ties without letting the sleeves touch the body.')},
  {n: '10b', ...doffItem('gown', 1, 'Pulled the gown away from the neck and shoulders, touching only the inside of the gown.')},
  {n: '10c', ...doffItem('gown', 2, 'Turned the gown inside out and folded it into a bundle.')},
  {n: '10d', ...doffItem('gown', 3, 'Discarded the gown in the waste container.')},
  {n: '11', text: 'Washed hands or used alcohol-based hand rub for hand hygiene.', check: q => { const d = patientDoff(q); if (!d) return 'PPE was not removed after treatment.'; return hygieneBetween(q, d.i, Infinity, 'after removing PPE'); }}
].map(it => ({...it, pts: 2}));

const IV = [
  {n: '1', text: 'Washed hands or used alcohol-based hand rub for hand hygiene.', check: q => { const p = q.first('placeBarriers'); if (!p) return 'Barriers were never placed.'; return hygieneBetween(q, -1, p.i, 'before placing barriers'); }},
  {n: '2', text: 'Selected appropriate surface barriers to be placed over the clean surface.', check: q => { const p = q.first('placeBarriers'); if (!p) return 'Barriers were never placed.'; return p.d.wrong.length ? `Wrong barrier for: ${p.d.wrong.join(', ')}.` : true; }},
  {n: '3', text: 'Placed each barrier over the entire surface to be protected.', check: q => { const p = q.first('placeBarriers'); if (!p) return 'Barriers were never placed.'; return p.d.full ? true : 'Each barrier must cover the entire surface, not only the part you expect to touch.'; }},
  {n: '4', text: 'Checked each barrier is secure and will not come off.', check: q => { const p = q.first('placeBarriers'); return voice(p && q.first('checkBarriers', e => e.i > p.i), RX.secure, 'checking the barriers are secure'); }},
  {n: '5', text: 'Washed hands or used alcohol-based hand rub for hand hygiene.', check: q => { const u = q.first('utilityGloves', e => e.i > treatAt(q)); if (!u) return 'Utility gloves were never put on to remove the barriers.'; const d = q.last('doff', e => e.i < u.i); return hygieneBetween(q, d ? d.i : treatAt(q), u.i, 'before putting on utility gloves'); }},
  {n: '6', text: 'Donned PPE and utility gloves.', check: q => { const u = q.first('utilityGloves', e => e.i > treatAt(q)); if (!u) return 'Utility gloves were never put on to remove the barriers.'; const miss = ['gown', 'mask', 'eyewear'].filter(k => !u.d.wearing[k]); return miss.length ? `Missing PPE under the utility gloves: ${miss.join(', ')}.` : true; }},
  {n: '7', text: 'Carefully removed each cover without touching the underlying surface or the contaminated outer surface (or recognized and verbalized the need to disinfect).', check: q => { const r = barrierRemoval(q); if (!r) return 'Barriers were never removed.'; if (!r.d.utility) return 'Barriers must be removed while wearing utility gloves.'; if (r.d.careful) return true; return r.d.recognized ? true : 'You touched the surface underneath and did not say it needs disinfection.'; }},
  {n: '8', text: 'Discarded used barriers in the regular waste trash (unless the scenario names regulated waste).', check: q => { const r = barrierRemoval(q); const e = r && q.first('discardBarriers', x => x.i > r.i); if (!e) return 'Used barriers were not discarded.'; return e.d.bin === 'regular' ? true : 'This scenario treats used barriers as regular waste.'; }},
  {n: '9', text: 'Washed, disinfected, and dried utility gloves.', check: q => { const r = barrierRemoval(q); const e = r && q.first('utilityCare', x => x.i > r.i); if (!e) return 'Utility gloves were not cleaned.'; const m = ['wash', 'disinfect', 'dry'].filter(k => !e.d[k]); return m.length ? `Missing: ${m.join(', ')}.` : true; }},
  {n: '10', text: 'Properly removed and disposed of all PPE.', check: q => { const e = finalDoff(q); if (!e) return 'PPE was not removed after the barriers came off.'; if (!e.d.complete) return 'Some PPE was still on.'; return e.d.clean ? true : 'One or more PPE pieces were removed with the wrong technique.'; }},
  {n: '11', text: 'Washed hands or used alcohol-based hand rub for hand hygiene.', check: q => { const e = finalDoff(q); if (!e) return 'PPE was not removed after the barriers came off.'; return hygieneBetween(q, e.i, Infinity, 'after removing PPE'); }}
].map(it => ({...it, pts: 2}));

const escortAt = q => at(q.first('escort'));
const commsCheck = q => {
  const ev = q.all(null, e => e.type !== 'judge' && !QUIET.has(e.type));
  const ratio = ev.length ? ev.filter(e => words(e.say) >= 3).length / ev.length : 0;
  if (ratio < .75) return `Only ${Math.round(ratio * 100)}% of actions were narrated (75% needed).`;
  const talk = ['greet', 'questions', 'warn', 'postOp', 'informChair', 'speak'].filter(t => q.first(t)).length;
  return talk >= 3 ? true : 'Talk to the patient more: greet, ask about questions, explain chair moves and give instructions.';
};

const III = [
  {n: '1', pts: 1, text: 'Ensured that the treatment room was properly cleaned and prepared.', check: q => voice(q.first('inspect'), RX.clean, 'that the room is clean or prepared')},
  {n: '2', pts: 2, text: 'Properly positioned the chair and ensured the path was clear for the patient to enter.', check: q => { const e = q.first('prepChair', x => x.i < escortAt(q)); if (!e) return 'The chair was not prepared before the patient came in.'; const m = []; if (!e.d.low) m.push('lower the chair'); if (!e.d.armUp) m.push('raise the armrest'); if (!e.d.path) m.push('clear the foot control and stool from the path'); return m.length ? 'You still needed to ' + m.join(', ') + '.' : true; }},
  {n: '3', pts: 1, text: 'Performed instrument setup and placed materials per scenario.', check: q => { const e = q.first('tray'); if (!e) return 'The instrument tray was never set up.'; if (e.d.missing.length) return `Missing: ${e.d.missing.join(', ')}.`; return e.d.extra.length ? `Not needed for this exam: ${e.d.extra.join(', ')}.` : true; }},
  {n: '4a', pts: 2, text: 'Greeted the patient in a courteous manner.', check: q => { const e = q.first('greet'); if (!e) return 'The patient was never greeted.'; return e.d.courteous ? true : 'Use a courteous greeting with the patient’s name.'; }},
  {n: '4b', pts: 1, text: 'Made eye contact and smiled.', check: q => { const e = q.first('greet'); if (!e) return 'The patient was never greeted.'; return e.d.eye ? true : 'Make eye contact and smile.'; }},
  {n: '4c', pts: 2, text: 'Introduced self.', check: q => voice(q.first('greet'), RX.name, 'your name')},
  {n: '5', pts: 1, text: 'Escorted the patient to the treatment area.', check: q => need(q.first('escort'), 'escort the patient')},
  {n: '6', pts: 1, text: 'Placed the patient’s personal items in a safe place within the treatment room.', check: q => { const e = q.first('items'); if (!e) return 'Her handbag was never put away.'; return e.d.place === 'shelf' ? true : 'Keep personal items in a safe place inside the treatment room, in the patient’s view.'; }},
  {n: '7', pts: 2, text: 'Initiated conversation with the patient and asked if they have any questions about the scheduled treatment.', check: q => voice(q.first('questions'), RX.question, 'asking about questions')},
  {n: '8a', pts: 1, text: 'Instructed the patient to sit on the side of the dental chair, then swing their legs onto the base of the chair.', check: q => { const e = q.first('seat'); return !e ? 'The patient was never seated.' : e.d.side ? true : 'Have her sit on the side of the chair first, then swing her legs on.'; }},
  {n: '8b', pts: 1, text: 'Placed the chair arm into position.', check: q => { const e = q.first('seat'); return !e ? 'The patient was never seated.' : e.d.arm ? true : 'Lower the chair arm back into position after she is seated.'; }},
  {n: '8c', pts: 1, text: 'Instructed the patient to slide up in the chair until the head is even with the top of the headrest.', check: q => { const e = q.first('seat'); return !e ? 'The patient was never seated.' : e.d.slide ? true : 'Her head should be even with the top of the headrest.'; }},
  {n: '9', pts: 1, text: 'Placed the disposable patient napkin over the chest and clamped the corners using a napkin chain.', check: q => { const e = q.first('napkin'); return both(voice(e, RX.napkin, 'the napkin'), voice(e, RX.chain, 'the napkin chain or clips')); }},
  {n: '10a', pts: 1, text: 'Informed the patient before adjusting the chair.', check: q => { const a = q.first('adjust'); if (!a) return 'The chair was never adjusted.'; return voice(q.last('informChair', e => e.i < a.i), RX.inform, 'that you are moving the chair'); }},
  {n: '10b', pts: 1, text: 'Adjusted the chair slowly to the proper position for the procedure.', check: q => { const a = q.first('adjust'); if (!a) return 'The chair was never adjusted.'; if (!a.d.slow) return 'Move the chair slowly.'; return a.d.supine ? true : 'For an oral evaluation the chair goes back to a supine position.'; }},
  {n: '10c', pts: 1, text: 'Positioned the chair to set a 12–14 inch distance between the patient’s face and the operator’s face.', check: q => { const a = q.first('adjust'); if (!a) return 'The chair was never adjusted.'; return a.d.dist >= 12 && a.d.dist <= 14 ? true : `Distance was ${a.d.dist} in (12–14 in needed).`; }},
  {n: '11', pts: 1, text: 'Positioned the operating light over the patient’s chest and turned it on.', check: q => { const e = q.first('light'); if (!e) return 'The operating light was never positioned.'; return e.d.pos === 'chest' ? true : 'Turn the light on over the chest first so it never shines in the patient’s eyes.'; }},
  {n: '12', pts: 1, text: 'Reviewed that all treatment room preparations are organized and set out.', check: q => voice(q.first('review'), RX.review, 'reviewing the setup')},
  {n: '13', pts: 2, text: 'Washed hands or used alcohol-based hand rub for hand hygiene.', check: q => { const g = q.first('gown', e => e.i > escortAt(q)); if (!g) return 'PPE was not put on after the patient was seated.'; return hygieneBetween(q, escortAt(q), g.i, 'before putting on PPE'); }},
  {n: '14', pts: 2, text: 'Put on personal protective equipment.', check: q => { const g = patientGloves(q); if (!g) return 'Exam gloves were never put on.'; const m = ['gown', 'mask', 'eyewear'].filter(k => !q.first(k, e => e.i < g.i)); return m.length ? `Missing before gloves: ${m.join(', ')}.` : true; }},
  {n: '15', pts: 1, text: 'Positioned the dental light out of the patient’s way.', check: q => need(q.first('lightAway', e => e.i > treatAt(q)), 'move the light away after treatment')},
  {n: '16', pts: 2, text: 'Warned the patient not to get out of the chair until it stops moving.', check: q => { const r = q.first('reset', e => e.i > treatAt(q)); const w = q.first('warn', e => e.i > treatAt(q)); if (w && r && w.i > r.i) return 'Warn her before the chair starts moving.'; return voice(w, RX.warn, 'waiting until the chair stops'); }},
  {n: '17', pts: 2, text: 'Used the reset button to lower the chair and return it to the upright position.', check: q => need(q.first('reset', e => e.i > treatAt(q)), 'reset the chair')},
  {n: '18', pts: 2, text: 'Removed the protective drape or bib and placed it in the infectious waste container / biohazard bag.', check: q => { const e = q.first('bib'); if (!e) return 'The patient napkin was never removed.'; return e.d.bin === 'bio' ? true : 'The used napkin goes in the infectious waste (biohazard) container.'; }},
  {n: '19', pts: 2, text: 'Removed personal protective equipment and disposed of it properly.', check: q => { const e = patientDoff(q); if (!e) return 'PPE was not removed after treatment.'; return e.d.complete ? true : 'Some PPE was still on.'; }},
  {n: '20', pts: 2, text: 'Washed hands or used alcohol-based hand rub for hand hygiene.', check: q => { const d = patientDoff(q); if (!d) return 'PPE was not removed after treatment.'; return hygieneBetween(q, d.i, Infinity, 'after removing PPE'); }},
  {n: '21', pts: 2, text: 'Completed patient records.', check: q => voice(q.first('records'), RX.record, 'recording or charting the visit')},
  {n: '22', pts: 2, text: 'Provided any postoperative instructions.', check: q => { const e = q.first('postOp'); if (!e) return 'No instructions were given.'; return words(e.say) >= 5 && RX.postop.test(e.say) ? true : 'Give real instructions (home care, next visit, when to call).'; }},
  {n: '23', pts: 1, text: 'Cleared the path to escort the patient and positioned the armrest to release the patient.', check: q => need(q.first('release'), 'clear the path and raise the armrest')},
  {n: '24', pts: 1, text: 'Assisted the patient from the chair and returned the patient’s personal items.', check: q => voice(q.first('assist'), RX.items, 'returning her handbag or belongings')},
  {n: '25', pts: 1, text: 'Escorted the patient to the business office.', check: q => voice(q.first('escortOffice'), RX.office, 'the business office or front desk')},
  {n: '26', pts: 2, text: 'Used appropriate verbal and nonverbal communication with the patient and other personnel.', check: commsCheck}
];

const sheet = (id, title, who, items) => ({id, title, who, items: items.map(it => ({...it, id: `${id}-${it.n}`}))});
export const SHEETS = [
  sheet('VIII', 'Skill VIII · PPE: Donning & Doffing', 'Before and after treatment', VIII),
  sheet('IV', 'Skill IV · Placing & Removing Surface Barriers', 'Before and after the patient', IV),
  sheet('III', 'Skill III · Seat, Prepare & Dismiss Patient', 'Periodic oral evaluation', III)
];

export const TOTAL = SHEETS.reduce((s, sh) => s + sh.items.reduce((a, i) => a + i.pts, 0), 0);
export const MASTERY = .7;

export function grade(log) {
  const q = tools(log);
  const sheets = SHEETS.map(sh => {
    const items = sh.items.map(it => {
      let res;
      try { res = it.check(q); } catch { res = 'Not performed.'; }
      return {id: it.id, n: it.n, text: it.text, pts: it.pts, earned: res === true ? it.pts : 0, note: res === true ? '' : res};
    });
    const possible = items.reduce((a, i) => a + i.pts, 0), earned = items.reduce((a, i) => a + i.earned, 0);
    return {id: sh.id, title: sh.title, who: sh.who, items, possible, earned, mastery: earned >= possible * MASTERY};
  });
  const earned = sheets.reduce((a, s) => a + s.earned, 0);
  return {sheets, earned, possible: TOTAL, pct: earned / TOTAL, pass: earned >= TOTAL * MASTERY};
}

// Barrier choices for each surface. The first option is the right one.
export const SURFACES = [
  ['headrest', 'Headrest', ['Headrest cover (plastic bag-style)', 'Paper patient napkin', 'Leave uncovered (it was disinfected)']],
  ['light', 'Light handles', ['Plastic light-handle sleeves', 'Aluminum foil pressed on', 'Leave uncovered']],
  ['controls', 'Chair control buttons', ['Adhesive plastic wrap', 'Paper towel', 'Leave uncovered']],
  ['syringe', 'Air/water syringe', ['Plastic syringe sleeve', 'Gauze wrapped around it', 'Leave uncovered']],
  ['hoses', 'HVE and saliva ejector hoses', ['Plastic tubing sleeves', 'Tape over the ends', 'Leave uncovered']],
  ['tray', 'Bracket tray', ['Plastic tray cover', 'Paper towel', 'Leave uncovered']]
];

// Instruments for a periodic oral evaluation. The rest are distractors.
export const TRAY_NEED = ['mirror', 'explorer', 'pliers', 'probe', 'awtip', 'saliva', 'gauze'];
export const TRAY_ITEMS = [
  ['mirror', 'Mouth mirror'], ['explorer', 'Explorer'], ['pliers', 'Cotton pliers'], ['probe', 'Periodontal probe'],
  ['awtip', 'Air/water syringe tip'], ['saliva', 'Saliva ejector'], ['gauze', '2×2 gauze'],
  ['forceps', 'Extraction forceps'], ['carrier', 'Amalgam carrier'], ['syringeA', 'Anesthetic syringe'], ['scalpel', 'Scalpel'], ['matrix', 'Matrix band']
];
