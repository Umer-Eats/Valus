import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.js';
import { AppError } from '../server/http.js';
import { loadCommunities } from '../server/communities.js';
import { createDb } from '../server/db.js';
import { loadAllTests, getPracticeTest, gradeAnswers } from '../dist/practice-tests.js';
import { parseEventRoute } from '../dist/event-workspace.js';

await loadAllTests();
const cpr = getPracticeTest('cpr-first-aid-1');

const communities = loadCommunities([{ id: 'ppchs', name: 'Pines', studentPassword: { env: 'S' }, instructorPassword: { env: 'T' } }]);
const env = { S: 'student-pass', T: 'teacher-pass' };
const verifyToken = async (token) => {
  if (!token) throw new AppError(401, 'Please log in.');
  return { uid: token, email: `${token}@example.com`, name: token };
};
let dir, server, base;
before(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'valus-practice-'));
  const db = createDb({ TURSO_DATABASE_URL: 'file:' + path.join(dir, 'test.db').replaceAll('\\', '/') });
  server = http.createServer(createApp({ db, verifyToken, env, communities }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
  for (const [as, role, password] of [['ana', 'student', 'student-pass'], ['ben', 'student', 'student-pass'], ['teach', 'instructor', 'teacher-pass']])
    await call('POST', '/auth/register', { as, body: { role, communityId: 'ppchs', password } });
});
after(() => { server.close(); try { rmSync(dir, { recursive: true, force: true }); } catch {} });

async function call(method, route, { as, body } = {}) {
  const res = await fetch(base + route, { method, headers: { ...(as && { Authorization: 'Bearer ' + as }), ...(body && { 'Content-Type': 'application/json' }) }, body: body && JSON.stringify(body) });
  return { status: res.status, data: res.status === 204 ? null : await res.json() };
}
// The first `right` questions answered correctly, the rest wrong; `blank` leaves the last ones unanswered.
const answers = (right, blank = 0) => cpr.questions.map((q, i) => (i >= cpr.questions.length - blank ? null : i < right ? q.answer : (q.answer + 1) % 4));
const submit = (as, body) => call('POST', '/practice/cpr-first-aid-1/attempts', { as, body: { mode: 'exam', seconds: 1200, timedOut: false, ...body } });

test('the CPR/First Aid test follows the HOSA test plan', () => {
  assert.equal(cpr.questions.length, 50);
  const counts = {};
  for (const q of cpr.questions) {
    assert.equal(q.options.length, 4, q.prompt);
    assert.ok(q.answer >= 0 && q.answer < 4 && q.explain.length > 60 && q.ref, q.prompt);
    assert.equal(new Set(q.options).size, 4, 'options are distinct: ' + q.prompt);
    counts[q.topic] = (counts[q.topic] || 0) + 1;
  }
  assert.equal(new Set(cpr.questions.map((q) => q.prompt)).size, 50, 'no repeated questions');
  const [bls, fa] = cpr.plan;
  assert.equal(bls.topics.reduce((n, t) => n + (counts[t] || 0), 0), 50 * bls.weight / 100, 'Basic Life Support is 40%');
  assert.equal(fa.topics.reduce((n, t) => n + (counts[t] || 0), 0), 50 * fa.weight / 100, 'First Aid is 60%');
  for (const t of [...bls.topics, ...fa.topics]) assert.ok(counts[t] >= 2, 'every test-plan topic is covered: ' + t);
  const letters = [0, 1, 2, 3].map((l) => cpr.questions.filter((q) => q.answer === l).length);
  assert.ok(Math.min(...letters) >= 10, 'correct answers are spread across A–D');
});

test('students submit attempts that the server grades and saves', async () => {
  const first = await submit('ana', { answers: answers(40, 5) });
  assert.equal(first.status, 201);
  assert.equal(first.data.recorded, true);
  assert.equal(first.data.attempt.correct, 40);
  assert.equal(first.data.attempt.score, 80);
  assert.deepEqual(first.data.attempt.areas.map((a) => a.area), ['Basic Life Support', 'First Aid']);
  assert.equal(first.data.attempt.areas.reduce((n, a) => n + a.correct, 0), 40);

  const second = await submit('ana', { mode: 'check', answers: answers(50), seconds: 999999 });
  assert.equal(second.status, 400, 'seconds are bounded');
  const third = await submit('ana', { mode: 'check', answers: answers(50), seconds: 3000 });
  assert.equal(third.data.attempt.score, 100);
  const timed = await submit('ana', { answers: answers(10), seconds: 4000, timedOut: true });
  assert.equal(timed.data.attempt.seconds, 3600, 'exam time is capped at the test limit');
  assert.equal(timed.data.attempt.timedOut, true);

  const list = (await call('GET', '/practice/attempts', { as: 'ana' })).data.attempts;
  assert.deepEqual(list.map((a) => a.score), [80, 100, 20], 'oldest first');
  assert.equal(list[0].answers.length, 50, 'answers are kept for review');
  assert.equal(list[0].answers[49], null);
  assert.equal(list[1].mode, 'check');
  assert.deepEqual((await call('GET', '/practice/attempts', { as: 'ben' })).data.attempts, [], 'attempts are private');
});

test('practice test submissions are validated', async () => {
  assert.equal((await call('POST', '/practice/nope/attempts', { as: 'ana', body: { mode: 'exam', answers: [], seconds: 1 } })).status, 404);
  assert.equal((await submit('ana', { mode: 'quiz', answers: answers(1) })).status, 400);
  assert.equal((await submit('ana', { answers: answers(1).slice(1) })).status, 400);
  assert.equal((await submit('ana', { answers: answers(1).map((a, i) => (i ? a : 7)) })).status, 400);
  assert.equal((await submit('ana', { answers: answers(1).map((a, i) => (i ? a : '1')) })).status, 400);
  assert.equal((await submit(null, { answers: answers(1) })).status, 401);
});

test('teachers can preview a test without saving, and see student scores', async () => {
  const preview = await submit('teach', { answers: answers(25) });
  assert.equal(preview.status, 201);
  assert.equal(preview.data.recorded, false);
  assert.equal(preview.data.attempt.score, 50);
  assert.deepEqual((await call('GET', '/practice/attempts', { as: 'teach' })).data.attempts, []);
  const roster = (await call('GET', '/students', { as: 'teach' })).data.students;
  const ana = roster.find((s) => s.uid === 'ana'), ben = roster.find((s) => s.uid === 'ben');
  assert.deepEqual([ana.practiceLatest, ana.practiceBest, ana.practiceAttempts], [20, 100, 3]);
  assert.deepEqual([ben.practiceLatest, ben.practiceBest, ben.practiceAttempts], [null, null, 0]);
});

test('grading and links to past submissions', () => {
  const graded = gradeAnswers(cpr, answers(30));
  assert.equal(graded.correct, 30);
  assert.equal(graded.score, 60);
  const route = parseEventRoute('/event/CPR%2FFirst%20Aid/tests/cpr-first-aid-1/abc-123');
  assert.equal(route.valid, true);
  assert.equal(route.lessonId, 'cpr-first-aid-1');
  assert.equal(route.attemptId, 'abc-123');
  assert.equal(parseEventRoute('/event/CPR%2FFirst%20Aid/lessons/x/abc').valid, false);
});
