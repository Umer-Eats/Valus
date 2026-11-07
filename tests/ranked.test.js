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
import { buildRankedTest, rankedTest } from '../server/ranked.js';
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
  dir = mkdtempSync(path.join(tmpdir(), 'valus-ranked-'));
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

test('a ranked test follows the event format and draws from its practice tests', () => {
  const built = buildRankedTest('CPR/First Aid', 'seed-1');
  const template = getPracticeTest(practiceTests('CPR/First Aid')[0].id);
  assert.equal(built.refs.length, template.questions.length);
  assert.equal(built.minutes, template.minutes);
  const count = (list) => list.reduce((m, q) => m.set(q.topic, (m.get(q.topic) || 0) + 1), new Map());
  assert.deepEqual(count(built.refs.map(([id, i]) => getPracticeTest(id).questions[i])), count(template.questions), 'same topic weights');
  assert.equal(new Set(built.refs.map(String)).size, built.refs.length, 'no repeated questions');
  assert.deepEqual(buildRankedTest('CPR/First Aid', 'seed-1'), built, 'same seed, same test');
});

test('ranked tests shuffle answer choices but keep the right answer', () => {
  for (const event of ['CPR/First Aid', 'Medical Math']) {
    const built = buildRankedTest(event, 'shuffle-' + event);
    const test = rankedTest({ event, minutes: built.minutes, questions: JSON.stringify(built.refs) });
    let moved = 0, mcq = 0;
    built.refs.forEach(([id, i], n) => {
      const original = getPracticeTest(id).questions[i], shown = test.questions[n];
      if (original.input) { assert.equal(shown, original, 'write-in questions are unchanged'); return; }
      mcq++;
      assert.deepEqual([...shown.options].sort(), [...original.options].sort(), 'same choices');
      assert.equal(shown.options[shown.answer], original.options[original.answer], 'same correct choice');
      if (shown.answer !== original.answer) moved++;
    });
    if (mcq) assert.equal(moved, mcq, 'every correct choice moves to a new letter');
  }
  // Tests saved before shuffling still load in their original order.
  const ref = buildRankedTest('CPR/First Aid', 'old').refs.map(([id, i]) => [id, i]);
  const old = rankedTest({ event: 'CPR/First Aid', minutes: 60, questions: JSON.stringify(ref) });
  assert.equal(old.questions[0], getPracticeTest(ref[0][0]).questions[ref[0][1]]);
});

test('ranked tests lock on an unfinished exit until the teacher reopens them', async () => {
  await join('teach', 'instructor', 'pines-teacher');
  for (const s of ['ana', 'ben']) {
    await join(s, 'student', 'pines-student');
    await call('PUT', '/me/event', { as: s, body: { event: 'CPR/First Aid' } });
  }
  const create = (body) => call('POST', '/assignments', { as: 'teach', body: { title: 'Ranked', type: 'Ranked test', due: '2026-12-01', ...body } });
  assert.equal((await create({ event: null })).status, 400, 'a ranked test needs an event');
  const made = await create({ event: 'CPR/First Aid' });
  assert.equal(made.status, 201);
  const id = made.data.assignment.id;
  assert.equal(made.data.assignment.teacherScored, false);
  assert.equal((await call('PATCH', `/assignments/${id}`, { as: 'teach', body: { event: 'Pharmacology' } })).status, 400);

  // Ana starts, answers one question, then exits full screen: locked.
  const start = await call('POST', `/assignments/${id}/ranked/start`, { as: 'ana' });
  assert.equal(start.data.state, 'in_progress');
  assert.ok(start.data.questions.every((q) => !('answer' in q) && !('explain' in q)), 'no answer key is sent');
  const answers = start.data.answers.slice(); answers[0] = 0;
  assert.equal((await call('PUT', `/assignments/${id}/ranked/answers`, { as: 'ana', body: { answers } })).status, 200);
  const left = await call('POST', `/assignments/${id}/ranked/submit`, { as: 'ana', body: { answers, reason: 'exited_fullscreen' } });
  assert.equal(left.data.state, 'locked');
  assert.equal(left.data.answered, 1);
  assert.equal(left.data.areas[0].correct >= 0, true);
  assert.ok(!JSON.stringify(left.data).includes('"answer"'), 'results hold no answer key');
  // A second exit signal and a fresh start both stay locked.
  assert.equal((await call('POST', `/assignments/${id}/ranked/submit`, { as: 'ana', body: { reason: 'switched_away' } })).data.state, 'locked');
  assert.equal((await call('POST', `/assignments/${id}/ranked/start`, { as: 'ana' })).data.state, 'locked');
  assert.equal((await call('PUT', `/assignments/${id}/ranked/answers`, { as: 'ana', body: { answers } })).status, 409);

  // Only the teacher can reopen; Ana resumes with her saved answer.
  assert.equal((await call('POST', `/assignments/${id}/ranked/ana/reopen`, { as: 'ben' })).status, 403);
  const subs = await call('GET', `/assignments/${id}/submissions`, { as: 'teach' });
  assert.equal(subs.data.students.find((s) => s.uid === 'ana').ranked.status, 'locked');
  assert.equal((await call('POST', `/assignments/${id}/ranked/ana/reopen`, { as: 'teach' })).status, 200);
  const again = await call('POST', `/assignments/${id}/ranked/start`, { as: 'ana' });
  assert.equal(again.data.state, 'in_progress');
  assert.equal(again.data.answers[0], 0);
  const full = again.data.questions.map(() => 0);
  const done = await call('POST', `/assignments/${id}/ranked/submit`, { as: 'ana', body: { answers: full, reason: 'finished' } });
  assert.equal(done.data.state, 'submitted');

  // Ben closes the tab mid-test without a submit reaching the server: the next start closes it.
  await call('POST', `/assignments/${id}/ranked/start`, { as: 'ben' });
  assert.equal((await call('POST', `/assignments/${id}/ranked/start`, { as: 'ben' })).data.state, 'locked');

  const mine = (await call('GET', '/assignments', { as: 'ana' })).data.assignments.find((a) => a.id === id);
  assert.equal(mine.submitted, true);
  assert.equal(mine.ranked.place, 1);
  assert.equal(mine.ranked.of, 1);
  assert.equal((await call('PUT', `/assignments/${id}/submission`, { as: 'ana', body: { body: 'x' } })).status, 400);

  // Submitted ranked tests feed global rankings; a locked test does not.
  const ranks = (await call('GET', '/rankings', { as: 'ben' })).data.students;
  const ana = ranks.find((s) => s.displayName === 'ANA'), ben = ranks.find((s) => s.isYou);
  assert.equal(ana.rating, done.data.score);
  assert.equal(ana.tests, 1);
  assert.equal(ana.eventPlace, 1);
  assert.ok(ana.rank.label);
  assert.equal(ben.rating, null);
  assert.equal(ben.rank, null);
  assert.equal((await call('DELETE', `/assignments/${id}`, { as: 'teach' })).status, 204);
});

test('ranked mock procedures are graded by the server from the action log', async () => {
  await join('t2', 'instructor', 'pines-teacher');
  for (const s of ['cara', 'dev']) { await join(s, 'student', 'pines-student'); await call('PUT', '/me/event', { as: s, body: { event: 'CPR/First Aid' } }); }
  const create = (event) => call('POST', '/assignments', { as: 't2', body: { title: 'Ranked lab', type: 'Ranked mock procedure', event, due: '2026-12-01' } });
  assert.equal((await create('Pharmacology')).status, 400, 'needs an event with a lab');
  const made = await create('CPR/First Aid');
  assert.equal(made.status, 201);
  const id = made.data.assignment.id;
  assert.equal(made.data.assignment.minutes, 17);
  const start = await call('POST', `/assignments/${id}/ranked/start`, { as: 'cara' });
  assert.equal(start.data.kind, 'mock');
  assert.equal((await call('POST', `/assignments/${id}/ranked/submit`, { as: 'cara', body: { log: 'bad', reason: 'finished' } })).status, 400);
  const log = [{ i: 0, t: 1, r: 1, type: 'scene', d: {}, say: 'The scene is safe' }];
  const done = await call('POST', `/assignments/${id}/ranked/submit`, { as: 'cara', body: { log, reason: 'finished', score: 100 } });
  assert.equal(done.data.state, 'submitted');
  assert.ok(done.data.score < 100, 'the score comes from the server rubric, not the browser');
  assert.ok(done.data.possible > 0);

  // Leaving mid-run always locks; reopening gives a fresh run.
  await call('POST', `/assignments/${id}/ranked/start`, { as: 'dev' });
  assert.equal((await call('POST', `/assignments/${id}/ranked/submit`, { as: 'dev', body: { log, reason: 'switched_away' } })).data.state, 'locked');
  assert.equal((await call('POST', `/assignments/${id}/ranked/dev/reopen`, { as: 't2' })).status, 200);
  assert.equal((await call('POST', `/assignments/${id}/ranked/start`, { as: 'dev' })).data.state, 'in_progress');
});

test('ranked uploads take files only during the session and are scored by the teacher', async () => {
  for (const s of ['eli', 'fay']) { await join(s, 'student', 'pines-student'); await call('PUT', '/me/event', { as: s, body: { event: 'CPR/First Aid' } }); }
  const create = (body) => call('POST', '/assignments', { as: 't2', body: { title: 'Ranked skill', type: 'Ranked skill', event: 'CPR/First Aid', due: '2026-12-01', ...body } });
  assert.equal((await create({ minutes: 2 })).status, 400, 'time limit is 5 to 180 minutes');
  const made = await create({ minutes: 20 });
  assert.equal(made.status, 201);
  const id = made.data.assignment.id;
  assert.equal(made.data.assignment.teacherScored, true);
  assert.equal(made.data.assignment.minutes, 20);

  const start = await call('POST', `/assignments/${id}/ranked/start`, { as: 'eli' });
  assert.equal(start.data.kind, 'upload');
  assert.equal(start.data.folder, `ranked/eli/${id}/`);
  const add = (path, name = 'skill.mp4') => call('POST', `/assignments/${id}/ranked/files`, { as: 'eli', body: { path, name } });
  assert.equal((await add(`ranked/fay/${id}/abcdefgh12`)).status, 400, 'only your own folder');
  assert.equal((await add(start.data.folder + 'missing123')).status, 400, 'the file must exist');
  stored.set(start.data.folder + 'oldfile123', { size: 10, contentType: 'video/mp4', created: '2020-01-01T00:00:00Z' });
  assert.equal((await add(start.data.folder + 'oldfile123')).status, 400, 'files from before the session are refused');
  stored.set(start.data.folder + 'newfile123', { size: 10, contentType: 'video/mp4', created: new Date().toISOString() });
  const added = await add(start.data.folder + 'newfile123');
  assert.equal(added.status, 200);
  assert.equal(added.data.files.length, 1);
  assert.ok(!('path' in added.data.files[0]));
  assert.equal((await call('PUT', `/assignments/${id}/ranked/notes`, { as: 'eli', body: { notes: 'Steps 1-5' } })).status, 200);

  // Leaving after a file was uploaded submits it; leaving with nothing locks.
  const left = await call('POST', `/assignments/${id}/ranked/submit`, { as: 'eli', body: { reason: 'exited_fullscreen' } });
  assert.equal(left.data.state, 'submitted');
  assert.equal(left.data.notes, 'Steps 1-5');
  await call('POST', `/assignments/${id}/ranked/start`, { as: 'fay' });
  assert.equal((await call('POST', `/assignments/${id}/ranked/submit`, { as: 'fay', body: { reason: 'switched_away' } })).data.state, 'locked');

  // The teacher opens the file and scores it; the score feeds rankings.
  const url = await call('GET', `/assignments/${id}/ranked/eli/files/newfile123`, { as: 't2' });
  assert.equal(url.data.url, `https://storage.example/ranked/eli/${id}/newfile123`);
  assert.equal((await call('GET', `/assignments/${id}/ranked/eli/files/newfile123`, { as: 'eli' })).status, 403);
  assert.equal((await call('PUT', `/assignments/${id}/scores/eli`, { as: 't2', body: { score: 88 } })).status, 200);
  const mine = (await call('GET', '/assignments', { as: 'eli' })).data.assignments.find((a) => a.id === id);
  assert.equal(mine.best, 88);
  assert.equal(mine.ranked.place, 1);
  const eli = (await call('GET', '/rankings', { as: 'eli' })).data.students.find((s) => s.isYou);
  assert.equal(eli.rating, 88);
});
