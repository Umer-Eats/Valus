// Veterinary Science · Lab 01: lifting a small and a medium dog and restraining for a cephalic draw.
// Rating sheet: HOSA 2026-27 Veterinary Science Skill V, Lifting and Restraining a Dog, 25 points, 4 minutes.
import {lab, stdActs} from '../mock-lab-grade.js';
import {person} from '../mock-lab-kit.js';

const PIP = (x, y, show) => `<g data-show="pip=${show}" transform="translate(${x} ${y}) scale(.6)">${person('dog')}</g>`;

export default lab({
  id: 'vs-01', event: 'Veterinary Science', number: '01',
  title: 'Lift, Hold, Draw', heading: 'Small animal exam room',
  role: 'Veterinary assistant', place: 'Oak Hill Animal Hospital · Exam room 2', startClock: {h: 9, m: 0}, limitSec: 4 * 60,
  skills: ['Skill V · Lifting and Restraining a Dog'],
  intro: 'Lift Pip, a small terrier, onto the table and back down. Then lift Max, a medium mixed breed, hold him standing, and restrain him sitting for a cephalic blood draw.',
  scenario: [
    'It is 9:00 AM at Oak Hill Animal Hospital. Two friendly dogs are in Exam room 2.',
    'Pip is a 9-lb terrier. Lift him onto the exam table and back to the floor.',
    'Max is a 45-lb mixed breed. Lift him onto the table, hold him standing, explain how you would lift a large dog, then restrain him sitting for a cephalic venipuncture by the veterinarian.',
    'Use safe body mechanics and talk calmly to the dogs and the team.'
  ],
  infoTab: 'Patients',
  patient: {name: 'Max', short: 'Max', age: '45 lb · mixed breed', at: 'floor', facts: [['Max', '6-year-old neutered male mixed breed, 45 lb, friendly'], ['Pip', '3-year-old male terrier, 9 lb'], ['Procedure', 'Cephalic venipuncture on Max (veterinarian)'], ['Restraint', 'Sitting, right foreleg']]},
  ptStatus: S => ({floor: 'Standing on the floor', table: S.st.sit ? 'Sitting on the table' : 'Standing on the table'}[S.st.pt]),
  scrub: '#3c8f5c', scrub2: '#2f7049',
  scene: {room: 'vet', label: 'Exam room 2. A sink, Pip by the kennel, the exam table in the middle, and Max waiting on the floor.',
    deco: [['poster', 330, ['GENTLE', 'HANDS']], ['clock', 640], ['window', 860]],
    extra: PIP(250, 189, 'floor') + PIP(470, 127, 'table')},
  start: 'sink',
  state: {pip: 'floor'},
  stations: {
    sink: {name: 'Sink', tip: 'Soap, water and hand rub', art: 'sink', x: 100},
    pip: {name: 'Pip', tip: 'Small terrier, 9 lb', hot: [212, 316, 90, 66], stand: 300, face: -1},
    table: {name: 'Exam table', tip: 'Stainless exam table', art: 'vettable', x: 520, pose: 'dog', side: 620, stand: 620, face: -1},
    pt: {name: 'Max', tip: 'Medium dog, 45 lb', patient: true},
    floor: {x: 800, py: 62, pose: 'dog', side: 880, stand: 880, face: -1}
  },
  acts: {
    ...stdActs({sink: 'sink'}),
    smallUp: {at: 'pip', label: 'Lift Pip onto the table', sub: 'Small dog lift', kind: 'lifting', phase: 'Small dog', set: {pip: 'table'}, ex: '“Easy, Pip. Up we go.”',
      why: 'Drape the small dog over one forearm, supporting the body, while the other hand holds the head just below the jaw.', say: 'Easy, Pip. Draping you over my forearm and holding your head just below the jaw. Up we go onto the table.',
      panel: [{k: 'l', q: [['Body', 'Drape the dog over one forearm', 'Scoop him up under the front legs'], ['Head', 'Other hand holds the head just below the mandible', 'Let the head hang free']]}]},
    smallDown: {at: 'table', label: 'Lift Pip back down', sub: 'Body mechanics', kind: 'lifting', phase: 'Small dog', set: {pip: 'floor'}, ex: '“Bending my knees and lowering Pip to the floor.”',
      why: 'Same hold, then lower him with your knees bent and back straight, keeping him close.', say: 'Same hold, keeping Pip close, bending my knees with a straight back and setting him gently on the floor.',
      panel: [{k: 'd', label: 'Lowering', choose: [['knees', 'Keep him close, bend at the knees with a straight back'], ['waist', 'Bend at the waist and drop him the last foot'], ['jump', 'Let him jump down']], right: ['knees'], fix: 'Close to your body, bend the knees.'}]},
    medUp: {at: 'pt', label: 'Lift Max onto the table', sub: 'Medium dog lift', kind: 'lifting', phase: 'Medium dog', set: {pt: 'table'}, ex: '“One arm around the neck, one around the rear, lift with my legs.”',
      why: 'One arm around the front of the neck, the other around the rear end, then lift with your legs.', say: 'Good boy, Max. One arm around your neck and the other around your rear, and lifting with my legs onto the table.',
      panel: [{k: 'l', q: [['Arms', 'One arm around the neck, the other around the rear end', 'Both arms under the belly'], ['Lift', 'Lift with your legs, back straight', 'Lift with your back, legs straight']]}]},
    medStand: {at: 'pt', label: 'Hold Max standing', sub: 'Neck and abdomen', kind: 'restraint', phase: 'Medium dog', ex: '“Arm around his neck, arm under his belly, hugging him close.”',
      why: 'Hold him standing: one arm around the neck, the other around the abdomen, hugging him close to your body.', say: 'Holding Max standing, one arm around his neck and one under his abdomen, hugging him close to my body.',
      panel: [{k: 's', label: 'Standing restraint', choose: [['hug', 'One arm around the neck, the other around the abdomen, hugged close'], ['collar', 'Hold only his collar at arm’s length'], ['leash', 'Tie the leash to the table']], right: ['hug'], fix: 'Neck and abdomen, hugged close.'}]},
    largeDog: {at: 'table', label: 'Explain a large-dog lift', sub: 'Verbalize', talk: true, phase: 'Medium dog', judge: {key: 'ceph', text: 'Judge: “Place the dog in a sitting position for a cephalic venipuncture.”'},
      ex: '“A large dog takes two people: one lifts the front, one the rear, on a count.”', why: 'Say how you would lift a large dog: two people, one at the chest and neck, one at the abdomen and rear, lifting together on a count with legs, not backs.',
      say: 'A large dog is a two-person lift. One person holds the neck and chest, the other the abdomen and hindquarters, and we lift together on a count using our legs.'},
    sitPos: {at: 'pt', label: 'Sit him at the table edge', sub: 'Position', kind: 'restraint', talk: true, phase: 'Cephalic restraint', set: {sit: 'yes'}, ex: '“Max, sit. Good boy.”', why: 'Place him near one end of the table, facing the edge, in a sitting position.',
      say: 'Max, sit. Good boy. You’re sitting near the end of the table facing the edge.',
      panel: [{k: 'p', label: 'Where?', choose: [['edge', 'Near one end of the table, facing the edge, sitting'], ['middle', 'In the middle of the table, lying down'], ['away', 'Facing away from the veterinarian']], right: ['edge'], fix: 'Near one end, facing the edge, sitting.'}]},
    headHold: {at: 'pt', label: 'Restrain the head', sub: 'Under the neck', kind: 'restraint', phase: 'Cephalic restraint', ex: '“My hand behind his jaw, his head against my chest.”', why: 'Reach under the neck, place your hand behind the jaw, and press his head against your chest.',
      say: 'Reaching under his neck, placing my hand behind his jaw, and holding his head against my chest.',
      panel: [{k: 'h', label: 'Head', choose: [['chest', 'Reach under the neck, hand behind the jaw, head pressed to your chest'], ['muzzle', 'Squeeze the muzzle shut'], ['scruff', 'Scruff the back of the neck']], right: ['chest'], fix: 'Under the neck, hand behind the jaw, head to your chest.'}]},
    rearArm: {at: 'pt', label: 'Pull him close', sub: 'Other arm around the rear', kind: 'restraint', phase: 'Cephalic restraint', ex: '“Other arm around his rear, pulling him in.”', why: 'Use your other arm around his rear to pull him close to your body.',
      say: 'Wrapping my other arm around his rear and pulling him close to my body.'},
    legHold: {at: 'pt', label: 'Present the leg', sub: 'Elbow, push, occlude', kind: 'restraint', phase: 'Cephalic restraint', judge: {key: 'drawn', text: 'Judge: “Venipuncture is complete and blood is drawn.”'},
      ex: '“Elbow in my palm, leg pushed forward, thumb rolling the vein.”',
      why: 'Move your rear arm across his shoulders and grasp the leg away from you. Cup his elbow in your palm and push the leg forward, then place your thumb on top of the leg, squeezing and rotating laterally to occlude the vein.',
      say: 'Moving my arm across his shoulders to grasp the far front leg, cupping his elbow in my palm and pushing the leg forward, and placing my thumb on top, squeezing and rolling it outward to hold off the vein.',
      panel: [{k: 'l', q: [['Grasp', 'Move the rear arm across the shoulders and grasp the leg opposite your body', 'Grab the leg closest to you from below'],
        ['Elbow', 'Elbow of the dog in your palm, push the leg forward', 'Hold the paw and pull the leg toward you'], ['Occlude', 'Thumb on top of the leg, squeeze and rotate laterally', 'Wrap a rubber band around the leg']]}]},
    release: {at: 'pt', label: 'Release the vein', sub: 'After the draw', kind: 'restraint', phase: 'Cephalic restraint', ex: '“Releasing my thumb now that the blood is drawn.”', why: 'Release your thumb once the blood is drawn so the vein can be held off for clotting.',
      say: 'Releasing my thumb now that the blood has been drawn. Good boy, Max.'}
  },
  flow: [{act: 'hygiene', phase: 'Start'}, 'smallUp', 'smallDown', 'medUp', 'medStand', 'largeDog', 'sitPos', 'headHold', 'rearArm', 'legHold', 'release', {act: 'hygiene', phase: 'Finish'}],
  sheets: [{id: 'V', title: 'Skill V · Lifting and Restraining a Dog', who: 'Time: 4 minutes', max: 25, items: [
    {n: '1', pts: 2, text: 'Washed hands or used alcohol-based hand-rub for hand hygiene.', hyg: ['^', 'smallUp'], hygWhat: 'handling the dogs'},
    {n: '2', pts: 1, text: 'Lifted the small dog onto the table, draped over a forearm, other hand holding the head below the mandible.', act: 'smallUp', part: 'l'},
    {n: '3', pts: 1, text: 'Lifted the small dog off the table and back to the floor with correct body mechanics.', act: 'smallDown', part: 'd', after: 'smallUp'},
    {n: '4', pts: 1, text: 'Lifted the medium-sized dog onto the table, one arm around the neck and the other around the rear end.', act: 'medUp', part: 'l'},
    {n: '5', pts: 1, text: 'Held the medium dog standing, one arm around the neck and the other around the abdomen, hugged close.', act: 'medStand', part: 's', after: 'medUp'},
    {n: '6', pts: 1, text: 'Verbalized the proper technique for lifting a large dog.', act: 'largeDog', say: [/two|2|both|team/i, 'that it takes two people']},
    {n: '7', pts: 2, text: 'Placed patient on the table near one end, facing the edge, in the sitting position.', act: 'sitPos', part: 'p', after: 'medUp'},
    {n: '8', pts: 2, text: 'Restrained the head: under the neck, hand behind the jaw, head pressed against the chest.', act: 'headHold', part: 'h'},
    {n: '9', pts: 2, text: 'Used other arm to reach around the rear of the dog and pull close to the body.', act: 'rearArm', after: 'headHold'},
    {n: '10', pts: 2, text: 'Moved the rear arm across the shoulders and grasped the leg opposite their body.', act: 'legHold', part: 'l', qi: 0},
    {n: '11', pts: 2, text: 'Held the leg with the dog’s elbow in the palm, pushing the leg forward.', act: 'legHold', part: 'l', qi: 1},
    {n: '12', pts: 2, text: 'Placed thumb on top of the leg, squeezing and rotating laterally to occlude the vein.', act: 'legHold', part: 'l', qi: 2},
    {n: '13', pts: 2, text: 'Released thumb after the blood was drawn.', act: 'release', after: 'legHold'},
    {n: '14', pts: 2, text: 'Used appropriate verbal and nonverbal communication with patient and other personnel.', comms: true},
    {n: '15', pts: 2, text: 'Washed hands or used alcohol-based hand-rub for hand hygiene.', hyg: ['release', null], hygWhat: 'releasing the dog'}
  ]}],
  status: [['PIP', S => S.st.pip === 'table' ? 'On the table' : 'On the floor'], ['MAX', S => S.st.pt === 'table' ? (S.st.sit ? 'Sitting on the table' : 'Standing on the table') : 'On the floor']]
});
