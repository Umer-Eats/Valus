// Builds the search-engine pages, sitemap.xml and robots.txt from the live course and test data.
// The app itself uses #/ routes, which Google treats as a single URL, so every page we want
// found in search needs its own real HTML file. Run after changing events, lessons or tests:
//   node scripts/build-seo.mjs
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SITE = 'https://valus.app';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const dist = path.join(root, 'dist');
const lastmodFile = path.join(here, 'seo-lastmod.json');
const load = file => import(pathToFileURL(path.join(dist, file)).href);

const { GROUPS, EVENTS } = await load('model.js');
const { EVENT_DETAILS } = await load('event-details.js');
const courses = await load('courses.js');
const tests = await load('practice-tests.js');
await courses.loadAllCourses({ view: false });
await tests.loadAllTests();

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const slug = name => name.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const clip = (s, n) => { s = String(s).replace(/\s+/g, ' ').trim(); return s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)).replace(/[,;:.]$/, '') + '…'; };
const firstSentence = s => (String(s).match(/^.*?[.!?](\s|$)/)?.[0] || s).trim();
const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');

// ---------- Gather the facts for each event ----------
const events = EVENTS.map(e => {
  const course = courses.COURSES[e.name] || { units: [] };
  const lessons = course.units.flatMap(u => u.lessons);
  const practice = tests.practiceTests(e.name).map(t => tests.getPracticeTest(t.id)).filter(Boolean);
  const detail = EVENT_DETAILS[e.name] || {};
  return { ...e, slug: slug(e.name), url: '/hosa-events/' + slug(e.name) + '/', course, lessons, practice, detail,
    questions: practice.reduce((n, t) => n + t.questions.length, 0) };
});
const totals = {
  events: events.length,
  lessons: events.reduce((n, e) => n + e.lessons.length, 0),
  tests: events.reduce((n, e) => n + e.practice.length, 0),
  questions: events.reduce((n, e) => n + e.questions, 0),
};

// ---------- Shared page frame ----------
const ORG = { '@type': 'EducationalOrganization', '@id': SITE + '/#org', name: 'Valus', url: SITE + '/', logo: SITE + '/assets/symbol.svg',
  description: 'Free HOSA study resources: lessons, practice tests and chapter tools for high school students and schools preparing for HOSA–Future Health Professionals competitive events.' };
const crumbs = list => ({ '@type': 'BreadcrumbList', itemListElement: list.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + url })) });
const arrow = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const cta = (label, href, secondary) => `<a class="button${secondary ? ' secondary' : ''}" href="${href}">${label}<span class="button-tail">${arrow}</span></a>`;
const wordmark = '<svg class="wordmark" viewBox="0 0 130 36" aria-label="valus" role="img"><g fill="none" stroke="currentColor" stroke-width="4.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18l8 12 8-12M46 30H33q-6 0-6-6t6-6h13v12M54 5v19q0 6 6 6h4M72 18v6q0 6 6 6h10V18M117 18h-15q-5 0-5 3t5 3h10q5 0 5 3t-5 3H97"/></g></svg>';
const NAV = [['HOSA events', '/hosa-events/'], ['Free resources', '/free-hosa-study-resources/'], ['For schools', '/for-schools/'], ['About', '/about/']];

function page({ url, title, description, body, schema = [], current }) {
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, ...schema] };
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${SITE + url}">
  <meta name="theme-color" content="#a8223c">
  <meta property="og:type" content="website"><meta property="og:site_name" content="Valus">
  <meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${SITE + url}"><meta property="og:image" content="${SITE}/assets/atrium.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/symbol.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/seo-pages.css">
  <script>try{document.documentElement.dataset.theme=localStorage.getItem('valus-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{document.documentElement.dataset.theme='light'}</script>
  <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>
<body class="seo">
  <a class="skip" href="#main">Skip to content</a>
  <header class="seo-header">
    <a class="brand" href="/" aria-label="Valus home"><img src="/assets/symbol.svg" alt="" class="brand-mark">${wordmark}</a>
    <nav aria-label="Main">${NAV.map(([l, h]) => `<a href="${h}"${h === current ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
    <a class="button login" href="/#/start">Start free</a>
  </header>
  <main id="main" class="seo-main">
${body}
  </main>
  <footer class="seo-footer">
    <div class="seo-foot-links">
      <a href="/">Valus home</a>${NAV.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}<a href="/#/student">Student login</a><a href="/#/teacher">Teacher login</a>
    </div>
    <p class="micro">© 2026 Valus · Independent project · Not affiliated with or endorsed by HOSA–Future Health Professionals</p>
  </footer>
</body>
</html>
`;
}

const typeLine = e => (e.detail.types || []).join(' · ') || 'Event';
const counts = e => [e.lessons.length && plural(e.lessons.length, 'lesson'), e.practice.length && plural(e.practice.length, 'practice test')].filter(Boolean).join(' · ');
const eventCard = e => `<li><a class="seo-card" href="${e.url}"><strong>${esc(e.name)}</strong><span class="micro">${esc(typeLine(e))}</span><span>${esc(counts(e))}</span></a></li>`;
const crumbNav = list => `<nav class="seo-crumbs" aria-label="Breadcrumb">${list.map(([n, u], i) => i < list.length - 1 ? `<a href="${u}">${esc(n)}</a><span aria-hidden="true">/</span>` : `<span aria-current="page">${esc(n)}</span>`).join('')}</nav>`;
const disclaimer = '<p class="seo-note">Valus is an independent study project and is not affiliated with or endorsed by HOSA–Future Health Professionals. Always confirm requirements in the current official guidelines and with your chapter advisor.</p>';

// ---------- Event pages ----------
function eventPage(e) {
  const sameCategory = events.filter(x => x.category === e.category && x !== e);
  const test1 = e.practice[0];
  const intro = e.course.intro || '';
  const desc = clip(`Free HOSA ${e.name} study guide: ${[e.lessons.length && plural(e.lessons.length, 'lesson'), e.practice.length && plural(e.practice.length, 'full-length practice test')].filter(Boolean).join(' and ')}, plus the 2026–27 event rules. ${firstSentence(intro)}`, 158);
  const list = [['Valus', '/'], ['HOSA events', '/hosa-events/'], [e.name, e.url]];
  const units = e.course.units.map(u => `<section class="seo-unit"><h3>${esc(u.title)}</h3>${u.summary ? `<p>${esc(u.summary)}</p>` : ''}<ol>${u.lessons.map(l => `<li>${esc(l.title)}${l.minutes ? ` <span class="micro">${l.minutes} min</span>` : ''}${l.hook ? `<p>${esc(clip(l.hook, 220))}</p>` : ''}</li>`).join('')}</ol></section>`).join('');
  const testsHtml = e.practice.length ? `
    <section class="seo-section"><h2>${esc(e.name)} practice tests</h2>
      <p>Each test is an original, full-length simulation of the HOSA Round One written test, written to run slightly harder than the real thing. Every answer comes with an explanation and a reference.</p>
      <ul class="seo-tests">${e.practice.map(t => `<li><strong>${esc(t.title)}</strong><span>${esc(t.subtitle || '')}</span><span class="micro">${t.questions.length} questions · ${t.minutes} min</span></li>`).join('')}</ul>
      ${test1?.plan?.length ? `<h3>What the test covers</h3><table class="seo-table"><thead><tr><th scope="col">Topic area</th><th scope="col">Share of test</th></tr></thead><tbody>${test1.plan.map(p => `<tr><td>${esc(p.area)}</td><td>${p.weight}%</td></tr>`).join('')}</tbody></table>` : ''}
      ${test1?.sources ? `<p class="seo-small">References: ${esc(test1.sources)}.</p>` : ''}
    </section>
    <section class="seo-section"><h2>Sample ${esc(e.name)} questions</h2>
      ${test1.questions.slice(0, 3).map((q, i) => `<div class="seo-q"><p><strong>${i + 1}.</strong> ${esc(q.prompt)}</p>${q.options ? `<ol type="A">${q.options.map(o => `<li>${esc(o)}</li>`).join('')}</ol>` : ''}<details><summary>Show answer</summary><p><strong>${esc(tests.answerText(q))}</strong></p>${q.explain ? `<p>${esc(q.explain)}</p>` : ''}</details></div>`).join('')}
      <p>${cta('Take the full practice test free', '/#/start')}</p>
    </section>` : '';
  const body = `
    ${crumbNav(list)}
    <section class="seo-hero">
      <p class="eyebrow">${esc(e.category)} · ${esc(typeLine(e))}</p>
      <h1>${esc(e.name)} HOSA study guide</h1>
      <p class="seo-lede">Free ${esc(e.name)} lessons${e.practice.length ? ', practice tests' : ''} and rules for students competing in HOSA–Future Health Professionals. Updated for the 2026–27 season.</p>
      <ul class="seo-stats"><li><strong>${e.lessons.length}</strong> lessons</li>${e.practice.length ? `<li><strong>${e.practice.length}</strong> practice tests</li><li><strong>${e.questions}</strong> questions</li>` : ''}<li><strong>$0</strong> always free</li></ul>
      <p class="seo-ctas">${cta('Start studying free', '/#/start')}${e.detail.source ? `<a class="button secondary" href="${esc(e.detail.source)}" rel="noopener" target="_blank">Official 2026–27 guidelines</a>` : ''}</p>
    </section>
    <section class="seo-section"><h2>About the ${esc(e.name)} event</h2>
      <p>${esc(e.name)} is a ${esc(e.category)} event in the HOSA secondary division. Format: ${esc(typeLine(e).toLowerCase())}.${e.special ? ' This event has special eligibility requirements, so check the guidelines with your advisor.' : ''}</p>
      ${intro ? `<p>${esc(intro)}</p>` : ''}
    </section>
    <section class="seo-section"><h2>${esc(e.name)} lessons</h2>${units}</section>
    ${testsHtml}
    ${sameCategory.length ? `<section class="seo-section"><h2>More ${esc(e.category)} events</h2><ul class="seo-grid">${sameCategory.map(eventCard).join('')}</ul></section>` : ''}
    ${disclaimer}`;
  return { url: e.url, html: page({ url: e.url, title: `${e.name} HOSA Study Guide & ${e.practice.length ? 'Practice Tests' : 'Lessons'} (Free) | Valus`, description: desc, body, current: '/hosa-events/',
    schema: [crumbs(list), { '@type': 'Course', name: `${e.name} HOSA study guide`, description: desc, url: SITE + e.url, provider: { '@id': SITE + '/#org' },
      isAccessibleForFree: true, inLanguage: 'en', educationalLevel: 'High school', audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
      about: [e.name, 'HOSA–Future Health Professionals', e.category],
      hasPart: e.lessons.slice(0, 30).map(l => ({ '@type': 'LearningResource', name: l.title })) }] }) };
}

// ---------- Hub and topic pages ----------
const byCategory = Object.keys(GROUPS).map(cat => `<section class="seo-section" id="${slug(cat)}"><h2>${esc(cat)} events</h2><ul class="seo-grid">${events.filter(e => e.category === cat).map(eventCard).join('')}</ul></section>`).join('');
const statBlock = `<ul class="seo-stats"><li><strong>${totals.events}</strong> HOSA events</li><li><strong>${totals.lessons}</strong> lessons</li><li><strong>${totals.tests}</strong> practice tests</li><li><strong>${totals.questions.toLocaleString('en-US')}</strong> practice questions</li></ul>`;

function hubPage() {
  const url = '/hosa-events/', list = [['Valus', '/'], ['HOSA events', url]];
  const description = `Free study guides for all ${totals.events} HOSA secondary events: ${totals.lessons} lessons, ${totals.tests} practice tests and the 2026–27 rules, organized by category.`;
  const body = `${crumbNav(list)}
    <section class="seo-hero"><p class="eyebrow">2026–27 secondary division</p><h1>All ${totals.events} HOSA events: free study guides</h1>
      <p class="seo-lede">Pick your HOSA competitive event to see what it covers, how it is judged, and the free Valus lessons and practice tests that go with it.</p>${statBlock}
      <p class="seo-ctas">${cta('Start studying free', '/#/start')}</p></section>
    <nav class="seo-jump" aria-label="Categories">${Object.keys(GROUPS).map(c => `<a href="#${slug(c)}">${esc(c)}</a>`).join('')}</nav>
    ${byCategory}${disclaimer}`;
  return { url, html: page({ url, title: `All ${totals.events} HOSA Events: Free Study Guides & Practice Tests | Valus`, description, body, current: url,
    schema: [crumbs(list), { '@type': 'ItemList', name: 'HOSA events', itemListElement: events.map((e, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + e.url, name: e.name })) }] }) };
}

function resourcesPage() {
  const url = '/free-hosa-study-resources/', list = [['Valus', '/'], ['Free HOSA study resources', url]];
  const description = `Free HOSA study resources for every student: ${totals.lessons} lessons, ${totals.tests} full-length practice tests, official rules and an AI study buddy for all ${totals.events} events.`;
  const items = [
    ['In-depth lessons', `${totals.lessons} lessons across all ${totals.events} events, each built around the official HOSA test plan or rating sheet, with diagrams, interactive activities and checkpoint questions.`],
    ['Full-length practice tests', `${totals.tests} original Round One simulations with ${totals.questions.toLocaleString('en-US')} questions, every one explained and referenced. They run slightly harder than the real test so competition day feels easier.`],
    ['Rules in one place', 'The current 2026–27 HOSA guidelines for each event, linked from the event page so you always study from the source of truth.'],
    ['Graders for skills and speeches', 'Upload, skills video and speech tools for performance events, so you can get feedback between chapter practices.'],
    ['Mr. DNA, your study buddy', 'An animated study companion that answers questions about your event while you work.'],
    ['Progress tracking', 'See which lessons and tests you have finished and where your score is weakest.'],
  ];
  const body = `${crumbNav(list)}
    <section class="seo-hero"><p class="eyebrow">Free, always</p><h1>Free HOSA study resources</h1>
      <p class="seo-lede">Valus gives every HOSA–Future Health Professionals competitor the same high-quality preparation, at no cost. No premium tier and no paywall between you and your event.</p>${statBlock}
      <p class="seo-ctas">${cta('Create your free account', '/#/start')}${cta('Browse HOSA events', '/hosa-events/', true)}</p></section>
    <section class="seo-section"><h2>What you get for free</h2><ul class="seo-features">${items.map(([h, p]) => `<li><h3>${h}</h3><p>${p}</p></li>`).join('')}</ul></section>
    <section class="seo-section"><h2>How to study for HOSA with Valus</h2><ol class="seo-steps">
      <li><strong>Choose your event.</strong> HOSA students compete in one event a year, so Valus is shaped around a single focus.</li>
      <li><strong>Read the rules.</strong> Start with the current official guidelines for your event.</li>
      <li><strong>Work through the lessons.</strong> Each unit follows the test plan, so your time goes where the points are.</li>
      <li><strong>Take a practice test.</strong> Review every explanation, then retake the topics you missed.</li>
      <li><strong>Practice with your chapter.</strong> Your advisor can assign work and follow your progress.</li></ol></section>
    ${byCategory}${disclaimer}`;
  return { url, html: page({ url, title: 'Free HOSA Study Resources: Lessons & Practice Tests | Valus', description, body, current: url, schema: [crumbs(list)] }) };
}

function schoolsPage() {
  const url = '/for-schools/', list = [['Valus', '/'], ['For schools', url]];
  const description = 'Free HOSA chapter tools for schools and advisors: give students lessons and practice tests for every event, assign work, track progress and run a private chapter space.';
  const items = [
    ['Free for every school', 'Instructors and students pay nothing. Any HOSA chapter can join, whether it is brand new or has competed for years.'],
    ['Private chapter space', 'Students join your school with a chapter password you control, and posts stay inside your chapter.'],
    ['Assignments', 'Assign work to the whole chapter or to the students in one event, and read their responses.'],
    ['Roster and analytics', 'See every student, the event they chose, and their progress through lessons and practice tests.'],
    ['Ready-made curriculum', `${totals.lessons} lessons and ${totals.tests} practice tests across all ${totals.events} secondary events, so advisors do not have to build study material from scratch.`],
    ['Built for health science classes', 'Lessons follow the official HOSA test plans and cite their references, which makes them useful alongside health science and CTE courses.'],
  ];
  const body = `${crumbNav(list)}
    <section class="seo-hero"><p class="eyebrow">For HOSA advisors and schools</p><h1>Free HOSA chapter tools for schools</h1>
      <p class="seo-lede">Talent is everywhere; resources aren’t. Valus gives every school’s HOSA chapter the study material and chapter tools that well-funded programs have built over years, for free.</p>
      <p class="seo-ctas">${cta('Set up your chapter', '/#/teacher')}${cta('See all events', '/hosa-events/', true)}</p></section>
    <section class="seo-section"><h2>What advisors get</h2><ul class="seo-features">${items.map(([h, p]) => `<li><h3>${h}</h3><p>${p}</p></li>`).join('')}</ul></section>
    <section class="seo-section"><h2>Getting your school started</h2><ol class="seo-steps">
      <li><strong>Create a teacher account</strong> with Google or email.</li>
      <li><strong>Share your chapter password</strong> with your students.</li>
      <li><strong>Students choose their events</strong> and start the lessons and practice tests.</li>
      <li><strong>Assign and track</strong> work from your dashboard through competition season.</li></ol></section>
    ${disclaimer}`;
  return { url, html: page({ url, title: 'Free HOSA Chapter Tools for Schools & Advisors | Valus', description, body, current: url, schema: [crumbs(list)] }) };
}

function aboutPage() {
  const url = '/about/', list = [['Valus', '/'], ['About', url]];
  const description = 'Valus is a free study space for high school students competing in HOSA–Future Health Professionals. Our mission: support every future health professional at no cost.';
  const body = `${crumbNav(list)}
    <section class="seo-hero"><p class="eyebrow">What is Valus?</p><h1>Free preparation for every HOSA student</h1>
      <p class="seo-lede">Valus is a study space for high school students competing in HOSA–Future Health Professionals. Our mission is simple: support every competitor, wherever they’re from, at no cost.</p>
      <p class="seo-ctas">${cta('Start studying free', '/#/start')}</p></section>
    <section class="seo-section"><h2>Our principles</h2><ul class="seo-features">
      <li><h3>Free, always</h3><p>Every lesson, practice set, and study tool for students is free. No premium tier, no paywall between you and your event.</p></li>
      <li><h3>Built for one event</h3><p>HOSA students compete in one event a year. Valus is shaped around that single focus instead of spreading you thin.</p></li>
      <li><h3>For every chapter</h3><p>Instructors get assignments, progress views, and a private chapter space at no cost, so any school can take part.</p></li></ul></section>
    <section class="seo-section"><h2>Why it matters</h2><p>Some chapters have years of study materials and experienced advisors. Others are starting from scratch. Valus exists so that a future health professional’s preparation depends on their effort, not their budget.</p>
      <p>Lessons and practice tests are written for Valus from the references named in each event’s official guidelines, with openly licensed textbook material such as OpenStax where it helps.</p></section>
    ${disclaimer}`;
  return { url, html: page({ url, title: 'About Valus: Free HOSA Study Resources for Every Student', description, body, current: url,
    schema: [crumbs(list), { '@type': 'AboutPage', name: 'About Valus', url: SITE + url, about: { '@id': SITE + '/#org' } }] }) };
}

// ---------- Write pages, sitemap and robots.txt ----------
const pages = [hubPage(), resourcesPage(), schoolsPage(), aboutPage(), ...events.map(eventPage)];
rmSync(path.join(dist, 'hosa-events'), { recursive: true, force: true });
for (const p of pages) {
  const dir = path.join(dist, ...p.url.split('/').filter(Boolean));
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'index.html'), p.html);
}

// lastmod only moves when a page's content changes, which is what Google asks for.
const today = new Date().toISOString().slice(0, 10);
const previous = existsSync(lastmodFile) ? JSON.parse(readFileSync(lastmodFile, 'utf8')) : {};
const homeHash = createHash('sha1').update(readFileSync(path.join(dist, 'index.html'))).digest('hex');
const entries = [{ url: '/', hash: homeHash }, ...pages.map(p => ({ url: p.url, hash: createHash('sha1').update(p.html).digest('hex') }))];
const next = {};
for (const e of entries) next[e.url] = previous[e.url]?.hash === e.hash ? previous[e.url] : { hash: e.hash, lastmod: today };
writeFileSync(lastmodFile, JSON.stringify(next, null, 2) + '\n');

writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url><loc>${SITE + e.url}</loc><lastmod>${next[e.url].lastmod}</lastmod></url>`).join('\n')}
</urlset>
`);
writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`);
console.log(`Wrote ${pages.length} pages and sitemap.xml with ${entries.length} URLs.`);
