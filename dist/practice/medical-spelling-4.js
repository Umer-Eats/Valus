// Medical Spelling Practice Test 4. Original items written for Valus in the format of the HOSA 2026–27
// Round One sample items: a definition, then four spellings, one correct (Taber’s). Misspellings are
// common errors; accepted variant spellings (such as British forms) are never used as wrong answers.
import {q, mix} from './q.js';
const TAB='Taber’s Cyclopedic Medical Dictionary';
const SP='Medical Spelling';
// s(definition, correct, wrong spellings, letter, word-part note)
const s = (def, correct, wrong, letter, note) => q(SP, def, correct, wrong, letter, `The correct spelling is “${correct}.” ${note}`, TAB);

export default {
 id:'medical-spelling-4',
 event:'Medical Spelling',
 title:'Practice Test 4',
 subtitle:'Full-length Round One simulation',
 minutes:60,
 sources:'Taber’s Cyclopedic Medical Dictionary and Taber’s Audio Glossary',
 plan:[{area:SP,weight:100}],
 questions:mix([
  s('Enlargement of the hands, feet and face from excess growth hormone in adults','acromegaly',['acromegally','acromeglay','acromeagly'],'A','Acr/o (extremities) + -megaly (enlargement). One l.'),
  s('Surgical removal of the adenoids','adenoidectomy',['adenoidectemy','adenodectomy','adenoidectomey'],'B','Adenoid + -ectomy (surgical removal).'),
  s('The presence of albumin protein in the urine','albuminuria',['albumenuria','albuminurea','albuminnuria'],'C','Albumin + -uria (urine condition). Spelled “albumin,” not “albumen.”'),
  s('Removal of amniotic fluid with a needle for testing during pregnancy','amniocentesis',['amniocentisis','amniosentesis','amnioscentesis'],'D','Amni/o (amnion) + -centesis (surgical puncture). The vowels in -centesis are e-e-i.'),
  s('A drug that relieves pain','analgesic',['analgesik','analgezic','annalgesic'],'A','An- (without) + alges/o (sensitivity to pain) + -ic.'),
  s('Loss of feeling or sensation, often induced for surgery','anesthesia',['anesthisia','anesthesea','anestesia'],'B','An- (without) + esthesi/o (feeling) + -a. The British form is also accepted, so it is never a wrong choice.'),
  s('Absence of urine production','anuria',['annuria','anurea','anuriah'],'C','An- (without) + -uria (urine condition). One n before the u.'),
  s('A temporary stop in breathing','apnea',['apnia','apnae','apneia'],'D','A- (without) + -pnea (breathing). The British form is also accepted, so it is never a wrong choice.'),
  s('Repair or widening of a narrowed blood vessel, often with a balloon','angioplasty',['angeoplasty','angioplasy','angioplastey'],'A','Angi/o (vessel) + -plasty (surgical repair).'),
  s('Inhaling food or fluid into the airway, or withdrawing fluid by suction','aspiration',['asperation','aspirasion','asspiration'],'B','From Latin aspirare (to breathe upon). One s, and an i after the p.'),
  s('An orange-yellow pigment formed by the breakdown of hemoglobin','bilirubin',['bilirubine','billirubin','bilarubin'],'C','Bil/i (bile) + rubin (red). One l and the ending -in.'),
  s('Visual examination of the airways with a scope','bronchoscopy',['bronchoscopey','bronkoscopy','bronchascopy'],'D','Bronch/o (bronchus) + -scopy (visual examination).'),
  s('The heel bone','calcaneus',['calcanius','calcaneous','calcanaeus'],'A','From Latin calcaneum (heel). The ending is -eus.'),
  s('The smallest blood vessel, connecting arterioles and venules','capillary',['capilary','cappillary','capillery'],'B','From Latin capillus (hair). Double l, ending -ary.'),
  s('Insertion of a flexible tube into a body cavity or vessel','catheterization',['catherterization','cathaterization','cathetarization'],'C','Catheter + -ization. Note the “th” and the e in “cathe-ter.”'),
  s('The part of the brain that coordinates balance and movement','cerebellum',['cerebelum','cerrebellum','cerebellem'],'D','Cerebell/o (little brain) + -um. One r, double l.'),
  s('Treatment of disease, especially cancer, with drugs','chemotherapy',['chemotheraphy','kemotherapy','chemotherepy'],'A','Chem/o (drug, chemical) + -therapy (treatment).'),
  s('Inflammation of the colon','colitis',['collitis','colitus','colytis'],'B','Col/o (colon) + -itis (inflammation). One l.'),
  s('Surgical opening of the skull','craniotomy',['craneotomy','craniotomey','cranotomy'],'C','Crani/o (skull) + -tomy (incision).'),
  s('Failure of one or both testes to descend into the scrotum','cryptorchidism',['cryptorchadism','criptorchidism','cryptorkidism'],'D','Crypt/o (hidden) + orchid/o (testis) + -ism.'),
  s('Visual examination of the urinary bladder with a scope','cystoscopy',['cystascopy','cistoscopy','cystoscopey'],'A','Cyst/o (bladder) + -scopy (visual examination).'),
  s('Removal of dead or damaged tissue from a wound','debridement',['debriedment','debridment','debridemant'],'B','From French débrider (to unbridle). Keep the e before -ment.'),
  s('A device that delivers an electric shock to restore a normal heart rhythm','defibrillator',['defibrilator','defibbrillator','defibrillater'],'C','De- (removal) + fibrillation + -or. Double l, ending -or.'),
  s('A procedure that filters waste from the blood when the kidneys fail','dialysis',['dialisis','dialysys','dyalysis'],'D','Dia- (through) + -lysis (separation). Note “y” then “i.”'),
  s('Indigestion or discomfort in the upper abdomen','dyspepsia',['dispepsia','dyspepsea','dyspepcia'],'A','Dys- (bad, difficult) + -pepsia (digestion).'),
  s('A bruise; bleeding into the skin causing a purple patch','ecchymosis',['echymosis','ecchymoses','eccymosis'],'B','From Greek ek (out) + chymos (juice). Double c, then “hy.”'),
  s('An ultrasound image of the heart','echocardiogram',['echocardiagram','ecocardiogram','echocardiogramm'],'C','Ech/o (sound) + cardi/o (heart) + -gram (record).'),
  s('Any disease or disorder of the brain','encephalopathy',['encephalapathy','encefalopathy','encephalopathey'],'D','En- (in) + cephal/o (head) + -pathy (disease).'),
  s('A worsening or flare-up of a disease or its symptoms','exacerbation',['exasperbation','exacerbasion','exaccerbation'],'A','From Latin exacerbare (to irritate). One c, then -erbation.'),
  s('A crack-like sore or groove, as in the skin or anal lining','fissure',['fisure','fissur','fishure'],'B','From Latin fissura (cleft). Double s, ending -ure.'),
  s('A sexually transmitted bacterial infection caused by Neisseria','gonorrhea',['gonorhea','gonnorrhea','gonorrea'],'C','Gon/o (seed) + -rrhea (flow). One n, double r, then h. The British form is also accepted.'),
  s('Perceiving something that is not present, such as hearing voices','hallucination',['halucination','hallucinasion','hallusination'],'D','From Latin hallucinari (to wander in mind). Double l, single c.'),
  s('A benign tumor made of blood vessels','hemangioma',['hemangeoma','hemaniogma','hemmangioma'],'A','Hem/o (blood) + angi/o (vessel) + -oma (tumor).'),
  s('High levels of fats in the blood','hyperlipidemia',['hyperlipedemia','hyperlipidemea','hyperlippidemia'],'B','Hyper- (excessive) + lipid + -emia (blood condition).'),
  s('Abnormally low blood sugar','hypoglycemia',['hypoglycimia','hypoglicemia','hypoglycemea'],'C','Hypo- (below) + glyc/o (sugar) + -emia (blood condition).'),
  s('Telescoping of one part of the intestine into the next part','intussusception',['intusussception','intussusseption','intussuception'],'D','From Latin intus (within) + suscipere (to receive). Double s twice: in-tus-sus-cep-tion.'),
  s('Inflammation of the cornea','keratitis',['keratites','keratytis','kerratitis'],'A','Kerat/o (cornea) + -itis (inflammation). One r.'),
  s('An abnormally low white blood cell count','leukopenia',['leukopinia','lukopenia','leukopenea'],'B','Leuk/o (white) + -penia (deficiency).'),
  s('An instrument used to view the voice box','laryngoscope',['larangoscope','laryngascope','larygoscope'],'C','Laryng/o (larynx) + -scope (instrument for viewing). Note “y” before “ng.”'),
  s('Spread of cancer from its original site to another part of the body','metastasis',['metastisis','metastasys','mettastasis'],'D','Meta- (beyond, change) + -stasis (standing). All a’s before -sis.'),
  s('An autoimmune disease causing muscle weakness that worsens with use','myasthenia',['myasthinia','miasthenia','myasthenea'],'A','My/o (muscle) + a- (without) + sthen/o (strength) + -ia.'),
  s('Relating to a tube passed through the nose into the stomach','nasogastric',['nasogastrick','nasagastric','nasogasteric'],'B','Nas/o (nose) + gastr/o (stomach) + -ic.'),
  s('Production of an abnormally small amount of urine','oliguria',['oligouria','oliguraia','olliguria'],'C','Olig/o (scanty) + -uria (urine condition). Drop the o before -uria.'),
  s('An instrument for examining the interior of the eye','ophthalmoscope',['opthalmoscope','ophthamoscope','ophthalmascope'],'D','Ophthalm/o (eye) + -scope. Note “phth” and the l before m.'),
  s('Difficulty breathing except when sitting or standing upright','orthopnea',['orthopnia','orthapnea','orthopnoe'],'A','Orth/o (straight) + -pnea (breathing).'),
  s('Inflammation of a vein','phlebitis',['flebitis','phlebytis','phlebites'],'B','Phleb/o (vein) + -itis (inflammation).'),
  s('Air in the chest space around the lung, causing it to collapse','pneumothorax',['pnuemothorax','neumothorax','pneumothorox'],'C','Pneum/o (air, lung) + thorax (chest). Silent p, vowels “eu.”'),
  s('Excessive production of urine','polyuria',['polyurea','polliuria','poliuria'],'D','Poly- (many, much) + -uria (urine condition).'),
  s('A disease with clusters of inflammatory cells (granulomas), often in the lungs','sarcoidosis',['sarcoidoses','sarcodosis','sarciodosis'],'A','Sarc/o (flesh) + -oid (resembling) + -osis (condition).'),
  s('Inflammation of a vein with formation of a clot','thrombophlebitis',['thromboflebitis','thrombophlebytis','thromophlebitis'],'B','Thromb/o (clot) + phleb/o (vein) + -itis.')
 ],8941)
};
