# Valus

Valus is a free study and chapter-management website for high school students preparing for HOSA–Future Health Professionals. Students choose an annual event, work through starter lessons, practice, track progress, and communicate with their school chapter. Instructors manage students and assignments in the same application.

Valus is an independent project and is not affiliated with or endorsed by HOSA. The current interface presents the 2026–27 secondary-division catalog. Students should confirm requirements with their advisor and the current official event guidelines.

## What is implemented

- Public landing page, mission page, searchable event catalog, and rankings preview.
- Student and instructor accounts through Google or email/password.
- Password-gated school enrollment, with separate student and instructor passwords.
- All 64 regular secondary event cards directly in My event, with search, category and format filters.
- One selected event per student; students and instructors can change or clear it. Selection feeds the teacher roster, event assignments, and the signed-in global event directory.
- Event pages replace the dashboard sidebar with a right-side toolkit. Rules pages include local official guideline PDFs; Lessons opens event-specific units, activities, and checkpoints.
- Three shared orientation lessons, a practice check, account-specific notes, and a preparation checklist.
- Assignments for an entire chapter or a particular event, plus student responses.
- Chapter posts, instructor roster management, and progress analytics.
- Mr. DNA, an animated study companion with optional Valus AI chat.
- Light/dark appearance, reduced-motion support, a live bloodstream hero, and a cellular atlas.

The rankings pages display students and selected events to signed-in members. There are nine displayed tiers, but no live ranked assessments, ranking points, or competitive scores. Event tools are Coming soon. Existing orientation progress is preserved. Assignment types are labels; selecting “Quiz” or “Skill checklist” does not generate a separate assessment engine. See HOSA_EVENT_RESEARCH.md for the source and tool mapping for every event.

## Rich lesson courses

The rich curriculum includes Pharmacology, Pathophysiology, Behavioral Health, Biomedical Equipment Technician, Dental Terminology, Nutrition, Medical Terminology, Health Informatics, Healthcare Administration, and Human Growth & Development. The five newest courses each contain ten lessons with eight multiple-choice questions and a rubric-based written response per lesson. Their topic coverage follows the linked 2026–27 HOSA test plans; the lessons supplement the official references listed in those guidelines.

Lessons are authored in `dist/rich/` and loaded through `dist/rich/index.js`. Shared diagrams, animations, sorting, matching, and sequencing live in `dist/lesson-widgets.js`; subject models live in `dist/lesson-labs.js`. Supplemental textbook figures retain their attribution in the lesson viewer. Activities support touch/click and keyboard input as well as dragging, and animations respect reduced-motion preferences. Checkpoints retain the existing optional practice and instructor-assignment behavior. Written responses use the server-side Valus AI grader.

Run `npm test` for curriculum, grading, and API checks. `scripts/check-rich-ui.mjs` runs an isolated browser check with a synthetic local account; set `PLAYWRIGHT_ENTRY` to the installed Playwright module before running it. It checks all fifty new lesson pages on a mobile viewport and exercises the shared interactive models without using production accounts or AI requests.

## Run locally

Use Node.js 22.9 or newer and npm. Run commands from the repository root.

```powershell
npm install
Copy-Item .env.example .env
# Fill in .env with your own settings.
npm run communities:check
npm run dev
```

Open <http://127.0.0.1:4173>. `npm start` runs the same server. To use another port, set `PORT` before starting it.

The server serves `dist/` directly and routes `/api/*` to the backend. Despite its name, `dist/` contains the maintained frontend source. There is no bundler or build step; edit those files directly. Opening `index.html` from the filesystem will not provide a working API or sign-in flow.

Without a Turso URL, local development creates a file database in `.data/`. The local database filename is `valus.db`. Existing local data is retained during the branding change. The startup command reads `.env`; it does not automatically load `.env.local`.

Public pages can render without account configuration. Sign-in requires Firebase settings, enrollment requires community passwords, and Mr. DNA chat and written-response grading require an AI provider key (`GEMINI_API_KEY`).

## Configuration

Use `.env.example` as the template. Never commit real credentials or community passwords.

| Setting | Purpose |
| --- | --- |
| `PORT` | Optional local HTTP port; defaults to `4173` |
| `TURSO_DATABASE_URL` | Hosted database URL; omit locally to use the file database |
| `TURSO_AUTH_TOKEN` | Required for a hosted database |
| `FIREBASE_PROJECT_ID` | Firebase project used by both the server and public web configuration |
| `FIREBASE_CLIENT_EMAIL` | Firebase service-account email; server only |
| `FIREBASE_PRIVATE_KEY` | Service-account private key; server only; literal `\n` sequences are converted to newlines |
| `FIREBASE_WEB_API_KEY` | Public Firebase web configuration |
| `FIREBASE_AUTH_DOMAIN` | Public Firebase Authentication domain |
| `FIREBASE_APP_ID` | Public Firebase web application ID |
| `GEMINI_API_KEY` | Server-only AI provider credential for Valus AI (Mr. DNA chat and grading) |
| `GEMINI_MODEL` | Chat model; the code default is `gemini-3.5-flash-lite` |
| `PPCHS_STUDENT_PASSWORD` | Current community's shared student enrollment password |
| `PPCHS_INSTRUCTOR_PASSWORD` | Current community's shared instructor enrollment password |

The AI model identifier is the application's configured default, not a guarantee of provider availability. Change it to a model available to your project if necessary.

In Firebase, enable Google and Email/Password authentication, register the site's authorized domains, and supply the service-account settings. Public Firebase web settings are returned by `/api/config`; the private key, database token, AI provider key, and enrollment passwords remain on the server.

### School communities

`communities.json` stores public IDs/names and the environment-variable **names** containing passwords. It does not store the actual passwords.

```json
{
  "id": "ppchs",
  "name": "Pembroke Pines Charter High School",
  "studentPassword": { "env": "PPCHS_STUDENT_PASSWORD" },
  "instructorPassword": { "env": "PPCHS_INSTRUCTOR_PASSWORD" }
}
```

To add a school, add an entry with a unique lowercase ID, add its two environment settings, and run `npm run communities:check`. Student passwords must be unique across schools; each school's student and instructor passwords must differ. Keep existing school IDs stable because database memberships reference them.

Students enter a shared student password that identifies their school. Instructors select a school and enter its instructor password. These shared enrollment passwords are separate from personal Firebase account passwords. Updating a shared password affects future enrollment, not existing memberships. Removing a school from the catalog blocks its members from protected community features without deleting their data.

## Project structure

| Path | Responsibility |
| --- | --- |
| `dist/index.html` | Document shell, metadata, styles, theme initialization, and analytics script |
| `dist/app.js` | Hash routing, page rendering, forms, dialogs, API cache, notes, and practice logic |
| `dist/model.js` | Event categories/catalog, rank names, and starter lessons/questions |
| `dist/session.js` | Firebase browser SDK loading, account creation, sign-in, profile state, and API requests |
| `dist/landing.js` | Scroll reveals, public-page interactions, and animation lifecycle |
| `dist/bloodstream.js` | WebGL bloodstream rendering and fallback behavior |
| `dist/cellular.js` | Procedural cellular specimens and atlas presentation |
| `dist/hal.js` | Mr. DNA interactions, chat UI, conversation state, and local preferences |
| `dist/hal-motion.js`, `dist/hal-character.js` | Companion movement/state logic and SVG artwork |
| `dist/*.css`, `dist/assets/` | Layered appearance, fonts, icons, and reference images |
| `server.mjs` | Local HTTP server for static files and the API |
| `server/app.js` | API routing, validation, permissions, and application behavior |
| `server/auth.js` | Firebase Admin token verification |
| `server/db.js` | libSQL client, schema, and schema initialization |
| `server/communities.js` | Community configuration, password validation, and comparisons |
| `server/hal.js` | Valus AI request/response validation and study-chat behavior |
| `server/http.js` | JSON request/response helpers and safe error handling |
| `api/index.js` | Vercel serverless entry point with a reused application instance |
| `vercel.json` | Static output directory, API rewrites, and response headers |
| `scripts/check-communities.mjs` | Community/password configuration check |
| `tests/` | API, catalog, authentication runtime, and companion tests |
| `outputs/` | Historical design notes and screenshots; not served as the website |

## Pages and navigation

The frontend is a vanilla JavaScript single-page application using URL hashes. Navigation changes the hash, and `render()` selects a page. Public-page animation cleanup runs before switching views.

| URL hash | Page |
| --- | --- |
| `#/` | Landing page, event introduction, study preview, and biological visuals |
| `#/mission` | Mission and project explanation |
| `#/events` | Event search/category filters and annual-event selection |
| `#/start` | Student/instructor entry choice |
| `#/student` | Student account entry or enrolled student overview |
| `#/teacher` | Instructor account entry or enrolled instructor overview |
| `#/my-event` | Student event, lessons, preparation checklist, practice, and notes |
| `#/students` | Instructor student directory and management |
| `#/assignments` | Chapter/event assignments and submissions |
| `#/analytics` | Individual or chapter progress summaries |
| `#/community` | Private school feed |
| `#/leaderboard` | Public rankings preview |
| `#/rankings` | Signed-in rankings preview |

Legacy public `#/about` and `#/instructors` routes are also handled by the renderer. Workspace routes redirect users who are not enrolled; role-specific routes also check the current profile. Backend authorization remains the authority for data access.

## How the main logic works

### Accounts and enrollment

1. The browser fetches `/api/config`, then loads Firebase's browser SDK from Google's CDN.
2. Firebase handles Google or email/password sign-in. Password resets use Firebase as well.
3. The browser attaches the Firebase ID token as `Authorization: Bearer <token>` on API requests when signed in.
4. The server verifies the token with Firebase Admin, including revocation checks. `/api/me` returns the database enrollment/profile.
5. Creating an account also calls `/api/auth/register` with the selected role, names, and shared school password. Failed enrollment attempts cause a newly created Firebase user to be deleted; existing Google accounts are not deleted.
6. One Firebase user has one application role and one school enrollment. Enrollment attempts are limited to 10 per account and 40 per network address in a 15-minute window.

### Annual events and learning

The event catalog has five categories in `dist/model.js`. A student's first selection is stored on their profile with a timestamp. Re-selecting the same event is allowed; changing to a different event requires an instructor from the same school.

The three starter lessons are shared across events. Completion is recorded once per account/lesson, and percentage completion is `round(completed lessons / total lessons × 100)`. Practice presents each lesson's question, shows feedback, and records `round(correct answers / question count × 100)`.

Practice answers and explanations are shipped in the frontend model. The quiz endpoint validates a submitted score's range but does not independently grade answers. These are self-practice results, not secure ranked assessments.

### Assignments and community

Instructors create, edit, or delete assignments for their school. A blank event targets the whole chapter; an event-specific assignment is visible to students with that annual event. Students submit or update a text response, and instructors view responses. Deleting an assignment also deletes its submissions.

Community posts are scoped to the enrolled school. Members may post; an author or an instructor from the same school may delete a post. The API returns up to 30 posts at a time and supports a `before` cursor.

Removing a student deletes enrollment, not their Firebase account or learning history. Their existing lesson progress and quiz attempts can be available when they rejoin. Change the shared student password if the student should no longer be able to enroll again.

### Analytics and client state

Students see completed lessons and practice history. Instructors see a roster, average orientation completion, latest practice scores, and counts grouped by event. `/api/progress` returns the latest 50 practice attempts in chronological display order.

Server data is fetched on demand into an in-memory page cache. Mutations invalidate relevant cached resources; account changes clear cached state. Notes and preparation checklist items use browser storage keyed by Firebase UID and remain on that browser/device. They do not sync to the database.

Theme and returning-visitor flags use `valus-` storage keys. Existing keys from the previous brand are migrated before theme initialization, preserving saved preferences, notes, and checklists on the same browser origin. Moving the website to a different domain does not transfer browser storage automatically.

### Mr. DNA

Mr. DNA roams, reacts, can be dragged/anchored, accepts apples, and can mute pep talks. Movement respects reduced-motion preferences. Companion preferences/position are stored locally under the existing `hal-` keys; internal file and function names retain `hal` to match this subsystem.

Chat posts to `/api/hal`. The server validates message/history size, resolves known event/lesson context, and sends the AI request without adding account identifiers. User-entered text and recent conversation still go to the provider. Requests include at most 12 history turns, a 1,000-character new message, and a 25-second timeout.

The reply is structured as text, mood, verdict, and whether the student should explain their reasoning. The server normalizes the mood and “why” state: correct reasoning gets positive feedback; incorrect explanations get another hint, and after three misses the intended routine explains the reasoning and moves on. The browser also reacts when the student leaves a reasoning prompt unanswered for a minute.

Visitors can use chat without signing in. A best-effort, per-process limiter allows 30 messages per network address in 10 minutes; it is not a shared global limit across serverless instances. Conversations are not written to the application database. The server prompt limits the subject to studying and directs personal medical concerns to an adult or clinician.

### Visual behavior

The custom SVG wordmark spells `valus`. CSS files are loaded in order, allowing later biology/organism styles to override the base system. Landing interactions mount and clean up the bloodstream and cellular visuals. The hero provides a motion toggle and a fallback if WebGL is unavailable. Biological forms are illustrative, not diagnostic or strictly to scale; see [BLOODSTREAM_MODELS.md](BLOODSTREAM_MODELS.md) for model notes and references.

## Database

The database uses libSQL: a local SQLite file during development or a hosted Turso database in production. Tables and indexes are created with `IF NOT EXISTS` on the first database-backed request and initialization is cached per database client. There is no separate migration runner; future column/constraint changes need an explicit migration plan.

| Table | Stored data |
| --- | --- |
| `users` | Firebase UID, email, display name, role, school ID, and annual event |
| `assignments` | School/event scope, title/type, instructions, due date, and creator |
| `submissions` | One current text response per assignment/student |
| `posts` | School feed messages and author IDs |
| `lesson_progress` | One completion per account/lesson |
| `quiz_attempts` | Practice percentages and timestamps |
| `enrollment_limits` | Hashed enrollment throttle keys, counts, and expiration |

Communities are configuration, not database records. School separation and role checks are enforced in backend handlers. Authentication credentials are managed by Firebase, not stored as passwords in these tables.

## API reference

All paths below start with `/api`. Public endpoints are `/health`, `/config`, `/communities`, and `/hal`; others require a verified Firebase token. Most protected routes additionally require active school enrollment.

| Method and path | Access / behavior |
| --- | --- |
| `GET /health` | Public service health response |
| `GET /config` | Public Firebase web settings and community names/IDs |
| `GET /communities` | Public community names/IDs |
| `POST /hal` | Public, rate-limited study chat |
| `POST /auth/register` | Authenticated account joins a community |
| `GET /me` | Authenticated account's enrollment/profile |
| `PATCH /me` | Enrolled member changes display name |
| `PUT /me/event` | Student chooses their annual event |
| `GET /students` | Instructor reads their school roster |
| `PATCH /students/:uid` | Instructor changes/clears a student's event |
| `DELETE /students/:uid` | Instructor removes student enrollment |
| `GET /assignments` | Member reads assignments visible to their school/event |
| `POST /assignments` | Instructor creates an assignment |
| `PATCH /assignments/:id` | Instructor updates an assignment |
| `DELETE /assignments/:id` | Instructor deletes an assignment and its submissions |
| `GET /assignments/:id/submissions` | Instructor reads assignment responses |
| `PUT /assignments/:id/submission` | Student submits/updates a response |
| `GET /posts` | Member reads school feed; optional `?before=` cursor |
| `POST /posts` | Member publishes a school post |
| `DELETE /posts/:id` | Author or same-school instructor removes a post |
| `GET /progress` | Member reads lesson completion and practice history |
| `PUT /progress/lessons/:lessonId` | Member records lesson completion |
| `POST /progress/quizzes` | Member records `{ "score": 0–100 }` |

Requests/responses use JSON except successful `204` deletions. Errors use `{ "error": "message" }`; unexpected internal details are withheld. The local raw request-body reader caps bodies at 64 KiB. Vercel pre-parses bodies before this helper, so production also depends on platform request limits.

## Deploy to Vercel

1. Connect the Valus GitHub repository to a Vercel project.
2. Keep the supplied `vercel.json`: `dist` is the static output, and `/api/*` rewrites to the single `api/index.js` function.
3. Configure a persistent hosted Turso database and set its URL/token in Vercel.
4. Add Firebase, AI provider (`GEMINI_*`), and community-password variables in Vercel's environment settings.
5. Add the deployed domain to Firebase Authentication's authorized domains.
6. Deploy, then verify the public pages, `/api/config`, sign-in/enrollment, assignments, and chat.

Do not use the local `.data/` file as production persistence on Vercel. Changing local branding does not automatically rename a Vercel project, change its domain, or update external Firebase/Turso resource names. The HTML includes Vercel Web Analytics' script; local development does not supply that platform endpoint.

`package.json` pins a `jose` 5.10.0 override under `jwks-rsa` for the Firebase Admin/Vercel loading compatibility described in [BACKEND.md](BACKEND.md). Keep it unless that compatibility has been revalidated.

## Checks and maintenance

```powershell
npm run check
npm test
npm run communities:check
```

- `check` parses the primary frontend/model/API modules.
- `test` uses Node's test runner to check API permissions and persistence, enrollment, model consistency, authentication module loading, and companion behavior. Tests use temporary databases and injected authentication/provider behavior rather than real user accounts.
- `communities:check` validates the real community configuration using your local environment.

When changing event/lesson definitions, update `dist/model.js` and review validation/progress assumptions on the server. When changing API behavior, keep this README, [BACKEND.md](BACKEND.md), and relevant tests aligned. Back up the database before structural changes. There is no production deployment or publishing step in the local branding edit itself.

## Search engine pages and sitemap

The app's `#/` routes are invisible to Google, so `npm run seo` (`scripts/build-seo.mjs`) generates real HTML pages from the course and practice-test data: `/hosa-events/` plus one page per event, `/free-hosa-study-resources/`, `/for-schools/` and `/about/`. It also writes `dist/sitemap.xml` and `dist/robots.txt` for `https://valus.app`. Re-run it after changing events, lessons or tests; `scripts/seo-lastmod.json` keeps each page's `lastmod` date unchanged unless its content changed.
