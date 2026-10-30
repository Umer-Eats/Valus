import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.js';
import { AppError } from '../server/http.js';
import { checkPasswordSettings, loadCommunities } from '../server/communities.js';
import { createDb } from '../server/db.js';

const communities = loadCommunities([
  { id: 'ppchs', name: 'Pembroke Pines Charter High School', studentPassword: { env: 'A_STUDENT' }, instructorPassword: { env: 'A_INSTRUCTOR' } },
  { id: 'other', name: 'Other High', studentPassword: { env: 'B_STUDENT' }, instructorPassword: { env: 'B_INSTRUCTOR' } },
]);
const env = { A_STUDENT: 'pines-student', A_INSTRUCTOR: 'pines-teacher', B_STUDENT: 'other-student', B_INSTRUCTOR: 'other-teacher' };

// Tokens in these tests are simply "uid"; a real deployment verifies Firebase ID tokens.
const verifyToken = async (token) => {
  if (!token || token === 'bad') throw new AppError(401, 'Your session has expired. Please log in again.');
  return { uid: token, email: `${token}@example.com`, emailVerified: true, name: token.toUpperCase() };
};

let dir, server, base;
before(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'valus-test-'));
  const db = createDb({ TURSO_DATABASE_URL: 'file:' + path.join(dir, 'test.db').replaceAll('\\', '/') });
  server = http.createServer(createApp({ db, verifyToken, env, communities }));
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
const join = (as, role, password, communityId = 'ppchs') =>
  call('POST', '/auth/register', { as, body: { role, communityId, password } });

test('public community list never exposes password settings', async () => {
  const { status, data } = await call('GET', '/communities');
  assert.equal(status, 200);
  assert.deepEqual(data.communities, [{ id: 'ppchs', name: 'Pembroke Pines Charter High School' }, { id: 'other', name: 'Other High' }]);
  assert.doesNotMatch(JSON.stringify(data), /STUDENT|INSTRUCTOR|pines-/);
});

test('enrollment needs a session and the right password for the chosen role', async () => {
  assert.equal((await join(undefined, 'student', 'pines-student')).status, 401);
  assert.equal((await join('s-wrong', 'student', 'pines-teacher')).status, 403);
  assert.equal((await join('s-wrong', 'instructor', 'pines-student')).status, 403);
  assert.equal((await join('s-wrong', 'student', 'other-student')).status, 403, 'another community password must not work');
  const ok = await join('maya', 'student', 'pines-student');
  assert.equal(ok.status, 201);
  assert.equal(ok.data.profile.role, 'student');
  assert.equal(ok.data.profile.community.id, 'ppchs');
  assert.equal((await join('rivera', 'instructor', 'pines-teacher')).status, 201);
});

test('a student password alone links the account to its school', async () => {
  const register = (as, body) => call('POST', '/auth/register', { as, body });
  const ok = await register('nia', { role: 'student', password: 'other-student', firstName: ' Nia ', lastName: 'Brooks' });
  assert.equal(ok.status, 201);
  assert.equal(ok.data.profile.community.id, 'other');
  assert.equal(ok.data.profile.displayName, 'Nia Brooks');
  assert.equal((await register('s-none', { role: 'student', password: 'pines-teacher' })).status, 403, 'a teacher password never makes a student');
  assert.equal((await register('t-none', { role: 'instructor', password: 'pines-teacher' })).status, 400, 'teachers must choose their school');
  assert.equal((await register('t-wrong', { role: 'instructor', communityId: 'other', password: 'pines-teacher' })).status, 403, 'a teacher password only works for its own school');
  const teacher = await register('t-ok', { role: 'instructor', communityId: 'other', password: 'other-teacher', firstName: 'Ana', lastName: 'Diaz' });
  assert.equal(teacher.status, 201);
  assert.equal(teacher.data.profile.role, 'instructor');
  assert.equal(teacher.data.profile.community.id, 'other');
});

test('an account keeps one role and one community', async () => {
  assert.equal((await join('maya', 'instructor', 'pines-teacher')).status, 409);
  assert.equal((await join('maya', 'student', 'other-student', 'other')).status, 409);
  assert.equal((await join('maya', 'student', 'anything')).status, 200, 're-registering the same enrollment is idempotent');
});

test('repeated wrong passwords are rate limited', async () => {
  let last;
  for (let i = 0; i < 11; i++) last = await join('guesser', 'student', 'guess-' + i);
  assert.equal(last.status, 429);
  assert.equal((await join('guesser', 'student', 'pines-student')).status, 429);
});

test('student event changes persist and feed teacher roster and global rankings', async () => {
  assert.equal((await call('PUT', '/me/event', { as: 'maya', body: { event: 'Not an event' } })).status, 400);
  assert.equal((await call('PUT', '/me/event', { as: 'maya', body: { event: 'Nursing Assisting' } })).data.profile.event, 'Nursing Assisting');
  assert.equal((await call('PUT', '/me/event', { as: 'maya', body: { event: 'Medical Terminology' } })).status, 200);
  let roster = (await call('GET', '/students', { as: 'rivera' })).data.students;
  assert.equal(roster.find(s=>s.uid==='maya').event,'Medical Terminology');
  let rankings = (await call('GET', '/rankings', { as: 'maya' })).data.students;
  assert.equal(rankings.find(s=>s.isYou).event,'Medical Terminology');
  assert.ok(rankings.every(s=>!('email' in s)&&!('uid' in s)), 'rankings omit private account fields');
  assert.equal((await call('GET','/rankings')).status,401);
  assert.equal((await call('PUT','/me/event',{as:'rivera',body:{event:'HOSA Bowl'}})).status,403);
  assert.equal((await call('PUT','/me/event',{as:'maya',body:{event:null}})).data.profile.event,null);
  rankings = (await call('GET','/rankings',{as:'maya'})).data.students;
  assert.ok(!rankings.some(s=>s.isYou));
  assert.equal((await call('PATCH', '/students/maya', { as: 'maya', body: { event: 'Medical Terminology' } })).status, 403);
  assert.equal((await call('PATCH', '/students/maya', { as: 'rivera', body: { event: 'Medical Terminology' } })).status, 200);
  assert.equal((await call('GET', '/me', { as: 'maya' })).data.profile.event, 'Medical Terminology');
  rankings = (await call('GET','/rankings',{as:'maya'})).data.students;
  assert.equal(rankings.find(s=>s.isYou).event,'Medical Terminology');
});

test('assignments reach only the matching community and event', async () => {
  await join('jordan', 'student', 'pines-student');
  await call('PUT', '/me/event', { as: 'jordan', body: { event: 'HOSA Bowl' } });
  await join('north-teacher', 'instructor', 'other-teacher', 'other');

  const create = (as, body) => call('POST', '/assignments', { as, body: { type: 'Lesson', due: '2026-11-01', ...body } });
  assert.equal((await create('maya', { title: 'Nope' })).status, 403);
  assert.equal((await create('rivera', { title: ' ' })).status, 400);
  const terms = await create('rivera', { title: 'Word roots', event: 'Medical Terminology' });
  assert.equal(terms.status, 201);
  await create('rivera', { title: 'Chapter kickoff' });
  await create('north-teacher', { title: 'Other school only' });

  const titles = async (as) => (await call('GET', '/assignments', { as })).data.assignments.map((a) => a.title).sort();
  assert.deepEqual(await titles('maya'), ['Chapter kickoff', 'Word roots']);
  assert.deepEqual(await titles('jordan'), ['Chapter kickoff']);
  assert.deepEqual(await titles('rivera'), ['Chapter kickoff', 'Word roots']);
  assert.deepEqual(await titles('north-teacher'), ['Other school only']);

  const id = terms.data.assignment.id;
  assert.equal((await call('PUT', `/assignments/${id}/submission`, { as: 'jordan', body: { body: 'hi' } })).status, 404);
  assert.equal((await call('PUT', `/assignments/${id}/submission`, { as: 'maya', body: { body: 'Done' } })).status, 200);
  assert.equal((await call('GET', '/assignments', { as: 'maya' })).data.assignments.find((a) => a.id === id).submitted, true);
  assert.equal((await call('GET', '/assignments', { as: 'rivera' })).data.assignments.find((a) => a.id === id).submissionCount, 1);
  assert.equal((await call('PATCH', `/assignments/${id}`, { as: 'north-teacher', body: { title: 'Hijack' } })).status, 404);
  assert.equal((await call('DELETE', `/assignments/${id}`, { as: 'rivera' })).status, 204);
});

test('assignments track completion or a target accuracy', async () => {
  const create = (body) => call('POST', '/assignments', { as: 'rivera', body: { due: '2026-11-01', ...body } });
  assert.equal((await create({ title: 'Test', type: 'Practice test' })).status, 400, 'a practice test must be chosen');
  assert.equal((await create({ title: 'Test', type: 'Practice test', testId: 'medical-terminology-1', goal: 'accuracy', target: 0 })).status, 400);
  assert.equal((await create({ title: 'Read', type: 'Lesson', goal: 'accuracy', target: 80 })).status, 400, 'a reading lesson has no score');
  const test80 = await create({ title: 'Terminology test', type: 'Practice test', testId: 'medical-terminology-1', goal: 'accuracy', target: 80 });
  assert.equal(test80.status, 201);
  assert.equal(test80.data.assignment.event, 'Medical Terminology', 'a practice test is for its own event');
  assert.equal(test80.data.assignment.goal, 'accuracy');
  const done = await create({ title: 'Just take it', type: 'Practice test', testId: 'medical-terminology-1' });
  const skill = await create({ title: 'Record your skill', type: 'Skill', event: 'Medical Terminology', goal: 'accuracy', target: 70 });

  // A blank test scores 0: it completes the test but misses an 80% target.
  const { questions } = (await import('../dist/practice-tests.js')).getPracticeTest('medical-terminology-1');
  const sent = await call('POST', '/practice/medical-terminology-1/attempts', { as: 'maya', body: { mode: 'exam', answers: questions.map(() => null), seconds: 60 } });
  assert.equal(sent.status, 201);
  const mine = (await call('GET', '/assignments', { as: 'maya' })).data.assignments;
  assert.equal(mine.find((a) => a.id === test80.data.assignment.id).submitted, true);
  assert.equal(mine.find((a) => a.id === test80.data.assignment.id).met, false);
  assert.equal(mine.find((a) => a.id === done.data.assignment.id).met, true);
  assert.equal((await call('PUT', `/assignments/${done.data.assignment.id}/submission`, { as: 'maya', body: { body: 'x' } })).status, 400);

  // Teachers score skills; the score decides whether the target is met.
  const skillId = skill.data.assignment.id;
  assert.equal((await call('PUT', `/assignments/${test80.data.assignment.id}/scores/maya`, { as: 'rivera', body: { score: 90 } })).status, 400, 'auto-scored work cannot be overridden');
  assert.equal((await call('PUT', `/assignments/${skillId}/scores/maya`, { as: 'maya', body: { score: 90 } })).status, 403);
  assert.equal((await call('PUT', `/assignments/${skillId}/scores/maya`, { as: 'rivera', body: { score: 101 } })).status, 400);
  assert.equal((await call('PUT', `/assignments/${skillId}/scores/maya`, { as: 'rivera', body: { score: 75 } })).status, 200);
  const roster = (await call('GET', `/assignments/${skillId}/submissions`, { as: 'rivera' })).data.students;
  assert.deepEqual(roster.map((s) => [s.uid, s.best, s.met]), [['maya', 75, true]]);
  const teacher = (await call('GET', '/assignments', { as: 'rivera' })).data.assignments.find((a) => a.id === test80.data.assignment.id);
  assert.deepEqual([teacher.audienceCount, teacher.submissionCount, teacher.metCount], [1, 1, 0]);

  // One student's analytics, for their own teacher only.
  assert.equal((await call('GET', '/students/maya/analytics', { as: 'north-teacher' })).status, 404);
  assert.equal((await call('GET', '/students/maya/analytics', { as: 'maya' })).status, 403);
  const stats = (await call('GET', '/students/maya/analytics', { as: 'rivera' })).data;
  assert.equal(stats.student.event, 'Medical Terminology');
  assert.equal(stats.practice.length, 1);
  assert.ok(stats.practice[0].areas.length > 0, 'practice attempts carry topic areas for skill accuracy');
  assert.equal(stats.assignments.find((a) => a.id === skillId).best, 75);
  for (const a of [test80, done, skill]) await call('DELETE', `/assignments/${a.data.assignment.id}`, { as: 'rivera' });
});

test('community posts stay inside their community', async () => {
  assert.equal((await call('POST', '/posts', { as: 'maya', body: { body: '   ' } })).status, 400);
  const mine = await call('POST', '/posts', { as: 'maya', body: { body: 'Study session after school?' } });
  assert.equal(mine.status, 201);
  assert.equal(mine.data.post.author.displayName, 'MAYA');
  await call('POST', '/posts', { as: 'north-teacher', body: { body: 'Other school news' } });

  const bodies = async (as) => (await call('GET', '/posts', { as })).data.posts.map((p) => p.body);
  assert.deepEqual(await bodies('jordan'), ['Study session after school?']);
  assert.deepEqual(await bodies('north-teacher'), ['Other school news']);
  assert.equal((await call('GET', '/posts', { as: 'outsider' })).status, 403);

  assert.equal((await call('DELETE', `/posts/${mine.data.post.id}`, { as: 'jordan' })).status, 403);
  assert.equal((await call('DELETE', `/posts/${mine.data.post.id}`, { as: 'north-teacher' })).status, 404);
  assert.equal((await call('DELETE', `/posts/${mine.data.post.id}`, { as: 'rivera' })).status, 204);
});

test('progress counts each lesson once and shows on the roster', async () => {
  assert.equal((await call('PUT', '/progress/lessons/guidelines', { as: 'maya' })).status, 200);
  assert.equal((await call('PUT', '/progress/lessons/guidelines', { as: 'maya' })).status, 200);
  assert.equal((await call('PUT', '/progress/lessons/made-up', { as: 'maya' })).status, 404);
  assert.equal((await call('POST', '/progress/quizzes', { as: 'maya', body: { score: 101 } })).status, 400);
  assert.equal((await call('POST', '/progress/quizzes', { as: 'maya', body: { score: 67 } })).status, 201);
  const mine = (await call('GET', '/progress', { as: 'maya' })).data;
  assert.deepEqual(mine.completed, ['guidelines']);
  assert.equal(mine.progress, 33);
  assert.equal(mine.quizHistory.at(-1).score, 67);

  assert.equal((await call('GET', '/students', { as: 'maya' })).status, 403);
  const roster = (await call('GET', '/students', { as: 'rivera' })).data.students;
  assert.deepEqual(roster.map((s) => s.uid).sort(), ['jordan', 'maya']);
  assert.equal(roster.find((s) => s.uid === 'maya').progress, 33);
  assert.equal(roster.find((s) => s.uid === 'maya').lastQuizScore, 67);
});

test('instructors can remove students from their own community only', async () => {
  assert.equal((await call('DELETE', '/students/jordan', { as: 'north-teacher' })).status, 404);
  assert.equal((await call('DELETE', '/students/jordan', { as: 'rivera' })).status, 204);
  assert.equal((await call('GET', '/posts', { as: 'jordan' })).status, 403);
  assert.equal((await call('GET', '/me', { as: 'jordan' })).data.enrolled, false);
});

test('unknown routes and methods answer cleanly', async () => {
  assert.equal((await call('GET', '/nope')).status, 404);
  assert.equal((await call('DELETE', '/communities')).status, 405);
  assert.equal((await call('GET', '/me', { as: 'bad' })).status, 401);
});

test('password settings must be present, distinct per role and unique per community', () => {
  assert.deepEqual(checkPasswordSettings(communities, env), []);
  assert.match(checkPasswordSettings(communities, { ...env, B_STUDENT: undefined }).join(), /B_STUDENT is not set/);
  assert.match(checkPasswordSettings(communities, { ...env, A_INSTRUCTOR: 'pines-student' }).join(), /must differ/);
  assert.match(checkPasswordSettings(communities, { ...env, B_STUDENT: 'pines-student' }).join(), /share a student password/);
  assert.throws(() => loadCommunities([{ id: 'Bad ID', name: 'x', studentPassword: { env: 'A' }, instructorPassword: { env: 'B' } }]));
});
