import practice1 from '../dist/practice/hosa-bowl-1.js';
import practice2 from '../dist/practice/hosa-bowl-2.js';
import practice3 from '../dist/practice/hosa-bowl-3.js';
import practice4 from '../dist/practice/hosa-bowl-4.js';
import practice5 from '../dist/practice/hosa-bowl-5.js';
import practice6 from '../dist/practice/hosa-bowl-6.js';

// Answer keys stay on the server. Preserve the original IDs for existing rooms.
const items = [
 ['What is the basic functional unit of the kidney?','nephron'],
 ['Which chamber pumps blood into the aorta?','left ventricle'],
 ['What is the largest artery in the body?','aorta'],
 ['Which blood cells primarily carry oxygen?','red blood cells|erythrocytes|red blood cell|erythrocyte'],
 ['Which protein in red blood cells binds oxygen?','hemoglobin|haemoglobin'],
 ['What is the medical term for a slow heart rate?','bradycardia'],
 ['What is the medical term for a rapid heart rate?','tachycardia'],
 ['Which organ produces bile?','liver'],
 ['Which organ stores bile?','gallbladder|gall bladder'],
 ['What is the largest organ of the human body?','skin'],
 ['Which hormone lowers blood glucose?','insulin'],
 ['Which pancreatic hormone raises blood glucose?','glucagon'],
 ['Which gland produces insulin?','pancreas'],
 ['What is the medical term for difficulty breathing?','dyspnea|dyspnoea'],
 ['What is the medical term for painful urination?','dysuria'],
 ['What does the suffix -itis mean?','inflammation'],
 ['What does the prefix hypo- mean?','below|low|deficient|below normal'],
 ['What does the root hepat- refer to?','liver'],
 ['What does the root nephro- refer to?','kidney|kidneys'],
 ['What does the root osteo- refer to?','bone|bones'],
 ['What does the root derm- refer to?','skin'],
 ['What does the suffix -ectomy mean?','surgical removal|excision|removal'],
 ['What does the suffix -algia mean?','pain'],
 ['What structure connects muscle to bone?','tendon|tendons'],
 ['What structure connects bone to bone?','ligament|ligaments'],
 ['What is the longest bone in the human body?','femur'],
 ['What is the anatomical name for the kneecap?','patella'],
 ['Which muscle separates the thoracic and abdominal cavities?','diaphragm'],
 ['What tiny air sacs are the primary site of gas exchange in the lungs?','alveoli|alveolus'],
 ['Which cranial nerve is responsible for vision?','optic nerve|optic|cranial nerve ii|cranial nerve 2'],
 ['What part of the brain primarily coordinates balance and movement?','cerebellum'],
 ['What is the functional signaling cell of the nervous system?','neuron|neurons'],
 ['What is the natural pacemaker of the heart?','sinoatrial node|sa node'],
 ['Which blood components are central to forming a platelet plug?','platelets|thrombocytes'],
 ['What is the liquid portion of blood called?','plasma'],
 ['Which vessels carry blood toward the heart?','veins'],
 ['Which vessels carry blood away from the heart?','arteries'],
 ['What type of immunity results from receiving ready-made antibodies?','passive immunity|passive'],
 ['What is the term for the complete destruction of all microbial life, including spores?','sterilization|sterilisation'],
 ['What precautions apply to the care of every patient?','standard precautions|standard'],
 ['What is the first link in the chain of infection?','infectious agent|pathogen|causative agent'],
 ['What is the term for an infection acquired in a healthcare setting?','healthcare associated infection|hospital acquired infection|nosocomial infection|hai'],
 ['What ethical principle means doing good for the patient?','beneficence'],
 ['What ethical principle means avoiding harm?','nonmaleficence|non maleficence'],
 ['What ethical principle respects a patient’s right to make decisions?','autonomy'],
 ['What ethical principle concerns fair distribution of care?','justice'],
 ['What is the term for permission given after understanding risks and benefits?','informed consent'],
 ['What is the minimum number of voting members required to conduct business called?','quorum'],
 ['What motion proposes a change to a pending motion?','amend|amendment|motion to amend'],
 ['What motion ends a meeting?','adjourn|motion to adjourn'],
 ['What motion requests a counted standing vote when a voice vote is uncertain?','division|division of the assembly'],
 ['What motion closes debate and moves to an immediate vote?','previous question|the previous question'],
 ['What proportion of votes is ordinarily required to adopt the previous question?','two thirds|2/3|two thirds vote'],
 ['In what year was HOSA founded?','1976'],
 ['What are the three colors of the HOSA emblem?','navy blue maroon medical white|maroon navy blue medical white|navy blue maroon white|maroon navy blue white'],
 ['How many competitors make up a HOSA Bowl team?','4|four'],
 ['How many milliliters are in one liter?','1000|1,000|one thousand'],
 ['How many grams are in one kilogram?','1000|1,000|one thousand'],
 ['What vitamin is necessary for normal blood clotting?','vitamin k|k'],
 ['Deficiency of which vitamin causes scurvy?','vitamin c|c|ascorbic acid'],
 ['Which mineral is the central component of hemoglobin’s heme group?','iron'],
 ['Which nutrient provides four calories per gram and is the body’s main dietary energy source?','carbohydrate|carbohydrates'],
 ['Who is credited with discovering penicillin?','alexander fleming|fleming'],
 ['Who developed the first successful smallpox vaccine?','edward jenner|jenner'],
 ['Who is known for founding modern nursing?','florence nightingale|nightingale'],
];
const originalQuestions = items.map(([prompt, answers], id) => ({id, prompt, answers: answers.split('|')}));
const practiceQuestions = [practice1,practice2,practice3,practice4,practice5,practice6].flatMap(test =>
 test.questions.map((q,index) => {
  if(!Array.isArray(q.options)||!Number.isInteger(q.answer)||!q.options[q.answer])throw new Error('Invalid HOSA Bowl practice answer: '+test.id);
  const letter='ABCD'[q.answer],correct=q.options[q.answer];
  return {
   prompt:q.prompt+' Choices: '+q.options.map((option,i)=>'ABCD'[i]+': '+option).join('; ')+'.',
   answers:[correct,letter,'option '+letter,'answer '+letter],
   spokenAnswer:correct,
   sourceTest:test.id,sourceQuestion:index,topic:q.topic,ref:q.ref,
  };
 })
);
export const BOWL_QUESTIONS = [...originalQuestions,...practiceQuestions.map((q,index)=>({...q,id:originalQuestions.length+index}))];
export const normalizeAnswer = value => String(value).normalize('NFKD').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/^(the|a|an) /,'');
export const isCorrect = (question, answer) => question.answers.some(a => normalizeAnswer(a) === normalizeAnswer(answer));
