import test from 'node:test';
import assert from 'node:assert/strict';
import {EVENTS} from '../dist/model.js';
import {EVENT_DETAILS,TOOL_LABELS} from '../dist/event-details.js';
import {filteredEvents,eventHref,parseEventRoute,eventWorkspace,catalogCards} from '../dist/event-workspace.js';

test('all secondary events have sourced, usable tool routes',()=>{
  assert.equal(Object.keys(EVENT_DETAILS).length,EVENTS.length);
  for(const e of EVENTS){
    const d=EVENT_DETAILS[e.name];
    assert.deepEqual(d.tools.slice(0,2),['rules','lessons']);
    assert.match(d.source,/^https:\/\/hosa.org\/.*\.pdf$/);
    for(const tool of d.tools){
      assert.ok(TOOL_LABELS[tool]);
      const route=parseEventRoute(eventHref(e.name,tool).slice(1));
      assert.equal(route.event.name,e.name);assert.ok(route.valid);
    }
  }
});
test('mixed event formats follow actual requirements instead of broad categories',()=>{
  assert.deepEqual(EVENT_DETAILS['Genetics'].tools,['rules','lessons','tests','video','mock']);
  assert.ok(!EVENT_DETAILS['Healthy Living'].tools.includes('upload'));
  assert.ok(EVENT_DETAILS['Healthy Living'].tools.includes('tests'));
  assert.ok(EVENT_DETAILS['Clinical Specialty'].tools.includes('upload'));
  assert.ok(EVENT_DETAILS['Clinical Specialty'].tools.includes('mock'));
  assert.ok(!EVENT_DETAILS['Clinical Specialty'].tools.includes('tests'));
  assert.ok(EVENT_DETAILS['Forensic Science'].tools.includes('upload'));
  assert.ok(!EVENT_DETAILS['Forensic Science'].tools.includes('mock'));
  assert.ok(EVENT_DETAILS['Researched Persuasive Writing & Speaking'].tools.includes('speech'));
});
test('selected event sorts first; filters preserve category and format constraints',()=>{
  assert.equal(filteredEvents({selected:'Veterinary Science'})[0].name,'Veterinary Science');
  assert.ok(filteredEvents({type:'Testing'}).every(e=>EVENT_DETAILS[e.name].tools.includes('tests')));
  assert.deepEqual(filteredEvents({search:'nursing',category:'Health Science'}),[]);
  assert.equal(filteredEvents({search:'  CPR/First Aid  '})[0].name,'CPR/First Aid');
});
test('event workspace has right-side tools without the dashboard sidebar',()=>{
  const page=eventWorkspace(parseEventRoute('/event/CPR%2FFirst%20Aid/video'),{brand:'Valus',theme:'',teacher:false,selected:'CPR/First Aid'});
  assert.ok(page.includes('data-ug data-event="CPR/First Aid" data-mode="video"'));assert.doesNotMatch(page,/Coming soon/);assert.match(page,/aria-current="page"/);
  assert.match(page,/class="event-tools"/);assert.doesNotMatch(page,/class="sidebar"/);
  assert.match(catalogCards({canSelect:true,selected:'CPR/First Aid'}),/data-event-pick="CPR\/First Aid"[^>]*checked/);
  assert.equal(parseEventRoute('/event/%E0%A4%A/rules'),null);
  assert.equal(parseEventRoute('/event/Genetics/speech').valid,false);
});
