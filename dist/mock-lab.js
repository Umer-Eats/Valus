// Valus mock procedure lab: an interactive skills station graded against HOSA rating sheets.
// Lab 01 is CPR/First Aid. The student controls both rescuers and works in the scene itself:
// click a patient, the kit, the phone or the AED to see what you can do there.
// Modes: Learn (a coach teaches every step), Practice (live rating sheet), Graded (competition rules).
// After each action the student types what they say or do; grading reads that action log.
import {LAB, grade, PATTERNS as RX, reportScore, REPORT_GROUPS, TOTAL, MASTERY} from './mock-lab-cpr.js';
import {LEARN, PANEL_TIPS} from './mock-lab-learn.js';
import {DENTAL} from './mock-lab-dental-rubric.js';
import {mountDentalLab} from './mock-lab-dental.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Events with a working lab. Each event's page mounts its own lab.
export const hasMockLab = name => name === LAB.event || name === DENTAL.event;
export const mockLabPage = (name = LAB.event) => `<section class="mlab" data-mlab data-lab="${name === DENTAL.event ? 'dental' : 'cpr'}" aria-label="Mock procedure lab"><div data-mlab-screen></div></section>`;

const MODES = {learn: 'Learn', practice: 'Practice', graded: 'Graded'};

const ACT = {
  scene:['Survey the scene','“The scene is safe — I’m moving the broken glass away. We are following AHA guidelines.”'],
  kit:['Open first aid kit','“Opening the first aid kit.”'],
  gloves:['Put on gloves','“Putting on nitrile gloves.”'],
  eyes:['Put on eye protection','“Putting on eye protection.”'],
  glovesOff:['Remove gloves','“Removing my gloves without touching the outside with bare skin.”'],
  biohazard:['Biohazard bag','“Placing my gloves in the biohazard bag.”'],
  handrub:['Alcohol hand rub','“Using alcohol-based hand rub.”'],
  getAED:['Get the AED','“Running to the registration tent for the AED.”'],
  tapShout:['Tap and shout','“Sir, sir! Are you OK?”'],
  checkBP:['Breathing and pulse check','“Scanning the chest and feeling the carotid pulse for 5 to 10 seconds.”'],
  checkRB:['Responsiveness and breathing','“Are you OK? She is awake and breathing.”'],
  consent:['Introduce and ask consent','“Hi, my name is Sam, I’m a healthcare provider. May I help you?”'],
  assess:['Ask what happened','“What happened? I can see heavy bleeding from your right thigh.”'],
  medId:['Check for medical ID','“Checking her wrists and neck for medical ID jewelry.”'],
  shoutPartner:['Shout to partner','“Partner! Call 911 and get the AED!”'],
  respond:['Respond to partner','“OK! I’m calling 911 and I’ll bring the AED.”'],
  speak:['Speak','Anything you say out loud to the patient, your partner, or the judge.'],
  callSwitch:['Call for a switch','“Five cycles — switch!”'],
  surface:['Firm, flat surface','“He is face-up on firm, flat ground.”'],
  clothing:['Expose the chest','“Unzipping his jacket and moving it off the chest.”'],
  hands:['Hand position','“Heel of my hand on the center of the chest, lower half of the breastbone.”'],
  stack:['Stack second hand','“Other hand on top, fingers interlaced.”'],
  posture:['Arm posture','“Arms straight, shoulders directly over my hands.”'],
  compress:['30 chest compressions','“1, 2, 3, 4, 5 … 28, 29, 30.”'],
  pocketMask:['Pocket mask breaths','“Mask on using the bridge of the nose, sealing it, head tilt–chin lift, 2 breaths over 1 second each.”'],
  ecClamp:['E-C clamp seal','“At the head: head tilt, mask on the bridge of the nose, C on the mask, E lifting the jaw.”'],
  breaths:['Bag-mask breaths','“Squeezing the bag for 1 second each, watching for chest rise.”'],
  aedPower:['Open and power on AED','“Opening the case and powering on the AED.”'],
  removePatch:['Remove medication patch','“There’s a medication patch — removing it with my gloved hand and wiping the skin.”'],
  pads:['Apply AED pads','“Pads on the bare chest: upper right chest and left side below the armpit.”'],
  clearAnalyze:['Clear and analyze','“Everyone clear! Don’t touch the patient — the AED is analyzing.”'],
  shock:['Clear and shock','“I’m clear, you’re clear, everyone clear! Delivering shock.”'],
  call911:['Hang up 911 call','“The dispatcher said it’s OK to hang up.”'],
  dressing:['Gauze dressing','“Placing a gauze dressing on the wound.”'],
  pressure:['Direct pressure','“Firm, steady, constant direct pressure with my hands stacked.”'],
  tqPlace:['Place tourniquet','“Tourniquet 2 to 3 inches above the wound, not on the knee.”'],
  tqPull:['Pull strap tight','“Pulling the free end as tight as possible and securing it.”'],
  tqTwist:['Twist windlass','“Twisting the windlass until the bleeding stops.”'],
  tqSecure:['Secure windlass','“Securing the windlass in the clip.”'],
  noteTime:['Note tourniquet time','“Tourniquet applied at 4:16 PM.”'],
  layBack:['Lay on back','“I’m going to help you lie down on your back.”'],
  blanket:['Cover with blanket','“Covering you with a blanket to keep you warm.”'],
  emsReport:['EMS handoff report',''],
  move:['Move',''], auto:['CPR cycles',''], swap:['Switch positions',''], stopCpr:['Stop CPR','']
};

const TRAY = [
  ['PPE & scene', [['scene','Survey scene','Check for hazards'],['kit','First aid kit','Open the kit'],['gloves','Gloves','Put on gloves'],['eyes','Eye protection','Goggles on'],['glovesOff','Remove gloves','Doff safely'],['biohazard','Biohazard bag','Dispose of PPE'],['handrub','Hand rub','Alcohol-based']]],
  ['Move', [['mv:A-side','Kneel at Marcus’s side','For compressions'],['mv:A-head','Kneel at Marcus’s head','For breaths'],['mv:B','Go to Jordan','Bleeding patient'],['getAED','Get AED','Registration tent']]],
  ['Assess', [['tapShout','Tap & shout','Marcus'],['checkBP','Breathing & pulse','5–10 s check'],['checkRB','Responsive & breathing?','Jordan'],['consent','Introduce & consent','Jordan'],['assess','Ask what happened','Jordan'],['medId','Medical ID','Jewelry check']]],
  ['Communicate', [['speak','Speak','Say anything'],['shoutPartner','Shout to partner','Call for help'],['respond','Respond','Answer partner'],['phone','Phone · 911','Call EMS'],['callSwitch','Call switch','After 5 cycles'],['emsReport','EMS handoff','After EMS arrives']]],
  ['CPR', [['surface','Firm surface','Check the ground'],['clothing','Expose chest','Move the jacket'],['hands','Hand position','Choose the spot'],['stack','Stack 2nd hand','Heel on heel'],['posture','Arm posture','Straight arms'],['compress','Compressions','Tap 30 times'],['pocketMask','Pocket mask','2 breaths'],['ecClamp','Bag-mask','E-C clamp + squeeze'],['auto','Continue 30:2','Run cycles'],['stopCpr','Stop CPR','Pause cycles']]],
  ['AED', [['aed','AED station','Power · pads · analyze · shock']]],
  ['Bleeding', [['dressing','Gauze dressing','Cover the wound'],['pressure','Direct pressure','Firm · steady · constant'],['tourniquet','Tourniquet','Place · pull · twist · secure'],['layBack','Lay on back','Shock care'],['blanket','Blanket','Keep warm']]]
];
const TOOLINFO = Object.fromEntries(TRAY.flatMap(([, items]) => items.map(([id, label, sub]) => [id, [label, sub]])));

// Clickable things in the scene and the tools each one offers.
const HOTS = {
  glass: {name: 'Broken glass jug', tip: 'A hazard. Check the scene is safe.', tools: ['scene']},
  kit: {name: 'First aid kit', tip: 'PPE, gloves, biohazard bag, hand rub', tools: ['kit', 'gloves', 'eyes', 'glovesOff', 'biohazard', 'handrub']},
  phone: {name: 'Cell phone', tip: 'Call 911 · (555) 014-2290', tools: ['phone']},
  aChest: {name: 'Marcus · chest', tip: 'Responsiveness, exposing the chest, compressions', tools: ['tapShout', 'mv:A-side', 'clothing', 'hands', 'stack', 'posture', 'compress', 'auto', 'stopCpr']},
  aHead: {name: 'Marcus · head & neck', tip: 'Breathing and pulse check, rescue breaths', tools: ['checkBP', 'pocketMask', 'mv:A-head', 'ecClamp']},
  aGround: {name: 'Ground under Marcus', tip: 'Is he on a firm, flat surface?', tools: ['surface']},
  aedTent: {name: 'AED cabinet', tip: 'In the registration tent, 50 yards away', tools: ['getAED']},
  aedA: {name: 'AED', tip: 'Power on, pads, analyze, shock', tools: ['aed']},
  bLeg: {name: 'Jordan · right thigh wound', tip: 'Dressing, direct pressure, tourniquet', tools: ['dressing', 'pressure', 'tourniquet']},
  bBody: {name: 'Jordan · 16', tip: 'Talk to her, assess, treat for shock', tools: ['mv:B', 'checkRB', 'consent', 'assess', 'medId', 'layBack', 'blanket']},
  r1: {name: 'Rescuer 1', tip: 'Select and talk to your partner', tools: ['shoutPartner', 'respond', 'speak', 'callSwitch', 'stopCpr', 'emsReport']},
  r2: {name: 'Rescuer 2', tip: 'Select and talk to your partner', tools: ['respond', 'shoutPartner', 'speak', 'callSwitch', 'stopCpr', 'emsReport']},
  amb: {name: 'EMS crew', tip: 'Give your handoff report', tools: ['emsReport']}
};

// Procedure map shown under the scene. A phase fills as its actions are logged.
const PHASES = [
  ['Scene & PPE', ['scene', 'kit', 'gloves', 'eyes']],
  ['Assess', ['tapShout', 'shoutPartner', 'checkBP']],
  ['CPR', ['surface', 'clothing', 'hands', 'compress', 'pocketMask']],
  ['Bleeding', ['consent', 'dressing', 'pressure', 'tqPlace', 'tqTwist', 'noteTime', 'blanket']],
  ['911', ['call911']],
  ['AED', ['aedPower', 'pads', 'clearAnalyze', 'shock']],
  ['Team CPR', ['ecClamp', 'breaths', 'callSwitch', 'swap']],
  ['Handoff', ['emsReport', 'biohazard', 'handrub']]
];

// Coach picks for Learn mode, by panel choice name.
const PICK = {method: 'scan', fingers: 'two', recoil: 'full', orient: 'nose', technique: 'stack'};
const isPick = (name, v) => /^(seal|step)\d$/.test(name) ? v === '1' : PICK[name] === v;

const LOCS = {start1:[372,'stand',-1], 'A-side':[166,'kneel',1], 'A-head':[96,'kneel',1], 'A-aed':[312,'kneel',-1], B:[786,'kneel',1], tent:[905,'stand',-1]};
const LOC_NAME = {start1:'Standing by Marcus','A-side':'Marcus · side','A-head':'Marcus · head','A-aed':'Marcus · AED side',B:'With Jordan',tent:'Running for the AED'};
const AT_A = l => l === 'A-side' || l === 'A-head' || l === 'A-aed' || l === 'start1';
// Where a rescuer must be for a tool; the lab moves them there automatically.
const NEED = {tapShout:'A', checkBP:'A', surface:'A', clothing:'A', pocketMask:'A', aed:'A', hands:'A-side', stack:'A-side', posture:'A-side', compress:'A-side', ecClamp:'A-head', checkRB:'B', consent:'B', assess:'B', medId:'B', dressing:'B', pressure:'B', tourniquet:'B', layBack:'B', blanket:'B'};
const TALK = new Set(['tapShout', 'shoutPartner', 'respond', 'speak', 'callSwitch', 'consent', 'assess', 'checkRB', 'clearAnalyze', 'shock', 'emsReport']);
const fmt = s => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
const unquote = s => String(s || '').replace(/^[“"]|[”"]$/g, '');

function rescuerSvg(r) {
  return `<g class="ml-res r${r}" data-s="r${r}"><g class="ml-face">
    <g class="ml-kneel"><path class="ml-limb" d="M-20 382 L8 414 L-32 418"/><path class="ml-shoe-r" d="M-48 420 v-6 q0 -6 7 -6 h6 l4 6 v6z"/><path class="ml-sole" d="M-48 420 h17"/></g>
    <g class="ml-stand"><path class="ml-limb" d="M-14 372 L-18 413 M-4 372 L2 413"/><path class="ml-shoe-r" d="M-24 420 v-6 q0 -3 4 -3 h6 q7 0 8 9z M-4 420 v-6 q0 -3 4 -3 h6 q7 0 8 9z"/><path class="ml-sole" d="M-24 420 h18 M-4 420 h18"/></g>
    <g class="ml-upper">
      <g class="ml-armg back"><path class="ml-arm" d="M-6 337 L16 363"/><path class="ml-forearm" d="M16 363 L35 387"/><circle class="ml-hand" cx="35" cy="389" r="6"/></g>
      <path class="ml-torso" d="M-32 388 Q-35 346 -18 330 Q-6 324 5 328 Q14 336 12 352 Q11 370 8 388 Z"/>
      <path class="ml-shade" d="M-32 388 Q-34 344 -16 328 L-11 328 Q-24 352 -21 388Z"/>
      <rect class="ml-belt" x="-32" y="381" width="40" height="7" rx="2"/>
      <rect class="ml-neck" x="-9" y="317" width="9" height="13" rx="3"/>
      <path class="ml-collar" d="M-13 328 L-5 340 L3 328"/>
      <path class="ml-lanyard" d="M-11 331 L-6 349 L1 331"/>
      <rect class="ml-badge" x="-11" y="348" width="10" height="13" rx="1.5"/><rect class="ml-badge-top" x="-11" y="348" width="10" height="4" rx="1.5"/><path class="ml-badge-cross" d="M-6 355 v4 M-8 357 h4"/>
      ${r === 2 ? '<circle class="ml-hair" cx="-18" cy="298" r="6.5"/>' : ''}
      <circle class="ml-head" cx="-4" cy="308" r="14"/>
      <circle class="ml-ear" cx="-9" cy="309.5" r="3.6"/>
      <path class="ml-hair" d="${r === 1 ? 'M-18 307 Q-18 290 -2 292 Q10 293 10 303 Q2 297 -6 299 Q-10 303 -12 310 Z' : 'M-19 310 Q-20 291 -3 291 Q11 292 10 304 Q0 296 -8 300 Q-12 305 -12 312 Z'}"/>
      <circle class="ml-eye" cx="5" cy="306" r="1.7"/>
      <path class="ml-brow" d="M1.5 301.5 l6.5 -.6"/>
      <path class="ml-nose" d="M9.6 306.5 l3.6 4.2 l-3.6 .7"/>
      <path class="ml-mouth" d="M3 316 q3.2 1.6 6.4 -.4"/>
      <rect class="ml-goggle" x="0" y="301.5" width="13" height="7" rx="3"/><path class="ml-goggle-strap" d="M0 305 H-16"/>
      <rect class="ml-phone-held" x="7" y="300" width="7" height="13" rx="2"/>
      <g class="ml-talk"><path d="M18 298 q7 8 0 16"/><path d="M25 293 q12 13 0 26"/></g>
      <g class="ml-armg"><path class="ml-arm" d="M0 336 L21 362"/><path class="ml-forearm" d="M21 362 L40 386"/><path class="ml-cuff" d="M18.5 359 L24 364.5"/><circle class="ml-hand" cx="40" cy="388" r="6.5"/><path class="ml-thumb-r" d="M36 383.5 q-3 3 -1.5 6.5"/></g>
    </g></g>
    <g class="ml-tag"><circle cx="-4" cy="276" r="11"/><text x="-4" y="280">R${r}</text></g>
    <rect class="ml-hot hs-res" data-hot="r${r}" x="-36" y="262" width="66" height="112" rx="14"/></g>`;
}

// ---------- panel anatomy drawings ----------
// Front view of the neck for the pulse check. Zones: carotid groove, trachea, collarbone.
function neckSvg(site, learn) {
  const z = (v, x, y, w, h, pick) => `<rect class="nk-zone ${site === v ? 'on' : ''}${pick ? ' pick' : ''}" data-pset="site" data-v="${v}" x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/>`;
  return `<svg class="mlab-neck" viewBox="0 0 240 164" role="img" aria-label="Front of the patient's neck">
    <path class="nk-skin" d="M78 36 Q80 96 66 120 Q36 131 0 138 V164 H240 V138 Q204 131 174 120 Q160 96 162 36Z"/>
    <path class="nk-shade" d="M78 36 Q80 96 66 120 Q78 104 86 70Z M162 36 Q160 96 174 120 Q162 104 154 70Z"/>
    <path class="nk-delt" d="M0 150 Q20 140 44 140 M240 150 Q220 140 196 140"/>
    <path class="nk-skin" d="M50 0 V20 Q60 58 104 70 Q120 74 136 70 Q180 58 190 20 V0Z"/>
    <path class="nk-jaw" d="M50 20 Q60 58 104 70 Q120 74 136 70 Q180 58 190 20"/>
    <path class="nk-lip" d="M101 12 q19 8 38 0"/><path class="nk-lip soft" d="M110 52 q10 5 20 0"/>
    <path class="nk-muscle" d="M80 58 Q90 100 110 134 M160 58 Q150 100 130 134"/>
    <rect class="nk-trachea" x="109" y="78" width="22" height="56" rx="9"/>
    <path class="nk-rings" d="M111 106 h18 M111 113 h18 M111 120 h18 M111 127 h18"/>
    <path class="nk-thyroid" d="M106 80 Q120 73 134 80 L127 98 Q120 101 113 98Z"/><path class="nk-rings" d="M120 77 v6"/>
    <path class="nk-clav" d="M112 136 Q80 127 30 140 M128 136 Q160 127 210 140"/>
    <path class="nk-notch" d="M111 137 q9 7 18 0"/>
    ${learn ? '<path class="nk-artery" d="M96 66 Q98 98 104 126"/>' : ''}
    ${z('carotid', 86, 74, 22, 50, learn)}${z('trachea', 109, 76, 22, 52)}${z('clav', 142, 122, 54, 18)}
    <path class="nk-lead" d="M58 99 H86 M131 92 H182 M196 131 V118"/>
    <text class="ta-e" x="56" y="96">carotid</text><text class="ta-e" x="56" y="108">groove</text>
    <text class="ta-s" x="185" y="95">trachea</text><text class="ta-e" x="236" y="114">collarbone</text></svg>`;
}

// Front view of the chest, head at the top. Used for hand position and AED pads.
const TRUNK = 'M102 0 H138 V15 Q176 17 210 29 Q232 37 234 66 L230 122 Q222 176 202 230 H38 Q18 176 10 122 L6 66 Q8 37 30 29 Q64 17 102 15Z';
function chestSvg(inner, {jacket = false} = {}) {
  return `<svg class="mlab-torso" viewBox="0 0 240 250" role="img" aria-label="Patient's chest, head at the top">
    <path class="t-skin" d="${TRUNK}"/>
    <path class="t-shade" d="M6 66 Q8 37 30 29 Q16 50 18 92 L14 140 Q8 120 6 66Z M234 66 Q232 37 210 29 Q224 50 222 92 L226 140 Q232 120 234 66Z"/>
    <path class="t-line soft" d="M30 29 Q14 52 17 88 M210 29 Q226 52 223 88 M102 8 Q78 18 48 24 M138 8 Q162 18 192 24"/>
    <path class="t-bone" d="M112 31 Q82 25 42 35 M128 31 Q158 25 198 35"/>
    <path class="t-line" d="M111 31 q9 6 18 0"/>
    <path class="t-line" d="M40 66 Q42 100 70 112 Q98 120 112 106 M200 66 Q198 100 170 112 Q142 120 128 106"/>
    <path class="t-line soft" d="M40 66 Q30 76 30 96 M200 66 Q210 76 210 96"/>
    <path class="t-rib" d="M106 128 Q82 130 56 144 M106 140 Q86 144 62 160 M134 128 Q158 130 184 144 M134 140 Q154 144 178 160"/>
    <path class="t-line" d="M114 146 Q92 168 50 178 M126 146 Q148 168 190 178"/>
    <path class="t-sternum" d="M110 33 Q120 29 130 33 L129 58 L128 140 Q120 145 112 140 L111 58Z"/><path class="t-line soft" d="M111 58 h18"/>
    <path class="t-xiph" d="M113 141 L120 160 L127 141Z"/>
    <circle class="t-areola" cx="76" cy="100" r="5.5"/><circle class="t-nip" cx="76" cy="100" r="2.2"/><circle class="t-areola" cx="164" cy="100" r="5.5"/><circle class="t-nip" cx="164" cy="100" r="2.2"/>
    <path class="t-line soft" d="M120 164 V204"/><ellipse class="t-nip" cx="120" cy="214" rx="2.6" ry="3.6"/>
    ${jacket ? `<path class="t-jacket" d="${TRUNK}"/><path class="t-zip" d="M120 15 V230"/><text x="120" y="218" class="t-jtext">jacket over chest</text>` : ''}
    ${inner}
    <text x="120" y="246">patient’s chest · head at top</text></svg>`;
}

// Right thigh seen from above, knee on the left and hip on the right.
const LEG_X = {knee: 58, below: 112, onWound: 160, above: 212, hip: 294};
const legTop = x => x < 74 ? 46 : 46 - (x - 74) * 24 / 238, legBot = x => x < 74 ? 84 : 84 + (x - 74) * 22 / 238;
function legSvg(tq, zone, dressing, learn) {
  const zones = [['knee', 'on knee', 1], ['below', 'below wound', 0], ['onWound', 'on wound', 1], ['above', '2–3 in above', 0], ['hip', 'hip crease', 1]];
  let band = '';
  if (tq) { const x = LEG_X[zone], t = legTop(x) - 3, b = legBot(x) + 3, m = (t + b) / 2; band = `<rect class="lg-band" x="${x - 6}" y="${t}" width="12" height="${b - t}" rx="3"/><rect class="lg-buckle" x="${x - 5}" y="${m + 9}" width="10" height="7" rx="1.5"/><rect class="lg-rod" x="${x - 15}" y="${m - 3}" width="30" height="5" rx="2.5"/>`; }
  return `<svg class="mlab-leg" viewBox="0 -14 340 144" role="img" aria-label="Jordan's right thigh, knee on the left, hip on the right">
    <path class="lg-skin" d="M0 52 Q24 48 44 50 Q58 43 74 46 Q190 34 312 22 L312 106 Q190 98 74 84 Q58 87 44 80 Q24 82 0 78Z"/>
    <path class="lg-shade" d="M74 84 Q190 98 312 106 V94 Q190 88 80 77Z M0 78 Q24 82 44 80 L44 74 Q24 76 0 72Z"/>
    <path class="lg-line" d="M92 50 Q200 38 310 30 M86 66 Q200 60 310 62"/>
    <ellipse class="lg-knee" cx="58" cy="64" rx="12" ry="14"/><path class="lg-line" d="M46 55 q12 -6 24 0 M46 73 q12 6 24 0"/>
    <path class="lg-shorts" d="M312 20 Q326 18 340 17 V112 Q326 109 312 106Z"/><path class="lg-hem" d="M312 20 V106"/>
    <ellipse class="lg-wound" cx="160" cy="62" rx="14" ry="6"/><path class="lg-edge" d="M147 61 q13 -5 26 0"/>
    ${dressing ? '<rect class="lg-dress" x="143" y="51" width="34" height="22" rx="3"/><path class="lg-weave" d="M147 57 h26 M147 62 h26 M147 67 h26"/>' : ''}
    ${zones.map(([v, t, low]) => { const x = LEG_X[v]; return `<g class="lg-zone ${zone === v ? 'on' : ''}${learn && v === 'above' ? ' pick' : ''}" data-tqz="${v}"><rect x="${x - 12}" y="${legTop(x) - 7}" width="24" height="${legBot(x) - legTop(x) + 14}" rx="6"/><text x="${x}" y="${low ? 124 : -3}">${t}</text></g>`; }).join('')}
    ${band}</svg>`;
}

// Side view of a rescuer kneeling over the chest, for the posture choice.
function postureSvg(v) {
  const P = {good: {s: [56, 34], e: null, h: [62, 22]}, bent: {s: [46, 52], e: [70, 62], h: [52, 39]}, behind: {s: [32, 40], e: null, h: [38, 26]}}[v];
  const [sx, sy] = P.s, arm = P.e ? `M${sx} ${sy} L${P.e[0]} ${P.e[1]} L58 80` : `M${sx} ${sy} L58 80`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><path class="pc-ground" d="M0 96 H100"/>
    <path class="pc-pt" d="M34 96 V86 Q42 80 58 80 Q74 79 84 83 V96Z"/><path class="pc-pt" d="M84 90 h4 v6 h-4z"/><circle class="pc-pt" cx="93" cy="89" r="7"/>
    <path class="pc-leg" d="M6 92 H20 L24 66"/><path class="pc-torso" d="M24 66 L${sx} ${sy}"/>
    <path class="pc-arm" d="${arm}"/><ellipse class="pc-hand" cx="58" cy="80" rx="5" ry="3"/>
    <circle class="pc-head" cx="${P.h[0]}" cy="${P.h[1]}" r="8"/><path class="pc-hair" d="M${P.h[0] - 8} ${P.h[1]} a8 8 0 0 1 14 -5"/></svg>`;
}

const TREES = [[70, 236, 40], [128, 248, 30], [520, 232, 44], [584, 248, 30], [760, 236, 38], [812, 252, 24]];
// Extra lawn below the main scene, shown when the scene grows taller.
const TUFTS_FAR = Array.from({length: 60}, (_, i) => [(i * 211 + 37) % 980 + 10, 456 + Math.floor(i / 4) * 40 + (i * 17) % 20]);
const TUFTS = [[22, 352], [96, 436], [228, 344], [418, 362], [476, 432], [566, 356], [612, 430], [748, 350], [830, 436], [972, 338], [690, 398], [312, 372]];

function sceneSvg() {
  return `<svg class="ml-scene" viewBox="0 0 1000 440" role="img" aria-label="Lakeside Park finish area. Marcus lies on the grass past the finish arch. Jordan sits beside the water table with a bleeding leg. Click people and objects to act.">
  <defs><linearGradient id="mlSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ml-sky1"/><stop offset="1" class="ml-sky2"/></linearGradient>
  <linearGradient id="mlMylar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9edf2"/><stop offset=".5" stop-color="#b9c2cc"/><stop offset="1" stop-color="#d8b55a"/></linearGradient>
  <linearGradient id="mlLake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ml-lake1"/><stop offset="1" class="ml-lake2"/></linearGradient>
  <pattern id="mlCheck" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#f4f4f2"/><rect width="5" height="5" fill="#1d2026"/><rect x="5" y="5" width="5" height="5" fill="#1d2026"/></pattern></defs>
  <rect class="ml-skytop" y="-1200" width="1000" height="1201"/><rect width="1000" height="440" fill="url(#mlSky)"/>
  <circle class="ml-sun" cx="884" cy="58" r="22"/><circle class="ml-sun-halo" cx="884" cy="58" r="34"/>
  <g class="ml-clouds">${[[250, -70, .9], [820, -150, .7], [520, -240, .8], [90, -280, .6], [170, 58, 1], [600, 40, .8], [760, 104, .65], [380, 92, .55]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="10" rx="44" ry="11"/><circle cx="-14" cy="2" r="14"/><circle cx="8" cy="-4" r="18"/><circle cx="26" cy="4" r="11"/></g>`).join('')}</g>
  <g class="ml-birds"><path d="M300 70 q5 -5 10 0 q5 -5 10 0 M330 58 q4 -4 8 0 q4 -4 8 0 M680 120 q4 -4 8 0 q4 -4 8 0"/></g>
  <path class="ml-hills" d="M0 236 Q80 200 190 226 T420 220 T660 212 T1000 226 V246 H0Z"/>
  <rect class="ml-lake" y="238" width="1000" height="22" fill="url(#mlLake)"/>
  <path class="ml-ripple" d="M40 246 h24 M150 253 h16 M266 244 h30 M410 252 h18 M540 245 h24 M700 251 h28 M860 245 h20 M930 254 h16"/>
  <g class="ml-boat"><path class="hull" d="M436 249 h28 l-5 6 h-18z"/><path class="sail" d="M449 248 v-20 l11 18z"/><path class="sail2" d="M447 248 v-15 l-8 13z"/></g>
  <rect class="ml-bank" y="258" width="1000" height="34"/>
  <g class="ml-trees">${TREES.map(([x, y, r]) => `<rect class="ml-trunk" x="${x - 4}" y="${y + r * .55}" width="8" height="${292 - y - r * .55}" rx="2"/><circle class="c2" cx="${x + r * .25}" cy="${y + r * .1}" r="${r * .8}"/><circle class="c1" cx="${x - r * .15}" cy="${y - r * .05}" r="${r * .82}"/><circle class="c3" cx="${x - r * .3}" cy="${y - r * .3}" r="${r * .32}"/>`).join('')}</g>
  <g class="ml-lamp"><rect x="676" y="216" width="4" height="78"/><path d="M670 216 h16 l-3 -9 h-10z"/><circle class="bulb" cx="678" cy="219" r="2.5"/></g>
  <rect class="ml-road" y="292" width="1000" height="26"/><path class="ml-lane" d="M0 305 H1000"/><rect class="ml-curb" y="316" width="1000" height="4"/>
  <g class="ml-amb" data-s="amb">
    <rect class="body" x="0" y="262" width="88" height="42" rx="4"/><path class="cab" d="M88 270 h16 q10 0 14 12 v22 h-30z"/><path class="win" d="M93 274 h10 q6 0 9 8 h-19z"/>
    <rect class="stripe" x="0" y="288" width="118" height="5"/><text class="amb-t" x="44" y="300">AMBULANCE</text>
    <path class="star" d="M40 272 h6 v-5 h6 v5 h6 v6 h-6 v5 h-6 v-5 h-6z"/><path class="seam" d="M70 266 v22 M30 266 v22"/><rect class="rear" x="2" y="268" width="10" height="12" rx="1.5"/>
    <rect class="bar" x="14" y="256" width="66" height="6" rx="2"/><rect class="ml-amb-light l1" x="18" y="255" width="14" height="7" rx="2"/><rect class="ml-amb-light l2" x="62" y="255" width="14" height="7" rx="2"/>
    <rect class="bumper" x="-2" y="301" width="122" height="4" rx="2"/>
    <circle class="ml-wheel" cx="24" cy="306" r="8"/><circle class="hub" cx="24" cy="306" r="3"/><circle class="ml-wheel" cx="96" cy="306" r="8"/><circle class="hub" cx="96" cy="306" r="3"/>
    <rect class="ml-hot" data-hot="amb" x="-4" y="250" width="126" height="66" rx="10"/></g>
  <rect class="ml-ground" y="320" width="1000" height="1400"/>
  <path class="ml-ground-shade" d="M0 320 H1000 V330 Q500 336 0 330Z"/>
  <g class="ml-tufts">${TUFTS.map(([x, y]) => `<path d="M${x} ${y} l2 -7 l2 7 l3 -9 l2 9 l3 -6 l1 6"/>`).join('')}</g>
  <g class="ml-tufts">${TUFTS_FAR.map(([x, y]) => `<path d="M${x} ${y} l2 -7 l2 7 l3 -9 l2 9 l3 -6 l1 6"/>`).join('')}</g>
  <g class="ml-flowers">${TUFTS_FAR.filter((_, i) => i % 3 === 0).map(([x, y]) => `<circle cx="${(x + 61) % 980 + 10}" cy="${y + 14}" r="2.2"/><circle cx="${(x + 68) % 980 + 10}" cy="${y + 18}" r="1.8"/>`).join('')}</g>
  <g class="ml-flowers"><circle cx="40" cy="380" r="2.2"/><circle cx="47" cy="384" r="1.8"/><circle cx="548" cy="374" r="2"/><circle cx="962" cy="428" r="2.2"/><circle cx="954" cy="432" r="1.8"/></g>
  <rect class="ml-mat" x="41" y="320" width="411" height="10" fill="url(#mlCheck)"/>
  <g class="ml-arch">
    <rect class="post" x="30" y="118" width="11" height="212" rx="2"/><rect class="post" x="452" y="118" width="11" height="212" rx="2"/>
    <rect class="foot" x="24" y="324" width="23" height="7" rx="2"/><rect class="foot" x="446" y="324" width="23" height="7" rx="2"/>
    <rect class="ml-clockbox" x="196" y="80" width="102" height="26" rx="4"/><text class="ml-clocktxt" x="247" y="98">00:31:42</text><path class="post" d="M220 106 v4 M274 106 v4"/>
    <rect class="ml-banner" x="22" y="108" width="450" height="36" rx="5"/><rect class="ml-banner-edge" x="22" y="138" width="450" height="6" rx="2"/>
    <text x="247" y="132">FINISH · LAKESIDE 5K</text>
    <g class="ml-bunting">${Array.from({length: 20}, (_, i) => `<path class="f${i % 3}" d="M${46 + i * 20.5} 146 l10 0 l-5 11z"/>`).join('')}<path class="line" d="M41 146 H452"/></g>
    <g class="ml-balloons"><path class="str" d="M36 118 q-4 -14 -8 -26 M36 118 q2 -16 6 -30 M457 118 q-4 -14 -6 -28 M457 118 q4 -12 10 -24"/><ellipse class="b1" cx="27" cy="86" rx="8" ry="10"/><ellipse class="b2" cx="43" cy="82" rx="8" ry="10"/><ellipse class="b2" cx="450" cy="84" rx="8" ry="10"/><ellipse class="b1" cx="468" cy="88" rx="8" ry="10"/></g>
  </g>
  <g class="ml-barrier"><path d="M476 306 H590 M476 318 H590 M482 306 v24 M500 306 v12 M518 306 v12 M536 306 v12 M554 306 v12 M572 306 v12 M584 306 v24 M476 330 h14 M578 330 h14"/></g>
  <g class="ml-cone"><path class="c" d="M474 336 l7 -24 h4 l7 24z"/><path class="s" d="M477.5 326 h11 l-1 -4 h-9z"/><rect class="base" x="470" y="335" width="26" height="4" rx="1.5"/></g>
  <g class="ml-tent">
    <rect class="pole" x="840" y="232" width="4" height="96"/><rect class="pole" x="986" y="232" width="4" height="96"/>
    <rect class="wall" x="846" y="232" width="138" height="92"/>
    <path class="ml-tent-roof" d="M832 234 L912 194 L996 234 Z"/><path class="ml-tent-stripe" d="M872 214 L912 194 L952 214 Z"/>
    <path class="valance" d="M832 234 h164 v6 ${Array.from({length: 11}, (_, i) => `q-7.45 8 -14.9 0`).join(' ')} z"/>
    <text x="915" y="254">REGISTRATION</text>
    <rect class="tbl" x="852" y="294" width="82" height="6" rx="1.5"/><path class="cloth" d="M852 300 h82 v22 h-82z"/><text class="clothtxt" x="893" y="314">CHECK-IN</text>
    <rect class="clip" x="866" y="286" width="12" height="9" rx="1"/><rect class="box" x="900" y="282" width="20" height="13" rx="1.5"/><rect class="bottle" x="886" y="280" width="5" height="14" rx="2"/>
    <g data-s="aedTent" class="ml-aed-cab"><rect class="frame" x="942" y="264" width="34" height="42" rx="4"/><rect class="door" x="945" y="270" width="28" height="28" rx="2"/><path class="heart" d="M959 293 l-8 -8 a4.5 4.5 0 0 1 8 -5 a4.5 4.5 0 0 1 8 5z"/><path class="bolt" d="M960 279 l-4 7 h4 l-2 6 l6 -8 h-4 l2 -5z"/><rect class="glint" x="947" y="272" width="3" height="16" rx="1"/><text x="959" y="304">AED</text></g>
  </g>
  <g class="ml-table">
    <rect class="top" x="598" y="338" width="126" height="6" rx="2"/><path class="leg" d="M610 344 V386 M712 344 V386"/>
    <path class="cloth" d="M598 343 h126 v14 q-21 5 -42 0 q-21 5 -42 0 q-21 5 -42 0z"/><text class="clothtxt" x="661" y="353">WATER</text>
    <g class="jug"><rect x="614" y="312" width="24" height="26" rx="5"/><rect class="cap" x="620" y="307" width="12" height="6" rx="2"/><rect class="spig" x="636" y="328" width="6" height="4" rx="1"/><path class="lvl" d="M616 322 h20"/></g>
    <g class="jug"><rect x="648" y="318" width="20" height="20" rx="5"/><rect class="cap" x="652" y="313" width="12" height="6" rx="2"/><path class="lvl" d="M650 327 h16"/></g>
    <g class="cups"><path d="M680 338 l1.5 -10 h7 l1.5 10z M692 338 l1.5 -10 h7 l1.5 10z M704 338 l1.5 -10 h7 l1.5 10z M686 328 l1.5 -9 h7 l1.5 9z M698 328 l1.5 -9 h7 l1.5 9z"/></g>
    <g class="case"><rect x="622" y="372" width="36" height="14" rx="2"/><path d="M628 372 v-6 M636 372 v-6 M644 372 v-6 M652 372 v-6"/></g>
  </g>
  <g class="ml-glass" data-s="glass"><ellipse class="puddle" cx="742" cy="423" rx="34" ry="4"/><path d="M730 420 l8 -9 l5 9z M748 421 l4 -7 l7 7z M716 422 l10 -5 l2 5z M760 422 l3 -10 l6 10z"/><path class="neck" d="M774 421 q0 -10 8 -10 h4 v4 h-3 q-4 0 -4 6z"/></g>
  <g class="ml-kit" data-s="kit"><rect class="body" x="500" y="398" width="44" height="22" rx="4"/><path class="ml-kit-cross" d="M518 403h8v4h4v6h-4v4h-8v-4h-4v-6h4z"/><rect class="latch" x="503" y="400" width="5" height="4" rx="1"/><rect class="latch" x="536" y="400" width="5" height="4" rx="1"/>
    <g class="ml-kit-lid"><rect x="500" y="392" width="44" height="8" rx="3"/><path class="handle" d="M514 392 v-4 q0 -2 2 -2 h12 q2 0 2 2 v4"/></g>
    <g class="ml-kit-items"><rect class="gl" x="504" y="393" width="9" height="6" rx="1.5"/><rect class="gz" x="516" y="392" width="10" height="7" rx="1"/><rect class="bag" x="529" y="392" width="10" height="7" rx="1"/></g></g>
  <g class="ml-phoneobj"><rect x="554" y="404" width="11" height="17" rx="2.5"/><rect class="scr" x="556" y="406" width="7" height="11" rx="1"/><circle class="cam" cx="559.5" cy="419" r=".9"/></g>
  ${rescuerSvg(1)}${rescuerSvg(2)}
  <g class="ml-pa" data-s="pa">
    <ellipse class="ml-shadow" cx="290" cy="422" rx="178" ry="5"/>
    <path class="ml-legback" d="M300 403 Q336 396 370 400 Q402 399 432 403 L432 410 Q402 408 372 409 Q336 409 300 412Z"/>
    <path class="ml-leg" d="M298 400 Q334 395 364 401 Q372 396 382 400 Q408 402 432 405 L432 418 Q406 418 380 417 Q370 419 360 416 Q330 419 298 419Z"/>
    <path class="ml-knee" d="M364 401.5 q8 -5 17 -1"/><path class="ml-calf" d="M386 417 q22 1 42 -1 M318 417.5 q20 -1 38 -2"/>
    <rect class="ml-sock" x="428" y="402" width="12" height="16" rx="2"/>
    <g class="ml-shoe"><path class="up" d="M440 420 v-22 q0 -6 6 -6 h3 q8 0 9 10 l1 18z"/><path class="ml-sole" d="M457 400 v20"/><path class="ml-lace" d="M443 400 h6 M443 405 h7 M443 410 h7"/></g>
    <path class="ml-shorts" d="M252 419 V402 Q256 393 272 392 L306 395 Q316 398 317 406 L315 419Z"/><path class="ml-short-stripe" d="M258 397 Q280 394 312 398.5"/><path class="ml-short-hem" d="M311 397 Q316 408 314 419"/>
    <path class="ml-skin" d="M144 397 Q152 395 160 396 L161 419 L144 419Z"/><path class="ml-throat" d="M150 396.5 q4 1 7 0"/>
    <g class="ml-chest" data-s="chestA">
      <path class="ml-shirt" d="M156 419 V402 Q158 393 172 390 Q194 383 214 387 Q236 390 252 396 Q262 399 266 405 V419Z"/>
      <path class="ml-bare" d="M166 398 Q186 391 208 397 M214 395 q3 6 1 12 M224 396.5 q3 6 1 12 M234 398.5 q3 5 1 10 M162 404 q4 6 2 14"/><circle class="ml-bare-dot" cx="196" cy="387.6" r="1.6"/><circle class="ml-bare-dot" cx="252" cy="399.5" r="1.1"/>
      <rect class="ml-patch" x="167" y="387.5" width="13" height="7" rx="2"/>
      <g class="ml-pads"><rect class="ml-pad" x="166" y="384.5" width="18" height="8" rx="2"/><rect class="ml-pad" x="226" y="391" width="18" height="9" rx="2"/></g>
      <g class="ml-jacket"><g class="ml-jk-closed"><path class="jk" d="M153 419 V401 Q155 391 171 387.5 Q194 381 214 385 Q237 388 254 394 Q265 397.5 268.5 404 V419Z"/>
          <path class="col" d="M153 401 Q155 392 166 389"/><rect class="refl" x="153" y="407" width="115" height="3"/><path class="zip" d="M160 396 Q172 389 192 386 Q214 385 236 390 Q253 395 262 401"/><path class="fold" d="M178 404 q12 4 26 1 M226 403 q10 4 22 2"/>
          <g class="ml-bib"><rect x="194" y="391" width="34" height="13" rx="1.5"/><rect class="band" x="194" y="391" width="34" height="3.5" rx="1"/><text x="211" y="402.5">1427</text><circle cx="196.5" cy="397" r=".9"/><circle cx="225.5" cy="397" r=".9"/></g></g>
        <path class="ml-jk-open" d="M150 419 V409 Q156 403 168 405 L174 419Z"/><path class="ml-jk-open" d="M248 419 L252 405 Q264 400 272 407 V419Z"/></g>
    </g>
    <path class="ml-sleeve" d="M164 411 L204 414"/><path class="ml-arm-p" d="M204 414 L246 416"/><circle class="ml-elbow" cx="205" cy="414.5" r="1"/>
    <ellipse class="ml-skin" cx="252" cy="416" rx="6.5" ry="4.2"/><path class="ml-thumb" d="M249 412.5 q3 -4 7 -3"/><path class="ml-fingers" d="M254 418.5 h4 M255 416 h4.5"/>
    <rect class="ml-watch" x="232" y="411" width="8" height="10" rx="2"/><rect class="ml-watch-s" x="233.5" y="413" width="5" height="6" rx="1"/>
    <circle class="ml-skin" cx="134" cy="404" r="15"/><path class="ml-skin" d="M138 390.5 Q150 389 153 398 Q152 403 146 405Z"/><circle class="ml-ear-p" cx="131" cy="408" r="3.4"/><path class="ml-ear-in" d="M130 406.5 q2 1.5 0 3"/>
    <path class="ml-hair-p" d="M120 413 Q114 393 128 388 Q122 398 123 408 Q122 413 125 418Z"/>
    <path class="ml-nose-p" d="M134 390.5 q3 -8.5 9.5 -2.5 q-4 2.5 -9.5 2.5z"/><path class="ml-face-p" d="M124.5 394 q3 1.8 6 .2 M146 393.5 q3 1.6 5 1"/><path class="ml-brow-p" d="M123 390 q4 -2 7 -.5"/><path class="ml-jaw-p" d="M139 404 q8 0 12 -6"/>
    <path class="ml-pmask" d="M140 384 L154 392 L134 394 Z"/>
    <g class="ml-bvm"><path class="ml-pmask" d="M136 382 L156 392 L132 395 Z"/><rect x="104" y="356" width="40" height="18" rx="9" transform="rotate(-25 124 365)"/><path class="valve" d="M138 384 l6 -8" /></g>
    <g class="ml-aedA"><path class="ml-cable" d="M330 404 Q300 380 180 389 M330 404 Q300 386 236 391"/><rect class="ml-aed-box" x="318" y="396" width="38" height="24" rx="5"/><rect class="ml-aed-hdl" x="328" y="392" width="18" height="5" rx="2"/><rect class="ml-aed-scr" x="323" y="401" width="17" height="9" rx="2"/><path class="ml-aed-ecg" d="M324 406 h4 l2 -3 l2 6 l2 -3 h5"/><circle class="ml-aed-btn" cx="348" cy="410" r="4"/><path class="ml-aed-spk" d="M323 415 h2 M327 415 h2 M331 415 h2"/></g>
  </g>
  <g class="ml-pb" data-s="pb">
    <ellipse class="ml-pool" cx="806" cy="423" rx="18" ry="3.5"/>
    <path class="ml-legB2" d="M884 399 Q850 395 818 397.5 Q796 397 774 400 L774 407 Q796 405 818 405.5 Q850 404 884 408Z"/>
    <path class="ml-legB" d="M884 403 Q850 399 818 401.5 Q806 401 798 403.5 Q786 403 770 405.5 L770 416.5 Q786 417 798 417 Q808 419 818 417 Q850 420 884 420Z"/>
    <path class="ml-kneeB" d="M794 404 q7 -4 14 -1.5"/><path class="ml-calfB" d="M776 416.5 q10 1 20 0"/>
    <rect class="ml-sockB" x="762" y="404" width="10" height="16" rx="2"/>
    <g class="ml-shoeB"><path d="M762 420 v-22 q0 -6 -6 -6 h-2 q-7 0 -8 9 l-1 19z"/><path class="ml-sole" d="M746 401 v19"/><path class="ml-lace" d="M752 400 h7 M752 405 h7"/></g>
    <path class="ml-shortsB" d="M850 420 V405 Q853 398 866 397 L896 397 Q901 404 899 420Z"/><path class="ml-short-stripe" d="M854 401.5 Q870 400 895 400.5"/>
    <g class="ml-sit">
      <path class="ml-torsoB" d="M869 410 Q874 396 872 386 Q867 372 873 361 Q878 352 886 350 L898 350 Q905 357 904 373 Q905 394 902 410Z"/><path class="ml-shadeB" d="M898 350 Q905 357 904 373 Q905 394 902 410 L895 410 Q898 390 896 372 Q896 358 892 350Z"/>
      <path class="ml-bustB" d="M872 372 q4 9 12 8"/><path class="ml-waistB" d="M873 394 q12 3 26 1"/>
      <path class="ml-strap" d="M880 351 v8 M893 351 v8"/>
      <g class="ml-bib"><rect x="874" y="381" width="20" height="12" rx="1.5"/><rect class="band" x="874" y="381" width="20" height="3" rx="1"/><text x="884" y="391">882</text></g>
      <path class="ml-skin" d="M881 340 h9 l1 12 q-5 2 -11 0z"/><path class="ml-clavB" d="M876 353 q6 2 10 0"/>
      <path class="ml-hairB" d="M899 324 q16 2 12 24 q-5 -9 -14 -16z"/>
      <circle class="ml-skin" cx="886" cy="334" r="14"/><circle class="ml-ear-b" cx="891" cy="336" r="3.2"/><circle class="ml-earring" cx="891" cy="340.5" r="1.1"/>
      <path class="ml-hairB" d="M872 334 Q872 316 888 318 Q902 320 902 336 Q896 326 886 326 Q878 327 872 334Z"/><path class="ml-band" d="M874 327 Q887 318 900 325"/>
      <circle class="ml-eyeB" cx="878.5" cy="332" r="1.6"/><path class="ml-browB" d="M875 327.6 l6 -.4"/><path class="ml-noseB" d="M872.6 333 l-3.4 4.2 l3.4 .7"/><path class="ml-mouthB" d="M874 342 q3 1.5 6 0"/><path class="ml-tear" d="M879 335 q-1 3 0 5"/>
      <path class="ml-armB" d="M887 357 L871 383"/><path class="ml-armB fore" d="M871 383 L851 396"/><circle class="ml-skin" cx="871" cy="383" r="3.6"/>
      <ellipse class="ml-skin" cx="846" cy="398.5" rx="5.5" ry="3.8"/><path class="ml-fingersB" d="M842 401 h-3 M842 398.5 h-3.5"/>
      <circle class="ml-bracelet" cx="852" cy="396" r="3.5"/><rect class="ml-tagb" x="849" y="398.5" width="6" height="4" rx="1"/>
    </g>
    <g class="ml-lie">
      <path class="ml-torsoB2" d="M880 420 V403 Q885 396 900 396.5 Q918 396 931 391 Q946 389 955 398 V420Z"/>
      <path class="ml-shadeB" d="M880 420 V414 Q918 418 955 414 V420Z"/><path class="ml-bustB" d="M926 392.5 q2 6 9 6"/>
      <g class="ml-bib"><rect x="900" y="399" width="20" height="10" rx="1.5"/><rect class="band" x="900" y="399" width="20" height="2.5" rx="1"/><text x="910" y="407.5">882</text></g>
      <path class="ml-hairB" d="M974 420 q12 4 22 -2 q-8 -2 -12 -10z"/>
      <path class="ml-skin" d="M950 400 h11 v14 h-11z"/>
      <circle class="ml-skin" cx="970" cy="406" r="14"/><path class="ml-hairB" d="M978 418 Q990 404 980 394 Q986 406 974 416Z"/>
      <path class="ml-face-p" d="M962 397 q3 1.5 6 0 M971 392 q2 -5 6 -1"/>
      <path class="ml-armB" d="M947 411 L918 414"/><path class="ml-armB fore" d="M918 414 L893 416"/><ellipse class="ml-skin" cx="888" cy="416" rx="5.5" ry="3.6"/><circle class="ml-bracelet" cx="896" cy="416" r="3.2"/><rect class="ml-tagb" x="893" y="412" width="6" height="4" rx="1"/>
    </g>
    <g class="ml-wound"><ellipse cx="826" cy="404" rx="8" ry="3"/><path class="edge" d="M819 404 q7 -2 14 0"/><g class="ml-drops"><circle class="ml-drop d1" cx="824" cy="408" r="2.4"/><circle class="ml-drop d2" cx="829" cy="408" r="2"/><circle class="ml-drop d3" cx="820" cy="408" r="1.8"/></g></g>
    <g class="ml-dressing"><rect x="814" y="396" width="24" height="13" rx="2"/><path class="weave" d="M818 399 h16 M818 402.5 h16 M818 406 h16"/><circle class="stain" cx="826" cy="403" r="3.5"/></g>
    <g class="ml-tq"><rect class="strap" x="850" y="397.5" width="9" height="23" rx="2"/><rect class="tq-tag" x="851" y="411" width="7" height="5" rx="1"/><g class="ml-windlass"><rect x="842" y="394.5" width="25" height="4" rx="2"/></g></g>
    <path class="ml-blanket" d="M752 404 Q860 376 988 392 L988 421 L752 421 Z"/>
  </g>
  <g class="ml-hots">
    <rect class="ml-hot" data-hot="glass" x="706" y="402" width="70" height="26" rx="8"/>
    <rect class="ml-hot" data-hot="kit" x="494" y="384" width="54" height="40" rx="8"/>
    <rect class="ml-hot" data-hot="phone" x="550" y="398" width="20" height="28" rx="6"/>
    <rect class="ml-hot" data-hot="aGround" x="270" y="394" width="196" height="34" rx="10"/>
    <rect class="ml-hot" data-hot="aChest" x="160" y="376" width="106" height="46" rx="12"/>
    <rect class="ml-hot" data-hot="aHead" x="110" y="378" width="50" height="44" rx="14"/>
    <rect class="ml-hot hs-aedA" data-hot="aedA" x="314" y="388" width="46" height="36" rx="8"/>
    <rect class="ml-hot hs-aedTent" data-hot="aedTent" x="936" y="260" width="46" height="60" rx="8"/>
    <rect class="ml-hot hs-sit" data-hot="bBody" x="860" y="314" width="50" height="98" rx="14"/>
    <rect class="ml-hot hs-lie" data-hot="bBody" x="876" y="386" width="112" height="36" rx="12"/>
    <rect class="ml-hot" data-hot="bLeg" x="786" y="390" width="70" height="32" rx="10"/>
  </g>
  <rect class="ml-flash" y="-1200" width="1000" height="3000"/>
  </svg>`;
}

function introHtml(history) {
  const best = history.filter(h => h.mode === 'graded').sort((a, b) => b.earned - a.earned)[0];
  return `<div class="mlab-intro">
    <div class="mlab-intro-head"><span class="eyebrow">MOCK PROCEDURE · LAB ${LAB.number}</span><h2>CPR/First Aid skills station</h2><p>A full two-rescuer emergency, start to finish. The scene is your workspace: click a patient, the first aid kit, the phone or the AED to see what you can do there. You’re scored against the official HOSA rating sheets.</p></div>
    <div class="mlab-chart">
      <div><span>Skills on this station</span><ul>${LAB.skills.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
      <div><span>Team</span><b>2 rescuers</b><small>You control both. Click a rescuer, or press 1 and 2.</small></div>
      <div><span>Time</span><b>12:00</b><small>Starts when the scenario appears. Typing time is paused.</small></div>
      <div><span>Scoring</span><b>${TOTAL} points</b><small>${Math.round(MASTERY * 100)}% mastery = ${(TOTAL * MASTERY).toFixed(1)} points</small></div>
    </div>
    <ol class="mlab-how"><li><b>Read the secret scenario.</b> You see it when the clock starts, just like at competition.</li><li><b>Click to act.</b> Hover over anything in the scene to see what it is, then click it for its actions. Rescuers walk to the right spot on their own.</li><li><b>Say it out loud by typing.</b> After each action, type what you would say or do for the judge. Verbal steps only count if your words cover them.</li><li><b>Finish and hand off.</b> When EMS arrives, give your reports, remove PPE, and grade the run.</li></ol>
    <fieldset class="mlab-modes"><legend>How do you want to run this lab?</legend>
      <label><input type="radio" name="mlab-mode" value="learn"><span><em>Start here</em><b>Learn</b><small>A coach walks you through every step in order: what to click, why it matters, and what to say. Correct choices are marked. No time limit.</small></span></label>
      <label><input type="radio" name="mlab-mode" value="practice"><span><b>Practice</b><small>Do it yourself in any order with a live rating sheet, hints and example phrases. The clock keeps counting past 12:00.</small></span></label>
      <label><input type="radio" name="mlab-mode" value="graded"><span><b>Graded</b><small>Competition rules: hard 12:00 limit, rating sheet hidden, no hints. Scored when you finish or time runs out.</small></span></label>
    </fieldset>
    <div class="mlab-start-row"><button class="mlab-btn primary" type="button" data-act="start" disabled>Choose a mode to start</button>${best ? `<span class="mlab-best">Best graded run: <b>${best.earned}/${TOTAL}</b> (${Math.round(best.pct * 100)}%)</span>` : ''}</div>
    ${history.length ? `<div class="mlab-history"><span>Recent runs</span>${history.slice(-5).reverse().map(h => `<div><em>${MODES[h.mode] || h.mode}</em><b>${h.earned}/${TOTAL}</b><small>${Math.round(h.pct * 100)}% · ${fmt(h.secs)} · ${new Date(h.at).toLocaleDateString()}</small></div>`).join('')}</div>` : ''}
  </div>`;
}

export function mountMockLab(root) {
  const el = root.querySelector('[data-mlab]');
  if (!el) return () => {};
  if (el.dataset.lab === 'dental') return mountDentalLab(el);
  const screen = el.querySelector('[data-mlab-screen]');
  const storeKey = 'valus-mocklab-' + LAB.id;
  let S = null, disposed = false, tickId = 0, autoId = 0, raf = 0, pressId = 0, audio = null, metroId = 0, fitObs = null;
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!disposed) fn(); }, ms); timers.add(id); return id; };
  const $ = sel => el.querySelector(sel);
  const $$ = sel => [...el.querySelectorAll(sel)];
  const history = () => { try { return JSON.parse(localStorage.getItem(storeKey) || '[]'); } catch { return []; } };
  const saveRun = run => { try { const h = history(); h.push(run); localStorage.setItem(storeKey, JSON.stringify(h.slice(-20))); } catch {} };

  let chosenMode = null;
  const showIntro = () => { stopAll(); fitObs?.disconnect(); fitObs = null; S = null; chosenMode = null; screen.innerHTML = introHtml(history()); };

  // ---------- session ----------
  function fresh(mode) {
    return {
      mode, learn: mode === 'learn', practice: mode === 'practice', help: mode !== 'graded',
      t0: performance.now(), pausedMs: 0, pauseAt: 0, log: [], active: 1, pending: null, step: 0, coachMsg: '', coachTone: '',
      r: {1: {loc: 'start1', gloves: 'off', eyes: false, hands: null, stack: false, posture: null, sealed: false},
          2: {loc: 'B', gloves: 'off', eyes: false, hands: null, stack: false, posture: null, sealed: false}},
      A: {status: 'Not yet assessed', exposed: false, patch: true, pads: false, aed: 'tent', on: false, stage: 'off', shocks: 0, kit: false},
      B: {bleed: 3, dressing: false, pressured: false, tq: null, supine: false, blanket: false, found: {}},
      auto: null, twoCycles: 0, switchAt: 0, ems: false, judged: {}, panel: null, menu: null, tab: 0, side: 'sheet', earned: new Set(), call: null, done: false
    };
  }
  const now = () => S ? Math.max(0, (performance.now() - S.t0 - S.pausedMs - (S.pauseAt ? performance.now() - S.pauseAt : 0)) / 1000) : 0;
  const clock = () => { const m = LAB.startClock.h * 60 + LAB.startClock.m + Math.floor(now() / 60); const h = Math.floor(m / 60), mm = m % 60; return `${(h + 11) % 12 + 1}:${String(mm).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
  const step = () => S?.learn ? LEARN[S.step] : null;

  function start(mode) {
    S = fresh(mode);
    screen.innerHTML = labHtml();
    openModal('scenario');
    tickId = setInterval(tick, 250);
    if (S.learn) { S.coachMsg = 'Welcome! Follow the coach one step at a time. Glowing gold outlines show what to click.'; S.coachTone = 'ok'; syncStep(); }
    const svg = $('.ml-scene'); svg.classList.add('ml-noanim');
    fitObs?.disconnect();
    if (window.ResizeObserver) { fitObs = new ResizeObserver(fitScene); fitObs.observe($('[data-wrap]')); }
    fitScene();
    updateAll();
    requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.remove('ml-noanim')));
  }

  // When the tool panel is taller than the drawing, show more sky and grass
  // instead of leaving a gap. Overlays stay pinned to the original 1000×440 area.
  function fitScene() {
    const wrap = $('[data-wrap]'), svg = $('.ml-scene'), ov = $('[data-ov]');
    if (!wrap || !svg) return;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const vh = w ? Math.max(440, 1000 * h / w) : 440, extra = vh - 440, top = extra * .3;
    svg.setAttribute('viewBox', `0 ${(-top).toFixed(1)} 1000 ${vh.toFixed(1)}`);
    if (ov) { ov.style.top = (top / vh * 100) + '%'; ov.style.height = (440 / vh * 100) + '%'; }
  }

  function labHtml() {
    return `<div class="mlab-shell is-${S.mode}">
      <header class="mlab-top">
        <div class="mlab-id"><span>MOCK PROCEDURE · LAB ${LAB.number}</span><b>${esc(LAB.title)}</b></div>
        <span class="mlab-mode-chip">${MODES[S.mode]}</span>
        <div class="mlab-who" role="group" aria-label="Active rescuer">${[1, 2].map(r => `<button type="button" class="r${r}" data-act="who" data-r="${r}"><b>Rescuer ${r}</b><small data-wholoc="${r}"></small></button>`).join('')}</div>
        <div class="mlab-timer" data-timer aria-label="${S.learn ? 'Time elapsed' : 'Time remaining'}">${S.learn ? '0:00' : '12:00'}</div>
        <div class="mlab-top-actions"><button type="button" class="mlab-btn ghost" data-act="scenario">Scenario</button><button type="button" class="mlab-btn primary" data-act="finish">Finish &amp; grade</button></div>
      </header>
      <section class="mlab-coach" data-coach ${S.learn ? '' : 'hidden'} aria-live="polite"></section>
      <div class="mlab-stage" data-stage>
        <div class="mlab-scene-wrap" data-wrap>
          ${sceneSvg()}
          <div class="mlab-clock" data-clock></div>
          <div class="mlab-cycles" data-cycles hidden></div>
          <div class="mlab-ov" data-ov>
            <div class="mlab-ptag a" data-ptag="A"></div><div class="mlab-ptag b" data-ptag="B"></div>
            <div class="mlab-say r1" data-say="1" hidden></div><div class="mlab-say r2" data-say="2" hidden></div>
            <div class="mlab-bubble patient" data-pbubble hidden></div>
          </div>
          <div class="mlab-bubble judge" data-judge hidden></div>
          <div class="mlab-switch" data-switch hidden><span>Switch called</span><b data-switch-t>0.0 s</b><button type="button" class="mlab-btn primary" data-act="swap">Swap positions</button></div>
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
          <div class="mlab-side-tabs" role="tablist"><button type="button" data-act="side" data-v="sheet">Rating sheet</button><button type="button" data-act="side" data-v="log">Action log</button><button type="button" data-act="side" data-v="pts">Patients</button></div>
          <div class="mlab-side-body" data-side></div>
        </aside>
      </div>
      <div class="mlab-modal" data-modal hidden></div>
    </div>`;
  }

  // ---------- logging, narration, judge ----------
  function record(type, r, d = {}, opt = {}) {
    const ev = {i: S.log.length, t: +now().toFixed(2), r, type, d, say: opt.say ?? ''};
    S.log.push(ev);
    if (!opt.quiet && opt.say == null) {
      S.pending = ev; S.pauseAt = performance.now();
      const f = $('[data-narrate]'); f.hidden = false;
      $('[data-narr-label]').textContent = `Rescuer ${r} · ${ACT[type]?.[0] || type}`;
      const st = step(), coachSay = st && st.ev === type && st.say;
      $('[data-narr-ex]').textContent = coachSay ? 'Coach: “' + coachSay + '”' : S.help && ACT[type]?.[1] ? 'Example: ' + ACT[type][1] : '';
      $('[data-act="useWords"]').hidden = !coachSay;
      const input = f.querySelector('input'); input.value = ''; input.placeholder = type === 'compress' ? 'Count aloud…' : 'What do you say or do?';
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
    if (ev.say) sayBubble(ev.r, ev.say);
    if (ev.type === 'callSwitch') { S.switchAt = performance.now(); $('[data-switch]').hidden = false; }
    afterAction(ev);
    updateAll();
  }
  function afterAction(ev) {
    const t = ev.type;
    if (TALK.has(t) && ev.r) { const g = $(`[data-s="r${ev.r}"]`); g?.classList.add('talk'); later(() => g?.classList.remove('talk'), 1600); }
    if (t === 'tapShout') { const p = $('[data-s="pa"]'); p?.classList.add('shake'); later(() => p?.classList.remove('shake'), 700); judge('unresp', 'Patient is not responsive.'); S.A.status = 'Unresponsive'; }
    if (t === 'checkBP') { judge('nobp', 'Not breathing. No pulse.'); S.A.status = 'No breathing · no pulse'; }
    if (t === 'checkRB') patientSays('I’m awake… my leg! It won’t stop bleeding!');
    if (t === 'consent') { patientSays('Yes — please help me.'); judge('consent', 'Patient consents to treatment.'); }
    if (t === 'assess') patientSays('I slipped and knelt right on the broken water jug.');
    if (t === 'medId') { S.B.found.medId = true; patientSays('Medical ID bracelet: ASTHMA · uses albuterol inhaler.'); }
    if (t === 'pressure') judge('delayed', 'Wound is still bleeding and EMS has been delayed.');
    if (t === 'compress' && !S.auto) S.A.status = 'CPR in progress';
    if (S.help && !S.learn) feedback();
    learnCheck(ev);
    checkEms();
  }
  function sayBubble(r, text) {
    const b = $(`[data-say="${r}"]`); if (!b) return;
    b.textContent = text.length > 110 ? text.slice(0, 107) + '…' : text; b.hidden = false; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    clearTimeout(b._t); b._t = later(() => { b.hidden = true; }, 4200);
  }
  function judge(key, text) {
    if (S.judged[key]) return; S.judged[key] = true;
    S.log.push({i: S.log.length, t: +now().toFixed(2), r: 0, type: 'judge', d: {key, text}, say: ''});
    const b = $('[data-judge]'); b.innerHTML = `<span>JUDGE</span>${esc(text)}`; b.hidden = false; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    later(() => { if (b.textContent.endsWith(text)) b.hidden = true; }, 6000);
  }
  function patientSays(text) {
    const b = $('[data-pbubble]'); b.innerHTML = `<span>JORDAN</span>${esc(text)}`; b.hidden = false; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    later(() => { if (b.textContent.endsWith(text)) b.hidden = true; }, 5500);
  }
  function hint(text, tone = '') { const h = $('[data-hint]'); if (!h) return; h.className = 'mlab-hint ' + tone; h.textContent = text; }
  function feedback() {
    const g = grade(S.log); const gained = [], misses = [];
    for (const sh of g.sheets) for (const it of sh.items) {
      if (it.earned && !S.earned.has(it.id)) { S.earned.add(it.id); gained.push(`+${it.pts} ${sh.id.replace('IIA', 'II-A').replace('IIB', 'II-B')} #${it.n}`); }
      if (!it.earned && /narration did not mention/.test(it.note) && !S.earned.has('miss:' + it.id)) { S.earned.add('miss:' + it.id); misses.push(it.note.replace('Done, but your narration', 'Narration')); }
    }
    if (gained.length || misses.length) hint([gained.length ? 'Rating sheet: ' + gained.join(' · ') : '', misses[0] ? 'Tip: ' + misses[0] : ''].filter(Boolean).join('   '), misses.length && !gained.length ? 'warn' : 'ok');
  }
  function checkEms() {
    if (S.ems) return;
    const sw = S.log.find(e => e.type === 'swap');
    const ok = sw && S.log.some(e => e.r === 1 && e.type === 'compress' && e.i > sw.i) && S.log.some(e => e.r === 2 && e.type === 'breaths' && e.i > sw.i);
    if (ok || (!S.learn && now() > 630)) emsArrives();
  }
  function emsArrives() {
    S.ems = true; stopAuto(); judge('ems', 'EMS has arrived and has taken over care of the patient.');
    S.A.status = 'Care handed to EMS';
    hint('EMS is here. Click the ambulance to give both handoff reports, then remove gloves, bag PPE and use hand rub for each rescuer.', 'ok');
  }

  // ---------- Learn mode coach ----------
  function coach(msg, tone = '') { S.coachMsg = msg; S.coachTone = tone; renderCoach(); }
  function syncStep() {
    const st = step(); if (!st) return;
    S.active = st.r || S.active;
  }
  function learnCheck(ev) {
    const st = step(); if (!st || ev.type !== st.ev || (st.r && ev.r !== st.r) || (st.match && !st.match(ev))) return;
    const bad = st.ok ? st.ok(ev) : true;
    if (bad !== true) { st.reset?.(S, ev); if (S.panel) renderPanel(); coach('Not quite. ' + bad, 'warn'); return; }
    const miss = (st.need || []).filter(([re]) => !re.test(ev.say || '')).map(n => n[1]);
    S.step++;
    const nx = step();
    if (S.panel && (!nx || nx.tool !== S.panel.id)) { if (S.panel.id === 'pressure') stopPressure(false); cancelAnimationFrame(raf); stopMetro(); S.panel = null; renderPanel(); }
    coach(miss.length ? `Step done. For full points, your words should include ${miss.join(' and ')}.` : `✓ ${st.title} — done.`, miss.length ? 'warn' : 'ok');
    syncStep();
  }
  function renderCoach() {
    const c = $('[data-coach]'); if (!c || !S.learn) return;
    const st = step(), n = LEARN.length;
    const msg = S.coachMsg ? `<p class="coach-msg ${S.coachTone}">${esc(S.coachMsg)}</p>` : '';
    if (!st) { c.innerHTML = `<div class="coach-head"><span>LEARN · COMPLETE</span></div><div class="coach-prog"><i style="width:100%"></i></div><h3>You finished the whole procedure.</h3>${msg}<p class="coach-lead">You did every step on both rating sheets. Grade the run to see your score, then try Practice mode without the coach.</p><div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="finishYes">See my rating sheet</button></div>`; return; }
    c.innerHTML = `<div class="coach-head"><span>LEARN · STEP ${S.step + 1} OF ${n} · ${esc(st.phase.toUpperCase())}</span><b class="r${st.r}">Rescuer ${st.r}</b></div>
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
    const sw = st.ev === 'swap' ? $('[data-switch]') : null;
    for (const h of [...hots, panel, sw].filter(Boolean)) { h.classList.remove('flash'); void h.getBoundingClientRect(); h.classList.add('flash'); later(() => h.classList.remove('flash'), 1900); }
  }

  // ---------- auto CPR cycles ----------
  const inCpr = r => !!S.auto && (S.auto.comp === r || S.auto.vent === r);
  function startAuto() {
    const comp = [1, 2].find(r => S.r[r].loc === 'A-side');
    if (!comp) return hint('Someone must kneel at Marcus’s side to compress.', 'warn');
    if (!S.r[comp].hands) return hint(`Rescuer ${comp} needs a hand position first.`, 'warn');
    if (S.A.stage === 'analyzing' || S.A.stage === 'charging' || S.A.stage === 'shock') return hint('The AED is analyzing or charging. Stay clear.', 'warn');
    const vent = [1, 2].find(r => r !== comp && S.r[r].loc === 'A-head') || null;
    S.auto = {comp, vent, mode: vent ? 'two' : 'solo', n: 0, phase: 'c', cycles: 0};
    S.A.status = vent ? 'Two-person CPR' : 'CPR 30:2 in progress';
    record('auto', comp, {on: true, mode: S.auto.mode}, {quiet: true});
    clearInterval(autoId); autoId = setInterval(autoStep, 200);
    if (!S.learn) hint(vent ? 'Two-person CPR running in time-lapse. Count cycles: the compressor calls the switch after 5.' : 'Rescuer 1 keeps doing 30:2 cycles in time-lapse. Switch to Rescuer 2 and keep working.', 'ok');
  }
  function autoStep() {
    if (!S?.auto) return; const a = S.auto;
    if (a.phase === 'c') { pulse(a.comp); if (++a.n >= 30) { a.phase = 'b'; a.n = 0; } }
    else { if (a.n % 3 === 0) breathAnim(560); if (++a.n >= 6) { a.phase = 'c'; a.n = 0; a.cycles++; if (a.mode === 'two') S.twoCycles++; updateCycles(); if (S.help && a.mode === 'two' && S.twoCycles === 5) { hint(`5 cycles done. Click Rescuer ${a.comp} and choose Call switch.`, 'ok'); if (S.learn) coach('5 cycles done — call the switch now!', 'ok'); } } }
  }
  function stopAuto() {
    if (!S?.auto) return; clearInterval(autoId); autoId = 0;
    record('auto', S.auto.comp, {on: false, cycles: S.auto.cycles}, {quiet: true}); S.auto = null; updateCycles();
  }
  function pulse(r) {
    const res = $(`[data-s="r${r}"]`), chest = $('[data-s="chestA"]');
    res?.classList.add('press'); chest?.classList.add('press');
    later(() => { res?.classList.remove('press'); chest?.classList.remove('press'); }, 110);
  }
  function breathAnim(ms) { const c = $('[data-s="chestA"]'); c?.classList.add('rise'); later(() => c?.classList.remove('rise'), ms); }

  // ---------- gating ----------
  function gate(id, r) {
    const R = S.r[r], o = S.r[3 - r];
    if (S.pending) return 'Log your narration first (or skip it).';
    if (S.done) return 'This run is finished.';
    if (R.loc === 'tent') return `Rescuer ${r} is running back with the AED…`;
    if (inCpr(r) && !['stopCpr', 'callSwitch', 'speak', 'auto', 'phone', 'shoutPartner'].includes(id) && !id.startsWith('mv:')) return `Rescuer ${r} is busy doing CPR. Stop CPR first, or switch to Rescuer ${3 - r}.`;
    switch (id) {
      case 'stack': if (R.loc === 'A-side' && !R.hands) return 'Place the first hand before stacking the second.'; if (R.loc !== 'A-side') return 'Choose Hand position first.'; break;
      case 'compress':
        if (R.loc !== 'A-side' || !R.hands) return 'Choose a hand position first.';
        if (S.A.stage === 'analyzing' || S.A.stage === 'charging' || S.A.stage === 'shock') return 'The AED is analyzing or ready to shock. Stay clear.';
        break;
      case 'aed': if (S.A.aed !== 'here') return 'The AED is still in the registration tent. Click the AED cabinet to fetch it.'; break;
      case 'getAED': if (S.A.aed === 'here') return 'The AED is already beside Marcus.'; break;
      case 'biohazard': if (R.gloves !== 'off') return 'Remove your gloves first.'; break;
      case 'glovesOff': if (R.gloves === 'off') return 'No gloves on.'; break;
      case 'gloves': if (R.gloves !== 'off') return 'Already gloved. Remove gloves first to change them.'; break;
      case 'eyes': if (R.eyes) return 'Eye protection is already on.'; break;
      case 'callSwitch':
        if (!(R.loc === 'A-side' && o.loc === 'A-head')) return 'Call a switch while you compress and your partner ventilates at the head.';
        if (S.switchAt) return 'A switch is already called.';
        if (S.learn && S.twoCycles < 5) return `Wait for 5 cycles first (now ${S.twoCycles}).`;
        break;
      case 'emsReport': if (!S.ems) return 'EMS has not arrived yet.'; break;
      case 'stopCpr': if (!S.auto) return 'CPR cycles are not running.'; break;
      case 'auto': if (S.auto) return 'CPR cycles are already running.'; break;
      case 'respond': if (!S.log.some(e => e.type === 'shoutPartner')) return 'Your partner has not called for help yet.'; break;
      case 'layBack': if (S.B.supine) return 'She is already lying on her back.'; break;
      case 'blanket': if (S.B.blanket) return 'She is already covered.'; break;
      case 'clothing': if (S.A.exposed) return 'The chest is already exposed.'; break;
    }
    if (id.startsWith('mv:') && R.loc === id.slice(3)) return `Rescuer ${r} is already there.`;
    return ensureLoc(id, r, true);
  }
  // Moves the rescuer to where the tool is used. dry = only report a problem.
  function ensureLoc(id, r, dry) {
    const need = NEED[id]; if (!need) return null;
    const R = S.r[r], o = S.r[3 - r];
    let to = need;
    if (need === 'A') { if (AT_A(R.loc)) return null; to = o.loc === 'A-side' ? 'A-aed' : 'A-side'; }
    if (R.loc === to) return null;
    if ((to === 'A-side' || to === 'A-head') && o.loc === to) return `Rescuer ${3 - r} is at ${LOC_NAME[to]}.${to === 'A-side' ? ' Call a switch to trade places.' : ''}`;
    if (inCpr(r)) return `Rescuer ${r} is doing CPR. Stop CPR first.`;
    if (!dry) move(r, to);
    return null;
  }

  // ---------- tool actions ----------
  const SIMPLE = ['scene', 'kit', 'gloves', 'eyes', 'biohazard', 'handrub', 'tapShout', 'checkRB', 'consent', 'assess', 'medId', 'shoutPartner', 'respond', 'speak', 'surface', 'clothing', 'stack', 'dressing', 'layBack', 'blanket', 'callSwitch'];
  function useTool(id) {
    closeMenu();
    if (S.learn) {
      const st = step();
      if (!st) return hint('Lesson complete. Press “See my rating sheet”.', 'ok');
      if (id !== st.tool) { coach(`Follow the coach: this step is “${st.title}”. ${st.do}`, 'warn'); flashTarget(); return; }
      S.active = st.r;
    }
    const r = S.active, R = S.r[r];
    const block = gate(id, r);
    if (block) { hint(block, 'warn'); if (S.learn) coach(block, 'warn'); return; }
    ensureLoc(id, r, false);
    hint('');
    if (id.startsWith('mv:')) return move(r, id.slice(3));
    if (id === 'getAED') return getAED(r);
    if (id === 'auto') return startAuto();
    if (id === 'stopCpr') { stopAuto(); return hint('CPR cycles stopped.'); }
    if (SIMPLE.includes(id)) {
      if (id === 'kit') S.A.kit = true;
      if (id === 'gloves') R.gloves = 'on';
      if (id === 'eyes') R.eyes = true;
      if (id === 'clothing') S.A.exposed = true;
      if (id === 'stack') R.stack = true;
      if (id === 'dressing') { S.B.dressing = true; soil(r); }
      if (id === 'layBack') S.B.supine = true;
      if (id === 'blanket') S.B.blanket = true;
      if (id === 'scene') { if (r === 2) $('[data-s="glass"]')?.classList.add('moved'); }
      if (id === 'callSwitch') { stopAuto(); return record('callSwitch', r, {cycles: S.twoCycles}); }
      if (S.help && id === 'dressing' && R.gloves === 'off') hint('Careful: you touched blood without gloves.', 'warn');
      return record(id, r);
    }
    openPanel(id);
  }
  function soil(r) { if (S.r[r].gloves === 'on') S.r[r].gloves = 'soiled'; }
  function move(r, to) {
    const R = S.r[r], o = S.r[3 - r];
    if (R.loc === to) return;
    if ((to === 'A-side' || to === 'A-head') && o.loc === to) return hint(`Rescuer ${3 - r} is already at that spot.`, 'warn');
    if (inCpr(r)) stopAuto();
    R.loc = to; R.hands = null; R.stack = false; R.posture = null; R.sealed = false;
    record('move', r, {to}, {quiet: true});
  }
  function getAED(r) {
    const R = S.r[r]; if (inCpr(r)) stopAuto();
    R.loc = 'tent'; R.hands = null; R.stack = false; R.posture = null; R.sealed = false;
    record('getAED', r, {});
    later(() => { S.A.aed = 'here'; $('[data-s="aedTent"]')?.classList.add('taken'); R.loc = 'A-aed'; updateAll(); }, 1600);
  }

  // ---------- scene menu + hover ----------
  function openMenu(key, x, y) {
    if (!S || S.done) return;
    if (S.pending) return hint('Log your narration first (or skip it).', 'warn');
    if (key === 'r1' || key === 'r2') { S.active = +key[1]; updateAll(); }
    const H = HOTS[key]; if (!H) return;
    S.menu = {key, x, y};
    renderMenu();
  }
  function renderMenu() {
    const m = $('[data-menu]'); if (!m || !S.menu) return;
    const H = HOTS[S.menu.key], r = S.active, st = step();
    m.innerHTML = `<header><div><b>${esc(H.name)}</b><small>${esc(H.tip)}</small></div><button type="button" class="mlab-x" data-act="closeMenu" aria-label="Close">×</button></header>
      <div class="mlab-menu-who"><span>Acting as</span>${[1, 2].map(n => `<button type="button" class="r${n}" data-act="menuWho" data-r="${n}" aria-pressed="${r === n}">Rescuer ${n}</button>`).join('')}</div>
      <div class="mlab-menu-list">${H.tools.map(id => {
        const [label, sub] = TOOLINFO[id] || [ACT[id]?.[0] || id, ''];
        const why = gate(id, r);
        const coachIt = st && st.tool === id;
        return `<button type="button" role="menuitem" class="${why ? 'off' : ''} ${coachIt ? 'coach' : ''}" data-tool="${id}"><b>${esc(label)}</b><small>${esc(why || sub)}</small></button>`;
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
  function openPanel(id, extra = {}) {
    if (S.panel?.id === 'pressure') stopPressure(false);
    S.panel = {id, r: S.active, ...extra};
    if (id === 'compress') Object.assign(S.panel, {taps: [], depth: 1.5, recoil: 'full'});
    if (id === 'pocketMask') Object.assign(S.panel, {holds: [], seal: [null, null, null, null], orient: null, order: [0, 1, 2, 3].map(() => Math.random() < .5)});
    if (id === 'ecClamp') Object.assign(S.panel, {holds: [], steps: [null, null, null, null], order: [0, 1, 2, 3].map(() => Math.random() < .5), sealed: S.r[S.active].sealed});
    if (id === 'checkBP') Object.assign(S.panel, {method: null, site: null, fingers: null, startAt: 0, secs: 0});
    if (id === 'pressure') Object.assign(S.panel, {technique: null, force: 0, holding: false, samples: [], started: 0});
    if (id === 'tourniquet') Object.assign(S.panel, {tight: S.B.tq?.tight || 0, turns: S.B.tq?.turns || 0});
    if (id === 'aed') Object.assign(S.panel, {sel: 'R', place: {R: null, L: null}});
    if (id === 'phone') { if (!S.call || S.call.done) S.call = {dial: '', on: false, step: 0, msgs: [], replies: [], waited: false, done: false}; }
    if (id === 'emsReport') Object.assign(S.panel, {patient: S.active === 1 ? 'A' : 'B'});
    renderPanel();
    $('[data-panel]').scrollIntoView({block: 'nearest', behavior: 'smooth'});
  }
  function closePanel() { if (S.panel?.id === 'pressure') stopPressure(false); cancelAnimationFrame(raf); stopMetro(); S.panel = null; renderPanel(); updateScene(); }

  const pk = (name, v) => S.learn && isPick(name, v) ? ' pick' : '';
  const choice = (name, opts, val) => `<div class="mlab-choices">${opts.map(([v, label]) => `<button type="button" class="mlab-choice ${val === v ? 'on' : ''}${pk(name, v)}" data-pset="${name}" data-v="${v}">${label}</button>`).join('')}</div>`;
  function renderPanel() {
    const box = $('[data-panel]'), stage = $('[data-stage]');
    const P = S.panel;
    if (!P) { box.hidden = true; box.innerHTML = ''; stage.classList.remove('has-panel'); return; }
    box.hidden = false; stage.classList.add('has-panel');
    const R = S.r[P.r];
    const tip = S.learn && PANEL_TIPS[P.id] ? `<div class="mlab-ptip"><b>Coach</b>${esc(PANEL_TIPS[P.id])}<small>★ marks the correct choice.</small></div>` : '';
    const head = (title, sub) => `<header><div><span class="r${P.r}">RESCUER ${P.r} · ${P.id === 'aed' ? 'AED' : 'TOOL'}</span><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div><button type="button" class="mlab-x" data-act="closePanel" aria-label="Close tool">×</button></header>${tip}`;
    const L = S.learn;
    let html = '';
    switch (P.id) {
      case 'checkBP': {
        const secs = P.startAt ? (performance.now() - P.startAt) / 1000 : P.secs;
        html = head('Breathing & pulse check', 'Pick your technique, then time the check.') +
          `<label class="mlab-lbl">1 · Breathing check method</label>${choice('method', [['scan', 'Scan chest for rise and fall (AHA)'], ['tilt', 'Head-tilt/chin-lift, look-listen-feel (ARC)'], ['jaw', 'Modified jaw-thrust']], P.method)}
          <label class="mlab-lbl">2 · Pulse site — tap the neck</label>
          ${neckSvg(P.site, L)}
          <label class="mlab-lbl">3 · Fingers</label><div class="mlab-q">${choice('fingers', [['two', '2–3 fingers'], ['thumb', 'Thumb']], P.fingers)}</div>
          <div class="mlab-timerbox"><b data-ptimer>${secs.toFixed(1)} s</b><small>Target 5–10 seconds${P.startAt ? ' · watch the chest' : ''}</small></div>
          <div class="mlab-row">${P.startAt ? `<button type="button" class="mlab-btn primary" data-act="bpStop">End check</button>` : `<button type="button" class="mlab-btn primary" data-act="bpStart" ${P.method && P.site && P.fingers ? '' : 'disabled'}>Start check</button>`}</div>`;
        break;
      }
      case 'hands':
        html = head('Hand position', 'Tap where the heel of your first hand goes.') +
          chestSvg([['upper', 104, 38, 32, 34], ['lower', 104, 90, 32, 50], ['xiphoid', 108, 142, 24, 24], ['left', 142, 78, 44, 44]].map(([v, x, y, w, h]) => `<rect class="t-zone ${R.hands === v ? 'on' : ''}${L && v === 'lower' ? ' pick' : ''}" data-act="handSpot" data-v="${v}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`).join('') +
            (R.hands ? `<ellipse class="t-palm" cx="${{upper: 120, lower: 120, xiphoid: 120, left: 164}[R.hands]}" cy="${{upper: 55, lower: 115, xiphoid: 154, left: 100}[R.hands]}" rx="15" ry="12"/>` : '')) +
          `<p class="mlab-note">${R.hands ? `Hand set: <b>${{upper: 'upper breastbone', lower: 'lower half of breastbone', xiphoid: 'tip of the breastbone (xiphoid)', left: 'left chest'}[R.hands]}</b>.` : 'No hand placed yet.'}</p>`;
        break;
      case 'posture':
        html = head('Arm posture', 'How are you positioned over the chest?') +
          `<div class="mlab-cards">${[['good', 'Arms straight, shoulders directly over hands'], ['bent', 'Elbows bent, pushing with arm muscles'], ['behind', 'Arms straight, shoulders behind hands']].map(([v, t]) => `<button type="button" class="mlab-card${L && v === 'good' ? ' pick' : ''}" data-act="postureSet" data-v="${v}">${postureSvg(v)}<span>${t}</span></button>`).join('')}</div>`;
        break;
      case 'compress': {
        const n = P.taps.length, iv = n > 1 ? (P.taps[n - 1] - P.taps[0]) / (n - 1) : 0, rate = iv ? 60000 / iv : 0;
        html = head('Chest compressions', 'Tap the big pad (or press Space) once per compression.') +
          `<div class="mlab-setup">${[['Hands', R.hands ? (S.help ? (R.hands === 'lower' ? '✓ lower half' : '✗ ' + R.hands) : 'set') : '—'], ['2nd hand', R.stack ? 'stacked' : '—'], ['Posture', R.posture ? (S.help ? (R.posture === 'good' ? '✓ straight' : '✗ ' + R.posture) : 'set') : '—'], ['Chest', S.A.exposed ? 'exposed' : 'jacket on']].map(([k, v]) => `<span><small>${k}</small>${v}</span>`).join('')}</div>
          <label class="mlab-lbl" for="ml-depth">1 · Depth <b data-depthv>${P.depth.toFixed(1)} in</b></label><input id="ml-depth" type="range" min="1" max="3" step="0.1" value="${P.depth}" data-pin="depth">${L ? '<div class="mlab-range-note">★ 2.0–2.4 in</div>' : ''}
          <label class="mlab-lbl">2 · Between compressions</label>${choice('recoil', [['full', 'Let the chest recoil fully'], ['lean', 'Keep weight on the chest']], P.recoil)}
          <label class="mlab-lbl">3 · Compress 30 times</label>
          <button type="button" class="mlab-tap" data-tap><b data-tapn>${n}</b><small>/ 30</small></button>
          <div class="mlab-gauge" aria-hidden="true">
            <div class="g-head"><span>Rate</span><b data-ratev>${rate ? Math.round(rate) + '/min' : '—'}</b></div>
            <div class="g-track"><div class="g-band"></div><i data-rate style="left:${Math.min(100, Math.max(0, (rate - 60) / 1.2))}%"></i></div>
            <div class="g-ticks"><span class="lo" style="left:0">60</span><span style="left:33.333%">100</span><span style="left:50%">120</span><span class="hi" style="left:100%">180</span></div>
          </div>
          <p class="mlab-note">Target 100–120/min · 30 compressions in 15–18 s</p>
          ${S.help ? `<label class="mlab-inline mlab-metro"><input type="checkbox" data-metro ${metroId ? 'checked' : ''}> Metronome (110/min)</label>` : ''}`;
        break;
      }
      case 'pocketMask': {
        const Q = [['Top hand (nearest the head)', 'Index finger and thumb along the top edge of the mask', 'Palm flat on the center of the mask'], ['Other hand', 'Thumb along the bottom edge of the mask', 'Thumb pressed into the soft tissue under the chin'], ['Remaining fingers', 'On the bony jaw margin, lift the jaw: head tilt–chin lift', 'Push the chin down to open the mouth'], ['Seal', 'Press firmly around the entire outside edge', 'Press only on the top of the mask']];
        html = head('Pocket mask breaths', 'Place, seal, then give 2 breaths.') +
          `<label class="mlab-lbl">1 · Place the mask</label><div class="mlab-q">${choice('orient', [['nose', 'Narrow end over the bridge of the nose'], ['chin', 'Narrow end over the chin']], P.orient)}</div>
          <label class="mlab-lbl">2 · Seal the mask</label>${Q.map((q, i) => { const opts = P.order[i] ? [[1, q[1]], [0, q[2]]] : [[0, q[2]], [1, q[1]]]; return `<div class="mlab-q"><small>${q[0]}</small>${choice('seal' + i, opts.map(([v, t]) => [String(v), t]), P.seal[i] == null ? null : String(P.seal[i]))}</div>`; }).join('')}
          <label class="mlab-lbl">3 · Breathe — press and hold about 1 second per breath</label>
          <button type="button" class="mlab-hold" data-hold>Hold to breathe <small data-holds>${P.holds.map(h => h.toFixed(1) + ' s').join(' · ') || '0 of 2'}</small></button>
          <div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="maskDone" ${P.orient && P.seal.every(v => v != null) && P.holds.length >= 2 ? '' : 'disabled'}>Done</button><button type="button" class="mlab-btn ghost" data-act="holdsReset">Redo breaths</button></div>`;
        break;
      }
      case 'ecClamp': {
        const Q = [['Airway', 'Perform a head tilt', 'Keep the head flat and neutral'], ['Mask', 'Mask on the face using the bridge of the nose as a guide', 'Mask centered over the mouth only'], ['“C”', 'Thumb and index finger form a C, pressing the mask edges to the face', 'Whole palm pressing on top of the mask'], ['“E”', 'Remaining 3 fingers lift the angles of the jaw', '3 fingers press on the throat']];
        html = head('Bag-mask ventilation', P.sealed ? 'Mask is sealed. Squeeze 2 breaths after every 30 compressions.' : 'Seal with the E-C clamp, then squeeze.') +
          (P.sealed ? '' : `${Q.map((q, i) => { const opts = P.order[i] ? [[1, q[1]], [0, q[2]]] : [[0, q[2]], [1, q[1]]]; return `<div class="mlab-q"><small>${q[0]}</small>${choice('step' + i, opts.map(([v, t]) => [String(v), t]), P.steps[i] == null ? null : String(P.steps[i]))}</div>`; }).join('')}
          <div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="ecDone" ${P.steps.every(v => v != null) ? '' : 'disabled'}>Seal the mask</button></div>`) +
          (P.sealed ? `<button type="button" class="mlab-hold" data-hold>Hold to squeeze the bag <small data-holds>${P.holds.map(h => h.toFixed(1) + ' s').join(' · ') || '0 of 2'}</small></button>` : '');
        break;
      }
      case 'aed': html = head('AED station', 'Power on, place pads, clear, analyze, shock.') + aedHtml(); break;
      case 'phone': html = head('Cell phone', 'Speakerphone on.') + phoneHtml(); break;
      case 'pressure':
        html = head('Direct pressure', 'Choose a technique, then press and hold the pad. Keep the meter in the green band for 8 seconds.') +
          `${choice('technique', [['stack', 'Heel of one hand, other hand stacked on top'], ['finger', 'Fingertips on the dressing'], ['palm', 'One flat palm, light touch']], P.technique)}
          <div class="mlab-press"><div class="mlab-ppad" data-ppad tabindex="0" aria-label="Pressure pad. Hold, and move up for more force. Space holds, arrow keys change force."><span>${P.holding ? 'Pressing' : 'Press & hold'}</span><small>Higher on the pad = more force</small></div>
          <div class="mlab-meter"><div class="m-zone"></div><div class="m-fill" data-pfill style="height:${P.force}%"></div></div></div>
          <div class="mlab-timerbox"><b data-ptimer>${P.started ? Math.min(8, (performance.now() - P.started) / 1000).toFixed(1) : '0.0'} / 8.0 s</b><small>firm · steady · constant</small></div>`;
        break;
      case 'tourniquet': {
        const tq = S.B.tq;
        const pullDone = tq && P.tight > 0 && !tq.pulled && (!L || P.tight >= 100);
        const twistDone = tq?.pulled && P.turns > 0 && !tq.twisted && (!L || S.B.bleed === 0);
        html = head('Tourniquet', 'Wound: right thigh, 6 in above the knee.') +
          `${legSvg(tq, tq?.zone, S.B.dressing, L)}
          <div class="mlab-steps">
            <div><span>1 · Place: tap a zone on the leg ${tq ? '✓' : ''}</span></div>
            <div><span>2 · Strap ${tq?.pulled ? '✓' : ''}</span><div class="mlab-bar"><i style="width:${P.tight}%"></i></div><button type="button" class="mlab-btn" data-act="tqPullStep" ${tq && !tq.pulled ? '' : 'disabled'}>Pull free end</button><button type="button" class="mlab-btn" data-act="tqPullDone" ${pullDone ? '' : 'disabled'}>Secure strap</button></div>
            <div><span>3 · Windlass — bleeding ${tq?.twisted ? '✓' : ''}</span><div class="mlab-bar red"><i style="width:${bleedPct()}%"></i></div><button type="button" class="mlab-btn" data-act="tqTwistStep" ${tq?.pulled && !tq.twisted ? '' : 'disabled'}>Twist ½ turn</button><button type="button" class="mlab-btn" data-act="tqTwistDone" ${twistDone ? '' : 'disabled'}>Done twisting</button></div>
            <div><span>4 · Lock and time</span><button type="button" class="mlab-btn" data-act="tqSecureBtn" ${tq?.twisted && !tq.secured ? '' : 'disabled'}>Secure windlass in clip</button><button type="button" class="mlab-btn" data-act="tqTimeBtn" ${tq ? '' : 'disabled'}>Note the time · ${clock()}</button></div>
          </div><p class="mlab-note">Bleeding: <b>${['stopped', 'slow ooze', 'steady', 'heavy'][S.B.bleed]}</b></p>`;
        break;
      }
      case 'glovesOff':
        html = head('Remove gloves', 'Which technique do you use?') +
          `<div class="mlab-cards col">${shuffle([['proper', 'Pinch the outside of one glove at the wrist, peel it off inside-out into the gloved hand, then slide bare fingers inside the other cuff and peel it off over the first.'], ['fingertips', 'Pull each glove off by its fingertips, one at a time.'], ['bare', 'Peel off the first glove, then grab the outside of the second glove with your bare hand.']]).map(([v, t]) => `<button type="button" class="mlab-card text${L && v === 'proper' ? ' pick' : ''}" data-act="glovesOffSet" data-v="${v}"><span>${t}</span></button>`).join('')}</div>`;
        break;
      case 'emsReport': {
        html = head('EMS handoff report', 'Type the report you give the EMS crew (the judges).') +
          `${choice('patient', [['A', 'Marcus (Patient A)'], ['B', 'Jordan (Patient B)']], P.patient)}
          <textarea data-report rows="6" placeholder="${P.patient === 'A' ? 'Who, what happened, findings, care given, AED shocks, times…' : 'Who, injury, bleeding care, tourniquet time, shock care, history…'}"></textarea>
          ${S.help ? `<p class="mlab-note">Cover at least 4: ${REPORT_GROUPS[P.patient].map(g => g[0]).join(' · ')}.</p>` : ''}
          <div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="reportSend">Give report</button></div>`;
        break;
      }
    }
    box.innerHTML = `<div class="mlab-panel-in">${html}</div>`;
    if (P.id === 'phone') { const log = box.querySelector('.mlab-chat'); if (log) log.scrollTop = log.scrollHeight; }
    if (P.id === 'aed') drawEcg();
  }

  function bleedPct() { return S.B.bleed / 3 * 100; }

  // ----- AED -----
  const aedScreen = () => ({off: 'Device off', pads: S.A.pads ? 'Pads connected. Stand clear and press ANALYZE.' : 'Apply pads to patient’s bare chest.', analyzing: 'Analyzing heart rhythm. Do not touch the patient.', charging: 'Shock advised. Charging…', shock: 'Stand clear! Press the flashing shock button.', cpr: 'Shock delivered. Begin CPR now.', motion: 'Motion detected. Stop CPR. Do not touch the patient.'})[S.A.stage];
  function aedHtml() {
    const P = S.panel, A = S.A, L = S.learn;
    const zones = {UR: [64, 46, 'upper right chest'], LS: [178, 128, 'left side, below armpit'], ST: [118, 96, 'center of breastbone'], UL: [172, 46, 'upper left chest'], AB: [118, 176, 'abdomen']};
    const set = [P.place.R, P.place.L];
    const learnBlock = L && !(set.includes('UR') && set.includes('LS') && !A.patch && A.exposed);
    return `<div class="mlab-aed"><div class="aed-screen"><canvas data-ecg width="300" height="70"></canvas><p>${esc(aedScreen())}</p><small>Shocks: ${A.shocks}</small></div>
      <div class="mlab-row">${A.on ? '' : '<button type="button" class="mlab-btn primary" data-act="aedOn">Open case &amp; power on</button>'}</div>
      ${A.on && !A.pads ? `<label class="mlab-lbl">Pads — pick a pad, then tap where it goes (his right side is on your left)</label>
        <div class="mlab-choices row"><button type="button" class="mlab-choice ${P.sel === 'R' ? 'on' : ''}" data-act="padSel" data-v="R">Pad 1 ${P.place.R ? '· ' + zones[P.place.R][2] : ''}</button><button type="button" class="mlab-choice ${P.sel === 'L' ? 'on' : ''}" data-act="padSel" data-v="L">Pad 2 ${P.place.L ? '· ' + zones[P.place.L][2] : ''}</button></div>
        ${chestSvg(`${A.patch && A.exposed ? '<rect class="t-patch" x="54" y="44" width="24" height="17" rx="3"/><text x="66" y="57" class="t-ptext">patch</text>' : ''}
        ${Object.entries(zones).map(([k, [x, y]]) => `<rect class="t-zone ${P.place.R === k || P.place.L === k ? 'on' : ''}${L && (k === 'UR' || k === 'LS') ? ' pick' : ''}" data-act="padZone" data-v="${k}" x="${x - 18}" y="${y - 14}" width="36" height="28" rx="6"/>`).join('')}
        ${['R', 'L'].filter(p => P.place[p]).map(p => `<rect class="t-pad" x="${zones[P.place[p]][0] - 15}" y="${zones[P.place[p]][1] - 10}" width="30" height="20" rx="4"/><text class="t-padt" x="${zones[P.place[p]][0]}" y="${zones[P.place[p]][1] + 4}">${p === 'R' ? 1 : 2}</text>`).join('')}`, {jacket: !A.exposed})}
        <div class="mlab-row">${A.patch && A.exposed ? '<button type="button" class="mlab-btn" data-act="patchOff">Remove medication patch</button>' : ''}<button type="button" class="mlab-btn primary" data-act="padsApply" ${P.place.R && P.place.L && !learnBlock ? '' : 'disabled'}>Press pads on</button></div>
        ${L && learnBlock && P.place.R && P.place.L ? '<p class="mlab-note">Coach: remove the patch first, and use the two ★ zones.</p>' : ''}` : ''}
      ${A.pads ? `<div class="mlab-row"><button type="button" class="mlab-btn" data-act="analyze" ${['pads', 'cpr', 'motion'].includes(A.stage) ? '' : 'disabled'}>Clear &amp; analyze</button><button type="button" class="mlab-btn shock ${A.stage === 'shock' ? 'flash' : ''}" data-act="shockBtn" ${A.stage === 'shock' ? '' : 'disabled'}>⚡ Clear &amp; shock</button></div>
        ${S.auto && A.stage === 'pads' ? '<p class="mlab-note">CPR is still running. The compressor must stop and move to the head before you analyze.</p>' : ''}` : ''}
    </div>`;
  }
  function drawEcg() {
    cancelAnimationFrame(raf);
    const c = $('[data-ecg]'); if (!c) return; const ctx = c.getContext('2d'); let x0 = 0;
    const frame = () => {
      if (!S?.panel || S.panel.id !== 'aed' || !c.isConnected) return;
      ctx.clearRect(0, 0, 300, 70); ctx.strokeStyle = '#5ef0a0'; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let x = 0; x < 300; x++) {
        const t = (x + x0) / 9; let y = 35;
        if (!S.A.on || !S.A.pads) y = 35 + Math.sin(t * 7) * .4;
        else if (S.auto) y = 35 + Math.sin((x + x0) / 6) * 14;
        else if (S.A.shocks === 0) y = 35 + Math.sin(t) * 10 + Math.sin(t * 2.7) * 7 + Math.sin(t * .6) * 4;
        else y = 35 + Math.sin(t * 1.3) * 3 + Math.sin(t * 3.1) * 2;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke(); x0 += 2; raf = requestAnimationFrame(frame);
    };
    frame();
  }
  const r1Cpr = () => !!S.auto && S.auto.comp === 1;
  function aedAction(act, v) {
    const r = S.panel.r, A = S.A, P = S.panel;
    if (S.pending) return hint('Log your narration first.', 'warn');
    if (act === 'aedOn') { A.on = true; A.stage = 'pads'; record('aedPower', r, {r1Cpr: r1Cpr()}); }
    if (act === 'padSel') { P.sel = v; }
    if (act === 'padZone') { if (!P.sel) return hint('Pick Pad 1 or Pad 2 first.', 'warn'); P.place[P.sel] = v; P.sel = P.sel === 'R' && !P.place.L ? 'L' : null; }
    if (act === 'patchOff') { A.patch = false; record('removePatch', r); }
    if (act === 'padsApply') {
      const set = [P.place.R, P.place.L];
      const correct = set.includes('UR') && set.includes('LS');
      A.pads = true;
      record('pads', r, {correct, overPatch: set.includes('UR') && A.patch, overClothing: !A.exposed, r1Cpr: r1Cpr(), zones: set});
    }
    if (act === 'analyze') {
      const touching = !!S.auto;
      if (touching) { A.stage = 'motion'; record('clearAnalyze', r, {ok: false, touching}); }
      else {
        A.stage = 'analyzing'; record('clearAnalyze', r, {ok: true, touching: false});
        later(() => { if (A.stage === 'analyzing') { A.stage = 'charging'; renderPanelIf('aed'); later(() => { A.stage = 'shock'; renderPanelIf('aed'); updateAll(); if (S.learn) coach('The AED says “shock advised.” Press ⚡ Clear & shock.', 'ok'); }, 1800); } }, 3000);
      }
    }
    if (act === 'shockBtn') {
      const touching = !!S.auto;
      A.shocks++; A.stage = 'cpr'; A.status = `Shock delivered (${A.shocks}) · start CPR`;
      const f = $('.ml-flash'); f?.classList.remove('go'); void f?.getBoundingClientRect(); f?.classList.add('go');
      $('[data-s="pa"]')?.classList.add('jolt'); later(() => $('[data-s="pa"]')?.classList.remove('jolt'), 400);
      record('shock', r, {ok: !touching, touching});
    }
    renderPanel(); updateAll();
  }
  const renderPanelIf = id => { if (S?.panel?.id === id) renderPanel(); };

  // ----- phone -----
  const DISPATCH = ['911, what is the location of your emergency?', 'What is your name, and the phone number you are calling from?', 'Tell me exactly what happened. How many patients, and what is their condition?'];
  function phoneHtml() {
    const C = S.call;
    if (!C.on) return `<div class="mlab-phone"><div class="ph-display">${esc(C.dial) || '&nbsp;'}</div><div class="ph-keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(k => `<button type="button" data-act="dial" data-v="${k}">${k}</button>`).join('')}</div><div class="mlab-row"><button type="button" class="mlab-btn ghost" data-act="dialClear">Clear</button><button type="button" class="mlab-btn call" data-act="dialCall" ${C.dial ? '' : 'disabled'}>Call</button></div><small class="mlab-note">Your phone: ${esc(LAB.phone)}</small></div>`;
    return `<div class="mlab-phone"><div class="ph-top"><b>911 · Lakeside County Dispatch</b><small>${C.waited ? 'Dispatcher released the call' : 'Connected'}</small></div>
      <div class="mlab-chat">${C.msgs.map(m => `<p class="${m.me ? 'me' : ''}">${esc(m.text)}</p>`).join('')}</div>
      ${C.step < 3 ? `<div class="mlab-row"><input data-reply placeholder="Answer the dispatcher…" aria-label="Reply to dispatcher"><button type="button" class="mlab-btn primary" data-act="reply">Send</button></div>` : ''}
      <button type="button" class="mlab-btn hang" data-act="hangup">Hang up</button></div>`;
  }
  function phoneAct(act, v) {
    const C = S.call;
    if (act === 'dial') C.dial = (C.dial + v).slice(0, 12);
    if (act === 'dialClear') C.dial = '';
    if (act === 'dialCall') {
      if (C.dial.replace(/\D/g, '') !== '911') { hint('That number did not connect to emergency services.', 'warn'); C.dial = ''; }
      else { C.on = true; C.caller = S.panel.r; C.msgs.push({text: DISPATCH[0]}); updateScene(); }
    }
    if (act === 'reply') {
      const inp = $('[data-reply]'); const text = inp?.value.trim(); if (!text) return;
      C.msgs.push({me: true, text}); C.replies.push(text); C.step++;
      if (C.step < 3) later(() => { C.msgs.push({text: DISPATCH[C.step]}); renderPanelIf('phone'); $('[data-reply]')?.focus(); }, 700);
      else later(() => { C.msgs.push({text: 'OK. Paramedics are on the way to Lakeside Park. If there is an AED, get it and use it. Keep firm pressure on the bleeding.'}); renderPanelIf('phone'); later(() => { C.waited = true; C.msgs.push({text: 'Help is on the way. You can hang up now.'}); renderPanelIf('phone'); }, 2200); }, 900);
    }
    if (act === 'hangup') {
      const all = C.replies.join(' \n ');
      const d = {loc: /lakeside|park|shoreline|finish/i.test(all), name: /my name|this is|\bi'?m\b|\bi am\b|name is/i.test(all), phone: /\d{3}\D{0,3}\d{3}\D{0,2}\d{4}|014.?2290/.test(all), count: /\b(2|two)\b/i.test(C.replies[2] || all), arrest: /unrespons|not breathing|cardiac|collaps|cpr|no pulse|heart/i.test(all), bleed: /bleed|cut|lacerat|wound|glass/i.test(all), waited: C.waited, replies: C.replies};
      C.done = true; C.on = false; S.panel = null; renderPanel();
      if (C.replies.length) record('call911', C.caller || S.active, d);
      else updateAll();
      return;
    }
    renderPanel();
    if (act === 'dialCall' && C.on) $('[data-reply]')?.focus();
  }

  // ----- breathing holds -----
  let holdStart = 0;
  function holdDown() { const P = S.panel; if (!P || P.holds.length >= 2 || S.pending) return; holdStart = performance.now(); $('[data-s="chestA"]')?.classList.add('rise'); $('[data-hold]')?.classList.add('on'); }
  function holdUp() {
    if (!holdStart) return; const P = S.panel; const secs = (performance.now() - holdStart) / 1000; holdStart = 0;
    $('[data-s="chestA"]')?.classList.remove('rise');
    if (!P || !P.holds) return; P.holds.push(secs);
    if (P.id === 'ecClamp' && P.holds.length >= 2) { const holds = P.holds.slice(); P.holds = []; renderPanel(); record('breaths', P.r, {kind: 'bag', holds}); if (twoConfig()) S.twoCycles++; updateCycles(); return; }
    renderPanel();
  }
  const twoConfig = () => [1, 2].some(r => S.r[r].loc === 'A-side') && [1, 2].some(r => S.r[r].loc === 'A-head');

  // ----- compressions -----
  function tap() {
    const P = S.panel; if (!P || P.id !== 'compress' || S.pending) return;
    if (inCpr(P.r)) return hint('Stop the running cycles first.', 'warn');
    if (P.taps.length >= 30) return;
    P.taps.push(performance.now()); pulse(P.r);
    const n = P.taps.length, iv = n > 1 ? (P.taps[n - 1] - P.taps[0]) / (n - 1) : 0, rate = iv ? 60000 / iv : 0;
    const set = (s, v) => { const e = $(s); if (e) e.textContent = v; };
    set('[data-tapn]', n); set('[data-ratev]', rate ? Math.round(rate) + '/min' : '—');
    const i = $('[data-rate]'); if (i) i.style.left = Math.min(100, Math.max(0, (rate - 60) / 1.2)) + '%';
    if (n === 30) {
      const R = S.r[P.r]; const secs = (P.taps[29] - P.taps[0]) / 1000 + iv / 1000;
      const d = {rate, secs, depth: P.depth, recoil: P.recoil, loc: R.loc, exposed: S.A.exposed};
      P.taps = []; later(() => renderPanelIf('compress'), 300);
      record('compress', P.r, d);
    }
  }
  function startMetro() { stopMetro(); try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); } catch { return; } metroId = setInterval(() => { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(.08, audio.currentTime); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .06); o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + .07); $('[data-tap]')?.classList.toggle('beat'); }, 60000 / 110); }
  function stopMetro() { clearInterval(metroId); metroId = 0; }

  // ----- direct pressure -----
  function pressAt(clientY) {
    const pad = $('[data-ppad]'); if (!pad) return; const b = pad.getBoundingClientRect();
    S.panel.force = Math.max(0, Math.min(100, (1 - (clientY - b.top) / b.height) * 100));
  }
  function startPressure() {
    const P = S.panel; if (!P.technique) { hint('Choose a hand technique first.', 'warn'); return false; }
    if (!P.started) { P.started = performance.now(); P.samples = []; clearInterval(pressId); pressId = setInterval(samplePressure, 100); }
    return true;
  }
  function samplePressure() {
    const P = S.panel; if (!P || P.id !== 'pressure') return stopPressure(false);
    const f = P.holding ? Math.max(0, Math.min(100, P.force + (Math.random() - .5) * 4)) : 0;
    P.samples.push(f);
    const fill = $('[data-pfill]'); if (fill) { fill.style.height = f + '%'; fill.classList.toggle('in', f >= 55 && f <= 85); }
    const tm = $('[data-ptimer]'); if (tm) tm.textContent = `${Math.min(8, (performance.now() - P.started) / 1000).toFixed(1)} / 8.0 s`;
    $('.ml-scene')?.classList.toggle('pressing', P.holding);
    if (performance.now() - P.started >= 8000) stopPressure(true);
  }
  function stopPressure(done) {
    clearInterval(pressId); pressId = 0; $('.ml-scene')?.classList.remove('pressing');
    const P = S?.panel; if (!P || P.id !== 'pressure') return;
    if (done) {
      const s = P.samples, mean = s.reduce((a, b) => a + b, 0) / s.length, sd = Math.sqrt(s.reduce((a, b) => a + (b - mean) ** 2, 0) / s.length);
      const d = {technique: P.technique, firm: mean >= 55 && mean <= 85, steady: sd <= 9, constant: Math.min(...s.slice(3)) >= 30, mean: Math.round(mean), sd: +sd.toFixed(1)};
      S.B.pressured = true; if (d.firm && S.B.bleed > 2) S.B.bleed = 2; soil(P.r);
      S.panel = null; renderPanel();
      if (S.practice) hint(`Pressure result: average ${d.mean}% (${d.firm ? 'firm' : 'not firm'}), ${d.steady ? 'steady' : 'unsteady'}, ${d.constant ? 'constant' : 'released'}.`, d.firm && d.steady && d.constant ? 'ok' : 'warn');
      record('pressure', P.r, d);
    }
  }

  // ---------- rendering ----------
  function updateScene() {
    const svg = $('.ml-scene'); if (!svg) return;
    for (const r of [1, 2]) {
      const R = S.r[r], [x, pose, face] = LOCS[R.loc]; const g = $(`[data-s="r${r}"]`);
      g.style.transform = `translate(${x}px,0px)`; g.classList.toggle('standing', pose === 'stand'); g.classList.toggle('active', S.active === r);
      g.classList.toggle('gloved', R.gloves === 'on'); g.classList.toggle('soiled', R.gloves === 'soiled'); g.classList.toggle('eyes', R.eyes);
      g.classList.toggle('onphone', !!S.call?.on && S.call.caller === r);
      g.querySelector('.ml-face').style.transform = `scaleX(${face})`;
      const say = $(`[data-say="${r}"]`); if (say) say.style.left = Math.max(10, Math.min(90, x / 10)) + '%';
    }
    const A = S.A, B = S.B;
    const t = (c, on) => svg.classList.toggle(c, !!on);
    t('exposed', A.exposed); t('patch', A.patch && A.exposed); t('aed-here', A.aed === 'here'); t('pads', A.pads); t('kit-open', A.kit);
    t('pmask', S.log.some(e => e.type === 'pocketMask') && !S.log.some(e => e.type === 'ecClamp'));
    t('bvm', S.log.some(e => e.type === 'ecClamp') && !S.ems);
    t('b-lying', B.supine); t('b-dressing', B.dressing); t('b-tq', !!B.tq); t('b-blanket', B.blanket); t('b-twisted', (B.tq?.turns || 0) > 0);
    t('on-phone', !!S.call?.on);
    svg.dataset.bleed = B.bleed; t('ems', S.ems);
    const pool = svg.querySelector('.ml-pool'); if (pool) pool.style.transform = `scale(${1 + Math.min(2.2, (S.bleedPool || 0))})`;
    // Learn mode: outline what to click next.
    const st = step();
    $$('.ml-hot.target').forEach(h => h.classList.remove('target'));
    if (st?.hot && !(S.panel && st.tool === S.panel.id) && !S.pending) $$(`[data-hot="${st.hot}"]`).forEach(h => h.classList.add('target'));
    const ta = $('[data-ptag="A"]'), tb = $('[data-ptag="B"]');
    if (ta) ta.innerHTML = `<b>Marcus</b>${esc(A.status)}`;
    if (tb) { tb.innerHTML = `<b>Jordan</b>${['Bleeding controlled', 'Slow ooze', 'Still bleeding', 'Bleeding heavily'][B.bleed]}${B.supine ? ' · lying' : ''}`; tb.classList.toggle('lying', B.supine); tb.classList.toggle('ok', B.bleed === 0); }
  }
  function updateCycles() {
    const c = $('[data-cycles]'); if (!c) return;
    if (S.auto) { c.hidden = false; c.innerHTML = `<span class="pulse"></span>${S.auto.mode === 'two' ? `Two-person CPR · cycle <b>${S.twoCycles}</b>${S.twoCycles >= 5 ? ' · switch due' : ' of 5'}` : `CPR 30:2 · cycle <b>${S.auto.cycles}</b>`} <small>time-lapse</small>`; }
    else if (S.twoCycles) { c.hidden = false; c.innerHTML = `Cycles since last switch: <b>${S.twoCycles}</b>`; }
    else c.hidden = true;
  }
  function updatePhases() {
    const box = $('[data-phases]'); if (!box) return;
    const types = new Set(S.log.map(e => e.type));
    box.innerHTML = PHASES.map(([name, evs], i) => { const n = evs.filter(e => types.has(e)).length, p = n / evs.length; return `<li class="${p === 1 ? 'done' : p ? 'part' : ''}" style="--p:${p}"><i>${p === 1 ? '✓' : i + 1}</i><span>${name}</span></li>`; }).join('');
  }
  function updateTop() {
    for (const r of [1, 2]) { const b = $(`.mlab-who [data-r="${r}"]`); b?.setAttribute('aria-pressed', S.active === r); const l = $(`[data-wholoc="${r}"]`); if (l) l.textContent = (inCpr(r) ? 'CPR · ' : '') + LOC_NAME[S.r[r].loc]; }
  }
  function updateVitals() {
    const v = $('[data-vitals]'); if (!v) return; const A = S.A, R = S.r[S.active];
    v.innerHTML = `<span class="vt"><small>AED</small>${A.aed === 'here' ? (A.on ? (A.pads ? `Pads on · ${A.shocks} shock${A.shocks === 1 ? '' : 's'}` : 'On') : 'Beside Marcus') : 'In the tent'}</span>
      <span class="vt r${S.active}"><small>R${S.active} PPE</small>${{off: 'No gloves', on: 'Gloves', soiled: 'Soiled gloves'}[R.gloves]}${R.eyes ? ' · eyes' : ''}</span>
      <span class="vt"><small>911</small>${S.log.some(e => e.type === 'call911') ? 'Called' : S.call?.on ? 'On the line' : 'Not called'}</span>`;
  }
  function updateSide() {
    $$('.mlab-side-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.v === S.side));
    const box = $('[data-side]'); if (!box) return;
    if (S.side === 'log') {
      box.innerHTML = S.log.filter(e => e.type !== 'auto' || e.d.on).length ? `<ol class="mlab-log">${S.log.filter(e => !(e.type === 'auto' && !e.d.on)).slice().reverse().map(e => e.type === 'judge' ? `<li class="j"><time>${fmt(e.t)}</time><b>Judge</b> ${esc(e.d.text)}</li>` : `<li class="r${e.r}"><time>${fmt(e.t)}</time><b>R${e.r}</b> ${esc(e.type === 'move' ? 'Moved to ' + LOC_NAME[e.d.to] : e.type === 'auto' ? 'Started 30:2 cycles' : ACT[e.type]?.[0] || e.type)}${e.say ? `<q>${esc(e.say)}</q>` : ''}</li>`).join('')}</ol>` : '<p class="mlab-empty">Actions you take appear here with your narration.</p>';
      return;
    }
    if (S.side === 'pts') {
      const A = S.A, B = S.B, tq = B.tq;
      box.innerHTML = `<div class="mlab-pts"><div class="mlab-pt"><span>PATIENT A</span><b>${LAB.patients.A.name}</b><small>${LAB.patients.A.age} · ${LAB.patients.A.where}</small><dl><dt>Status</dt><dd>${esc(A.status)}</dd><dt>Chest</dt><dd>${A.exposed ? 'Exposed' : 'Covered by jacket'}${A.patch && A.exposed ? ' · medication patch, upper right chest' : ''}</dd><dt>AED</dt><dd>${A.on ? 'On' : 'Off'} · shocks ${A.shocks}</dd></dl></div>
        <div class="mlab-pt"><span>PATIENT B</span><b>${LAB.patients.B.name}</b><small>${LAB.patients.B.age} · ${LAB.patients.B.where}</small><dl><dt>Injury</dt><dd>Deep cut, right thigh, 6 in above knee</dd><dt>Bleeding</dt><dd>${['Stopped', 'Slow ooze', 'Slowed', 'Heavy'][B.bleed]}</dd><dt>Tourniquet</dt><dd>${tq ? `${tq.zone === 'above' ? '2–3 in above wound' : tq.zone}${tq.secured ? ' · secured' : ''}${tq.time ? ' · noted ' + tq.time : ''}` : 'None'}</dd><dt>Medical ID</dt><dd>${B.found.medId ? 'Asthma bracelet' : 'Not checked'}</dd></dl></div></div>`;
      return;
    }
    if (!S.help) { box.innerHTML = `<div class="mlab-locked"><b>Rating sheet hidden</b><p>Graded runs work like competition: you see your scores after you finish.</p><p>${TOTAL} points across three sheets · ${Math.round(MASTERY * 100)}% mastery.</p></div>`; return; }
    const g = grade(S.log);
    const order = S.active === 1 ? ['IIA'] : ['IV', 'IIB'];
    const next = !S.learn && order.map(id => g.sheets.find(s => s.id === id).items.find(i => !i.earned)).find(Boolean);
    box.innerHTML = `<div class="mlab-sheet-top"><div class="mlab-score"><b>${g.earned}</b><span>/ ${TOTAL} pts</span><div class="mlab-bar"><i style="width:${g.pct * 100}%"></i><em style="left:${MASTERY * 100}%"></em></div></div>
      ${next ? `<p class="mlab-next"><span>NEXT ON RESCUER ${S.active}’S SHEET</span>${esc(next.text)}</p>` : ''}
      </div><div class="mlab-sheets">${g.sheets.map(sh => `<details open class="${order.includes(sh.id) ? 'mine' : ''}"><summary><b>${esc(sh.title)}</b><small>${esc(sh.who)} · ${sh.earned}/${sh.possible}</small></summary><ul class="mlab-sheet">${sh.items.map(it => `<li class="${it.earned ? 'ok' : ''}" ${it.earned ? '' : `title="${esc(it.note)}"`}><i>${it.earned ? '✓' : ''}</i><span>${esc(it.n)}</span><p>${esc(it.text)}</p><em>${it.pts}</em></li>`).join('')}</ul></details>`).join('')}</div>`;
  }
  function updateAll() { if (!S || !$('.mlab-shell')) return; updateScene(); updateTop(); updateVitals(); updatePhases(); updateSide(); updateCycles(); renderCoach(); if (S.menu) renderMenu(); }

  function tick() {
    if (!S || S.done) return;
    const t = now(), left = LAB.limitSec - t;
    const tm = $('[data-timer]');
    if (tm) {
      tm.textContent = S.learn ? fmt(t) : left >= 0 ? fmt(left) : '+' + fmt(-left);
      tm.classList.toggle('low', !S.learn && left < 120); tm.classList.toggle('over', !S.learn && left < 0); tm.classList.toggle('paused', !!S.pauseAt);
    }
    const c = $('[data-clock]'); if (c) c.textContent = `${clock()} · Lakeside Park`;
    if (S.switchAt) { const st = $('[data-switch-t]'); if (st) st.textContent = ((performance.now() - S.switchAt) / 1000).toFixed(1) + ' s'; }
    if (S.B.bleed > 0 && !S.pauseAt) S.bleedPool = (S.bleedPool || 0) + S.B.bleed * .0025;
    if (S.panel?.id === 'checkBP' && S.panel.startAt) { const p = $('[data-ptimer]'); if (p) p.textContent = ((performance.now() - S.panel.startAt) / 1000).toFixed(1) + ' s'; }
    updateScene();
    if (!S.ems && !S.learn && t > 630) { emsArrives(); updateAll(); }
    if (S.mode === 'graded' && left <= 0) finish(true);
  }

  // ---------- modal, finish, report ----------
  function openModal(kind) {
    const m = $('[data-modal]'); if (!m) return;
    if (kind === 'scenario') m.innerHTML = `<div class="mlab-dialog scen" role="dialog" aria-label="Scenario"><span class="eyebrow">${S.learn ? 'SCENARIO · LEARN MODE' : 'SECRET SCENARIO · CLOCK RUNNING'}</span><h3>${esc(LAB.title)}</h3>${LAB.scenario.map(p => `<p>${esc(p)}</p>`).join('')}<dl><dt>Location</dt><dd>${esc(LAB.location)}</dd><dt>Your cell phone</dt><dd>${esc(LAB.phone)}</dd><dt>Skills</dt><dd>${LAB.skills.map(esc).join('<br>')}</dd></dl>${S.learn ? '<p class="mlab-note">The coach above the scene will tell you exactly what to click, why, and what to say. Gold outlines show where to click.</p>' : '<p class="mlab-note">Tip: hover over anything in the scene to see what it is. Click it to act.</p>'}<div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="modalClose">${S.learn ? 'Start the lesson' : 'Begin care'}</button></div></div>`;
    if (kind === 'finish') m.innerHTML = `<div class="mlab-dialog" role="dialog" aria-label="Finish"><h3>Finish and grade this run?</h3><p>You can’t add more actions after grading.${S.ems ? '' : ' EMS has not arrived yet, so the summary steps will score zero.'}</p><div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="finishYes">Grade my run</button><button type="button" class="mlab-btn ghost" data-act="modalClose">Keep working</button></div></div>`;
    m.hidden = false; m.querySelector('button')?.focus();
  }
  function finish(timeUp) {
    if (!S || S.done) return; S.done = true;
    if (S.pending) { S.pending.say = $('[data-narrate] input')?.value || ''; S.pending = null; }
    if (S.pauseAt) { S.pausedMs += performance.now() - S.pauseAt; S.pauseAt = 0; }
    const secs = now(); stopAll();
    const g = grade(S.log);
    saveRun({mode: S.mode, earned: g.earned, pct: g.pct, secs, at: Date.now()});
    const log = S.log;
    screen.innerHTML = `<div class="mlab-report">
      <header><span class="eyebrow">${MODES[S.mode].toUpperCase()} RESULT · LAB ${LAB.number}</span><h2>${esc(LAB.title)}</h2>${timeUp ? '<p class="mlab-timeup">Time! The 12-minute limit ended the run.</p>' : ''}</header>
      <div class="mlab-result"><div class="ring" style="--p:${g.pct * 100}"><b>${Math.round(g.pct * 100)}%</b><small>${g.earned} / ${TOTAL}</small></div>
        <div><h3>${g.pass ? 'Mastery met' : 'Below mastery'}</h3><p>${g.pass ? 'You cleared the 70% mastery line HOSA uses for recognition.' : `You need ${(TOTAL * MASTERY).toFixed(1)} points (70%) for recognition. Review the missed steps below.`}${S.learn ? ' Next, try Practice mode without the coach.' : ''}</p><p class="mlab-note">Time used: ${fmt(secs)}${S.learn ? '' : ' of 12:00'} · ${log.filter(e => e.say).length} narrated actions</p></div></div>
      ${g.sheets.map(sh => `<section class="mlab-rsheet"><header><b>${esc(sh.title)}</b><small>${esc(sh.who)}</small><span class="${sh.mastery ? 'ok' : 'no'}">${sh.earned} / ${sh.possible}</span></header>
        <table><thead><tr><th>#</th><th>Task</th><th>Possible</th><th>Awarded</th></tr></thead><tbody>${sh.items.map(it => `<tr class="${it.earned ? 'ok' : 'miss'}"><td>${esc(it.n)}</td><td>${esc(it.text)}${it.note ? `<small>${esc(it.note)}</small>` : ''}</td><td>${it.pts}</td><td>${it.earned}</td></tr>`).join('')}</tbody></table></section>`).join('')}
      <details class="mlab-rlog"><summary>Full action log (${log.length})</summary><ol class="mlab-log">${log.filter(e => !(e.type === 'auto')).map(e => e.type === 'judge' ? `<li class="j"><time>${fmt(e.t)}</time><b>Judge</b> ${esc(e.d.text)}</li>` : `<li class="r${e.r}"><time>${fmt(e.t)}</time><b>R${e.r}</b> ${esc(e.type === 'move' ? 'Moved to ' + LOC_NAME[e.d.to] : ACT[e.type]?.[0] || e.type)}${e.say ? `<q>${esc(e.say)}</q>` : ''}</li>`).join('')}</ol></details>
      <div class="mlab-row"><button type="button" class="mlab-btn primary" data-act="again">Run the lab again</button></div></div>`;
    screen.scrollIntoView({block: 'start', behavior: 'smooth'});
  }
  function stopAll() { clearInterval(tickId); clearInterval(autoId); clearInterval(pressId); stopMetro(); cancelAnimationFrame(raf); for (const id of timers) clearTimeout(id); timers.clear(); tickId = autoId = pressId = 0; if (S) S.auto = null; }

  // ---------- events ----------
  function onClick(e) {
    const hot = e.target.closest('[data-hot]');
    if (hot && el.contains(hot)) { e.preventDefault(); return openMenu(hot.dataset.hot, e.clientX, e.clientY); }
    const t = e.target.closest('[data-act],[data-tool],[data-pset],[data-tqz],[data-tap]');
    if (S?.menu && !e.target.closest('[data-menu]')) closeMenu();
    if (!t || !el.contains(t)) return;
    if (t.matches('[data-tap]')) return tap();
    if (t.dataset.tool) return useTool(t.dataset.tool);
    if (t.dataset.tqz) return tqAct('place', t.dataset.tqz);
    if (t.dataset.pset) {
      const P = S.panel, k = t.dataset.pset, v = t.dataset.v;
      if (/^seal\d/.test(k)) P.seal[+k.slice(4)] = v === '1';
      else if (/^step\d/.test(k)) P.steps[+k.slice(4)] = v === '1';
      else P[k] = v;
      return renderPanel();
    }
    const a = t.dataset.act, P = S?.panel;
    switch (a) {
      case 'start': if (chosenMode) start(chosenMode); break;
      case 'again': showIntro(); break;
      case 'who': S.active = +t.dataset.r; hint(''); updateAll(); break;
      case 'menuWho': S.active = +t.dataset.r; updateAll(); break;
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
      case 'swap': doSwap(); break;
      case 'bpStart': P.startAt = performance.now(); $('.ml-scene')?.classList.add('checking'); renderPanel(); break;
      case 'bpStop': { const secs = (performance.now() - P.startAt) / 1000; P.startAt = 0; P.secs = secs; $('.ml-scene')?.classList.remove('checking'); const d = {method: P.method, site: P.site, fingers: P.fingers, secs}; S.panel = null; renderPanel(); record('checkBP', P.r, d); break; }
      case 'handSpot': { if (S.pending) return; const R = S.r[P.r]; R.hands = t.dataset.v; R.stack = false; S.panel = null; renderPanel(); record('hands', P.r, {spot: t.dataset.v}); break; }
      case 'postureSet': { const v = t.dataset.v; S.r[P.r].posture = v; S.panel = null; renderPanel(); record('posture', P.r, {straight: v !== 'bent', over: v === 'good', choice: v}); break; }
      case 'holdsReset': P.holds = []; renderPanel(); break;
      case 'maskDone': { const d = {orient: P.orient, seal: P.seal.slice(), holds: P.holds.slice()}; S.panel = null; renderPanel(); record('pocketMask', P.r, d); break; }
      case 'ecDone': { const R = S.r[P.r]; R.sealed = true; P.sealed = true; renderPanel(); record('ecClamp', P.r, {steps: P.steps.slice(), loc: R.loc}); break; }
      case 'glovesOffSet': { const R = S.r[P.r]; R.gloves = 'off'; S.panel = null; renderPanel(); record('glovesOff', P.r, {proper: t.dataset.v === 'proper', method: t.dataset.v}); break; }
      case 'reportSend': { const text = $('[data-report]')?.value.trim(); if (!text) return hint('Type your report first.', 'warn'); const pt = P.patient; S.panel = null; renderPanel(); sayBubble(P.r, text); record('emsReport', P.r, {patient: pt}, {say: text}); if (S.help) hint(`Report covered: ${reportScore(pt, text).join(', ') || 'none of the key points'}.`, reportScore(pt, text).length >= 4 ? 'ok' : 'warn'); break; }
      case 'aedOn': case 'padSel': case 'padZone': case 'patchOff': case 'padsApply': case 'analyze': case 'shockBtn': aedAction(a, t.dataset.v); break;
      case 'dial': case 'dialClear': case 'dialCall': case 'reply': case 'hangup': phoneAct(a, t.dataset.v); break;
      case 'tqPullStep': case 'tqPullDone': case 'tqTwistStep': case 'tqTwistDone': case 'tqSecureBtn': case 'tqTimeBtn': tqAct(a); break;
    }
  }
  function tqAct(a, zone) {
    if (S.pending) return hint('Log your narration first.', 'warn');
    const P = S.panel, B = S.B, r = P.r;
    if (a === 'place') { if (B.tq?.pulled) return hint('The tourniquet is already tightened.', 'warn'); B.tq = {zone, tight: 0, turns: 0, pulled: false, twisted: false, secured: false}; P.tight = 0; P.turns = 0; soil(r); renderPanel(); return record('tqPlace', r, {zone}); }
    const tq = B.tq; if (!tq) return;
    if (a === 'tqPullStep') { P.tight = Math.min(100, P.tight + 34); tq.tight = P.tight; }
    if (a === 'tqPullDone') { tq.pulled = true; renderPanel(); return record('tqPull', r, {tight: tq.tight >= 100 ? 100 : tq.tight}); }
    if (a === 'tqTwistStep') {
      P.turns++; tq.turns = P.turns;
      const works = tq.zone === 'above' || tq.zone === 'hip';
      if (works) B.bleed = Math.max(0, (B.pressured ? 2 : 3) - P.turns + (tq.tight < 100 ? 1 : 0));
      const w = $('.ml-windlass'); if (w) w.style.transform = `rotate(${P.turns * 180}deg)`;
    }
    if (a === 'tqTwistDone') { tq.twisted = true; renderPanel(); return record('tqTwist', r, {turns: tq.turns, stopped: B.bleed === 0}); }
    if (a === 'tqSecureBtn') { tq.secured = true; renderPanel(); return record('tqSecure', r); }
    if (a === 'tqTimeBtn') { tq.time = clock(); renderPanel(); return record('noteTime', r, {clock: tq.time}); }
    renderPanel(); updateAll();
  }
  function doSwap() {
    if (!S.switchAt) return;
    const secs = (performance.now() - S.switchAt) / 1000; S.switchAt = 0; $('[data-switch]').hidden = true;
    const comp = [1, 2].find(r => S.r[r].loc === 'A-side'), vent = 3 - comp;
    S.r[comp].loc = 'A-head'; S.r[vent].loc = 'A-side';
    Object.assign(S.r[vent], {hands: 'lower', stack: true, posture: 'good', sealed: false}); Object.assign(S.r[comp], {hands: null, stack: false, posture: null, sealed: false});
    S.twoCycles = 0; S.active = vent;
    record('swap', vent, {secs, cycles: S.twoCycles}, {quiet: true});
    if (!S.learn) hint(`Switched in ${secs.toFixed(1)} s. Rescuer ${vent} now compresses; Rescuer ${comp} ventilates with the bag mask.`, secs < 5 ? 'ok' : 'warn');
    updateAll();
  }
  function onSubmit(e) {
    if (!e.target.matches('[data-narrate]')) return; e.preventDefault();
    const text = e.target.querySelector('input').value;
    if (!text.trim()) return hint('Type what you say or do, or press Skip.', 'warn');
    closeNarration(text);
  }
  function onInput(e) {
    if (e.target.matches('[data-pin="depth"]')) { S.panel.depth = +e.target.value; const v = $('[data-depthv]'); if (v) v.textContent = S.panel.depth.toFixed(1) + ' in'; }
  }
  function onChange(e) {
    if (e.target.name === 'mlab-mode') { chosenMode = e.target.value; const b = $('[data-act="start"]'); b.disabled = false; b.textContent = `Start ${MODES[chosenMode].toLowerCase()} mode`; }
    if (e.target.matches('[data-metro]')) e.target.checked ? startMetro() : stopMetro();
  }
  function onDown(e) {
    if (!S) return;
    if (e.target.closest('[data-hold]')) { e.preventDefault(); holdDown(); }
    const pad = e.target.closest('[data-ppad]');
    if (pad && S.panel?.id === 'pressure' && !S.pending) { e.preventDefault(); if (!startPressure()) return; S.panel.holding = true; pressAt(e.clientY); pad.classList.add('on'); }
  }
  function onMove(e) { if (S?.panel?.id === 'pressure' && S.panel.holding && e.pointerType !== undefined) pressAt(e.clientY); }
  function onUp() { if (!S) return; holdUp(); if (S.panel?.id === 'pressure' && S.panel.holding) { S.panel.holding = false; $('[data-ppad]')?.classList.remove('on'); } }
  function onOver(e) { if (e.pointerType === 'touch') return; const hot = e.target.closest?.('[data-hot]'); if (hot && el.contains(hot)) showTip(hot); }
  function onOut(e) { const hot = e.target.closest?.('[data-hot]'); if (hot && !hot.contains(e.relatedTarget)) hideTip(); }
  const typing = e => /input|textarea|select/i.test(e.target.tagName) && e.target.type !== 'range' && e.target.type !== 'checkbox' && e.target.type !== 'radio';
  function onKey(e) {
    if (!S || S.done || !$('.mlab-shell')) return;
    if (e.key === 'Escape') { if (S.menu) return closeMenu(); if (S.panel && !S.pending) return closePanel(); }
    if (e.key === 'Enter' && e.target.matches('[data-reply]')) { e.preventDefault(); return phoneAct('reply'); }
    if (typing(e)) return;
    if ((e.key === '1' || e.key === '2') && !S.pending) { S.active = +e.key; updateAll(); }
    if (e.key === 's' && S.switchAt) { e.preventDefault(); doSwap(); }
    if (e.code === 'Space' && S.panel?.id === 'compress') { e.preventDefault(); if (!e.repeat) tap(); }
    if (e.code === 'Space' && S.panel?.id === 'pressure' && !e.repeat) { e.preventDefault(); if (startPressure()) { S.panel.holding = true; if (!S.panel.force) S.panel.force = 50; } }
    if (S.panel?.id === 'pressure' && /Arrow(Up|Down)/.test(e.key)) { e.preventDefault(); S.panel.force = Math.max(0, Math.min(100, S.panel.force + (e.key === 'ArrowUp' ? 5 : -5))); }
    if (e.code === 'Space' && S.panel?.holds && !e.repeat && !holdStart) { e.preventDefault(); holdDown(); }
  }
  function onKeyUp(e) {
    if (!S) return;
    if (e.code === 'Space' && S.panel?.id === 'pressure') S.panel.holding = false;
    if (e.code === 'Space' && holdStart) holdUp();
  }

  el.addEventListener('click', onClick); el.addEventListener('pointerdown', onDown); el.addEventListener('submit', onSubmit); el.addEventListener('input', onInput); el.addEventListener('change', onChange);
  el.addEventListener('pointerover', onOver); el.addEventListener('pointerout', onOut);
  window.addEventListener('pointerup', onUp); window.addEventListener('pointermove', onMove); document.addEventListener('keydown', onKey); document.addEventListener('keyup', onKeyUp);
  showIntro();
  return () => {
    disposed = true; stopAll(); fitObs?.disconnect();
    window.removeEventListener('pointerup', onUp); window.removeEventListener('pointermove', onMove); document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKeyUp);
    try { audio?.close(); } catch {}
  };
}
