// Emergency Medical Technician · Lab 01: severe forearm bleeding that progresses to shock.
// Rating sheet: HOSA 2026-27 EMT Skill V, Bleeding Control / Shock Management, 28 points.
import {lab, stdActs, RX} from '../mock-lab-grade.js';

export default lab({
  id: 'emt-01', event: 'Emergency Medical Technician', number: '01',
  title: 'Glass Cut in the Garage', heading: 'EMS call · bleeding control',
  role: 'EMT', place: '1820 Birch Lane · home garage', startClock: {h: 18, m: 40}, limitSec: 5 * 60,
  skills: ['Skill V · Bleeding Control / Shock Management'],
  intro: 'A man cut his forearm on a broken window and it will not stop bleeding. Control the hemorrhage step by step, then treat him for shock and get him moving to the hospital.',
  scenario: [
    'It is 6:40 PM. You and your partner respond to a home garage for a 52-year-old man who cut his left forearm on broken window glass.',
    'Police report the scene is secure. The glass has been swept into a corner.',
    'He is sitting in a chair, pale, holding a soaked towel on his forearm. Bright red blood is spurting.',
    'Your jump bag has gloves, dressings, a tourniquet, oxygen and blankets. Your partner is with you.'
  ],
  patient: {name: 'Mr. Greg Holt', short: 'Mr. Holt', age: '52 · male', at: 'chair', look: {skin: '#f0cdb0', skin2: '#d9b090', hair: '#7a5232', style: 'short', top: '#6a7a8a', pants: '#3e4c6c'},
    status: 'Sitting, holding a bloody towel on his arm', facts: [['Complaint', 'Deep laceration, left forearm, spurting'], ['Mechanism', 'Broken window glass'], ['History', 'High blood pressure'], ['Allergies', 'None']]},
  ptStatus: S => S.st.pt === 'ground' ? 'Lying supine under blankets' : 'Sitting in a chair, bleeding',
  scrub: '#2f5f8f', scrub2: '#244a70',
  scene: {room: 'home', label: 'The garage. Your jump bag and partner by the door, the patient in a chair, and open floor to lay him down.',
    deco: [['window', 640], ['clock', 840], ['plant', 960]]},
  start: 'bag',
  stations: {
    bag: {name: 'Jump bag', tip: 'Gloves, dressings, tourniquet, oxygen, blankets, hand rub', art: 'jumpbag', x: 110},
    partner: {name: 'Partner', tip: 'Your EMT partner', art: 'victim', o: {pose: 'stand', look: {top: '#2f5f8f', pants: '#2a2a2a', hair: '#2a1d14', skin: '#8d5a3b'}}, x: 230},
    chair: {name: 'Chair', tip: 'Where Mr. Holt is sitting', art: 'chair', x: 470, pose: 'sit', side: 545, stand: 545, face: -1},
    pt: {name: 'Mr. Holt', tip: 'Care for him', patient: true},
    ground: {x: 720, pose: 'floor', side: 830, stand: 830, face: -1}
  },
  acts: {
    ...stdActs({sink: 'bag', gloves: 'bag', waste: 'bag'}),
    scene: {at: 'partner', label: 'Scene safety', sub: 'Say it', talk: true, phase: 'Arrive', ex: '“Scene is safe. Glass is swept away, police are on scene.”', why: 'Check and say out loud that the scene is safe before you approach.',
      say: 'Checking the scene: police have it secured and the glass is swept into the corner. The scene is safe.'},
    pressure: {at: 'pt', label: 'Direct pressure', sub: 'On the wound', kind: 'bleeding', phase: 'Control bleeding', gloved: true, judge: {key: 'p1', text: 'Judge: “The wound continues to bleed.”'}, ex: '“Pressing firmly right on the wound with gauze.”',
      why: 'First step for any bleeding: firm direct pressure with a dressing right on the wound.', say: 'Sir, I’m an EMT and I’m going to press hard on that cut to stop the bleeding. Applying firm direct pressure with gauze.',
      panel: [{k: 'p', label: 'First', choose: [['direct', 'Firm direct pressure on the wound with gauze'], ['tq', 'Tourniquet immediately'], ['elevate', 'Raise the arm only']], right: ['direct'], fix: 'Direct pressure first.'}]},
    dressing: {at: 'pt', label: 'Pressure dressing', sub: 'Wrap over it', kind: 'bleeding', phase: 'Control bleeding', gloved: true, judge: {key: 'p2', text: 'Judge: “The wound continues to bleed with direct pressure and a pressure dressing.”'},
      ex: '“Wrapping a pressure dressing tightly over the gauze.”', why: 'Hold the pressure in place with a pressure dressing (bulky dressing and roller bandage).', say: 'Applying a pressure dressing over the gauze and wrapping it snugly.'},
    tourniquet: {at: 'pt', label: 'Apply a tourniquet', sub: 'Where and how tight', kind: 'tourniquet', phase: 'Control bleeding', gloved: true, set: {tq: 'on'}, judge: {key: 'p3', text: 'Judge: “Bleeding is controlled. The patient is showing signs of hypoperfusion.”'},
      ex: '“High on the upper arm, above the elbow, tightened until the bleeding stops and the radial pulse is gone.”',
      why: 'Place it proximal to the elbow (never on the joint), pull the strap through the buckle and tighten over the pad, then turn the windlass until bleeding stops and distal pulses are gone.',
      say: 'Placing the tourniquet on the upper arm above the elbow, pulling the strap through the buckle and tightening it, then turning the windlass until the bleeding stops and I can’t feel a radial pulse.',
      panel: [{k: 't', q: [['Place', 'Proximal to the elbow, not on the joint', 'Directly over the elbow'], ['Strap', 'Pull the free end through the buckle and tighten over the pad', 'Tie it in a loose knot'], ['Tighten', 'Until distal pulses are gone and bleeding is controlled', 'Until it is snug, even if it still bleeds']]}], pt: 'Ow! That really hurts.'},
    reassure: {at: 'pt', label: 'Comfort and reassure', sub: 'Talk to him', talk: true, phase: 'Treat for shock', ex: '“The bleeding is controlled. You’re doing great; we’re taking care of you.”', why: 'Calm him: fear speeds up his heart and worsens shock.',
      say: 'Mr. Holt, I know the tourniquet hurts, but the bleeding is controlled now. Stay with me. You’re doing great, and we’re taking good care of you.', pt: 'I feel dizzy… and cold.'},
    supine: {at: 'pt', label: 'Lay him down', sub: 'Position', kind: 'positioning', phase: 'Treat for shock', set: {pt: 'ground'}, ex: '“Let’s lay you down flat on your back.”', why: 'Shock: lay the patient supine.',
      say: 'Let’s help you down to lie flat on your back.',
      panel: [{k: 'p', label: 'Position', choose: [['supine', 'Supine (flat on his back)'], ['sit', 'Keep him sitting up'], ['prone', 'Face down']], right: ['supine'], fix: 'Supine.'}]},
    oxygen: {at: 'partner', label: 'High-flow oxygen', sub: 'Non-rebreather', kind: 'oxygen', talk: true, phase: 'Treat for shock', ex: '“Partner, non-rebreather at 15 liters, please.”', why: 'Give high-concentration oxygen: non-rebreather mask at 15 L/min.',
      say: 'Partner, please put him on a non-rebreather mask at 15 liters per minute for high-concentration oxygen.',
      panel: [{k: 'o', label: 'Device and flow', choose: [['nrb', 'Non-rebreather mask at 15 L/min'], ['nc', 'Nasal cannula at 2 L/min'], ['none', 'No oxygen yet']], right: ['nrb'], fix: 'High concentration: NRB at 15 L/min.'}]},
    blankets: {at: 'bag', label: 'Prevent heat loss', sub: 'Blankets', kind: 'shock care', phase: 'Treat for shock', set: {warm: 'yes'}, ex: '“A blanket under him and one over him.”', why: 'Shock patients lose heat fast. Put a blanket under and over him.',
      say: 'Placing a blanket under him and another over him to prevent heat loss.',
      panel: [{k: 'b', label: 'Blankets', choose: [['both', 'One under and one over'], ['over', 'Just one over the top'], ['fan', 'Uncover him to cool him']], right: ['both'], fix: 'Under and over.'}]},
    transport: {at: 'partner', label: 'Immediate transport', sub: 'Load and go', talk: true, phase: 'Treat for shock', ex: '“This is a load-and-go. Let’s get the stretcher and transport now.”', why: 'Shock from hemorrhage needs immediate transport to the hospital.',
      say: 'He’s in shock. This needs immediate transport. Let’s get the stretcher and go now, and notify the hospital.'}
  },
  flow: ['scene', {act: 'gloves', phase: 'Arrive', why: 'Body substance isolation: gloves before you touch him.'}, 'pressure', 'dressing', 'tourniquet', 'reassure', 'supine', 'oxygen', 'blankets', 'transport',
    {act: 'glovesOff', phase: 'Finish'}, {act: 'hygiene', phase: 'Finish', why: 'Alcohol-based hand rub when gloves come off (step 10).'}],
  sheets: [{id: 'V', title: 'Skill V · Bleeding Control / Shock Management', who: 'Time: as directed', max: 28, items: [
    {n: '1', pts: 2, text: 'Checked and verbalized the scene is safe.', act: 'scene', before: 'pressure', say: [/safe/i, 'that the scene is safe']},
    {n: '2', pts: 2, text: 'Applied direct pressure to the wound.', act: 'pressure', part: 'p'},
    {n: '3', pts: 2, text: 'Applied pressure dressing.', act: 'dressing', after: 'pressure'},
    {n: '4a', pts: 2, text: 'Placed the tourniquet proximal to the elbow or joint (not directly on the joint).', act: 'tourniquet', part: 't', qi: 0, after: 'dressing'},
    {n: '4b', pts: 2, text: 'Pulled the free end through the buckle and tightened over the pad.', act: 'tourniquet', part: 't', qi: 1},
    {n: '4c', pts: 2, text: 'Tightened until distal pulses are no longer palpable and bleeding is controlled.', act: 'tourniquet', part: 't', qi: 2},
    {n: '5', pts: 2, text: 'Comforted, calmed and reassured patient.', act: 'reassure', say: [/okay|great|care|stay|calm|controlled/i, 'reassurance']},
    {n: '6', pts: 2, text: 'Properly positioned the patient in supine position.', act: 'supine', part: 'p', after: 'tourniquet'},
    {n: '7', pts: 2, text: 'Administered high concentration oxygen.', act: 'oxygen', part: 'o'},
    {n: '8', pts: 2, text: 'Prevented heat loss with blankets under and over the patient.', act: 'blankets', part: 'b'},
    {n: '9', pts: 2, text: 'Indicated need for immediate transportation.', act: 'transport', say: [/transport|go now|hospital|load/i, 'immediate transport']},
    {n: '10', pts: 2, text: 'Used alcohol-based hand-rub for hand hygiene.', hyg: ['glovesOff', null], hygWhat: 'removing gloves'},
    {n: '11', pts: 2, text: 'Used appropriate verbal and nonverbal communication with patient and other personnel including partner.', comms: true},
    {n: '12', pts: 2, text: 'Practiced body substance isolation precautions throughout skill.', fn: q => { const g = q.pos('gloves'), p = q.pos('pressure'); if (g === null || (p !== null && g > p)) return 'Gloves must go on before you touch the wound.'; const b = q.acts.find(e => e.d?.breach); return b ? b.d.breach : true; }}
  ]}],
  status: [['BLEEDING', (S, has) => has('tourniquet') ? 'Controlled (tourniquet)' : has('pressure') ? 'Still bleeding' : 'Spurting'], ['SHOCK CARE', (S, has) => ['supine', 'oxygen', 'blankets'].filter(has).length + ' of 3']]
});
