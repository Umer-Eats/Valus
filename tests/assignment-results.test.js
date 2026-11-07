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
  dir = mkdtempSync(path.join(tmpdir(), 'valus-results-'));
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


test('teachers see a ranked test student’s answers and send them their results', async () => {
  await join('wt', 'instructor', 'pines-teacher');
  for (const s of ['wa', 'wb']) { await join(s, 'student', 'pines-student'); await call('PUT', '/me/event', { as: s, body: { event: 'CPR/First Aid' } }); }
  const made = await call('POST', '/assignments', { as: 'wt', body: { title: 'Ranked', type: 'Ranked test', event: 'CPR/First Aid', due: '2026-12-01' } });
  const id = made.data.assignment.id;
  const start = await call('POST', `/assignments/${id}/ranked/start`, { as: 'wa' });
  const answers = start.data.answers.map(() => 0);
  assert.equal((await call('POST', `/assignments/${id}/ranked/submit`, { as: 'wa', body: { answers, reason: 'finished' } })).data.state, 'submitted');

  const work = await call('GET', `/assignments/${id}/work/wa`, { as: 'wt' });
  assert.equal(work.status, 200);
  assert.equal(work.data.kind, 'test');
  assert.equal(work.data.work.questions.length, answers.length);
  assert.ok(work.data.work.questions.every((q) => q.given === 0 && 'answer' in q && typeof q.right === 'boolean'));
  assert.equal(work.data.work.questions.filter((q) => q.right).length, work.data.work.correct);
  assert.equal((await call('GET', `/assignments/${id}/work/wa`, { as: 'wb' })).status, 403, 'students cannot see others’ work');

  // Nothing is visible to the student until it is sent, and unfinished work cannot be sent.
  assert.equal((await call('GET', `/assignments/${id}/results`, { as: 'wa' })).status, 404);
  assert.equal((await call('PUT', `/assignments/${id}/results/wb`, { as: 'wt', body: { note: '' } })).status, 409);
  assert.equal((await call('PUT', `/assignments/${id}/results/wa`, { as: 'wt', body: { note: 'Review airway questions.' } })).status, 200);
  const mine = (await call('GET', '/assignments', { as: 'wa' })).data.assignments.find((a) => a.id === id);
  assert.ok(mine.resultsSentAt);
  const results = await call('GET', `/assignments/${id}/results`, { as: 'wa' });
  assert.equal(results.status, 200);
  assert.equal(results.data.sent.note, 'Review airway questions.');
  assert.equal(results.data.work.questions.length, answers.length);
  assert.equal((await call('GET', `/assignments/${id}/results`, { as: 'wb' })).status, 404, 'others get nothing');

  assert.equal((await call('DELETE', `/assignments/${id}/results/wa`, { as: 'wt' })).status, 204);
  assert.equal((await call('GET', `/assignments/${id}/results`, { as: 'wa' })).status, 404, 'taken back');
});

test('practice tests, written work and uploads show what the student turned in', async () => {
  await join('xt', 'instructor', 'pines-teacher');
  await join('xs', 'student', 'pines-student');
  await call('PUT', '/me/event', { as: 'xs', body: { event: 'CPR/First Aid' } });
  const base = getPracticeTest(practiceTests('CPR/First Aid')[0].id);
  const pt = (await call('POST', '/assignments', { as: 'xt', body: { title: 'PT', type: 'Practice test', testId: base.id, due: '2026-12-01' } })).data.assignment.id;
  const empty = await call('GET', `/assignments/${pt}/work/xs`, { as: 'xt' });
  assert.equal(empty.data.work, null);
  for (const pick of [0, null]) {
    const answers = base.questions.map((q) => (pick === null ? q.answer : q.input ? '0' : 0));
    await call('POST', `/practice/${base.id}/attempts`, { as: 'xs', body: { mode: 'exam', answers, seconds: 30 } });
  }
  const work = await call('GET', `/assignments/${pt}/work/xs`, { as: 'xt' });
  assert.equal(work.data.kind, 'practice');
  assert.equal(work.data.work.attempts.length, 2);
  assert.equal(work.data.work.best.score, 100, 'the best attempt is shown');
  assert.ok(work.data.work.best.questions.every((q) => q.right));

  const skill = (await call('POST', '/assignments', { as: 'xt', body: { title: 'Skill', type: 'Skill', event: null, due: '2026-12-01' } })).data.assignment.id;
  await call('PUT', `/assignments/${skill}/submission`, { as: 'xs', body: { body: 'Video: https://youtu.be/abc123xyz' } });
  await call('PUT', `/assignments/${skill}/scores/xs`, { as: 'xt', body: { score: 88 } });
  const sw = await call('GET', `/assignments/${skill}/work/xs`, { as: 'xt' });
  assert.equal(sw.data.kind, 'text');
  assert.equal(sw.data.work.body, 'Video: https://youtu.be/abc123xyz');
  assert.equal(sw.data.work.score, 88);

  // Sending to everyone reaches only students who finished.
  const sent = await call('POST', `/assignments/${skill}/results`, { as: 'xt' });
  assert.equal(sent.data.sent, 1);
  assert.equal((await call('GET', `/assignments/${skill}/results`, { as: 'xs' })).data.work.score, 88);
  assert.equal((await call('POST', `/assignments/${skill}/results`, { as: 'xt' })).data.sent, 0, 'already sent');
});
