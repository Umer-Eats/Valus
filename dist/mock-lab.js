// Valus mock procedure lab: an interactive skills station graded against HOSA rating sheets.
// Lab 01 is CPR/First Aid. The student controls both rescuers and works in the scene itself:
// click a patient, the kit, the phone or the AED to see what you can do there.
// Modes: Learn (a coach teaches every step), Practice (live rating sheet), Graded (competition rules).
// After each action the student types what they say or do; grading reads that action log.
import {LAB, grade, PATTERNS as RX, reportScore, REPORT_GROUPS, TOTAL, MASTERY} from './mock-lab-cpr.js';
import {LEARN, PANEL_TIPS} from './mock-lab-learn.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const hasMockLab = name => name === LAB.event;
export const mockLabPage = () => `<section class="mlab" data-mlab aria-label="Mock procedure lab"><div data-mlab-screen></div></section>`;

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
const tabOf = id => TRAY.findIndex(([, items]) => items.some(t => t[0] === id));

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
    <path class="ml-limb ml-kneel" d="M-20 382 L8 416 L-36 419"/>
    <path class="ml-limb ml-stand" d="M-14 372 L-18 419 M-4 372 L2 419"/>
    <g class="ml-upper">
      <path class="ml-torso" d="M-32 388 Q-34 344 -16 328 L6 328 Q14 344 8 388 Z"/>
      <circle class="ml-head" cx="-4" cy="308" r="14"/><path class="ml-hair" d="M-18 305 Q-16 290 -2 292 Q10 293 10 304 Q0 298 -18 305Z"/>
      <rect class="ml-goggle" x="0" y="302" width="12" height="6" rx="3"/>
      <rect class="ml-phone-held" x="7" y="300" width="7" height="13" rx="2"/>
      <g class="ml-talk"><path d="M18 298 q7 8 0 16"/><path d="M25 293 q12 13 0 26"/></g>
      <g class="ml-armg"><path class="ml-arm" d="M0 336 L40 386"/><circle class="ml-hand" cx="40" cy="388" r="6.5"/></g>
    </g></g>
    <g class="ml-tag"><circle cx="-4" cy="276" r="11"/><text x="-4" y="280">R${r}</text></g>
    <rect class="ml-hot hs-res" data-hot="r${r}" x="-36" y="262" width="66" height="112" rx="14"/></g>`;
}

function sceneSvg() {
  return `<svg class="ml-scene" viewBox="0 0 1000 440" role="img" aria-label="Lakeside Park finish area. Marcus lies on the grass past the finish arch. Jordan sits beside the water table with a bleeding leg. Click people and objects to act.">
  <defs><linearGradient id="mlSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ml-sky1"/><stop offset="1" class="ml-sky2"/></linearGradient>
  <linearGradient id="mlMylar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9edf2"/><stop offset=".5" stop-color="#b9c2cc"/><stop offset="1" stop-color="#d8b55a"/></linearGradient></defs>
  <rect width="1000" height="440" fill="url(#mlSky)"/>
  <g class="ml-trees"><circle cx="70" cy="250" r="46"/><circle cx="130" cy="262" r="36"/><circle cx="520" cy="246" r="52"/><circle cx="590" cy="262" r="38"/><circle cx="760" cy="250" r="44"/></g>
  <rect class="ml-road" y="292" width="1000" height="26"/><path class="ml-lane" d="M0 305 H1000"/>
  <g class="ml-amb" data-s="amb"><rect x="0" y="262" width="118" height="42" rx="6"/><rect class="ml-amb-cab" x="88" y="270" width="30" height="20" rx="3"/><path class="ml-amb-cross" d="M38 274h10v-8h8v8h10v8H56v8h-8v-8H38z"/><rect class="ml-amb-light l1" x="20" y="256" width="14" height="7" rx="2"/><rect class="ml-amb-light l2" x="60" y="256" width="14" height="7" rx="2"/><circle class="ml-wheel" cx="24" cy="305" r="8"/><circle class="ml-wheel" cx="94" cy="305" r="8"/><rect class="ml-hot" data-hot="amb" x="-4" y="250" width="126" height="66" rx="10"/></g>
  <rect class="ml-ground" y="318" width="1000" height="122"/>
  <g class="ml-arch"><rect x="30" y="118" width="11" height="202"/><rect x="452" y="118" width="11" height="202"/><rect class="ml-banner" x="22" y="108" width="450" height="36" rx="5"/><text x="247" y="132">FINISH · LAKESIDE 5K</text></g>
  <g class="ml-tent"><path class="ml-tent-roof" d="M836 232 L912 196 L992 232 Z"/><rect x="846" y="232" width="138" height="88"/><text x="915" y="252">REGISTRATION</text>
    <g data-s="aedTent" class="ml-aed-cab"><rect x="944" y="268" width="30" height="34" rx="4"/><path d="M959 278 l-5 9 h5 l-3 8 l8 -11 h-5 l3 -6z"/><text x="959" y="314">AED</text></g></g>
  <g class="ml-table"><rect x="600" y="340" width="122" height="8" rx="2"/><path d="M610 348 V384 M712 348 V384"/><rect class="ml-jug" x="618" y="314" width="22" height="26" rx="5"/><rect class="ml-jug" x="652" y="318" width="20" height="22" rx="5"/><rect class="ml-cup" x="684" y="330" width="8" height="10"/><rect class="ml-cup" x="696" y="330" width="8" height="10"/></g>
  <g class="ml-glass" data-s="glass"><path d="M730 420 l8 -9 l5 9z M748 421 l4 -7 l7 7z M716 422 l10 -5 l2 5z M760 422 l3 -10 l6 10z"/></g>
  <g class="ml-kit" data-s="kit"><rect x="500" y="398" width="44" height="22" rx="4"/><rect class="ml-kit-lid" x="500" y="392" width="44" height="8" rx="3"/><path class="ml-kit-cross" d="M518 403h8v4h4v6h-4v4h-8v-4h-4v-6h4z"/></g>
  <g class="ml-phoneobj"><rect x="554" y="404" width="11" height="17" rx="2.5"/><rect class="scr" x="556" y="406" width="7" height="11" rx="1"/></g>
  ${rescuerSvg(1)}${rescuerSvg(2)}
  <g class="ml-pa" data-s="pa">
    <ellipse class="ml-shadow" cx="290" cy="421" rx="176" ry="5"/>
    <path class="ml-leg" d="M300 408 L448 412"/><rect class="ml-shoe" x="444" y="400" width="14" height="20" rx="5"/>
    <rect class="ml-shorts" x="258" y="394" width="50" height="25" rx="9"/>
    <g class="ml-chest" data-s="chestA">
      <rect class="ml-shirt" x="152" y="388" width="112" height="31" rx="13"/>
      <rect class="ml-patch" x="168" y="389" width="13" height="9" rx="2"/>
      <g class="ml-pads"><rect class="ml-pad" x="170" y="386" width="18" height="9" rx="2"/><rect class="ml-pad" x="226" y="388" width="18" height="9" rx="2"/></g>
      <g class="ml-jacket"><rect class="ml-jk-closed" x="150" y="386" width="116" height="33" rx="13"/><rect class="ml-jk-open" x="144" y="404" width="22" height="16" rx="6"/><rect class="ml-jk-open" x="250" y="404" width="24" height="16" rx="6"/></g>
    </g>
    <path class="ml-arm-p" d="M168 414 L252 417"/>
    <circle class="ml-skin" cx="136" cy="403" r="15"/><path class="ml-hair-p" d="M122 410 Q118 392 132 388 Q124 400 126 414Z"/>
    <path class="ml-pmask" d="M140 384 L154 392 L134 394 Z"/>
    <g class="ml-bvm"><path class="ml-pmask" d="M136 382 L156 392 L132 395 Z"/><rect x="104" y="356" width="40" height="18" rx="9" transform="rotate(-25 124 365)"/></g>
    <g class="ml-aedA"><path class="ml-cable" d="M330 404 Q300 380 180 389 M330 404 Q300 386 236 391"/><rect class="ml-aed-box" x="318" y="396" width="38" height="24" rx="5"/><rect class="ml-aed-scr" x="324" y="401" width="16" height="9" rx="2"/><circle class="ml-aed-btn" cx="348" cy="410" r="4"/></g>
  </g>
  <g class="ml-pb" data-s="pb">
    <ellipse class="ml-pool" cx="806" cy="423" rx="18" ry="3.5"/>
    <path class="ml-leg ml-legB" d="M884 412 L762 414"/><rect class="ml-shoe" x="752" y="400" width="12" height="20" rx="5"/>
    <rect class="ml-shortsB" x="856" y="398" width="40" height="22" rx="8"/>
    <g class="ml-sit"><path class="ml-torsoB" d="M870 412 Q868 368 878 350 L896 350 Q904 380 902 412Z"/><circle class="ml-skin" cx="886" cy="334" r="14"/><path class="ml-hairB" d="M872 334 Q872 316 888 318 Q902 320 902 336 Q894 324 872 334Z"/><path class="ml-armB" d="M880 360 L846 398"/></g>
    <g class="ml-lie"><rect class="ml-torsoB2" x="880" y="394" width="74" height="26" rx="11"/><circle class="ml-skin" cx="970" cy="406" r="14"/><path class="ml-armB" d="M890 414 L950 416"/></g>
    <circle class="ml-bracelet" cx="848" cy="397" r="3.5"/>
    <g class="ml-wound"><ellipse cx="826" cy="404" rx="8" ry="3"/><g class="ml-drops"><circle class="ml-drop d1" cx="824" cy="408" r="2.4"/><circle class="ml-drop d2" cx="829" cy="408" r="2"/><circle class="ml-drop d3" cx="820" cy="408" r="1.8"/></g></g>
    <rect class="ml-dressing" x="814" y="396" width="24" height="13" rx="2"/>
    <g class="ml-tq"><rect x="850" y="395" width="9" height="24" rx="2"/><g class="ml-windlass"><rect x="842" y="391" width="25" height="4" rx="2"/></g></g>
    <path class="ml-blanket" d="M752 404 Q860 376 988 392 L988 421 L752 421 Z"/>
  </g>
  <g class="ml-hots">
    <rect class="ml-hot" data-hot="glass" x="706" y="402" width="70" height="26" rx="8"/>
    <rect class="ml-hot" data-hot="kit" x="494" y="384" width="54" height="40" rx="8"/>
    <rect class="ml-hot" data-hot="phone" x="550" y="398" width="20" height="28" rx="6"/>
    <rect class="ml-hot" data-hot="aGround" x="270" y="394" width="196" height="34" rx="10"/>
    <rect class="ml-hot" data-hot="aChest" x="160" y="376" width="106" height="46" rx="12"/>
    <rect class="ml-hot" data-hot="aHead" x="110" y="378" width="50" height="44" rx="14"/>
    <rect class="ml-hot hs-aedA" data-hot="aedA" x="314" y="390" width="46" height="34" rx="8"/>
    <rect class="ml-hot hs-aedTent" data-hot="aedTent" x="936" y="262" width="46" height="58" rx="8"/>
    <rect class="ml-hot hs-sit" data-hot="bBody" x="860" y="314" width="50" height="98" rx="14"/>
    <rect class="ml-hot hs-lie" data-hot="bBody" x="876" y="386" width="112" height="36" rx="12"/>
    <rect class="ml-hot" data-hot="bLeg" x="786" y="390" width="70" height="32" rx="10"/>
  </g>
  <rect class="ml-flash" width="1000" height="440"/>
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
  const screen = el.querySelector('[data-mlab-screen]');
  const storeKey = 'valus-mocklab-' + LAB.id;
  let S = null, disposed = false, tickId = 0, autoId = 0, raf = 0, pressId = 0, audio = null, metroId = 0;
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!disposed) fn(); }, ms); timers.add(id); return id; };
  const $ = sel => el.querySelector(sel);
  const $$ = sel => [...el.querySelectorAll(sel)];
  const history = () => { try { return JSON.parse(localStorage.getItem(storeKey) || '[]'); } catch { return []; } };
  const saveRun = run => { try { const h = history(); h.push(run); localStorage.setItem(storeKey, JSON.stringify(h.slice(-20))); } catch {} };

  let chosenMode = null;
  const showIntro = () => { stopAll(); S = null; chosenMode = null; screen.innerHTML = introHtml(history()); };

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
    updateAll();
    requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.remove('ml-noanim')));
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
          <div class="mlab-ptag a" data-ptag="A"></div><div class="mlab-ptag b" data-ptag="B"></div>
          <div class="mlab-say r1" data-say="1" hidden></div><div class="mlab-say r2" data-say="2" hidden></div>
          <div class="mlab-bubble judge" data-judge hidden></div>
          <div class="mlab-bubble patient" data-pbubble hidden></div>
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
        <div class="mlab-tray">
          <div class="mlab-tray-head"><b>All tools</b><small>Same actions as clicking the scene</small></div>
          <div class="mlab-tabs" role="tablist">${TRAY.map((t, i) => `<button type="button" role="tab" data-act="tab" data-i="${i}">${t[0]}</button>`).join('')}</div>
          <div class="mlab-tools" data-tools></div>
        </div>
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
    if (st.tool && tabOf(st.tool) >= 0) S.tab = tabOf(st.tool);
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
    else { if (a.n % 3 === 0) breathAnim(560); if (++a.n >= 6) { a.phase = 'c'; a.n = 0; a.cycles++; if (a.mode === 'two') S.twoCycles++; updateCycles(); updateTray(); if (S.help && a.mode === 'two' && S.twoCycles === 5) { hint(`5 cycles done. Click Rescuer ${a.comp} and choose Call switch.`, 'ok'); if (S.learn) coach('5 cycles done — call the switch now!', 'ok'); } } }
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
          <svg class="mlab-neck" viewBox="0 0 240 150"><path class="nk-skin" d="M60 150 Q70 70 120 40 Q170 70 180 150Z"/><path class="nk-jaw" d="M40 40 Q120 95 200 40"/><rect class="nk-trachea" x="108" y="60" width="24" height="90" rx="10"/>
          <rect class="nk-zone ${P.site === 'carotid' ? 'on' : ''}${L ? ' pick' : ''}" data-pset="site" data-v="carotid" x="78" y="74" width="26" height="54" rx="10"/><rect class="nk-zone ${P.site === 'trachea' ? 'on' : ''}" data-pset="site" data-v="trachea" x="106" y="78" width="28" height="50" rx="10"/><rect class="nk-zone ${P.site === 'clav' ? 'on' : ''}" data-pset="site" data-v="clav" x="140" y="128" width="40" height="18" rx="8"/>
          <text x="54" y="70">groove</text><text x="120" y="72">trachea</text><text x="186" y="142">collarbone</text></svg>
          <label class="mlab-lbl">3 · Fingers</label>${choice('fingers', [['two', '2–3 fingers'], ['thumb', 'Thumb']], P.fingers)}
          <div class="mlab-timerbox"><b data-ptimer>${secs.toFixed(1)} s</b><small>Target 5–10 seconds${P.startAt ? ' · watch the chest' : ''}</small></div>
          <div class="mlab-row">${P.startAt ? `<button type="button" class="mlab-btn primary" data-act="bpStop">End check</button>` : `<button type="button" class="mlab-btn primary" data-act="bpStart" ${P.method && P.site && P.fingers ? '' : 'disabled'}>Start check</button>`}</div>`;
        break;
      }
      case 'hands':
        html = head('Hand position', 'Tap where the heel of your first hand goes.') +
          `<svg class="mlab-torso" viewBox="0 0 240 230"><path class="t-skin" d="M40 20 Q120 0 200 20 L214 210 Q120 228 26 210Z"/><path class="t-line" d="M70 30 Q120 46 170 30"/><rect class="t-sternum" x="110" y="40" width="20" height="104" rx="8"/><path class="t-xiph" d="M112 144 L120 160 L128 144Z"/><circle class="t-nip" cx="80" cy="96" r="4"/><circle class="t-nip" cx="160" cy="96" r="4"/>
           ${[['upper', 104, 40, 32, 34], ['lower', 104, 92, 32, 48], ['xiphoid', 108, 142, 24, 24], ['left', 142, 80, 44, 44]].map(([v, x, y, w, h]) => `<rect class="t-zone ${R.hands === v ? 'on' : ''}${L && v === 'lower' ? ' pick' : ''}" data-act="handSpot" data-v="${v}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`).join('')}
           <text x="120" y="222">patient’s chest · head at top</text></svg>
           <p class="mlab-note">${R.hands ? `Hand set: <b>${{upper: 'upper breastbone', lower: 'lower half of breastbone', xiphoid: 'tip of the breastbone (xiphoid)', left: 'left chest'}[R.hands]}</b>.` : 'No hand placed yet.'}</p>`;
        break;
      case 'posture':
        html = head('Arm posture', 'How are you positioned over the chest?') +
          `<div class="mlab-cards">${[['good', 'Arms straight, shoulders directly over hands', 'M30 20 L30 90 M30 90 L30 120'], ['bent', 'Elbows bent, pushing with arm muscles', 'M30 20 L50 60 L30 120'], ['behind', 'Arms straight, shoulders behind hands', 'M10 20 L40 120']].map(([v, t, p]) => `<button type="button" class="mlab-card${L && v === 'good' ? ' pick' : ''}" data-act="postureSet" data-v="${v}"><svg viewBox="0 0 60 130"><circle cx="${v === 'behind' ? 10 : 30}" cy="12" r="9"/><path d="${p}"/><rect x="5" y="118" width="50" height="8" rx="4"/></svg><span>${t}</span></button>`).join('')}</div>`;
        break;
      case 'compress': {
        const n = P.taps.length, iv = n > 1 ? (P.taps[n - 1] - P.taps[0]) / (n - 1) : 0, rate = iv ? 60000 / iv : 0;
        html = head('Chest compressions', 'Tap the big pad (or press Space) once per compression.') +
          `<div class="mlab-setup">${[['Hands', R.hands ? (S.help ? (R.hands === 'lower' ? '✓ lower half' : '✗ ' + R.hands) : 'set') : '—'], ['2nd hand', R.stack ? 'stacked' : '—'], ['Posture', R.posture ? (S.help ? (R.posture === 'good' ? '✓ straight' : '✗ ' + R.posture) : 'set') : '—'], ['Chest', S.A.exposed ? 'exposed' : 'jacket on']].map(([k, v]) => `<span><small>${k}</small>${v}</span>`).join('')}</div>
          <label class="mlab-lbl" for="ml-depth">1 · Depth <b data-depthv>${P.depth.toFixed(1)} in</b></label><input id="ml-depth" type="range" min="1" max="3" step="0.1" value="${P.depth}" data-pin="depth">${L ? '<div class="mlab-range-note">★ 2.0–2.4 in</div>' : ''}
          <label class="mlab-lbl">2 · Between compressions</label>${choice('recoil', [['full', 'Let the chest recoil fully'], ['lean', 'Keep weight on the chest']], P.recoil)}
          <label class="mlab-lbl">3 · Compress 30 times</label>
          <button type="button" class="mlab-tap" data-tap><b data-tapn>${n}</b><small>/ 30</small></button>
          <div class="mlab-gauge" aria-hidden="true"><div class="g-band"></div><i data-rate style="left:${Math.min(100, Math.max(0, (rate - 60) / 1.2))}%"></i><span style="left:0">60</span><span style="left:33.3%">100</span><span style="left:50%">120</span><span style="left:100%">180</span></div>
          <p class="mlab-note"><b data-ratev>${rate ? Math.round(rate) + '/min' : '—'}</b> · target 100–120/min, 30 in 15–18 s${S.help ? ` · <label class="mlab-inline"><input type="checkbox" data-metro ${metroId ? 'checked' : ''}> Metronome (110/min)</label>` : ''}</p>`;
        break;
      }
      case 'pocketMask': {
        const Q = [['Top hand (nearest the head)', 'Index finger and thumb along the top edge of the mask', 'Palm flat on the center of the mask'], ['Other hand', 'Thumb along the bottom edge of the mask', 'Thumb pressed into the soft tissue under the chin'], ['Remaining fingers', 'On the bony jaw margin, lift the jaw: head tilt–chin lift', 'Push the chin down to open the mouth'], ['Seal', 'Press firmly around the entire outside edge', 'Press only on the top of the mask']];
        html = head('Pocket mask breaths', 'Place, seal, then give 2 breaths.') +
          `<label class="mlab-lbl">1 · Place the mask</label>${choice('orient', [['nose', 'Narrow end over the bridge of the nose'], ['chin', 'Narrow end over the chin']], P.orient)}
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
          `<svg class="mlab-leg" viewBox="0 0 300 120"><path class="lg-skin" d="M10 40 Q150 22 290 46 L290 86 Q150 96 10 84Z"/><circle class="lg-knee" cx="80" cy="62" r="16"/><text x="80" y="110">knee</text><text x="276" y="110">hip</text>
            <ellipse class="lg-wound" cx="160" cy="60" rx="14" ry="6"/>${S.B.dressing ? '<rect class="lg-dress" x="144" y="50" width="32" height="20" rx="3"/>' : ''}
            ${[['below', 104, 'below wound'], ['onWound', 160, 'on wound'], ['above', 200, '2–3 in above'], ['knee', 80, 'on knee'], ['hip', 268, 'hip crease']].map(([v, x, t]) => `<g class="lg-zone ${tq?.zone === v ? 'on' : ''}${L && v === 'above' ? ' pick' : ''}" data-tqz="${v}"><rect x="${x - 12}" y="24" width="24" height="72" rx="6"/><text x="${x}" y="18">${t}</text></g>`).join('')}
            ${tq ? `<rect class="lg-band" x="${{below: 98, onWound: 154, above: 194, knee: 74, hip: 262}[tq.zone]}" y="30" width="12" height="62" rx="3"/>` : ''}</svg>
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
        <svg class="mlab-torso" viewBox="0 0 240 230"><path class="t-skin" d="M40 20 Q120 0 200 20 L214 210 Q120 228 26 210Z"/><rect class="t-sternum" x="110" y="40" width="20" height="104" rx="8"/>${A.exposed ? '' : '<path class="t-jacket" d="M40 20 Q120 0 200 20 L214 210 Q120 228 26 210Z"/><text x="120" y="120" class="t-jtext">jacket over chest</text>'}
        ${A.patch ? '<rect class="t-patch" x="56" y="40" width="24" height="18" rx="3"/><text x="68" y="34" class="t-ptext">patch</text>' : ''}
        ${Object.entries(zones).map(([k, [x, y]]) => `<rect class="t-zone ${P.place.R === k || P.place.L === k ? 'on' : ''}${L && (k === 'UR' || k === 'LS') ? ' pick' : ''}" data-act="padZone" data-v="${k}" x="${x - 18}" y="${y - 14}" width="36" height="28" rx="6"/>`).join('')}
        ${['R', 'L'].filter(p => P.place[p]).map(p => `<rect class="t-pad" x="${zones[P.place[p]][0] - 15}" y="${zones[P.place[p]][1] - 10}" width="30" height="20" rx="4"/><text class="t-padt" x="${zones[P.place[p]][0]}" y="${zones[P.place[p]][1] + 4}">${p === 'R' ? 1 : 2}</text>`).join('')}</svg>
        <div class="mlab-row">${A.patch ? '<button type="button" class="mlab-btn" data-act="patchOff">Remove medication patch</button>' : ''}<button type="button" class="mlab-btn primary" data-act="padsApply" ${P.place.R && P.place.L && !learnBlock ? '' : 'disabled'}>Press pads on</button></div>
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
  function updateTray() {
    const tabs = $$('.mlab-tabs button'); tabs.forEach((b, i) => b.setAttribute('aria-selected', i === S.tab));
    const box = $('[data-tools]'), st = step();
    box.innerHTML = TRAY[S.tab][1].map(([id, label, sub]) => {
      const blocked = gate(id, S.active);
      const on = id.startsWith('mv:') && S.r[S.active].loc === id.slice(3);
      return `<button type="button" class="mlab-tool ${on ? 'here' : ''} ${blocked && S.help ? 'dim' : ''} ${st?.tool === id ? 'coach' : ''}" data-tool="${id}" ${S.pending || S.done ? 'disabled' : ''} title="${esc(blocked || '')}"><b>${label}</b><small>${S.help && blocked ? esc(blocked) : sub}</small></button>`;
    }).join('');
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
      box.innerHTML = `<div class="mlab-pt"><span>PATIENT A</span><b>${LAB.patients.A.name}</b><small>${LAB.patients.A.age} · ${LAB.patients.A.where}</small><dl><dt>Status</dt><dd>${esc(A.status)}</dd><dt>Chest</dt><dd>${A.exposed ? 'Exposed' : 'Covered by jacket'}${A.patch && A.exposed ? ' · medication patch, upper right chest' : ''}</dd><dt>AED</dt><dd>${A.on ? 'On' : 'Off'} · shocks ${A.shocks}</dd></dl></div>
        <div class="mlab-pt"><span>PATIENT B</span><b>${LAB.patients.B.name}</b><small>${LAB.patients.B.age} · ${LAB.patients.B.where}</small><dl><dt>Injury</dt><dd>Deep cut, right thigh, 6 in above knee</dd><dt>Bleeding</dt><dd>${['Stopped', 'Slow ooze', 'Slowed', 'Heavy'][B.bleed]}</dd><dt>Tourniquet</dt><dd>${tq ? `${tq.zone === 'above' ? '2–3 in above wound' : tq.zone}${tq.secured ? ' · secured' : ''}${tq.time ? ' · noted ' + tq.time : ''}` : 'None'}</dd><dt>Medical ID</dt><dd>${B.found.medId ? 'Asthma bracelet' : 'Not checked'}</dd></dl></div>`;
      return;
    }
    if (!S.help) { box.innerHTML = `<div class="mlab-locked"><b>Rating sheet hidden</b><p>Graded runs work like competition: you see your scores after you finish.</p><p>${TOTAL} points across three sheets · ${Math.round(MASTERY * 100)}% mastery.</p></div>`; return; }
    const g = grade(S.log);
    const order = S.active === 1 ? ['IIA'] : ['IV', 'IIB'];
    const next = !S.learn && order.map(id => g.sheets.find(s => s.id === id).items.find(i => !i.earned)).find(Boolean);
    box.innerHTML = `<div class="mlab-score"><b>${g.earned}</b><span>/ ${TOTAL} pts</span><div class="mlab-bar"><i style="width:${g.pct * 100}%"></i><em style="left:${MASTERY * 100}%"></em></div></div>
      ${next ? `<p class="mlab-next"><span>NEXT ON RESCUER ${S.active}’S SHEET</span>${esc(next.text)}</p>` : ''}
      ${g.sheets.map(sh => `<details ${order.includes(sh.id) ? 'open' : ''}><summary><b>${esc(sh.title)}</b><small>${esc(sh.who)} · ${sh.earned}/${sh.possible}</small></summary><ul class="mlab-sheet">${sh.items.map(it => `<li class="${it.earned ? 'ok' : ''}" ${it.earned ? '' : `title="${esc(it.note)}"`}><i>${it.earned ? '✓' : ''}</i><span>${esc(it.n)}</span><p>${esc(it.text)}</p><em>${it.pts}</em></li>`).join('')}</ul></details>`).join('')}`;
  }
  function updateAll() { if (!S || !$('.mlab-shell')) return; updateScene(); updateTop(); updateTray(); updateVitals(); updatePhases(); updateSide(); updateCycles(); renderCoach(); if (S.menu) renderMenu(); }

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
      case 'tab': S.tab = +t.dataset.i; updateTray(); break;
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
    disposed = true; stopAll();
    window.removeEventListener('pointerup', onUp); window.removeEventListener('pointermove', onMove); document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKeyUp);
    try { audio?.close(); } catch {}
  };
}
