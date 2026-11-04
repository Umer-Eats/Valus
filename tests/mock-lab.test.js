import test from 'node:test';
import assert from 'node:assert/strict';
import {grade, TOTAL, SHEETS} from '../dist/mock-lab-cpr.js';

// A scripted run that follows every rubric step for both rescuers.
function perfectRun() {
  const log = []; let t = 0;
  const add = (r, type, d = {}, say = '') => log.push({i: log.length, t: (t += 2), r, type, d, say});
  const judge = (key, text) => log.push({i: log.length, t: (t += 1), r: 0, type: 'judge', d: {key, text}, say: ''});
  const goodSet = {rate: 110, secs: 16.4, depth: 2.2, recoil: 'full', loc: 'A-side', exposed: true};
  add(1, 'scene', {}, 'The scene is safe, following AHA guidelines');
  add(1, 'kit', {}, 'Opening the first aid kit now');
  add(1, 'gloves', {}, 'Putting on my gloves');
  add(1, 'tapShout', {}, 'Sir, sir, are you OK?'); judge('unresp', '');
  add(1, 'shoutPartner', {}, 'Partner call 911 and get the AED');
  add(2, 'respond', {}, 'OK I will call 911 and get the AED');
  add(1, 'move', {to: 'A-side'}, 'kneeling at his side');
  add(1, 'surface', {}, 'He is on firm flat ground');
  add(1, 'clothing', {}, 'Unzipping his jacket off the chest');
  add(1, 'checkBP', {method: 'scan', site: 'carotid', fingers: 'two', secs: 7}, 'Scanning chest and carotid pulse'); judge('nobp', '');
  add(1, 'hands', {spot: 'lower'}, 'Heel of hand on lower half of the breastbone');
  add(1, 'stack', {}, 'Other hand on top of the first');
  add(1, 'posture', {straight: true, over: true}, 'Arms straight shoulders over hands');
  add(1, 'compress', goodSet, '1, 2, 3, 4 ... 30');
  add(1, 'pocketMask', {orient: 'nose', seal: [true, true, true, true], holds: [1, 1.1]}, 'Mask on bridge of the nose, giving 2 breaths');
  add(1, 'auto', {on: true, mode: 'solo'});
  add(2, 'scene', {}, 'Scene is safe, moving the glass');
  add(2, 'kit', {}, 'Opening the first aid kit now');
  add(2, 'gloves', {}, 'Putting on gloves now');
  add(2, 'eyes', {}, 'Putting on eye protection');
  add(2, 'checkRB', {}, 'Are you OK? She is breathing');
  add(2, 'consent', {}, 'Hi my name is Sam, may I help you?'); judge('consent', '');
  add(2, 'assess', {}, 'What happened? Heavy bleeding from the thigh');
  add(2, 'medId', {}, 'Checking for a medical bracelet');
  add(2, 'call911', {loc: true, name: true, phone: true, count: true, arrest: true, bleed: true, waited: true}, 'Dispatcher said OK to hang up');
  add(2, 'dressing', {}, 'Placing gauze dressing on the wound');
  add(2, 'pressure', {technique: 'stack', firm: true, steady: true, constant: true}, 'Firm steady direct pressure'); judge('delayed', '');
  add(2, 'tqPlace', {zone: 'above'}, 'Tourniquet 2 to 3 inches above the wound');
  add(2, 'tqPull', {tight: 100}, 'Pulling the strap tight and securing it');
  add(2, 'tqTwist', {turns: 2, stopped: true}, 'Twisting the windlass until bleeding stops');
  add(2, 'tqSecure', {}, 'Securing the windlass in the clip');
  add(2, 'noteTime', {}, 'Applied at 4:16 PM');
  add(2, 'layBack', {}, 'Helping you lie on your back');
  add(2, 'blanket', {}, 'Covering you with a blanket to keep warm');
  add(2, 'glovesOff', {proper: true}, 'Removing soiled gloves carefully');
  add(2, 'gloves', {}, 'Putting on new gloves now');
  add(2, 'getAED', {}, 'Getting the AED from the tent');
  add(2, 'aedPower', {r1Cpr: true}, 'Opening and powering on the AED');
  add(2, 'removePatch', {}, 'Removing the medication patch');
  add(2, 'pads', {correct: true, overPatch: false, overClothing: false, r1Cpr: true}, 'Placing pads on the bare chest');
  add(1, 'auto', {on: false});
  add(1, 'move', {to: 'A-head'});
  add(2, 'clearAnalyze', {ok: true}, 'Everyone clear, analyzing');
  add(2, 'shock', {ok: true}, 'Everyone clear, shocking now');
  add(2, 'move', {to: 'A-side'}, 'Kneeling at his side');
  add(2, 'hands', {spot: 'lower'}, 'Hand on lower half of sternum');
  add(2, 'stack', {}, 'Other hand stacked on top');
  add(2, 'posture', {straight: true, over: true}, 'Arms straight over the chest');
  add(2, 'compress', goodSet, 'one two three ... thirty');
  add(1, 'ecClamp', {steps: [true, true, true, true], loc: 'A-head'}, 'E-C clamp with head tilt');
  add(1, 'breaths', {kind: 'bag', holds: [1, 1]}, 'Squeezing two breaths, chest rises');
  add(2, 'callSwitch', {cycles: 5}, 'Five cycles, switch!');
  add(1, 'swap', {secs: 3, cycles: 5});
  add(1, 'compress', goodSet, '1, 2, 3 and counting');
  add(2, 'ecClamp', {steps: [true, true, true, true], loc: 'A-head'}, 'E-C clamp seal at the head');
  add(2, 'breaths', {kind: 'bag', holds: [1, 1.2]}, 'Two breaths, watching chest rise');
  judge('ems', '');
  add(1, 'emsReport', {patient: 'A'}, '58 year old male collapsed, unresponsive with no pulse, CPR started, AED delivered 1 shock');
  add(2, 'emsReport', {patient: 'B'}, '16 year old female, laceration to the right thigh, direct pressure then tourniquet at 4:16 PM, treated for shock with a blanket');
  for (const r of [1, 2]) {
    add(r, 'glovesOff', {proper: true}, 'Removing gloves properly now');
    add(r, 'biohazard', {}, 'Placing gloves in the biohazard bag');
    add(r, 'handrub', {}, 'Using alcohol hand rub now');
  }
  return log;
}

test('rubric totals match the HOSA rating sheets', () => {
  assert.equal(TOTAL, 175);
  assert.deepEqual(SHEETS.map(s => s.items.reduce((a, i) => a + i.pts, 0)), [78, 52, 45]);
});

test('an empty run scores zero', () => {
  assert.equal(grade([]).earned, 0);
});

test('a complete, well-narrated run earns every point', () => {
  const g = grade(perfectRun());
  const missed = g.sheets.flatMap(s => s.items.filter(i => !i.earned).map(i => `${i.id}: ${i.note}`));
  assert.deepEqual(missed, []);
  assert.equal(g.earned, 175);
  assert.ok(g.pass);
});

test('actions without matching narration lose the verbal points', () => {
  const log = perfectRun().map(e => e.type === 'tapShout' ? {...e, say: 'tapping him'} : e);
  const item = grade(log).sheets[0].items.find(i => i.id === 'IIA-3');
  assert.equal(item.earned, 0);
  assert.match(item.note, /Are you OK/);
});

test('bad technique is caught', () => {
  const log = perfectRun().map(e => e.type === 'compress' && e.r === 1 ? {...e, d: {...e.d, rate: 140, depth: 1.5}} : e);
  const items = grade(log).sheets[0].items;
  assert.equal(items.find(i => i.id === 'IIA-6g').earned, 0);
  assert.equal(items.find(i => i.id === 'IIA-6h').earned, 0);
});
