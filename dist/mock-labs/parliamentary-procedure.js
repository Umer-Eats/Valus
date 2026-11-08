// Parliamentary Procedure · Lab 01: chairing a chapter business meeting with a secret-topic agenda.
// Rating sheet: HOSA 2026-27 Parliamentary Procedure Round Two Meeting Presentation Rubric (162 points).
// Voice, stage presence and diction (D1–D3, 15 points) are judged live and are not scored here, so this lab totals 147.
import {lab} from '../mock-lab-grade.js';

const NAMES = /Lee|Patel|Johnson|Garcia|Nguyen/g;
// One motion's panel: whether it needs a second, whether it is debatable, and the vote it takes.
const rules = (second, debate, vote) => ({k: 'r', q: [['Second', ...second], ['Debate', ...debate], ['Vote', ...vote]]});
const YES_SECOND = ['Requires a second', 'No second needed'], NO_SECOND = ['No second needed', 'Requires a second'];
const DEBATABLE = ['Debatable', 'Not debatable'], NOT_DEBATABLE = ['Not debatable', 'Debatable'];
const MAJ = ['Majority vote', 'Two-thirds vote'], TWO_THIRDS = ['Two-thirds vote', 'Majority vote'], NO_VOTE = ['No vote; the chair responds', 'Majority vote'];

const motionDone = id => q => { const e = q.find(id); return !e ? 'This motion was not demonstrated.' : e.d.good ? true : 'The motion was demonstrated, but not handled correctly.'; };

export default lab({
  id: 'pp-01', event: 'Parliamentary Procedure', number: '01',
  title: 'The Fun Run Meeting', heading: 'Chapter business meeting',
  role: 'Chapter president (presiding officer)', place: 'Westview HOSA chapter · Room 112', startClock: {h: 15, m: 30}, limitSec: 10 * 60,
  skills: ['Round Two · Meeting Presentation'],
  intro: 'You are the chapter president. Run a business meeting from call to order to adjournment and process the secret-topic motions with correct parliamentary terms.',
  scenario: [
    'Secret topic: the chapter wants to hold a 5K Fun Run to raise money for the Westview Free Clinic.',
    'Required motions: a main motion plus Amend, Limit Debate, Recess and Previous Question. Point of Information and Division of the Assembly are welcome extras.',
    'Your secretary sent the minutes of the last meeting in advance. The treasurer and the Fundraising Committee have reports.',
    'Members: Ms. Lee (Fundraising chair), Mr. Patel, Ms. Johnson, Mr. Garcia and Ms. Nguyen. Recognize members properly and keep everyone involved.'
  ],
  infoTab: 'Agenda',
  patient: {name: 'Agenda · October meeting', facts: [['1', 'Call to order'], ['2', 'Approval of minutes'], ['3', 'Treasurer’s report'], ['4', 'Committee reports'], ['5', 'Unfinished business'], ['6', 'New business: 5K Fun Run (secret topic)'], ['7', 'Adjournment']]},
  scrub: '#2f5f8f', scrub2: '#244a70',
  scene: {room: 'meeting', label: 'Room 112. Your lectern with the gavel, the officers’ table with the secretary and treasurer, and the chapter members.',
    deco: [['flag', 70], ['banner', 500, 'HOSA'], ['clock', 880]]},
  start: 'lectern',
  stations: {
    lectern: {name: 'Lectern', tip: 'You preside from here · gavel', art: 'lectern', x: 190},
    officers: {name: 'Officers’ table', tip: 'Secretary (minutes) and treasurer', art: 'members', o: {n: 2, face: -1}, x: 380, stand: 300, face: 1},
    members: {name: 'Members', tip: 'Ms. Lee, Mr. Patel, Ms. Johnson, Mr. Garcia, Ms. Nguyen', art: 'members', o: {n: 5, gap: 70}, x: 720, stand: 520, face: 1}
  },
  acts: {
    callOrder: {at: 'lectern', label: 'Call to order', sub: 'Gavel', talk: true, phase: 'Opening', ex: '(one tap) “The meeting will come to order.”', why: 'One tap of the gavel and call the meeting to order.',
      say: '(taps the gavel once) The meeting of the Westview HOSA chapter will come to order.'},
    minutes: {at: 'officers', label: 'Approve the minutes', sub: 'Previously distributed', kind: 'minutes', talk: true, phase: 'Reports', ex: '“The minutes were sent in advance. Are there any corrections? Hearing none, the minutes are approved as distributed.”',
      why: 'The minutes do not have to be read aloud if they were sent in advance. Ask for corrections, then declare them approved. Your prepared minutes are judged too.',
      say: 'The minutes of the September meeting were distributed in advance. Are there any corrections to the minutes? Hearing none, the minutes are approved as distributed.',
      panel: [{k: 'm', pick: [['motions', 'Each motion with who made it and the result'], ['action', 'Action items and who is responsible'], ['treas', 'The treasurer’s report'], ['comm', 'Committee reports'], ['debate', 'Every word of the debate'], ['opinion', 'The secretary’s opinions']], need: ['motions', 'action', 'treas', 'comm']}]},
    treasurer: {at: 'officers', label: 'Treasurer’s report', sub: 'Then what?', kind: 'report', talk: true, phase: 'Reports', ex: '“The chair recognizes Mr. Kim for the treasurer’s report… The report will be filed for audit.”',
      why: 'The treasurer reports. It is not adopted by a vote: the chair says it will be filed for audit.', say: 'The chair recognizes Mr. Kim for the treasurer’s report. Thank you. Are there any questions? The treasurer’s report will be filed for audit.',
      panel: [{k: 't', label: 'After the report', choose: [['file', 'Ask for questions; it is filed for audit with no vote'], ['vote', 'Take a vote to approve it'], ['skip', 'Move on without comment']], right: ['file'], fix: 'No vote: it is filed for audit.'}]},
    committee: {at: 'members', label: 'Committee report', sub: 'Fundraising Committee', talk: true, phase: 'Reports', ex: '“The chair recognizes Ms. Lee for the Fundraising Committee report.”', why: 'Recognize the committee chair by name for the report.',
      say: 'The chair recognizes Ms. Lee for the Fundraising Committee report. Thank you, Ms. Lee. The report is received.'},
    unfinished: {at: 'lectern', label: 'Unfinished business', sub: 'From last meeting', talk: true, phase: 'Business', ex: '“Under unfinished business, the T-shirt order was completed. Is there any other unfinished business?”',
      why: 'Take up anything left pending from the last meeting.', say: 'Under unfinished business, the chapter T-shirt order from last month has been delivered. Is there any other unfinished business? Hearing none, we move to new business.'},
    newBusiness: {at: 'lectern', label: 'Open new business', sub: 'Secret topic', talk: true, phase: 'Business', ex: '“Is there any new business?”', why: 'Open new business so the secret-topic motion can be made.', say: 'Is there any new business?'},
    main: {at: 'members', label: 'Main motion', sub: '5K Fun Run', kind: 'main motion', talk: true, phase: 'Business', ex: '“The chair recognizes Mr. Patel… Is there a second? It is moved and seconded that we hold a 5K Fun Run. Is there any debate?”',
      why: 'Recognize the member, hear the motion, ask for a second, then state the question so it is before the assembly. A main motion needs a second, is debatable, and takes a majority.',
      say: 'The chair recognizes Mr. Patel. Is there a second? It is moved and seconded that the chapter hold a 5K Fun Run in April to benefit the Westview Free Clinic. Is there any debate?',
      panel: [rules(YES_SECOND, DEBATABLE, MAJ)]},
    debate: {at: 'members', label: 'Guide the debate', sub: 'Both sides', talk: true, phase: 'Business', ex: '“The chair recognizes Ms. Johnson in favor… Is there anyone who wishes to speak against?”',
      why: 'Alternate speakers for and against, and recognize members who have not spoken yet.', say: 'The chair recognizes Ms. Johnson, who has not yet spoken. Thank you. Is there anyone who wishes to speak against the motion? The chair recognizes Mr. Garcia.'},
    amend: {at: 'members', label: 'Amend', sub: 'Subsidiary motion', kind: 'subsidiary', talk: true, phase: 'Motions', ex: '“It is moved and seconded to amend by striking April and inserting May. Those in favor of the amendment say aye…”',
      why: 'Amend changes the wording of the pending motion. It needs a second, is debatable when the main motion is, and takes a majority.',
      say: 'The chair recognizes Ms. Nguyen. Is there a second? It is moved and seconded to amend the motion by striking April and inserting May. Is there any debate on the amendment? Hearing none, those in favor of the amendment say aye. Those opposed say no. The ayes have it and the amendment is adopted.',
      panel: [rules(YES_SECOND, DEBATABLE, MAJ)]},
    info: {at: 'members', label: 'Point of information', sub: 'Optional extra', kind: 'request', talk: true, phase: 'Motions', ex: '“Please state your point.” … “The registration fee would be $15.”', why: 'A request for information: no second, no debate, no vote. The chair or another member answers.',
      say: 'For what purpose does Ms. Lee rise? Please state your point of information. The chair answers that registration would be 15 dollars per runner.',
      panel: [rules(NO_SECOND, NOT_DEBATABLE, NO_VOTE)]},
    limit: {at: 'members', label: 'Limit debate', sub: 'Subsidiary motion', kind: 'subsidiary', talk: true, phase: 'Motions', ex: '“It is moved and seconded to limit debate to two minutes per speaker. This requires a two-thirds vote. Those in favor please rise…”',
      why: 'Limit Debate needs a second, is not debatable, and takes a two-thirds vote, usually by rising.',
      say: 'The chair recognizes Mr. Garcia. Is there a second? It is moved and seconded to limit debate to two minutes per speaker. This is not debatable and requires a two-thirds vote. Those in favor please rise. Be seated. Those opposed please rise. Be seated. There are two-thirds in the affirmative and the motion is adopted.',
      panel: [rules(YES_SECOND, NOT_DEBATABLE, TWO_THIRDS)]},
    recess: {at: 'members', label: 'Recess', sub: 'Privileged motion', kind: 'privileged', talk: true, phase: 'Motions', ex: '“It is moved and seconded to recess for five minutes. Those in favor say aye… The meeting stands in recess.”',
      why: 'Recess (while business is pending) is privileged: it needs a second, is not debatable, and takes a majority.',
      say: 'The chair recognizes Ms. Johnson. Is there a second? It is moved and seconded to recess for five minutes. Those in favor say aye. Those opposed say no. The ayes have it and the meeting stands in recess for five minutes. (taps gavel) The meeting will come to order.',
      panel: [rules(YES_SECOND, NOT_DEBATABLE, MAJ)]},
    previous: {at: 'members', label: 'Previous question', sub: 'Close debate', kind: 'subsidiary', talk: true, phase: 'Motions', ex: '“It is moved and seconded to order the previous question. This requires two-thirds. Those in favor please rise…”',
      why: 'Previous Question closes debate and brings the pending motion to a vote. It needs a second, is not debatable, and takes two-thirds.',
      say: 'The chair recognizes Mr. Patel. Is there a second? It is moved and seconded to order the previous question. This is not debatable and requires a two-thirds vote. Those in favor please rise. Be seated. Those opposed please rise. Be seated. There are two-thirds in the affirmative and the previous question is ordered.',
      panel: [rules(YES_SECOND, NOT_DEBATABLE, TWO_THIRDS)]},
    voteMain: {at: 'lectern', label: 'Vote on the main motion', sub: 'As amended', talk: true, phase: 'Motions', ex: '“The question is on the motion as amended… The ayes have it and the motion is adopted.”',
      why: 'Restate the motion as amended, take the vote, and announce the result and its effect.', say: 'The question is on the motion as amended, that the chapter hold a 5K Fun Run in May to benefit the Westview Free Clinic. Those in favor say aye. Those opposed say no. The ayes have it and the motion is adopted. Ms. Lee’s committee will plan the race.'},
    division: {at: 'members', label: 'Division of the assembly', sub: 'Optional extra', kind: 'incidental', talk: true, phase: 'Motions', ex: '“Division is called. Those in favor please rise…”', why: 'Any member can demand a rising vote after a voice vote. No second, no debate, no vote on the demand: the chair simply retakes the vote standing.',
      say: 'Mr. Garcia calls for a division. Division is called. Those in favor please rise. Be seated. Those opposed please rise. Be seated. The affirmative has it and the motion is adopted.',
      panel: [rules(NO_SECOND, NOT_DEBATABLE, NO_VOTE)]},
    adjourn: {at: 'lectern', label: 'Adjourn', sub: 'Gavel', talk: true, phase: 'Closing', ex: '“Is there any further business? Hearing none, the meeting is adjourned.” (one tap)', why: 'Ask for further business, then the chair declares the meeting adjourned with one tap of the gavel.',
      say: 'Is there any further business? Hearing none, the meeting is adjourned. (taps the gavel once)'}
  },
  flow: ['callOrder', 'minutes', 'treasurer', 'committee', 'unfinished', 'newBusiness', 'main', 'debate', 'amend', 'info', 'limit', 'recess', 'previous', 'voteMain', 'division', 'adjourn'],
  sheets: [{id: 'R2', title: 'Round Two · Meeting Presentation Rubric', who: 'Delivery items D1–D3 (15 points) are judged live and not scored here', max: 147, items: [
    {n: 'A1', pts: 3, text: 'Meeting was called to order.', act: 'callOrder', say: [/order/i, 'calling the meeting to order']},
    {n: 'A2', pts: 3, text: 'Minutes were approved.', act: 'minutes', say: [/approved/i, 'that the minutes are approved']},
    {n: 'A3', pts: 3, text: 'The treasurer’s report was presented.', act: 'treasurer'},
    {n: 'A4', pts: 3, text: 'Committee(s) presented.', act: 'committee'},
    {n: 'A5', pts: 3, text: 'Unfinished business was presented.', act: 'unfinished', say: [/unfinished/i, 'unfinished business']},
    {n: 'A6', pts: 3, text: 'New business (secret topic) was presented.', act: 'newBusiness', before: 'main', say: [/new business/i, 'new business']},
    {n: 'A7', pts: 3, text: 'The president or chairperson adjourned the meeting.', act: 'adjourn', say: [/adjourned/i, '“the meeting is adjourned”']},
    {n: 'B1', pts: 8, text: 'Team correctly demonstrated a main motion.', fn: q => { const r = motionDone('main')(q); if (r !== true) return r; return q.find('voteMain') ? true : 'The main motion was never put to a final vote.'; }},
    {n: 'B2', pts: 8, text: 'Motion #1 (secret topic): Amend.', fn: motionDone('amend')},
    {n: 'B3', pts: 8, text: 'Motion #2 (secret topic): Limit Debate.', fn: motionDone('limit')},
    {n: 'B4', pts: 8, text: 'Motion #3 (secret topic): Recess.', fn: motionDone('recess')},
    {n: 'B5', pts: 8, text: 'Motion #4 (secret topic): Previous Question.', fn: motionDone('previous')},
    {n: 'B6', pts: 8, text: 'Additional motion (optional): Point of Information.', fn: motionDone('info')},
    {n: 'B7', pts: 8, text: 'Additional motion (optional): Division of the Assembly.', fn: motionDone('division')},
    {n: 'C1', pts: 10, text: 'Chair and members were recognized properly at all times.', fn: q => { const m = ['committee', 'main', 'debate', 'amend', 'limit', 'recess', 'previous'].map(a => q.find(a)).filter(Boolean); if (m.length < 5) return 'Not enough of the meeting was held to judge.'; const ok = m.filter(e => /recogni[sz]e|for what purpose/i.test(e.say)).length; return ok === m.length ? true : `Members were recognized properly ${ok} of ${m.length} times. Say “The chair recognizes…”.`; }},
    {n: 'C2', pts: 10, text: 'Used proper parliamentary terminology to process all 4 required motions.', fn: q => { const bad = ['amend', 'limit', 'recess', 'previous'].filter(a => { const e = q.find(a); return !e || !/moved and seconded/i.test(e.say) || !/(aye|rise|in favor)/i.test(e.say); }); return bad.length ? `Terminology was missing for ${bad.length} motion(s): state “it is moved and seconded…” and take the vote.` : true; }},
    {n: 'C3', pts: 10, text: 'Team addressed all agenda items correctly.', fn: q => { const order = ['callOrder', 'minutes', 'treasurer', 'committee', 'unfinished', 'newBusiness', 'adjourn'].map(a => q.pos(a)); if (order.some(p => p === null)) return 'Not every agenda item was addressed.'; return order.every((p, i) => !i || p > order[i - 1]) ? (q.find('treasurer').d.good && q.find('minutes').d.good ? true : 'Some agenda items were not handled properly.') : 'Agenda items were taken out of order.'; }},
    {n: 'C4', pts: 10, text: 'Skill and knowledge of the presiding officer.', fn: q => { const ms = ['main', 'amend', 'limit', 'recess', 'previous', 'info', 'division']; const right = ms.filter(a => q.find(a)?.d.good).length; return right === ms.length ? true : `The chair handled ${right} of ${ms.length} motions correctly.`; }},
    {n: 'D4', pts: 10, text: 'Team participation: every member took part.', fn: q => { const names = new Set(q.acts.flatMap(e => (e.say || '').match(NAMES) || [])); return names.size >= 5 ? true : `Only ${names.size} of the 5 members were brought into the meeting.`; }},
    {n: 'D5', pts: 10, text: 'Quality of discussion: goals of the secret topic accomplished with diverse viewpoints.', fn: q => { const d = q.find('debate'); if (!d) return 'There was no debate on the main motion.'; if (!/against|oppos|other side/i.test(d.say)) return 'Invite speakers on both sides of the question.'; return q.find('voteMain') ? true : 'The secret-topic motion was never decided.'; }},
    {n: 'E1', pts: 10, text: 'Minutes from the previous meeting: motions with names and action items, treasurer’s and committee reports included.', act: 'minutes', part: 'm'}
  ]}],
  status: [['PENDING', (S, has) => has('voteMain') ? 'Main motion adopted' : has('main') ? 'Fun Run motion' : 'Nothing pending'], ['MOTIONS', (S, has) => ['main', 'amend', 'info', 'limit', 'recess', 'previous', 'division'].filter(has).length + ' of 7']]
});
