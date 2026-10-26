import {EVENTS, GROUPS} from './model.js';
import {EVENT_DETAILS, TOOL_LABELS} from './event-details.js';
import {coursePage,rulesPage} from './course-workspace.js';
import {practiceTestsPage,hasPracticeTests} from './practice-tests.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const eventHref = (name, tool='rules') => '#/event/'+encodeURIComponent(name)+'/'+tool;
export function filteredEvents({search='', category='All', type='All', selected=null}={}) {
  return EVENTS.filter(e => (category==='All'||e.category===category) &&
    (type==='All'||EVENT_DETAILS[e.name].types.includes(type)) &&
    e.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a,b)=>(b.name===selected)-(a.name===selected)||a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
}
export function catalogCards(options={}) {
  return filteredEvents(options).map(e=>{
    const detail=EVENT_DETAILS[e.name], selected=e.name===options.selected;
    return `<article class="event-card focus-card ${selected?'is-selected':''}">
      ${options.canSelect?`<label class="event-pick" title="${selected?'Clear selected event':'Make this my event'}"><input type="checkbox" data-event-pick="${escape(e.name)}" aria-label="${selected?'Clear':'Select'} ${escape(e.name)} as my event" ${selected?'checked':''} ${options.saving?'disabled':''}><span class="sr-only">My event</span></label>`:''}
      <span class="micro">${escape(e.category)}</span>
      <a class="event-card-link" href="${eventHref(e.name)}"><h3>${escape(e.name)}</h3><p>${escape(detail.summary)}</p><span class="event-card-open">Explore event</span></a>
      <div class="event-type-tags">${detail.types.map(t=>`<span>${escape(t)}</span>`).join('')}${selected?'<span class="selected-label">My event</span>':''}</div>
      ${e.special?'<small class="subtle">IDEA eligibility applies</small>':''}
    </article>`;
  }).join('')||'<div class="empty"><h3>No matching events.</h3><p>Try another search, category, or event type.</p></div>';
}
export function catalogToolbar(search='', category='All', type='All') {
  const select=(id,label,items,value)=>`<label class="select-label">${label}<select id="${id}">${items.map(t=>`<option ${t===value?'selected':''}>${escape(t)}</option>`).join('')}</select></label>`;
  return `<div class="catalog-toolbar"><label class="search-field"><input id="event-search" type="search" placeholder="Search HOSA events" aria-label="Search HOSA events" value="${escape(search)}"></label>${select('event-category','Category',['All',...Object.keys(GROUPS)],category)}${select('event-type','Event type',['All','Testing','Skills','Speech & presentation','Online submission'],type)}</div>`;
}
export function parseEventRoute(route) {
  const match=route.match(/^\/event\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/);
  if(!match)return null;
  try {
    const event=EVENTS.find(e=>e.name===decodeURIComponent(match[1]));
    if(!event)return null;
    const detail=EVENT_DETAILS[event.name], tool=match[2]||'rules';
    return {event,detail,tool,lessonId:match[3]?decodeURIComponent(match[3]):null,valid:detail.tools.includes(tool)&&(!match[3]||tool==='lessons'||tool==='tests')};
  } catch {return null;}
}
export function eventWorkspace({event,detail,tool,valid,lessonId}, {brand,theme,teacher,selected,courseProgress={},userId}) {
  const label=valid?TOOL_LABELS[tool]:'Section unavailable';
  return `<div class="event-focus">
    <header class="event-focus-header">${brand}<h1 class="event-focus-title">${escape(event.name)}</h1><div class="event-focus-actions"><a class="text-button" href="${teacher?'#/students':'#/my-event'}">← ${teacher?'Back to students':'All my events'}</a>${theme}</div></header>
    <div class="event-focus-layout">
      <main id="main" class="event-focus-main" tabindex="-1">
        ${valid&&tool==='rules'?rulesPage(event.name):valid&&tool==='lessons'?coursePage(event.name,lessonId,courseProgress,teacher):valid&&tool==='tests'&&hasPracticeTests(event.name)?practiceTestsPage(event.name,lessonId,{userId}):`<section class="event-coming-soon" aria-labelledby="tool-title"><span class="eyebrow">YOUR EVENT TOOLKIT</span><h2 id="tool-title">${escape(label)}</h2><h3>${valid?'Coming soon.':'Choose an available tool.'}</h3><p>${valid?'A little room for what comes next. This section is being prepared.':'Use the event navigation to continue.'}</p></section>`}
        <p class="event-source">Tool selection is based on the <a href="${escape(detail.source)}" target="_blank" rel="noreferrer">official HOSA guidelines ↗</a>. State requirements may vary. ${escape(detail.note||'')}</p>
      </main>
      <aside class="event-tools"><span class="eyebrow">EVENT SPACE</span><nav aria-label="Event tools">${detail.tools.map((key,i)=>`<a href="${eventHref(event.name,key)}" ${key===tool?'aria-current="page"':''}><span class="tool-number">${String(i+1).padStart(2,'0')}</span><span>${TOOL_LABELS[key]}</span></a>`).join('')}</nav><p>One focus.<br><span>Every possibility.</span></p></aside>
    </div>
  </div>`;
}
