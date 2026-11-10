// Synthetic local sign-in and an isolated database; never uses production credentials or data.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { createDb, ensureSchema } from '../server/db.js';
import { loadCommunities } from '../server/communities.js';
import { attendanceDatabase, createAttendanceEvent } from '../server/attendance.js';
const { chromium, expect } = await import(pathToFileURL(process.env.PLAYWRIGHT_ENTRY).href);
const db = createDb({ TURSO_DATABASE_URL: 'file::memory:' });
await ensureSchema(db);
const communities = loadCommunities([
  {
    id: 'qa',
    name: 'Valus Test Chapter',
    studentPassword: { env: 'QA_STUDENT' },
    instructorPassword: { env: 'QA_TEACHER' },
  },
]);
for (const [uid, name, role] of [
  ['teacher', 'Dr. Jordan Rivera', 'instructor'],
  ['student', 'Maya Patel', 'student'],
  ['absent', 'Sam Chen', 'student'],
])
  await db.execute({
    sql: 'INSERT INTO users (id,email,display_name,role,community_id) VALUES (?,?,?,?,?)',
    args: [uid, `${uid}@example.test`, name, role, 'qa'],
  });
const input = {
  title: 'Clinical skills practice',
  opensAt: new Date(Date.now() - 60000).toISOString(),
  closesAt: new Date(Date.now() + 3600000).toISOString(),
  timezone: 'America/New_York',
  locationName: 'Chapter clinical skills room',
  latitude: 26,
  longitude: -80,
};
const facade = attendanceDatabase(db),
  teacher = { id: 'teacher', role: 'instructor', community_id: 'qa' };
const current = await createAttendanceEvent(facade, teacher, input);
await createAttendanceEvent(facade, teacher, {
  ...input,
  title: 'Chapter service day',
  opensAt: new Date(Date.now() + 86400000).toISOString(),
  closesAt: new Date(Date.now() + 90000000).toISOString(),
});
const past = await createAttendanceEvent(facade, teacher, {
  ...input,
  title: 'Anatomy study circle',
});
await db.execute({
  sql: 'UPDATE attendance_events SET opens_at=?,closes_at=? WHERE id=?',
  args: [
    new Date(Date.now() - 90000000).toISOString(),
    new Date(Date.now() - 86400000).toISOString(),
    past.id,
  ],
});
const sessionSource = `
const role=new URL(location.href).searchParams.get('role')||'instructor';
const uid=role==='instructor'?'teacher':'student';
const profile={uid,role,event:null,displayName:role==='instructor'?'Dr. Jordan Rivera':'Maya Patel',community:{id:'qa',name:'Valus Test Chapter'}};
export const session={ready:true,enrolled:true,user:{uid,email:uid+'@example.test'},profile};
const listeners=[];export const onSession=fn=>listeners.push(fn);export const setProfile=p=>{session.profile=p;listeners.forEach(fn=>fn());};export const startSession=()=>{};
export async function api(method,url,body){const response=await fetch('/api'+url,{method,headers:{Authorization:'Bearer '+uid,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const data=await response.json();if(!response.ok)throw new Error(data.error);return data;}
export const googleSignIn=()=>{},emailSignIn=()=>{},resetPassword=()=>{},createAccount=()=>{},enroll=()=>{},signOut=()=>{};
export const uploadFile=()=>{};
`;
const handler = createApp({
  db,
  communities,
  env: {},
  verifyToken: async (uid) => ({ uid, email: `${uid}@example.test` }),
});
const root = path.resolve('dist');
const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/session.js') {
    res.setHeader('Content-Type', 'text/javascript');
    res.end(sessionSource);
    return;
  }
  if (pathname === '/api/attendance/locations') {
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        results: [{ name: 'Science Building, 123 Chapter Lane', latitude: 26, longitude: -80 }],
      }),
    );
    return;
  }
  if (pathname.startsWith('/api/')) return handler(req, res);
  const target = path.resolve(
    root,
    '.' + (pathname === '/' ? '/index.html' : decodeURIComponent(pathname)),
  );
  if (!target.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const data = await fs.readFile(target);
    res.setHeader(
      'Content-Type',
      {
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.svg': 'image/svg+xml',
        '.ttf': 'font/ttf',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
      }[path.extname(target)] || 'application/octet-stream',
    );
    res.end(data);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`,
  out = 'outputs/attendance-qa';
await fs.mkdir(out, { recursive: true });
const errors = [];
let browser;
async function session(role) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    permissions: ['geolocation'],
    geolocation: { latitude: 26, longitude: -80, accuracy: 10 },
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => {errors.push(e.message);console.error('Browser error:',e.message);});
  await page.goto(base + `?role=${role}#/attendance`);
  try { await expect(page.locator('.va-event')).toHaveCount(role === 'instructor' ? 3 : 4); }
  catch(e) { console.error((await page.locator('body').innerText()).slice(0,3500)); throw e; }
  return { context, page };
}
async function fits(page, name) {
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForTimeout(100);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > innerWidth + 1
          ? [...document.querySelectorAll('body *')]
              .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
              .slice(0, 8)
              .map((e) => e.tagName + '.' + e.className)
          : [],
      );
      assert.deepEqual(overflow, [], `${name} ${theme} ${width} fits`);
      if (width === 1440 || width === 390)
        await page.screenshot({ path: `${out}/${name}-${theme}-${width}.png`, fullPage: true });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}
try {
  browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const t = await session('instructor');
  const sidebar = await t.page.locator('.sidebar').boundingBox(),
    body = await t.page.locator('.workspace-body').boundingBox();
  assert.ok(sidebar.x > body.x + body.width - 2, 'Dashboard tabs are on the right');
  assert.equal(await t.page.locator('.workspace-top a[href="#/attendance"]').count(), 0);
  await fits(t.page, 'teacher-events');
  await t.page.getByRole('button', { name: 'Student analytics', exact: true }).click();
  await expect(t.page.getByRole('cell', { name: /Sam Chen/ })).toBeVisible();
  await fits(t.page, 'teacher-analytics');
  const download = t.page.waitForEvent('download');
  await t.page.getByRole('button', { name: 'Export attendance' }).click();
  assert.equal((await download).suggestedFilename(), 'valus-event-attendance.csv');
  await t.page.getByRole('button', { name: /Online now/ }).click();
  await t.page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(t.page.locator('.va-online-person')).toContainText('Dr. Jordan Rivera');
  await t.page.getByRole('button', { name: 'New event', exact: true }).click();
  await t.page.getByLabel('Event name', { exact: true }).fill('First aid practice');
  await t.page.getByRole('button', { name: /Choose a location/ }).click();
  await expect(t.page.locator('.leaflet-container')).toBeVisible();
  await t.page.getByLabel('Search event address').fill('123 Chapter Lane');
  await t.page
    .locator('.va-address-search')
    .getByRole('button', { name: 'Search', exact: true })
    .click();
  await t.page.locator('.va-map-results button').click();
  await t.page.setViewportSize({ width: 390, height: 900 });
  await t.page.screenshot({ path: out + '/map-mobile.png', fullPage: true });
  await t.page.getByRole('button', { name: 'Use this location' }).click();
  await t.page.getByRole('button', { name: 'Create event', exact: true }).click();
  await expect(t.page.locator('.va-dialog')).toHaveCount(0);
  await t.page.getByRole('button', { name: 'Events', exact: true }).click();
  await expect(t.page.locator('.va-event')).toHaveCount(4);
  const s = await session('student');
  await fits(s.page, 'student-checkin');
  const code = (
    await db.execute({ sql: 'SELECT code FROM attendance_events WHERE id=?', args: [current.id] })
  ).rows[0].code;
  await s.page.getByLabel('Enter your event code').fill('WRONG123');
  await s.page.getByRole('button', { name: 'Check in with location' }).click();
  await expect(s.page.locator('.va-error')).toContainText('code did not match');
  await s.page.getByLabel('Enter your event code').fill(code);
  await s.context.setGeolocation({ latitude: 27, longitude: -80, accuracy: 10 });
  await s.page.getByRole('button', { name: 'Check in with location' }).click();
  await expect(s.page.locator('.va-error')).toContainText('0.5 mile');
  await s.context.setGeolocation({ latitude: 26, longitude: -80, accuracy: 10 });
  await s.page.getByRole('button', { name: 'Check in with location' }).click();
  await expect(s.page.getByRole('heading', { name: 'You showed up.' })).toBeVisible();
  assert.equal(await s.page.getByRole('button', { name: 'New event' }).count(), 0);
  assert.equal(await s.page.getByRole('button', { name: 'Delete event' }).count(), 0);
  await t.page.setViewportSize({ width: 1440, height: 1000 });
  await t.page.locator('.va-event').filter({ hasText: 'Clinical skills practice' }).click();
  await t.page.getByRole('button', { name: 'Delete event', exact: true }).click();
  await expect(t.page.locator('.va-dialog')).toContainText('permanently removes');
  await t.page.getByRole('button', { name: 'Keep event', exact: true }).click();
  await expect(t.page.locator('.va-event')).toHaveCount(4);
  await t.page.getByRole('button', { name: 'Delete event', exact: true }).click();
  await t.page.getByRole('button', { name: 'Yes, delete event', exact: true }).click();
  await expect(t.page.locator('.va-event')).toHaveCount(3);
  await s.page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(s.page.locator('.va-event')).toHaveCount(3);
  await expect(
    s.page.locator('.va-event').filter({ hasText: 'Clinical skills practice' }),
  ).toHaveCount(0);
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect(
    t.page
      .getByRole('navigation', { name: 'Workspace navigation' })
      .getByRole('link', { name: 'Attendance', exact: true }),
  ).toBeVisible();
  assert.deepEqual(errors, []);
  console.log(
    'PASS: Valus attendance for both roles, right-side dashboard navigation, real API persistence, map and address selection, check-in and geofence rejection, CSV, online members, deletion, 2 themes and 5 viewport sizes.',
  );
  await t.context.close();
  await s.context.close();
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
  db.close();
}
