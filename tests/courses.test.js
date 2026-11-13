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
import { COURSES, courseLessons, loadAllCourses } from '../dist/courses.js';
import { RICH_COURSES } from '../dist/rich/index.js';
import { FIGURES } from '../dist/rich/figures.js';
import { FIGURE_PLACES } from '../dist/rich/figure-places.js';
import { widgetKinds } from '../dist/lesson-widgets.js';
import { DIAGRAMS } from '../dist/lesson-diagrams.js';

await loadAllCourses({ view: true });
import { coursePage } from '../dist/course-workspace.js';

const communities = loadCommunities([{ id: 'ppchs', name: 'Pines', studentPassword: { env: 'S' }, instructorPassword: { env: 'T' } }]);
const env = { S: 'student-pass', T: 'teacher-pass' };
const verifyToken = async (token) => {
  if (!token) throw new AppError(401, 'Please log in.');
  return { uid: token, email: `${token}@example.com`, name: token };
};
// The grader is swapped per test: a fixed score, or an outage.
let grader = async () => ({ score: 50, points: 3, maximum: 6, passed: false, feedback: 'Add reasoning.', safetyConcern: false, criteria: [] });

const lessons = courseLessons('Nutrition'), [first, second] = lessons;
let dir, server, base;
before(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'valus-course-'));
  const db = createDb({ TURSO_DATABASE_URL: 'file:' + path.join(dir, 'test.db').replaceAll('\\', '/') });
  server = http.createServer(createApp({ db, verifyToken, env, communities, gradeFRQ: (...a) => grader(...a) }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
  for (const [as, role, password] of [['ana', 'student', 'student-pass'], ['ben', 'student', 'student-pass'], ['teach', 'instructor', 'teacher-pass']])
    await call('POST', '/auth/register', { as, body: { role, communityId: 'ppchs', password } });
  await call('PUT', '/me/event', { as: 'ana', body: { event: 'Nutrition' } });
  await call('PUT', '/me/event', { as: 'ben', body: { event: 'Medical Terminology' } });
});
after(() => { server.close(); try { rmSync(dir, { recursive: true, force: true }); } catch {} });

async function call(method, route, { as, body } = {}) {
  const res = await fetch(base + route, { method, headers: { ...(as && { Authorization: 'Bearer ' + as }), ...(body && { 'Content-Type': 'application/json' }) }, body: body && JSON.stringify(body) });
  return { status: res.status, data: res.status === 204 ? null : await res.json() };
}
const response = 'Absorption, distribution, metabolism and excretion explain how the drug reaches and leaves circulation in this case.';
const answers = (lesson, right = lesson.mcqs.length) => lesson.mcqs.map((q, i) => (i < right ? q.answer : (q.answer + 1) % q.options.length));

test('students move on to any lesson without a checkpoint', async () => {
  assert.equal((await call('POST', `/courses/lessons/${second.id}/complete`, { as: 'ana' })).status, 200, 'no previous-lesson gate');
  assert.equal((await call('POST', `/courses/lessons/${first.id}/complete`, { as: 'ana' })).status, 200);
  assert.equal((await call('POST', `/courses/lessons/${first.id}/complete`, { as: 'ana' })).status, 200, 'repeat is harmless');
  assert.equal((await call('POST', '/courses/lessons/nope/complete', { as: 'ana' })).status, 404);
  assert.equal((await call('POST', `/courses/lessons/${first.id}/complete`, { as: 'teach' })).status, 403);
  assert.deepEqual((await call('GET', '/courses/progress', { as: 'ana' })).data.completed.sort(), [first.id, second.id].sort());
});

test('every lesson shows an optional checkpoint; teachers also get the answer key and assign button', () => {
  const student = coursePage('Nutrition', first.id, { completed: [] }, false);
  assert.match(student, new RegExp(`data-checkpoint="/courses/lessons/${first.id}/checkpoint"`));
  assert.match(student, /name="mcq0"/);
  assert.match(student, /data-course-complete/, 'moving on never needs the checkpoint');
  assert.doesNotMatch(student, /Show answer key|assign-checkpoint/);
  assert.doesNotMatch(coursePage('Nutrition', '', { completed: [] }, false), /Locked/);
  const teacher = coursePage('Nutrition', first.id, {}, true);
  assert.match(teacher, /data-action="assign-checkpoint"/);
  assert.match(teacher, /Show answer key/);
});

test('the in-lesson checkpoint records student accuracy and grades teacher previews without saving', async () => {
  grader = async () => ({ score: 100, points: 6, maximum: 6, passed: true, feedback: 'Strong.', safetyConcern: false, criteria: [] });
  const url = `/courses/lessons/${second.id}/checkpoint`;
  const preview = await call('POST', url, { as: 'teach', body: { answers: answers(second), response } });
  assert.equal(preview.status, 200);
  assert.equal(preview.data.recorded, false);
  assert.equal(preview.data.accuracy, 100);
  const free = await call('POST', url, { as: 'ana', body: { answers: answers(second, second.mcqs.length / 2), response } });
  assert.deepEqual([free.data.recorded, free.data.accuracy, free.data.assignmentId], [true, 75, null]);
  assert.deepEqual((await call('GET', '/courses/progress', { as: 'ana' })).data.accuracy[second.id], { latest: 75, attempts: 1 });
  assert.equal((await call('POST', '/courses/lessons/nope/checkpoint', { as: 'ana', body: { answers: [0, 0], response } })).status, 404);

  // When the teacher has assigned this lesson's checkpoint, the in-lesson attempt counts as the submission.
  const a = (await call('POST', '/assignments', { as: 'teach', body: { title: 'L2', type: 'Lesson checkpoint', due: '2026-12-05', lessonId: second.id } })).data.assignment;
  const linked = await call('POST', url, { as: 'ana', body: { answers: answers(second), response } });
  assert.equal(linked.data.assignmentId, a.id);
  const subs = (await call('GET', `/assignments/${a.id}/submissions`, { as: 'teach' })).data.submissions;
  assert.equal(subs[0].checkpoint.accuracy, 100);
});

test('teachers assign a lesson checkpoint and every attempt records accuracy', async () => {
  grader = async () => ({ score: 50, points: 3, maximum: 6, passed: false, feedback: 'Add reasoning.', safetyConcern: false, criteria: [] });
  const bad = await call('POST', '/assignments', { as: 'teach', body: { title: 'Check', type: 'Lesson checkpoint', due: '2026-12-01' } });
  assert.equal(bad.status, 400, 'a checkpoint needs a lesson');
  const made = await call('POST', '/assignments', { as: 'teach', body: { title: 'Check', type: 'Lesson checkpoint', due: '2026-12-01', event: null, lessonId: first.id } });
  assert.equal(made.status, 201);
  const a = made.data.assignment;
  assert.equal(a.lessonId, first.id);
  assert.equal(a.event, 'Nutrition', 'audience follows the lesson');
  assert.ok(!(await call('GET', '/assignments', { as: 'ben' })).data.assignments.some((x) => x.id === a.id));
  assert.equal((await call('POST', `/assignments/${a.id}/checkpoint`, { as: 'ben', body: { answers: answers(first), response } })).status, 404);
  assert.equal((await call('PUT', `/assignments/${a.id}/submission`, { as: 'ana', body: { body: 'text only' } })).status, 400);
  assert.equal((await call('POST', `/assignments/${a.id}/checkpoint`, { as: 'ana', body: { answers: [0], response } })).status, 400);

  // Half the MCQs right (50%) and FRQ 50% gives 50% accuracy; a wrong MCQ does not block submitting.
  const one = await call('POST', `/assignments/${a.id}/checkpoint`, { as: 'ana', body: { answers: answers(first, first.mcqs.length / 2), response } });
  assert.equal(one.status, 200);
  assert.deepEqual([one.data.mcqCorrect, one.data.mcqTotal, one.data.frqScore, one.data.accuracy], [first.mcqs.length / 2, first.mcqs.length, 50, 50]);

  // A grader outage must not record a checkpoint as submitted or inflate accuracy.
  grader = async () => { throw new AppError(503, 'Valus AI could not grade this response right now.'); };
  const two = await call('POST', `/assignments/${a.id}/checkpoint`, { as: 'ana', body: { answers: answers(first), response } });
  assert.equal(two.status, 503);
  assert.match(two.data.error, /could not grade/);

  const subs = (await call('GET', `/assignments/${a.id}/submissions`, { as: 'teach' })).data.submissions;
  assert.equal(subs.length, 1);
  assert.deepEqual(subs[0].checkpoint, { accuracy: 50, mcqCorrect: first.mcqs.length / 2, mcqTotal: first.mcqs.length, frqScore: 50, attempts: 1 });
  assert.equal((await call('GET', '/assignments', { as: 'ana' })).data.assignments.find((x) => x.id === a.id).submitted, true);
  assert.deepEqual((await call('GET', '/courses/progress', { as: 'ana' })).data.accuracy[first.id], { latest: 50, attempts: 1 });
  const ana = (await call('GET', '/students', { as: 'teach' })).data.students.find((s) => s.uid === 'ana');
  // Average of graded attempts: 50 here, plus 75 and 100 from the in-lesson test.
  assert.equal(ana.checkpointAccuracy, 75);
  assert.equal(ana.courseLessonsCompleted, 2);

  // Changing the type away from a checkpoint drops its lesson link.
  const edited = await call('PATCH', `/assignments/${a.id}`, { as: 'teach', body: { type: 'Reflection' } });
  assert.equal(edited.data.assignment.lessonId, null);
  assert.equal((await call('PATCH', `/assignments/${a.id}`, { as: 'teach', body: { type: 'Lesson checkpoint' } })).status, 400);
});

test('every course lesson has a gradable checkpoint for teachers to assign', () => {
  for (const name of Object.keys(COURSES)) for (const l of courseLessons(name)) {
    assert.ok(l.mcqs.length >= 2, l.id);
    for (const q of l.mcqs) assert.ok(Number.isInteger(q.answer) && q.options[q.answer], l.id);
    assert.ok(l.frq.prompt && l.frq.rubric.length >= 2 && l.frq.modelAnswer, l.id);
  }
  const ids = Object.keys(COURSES).flatMap(courseLessons).map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length, 'lesson ids are unique');
});

test('in-depth courses are complete, well-formed and only use known activities and diagrams', () => {
  const kinds = new Set(widgetKinds());
  for (const name of Object.keys(RICH_COURSES)) {
    const course = COURSES[name];
    assert.ok(course?.rich, name + ' loaded');
    for (const l of courseLessons(name)) {
      assert.ok(l.sections.length >= 4, l.id + ' has depth');
      assert.ok(l.mcqs.length >= 8, l.id + ' has a full checkpoint');
      assert.equal(new Set(l.mcqs.map(q => q.prompt)).size, l.mcqs.length, l.id + ' has no duplicate questions');
      for (const q of l.mcqs) assert.equal(new Set(q.options).size, q.options.length, l.id + ' options are distinct: ' + q.prompt);
      assert.ok(l.frq.rubric.length >= 3 && l.frq.modelAnswer.length > 200, l.id + ' FRQ');
      assert.ok(l.sources.length >= 2 && l.sources.every(s => s.url.startsWith('https://')), l.id + ' sources');
      const blocks = l.sections.flatMap(s => s.blocks);
      assert.ok(blocks.some(b => b.t === 'w'), l.id + ' is interactive');
      for (const b of blocks.filter(b => b.t === 'w')) {
        assert.ok(kinds.has(b.kind), l.id + ' unknown activity ' + b.kind);
        if (b.diagram) { assert.ok(DIAGRAMS[b.diagram], l.id + ' unknown diagram ' + b.diagram); for (const [id] of b.parts || []) assert.match(DIAGRAMS[b.diagram], new RegExp('data-part="' + id + '"'), l.id + ' part ' + id); }
        if (b.kind === 'sort') for (const [, i] of b.items) assert.ok(i < b.buckets.length, l.id + ' sort bucket');
        if (b.kind === 'case') for (const n of Object.values(b.nodes)) for (const c of n.choices || []) assert.ok(b.nodes[c[1]], l.id + ' case link ' + c[1]);
      }
      for (const b of blocks.filter(b => b.t === 'check')) assert.ok(b.options[b.answer] && b.why, l.id + ' quick check');
      for (const b of blocks.filter(b => b.t === 'fig')) { const f = FIGURES[b.file]; assert.ok(f && f.url.startsWith('https://') && /^CC BY/.test(f.license) && f.source, l.id + ' figure ' + b.file); assert.ok(b.caption && b.alt, l.id + ' figure text ' + b.file); }
    }
  }
});

test('every placed textbook figure lands in a real lesson section', () => {
  for (const [name, lessons] of Object.entries(FIGURE_PLACES)) for (const [n, list] of Object.entries(lessons)) {
    const lesson = courseLessons(name)[Number(n) - 1];
    assert.ok(lesson, name + ' lesson ' + n);
    for (const [section] of list) assert.ok(lesson.sections[section - 1], name + ' lesson ' + n + ' section ' + section);
  }
  const figs = Object.keys(RICH_COURSES).flatMap(courseLessons).flatMap(l => l.sections.flatMap(s => s.blocks)).filter(b => b.t === 'fig');
  assert.ok(figs.length >= 100, 'figures are placed: ' + figs.length);
});

test('an unfinished checkpoint keeps its answers and place until a recorded submit', async () => {
  const lesson = courseLessons('Nutrition')[2], url = `/courses/lessons/${lesson.id}/checkpoint/draft`;
  const partial = lesson.mcqs.map((q, i) => (i < 2 ? q.answer : null));
  assert.deepEqual((await call('GET', url, { as: 'ben' })).data, { draft: null });
  assert.equal((await call('PUT', url, { as: 'ben', body: { answers: partial, response: 'Half way', slide: 2 } })).status, 200);
  const saved = (await call('GET', url, { as: 'ben' })).data.draft;
  assert.deepEqual([saved.answers, saved.response, saved.slide], [partial, 'Half way', 2]);
  assert.equal((await call('GET', url, { as: 'ana' })).data.draft, null, 'drafts are per student');
  assert.equal((await call('PUT', url, { as: 'ben', body: { answers: [0], response: '', slide: 0 } })).status, 400);
  assert.equal((await call('PUT', '/courses/lessons/nope/checkpoint/draft', { as: 'ben', body: { answers: [], response: '', slide: 0 } })).status, 404);
  // A grading outage is not a submission, so the draft stays.
  grader = async () => { throw new AppError(503, 'Grader down.'); };
  assert.notEqual((await call('POST', `/courses/lessons/${lesson.id}/checkpoint`, { as: 'ben', body: { answers: answers(lesson), response } })).status, 200);
  assert.ok((await call('GET', url, { as: 'ben' })).data.draft);
  grader = async () => ({ score: 100, points: 6, maximum: 6, passed: true, feedback: 'Strong.', safetyConcern: false, criteria: [] });
  assert.equal((await call('POST', `/courses/lessons/${lesson.id}/checkpoint`, { as: 'ben', body: { answers: answers(lesson), response } })).status, 200);
  assert.equal((await call('GET', url, { as: 'ben' })).data.draft, null, 'a recorded submit clears the draft');
});
