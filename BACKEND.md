# Valus backend

The static site in `dist/` and a single serverless function in `api/index.js` deploy together on Vercel. `vercel.json` rewrites every `/api/*` request to that function, and `server/app.js` routes it. Data lives in Turso. Accounts are Firebase Authentication. The server verifies each Firebase ID token with the Admin SDK and checks for revoked tokens.

## Setup

The `jwks-rsa` dependency uses a CommonJS-compatible `jose` 5.10.0 override.
Firebase Admin 14's default `jose` 6 dependency crashes during function startup
in Vercel's loader (`ERR_REQUIRE_ESM`), including on public `/api/config` requests.
Keep the override until the upstream dependency works with that loader; the
authentication runtime test checks startup with synchronous ESM loading disabled.

1. `npm install`
2. Copy `.env.example` to `.env` and fill it in. Locally, leave `TURSO_DATABASE_URL` unset to use a file database in `.data/`.
3. `npm run communities:check` confirms every community password is set.
4. `npm run dev` serves the site and the API at http://127.0.0.1:4173. Run `npm test` to run the tests.
5. On Vercel, add the same variables under Project > Settings > Environment Variables, then deploy. Tables are created automatically on the first request.

Turso: `turso db create valus`, then `turso db show valus --url` and `turso db tokens create valus`.
Firebase Storage (ranked skill and online submission uploads): upgrade the Firebase project to the Blaze plan, open Build > Storage and create the default bucket, then paste `storage.rules` from this repo into Storage > Rules and publish. Set `FIREBASE_STORAGE_BUCKET` to the bucket name (for example `your-project.firebasestorage.app`). Browsers upload straight to Firebase; the server only checks each file exists and was made during the student's session, and gives teachers 15-minute viewing links signed with the service account key. Set a budget alert in Google Cloud billing.

Firebase: enable the **Google** and **Email/Password** sign-in providers (Authentication > Sign-in method). Students and teachers can make an account with either. Download a service account key (Project settings > Service accounts) for the three `FIREBASE_*` Admin settings. Add your Vercel domain under Authentication > Settings > Authorized domains.

## Communities

Communities are listed in [`communities.json`](communities.json), which is committed. It holds public names and IDs, plus the **names** of the environment settings that contain the passwords. It never holds the passwords themselves.

```json
{
  "id": "ppchs",
  "name": "Pembroke Pines Charter High School",
  "studentPassword": { "env": "PPCHS_STUDENT_PASSWORD" },
  "instructorPassword": { "env": "PPCHS_INSTRUCTOR_PASSWORD" }
}
```

- Each community has its own student password and its own instructor password. They must be different from each other, and no two communities may share a student password.
- Enrollment: the login pages have a **Create account** tab and a **Sign in** tab. Creating an account makes the Firebase user (Google, or first name, last name, email and password) and then calls `POST /api/auth/register` with `{ role, communityId, password, firstName, lastName }`. If the community password is wrong, the brand-new Firebase user is deleted again.
- Students do not choose a school: their student password identifies it (which is why student passwords must be unique). Teachers choose their school from a dropdown and must give that school's teacher password. Each account holds one role in one community.
- Wrong guesses are limited to 10 per account and 40 per network address every 15 minutes.
- To change a password, update the setting in Vercel and redeploy. Existing members stay enrolled; the shared password only gates joining.
- To add a community, add an object with a new lowercase `id`, set its two settings, and deploy. Keep existing IDs unchanged, because memberships reference them.

## API

All routes except `health`, `config`, `communities` and `hal` need `Authorization: Bearer <Firebase ID token>`.

| Route | Who | Purpose |
| --- | --- | --- |
| `GET /api/health` | anyone | Service health check |
| `POST /api/hal` | anyone, rate limited | Mr. DNA study chat through Valus AI |
| `GET /api/config` | anyone | Firebase web config and the public community list |
| `GET /api/communities` | anyone | `[{ id, name }]` |
| `POST /api/auth/register` | signed in | Join a community as a student or instructor |
| `GET /api/me`, `PATCH /api/me` | signed in | Profile (`enrolled: false` before joining); rename |
| `PUT /api/me/event` | student | Set or replace the selected event; explicit `null` clears it |
| `GET /api/rankings` | enrolled member | Global student names and selected events; no email, private IDs, or fabricated scores |
| `GET /api/students` | instructor | Roster with event, lesson progress, last quiz score |
| `PATCH /api/students/:uid` | instructor | Change a student's event |
| `DELETE /api/students/:uid` | instructor | Remove a student's enrollment (their progress is kept) |
| `GET`, `POST /api/assignments` | member / instructor | Students see community-wide assignments plus those for their event |
| `PATCH`, `DELETE /api/assignments/:id` | instructor | Edit or delete |
| `GET /api/assignments/:id/submissions` | instructor | Responses |
| `PUT /api/assignments/:id/submission` | student | Submit or update a response |
| `GET`, `POST /api/posts` | member | Private community feed (`?before=` to page) |
| `DELETE /api/posts/:id` | author or instructor | Remove a post |
| `GET /api/progress` | member | Completed lessons and quiz history |
| `PUT /api/progress/lessons/:lessonId` | member | Mark a lesson complete |
| `POST /api/progress/quizzes` | member | Record a quiz score `{ score }` |

Errors are always `{ "error": "message" }`. The message is safe to show to users.

## Online Upload Grader

Each online-submission event's **Online Upload Grader** tool lets a student (or teacher) upload a PDF, images or a short video (up to 3 files, 14 MB in total), add a public YouTube link, and/or paste written work. Files upload straight to Firebase Storage under `grader/{uid}/` (see `storage.rules`). `POST /api/grader` reads them, sends them inline to Gemini with the event's official guideline text from `dist/rules/*.pdf.txt` (which contains the rating sheets), checks the JSON it returns, saves the grade in `grader_attempts`, and deletes the uploaded files. The score is the points awarded over the points possible for criteria that can be judged from the upload; live-judged criteria are shown but not counted. The result lists where to improve, missing required items, and an improved version that uses placeholders instead of invented data or citations.

Each account gets 10 grades per 24 hours across all three graders; failed grades do not count. `GET /api/grader?event=&mode=` lists past grades (`mode` is `upload`, `speech` or `video`) and `GET /api/grader/attempts/:id` returns one. `vercel.json` gives the API function 300 seconds and bundles the guideline text files.

## Speech Grader and Skills Video Grader

The **Speech Grader** (speech and presentation events) and **Skills Video Grader** (skill events) take one video up to 1 GB (MP4, MOV or WEBM) or a public YouTube link. For skills, the student can name the skill; otherwise Valus AI matches the video to a skill rating sheet. Gemini scores every item on the rating sheet, gives timestamps (in the student's video) where each item was earned or lost, a timeline of key moments, the video length against the time limit, strengths and where to improve. On the result page, timestamps jump the student's video (or the YouTube player) to that moment.

A YouTube link is graded in one request. A video file is too large to send inline, so `POST /api/grader` streams it from Firebase Storage to Gemini's file service, deletes the Storage copy, and returns `202` with a job. The page then calls `POST /api/grader/jobs/:id` every 5 seconds while it is open; once Google has processed the video, that call grades it and removes the Gemini copy (Gemini also deletes files after 48 hours). A job left unfinished is picked up again when the student returns to the page. Job state lives in the `grader_jobs` side table. Uses `GEMINI_API_KEY` and `GEMINI_UPLOAD_MODEL` (falls back to `GEMINI_GRADING_MODEL`, then `GEMINI_MODEL`). After deploying, paste the updated `storage.rules` into Firebase Storage > Rules and publish.

## HOSA Bowl Game

The arena uses the bundled Three.js renderer for a procedural 3D room with
human and robot characters, chairs, desks, a moderator, lighting and a live
scoreboard. Drag to orbit, scroll to zoom, use camera presets, or click an
eligible desk buzzer. The ordinary Buzz In button remains keyboard accessible.
The game scene uses original locally drawn ink portraits on articulated
character rigs, stepped cel shading and dark outlines. The surrounding Valus
website retains its existing theme; game art changes must not restyle the site.
The renderer caps resolution and frame rate, suspends offscreen work, respects
reduced motion, and disposes resources on route changes. WebGL failure leaves
the regular game controls usable. No external 3D assets are loaded.

Enable sound to hear questions through browser speech synthesis. Moderator and
robot roles select different installed voices when available, preferring natural
or enhanced voices. Both use unmodified pitch and conversational pacing. Devices
with only one voice use that voice for both roles. Voice selectors and a
lobby preview are provided. The server schedules a separate robot answer phase
and only reveals the robot's spoken answer after it buzzes. Muting is local to
each player and never changes shared timing.
The moderator prefers an available lower-register host voice and uses measured
delivery at 0.94x speed with unmodified pitch. This is a generic quiz-show voice.

Voice answers require explicit microphone opt-in. The permission-check stream
closes immediately. Browser SpeechRecognition then listens while that player
owns the buzzer; the first final transcript is submitted, or the latest interim
transcript just before the five-second deadline. Leaving the answer window,
typing a submission, hiding the page, disabling the microphone, or leaving the
route aborts recognition. Unsupported browsers and permission failures keep
typed answers available. Some browsers process speech through an online service;
the UI discloses this before enabling it. Valus receives answer text, not audio.
Recognition and voices vary by browser/device; production microphone access
requires HTTPS (localhost works for development). This is not audio chat.

The HOSA Bowl event has a dedicated `#/event/HOSA%20Bowl/bowl` tool. Enrolled
students and instructors can host or join with a six-character code. The host
sets one of seven robot levels, starts the game, and ends it for everyone.
Up to four accounts join the human team; the host covers unfilled seats. Seats
are drawn at start. The eight-minute normal phase rotates A/B/C/D; the final
two minutes allow any seat to buzz. Questions use progressive text reading,
five-second buzz and response windows, one-point scoring, and opponent rebounds.
The game bank combines 65 original short-answer prompts with all 300 questions
from the six HOSA Bowl practice tests, for 365 entries. Practice questions are
imported directly from their existing files and retain their choices in the
spoken/displayed prompt; either the correct option text or letter is accepted.
Practice-test content and grading are unchanged. Existing bank IDs remain stable;
new games shuffle the entire combined bank (existing rooms retain their decks).
Matches use at most 50 questions; ties receive
five more. A remaining tie is a draw because written-test seeding is not simulated.

`POST /api/bowl` creates a game with `{level}`. `GET /api/bowl/:code` returns
the member-visible state. `POST /api/bowl/:code/:action` supports `join`, `start`,
`level`, `buzz`, `answer`, `leave`, and `end`. Buzz requests include the
zero-based `question` and `seat`; answer requests include `question` and `answer`.
Only the buzzer owner can answer. Answer keys and planned robot outcomes remain
server-side. Short answers use normalized explicit aliases, not AI grading.

Rooms persist in the existing Turso database with two-hour expiry. Atomic
version-checked updates arbitrate simultaneous actions across Vercel instances.
Clients poll every 750 ms after the prior response; this provides near-real-time
updates without a WebSocket service. Network and database latency affect buzzer
arrival, so this is a practice simulator, not an official tournament system.
Deadline catch-up preserves the match clock if all clients disconnect. Returning
to the tab restores the saved game code for that account; leaving explicitly
reassigns a guest's seats to the host. Leaving as host ends the game.
Expired rooms are cleaned up on subsequent creation. No new environment
variables or external services are required; deploy the static and API changes
together using the existing Vercel workflow. Schema creation is automatic.

## Chapter attendance

Attendance is available to students and teachers at `#/attendance` through the dashboard navigation on the right. It is not added to the public top navigation. The feature uses Valus's existing colors, typography, frosted panels, and medical backgrounds. Mobile users open the dashboard menu to find Attendance.

Teachers create dated events with a name, location, and opening/closing time (up to 24 hours, displayed in the teacher's browser time zone). Each event gets an independent eight-character attendance code and a snapshot of the current chapter student roster. Teachers can copy/rotate codes, cancel an event, permanently delete an event with confirmation, view chapter members online, review per-student and per-event attendance, and export roster attendance as CSV. Deleted events and their records disappear from schedules and analytics. Cancelled and upcoming events do not affect attendance rates.

Students see their events, recorded check-ins, upcoming dates, and attendance rate. Check-in requires an authenticated student account, saved roster membership, the current code, the server's check-in window, and a fresh, precise browser location within 804.672 meters (0.5 mile), including reported uncertainty. Samples must be no older than 60 seconds and accuracy must be 200 meters or better. Duplicate submissions count once. The server stores the check-in time, distance, and accuracy, not exact student coordinates. Browser location can be spoofed; this proximity check does not prove physical presence. Production location permission requires HTTPS.

The map popup uses bundled Leaflet and attributed OpenStreetMap tiles; placing a pin or selecting the teacher's current location requires no API key. Set the server-only `GEOAPIFY_API_KEY` in `.env` and deployment environment settings to enable the address search bar. Get a free-tier key from [Geoapify](https://www.geoapify.com/geocoding-api/). Address search reports missing setup clearly while pin selection remains usable. OpenStreetMap tiles are subject to the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/); use an appropriate hosted provider if traffic grows.

Online status uses a 30-second heartbeat from visible signed-in tabs and expires after 90 seconds. Presence never requests location. Student records are private to their chapter; students cannot view other students' attendance or the event code through the API. Attendance tables are created automatically with the existing schema initializer. No existing attendance or learning data needs migrating.

API: `GET/POST /api/attendance`, `POST /api/attendance/check-in`, `PATCH/DELETE /api/attendance/:id`, `GET /api/attendance/locations?q=`, and `POST /api/presence`. The existing Firebase token and active-community checks protect every route. Students cannot create, change, or delete events.

Run `npm test` for the attendance API checks. `scripts/check-attendance-ui.mjs` checks both roles with a temporary database, synthetic local sign-in, real attendance endpoints, browser geolocation, maps, CSV export, deletion, both themes, and mobile layouts. Set `PLAYWRIGHT_ENTRY` to an installed Playwright module path; no production account or database is used.
