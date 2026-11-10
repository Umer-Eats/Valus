import { randomBytes, randomUUID } from 'node:crypto';
import { AppError } from './http.js';

import { ATTENDANCE_RADIUS_METERS, distanceMeters } from '../dist/attendance-model.js';

export const ATTENDANCE_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS attendance_events (
    id TEXT PRIMARY KEY, community_id TEXT NOT NULL, instructor_id TEXT NOT NULL,
    title TEXT NOT NULL, opens_at TEXT NOT NULL, closes_at TEXT NOT NULL, timezone TEXT NOT NULL,
    location_name TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL,
    code TEXT NOT NULL UNIQUE, cancelled INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS idx_attendance_community ON attendance_events(community_id,opens_at)',
  `CREATE TABLE IF NOT EXISTS attendance_audience (
    event_id TEXT NOT NULL REFERENCES attendance_events(id), student_id TEXT NOT NULL,
    PRIMARY KEY(event_id,student_id))`,
  `CREATE TABLE IF NOT EXISTS attendance_records (
    event_id TEXT NOT NULL REFERENCES attendance_events(id), student_id TEXT NOT NULL,
    checked_in_at TEXT NOT NULL, distance_meters REAL NOT NULL, accuracy_meters REAL NOT NULL,
    PRIMARY KEY(event_id,student_id))`,
  'CREATE TABLE IF NOT EXISTS member_presence (user_id TEXT PRIMARY KEY, last_seen INTEGER NOT NULL)',
];

export function attendanceDatabase(client) {
  return {
    get: async (sql, ...args) => (await client.execute({ sql, args })).rows[0],
    all: async (sql, ...args) => (await client.execute({ sql, args })).rows,
    batch: (statements) => client.batch(statements, 'write'),
  };
}

export async function attendanceRequest(ctx, user, action) {
  const db = attendanceDatabase(ctx.db);
  if (action === 'list') return attendanceFor(db, user);
  if (action === 'create') return createAttendanceEvent(db, user, ctx.body);
  if (action === 'checkin') return checkIn(db, user, ctx.body);
  if (action === 'manage')
    return manageAttendanceEvent(db, user, { ...ctx.body, id: ctx.params.id });
  if (action === 'delete') return deleteAttendanceEvent(db, user, ctx.params.id);
  if (action === 'presence') {
    await db.batch([
      {
        sql: 'INSERT INTO member_presence (user_id,last_seen) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET last_seen=excluded.last_seen',
        args: [user.id, Date.now()],
      },
    ]);
    return { ok: true };
  }
  if (action === 'locations') {
    teacher(user);
    const q = text(ctx.query.get('q'), 200, 'address');
    if (q.length < 3) throw new AppError(400, 'Enter at least three characters to search.');
    if (!ctx.env.GEOAPIFY_API_KEY)
      throw new AppError(
        503,
        'Address search needs a Geoapify API key. Select a point on the map or use your current location.',
      );
    await attendanceLimit(db, `locations:${user.id}`, 20, 60);
    const url = new URL('https://api.geoapify.com/v1/geocode/search');
    url.search = new URLSearchParams({
      text: q,
      format: 'json',
      limit: '5',
      apiKey: ctx.env.GEOAPIFY_API_KEY,
    });
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok)
      throw new AppError(503, 'Address search is unavailable. Select a point on the map.');
    const data = await response.json();
    return {
      results: (data.results ?? []).map((r) => ({
        name: r.formatted,
        latitude: r.lat,
        longitude: r.lon,
      })),
    };
  }
  throw new AppError(400, 'Choose an attendance action.');
}

export async function attendanceLimit(db, key, limit, seconds = 600) {
  const now = Date.now();
  const result = await db.batch(
    [
      { sql: 'DELETE FROM enrollment_limits WHERE expires_at < ?', args: [now] },
      {
        sql: 'INSERT INTO enrollment_limits (key,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1',
        args: [`attendance:${key}`, now + seconds * 1000],
      },
      { sql: 'SELECT attempts FROM enrollment_limits WHERE key=?', args: [`attendance:${key}`] },
    ],
    'immediate',
  );
  if (Number(result[2]?.rows[0]?.attempts) > limit)
    throw new AppError(429, 'Too many attempts. Please try again later.');
}
function text(value, max, label) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    throw new AppError(400, `Enter a valid ${label}.`);
  return value.trim();
}
function coordinate(value, max) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > max)
    throw new AppError(400, 'Choose a valid map location.');
  return value;
}
function teacher(profile) {
  if (profile.role !== 'instructor') throw new AppError(403, 'Only teachers can manage events.');
}
export async function createAttendanceEvent(db, profile, body) {
  teacher(profile);
  const title = text(body.title, 100, 'event title');
  const location = text(body.locationName, 500, 'location name');
  const lat = coordinate(body.latitude, 90),
    lon = coordinate(body.longitude, 180);
  const opens = Date.parse(text(body.opensAt, 40, 'opening time')),
    closes = Date.parse(text(body.closesAt, 40, 'closing time'));
  if (
    !Number.isFinite(opens) ||
    !Number.isFinite(closes) ||
    closes <= opens ||
    closes <= Date.now() ||
    closes - opens > 86400000
  )
    throw new AppError(400, 'Choose a future closing time after opening, within 24 hours.');
  const timezone = text(body.timezone, 100, 'time zone');
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format();
  } catch {
    throw new AppError(400, 'Choose a valid time zone.');
  }
  const id = randomUUID(),
    code = randomBytes(4).toString('hex').toUpperCase();
  await db.batch(
    [
      {
        sql: 'INSERT INTO attendance_events (id,community_id,instructor_id,title,opens_at,closes_at,timezone,location_name,latitude,longitude,code,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        args: [
          id,
          profile.community_id,
          profile.id,
          title,
          new Date(opens).toISOString(),
          new Date(closes).toISOString(),
          timezone,
          location,
          lat,
          lon,
          code,
          new Date().toISOString(),
        ],
      },
      {
        sql: `INSERT INTO attendance_audience (event_id,student_id) SELECT ?,u.id FROM users u WHERE u.community_id=? AND u.role='student'`,
        args: [id, profile.community_id],
      },
    ],
    'immediate',
  );
  return { id };
}
export async function manageAttendanceEvent(db, profile, body) {
  teacher(profile);
  const id = text(body.id, 100, 'event');
  if (body.action !== 'cancel' && body.action !== 'rotate')
    throw new AppError(400, 'Choose an event action.');
  const result = await db.batch(
    [
      {
        sql:
          body.action === 'cancel'
            ? 'UPDATE attendance_events SET cancelled=1 WHERE id=? AND community_id=? AND cancelled=0 AND closes_at>?'
            : 'UPDATE attendance_events SET code=? WHERE id=? AND community_id=? AND cancelled=0 AND closes_at>?',
        args: [
          ...(body.action === 'rotate' ? [randomBytes(4).toString('hex').toUpperCase()] : []),
          id,
          profile.community_id,
          new Date().toISOString(),
        ],
      },
    ],
    'immediate',
  );
  if (!result[0]?.rowsAffected)
    throw new AppError(404, 'Active event not found in your community.');
  return { ok: true };
}
export async function deleteAttendanceEvent(db, profile, value) {
  teacher(profile);
  const id = text(value, 100, 'event');
  // Scope every deletion to this community and remove dependent rows in one transaction.
  const result = await db.batch(
    [
      {
        sql: 'DELETE FROM attendance_records WHERE event_id IN (SELECT id FROM attendance_events WHERE id=? AND community_id=?)',
        args: [id, profile.community_id],
      },
      {
        sql: 'DELETE FROM attendance_audience WHERE event_id IN (SELECT id FROM attendance_events WHERE id=? AND community_id=?)',
        args: [id, profile.community_id],
      },
      {
        sql: 'DELETE FROM attendance_events WHERE id=? AND community_id=?',
        args: [id, profile.community_id],
      },
    ],
    'immediate',
  );
  if (!result[2]?.rowsAffected) throw new AppError(404, 'Event not found in your community.');
  return { ok: true };
}
export async function checkIn(db, profile, body) {
  if (profile.role !== 'student') throw new AppError(403, 'Only students can check in.');
  await attendanceLimit(db, profile.id, 12);
  const id = text(body.eventId, 100, 'event');
  const code = text(body.code, 16, 'attendance code').toUpperCase();
  const w = await db.get(
    'SELECT * FROM attendance_events WHERE id=? AND community_id=?',
    id,
    profile.community_id,
  );
  if (!w || w.code !== code)
    throw new AppError(
      400,
      'That event code did not match. Ask your teacher for the current code.',
    );
  if (
    w.cancelled ||
    Date.now() < Date.parse(String(w.opens_at)) ||
    Date.now() >= Date.parse(String(w.closes_at))
  )
    throw new AppError(409, 'Check-in is outside the teacher’s attendance window.');
  const lat = coordinate(body.latitude, 90),
    lon = coordinate(body.longitude, 180);
  if (
    typeof body.accuracy !== 'number' ||
    !Number.isFinite(body.accuracy) ||
    body.accuracy < 0 ||
    body.accuracy > 200
  )
    throw new AppError(
      400,
      'Your location is too approximate. Enable precise location and try again.',
    );
  if (
    typeof body.timestamp !== 'number' ||
    !Number.isFinite(body.timestamp) ||
    Math.abs(Date.now() - body.timestamp) > 60000
  )
    throw new AppError(400, 'Your location has expired. Please try checking in again.');
  const distance = distanceMeters(lat, lon, Number(w.latitude), Number(w.longitude));
  if (distance + body.accuracy > ATTENDANCE_RADIUS_METERS)
    throw new AppError(
      403,
      'We could not confirm you are within 0.5 mile of the event. Move closer or enable precise location and try again.',
    );
  // Recheck time, code, cancellation and membership in the same atomic statement as the insert.
  const now = new Date().toISOString();
  const result = await db.batch(
    [
      {
        sql: `INSERT OR IGNORE INTO attendance_records (event_id,student_id,checked_in_at,distance_meters,accuracy_meters)
      SELECT w.id,?,?,?,? FROM attendance_events w JOIN attendance_audience a ON a.event_id=w.id AND a.student_id=?
      WHERE w.id=? AND w.community_id=? AND w.code=? AND w.cancelled=0 AND w.opens_at<=? AND w.closes_at>?`,
        args: [
          profile.id,
          now,
          distance,
          body.accuracy,
          profile.id,
          id,
          profile.community_id,
          code,
          now,
          now,
        ],
      },
    ],
    'immediate',
  );
  const record = await db.get(
    'SELECT checked_in_at FROM attendance_records WHERE event_id=? AND student_id=?',
    id,
    profile.id,
  );
  if (!record)
    throw new AppError(
      409,
      'This event is unavailable or you are not on its roster. Ask your teacher.',
    );
  return { checkedInAt: String(record.checked_in_at), alreadyRecorded: !result[0]?.rowsAffected };
}
export async function attendanceFor(db, profile) {
  const instructor = profile.role === 'instructor';
  const rows = await db.all(
    `SELECT w.id,w.title,w.opens_at,w.closes_at,w.timezone,w.location_name,w.latitude,w.longitude,w.cancelled${instructor ? ',w.code' : ''},
    (SELECT COUNT(*) FROM attendance_audience a WHERE a.event_id=w.id) AS expected,
    (SELECT COUNT(*) FROM attendance_records r WHERE r.event_id=w.id) AS present,
    (SELECT checked_in_at FROM attendance_records r WHERE r.event_id=w.id AND r.student_id=?) AS checked_in_at
    FROM attendance_events w WHERE w.community_id=? ${instructor ? '' : 'AND EXISTS (SELECT 1 FROM attendance_audience a WHERE a.event_id=w.id AND a.student_id=?)'} ORDER BY w.opens_at DESC`,
    profile.id,
    profile.community_id,
    ...(instructor ? [] : [profile.id]),
  );
  const events = rows.map((w) => ({
    id: String(w.id),
    title: String(w.title),
    opensAt: String(w.opens_at),
    closesAt: String(w.closes_at),
    timezone: String(w.timezone),
    locationName: String(w.location_name),
    latitude: Number(w.latitude),
    longitude: Number(w.longitude),
    cancelled: !!w.cancelled,
    ...(instructor ? { code: String(w.code) } : {}),
    expected: Number(w.expected),
    present: instructor ? Number(w.present) : w.checked_in_at ? 1 : 0,
    checkedInAt: w.checked_in_at ? String(w.checked_in_at) : null,
  }));
  if (!instructor)
    return { events, members: [], records: [], serverTime: new Date().toISOString() };
  const audience = await db.all(
    'SELECT a.event_id,a.student_id FROM attendance_audience a JOIN attendance_events w ON w.id=a.event_id WHERE w.community_id=?',
    profile.community_id,
  );
  for (const w of events)
    w.audienceIds = audience.filter((a) => a.event_id === w.id).map((a) => String(a.student_id));
  const now = new Date().toISOString();
  const members = await db.all(
    `SELECT u.id,u.display_name,u.role,p.last_seen,
    (SELECT COUNT(*) FROM attendance_audience a JOIN attendance_events w ON w.id=a.event_id WHERE a.student_id=u.id AND w.community_id=u.community_id AND w.cancelled=0 AND w.closes_at<=?) AS expected,
    (SELECT COUNT(*) FROM attendance_records r JOIN attendance_events w ON w.id=r.event_id WHERE r.student_id=u.id AND w.community_id=u.community_id AND w.cancelled=0 AND w.closes_at<=?) AS attended
    FROM users u LEFT JOIN member_presence p ON p.user_id=u.id WHERE u.community_id=? ORDER BY u.display_name,u.id`,
    now,
    now,
    profile.community_id,
  );
  const records = await db.all(
    'SELECT r.event_id,r.student_id,r.checked_in_at FROM attendance_records r JOIN attendance_events w ON w.id=r.event_id WHERE w.community_id=?',
    profile.community_id,
  );
  return {
    events,
    members: members.map((m) => ({
      id: String(m.id),
      name: String(m.display_name || 'Community member'),
      role: String(m.role),
      online: Number(m.last_seen) > Date.now() - 90000,
      attended: Number(m.attended),
      expected: Number(m.expected),
      rate: Number(m.expected) ? Math.round((Number(m.attended) / Number(m.expected)) * 100) : null,
    })),
    records: records.map((r) => ({
      eventId: String(r.event_id),
      studentId: String(r.student_id),
      checkedInAt: String(r.checked_in_at),
    })),
    serverTime: now,
  };
}
