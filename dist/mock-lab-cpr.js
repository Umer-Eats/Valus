// CPR/First Aid mock lab 01: scenario, rubric, and grading.
// Rubric items follow the HOSA 2026-27 rating sheets for Skill II-A, II-B and IV.
// Grading is pure: it reads the action log the lab records and returns points per item.

export const LAB = {
  id: 'cpr-fa-01',
  event: 'CPR/First Aid',
  number: '01',
  title: 'Finish Line Collapse',
  skills: ['Skill II-A · Adult BLS with AED (Rescuer 1 initiates)', 'Skill II-B · Adult BLS with AED (Rescuer 2 assists)', 'Skill IV · Severe Bleeding and Shock'],
  limitSec: 12 * 60,
  startClock: { h: 16, m: 10 },
  phone: '(555) 014-2290',
  location: 'Lakeside Community Park, 200 Shoreline Drive (5K finish line)',
  scenario: [
    'It is 4:10 PM at the Lakeside Community Park 5K. You and your partner are healthcare providers volunteering in the medical tent. You have a first aid kit and a cell phone. A public AED hangs in the registration tent about 50 yards away.',
    'Patient A: Marcus Hale, a 58-year-old runner, collapses face-up on the grass just past the finish arch. He wears a heavy running jacket.',
    'Patient B: Jordan Reyes, a 16-year-old volunteer, slipped at the hydration table and knelt on a broken glass water jug. She has a deep cut on her right thigh, about 6 inches above the knee, and it is bleeding heavily. Broken glass is still on the ground.',
    'Rescuer 1 starts Adult BLS on Patient A. Rescuer 2 cares for Patient B first, calls EMS, changes gloves, then brings the AED and assists Rescuer 1.'
  ],
  patients: {
    A: { name: 'Marcus Hale', age: '58 · male', where: 'Grass past the finish arch' },
    B: { name: 'Jordan Reyes', age: '16 · female', where: 'Beside the hydration table' }
  }
};

const RX = {
  safe: /safe|hazard|danger|glass|clear of/i,
  resource: /\b(aha|arc)\b|american heart|red cross/i,
  okay: /are you (ok|okay|alright|all right)/i,
  ems: /911|9-1-1|\bems\b|emergency|ambulance/i,
  aed: /\baed\b|defib/i,
  side: /side|beside|kneel/i,
  clothing: /cloth|jacket|shirt|expos|bare|unzip|zip|chest/i,
  surface: /firm|flat|hard|ground|surface/i,
  lower: /lower half|breast ?bone|sternum|center of (the |his )?chest|middle of (the |his )?chest/i,
  stack: /top|other hand|stack|interlac/i,
  posture: /straight|lock|shoulder/i,
  count: /\b(1|one)\b[\s\S]*\b(2|two)\b[\s\S]*\b(3|three)\b|count/i,
  nose: /nose|bridge/i,
  seal: /seal|tilt|jaw|edge/i,
  breath: /breath|ventilat|blow|squeez/i,
  clear: /clear|stand back|don'?t touch|do not touch|everyone (off|away|back)|hands off/i,
  head: /head/i,
  power: /power|turn(ed|ing)? (it )?on|switch(ed)? on|open/i,
  pads: /pad/i,
  ec: /e-?c|clamp|tilt|jaw|mask/i,
  sw: /switch|swap|change (roles|positions|places)|trade/i,
  name: /my name|\bi'?m\b|\bi am\b|this is/i,
  permission: /help|permission|okay if|ok if|may i|can i|consent|let me/i,
  happened: /what happened|how did|bleed|cut|wound|injur/i,
  medid: /medical|bracelet|necklace|jewel|\bid\b|tag|alert/i,
  respond: /coming|on it|got it|i'?ll|i will|calling|ok|okay|yes|on my way/i,
  dressing: /gauze|dressing/i,
  pressure: /pressure|press|push/i,
  above: /above|inch|proximal|tourniquet/i,
  pull: /pull|tight|strap|cinch|free end/i,
  twist: /twist|windlass|turn|tighten/i,
  secure: /secure|clip|lock|fasten/i,
  time: /\b\d{1,2}:\d{2}\b|\b\d{1,2}\s?(am|pm|p\.m\.|a\.m\.)|o'?clock/i,
  back: /back|lie|lay|lying|supine|down/i,
  warm: /cover|blanket|warm/i,
  gloves: /glove/i,
  hangup: /hang|hung/i,
  bio: /biohazard|bag|dispos|bin/i,
  rub: /rub|sanitiz|alcohol|hygiene|clean (my )?hands/i,
  patch: /patch|medication/i
};
export const PATTERNS = RX;

// Keyword groups for each EMS handoff report. Four or more groups earn the 4 points.
export const REPORT_GROUPS = {
  A: [
    ['age or sex', /58|fifty|male|\bman\b|marcus/i],
    ['how he was found', /collaps|unrespons|cardiac arrest|found down/i],
    ['breathing and pulse', /no pulse|pulseless|not breathing|no breathing|apne/i],
    ['CPR given', /cpr|compression/i],
    ['AED and shocks', /\baed\b|shock|defib/i],
    ['timeline or medication patch', /\d+\s*(min|cycle)|\b\d{1,2}:\d{2}\b|patch|nitro/i]
  ],
  B: [
    ['age or sex', /16|sixteen|female|girl|jordan|volunteer/i],
    ['injury and location', /thigh|leg|laceration|cut|glass|wound/i],
    ['direct pressure', /pressure|dressing|gauze/i],
    ['tourniquet', /tourniquet/i],
    ['tourniquet time', /\b\d{1,2}:\d{2}\b|\d{1,2}\s?(pm|am)/i],
    ['shock care or history', /shock|blanket|warm|lying|on (her|the) back|asthma|bracelet/i]
  ]
};
export const reportScore = (patient, text) => REPORT_GROUPS[patient].filter(([, re]) => re.test(text || '')).map(([label]) => label);

const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const between = (v, lo, hi) => typeof v === 'number' && v >= lo && v <= hi;
const QUIET = new Set(['move', 'auto', 'swap', 'stopCpr']);

function tools(log) {
  const all = (r, type, f = () => true) => log.filter(e => (!r || e.r === r) && (!type || e.type === type) && f(e));
  const first = (r, type, f) => all(r, type, f)[0];
  const last = (r, type, f) => all(r, type, f).at(-1);
  const said = (e, re) => !!e && re.test(e.say || '');
  const anySaid = (r, re) => log.some(e => e.r === r && re.test(e.say || ''));
  const judge = text => log.find(e => e.type === 'judge' && e.d?.key === text);
  return { all, first, last, said, anySaid, judge, log };
}

// Check helpers return true when earned, or a short reason when not.
const need = (e, what) => e ? true : `Not performed: ${what}.`;
const voice = (e, re, hint) => !e ? 'Not performed.' : re.test(e.say || '') ? true : `Done, but your narration did not mention ${hint}.`;
const both = (...rs) => rs.find(r => r !== true) ?? true;

function compressItems(prefix, r, pick, letters) {
  // pick(q) returns the graded compression set and the setup events before it.
  const items = [];
  const L = letters;
  const add = (key, text, check) => items.push({ id: `${prefix}-${key}`, n: key, text, pts: 2, check });
  if (L.side) add(L.side, 'Positioned self at the patient’s side.', q => { const c = pick(q); if (!c) return 'No graded compression set.'; return c.d.loc === 'A-side' ? true : 'Compressions were not given from the patient’s side.'; });
  if (L.cloth) add(L.cloth, 'Removed bulky clothing from the chest or moved it out of the way.', q => { const c = pick(q); if (!c) return 'No graded compression set.'; if (!c.d.exposed) return 'The jacket was still covering the chest during compressions.'; return voice(q.first(null, 'clothing', e => e.i <= c.i), RX.clothing, 'moving the jacket or exposing the chest'); });
  if (L.surface) add(L.surface, 'Made sure the patient is lying face-up on a firm, flat surface.', q => { const c = pick(q); if (!c) return 'No graded compression set.'; return voice(q.first(r, 'surface', e => e.i <= c.i), RX.surface, 'a firm, flat surface'); });
  add(L.hand, 'Put the heel of one hand on the center of the chest, lower half of the breastbone.', q => { const c = pick(q); if (!c) return 'No graded compression set.'; const h = q.last(r, 'hands', e => e.i <= c.i); if (!h) return 'Hand position was never set.'; if (h.d.spot !== 'lower') return 'Hand was not on the lower half of the breastbone.'; return voice(h, RX.lower, 'the lower half of the breastbone'); });
  add(L.stack, 'Put the heel of the other hand on top of the first hand.', q => { const c = pick(q); if (!c) return 'No graded compression set.'; const h = q.last(r, 'stack', e => e.i <= c.i); if (!h) return 'Second hand was never stacked.'; return voice(h, RX.stack, 'the second hand on top'); });
  add(L.posture, 'With arms straight, positioned shoulders directly over hands.', q => { const c = pick(q); if (!c) return 'No graded compression set.'; const h = q.last(r, 'posture', e => e.i <= c.i); if (!h) return 'Arm posture was never set.'; if (!h.d.straight || !h.d.over) return 'Arms were not straight with shoulders over hands.'; return voice(h, RX.posture, 'straight arms or shoulders over hands'); });
  add(L.rate, 'Compressions at 100–120/min: 30 compressions in 15 to 18 seconds.', q => { const c = pick(q); if (!c) return 'No graded compression set.'; return between(c.d.rate, 98, 122) ? true : `Rate was ${Math.round(c.d.rate)}/min (${c.d.secs.toFixed(1)} s for 30).`; });
  add(L.depth, 'Compressions at a depth of at least 2 inches (5 cm).', q => { const c = pick(q); if (!c) return 'No graded compression set.'; return between(c.d.depth, 2, 2.4) ? true : c.d.depth < 2 ? `Depth ${c.d.depth.toFixed(1)} in is too shallow.` : `Depth ${c.d.depth.toFixed(1)} in is deeper than the 2.4 in limit.`; });
  add(L.count, 'Counted compressions aloud.', q => { const c = pick(q); if (!c) return 'No graded compression set.'; return RX.count.test(c.say || '') ? true : 'Your narration for the set did not count aloud (for example “1, 2, 3 …”).'; });
  add(L.recoil, 'At the end of each compression, allowed the chest to recoil completely.', q => { const c = pick(q); if (!c) return 'No graded compression set.'; return c.d.recoil === 'full' ? true : 'Weight stayed on the chest between compressions.'; });
  return items;
}

function ecItems(prefix, r, pick) {
  const step = (k, i, text) => ({ id: `${prefix}-${k}`, n: k, text, pts: 2, check: q => { const e = pick(q); if (!e) return 'No bag-mask ventilation was given.'; return e.d.steps[i] ? true : 'Incorrect choice for this part of the E-C clamp.'; } });
  return [
    step(pick.n + 'a', 0, 'Performed a head tilt.'),
    step(pick.n + 'b', 1, 'Placed the mask on the face, using the bridge of the nose as a guide.'),
    step(pick.n + 'c', 2, 'Thumb and index finger make a “C” on the side of the mask, pressing the edges to the face.'),
    step(pick.n + 'd', 3, 'Remaining 3 fingers (“E”) lift the angles of the jaw, open the airway and press the face to the mask.')
  ];
}

const breathsOk = e => e && e.d.holds?.length >= 2 && e.d.holds.slice(0, 2).every(h => between(h, .6, 1.7));
const narratedRatio = (q, r) => { const ev = q.all(r, null, e => e.type !== 'judge' && !QUIET.has(e.type)); return ev.length ? ev.filter(e => words(e.say) >= 3).length / ev.length : 0; };
const commsCheck = r => q => {
  const ratio = narratedRatio(q, r);
  const team = q.all(r, null, e => ['shoutPartner', 'respond', 'callSwitch', 'speak'].includes(e.type)).length;
  if (ratio < .75) return `Only ${Math.round(ratio * 100)}% of actions were narrated (75% needed).`;
  return team ? true : 'Never spoke to your partner or patient (shout, respond, call switch, or speak).';
};
const emsTime = q => q.judge('ems')?.i ?? Infinity;
const summary = (prefix, r, start) => [
  { id: `${prefix}-${start + 1}`, n: String(start + 1), text: 'Removed gloves properly without touching the outside of the gloves with bare hands.', pts: 2, check: q => { const e = q.last(r, 'glovesOff', x => x.i >= emsTime(q)); if (!e) return 'Gloves were not removed after EMS took over.'; return e.d.proper ? true : 'Glove removal method let bare skin touch the outside of a glove.'; } },
  { id: `${prefix}-${start + 2}`, n: String(start + 2), text: 'Placed disposable PPE in a biohazard bag.', pts: 2, check: q => { const off = q.last(r, 'glovesOff', x => x.i >= emsTime(q)); const e = off && q.first(r, 'biohazard', x => x.i >= off.i); return off ? voice(e, RX.bio, 'the biohazard bag') : 'Remove gloves after EMS arrives, then bag them.'; } },
  { id: `${prefix}-${start + 3}`, n: String(start + 3), text: 'Alcohol-based hand rub was used for hand hygiene.', pts: 2, check: q => { const off = q.last(r, 'glovesOff', x => x.i >= emsTime(q)); const e = off && q.first(r, 'handrub', x => x.i >= off.i); return off ? voice(e, RX.rub, 'hand rub or hand hygiene') : 'Hand hygiene must follow glove removal.'; } }
];

const shockEvent = q => q.first(2, 'shock', e => e.d.ok) || q.first(null, 'shock', e => e.d.ok);
const analyzeEvent = q => q.first(null, 'clearAnalyze', e => e.d.ok);
const swapEvent = q => q.first(null, 'swap');

// R1 initial set: first R1 compression set. R2 set: first R2 set after the shock (or analysis).
const r1Initial = q => q.first(1, 'compress');
const r2PostShock = q => { const s = shockEvent(q) || analyzeEvent(q); return s ? q.first(2, 'compress', e => e.i > s.i) : null; };
const r1BagFirst = q => { const s = analyzeEvent(q); return q.first(1, 'breaths', e => e.d.kind === 'bag' && (!s || e.i > s.i)); };
r1BagFirst.n = '13';
const r1Ec = q => { const s = swapEvent(q); return q.first(1, 'ecClamp', e => !s || e.i < s.i); };
r1Ec.n = '13';
const r2Ec = q => { const s = swapEvent(q); return s ? q.first(2, 'ecClamp', e => e.i > s.i) : null; };
r2Ec.n = '9';

export const SHEETS = [
  {
    id: 'IIA', title: 'Skill II-A · Adult BLS with AED', who: 'Rescuer 1 initiates', r: 1,
    items: [
      { id: 'IIA-1', n: '1', text: 'Verified scene safety and identified which resource is being used (ARC or AHA).', pts: 2, check: q => both(voice(q.first(1, 'scene'), RX.safe, 'scene safety'), q.anySaid(1, RX.resource) ? true : 'Never stated whether you follow AHA or ARC.') },
      { id: 'IIA-2', n: '2', text: 'Opened first aid kit and put on PPE.', pts: 2, check: q => both(need(q.first(1, 'kit'), 'open the first aid kit'), need(q.first(1, 'gloves'), 'put on gloves')) },
      { id: 'IIA-3', n: '3', text: 'Determined unresponsiveness: tapped shoulder, shouted “Are you OK?”', pts: 2, check: q => voice(q.first(1, 'tapShout'), RX.okay, '“Are you OK?”') },
      { id: 'IIA-4', n: '4', text: 'Shouted to partner to activate the emergency response system and get the AED.', pts: 2, check: q => { const e = q.first(1, 'shoutPartner'); return both(voice(e, RX.ems, 'calling 911/EMS'), voice(e, RX.aed, 'getting the AED')); } },
      { id: 'IIA-5a', n: '5a', text: 'Checked breathing for 5–10 seconds using the method of the chosen resource (AHA: scan chest · ARC: head-tilt/chin-lift).', pts: 2, check: q => { const e = q.first(1, 'checkBP'); if (!e) return 'Breathing and pulse were never checked.'; const res = (q.log.find(x => x.r === 1 && RX.resource.test(x.say || ''))?.say || '').match(RX.resource)?.[0]?.toLowerCase() || ''; const want = /arc|red cross/.test(res) ? 'tilt' : /aha|heart/.test(res) ? 'scan' : null; if (!between(e.d.secs, 5, 10)) return `Check lasted ${e.d.secs.toFixed(1)} s (needs 5–10 s).`; if (e.d.method === 'jaw') return 'Jaw-thrust is only for suspected spinal injury.'; if (want && e.d.method !== want) return `Method did not match the resource you named (${want === 'scan' ? 'AHA scans the chest' : 'ARC opens the airway first'}).`; return true; } },
      { id: 'IIA-5b', n: '5b', text: 'Checked the carotid pulse with 2 or more fingers in the groove beside the trachea.', pts: 2, check: q => { const e = q.first(1, 'checkBP'); if (!e) return 'Pulse was never checked.'; if (e.d.site !== 'carotid') return 'Pulse was not checked in the carotid groove.'; return e.d.fingers === 'two' ? true : 'Use 2 or more fingers, not the thumb.'; } },
      ...compressItems('IIA', 1, r1Initial, { side: '6a', cloth: '6b', surface: '6c', hand: '6d', stack: '6e', posture: '6f', rate: '6g', depth: '6h', count: '6i', recoil: '6j' }),
      { id: 'IIA-7', n: '7', text: 'Placed the pocket mask using the bridge of the nose as a guide.', pts: 2, check: q => { const e = q.first(1, 'pocketMask'); if (!e) return 'Pocket mask was never used.'; return e.d.orient === 'nose' ? voice(e, RX.nose, 'the bridge of the nose') : 'Narrow end of the mask was not on the bridge of the nose.'; } },
      ...['a', 'b', 'c', 'd'].map((k, i) => ({ id: 'IIA-8' + k, n: '8' + k, text: ['Index finger and thumb of the hand nearest the top of the head along the top edge of the mask.', 'Thumb of the other hand along the bottom edge of the mask.', 'Remaining fingers on the bony jaw margin; lifted the jaw with a head tilt–chin lift.', 'Pressed firmly around the entire outside edge to seal the mask.'][i], pts: 2, check: q => { const e = q.first(1, 'pocketMask'); if (!e) return 'Pocket mask was never used.'; return e.d.seal[i] ? true : 'Incorrect choice for this part of the seal.'; } })),
      { id: 'IIA-8e', n: '8e', text: 'Delivered 2 breaths over 1 second each to make the chest rise.', pts: 2, check: q => { const e = q.first(1, 'pocketMask'); if (!e) return 'No pocket-mask breaths.'; if (!breathsOk(e)) return 'Each breath should last about 1 second (2 breaths).'; return voice(e, RX.breath, 'giving breaths'); } },
      { id: 'IIA-9', n: '9', text: 'Continued 30:2 cycles with less than 5-second interruptions until Rescuer 2 arrived with the AED; kept compressing while the AED was prepared.', pts: 2, check: q => { const p = q.first(2, 'aedPower'); const pads = q.first(null, 'pads'); if (!p) return 'The AED never arrived.'; if (!p.d.r1Cpr) return 'Rescuer 1 was not doing CPR when the AED was powered on.'; if (pads && !pads.d.r1Cpr) return 'Rescuer 1 stopped compressions while the pads were applied.'; return true; } },
      { id: 'IIA-10', n: '10', text: 'Stopped compressions, cleared the patient and moved to the head to prepare for bag-mask ventilation.', pts: 2, check: q => { const a = analyzeEvent(q); if (!a) return 'The AED never analyzed the rhythm.'; const m = q.last(1, 'move', e => e.d.to === 'A-head' && e.i <= a.i); return m ? true : 'Rescuer 1 did not move to the head before analysis.'; } },
      { id: 'IIA-11', n: '11', text: 'After the shock, waited for Rescuer 2 to complete 30 compressions before giving 2 breaths with the bag mask.', pts: 2, check: q => { const b = r1BagFirst(q), c = r2PostShock(q); if (!b) return 'Rescuer 1 never gave bag-mask breaths.'; if (!c) return 'Rescuer 2 never gave compressions after the shock.'; return b.i > c.i ? true : 'Breaths were given before Rescuer 2 finished 30 compressions.'; } },
      { id: 'IIA-12', n: '12', text: 'Using the bag mask, positioned self directly above the patient’s head.', pts: 2, check: q => { const e = r1Ec(q); if (!e) return 'No bag-mask ventilation by Rescuer 1.'; return e.d.loc === 'A-head' ? true : 'Rescuer 1 was not at the patient’s head.'; } },
      ...ecItems('IIA', 1, r1Ec),
      { id: 'IIA-14', n: '14', text: 'Squeezed the bag for 1 second each breath after every 30 compressions, watching for chest rise.', pts: 2, check: q => { const e = r1BagFirst(q); if (!e) return 'No bag-mask breaths.'; if (!breathsOk(e)) return 'Each squeeze should last about 1 second (2 breaths).'; return voice(e, RX.breath, 'breaths or chest rise'); } },
      { id: 'IIA-15', n: '15', text: 'Responded to Rescuer 2’s call to switch after 5 cycles; switched in under 5 seconds and resumed compressions.', pts: 2, check: q => { const s = swapEvent(q); const call = q.first(2, 'callSwitch'); if (!call) return 'Rescuer 2 never called for a switch.'; if (!s) return 'The rescuers never switched.'; return s.d.secs < 5 ? true : `Switch took ${s.d.secs.toFixed(1)} s.`; } },
      { id: 'IIA-16', n: '16', text: 'Continued two-person CPR: compressions, counting aloud, 30:2.', pts: 2, check: q => { const s = swapEvent(q); const c = s && q.first(1, 'compress', e => e.i > s.i); if (!c) return 'Rescuer 1 did not resume compressions after the switch.'; if (!between(c.d.rate, 98, 122)) return `Rate after the switch was ${Math.round(c.d.rate)}/min.`; return RX.count.test(c.say || '') ? true : 'Count aloud during compressions.'; } },
      { id: 'IIA-17', n: '17', text: 'Used appropriate verbal and nonverbal communication with the patient and other personnel.', pts: 2, check: commsCheck(1) },
      { id: 'IIA-18', n: '18', text: 'Gave information about the patient to EMS rescuers (judges).', pts: 4, check: q => { const e = q.last(1, 'emsReport', x => x.d.patient === 'A'); if (!e) return 'No EMS handoff for Patient A.'; const hit = reportScore('A', e.say); return hit.length >= 4 ? true : `Report covered ${hit.length} of 6 key points (4 needed).`; } },
      ...summary('IIA', 1, 18)
    ]
  },
  {
    id: 'IIB', title: 'Skill II-B · Adult BLS with AED', who: 'Rescuer 2 assists', r: 2,
    items: [
      { id: 'IIB-1', n: '1', text: 'After treating the first aid patient and changing gloves, arrived to assist Rescuer 1 with the AED.', pts: 2, check: q => { const p = q.first(2, 'aedPower'); if (!p) return 'Rescuer 2 never brought the AED.'; const treated = q.first(2, 'pressure', e => e.i < p.i); const changed = q.first(2, 'gloves', e => e.i < p.i && q.first(2, 'glovesOff', o => o.i < e.i && o.i > (treated?.i ?? Infinity))); if (!treated) return 'The AED came before Patient B’s bleeding was treated.'; return changed ? true : 'Gloves were not changed between patients.'; } },
      { id: 'IIB-2', n: '2', text: 'Opened the case and powered on the AED.', pts: 2, check: q => voice(q.first(2, 'aedPower'), RX.power, 'opening or powering on the AED') },
      { id: 'IIB-3', n: '3', text: 'Applied pads to the bare chest, avoiding clothing, medication patches and implanted devices.', pts: 2, check: q => { const e = q.last(2, 'pads', x => x.i < (analyzeEvent(q)?.i ?? Infinity)) || q.last(2, 'pads'); if (!e) return 'Pads were never applied.'; if (e.d.overClothing) return 'Pads went over the jacket.'; if (e.d.overPatch) return 'A pad went over the medication patch.'; if (!e.d.correct) return 'Pads were not in the right-upper-chest / left-side positions.'; return voice(e, RX.pads, 'placing the pads'); } },
      { id: 'IIB-4', n: '4', text: 'Cleared the patient (told everyone to stop touching) and let the AED analyze.', pts: 2, check: q => voice(analyzeEvent(q), RX.clear, 'clearing everyone from the patient') },
      { id: 'IIB-5', n: '5', text: 'Shockable rhythm advised: cleared the patient again and delivered a shock.', pts: 2, check: q => voice(shockEvent(q), RX.clear, 'clearing again before the shock') },
      ...compressItems('IIB', 2, r2PostShock, { side: '6a', hand: '6b', stack: '6c', posture: '6d', rate: '6e', depth: '6f', count: '6g', recoil: '6h' }),
      { id: 'IIB-7', n: '7', text: 'Called for Rescuer 1 to switch roles after 5 cycles; switched in under 5 seconds and began ventilation.', pts: 2, check: q => { const call = q.first(2, 'callSwitch'); if (!call) return 'Rescuer 2 never called for a switch.'; if (call.d.cycles < 5) return `Switch was called after ${call.d.cycles} cycles (5 needed).`; const s = swapEvent(q); if (!s) return 'The switch never happened.'; if (s.d.secs >= 5) return `Switch took ${s.d.secs.toFixed(1)} s.`; return voice(call, RX.sw, 'calling the switch'); } },
      { id: 'IIB-8', n: '8', text: 'Using a bag mask, positioned self directly above the patient’s head.', pts: 2, check: q => { const e = r2Ec(q); if (!e) return 'No bag-mask ventilation by Rescuer 2 after the switch.'; return e.d.loc === 'A-head' ? true : 'Rescuer 2 was not at the patient’s head.'; } },
      ...ecItems('IIB', 2, r2Ec),
      { id: 'IIB-10', n: '10', text: 'Squeezed the bag for 2 breaths of 1 second each after every 30 compressions, watching for chest rise.', pts: 2, check: q => { const s = swapEvent(q); const e = s && q.first(2, 'breaths', x => x.d.kind === 'bag' && x.i > s.i); if (!e) return 'No bag-mask breaths after the switch.'; const c = q.first(1, 'compress', x => x.i > s.i); if (!c || c.i > e.i) return 'Breaths came before Rescuer 1 finished 30 compressions.'; if (!breathsOk(e)) return 'Each squeeze should last about 1 second.'; return voice(e, RX.breath, 'breaths or chest rise'); } },
      { id: 'IIB-11', n: '11', text: 'Used appropriate verbal and nonverbal communication with the patient and other personnel.', pts: 2, check: commsCheck(2) },
      { id: 'IIB-12', n: '12', text: 'Gave information about the first aid patient to EMS rescuers (judges).', pts: 4, check: q => { const e = q.last(2, 'emsReport', x => x.d.patient === 'B'); if (!e) return 'No EMS handoff for Patient B.'; const hit = reportScore('B', e.say); return hit.length >= 4 ? true : `Report covered ${hit.length} of 6 key points (4 needed).`; } },
      ...summary('IIB', 2, 12)
    ]
  },
  {
    id: 'IV', title: 'Skill IV · Severe Bleeding and Shock', who: 'Rescuer 2 initiates', r: 2,
    items: [
      { id: 'IV-1', n: '1', text: 'Verified scene safety.', pts: 2, check: q => voice(q.first(2, 'scene'), RX.safe, 'scene safety') },
      { id: 'IV-2', n: '2', text: 'Opened first aid kit and put on PPE (minimum gloves and eye protection).', pts: 2, check: q => both(need(q.first(2, 'kit'), 'open the first aid kit'), need(q.first(2, 'gloves'), 'put on gloves'), need(q.first(2, 'eyes'), 'put on eye protection')) },
      { id: 'IV-3', n: '3', text: 'Checked for responsiveness and breathing.', pts: 2, check: q => voice(q.first(2, 'checkRB'), /ok|okay|alright|breath|hear me/i, 'responsiveness or breathing') },
      { id: 'IV-4', n: '4', text: 'Introduced self and asked permission to help.', pts: 2, check: q => { const e = q.first(2, 'consent'); return both(voice(e, RX.name, 'your name'), voice(e, RX.permission, 'asking permission to help')); } },
      { id: 'IV-5', n: '5', text: 'Quickly assessed the situation (asked what happened, noted bleeding).', pts: 2, check: q => voice(q.first(2, 'assess'), RX.happened, 'what happened or the bleeding') },
      { id: 'IV-6', n: '6', text: 'Looked for medical information jewelry.', pts: 2, check: q => voice(q.first(2, 'medId'), RX.medid, 'medical ID jewelry') },
      { id: 'IV-7', n: '7', text: 'Responded to Rescuer 1’s call for help.', pts: 1, check: q => { const s = q.first(1, 'shoutPartner'); if (!s) return 'Rescuer 1 never called for help.'; return voice(q.first(2, 'respond', e => e.i > s.i), RX.respond, 'a reply to your partner'); } },
      { id: 'IV-8a', n: '8a', text: 'Called EMS: stated caller’s name, location and phone number.', pts: 2, check: q => { const e = q.first(null, 'call911'); if (!e) return 'EMS was never called.'; const m = []; if (!e.d.loc) m.push('location'); if (!e.d.name) m.push('name'); if (!e.d.phone) m.push('phone number'); return m.length ? 'Missing ' + m.join(', ') + '.' : true; } },
      { id: 'IV-8b', n: '8b', text: 'Stated the situation, number and condition of the patient(s).', pts: 2, check: q => { const e = q.first(null, 'call911'); if (!e) return 'EMS was never called.'; const m = []; if (!e.d.count) m.push('number of patients'); if (!e.d.arrest) m.push('cardiac arrest patient'); if (!e.d.bleed) m.push('bleeding patient'); return m.length ? 'Missing ' + m.join(', ') + '.' : true; } },
      { id: 'IV-8c', n: '8c', text: 'Hung up when instructed by the dispatcher (verbalized it).', pts: 2, check: q => { const e = q.first(null, 'call911'); if (!e) return 'EMS was never called.'; if (!e.d.waited) return 'You hung up before the dispatcher said it was OK.'; return voice(e, RX.hangup, 'that the dispatcher said to hang up'); } },
      { id: 'IV-9', n: '9', text: 'Placed a dressing on the bleeding area.', pts: 2, check: q => voice(q.first(2, 'dressing'), RX.dressing, 'the gauze dressing') },
      { id: 'IV-10', n: '10', text: 'Applied direct pressure with the heel of one hand and the other hand stacked on top.', pts: 2, check: q => { const e = q.first(2, 'pressure'); if (!e) return 'Direct pressure was never applied.'; return e.d.technique === 'stack' ? voice(e, RX.pressure, 'direct pressure') : 'Use the heel of the hand with the other hand stacked on top.'; } },
      { id: 'IV-11a', n: '11a', text: 'Direct pressure was firm.', pts: 2, check: q => { const e = q.first(2, 'pressure'); return !e ? 'No direct pressure.' : e.d.firm ? true : 'Average pressure was below the firm zone.'; } },
      { id: 'IV-11b', n: '11b', text: 'Direct pressure was steady.', pts: 2, check: q => { const e = q.first(2, 'pressure'); return !e ? 'No direct pressure.' : e.d.steady ? true : 'Pressure swung up and down too much.'; } },
      { id: 'IV-11c', n: '11c', text: 'Direct pressure was constant.', pts: 2, check: q => { const e = q.first(2, 'pressure'); return !e ? 'No direct pressure.' : e.d.constant ? true : 'Pressure was released during the hold.'; } },
      { id: 'IV-12a', n: '12a', text: 'Tourniquet applied 2–3 inches above the bleeding site (not on a joint).', pts: 2, check: q => { const e = q.last(2, 'tqPlace'); if (!e) return 'No tourniquet.'; return e.d.zone === 'above' ? voice(e, RX.above, 'placing it 2–3 inches above the wound') : 'Tourniquet was not 2–3 inches above the wound.'; } },
      { id: 'IV-12b', n: '12b', text: 'Pulled the free end as tight as possible and secured it.', pts: 2, check: q => { const e = q.last(2, 'tqPull'); if (!e) return 'Strap was never pulled tight.'; return e.d.tight >= 100 ? voice(e, RX.pull, 'pulling the strap tight') : 'Strap was not pulled as tight as possible.'; } },
      { id: 'IV-12c', n: '12c', text: 'Twisted the windlass as tight as possible until the bleeding stopped.', pts: 2, check: q => { const e = q.last(2, 'tqTwist'); if (!e) return 'Windlass was never twisted.'; return e.d.stopped ? voice(e, RX.twist, 'twisting the windlass') : 'Bleeding had not stopped when you stopped twisting.'; } },
      { id: 'IV-12d', n: '12d', text: 'Secured the windlass.', pts: 2, check: q => voice(q.last(2, 'tqSecure'), RX.secure, 'securing the windlass') },
      { id: 'IV-12e', n: '12e', text: 'Noted the time the tourniquet was applied.', pts: 2, check: q => { const e = q.last(2, 'noteTime'); if (!e) return 'Tourniquet time was never noted.'; return RX.time.test(e.say || '') ? true : 'Say the actual time (for example “4:16 PM”).'; } },
      { id: 'IV-13a', n: '13a', text: 'Treated for shock: helped the patient lie on their back.', pts: 2, check: q => voice(q.first(2, 'layBack'), RX.back, 'helping her lie on her back') },
      { id: 'IV-13b', n: '13b', text: 'Covered the patient to keep them warm.', pts: 2, check: q => voice(q.first(2, 'blanket'), RX.warm, 'covering her to keep her warm') },
      { id: 'IV-14', n: '14', text: 'Changed gloves.', pts: 2, check: q => { const care = q.first(2, 'dressing') || q.first(2, 'pressure'); if (!care) return 'Patient B was never treated.'; const off = q.first(2, 'glovesOff', e => e.i > care.i); const on = off && q.first(2, 'gloves', e => e.i > off.i); return on ? true : 'Remove the soiled gloves and put on a new pair before helping with CPR.'; } }
    ]
  }
];

export const TOTAL = SHEETS.reduce((s, sh) => s + sh.items.reduce((a, i) => a + i.pts, 0), 0);
export const MASTERY = .7;

export function grade(log) {
  const q = tools(log);
  const sheets = SHEETS.map(sh => {
    const items = sh.items.map(it => {
      let res;
      try { res = it.check(q); } catch { res = 'Not performed.'; }
      return { id: it.id, n: it.n, text: it.text, pts: it.pts, earned: res === true ? it.pts : 0, note: res === true ? '' : res };
    });
    const possible = items.reduce((a, i) => a + i.pts, 0), earned = items.reduce((a, i) => a + i.earned, 0);
    return { id: sh.id, title: sh.title, who: sh.who, items, possible, earned, mastery: earned >= possible * MASTERY };
  });
  const earned = sheets.reduce((a, s) => a + s.earned, 0);
  return { sheets, earned, possible: TOTAL, pct: earned / TOTAL, pass: earned >= TOTAL * MASTERY };
}
