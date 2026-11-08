// CERT Skills · Lab 01: SALT triage of three victims after a building collapse.
// Rating sheet: HOSA 2026-27 CERT Skill I, Triage - SALT Method, 32 points, 4 minutes.
import {lab} from '../mock-lab-grade.js';

const TAGS = {red: '#c0392b', yellow: '#e0b84a', green: '#3c8f5c', black: '#1d2026', gray: '#8a8f96'};
const tag = (k, x, y) => Object.entries(TAGS).map(([c, f]) => `<g data-show="${k}=${c}"><rect x="${x}" y="${y}" width="16" height="11" rx="2" fill="${f}" stroke="#fff" stroke-width="1.2"/><path d="M${x + 3} ${y + 3} h10" stroke="#fff" stroke-width="1" opacity=".6"/></g>`).join('');
const TRIAGE = ['Immediate (red)', 'Delayed (yellow)', 'Minimal (green)', 'Expectant (gray)', 'Dead (black)'];
const tagPanel = (right) => ({k: 't', label: 'Tag', choose: [['red', TRIAGE[0]], ['yellow', TRIAGE[1]], ['green', TRIAGE[2]], ['gray', TRIAGE[3]], ['black', TRIAGE[4]]], right: [right], fix: 'Recheck the SALT questions for this victim.'});

export default lab({
  id: 'cert-01', event: 'CERT Skills', number: '01',
  title: 'SALT After the Collapse', heading: 'Disaster scene · triage',
  role: 'CERT member (Rescuer 1)', place: 'Elm Street community center · partial collapse', startClock: {h: 16, m: 5}, limitSec: 4 * 60,
  skills: ['Skill I · Triage - SALT Method'],
  intro: 'Part of the community center roof has collapsed. With your partner, size up the scene, sort the crowd with SALT commands, then assess and tag three victims.',
  scenario: [
    'It is 4:05 PM. A strong storm brought down part of the Elm Street community center roof. Fire and EMS are 20 minutes out.',
    'You are Rescuer 1 on a two-person CERT team. Your jump bag and PPE are at the staging area.',
    'Several people are walking around dazed. Three victims cannot move: A near the debris, B by the doorway, and C sitting on the curb.',
    'Use SALT: Sort, Assess, Lifesaving interventions, Treatment/Transport. Talk to your partner throughout.'
  ],
  infoTab: 'Scene',
  patient: {name: 'Victims', facts: [['Patient A', 'Adult under the debris edge'], ['Patient B', 'Adult by the doorway, bleeding from the thigh'], ['Patient C', 'Teen on the curb holding his leg'], ['Safe area', 'Parking lot across the street'], ['Partner', 'Rescuer 2']]},
  scrub: '#d08a3c', scrub2: '#a86c2c',
  scene: {room: 'outdoor', label: 'The collapse scene. Your jump bag and partner at staging, the damaged building with rubble, and victims A, B and C.',
    deco: [['building', 330, 220], ['cone', 560], ['tree', 960]],
    extra: '<g class="k-rubble"><path d="M380 380 l14 -26 l20 6 l12 -22 l26 10 l18 -8 l20 40z"/></g>',
    top: tag('tagA', 452, 352) + tag('tagB', 662, 352) + tag('tagC', 880, 300)},
  start: 'bag',
  stations: {
    bag: {name: 'Jump bag', tip: 'PPE, triage tags, tourniquets, gauze', art: 'jumpbag', x: 70},
    partner: {name: 'Rescuer 2', tip: 'Your CERT partner', art: 'victim', o: {pose: 'stand', look: {top: '#e0b84a', pants: '#3e4c6c', hair: '#5a4334'}}, x: 150},
    site: {name: 'Damaged building', tip: 'Size up the scene', hot: [222, 120, 216, 200], stand: 300},
    vA: {name: 'Patient A', tip: 'Adult under the debris edge', art: 'victim', o: {pose: 'floor', look: {top: '#7a8a9a', pants: '#4a4a4a', hair: '#2a1d14'}}, x: 470, stand: 560, face: -1},
    vB: {name: 'Patient B', tip: 'Adult by the doorway', art: 'victim', o: {pose: 'floor', look: {top: '#c0504d', pants: '#3e4c6c', hair: '#d9b26b', style: 'long', skin: '#f1d0b5'}}, x: 680, stand: 770, face: -1},
    vC: {name: 'Patient C', tip: 'Teen sitting on the curb', art: 'victim', o: {pose: 'sit', look: {top: '#3f7fbf', pants: '#2a2a2a', hair: '#111', skin: '#8d5a3b'}}, x: 880, stand: 830, face: 1}
  },
  acts: {
    ppe: {at: 'bag', label: 'Don PPE', sub: 'Safety gear', kind: 'PPE', phase: 'Size-up', wear: {cap: true, eyewear: true, mask: true, gloves: 'utility'}, ex: '“Helmet, goggles, work gloves, mask, sturdy boots.”',
      why: 'CERT safety equipment: helmet, protective eyewear, work gloves, mask and sturdy shoes or boots. Helmet, boots and gloves may be verbalized.', say: 'Putting on my helmet, protective eyewear, work gloves and a mask. I’m wearing sturdy boots.',
      panel: [{k: 'p', pick: [['helmet', 'Helmet'], ['eyes', 'Protective eyewear'], ['gloves', 'Work gloves'], ['mask', 'Mask'], ['boots', 'Sturdy shoes or boots'], ['vest', 'Reflective vest only'], ['sandals', 'Sneakers']], need: ['helmet', 'eyes', 'gloves', 'mask', 'boots']}]},
    sizeUp: {at: 'site', label: 'Size up the scene', sub: 'Before you go in', kind: 'size-up', phase: 'Size-up', ex: '“Partial roof collapse, power lines are clear, no fire or gas smell. Three victims down.”',
      why: 'A thorough size-up: gather facts, assess damage, consider probabilities, assess your own situation, and decide if it is safe to enter.',
      say: 'Sizing up: partial roof collapse on the east side, no fire, no smell of gas, power lines are clear, and the rest of the structure looks stable. About a dozen walking people and three victims down. It is safe to enter the open area.',
      panel: [{k: 's', pick: [['facts', 'Gather facts: what happened, how many people'], ['damage', 'Assess damage and hazards (gas, wires, fire, instability)'], ['self', 'Consider your own safety and limits'], ['decide', 'Decide whether it is safe to enter'], ['run', 'Run straight to the loudest victim'], ['enter', 'Enter the collapsed section to search']], need: ['facts', 'damage', 'self', 'decide']}]},
    partnerPlan: {at: 'partner', label: 'Plan with your partner', sub: 'Who does what', talk: true, phase: 'Size-up', ex: '“I’ll call out the commands; you watch for anyone who doesn’t move. Then we go to A first.”',
      why: 'Both rescuers are scored on communication. Agree on the plan and keep each other informed.', say: 'I’ll give the SALT commands. You watch for anyone who can’t move. Then let’s go to the victims who don’t respond, starting with A. Call out anything unsafe.'},
    walk: {at: 'site', label: 'Global sort: walk', sub: 'Command 1', talk: true, phase: 'Sort', ex: '“Everyone who can hear me please move to the parking lot across the street and we will help you!”',
      why: 'SALT step 1: anyone who can walk goes to a designated safe area. Say it loudly, naming the place.', say: 'Everyone who can hear me, please move to the parking lot across the street and we will help you!'},
    wave: {at: 'site', label: 'Global sort: wave', sub: 'Command 2', talk: true, phase: 'Sort', ex: '“If you need help, wave your arm or move your leg and we will be there to help you in a few minutes!”',
      why: 'SALT step 2: those who can wave or move are assessed second. Those who do not move are assessed first.', say: 'If you need help, wave your arm or move your leg, and we will be there to help you in a few minutes!'},
    priority: {at: 'partner', label: 'Go to first priority', sub: 'Still and silent first', talk: true, phase: 'Sort', ex: '“A and B didn’t move. Going to them first.”',
      why: 'Victims who are still or have obvious life threats get individual assessment first.', say: 'Patients A and B did not move and B is bleeding. Moving quickly to them first, then C, who waved.'},
    triageA: {at: 'vA', label: 'Assess Patient A', sub: 'SALT questions, tag', kind: 'triage', phase: 'Assess', set: {tagA: 'black'}, info: {who: 'PATIENT A', text: 'Not breathing · still not breathing after you open the airway'},
      ex: '“Not breathing. Opening the airway… still not breathing. Tagging black.”', why: 'Not breathing? Open the airway once (two rescue breaths for a child). If still not breathing: dead (black).',
      say: 'Patient A is not breathing. Opening the airway with a head tilt, chin lift. Still not breathing. Tagging Patient A dead, black.',
      panel: [{k: 'q', q: [['First check', 'Is the patient breathing?', 'What is the patient’s name?'], ['Not breathing', 'Open the airway once and recheck', 'Start full CPR for 30 minutes']]}, tagPanel('black')]},
    triageB: {at: 'vB', label: 'Assess Patient B', sub: 'SALT questions, tag', kind: 'triage', phase: 'Assess', set: {tagB: 'red'}, info: {who: 'PATIENT B', text: 'Pulse present · breathing fast · bright red bleeding from the thigh, not controlled · follows commands'},
      ex: '“Pulse yes, breathing yes, bleeding not controlled. Tourniquet on. Likely to survive: Immediate, red.”',
      why: 'Peripheral pulse? Breathing normally? Hemorrhage controlled? Follows commands? Any NO means Immediate if likely to survive with available resources. Do the lifesaving intervention (tourniquet) first.',
      say: 'Patient B: has a peripheral pulse, breathing, but the thigh hemorrhage is not controlled. Applying a tourniquet. Follows commands. Likely to survive with available resources. Tagging Patient B immediate, red.',
      panel: [{k: 'q', q: [['Pulse', 'Has a peripheral pulse?', 'What is the blood pressure?'], ['Bleeding', 'Is the hemorrhage controlled? No: apply a tourniquet', 'Ignore it until EMS arrives'], ['Survival', 'Likely to survive with available resources? Yes', 'Not likely; tag gray']]}, tagPanel('red')]},
    triageC: {at: 'vC', label: 'Assess Patient C', sub: 'SALT questions, tag', kind: 'triage', phase: 'Assess', set: {tagC: 'yellow'}, info: {who: 'PATIENT C', text: 'Pulse present · breathing normally · no active bleeding · follows commands · deformed lower leg, cannot walk'},
      ex: '“Yes to pulse, breathing, bleeding controlled, follows commands. Injury isn’t minor. Delayed, yellow.”',
      why: 'Yes to pulse, breathing, bleeding controlled and follows commands. If injuries are not minor and need care: Delayed (yellow). If minor: Minimal (green).',
      say: 'Patient C: has a peripheral pulse, breathing normally, no uncontrolled bleeding, follows commands. The leg injury is not minor and needs care. Tagging Patient C delayed, yellow.',
      panel: [{k: 'q', q: [['Commands', 'Follows commands or makes purposeful movement? Yes', 'Can’t tell; skip it'], ['Injuries', 'Injuries are not minor and require care', 'Injuries are minor; he can walk it off']]}, tagPanel('yellow')]},
    handoff: {at: 'partner', label: 'Update your partner', sub: 'Report the tags', talk: true, phase: 'Assess', ex: '“A black, B red with a tourniquet, C yellow.”', why: 'Close the loop with your partner so the team knows who needs care first.',
      say: 'Update: Patient A is black, Patient B is red with a tourniquet on, Patient C is yellow. B gets care first when EMS arrives.'}
  },
  flow: ['ppe', 'sizeUp', 'partnerPlan', 'walk', 'wave', 'priority', 'triageA', 'triageB', 'triageC', 'handoff'],
  sheets: [{id: 'I', title: 'Skill I · Triage - SALT Method', who: 'Time: 4 minutes', max: 32, items: [
    {n: '1', pts: 2, text: 'Donned PPE: helmet, protective eyewear, work gloves, mask, and sturdy shoes or boots.', act: 'ppe', part: 'p', before: 'triageA'},
    {n: '2', pts: 2, text: 'Surveyed the scene by doing a thorough size-up.', act: 'sizeUp', part: 's', before: 'walk'},
    {n: '3', pts: 2, text: 'Stated loudly, “Everyone who can hear me please move to the (safe area) and we will help you.”', act: 'walk', says: [[/can hear me/i, '“everyone who can hear me”'], [/move to|go to/i, 'the designated safe area']]},
    {n: '4', pts: 2, text: 'Stated loudly, “If you need help, wave your arm or move your leg and we will be there to help you in a few minutes.”', act: 'wave', after: 'walk', says: [[/wave/i, 'waving an arm'], [/leg/i, 'moving a leg']]},
    {n: '5', pts: 2, text: 'Quickly moved to those that are first priority for individual assessments.', act: 'priority', before: 'triageC'},
    {n: '7a', pts: 6, text: 'Assessed Patient A correctly for triage status and marked/tagged correctly.', act: 'triageA', good: true, miss: 'Patient A was not assessed or tagged correctly.'},
    {n: '7b', pts: 6, text: 'Assessed Patient B correctly for triage status and marked/tagged correctly.', act: 'triageB', good: true, miss: 'Patient B was not assessed or tagged correctly.'},
    {n: '7c', pts: 6, text: 'Assessed Patient C correctly for triage status and marked/tagged correctly.', act: 'triageC', good: true, miss: 'Patient C was not assessed or tagged correctly.'},
    {n: '8', pts: 2, text: 'Rescuer 1 used appropriate verbal and nonverbal communication throughout, including with partner.', comms: true},
    {n: '9', pts: 2, text: 'Rescuer 2 (your partner) was kept informed: the team communicated throughout.', fn: q => ['partnerPlan', 'priority', 'handoff'].filter(a => q.find(a)).length >= 2 ? true : 'Talk with your partner: plan, priorities and an update.'}
  ]}],
  status: [['TAGGED', S => ['tagA', 'tagB', 'tagC'].filter(k => S.st[k]).length + ' of 3'], ['CROWD', (S, has) => has('wave') ? 'Sorted' : has('walk') ? 'Walking to safe area' : 'Not sorted']]
});
