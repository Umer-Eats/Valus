import test from 'node:test';
import assert from 'node:assert/strict';
import {SPEC_LABS, specLabFor} from '../dist/mock-labs/index.js';
import {perfectLog, rightAnswer, actData, applyWear} from '../dist/mock-lab-grade.js';
import {EVENT_DETAILS} from '../dist/event-details.js';

const BESPOKE = new Set(['CPR/First Aid', 'Dental Science']);

test('every event with a mock procedure tool has a lab', () => {
  for (const [name, d] of Object.entries(EVENT_DETAILS)) {
    if (!(d.tools || []).includes('mock') || BESPOKE.has(name)) continue;
    assert.ok(specLabFor(name), `${name} has no mock lab`);
  }
});

test('lab ids and events are unique', () => {
  assert.equal(new Set(SPEC_LABS.map(l => l.id)).size, SPEC_LABS.length);
  assert.equal(new Set(SPEC_LABS.map(l => l.event)).size, SPEC_LABS.length);
});

for (const L of SPEC_LABS) {
  test(`${L.id}: rating sheets add up to the official totals`, () => {
    for (const sh of L.sheets) assert.equal(sh.items.reduce((s, i) => s + i.pts, 0), sh.max, `${sh.id} total`);
  });

  test(`${L.id}: every action is at a real station and in the Learn flow`, () => {
    for (const [id, a] of Object.entries(L.acts)) {
      const s = L.stations[a.at];
      assert.ok(s, `${id} is at unknown station ${a.at}`);
      assert.ok(s.patient || s.art || s.hot, `${id} is at ${a.at}, which has nothing to click`);
      if (!['gloves', 'glovesOff'].includes(id)) assert.ok(L.learn.some(s => s.act === id), `${id} is never taught`);
    }
  });

  test(`${L.id}: following the coach earns every point`, () => {
    const r = L.grade(perfectLog(L));
    const missed = r.sheets.flatMap(s => s.items.filter(i => !i.earned).map(i => `${s.id} ${i.n}: ${i.note}`));
    assert.deepEqual(missed, []);
    assert.equal(r.earned, L.total);
    assert.equal(r.pass, true);
  });

  test(`${L.id}: an empty run earns nothing`, () => {
    const r = L.grade([]);
    assert.equal(r.earned, 0);
    assert.equal(r.pass, false);
  });

  test(`${L.id}: the coach’s words cover every narration the sheet checks`, () => {
    for (const st of L.learn) for (const [re, hint] of st.need) assert.ok(re.test(st.say), `${st.act} coach line misses ${hint}`);
  });

  test(`${L.id}: a wrong panel answer costs points`, () => {
    const log = perfectLog(L);
    const e = log.find(x => L.acts[x.type]?.panel?.some(p => p.choose || p.q));
    if (!e) return;
    const a = L.acts[e.type], answers = Object.fromEntries(a.panel.map(p => [p.k, rightAnswer(p)]));
    const p = a.panel.find(x => x.choose || x.q);
    answers[p.k] = p.choose ? p.choose.find(c => !p.right.includes(c[0]))[0] : p.q.map(() => '2');
    e.d = actData(a, answers); applyWear(a, {gloves: 'exam'}, e.d);
    assert.ok(L.grade(log).earned < L.total, `${e.type} wrong answer still earned full marks`);
  });
}
