// Rebuild only after reviewing the downloaded current-season guideline summaries.
import fs from 'node:fs';
import {EVENTS} from '../dist/model.js';
const sources=JSON.parse(fs.readFileSync('outputs/hosa-research/index.json','utf8')).slice(1,65);
if(EVENTS.length!==64||sources.length!==64)throw Error('Catalog changed: review source mapping before rebuilding.');
const speech=new Set([19,21,32,42,43,44,46,47,48,49,51,52,53,54,55,56,58,59,61,62,63,64]);
const skills=new Set([16,17,18,19,20,22,23,24,25,26,27,28,29,30,31,33,34,35,36,37,38,39,41]);
// Parliamentary Procedure is a mock meeting (speech side) but keeps the meeting-practice tool.
const mockOnly=new Set([62]);
const notes={
  10:'The second round is a spelldown; this is not a prepared-speech event.',
  19:'Includes a career portfolio, recorded clinical skill demonstration, and live presentation.',
  21:'The upload is an interview verification form; the presentation is assessed separately.',
  28:'The required online upload is an accommodation form, not a scored project. Review eligibility with your advisor.',
  41:'The required online upload is an accommodation form, not a scored project. Review eligibility with your advisor.',
  45:'The policy letter is written and submitted during the event, rather than uploaded before competition.',
  47:'The portfolio is printed and brought to competition; the ILC guidelines specify no digital upload.',
  48:'Includes application documents and an eligibility accommodation form.',
  50:'Intended for chartered associations selecting voting delegates.',
  53:'The required online upload is an accommodation form, not the speech. Review eligibility with your advisor.',
  57:'The case conclusion is submitted digitally during competition. There is no live clinical skill demonstration.',
  62:'The mock procedure tool supports parliamentary meeting practice, rather than a clinical procedure.',
};
const labels={rules:'Rules',lessons:'Lessons',tests:'Practice Tests',upload:'Online Upload Grader',video:'Skills Video Grader',mock:'Online Mock Procedure',speech:'Speech Grader'};
const details=Object.fromEntries(EVENTS.map((event,index)=>{
  const n=index+1, source=sources[index], text=source.intro.replace(/\s+/g,' ');
  if(source.error)throw Error(source.error);
  const header=text.split('New for')[0];
  const testing=/\d+ Q test/.test(header);
  const upload=/Digital Upload: YES/.test(header);
  const speaking=speech.has(n), skill=skills.has(n);
  const types=[testing&&'Testing',skill&&'Skills',speaking&&'Speech & presentation',upload&&'Online submission'].filter(Boolean);
  let summary=[testing&&'Knowledge test',skill&&'practical demonstration',speaking&&'speech or presentation',upload&&'digital submission'].filter(Boolean).join(' · ')+'.';
  const overrides={10:'Written test followed by a live medical spelldown.',19:'Career portfolio, recorded clinical skill, and live presentation.',21:'Career research, verified interviews, and a presentation.',28:'Patient-care skills assessment with an eligibility form upload.',41:'Basic life-support skills assessment with an eligibility form upload.',45:'Timed health-policy writing with an on-site digital submission.',47:'Knowledge test, printed portfolio, and a personal health presentation.',48:'Application documents and a live interview; IDEA eligibility applies.',49:'Application documents and a live employment interview.',51:'A prepared speech on the annual HOSA theme.',52:'A persuasive research paper and live speech.',53:'A prepared speech with an eligibility form upload.',57:'Knowledge test and case analysis with a digital conclusion.',60:'Knowledge test followed by a team buzzer competition.',62:'Knowledge test and a simulated parliamentary meeting.'};
  summary=overrides[n]||summary.charAt(0).toUpperCase()+summary.slice(1);
  const tools=['rules','lessons',testing&&'tests',upload&&'upload',skill&&'video',(skill||mockOnly.has(n))&&'mock',speaking&&n!==19&&'speech'].filter(Boolean);
  return [event.name,{types,tools,summary,source:source.url,reviewed:'2026-10-19',...(notes[n]?{note:notes[n]}:{})}];
}));
fs.writeFileSync('dist/event-details.js','// Reviewed against HOSA 2026–27 ILC guidelines on October 19, 2026.\n// Tool choices are Valus preparation features, not official HOSA grading services.\nexport const TOOL_LABELS = '+JSON.stringify(labels,null,2)+';\nexport const EVENT_DETAILS = '+JSON.stringify(details,null,2)+';\n');
const report='# HOSA event tool mapping\n\nReviewed October 19, 2026 against the current [HOSA guidelines](https://hosa.org/guidelines/) and [digital upload guidance](https://hosa.org/competitive-event-digital-uploads/).\n\nScope: all 64 regular secondary-division events used by this high-school app. Middle-school-only events, recognition programs, and supplementary academic tests are separate programs and are not annual-event choices.\n\nAll events have Rules and Lessons. Practice Tests follow a written-test requirement. Skills Video Grader supports events where students perform a hands-on skill. Online Mock Procedure supports practical skill demonstrations and parliamentary meeting procedure. Speech Grader supports events where students present, give a speech, interview, or debate. Clinical Specialty keeps its recorded-skill grader; its live presentation does not have a Speech Grader tab. Online Upload Grader is included wherever the guideline specifies an upload, including administrative-only accommodation forms; those exceptions are explicitly labeled. Tools remain Coming soon. These are preparation-tool mappings, not claims that HOSA offers these tools.\n\n| Event | Preparation tools | Notes | Official rule source |\n|---|---|---|---|\n'+Object.entries(details).map(([name,d])=>`| ${name} | ${d.tools.map(t=>labels[t]).join(', ')} | ${d.note||''} | [Guideline](${d.source}) |`).join('\n')+'\n';
fs.writeFileSync('HOSA_EVENT_RESEARCH.md',report);
