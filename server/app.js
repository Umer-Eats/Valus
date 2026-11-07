import { createHash, randomUUID } from 'node:crypto';
import { EVENTS, LESSONS, rankFor } from '../dist/model.js';
import {findCourseLesson, assessLesson, loadAllCourses} from '../dist/courses.js';
import {gradeCourseFRQ} from './course-grader.js';
import {loadAllTests, getPracticeTest, gradeAnswers, customTest, scaledMinutes, isRight} from '../dist/practice-tests.js';
import { COMMUNITIES, equalSecret, findCommunity, passwordFor, publicCommunities } from './communities.js';
import { ensureSchema, one, rows } from './db.js';
import { allowHalMessage, askHal } from './hal.js';
import { AppError, failure, readBody, send, text } from './http.js';
import { bowlRequest } from './bowl.js';
import { buildRankedTest, editRankedRefs, gradeRanked, hasRankedTest, publicQuestions, rankedTest, readAnswers, readRefs } from './ranked.js';
import { bucketName, firebaseStorage, uploadFolder, UPLOAD_MAX_BYTES, UPLOAD_MAX_FILES } from './storage.js';
import { GRADER_DAILY_LIMIT, GRADER_MAX_BYTES, GRADER_MAX_FILES, GRADER_MODES, GRADER_TEXT_MAX, GRADER_TYPES, VIDEO_MAX_BYTES, VIDEO_TYPES, geminiFileApi, gradeUpload as gradeUploadWithGemini, graderFolder, hasGrader, isVideoMode, youtubeLink } from './upload-grader.js';
import { LAB, grade as gradeCprLab } from '../dist/mock-lab-cpr.js';
import { DENTAL, grade as gradeDentalLab } from '../dist/mock-lab-dental-rubric.js';

// The server grades and assigns every course, so it loads the in-depth ones up front.
await loadAllCourses({view: false});
await loadAllTests();

const EVENT_NAMES = new Set(EVENTS.map((e) => e.name));
const LESSON_IDS = new Set(LESSONS.map((l) => l.id));
// 'Lesson checkpoint' is shown to people as "Lesson practice". Quiz and Skill checklist are kept for older assignments.
// Reflection is no longer offered for new work but is kept for older assignments.
const ASSIGNMENT_TYPES = ['Lesson', 'Lesson checkpoint', 'Practice test', 'Ranked test', 'Ranked mock procedure', 'Ranked skill', 'Ranked online submission',
  'Skill', 'Online submission', 'Reflection', 'Quiz', 'Skill checklist'];
// Ranked work and how it is taken: a question test, a mock procedure lab, or a file upload.
const RANKED_KIND = { 'Ranked test': 'test', 'Ranked mock procedure': 'mock', 'Ranked skill': 'upload', 'Ranked online submission': 'upload' };
// Mock procedure labs by event. Each grades its own action log; the session allows a few minutes past the lab's clock.
const MOCK_LABS = {
  [LAB.event]: { grade: gradeCprLab, minutes: Math.ceil(LAB.limitSec / 60) + 5 },
  [DENTAL.event]: { grade: gradeDentalLab, minutes: Math.ceil(DENTAL.limitSec / 60) + 5 },
};
// Work Valus grades itself. A reading lesson has no score; everything else is scored by the teacher.
const AUTO_SCORED = new Set(['Lesson checkpoint', 'Practice test', 'Ranked test', 'Ranked mock procedure']);
// A few seconds of slack for the network when a timed ranked test is submitted at the buzzer.
const RANKED_GRACE_MS = 15_000;
const ENROLL_LIMIT = 10;
const ENROLL_IP_LIMIT = 40;
const ENROLL_WINDOW_MS = 15 * 60_000;

// ---------- validation ----------

function eventName(value, { allowEmpty = false } = {}) {
  if (allowEmpty && (value === null || value === '' || value === undefined)) return null;
  if (!EVENT_NAMES.has(value)) throw new AppError(400, 'Choose an event from the secondary catalog.');
  return value;
}

function dueDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value + 'T00:00:00Z')))
    throw new AppError(400, 'Choose a due date.');
  return value;
}

function assignmentFields(body, partial) {
  const out = {};
  if (!partial || 'title' in body) out.title = text(body.title, 'an assignment title', { max: 140 });
  if (!partial || 'type' in body) {
    if (!ASSIGNMENT_TYPES.includes(body.type)) throw new AppError(400, 'Choose an assignment type.');
    out.type = body.type;
  }
  if (!partial || 'due' in body) out.due = dueDate(body.due);
  // A blank event sends the assignment to the whole community.
  if (!partial || 'event' in body) out.event = eventName(body.event, { allowEmpty: true });
  if (!partial || 'instructions' in body) out.instructions = text(body.instructions, 'instructions', { max: 4000, required: false });
  // A lesson or lesson practice belongs to one course lesson, so its audience is that lesson's event.
  if (out.type === 'Lesson checkpoint' || (out.type === 'Lesson' && body.lessonId)) {
    const found = typeof body.lessonId === 'string' && findCourseLesson(body.lessonId);
    if (!found) throw new AppError(400, out.type === 'Lesson' ? 'Choose the lesson to assign.' : 'Choose the lesson this practice covers.');
    out.lessonId = found.lesson.id;
    out.event = found.name;
  } else if (out.type) out.lessonId = null;
  if (out.type === 'Practice test') {
    const test = typeof body.testId === 'string' && getPracticeTest(body.testId);
    if (!test) throw new AppError(400, 'Choose the practice test to assign.');
    out.testId = test.id;
    out.event = test.event;
  } else if (out.type) out.testId = null;
  if (out.type === 'Ranked test' && !(out.event && hasRankedTest(out.event)))
    throw new AppError(400, 'Choose an event that has practice tests.');
  if (out.type === 'Ranked mock procedure' && !(out.event && MOCK_LABS[out.event]))
    throw new AppError(400, 'Choose an event that has a mock procedure lab.');
  if (RANKED_KIND[out.type] === 'upload') {
    if (!out.event) throw new AppError(400, 'Choose the event this ranked work is for.');
    const minutes = body.minutes === undefined || body.minutes === null || body.minutes === '' ? 30 : Number(body.minutes);
    if (!(Number.isInteger(minutes) && minutes >= 5 && minutes <= 180)) throw new AppError(400, 'Choose a time limit from 5 to 180 minutes.');
    out.minutes = minutes;
  }
  if (out.type || 'goal' in body || 'target' in body) {
    const goal = body.goal ?? 'completion';
    if (goal !== 'completion' && goal !== 'accuracy') throw new AppError(400, 'Choose completion or accuracy.');
    if (goal === 'accuracy' && body.type === 'Lesson') throw new AppError(400, 'A reading lesson has no score. Assign its lesson practice for accuracy.');
    const target = goal === 'accuracy' ? Number(body.target) : null;
    if (goal === 'accuracy' && !(Number.isInteger(target) && target >= 1 && target <= 100)) throw new AppError(400, 'Choose a target accuracy from 1 to 100%.');
    out.goal = goal;
    out.target = target;
  }
  return out;
}

// ---------- shapes ----------

const profile = (user, communities) => ({
  uid: user.id,
  email: user.email,
  displayName: user.display_name,
  role: user.role,
  community: publicCommunities(communities).find((c) => c.id === user.community_id) ?? null,
  event: user.event ?? null,
  eventSelectedAt: user.event_selected_at ?? null,
});

const assignment = (a) => ({
  id: a.id,
  title: a.title,
  type: a.type,
  event: a.event ?? null,
  due: a.due,
  instructions: a.instructions,
  lessonId: a.lesson_id ?? null,
  testId: a.test_id ?? null,
  goal: a.goal ?? 'completion',
  target: a.target === null || a.target === undefined ? null : Number(a.target),
  teacherScored: !AUTO_SCORED.has(a.type) && a.type !== 'Lesson',
  minutes: a.ranked_minutes === null || a.ranked_minutes === undefined ? null : Number(a.ranked_minutes),
  // A practice test the teacher edited is taken as its own test; practiceId is what students open.
  practiceId: a.type === 'Practice test' ? (a.question_version == null ? a.test_id ?? null : customId(a.id, a.question_version)) : null,
  questionsEdited: a.type === 'Practice test' && a.question_version != null,
  createdAt: a.created_at,
});

// question_version: the latest teacher edit of a practice test, if it was edited from the test assigned now.
const ASSIGNMENT_SQL = `SELECT a.*, al.lesson_id, g.goal, g.target, g.test_id, rt.minutes AS ranked_minutes,
  (SELECT MAX(qs.version) FROM assignment_question_sets qs WHERE qs.assignment_id = a.id AND qs.template = g.test_id) AS question_version FROM assignments a
  LEFT JOIN assignment_lessons al ON al.assignment_id = a.id LEFT JOIN assignment_goals g ON g.assignment_id = a.id
  LEFT JOIN ranked_tests rt ON rt.assignment_id = a.id`;

// Edited practice tests are named custom-<assignmentId>.<version>.
const CUSTOM = 'custom-';
const customId = (assignmentId, version) => CUSTOM + assignmentId + '.' + version;
const PRACTICE_KEY = `CASE WHEN pa.test_id LIKE '${CUSTOM}%' THEN substr(pa.test_id, 1, instr(pa.test_id, '.') - 1) ELSE pa.test_id END`;

// Everything needed to say where each student in a community stands on each assignment.
// Practice tests and lesson practice count every attempt, including ones made before the assignment.
async function communityProgress(ctx, communityId) {
  const [students, subs, practice, checks, done, scores, ranked, sent] = await ctx.db.batch([
    { sql: "SELECT id, display_name, email, event FROM users WHERE community_id = ? AND role = 'student' ORDER BY display_name COLLATE NOCASE", args: [communityId] },
    { sql: 'SELECT s.assignment_id, s.user_id, s.body, s.submitted_at FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE a.community_id = ?', args: [communityId] },
    // Every version of an assignment's edited test counts as that assignment's test.
    { sql: `SELECT pa.user_id, ${PRACTICE_KEY} AS k, MAX(pa.score) AS best, COUNT(*) AS n, MAX(pa.created_at) AS at FROM practice_attempts pa JOIN users u ON u.id = pa.user_id
        WHERE u.community_id = ? GROUP BY pa.user_id, k`, args: [communityId] },
    { sql: `SELECT ca.user_id, ca.lesson_id AS k, MAX(ca.accuracy) AS best, COUNT(*) AS n, MAX(ca.created_at) AS at FROM checkpoint_attempts ca JOIN users u ON u.id = ca.user_id
        WHERE u.community_id = ? GROUP BY ca.user_id, ca.lesson_id`, args: [communityId] },
    { sql: 'SELECT cc.user_id, cc.lesson_id AS k, cc.completed_at AS at FROM course_completions cc JOIN users u ON u.id = cc.user_id WHERE u.community_id = ?', args: [communityId] },
    { sql: 'SELECT ss.assignment_id, ss.user_id, ss.score FROM submission_scores ss JOIN assignments a ON a.id = ss.assignment_id WHERE a.community_id = ?', args: [communityId] },
    { sql: `SELECT ra.assignment_id, ra.user_id, ra.status, ra.answers, ra.score, ra.correct, ra.total, ra.reason, ra.exits, ra.seconds_used, ra.submitted_at
        FROM ranked_attempts ra JOIN assignments a ON a.id = ra.assignment_id WHERE a.community_id = ?`, args: [communityId] },
    { sql: 'SELECT r.assignment_id, r.user_id, r.sent_at FROM assignment_results r JOIN assignments a ON a.id = r.assignment_id WHERE a.community_id = ?', args: [communityId] },
  ], 'read');
  const keyed = (result, key) => new Map(rows(result).map((r) => [r.user_id + '|' + r[key], r]));
  const sub = keyed(subs, 'assignment_id'), test = keyed(practice, 'k'), check = keyed(checks, 'k'), lesson = keyed(done, 'k'), score = keyed(scores, 'assignment_id');
  const rank = keyed(ranked, 'assignment_id'), results = keyed(sent, 'assignment_id');
  // Places on each ranked test: highest score first, then the fastest time.
  const places = new Map();
  for (const r of rows(ranked).filter((r) => r.status === 'submitted' && r.score !== null)) {
    if (!places.has(r.assignment_id)) places.set(r.assignment_id, []);
    places.get(r.assignment_id).push(r);
  }
  for (const list of places.values()) list.sort((a, b) => Number(b.score) - Number(a.score) || Number(a.seconds_used) - Number(b.seconds_used));
  const status = (a, uid) => {
    const s = sub.get(uid + '|' + a.id);
    let completed = Boolean(s), completedAt = s?.submitted_at ?? null, best = null, attempts = null, ranked;
    if (a.type === 'Practice test') {
      const t = test.get(uid + '|' + (a.question_version == null ? a.test_id : CUSTOM + a.id));
      completed = Boolean(t); completedAt = t?.at ?? null; best = t ? Number(t.best) : null; attempts = t ? Number(t.n) : 0;
    } else if (a.type === 'Lesson checkpoint') {
      const c = check.get(uid + '|' + a.lesson_id);
      completed ||= Boolean(c); completedAt = c?.at ?? completedAt; best = c ? Number(c.best) : null; attempts = c ? Number(c.n) : 0;
    } else if (RANKED_KIND[a.type]) {
      const r = rank.get(uid + '|' + a.id), list = places.get(a.id) || [], kind = RANKED_KIND[a.type];
      if (r) {
        const done = r.status === 'submitted', score = r.score === null ? null : Number(r.score), place = list.findIndex((x) => x.user_id === uid) + 1;
        completed = done; completedAt = done ? r.submitted_at : null; best = done ? score : null;
        let answered = null, files = null;
        if (kind === 'test') answered = JSON.parse(r.answers).filter((x) => x !== null).length;
        if (kind === 'upload') files = uploadState(r).files.map(publicFile);
        ranked = {
          kind, status: r.status, reason: r.reason ?? null, exits: Number(r.exits), answered, files,
          total: r.total === null ? null : Number(r.total), earned: kind === 'mock' && r.correct !== null ? Number(r.correct) : null,
          score, place: place || null, of: list.length,
        };
      } else ranked = { kind, status: 'not_started', of: list.length };
    } else if (a.type === 'Lesson' && a.lesson_id) {
      const l = lesson.get(uid + '|' + a.lesson_id);
      completed ||= Boolean(l); completedAt = l?.at ?? completedAt;
    } else {
      const sc = score.get(uid + '|' + a.id);
      best = sc ? Number(sc.score) : null;
    }
    const met = a.goal === 'accuracy' ? best !== null && best >= Number(a.target) : completed;
    return { completed, completedAt, best, met, attempts, body: s?.body ?? null, resultsSentAt: results.get(uid + '|' + a.id)?.sent_at ?? null, ...(ranked && { ranked }) };
  };
  const audience = (a) => rows(students).filter((st) => !a.event || a.event === st.event);
  return { students: rows(students), status, audience };
}

// The teacher's view adds counts for the assignment's audience; a student's view adds their own status.
function teacherAssignment(a, progress) {
  const list = progress.audience(a).map((st) => progress.status(a, st.id));
  return { ...assignment(a), audienceCount: list.length, submissionCount: list.filter((s) => s.completed).length, metCount: list.filter((s) => s.met).length };
}
function studentAssignment(a, st) {
  return { ...assignment(a), resultsSentAt: st.resultsSentAt, submitted: st.completed, submittedAt: st.completedAt, submission: st.body, best: st.best, met: st.met, attempts: st.attempts, ...(st.ranked && { ranked: st.ranked }) };
}

const post = (p) => ({
  id: p.id,
  body: p.body,
  createdAt: p.created_at,
  author: { uid: p.author_id, displayName: p.display_name ?? 'Former member', role: p.role ?? null },
});

// ---------- request helpers ----------

async function identity(ctx) {
  const header = ctx.req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) throw new AppError(401, 'Please log in to continue.');
  return ctx.verifyToken(header.slice(7));
}

async function member(ctx, role) {
  const who = await identity(ctx);
  const user = one(await ctx.db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [who.uid] }));
  if (!user) throw new AppError(403, 'Finish joining your school community to continue.');
  if (!findCommunity(user.community_id, ctx.communities)) throw new AppError(403, 'Your school community is no longer active on Valus.');
  if (role && user.role !== role) throw new AppError(403, `This needs an ${role} account.`);
  return user;
}

const clientAddress = (req) =>
  String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || req.socket?.remoteAddress || 'local';

// Limits are per account and per address: making a fresh account for every guess still runs out.
async function limitEnrollment(db, id, limit = ENROLL_LIMIT) {
  const now = Date.now();
  const key = createHash('sha256').update('enroll:' + id).digest('hex');
  const result = await db.batch([
    { sql: 'DELETE FROM enrollment_limits WHERE expires_at < ?', args: [now] },
    {
      sql: 'INSERT INTO enrollment_limits (key, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1',
      args: [key, now + ENROLL_WINDOW_MS],
    },
    { sql: 'SELECT attempts FROM enrollment_limits WHERE key = ?', args: [key] },
  ], 'write');
  if (Number(result[2].rows[0].attempts) > limit)
    throw new AppError(429, 'Too many attempts. Try again in 15 minutes.');
}

async function assignmentInCommunity(ctx, user, id) {
  const a = one(await ctx.db.execute({ sql: ASSIGNMENT_SQL + ' WHERE a.id = ? AND a.community_id = ?', args: [id, user.community_id] }));
  if (!a) throw new AppError(404, 'That assignment was not found.');
  return a;
}

// ---------- routes ----------

const routes = [];
const route = (method, path, handler) => {
  const keys = [];
  const pattern = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '/?$');
  routes.push({ method, pattern, keys, handler });
};

route('GET', '/health', () => ({ ok: true }));
route('POST', '/bowl', async ctx => bowlRequest(ctx, await member(ctx), 'create'));
route('GET', '/bowl/:code', async ctx => bowlRequest(ctx, await member(ctx), 'state'));
route('POST', '/bowl/:code/:action', async ctx => bowlRequest(ctx, await member(ctx), ctx.params.action));

// Hal's study chat (Valus AI). Open to visitors too, so it is rate limited per address.
const halLog = new Map();
route('POST', '/hal', async (ctx) => {
  if (!allowHalMessage(halLog, clientAddress(ctx.req), Date.now())) throw new AppError(429, 'Hal needs a short break. Try again in a few minutes.');
  return askHal(ctx.body, { apiKey: ctx.env.GEMINI_API_KEY, model: ctx.env.GEMINI_MODEL });
});

// Public settings the static site needs before anyone signs in.
route('GET', '/config', (ctx) => ({
  firebase: {
    apiKey: ctx.env.FIREBASE_WEB_API_KEY ?? null,
    authDomain: ctx.env.FIREBASE_AUTH_DOMAIN ?? null,
    projectId: ctx.env.FIREBASE_PROJECT_ID ?? null,
    appId: ctx.env.FIREBASE_APP_ID ?? null,
    storageBucket: bucketName(ctx.env) || null,
  },
  communities: publicCommunities(ctx.communities),
}));

route('GET', '/communities', (ctx) => ({ communities: publicCommunities(ctx.communities) }));

route('POST', '/auth/register', async (ctx) => {
  const who = await identity(ctx);
  if (!who.email) throw new AppError(400, 'Use an account with an email address.');
  const body = ctx.body;
  if (body.role !== 'student' && body.role !== 'instructor') throw new AppError(400, 'Choose student or instructor.');
  // Instructors pick their school. Students may leave it out: their password names the school,
  // because no two communities share a student password (see checkPasswordSettings).
  let community = null;
  if (body.communityId || body.role === 'instructor') {
    community = findCommunity(body.communityId, ctx.communities);
    if (!community) throw new AppError(400, 'Choose your school community.');
  }

  const existing = one(await ctx.db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [who.uid] }));
  if (existing) {
    if (existing.role !== body.role)
      throw new AppError(409, `This account is already registered as an ${existing.role}. Use that login instead.`);
    if (community && existing.community_id !== community.id)
      throw new AppError(409, 'This account already belongs to another school community.');
    return { profile: profile(existing, ctx.communities) };
  }

  const fullName = [body.firstName, body.lastName].map((p) => (typeof p === 'string' ? p.trim() : '')).filter(Boolean).join(' ');
  const displayName = text(fullName || body.displayName || who.name, 'your name', { max: 80 });
  if (typeof body.password !== 'string' || !body.password || body.password.length > 256)
    throw new AppError(400, body.role === 'student' ? 'Enter your community student password.' : 'Enter your community teacher password.');
  // Count the attempt before checking it, so wrong guesses always use up the allowance.
  await limitEnrollment(ctx.db, 'uid:' + who.uid);
  await limitEnrollment(ctx.db, 'ip:' + clientAddress(ctx.req), ENROLL_IP_LIMIT);
  if (community) {
    if (!equalSecret(body.password, passwordFor(community, body.role, ctx.env)))
      throw new AppError(403, body.role === 'student' ? 'That student password is not right for this school.' : 'That teacher password is not right for this school.');
  } else {
    // Compare against every community so the time taken does not hint at which one matched.
    const matches = ctx.communities.filter((c) => ctx.env[c.studentEnv] && equalSecret(body.password, ctx.env[c.studentEnv]));
    if (matches.length !== 1) throw new AppError(403, 'That student password does not match a school community on Valus.');
    community = matches[0];
  }

  await ctx.db.execute({
    sql: 'INSERT INTO users (id, email, display_name, role, community_id) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING',
    args: [who.uid, who.email, displayName, body.role, community.id],
  });
  const user = one(await ctx.db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [who.uid] }));
  return { status: 201, data: { profile: profile(user, ctx.communities) } };
});

route('GET', '/me', async (ctx) => {
  const who = await identity(ctx);
  const user = one(await ctx.db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [who.uid] }));
  return { enrolled: Boolean(user), profile: user ? profile(user, ctx.communities) : null };
});

route('PATCH', '/me', async (ctx) => {
  const user = await member(ctx);
  const displayName = text(ctx.body.displayName, 'your name', { max: 80 });
  await ctx.db.execute({ sql: 'UPDATE users SET display_name = ? WHERE id = ?', args: [displayName, user.id] });
  return { profile: profile({ ...user, display_name: displayName }, ctx.communities) };
});

// One shared event selection drives the roster, rankings and assignment audience.
route('PUT', '/me/event', async (ctx) => {
  const user = await member(ctx, 'student');
  if (!('event' in ctx.body)) throw new AppError(400, 'Choose an event or explicitly clear your selection.');
  const event = eventName(ctx.body.event, { allowEmpty: true });
  await ctx.db.execute({
    sql: "UPDATE users SET event = ?, event_selected_at = CASE WHEN ? IS NULL THEN NULL ELSE strftime('%Y-%m-%dT%H:%M:%fZ','now') END WHERE id = ?",
    args: [event, event, user.id],
  });
  const fresh = one(await ctx.db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [user.id] }));
  return { profile: profile(fresh, ctx.communities) };
});

// A teacher's own community passwords, so they can share them with their chapter.
route('GET', '/community/passwords', async (ctx) => {
  const user = await member(ctx, 'instructor');
  const community = findCommunity(user.community_id, ctx.communities);
  return {
    student: ctx.env[community.studentEnv] || null,
    instructor: ctx.env[community.instructorEnv] || null,
  };
});

// A student's rating is their average score on submitted ranked tests for their current event.
// Students are placed against others in the same event.
route('GET', '/rankings', async (ctx) => {
  const user = await member(ctx);
  const result = await ctx.db.execute({
    sql: `SELECT u.id, u.display_name, u.event, ROUND(AVG(ra.score), 1) AS rating, COUNT(ra.score) AS tests
      FROM users u
      LEFT JOIN ranked_tests rt ON rt.event = u.event
      LEFT JOIN ranked_attempts ra ON ra.assignment_id = rt.assignment_id AND ra.user_id = u.id AND ra.status = 'submitted' AND ra.score IS NOT NULL
      WHERE u.role = 'student' AND u.community_id IS NOT NULL AND u.event IS NOT NULL
      GROUP BY u.id ORDER BY u.display_name COLLATE NOCASE, u.id`,
    args: [],
  });
  const list = rows(result).map((s) => {
    const rating = s.rating === null ? null : Number(s.rating);
    return { displayName: s.display_name, event: s.event, isYou: s.id === user.id, rating, tests: Number(s.tests), rank: rankFor(rating) };
  });
  const byEvent = new Map();
  for (const s of list.filter((x) => x.rating !== null)) {
    if (!byEvent.has(s.event)) byEvent.set(s.event, []);
    byEvent.get(s.event).push(s);
  }
  for (const group of byEvent.values()) {
    group.sort((a, b) => b.rating - a.rating || b.tests - a.tests);
    group.forEach((s, i) => { s.eventPlace = i + 1; s.eventCount = group.length; });
  }
  return { students: list };
});

route('GET', '/students', async (ctx) => {
  const user = await member(ctx, 'instructor');
  const result = await ctx.db.execute({
    sql: `SELECT u.id, u.display_name, u.email, u.event, u.created_at,
        (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.user_id = u.id) AS lessons_completed,
        (SELECT q.score FROM quiz_attempts q WHERE q.user_id = u.id ORDER BY q.created_at DESC LIMIT 1) AS last_quiz_score,
        (SELECT COUNT(*) FROM course_completions cc WHERE cc.user_id = u.id) AS course_lessons_completed,
        (SELECT ROUND(AVG(ca.accuracy)) FROM checkpoint_attempts ca WHERE ca.user_id = u.id) AS checkpoint_accuracy,
        (SELECT pa.score FROM practice_attempts pa WHERE pa.user_id = u.id ORDER BY pa.created_at DESC LIMIT 1) AS practice_latest,
        (SELECT MAX(pa.score) FROM practice_attempts pa WHERE pa.user_id = u.id) AS practice_best,
        (SELECT COUNT(*) FROM practice_attempts pa WHERE pa.user_id = u.id) AS practice_attempts
      FROM users u WHERE u.community_id = ? AND u.role = 'student' ORDER BY u.display_name COLLATE NOCASE`,
    args: [user.community_id],
  });
  return {
    students: rows(result).map((s) => ({
      uid: s.id,
      displayName: s.display_name,
      email: s.email,
      event: s.event ?? null,
      joinedAt: s.created_at,
      lessonsCompleted: Number(s.lessons_completed),
      progress: Math.round((Number(s.lessons_completed) / LESSONS.length) * 100),
      lastQuizScore: s.last_quiz_score === null ? null : Number(s.last_quiz_score),
      courseLessonsCompleted: Number(s.course_lessons_completed),
      checkpointAccuracy: s.checkpoint_accuracy === null ? null : Number(s.checkpoint_accuracy),
      practiceLatest: s.practice_latest === null ? null : Number(s.practice_latest),
      practiceBest: s.practice_best === null ? null : Number(s.practice_best),
      practiceAttempts: Number(s.practice_attempts),
    })),
  };
});

// One student's saved work: lesson practice accuracy by lesson, practice tests (with topic areas) and assignments.
route('GET', '/students/:uid/analytics', async (ctx) => {
  const user = await member(ctx, 'instructor');
  const student = one(await ctx.db.execute({
    sql: "SELECT id, display_name, email, event, created_at FROM users WHERE id = ? AND community_id = ? AND role = 'student'",
    args: [ctx.params.uid, user.community_id],
  }));
  if (!student) throw new AppError(404, 'That student is not in your community.');
  const [checks, done, practice, list] = await ctx.db.batch([
    { sql: 'SELECT lesson_id, accuracy, mcq_correct, mcq_total, frq_score, created_at FROM checkpoint_attempts WHERE user_id = ? ORDER BY created_at', args: [student.id] },
    { sql: 'SELECT lesson_id, completed_at FROM course_completions WHERE user_id = ? ORDER BY completed_at', args: [student.id] },
    { sql: 'SELECT * FROM (SELECT * FROM practice_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 200) ORDER BY created_at', args: [student.id] },
    { sql: ASSIGNMENT_SQL + ' WHERE a.community_id = ? AND (a.event IS NULL OR a.event = ?) ORDER BY a.due, a.created_at', args: [user.community_id, student.event] },
  ], 'read');
  const lessons = new Map();
  for (const c of rows(checks)) {
    const v = lessons.get(c.lesson_id) ?? { lessonId: c.lesson_id, attempts: 0, best: 0, mcqCorrect: 0, mcqTotal: 0 };
    v.attempts += 1; v.latest = Number(c.accuracy); v.best = Math.max(v.best, Number(c.accuracy)); v.date = c.created_at;
    v.mcqCorrect += Number(c.mcq_correct); v.mcqTotal += Number(c.mcq_total);
    v.frqScore = c.frq_score === null ? null : Number(c.frq_score);
    lessons.set(c.lesson_id, v);
  }
  const progress = await communityProgress(ctx, user.community_id);
  return {
    student: { uid: student.id, displayName: student.display_name, email: student.email, event: student.event ?? null, joinedAt: student.created_at },
    lessonPractice: [...lessons.values()],
    completedLessons: rows(done).map((d) => d.lesson_id),
    practice: await practiceAttempts(ctx, rows(practice)),
    assignments: rows(list).map((a) => studentAssignment(a, progress.status(a, student.id))),
  };
});

route('PATCH', '/students/:uid', async (ctx) => {
  const user = await member(ctx, 'instructor');
  const event = eventName(ctx.body.event, { allowEmpty: true });
  const result = await ctx.db.execute({
    sql: `UPDATE users SET event = ?, event_selected_at = CASE WHEN ? IS NULL THEN NULL ELSE strftime('%Y-%m-%dT%H:%M:%fZ','now') END
      WHERE id = ? AND community_id = ? AND role = 'student'`,
    args: [event, event, ctx.params.uid, user.community_id],
  });
  if (!result.rowsAffected) throw new AppError(404, 'That student is not in your community.');
  return { uid: ctx.params.uid, event };
});

// Removes the enrollment only. Progress stays keyed to the Firebase account, so a student
// who is re-admitted picks up where they left off. Change the student password to keep them out.
route('DELETE', '/students/:uid', async (ctx) => {
  const user = await member(ctx, 'instructor');
  const result = await ctx.db.execute({
    sql: "DELETE FROM users WHERE id = ? AND community_id = ? AND role = 'student'",
    args: [ctx.params.uid, user.community_id],
  });
  if (!result.rowsAffected) throw new AppError(404, 'That student is not in your community.');
  return { status: 204 };
});

route('GET', '/assignments', async (ctx) => {
  const user = await member(ctx);
  const [list, progress] = await Promise.all([
    ctx.db.execute({ sql: ASSIGNMENT_SQL + ' WHERE a.community_id = ? ORDER BY a.due, a.created_at', args: [user.community_id] }).then(rows),
    communityProgress(ctx, user.community_id),
  ]);
  if (user.role === 'instructor') return { assignments: list.map((a) => teacherAssignment(a, progress)) };
  return { assignments: list.filter((a) => !a.event || a.event === user.event).map((a) => studentAssignment(a, progress.status(a, user.id))) };
});

route('POST', '/assignments', async (ctx) => {
  const user = await member(ctx, 'instructor');
  const fields = assignmentFields(ctx.body, false);
  const id = randomUUID();
  const built = fields.type === 'Ranked test' ? buildRankedTest(fields.event, id)
    : fields.type === 'Ranked mock procedure' ? { event: fields.event, minutes: MOCK_LABS[fields.event].minutes, refs: [] }
    : RANKED_KIND[fields.type] === 'upload' ? { event: fields.event, minutes: fields.minutes, refs: [] } : null;
  await ctx.db.batch([
    {
      sql: 'INSERT INTO assignments (id, community_id, event, title, type, instructions, due, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, user.community_id, fields.event, fields.title, fields.type, fields.instructions, fields.due, user.id],
    },
    ...(fields.lessonId ? [{ sql: 'INSERT INTO assignment_lessons (assignment_id, lesson_id) VALUES (?, ?)', args: [id, fields.lessonId] }] : []),
    { sql: 'INSERT INTO assignment_goals (assignment_id, goal, target, test_id) VALUES (?, ?, ?, ?)', args: [id, fields.goal, fields.target, fields.testId] },
    ...(built ? [{ sql: 'INSERT INTO ranked_tests (assignment_id, event, minutes, questions) VALUES (?, ?, ?, ?)', args: [id, built.event, built.minutes, JSON.stringify(built.refs)] }] : []),
  ], 'write');
  return { status: 201, data: { assignment: teacherAssignment(await assignmentInCommunity(ctx, user, id), await communityProgress(ctx, user.community_id)) } };
});

route('PATCH', '/assignments/:id', async (ctx) => {
  const user = await member(ctx, 'instructor');
  const current = await assignmentInCommunity(ctx, user, ctx.params.id);
  const changes = (k) => k in ctx.body && (ctx.body[k] || null) !== (current[k] || null);
  if ((RANKED_KIND[current.type] || RANKED_KIND[ctx.body.type]) && (changes('type') || changes('event')))
    throw new AppError(400, 'Ranked work keeps its event. Create a new ranked assignment instead.');
  // Validate type and lesson together so a checkpoint can never lose its lesson.
  const typeBody = ['type', 'lessonId', 'event', 'testId', 'goal', 'target', 'minutes'].some((k) => k in ctx.body)
    ? { type: current.type, event: current.event, lessonId: current.lesson_id, testId: current.test_id, goal: current.goal ?? 'completion', target: current.target,
      minutes: current.ranked_minutes, ...ctx.body } : ctx.body;
  const { lessonId, testId, goal, target, minutes, ...fields } = assignmentFields(typeBody, true);
  // A ranked upload's new time limit applies to sessions started after the change.
  const timeLimit = RANKED_KIND[current.type] === 'upload' && 'minutes' in ctx.body && minutes !== undefined
    ? [{ sql: 'UPDATE ranked_tests SET minutes = ? WHERE assignment_id = ?', args: [minutes, ctx.params.id] }] : [];
  const keys = Object.keys(fields);
  const statements = [];
  if (keys.length) statements.push({
    sql: `UPDATE assignments SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ? AND community_id = ?`,
    args: [...keys.map((k) => fields[k]), ctx.params.id, user.community_id],
  });
  if (lessonId !== undefined) statements.push(lessonId
    ? { sql: 'INSERT INTO assignment_lessons (assignment_id, lesson_id) VALUES (?, ?) ON CONFLICT(assignment_id) DO UPDATE SET lesson_id = excluded.lesson_id', args: [ctx.params.id, lessonId] }
    : { sql: 'DELETE FROM assignment_lessons WHERE assignment_id = ?', args: [ctx.params.id] });
  if (goal !== undefined) statements.push({
    sql: `INSERT INTO assignment_goals (assignment_id, goal, target, test_id) VALUES (?, ?, ?, ?)
      ON CONFLICT(assignment_id) DO UPDATE SET goal = excluded.goal, target = excluded.target, test_id = excluded.test_id`,
    args: [ctx.params.id, goal, target, testId ?? null],
  });
  statements.push(...timeLimit);
  if (statements.length) await ctx.db.batch(statements, 'write');
  return { assignment: teacherAssignment(await assignmentInCommunity(ctx, user, ctx.params.id), await communityProgress(ctx, user.community_id)) };
});

route('DELETE', '/assignments/:id', async (ctx) => {
  const user = await member(ctx, 'instructor');
  await assignmentInCommunity(ctx, user, ctx.params.id);
  await ctx.db.batch([
    { sql: 'DELETE FROM submissions WHERE assignment_id = ?', args: [ctx.params.id] },
    { sql: 'DELETE FROM assignment_lessons WHERE assignment_id = ?', args: [ctx.params.id] },
    { sql: 'DELETE FROM assignment_goals WHERE assignment_id = ?', args: [ctx.params.id] },
    { sql: 'DELETE FROM submission_scores WHERE assignment_id = ?', args: [ctx.params.id] },
    { sql: 'DELETE FROM ranked_tests WHERE assignment_id = ?', args: [ctx.params.id] },
    { sql: 'DELETE FROM ranked_attempts WHERE assignment_id = ?', args: [ctx.params.id] },
    { sql: 'DELETE FROM assignment_question_sets WHERE assignment_id = ?', args: [ctx.params.id] },
    { sql: 'DELETE FROM assignment_results WHERE assignment_id = ?', args: [ctx.params.id] },
    { sql: 'DELETE FROM practice_attempts WHERE test_id LIKE ?', args: [CUSTOM + ctx.params.id + '.%'] },
    { sql: 'DELETE FROM assignments WHERE id = ? AND community_id = ?', args: [ctx.params.id, user.community_id] },
  ], 'write');
  return { status: 204 };
});

// ---------- student work and results ----------
// Everything a student turned in for an assignment, graded and with the answer key. Teachers
// always see it; a student sees it once their teacher sends the results.
const reviewQuestion = (q, given) => ({
  prompt: q.prompt, options: q.options ?? null, answer: q.answer, input: Boolean(q.input), unit: q.unit || '', prefix: q.prefix || '', accept: q.accept || [],
  explain: q.explain ?? q.explanation ?? '', topic: q.topic ?? '', ref: q.ref ?? '', given: given ?? null, right: given === undefined ? null : isRight(q, given),
});
const parse = (text, fallback) => { try { return JSON.parse(text); } catch { return fallback; } };

async function studentWork(ctx, a, student) {
  const progress = await communityProgress(ctx, student.community_id);
  const st = progress.status(a, student.id);
  const sentRow = one(await ctx.db.execute({ sql: 'SELECT note, sent_at FROM assignment_results WHERE assignment_id = ? AND user_id = ?', args: [a.id, student.id] }));
  const out = {
    assignment: { id: a.id, title: a.title, type: a.type, event: a.event ?? null, goal: a.goal ?? 'completion', target: a.target == null ? null : Number(a.target) },
    student: { uid: student.id, displayName: student.display_name },
    status: { completed: st.completed, completedAt: st.completedAt, best: st.best, met: st.met, attempts: st.attempts },
    sent: sentRow ? { note: sentRow.note, sentAt: sentRow.sent_at } : null,
    kind: 'text', work: null,
  };
  const kind = RANKED_KIND[a.type];
  if (kind) {
    out.kind = kind;
    const row = one(await ctx.db.execute({ sql: 'SELECT * FROM ranked_tests WHERE assignment_id = ?', args: [a.id] }));
    const r = row && await rankedAttemptRow(ctx, a.id, student.id);
    if (!r) return out;
    const base = { state: r.status, reason: r.reason ?? null, submittedAt: r.submitted_at ?? null, secondsUsed: Number(r.seconds_used) };
    if (kind === 'test') {
      const test = rankedTest(row), answers = parse(r.answers, []), graded = gradeRanked(test, answers);
      out.work = { ...base, score: graded.score, correct: graded.correct, total: graded.total,
        areas: graded.areas.map((x) => ({ area: x.area, correct: x.correct, total: x.total })), questions: test.questions.map((q, i) => reviewQuestion(q, answers[i])) };
    } else if (kind === 'mock') {
      const grade = MOCK_LABS[row.event]?.grade;
      let g = null;
      try { g = grade ? grade(parse(r.answers, {}).log || []) : null; } catch { g = null; }
      out.work = { ...base, score: g ? Math.round(100 * g.pct) : 0, earned: g?.earned ?? 0, possible: g?.possible ?? 0,
        sheets: (g?.sheets || []).map((sh) => ({ title: sh.title, who: sh.who ?? '', earned: sh.earned, possible: sh.possible,
          items: sh.items.map((i) => ({ n: i.n, text: i.text, pts: i.pts, earned: i.earned, note: i.note || '' })) })) };
    } else {
      const s = uploadState(r);
      out.work = { ...base, score: r.score == null ? null : Number(r.score), notes: s.notes, files: s.files.map(publicFile) };
    }
    return out;
  }
  if (a.type === 'Practice test') {
    out.kind = 'practice';
    const custom = a.question_version != null;
    const list = rows(await ctx.db.execute({
      sql: `SELECT * FROM practice_attempts WHERE user_id = ? AND ${custom ? 'test_id LIKE ?' : 'test_id = ?'} ORDER BY created_at`,
      args: [student.id, custom ? CUSTOM + a.id + '.%' : a.test_id],
    }));
    if (!list.length) return out;
    const attempts = await practiceAttempts(ctx, list);
    const best = attempts.reduce((x, y) => (y.score >= x.score ? y : x));
    const test = best.testId.startsWith(CUSTOM) ? (await loadCustomTest(ctx, best.testId))?.test : getPracticeTest(best.testId);
    out.work = {
      attempts: attempts.map((x) => ({ id: x.id, score: x.score, correct: x.correct, total: x.total, date: x.date, mode: x.mode })),
      best: { id: best.id, testId: best.testId, title: best.title, score: best.score, correct: best.correct, total: best.total, date: best.date, mode: best.mode, seconds: best.seconds,
        areas: best.areas.map((x) => ({ area: x.area, correct: x.correct, total: x.total })),
        questions: test ? test.questions.map((q, i) => reviewQuestion(q, best.answers[i])) : [] },
    };
    return out;
  }
  if (a.type === 'Lesson checkpoint') {
    out.kind = 'checkpoint';
    const lesson = findCourseLesson(a.lesson_id)?.lesson;
    const c = one(await ctx.db.execute({
      sql: `SELECT c.*, ca.answers FROM checkpoint_attempts c LEFT JOIN checkpoint_answers ca ON ca.attempt_id = c.id
        WHERE c.user_id = ? AND c.lesson_id = ? ORDER BY c.created_at DESC LIMIT 1`, args: [student.id, a.lesson_id],
    }));
    if (!c || !lesson) return out;
    const answers = c.answers ? parse(c.answers, null) : null;
    out.work = {
      lessonTitle: lesson.title, submittedAt: c.created_at, accuracy: Number(c.accuracy), mcqCorrect: Number(c.mcq_correct), mcqTotal: Number(c.mcq_total),
      frqScore: c.frq_score == null ? null : Number(c.frq_score), answersSaved: Boolean(answers),
      questions: (lesson.mcqs || []).map((q, i) => reviewQuestion(q, answers ? answers[i] : undefined)),
      frq: { prompt: lesson.frq?.prompt ?? '', response: c.response, grade: c.grade ? parse(c.grade, null) : null },
    };
    return out;
  }
  if (a.type === 'Lesson') {
    out.kind = 'lesson';
    out.work = st.completed ? { completedAt: st.completedAt } : null;
    return out;
  }
  const sub = one(await ctx.db.execute({ sql: 'SELECT body, submitted_at FROM submissions WHERE assignment_id = ? AND user_id = ?', args: [a.id, student.id] }));
  out.work = sub ? { body: sub.body, submittedAt: sub.submitted_at, score: st.best } : null;
  return out;
}
async function studentIn(ctx, user, uid) {
  const s = one(await ctx.db.execute({ sql: "SELECT * FROM users WHERE id = ? AND community_id = ? AND role = 'student'", args: [uid, user.community_id] }));
  if (!s) throw new AppError(404, 'That student is not in your community.');
  return s;
}

route('GET', '/assignments/:id/work/:uid', async (ctx) => {
  const user = await member(ctx, 'instructor');
  const a = await assignmentInCommunity(ctx, user, ctx.params.id);
  return studentWork(ctx, a, await studentIn(ctx, user, ctx.params.uid));
});

route('GET', '/assignments/:id/results', async (ctx) => {
  const user = await member(ctx, 'student');
  const a = await assignmentInCommunity(ctx, user, ctx.params.id);
  if (a.event && a.event !== user.event) throw new AppError(404, 'That assignment was not found.');
  const work = await studentWork(ctx, a, user);
  if (!work.sent) throw new AppError(404, 'Your teacher has not sent results for this assignment yet.');
  return work;
});

// Sends one student's results, with an optional note. Sending again updates the note.
route('PUT', '/assignments/:id/results/:uid', async (ctx) => {
  const user = await member(ctx, 'instructor');
  const a = await assignmentInCommunity(ctx, user, ctx.params.id);
  const student = await studentIn(ctx, user, ctx.params.uid);
  const st = (await communityProgress(ctx, user.community_id)).status(a, student.id);
  if (!st.completed) throw new AppError(409, 'Results can be sent once the student has finished this assignment.');
  const note = text(ctx.body.note ?? '', 'a note', { max: 4000, required: false });
  await ctx.db.execute({
    sql: `INSERT INTO assignment_results (assignment_id, user_id, note) VALUES (?, ?, ?)
      ON CONFLICT(assignment_id, user_id) DO UPDATE SET note = excluded.note, sent_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
    args: [a.id, student.id, note],
  });
  return { sent: true };
});

route('DELETE', '/assignments/:id/results/:uid', async (ctx) => {
  const user = await member(ctx, 'instructor');
  const a = await assignmentInCommunity(ctx, user, ctx.params.id);
  await ctx.db.execute({ sql: 'DELETE FROM assignment_results WHERE assignment_id = ? AND user_id = ?', args: [a.id, ctx.params.uid] });
  return { status: 204 };
});

// Sends results to everyone who has finished and has not been sent theirs yet.
route('POST', '/assignments/:id/results', async (ctx) => {
  const user = await member(ctx, 'instructor');
  const a = await assignmentInCommunity(ctx, user, ctx.params.id);
  const progress = await communityProgress(ctx, user.community_id);
  const ready = progress.audience(a).filter((st) => { const x = progress.status(a, st.id); return x.completed && !x.resultsSentAt; });
  if (ready.length) await ctx.db.batch(ready.map((st) => ({
    sql: 'INSERT INTO assignment_results (assignment_id, user_id, note) VALUES (?, ?, \'\') ON CONFLICT(assignment_id, user_id) DO NOTHING', args: [a.id, st.id],
  })), 'write');
  return { sent: ready.length };
});

// ---------- assignment questions ----------
// Teachers see and edit the questions in a practice test or ranked test assignment.
// A ranked test can change only until a student starts it, so everyone is ranked on the same test.
const QUESTION_TYPES = new Set(['Practice test', 'Ranked test']);
async function questionsFor(ctx, user) {
  const a = await assignmentInCommunity(ctx, user, ctx.params.id);
  if (!QUESTION_TYPES.has(a.type)) throw new AppError(400, 'Only practice tests and ranked tests have questions to edit.');
  if (a.type === 'Practice test') {
    const template = getPracticeTest(a.test_id);
    if (!template) throw new AppError(404, 'This practice test could not be found.');
    const set = a.question_version == null ? null : one(await ctx.db.execute({
      sql: 'SELECT questions FROM assignment_question_sets WHERE assignment_id = ? AND version = ?', args: [a.id, a.question_version],
    }));
    const refs = set ? JSON.parse(set.questions) : template.questions.map((_, i) => [template.id, i]);
    return { a, template, refs, edited: Boolean(set), editable: true, started: 0, minutes: scaledMinutes(template, refs.length) };
  }
  const row = one(await ctx.db.execute({ sql: 'SELECT * FROM ranked_tests WHERE assignment_id = ?', args: [a.id] }));
  if (!row) throw new AppError(404, 'This ranked test could not be found.');
  const refs = JSON.parse(row.questions), template = getPracticeTest(refs[0]?.[0]);
  const started = Number(one(await ctx.db.execute({ sql: 'SELECT COUNT(*) AS n FROM ranked_attempts WHERE assignment_id = ?', args: [a.id] })).n);
  return { a, template, refs, edited: false, editable: started === 0, started, minutes: Number(row.minutes), row };
}
const questionsOut = (q) => ({
  type: q.a.type, event: q.a.event, template: q.template?.id ?? null, refs: q.refs, minutes: q.minutes,
  edited: q.edited, editable: q.editable, started: q.started,
});

route('GET', '/assignments/:id/questions', async (ctx) => {
  const user = await member(ctx, 'instructor');
  return questionsOut(await questionsFor(ctx, user));
});

route('PUT', '/assignments/:id/questions', async (ctx) => {
  const user = await member(ctx, 'instructor');
  const q = await questionsFor(ctx, user);
  if (!q.editable) throw new AppError(409, 'A student has already started this ranked test, so its questions are locked.');
  const pairs = readRefs(q.a.event, ctx.body.refs);
  if (!pairs) throw new AppError(400, 'Choose 1 to 200 questions from this event’s practice tests, with no repeats.');
  if (q.a.type === 'Practice test') {
    // Each save is a new version, so earlier attempts keep the questions they answered.
    const last = one(await ctx.db.execute({ sql: 'SELECT MAX(version) AS v FROM assignment_question_sets WHERE assignment_id = ?', args: [q.a.id] }));
    await ctx.db.execute({
      sql: 'INSERT INTO assignment_question_sets (assignment_id, version, template, questions) VALUES (?, ?, ?, ?)',
      args: [q.a.id, Number(last?.v ?? 0) + 1, q.template.id, JSON.stringify(pairs)],
    });
  } else {
    const refs = editRankedRefs(q.refs, pairs, q.a.id + ':' + Date.now());
    const result = await ctx.db.batch([
      { sql: 'SELECT COUNT(*) AS n FROM ranked_attempts WHERE assignment_id = ?', args: [q.a.id] },
      { sql: 'UPDATE ranked_tests SET questions = ?, minutes = ? WHERE assignment_id = ? AND NOT EXISTS (SELECT 1 FROM ranked_attempts WHERE assignment_id = ?)',
        args: [JSON.stringify(refs), scaledMinutes(q.template, refs.length), q.a.id, q.a.id] },
    ], 'write');
    if (Number(result[0].rows[0].n) > 0) throw new AppError(409, 'A student has already started this ranked test, so its questions are locked.');
  }
  return questionsOut(await questionsFor(ctx, user));
});

route('GET', '/assignments/:id/submissions', async (ctx) => {
  const user = await member(ctx, 'instructor');
  const a = await assignmentInCommunity(ctx, user, ctx.params.id);
  const progress = await communityProgress(ctx, user.community_id);
  const students = progress.audience(a).map((st) => ({ uid: st.id, displayName: st.display_name, ...progress.status(a, st.id) }));
  const result = await ctx.db.execute({
    sql: `SELECT s.user_id, s.body, s.submitted_at, u.display_name,
        c.accuracy, c.mcq_correct, c.mcq_total, c.frq_score,
        (SELECT COUNT(*) FROM checkpoint_attempts x WHERE x.assignment_id = s.assignment_id AND x.user_id = s.user_id) AS attempts
      FROM submissions s LEFT JOIN users u ON u.id = s.user_id
      LEFT JOIN checkpoint_attempts c ON c.id = (SELECT y.id FROM checkpoint_attempts y WHERE y.assignment_id = s.assignment_id AND y.user_id = s.user_id ORDER BY y.created_at DESC LIMIT 1)
      WHERE s.assignment_id = ? ORDER BY s.submitted_at`,
    args: [ctx.params.id],
  });
  return {
    submissions: rows(result).map((s) => ({
      uid: s.user_id,
      displayName: s.display_name ?? 'Former member',
      body: s.body,
      submittedAt: s.submitted_at,
      ...(s.accuracy !== null && {
        checkpoint: { accuracy: Number(s.accuracy), mcqCorrect: Number(s.mcq_correct), mcqTotal: Number(s.mcq_total), frqScore: s.frq_score === null ? null : Number(s.frq_score), attempts: Number(s.attempts) },
      }),
    })),
    students,
  };
});

// Teachers score skills, online submissions and reflections; a cleared score is sent as null.
route('PUT', '/assignments/:id/scores/:uid', async (ctx) => {
  const user = await member(ctx, 'instructor');
  const a = await assignmentInCommunity(ctx, user, ctx.params.id);
  if (!assignment(a).teacherScored) throw new AppError(400, 'Valus scores this assignment automatically.');
  const student = one(await ctx.db.execute({ sql: "SELECT id, event FROM users WHERE id = ? AND community_id = ? AND role = 'student'", args: [ctx.params.uid, user.community_id] }));
  if (!student || (a.event && a.event !== student.event)) throw new AppError(404, 'That student is not assigned this work.');
  const score = ctx.body.score;
  // A ranked upload's score also counts toward rankings.
  const rankedScore = RANKED_KIND[a.type] === 'upload'
    ? [{ sql: 'UPDATE ranked_attempts SET score = ? WHERE assignment_id = ? AND user_id = ?', args: [score, a.id, student.id] }] : [];
  if (score === null) {
    await ctx.db.batch([{ sql: 'DELETE FROM submission_scores WHERE assignment_id = ? AND user_id = ?', args: [a.id, student.id] }, ...rankedScore], 'write');
    return { score: null };
  }
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new AppError(400, 'Scores are whole numbers from 0 to 100.');
  await ctx.db.batch([{
    sql: `INSERT INTO submission_scores (assignment_id, user_id, score) VALUES (?, ?, ?)
      ON CONFLICT(assignment_id, user_id) DO UPDATE SET score = excluded.score, scored_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
    args: [a.id, student.id, score],
  }, ...rankedScore], 'write');
  return { score };
});

route('PUT', '/assignments/:id/submission', async (ctx) => {
  const user = await member(ctx, 'student');
  const a = await assignmentInCommunity(ctx, user, ctx.params.id);
  if (a.event && a.event !== user.event) throw new AppError(404, 'That assignment was not found.');
  if (a.type === 'Lesson checkpoint') throw new AppError(400, 'Submit this assignment from its lesson practice.');
  if (a.type === 'Practice test') throw new AppError(400, 'Take the practice test to complete this assignment.');
  if (RANKED_KIND[a.type]) throw new AppError(400, 'Complete this ranked work from its assignment.');
  const body = text(ctx.body.body, 'your response', { max: 10000, required: false });
  await ctx.db.execute({
    sql: `INSERT INTO submissions (assignment_id, user_id, body) VALUES (?, ?, ?)
      ON CONFLICT(assignment_id, user_id) DO UPDATE SET body = excluded.body, submitted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
    args: [a.id, user.id, body],
  });
  return { assignmentId: a.id, submitted: true };
});

// ---------- ranked work ----------
// Ranked tests, mock procedures, skill uploads and online submissions are taken once, full
// screen, under the clock. Leaving (closing the tab, switching away or exiting full screen)
// submits straight away. Unfinished work is locked until the teacher reopens it.
//   test:   locked if questions were blank; reopening resumes with the time left.
//   mock:   always locked when left mid-run; reopening gives a fresh run.
//   upload: locked if no file was uploaded; reopening resumes with the time left.
const RANKED_REASONS = new Set(['finished', 'timeout', 'exited_fullscreen', 'switched_away', 'closed']);
const MOCK_LOG_MAX = 1500;

async function rankedFor(ctx, user, id) {
  const a = await assignmentInCommunity(ctx, user, id);
  const kind = RANKED_KIND[a.type];
  if (!kind) throw new AppError(400, 'This assignment is not ranked work.');
  if (user.role === 'student' && a.event && a.event !== user.event) throw new AppError(404, 'That assignment was not found.');
  const row = one(await ctx.db.execute({ sql: 'SELECT * FROM ranked_tests WHERE assignment_id = ?', args: [a.id] }));
  if (!row) throw new AppError(404, 'This ranked assignment could not be found.');
  return { a, kind, row, test: kind === 'test' ? rankedTest(row) : null, minutes: Number(row.minutes) };
}
const rankedAttemptRow = async (ctx, assignmentId, uid) =>
  one(await ctx.db.execute({ sql: 'SELECT * FROM ranked_attempts WHERE assignment_id = ? AND user_id = ?', args: [assignmentId, uid] }));
const uploadState = (r) => { try { const s = JSON.parse(r.answers); return { notes: String(s.notes ?? ''), files: Array.isArray(s.files) ? s.files : [] }; } catch { return { notes: '', files: [] }; } };
const publicFile = (f) => ({ id: f.id, name: f.name, size: f.size, contentType: f.contentType, created: f.created });

// The mock lab's own rubric grades the action log here, so a score cannot be typed in by the browser.
function gradeMock(event, log) {
  const grade = MOCK_LABS[event]?.grade;
  if (!grade || !Array.isArray(log)) return { earned: 0, possible: 0, score: 0, sheets: [] };
  try {
    const g = grade(log);
    return { earned: g.earned, possible: g.possible, score: Math.round(100 * g.pct), sheets: g.sheets.map((s) => ({ title: s.title, earned: s.earned, possible: s.possible })) };
  } catch {
    return { earned: 0, possible: 0, score: 0, sheets: [] };
  }
}
function readMockLog(log) {
  if (!Array.isArray(log) || log.length > MOCK_LOG_MAX) return null;
  const ok = log.every((e) => e && typeof e === 'object' && !Array.isArray(e) && typeof e.type === 'string' && e.type.length <= 40
    && (e.say === undefined || (typeof e.say === 'string' && e.say.length <= 500)));
  return ok ? log : null;
}

// What the student may see once the work is over. Tests never include the answer key.
function rankedResult(k, r) {
  const base = { kind: k.kind, state: r.status, reason: r.reason, secondsUsed: Number(r.seconds_used), submittedAt: r.submitted_at };
  if (k.kind === 'test') {
    const answers = JSON.parse(r.answers), graded = gradeRanked(k.test, answers);
    return {
      ...base, score: graded.score, correct: graded.correct, total: graded.total, answered: answers.filter((x) => x !== null).length,
      areas: graded.areas.map((ar) => ({ area: ar.area, weight: ar.weight, correct: ar.correct, total: ar.total })),
    };
  }
  if (k.kind === 'mock') {
    const g = gradeMock(k.row.event, JSON.parse(r.answers).log);
    return { ...base, score: g.score, earned: g.earned, possible: g.possible, sheets: g.sheets };
  }
  const s = uploadState(r);
  return { ...base, score: r.score === null || r.score === undefined ? null : Number(r.score), files: s.files.map(publicFile), notes: s.notes };
}

async function closeRanked(ctx, k, r, body, reason, now) {
  const late = now > Number(r.ends_at) + RANKED_GRACE_MS;
  const why = late ? 'timeout' : reason;
  const ended = why === 'finished' || why === 'timeout';
  let answers = r.answers, score = null, correct = null, total = null, status;
  if (k.kind === 'test') {
    const use = late || !body.answers ? JSON.parse(r.answers) : body.answers;
    const graded = gradeRanked(k.test, use);
    answers = JSON.stringify(use); score = graded.score; correct = graded.correct; total = graded.total;
    status = ended || !use.some((x) => x === null) ? 'submitted' : 'locked';
  } else if (k.kind === 'mock') {
    const log = body.log ?? JSON.parse(r.answers).log ?? [];
    const g = gradeMock(k.row.event, log);
    answers = JSON.stringify({ log }); score = g.score; correct = g.earned; total = g.possible;
    status = ended ? 'submitted' : 'locked';
  } else {
    const s = uploadState(r);
    if (typeof body.notes === 'string' && !late) s.notes = body.notes.slice(0, 4000);
    answers = JSON.stringify(s); total = s.files.length;
    status = ended || s.files.length ? 'submitted' : 'locked';
  }
  const left = Math.max(0, Math.round((Number(r.ends_at) - now) / 1000));
  const used = k.minutes * 60 - Math.min(left, k.minutes * 60);
  await ctx.db.execute({
    sql: `UPDATE ranked_attempts SET status = ?, reason = ?, answers = ?, seconds_left = ?, seconds_used = ?, correct = ?, total = ?, score = ?, exits = exits + ?, submitted_at = ?
      WHERE assignment_id = ? AND user_id = ? AND status = 'in_progress'`,
    args: [status, why, answers, left, used, correct, total, score, status === 'locked' ? 1 : 0, new Date(now).toISOString(), r.assignment_id, r.user_id],
  });
}

const emptyAnswers = (k) => k.kind === 'test' ? JSON.stringify(Array(k.test.questions.length).fill(null))
  : k.kind === 'mock' ? JSON.stringify({ log: [] }) : JSON.stringify({ notes: '', files: [] });

route('POST', '/assignments/:id/ranked/start', async (ctx) => {
  const user = await member(ctx, 'student');
  const k = await rankedFor(ctx, user, ctx.params.id), { a } = k;
  if (k.kind === 'upload' && !ctx.storage.configured()) throw new AppError(503, 'File uploads are not configured yet. Let your teacher know.');
  const now = Date.now();
  let r = await rankedAttemptRow(ctx, a.id, user.id);
  // Still marked in progress means the page was closed or reloaded without a submit reaching us.
  if (r?.status === 'in_progress') {
    await closeRanked(ctx, k, r, {}, now > Number(r.ends_at) ? 'timeout' : 'closed', now);
    r = await rankedAttemptRow(ctx, a.id, user.id);
  }
  if (r && (r.status === 'submitted' || r.status === 'locked')) return rankedResult(k, r);
  // A reopened mock procedure starts a fresh run; tests and uploads pick up where they left off.
  const fresh = !r || k.kind === 'mock';
  const endsAt = now + (fresh ? k.minutes * 60 : Number(r.seconds_left)) * 1000;
  const answers = fresh ? emptyAnswers(k) : r.answers;
  if (r) await ctx.db.execute({
    sql: "UPDATE ranked_attempts SET status = 'in_progress', ends_at = ?, answers = ?, seconds_left = ? WHERE assignment_id = ? AND user_id = ? AND status = 'reopened'",
    args: [endsAt, answers, fresh ? k.minutes * 60 : Number(r.seconds_left), a.id, user.id],
  });
  else await ctx.db.execute({
    sql: "INSERT INTO ranked_attempts (assignment_id, user_id, status, answers, ends_at, seconds_left, started_at) VALUES (?, ?, 'in_progress', ?, ?, ?, ?)",
    args: [a.id, user.id, answers, endsAt, k.minutes * 60, new Date(now).toISOString()],
  });
  const out = { state: 'in_progress', kind: k.kind, type: a.type, title: a.title, event: k.row.event, minutes: k.minutes, endsAt, serverNow: now, resumed: Boolean(r) };
  if (k.kind === 'test') return { ...out, answers: JSON.parse(answers), questions: publicQuestions(k.test) };
  if (k.kind === 'mock') return out;
  const s = JSON.parse(answers);
  return { ...out, notes: s.notes, files: s.files.map(publicFile), folder: uploadFolder(user.id, a.id), maxFiles: UPLOAD_MAX_FILES, maxBytes: UPLOAD_MAX_BYTES };
});

async function openAttempt(ctx, user, kind) {
  const k = await rankedFor(ctx, user, ctx.params.id);
  if (k.kind !== kind) throw new AppError(400, 'That does not apply to this assignment.');
  const r = await rankedAttemptRow(ctx, k.a.id, user.id);
  if (r?.status !== 'in_progress') throw new AppError(409, 'This ranked work has already been submitted.');
  if (Date.now() > Number(r.ends_at) + RANKED_GRACE_MS) throw new AppError(409, 'Time is up.');
  return { k, r };
}
const saveAnswers = (ctx, r, answers) => ctx.db.execute({
  sql: "UPDATE ranked_attempts SET answers = ? WHERE assignment_id = ? AND user_id = ? AND status = 'in_progress'",
  args: [answers, r.assignment_id, r.user_id],
});

route('PUT', '/assignments/:id/ranked/answers', async (ctx) => {
  const user = await member(ctx, 'student');
  const { k, r } = await openAttempt(ctx, user, 'test');
  const answers = readAnswers(k.test, ctx.body.answers);
  if (!answers) throw new AppError(400, 'The answers could not be read.');
  await saveAnswers(ctx, r, JSON.stringify(answers));
  return { saved: true };
});

route('PUT', '/assignments/:id/ranked/notes', async (ctx) => {
  const user = await member(ctx, 'student');
  const { r } = await openAttempt(ctx, user, 'upload');
  const s = uploadState(r);
  s.notes = text(ctx.body.notes, 'notes', { max: 4000, required: false });
  await saveAnswers(ctx, r, JSON.stringify(s));
  return { saved: true };
});

// Called after the browser finishes uploading to Firebase. Files made before the session
// started are refused, so work has to be uploaded during the locked session.
route('POST', '/assignments/:id/ranked/files', async (ctx) => {
  const user = await member(ctx, 'student');
  const { k, r } = await openAttempt(ctx, user, 'upload');
  const s = uploadState(r), folder = uploadFolder(user.id, k.a.id), path = ctx.body.path;
  if (typeof path !== 'string' || !path.startsWith(folder) || !/^[\w-]{8,64}$/.test(path.slice(folder.length)))
    throw new AppError(400, 'That upload could not be read.');
  if (s.files.some((f) => f.path === path)) return { files: s.files.map(publicFile) };
  if (s.files.length >= UPLOAD_MAX_FILES) throw new AppError(400, `You can upload up to ${UPLOAD_MAX_FILES} files.`);
  const info = await ctx.storage.info(path);
  if (!info) throw new AppError(400, 'That upload did not finish. Try it again.');
  if (Date.parse(info.created) < Date.parse(r.started_at) - 60_000) throw new AppError(400, 'Only files uploaded during this session count.');
  if (info.size > UPLOAD_MAX_BYTES) throw new AppError(400, 'That file is too large.');
  const name = text(ctx.body.name, 'a file name', { max: 200 });
  s.files.push({ id: path.slice(folder.length), path, name, size: info.size, contentType: info.contentType, created: info.created });
  await saveAnswers(ctx, r, JSON.stringify(s));
  return { files: s.files.map(publicFile) };
});

// Removing a file only takes it off the submission; storage.rules never let students change uploads.
route('DELETE', '/assignments/:id/ranked/files/:fileId', async (ctx) => {
  const user = await member(ctx, 'student');
  const { r } = await openAttempt(ctx, user, 'upload');
  const s = uploadState(r);
  s.files = s.files.filter((f) => f.id !== ctx.params.fileId);
  await saveAnswers(ctx, r, JSON.stringify(s));
  return { files: s.files.map(publicFile) };
});

route('POST', '/assignments/:id/ranked/submit', async (ctx) => {
  const user = await member(ctx, 'student');
  const k = await rankedFor(ctx, user, ctx.params.id), { a } = k;
  const reason = RANKED_REASONS.has(ctx.body.reason) ? ctx.body.reason : 'closed';
  const body = {};
  if (k.kind === 'test' && ctx.body.answers !== undefined) {
    body.answers = readAnswers(k.test, ctx.body.answers);
    if (!body.answers) throw new AppError(400, 'The answers could not be read.');
  }
  if (k.kind === 'mock' && ctx.body.log !== undefined) {
    body.log = readMockLog(ctx.body.log);
    if (!body.log) throw new AppError(400, 'The procedure could not be read.');
  }
  if (k.kind === 'upload' && typeof ctx.body.notes === 'string') body.notes = ctx.body.notes;
  const r = await rankedAttemptRow(ctx, a.id, user.id);
  if (!r) throw new AppError(409, 'Start the ranked work first.');
  if (r.status === 'reopened') throw new AppError(409, 'Your teacher reopened this. Start it again to continue.');
  // Several exit signals can fire at once; only the first one closes the session.
  if (r.status === 'in_progress') await closeRanked(ctx, k, r, body, reason, Date.now());
  return rankedResult(k, await rankedAttemptRow(ctx, a.id, user.id));
});

// Only the teacher can let a student back into work they left unfinished.
route('POST', '/assignments/:id/ranked/:uid/reopen', async (ctx) => {
  const user = await member(ctx, 'instructor');
  const k = await rankedFor(ctx, user, ctx.params.id);
  const r = await rankedAttemptRow(ctx, k.a.id, ctx.params.uid);
  if (!r || r.status !== 'locked') throw new AppError(409, 'Only locked work can be reopened.');
  if (k.kind !== 'mock' && Number(r.seconds_left) < 1) throw new AppError(409, 'This student has no time left.');
  await ctx.db.execute({ sql: "UPDATE ranked_attempts SET status = 'reopened' WHERE assignment_id = ? AND user_id = ? AND status = 'locked'", args: [k.a.id, ctx.params.uid] });
  return { reopened: true, secondsLeft: k.kind === 'mock' ? k.minutes * 60 : Number(r.seconds_left) };
});

// Teachers see each uploaded file through a link that works for 15 minutes.
route('GET', '/assignments/:id/ranked/:uid/files/:fileId', async (ctx) => {
  const user = await member(ctx);
  // A student may open only their own files, once their teacher has sent the results.
  if (user.role !== 'instructor' && (user.id !== ctx.params.uid || !one(await ctx.db.execute({
    sql: 'SELECT 1 FROM assignment_results WHERE assignment_id = ? AND user_id = ?', args: [ctx.params.id, user.id],
  })))) throw new AppError(403, 'This needs an instructor account.');
  const k = await rankedFor(ctx, user, ctx.params.id);
  const r = await rankedAttemptRow(ctx, k.a.id, ctx.params.uid);
  const f = r && k.kind === 'upload' ? uploadState(r).files.find((x) => x.id === ctx.params.fileId) : null;
  if (!f) throw new AppError(404, 'That file was not found.');
  return { url: await ctx.storage.viewUrl(f.path, f.name), name: f.name };
});

route('GET', '/posts', async (ctx) => {
  const user = await member(ctx);
  const before = typeof ctx.query.get('before') === 'string' && ctx.query.get('before') ? ctx.query.get('before') : '9999';
  const result = await ctx.db.execute({
    sql: `SELECT p.*, u.display_name, u.role FROM posts p LEFT JOIN users u ON u.id = p.author_id
      WHERE p.community_id = ? AND p.created_at < ? ORDER BY p.created_at DESC LIMIT 30`,
    args: [user.community_id, before],
  });
  const posts = rows(result).map(post);
  return { posts, nextBefore: posts.length === 30 ? posts.at(-1).createdAt : null };
});

route('POST', '/posts', async (ctx) => {
  const user = await member(ctx);
  const body = text(ctx.body.body, 'a message', { max: 1500 });
  const id = randomUUID();
  await ctx.db.execute({
    sql: 'INSERT INTO posts (id, community_id, author_id, body) VALUES (?, ?, ?, ?)',
    args: [id, user.community_id, user.id, body],
  });
  const created = one(await ctx.db.execute({
    sql: 'SELECT p.*, u.display_name, u.role FROM posts p LEFT JOIN users u ON u.id = p.author_id WHERE p.id = ?',
    args: [id],
  }));
  return { status: 201, data: { post: post(created) } };
});

route('DELETE', '/posts/:id', async (ctx) => {
  const user = await member(ctx);
  const target = one(await ctx.db.execute({
    sql: 'SELECT author_id FROM posts WHERE id = ? AND community_id = ?',
    args: [ctx.params.id, user.community_id],
  }));
  if (!target) throw new AppError(404, 'That post was not found.');
  if (target.author_id !== user.id && user.role !== 'instructor') throw new AppError(403, 'You can only remove your own posts.');
  await ctx.db.execute({ sql: 'DELETE FROM posts WHERE id = ?', args: [ctx.params.id] });
  return { status: 204 };
});

route('GET', '/progress', async (ctx) => {
  const user = await member(ctx);
  const [lessons, quizzes] = await ctx.db.batch([
    { sql: 'SELECT lesson_id, completed_at FROM lesson_progress WHERE user_id = ? ORDER BY completed_at', args: [user.id] },
    { sql: 'SELECT score, created_at FROM quiz_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', args: [user.id] },
  ], 'read');
  const completed = rows(lessons).map((l) => l.lesson_id);
  return {
    completed,
    progress: Math.round((completed.length / LESSONS.length) * 100),
    quizHistory: rows(quizzes).reverse().map((q) => ({ score: Number(q.score), date: q.created_at })),
  };
});

// Course lessons are open: students mark them complete and move on. The MCQ + FRQ
// checkpoint only runs when a teacher assigns it, and every attempt's accuracy is stored.
route('GET', '/courses/progress', async (ctx) => {
  const user = await member(ctx);
  const [done, attempts] = await ctx.db.batch([
    { sql: 'SELECT lesson_id FROM course_completions WHERE user_id = ? ORDER BY completed_at', args: [user.id] },
    { sql: 'SELECT lesson_id, accuracy, created_at FROM checkpoint_attempts WHERE user_id = ? ORDER BY created_at', args: [user.id] },
  ], 'read');
  const accuracy = {};
  for (const a of rows(attempts)) accuracy[a.lesson_id] = { latest: Number(a.accuracy), attempts: (accuracy[a.lesson_id]?.attempts || 0) + 1 };
  return { completed: rows(done).map((r) => r.lesson_id), accuracy };
});

route('POST', '/courses/lessons/:lessonId/complete', async (ctx) => {
  const user = await member(ctx, 'student');
  const found = findCourseLesson(ctx.params.lessonId);
  if (!found) throw new AppError(404, 'That lesson was not found.');
  await ctx.db.execute({
    sql: 'INSERT INTO course_completions (user_id, lesson_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
    args: [user.id, found.lesson.id],
  });
  return { completed: true, lessonId: found.lesson.id };
});

const checkpointLog = new Map();
const accuracyOf = (mcqCorrect, mcqTotal, frqScore) => {
  const mcq = mcqTotal ? (mcqCorrect / mcqTotal) * 100 : 0;
  return Math.round(frqScore === null ? mcq : (mcq + frqScore) / 2);
};

// Grades one checkpoint attempt. Students' attempts are saved (and count toward the
// assignment, when there is one); teacher previews are graded but never recorded.
async function runCheckpoint(ctx, user, lesson, assignmentId) {
  const check = assessLesson(lesson, ctx.body);
  if (!Array.isArray(ctx.body.answers) || ctx.body.answers.length !== lesson.mcqs.length || ctx.body.answers.some((x) => !Number.isInteger(x) || x < 0))
    throw new AppError(400, 'Answer every multiple-choice question.');
  if (!check.responseReady) throw new AppError(400, 'Write a response between 80 and 10,000 characters.');
  if (!allowHalMessage(checkpointLog, user.id, Date.now(), 12, 10 * 60_000))
    throw new AppError(429, 'You have submitted several checkpoints. Please wait a few minutes before trying again.');
  const response = ctx.body.response.trim();
  const mcqCorrect = check.mcqs.filter((q) => q.correct).length, mcqTotal = check.mcqs.length;
  // A checkpoint is only submitted after its written response has a rubric grade.
  const grade = await ctx.gradeFRQ(lesson, response, { apiKey: ctx.env.GEMINI_API_KEY, model: ctx.env.GEMINI_GRADING_MODEL || ctx.env.GEMINI_MODEL || 'gemini-3.5-flash-lite' });
  const frqScore = grade.score, accuracy = accuracyOf(mcqCorrect, mcqTotal, frqScore);
  const result = { accuracy, mcqCorrect, mcqTotal, frqScore, grade, mcqs: check.mcqs, recorded: user.role === 'student' };
  if (user.role !== 'student') return result;
  const attemptId = randomUUID();
  await ctx.db.batch([
    { sql: 'INSERT INTO checkpoint_answers (attempt_id, answers) VALUES (?, ?)', args: [attemptId, JSON.stringify(ctx.body.answers)] },
    {
      sql: `INSERT INTO checkpoint_attempts (id, user_id, lesson_id, assignment_id, mcq_correct, mcq_total, frq_score, accuracy, response, grade)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [attemptId, user.id, lesson.id, assignmentId, mcqCorrect, mcqTotal, frqScore, accuracy, response, grade && JSON.stringify(grade)],
    },
    ...(assignmentId ? [{
      sql: `INSERT INTO submissions (assignment_id, user_id, body) VALUES (?, ?, ?)
        ON CONFLICT(assignment_id, user_id) DO UPDATE SET body = excluded.body, submitted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
      args: [assignmentId, user.id, response],
    }] : []),
  ], 'write');
  return { ...result, assignmentId };
}

// The checkpoint at the end of every lesson. It is optional: completing a lesson never needs it.
route('POST', '/courses/lessons/:lessonId/checkpoint', async (ctx) => {
  const user = await member(ctx);
  const found = findCourseLesson(ctx.params.lessonId);
  if (!found) throw new AppError(404, 'That lesson was not found.');
  // A student's attempt also counts for a teacher-assigned checkpoint on this lesson, if there is one.
  const assigned = user.role === 'student' && one(await ctx.db.execute({
    sql: `SELECT a.id FROM assignments a JOIN assignment_lessons al ON al.assignment_id = a.id
      WHERE al.lesson_id = ? AND a.community_id = ? AND a.type = 'Lesson checkpoint' AND (a.event IS NULL OR a.event = ?)
      ORDER BY a.due LIMIT 1`,
    args: [found.lesson.id, user.community_id, user.event],
  }));
  return runCheckpoint(ctx, user, found.lesson, assigned ? assigned.id : null);
});

route('POST', '/assignments/:id/checkpoint', async (ctx) => {
  const user = await member(ctx, 'student');
  const a = await assignmentInCommunity(ctx, user, ctx.params.id);
  if (a.event && a.event !== user.event) throw new AppError(404, 'That assignment was not found.');
  const found = a.lesson_id && findCourseLesson(a.lesson_id);
  if (a.type !== 'Lesson checkpoint' || !found) throw new AppError(400, 'This assignment does not have a lesson checkpoint.');
  return runCheckpoint(ctx, user, found.lesson, a.id);
});

// ---------- practice tests ----------
// Attempts are graded here from the chosen options, so a saved score always matches the answer key.
function practiceAttempt(row, test = getPracticeTest(row.test_id)) {
  const answers = JSON.parse(row.answers);
  return {
    id: row.id, testId: row.test_id, event: row.event, title: test?.title ?? 'Assigned practice test', mode: row.mode,
    correct: Number(row.correct), total: Number(row.total), score: Number(row.score), seconds: Number(row.seconds),
    timedOut: Boolean(Number(row.timed_out)), date: row.created_at, answers,
    areas: test ? gradeAnswers(test, answers).areas : [],
  };
}

// A teacher's edited practice test, rebuilt from its saved question list. Returns null when it is gone.
async function loadCustomTest(ctx, id) {
  const m = /^custom-([\w-]{1,64})\.(\d{1,6})$/.exec(id);
  if (!m) return null;
  const set = one(await ctx.db.execute({
    sql: `SELECT qs.*, a.title, a.event, a.community_id, a.type FROM assignment_question_sets qs JOIN assignments a ON a.id = qs.assignment_id
      WHERE qs.assignment_id = ? AND qs.version = ?`, args: [m[1], Number(m[2])],
  }));
  const template = set && getPracticeTest(set.template);
  if (!template) return null;
  const test = customTest({ id, title: set.title, template, refs: JSON.parse(set.questions) });
  return { test, templateId: set.template, refs: JSON.parse(set.questions), assignmentId: set.assignment_id, communityId: set.community_id, event: set.event, version: Number(set.version) };
}
// The custom test a person may open: their own community, and for students their own event.
async function customTestFor(ctx, user, id) {
  const found = await loadCustomTest(ctx, id);
  if (!found || found.communityId !== user.community_id || (user.role === 'student' && found.event && found.event !== user.event))
    throw new AppError(404, 'That practice test was not found.');
  return found;
}
// Attempt rows with each one's test, including edited tests.
async function practiceAttempts(ctx, list) {
  const custom = new Map();
  for (const id of new Set(list.map((r) => r.test_id).filter((id) => id.startsWith(CUSTOM)))) custom.set(id, (await loadCustomTest(ctx, id))?.test ?? null);
  return list.map((r) => practiceAttempt(r, custom.has(r.test_id) ? custom.get(r.test_id) ?? undefined : getPracticeTest(r.test_id)));
}

route('GET', '/practice/attempts', async (ctx) => {
  const user = await member(ctx);
  const result = await ctx.db.execute({
    sql: 'SELECT * FROM (SELECT * FROM practice_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 200) ORDER BY created_at',
    args: [user.id],
  });
  return { attempts: await practiceAttempts(ctx, rows(result)) };
});

// The questions in a teacher's edited practice test. Practice tests are open study material,
// so the answer key travels with them like the built-in tests.
route('GET', '/practice/custom/:testId', async (ctx) => {
  const user = await member(ctx);
  const { test, refs, templateId } = await customTestFor(ctx, user, ctx.params.testId);
  return { test: { id: test.id, event: test.event, title: test.title, template: templateId, refs } };
});

route('POST', '/practice/:testId/attempts', async (ctx) => {
  const user = await member(ctx);
  const test = ctx.params.testId.startsWith(CUSTOM) ? (await customTestFor(ctx, user, ctx.params.testId)).test : getPracticeTest(ctx.params.testId);
  if (!test) throw new AppError(404, 'That practice test was not found.');
  const { mode, answers, seconds, timedOut } = ctx.body;
  if (mode !== 'check' && mode !== 'exam') throw new AppError(400, 'Choose how the test is graded.');
  if (!Array.isArray(answers) || answers.length !== test.questions.length ||
    !answers.every((a, i) => a === null || (test.questions[i].input
      ? typeof a === 'string' && a.length > 0 && a.length <= 20
      : Number.isInteger(a) && a >= 0 && a < test.questions[i].options.length)))
    throw new AppError(400, 'The answers could not be read. Reload the test and try again.');
  if (!Number.isInteger(seconds) || seconds < 0 || seconds > 24 * 3600) throw new AppError(400, 'The test time could not be read.');
  const graded = gradeAnswers(test, answers);
  const attempt = {
    id: randomUUID(), test_id: test.id, event: test.event, mode, correct: graded.correct, total: graded.total, score: graded.score,
    seconds: mode === 'exam' ? Math.min(seconds, test.minutes * 60) : seconds, timed_out: timedOut === true ? 1 : 0,
    answers: JSON.stringify(answers), created_at: new Date().toISOString(),
  };
  // Teachers can try a test; their attempts are graded but not saved.
  if (user.role === 'student') await ctx.db.execute({
    sql: 'INSERT INTO practice_attempts (id, user_id, test_id, event, mode, correct, total, score, seconds, timed_out, answers, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [attempt.id, user.id, attempt.test_id, attempt.event, mode, attempt.correct, attempt.total, attempt.score, attempt.seconds, attempt.timed_out, attempt.answers, attempt.created_at],
  });
  return { status: 201, data: { attempt: practiceAttempt(attempt, test), recorded: user.role === 'student' } };
});

route('PUT', '/progress/lessons/:lessonId', async (ctx) => {
  const user = await member(ctx);
  if (!LESSON_IDS.has(ctx.params.lessonId)) throw new AppError(404, 'That lesson was not found.');
  await ctx.db.execute({
    sql: 'INSERT INTO lesson_progress (user_id, lesson_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
    args: [user.id, ctx.params.lessonId],
  });
  return { lessonId: ctx.params.lessonId, completed: true };
});

route('POST', '/progress/quizzes', async (ctx) => {
  const user = await member(ctx);
  const score = ctx.body.score;
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new AppError(400, 'Scores are whole numbers from 0 to 100.');
  await ctx.db.execute({
    sql: 'INSERT INTO quiz_attempts (id, user_id, score) VALUES (?, ?, ?)',
    args: [randomUUID(), user.id, score],
  });
  return { status: 201, data: { score } };
});

// ---------- Valus AI graders: online upload, speech and skills video ----------

const DAY_MS = 864e5;
const graderConfig = (ctx) => ({ apiKey: ctx.env.GEMINI_API_KEY, model: ctx.env.GEMINI_UPLOAD_MODEL || ctx.env.GEMINI_GRADING_MODEL || ctx.env.GEMINI_MODEL || 'gemini-3.5-flash-lite' });
const graderMode = (value) => {
  const mode = value ?? 'upload';
  if (!GRADER_MODES.includes(mode)) throw new AppError(404, 'That grader was not found.');
  return mode;
};
const graderEvent = (value, mode) => {
  if (typeof value !== 'string' || !hasGrader(value, mode)) throw new AppError(404, 'This event does not have that Valus AI grader.');
  return value;
};
const GRADER_ROWS = 'SELECT g.*, j.mode, j.job, j.claimed_at FROM grader_attempts g LEFT JOIN grader_jobs j ON j.attempt_id = g.id';
const graderSummary = (r) => ({ id: r.id, event: r.event, mode: r.mode || 'upload', score: r.score == null ? null : Number(r.score), files: JSON.parse(r.files || '[]'), createdAt: r.created_at });
const graderFull = (r) => ({ ...graderSummary(r), ...JSON.parse(r.result) });
async function gradesToday(ctx, user) {
  const r = one(await ctx.db.execute({ sql: 'SELECT COUNT(*) AS n FROM grader_attempts WHERE user_id = ? AND created_at > ?', args: [user.id, new Date(Date.now() - DAY_MS).toISOString()] }));
  return Number(r.n);
}
const remainingGrades = async (ctx, user) => Math.max(0, GRADER_DAILY_LIMIT - await gradesToday(ctx, user));
async function dropAttempt(ctx, id) {
  await ctx.db.batch([
    { sql: 'DELETE FROM grader_jobs WHERE attempt_id = ?', args: [id] },
    { sql: 'DELETE FROM grader_attempts WHERE id = ?', args: [id] },
  ], 'write');
}
async function saveGrade(ctx, id, grade) {
  await ctx.db.execute({ sql: "UPDATE grader_attempts SET status = 'done', score = ?, result = ? WHERE id = ?", args: [grade.score, JSON.stringify(grade), id] });
}

route('GET', '/grader', async (ctx) => {
  const user = await member(ctx);
  const mode = graderMode(ctx.query.get('mode') || undefined), event = graderEvent(ctx.query.get('event'), mode);
  const list = rows(await ctx.db.execute({ sql: GRADER_ROWS + " WHERE g.user_id = ? AND g.event = ? AND COALESCE(j.mode, 'upload') = ? ORDER BY g.created_at DESC LIMIT 40", args: [user.id, event, mode] }));
  return {
    attempts: list.filter((r) => r.status === 'done').slice(0, 20).map(graderSummary),
    // A video still waiting at Gemini can be picked up again after a reload (Gemini keeps it 48 hours).
    pending: list.filter((r) => r.status !== 'done' && r.job && Date.parse(r.created_at) > Date.now() - 2 * DAY_MS).map(graderSummary),
    remaining: await remainingGrades(ctx, user), dailyLimit: GRADER_DAILY_LIMIT, folder: graderFolder(user.id), uploads: ctx.storage.configured(),
    ...(isVideoMode(mode) ? { maxBytes: VIDEO_MAX_BYTES, maxFiles: 1, types: [...VIDEO_TYPES] } : { maxBytes: GRADER_MAX_BYTES, maxFiles: GRADER_MAX_FILES, types: [...GRADER_TYPES] }),
  };
});

route('GET', '/grader/attempts/:id', async (ctx) => {
  const user = await member(ctx);
  const r = one(await ctx.db.execute({ sql: GRADER_ROWS + " WHERE g.id = ? AND g.user_id = ? AND g.status = 'done'", args: [ctx.params.id, user.id] }));
  if (!r) throw new AppError(404, 'That grade was not found.');
  return { attempt: graderFull(r) };
});

// The browser uploads straight to Firebase Storage. Online uploads and YouTube links are graded in
// this request. Speech and skill video files are streamed to Gemini's file service here, then graded
// by POST /grader/jobs/:id once Google has processed the video, so no single request runs too long.
// Failed grades do not count toward the daily limit.
route('POST', '/grader', async (ctx) => {
  const user = await member(ctx);
  const mode = graderMode(ctx.body.mode), video = isVideoMode(mode);
  const event = graderEvent(ctx.body.event, mode);
  const link = youtubeLink(ctx.body.link);
  const pasted = ctx.body.text == null ? '' : text(ctx.body.text, video ? 'your notes' : 'your written work', { max: video ? 4000 : GRADER_TEXT_MAX, required: false });
  const skill = mode === 'video' && ctx.body.skill != null ? text(ctx.body.skill, 'the skill name', { max: 200, required: false }) : '';
  const asked = ctx.body.files ?? [];
  const folder = graderFolder(user.id), maxFiles = video ? 1 : GRADER_MAX_FILES;
  if (!Array.isArray(asked) || asked.length > maxFiles) throw new AppError(400, video ? 'Grade one video at a time.' : `You can grade up to ${GRADER_MAX_FILES} files at a time.`);
  if (video && !asked.length && !link) throw new AppError(400, 'Upload your video or paste a YouTube link first.');
  if (video && asked.length && link) throw new AppError(400, 'Choose either a video file or a YouTube link, not both.');
  if (!asked.length && !link && !pasted) throw new AppError(400, 'Upload your work, paste it, or add a video link first.');
  const picked = asked.map((f) => {
    const path = f?.path;
    if (typeof path !== 'string' || !path.startsWith(folder) || !/^[\w-]{8,64}$/.test(path.slice(folder.length))) throw new AppError(400, 'That upload could not be read.');
    return { path, name: text(f.name, 'a file name', { max: 200 }) };
  });
  if (new Set(picked.map((f) => f.path)).size !== picked.length) throw new AppError(400, 'The same file was added twice.');
  if (picked.length && !ctx.storage.configured()) throw new AppError(503, video ? 'File uploads are not configured yet. Paste a YouTube link instead.' : 'File uploads are not configured yet. Paste your written work instead.');
  const infos = await Promise.all(picked.map((f) => ctx.storage.info(f.path)));
  infos.forEach((info, i) => {
    if (!info) throw new AppError(400, `${picked[i].name} did not finish uploading. Try it again.`);
    if (!(video ? VIDEO_TYPES : GRADER_TYPES).has(info.contentType)) throw new AppError(400, video ? `${picked[i].name} is not a video Valus AI can watch. Use an MP4, MOV or WEBM file.` : `${picked[i].name} is not a file Valus AI can read. Use a PDF, an image, or a short video.`);
  });
  const total = infos.reduce((n, info) => n + info.size, 0);
  if (total > (video ? VIDEO_MAX_BYTES : GRADER_MAX_BYTES)) throw new AppError(400, video ? 'That video is over 1 GB. Record at 720p or 1080p, or trim it to the timed part.' : 'Those files are too large to grade together. Keep them under 14 MB in total.');
  if (await gradesToday(ctx, user) >= GRADER_DAILY_LIMIT) throw new AppError(429, `You have used today's ${GRADER_DAILY_LIMIT} grades. Try again tomorrow.`);

  const id = randomUUID(), createdAt = new Date().toISOString(), names = picked.map((f) => f.name);
  const toGemini = video && picked.length > 0;
  await ctx.db.batch([
    { sql: 'INSERT INTO grader_attempts (id, user_id, event, status, files, created_at) VALUES (?, ?, ?, ?, ?, ?)', args: [id, user.id, event, toGemini ? 'processing' : 'grading', JSON.stringify(names), createdAt] },
    ...(video ? [{ sql: 'INSERT INTO grader_jobs (attempt_id, mode) VALUES (?, ?)', args: [id, mode] }] : []),
  ], 'write');

  if (toGemini) {
    let file;
    try {
      file = await ctx.geminiFiles.upload({ stream: ctx.storage.stream(picked[0].path), size: infos[0].size, contentType: infos[0].contentType, name: names[0] }, graderConfig(ctx));
    } catch (error) {
      await dropAttempt(ctx, id);
      throw error;
    }
    await ctx.db.execute({ sql: 'UPDATE grader_jobs SET job = ? WHERE attempt_id = ?', args: [JSON.stringify({ file: file.name, uri: file.uri, mimeType: file.mimeType, text: pasted, skill }), id] });
    await ctx.storage.remove(picked[0].path);
    return { status: 202, data: { job: { id, event, mode, files: names, createdAt, status: 'processing' }, remaining: await remainingGrades(ctx, user) } };
  }

  let grade;
  try {
    const files = await Promise.all(picked.map(async (f, i) => ({ name: f.name, contentType: infos[i].contentType, data: await ctx.storage.download(f.path) })));
    grade = await ctx.gradeUpload({ event, mode, files, link, text: pasted, skill }, graderConfig(ctx));
  } catch (error) {
    await dropAttempt(ctx, id);
    throw error;
  }
  const result = { ...grade, link };
  await saveGrade(ctx, id, result);
  await Promise.all(picked.map((f) => ctx.storage.remove(f.path)));
  return { status: 201, data: { attempt: { id, event, mode, score: grade.score, files: names, createdAt, ...result }, remaining: await remainingGrades(ctx, user) } };
});

// The page calls this every few seconds while a speech or skill video is processed. Once Google
// has the video ready, the first call grades it.
const CLAIM_MS = 200_000;
route('POST', '/grader/jobs/:id', async (ctx) => {
  const user = await member(ctx);
  const r = one(await ctx.db.execute({ sql: GRADER_ROWS + ' WHERE g.id = ? AND g.user_id = ? AND j.mode IS NOT NULL', args: [ctx.params.id, user.id] }));
  if (!r) throw new AppError(404, 'That grade was not found.');
  if (r.status === 'done') return { status: 'done', attempt: graderFull(r) };
  const job = r.job ? JSON.parse(r.job) : null;
  if (!job) return { status: 'processing' };
  if (r.claimed_at && Date.now() - Date.parse(r.claimed_at) < CLAIM_MS) return { status: 'grading' };
  const config = graderConfig(ctx);
  const file = await ctx.geminiFiles.status(job.file, config);
  if (file.state === 'FAILED') {
    await dropAttempt(ctx, r.id);
    await ctx.geminiFiles.remove(job.file, config);
    throw new AppError(400, 'Valus AI could not read that video. Try exporting it as an MP4 and upload it again.');
  }
  if (file.state !== 'ACTIVE') return { status: 'processing' };
  const claim = await ctx.db.execute({ sql: 'UPDATE grader_jobs SET claimed_at = ? WHERE attempt_id = ? AND (claimed_at IS NULL OR claimed_at < ?)', args: [new Date().toISOString(), r.id, new Date(Date.now() - CLAIM_MS).toISOString()] });
  if (!claim.rowsAffected) return { status: 'grading' };
  let grade;
  try {
    grade = await ctx.gradeUpload({ event: r.event, mode: r.mode, media: [{ uri: file.uri || job.uri, mimeType: file.mimeType || job.mimeType }], text: job.text, skill: job.skill }, config);
  } catch (error) {
    await ctx.db.execute({ sql: 'UPDATE grader_jobs SET claimed_at = NULL WHERE attempt_id = ?', args: [r.id] });
    throw error;
  }
  await saveGrade(ctx, r.id, { ...grade, link: null });
  await ctx.geminiFiles.remove(job.file, config);
  const done = one(await ctx.db.execute({ sql: GRADER_ROWS + ' WHERE g.id = ?', args: [r.id] }));
  return { status: 'done', attempt: graderFull(done), remaining: await remainingGrades(ctx, user) };
});

// ---------- app ----------

// One Vercel function serves every /api route (vercel.json rewrites to it), which keeps
// the project far below the Hobby plan's function limit and shares one warm DB client.
export function createApp({ db, verifyToken, env = process.env, communities = COMMUNITIES, gradeFRQ = gradeCourseFRQ, gradeUpload = gradeUploadWithGemini, geminiFiles = geminiFileApi(), storage = firebaseStorage(env) }) {
  return async function handler(req, res) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const rewritten = url.searchParams.get('route');
      const path = '/' + (rewritten ?? url.pathname.replace(/^\/api\/?/, '')).replace(/^\/+|\/+$/g, '');
      url.searchParams.delete('route');

      let allowed = [];
      for (const r of routes) {
        const match = r.pattern.exec(path);
        if (!match) continue;
        if (r.method !== req.method) { allowed.push(r.method); continue; }
        const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
        const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await readBody(req) : {};
        if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new AppError(400, 'The request could not be read.');
        if (!['/health', '/config', '/communities', '/hal'].includes(path)) await ensureSchema(db);
        const out = await r.handler({ req, db, env, communities, verifyToken, gradeFRQ, gradeUpload, geminiFiles, storage, params, query: url.searchParams, body });
        if (out && typeof out.status === 'number' && Object.keys(out).every((k) => k === 'status' || k === 'data'))
          return send(res, out.status, out.data);
        return send(res, 200, out);
      }
      if (allowed.length) {
        res.setHeader('Allow', allowed.join(', '));
        throw new AppError(405, 'That method is not supported here.');
      }
      throw new AppError(404, 'Not found.');
    } catch (error) {
      failure(res, error);
    }
  };
}
