import {COURSES, courseLessons, findCourseLesson, richView} from './courses.js';
import {EVENT_RULES} from './event-rules.js';
import {getLessonMedia} from './lesson-media-map.js';

const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const href = (name,id='') => '#/event/'+encodeURIComponent(name)+'/lessons'+(id?'/'+encodeURIComponent(id):'');
export function rulesPage(name) {
  const rule=EVENT_RULES[name];
  if(!rule)return '<section class="course-card"><h2>Rules unavailable</h2><p>Please open the official guideline link below.</p></section>';
  return `<section class="course-card rules-reader"><span class="eyebrow">OFFICIAL REFERENCE · ${e(rule.season||'2026–27')}</span><h2>Your competition, by the book.</h2><p>Read the complete event guidelines, including eligibility, required materials, test plans, official references, and rating sheets. Your association may have additional requirements.</p><div class="course-actions"><a class="button" href="${e(rule.localPdf||rule.url)}" target="_blank" rel="noreferrer">Open full guideline PDF ↗</a><a class="text-button" href="${e(rule.url)}" target="_blank" rel="noreferrer">Original on HOSA ↗</a>${rule.textUrl?`<a class="text-button" href="${e(rule.textUrl)}" target="_blank" rel="noreferrer">Accessible text ↗</a>`:''}</div><p class="subtle">Source reviewed ${e(rule.reviewed)}. The original HOSA publication controls if a saved copy differs.</p><iframe class="rules-pdf" title="${e(name)} official HOSA guidelines" src="${e(rule.localPdf||rule.url)}#view=FitH" loading="lazy"></iframe><p class="subtle">If your browser cannot display the PDF, use Open full guideline PDF above.</p></section>`;
}

export function coursePage(name, lessonId, progress={}, teacher=false) {
 const course=COURSES[name];
 if(!course)return '<section class="course-card"><span class="eyebrow">COURSE LIBRARY</span><h2>This course is next on the list.</h2><p>Lesson courses are being added event by event. This event’s full official rules are available in the Rules tab.</p></section>';
 const lessons=courseLessons(name), completed=new Set(progress.completed||[]), accuracy=progress.accuracy||{}, done=lessons.filter(l=>completed.has(l.id)).length;
 const next=lessons.find(l=>!completed.has(l.id));
 if(!lessonId)return `<section class="course-card course-cover"><span class="eyebrow">THE VALUS LEARNING PATH</span><h2>Build understanding.<br><em>Then put it to work.</em></h2><p>${course.intro?e(course.intro)+' ':'A guided path from foundations to event practice. '}Read, explore, and mark each lesson complete when you are ready to move on. ${teacher?'Every lesson ends with an optional MCQ + written-response checkpoint. Try it or assign it from the lesson page.':'Every lesson ends with an optional MCQ + written-response checkpoint to check your understanding.'}</p><div class="course-stats"><span><strong>${course.units.length}</strong> units</span><span><strong>${lessons.length}</strong> lessons</span><span><strong>${done}/${lessons.length}</strong> complete</span></div><progress value="${done}" max="${lessons.length}" aria-label="Course progress"></progress><div class="course-actions"><a class="button" href="${href(name,next?.id||lessons[0].id)}">${done?'Continue learning':'Start learning'} →</a><span class="subtle">${teacher?'Teacher preview':'Progress saved to your account'}</span></div></section><div class="course-units">${course.units.map((u,ui)=>`<section class="course-card"><span class="eyebrow">UNIT ${String(ui+1).padStart(2,'0')}</span><h3>${e(u.title)}</h3>${u.summary?`<p>${e(u.summary)}</p>`:''}<ol class="course-lesson-list">${u.lessons.map(l=>{const i=lessons.indexOf(l), score=accuracy[l.id];return `<li><a href="${href(name,l.id)}"><span class="lesson-status">${completed.has(l.id)?'✓':String(i+1).padStart(2,'0')}</span><span><strong>${e(l.title)}</strong><small>${e(l.minutes)} min${score?' · Checkpoint '+score.latest+'%':''}</small></span></a></li>`;}).join('')}</ol></section>`).join('')}</div>`;
 const index=lessons.findIndex(l=>l.id===lessonId), lesson=lessons[index];
 if(!lesson)return `<section class="course-card"><h2>Lesson not found</h2><a href="${href(name)}">Return to the course</a></section>`;
 const unit=course.units.find(u=>u.lessons.includes(lesson)), following=lessons[index+1], isDone=completed.has(lesson.id);
 const forward=teacher?(following?`<a class="button" href="${href(name,following.id)}">Next lesson →</a>`:'')
  :isDone?(following?`<a class="button" href="${href(name,following.id)}">Next lesson →</a>`:`<a class="button" href="${href(name)}">Back to course overview</a>`)
  :`<button class="button" type="button" data-course-complete="${e(lesson.id)}" data-next="${e(following?href(name,following.id):href(name))}">${following?'Mark complete & continue':'Mark complete & finish course'} →</button>`;
 return `<article class="lesson-reader" data-lesson-id="${e(lesson.id)}"><header class="lesson-heading"><span class="eyebrow">${e(unit.title)} · LESSON ${index+1} / ${lessons.length}</span><h2>${e(lesson.title)}</h2><p>${e(lesson.minutes)} min · ${isDone?'Completed · review any time':'Learn → explore → apply'}</p></header>${lesson.rich&&richView?richView.richLessonBody(lesson):legacyBody(lesson,name)}<section class="lesson-sources"><h3>Go deeper</h3><ul>${lesson.sources.map(s=>`<li><a href="${e(s.url)}" target="_blank" rel="noreferrer">${e(s.title)} ↗</a></li>`).join('')}</ul><p>Valus lessons are independent study material. Use the official references and rating sheets for complete competition preparation.</p></section>${lessonCheckpoint(lesson,teacher)}<nav class="course-actions" aria-label="Lesson navigation">${index?`<a class="text-button" href="${href(name,lessons[index-1].id)}">← Previous lesson</a>`:''}${forward}</nav><p class="course-complete-status" role="status" aria-live="polite"></p></article>`;
}

function legacyBody(lesson,name){
 const media=getLessonMedia(name,lesson);
 return `<section class="course-card objectives"><h3>What you’ll be able to do</h3><ul>${lesson.objectives.map(o=>`<li>${e(o)}</li>`).join('')}</ul></section><div class="lesson-prose">${lesson.sections.map(s=>`<section><h3>${e(s.title)}</h3>${s.paragraphs.map(p=>`<p>${e(p)}</p>`).join('')}</section>`).join('')}</div>${diagram(lesson.diagram)}${media.map(m=>`<figure class="lesson-media"><img src="${e(m.url)}" alt="${e(m.alt||m.title)}" loading="lazy" referrerpolicy="no-referrer"><figcaption>${e(m.title)} · <a href="${e(m.source)}" target="_blank" rel="noreferrer">${e(m.credit)} · ${e(m.license)} ↗</a></figcaption></figure>`).join('')}<section class="course-card worked-example"><span class="eyebrow">WORKED EXAMPLE</span><h3>${e(lesson.example.prompt)}</h3><p>${e(lesson.example.explanation)}</p></section>${lab(lesson,name)}`;
}

function diagram(d){if(!d)return '';return `<section class="course-card concept-map"><span class="eyebrow">EXPLORE THE CONCEPT</span><h3>${e(d.title)}</h3><p class="subtle">Open each part to reveal its role. This is a conceptual model, not an anatomical scale drawing.</p><div class="diagram-nodes">${d.nodes.map((n,i)=>`<details><summary><span>${String(i+1).padStart(2,'0')}</span>${e(n.label)}</summary><p>${e(n.detail)}</p></details>`).join('')}</div></section>`;}
function lab(lesson,name){
 const kind=lesson.lab?.kind||(name==='Medical Math'?'dose':name==='Biotechnology'?'dilution':null);
 if(!kind)return '';
 if(kind==='dose')return `<section class="course-card live-lab" data-lab="dose"><span class="eyebrow">VIRTUAL LAB · DIMENSIONAL ANALYSIS</span><h3>Make the units cancel.</h3><p>Change the simulated order and concentration. Predict the volume first, then compare the result. These invented values are for arithmetic practice only.</p><label>Ordered amount (mg)<input type="range" min="10" max="100" step="10" value="40" data-lab-a></label><label>Concentration (mg/mL)<input type="range" min="5" max="50" step="5" value="20" data-lab-b></label><output aria-live="polite"></output><svg viewBox="0 0 400 72" role="img" aria-label="Calculated volume relative to a 20 mL measuring scale"><rect x="5" y="12" width="390" height="40" rx="9" fill="var(--surface-3)"/><rect data-lab-fill x="5" y="12" width="0" height="40" rx="9" fill="var(--red)"/></svg><p class="subtle">What happens when concentration doubles while the ordered amount stays constant? Explain why before changing the sliders.</p></section>`;
 if(kind==='dilution')return `<section class="course-card live-lab" data-lab="dilution"><span class="eyebrow">VIRTUAL LAB · SOLUTION PREPARATION</span><h3>Explore a dilution.</h3><p>Use C₁V₁ = C₂V₂ with a 100 mL final volume. Predict how much stock is needed, then move the sliders.</p><label>Stock concentration (%)<input type="range" min="10" max="100" step="10" value="80" data-lab-a></label><label>Target concentration (%)<input type="range" min="1" max="10" value="5" data-lab-b></label><output aria-live="polite"></output><svg viewBox="0 0 400 72" role="img" aria-label="Stock volume fraction of the final solution"><rect x="5" y="12" width="390" height="40" rx="9" fill="var(--surface-3)"/><rect data-lab-fill x="5" y="12" width="0" height="40" rx="9" fill="var(--red)"/></svg><p class="subtle">The filled area is stock; the remaining area is diluent. What changes if the target concentration doubles?</p></section>`;
 return '';
}
// Every lesson ends with an optional checkpoint. Students can skip it and still move on;
// their attempts are graded and saved. Teachers can try it (graded, not saved) and assign it.
function lessonCheckpoint(l,teacher){
 const intro=teacher
  ?'Teacher preview: try the checkpoint below. It is graded but not saved. Students can take it any time, and you can assign it to collect everyone’s accuracy.'
  :'Optional. Check your understanding with '+l.mcqs.length+' multiple-choice questions and a written response graded by Valus AI. You can move on without it; if you submit, your accuracy is saved for your teacher. If your teacher assigned this checkpoint, submitting here counts.';
 const key=teacher?`<details class="checkpoint-key"><summary>Show answer key</summary><ol>${l.mcqs.map(q=>`<li>${e(q.prompt)} <strong>${e(q.options[q.answer])}</strong></li>`).join('')}</ol><p><strong>Model written answer:</strong> ${e(l.frq.modelAnswer)}</p></details><button class="button secondary" type="button" data-action="assign-checkpoint" data-lesson="${e(l.id)}">Assign this checkpoint to students →</button>`:'';
 return `<section class="course-card checkpoint" id="lesson-checkpoint"><span class="eyebrow">LESSON CHECKPOINT · MCQ + WRITTEN RESPONSE</span><h3>Put your understanding to work.</h3>${checkpointForm(l.id,{url:'/courses/lessons/'+encodeURIComponent(l.id)+'/checkpoint',intro,teacher})}${key}</section>`;
}

/** The MCQ + FRQ checkpoint as a slideshow: one question per slide, the written response last.
 * Used at the end of each lesson and in checkpoint assignments. */
export function checkpointForm(lessonId, {url,intro,teacher=false}={}) {
 const found=findCourseLesson(lessonId);
 if(!found)return '<p class="lesson-body">This checkpoint’s lesson is no longer available.</p>';
 const l=found.lesson, n=l.mcqs.length;
 const dots=l.mcqs.map((_,i)=>`<button type="button" class="cp-dot" data-go="${i}" aria-label="Question ${i+1}">${i+1}</button>`).join('')+`<button type="button" class="cp-dot cp-dot-frq" data-go="${n}" aria-label="Written response">Written</button>`;
 const slides=l.mcqs.map((q,i)=>`<fieldset class="cp-slide" data-slide="${i}" tabindex="-1"${i?' hidden':''}><legend><span class="cp-qnum">Question ${i+1} of ${n}</span>${e(q.prompt)}</legend>${q.options.map((o,j)=>`<label class="mcq-option"><input type="radio" name="mcq${i}" value="${j}"><span>${e(o)}</span></label>`).join('')}<p class="question-feedback" data-feedback="${i}"></p></fieldset>`).join('');
 const frq=`<div class="cp-slide cp-frq" data-slide="${n}" tabindex="-1" hidden><label class="field"><span class="cp-qnum">Written response</span><strong>${e(l.frq.prompt)}</strong><textarea name="response" minlength="80" maxlength="10000" rows="8" placeholder="Explain your reasoning using the concepts from this lesson…"></textarea></label><div class="frq-rubric"><h4>Your response is assessed on</h4><ul>${l.frq.rubric.map(r=>`<li>${e(r.label)}</li>`).join('')}</ul><p class="subtle">Your response is graded by Valus AI using the lesson rubric. Do not include personal or patient information.</p></div><p role="status" class="assessment-result" aria-live="polite"></p><button class="button" type="submit">Submit checkpoint →</button><small class="draft-status" aria-live="polite"></small></div>`;
 return `<div class="checkpoint"><p class="lesson-body">${intro?e(intro):`Review <a href="#/event/${encodeURIComponent(found.name)}/lessons/${encodeURIComponent(l.id)}">${e(l.title)}</a> first if you need to. Answer each question, then write your response. Your accuracy is recorded for your teacher.`} AI feedback can make mistakes; discuss disputed feedback with your instructor.</p><form class="cp" data-checkpoint="${e(url)}" data-lesson="${e(l.id)}" data-teacher="${teacher?'1':''}" novalidate><div class="cp-top"><div class="cp-progress"><span class="cp-count" aria-live="polite">Question 1 of ${n}</span><span class="cp-answered"></span></div><div class="cp-bar" aria-hidden="true"><span></span></div><nav class="cp-dots" aria-label="Checkpoint questions">${dots}</nav></div><div class="cp-stage">${slides}${frq}</div><div class="cp-nav"><button type="button" class="button secondary" data-cp-prev>← Previous</button><button type="button" class="button" data-cp-next>Next →</button></div></form></div>`;
}

export function mountCheckpoint(root,{api,userId,onSubmitted}) {
 const form=root.querySelector('[data-checkpoint]');
 if(!form)return;
 const lesson=findCourseLesson(form.dataset.lesson).lesson, n=lesson.mcqs.length, teacher=form.dataset.teacher==='1';
 // Progress is kept per lesson, so the in-lesson checkpoint and its assignment share it. It is saved on this
 // device at once and to the student's account shortly after, so it survives reloads, sign-outs and other devices.
 const draftKey='valus-checkpoint-draft:'+(userId||'guest')+':'+lesson.id, oldKey='valus-checkpoint-draft:'+userId+':'+form.dataset.checkpoint;
 const draftUrl='/courses/lessons/'+encodeURIComponent(lesson.id)+'/checkpoint/draft';
 const slides=[...form.querySelectorAll('.cp-slide')], dots=[...form.querySelectorAll('[data-go]')];
 const prev=form.querySelector('[data-cp-prev]'), next=form.querySelector('[data-cp-next]'), result=form.querySelector('.assessment-result');
 const answers=()=>lesson.mcqs.map((_,i)=>form.querySelector(`[name="mcq${i}"]:checked`)?.value??null);
 let at=0, saveNote='', touched=false, timer=0, submitted=false;
 const readLocal=()=>{try{return JSON.parse(localStorage.getItem(draftKey))||JSON.parse(localStorage.getItem(oldKey));}catch{return null;}};
 const hasProgress=d=>d&&(d.answers?.some(v=>v!==null&&v!==undefined)||(d.response||'').trim()||d.slide>0);
 const apply=d=>{
  form.elements.response.value=d.response||'';
  form.querySelectorAll('.cp-slide input[type="radio"]').forEach(r=>{r.checked=false;});
  d.answers?.forEach((v,i)=>{const input=v!==null&&form.querySelector(`[name="mcq${i}"][value="${v}"]`);if(input)input.checked=true;});
  const slide=Number.isInteger(d.slide)?Math.min(Math.max(d.slide,0),n):0;
  if(slide!==at){slides[at].hidden=true;at=slide;slides[at].hidden=false;}
  saveNote='Picked up where you left off.';
 };
 const snapshot=()=>({answers:answers().map(v=>v===null?null:Number(v)),response:form.elements.response.value,slide:at});
 const status=t=>{saveNote=t;const s=form.querySelector('.draft-status');if(s)s.textContent=t;update();};
 const pushRemote=async()=>{
  clearTimeout(timer);timer=0;
  if(teacher||!userId)return;
  try{await api('PUT',draftUrl,snapshot());status('Progress saved.');}
  catch{status('Saved on this device. It will sync to your account when you are back online.');}
 };
 const save=()=>{
  touched=true;
  try{localStorage.setItem(draftKey,JSON.stringify({...snapshot(),at:Date.now()}));if(oldKey!==draftKey)localStorage.removeItem(oldKey);status(teacher?'Draft saved on this device.':'Saving…');}
  catch{status(teacher?'Draft could not be saved on this device.':'Saving…');}
  clearTimeout(timer);timer=setTimeout(pushRemote,700);
 };
 const local=readLocal();
 if(hasProgress(local))apply(local);
 const update=()=>{
  const picked=answers(), done=picked.filter(v=>v!==null).length+(form.elements.response.value.trim().length>=80?1:0);
  form.querySelector('.cp-count').textContent=at<n?`Question ${at+1} of ${n}`:'Written response';
  form.querySelector('.cp-answered').textContent=`${done} of ${n+1} answered`+(saveNote?' · '+saveNote:'');
  form.querySelector('.cp-bar span').style.width=(100*done/(n+1))+'%';
  dots.forEach((d,i)=>{d.classList.toggle('on',i===at);d.toggleAttribute('aria-current',i===at);d.classList.toggle('answered',i<n?picked[i]!==null:form.elements.response.value.trim().length>=80);});
  prev.disabled=at===0;
  next.hidden=at===n;
  next.textContent=at===n-1?'Written response →':'Next →';
 };
 const show=(i,focus=true)=>{
  if(i<0||i>n||i===at)return;
  const dir=i>at?1:-1;
  slides[at].hidden=true;at=i;slides[at].hidden=false;
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)slides[at].animate([{opacity:0,transform:`translateX(${dir*32}px)`},{opacity:1,transform:'none'}],{duration:280,easing:'cubic-bezier(.2,.8,.2,1)'});
  save();
  if(focus)(at===n?form.elements.response:slides[at]).focus({preventScroll:true});
  const top=form.getBoundingClientRect().top;
  if(top<0)form.scrollIntoView({behavior:'smooth',block:'start'});
 };
 prev.addEventListener('click',()=>show(at-1));
 next.addEventListener('click',()=>show(at+1));
 dots.forEach(d=>d.addEventListener('click',()=>show(Number(d.dataset.go))));
 update();
 // The account copy wins when it is newer (for example, the student started on another device).
 if(!teacher&&userId)api('GET',draftUrl).then(({draft})=>{
  if(touched||submitted||!hasProgress(draft))return;
  if(local?.at&&local.at>=Date.parse(draft.updatedAt))return;
  apply(draft);update();
  try{localStorage.setItem(draftKey,JSON.stringify({...snapshot(),at:Date.parse(draft.updatedAt)||Date.now()}));}catch{}
 },()=>{});
 // A draft that only exists on this device (saved offline, or before account saving) is copied up.
 if(!teacher&&userId&&hasProgress(local))timer=setTimeout(pushRemote,1500);
 form.addEventListener('input',save);
 const flush=()=>{if(timer)pushRemote();};
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();});
 addEventListener('pagehide',flush);
 addEventListener('hashchange',flush,{once:true});
 form.addEventListener('submit',async ev=>{
  ev.preventDefault();ev.stopPropagation();
  const button=form.querySelector('[type="submit"]');
  const input={answers:answers().map(v=>v===null?-1:Number(v)),response:form.elements.response.value};
  const blank=input.answers.map((v,i)=>v===-1?i+1:0).filter(Boolean);
  dots.forEach((d,i)=>d.classList.toggle('missing',i<n&&input.answers[i]===-1));
  if(blank.length){result.textContent=`Answer every question before submitting. Still blank: ${blank.join(', ')}. Select a number above to jump to it.`;return;}
  if(input.response.trim().length<80){result.textContent='Write at least 80 characters before submitting.';form.elements.response.focus();return;}
  button.disabled=true;result.textContent='Checking your answers and grading your response…';
  try{
   const r=await api('POST',form.dataset.checkpoint,input);
   r.mcqs.forEach((q,i)=>{form.querySelector(`[data-feedback="${i}"]`).textContent=(q.correct?'Correct. ':'Not quite. ')+q.explanation;form.querySelector(`[data-feedback="${i}"]`).dataset.state=q.correct?'good':'bad';dots[i].dataset.state=q.correct?'good':'bad';});
   result.innerHTML='<strong>Checkpoint accuracy: '+r.accuracy+'%</strong><p>Multiple choice: '+r.mcqCorrect+' of '+r.mcqTotal+' correct. Select any question number above to review its explanation.'+(r.grade?' Written response: '+r.grade.score+'%.':'')+'</p>'+(r.grade?'<p>'+e(r.grade.feedback)+'</p><ul>'+r.grade.criteria.map(c=>'<li><strong>'+e(c.label)+' ('+c.score+'/2)</strong><br>'+e(c.feedback)+'</li>').join('')+'</ul>'+(r.grade.safetyConcern?'<p>Review the safety concern with your instructor.</p>':''):'<p>'+e(r.gradingError||'Your written response was saved but could not be graded yet.')+'</p>')+'<p class="subtle">'+(r.recorded?'Saved. You can revise and resubmit; every attempt is recorded.':'Teacher preview: this attempt was graded but not saved.')+'</p>';
   if(r.recorded){submitted=true;clearTimeout(timer);timer=0;touched=false;saveNote='';try{localStorage.removeItem(draftKey);localStorage.removeItem(oldKey);}catch{}form.querySelector('.draft-status').textContent='';update();}
   button.textContent='Resubmit checkpoint →';
   onSubmitted?.(r);
  }catch(error){result.textContent=error.message+' Your draft is still saved.';}
  finally{button.disabled=false;}
 });
}

export function mountCourse(root,{api,onComplete,userId,onCheckpoint}) {
 const article=root.querySelector('[data-lesson-id]');
 if(!article)return;
 mountCheckpoint(article,{api,userId,onSubmitted:onCheckpoint});
 if(richView&&article.querySelector('.lesson-prose.rich'))richView.mountRichLesson(article);
 article.querySelector('[data-course-complete]')?.addEventListener('click',async ev=>{
  const button=ev.currentTarget, status=article.querySelector('.course-complete-status');
  button.disabled=true;
  try{await api('POST','/courses/lessons/'+encodeURIComponent(button.dataset.courseComplete)+'/complete');onComplete(button.dataset.courseComplete);location.hash=button.dataset.next;}
  catch(error){status.textContent=error.message;button.disabled=false;}
 });
 article.querySelectorAll('.live-lab').forEach(node=>{const update=()=>{const a=Number(node.querySelector('[data-lab-a]').value),b=Number(node.querySelector('[data-lab-b]').value),dose=node.dataset.lab==='dose',v=dose?a/b:b*100/a;node.querySelector('output').textContent=dose?`${a} mg ÷ ${b} mg/mL = ${v.toFixed(2)} mL`:`${a}% × V₁ = ${b}% × 100 mL → ${v.toFixed(2)} mL stock + ${(100-v).toFixed(2)} mL diluent`;node.querySelector('[data-lab-fill]').setAttribute('width',String(390*Math.min(1,v/(dose?20:100))));};node.addEventListener('input',update);update();});
 article.querySelectorAll('.lesson-media img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;const p=document.createElement('p');p.textContent='Image unavailable here. Open the credited source to view the illustration.';img.after(p);},{once:true}));
}
