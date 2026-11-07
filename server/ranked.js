// Ranked tests: one locked, timed Round One test per assignment, built from the event's
// existing practice tests. The test uses the same question count, time limit and topic
// weights as the event's practice tests, so it matches the official HOSA format.
import { getPracticeTest, practiceTests, gradeAnswers } from '../dist/practice-tests.js';

// Seeded shuffle so the same assignment always builds the same test.
function seeded(text) {
  let s = 2166136261;
  for (const c of String(text)) s = Math.imul(s ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(list, rand) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const hasRankedTest = (event) => practiceTests(event).some((t) => getPracticeTest(t.id));

// Picks questions topic by topic from every practice test for the event. Returns the
// question references ([testId, index]) to store with the assignment.
export function buildRankedTest(event, seed) {
  const tests = practiceTests(event).map((t) => getPracticeTest(t.id)).filter(Boolean);
  if (!tests.length) return null;
  const template = tests[0], rand = seeded(seed);
  const need = new Map();
  for (const q of template.questions) need.set(q.topic, (need.get(q.topic) || 0) + 1);
  const pool = new Map();
  for (const t of tests) t.questions.forEach((q, i) => {
    if (!pool.has(q.topic)) pool.set(q.topic, []);
    pool.get(q.topic).push([t.id, i]);
  });
  const picked = [];
  for (const [topic, count] of need) picked.push(...shuffle(pool.get(topic) || [], rand).slice(0, count));
  // Multiple-choice options get a new order, so "the answer was C" from a practice test does not carry over.
  const refs = shuffle(picked, rand).map(([id, i]) => {
    const q = getPracticeTest(id).questions[i];
    if (q.input) return [id, i];
    const order = q.options.map((_, j) => j);
    let mixed = shuffle(order, rand);
    // Make sure the correct option moves whenever there is more than one option.
    for (let tries = 0; tries < 5 && order.length > 1 && mixed.indexOf(q.answer) === q.answer; tries++) mixed = shuffle(order, rand);
    return [id, i, mixed];
  });
  return { event, minutes: template.minutes, refs };
}

// A stored option order lists the original option index for each new position.
function reorder(q, order) {
  if (!order || q.input) return q;
  return { ...q, options: order.map((j) => q.options[j]), answer: order.indexOf(q.answer) };
}

// Rebuilds a stored ranked test into the shape gradeAnswers expects.
export function rankedTest(row) {
  const refs = JSON.parse(row.questions);
  const questions = refs.map(([id, i, order]) => {
    const q = getPracticeTest(id)?.questions[i];
    return q && reorder(q, order);
  }).filter(Boolean);
  const template = getPracticeTest(refs[0]?.[0]);
  return { event: row.event, minutes: Number(row.minutes), plan: template?.plan ?? [], questions };
}

// What the student sees: never the answer key or explanations.
export const publicQuestions = (test) => test.questions.map((q) => q.input
  ? { prompt: q.prompt, input: true, unit: q.unit || '', prefix: q.prefix || '' }
  : { prompt: q.prompt, options: q.options });

export function readAnswers(test, answers) {
  if (!Array.isArray(answers) || answers.length !== test.questions.length) return null;
  const ok = answers.every((a, i) => a === null || (test.questions[i].input
    ? typeof a === 'string' && a.length > 0 && a.length <= 20
    : Number.isInteger(a) && a >= 0 && a < test.questions[i].options.length));
  return ok ? answers : null;
}

export const gradeRanked = (test, answers) => gradeAnswers(test, answers);

// Checks a teacher's question list: [testId, index] pairs from this event's practice tests, no repeats.
export function readRefs(event, list, max = 200) {
  if (!Array.isArray(list) || list.length < 1 || list.length > max) return null;
  const seen = new Set(), out = [];
  for (const ref of list) {
    if (!Array.isArray(ref) || typeof ref[0] !== 'string' || !Number.isInteger(ref[1])) return null;
    const test = getPracticeTest(ref[0]);
    if (!test || test.event !== event || ref[1] < 0 || ref[1] >= test.questions.length) return null;
    const key = ref[0] + '#' + ref[1];
    if (seen.has(key)) return null;
    seen.add(key);
    out.push([ref[0], ref[1]]);
  }
  return out;
}

// A teacher's edit of a ranked test. Questions already in the test keep their option order;
// added multiple-choice questions get a new order, so the answer letter does not carry over.
export function editRankedRefs(current, pairs, seed) {
  const kept = new Map(current.map((r) => [r[0] + '#' + r[1], r]));
  const rand = seeded(seed);
  return pairs.map(([id, i]) => {
    const old = kept.get(id + '#' + i);
    if (old) return old;
    const q = getPracticeTest(id).questions[i];
    if (q.input) return [id, i];
    const order = q.options.map((_, j) => j);
    let mixed = shuffle(order, rand);
    for (let tries = 0; tries < 5 && order.length > 1 && mixed.indexOf(q.answer) === q.answer; tries++) mixed = shuffle(order, rand);
    return [id, i, mixed];
  });
}
