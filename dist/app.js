import {mountMedicalBackground} from './medical-background.js';
import {EVENTS,GROUPS,RANKS,LESSONS} from './model.js';
import {catalogCards,catalogToolbar,eventHref,parseEventRoute,eventWorkspace} from './event-workspace.js';
import {mountCourse,checkpointForm,mountCheckpoint} from './course-workspace.js';
import {testsReady,loadTests,mountPracticeTest,hasPracticeTests,practiceHref,practiceTestList,when as practiceWhen} from './practice-tests.js';
import {EVENT_DETAILS} from './event-details.js';
import {COURSES,courseLessons,findCourseLesson,courseReady,contentReady,loadCourse,loadAllCourses} from './courses.js';
import {initLanding} from './landing.js';
import {cellularAtlas} from './cellular.js';
import {mountHal} from './hal.js';
import {session,onSession,startSession,api,googleSignIn,emailSignIn,resetPassword,createAccount,enroll,setProfile,signOut} from './session.js';

const app=document.querySelector('#app'), modal=document.querySelector('#modal');
// The old browser-only demo kept everything here. Real data now lives on the server.
try{localStorage.removeItem('valus-state');}catch{}
let eventType='All',eventSaving=false;
let currentTab='Knowledge',assignmentFilter='All',eventFilter='All',eventSearch='',studentSearch='',busy=false,authError='',draft={};
// Returning visitors land on Sign in; everyone else starts on Create account.
const returning=()=>{try{return localStorage.getItem('valus-returning')==='1';}catch{return false;}};
let authTab=returning()?'signin':'create';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
const stamp=s=>new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric'});
const initials=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const icon=(name,cls='')=>'<svg class="icon '+cls+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+({
 arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',moon:'<path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11Z"/>',book:'<path d="M12 5v15M3 4c4-1 6 0 9 1 3-1 5-2 9-1v15c-4-1-6 0-9 1-3-1-5-2-9-1Z"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',check:'<path d="m5 12 4 4L19 6"/>',list:'<path d="M9 6h11M9 12h11M9 18h11M3 6h1M3 12h1M3 18h1"/>',chart:'<path d="M4 3v17h17M8 15V9m5 6V5m5 10v-5"/>',users:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m2 4c3 0 4 3 4 5v2"/>',trophy:'<path d="M7 3h10v5c0 7-10 7-10 0V3Zm0 2H3v3c0 3 3 4 5 4m9-7h4v3c0 3-3 4-5 4m-4 2v6m-4 1h8"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',plus:'<path d="M12 5v14M5 12h14"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',chevron:'<path d="m9 5 7 7-7 7"/>',search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',logout:'<path d="M9 4H4v16h5m4-8h8m-4-4 4 4-4 4"/>',message:'<path d="M4 4h16v12H9l-5 4V4Z"/>',spark:'<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',leaf:'<path d="M5 20C-1 7 9 2 21 3c0 13-6 18-13 15M5 20 16 9"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',trash:'<path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'
}[name]||'<circle cx="12" cy="12" r="8"/>')+'</svg>';
const googleMark='<svg class="g-mark" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.5z"/><path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.2A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.2-13.5-10l-7.9 6.2C6.6 42.6 14.6 48 24 48z"/></svg>';
const mark=()=>'<img src="assets/symbol.svg" alt="" class="brand-mark">';
const wordmark=()=>'<svg class="wordmark" viewBox="0 0 130 36" aria-label="valus" role="img"><g fill="none" stroke="currentColor" stroke-width="4.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18l8 12 8-12M46 30H33q-6 0-6-6t6-6h13v12M54 5v19q0 6 6 6h4M72 18v6q0 6 6 6h10V18M117 18h-15q-5 0-5 3t5 3h10q5 0 5 3t-5 3H97"/></g></svg>';
const logo=()=>'<a class="brand" href="#/" aria-label="Valus home">'+mark()+wordmark()+'</a>';
const themeButton=()=>'<button class="icon-button theme-toggle" data-action="theme" aria-label="Switch to '+(document.documentElement.dataset.theme==='dark'?'light':'dark')+' mode">'+icon(document.documentElement.dataset.theme==='dark'?'sun':'moon')+'</button>';
const button=(label,action,extra='',secondary=false)=>'<button class="button '+(secondary?'secondary':'')+'" data-action="'+action+'" '+extra+'>'+label+'</button>';
const linkButton=(label,href,secondary=false)=>'<a class="button '+(secondary?'secondary':'')+'" href="'+href+'">'+label+'<span class="button-tail">'+icon('arrow')+'</span></a>';
function toast(text){const t=document.querySelector('#toast');t.textContent=text;t.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('visible'),3800);}
function showModal(title,body){modal.classList.remove('modal-wide');modal.innerHTML='<div class="modal-head"><h2 id="modal-title">'+title+'</h2><button class="icon-button" data-action="close" aria-label="Close dialog">'+icon('close')+'</button></div>'+body;if(!modal.open)modal.showModal();}
const line=t=>'<span class="ln"><span>'+t+'</span></span>';
const split=(tag,lines,cls='')=>'<'+tag+' class="split '+cls+'">'+lines.map(line).join('')+'</'+tag+'>';
// Split CTA: an outlined label cell beside a solid red arrow cell.
const ctaBlock=(label,href)=>'<a class="cta-block" href="'+href+'"><span>'+label+'</span><i>'+icon('arrow')+'</i></a>';
const ghostNum=n=>'<span class="ghost-num" aria-hidden="true">'+String(n).padStart(2,'0')+'</span>';

// ---------- signed-in state ----------
const me=()=>session.profile;
const isInstructor=()=>me()?.role==='instructor';
const home=()=>isInstructor()?'#/teacher':'#/student';
const event=()=>EVENTS.find(e=>e.name===me()?.event);
const roleName=r=>r==='instructor'?'instructor':'student';
// Server data, fetched on demand and cleared whenever the account changes.
let cache={},errors={},pending={};
const loaders={
 courseProgress:()=>api('GET','/courses/progress'),
 rankings:()=>api('GET','/rankings').then(d=>d.students),
 progress:()=>api('GET','/progress'),
 assignments:()=>api('GET','/assignments').then(async d=>{if(d.assignments.some(a=>a.lessonId))await loadAllCourses({view:false});return d.assignments;}),
 posts:()=>api('GET','/posts').then(d=>d.posts),
 students:()=>api('GET','/students').then(d=>d.students),
 practice:()=>api('GET','/practice/attempts').then(d=>d.attempts),
};
// "student:<uid>" loads one student's analytics for their teacher.
const loaderFor=k=>loaders[k]||(k.startsWith('student:')?()=>api('GET','/students/'+encodeURIComponent(k.slice(8))+'/analytics').then(async d=>{await loadAllCourses({view:false});return d;}):null);
function need(...keys){let ready=true;for(const k of keys){if(k in cache)continue;ready=false;if(pending[k])continue;const uid=session.user?.uid;const request=loaderFor(k)().then(v=>{if(session.user?.uid!==uid)return;cache[k]=v;delete errors[k];},e=>{if(session.user?.uid!==uid)return;cache[k]=null;errors[k]=e.message;}).finally(()=>{if(pending[k]!==request)return;delete pending[k];render();});pending[k]=request;}return ready;}
const refresh=(...keys)=>{keys.forEach(k=>delete cache[k]);render();};
const loading=()=>'<div class="panel loading-panel"><span class="spinner" aria-hidden="true"></span><p>Loading your space…</p></div>';
const failed=k=>'<div class="empty"><h3>That did not load.</h3><p>'+esc(errors[k]||'Please try again.')+'</p>'+button('Try again','retry','data-key="'+k+'"',true)+'</div>';
// Notes and the prep checklist stay on this device for now, keyed to the account.
const localKey=k=>'valus-'+k+':'+(session.user?.uid||'');
const readLocal=(k,f)=>{try{return JSON.parse(localStorage.getItem(localKey(k)))??f;}catch{return f;}};
const writeLocal=(k,v)=>{try{localStorage.setItem(localKey(k),JSON.stringify(v));return true;}catch{return false;}};

// ---------- public pages ----------
function footer(){let n=0;const col=(h,links)=>'<div class="foot-col"><span class="micro">0'+(++n)+' / '+h+'</span>'+links.map(l=>l.includes('target="_blank"')?l.replace(' ↗','').replace('</a>','<span class="foot-arrow" aria-hidden="true">↗</span></a>'):l).join('')+'</div>';
 return '<footer class="footer"><div class="foot-top"><div class="foot-brand">'+logo()+'<p>A calm, focused study space for high school HOSA competitors. Free for every student.</p></div>'+
 col('Valus',['<a href="#/">Home</a>','<a href="#/mission">What is Valus?</a>','<a href="#/leaderboard">Global rankings</a>'])+
 col('Study',['<a href="#/student">Student login</a>','<a href="#/teacher">Teacher login</a>','<a href="#/events">Secondary events</a>'])+
 col('Free guides',['<a href="/hosa-events/">HOSA event study guides</a>','<a href="/free-hosa-study-resources/">Free HOSA resources</a>','<a href="/for-schools/">For schools</a>'])+
 col('Reference',['<a href="https://hosa.org/guidelines" target="_blank" rel="noreferrer">HOSA guidelines ↗</a>'])+
 '</div><div class="foot-bottom"><span class="micro">© 2026 Valus</span><span class="micro">Independent project · Not affiliated with HOSA–Future Health Professionals</span><span class="micro">Secondary division · 2026–27</span></div></footer>';}
function siteHeader(active=''){const nav=[['Home','#/','home'],['What is Valus?','#/mission','mission'],['Global rankings','#/leaderboard','rankings']];
 const actions=session.enrolled?'<a class="button login" href="'+home()+'">Open my space</a>':'<a class="login-link" href="#/student">Student<span class="login-word"> login</span></a><a class="button login" href="#/teacher">Teacher<span class="login-word"> login</span></a>';
 return '<header class="site-header">'+logo()+'<nav class="site-nav" aria-label="Main navigation">'+nav.map(([l,h,k])=>'<a href="'+h+'"'+(k===active?' class="current" aria-current="page"':'')+'>'+l+'</a>').join('')+'</nav><div class="header-actions">'+themeButton()+actions+'</div></header>';}
const BOARD=[
 ['HS-01','Health Science','Written test','Medical Terminology · Pharmacology · Pathophysiology','Deep, test-based knowledge. Build recall one body system at a time.'],
 ['HP-02','Health Professions','Test + skills','Nursing Assisting · Sports Medicine · Phlebotomy','A written test paired with hands-on skill stations judged on official rating sheets.'],
 ['EP-03','Emergency Preparedness','Scenarios','CPR/First Aid · EMT · Public Health','Calm, accurate steps under pressure, practised until they feel natural.'],
 ['LD-04','Leadership','Speaking & writing','Prepared Speaking · Interviewing Skills · Health Policy','Find your voice, then refine it with structured feedback.'],
 ['TW-05','Teamwork','Team events','HOSA Bowl · Biomedical Debate · Medical Innovation','Prepare together: shared study plans for the whole team.']];
function previewWindow(){const tabs=['Study','Practice','Progress','Chapter'];
 const pane=(k,body)=>'<div class="pw-pane'+(k==='Study'?' on':'')+'" data-pane="'+k+'">'+body+'</div>';
 return '<div class="preview-window" data-reveal><div class="pw-bar"><span class="pw-dots"><i></i><i></i><i></i></span><span class="micro">valus / study / nursing-assisting</span><span class="micro pw-tag">Preview</span></div>'+
 '<div class="pw-tabs" role="tablist"><span class="tab-ink" aria-hidden="true"></span>'+tabs.map((t,i)=>'<button role="tab" data-tab="'+t+'" class="'+(i?'':'on')+'" aria-selected="'+!i+'">'+t+'</button>').join('')+'</div><div class="pw-stage">'+
 pane('Study','<div class="pw-head"><span class="micro">Lesson 02 / 06 · 11 min</span><h4>Infection control</h4></div><ol class="pw-list"><li class="on"><small>01</small>Standard precautions<span>In progress</span></li><li><small>02</small>Hand hygiene techniques<span>4 min</span></li><li><small>03</small>Personal protective equipment<span>5 min</span></li></ol><div class="pw-foot"><div class="pw-meter"><span style="--v:68%"></span></div><span class="micro">68% of orientation path</span></div>')+
 pane('Practice','<div class="pw-head"><span class="micro">Quick check · 03 / 10</span><h4>Which step comes first?</h4></div><ol class="pw-list choice"><li><small>A</small>Put on gloves</li><li class="on"><small>B</small>Perform hand hygiene<span>Correct</span></li><li><small>C</small>Identify the patient</li></ol>')+
 pane('Progress','<div class="pw-head"><span class="micro">This week</span><h4>Small steps, every day.</h4></div><div class="pw-bars">'+[38,52,34,66,58,80,90].map((h,i)=>'<span style="--h:'+h+'%"><i></i><small>'+'MTWTFSS'[i]+'</small></span>').join('')+'</div>')+
 pane('Chapter','<div class="pw-head"><span class="micro">Your school · Members only</span><h4>Around your chapter</h4></div><div class="pw-post"><span class="avatar">IN</span><div><strong>Your instructor <small class="micro">Instructor</small></strong><p>Skills lab is Thursday after school. Bring your event guidelines.</p></div></div>')+
 '</div></div>';}
function landing(){
 return siteHeader('home')+`<main id="main" class="landing home-editorial">
 <section class="hero organism-hero">
   <div class="organism-intro"><span class="organism-eyebrow">A home for future health professionals</span><h1>Made of<br><span>curiosity.</span></h1><p>For the questions that keep you up.<br>The people you’ll care for.<br>And the person you’re becoming.</p><a class="entry-link" href="#/start">Find your place</a></div>
   <canvas class="sculpture" aria-label="Live 3D illustration of red cells, white cells, platelets, antibodies, and insulin moving through blood; molecules enlarged for visibility"></canvas><div class="hero-fallback" aria-hidden="true"></div>
   <div class="organism-bottom"><div class="blood-controls"><span class="blood-caption"><b>A little life. A lot of possibility.</b><small>Blood cells in motion · IgG and insulin enlarged</small></span><button class="motion-toggle" data-blood-pause aria-pressed="false">Pause motion</button></div><a href="#living-world" class="closer-link">Enter the living world <span aria-hidden="true">↓</span></a></div>
 </section>
 <section class="belief-strip"><p>The future of healthcare<br>has <span>you</span> in it.</p><div><span class="small-label">This is Valus.</span><p>A place to turn your interest in health into a little more confidence, every day. One event, your own pace, and your chapter beside you.</p><a href="#/mission">Meet Valus</a></div></section>
 ${cellularAtlas()}
 <section class="study-story" id="about"><div class="study-story-head"><span class="small-label">From curiosity to confidence</span><h2>Find your<br><span>rhythm.</span></h2><p>You don’t become ready all at once.<br>You get there one good session at a time.</p><a class="entry-link" href="#/student">Open your study space</a></div>
 <div class="study-sequence">
 <details class="study-step" open><summary><span class="step-number">01</span><h3>Follow the question.</h3><span class="step-toggle" aria-hidden="true">+</span></summary><div class="step-body"><p>Start with your event. Build understanding with focused lessons, clear explanations, and a path mapped to the official guidelines.</p><div class="lesson-sample"><span>In your notebook</span><strong>Infection control</strong><ul><li>Standard precautions <span>01</span></li><li>Hand hygiene <span>02</span></li><li>Protective equipment <span>03</span></li></ul></div></div></details>
 <details class="study-step"><summary><span class="step-number">02</span><h3>Put it into practice.</h3><span class="step-toggle" aria-hidden="true">+</span></summary><div class="step-body"><p>Turn reading into recall with quick checks, skill checklists, and reflection. Find out what you know—and what to come back to.</p><a href="#/student">Make time to practise</a></div></details>
 <details class="study-step"><summary><span class="step-number">03</span><h3>See yourself grow.</h3><span class="step-toggle" aria-hidden="true">+</span></summary><div class="step-body"><p>Keep your progress close. Follow completed lessons and share the journey with an instructor who knows where you’re headed.</p><a href="#/student">Take your next step</a></div></details>
 </div></section>
 <section class="event-orbit"><div class="event-orbit-heading"><span class="small-label">There is more than one way to care.</span><h2>What pulls<br><span>you in?</span></h2><a class="entry-link" href="#/events">Explore every event</a></div><div class="event-constellation">${BOARD.map((b,i)=>`<a href="#/events" class="event-node event-node-${i}"><span class="event-node-number">0${i+1}</span><strong>${b[1]}</strong><span class="event-node-desc">${b[2]}</span></a>`).join('')}</div></section>
 <section class="chapter-story" id="instructors"><div class="chapter-art"><p class="chapter-statement">Nothing<br>grows<br><span>alone.</span></p></div><div class="chapter-story-copy"><span class="small-label">The people beside you</span><h2>A chapter.<br>A connection.<br><span>A place to belong.</span></h2><p>Ask the question. Share the small win. Prepare with people who are finding their way, too.</p><div class="chapter-doors"><a href="#/student"><span>For students</span><strong>Find your people</strong></a><a href="#/teacher"><span>For instructors</span><strong>Help them grow</strong></a></div><p class="chapter-footnote">Private school spaces, shared updates, assignments, and progress in one place.</p></div></section>
 <section class="open-invitation"><span class="small-label">Your future is a living thing.</span><h2>Give it<br><span>room to grow.</span></h2><a href="#/start" class="invitation-button">Come on in</a><p>Free for every HOSA student.<br>No premium tier. No one left outside.</p><div class="invitation-wordmark" aria-hidden="true">${wordmark()}</div></section>
 </main>`+footer();
}
function eventCards(){return catalogCards({search:eventSearch,category:eventFilter,type:eventType,selected:me()?.event,canSelect:session.enrolled&&!isInstructor(),saving:eventSaving});}
function updateEventResults(){const target=document.querySelector('#event-results');if(target)target.innerHTML=eventCards();}

function heading(eyebrow,title,subtitle,action=''){return '<div class="page-heading"><div><span class="eyebrow">'+eyebrow+'</span><h1>'+title+'</h1><p>'+subtitle+'</p></div>'+action+'</div>';}
function eventsPage(){return siteHeader()+'<main id="main" class="catalog">'+heading('FIND YOUR FOCUS','There’s a place for your curiosity.','Explore all 64 regular secondary-division HOSA events and their preparation tools.')+catalogToolbar(eventSearch,eventFilter,eventType)+'<div class="event-catalog" id="event-results">'+eventCards()+'</div><p class="catalog-note">Based on HOSA’s 2026–27 guidelines. Recognition programs, academic testing-center events, and middle-school-only events are separate programs. Confirm eligibility with your advisor.</p></main>'+footer();}

function startPage(){return siteHeader()+'<main id="main" class="start-page"><span class="eyebrow">MAKE YOURSELF AT HOME</span><h1>Your next chapter<br><em>starts here.</em></h1><p>Make your account with Google or your email, and join your school with the password your chapter gave you.</p><div class="role-cards"><a href="#/student">'+icon('book')+'<h2>I’m a student</h2><p>Find your focus, practice, and connect with your chapter.</p><span>Student login '+icon('arrow')+'</span></a><a href="#/teacher">'+icon('users')+'<h2>I’m a teacher</h2><p>Guide your students and keep your chapter moving forward.</p><span>Teacher login '+icon('arrow')+'</span></a></div><small>No school password yet? Ask your HOSA advisor.</small></main>';}
function missionPage(){const pillars=[['Free, always','Every lesson, practice set, and study tool for students is free. No premium tier, no paywall between you and your event.'],['Built for one event','HOSA students compete in one event a year. Valus is shaped around that single focus instead of spreading you thin.'],['For every chapter','Instructors get assignments, progress views, and a private chapter space at no cost, so any school can take part.']];
 return siteHeader('mission')+'<main id="main" class="landing page">'+
 '<section class="page-hero"><div class="hero-meta"><span class="micro">Valus / Mission</span><span class="micro">What is Valus?</span></div>'+split('h1',['Free preparation','<b>for every <em>HOSA</em></b>','<b>student.</b>'],'duo')+
 '<div class="page-hero-side" data-reveal><p>Valus is a study space for high school students competing in HOSA–Future Health Professionals. Our mission is simple: support every competitor, wherever they’re from, at no cost.</p></div></section>'+
 '<section class="principles"><div class="section-label"><span class="micro">01 / Principles</span><span class="rule"></span></div><div class="principle-grid">'+pillars.map(([h,p],i)=>'<article data-reveal style="--d:'+(i*.08)+'s">'+ghostNum(i+1)+'<h3>'+h+'</h3><p>'+p+'</p></article>').join('')+'</div></section>'+
 '<section class="statement"><div class="section-label wide"><span class="micro">02 / Why it matters</span><span class="rule"></span></div>'+split('h2',['Talent is everywhere.','<b><em>Resources aren’t.</em></b>'],'duo')+'<div class="statement-side" data-reveal><p>Some chapters have years of study materials and experienced advisors. Others are starting from scratch. Valus exists so that a student’s preparation depends on their effort, not their budget.</p><div class="hero-cta">'+linkButton('Student login','#/student')+linkButton('Instructor login','#/teacher',true)+'</div></div></section>'+
 '<p class="fine-print micro">Valus is an independent project and is not affiliated with or endorsed by HOSA–Future Health Professionals.</p></main>'+footer();}
function rankingDirectory(){if(!session.enrolled)return '<p class="catalog-note"><a href="#/student">Sign in</a> to see students and their selected events.</p>';if(!need('rankings'))return loading();if(cache.rankings===null)return failed('rankings');return '<section class="panel rank-directory"><div class="panel-title"><h2>Students &amp; events</h2>'+button('Refresh','refresh-rankings','',true)+'</div><p class="subtle">Event selections across Valus. Ranked results are coming soon.</p>'+(cache.rankings.length?'<div class="table-scroll"><table><thead><tr><th>Student</th><th>Selected event</th><th>Rank</th></tr></thead><tbody>'+cache.rankings.map(s=>'<tr><td>'+esc(s.displayName)+(s.isYou?' <span class="badge">You</span>':'')+'</td><td><a href="'+eventHref(s.event)+'">'+esc(s.event)+'</a></td><td>Unranked</td></tr>').join('')+'</tbody></table></div>':'<div class="empty"><p>No students have selected an event yet.</p></div>')+'</section>';}
function rankingsBody(){return '<div class="ranking-layout"><section class="panel"><div class="panel-title"><h2>The leaderboard</h2></div><div class="empty">'+icon('trophy')+'<h3>No ranked results yet.</h3><p>The leaderboard fills in once ranked assessments open.</p></div>'+(session.enrolled&&!isInstructor()?'<div class="rank-you"><span>You · '+esc(me()?.event||'No event selected')+'</span><strong>Unranked</strong><small>Ranked assessments are not live yet.</small></div>':'')+'</section><aside class="panel rank-explainer">'+icon('trophy')+'<h2>Mastery comes first.</h2><p>Valus ranks follow your growth. Ranked scoring and fair comparisons between events will be added once the assessment system is ready.</p><p>Orientation lessons and repeated practice do not award ranking points.</p></aside><section class="panel full-width">'+panelTitle('The path ahead')+'<div class="rank-ladder">'+RANKS.map((r,i)=>'<div><span class="rank-diamond" style="--rank-hue:'+(i*32)+'">'+icon('spark')+'</span><strong>'+r+'</strong><small>'+(i===8?'TOP RANK':'I · II · III')+'</small></div>').join('')+'</div></section></div>'+rankingDirectory();}
function leaderboardPage(){return siteHeader('rankings')+'<main id="main" class="landing page public-ranks"><section class="page-hero compact"><div class="hero-meta"><span class="micro">Valus / Rankings</span><span class="micro">Iron → Radiant</span></div>'+split('h1',['Global <b><em>rankings.</em></b>'],'duo')+'<div class="page-hero-side" data-reveal><p>Nine tiers, earned through ranked assessments and compared within the same event.</p></div></section><div class="ranks-body">'+rankingsBody()+'</div></main>'+footer();}

// ---------- login ----------
// Two tabs: make an account (it joins the school in the same step) or sign in.
const field=(label,input)=>'<label class="field">'+label+input+'</label>';
const val=k=>esc(draft[k]??'');
// Students give only their community password: it names their school. Teachers choose the school too.
function schoolFields(role){const list=session.communities;
 if(role==='student')return field('Community student password','<input name="password" type="password" maxlength="256" required autocomplete="off" spellcheck="false" data-community>')+'<p class="auth-hint">Your HOSA advisor shares this password. It links your account to your school automatically.</p>';
 if(!list.length)return '<p class="auth-error">No school communities are open yet.</p>';
 return field('School community','<select name="communityId" required data-community><option value="">Choose your school</option>'+list.map(c=>'<option value="'+esc(c.id)+'"'+(draft.communityId===c.id?' selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select>')+
  field('Community teacher password','<input name="password" type="password" maxlength="256" required autocomplete="off" spellcheck="false" data-community>')+'<p class="auth-hint">You will be a teacher in this school community only.</p>';}
const nameFields=()=>'<div class="auth-pair">'+field('First name','<input name="firstName" maxlength="40" required autocomplete="given-name" value="'+val('firstName')+'">')+field('Last name','<input name="lastName" maxlength="40" required autocomplete="family-name" value="'+val('lastName')+'">')+'</div>';
const orLine=t=>'<div class="auth-or"><span>'+t+'</span></div>';
const errorSlot=()=>{const err=authError||session.error;return '<p class="auth-error" role="alert"'+(err?'':' hidden')+'>'+esc(err)+'</p>';};
function authTabs(){return '<div class="auth-tabs" role="tablist" aria-label="Account"'+(authSwap?' data-from="'+authSwap+'"':'')+'>'+[['create','Create account'],['signin','Sign in']].map(([k,l])=>'<button type="button" role="tab" data-action="auth-tab" data-value="'+k+'" aria-selected="'+(authTab===k)+'" class="'+(authTab===k?'on':'')+'">'+l+'</button>').join('')+'</div>';}
function createForm(role){const student=role==='student';
 return '<form id="create-form" data-role="'+role+'" class="auth-fields"><span class="auth-step micro">01 / YOUR SCHOOL</span>'+schoolFields(role)+
  '<span class="auth-step micro">02 / YOUR ACCOUNT</span><button type="button" class="button google" data-action="google-create">'+googleMark+'Create with Google</button>'+orLine('or use your email')+nameFields()+
  field('Email','<input name="email" type="email" maxlength="254" required autocomplete="email" value="'+val('email')+'">')+
  field('Create a password','<input name="accountPassword" type="password" minlength="8" maxlength="128" required autocomplete="new-password" placeholder="At least 8 characters">')+
  '<button class="button" type="submit" data-label="Create '+(student?'student':'teacher')+' account">Create '+(student?'student':'teacher')+' account</button></form>';}
function signInForm(){return '<div class="auth-fields"><button type="button" class="button google" data-action="google">'+googleMark+'Sign in with Google</button></div>'+orLine('or sign in with email')+
 '<form id="signin-form" class="auth-fields">'+field('Email','<input name="email" type="email" maxlength="254" required autocomplete="email" value="'+val('email')+'">')+
 field('Password','<input name="accountPassword" type="password" maxlength="128" required autocomplete="current-password">')+
 '<button type="button" class="text-button auth-forgot" data-action="reset-password">Forgot your password?</button><button class="button" type="submit" data-label="Sign in">Sign in</button></form>';}
// A signed-in account that has not joined a school yet, such as a first Google sign-in from the Sign in tab.
function joinForm(role){const student=role==='student',[first,...rest]=String(session.user.displayName||'').trim().split(/\s+/);
 draft.firstName??=first||'';draft.lastName??=rest.join(' ');
 return '<span class="auth-step micro">ONE LAST STEP</span><h2>Join your school.</h2><p>Enter the '+(student?'student':'teacher')+' password your '+(student?'HOSA advisor':'school')+' shared with you. You only do this once.</p>'+errorSlot()+
  '<form id="enroll-form" data-role="'+role+'" class="auth-fields">'+schoolFields(role)+nameFields()+'<button class="button" type="submit" data-label="Join as a '+(student?'student':'teacher')+'">Join as a '+(student?'student':'teacher')+'</button></form>';}
function loginPage(role){const student=role==='student';let card;
 const signedAs=session.user?'<p class="auth-who">Signed in as <strong>'+esc(session.user.email)+'</strong> · <button class="text-button" data-action="sign-out">Use another account</button></p>':'';
 const roleWord=r=>r==='instructor'?'teacher':'student';
 if(!session.ready)card='<div class="auth-wait"><span class="spinner" aria-hidden="true"></span><p>Checking your session…</p></div>';
 else if(session.unavailable)card='<h2>Sign-in is offline.</h2><p class="auth-error" role="alert">'+esc(session.unavailable)+'</p><p class="auth-note">Please try again in a little while.</p>';
 else if(!session.user)card=authTabs()+'<div class="auth-pane'+(authSwap?' swapped':'')+'">'+(authTab==='create'
  ?'<h2>'+(student?'Make your student account.':'Make your teacher account.')+'</h2><p>'+(student?'Your account joins your school community the moment it is made.':'Choose your school, then make the account you will teach with.')+'</p>'+errorSlot()+createForm(role)
  :'<h2>'+(student?'Welcome back.':'Welcome back to your desk.')+'</h2><p>Sign in the same way you made your account.</p>'+errorSlot()+signInForm())+'</div>';
 else if(session.enrolled&&me().role!==role)card='<h2>This is a '+roleWord(me().role)+' account.</h2><p>'+esc(session.user.email)+' is registered as a '+roleWord(me().role)+' at '+esc(me().community?.name||'your school')+'. Each account holds one role in one school.</p>'+linkButton('Open my '+roleWord(me().role)+' space',home())+signedAs;
 else if(session.error&&!session.enrolled)card='<h2>We could not open your account.</h2>'+errorSlot()+button('Try again','retry-profile')+signedAs;
 else card=joinForm(role)+signedAs;
 const other='<a class="auth-switch" href="'+(student?'#/teacher':'#/student')+'">'+(student?'Teacher login':'Student login')+' '+icon('arrow')+'</a>';
 if(student)return siteHeader()+'<main id="main" class="auth-page auth-student"><div class="auth-student-top"><span class="micro">VALUS / STUDENT ENTRY</span><span class="micro">ONE EVENT · ONE YEAR</span></div><section class="auth-intro"><span class="eyebrow">YOUR STUDY NOTEBOOK</span><h1>Make room<br>to <em>grow.</em></h1><p>Pick your event, take a lesson at a time, and see how far you’ve come.</p><div class="auth-student-index"><span class="micro">INSIDE YOUR SPACE</span><ul><li><span>01</span> Your event and lessons</li><li><span>02</span> Practice and progress</li><li><span>03</span> Your school chapter</li></ul></div>'+other+'</section><section class="auth-card">'+card+'</section><p class="auth-help">Need your school password? Ask your HOSA advisor.</p></main>';
 return siteHeader()+'<main id="main" class="auth-page auth-teacher"><section class="auth-teacher-banner"><div class="auth-teacher-kicker"><span class="micro">VALUS / TEACHER ENTRY</span><span class="micro">A SPACE FOR YOUR CHAPTER</span></div><h1>Keep the chapter<br><em>moving.</em></h1><p>Bring assignments, student progress, and chapter conversation together in one calm place.</p></section><div class="auth-teacher-body"><section class="auth-card">'+card+'</section><aside class="auth-teacher-aside"><span class="eyebrow">AT YOUR DESK</span><h2>More time for the people behind the progress.</h2><ul><li><strong>Assign</strong><span>Give students their next lesson or reflection.</span></li><li><strong>Follow</strong><span>See progress by student and event.</span></li><li><strong>Gather</strong><span>Share updates in your private chapter.</span></li></ul><p>Need a teacher password? Ask the person who manages your school’s Valus chapter.</p>'+other+'</aside></div></main>';}

// ---------- workspace ----------
function navItem(label,href,ico,active){return '<a href="'+href+'" class="'+(active?'active':'')+'" '+(active?'aria-current="page"':'')+'>'+icon(ico)+'<span>'+label+'</span></a>';}
function shell(content,page){const teacher=isInstructor(),school=esc(me().community?.name||'Your school');return '<div class="workspace"><aside class="sidebar">'+logo()+'<div class="chapter-label"><div><strong>'+school+'</strong><small>Secondary chapter</small></div></div><nav aria-label="Workspace navigation">'+navItem('Overview',home(),'grid',page==='overview')+(teacher?navItem('Students','#/students','users',page==='students')+navItem('Events','#/chapter-events','book',page==='event'):navItem('My event','#/my-event','book',page==='event'))+navItem('Assignments','#/assignments','list',page==='assignments')+navItem('Analytics','#/analytics','chart',page==='analytics')+navItem('School community','#/community','message',page==='community')+navItem('Global rankings','#/rankings','trophy',page==='rankings')+'</nav><div class="sidebar-bottom"><div class="hal-card"><p>Little by little.<br>You’re getting there.</p></div><button class="role-switch" data-action="sign-out">'+icon('logout')+'Log out</button><a class="back-home" href="#/">'+icon('arrow')+' Back to Valus</a></div></aside><div class="workspace-body"><div class="medical-backdrop" aria-hidden="true"><canvas data-medical="'+page+'"></canvas></div><header class="workspace-top"><button class="icon-button mobile-menu" data-action="menu" aria-label="Toggle navigation">'+icon('menu')+'</button><span class="crumb">Your space <span>/</span> '+(teacher?'Instructor':'Student')+'</span><div class="header-actions">'+themeButton()+'<span class="avatar" title="'+esc(me().displayName)+'">'+esc(initials(me().displayName))+'</span></div></header><main id="main" class="workspace-main" data-page="'+page+'">'+content+'</main><footer class="workspace-footer"><a href="medical-credits.html" target="_blank" rel="noopener">Animation sources</a><span>'+icon('lock')+' '+(page==='rankings'?'Across Valus · Signed-in members':school+' · Private to your chapter')+'</span><span>'+esc(session.user?.email||'')+'</span></footer></div></div>';}
function panelTitle(title,action=''){return '<div class="panel-title"><h2>'+title+'</h2>'+action+'</div>';}
function progressBar(value){return '<div class="progress-track" role="progressbar" aria-valuenow="'+value+'" aria-valuemin="0" aria-valuemax="100" aria-label="Completion"><span style="width:'+value+'%"></span></div>';}
function ring(value){return '<div class="ring" style="--progress:'+value+'"><div><strong>'+value+'<small>%</small></strong><span>COMPLETE</span></div></div>';}
// "Lesson checkpoint" is the stored type name for what people see as Lesson practice.
const typeLabel=t=>t==='Lesson checkpoint'?'Lesson practice':t;
const testLabel=id=>'Practice test '+(String(id).match(/-(\d+)$/)?.[1]||'');
const goalText=a=>a.goal==='accuracy'?'Score '+a.target+'% or higher':a.type==='Practice test'?'Submit the test':a.type==='Lesson'&&a.lessonId?'Complete the lesson':a.type==='Lesson checkpoint'?'Submit the lesson practice':'Submit your work';
const assignmentDone=a=>a.met??a.submitted;
function studentStatus(a){if(a.met)return '<span class="status">'+(a.goal==='accuracy'?'Goal met · '+a.best+'%':'Done')+'</span>';
 if(a.submitted&&a.goal==='accuracy')return '<span class="due">'+(a.best==null?'Awaiting score':'Best '+a.best+'% · goal '+a.target+'%')+'</span>';
 return '<span class="due">Due '+date(a.due)+'</span>';}
function teacherStatus(a){if(a.audienceCount==null)return '<span class="status">'+(a.submissionCount||0)+' submitted</span>';
 return '<span class="status">'+(a.goal==='accuracy'?a.metCount+' / '+a.audienceCount+' at '+a.target+'%':a.submissionCount+' / '+a.audienceCount+' done')+'</span>';}
function assignmentRows(limit=99){if(cache.assignments===null)return failed('assignments');const teacher=isInstructor();const list=cache.assignments.filter(a=>teacher||assignmentFilter==='All'||(assignmentFilter==='Completed'?assignmentDone(a):!assignmentDone(a))).slice(0,limit);
 return list.length?'<div class="assignment-list">'+list.map(a=>'<button class="assignment-row" data-action="assignment" data-id="'+esc(a.id)+'"><span class="row-icon '+(!teacher&&assignmentDone(a)?'done':'')+'">'+icon(!teacher&&assignmentDone(a)?'check':'list')+'</span><span><strong>'+esc(a.title)+'</strong><small>'+esc(typeLabel(a.type))+' · '+esc(a.lessonId&&findCourseLesson(a.lessonId)?.lesson.title||(a.testId?a.event+' · '+testLabel(a.testId):a.event)||'Whole chapter')+' · '+esc(goalText(a))+'</small></span><span class="row-end">'+(teacher?teacherStatus(a):studentStatus(a))+icon('chevron')+'</span></button>').join('')+'</div>':'<div class="empty">'+icon('check')+'<h3>All clear for now.</h3><p>'+(teacher?'Create an assignment to give your chapter a next step.':'No assignments in this view.')+'</p></div>';}
function sparkChart(history){if(!history.length)return '<div class="chart-empty"><div class="ghost-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><p>Your progress starts with your first practice.</p>'+(isInstructor()?'':'<a class="editorial-link" href="#/my-event">Try a practice check '+icon('arrow')+'</a>')+'</div>';return '<div class="history-bars">'+history.slice(-7).map((q,i)=>'<div><span>'+q.score+'%</span><i style="height:'+Math.max(6,q.score)+'px"></i><small>Try '+(i+1)+'</small></div>').join('')+'</div>';}
const firstName=()=>esc(String(me().displayName).split(/\s+/)[0]);
function overview(){if(!need('progress','assignments','posts','courseProgress','practice'))return loading();if(['progress','assignments','posts','courseProgress','practice'].some(k=>errors[k]))return ['progress','assignments','posts','courseProgress','practice'].filter(k=>errors[k]).map(failed).join('');const pa=cache.practice||[],paBest=practiceBest(pa),hasTests=!!me().event&&hasPracticeTests(me().event);if(!contentReady(me().event)){loadCourse(me().event,{view:false}).then(render,()=>{});return loading();}const p=cache.progress||{completed:[],progress:0,quizHistory:[]};const next=LESSONS.find(l=>!p.completed.includes(l.id))||LESSONS[0];const latest=cache.posts?.[0]; const eventLessons=courseLessons(me().event), courseDone=eventLessons.filter(l=>cache.courseProgress?.completed.includes(l.id)).length, coursePercent=eventLessons.length?Math.round(courseDone/eventLessons.length*100):0, courseNext=eventLessons.find(l=>!cache.courseProgress?.completed.includes(l.id))||eventLessons[0];
 const eventPanel=me().event?'<div class="event-heading"><div><span class="eyebrow">'+esc(event()?.category||'YOUR ANNUAL EVENT')+'</span><h2>'+esc(me().event)+'</h2><span class="subtle">'+icon('lock')+' Your event for 2026–27</span></div><a class="round-link" href="#/my-event" aria-label="Open my event">'+icon('arrow')+'</a></div>':'<div class="event-heading"><div><span class="eyebrow">YOUR ANNUAL EVENT</span><h2>Choose your event</h2><span class="subtle">Pick the one event you will compete in this year.</span></div><a class="round-link" href="#/my-event" aria-label="Choose your event">'+icon('arrow')+'</a></div>';
 return heading('YOUR DAILY DOSE OF PROGRESS','Good to see you, '+firstName()+'.','A little focus today. A little more confidence tomorrow.','<a class="greeting-focus" href="#/my-event"><span class="eyebrow">YOUR FOCUS / 2026–27</span><strong>'+esc(me().event||'Find your event')+'</strong><span>'+(me().event?'Open your learning path':'Choose what you want to master')+' '+icon('arrow')+'</span></a>')+
 dashboardSummary([['Assignments to do',(cache.assignments||[]).filter(a=>!assignmentDone(a)).length,'#/assignments','See your next deadlines'],['Event lessons',eventLessons.length?courseDone+' / '+eventLessons.length:'—','#/my-event',me().event||'Choose your event'],['Practice tests',pa.length?pa.at(-1).score+'%':'—',pa.length||!hasTests?'#/analytics':eventHref(me().event,'tests'),pa.length?'Latest score · best '+paBest+'% · '+pa.length+' submitted':hasTests?'Take your first practice test':'View your progress']])+'<div class="dashboard-grid"><section class="panel event-hero">'+eventPanel+(eventLessons.length?'<div class="event-progress"><div><span class="micro">YOUR EVENT LEARNING PATH</span><p>'+courseDone+' of '+eventLessons.length+' lessons completed</p>'+progressBar(coursePercent)+'</div>'+ring(coursePercent)+'</div><div class="continue-strip"><div>'+icon('book')+'<span><small>YOUR EVENT LESSON</small><strong>'+esc(coursePercent===100?'All lessons complete — review your course':courseNext.title)+'</strong></span></div><a class="button" href="'+eventHref(me().event,'lessons')+'/'+encodeURIComponent(courseNext.id)+'">Continue</a></div>':'<div class="event-progress"><div><span class="micro">ORIENTATION PATH</span><p>'+p.completed.length+' of '+LESSONS.length+' starter lessons completed</p>'+progressBar(p.progress)+'</div>'+ring(p.progress)+'</div><div class="continue-strip"><div>'+icon('book')+'<span><small>YOUR NEXT STEP</small><strong>'+next.title+'</strong></span></div>'+button('Continue','lesson','data-id="'+next.id+'"')+'</div>')+'</section>'+
 '<section class="panel rank-card"><span class="eyebrow">YOUR LEARNING JOURNEY</span><div class="rank-glyph">'+icon('trophy')+'</div><h2>Find your starting point.</h2><p>Ranked assessment is coming next. For now, build your foundations.</p><a class="editorial-link" href="#/rankings">Explore the rank ladder '+icon('arrow')+'</a></section>'+
 '<section class="panel assignments-panel">'+panelTitle('On your list','<a href="#/assignments">View all '+icon('arrow')+'</a>')+assignmentRows(3)+'</section><section class="panel progress-panel">'+panelTitle(pa.length?'Practice test scores':'Your practice',pa.length?'<a href="#/analytics">View results '+icon('arrow')+'</a>':'')+sparkChart(pa.length?pa:p.quizHistory)+'</section>'+
 '<section class="panel chapter-preview">'+panelTitle('Around your chapter','<a href="#/community">Visit chapter '+icon('arrow')+'</a>')+(latest?'<div class="notice"><span class="avatar">'+esc(initials(latest.author.displayName))+'</span><div><strong>'+esc(latest.author.displayName)+(latest.author.role==='instructor'?' <span class="badge">INSTRUCTOR</span>':'')+'</strong><p>'+esc(latest.body)+'</p></div></div>':'<p class="subtle">Your chapter feed is ready for its first post.</p>')+'</section></div>';}
function teacherOverview(){if(!need('students','assignments'))return loading();if(errors.students||errors.assignments)return ['students','assignments'].filter(k=>errors[k]).map(failed).join('');const students=cache.students||[],list=cache.assignments||[];
 return heading('YOUR CHAPTER AT A GLANCE','Welcome back, '+firstName()+'.','Make space for the next step in every student’s journey.',linkButton('View events','#/chapter-events'))+
 '<div class="metric-row"><div><span>In your chapter</span><strong>'+students.length+' <small>student'+(students.length===1?'':'s')+'</small></strong></div><div><span>Assigned by your chapter</span><strong>'+list.length+' <small>assignment'+(list.length===1?'':'s')+'</small></strong></div><div><span>Responses in</span><strong>'+list.reduce((n,a)=>n+(a.submissionCount||0),0)+' <small>submissions</small></strong></div></div>'+
 '<div class="teacher-grid"><section class="panel roster-panel">'+panelTitle('Everyone, in focus','<a href="#/students">View students '+icon('arrow')+'</a>')+roster(false,true)+(students.length>5?'<p class="roster-more subtle">Showing 5 at a time · scroll for all '+students.length+'</p>':'')+'</section><section class="panel teacher-note"><span class="eyebrow">A MOMENT TO CONNECT</span>'+icon('message')+'<h2>Keep your chapter<br>in the loop.</h2><p>A reminder, a resource, or a little encouragement can go a long way.</p>'+button('Post an announcement','announce','',true)+'</section><section class="panel assignments-panel">'+panelTitle('Chapter assignments','<a href="#/assignments">View all '+icon('arrow')+'</a>')+assignmentRows(3)+'</section><section class="panel chapter-pulse"><span class="eyebrow">WITH YOU, ALL THE WAY</span><h2>Every small step counts.</h2><p>Support the process, celebrate the progress.</p></section></div>';}
function roster(manage=true,compact=false){if(cache.students===null)return failed('students');const list=cache.students.filter(s=>(s.displayName+' '+s.email+' '+(s.event||'')).toLowerCase().includes(studentSearch.toLowerCase()));
 if(!cache.students.length)return '<div class="empty">'+icon('users')+'<h3>No students yet.</h3><p>Share your chapter’s student password. Students appear here once they join.</p></div>';
 return '<div class="table-scroll'+(compact?' roster-five':'')+'"><table><thead><tr><th>Student</th><th>Annual event</th><th>Orientation</th><th>Last check</th><th>Checkpoint accuracy</th><th>Practice test</th>'+(manage?'<th><span class="sr-only">Actions</span></th>':'')+'</tr></thead><tbody>'+list.map(s=>'<tr><td><a class="student-name student-link" href="#/analytics/student/'+encodeURIComponent(s.uid)+'" title="View '+esc(s.displayName)+'’s analytics"><span class="avatar">'+esc(initials(s.displayName))+'</span><div><strong>'+esc(s.displayName)+'</strong><small class="subtle">'+esc(s.email)+'</small></div></a></td><td>'+(s.event?'<a class="text-button" href="'+eventHref(s.event)+'">'+esc(s.event)+'</a>':'Not selected')+'</td><td><div class="table-progress">'+progressBar(s.progress)+'<span>'+s.progress+'%</span></div></td><td>'+(s.lastQuizScore===null?'<span class="subtle">None yet</span>':s.lastQuizScore+'%')+'</td><td>'+(s.checkpointAccuracy==null?'<span class="subtle">None yet</span>':s.checkpointAccuracy+'%')+'</td><td>'+(s.practiceLatest==null?'<span class="subtle">None yet</span>':s.practiceLatest+'%<small class="subtle table-note">Best '+s.practiceBest+'% · '+s.practiceAttempts+' submitted</small>')+'</td>'+(manage?'<td class="row-actions"><button class="text-button" data-action="manage-event" data-uid="'+esc(s.uid)+'">Event</button><button class="text-button" data-action="remove-student" data-uid="'+esc(s.uid)+'">Remove</button></td>':'')+'</tr>').join('')+'</tbody></table></div>';}
function studentsPage(){if(!need('students'))return loading();return heading('STUDENT DIRECTORY','Know where everyone stands.','Everyone who joined '+esc(me().community?.name||'your chapter')+' with the student password.')+'<section class="panel"><div class="panel-title"><h2>Your students</h2><label class="search-field">'+icon('search')+'<input id="student-search" type="search" placeholder="Find a student" value="'+esc(studentSearch)+'" aria-label="Find a student"></label></div><div id="roster-result">'+roster()+'</div></section>';}
function assignmentsPage(){if(!need('assignments'))return loading();const teacher=isInstructor();return heading('ASSIGNMENTS',teacher?'A clear next step.':'A little structure. A lot of possibility.',teacher?'Create lessons, quizzes, skill checklists, or reflections for an event group or the whole chapter.':'Your instructor’s assignments, all in one place.',teacher?button('Create assignment','create-assignment'):'')+'<section class="panel">'+(teacher?'':'<div class="filter-tabs" role="group" aria-label="Filter assignments">'+['All','To do','Completed'].map(t=>'<button data-action="filter-assignment" data-value="'+t+'" class="'+(assignmentFilter===t?'selected':'')+'">'+t+'</button>').join('')+'</div>')+assignmentRows()+'</section>';}
function teacherEvents(){return heading('CHAPTER EVENTS / 2026–27','Every event, in view.','Open any event to see the rules, lessons and practice tests your students use. Your own practice attempts are graded but never saved.')+catalogToolbar(eventSearch,eventFilter,eventType)+'<div class="event-catalog" id="event-results">'+eventCards()+'</div><p class="catalog-note">All 64 regular secondary-division events · Assign a lesson, lesson practice or practice test from the Assignments page.</p>';}
function myEvent(){return heading('YOUR EVENT / 2026–27','Find your focus.','Explore every event here. Check the box in a card’s top-right corner to make it your event. Your choice appears in global rankings and your teacher’s student dashboard.')+catalogToolbar(eventSearch,eventFilter,eventType)+'<div class="event-catalog" id="event-results">'+eventCards()+'</div><p class="catalog-note">All 64 regular secondary-division events · Your selected event appears first among matching results. Selecting another event updates your event-specific assignments.</p>';}
// ---------- practice test analytics ----------
const practiceBest=list=>list.length?Math.max(...list.map(a=>a.score)):null;
function practiceRows(list){return list.slice().reverse().map(a=>'<a class="practice-row" href="'+practiceHref(a.event,a.testId,a.id)+'"><span><strong>'+esc(a.title)+' · '+esc(a.event)+'</strong><small>'+esc(practiceWhen(a.date))+' · '+(a.mode==='exam'?'Graded at the end':'Checked as I went')+'</small></span><span class="practice-score">'+a.score+'%<small>'+a.correct+' / '+a.total+'</small></span><span class="practice-go">Review →</span></a>').join('');}
// Accuracy for each test-plan topic, summed over every submitted attempt, weakest first.
function practiceTopics(list){const m=new Map();for(const a of list)for(const ar of a.areas||[])for(const t of ar.topics){const k=ar.area+'|'+t.topic,v=m.get(k)||{area:ar.area,topic:t.topic,correct:0,total:0};v.correct+=t.correct;v.total+=t.total;m.set(k,v);}
 return [...m.values()].filter(t=>t.total).map(t=>({...t,pct:Math.round(100*t.correct/t.total)})).sort((a,b)=>a.pct-b.pct||a.topic.localeCompare(b.topic));}
const topicRow=(label,note,c,t)=>'<div class="topic-row"><span>'+esc(label)+(note?'<small>'+esc(note)+'</small>':'')+'</span><span>'+Math.round(100*c/t)+'%</span><span class="pt-meter" aria-hidden="true"><span style="width:'+Math.round(100*c/t)+'%"></span></span></div>';
function practiceEmpty(){const ev=me()?.event;return '<div class="empty"><h3>No practice tests submitted yet.</h3><p>'+(ev&&hasPracticeTests(ev)?'Take a full-length practice test to see your score, topic accuracy and every past submission here.':'Practice tests are added event by event. Your results will appear here once your event has one.')+'</p>'+(ev&&hasPracticeTests(ev)?linkButton('Open practice tests',eventHref(ev,'tests')):'')+'</div>';}
function dashboardSummary(items){return '<div class="dashboard-summary'+(items.length===4?' four':'')+'">'+items.map(([label,value,href,note])=>'<a href="'+href+'"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(note)+'</small></a>').join('')+'</div>';}
function analytics(){
 if(isInstructor()){
  if(!need('students','assignments'))return loading();
  if(errors.students||errors.assignments)return ['students','assignments'].filter(k=>errors[k]).map(failed).join('');
  const students=cache.students,scored=students.filter(s=>s.checkpointAccuracy!=null),tested=students.filter(s=>s.practiceLatest!=null),byEvent=Object.entries(students.reduce((m,s)=>(m[s.event||'Not selected']=(m[s.event||'Not selected']||0)+1,m),{})).sort((a,b)=>b[1]-a[1]);
  return heading('CHAPTER ANALYTICS','Know who needs your support.','Saved practice test scores, course completions and checkpoint results from your chapter.')+dashboardSummary([['Students with an event',students.filter(s=>s.event).length+' / '+students.length,'#/students','Selected by students or their instructor'],['Practice test average',tested.length?Math.round(tested.reduce((n,s)=>n+s.practiceLatest,0)/tested.length)+'%':'—','#/students',tested.length?'Latest score of '+tested.length+' student'+(tested.length===1?'':'s')+' who submitted':'No submissions yet'],['Course lessons completed',students.reduce((n,s)=>n+(s.courseLessonsCompleted||0),0),'#/students','Across all event courses'],['Checkpoint accuracy',scored.length?Math.round(scored.reduce((n,s)=>n+s.checkpointAccuracy,0)/scored.length)+'%':'—','#/assignments',scored.length+' students with graded attempts']])+'<div class="analytics-grid"><section class="panel full-width">'+panelTitle('Event participation')+(byEvent.length?byEvent.map(([name,count])=>'<div class="activity-row">'+icon('book')+'<strong>'+esc(name)+'</strong><span>'+count+' students</span></div>').join(''):'<div class="empty"><h3>No students yet.</h3><p>Metrics appear when students join your chapter.</p></div>')+'</section><section class="panel full-width">'+panelTitle('Student progress')+roster(false)+'</section></div>';
 }
 if(!need('progress','courseProgress','assignments','practice'))return loading();
 if(['progress','courseProgress','assignments','practice'].some(k=>errors[k]))return ['progress','courseProgress','assignments','practice'].filter(k=>errors[k]).map(failed).join('');
 const p=cache.progress,cp=cache.courseProgress,checks=Object.entries(cp.accuracy||{}),attempts=checks.reduce((n,[,v])=>n+v.attempts,0),average=checks.length?Math.round(checks.reduce((n,[,v])=>n+v.latest,0)/checks.length):null;
 const pa=cache.practice||[],paBest=practiceBest(pa),paLast=pa.at(-1),topics=practiceTopics(pa);
 const practicePanels=pa.length?'<section class="panel">'+panelTitle('Practice test scores')+sparkChart(pa)+'</section><section class="panel">'+panelTitle('Latest test by area')+'<p class="subtle">'+esc(paLast.title)+' · '+esc(practiceWhen(paLast.date))+'</p>'+paLast.areas.map(ar=>topicRow(ar.area,ar.weight+'% of the test · '+ar.correct+' of '+ar.total+' correct',ar.correct,ar.total)).join('')+'</section><section class="panel full-width">'+panelTitle('Topic accuracy','<span class="subtle">All '+pa.length+' submission'+(pa.length===1?'':'s')+' · weakest first</span>')+topics.map(t=>topicRow(t.topic,t.area+' · '+t.correct+' of '+t.total+' correct',t.correct,t.total)).join('')+'</section><section class="panel full-width">'+panelTitle('Practice test submissions','<span class="subtle">Open any attempt to review it</span>')+practiceRows(pa)+'</section>':'<section class="panel full-width">'+panelTitle('Practice tests')+practiceEmpty()+'</section>';
 return heading('YOUR ANALYTICS','Your work, made visible.','Saved results from your practice tests and event courses. Checkpoint accuracy uses the latest result for each attempted lesson.')+dashboardSummary([['Practice test best',paBest===null?'—':paBest+'%',pa.length?'#/analytics':me().event&&hasPracticeTests(me().event)?eventHref(me().event,'tests'):'#/my-event',pa.length?pa.length+' submitted · latest '+paLast.score+'%':'No submissions yet'],['Event lessons completed',cp.completed.length,'#/my-event','Across your saved event courses'],['Checkpoint accuracy',average===null?'—':average+'%','#/my-event',attempts+' graded attempts'],['Assignments done',cache.assignments.filter(assignmentDone).length+' / '+cache.assignments.length,'#/assignments','Finished, or at the target accuracy']])+'<div class="analytics-grid">'+practicePanels+'<section class="panel full-width">'+panelTitle('Checkpoint results')+(checks.length?checks.map(([id,v])=>'<div class="activity-row">'+icon('check')+'<strong>'+esc(findCourseLesson(id)?.lesson.title||id.replace(/[-_]/g,' '))+'</strong><span>'+v.latest+'% accuracy</span><small>'+v.attempts+' attempts</small></div>').join(''):'<div class="empty"><h3>No checkpoint results yet.</h3><p>Complete an assigned lesson checkpoint to record your accuracy.</p></div>')+'</section><section class="panel">'+panelTitle('Starter orientation')+'<div class="analytics-number">'+ring(p.progress)+'<p>'+p.completed.length+' of '+LESSONS.length+' starter lessons complete</p></div></section><section class="panel">'+panelTitle('Orientation practice')+sparkChart(p.quizHistory)+'</section></div>';
}
function attemptRows(list){return list.slice().reverse().map(a=>'<div class="practice-row"><span><strong>'+esc(a.title)+' · '+esc(a.event)+'</strong><small>'+esc(practiceWhen(a.date))+' · '+(a.mode==='exam'?'Graded at the end':'Checked as they went')+(a.timedOut?' · Timed out':'')+'</small></span><span class="practice-score">'+a.score+'%<small>'+a.correct+' / '+a.total+'</small></span></div>').join('');}
function studentAnalytics(uid){const key='student:'+uid;if(!need(key))return loading();if(errors[key])return failed(key);
 const d=cache[key],s=d.student,pa=d.practice,lp=d.lessonPractice.slice().sort((a,b)=>a.latest-b.latest),topics=practiceTopics(pa),paBest=practiceBest(pa),last=pa.at(-1);
 const lpAvg=lp.length?Math.round(lp.reduce((n,l)=>n+l.latest,0)/lp.length):null,met=d.assignments.filter(a=>a.met).length;
 const scored=d.assignments.filter(a=>['Skill','Online submission','Skill checklist'].includes(a.type)&&a.best!=null);
 const lessonName=id=>findCourseLesson(id)?.lesson.title||id.replace(/[-_]/g,' ');
 const empty=(t,p)=>'<div class="empty"><h3>'+t+'</h3><p>'+p+'</p></div>';
 return heading('STUDENT ANALYTICS',esc(s.displayName),esc(s.email)+' · '+(s.event?esc(s.event):'No event selected'),'<a class="button secondary" href="#/analytics">'+icon('arrow','flip')+' All students</a>')+
 dashboardSummary([['Lesson practice accuracy',lpAvg==null?'—':lpAvg+'%','#/analytics',lp.length+' lesson'+(lp.length===1?'':'s')+' practiced · latest attempts'],['Practice test best',paBest==null?'—':paBest+'%','#/analytics',pa.length?pa.length+' submitted · latest '+last.score+'%':'No submissions yet'],['Lessons completed',d.completedLessons.length,'#/analytics',s.event?'Across event courses':'Across all courses'],['Assignment goals met',met+' / '+d.assignments.length,'#/assignments','Completion or target accuracy']])+
 '<div class="analytics-grid"><section class="panel full-width">'+panelTitle('Accuracy by lesson practice','<span class="subtle">Latest attempt · weakest first</span>')+(lp.length?lp.map(l=>topicRow(lessonName(l.lessonId),'Best '+l.best+'% · '+l.attempts+' attempt'+(l.attempts===1?'':'s')+' · MCQ '+l.mcqCorrect+' of '+l.mcqTotal+' correct overall'+(l.frqScore==null?'':' · Written '+l.frqScore+'%'),l.latest,100)).join(''):empty('No lesson practice yet.','Assign a lesson practice to see accuracy by lesson.'))+'</section>'+
 (pa.length?'<section class="panel">'+panelTitle('Practice test scores')+sparkChart(pa)+'</section><section class="panel">'+panelTitle('Latest test by area')+'<p class="subtle">'+esc(last.title)+' · '+esc(practiceWhen(last.date))+'</p>'+last.areas.map(ar=>topicRow(ar.area,ar.weight+'% of the test · '+ar.correct+' of '+ar.total+' correct',ar.correct,ar.total)).join('')+'</section>':'<section class="panel full-width">'+panelTitle('Practice tests')+empty('No practice tests submitted yet.','Scores, areas and every submission appear here once they take one.')+'</section>')+
 '<section class="panel full-width">'+panelTitle('Skills accuracy','<span class="subtle">'+(topics.length?'Every practice-test skill · weakest first':'From practice tests and scored skills')+'</span>')+(topics.length||scored.length?topics.map(t=>topicRow(t.topic,t.area+' · '+t.correct+' of '+t.total+' correct',t.correct,t.total)).join('')+scored.map(a=>topicRow(a.title,typeLabel(a.type)+' · scored by you'+(a.goal==='accuracy'?' · goal '+a.target+'%':''),a.best,100)).join(''):empty('No skill results yet.','Skill accuracy builds from practice-test topics and the skills you score.'))+'</section>'+
 (pa.length?'<section class="panel full-width">'+panelTitle('Practice test submissions')+attemptRows(pa)+'</section>':'')+
 '<section class="panel full-width">'+panelTitle('Assignments')+(d.assignments.length?'<div class="assignment-list">'+d.assignments.map(a=>'<div class="assignment-row"><span class="row-icon '+(a.met?'done':'')+'">'+icon(a.met?'check':'list')+'</span><span><strong>'+esc(a.title)+'</strong><small>'+esc(typeLabel(a.type))+' · '+esc(goalText(a))+' · Due '+date(a.due)+'</small></span><span class="row-end">'+studentStatus(a)+'</span></div>').join('')+'</div>':empty('Nothing assigned yet.','Assignments for this student’s event or the whole chapter appear here.'))+'</section></div>';}
function community(){if(!need('posts'))return loading();const school=esc(me().community?.name||'your school');
 const posts=cache.posts===null?failed('posts'):cache.posts.length?cache.posts.map(p=>'<article class="panel post"><div class="post-head"><span class="avatar">'+esc(initials(p.author.displayName))+'</span><div><strong>'+esc(p.author.displayName)+'</strong><small>'+(p.author.role==='instructor'?'Instructor':'Student')+' · '+stamp(p.createdAt)+'</small></div>'+(p.author.uid===me().uid||isInstructor()?'<button class="icon-button post-delete" data-action="delete-post" data-id="'+esc(p.id)+'" aria-label="Remove post">'+icon('trash')+'</button>':'')+'</div><p>'+esc(p.body)+'</p></article>').join(''):'<div class="panel empty">'+icon('message')+'<h3>Quiet in here.</h3><p>Be the first to post to your chapter.</p></div>';
 return heading('YOUR SCHOOL COMMUNITY','A place to grow together.','Only members of '+school+' can see this feed.')+'<div class="community-grid"><section><form id="post-form" class="panel composer"><label for="post-text">What’s on your mind?</label><textarea id="post-text" name="text" maxlength="1500" required rows="3" placeholder="'+(isInstructor()?'Share an announcement with your chapter…':'Ask a question or share a small win…')+'"></textarea><div><small>'+icon('lock')+' '+school+' members only</small><button class="button" type="submit">Post to chapter</button></div></form><div class="posts">'+posts+'</div></section><aside class="panel community-aside"><h2>A little kindness<br>goes a long way.</h2><p>Be curious. Be encouraging. Keep the conversation respectful and focused on learning.</p><div class="divider"></div><span class="eyebrow">YOUR CHAPTER</span><h3>'+school+'</h3><p>Posts are private to your school. Instructors can remove any post.</p></aside></div>';}
function rankings(){return heading('GLOBAL RANKINGS','Find your next level.','A little friendly competition. A shared love of learning.')+rankingsBody();}

// ---------- router ----------
const PUBLIC=['/','/about','/instructors','/events','/start','/mission','/leaderboard'];
const WORKSPACE={'/my-event':[myEvent,'event','student'],'/chapter-events':[teacherEvents,'event','instructor'],'/students':[studentsPage,'students','instructor'],'/assignments':[assignmentsPage,'assignments'],'/analytics':[analytics,'analytics'],'/community':[community,'community'],'/rankings':[rankings,'rankings']};
let stopLanding=null,stopMedical=null;
let entranceRoute='',entranceReady=false;
// The overview roster shows exactly five students; the rest scroll inside it.
function fitRoster(){app.querySelectorAll('.roster-five').forEach(t=>{const r=t.querySelectorAll('tbody tr');t.style.maxHeight=r.length>5?r[5].offsetTop+'px':'';});}
function mountWorkspace(){const canvas=app.querySelector('[data-medical]');fitRoster();if(canvas)stopMedical=mountMedicalBackground(canvas,canvas.dataset.medical);const route=location.hash;if(route!==entranceRoute){entranceRoute=route;entranceReady=false;}const main=app.querySelector('.workspace-main');if(main&&!main.querySelector('.loading-panel')&&!entranceReady){main.classList.add('workspace-enter');entranceReady=true;}}
function render(){stopMedical?.();stopMedical=null;stopLanding?.();stopLanding=null;try{renderRoute(location.hash.slice(1)||'/');}finally{authSwap=null;markEntrance();mountWorkspace();}}
function renderRoute(route){
 document.title='Valus | '+({'/':'Free HOSA Study Resources, Lessons & Practice Tests','/mission':'What is Valus?','/leaderboard':'Global rankings','/events':'Explore events','/start':'Step inside','/student':'Student','/teacher':'Teacher'}[route]||'Your study space');
 if(session.profile?.event&&session.profile.role==='student')document.body.dataset.event=session.profile.event;else delete document.body.dataset.event;
 if(['/','/about','/instructors'].includes(route)){document.body.classList.remove('in-workspace');app.innerHTML=landing();stopLanding=initLanding(app);if(route!=='/')requestAnimationFrame(()=>document.getElementById(route.slice(1))?.scrollIntoView({behavior:'smooth'}));return;}
 const pages={'/start':startPage,'/events':eventsPage,'/mission':missionPage,'/leaderboard':leaderboardPage};
 if(pages[route]){document.body.classList.remove('in-workspace');app.innerHTML=pages[route]();stopLanding=initLanding(app);return;}
 if(route==='/student'||route==='/teacher'){const role=route==='/student'?'student':'instructor';
  if(session.enrolled&&me().role===role){document.body.classList.add('in-workspace');app.innerHTML=shell(role==='student'?overview():teacherOverview(),'overview');return;}
  document.body.classList.remove('in-workspace');app.innerHTML=loginPage(role);stopLanding=initLanding(app);return;}
 if(route.startsWith('/event/')){
  if(!session.ready){app.innerHTML='<main id="main">'+loading()+'</main>';return;}
  if(!session.enrolled){location.hash='/student';return;}
  const detail=parseEventRoute(route);
  document.body.classList.add('in-workspace');
  if(!detail){app.innerHTML=shell(heading('EVENT NOT FOUND','Let’s find your event.','This event link is unavailable.',linkButton('Browse events',isInstructor()?'#/events':'#/my-event')),'event');return;}
  document.title='Valus | '+detail.event.name;
  // In-depth courses load on first visit; show a loading state until the lesson content arrives.
  if(detail.tool==='lessons'&&!courseReady(detail.event.name)){app.innerHTML=loading();loadCourse(detail.event.name).then(render,()=>{app.innerHTML='<main id="main" class="auth-page"><div class="empty"><h3>This course could not load.</h3><p>Check your connection and reload the page.</p></div></main>';});return;}
  if(detail.tool==='tests'&&!testsReady(detail.event.name)){app.innerHTML=loading();loadTests(detail.event.name).then(render,()=>{app.innerHTML='<main id="main" class="auth-page"><div class="empty"><h3>This practice test could not load.</h3><p>Check your connection and reload the page.</p></div></main>';});return;}
  if(detail.tool==='tests'&&!isInstructor()){
   if(!need('practice')){app.innerHTML=loading();return;}
   if(errors.practice){app.innerHTML=failed('practice');return;}
  }
  if(detail.tool==='lessons'&&!isInstructor()){
   if(!need('courseProgress')){app.innerHTML=loading();return;}
   if(errors.courseProgress){app.innerHTML=failed('courseProgress');return;}
  }
  app.innerHTML=eventWorkspace(detail,{brand:logo(),theme:themeButton(),teacher:isInstructor(),selected:me().event,courseProgress:cache.courseProgress||{},userId:session.user?.uid,practiceAttempts:cache.practice||[]});
  mountPracticeTest(app,{userId:session.user?.uid,api,attempts:cache.practice||[],teacher:isInstructor(),attemptId:detail.attemptId,onSubmitted:a=>{if(cache.practice)cache.practice.push(a);toast('Practice test submitted and saved.');}});
  mountCourse(app,{api,userId:session.user?.uid,onCheckpoint:r=>{
   if(!r.recorded)return;
   if(cache.courseProgress){const acc=cache.courseProgress.accuracy||(cache.courseProgress.accuracy={});acc[detail.lessonId]={latest:r.accuracy,attempts:(acc[detail.lessonId]?.attempts||0)+1};}
   if(r.assignmentId)delete cache.assignments;
  },onComplete:id=>{
   if(cache.courseProgress&&!cache.courseProgress.completed.includes(id))cache.courseProgress.completed.push(id);
   toast('Lesson complete.');
  }});return;
 }
 const studentId=route.match(/^\/analytics\/student\/([^/]+)$/)?.[1];
 const page=studentId?[()=>{try{return studentAnalytics(decodeURIComponent(studentId));}catch{return failed('students');}},'analytics','instructor']:WORKSPACE[route];if(!page){location.hash='/';return;}
 if(!session.ready){document.body.classList.add('in-workspace');app.innerHTML='<main id="main" class="auth-page">'+loading()+'</main>';return;}
 if(!session.enrolled){location.hash='/student';return;}
 if(page[2]&&page[2]!==me().role){location.hash=home().slice(1);return;}
 document.body.classList.add('in-workspace');app.innerHTML=shell(page[0](),page[1]);
}

// ---------- modals ----------
function lessonModal(id){const l=LESSONS.find(x=>x.id===id);if(!l)return;const done=cache.progress?.completed.includes(id);showModal(l.title,'<span class="eyebrow">STARTER LESSON · '+l.time+'</span><p class="lesson-body">'+l.body+'</p><a class="resource-link" href="https://hosa.org/guidelines" target="_blank" rel="noreferrer">'+icon('book')+' Open official HOSA guidelines ↗</a><div class="callout"><strong>A small step to try</strong><p>Write one thing you want to prepare this week in your event notebook.</p></div><div class="modal-actions">'+(isInstructor()?'':button(done?'Completed':'Mark as complete','complete-lesson','data-id="'+id+'"'+(done?' disabled':'')))+button('Ask Mr. DNA about this','ask-hal','data-id="'+id+'"',true)+'</div>');}
async function assignmentModal(id){const a=cache.assignments?.find(x=>x.id===id);if(!a)return;const teacher=isInstructor();
 const goal='<div class="goal-line">'+icon(a.goal==='accuracy'?'chart':'check')+'<span><strong>'+(a.goal==='accuracy'?'Accuracy goal':'Completion goal')+'</strong>'+esc(goalText(a))+(a.goal==='accuracy'&&a.teacherScored?(teacher?' · you score it below':' · scored by your instructor'):'')+'</span></div>';
 const open=a.type==='Practice test'&&a.testId?linkButton('Open practice test',practiceHref(a.event,a.testId)):a.type==='Lesson'&&a.lessonId?linkButton('Open lesson',eventHref(a.event,'lessons')+'/'+encodeURIComponent(a.lessonId)):'';
 const head='<span class="eyebrow">'+esc(typeLabel(a.type))+' · '+esc(a.event||'Whole chapter')+' · DUE '+date(a.due)+'</span>'+goal+'<p class="lesson-body">'+esc(a.instructions||(teacher?'No instructions added.':'Review this assignment with your instructor.'))+'</p>';
 if(!teacher&&open){const st=a.met?'<div class="callout"><strong>'+(a.goal==='accuracy'?'Goal met: best '+a.best+'%.':'Done.')+'</strong><p>'+(a.type==='Practice test'?'You can retake it any time. Every attempt is saved.':'Nice work.')+'</p></div>':a.submitted&&a.goal==='accuracy'?'<div class="callout"><strong>Best so far: '+a.best+'%.</strong><p>Reach '+a.target+'% to meet the goal. Every attempt counts.</p></div>':'';
  showModal(esc(a.title),head+st+'<div class="modal-actions">'+open+'</div>');return;}
 if(!isInstructor()&&a.type==='Lesson checkpoint'){showModal(esc(a.title),head+(a.submitted?'<div class="callout"><strong>Submitted '+stamp(a.submittedAt)+'.</strong><p>You can retake this checkpoint. Every attempt is saved.</p></div>':'')+(a.goal==='accuracy'?'<div class="callout"><strong>'+(a.best==null?'Reach '+a.target+'% accuracy.':'Best so far: '+a.best+'% · goal '+a.target+'%.')+'</strong><p>Your best attempt counts toward the goal.</p></div>':'')+checkpointForm(a.lessonId,{url:'/assignments/'+encodeURIComponent(id)+'/checkpoint'}));mountCheckpoint(modal,{api,userId:session.user?.uid,onSubmitted:()=>{delete cache.courseProgress;refresh('assignments');}});return;}
 if(!isInstructor()){showModal(esc(a.title),head+(a.submitted?'<div class="callout"><strong>Submitted '+stamp(a.submittedAt)+'.</strong><p>You can update your response until your instructor reviews it.</p></div>':'')+(a.teacherScored&&a.best!=null?'<div class="callout"><strong>Your instructor scored this '+a.best+'%.</strong>'+(a.goal==='accuracy'?'<p>'+(a.met?'Goal met.':'Goal: '+a.target+'%. You can update your work and ask for another look.')+'</p>':'')+'</div>':'')+'<form id="submit-assignment" data-id="'+esc(id)+'"><label class="field">'+(a.type==='Skill'?'Video link and notes':a.type==='Online submission'?'Link to your submission':'Your response')+'<textarea name="response" rows="5" required maxlength="10000" placeholder="'+(a.type==='Skill'?'Paste a link to your skill video, then note anything you want feedback on…':a.type==='Online submission'?'Paste a share link to your file or project, and add any notes…':'Share your reflection or practice notes…')+'">'+esc(a.submission||'')+'</textarea></label><button class="button" type="submit">'+(a.submitted?'Update response':'Submit assignment')+'</button></form>');return;}
 const actions='<div class="modal-actions">'+button('Delete assignment','delete-assignment','data-id="'+esc(id)+'"',true)+'</div>';
 showModal(esc(a.title),head+'<div class="callout"><strong>Responses</strong><p>Loading…</p></div>'+actions);
 try{const res=await api('GET','/assignments/'+encodeURIComponent(id)+'/submissions');if(!modal.open)return;const {submissions,students}=res;
  showModal(esc(a.title),head+teacherResponses(a,submissions,students)+actions);}
 catch(err){toast(err.message);}}
// Every student the assignment is for, with where they stand. Teacher-scored work gets a score box.
function teacherResponses(a,submissions,students=[]){const detail=new Map(submissions.map(s=>[s.uid,s]));
 const done=students.filter(s=>s.completed).length,met=students.filter(s=>s.met).length;
 const row=s=>{const sub=detail.get(s.uid),ck=sub?.checkpoint;
  const state=s.met?'<span class="badge">'+(a.goal==='accuracy'?'GOAL MET':'DONE')+'</span>':s.completed?'<span class="badge muted">'+(a.goal==='accuracy'?(s.best==null?'NEEDS SCORE':'BELOW '+a.target+'%'):'DONE')+'</span>':'<span class="badge muted">NOT STARTED</span>';
  const score=a.teacherScored?'<form class="score-form" data-id="'+esc(a.id)+'" data-uid="'+esc(s.uid)+'"><label><span class="sr-only">Score for '+esc(s.displayName)+'</span><input type="number" name="score" min="0" max="100" step="1" inputmode="numeric" placeholder="—" value="'+(s.best??'')+'"></label><span>%</span><button class="text-button" type="submit">Save</button></form>':s.best!=null?'<strong class="score-value">'+s.best+'%</strong>':'';
  return '<div class="response-row"><div class="response-head"><a class="student-link" href="#/analytics/student/'+encodeURIComponent(s.uid)+'"><strong>'+esc(s.displayName)+'</strong></a>'+state+score+'</div><small class="subtle">'+(s.completedAt?stamp(s.completedAt):'No work yet')+(s.attempts?' · '+s.attempts+' attempt'+(s.attempts===1?'':'s'):'')+(ck?' · Latest MCQ '+ck.mcqCorrect+'/'+ck.mcqTotal+' · Written '+(ck.frqScore===null?'not graded':ck.frqScore+'%'):'')+'</small>'+(s.body&&a.type!=='Lesson checkpoint'?'<p>'+esc(s.body)+'</p>':'')+'</div>';};
 return '<div class="callout responses"><strong>'+(a.goal==='accuracy'?met+' of '+students.length+' at '+a.target+'% · '+done+' started':done+' of '+students.length+' done')+'</strong>'+(students.length?students.map(row).join(''):'<p>No students are in this assignment’s audience yet.</p>')+'</div>';}
function lessonOptions(selected){return Object.keys(COURSES).map(name=>'<optgroup label="'+esc(name)+'">'+courseLessons(name).map((l,i)=>'<option value="'+esc(l.id)+'"'+(l.id===selected?' selected':'')+'>'+(i+1)+'. '+esc(l.title)+'</option>').join('')+'</optgroup>').join('');}
// What a teacher can assign. Each kind decides which events and pickers apply and whether accuracy is possible.
const ASSIGN_KINDS=[
 {type:'Practice test',label:'Practice test',ico:'chart',note:'Full-length test, scored by Valus',events:()=>[...new Set(practiceTestList().map(t=>t.event))],pick:'test',accuracy:true},
 {type:'Lesson',label:'Lesson',ico:'book',note:'Read and complete an event lesson',events:()=>Object.keys(COURSES),pick:'lesson',accuracy:false},
 {type:'Lesson checkpoint',label:'Lesson practice',ico:'check',note:'Lesson questions + written response, scored by Valus',events:()=>Object.keys(COURSES),pick:'lesson',accuracy:true},
 {type:'Skill',label:'Skill',ico:'spark',note:'Practice a procedure and submit a video link; you score it',events:()=>EVENTS.filter(e=>EVENT_DETAILS[e.name]?.types.includes('Skills')).map(e=>e.name),chapter:true,accuracy:true},
 {type:'Online submission',label:'Online submission',ico:'list',note:'Submit a project link or file; you score it',events:()=>EVENTS.filter(e=>EVENT_DETAILS[e.name]?.types.includes('Online submission')).map(e=>e.name),chapter:true,accuracy:true},
 {type:'Reflection',label:'Reflection',ico:'message',note:'A short written response; scoring is optional',events:()=>EVENTS.map(e=>e.name),chapter:true,accuracy:true},
];
const kindOf=type=>ASSIGN_KINDS.find(k=>k.type===type)||ASSIGN_KINDS[0];
const studentsIn=ev=>(cache.students||[]).filter(s=>!ev||s.event===ev).length;
// Starts on the event most of the chapter is preparing for, when it fits this kind.
function likelyEvent(list){const counts=list.map(n=>[n,studentsIn(n)]).sort((a,b)=>b[1]-a[1]);return counts[0]?.[1]?counts[0][0]:list[0];}
function syncAssignmentForm(form,changed){const el=form.elements,kind=kindOf(el.type.value);
 form.querySelectorAll('.assign-kind').forEach(k=>k.classList.toggle('selected',k.querySelector('input').checked));
 if(changed==='type'||!changed){const names=kind.events(),keep=names.includes(el.event.value)?el.event.value:(kind.chapter&&el.event.value===''&&changed?'':likelyEvent(names));
  el.event.innerHTML=(kind.chapter?'<option value="">Whole chapter</option>':'')+names.map(n=>'<option value="'+esc(n)+'"'+(n===keep?' selected':'')+'>'+esc(n)+(cache.students?' ('+studentsIn(n)+')':'')+'</option>').join('');
  if(!names.length)el.event.innerHTML='<option value="">No events available</option>';el.event.required=!kind.chapter;}
 if(changed==='type'||changed==='event'||!changed){const ev=el.event.value;
  el.lessonId.innerHTML=courseLessons(ev).map((l,i)=>'<option value="'+esc(l.id)+'"'+(l.id===form.dataset.lesson?' selected':'')+'>'+(i+1)+'. '+esc(l.title)+'</option>').join('');
  el.testId.innerHTML=practiceTestList().filter(t=>t.event===ev).map(t=>'<option value="'+esc(t.id)+'">'+esc(testLabel(t.id))+'</option>').join('');}
 const show=(name,on)=>{const f=form.querySelector('[data-show="'+name+'"]');f.hidden=!on;f.querySelectorAll('select,input').forEach(c=>{c.disabled=!on;});};
 show('lesson',kind.pick==='lesson');show('test',kind.pick==='test');
 const acc=form.querySelector('[name=goal][value=accuracy]');acc.disabled=!kind.accuracy;if(!kind.accuracy)form.querySelector('[name=goal][value=completion]').checked=true;
 form.querySelectorAll('.goal-option').forEach(o=>o.classList.toggle('selected',o.querySelector('input').checked));
 const accuracy=el.goal.value==='accuracy';show('target',accuracy);
 if(changed==='targetRange')el.target.value=el.targetRange.value;if(changed==='target')el.targetRange.value=el.target.value;
 form.querySelector('[data-goal-note]').textContent=!kind.accuracy?'A reading lesson has no score. Assign its lesson practice to set an accuracy goal.':accuracy?(['Practice test','Lesson checkpoint'].includes(kind.type)?'Valus scores every attempt; their best attempt counts.':'You score each submission from the assignment’s response list.'):'Done as soon as they '+({'Practice test':'submit the test','Lesson':'mark the lesson complete','Lesson checkpoint':'submit the lesson practice'}[kind.type]||'submit their work')+'.';
 // The title follows the choices until the teacher types their own.
 if(form.dataset.titleEdited!=='1'){const ev=el.event.value,lesson=findCourseLesson(el.lessonId.value)?.lesson;
  el.title.value=kind.type==='Practice test'?(ev?ev+' · '+testLabel(el.testId.value):''):kind.type==='Lesson'?(lesson?'Read: '+lesson.title:''):kind.type==='Lesson checkpoint'?(lesson?'Lesson practice: '+lesson.title:''):kind.type==='Skill'?(ev?ev+' skill practice':'Skill practice'):kind.type==='Online submission'?(ev?ev+' submission draft':'Online submission draft'):'Reflection';}
 const n=studentsIn(el.event.value),who=el.event.value?esc(el.event.value):'the whole chapter';
 form.querySelector('[data-summary]').innerHTML=icon('users')+'<span>For '+(cache.students?'<strong>'+n+' student'+(n===1?'':'s')+'</strong> in ':'')+who+' · '+(accuracy?'done at <strong>'+esc(el.target.value||'?')+'%</strong> or higher':'done on <strong>completion</strong>')+(el.due.value?' · due '+date(el.due.value):'')+'</span>';}
function createAssignmentModal(lessonId){const found=lessonId&&findCourseLesson(lessonId),start=found?'Lesson checkpoint':'Practice test';
 const due=new Date(Date.now()+7*864e5).toLocaleDateString('en-CA');
 showModal('Give your chapter a next step.','<form id="create-assignment" class="assign-form" data-lesson="'+esc(found?.lesson.id||'')+'">'+
  '<fieldset class="assign-kinds"><legend>What are you assigning?</legend><div>'+ASSIGN_KINDS.map(k=>'<label class="assign-kind"><input type="radio" name="type" value="'+esc(k.type)+'"'+(k.type===start?' checked':'')+'>'+icon(k.ico)+'<span><strong>'+k.label+'</strong><small>'+k.note+'</small></span></label>').join('')+'</div></fieldset>'+
  '<div class="form-grid"><label class="field">Event<select name="event" required>'+(found?'<option selected>'+esc(found.name)+'</option>':'')+'</select></label><label class="field" data-show="lesson">Lesson<select name="lessonId" required></select></label><label class="field" data-show="test" hidden>Practice test<select name="testId" required></select></label></div>'+
  '<fieldset class="assign-goal"><legend>Counts as done when</legend><div class="goal-options"><label class="goal-option"><input type="radio" name="goal" value="completion" checked><span><strong>Completion</strong><small>They finish it</small></span></label><label class="goal-option"><input type="radio" name="goal" value="accuracy"><span><strong>Accuracy</strong><small>They reach a target score</small></span></label></div>'+
  '<div class="target-field" data-show="target" hidden><label for="target-range">Target accuracy</label><input id="target-range" type="range" name="targetRange" min="50" max="100" step="5" value="80" aria-label="Target accuracy"><span class="target-number"><input type="number" name="target" min="1" max="100" step="1" value="80" required aria-label="Target accuracy percent">%</span></div><small class="subtle" data-goal-note></small></fieldset>'+
  '<label class="field">Title<input name="title" maxlength="140" required placeholder="e.g. Review your event guidelines"></label>'+
  '<label class="field">Due date<input type="date" name="due" required value="'+due+'" min="'+new Date().toLocaleDateString('en-CA')+'"></label>'+
  '<label class="field">Instructions (optional)<textarea name="instructions" rows="3" maxlength="4000" placeholder="Anything students should focus on?"></textarea></label>'+
  '<p class="assign-summary" data-summary></p><div class="modal-actions"><button class="button secondary" type="button" data-action="close">Cancel</button><button class="button" type="submit">Assign</button></div></form>');
 modal.classList.add('modal-wide');syncAssignmentForm(modal.querySelector('#create-assignment'));}
let quizIndex=0,quizAnswers=[];
function quizModal(){const q=LESSONS[quizIndex];showModal('A quick check-in.','<span class="eyebrow">QUESTION '+(quizIndex+1)+' OF '+LESSONS.length+'</span><h3 class="quiz-question">'+q.question+'</h3><form id="quiz-answer"><div class="quiz-options">'+q.options.map((o,i)=>'<label><input type="radio" name="answer" value="'+i+'" required><span>'+esc(o)+'</span></label>').join('')+'</div><button type="submit" class="button">Check answer</button></form>');}
function confirmModal(title,text,action,attrs,label){showModal(title,'<p class="lesson-body">'+text+'</p><div class="modal-actions">'+button(label,action,attrs)+button('Cancel','close','',true)+'</div>');}

// ---------- auth helpers ----------
// Auth forms are updated in place rather than re-rendered, so typed passwords survive a failed attempt.
function showAuthError(message){authError=message;const slot=document.querySelector('.auth-card .auth-error[role=alert]');if(slot){slot.textContent=message;slot.hidden=!message;}}
// Keeps names, email and school for the next render. Passwords are never kept.
function formData(form){const d=Object.fromEntries(new FormData(form));for(const k of ['firstName','lastName','email','communityId'])if(k in d)draft[k]=d[k];return d;}
function authBusy(trigger,label){const card=document.querySelector('.auth-card');const controls=card?[...card.querySelectorAll('button,input,select')].filter(c=>!c.disabled):[];const html=trigger?.innerHTML;
 busy=true;controls.forEach(c=>{c.disabled=true;});if(trigger)trigger.innerHTML=(trigger.classList.contains('google')?googleMark:'')+label;
 return()=>{busy=false;if(!trigger?.isConnected)return;controls.forEach(c=>{c.disabled=false;});trigger.innerHTML=html;};}
function welcome(){cache={};errors={};draft={};try{localStorage.setItem('valus-returning','1');}catch{}toast('Welcome to '+(me()?.community?.name||'your chapter')+'.');}

// ---------- motion ----------
// View transitions where the browser has them; every path still works, instantly, without.
let lastRoute=location.hash.slice(1)||'/',enterStart=performance.now(),authSwap=null;
const isAuthRoute=r=>r==='/student'||r==='/teacher';
const stillMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function withTransition(kind,update,after){const root=document.documentElement;
 if(!document.startViewTransition||stillMotion()){update();return;}
 root.dataset.vt=kind;const t=document.startViewTransition(update);
 t.ready.then(()=>after?.()).catch(()=>{});t.finished.finally(()=>{if(root.dataset.vt===kind)delete root.dataset.vt;});}
// The new theme spreads out from the toggle in a circle; browsers without view transitions cross-fade the colours.
function toggleTheme(btn){const root=document.documentElement,next=root.dataset.theme==='dark'?'light':'dark';
 const apply=()=>{root.dataset.theme=next;try{localStorage.setItem('valus-theme',next);}catch{}document.querySelectorAll('.theme-toggle').forEach(b=>{b.outerHTML=themeButton();});document.querySelectorAll('.theme-toggle').forEach(b=>b.classList.add('spun'));};
 if(!document.startViewTransition){if(!stillMotion()){root.classList.add('theme-fade');setTimeout(()=>root.classList.remove('theme-fade'),700);}apply();return;}
 const r=btn.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,end=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
 withTransition('theme',apply,()=>root.animate({clipPath:['circle(0px at '+x+'px '+y+'px)','circle('+end+'px at '+x+'px '+y+'px)']},{duration:700,easing:'cubic-bezier(.65,0,.35,1)',pseudoElement:'::view-transition-new(root)'}));}
// Login pages rise in piece by piece. A re-render mid-way (the session arriving) picks up where it left off.
function markEntrance(){const page=document.querySelector('.auth-student,.auth-teacher'),t=performance.now()-enterStart;if(!page||t>1400)return;
 page.classList.add('auth-enter');page.style.setProperty('--enter-t',-Math.round(t)+'ms');}
// A soft ripple from wherever a button is pressed.
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.button,.icon-button,.auth-tabs button,.filter-tabs button');if(!b||b.disabled||stillMotion())return;
 const r=b.getBoundingClientRect(),s=document.createElement('span');s.className='ripple';s.setAttribute('aria-hidden','true');
 s.style.cssText='left:'+(e.clientX-r.left)+'px;top:'+(e.clientY-r.top)+'px;--size:'+Math.round(Math.max(r.width,r.height)*2.2)+'px';b.append(s);s.addEventListener('animationend',()=>s.remove());});

// ---------- actions ----------
async function run(task){try{await task();}catch(err){toast(err.message);}}
document.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el||el.disabled)return;const action=el.dataset.action;
 if(action==='theme'){toggleTheme(el);return;}
 if(action==='close'){modal.close();return;}
 if(action==='menu'){document.querySelector('.sidebar').classList.toggle('open');return;}
 if(action==='auth-tab'){if(authTab===el.dataset.value)return;authSwap=authTab;authTab=el.dataset.value;authError='';render();return;}
 if(action==='google'){showAuthError('');const restore=authBusy(el,'Opening Google…');googleSignIn().catch(err=>showAuthError(err.message)).finally(restore);return;}
 if(action==='google-create'){const form=el.closest('form');if(![...form.querySelectorAll('[data-community]')].every(f=>f.reportValidity()))return;const d=formData(form);showAuthError('');const restore=authBusy(el,'Opening Google…');
  createAccount({method:'google',role:form.dataset.role,communityId:d.communityId,password:d.password,firstName:d.firstName,lastName:d.lastName}).then(ok=>{if(ok)welcome();}).catch(err=>showAuthError(err.message)).finally(restore);return;}
 if(action==='reset-password'){const email=document.querySelector('#signin-form [name=email]');if(!email.value.trim()){showAuthError('Enter your email above, then choose Forgot your password.');email.focus();return;}if(!email.reportValidity())return;
  const restore=authBusy(el,'Sending…');resetPassword(email.value).then(()=>{showAuthError('');toast('If an account uses that email, a reset link is on its way.');}).catch(err=>showAuthError(err.message)).finally(restore);return;}
 if(action==='sign-out'){authError='';draft={};authTab='signin';const route=location.hash.slice(1),dest=route==='/student'||route==='/teacher'?route:home().slice(1);run(async()=>{await signOut();location.hash=dest;});return;}
 if(action==='retry-profile'){location.reload();return;}
 if(action==='retry'){refresh(el.dataset.key);return;}
 if(action==='lesson'){lessonModal(el.dataset.id);return;}
 if(action==='ask-hal'){modal.close();window.dispatchEvent(new CustomEvent('hal:ask',{detail:{lessonId:el.dataset.id}}));return;}
 if(action==='complete-lesson'){el.disabled=true;run(async()=>{await api('PUT','/progress/lessons/'+encodeURIComponent(el.dataset.id));modal.close();refresh('progress');toast('Lesson complete. One small step forward.');});return;}
 if(action==='assignment'){assignmentModal(el.dataset.id);return;}
 if(action==='create-assignment'||action==='assign-checkpoint'){const lesson=action==='assign-checkpoint'?el.dataset.lesson:undefined;Promise.all([loadAllCourses({view:false}),need('students')||pending.students]).then(()=>createAssignmentModal(lesson),()=>toast('Courses could not load. Check your connection.'));return;}

 if(action==='delete-assignment'){confirmModal('Delete this assignment?','Students will no longer see it, and every response to it is removed.','confirm-delete-assignment','data-id="'+esc(el.dataset.id)+'"','Delete');return;}
 if(action==='confirm-delete-assignment'){el.disabled=true;run(async()=>{await api('DELETE','/assignments/'+encodeURIComponent(el.dataset.id));modal.close();refresh('assignments');toast('Assignment deleted.');});return;}
 if(action==='filter-assignment'){assignmentFilter=el.dataset.value;render();return;}
 if(action==='event-tab'){currentTab=el.dataset.value;render();return;}
 if(action==='save-notes'){toast(writeLocal('notes',document.querySelector('#event-notes').value)?'Your notes are saved on this device.':'Storage is unavailable in this browser.');return;}
 if(action==='quiz'){quizIndex=0;quizAnswers=[];quizModal();return;}
 if(action==='quiz-next'){quizIndex++;if(quizIndex<LESSONS.length){quizModal();return;}const right=quizAnswers.filter(Boolean).length,score=Math.round(right/LESSONS.length*100);
  showModal('A little more prepared.','<div class="quiz-result">'+ring(score)+'<h3>'+right+' of '+LESSONS.length+' correct</h3><p>Review any missed topics, then keep going at your own pace.</p><p class="subtle">Orientation practice does not award rank points.</p>'+button('Back to my event','close')+'</div>');
  run(async()=>{await api('POST','/progress/quizzes',{score});refresh('progress');});return;}
 if(action==='announce'){location.hash='/community';setTimeout(()=>document.querySelector('#post-text')?.focus(),300);return;}
 if(action==='delete-post'){confirmModal('Remove this post?','It disappears from your chapter feed for everyone.','confirm-delete-post','data-id="'+esc(el.dataset.id)+'"','Remove');return;}
 if(action==='confirm-delete-post'){el.disabled=true;run(async()=>{await api('DELETE','/posts/'+encodeURIComponent(el.dataset.id));modal.close();refresh('posts');});return;}
 if(action==='manage-event'){const s=cache.students?.find(x=>x.uid===el.dataset.uid);if(!s)return;showModal('Change '+esc(s.displayName)+'’s event.','<p>The student keeps their lesson progress. Assignments for their old event stop showing for them.</p><form id="manage-event" data-uid="'+esc(s.uid)+'"><label class="field">Annual event<select name="event"><option value="">Not selected (let them choose)</option>'+EVENTS.map(e=>'<option '+(e.name===s.event?'selected':'')+'>'+esc(e.name)+'</option>').join('')+'</select></label><button class="button" type="submit">Save annual event</button></form>');return;}
 if(action==='remove-student'){const s=cache.students?.find(x=>x.uid===el.dataset.uid);if(!s)return;confirmModal('Remove '+esc(s.displayName)+'?','They lose access to your chapter. Their progress is kept, so they can pick up where they left off if they rejoin with the student password. Change the student password to keep them out.','confirm-remove-student','data-uid="'+esc(s.uid)+'"','Remove student');return;}
 if(action==='confirm-remove-student'){el.disabled=true;run(async()=>{await api('DELETE','/students/'+encodeURIComponent(el.dataset.uid));modal.close();refresh('students');toast('Student removed.');});return;}
 if(action==='event-detail'){const ev=EVENTS.find(x=>x.name===el.dataset.event);if(ev)location.hash=eventHref(ev.name);return;}
 if(action==='open-event'){modal.close();location.hash=me()?.event?eventHref(me().event):'#/my-event';return;}
 if(action==='refresh-rankings'){refresh('rankings');return;}

});
document.addEventListener('submit',e=>{const form=e.target;if(!form.classList.contains('score-form'))return;e.preventDefault();
 const raw=form.elements.score.value.trim(),score=raw===''?null:Number(raw),btn=form.querySelector('button');
 if(score!==null&&!(Number.isInteger(score)&&score>=0&&score<=100)){toast('Scores are whole numbers from 0 to 100.');return;}
 btn.disabled=true;run(async()=>{await api('PUT','/assignments/'+encodeURIComponent(form.dataset.id)+'/scores/'+encodeURIComponent(form.dataset.uid),{score});cache.assignments=await loaders.assignments();render();await assignmentModal(form.dataset.id);toast(score===null?'Score cleared.':'Score saved.');}).finally(()=>{btn.disabled=false;});});
document.addEventListener('submit',e=>{const form=e.target;if(!['create-form','signin-form','enroll-form','post-form','create-assignment','submit-assignment','quiz-answer','manage-event'].includes(form.id))return;e.preventDefault();const data=Object.fromEntries(new FormData(form));const submit=form.querySelector('[type=submit]');
 if(form.id==='quiz-answer'){const q=LESSONS[quizIndex],correct=Number(data.answer)===q.answer;quizAnswers.push(correct);showModal(correct?'You’ve got it.':'A chance to learn.','<div class="quiz-feedback">'+icon(correct?'check':'book')+'<p>'+q.explanation+'</p>'+button(quizIndex===LESSONS.length-1?'See my result':'Next question','quiz-next')+'</div>');return;}
 if(form.id==='create-form'||form.id==='signin-form'||form.id==='enroll-form'){const d=formData(form);showAuthError('');
  if(form.id!=='signin-form'&&(!d.firstName?.trim()||!d.lastName?.trim())){showAuthError('Enter your first and last name.');return;}
  const restore=authBusy(submit,{'create-form':'Creating your account…','signin-form':'Signing in…','enroll-form':'Checking…'}[form.id]);
  const task=form.id==='signin-form'?emailSignIn(d.email,d.accountPassword)
   :form.id==='create-form'?createAccount({method:'email',role:form.dataset.role,communityId:d.communityId,password:d.password,firstName:d.firstName.trim(),lastName:d.lastName.trim(),email:d.email,accountPassword:d.accountPassword}).then(welcome)
   :enroll({role:form.dataset.role,communityId:d.communityId,password:d.password,firstName:d.firstName.trim(),lastName:d.lastName.trim()}).then(welcome);
  task.then(()=>{try{localStorage.setItem('valus-returning','1');}catch{}}).catch(err=>showAuthError(err.message)).finally(restore);return;}
 if(submit)submit.disabled=true;
 run(async()=>{
  if(form.id==='post-form'){if(!data.text.trim())throw new Error('Write a message first.');await api('POST','/posts',{body:data.text});refresh('posts');toast('Posted to your chapter.');}
  if(form.id==='create-assignment'){const {targetRange,...body}=data;void targetRange;const {assignment:a}=await api('POST','/assignments',{...body,event:body.event||null,target:body.goal==='accuracy'?Number(body.target):null});modal.close();refresh('assignments');toast(typeLabel(a.type)+' assigned to '+(a.event||'the whole chapter')+'.');}
  if(form.id==='submit-assignment'){if(!data.response.trim())throw new Error('Write a response first.');await api('PUT','/assignments/'+encodeURIComponent(form.dataset.id)+'/submission',{body:data.response});modal.close();refresh('assignments');toast('Assignment submitted.');}
  if(form.id==='manage-event'){await api('PATCH','/students/'+encodeURIComponent(form.dataset.uid),{event:data.event||null});modal.close();refresh('students','rankings');toast('Annual event saved.');}
 }).finally(()=>{if(submit)submit.disabled=false;});});
document.addEventListener('change',e=>{if(e.target.matches('[data-skill]')){const i=Number(e.target.dataset.skill),done=readLocal('skills',[]);writeLocal('skills',e.target.checked?[...new Set([...done,i])]:done.filter(x=>x!==i));}if(e.target.form?.id==='create-assignment')syncAssignmentForm(e.target.form,e.target.name);if(e.target.id==='event-category'){eventFilter=e.target.value;updateEventResults();}if(e.target.id==='event-type'){eventType=e.target.value;updateEventResults();}});
document.addEventListener('change',async e=>{
 if(!e.target.matches('[data-event-pick]'))return;
 if(eventSaving){updateEventResults();return;}
 const name=e.target.dataset.eventPick, next=e.target.checked?name:null;
 eventSaving=true;updateEventResults();
 try{const {profile}=await api('PUT','/me/event',{event:next});delete cache.assignments;delete cache.rankings;setProfile(profile);toast(next?'Selected event saved for your teacher and rankings.':'Event selection cleared.');}
 catch(error){toast(error.message);}
 finally{eventSaving=false;updateEventResults();document.querySelector('[data-event-pick="'+CSS.escape(name)+'"]')?.focus();}
});
document.addEventListener('input',e=>{const af=e.target.form;if(af?.id==='create-assignment'){if(e.target.name==='title')af.dataset.titleEdited='1';if(['target','targetRange','due'].includes(e.target.name))syncAssignmentForm(af,e.target.name);}if(e.target.id==='event-search'){eventSearch=e.target.value;updateEventResults();}if(e.target.id==='student-search'){studentSearch=e.target.value;document.querySelector('#roster-result').innerHTML=roster();}});
window.addEventListener('hashchange',()=>{const route=location.hash.slice(1)||'/',prev=lastRoute;lastRoute=route;
 const update=()=>{if(['/students','/teacher','/analytics'].includes(route))delete cache.students;if(route.startsWith('/analytics/student/'))for(const k of Object.keys(cache))if(k.startsWith('student:'))delete cache[k];if(['/student','/analytics'].includes(route)){delete cache.progress;delete cache.courseProgress;}if(route==='/rankings'||route==='/leaderboard')delete cache.rankings;modal.close();assignmentFilter='All';authError='';if(isAuthRoute(route)&&prev!==route)enterStart=performance.now();render();if(!['#/about','#/instructors'].includes(location.hash))window.scrollTo({top:0,behavior:'instant'});};
 if(prev===route)return update();
 withTransition(route==='/mission'?'mission':['/rankings','/leaderboard'].includes(route)?'rankings':prev==='/student'&&route==='/teacher'?'forward':prev==='/teacher'&&route==='/student'?'back':'page',update);});
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});
// A new account (or signing out) starts with an empty cache.
let lastUid=null;
onSession(()=>{const uid=session.user?.uid??null;if(uid!==lastUid){cache={};errors={};pending={};lastUid=uid;}render();});
render();
startSession();
mountHal();


// Re-read shared selections when returning from another tab or device workflow.
let sharedRefreshAt=0;
window.addEventListener('focus',async()=>{
 if(!session.enrolled||eventSaving||Date.now()-sharedRefreshAt<5000)return;
 sharedRefreshAt=Date.now();const uid=session.user?.uid;
 try{const result=await api('GET','/me');if(uid!==session.user?.uid||!result.profile)return;
 delete cache.students;delete cache.rankings;delete cache.assignments;delete cache.progress;delete cache.courseProgress;setProfile(result.profile);
 }catch{/* Existing retry controls and the next navigation remain available. */}
});

// Refresh an open teacher dashboard without interrupting forms, search or dialogs.
let rosterRefreshing=false;
setInterval(async()=>{
 if(rosterRefreshing||document.hidden||!session.enrolled||!isInstructor()||modal.open||!['#/teacher','#/students','#/analytics'].includes(location.hash)||document.activeElement?.matches('input,textarea,select'))return;
 rosterRefreshing=true;const uid=session.user?.uid;
 try{const students=await loaders.students();if(session.user?.uid!==uid)return;const changed=JSON.stringify(cache.students)!==JSON.stringify(students);cache.students=students;delete errors.students;if(changed)render();}catch{ /* Keep previously loaded data; navigation retries the request. */ }
 finally{rosterRefreshing=false;}
},15000);
