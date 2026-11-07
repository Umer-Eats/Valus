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
import { gradeUpload, guidelineText, hasUploadGrader, readGrade, youtubeLink, GRADER_DAILY_LIMIT } from '../server/upload-grader.js';

const communities = loadCommunities([
  { id: 'ppchs', name: 'Pembroke Pines Charter High School', studentPassword: { env: 'A_STUDENT' }, instructorPassword: { env: 'A_INSTRUCTOR' } },
]);
const env = { A_STUDENT: 'pines-student', A_INSTRUCTOR: 'pines-teacher', GEMINI_API_KEY: 'test-key' };
const verifyToken = async (token) => {
  if (!token) throw new AppError(401, 'Please log in.');
  return { uid: token, email: `${token}@example.com`, emailVerified: true, name: token.toUpperCase() };
};

const GRADE = {
  rubricTitle: 'PSA Round One Video Rubric',
  criteria: [
    { name: 'PSA Overview', possible: 5, awarded: 4, level: 'Good', assessable: true, feedback: 'Clear message.' },
    { name: 'Message delivery', possible: 10, awarded: 6, level: 'Average', assessable: true, feedback: 'Add a call to action.' },
    { name: 'Presentation', possible: 10, awarded: 9, level: 'Excellent', assessable: false, feedback: 'Judged live.' },
  ],
  summary: 'A solid start.', strengths: ['Strong visuals'], improvements: [{ area: 'Message delivery', fix: 'End with one clear action.' }],
  missingRequirements: ['Airdate Form'], improvedVersion: 'Revised script…',
};

const stored = new Map(), removed = [], graded = [];
const storage = {
  configured: () => true,
  info: async (p) => stored.get(p) ?? null,
  download: async (p) => Buffer.from('pdf for ' + p),
  remove: async (p) => { removed.push(p); stored.delete(p); },
  viewUrl: async (p) => 'https://storage.example/' + p,
};
let failNext = false;
const fakeGrade = async (input, config) => {
  graded.push({ input, config });
  if (failNext) { failNext = false; throw new AppError(503, 'Valus AI could not grade this upload right now.'); }
  return { ...readGrade(GRADE), model: config.model };
};

let dir, server, base;
before(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'valus-grader-'));
  const db = createDb({ TURSO_DATABASE_URL: 'file:' + path.join(dir, 'test.db').replaceAll('\\', '/') });
  server = http.createServer(createApp({ db, verifyToken, env, communities, storage, gradeUpload: fakeGrade }));
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
const EVENT = 'Public Service Announcement';

test('only online-submission events have the grader, and their guidelines include a rating sheet', async () => {
  assert.equal(hasUploadGrader(EVENT), true);
  assert.equal(hasUploadGrader('Behavioral Health'), false);
  assert.match(await guidelineText(EVENT), /Rubric/);
  assert.equal(youtubeLink('https://youtu.be/dQw4w9WgXcQ'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.throws(() => youtubeLink('https://drive.google.com/file/d/abc'), /YouTube/);
});

test('scores come from the points awarded, skipping criteria judged live', () => {
  const g = readGrade(GRADE);
  assert.equal(g.earned, 10);
  assert.equal(g.possible, 15);
  assert.equal(g.score, 67);
  assert.equal(g.criteria[2].awarded, 0);
  assert.throws(() => readGrade({ ...GRADE, criteria: [{ ...GRADE.criteria[0], awarded: 6 }] }), /Invalid/);
});

test('Gemini gets the guidelines and the file, and its JSON is checked', async () => {
  let sent;
  const fetcher = async (url, init) => {
    sent = JSON.parse(init.body);
    return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(GRADE) }] } }] }));
  };
  const out = await gradeUpload({ event: EVENT, files: [{ name: 'psa.pdf', contentType: 'application/pdf', data: Buffer.from('hi') }], link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, { apiKey: 'k', fetcher });
  assert.equal(out.score, 67);
  const parts = sent.contents[0].parts;
  assert.match(parts[0].text, /officialGuidelines/);
  assert.equal(parts[2].inlineData.mimeType, 'application/pdf');
  assert.equal(parts[3].fileData.fileUri, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const bad = async () => new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"criteria":[]}' }] } }] }));
  await assert.rejects(gradeUpload({ event: EVENT, text: 'essay' }, { apiKey: 'k', fetcher: bad }), /could not finish/);
  await assert.rejects(gradeUpload({ event: EVENT, text: 'essay' }, {}), /not connected/);
});

test('a student uploads work, gets it graded, and can reopen the grade', async () => {
  await join('ana', 'student', 'pines-student');
  const info = await call('GET', '/grader?event=' + encodeURIComponent(EVENT), { as: 'ana' });
  assert.equal(info.status, 200);
  assert.equal(info.data.remaining, GRADER_DAILY_LIMIT);
  assert.equal(info.data.folder, 'grader/ana/');

  const p = 'grader/ana/file12345678';
  stored.set(p, { size: 1000, contentType: 'application/pdf', created: new Date().toISOString() });
  assert.equal((await call('POST', '/grader', { as: 'ana', body: { event: EVENT, files: [{ path: 'grader/bo/file12345678', name: 'x.pdf' }] } })).status, 400, 'someone else\'s folder');
  assert.equal((await call('POST', '/grader', { as: 'ana', body: { event: 'Behavioral Health', text: 'hi' } })).status, 404);
  assert.equal((await call('POST', '/grader', { as: 'ana', body: { event: EVENT } })).status, 400, 'nothing to grade');

  failNext = true;
  const failed = await call('POST', '/grader', { as: 'ana', body: { event: EVENT, files: [{ path: p, name: 'psa.pdf' }] } });
  assert.equal(failed.status, 503, JSON.stringify(failed.data));
  assert.equal((await call('GET', '/grader?event=' + encodeURIComponent(EVENT), { as: 'ana' })).data.remaining, GRADER_DAILY_LIMIT, 'failures do not count');

  const ok = await call('POST', '/grader', { as: 'ana', body: { event: EVENT, files: [{ path: p, name: 'psa.pdf' }], link: 'https://youtu.be/dQw4w9WgXcQ', text: 'My script' } });
  assert.equal(ok.status, 201);
  assert.equal(ok.data.attempt.score, 67);
  assert.equal(ok.data.remaining, GRADER_DAILY_LIMIT - 1);
  const last = graded.at(-1).input;
  assert.equal(last.files[0].contentType, 'application/pdf');
  assert.equal(last.link, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(last.text, 'My script');
  assert.deepEqual(removed, [p], 'the upload is removed after grading');

  const list = await call('GET', '/grader?event=' + encodeURIComponent(EVENT), { as: 'ana' });
  assert.equal(list.data.attempts.length, 1);
  const one = await call('GET', '/grader/attempts/' + ok.data.attempt.id, { as: 'ana' });
  assert.equal(one.data.attempt.improvedVersion, 'Revised script…');
  await join('bo', 'student', 'pines-student');
  assert.equal((await call('GET', '/grader/attempts/' + ok.data.attempt.id, { as: 'bo' })).status, 404, 'grades are private');
});

test('the daily limit stops extra grades', async () => {
  await join('cy', 'student', 'pines-student');
  for (let i = 0; i < GRADER_DAILY_LIMIT; i++)
    assert.equal((await call('POST', '/grader', { as: 'cy', body: { event: EVENT, text: 'Essay ' + i } })).status, 201);
  const over = await call('POST', '/grader', { as: 'cy', body: { event: EVENT, text: 'One more' } });
  assert.equal(over.status, 429);
});
