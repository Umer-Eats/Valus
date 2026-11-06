// Valus mock procedure lab 01 for Dental Science: a six-month checkup in Operatory 2.
// One dental assistant (the student) places surface barriers, seats the patient,
// dons PPE, dismisses the patient, doffs PPE, and removes the barriers.
// Same three modes as the CPR lab. Grading reads the action log (see mock-lab-dental-rubric.js).
import {DENTAL, grade, TOTAL, MASTERY, SURFACES, TRAY_NEED, TRAY_ITEMS} from './mock-lab-dental-rubric.js';
import {DENTAL_LEARN as LEARN, DENTAL_TIPS as PANEL_TIPS} from './mock-lab-dental-learn.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = s => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
const MODES = {learn: 'Learn', practice: 'Practice', graded: 'Graded'};
const LIMIT = fmt(DENTAL.limitSec);

// Action names and example narration.
const ACT = {
  inspect: ['Check the room', '“The operatory has been cleaned and disinfected and is ready.”'],
  hygiene: ['Hand hygiene', '“Using alcohol-based hand rub until my hands are dry.”'],
  placeBarriers: ['Place surface barriers', '“Placing barriers over the headrest, light handles, controls, syringe, hoses and tray.”'],
  checkBarriers: ['Check barriers', '“Checking that each barrier is secure.”'],
  prepChair: ['Ready the chair and path', '“Chair lowered, armrest up, and the path is clear.”'],
  tray: ['Set up the tray', '“Basic exam setup: mirror, explorer, cotton pliers and probe.”'],
  greet: ['Greet the patient', '“Good morning, Mrs. Ruiz! My name is Sam, and I’ll be your assistant today.”'],
  escort: ['Escort to the operatory', '“Please follow me to Operatory 2.”'],
  items: ['Personal items', '“I’ll put your handbag on this shelf where you can see it.”'],
  questions: ['Ask about questions', '“Do you have any questions about today’s checkup?”'],
  seat: ['Seat the patient', '“Please sit on the side of the chair and swing your legs up.”'],
  napkin: ['Patient napkin', '“Placing your napkin and clipping it with the napkin chain.”'],
  informChair: ['Tell her about the chair', '“I’m going to lower the chair back now.”'],
  adjust: ['Adjust the chair', '“Lowering you slowly to a comfortable position.”'],
  light: ['Position the light', '“Turning the light on over your chest.”'],
  review: ['Review the setup', '“Everything is organized and ready.”'],
  gown: ['Gown on', '“Putting on my gown, tied at the neck and waist.”'],
  mask: ['Mask on', '“Mask on, fitted to my nose and below my chin.”'],
  eyewear: ['Eyewear on', '“Protective eyewear on over my mask.”'],
  gloves: ['Gloves on', '“Gloves on, over the cuffs of my gown.”'],
  utilityGloves: ['Utility gloves on', '“Putting on utility gloves for cleanup.”'],
  lightAway: ['Move the light away', '“Moving the light out of your way.”'],
  warn: ['Warn the patient', '“Please stay seated until the chair stops moving.”'],
  reset: ['Reset the chair', '“Pressing reset to bring the chair down and upright.”'],
  bib: ['Remove the napkin', '“Removing your napkin and placing it in the biohazard container.”'],
  doff: ['Remove PPE', '“Removing gloves, eyewear, mask, then gown.”'],
  records: ['Patient records', '“Recording today’s visit in her chart.”'],
  postOp: ['Instructions', '“Keep brushing twice a day and flossing daily. See you in six months.”'],
  release: ['Release the patient', '“Raising the armrest and clearing your path.”'],
  assist: ['Help her up', '“Let me help you up. Here is your handbag.”'],
  escortOffice: ['Escort to the front desk', '“I’ll walk you to the front desk to schedule your next visit.”'],
  removeBarriers: ['Remove barriers', '“Peeling each barrier off without touching the surface underneath.”'],
  discardBarriers: ['Discard barriers', '“Discarding the used barriers in the regular trash.”'],
  utilityCare: ['Clean utility gloves', '“Washing, disinfecting and drying my utility gloves.”'],
  speak: ['Speak', 'Anything you say out loud to the patient or the judge.'],
  move: ['Move', '']
};
const TOOL = {barriers: ['Place barriers', 'Choose and place covers'], hygiene: ['Hand hygiene', 'Wash or hand rub'], utilityCare: ['Clean utility gloves', 'Wash · disinfect · dry'],
  gown: ['Gown', 'Put on'], mask: ['Mask', 'Put on'], eyewear: ['Protective eyewear', 'Put on'], gloves: ['Exam gloves', 'Put on last'], utilityGloves: ['Utility gloves', 'For cleanup'], doff: ['Remove PPE', 'In the right order'],
  inspect: ['Check the room', 'Is it clean and ready?'], checkBarriers: ['Check barriers', 'Are they secure?'], prepChair: ['Ready the chair', 'Height · armrest · path'], seat: ['Seat patient', 'Side, swing, slide up'],
  adjust: ['Adjust chair', 'Position and distance'], reset: ['Reset chair', 'Down and upright'], release: ['Release patient', 'Armrest up · path clear'], removeBarriers: ['Remove barriers', 'With utility gloves'],
  light: ['Position light', 'Turn on and aim'], lightAway: ['Move light away', 'Out of her path'], tray: ['Set up tray', 'Pick the instruments'], review: ['Review setup', 'Last look'],
  greet: ['Greet', 'Name · eye contact'], escort: ['Escort', 'To Operatory 2'], items: ['Personal items', 'Her handbag'], questions: ['Ask about questions', 'Start a conversation'], napkin: ['Patient napkin', 'Napkin and chain'],
  informChair: ['Tell her about the chair', 'Before it moves'], warn: ['Warn her', 'Stay seated'], bib: ['Remove napkin', 'Into the right bin'], postOp: ['Instructions', 'Home care · next visit'], assist: ['Help her up', 'Return her handbag'],
  escortOffice: ['Escort to front desk', 'Business office'], speak: ['Speak', 'Say anything'], discardBarriers: ['Discard barriers', 'Which bin?'], records: ['Patient records', 'Chart the visit']};

// Clickable things in the scene.
const HOTS = {
  sink: {name: 'Sink and hand rub', tip: 'Soap, water and alcohol-based hand rub', tools: ['hygiene', 'utilityCare']},
  ppe: {name: 'PPE station', tip: 'Gowns, masks, eyewear, exam and utility gloves', tools: ['gown', 'mask', 'eyewear', 'gloves', 'utilityGloves', 'doff']},
  box: {name: 'Surface barrier box', tip: 'Plastic covers for the operatory', tools: ['barriers']},
  chair: {name: 'Dental chair', tip: 'Room check, barriers, seating and chair moves', tools: ['inspect', 'checkBarriers', 'prepChair', 'seat', 'adjust', 'reset', 'release', 'removeBarriers']},
  light: {name: 'Operating light', tip: 'Turn on, aim, move away', tools: ['light', 'lightAway']},
  cart: {name: 'Instrument cart', tip: 'Tray setup for the exam', tools: ['tray', 'review']},
  pt: {name: 'Mrs. Elena Ruiz · 64', tip: 'Here for her six-month checkup', tools: ['greet', 'escort', 'items', 'questions', 'napkin', 'informChair', 'warn', 'bib', 'postOp', 'assist', 'escortOffice', 'speak']},
  trash: {name: 'Waste containers', tip: 'Regular trash (gray) · biohazard (red)', tools: ['discardBarriers']},
  computer: {name: 'Computer', tip: 'Patient records', tools: ['records']}
};

const PHASES = [
  ['Room prep', ['inspect', 'prepChair', 'tray']],
  ['Barriers', ['placeBarriers', 'checkBarriers']],
  ['Greet & seat', ['greet', 'escort', 'items', 'questions', 'seat', 'napkin']],
  ['Position', ['informChair', 'adjust', 'light', 'review']],
  ['PPE on', ['gown', 'mask', 'eyewear', 'gloves']],
  ['Dismiss', ['lightAway', 'warn', 'reset', 'bib', 'records', 'postOp', 'release', 'assist', 'escortOffice']],
  ['PPE off', ['doff']],
  ['Barriers off', ['utilityGloves', 'removeBarriers', 'discardBarriers', 'utilityCare']]
];

// Where the assistant stands for each tool: [x, facing].
const LOCS = {sink: [112, 1], ppe: [250, 1], bins: [292, 1], chair: [398, 1], cart: [684, 1], computer: [766, 1], side: [640, -1], door: [846, 1]};
const LOC_NAME = {sink: 'At the sink', ppe: 'At the PPE station', bins: 'At the waste bins', chair: 'At the head of the chair', cart: 'At the instrument cart', computer: 'At the computer', side: 'Beside the chair', door: 'At the doorway'};
const NEED = {hygiene: 'sink', utilityCare: 'sink', gown: 'ppe', mask: 'ppe', eyewear: 'ppe', gloves: 'ppe', utilityGloves: 'ppe', doff: 'ppe', barriers: 'chair', inspect: 'chair', checkBarriers: 'chair',
  prepChair: 'side', seat: 'side', adjust: 'chair', reset: 'chair', release: 'side', removeBarriers: 'chair', light: 'chair', lightAway: 'chair', tray: 'cart', review: 'cart', greet: 'door', escort: 'side',
  items: 'side', questions: 'side', napkin: 'side', informChair: 'chair', warn: 'chair', bib: 'side', postOp: 'side', assist: 'side', escortOffice: 'door', discardBarriers: 'bins', records: 'computer'};
const PT_X = {door: 902, room: 682, gone: 1090};
const TALK = new Set(['greet', 'questions', 'informChair', 'warn', 'postOp', 'speak', 'escort', 'escortOffice', 'assist']);
const SIMPLE = new Set(['inspect', 'checkBarriers', 'escort', 'questions', 'napkin', 'informChair', 'review', 'utilityGloves', 'lightAway', 'warn', 'reset', 'records', 'postOp', 'release', 'assist', 'escortOffice', 'speak']);

// Two-option questions: [label, right answer, wrong answer].
const QS = {
  gown: [['Coverage', 'Covers neck to knees and arms to wrists, wrapped around the back', 'Open in the back with the sleeves pushed up'], ['Ties', 'Tie it at the back of the neck and at the waist', 'Leave the ties loose so it is easy to remove']],
  mask: [['Ties or ear loops', 'Secure the ties at the head and neck, or loops around the ears', 'Hang it from one ear'], ['Nose band', 'Pinch the flexible band to the bridge of the nose', 'Leave the nose band flat'], ['Fit', 'Pull it snug to the face and below the chin', 'Leave the chin uncovered']],
  eyewear: [['Placement', 'Place it over your face and eyes', 'Push it up on top of your head'], ['Fit', 'Adjust it so it sits over the mask', 'Tuck the mask over the eyewear']],
  greet: [['Greeting', 'Greet her warmly by name', 'Call “Next!” from the doorway'], ['Body language', 'Make eye contact and smile', 'Keep your eyes on the schedule']],
  seat: [['Getting in', 'Sit on the side of the chair, then swing her legs onto it', 'Step over the leg rest and sit down'], ['Chair arm', 'Lower the chair arm back into position', 'Leave the chair arm up'], ['Height', 'Slide up until her head is even with the top of the headrest', 'Leave her low in the chair']],
  cuff: [['Glove cuff', 'Pull the glove cuff over the gown cuff', 'Tuck the glove cuff under the gown cuff']]
};
const DOFF_QS = {
  gloves: [['Start', 'Grasp the palm area of one glove with the other gloved hand and peel it off', 'Pull the first glove off by its fingertips'], ['Hold', 'Hold the removed glove in your gloved hand', 'Drop it on the bracket tray'], ['Second glove', 'Slide ungloved fingers under the other glove at the wrist', 'Pinch the outside of the other glove with bare fingers'], ['Peel', 'Pull down, turning it inside out over the first glove', 'Pull it straight off by the fingers'], ['Dispose', 'Drop both gloves in the waste container', 'Set them on the counter']],
  utility: [['Utility gloves', 'Peel them off by the cuffs and set them aside to dry for reuse', 'Throw them in the biohazard bag']],
  eyewear: [['Remove', 'Lift from the back, touching only the ear rests', 'Grab the front of the lenses'], ['Place', 'Set on a disposable towel to be cleaned and disinfected', 'Put them in your pocket']],
  mask: [['Remove', 'Slide fingers under the straps in front of the ears (or untie) and lift away', 'Pull it off by the front'], ['Dispose', 'Discard it in the waste receptacle', 'Keep it in your pocket for later']],
  gown: [['Ties', 'Unfasten the ties without letting the sleeves touch your body', 'Pull it off over your head'], ['Shoulders', 'Pull it away from the neck and shoulders, touching only the inside', 'Grab the front of the gown'], ['Fold', 'Turn it inside out and fold it into a bundle', 'Fold it with the outside facing out'], ['Dispose', 'Discard it in the waste container', 'Hang it up to wear again']]
};
// Short labels for the barrier choices (same order as SURFACES options).
const BAR_SHORT = {headrest: ['Headrest cover', 'Paper napkin', 'Leave bare'], light: ['Handle sleeves', 'Foil', 'Leave bare'], controls: ['Adhesive wrap', 'Paper towel', 'Leave bare'], syringe: ['Syringe sleeve', 'Gauze wrap', 'Leave bare'], hoses: ['Tubing sleeves', 'Tape the ends', 'Leave bare'], tray: ['Tray cover', 'Paper towel', 'Leave bare']};
const PART_NAME = {gloves: 'Gloves', eyewear: 'Eyewear', mask: 'Mask', gown: 'Gown'};
// Coach picks for named single-choice panels.
const PICK = {method: 'rub', place: 'shelf', pos: 'chest', kind: 'exam', speed: 'slow', posn: 'supine', cover: 'full', tech: 'careful', say: 'yes'};

// ---------- scene drawing ----------
function operatorSvg() {
  return `<g class="dl-op" data-s="op"><g class="dl-face">
    <ellipse class="dl-shadow" cx="0" cy="380" rx="18" ry="3"/>
    <path class="dl-pants" d="M-6 334 L-7 374 M5 334 L6 374"/>
    <path class="dl-clog" d="M-13 380 v-3 q0 -4 5 -4 h4 q6 0 7 7z M0 380 v-3 q0 -4 5 -4 h4 q6 0 7 7z"/>
    <g class="dl-armg back"><path class="dl-sleeve" d="M-1 296 L3 316"/><path class="dl-fore" d="M3 316 L14 326"/><circle class="dl-hand" cx="16" cy="327" r="3.6"/></g>
    <path class="dl-top" d="M-13 340 Q-15 302 -8 292 Q0 288 8 292 Q14 302 13 340 Z"/>
    <path class="dl-topv" d="M-3 291 L1 300 L5 291"/><rect class="dl-badge" x="5" y="305" width="5" height="7" rx="1"/>
    <g class="dl-gown"><path d="M-15 364 L-15 302 Q-13 290 0 289 Q13 290 15 302 L15 364 Q0 368 -15 364 Z"/><path class="dl-gown-tie" d="M-15 334 h5"/><path class="dl-gown-col" d="M-6 290 Q1 296 7 290"/></g>
    <rect class="dl-neck" x="-3.5" y="279" width="7.5" height="11" rx="2.5"/>
    <circle class="dl-head" cx="1" cy="271" r="9.5"/><circle class="dl-ear" cx="-3" cy="272" r="2.3"/>
    <path class="dl-hair" d="M-8.5 272 Q-10 259 1 258.5 Q11 259 10.5 267 Q5 262.5 -1 264.5 Q-5 267 -5.5 275 Z"/>
    <circle class="dl-eye" cx="6" cy="269.5" r="1.2"/><path class="dl-brow" d="M4 266.3 l4 -.4"/><path class="dl-nose" d="M9.7 270 l2.4 3.2 l-2.4 .6"/><path class="dl-mouth" d="M5 277.5 q2.2 1.2 4.4 -.2"/>
    <g class="dl-mask"><path d="M2.5 272.5 Q9 271.5 11.6 275 Q11.4 281 5.5 283.5 Q2 282 1.8 277 Z"/><path class="loop" d="M2.5 273.5 L-3 271.5 M3 281 L-3 274"/><path class="pleat" d="M4 276 h6 M4 278.6 h6"/></g>
    <g class="dl-eyewear"><rect x="2.5" y="266" width="10" height="6" rx="2.5"/><path d="M2.5 268.5 L-4 270.5"/></g>
    <g class="dl-talk"><path d="M17 262 q5 6 0 12"/><path d="M22 258 q9 10 0 20"/></g>
    <g class="dl-armg"><path class="dl-sleeve" d="M4 295 L8 317"/><path class="dl-fore" d="M8 317 L19 327"/><circle class="dl-hand" cx="21" cy="328" r="3.8"/><g class="dl-carry"><path d="M15 318 h16 l-3 10 h-10z"/></g></g>
  </g></g>`;
}

function patientStandSvg() {
  return `<g class="dl-pts" data-s="pts"><g class="dl-face">
    <ellipse class="dl-shadow" cx="0" cy="380" rx="16" ry="3"/>
    <path class="dl-slacks" d="M-6 340 L-7 375 M4 340 L5 375"/>
    <path class="dl-shoe" d="M-12 380 v-3 q0 -3 4 -3 h4 q5 0 6 6z M0 380 v-3 q0 -3 4 -3 h4 q5 0 6 6z"/>
    <path class="dl-cardi" d="M-12 344 Q-14 306 -7 296 Q0 292 8 296 Q14 306 12 344 Z"/><path class="dl-blouse" d="M-3 294 L1.5 304 L6 294"/><path class="dl-cardi-edge" d="M1.5 304 L2 343"/>
    <rect class="dl-pskin" x="-3" y="284" width="6" height="11" rx="2"/>
    <circle class="dl-pskin" cx="1" cy="275" r="9.3"/><circle class="dl-pear" cx="-3" cy="276" r="2.2"/>
    <path class="dl-gray" d="M-8.5 278 Q-10 263 1 263 Q10.5 263 10.5 271 Q5 267 -1 268.5 Q-4.5 271 -5 280 Z"/><circle class="dl-gray" cx="-8.5" cy="269" r="4"/>
    <circle class="dl-glasses" cx="7" cy="274" r="2.6"/><path class="dl-glasses" d="M4.4 274 L-2 274.5"/>
    <path class="dl-nose" d="M10 274.5 l2.2 3 l-2.2 .6"/><path class="dl-mouth" d="M5 281 q2.2 1.4 4.4 0"/>
    <g class="dl-armp"><path class="dl-cardi-arm" d="M3 299 L5 320"/><path class="dl-pskin-l" d="M5 320 L11 333"/><circle class="dl-pskin" cx="11.5" cy="334" r="3.2"/></g>
    <g class="dl-bag-held"><path class="strap" d="M4 318 Q10 314 14 326"/><rect x="5" y="326" width="16" height="12" rx="3"/><path class="flap" d="M5 330 h16"/></g>
    <rect class="ml-hot" data-hot="pt" x="-17" y="258" width="34" height="124" rx="12"/>
  </g></g>`;
}

// Seated patient. The torso rotates with the backrest; the legs stay on the seat.
function patientChairTorso() {
  return `<g class="dl-ptc">
    <path class="dl-cardi" d="M513 348 Q508 322 507 302 Q507 291 515 289 L525 291 Q533 300 533 318 Q534 336 533 348 Z"/>
    <path class="dl-blouse" d="M516 290 L522 298 L527 291"/>
    <rect class="dl-pskin" x="511" y="279" width="7" height="12" rx="2"/>
    <circle class="dl-pskin" cx="513" cy="271" r="9.3"/><circle class="dl-pear" cx="509" cy="272" r="2.2"/>
    <path class="dl-gray" d="M504 275 Q502 259 513 259 Q522.5 259 522.5 267 Q517 263 511 264.5 Q507.5 267 507 276 Z"/>
    <circle class="dl-glasses" cx="519" cy="270" r="2.6"/><path class="dl-glasses" d="M516.4 270 L510 270.5"/>
    <path class="dl-nose" d="M522 270.5 l2.2 3 l-2.2 .6"/><path class="dl-mouth" d="M517 277 q2.2 1.4 4.4 0"/>
    <g class="dl-napkin"><path d="M519 293 L536 298 L536 324 L520 321 Z"/><path class="fold" d="M522 300 L534 303"/><path class="chain" d="M520 293 Q511 287 506 293"/><circle class="clip" cx="520" cy="293.5" r="1.6"/><circle class="clip" cx="535.5" cy="298.5" r="1.6"/></g>
    <g class="dl-arm-up"><path class="dl-cardi-arm" d="M521 297 L526 321"/><path class="dl-pskin-l" d="M526 321 L545 334"/><circle class="dl-pskin" cx="547" cy="335" r="3.3"/></g>
  </g>`;
}

function sceneSvg() {
  const tiles = Array.from({length: 22}, (_, i) => `M${i * 48 - 10} 380 V1800`).join(' ');
  return `<svg class="dl-scene" viewBox="0 0 1000 440" role="img" aria-label="Dental operatory 2. Counter with sink and PPE station on the left, the dental chair in the middle, an instrument cart and computer on the right, and the doorway where Mrs. Ruiz waits. Click people and objects to act.">
  <rect class="dl-ceil" y="-1200" width="1000" height="1214"/><rect class="dl-crown" y="12" width="1000" height="5"/>
  <rect class="dl-wall" y="17" width="1000" height="363"/><rect class="dl-wall2" y="300" width="1000" height="74"/><path class="dl-rail" d="M0 300 H1000"/>
  <rect class="dl-floor" y="380" width="1000" height="1420"/><path class="dl-tile" d="${tiles} ${[404, 436, 476, 524, 580, 644, 716, 796, 884, 980, 1084, 1196, 1316, 1444, 1580, 1724].map(y => `M0 ${y} H1000`).join(" ")}"/>
  <rect class="dl-base" y="372" width="1000" height="8"/>
  <g class="ml-hots">
    <rect class="ml-hot" data-hot="sink" x="64" y="282" width="120" height="44" rx="10"/>
    <rect class="ml-hot" data-hot="ppe" x="196" y="146" width="106" height="132" rx="10"/>
    <rect class="ml-hot" data-hot="box" x="228" y="286" width="70" height="30" rx="8"/>
    <rect class="ml-hot" data-hot="trash" x="292" y="340" width="74" height="42" rx="8"/>
    <rect class="ml-hot hs-chair" data-hot="chair" x="486" y="332" width="150" height="48" rx="12"/>
    <rect class="ml-hot hs-back" data-hot="chair" x="492" y="238" width="40" height="96" rx="10"/>
    <rect class="ml-hot" data-hot="cart" x="692" y="284" width="80" height="96" rx="10"/>
    <rect class="ml-hot" data-hot="computer" x="780" y="252" width="66" height="70" rx="10"/>
  </g>
  <g class="dl-poster"><rect x="54" y="78" width="96" height="62" rx="4"/><path class="tooth" d="M88 92 q-8 0 -8 9 q0 7 3 12 q2 6 4 6 q2 0 3 -6 q1 -3 2 0 q1 6 3 6 q2 0 4 -6 q3 -5 3 -12 q0 -9 -8 -9 q-3 0 -3 1.5 q0 -1.5 -3 -1.5z"/><text x="128" y="104">BRUSH</text><text x="128" y="116">FLOSS</text><text x="128" y="128">SMILE</text></g>
  <g class="dl-upper"><rect x="40" y="152" width="150" height="66" rx="3"/><path d="M115 152 v66"/><rect class="h" x="106" y="196" width="3" height="12" rx="1"/><rect class="h" x="121" y="196" width="3" height="12" rx="1"/></g>
  <g class="dl-ppe"><rect class="panel" x="200" y="150" width="98" height="124" rx="4"/><text x="249" y="166">PPE</text>
    <rect class="shelf" x="200" y="198" width="98" height="4"/><rect class="shelf" x="200" y="240" width="98" height="4"/>
    <g class="gowns"><rect x="206" y="186" width="36" height="5" rx="2"/><rect x="207" y="181" width="34" height="5" rx="2"/><rect x="206" y="176" width="36" height="5" rx="2"/><rect x="208" y="191" width="33" height="7" rx="2"/></g>
    <g class="goggles"><path d="M252 190 q0 -6 9 -6 h12 q9 0 9 6 q0 6 -9 6 q-6 0 -6 -3 q0 3 -6 3 q-9 0 -9 -6z"/></g>
    <g class="maskbox"><rect x="205" y="220" width="26" height="20" rx="2"/><path class="mk" d="M210 220 q8 -7 16 0"/><text x="218" y="234">MASK</text></g>
    <g class="glovebox"><rect x="236" y="221" width="26" height="19" rx="2"/><path class="gl" d="M243 221 q2 -6 6 -5 q3 -3 6 1 v4"/><text x="249" y="234">EXAM</text></g>
    <g class="utility"><path d="M268 240 v-12 q0 -4 3 -5 l1 -7 q1 -2 3 0 l0 6 l2 -7 q2 -2 3 0 l0 7 l2 -6 q2 -2 3 0 l-1 8 q3 -2 3 1 l-3 9 v6z"/></g>
    <rect class="dispenser" x="206" y="250" width="16" height="20" rx="3"/><path class="nozzle" d="M214 270 v3"/><text class="tiny" x="214" y="262">RUB</text></g>
  <g class="dl-counter"><rect class="cab" x="40" y="320" width="260" height="52"/><path class="door" d="M105 324 V368 M170 324 V368 M235 324 V368"/><rect class="h" x="98" y="334" width="3" height="12" rx="1"/><rect class="h" x="110" y="334" width="3" height="12" rx="1"/><rect class="h" x="228" y="334" width="3" height="12" rx="1"/><rect class="h" x="240" y="334" width="3" height="12" rx="1"/>
    <rect class="top" x="34" y="313" width="272" height="8" rx="2"/>
    <path class="basin" d="M74 314 h70 q-3 10 -12 11 h-46 q-9 -1 -12 -11z"/><path class="faucet" d="M122 314 v-18 q0 -7 -7 -7 h-9 v5"/><rect class="knob" x="125" y="306" width="7" height="3" rx="1"/>
    <g class="soap"><rect x="152" y="298" width="11" height="15" rx="3"/><path d="M157.5 298 v-5 h5"/></g>
    <g class="dl-box"><rect x="232" y="296" width="62" height="17" rx="2"/><path class="sheet" d="M238 296 q6 -6 12 -2 q6 -6 12 -1 q6 -5 12 0"/><text x="263" y="308">BARRIERS</text></g>
  </g>
  <g class="dl-bins"><g class="trash"><path d="M300 380 l-2 -30 h28 l-2 30z"/><rect x="296" y="345" width="32" height="6" rx="2"/><path class="lines" d="M305 356 v18 M312 356 v18 M319 356 v18"/></g>
    <g class="bio"><path d="M334 380 l-2 -30 h28 l-2 30z"/><rect x="330" y="345" width="32" height="6" rx="2"/><g class="sym"><circle cx="346" cy="364" r="3"/><circle cx="346" cy="358" r="3.2"/><circle cx="341" cy="367" r="3.2"/><circle cx="351" cy="367" r="3.2"/></g></g></g>
  <g class="dl-xray"><rect x="330" y="120" width="64" height="44" rx="3"/><rect class="film" x="336" y="126" width="24" height="32" rx="2"/><rect class="film" x="364" y="126" width="24" height="32" rx="2"/><path class="teeth" d="M340 134 h16 M340 140 h16 M368 134 h16 M368 140 h16"/></g>
  <g class="dl-clock"><circle cx="720" cy="84" r="16"/><path d="M720 84 v-10 M720 84 l7 4"/></g>
  <g class="dl-chair" data-s="chair">
    <rect class="plate" x="516" y="371" width="112" height="9" rx="3"/>
    <g class="dl-lift">
      <rect class="col" x="563" y="340" width="16" height="36"/>
      <g class="dl-hoses"><rect class="holder" x="452" y="332" width="34" height="7" rx="2"/><path class="hve" d="M458 339 q-2 22 10 34"/><path class="se" d="M467 339 q-1 18 8 30"/><path class="syr" d="M478 339 v-14 l3 -3"/><path class="dl-bar sleeve" d="M455 330 h14 v14 h-14z M474 318 h9 v22 h-9z"/></g>
      <path class="arm-mount" d="M486 336 h30"/>
      <path class="seat" d="M512 342 Q512 337 518 337 H568 Q574 337 575 343 V349 Q575 352 570 352 H517 Q512 352 512 348Z"/>
      <path class="legrest" d="M570 338 L626 354 Q632 356 631 362 L629 367 L570 351Z"/><rect class="foot" x="624" y="358" width="8" height="16" rx="2" transform="rotate(-18 628 366)"/>
      <path class="dl-pleg thigh" d="M524 344 L567 342"/><path class="dl-pleg shin" d="M567 342 L619 357"/><path class="dl-pshoe" d="M617 353 l8 -6 q4 -1 5 3 l-2 10 q-5 2 -9 -1z"/>
      <g class="dl-back"><path class="back" d="M509 350 L499 278 Q498 268 508 268 H522 Q529 269 528 279 L530 350 Z"/><rect class="post" x="499" y="272" width="6" height="10"/><rect class="head" x="492" y="253" width="16" height="33" rx="7.5"/>
        ${patientChairTorso()}
        <path class="dl-bar" d="M489 250 h22 v39 h-22z"/>
        <rect class="ml-hot hs-ptc" data-hot="pt" x="496" y="252" width="44" height="100" rx="12"/></g>
      <g class="dl-arm-lie"><path class="dl-cardi-arm" d="M473 331 L498 341"/><path class="dl-pskin-l" d="M498 341 L521 339"/><circle class="dl-pskin" cx="523.5" cy="338.6" r="3.3"/></g>
      <g class="dl-armrest"><path class="arm" d="M532 331 H568 Q572 331 572 335 Q572 338 568 338 H532Z"/><path class="arm-post" d="M560 338 v6"/></g>
    </g>
    <rect class="col-low" x="561" y="352" width="20" height="21" rx="2"/>
    <g class="dl-ctrl"><rect class="ctrl" x="584" y="356" width="17" height="11" rx="2"/><circle class="btn" cx="589" cy="361.5" r="1.7"/><circle class="btn" cx="596" cy="361.5" r="1.7"/><path class="dl-bar" d="M582 354 h21 v15 h-21z"/></g>
  </g>
  <g class="dl-stool" data-s="stool"><ellipse class="seat" cx="0" cy="344" rx="14" ry="4.5"/><rect class="post" x="-2" y="348" width="4" height="25"/><path class="legs" d="M-14 377 L0 372 L14 377"/><circle class="wheel" cx="-14" cy="378" r="2.5"/><circle class="wheel" cx="14" cy="378" r="2.5"/></g>
  <g class="dl-footctl" data-s="foot"><path class="cord" d="M10 374 Q-30 360 -70 372"/><rect x="0" y="370" width="24" height="10" rx="3"/><rect class="pad" x="5" y="371" width="14" height="4" rx="1.5"/></g>
  <g class="dl-cart"><rect class="tray" x="696" y="296" width="70" height="6" rx="2"/><rect class="body" x="702" y="304" width="58" height="62" rx="3"/><path class="drw" d="M702 322 H760 M702 340 H760"/><rect class="h" x="724" y="311" width="14" height="3" rx="1"/><rect class="h" x="724" y="329" width="14" height="3" rx="1"/><rect class="h" x="724" y="350" width="14" height="3" rx="1"/>
    <circle class="wheel" cx="708" cy="372" r="4"/><circle class="wheel" cx="754" cy="372" r="4"/>
    <g class="dl-instr"><path d="M702 293 h18 M704 290 h16 M725 293 h16 M726 290 h12 M744 293 h14"/><circle cx="702" cy="292" r="2.5"/><rect class="gauze" x="744" y="286" width="12" height="5" rx="1"/></g>
    <path class="dl-bar" d="M693 292 h76 v12 h-76z"/></g>
  <g class="dl-desk"><rect class="top" x="776" y="316" width="72" height="6" rx="2"/><rect class="cubby" x="782" y="322" width="60" height="26" rx="2"/><path class="leg" d="M786 348 V380 M838 348 V380"/>
    <rect class="stand" x="809" y="296" width="6" height="20"/><rect class="mon" x="786" y="258" width="52" height="38" rx="3"/><rect class="scr" x="790" y="262" width="44" height="28" rx="1.5"/><path class="chart" d="M794 268 h20 M794 273 h32 M794 278 h26 M794 283 h14"/><rect class="kb" x="792" y="310" width="34" height="5" rx="1.5"/></g>
  <g class="dl-bag dl-bag-shelf"><path class="strap" d="M804 340 q8 -10 16 0"/><rect x="800" y="334" width="24" height="13" rx="3"/></g>
  <g class="dl-bag dl-bag-floor"><path class="strap" d="M648 372 q8 -10 16 0"/><rect x="644" y="366" width="24" height="14" rx="3"/></g>
  <g class="dl-bag dl-bag-hall"><path class="strap" d="M934 372 q8 -10 16 0"/><rect x="930" y="366" width="24" height="14" rx="3"/></g>
  <g class="dl-door"><rect class="hall" x="864" y="226" width="86" height="154"/><path class="hall-line" d="M864 300 H950"/><rect class="frame" x="858" y="220" width="98" height="8" rx="2"/><rect class="frame" x="858" y="220" width="7" height="160"/><rect class="frame" x="949" y="220" width="7" height="160"/>
    <path class="leaf" d="M956 228 L986 214 V392 L956 380Z"/><circle class="knob" cx="980" cy="306" r="2.4"/><rect class="sign" x="884" y="196" width="46" height="18" rx="3"/><text x="907" y="209">OP 2</text></g>
  ${patientStandSvg()}
  <g class="dl-light" data-s="light"><rect class="rail" x="420" y="14" width="230" height="6" rx="2"/><rect class="mount" x="514" y="18" width="12" height="10" rx="2"/><path class="pole" d="M520 26 V62"/><path class="arm" data-larm d="M520 62 L560 130"/>
    <g class="head" data-lhead><path class="beam" d="M-14 8 L14 8 L46 96 L-46 96Z"/><rect class="hous" x="-22" y="-8" width="44" height="14" rx="6"/><rect class="lens" x="-15" y="4" width="30" height="5" rx="2"/><rect class="hdl" x="-31" y="-4" width="9" height="5" rx="2"/><rect class="hdl" x="22" y="-4" width="9" height="5" rx="2"/>
      <path class="dl-bar" d="M-33 -6 h12 v9 h-12z M21 -6 h12 v9 h-12z"/><rect class="ml-hot" data-hot="light" x="-36" y="-14" width="72" height="28" rx="10"/></g></g>
  ${operatorSvg()}
  </svg>`;
}

function introHtml(history) {
  const best = history.filter(h => h.mode === 'graded').sort((a, b) => b.earned - a.earned)[0];
  return `<div class="mlab-intro">
    <div class="mlab-intro-head"><span class="eyebrow">MOCK PROCEDURE · DENTAL SCIENCE · LAB ${DENTAL.number}</span><h2>Six-month checkup station</h2><p>You are the dental assistant in Operatory 2. Place surface barriers, seat your patient, put on PPE, then dismiss her, take off your PPE and clean up. Click the chair, the patient, the PPE station or anything else in the room to act. You’re scored against the official HOSA rating sheets.</p></div>
    <div class="mlab-chart">
      <div><span>Skills on this station</span><ul>${DENTAL.skills.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
      <div><span>Team</span><b>Just you</b><small>One dental assistant. The dentist does the exam.</small></div>
      <div><span>Time</span><b>${LIMIT}</b><small>Starts when the scenario appears. Typing time is paused.</small></div>
      <div><span>Scoring</span><b>${TOTAL} points</b><small>${Math.round(MASTERY * 100)}% mastery = ${(TOTAL * MASTERY).toFixed(1)} points</small></div>
    </div>
    <ol class="mlab-how"><li><b>Read the secret scenario.</b> You see it when the clock starts, just like at competition.</li><li><b>Click to act.</b> Hover over anything in the room to see what it is, then click it for its actions. You walk to the right spot on your own.</li><li><b>Say it out loud by typing.</b> After each action, type what you would say or do for the judge. Verbal steps only count if your words cover them.</li><li><b>Finish the cleanup.</b> After the patient leaves, remove the barriers and your PPE, then grade the run.</li></ol>
    <fieldset class="mlab-modes"><legend>How do you want to run this lab?</legend>
      <label><input type="radio" name="mlab-mode" value="learn"><span><em>Start here</em><b>Learn</b><small>A coach walks you through every step in order: what to click, why it matters, and what to say. Correct choices are marked. No time limit.</small></span></label>
      <label><input type="radio" name="mlab-mode" value="practice"><span><b>Practice</b><small>Do it yourself in any order with a live rating sheet, hints and example phrases. The clock keeps counting past ${LIMIT}.</small></span></label>
      <label><input type="radio" name="mlab-mode" value="graded"><span><b>Graded</b><small>Competition rules: hard ${LIMIT} limit, rating sheet hidden, no hints. Scored when you finish or time runs out.</small></span></label>
    </fieldset>
    <div class="mlab-start-row"><button class="mlab-btn primary" type="button" data-act="start" disabled>Choose a mode to start</button>${best ? `<span class="mlab-best">Best graded run: <b>${best.earned}/${TOTAL}</b> (${Math.round(best.pct * 100)}%)</span>` : ''}</div>
    ${history.length ? `<div class="mlab-history"><span>Recent runs</span>${history.slice(-5).reverse().map(h => `<div><em>${MODES[h.mode] || h.mode}</em><b>${h.earned}/${TOTAL}</b><small>${Math.round(h.pct * 100)}% · ${fmt(h.secs)} · ${new Date(h.at).toLocaleDateString()}</small></div>`).join('')}</div>` : ''}
  </div>`;
}

// Side view for the working-distance slider: patient lying back, operator above.
function distSvg(dist, learn) {
  const y = 96 - dist * 3.1;
  return `<svg class="dl-dist" viewBox="0 0 320 120" aria-hidden="true">
    <path class="dd-chair" d="M60 112 H270 Q278 112 278 118 H52 Q52 112 60 112Z"/>
    <path class="dd-body" d="M120 112 Q120 98 134 97 H262 Q270 99 270 112Z"/>
    <ellipse class="dd-head" cx="104" cy="100" rx="17" ry="12"/><path class="dd-nose" d="M110 89 q4 -6 8 0"/><circle class="dd-glass" cx="112" cy="94" r="3"/>
    ${learn ? `<rect class="dd-zone" x="40" y="${(96 - 14 * 3.1).toFixed(1)}" width="150" height="${(2 * 3.1).toFixed(1)}" rx="2"/>` : ''}
    <g class="dd-op" style="transform:translateY(${(y - 30).toFixed(1)}px)"><ellipse class="dd-ophead" cx="104" cy="22" rx="15" ry="13"/><path class="dd-mask" d="M96 30 q8 6 16 0 v-5 h-16z"/><path class="dd-cap" d="M89 20 q2 -14 15 -14 q13 0 15 14z"/></g>
    <path class="dd-dim" d="M150 ${(y + 1).toFixed(1)} V90 M144 ${(y + 1).toFixed(1)} h12 M144 90 h12"/>
    <text class="dd-t" x="162" y="${((y + 90) / 2 + 4).toFixed(1)}">${dist} in</text>
  </svg>`;
}

export function mountDentalLab(el) {
  const screen = el.querySelector('[data-mlab-screen]');
  const storeKey = 'valus-mocklab-' + DENTAL.id;
  let S = null, disposed = false, tickId = 0, fitObs = null, chosenMode = null;
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!disposed) fn(); }, ms); timers.add(id); return id; };
  const $ = sel => el.querySelector(sel);
  const $$ = sel => [...el.querySelectorAll(sel)];
  const history = () => { try { return JSON.parse(localStorage.getItem(storeKey) || '[]'); } catch { return []; } };
  const saveRun = run => { try { const h = history(); h.push(run); localStorage.setItem(storeKey, JSON.stringify(h.slice(-20))); } catch {} };
  const showIntro = () => { stopAll(); fitObs?.disconnect(); fitObs = null; S = null; chosenMode = null; screen.innerHTML = introHtml(history()); };

  // ---------- session ----------
  function fresh(mode) {
    return {
      mode, learn: mode === 'learn', practice: mode === 'practice', help: mode !== 'graded',
      t0: performance.now(), pausedMs: 0, pauseAt: 0, log: [], pending: null, step: 0, coachMsg: '', coachTone: '', snap: null,
      op: {loc: 'sink', gown: false, mask: false, eyewear: false, gloves: null, soiled: false, carry: false},
      pt: {loc: 'door', bag: 'held', napkin: 'none'},
      chair: {low: false, armUp: false, path: false, back: 'up'},
      room: {barriers: 'none', tray: false, light: 'home'},
      judged: {}, panel: null, menu: null, side: 'sheet', earned: new Set(), done: false
    };
  }
  const now = () => S ? Math.max(0, (performance.now() - S.t0 - S.pausedMs - (S.pauseAt ? performance.now() - S.pauseAt : 0)) / 1000) : 0;
  const clock = () => { const m = DENTAL.startClock.h * 60 + DENTAL.startClock.m + Math.floor(now() / 60); const h = Math.floor(m / 60), mm = m % 60; return `${(h + 11) % 12 + 1}:${String(mm).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
  const step = () => S?.learn ? LEARN[S.step] : null;
  const treated = () => !!S.judged.treatment;
  const snapshot = () => JSON.parse(JSON.stringify({op: S.op, pt: S.pt, chair: S.chair, room: S.room}));

  function start(mode) {
    S = fresh(mode);
    screen.innerHTML = labHtml();
    openModal('scenario');
    tickId = setInterval(tick, 250);
    if (S.learn) { S.coachMsg = 'Welcome! Follow the coach one step at a time. Glowing gold outlines show what to click.'; S.coachTone = 'ok'; }
    const svg = $('.dl-scene'); svg.classList.add('ml-noanim');
    fitObs?.disconnect();
    if (window.ResizeObserver) { fitObs = new ResizeObserver(fitScene); fitObs.observe($('[data-wrap]')); }
    fitScene();
    updateAll();
    requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.remove('ml-noanim')));
  }
  // Show more wall and floor when the tool panel is taller than the drawing.
  function fitScene() {
    const wrap = $('[data-wrap]'), svg = $('.dl-scene'), ov = $('[data-ov]');
    if (!wrap || !svg) return;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const vh = w ? Math.max(440, 1000 * h / w) : 440, extra = vh - 440, top = extra * .25;
    svg.setAttribute('viewBox', `0 ${(-top).toFixed(1)} 1000 ${vh.toFixed(1)}`);
    if (ov) { ov.style.top = (top / vh * 100) + '%'; ov.style.height = (440 / vh * 100) + '%'; }
  }

  function labHtml() {
    return `<div class="mlab-shell dl-shell is-${S.mode}">
      <header class="mlab-top">
        <div class="mlab-id"><span>DENTAL SCIENCE · LAB ${DENTAL.number}</span><b>${esc(DENTAL.title)}</b></div>
        <span class="mlab-mode-chip">${MODES[S.mode]}</span>
        <div class="mlab-who dl-who"><div class="dl-me"><b>You · Dental assistant</b><small data-wholoc></small></div></div>
        <div class="mlab-timer" data-timer aria-label="${S.learn ? 'Time elapsed' : 'Time remaining'}">${S.learn ? '0:00' : LIMIT}</div>
        <div class="mlab-top-actions"><button type="button" class="mlab-btn ghost" data-act="scenario">Scenario</button><button type="button" class="mlab-btn primary" data-act="finish">Finish &amp; grade</button></div>
      </header>
      <section class="mlab-coach" data-coach ${S.learn ? '' : 'hidden'} aria-live="polite"></section>
      <div class="mlab-stage" data-stage>
        <div class="mlab-scene-wrap" data-wrap>
          ${sceneSvg()}
          <div class="mlab-clock" data-clock></div>
          <div class="mlab-ov" data-ov>
            <div class="mlab-ptag dl-ptag" data-ptag></div>
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
          <div class="mlab-side-tabs" role="tablist"><button type="button" data-act="side" data-v="sheet">Rating sheet</button><button type="button" data-act="side" data-v="log">Action log</button><button type="button" data-act="side" data-v="pts">Patient</button></div>
          <div class="mlab-side-body" data-side></div>
        </aside>
      </div>
      <div class="mlab-modal" data-modal hidden></div>
    </div>`;
  }

  // ---------- logging, narration, judge ----------
  function record(type, d = {}, opt = {}) {
    const ev = {i: S.log.length, t: +now().toFixed(2), r: 1, type, d, say: opt.say ?? ''};
    S.log.push(ev);
    // Learn mode: a wrong choice is undone right away, before any narration.
    const st = step();
    if (st && st.ev === type && st.ok) {
      const bad = st.ok(ev);
      if (bad !== true) {
        S.log.pop();
        if (S.snap) Object.assign(S, S.snap);
        S.panel = null; renderPanel();
        coach('Not quite. ' + bad, 'warn'); updateAll(); return null;
      }
    }
    if (!opt.quiet && opt.say == null) {
      S.pending = ev; S.pauseAt = performance.now();
      const f = $('[data-narrate]'); f.hidden = false;
      $('[data-narr-label]').textContent = `You · ${ACT[type]?.[0] || type}`;
      const coachSay = st && st.ev === type && st.say;
      $('[data-narr-ex]').textContent = coachSay ? 'Coach: “' + coachSay + '”' : S.help && ACT[type]?.[1] ? 'Example: ' + ACT[type][1] : '';
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
    afterAction(ev);
    updateAll();
  }
  const PT_LINES = {greet: 'Good morning! Nice to meet you.', questions: 'Will Dr. Okafor look at the sensitive spot on my lower left tooth?', informChair: 'Okay, I’m ready.', warn: 'All right, I’ll wait.', postOp: 'Thank you! I’ll see you in six months.', assist: 'Thank you, that’s very kind.', seat: 'This chair is comfortable.'};
  function afterAction(ev) {
    const t = ev.type;
    if (TALK.has(t)) { const g = $('[data-s="op"]'); g?.classList.add('talk'); later(() => g?.classList.remove('talk'), 1600); }
    if (PT_LINES[t]) later(() => patientSays(PT_LINES[t]), 500);
    if (t === 'escortOffice') judge('remove', 'Mrs. Ruiz has checked out. Remove the surface barriers and clean up.');
    checkTreatment();
    if (S.help && !S.learn) feedback();
    learnCheck(ev);
  }
  function checkTreatment() {
    if (treated() || S.pt.loc !== 'chair' || S.op.gloves !== 'exam') return;
    later(() => {
      if (!S || treated()) return;
      judge('treatment', 'Dr. Okafor has finished the exam. Treatment is complete. Please dismiss the patient.');
      S.op.soiled = true; updateAll();
      if (S.learn) coach('The judge says treatment is complete. Time to dismiss Mrs. Ruiz.', 'ok');
    }, 900);
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
    b.innerHTML = `<span>MRS. RUIZ</span>${esc(text)}`; b.hidden = false; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    later(() => { if (b.textContent.endsWith(text)) b.hidden = true; }, 5000);
  }
  function hint(text, tone = '') { const h = $('[data-hint]'); if (!h) return; h.className = 'mlab-hint ' + tone; h.textContent = text; }
  function feedback() {
    const g = grade(S.log); const gained = [], misses = [];
    for (const sh of g.sheets) for (const it of sh.items) {
      if (it.earned && !S.earned.has(it.id)) { S.earned.add(it.id); gained.push(`+${it.pts} ${sh.id} #${it.n}`); }
      if (!it.earned && /narration did not mention/.test(it.note) && !S.earned.has('miss:' + it.id)) { S.earned.add('miss:' + it.id); misses.push(it.note.replace('Done, but your narration', 'Narration')); }
    }
    if (gained.length || misses.length) hint([gained.length ? 'Rating sheet: ' + gained.join(' · ') : '', misses[0] ? 'Tip: ' + misses[0] : ''].filter(Boolean).join('   '), misses.length && !gained.length ? 'warn' : 'ok');
  }

  // ---------- Learn mode coach ----------
  function coach(msg, tone = '') { S.coachMsg = msg; S.coachTone = tone; renderCoach(); }
  function learnCheck(ev) {
    const st = step(); if (!st || ev.type !== st.ev) return;
    const miss = (st.need || []).filter(([re]) => !re.test(ev.say || '')).map(n => n[1]);
    S.step++;
    const nx = step();
    if (S.panel && (!nx || nx.tool !== S.panel.id)) { S.panel = null; renderPanel(); }
    coach(miss.length ? `Step done. For full points, your words should include ${miss.join(' and ')}.` : `✓ ${st.title} — done.`, miss.length ? 'warn' : 'ok');
  }
  function renderCoach() {
    const c = $('[data-coach]'); if (!c || !S.learn) return;
    const st = step(), n = LEARN.length;
    const msg = S.coachMsg ? `<p class="coach-msg ${S.coachTone}">${esc(S.coachMsg)}</p>` : '';
    if (!st) { c.innerHTML = `<div class="coach-head"><span>LEARN · COMPLETE</span></div><div class="coach-prog"><i style="width:100%"></i></div><h3>You finished the whole station.</h3>${msg}<p class="coach-lead">You did every step on all three rating sheets. Grade the run to see your score, then try Practice mode without the coach.</p><div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="finishYes">See my rating sheet</button></div>`; return; }
    c.innerHTML = `<div class="coach-head"><span>LEARN · STEP ${S.step + 1} OF ${n} · ${esc(st.phase.toUpperCase())}</span></div>
      <div class="coach-prog"><i style="width:${S.step / n * 100}%"></i></div>
      <h3>${esc(st.title)}</h3>${msg}
      <div class="coach-grid"><p><b>Do</b>${esc(st.do)}</p><details class="coach-why" ${matchMedia('(max-width:640px)').matches ? '' : 'open'}><summary><b>Why</b></summary>${esc(st.why)}</details>${st.say ? `<p><b>Say</b>“${esc(st.say)}”</p>` : ''}</div>
      <div class="mlab-row"><button type="button" class="mlab-btn ghost small" data-act="showMe">Show me where</button></div>`;
  }
  function flashTarget() {
    const st = step(); if (!st) return;
    $('[data-wrap]')?.scrollIntoView({block: 'nearest', behavior: 'smooth'});
    const hots = st.hot ? $$(`[data-hot="${st.hot}"]`) : [];
    const panel = S.panel && st.tool === S.panel.id ? $('[data-panel]') : null;
    for (const h of [...hots, panel].filter(Boolean)) { h.classList.remove('flash'); void h.getBoundingClientRect(); h.classList.add('flash'); later(() => h.classList.remove('flash'), 1900); }
  }

  // ---------- gating ----------
  const notTreated = 'Wait until the judge says treatment is complete.';
  function gate(id) {
    const P = S.pt, O = S.op, R = S.room, C = S.chair;
    if (S.pending) return 'Log your narration first (or skip it).';
    if (S.done) return 'This run is finished.';
    switch (id) {
      case 'hygiene': if (O.gloves) return 'Take your gloves off first.'; break;
      case 'utilityCare': if (O.gloves !== 'utility') return 'Put on utility gloves first.'; break;
      case 'gown': if (O.gown) return 'Your gown is already on.'; if (O.gloves) return 'Gloves go on last. Take them off before the gown.'; break;
      case 'mask': if (O.mask) return 'Your mask is already on.'; if (O.gloves) return 'Gloves go on last. Take them off first.'; break;
      case 'eyewear': if (O.eyewear) return 'Your eyewear is already on.'; if (O.gloves) return 'Gloves go on last. Take them off first.'; break;
      case 'gloves': case 'utilityGloves': if (O.gloves) return 'You already have gloves on.'; break;
      case 'doff': if (!O.gown && !O.mask && !O.eyewear && !O.gloves) return 'You are not wearing any PPE.'; break;
      case 'barriers': if (R.barriers === 'on') return 'The barriers are already on.'; if (R.barriers !== 'none') return 'The barriers were already removed.'; if (P.loc === 'chair') return 'Barriers go on before the patient is seated.'; break;
      case 'checkBarriers': if (R.barriers !== 'on') return 'Place the barriers first.'; break;
      case 'removeBarriers': if (R.barriers !== 'on') return R.barriers === 'none' ? 'No barriers have been placed.' : 'The barriers are already off.'; if (P.loc === 'chair' || P.loc === 'room') return 'Wait until the patient has left.'; break;
      case 'discardBarriers': if (R.barriers !== 'removed') return R.barriers === 'discarded' ? 'Already discarded.' : 'Remove the barriers first.'; break;
      case 'prepChair': if (P.loc === 'chair') return 'The patient is already seated.'; if (treated()) return 'Treatment is complete.'; break;
      case 'tray': if (R.tray) return 'The tray is already set up.'; break;
      case 'review': if (!R.tray) return 'Set up the tray first.'; break;
      case 'greet': if (S.log.some(e => e.type === 'greet')) return 'You already greeted Mrs. Ruiz.'; if (P.loc === 'gone') return 'She has left.'; break;
      case 'escort': if (P.loc !== 'door') return 'She is already in the operatory.'; break;
      case 'items': if (P.loc === 'door') return 'Bring her into the operatory first.'; if (P.bag !== 'held') return P.bag === 'returned' ? 'Her handbag is back with her.' : 'Her handbag is already put away.'; break;
      case 'questions': if (P.loc === 'door' || P.loc === 'gone') return 'Talk with her in the operatory.'; break;
      case 'seat': if (P.loc === 'chair') return 'She is already seated.'; if (P.loc !== 'room') return 'Bring her into the operatory first.'; if (treated()) return 'Treatment is complete.'; break;
      case 'napkin': if (P.loc !== 'chair') return 'Seat the patient first.'; if (P.napkin !== 'none') return 'The napkin is already on.'; break;
      case 'informChair': if (P.loc !== 'chair') return 'Seat the patient first.'; break;
      case 'adjust': if (P.loc !== 'chair') return 'Seat the patient first.'; if (treated()) return 'Treatment is complete. Use Reset chair.'; break;
      case 'light': if (P.loc !== 'chair') return 'Seat the patient first.'; if (treated()) return 'Treatment is complete.'; if (R.light === 'chest') return 'The light is already on.'; break;
      case 'lightAway': if (!treated()) return notTreated; if (R.light === 'away') return 'The light is already out of the way.'; break;
      case 'warn': case 'reset': if (!treated()) return notTreated; if (P.loc !== 'chair') return 'She is no longer in the chair.'; if (id === 'reset' && S.log.some(e => e.type === 'reset')) return 'The chair is already reset.'; break;
      case 'bib': if (!treated()) return notTreated; if (P.napkin !== 'on') return P.napkin === 'none' ? 'No napkin was placed.' : 'The napkin is already off.'; break;
      case 'postOp': case 'records': if (!treated()) return notTreated; break;
      case 'release': if (!treated()) return notTreated; if (P.loc !== 'chair') return 'She is no longer in the chair.'; break;
      case 'assist': if (!treated()) return notTreated; if (P.loc !== 'chair') return 'She is no longer in the chair.'; if (C.back !== 'up') return 'Reset the chair to upright first.'; break;
      case 'escortOffice': if (P.loc === 'chair') return 'Help her out of the chair first.'; if (P.loc !== 'room' || !treated()) return P.loc === 'gone' ? 'She has already left.' : notTreated; break;
    }
    return null;
  }

  // ---------- tool actions ----------
  function useTool(id) {
    closeMenu();
    if (S.learn) {
      const st = step();
      if (!st) return hint('Lesson complete. Press “See my rating sheet”.', 'ok');
      if (id !== st.tool) { coach(`Follow the coach: this step is “${st.title}”. ${st.do}`, 'warn'); flashTarget(); return; }
    }
    const block = gate(id);
    if (block) { hint(block, 'warn'); if (S.learn) coach(block, 'warn'); return; }
    hint('');
    S.snap = snapshot();
    moveTo(NEED[id]);
    const O = S.op, P = S.pt, C = S.chair, R = S.room;
    if (SIMPLE.has(id)) {
      const d = {};
      if (id === 'escort') { P.loc = 'room'; }
      if (id === 'napkin') P.napkin = 'on';
      if (id === 'utilityGloves') { O.gloves = 'utility'; O.soiled = false; Object.assign(d, {wearing: {gown: O.gown, mask: O.mask, eyewear: O.eyewear}}); }
      if (id === 'lightAway') R.light = 'away';
      if (id === 'reset') { C.back = 'up'; C.low = true; }
      if (id === 'release') { C.armUp = true; C.path = true; }
      if (id === 'assist') { P.loc = 'room'; if (P.bag !== 'held') d.returned = P.bag; P.bag = 'held'; }
      if (id === 'escortOffice') { P.loc = 'gone'; }
      if (id === 'records' && O.gloves === 'exam' && S.help) hint('Careful: chart with clean hands, not contaminated gloves.', 'warn');
      return record(id, d);
    }
    openPanel(id);
  }
  function moveTo(loc) {
    if (!loc || S.op.loc === loc) return;
    S.op.loc = loc;
    record('move', {to: loc}, {quiet: true});
  }

  // ---------- scene menu + hover ----------
  function openMenu(key, x, y) {
    if (!S || S.done) return;
    if (S.pending) return hint('Log your narration first (or skip it).', 'warn');
    if (!HOTS[key]) return;
    S.menu = {key, x, y}; renderMenu();
  }
  function renderMenu() {
    const m = $('[data-menu]'); if (!m || !S.menu) return;
    const H = HOTS[S.menu.key], st = step();
    m.innerHTML = `<header><div><b>${esc(H.name)}</b><small>${esc(H.tip)}</small></div><button type="button" class="mlab-x" data-act="closeMenu" aria-label="Close">×</button></header>
      <div class="mlab-menu-list">${H.tools.map(id => {
        const [label, sub] = TOOL[id] || [ACT[id]?.[0] || id, ''];
        const why = gate(id);
        return `<button type="button" role="menuitem" class="${why ? 'off' : ''} ${st && st.tool === id ? 'coach' : ''}" data-tool="${id}"><b>${esc(label)}</b><small>${esc(why || sub)}</small></button>`;
      }).join('')}</div>`;
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
  function closeMenu() { if (!S) return; S.menu = null; const m = $('[data-menu]'); if (m) m.hidden = true; }
  function showTip(hot) {
    if (!S || S.menu) return;
    const key = hot.dataset.hot, H = HOTS[key]; if (!H) return;
    const tip = $('[data-tip]'), wrap = $('[data-wrap]').getBoundingClientRect(), b = hot.getBoundingClientRect();
    const st = step();
    tip.innerHTML = `<b>${esc(H.name)}</b><small>${esc(H.tip)}</small>${st && st.hot === key ? '<em>Next step is here</em>' : ''}`;
    tip.hidden = false;
    const w = tip.offsetWidth;
    tip.style.left = Math.max(6, Math.min(b.left - wrap.left + b.width / 2 - w / 2, wrap.width - w - 6)) + 'px';
    tip.style.top = Math.max(6, b.top - wrap.top - tip.offsetHeight - 8) + 'px';
  }
  function hideTip() { const t = $('[data-tip]'); if (t) t.hidden = true; }

  // ---------- panels ----------
  const qset = key => ({qs: QS[key], flip: QS[key].map(() => Math.random() < .5), ans: QS[key].map(() => null)});
  function openPanel(id) {
    S.panel = {id};
    const P = S.panel;
    if (['gown', 'mask', 'eyewear', 'greet', 'seat'].includes(id)) Object.assign(P, qset(id));
    if (id === 'gloves') Object.assign(P, qset('cuff'), {kind: null});
    if (id === 'barriers') Object.assign(P, {pick: {}, cover: null, orders: Object.fromEntries(SURFACES.map(([k, , o]) => [k, shuffle(o.map((t, i) => [String(i), BAR_SHORT[k]?.[i] || t]))]))});
    if (id === 'tray') Object.assign(P, {sel: new Set(), order: shuffle(TRAY_ITEMS)});
    if (id === 'prepChair') Object.assign(P, {on: new Set()});
    if (id === 'adjust') Object.assign(P, {speed: null, posn: null, dist: 20});
    if (id === 'removeBarriers') Object.assign(P, {tech: null, say: null});
    if (id === 'utilityCare') Object.assign(P, {on: new Set()});
    if (id === 'doff') {
      const O = S.op, worn = ['gloves', 'eyewear', 'mask', 'gown'].filter(k => k === 'gloves' ? O.gloves : O[k]);
      Object.assign(P, {left: shuffle(worn), seq: [], res: {}, cur: null, utility: O.gloves === 'utility'});
    }
    renderPanel();
    $('[data-panel]').scrollIntoView({block: 'nearest', behavior: 'smooth'});
  }
  function closePanel() {
    const P = S.panel;
    if (P?.id === 'doff' && P.seq.length && P.left.length) finishDoff(); // partial removal still counts as an attempt
    else { S.panel = null; renderPanel(); updateScene(); }
  }
  const pk = (name, v, star) => S.learn && (star != null ? star === v : PICK[name] === v) ? ' pick' : '';
  const choice = (name, opts, val, cls = '', star) => `<div class="mlab-choices ${cls}">${opts.map(([v, label]) => `<button type="button" class="mlab-choice ${val === v ? 'on' : ''}${pk(name, v, star)}" data-pset="${name}" data-v="${v}">${label}</button>`).join('')}</div>`;
  const toggles = (name, opts, set, picks) => `<div class="mlab-choices row">${opts.map(([v, label]) => `<button type="button" class="mlab-choice dl-tog ${set.has(v) ? 'on' : ''}${S.learn && picks.includes(v) ? ' pick' : ''}" data-tog="${name}" data-v="${v}" aria-pressed="${set.has(v)}">${label}</button>`).join('')}</div>`;
  // Two-option questions in random order; the right answer is v="1".
  const qHtml = (P, key = 'q') => P.qs.map((q, i) => { const opts = P.flip[i] ? [['1', q[1]], ['0', q[2]]] : [['0', q[2]], ['1', q[1]]]; return `<div class="mlab-q"><small>${esc(q[0])}</small><div class="mlab-choices">${opts.map(([v, t]) => `<button type="button" class="mlab-choice ${P.ans[i] === v ? 'on' : ''}${S.learn && v === '1' ? ' pick' : ''}" data-q="${key}" data-i="${i}" data-v="${v}">${esc(t)}</button>`).join('')}</div></div>`; }).join('');
  const allAns = P => P.ans.every(v => v != null);
  const done = (act, ok, label = 'Done') => `<div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="${act}" ${ok ? '' : 'disabled'}>${label}</button></div>`;

  function renderPanel() {
    const box = $('[data-panel]'), stage = $('[data-stage]');
    const P = S.panel;
    if (!P) { box.hidden = true; box.innerHTML = ''; stage.classList.remove('has-panel'); return; }
    box.hidden = false; stage.classList.add('has-panel');
    const tip = S.learn && PANEL_TIPS[P.id] ? `<div class="mlab-ptip"><b>Coach</b>${esc(PANEL_TIPS[P.id])}<small>★ marks the correct choice.</small></div>` : '';
    const head = (title, sub) => `<header><div><span>YOU · ${P.id === 'doff' || ['gown', 'mask', 'eyewear', 'gloves'].includes(P.id) ? 'PPE' : 'TOOL'}</span><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div><button type="button" class="mlab-x" data-act="closePanel" aria-label="Close tool">×</button></header>${tip}`;
    let html = '';
    switch (P.id) {
      case 'hygiene':
        html = head('Hand hygiene', 'How do you clean your hands?') + choice('method', [['wash', 'Wash with soap and water, then dry with a paper towel'], ['rub', 'Alcohol-based hand rub, rubbed in until dry'], ['rinse', 'Rinse with water only']], null);
        break;
      case 'barriers':
        html = head('Surface barriers', 'Choose the right cover for each surface.') +
          SURFACES.map(([k, label]) => `<label class="mlab-lbl">${esc(label)}</label>${choice('bar:' + k, P.orders[k], P.pick[k] ?? null, 'tri', '0')}`).join('') +
          `<label class="mlab-lbl">Coverage</label>${choice('cover', [['full', 'Cover each entire surface'], ['part', 'Cover only the spots you expect to touch']], P.cover, 'row')}` +
          done('barriersDone', SURFACES.every(([k]) => P.pick[k] != null) && P.cover, 'Place barriers');
        break;
      case 'prepChair':
        html = head('Ready the chair', 'Get the room ready for her to walk in and sit down. Pick everything you do.') +
          toggles('prep', [['low', 'Lower the chair'], ['armUp', 'Raise the armrest'], ['path', 'Move the stool and foot control out of the path'], ['recline', 'Recline the backrest']], P.on, ['low', 'armUp', 'path']) +
          done('prepDone', P.on.size);
        break;
      case 'tray':
        html = head('Instrument tray', 'Periodic oral evaluation (exam only). Pick what goes on the tray.') +
          toggles('tray', P.order, P.sel, TRAY_NEED) + `<p class="mlab-note">${P.sel.size} selected</p>` + done('trayDone', P.sel.size, 'Set the tray');
        break;
      case 'greet': html = head('Greet Mrs. Ruiz', 'She is waiting in the hallway.') + qHtml(P) + done('qDone', allAns(P), 'Greet her'); break;
      case 'items':
        html = head('Her handbag', 'Where do you put it?') + choice('place', [['shelf', 'In the cubby under the counter, where she can see it'], ['floor', 'On the floor next to the chair'], ['hall', 'Out in the hallway']], null);
        break;
      case 'seat': html = head('Seat the patient', 'Coach her into the chair.') + qHtml(P) + done('qDone', allAns(P), 'Seat her'); break;
      case 'adjust':
        html = head('Adjust the chair', 'Speed, position and your working distance.') +
          `<label class="mlab-lbl">1 · Speed</label>${choice('speed', [['slow', 'Slowly, so she stays comfortable'], ['fast', 'Quickly, to save time']], P.speed, 'row')}
          <label class="mlab-lbl">2 · Position for an oral exam</label>${choice('posn', [['supine', 'Supine (back nearly flat)'], ['semi', 'Semi-upright (about 45°)'], ['upright', 'Upright']], P.posn)}
          <label class="mlab-lbl" for="dl-dist">3 · Your face to hers <b data-distv>${P.dist} in</b></label>
          <div data-distsvg>${distSvg(P.dist, S.learn)}</div>
          <input id="dl-dist" type="range" min="6" max="24" step="1" value="${P.dist}" data-pin="dist">${S.learn ? '<div class="mlab-range-note">★ 12–14 in</div>' : ''}` +
          done('adjustDone', P.speed && P.posn, 'Move the chair');
        break;
      case 'light':
        html = head('Operating light', 'Turn it on and aim it.') + choice('pos', [['chest', 'Turn it on over her chest, then guide it up to her mouth'], ['eyes', 'Turn it on aimed straight at her face']], null);
        break;
      case 'gown': html = head('Gown', 'Goes on first.') + qHtml(P) + done('qDone', allAns(P), 'Put it on'); break;
      case 'mask': html = head('Mask', 'Goes on after the gown.') + qHtml(P) + done('qDone', allAns(P), 'Put it on'); break;
      case 'eyewear': html = head('Protective eyewear', 'Goes on after the mask.') + qHtml(P) + done('qDone', allAns(P), 'Put it on'); break;
      case 'gloves':
        html = head('Gloves', 'Last piece of PPE before patient care.') +
          `<label class="mlab-lbl">Glove type</label>${choice('kind', [['exam', 'Exam gloves (nitrile)'], ['utility', 'Utility gloves (heavy-duty)']], P.kind, 'row')}` + qHtml(P) + done('glovesDone', allAns(P) && P.kind, 'Put them on');
        break;
      case 'bib':
        html = head('Remove the napkin', 'Unclip the chain and fold the napkin inward. Where does it go?') + choice('bin', [['bio', 'Infectious waste (biohazard) container'], ['regular', 'Regular trash']], null, '', 'bio');
        break;
      case 'discardBarriers':
        html = head('Discard used barriers', 'This state treats used barriers as regular waste.') + choice('dbin', [['regular', 'Regular trash'], ['bio', 'Biohazard container']], null, '', 'regular');
        break;
      case 'removeBarriers':
        html = head('Remove the barriers', 'Take each cover off the headrest, light, controls, syringe, hoses and tray.') +
          `<label class="mlab-lbl">Technique</label>${choice('tech', [['careful', 'Peel each one off by its edge, folding the dirty side inward'], ['quick', 'Grab and pull them off fast, touching the surfaces underneath']], P.tech)}` +
          (P.tech === 'quick' ? `<label class="mlab-lbl">You touched the headrest</label>${choice('say', [['yes', 'Say: “I touched the headrest. It needs to be disinfected.”'], ['no', 'Keep going']], P.say)}` : '') +
          done('removeDone', P.tech && (P.tech === 'careful' || P.say), 'Remove them');
        break;
      case 'utilityCare':
        html = head('Clean utility gloves', 'They are reused, so clean them before you take them off. Pick each step.') +
          toggles('care', [['wash', 'Wash with soap and water'], ['disinfect', 'Spray with disinfectant'], ['dry', 'Dry with a paper towel']], P.on, ['wash', 'disinfect', 'dry']) + done('careDone', P.on.size);
        break;
      case 'doff': {
        const O = S.op;
        const qs = P.cur ? (P.cur === 'gloves' && P.utility ? DOFF_QS.utility : DOFF_QS[P.cur]) : null;
        html = head('Remove PPE', 'Pick the piece to take off next, then answer how.') +
          `<ol class="dl-doffseq">${['gloves', 'eyewear', 'mask', 'gown'].filter(k => P.seq.includes(k) || P.left.includes(k)).map(k => `<li class="${P.seq.includes(k) ? 'done' : P.cur === k ? 'cur' : ''}">${P.seq.includes(k) ? `<i>${P.seq.indexOf(k) + 1}</i>` : '<i></i>'}${PART_NAME[k]}${k === 'gloves' && P.utility ? ' (utility)' : ''}</li>`).join('')}</ol>` +
          (P.cur ? `<label class="mlab-lbl">${PART_NAME[P.cur]}</label>${qHtml(P.q)}<div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="doffPart" ${allAns(P.q) ? '' : 'disabled'}>Remove ${PART_NAME[P.cur].toLowerCase()}</button><button type="button" class="mlab-btn ghost" data-act="doffBack">Pick another</button></div>`
            : P.left.length ? `<label class="mlab-lbl">Take off next</label><div class="mlab-choices row">${P.left.map(k => `<button type="button" class="mlab-choice${S.learn && k === ['gloves', 'eyewear', 'mask', 'gown'].find(x => P.left.includes(x)) ? ' pick' : ''}" data-act="doffPick" data-v="${k}">${PART_NAME[k]}</button>`).join('')}</div>` : '') +
          `<p class="mlab-note">Still wearing: ${[O.gloves && (O.gloves === 'utility' ? 'utility gloves' : 'gloves'), O.eyewear && 'eyewear', O.mask && 'mask', O.gown && 'gown'].filter(Boolean).join(', ') || 'nothing'}</p>`;
        break;
      }
    }
    box.innerHTML = `<div class="mlab-panel-in">${html}</div>`;
  }

  function onPanelAct(a, t) {
    const P = S.panel, O = S.op, C = S.chair, R = S.room, Pt = S.pt;
    const close = () => { S.panel = null; renderPanel(); };
    switch (a) {
      case 'qDone': {
        const ok = P.ans.map(v => v === '1'); close();
        if (P.id === 'gown') { O.gown = true; return record('gown', {ok}); }
        if (P.id === 'mask') { O.mask = true; return record('mask', {ok}); }
        if (P.id === 'eyewear') { O.eyewear = true; return record('eyewear', {ok}); }
        if (P.id === 'greet') return record('greet', {courteous: ok[0], eye: ok[1], ok});
        if (P.id === 'seat') { Pt.loc = 'chair'; C.armUp = !ok[1]; C.path = true; return record('seat', {side: ok[0], arm: ok[1], slide: ok[2], ok}); }
        return;
      }
      case 'glovesDone': { const ok = P.ans.map(v => v === '1'); const kind = P.kind; close(); O.gloves = kind; O.soiled = false; return record('gloves', {kind, ok}); }
      case 'barriersDone': {
        const wrong = SURFACES.filter(([k]) => P.pick[k] !== '0').map(([, label]) => label), full = P.cover === 'full'; close();
        R.barriers = 'on'; return record('placeBarriers', {wrong, full});
      }
      case 'prepDone': {
        const d = {low: P.on.has('low'), armUp: P.on.has('armUp'), path: P.on.has('path'), recline: P.on.has('recline')}; d.ok = [d.low, d.armUp, d.path, !d.recline]; close();
        if (d.low) C.low = true; if (d.armUp) C.armUp = true; if (d.path) C.path = true; if (d.recline) C.back = 'semi';
        return record('prepChair', d);
      }
      case 'trayDone': {
        const sel = [...P.sel], missing = TRAY_NEED.filter(k => !P.sel.has(k)).map(k => TRAY_ITEMS.find(i => i[0] === k)[1]), extra = sel.filter(k => !TRAY_NEED.includes(k)).map(k => TRAY_ITEMS.find(i => i[0] === k)[1]); close();
        R.tray = true; return record('tray', {missing, extra});
      }
      case 'adjustDone': { const d = {slow: P.speed === 'slow', supine: P.posn === 'supine', dist: P.dist, pos: P.posn}; close(); C.back = P.posn === 'supine' ? 'supine' : P.posn === 'semi' ? 'semi' : 'up'; S.slowChair = d.slow; return record('adjust', d); }
      case 'removeDone': { const d = {careful: P.tech === 'careful', recognized: P.say === 'yes', utility: O.gloves === 'utility'}; close(); R.barriers = 'removed'; O.carry = true; return record('removeBarriers', d); }
      case 'careDone': { const d = {wash: P.on.has('wash'), disinfect: P.on.has('disinfect'), dry: P.on.has('dry')}; close(); return record('utilityCare', d); }
      case 'doffPick': P.cur = t.dataset.v; P.q = (k => ({qs: k, flip: k.map(() => Math.random() < .5), ans: k.map(() => null)}))(P.cur === 'gloves' && P.utility ? DOFF_QS.utility : DOFF_QS[P.cur]); return renderPanel();
      case 'doffBack': P.cur = null; return renderPanel();
      case 'doffPart': {
        const k = P.cur; P.res[k] = P.q.ans.map(v => v === '1'); P.seq.push(k); P.left = P.left.filter(x => x !== k); P.cur = null;
        if (k === 'gloves') { O.gloves = null; O.soiled = false; } else O[k] = false;
        updateScene();
        if (!P.left.length) return finishDoff();
        return renderPanel();
      }
    }
  }
  function finishDoff() {
    const P = S.panel, O = S.op;
    const complete = !O.gloves && !O.gown && !O.mask && !O.eyewear;
    const answers = Object.values(P.res).flat();
    const clean = answers.every(Boolean) && (!P.seq.includes('gloves') || P.seq[0] === 'gloves');
    const d = {seq: P.seq.slice(), ...P.res, complete, clean, utility: P.utility};
    S.panel = null; renderPanel();
    record('doff', d);
  }
  // Single-choice panels act as soon as you pick.
  function onPick(k, v) {
    const P = S.panel, O = S.op, R = S.room, Pt = S.pt;
    const close = () => { S.panel = null; renderPanel(); };
    if (k === 'method') { close(); return record('hygiene', {method: v}); }
    if (k === 'place') { close(); Pt.bag = v; return record('items', {place: v}); }
    if (k === 'pos') { close(); R.light = 'chest'; return record('light', {pos: v}); }
    if (k === 'bin') { close(); Pt.napkin = 'removed'; return record('bib', {bin: v}); }
    if (k === 'dbin') { close(); R.barriers = 'discarded'; O.carry = false; return record('discardBarriers', {bin: v}); }
    if (k.startsWith('bar:')) P.pick[k.slice(4)] = v;
    else P[k] = v;
    renderPanel();
  }

  // ---------- rendering ----------
  function updateScene() {
    const svg = $('.dl-scene'); if (!svg || !S) return;
    const O = S.op, Pt = S.pt, C = S.chair, R = S.room;
    const [x, f0] = LOCS[O.loc], face = O.loc === 'side' && Pt.loc !== 'chair' ? 1 : f0;
    const op = $('[data-s="op"]'); op.style.transform = `translate(${x}px,0px)`;
    op.querySelector('.dl-face').style.transform = `scaleX(${face})`;
    const oc = (c, on) => op.classList.toggle(c, !!on);
    oc('gowned', O.gown); oc('masked', O.mask); oc('eyes', O.eyewear); oc('gl-exam', O.gloves === 'exam'); oc('gl-utility', O.gloves === 'utility'); oc('soiled', O.soiled); oc('carry', O.carry);
    const say = $('[data-say]'); if (say) say.style.left = Math.max(8, Math.min(78, x / 10 - 6)) + '%';
    const pts = $('[data-s="pts"]'), standX = PT_X[Pt.loc] ?? PT_X.room;
    pts.style.transform = `translate(${standX}px,0px)`;
    pts.querySelector('.dl-face').style.transform = `scaleX(${Pt.loc === 'gone' ? 1 : -1})`;
    const t = (c, on) => svg.classList.toggle(c, !!on);
    t('pt-chair', Pt.loc === 'chair'); t('pt-gone', Pt.loc === 'gone');
    t('bag-held', Pt.bag === 'held'); t('bag-shelf', Pt.bag === 'shelf'); t('bag-floor', Pt.bag === 'floor'); t('bag-hall', Pt.bag === 'hall');
    t('napkin', Pt.napkin === 'on');
    t('chair-high', !C.low); t('arm-up', C.armUp); t('back-supine', C.back === 'supine'); t('back-semi', C.back === 'semi'); t('slow', S.slowChair !== false);
    t('bar-on', R.barriers === 'on'); t('tray-set', R.tray); t('light-on', R.light === 'chest');
    $('[data-s="stool"]').style.transform = `translate(${C.path ? 366 : 664}px,0px)`;
    $('[data-s="foot"]').style.transform = `translate(${C.path ? 588 : 640}px,0px)`;
    const L = {home: [566, 128], chest: [506, 234], away: [612, 92]}[R.light];
    $('[data-lhead]').style.transform = `translate(${L[0]}px,${L[1]}px)`;
    $('[data-larm]').setAttribute('d', `M520 62 Q${(520 + L[0]) / 2} ${Math.min(62, L[1]) - 10} ${L[0]} ${L[1] - 8}`);
    // Learn mode: outline what to click next.
    const st = step();
    $$('.ml-hot.target').forEach(h => h.classList.remove('target'));
    if (st?.hot && !(S.panel && st.tool === S.panel.id) && !S.pending) $$(`[data-hot="${st.hot}"]`).forEach(h => h.classList.add('target'));
    const tag = $('[data-ptag]');
    if (tag) {
      tag.innerHTML = `<b>Mrs. Ruiz</b>${{door: 'Waiting in the hallway', room: treated() ? 'Ready to leave' : 'In Operatory 2', chair: treated() ? 'Exam complete' : C.back === 'supine' ? 'Reclined for the exam' : 'Seated', gone: 'Checking out at the front desk'}[Pt.loc]}`;
      tag.style.left = (Pt.loc === 'chair' ? (C.back === 'up' ? 47 : 40) : Pt.loc === 'door' ? 78 : Pt.loc === 'gone' ? 78 : 62) + '%';
    }
  }
  function updatePhases() {
    const box = $('[data-phases]'); if (!box) return;
    const types = new Set(S.log.map(e => e.type));
    box.innerHTML = PHASES.map(([name, evs], i) => { const n = evs.filter(e => types.has(e)).length, p = n / evs.length; return `<li class="${p === 1 ? 'done' : p ? 'part' : ''}" style="--p:${p}"><i>${p === 1 ? '✓' : i + 1}</i><span>${name}</span></li>`; }).join('');
  }
  function updateTop() { const l = $('[data-wholoc]'); if (l) l.textContent = LOC_NAME[S.op.loc]; }
  function updateVitals() {
    const v = $('[data-vitals]'); if (!v) return; const O = S.op, R = S.room;
    const ppe = [O.gown && 'gown', O.mask && 'mask', O.eyewear && 'eyewear', O.gloves && (O.gloves === 'utility' ? 'utility gloves' : O.soiled ? 'used gloves' : 'exam gloves')].filter(Boolean);
    v.innerHTML = `<span class="vt"><small>YOUR PPE</small>${ppe.length ? esc(ppe.join(' · ')) : 'None'}</span>
      <span class="vt"><small>BARRIERS</small>${{none: 'Not placed', on: 'On', removed: 'Removed', discarded: 'Discarded'}[R.barriers]}</span>
      <span class="vt"><small>TREATMENT</small>${treated() ? 'Complete' : 'Not started'}</span>`;
  }
  function updateSide() {
    $$('.mlab-side-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.v === S.side));
    const box = $('[data-side]'); if (!box) return;
    const logRow = e => e.type === 'judge' ? `<li class="j"><time>${fmt(e.t)}</time><b>Judge</b> ${esc(e.d.text)}</li>` : `<li class="r1"><time>${fmt(e.t)}</time><b>You</b> ${esc(e.type === 'move' ? 'Moved: ' + LOC_NAME[e.d.to].toLowerCase() : ACT[e.type]?.[0] || e.type)}${e.say ? `<q>${esc(e.say)}</q>` : ''}</li>`;
    if (S.side === 'log') { box.innerHTML = S.log.length ? `<ol class="mlab-log">${S.log.slice().reverse().map(logRow).join('')}</ol>` : '<p class="mlab-empty">Actions you take appear here with your narration.</p>'; return; }
    if (S.side === 'pts') {
      const Pt = S.pt;
      box.innerHTML = `<div class="mlab-pt"><span>PATIENT</span><b>${esc(DENTAL.patient.name)}</b><small>${esc(DENTAL.patient.age)}</small><dl><dt>Visit</dt><dd>${esc(DENTAL.patient.visit)}</dd><dt>Dentist</dt><dd>Dr. Okafor</dd><dt>Handbag</dt><dd>${{held: 'With her', shelf: 'Counter cubby', floor: 'On the floor', hall: 'In the hallway'}[Pt.bag]}</dd><dt>Napkin</dt><dd>${{none: 'Not placed', on: 'On, with chain', removed: 'Removed'}[Pt.napkin]}</dd></dl></div>`;
      return;
    }
    if (!S.help) { box.innerHTML = `<div class="mlab-locked"><b>Rating sheet hidden</b><p>Graded runs work like competition: you see your scores after you finish.</p><p>${TOTAL} points across three sheets · ${Math.round(MASTERY * 100)}% mastery.</p></div>`; return; }
    const g = grade(S.log);
    box.innerHTML = `<div class="mlab-sheet-top"><div class="mlab-score"><b>${g.earned}</b><span>/ ${TOTAL} pts</span><div class="mlab-bar"><i style="width:${g.pct * 100}%"></i><em style="left:${MASTERY * 100}%"></em></div></div></div>
      <div class="mlab-sheets">${g.sheets.map(sh => `<details open><summary><b>${esc(sh.title)}</b><small>${esc(sh.who)} · ${sh.earned}/${sh.possible}</small></summary><ul class="mlab-sheet">${sh.items.map(it => `<li class="${it.earned ? 'ok' : ''}" ${it.earned ? '' : `title="${esc(it.note)}"`}><i>${it.earned ? '✓' : ''}</i><span>${esc(it.n)}</span><p>${esc(it.text)}</p><em>${it.pts}</em></li>`).join('')}</ul></details>`).join('')}</div>`;
  }
  function updateAll() { if (!S || !$('.mlab-shell')) return; updateScene(); updateTop(); updateVitals(); updatePhases(); updateSide(); renderCoach(); if (S.menu) renderMenu(); }

  function tick() {
    if (!S || S.done) return;
    const t = now(), left = DENTAL.limitSec - t;
    const tm = $('[data-timer]');
    if (tm) {
      tm.textContent = S.learn ? fmt(t) : left >= 0 ? fmt(left) : '+' + fmt(-left);
      tm.classList.toggle('low', !S.learn && left < 120); tm.classList.toggle('over', !S.learn && left < 0); tm.classList.toggle('paused', !!S.pauseAt);
    }
    const c = $('[data-clock]'); if (c) c.textContent = `${clock()} · Operatory 2`;
    if (S.mode === 'graded' && left <= 0) finish(true);
  }

  // ---------- modal, finish, report ----------
  function openModal(kind) {
    const m = $('[data-modal]'); if (!m) return;
    if (kind === 'scenario') m.innerHTML = `<div class="mlab-dialog scen" role="dialog" aria-label="Scenario"><span class="eyebrow">${S.learn ? 'SCENARIO · LEARN MODE' : 'SECRET SCENARIO · CLOCK RUNNING'}</span><h3>${esc(DENTAL.title)}</h3>${DENTAL.scenario.map(p => `<p>${esc(p)}</p>`).join('')}<dl><dt>Office</dt><dd>Lakeview Family Dental · Operatory 2</dd><dt>Patient</dt><dd>${esc(DENTAL.patient.name)}, ${esc(DENTAL.patient.age)}</dd><dt>Skills</dt><dd>${DENTAL.skills.map(esc).join('<br>')}</dd></dl>${S.learn ? '<p class="mlab-note">The coach above the scene tells you exactly what to click, why, and what to say. Gold outlines show where to click.</p>' : '<p class="mlab-note">Tip: hover over anything in the room to see what it is. Click it to act.</p>'}<div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="modalClose">${S.learn ? 'Start the lesson' : 'Begin'}</button></div></div>`;
    if (kind === 'finish') m.innerHTML = `<div class="mlab-dialog" role="dialog" aria-label="Finish"><h3>Finish and grade this run?</h3><p>You can’t add more actions after grading.${S.room.barriers === 'discarded' ? '' : ' The cleanup is not finished, so those steps will score zero.'}</p><div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="finishYes">Grade my run</button><button type="button" class="mlab-btn ghost" data-act="modalClose">Keep working</button></div></div>`;
    m.hidden = false; m.querySelector('button')?.focus();
  }
  function finish(timeUp) {
    if (!S || S.done) return; S.done = true;
    if (S.pending) { S.pending.say = $('[data-narrate] input')?.value || ''; S.pending = null; }
    if (S.pauseAt) { S.pausedMs += performance.now() - S.pauseAt; S.pauseAt = 0; }
    const secs = now(); stopAll();
    const g = grade(S.log);
    saveRun({mode: S.mode, earned: g.earned, pct: g.pct, secs, at: Date.now()});
    const log = S.log.filter(e => e.type !== 'move');
    screen.innerHTML = `<div class="mlab-report">
      <header><span class="eyebrow">${MODES[S.mode].toUpperCase()} RESULT · DENTAL SCIENCE LAB ${DENTAL.number}</span><h2>${esc(DENTAL.title)}</h2>${timeUp ? `<p class="mlab-timeup">Time! The ${LIMIT} limit ended the run.</p>` : ''}</header>
      <div class="mlab-result"><div class="ring" style="--p:${g.pct * 100}"><b>${Math.round(g.pct * 100)}%</b><small>${g.earned} / ${TOTAL}</small></div>
        <div><h3>${g.pass ? 'Mastery met' : 'Below mastery'}</h3><p>${g.pass ? 'You cleared the 70% mastery line HOSA uses for recognition.' : `You need ${(TOTAL * MASTERY).toFixed(1)} points (70%) for recognition. Review the missed steps below.`}${S.learn ? ' Next, try Practice mode without the coach.' : ''}</p><p class="mlab-note">Time used: ${fmt(secs)}${S.learn ? '' : ' of ' + LIMIT} · ${log.filter(e => e.say).length} narrated actions</p></div></div>
      ${g.sheets.map(sh => `<section class="mlab-rsheet"><header><b>${esc(sh.title)}</b><small>${esc(sh.who)}</small><span class="${sh.mastery ? 'ok' : 'no'}">${sh.earned} / ${sh.possible}</span></header>
        <table><thead><tr><th>#</th><th>Task</th><th>Possible</th><th>Awarded</th></tr></thead><tbody>${sh.items.map(it => `<tr class="${it.earned ? 'ok' : 'miss'}"><td>${esc(it.n)}</td><td>${esc(it.text)}${it.note ? `<small>${esc(it.note)}</small>` : ''}</td><td>${it.pts}</td><td>${it.earned}</td></tr>`).join('')}</tbody></table></section>`).join('')}
      <details class="mlab-rlog"><summary>Full action log (${log.length})</summary><ol class="mlab-log">${log.map(e => e.type === 'judge' ? `<li class="j"><time>${fmt(e.t)}</time><b>Judge</b> ${esc(e.d.text)}</li>` : `<li class="r1"><time>${fmt(e.t)}</time><b>You</b> ${esc(ACT[e.type]?.[0] || e.type)}${e.say ? `<q>${esc(e.say)}</q>` : ''}</li>`).join('')}</ol></details>
      <div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="again">Run the lab again</button></div></div>`;
    screen.scrollIntoView({block: 'start', behavior: 'smooth'});
  }
  function stopAll() { clearInterval(tickId); tickId = 0; for (const id of timers) clearTimeout(id); timers.clear(); }

  // ---------- events ----------
  function onClick(e) {
    const hot = e.target.closest('[data-hot]');
    if (hot && el.contains(hot)) { e.preventDefault(); return openMenu(hot.dataset.hot, e.clientX, e.clientY); }
    const t = e.target.closest('[data-act],[data-tool],[data-pset],[data-tog],[data-q]');
    if (S?.menu && !e.target.closest('[data-menu]')) closeMenu();
    if (!t || !el.contains(t)) return;
    if (t.dataset.tool) return useTool(t.dataset.tool);
    if (S?.pending && (t.dataset.pset || t.dataset.tog || t.dataset.q)) return hint('Log your narration first.', 'warn');
    if (t.dataset.pset) return onPick(t.dataset.pset, t.dataset.v);
    if (t.dataset.tog) { const P = S.panel, set = P.id === 'tray' ? P.sel : P.on; set.has(t.dataset.v) ? set.delete(t.dataset.v) : set.add(t.dataset.v); return renderPanel(); }
    if (t.dataset.q) { const P = S.panel, Q = t.dataset.q === 'q' && P.id !== 'doff' ? P : P.q; Q.ans[+t.dataset.i] = t.dataset.v; return renderPanel(); }
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
      case 'closePanel': closePanel(); break;
      case 'skipNarr': closeNarration(''); break;
      case 'useWords': { const st = step(), inp = $('[data-narrate] input'); if (st?.say && inp) { inp.value = st.say; inp.focus(); } break; }
      case 'showMe': flashTarget(); break;
      default: if (S?.panel && !S.pending) onPanelAct(a, t);
    }
  }
  function onSubmit(e) {
    if (!e.target.matches('[data-narrate]')) return; e.preventDefault();
    const text = e.target.querySelector('input').value;
    if (!text.trim()) return hint('Type what you say or do, or press Skip.', 'warn');
    closeNarration(text);
  }
  function onInput(e) {
    if (e.target.matches('[data-pin="dist"]') && S?.panel?.id === 'adjust') {
      S.panel.dist = +e.target.value;
      const v = $('[data-distv]'); if (v) v.textContent = S.panel.dist + ' in';
      const box = $('[data-distsvg]'); if (box) box.innerHTML = distSvg(S.panel.dist, S.learn);
    }
  }
  function onChange(e) {
    if (e.target.name === 'mlab-mode') { chosenMode = e.target.value; const b = $('[data-act="start"]'); b.disabled = false; b.textContent = `Start ${MODES[chosenMode].toLowerCase()} mode`; }
  }
  function onOver(e) { if (e.pointerType === 'touch') return; const hot = e.target.closest?.('[data-hot]'); if (hot && el.contains(hot)) showTip(hot); }
  function onOut(e) { const hot = e.target.closest?.('[data-hot]'); if (hot && !hot.contains(e.relatedTarget)) hideTip(); }
  function onKey(e) {
    if (!S || S.done || !$('.mlab-shell')) return;
    if (e.key === 'Escape') { if (S.menu) return closeMenu(); if (S.panel && !S.pending) return closePanel(); }
  }

  el.addEventListener('click', onClick); el.addEventListener('submit', onSubmit); el.addEventListener('input', onInput); el.addEventListener('change', onChange);
  el.addEventListener('pointerover', onOver); el.addEventListener('pointerout', onOut);
  document.addEventListener('keydown', onKey);
  showIntro();
  return () => { disposed = true; stopAll(); fitObs?.disconnect(); document.removeEventListener('keydown', onKey); };
}
