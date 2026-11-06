import test from 'node:test';
import assert from 'node:assert/strict';
import {grade, TOTAL, SHEETS, DENTAL} from '../dist/mock-lab-dental-rubric.js';
import {DENTAL_LEARN} from '../dist/mock-lab-dental-learn.js';

const PPE_OK = {gloves: [true, true, true, true, true], eyewear: [true, true], mask: [true, true], gown: [true, true, true, true]};

// A scripted run that follows every step on all three rating sheets, in the order the Learn coach teaches.
function perfectRun(edit = {}) {
  const log = []; let t = 0;
  const add = (type, d = {}, say = 'I am doing this step now') => log.push({i: log.length, t: (t += 2), r: 1, type, d: {...d, ...(edit[type] || {})}, say: edit['say:' + type] ?? say});
  const judge = key => log.push({i: log.length, t: (t += 1), r: 0, type: 'judge', d: {key, text: ''}, say: ''});
  add('inspect', {}, 'The operatory is cleaned and ready');
  add('hygiene', {method: 'rub'}, 'Using alcohol-based hand rub');
  add('placeBarriers', {wrong: [], full: true}, 'Placing barriers over each surface');
  add('checkBarriers', {}, 'Checking each barrier is secure');
  add('prepChair', {low: true, armUp: true, path: true, ok: [true, true, true, true]}, 'Chair lowered, arm up, path clear');
  add('tray', {missing: [], extra: []}, 'Setting up the basic exam tray');
  add('greet', {courteous: true, eye: true, ok: [true, true]}, 'Good morning Mrs. Ruiz, my name is Sam');
  add('escort', {}, 'Please follow me to Operatory 2');
  add('items', {place: 'shelf'}, 'Your handbag goes on this shelf');
  add('questions', {}, 'Do you have any questions today?');
  add('seat', {side: true, arm: true, slide: true, ok: [true, true, true]}, 'Sit on the side and swing your legs');
  add('napkin', {}, 'Placing your napkin with the napkin chain');
  add('informChair', {}, 'I am going to lower the chair back now');
  add('adjust', {slow: true, supine: true, dist: 13}, 'Lowering the chair slowly to supine');
  add('light', {pos: 'chest'}, 'Turning the light on over your chest');
  add('review', {}, 'Reviewing that the room is organized and ready');
  add('hygiene', {method: 'wash'}, 'Washing my hands with soap');
  add('gown', {ok: [true, true]}, 'Gown on and tied');
  add('mask', {ok: [true, true, true]}, 'Mask on and fitted');
  add('eyewear', {ok: [true, true]}, 'Eyewear on over the mask');
  add('hygiene', {method: 'rub'}, 'Hand rub before my gloves');
  add('gloves', {kind: 'exam', ok: [true]}, 'Exam gloves over my gown cuffs');
  judge('treatment');
  add('lightAway', {}, 'Moving the light out of your way');
  add('warn', {}, 'Please stay seated until the chair stops moving');
  add('reset', {}, 'Pressing the reset button now');
  add('bib', {bin: 'bio'}, 'Napkin goes in the biohazard container');
  add('doff', {seq: ['gloves', 'eyewear', 'mask', 'gown'], ...PPE_OK, complete: true, clean: true}, 'Removing my PPE in order');
  add('hygiene', {method: 'rub'}, 'Hand rub after removing PPE');
  add('records', {}, 'Recording the visit in her chart');
  add('postOp', {}, 'Keep brushing twice a day and see you in six months');
  add('release', {}, 'Raising the armrest and clearing your path');
  add('assist', {returned: 'shelf'}, 'Let me help you up, here is your handbag');
  add('escortOffice', {}, 'I will walk you to the front desk');
  judge('remove');
  add('gown', {ok: [true, true]}, 'Gown back on for cleanup');
  add('mask', {ok: [true, true, true]}, 'Mask back on for cleanup');
  add('eyewear', {ok: [true, true]}, 'Eyewear back on for cleanup');
  add('utilityGloves', {wearing: {gown: true, mask: true, eyewear: true}}, 'Putting on utility gloves');
  add('removeBarriers', {careful: true, recognized: false, utility: true}, 'Peeling each barrier off carefully');
  add('discardBarriers', {bin: 'regular'}, 'Barriers go in the regular trash');
  add('utilityCare', {wash: true, disinfect: true, dry: true}, 'Washing, disinfecting and drying the utility gloves');
  add('doff', {seq: ['gloves', 'eyewear', 'mask', 'gown'], gloves: [true], eyewear: [true, true], mask: [true, true], gown: [true, true, true, true], complete: true, clean: true, utility: true}, 'Removing all of my PPE');
  add('hygiene', {method: 'wash'}, 'Washing my hands to finish');
  return log;
}

test('rubric totals match the HOSA rating sheets', () => {
  assert.equal(TOTAL, 118);
  assert.deepEqual(SHEETS.map(s => s.items.reduce((a, i) => a + i.pts, 0)), [50, 22, 46]);
  assert.equal(DENTAL.event, 'Dental Science');
});

test('an empty run scores zero', () => {
  assert.equal(grade([]).earned, 0);
});

test('a complete, well-narrated run earns every point', () => {
  const g = grade(perfectRun());
  const missed = g.sheets.flatMap(s => s.items.filter(i => !i.earned).map(i => `${i.id}: ${i.note}`));
  assert.deepEqual(missed, []);
  assert.equal(g.earned, TOTAL);
  assert.ok(g.pass);
});

test('the Learn script walks the same steps as a perfect run', () => {
  const evs = perfectRun().filter(e => e.type !== 'judge').map(e => e.type);
  assert.deepEqual(DENTAL_LEARN.map(s => s.ev), evs);
  // Every step's own check accepts the perfect action.
  const log = perfectRun().filter(e => e.type !== 'judge');
  DENTAL_LEARN.forEach((s, i) => { if (s.ok) assert.equal(s.ok(log[i]), true, s.title); });
});

test('rinsing with water is not hand hygiene', () => {
  const log = perfectRun();
  log.find(e => e.type === 'hygiene').d.method = 'rinse';
  const it = grade(log).sheets.find(s => s.id === 'IV').items.find(i => i.n === '1');
  assert.equal(it.earned, 0);
});

test('wrong barriers, wrong tray and a far working distance are caught', () => {
  const g = grade(perfectRun({placeBarriers: {wrong: ['Headrest']}, tray: {extra: ['Scalpel']}, adjust: {dist: 20}}));
  const pick = (sh, n) => g.sheets.find(s => s.id === sh).items.find(i => i.n === n).earned;
  assert.equal(pick('IV', '2'), 0);
  assert.equal(pick('III', '3'), 0);
  assert.equal(pick('III', '10c'), 0);
});

test('gloves must come off first and the napkin goes in biohazard', () => {
  const g = grade(perfectRun({doff: {seq: ['gown', 'gloves', 'eyewear', 'mask']}, bib: {bin: 'regular'}}));
  const pick = (sh, n) => g.sheets.find(s => s.id === sh).items.find(i => i.n === n).earned;
  assert.equal(pick('VIII', '7a'), 0);
  assert.equal(pick('III', '18'), 0);
});

test('narration must cover the verbal steps', () => {
  const g = grade(perfectRun({'say:greet': 'Good morning', 'say:warn': 'Okay here we go', 'say:records': 'Typing'}));
  const pick = (sh, n) => g.sheets.find(s => s.id === sh).items.find(i => i.n === n).earned;
  assert.equal(pick('III', '4c'), 0);
  assert.equal(pick('III', '16'), 0);
  assert.equal(pick('III', '21'), 0);
});

test('touching a surface is fine only if you say it needs disinfecting', () => {
  const pick = log => grade(log).sheets.find(s => s.id === 'IV').items.find(i => i.n === '7').earned;
  assert.equal(pick(perfectRun({removeBarriers: {careful: false, recognized: false}})), 0);
  assert.equal(pick(perfectRun({removeBarriers: {careful: false, recognized: true}})), 2);
});
