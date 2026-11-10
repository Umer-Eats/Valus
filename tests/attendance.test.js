import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../server/app.js';
import { createDb, ensureSchema } from '../server/db.js';
import { loadCommunities } from '../server/communities.js';
import { ATTENDANCE_RADIUS_METERS, distanceMeters } from '../dist/attendance-model.js';

const communities = loadCommunities([
  {
    id: 'chapter',
    name: 'Test Chapter',
    studentPassword: { env: 'A_STUDENT' },
    instructorPassword: { env: 'A_TEACHER' },
  },
  {
    id: 'other',
    name: 'Other Chapter',
    studentPassword: { env: 'B_STUDENT' },
    instructorPassword: { env: 'B_TEACHER' },
  },
]);
let db, server, base;
before(async () => {
  db = createDb({ TURSO_DATABASE_URL: 'file::memory:' });
  await ensureSchema(db);
  for (const [id, role, chapter] of [
    ['teacher', 'instructor', 'chapter'],
    ['student', 'student', 'chapter'],
    ['absent', 'student', 'chapter'],
    ['other-teacher', 'instructor', 'other'],
    ['outsider', 'student', 'other'],
  ])
    await db.execute({
      sql: 'INSERT INTO users (id,email,display_name,role,community_id) VALUES (?,?,?,?,?)',
      args: [id, `${id}@example.test`, id, role, chapter],
    });
  server = http.createServer(
    createApp({
      db,
      communities,
      env: {},
      verifyToken: async (uid) => ({ uid, email: `${uid}@example.test` }),
    }),
  );
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  await new Promise((r) => server.close(r));
  db.close();
});
async function call(method, path, as = 'teacher', body) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(as ? { Authorization: `Bearer ${as}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}
const input = () => ({
  title: 'Clinical skills gathering',
  opensAt: new Date(Date.now() - 60000).toISOString(),
  closesAt: new Date(Date.now() + 3600000).toISOString(),
  timezone: 'America/New_York',
  locationName: 'Test Chapter skills room',
  latitude: 26,
  longitude: -80,
});
async function create() {
  const result = await call('POST', '/attendance', 'teacher', input());
  assert.equal(result.status, 200);
  const id = result.data.id;
  const w = (await call('GET', '/attendance')).data.events.find((e) => e.id === id);
  return w;
}
const position = (w) => ({
  eventId: w.id,
  code: w.code,
  latitude: 26,
  longitude: -80,
  accuracy: 10,
  timestamp: Date.now(),
});

test('attendance endpoints require enrollment and enforce role and chapter access', async () => {
  assert.equal((await call('GET', '/attendance', null)).status, 401);
  assert.equal((await call('GET', '/attendance', 'unknown')).status, 403);
  assert.equal((await call('POST', '/attendance', 'student', input())).status, 403);
  const w = await create();
  assert.equal(
    (await call('PATCH', `/attendance/${w.id}`, 'other-teacher', { action: 'cancel' })).status,
    404,
  );
  assert.equal((await call('DELETE', `/attendance/${w.id}`, 'student')).status, 403);
  assert.equal((await call('DELETE', `/attendance/${w.id}`, 'other-teacher')).status, 404);
  assert.equal((await call('POST', '/attendance/check-in', 'outsider', position(w))).status, 400);
  assert.equal((await call('GET', '/attendance', 'outsider')).data.events.length, 0);
  await call('DELETE', `/attendance/${w.id}`);
});
test('each event has a distinct code; student responses never expose codes or other students', async () => {
  const a = await create(),
    b = await create();
  assert.notEqual(a.code, b.code);
  assert.equal(a.expected, 2);
  const student = (await call('GET', '/attendance', 'student')).data;
  assert.equal(student.events.find((e) => e.id === a.id).code, undefined);
  assert.equal(student.events.find((e) => e.id === a.id).audienceIds, undefined);
  assert.deepEqual(student.members, []);
  assert.deepEqual(student.records, []);
  await call('DELETE', `/attendance/${a.id}`);
  await call('DELETE', `/attendance/${b.id}`);
});
test('check-in validates the code and half-mile boundary including accuracy and freshness', async () => {
  const w = await create();
  for (const [body, status] of [
    [{ code: 'WRONG123' }, 400],
    [{ latitude: 27 }, 403],
    [{ latitude: 26.007, accuracy: 100 }, 403],
    [{ accuracy: 500 }, 400],
    [{ timestamp: Date.now() - 120000 }, 400],
    [{ longitude: '-80' }, 400],
  ])
    assert.equal(
      (await call('POST', '/attendance/check-in', 'student', { ...position(w), ...body })).status,
      status,
    );
  assert.equal(
    (await call('POST', '/attendance/check-in', 'student', position(w))).data.alreadyRecorded,
    false,
  );
  assert.equal(
    (await call('POST', '/attendance/check-in', 'student', position(w))).data.alreadyRecorded,
    true,
  );
  const records = await db.execute('SELECT * FROM attendance_records');
  assert.equal(records.rows.length, 1);
  assert.equal(records.rows[0].latitude, undefined);
  assert.equal(records.rows[0].longitude, undefined);
  assert.ok(distanceMeters(26, -80, 26.007, -80) < ATTENDANCE_RADIUS_METERS);
  await call('DELETE', `/attendance/${w.id}`);
});
test('server time windows, cancellation and code rotation govern check-in', async () => {
  const w = await create();
  await db.execute({
    sql: 'UPDATE attendance_events SET opens_at=? WHERE id=?',
    args: [new Date(Date.now() + 60000).toISOString(), w.id],
  });
  assert.equal((await call('POST', '/attendance/check-in', 'absent', position(w))).status, 409);
  await db.execute({
    sql: 'UPDATE attendance_events SET opens_at=?,closes_at=? WHERE id=?',
    args: [
      new Date(Date.now() - 120000).toISOString(),
      new Date(Date.now() - 60000).toISOString(),
      w.id,
    ],
  });
  assert.equal((await call('POST', '/attendance/check-in', 'absent', position(w))).status, 409);
  await db.execute({
    sql: 'UPDATE attendance_events SET closes_at=? WHERE id=?',
    args: [new Date(Date.now() + 3600000).toISOString(), w.id],
  });
  assert.equal(
    (await call('PATCH', `/attendance/${w.id}`, 'teacher', { action: 'rotate' })).status,
    200,
  );
  assert.equal((await call('POST', '/attendance/check-in', 'absent', position(w))).status, 400);
  const next = (await call('GET', '/attendance')).data.events.find((e) => e.id === w.id);
  assert.equal(
    (await call('PATCH', `/attendance/${w.id}`, 'teacher', { action: 'cancel' })).status,
    200,
  );
  assert.equal((await call('POST', '/attendance/check-in', 'absent', position(next))).status, 409);
  await call('DELETE', `/attendance/${w.id}`);
});
test('completed event analytics count saved rosters and deletion removes all related data', async () => {
  const w = await create();
  await call('POST', '/attendance/check-in', 'student', position(w));
  await db.execute({
    sql: 'UPDATE attendance_events SET closes_at=? WHERE id=?',
    args: [new Date(Date.now() - 1000).toISOString(), w.id],
  });
  let report = (await call('GET', '/attendance')).data;
  assert.equal(report.members.find((m) => m.id === 'student').rate, 100);
  assert.equal(report.members.find((m) => m.id === 'absent').rate, 0);
  assert.equal((await call('DELETE', `/attendance/${w.id}`)).status, 200);
  assert.equal((await db.execute('SELECT COUNT(*) AS n FROM attendance_records')).rows[0].n, 0);
  assert.equal((await db.execute('SELECT COUNT(*) AS n FROM attendance_audience')).rows[0].n, 0);
  report = (await call('GET', '/attendance')).data;
  assert.deepEqual(report.events, []);
  assert.deepEqual(report.records, []);
  assert.equal(report.members.find((m) => m.id === 'student').rate, null);
  assert.equal((await call('GET', '/attendance', 'student')).data.events.length, 0);
  assert.equal((await call('DELETE', `/attendance/${w.id}`)).status, 404);
});
test('visible-tab presence is scoped to the teacher chapter and expires after 90 seconds', async () => {
  await call('POST', '/presence', 'student');
  await call('POST', '/presence', 'outsider');
  let members = (await call('GET', '/attendance')).data.members;
  assert.equal(members.find((m) => m.id === 'student').online, true);
  assert.equal(
    members.find((m) => m.id === 'outsider'),
    undefined,
  );
  await db.execute({ sql: 'UPDATE member_presence SET last_seen=?', args: [Date.now() - 100000] });
  members = (await call('GET', '/attendance')).data.members;
  assert.equal(members.find((m) => m.id === 'student').online, false);
});
test('invalid schedules and missing address-search configuration fail clearly', async () => {
  for (const changes of [
    { title: '' },
    { opensAt: 'invalid' },
    { closesAt: new Date(Date.now() - 100000).toISOString() },
    { timezone: 'Moon/Crater' },
    { latitude: 100 },
    { closesAt: new Date(Date.now() + 48 * 3600000).toISOString() },
  ])
    assert.equal(
      (await call('POST', '/attendance', 'teacher', { ...input(), ...changes })).status,
      400,
    );
  assert.equal((await call('GET', '/attendance/locations?q=school', 'student')).status, 403);
  const result = await call('GET', '/attendance/locations?q=school');
  assert.equal(result.status, 503);
  assert.match(result.data.error, /Geoapify/);
});
test('repeated code guesses are rate limited in the database', async () => {
  const w = await create();
  await db.execute('DELETE FROM enrollment_limits');
  for (let i = 0; i < 12; i++)
    assert.equal(
      (await call('POST', '/attendance/check-in', 'absent', { ...position(w), code: 'BADCODE1' }))
        .status,
      400,
    );
  assert.equal((await call('POST', '/attendance/check-in', 'absent', position(w))).status, 429);
  await call('DELETE', `/attendance/${w.id}`);
});
