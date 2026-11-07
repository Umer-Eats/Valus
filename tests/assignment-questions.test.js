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
import { getPracticeTest, practiceTests } from '../dist/practice-tests.js';

const communities = loadCommunities([
  { id: 'ppchs', name: 'Pembroke Pines Charter High School', studentPassword: { env: 'A_STUDENT' }, instructorPassword: { env: 'A_INSTRUCTOR' } },
]);
const env = { A_STUDENT: 'pines-student', A_INSTRUCTOR: 'pines-teacher' };
const verifyToken = async (token) => {
  if (!token) throw new AppError(401, 'Please log in.');
  return { uid: token, email: `${token}@example.com`, emailVerified: true, name: token.toUpperCase() };
};

// Stands in for Firebase Storage: tests "upload" a file by adding it here.
const stored = new Map();
const storage = {
  configured: () => true,
  info: async (p) => stored.get(p) ?? null,
  viewUrl: async (p) => 'https://storage.example/' + p,
};
let dir, server, base;
before(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'valus-questions-'));
  const db = createDb({ TURSO_DATABASE_URL: 'file:' + path.join(dir, 'test.db').replaceAll('\\', '/') });
  server = http.createServer(createApp({ db, verifyToken, env, communities, storage }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => {
  server.close();
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
});

async function call(method, route, { as, body } = {}) {
  const res = await fetch(base + route, {
    method,
    headers: { ...(as && { Authorization: 'Bearer ' + as }), ...(body && { 'Content-Type': 'application/json' }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, data: res.status === 204 ? null : await res.json() };
}
const join = (as, role, password) => call('POST', '/auth/register', { as, body: { role, communityId: 'ppchs', password } });

test('teachers edit a practice test assignment and students take that version', async () => {
  await join('qt', 'instructor', 'pines-teacher');
  await join('qs', 'student', 'pines-student');
  await call('PUT', '/me/event', { as: 'qs', body: { event: 'CPR/First Aid' } });
  const base = getPracticeTest(practiceTests('CPR/First Aid')[0].id);
  const made = await call('POST', '/assignments', { as: 'qt', body: { title: 'Practice', type: 'Practice test', testId: base.id, due: '2026-12-01', goal: 'accuracy', target: 50 } });
  const id = made.data.assignment.id;
  assert.equal(made.data.assignment.practiceId, base.id, 'unedited tests open the original');

  const q = await call('GET', `/assignments/${id}/questions`, { as: 'qt' });
  assert.equal(q.status, 200);
  assert.equal(q.data.refs.length, base.questions.length);
  assert.equal(q.data.edited, false);
  assert.equal((await call('GET', `/assignments/${id}/questions`, { as: 'qs' })).status, 403, 'students cannot read the editor');

  // Remove all but three questions and add one from another practice test for the event.
  const other = practiceTests('CPR/First Aid').map((t) => getPracticeTest(t.id)).find((t) => t.id !== base.id);
  const refs = [...q.data.refs.slice(0, 3), ...(other ? [[other.id, 0]] : [])];
  assert.equal((await call('PUT', `/assignments/${id}/questions`, { as: 'qt', body: { refs: [refs[0], refs[0]] } })).status, 400, 'no repeats');
  assert.equal((await call('PUT', `/assignments/${id}/questions`, { as: 'qt', body: { refs: [[practiceTests('Pharmacology')[0].id, 0]] } })).status, 400, 'same event only');
  const saved = await call('PUT', `/assignments/${id}/questions`, { as: 'qt', body: { refs } });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.edited, true);
  assert.equal(saved.data.refs.length, refs.length);

  const list = await call('GET', '/assignments', { as: 'qs' });
  const mine = list.data.assignments.find((a) => a.id === id);
  assert.match(mine.practiceId, /^custom-.+\.1$/);
  const custom = await call('GET', `/practice/custom/${mine.practiceId}`, { as: 'qs' });
  assert.equal(custom.status, 200);
  assert.deepEqual(custom.data.test.refs, refs);

  // All correct on the edited test meets the goal.
  const answers = refs.map(([t, i]) => getPracticeTest(t).questions[i].answer);
  const sent = await call('POST', `/practice/${mine.practiceId}/attempts`, { as: 'qs', body: { mode: 'exam', answers, seconds: 60 } });
  assert.equal(sent.status, 201);
  assert.equal(sent.data.attempt.score, 100);
  assert.equal(sent.data.attempt.total, refs.length);
  const after = (await call('GET', '/assignments', { as: 'qs' })).data.assignments.find((a) => a.id === id);
  assert.equal(after.met, true);
  assert.equal(after.best, 100);

  // A second edit is a new version; the earlier attempt can still be reviewed and still counts.
  const again = await call('PUT', `/assignments/${id}/questions`, { as: 'qt', body: { refs: refs.slice(0, 2) } });
  assert.equal(again.status, 200);
  const attempts = await call('GET', '/practice/attempts', { as: 'qs' });
  assert.equal(attempts.data.attempts.at(-1).title, 'Practice');
  assert.equal(attempts.data.attempts.at(-1).total, refs.length);
  assert.equal((await call('GET', '/assignments', { as: 'qs' })).data.assignments.find((a) => a.id === id).met, true);

  // Deleting the assignment removes the edited test and its attempts.
  assert.equal((await call('DELETE', `/assignments/${id}`, { as: 'qt' })).status, 204);
  assert.equal((await call('GET', `/practice/custom/${mine.practiceId}`, { as: 'qs' })).status, 404);
  assert.equal((await call('GET', '/practice/attempts', { as: 'qs' })).data.attempts.length, 0);
});

test('ranked test questions can change only until a student starts', async () => {
  await join('rt', 'instructor', 'pines-teacher');
  await join('rs', 'student', 'pines-student');
  await call('PUT', '/me/event', { as: 'rs', body: { event: 'CPR/First Aid' } });
  const made = await call('POST', '/assignments', { as: 'rt', body: { title: 'Ranked', type: 'Ranked test', event: 'CPR/First Aid', due: '2026-12-01' } });
  const id = made.data.assignment.id;
  const q = await call('GET', `/assignments/${id}/questions`, { as: 'rt' });
  assert.equal(q.data.editable, true);
  const inTest = new Set(q.data.refs.map((r) => r[0] + '#' + r[1]));
  const extra = practiceTests('CPR/First Aid').flatMap((t) => getPracticeTest(t.id).questions.map((_, i) => [t.id, i])).find((r) => !inTest.has(r[0] + '#' + r[1]));
  const pairs = [...q.data.refs.slice(0, 9).map((r) => [r[0], r[1]]), extra];
  const saved = await call('PUT', `/assignments/${id}/questions`, { as: 'rt', body: { refs: pairs } });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.refs.length, 10);
  assert.deepEqual(saved.data.refs.slice(0, 9), q.data.refs.slice(0, 9), 'kept questions keep their answer order');
  const added = saved.data.refs[9], original = getPracticeTest(added[0]).questions[added[1]];
  if (!original.input) assert.equal(added[2].length, original.options.length, 'added questions get a shuffled order');
  assert.ok(saved.data.minutes < q.data.minutes, 'time scales with fewer questions');

  const start = await call('POST', `/assignments/${id}/ranked/start`, { as: 'rs' });
  assert.equal(start.data.questions.length, 10);
  const locked = await call('GET', `/assignments/${id}/questions`, { as: 'rt' });
  assert.equal(locked.data.editable, false);
  assert.equal(locked.data.started, 1);
  assert.equal((await call('PUT', `/assignments/${id}/questions`, { as: 'rt', body: { refs: pairs.slice(0, 5) } })).status, 409);
});
