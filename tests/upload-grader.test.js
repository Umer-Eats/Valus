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
import { Readable } from 'node:stream';
import { geminiFileApi, gradeUpload, guidelineText, hasGrader, hasUploadGrader, readGrade, seconds, youtubeLink, GRADER_DAILY_LIMIT } from '../server/upload-grader.js';

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

const VIDEO_GRADE = {
  rubricTitle: 'Speaking Skills Speech Rubric', videoLength: '4:52',
  criteria: [
    { name: 'Introduction', possible: 10, awarded: 8, level: 'Good', assessable: true, feedback: 'Strong hook.', moments: [{ time: '0:05', note: 'Opens with a question', good: true }, { time: 'soon', note: 'bad time', good: false }] },
    { name: 'Voice', possible: 10, awarded: 6, level: 'Average', assessable: true, feedback: 'Many fillers.', moments: [{ time: '1:12', note: 'Says um three times', good: false }] },
  ],
  summary: 'Good structure.', strengths: ['Clear thesis'], improvements: [{ area: 'Voice', fix: 'Pause instead of saying um.' }],
  missingRequirements: [], timeline: [{ time: '2:00', note: 'Main point two', good: true }, { time: '0:05', note: 'Hook', good: true }],
};
const stored = new Map(), removed = [], graded = [];
const storage = {
  configured: () => true,
  info: async (p) => stored.get(p) ?? null,
  download: async (p) => Buffer.from('pdf for ' + p),
  stream: (p) => Readable.from([Buffer.from('video ' + p)]),
  remove: async (p) => { removed.push(p); stored.delete(p); },
  viewUrl: async (p) => 'https://storage.example/' + p,
};
let failNext = false;
const fakeGrade = async (input, config) => {
  graded.push({ input, config });
  if (failNext) { failNext = false; throw new AppError(503, 'Valus AI could not grade this upload right now.'); }
  return { ...readGrade(input.mode === 'upload' ? GRADE : VIDEO_GRADE, input.mode), model: config.model };
};
// Stands in for Gemini's file service.
const geminiState = new Map(), geminiRemoved = [];
const geminiFiles = {
  upload: async ({ stream, size, contentType, name }) => {
    let n = 0; for await (const c of stream) n += c.length;
    const file = { name: 'files/f' + geminiState.size, uri: 'https://gemini.example/f' + geminiState.size, mimeType: contentType, state: 'PROCESSING', bytes: n, size, label: name };
    geminiState.set(file.name, file);
    return file;
  },
  status: async (name) => geminiState.get(name) ?? { state: 'FAILED' },
  remove: async (name) => { geminiRemoved.push(name); },
};

let dir, server, base;
before(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'valus-grader-'));
  const db = createDb({ TURSO_DATABASE_URL: 'file:' + path.join(dir, 'test.db').replaceAll('\\', '/') });
  server = http.createServer(createApp({ db, verifyToken, env, communities, storage, gradeUpload: fakeGrade, geminiFiles }));
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

test('all three graders use an unbounded provider schema and still validate rubric results', async () => {
  const checkSchema = (node) => {
    if (!node || typeof node !== 'object') return;
    assert.equal(Object.hasOwn(node, 'minItems'), false, 'avoid bounded-array schema rejection');
    assert.equal(Object.hasOwn(node, 'maxItems'), false, 'avoid bounded-array schema rejection');
    Object.values(node).forEach(checkSchema);
  };
  for (const [mode, event] of [['upload', 'Medical Innovation'], ['speech', 'Speaking Skills'], ['video', 'CPR/First Aid']]) {
    const raw = mode === 'upload' ? GRADE : { ...VIDEO_GRADE, ...(mode === 'video' && { skill: 'Skill I-A' }) };
    const out = await gradeUpload({ event, mode, text: 'Synthetic practice submission' }, {
      apiKey: 'test-key',
      fetcher: async (_url, init) => {
        const config = JSON.parse(init.body).generationConfig;
        assert.equal(config.responseMimeType, 'application/json');
        checkSchema(config.responseJsonSchema);
        assert.ok(config.responseJsonSchema.properties.criteria.items.properties.feedback);
        return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(raw) }] } }] });
      },
    });
    assert.equal(out.mode, mode);
    assert.equal(out.score, mode === 'upload' ? 67 : 70);
    assert.throws(() => readGrade({ ...raw, criteria: [] }, mode), /Invalid grade/);
    assert.throws(() => readGrade({ ...raw, criteria: Array(61).fill(raw.criteria[0]) }, mode), /Invalid grade/);
    assert.throws(() => readGrade({ ...raw, criteria: [{ ...raw.criteria[0], awarded: 999 }] }, mode), /Invalid criterion/);
  }
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

test('video grades keep valid timestamps in order and count only scored items', () => {
  assert.equal(seconds('1:05'), 65);
  assert.equal(seconds('1:02:03'), 3723);
  assert.equal(seconds('1:75'), null);
  const g = readGrade(VIDEO_GRADE, 'speech');
  assert.equal(g.score, 70);
  assert.deepEqual(g.criteria[0].moments, [{ at: 5, note: 'Opens with a question', good: true }], 'bad times are dropped');
  assert.deepEqual(g.timeline.map((m) => m.at), [5, 120]);
  assert.equal(g.videoLength, 292);
  assert.equal(g.improvedVersion, undefined);
  assert.equal(hasGrader('Speaking Skills', 'speech'), true);
  assert.equal(hasGrader('CPR/First Aid', 'video'), true);
  assert.equal(hasGrader('Speaking Skills', 'video'), false);
});

test('a video is sent to Gemini by file, with a timestamped schema', async () => {
  let sent;
  const fetcher = async (url, init) => {
    sent = JSON.parse(init.body);
    return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ ...VIDEO_GRADE, skill: 'Skill I-A' }) }] } }] }));
  };
  const out = await gradeUpload({ event: 'CPR/First Aid', mode: 'video', media: [{ uri: 'https://gemini.example/f', mimeType: 'video/mp4' }], skill: 'Skill I-A' }, { apiKey: 'k', fetcher });
  assert.equal(out.skill, 'Skill I-A');
  assert.equal(sent.contents[0].parts.at(-1).fileData.fileUri, 'https://gemini.example/f');
  assert.ok(sent.generationConfig.responseJsonSchema.properties.timeline);
  assert.match(sent.systemInstruction.parts[0].text, /skill rating sheet/);
});

test('the Gemini file service gets a resumable upload of the whole video', async () => {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, init });
    if (calls.length === 1) return new Response('{}', { headers: { 'x-goog-upload-url': 'https://upload.example/session' } });
    let n = 0; for await (const c of init.body) n += c.length;
    return new Response(JSON.stringify({ file: { name: 'files/abc', uri: 'https://gemini.example/abc', mimeType: 'video/mp4', state: 'PROCESSING', got: n } }));
  };
  const api = geminiFileApi({ apiKey: 'k', fetcher });
  const file = await api.upload({ stream: Readable.from([Buffer.alloc(1000)]), size: 1000, contentType: 'video/mp4', name: 'speech.mp4' });
  assert.equal(file.name, 'files/abc');
  assert.equal(calls[0].init.headers['X-Goog-Upload-Header-Content-Length'], '1000');
  assert.equal(calls[1].url, 'https://upload.example/session');
  assert.equal(calls[1].init.headers['X-Goog-Upload-Command'], 'upload, finalize');
});

test('a speech video is processed, then graded with timestamps, and kept apart from uploads', async () => {
  await join('dee', 'student', 'pines-student');
  const ev = 'Speaking Skills';
  assert.equal((await call('GET', '/grader?event=' + encodeURIComponent(ev) + '&mode=video', { as: 'dee' })).status, 404, 'no skills video for a speech event');
  const info = await call('GET', '/grader?event=' + encodeURIComponent(ev) + '&mode=speech', { as: 'dee' });
  assert.equal(info.data.maxFiles, 1);
  assert.equal(info.data.maxBytes, 1_000_000_000);

  const pdf = 'grader/dee/pdffile1234';
  stored.set(pdf, { size: 100, contentType: 'application/pdf', created: new Date().toISOString() });
  assert.equal((await call('POST', '/grader', { as: 'dee', body: { event: ev, mode: 'speech', files: [{ path: pdf, name: 'a.pdf' }] } })).status, 400, 'speech needs a video');

  const p = 'grader/dee/video123456';
  stored.set(p, { size: 50_000_000, contentType: 'video/mp4', created: new Date().toISOString() });
  const started = await call('POST', '/grader', { as: 'dee', body: { event: ev, mode: 'speech', files: [{ path: p, name: 'speech.mp4' }], text: 'Topic: sleep' } });
  assert.equal(started.status, 202, JSON.stringify(started.data));
  const id = started.data.job.id;
  assert.ok(removed.includes(p), 'the storage copy is removed once Gemini has it');
  const gem = [...geminiState.values()].at(-1);
  assert.equal(gem.size, 50_000_000);

  assert.equal((await call('POST', '/grader/jobs/' + id, { as: 'dee' })).data.status, 'processing');
  const pending = await call('GET', '/grader?event=' + encodeURIComponent(ev) + '&mode=speech', { as: 'dee' });
  assert.deepEqual(pending.data.pending.map((x) => x.id), [id], 'a reload can pick the job up again');
  assert.equal((await call('POST', '/grader/jobs/' + id, { as: 'bo' })).status, 404, 'only the owner can see it');

  gem.state = 'ACTIVE';
  const done = await call('POST', '/grader/jobs/' + id, { as: 'dee' });
  assert.equal(done.data.status, 'done', JSON.stringify(done.data));
  assert.equal(done.data.attempt.mode, 'speech');
  assert.equal(done.data.attempt.timeline.length, 2);
  assert.equal(done.data.attempt.criteria[1].moments[0].at, 72);
  const last = graded.at(-1).input;
  assert.equal(last.mode, 'speech');
  assert.equal(last.media[0].uri, gem.uri);
  assert.equal(last.text, 'Topic: sleep');
  assert.ok(geminiRemoved.includes(gem.name));

  const again = await call('POST', '/grader/jobs/' + id, { as: 'dee' });
  assert.equal(again.data.status, 'done', 'asking again just returns the grade');
  assert.equal(graded.filter((g) => g.input.media?.[0]?.uri === gem.uri).length, 1, 'graded once');

  const list = await call('GET', '/grader?event=' + encodeURIComponent(ev) + '&mode=speech', { as: 'dee' });
  assert.deepEqual(list.data.attempts.map((a) => a.id), [id]);
  assert.deepEqual(list.data.pending, []);
});

test('a skills video from YouTube is graded right away, and failed videos are dropped', async () => {
  await join('eli', 'student', 'pines-student');
  const ev = 'CPR/First Aid';
  const yt = await call('POST', '/grader', { as: 'eli', body: { event: ev, mode: 'video', link: 'https://youtu.be/dQw4w9WgXcQ', skill: 'Skill I-A' } });
  assert.equal(yt.status, 201, JSON.stringify(yt.data));
  assert.equal(graded.at(-1).input.skill, 'Skill I-A');
  assert.equal(yt.data.attempt.link, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

  const p = 'grader/eli/video654321';
  stored.set(p, { size: 1000, contentType: 'video/quicktime', created: new Date().toISOString() });
  assert.equal((await call('POST', '/grader', { as: 'eli', body: { event: ev, mode: 'video', files: [{ path: p, name: 'cpr.mov' }], link: 'https://youtu.be/dQw4w9WgXcQ' } })).status, 400, 'file or link, not both');
  const started = await call('POST', '/grader', { as: 'eli', body: { event: ev, mode: 'video', files: [{ path: p, name: 'cpr.mov' }] } });
  assert.equal(started.status, 202);
  [...geminiState.values()].at(-1).state = 'FAILED';
  const failed = await call('POST', '/grader/jobs/' + started.data.job.id, { as: 'eli' });
  assert.equal(failed.status, 400);
  const info = await call('GET', '/grader?event=' + encodeURIComponent(ev) + '&mode=video', { as: 'eli' });
  assert.equal(info.data.remaining, GRADER_DAILY_LIMIT - 1, 'the failed video does not count');
  assert.equal(info.data.attempts.length, 1);
});
