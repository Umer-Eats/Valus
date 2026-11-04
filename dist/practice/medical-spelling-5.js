// Medical Spelling Practice Test 5. Original items written for Valus in the format of the HOSA 2026–27
// Round One sample items: a definition, then four spellings, one correct (Taber’s). Misspellings are
// common errors; accepted variant spellings (such as British forms) are never used as wrong answers.
import {q, mix} from './q.js';
const TAB='Taber’s Cyclopedic Medical Dictionary';
const SP='Medical Spelling';
// s(definition, correct, wrong spellings, letter, word-part note)
const s = (def, correct, wrong, letter, note) => q(SP, def, correct, wrong, letter, `The correct spelling is “${correct}.” ${note}`, TAB);

export default {
 id:'medical-spelling-5',
 event:'Medical Spelling',
 title:'Practice Test 5',
 subtitle:'Full-length Round One simulation',
 minutes:60,
 sources:'Taber’s Cyclopedic Medical Dictionary and Taber’s Audio Glossary',
 plan:[{area:SP,weight:100}],
 questions:mix([
  s('Failure of the lower esophageal sphincter to relax, making swallowing difficult','achalasia',['achalasea','akalasia','achalazia'],'A','A- (without) + chalas/o (relaxation) + -ia. Ch sounds like k.'),
  s('Inherited disorder of cartilage growth that is the most common cause of dwarfism','achondroplasia',['achondroplazia','acondroplasia','achondraplasia'],'B','A- (without) + chondr/o (cartilage) + -plasia (formation).'),
  s('Cup-shaped socket of the hip bone that holds the head of the femur','acetabulum',['acetabelum','acetabulem','acetebulum'],'C','From the Latin word for a small vinegar cup; ends in -ulum.'),
  s('Malignant tumor that arises from glandular tissue','adenocarcinoma',['adenocarsinoma','adenocarcenoma','adinocarcinoma'],'D','Aden/o (gland) + carcin/o (cancer) + -oma (tumor).'),
  s('Reduced vision in one eye without a structural cause, often called lazy eye','amblyopia',['amblyiopia','amblyopea','ambliopia'],'A','Ambly/o (dull) + -opia (vision). Y after the b.'),
  s('Buildup of abnormal protein deposits in organs and tissues','amyloidosis',['amyloydosis','amiloidosis','amyloidosus'],'B','Amyloid (starch-like protein) + -osis (abnormal condition).'),
  s('Stiffening and fusion of a joint','ankylosis',['ankylosus','ankilosis','anklyosis'],'C','Ankyl/o (crooked, stiff) + -osis. The y comes after the k.'),
  s('Unequal size of the two pupils','anisocoria',['anisocorea','anisokoria','anisicoria'],'D','An- (not) + is/o (equal) + cor/o (pupil) + -ia.'),
  s('Drug that prevents or delays blood clotting','anticoagulant',['anticoagulent','anticoaguland','anticogulant'],'A','Anti- (against) + coagulant. The ending is -ant, not -ent.'),
  s('Blurred vision caused by an irregularly curved cornea or lens','astigmatism',['astigmatizm','astigmitism','astigmatisim'],'B','A- (without) + stigmat/o (point) + -ism. Light does not focus to one point.'),
  s('Lack of muscle coordination during voluntary movement','ataxia',['ataxea','attaxia','atacsia'],'C','A- (without) + tax/o (order, coordination) + -ia. One t at the start.'),
  s('Buildup of fatty plaque inside the walls of arteries','atherosclerosis',['artherosclerosis','atherosclerosus','atherosklerosis'],'D','Ather/o (fatty paste) + scler/o (hard) + -osis. No r after the first a.'),
  s('Excess nitrogen-containing waste products, such as urea, in the blood','azotemia',['azotemea','azotamia','asotemia'],'A','Azot/o (nitrogen) + -emia (blood condition).'),
  s('Surgical repair of the eyelid','blepharoplasty',['blepheroplasty','blepharoplasity','blepharplasty'],'B','Blephar/o (eyelid) + -plasty (surgical repair).'),
  s('Slow heart rate, usually below 60 beats per minute in adults','bradycardia',['bradicardia','bradycardea','bradycarda'],'C','Brady- (slow) + cardi/o (heart) + -ia. Y after the d.'),
  s('Sudden narrowing of the airways caused by contraction of their smooth muscle','bronchospasm',['bronchospazm','bronkospasm','bronchiospasm'],'D','Bronch/o (bronchus) + -spasm (sudden contraction).'),
  s('Grinding or clenching of the teeth, often during sleep','bruxism',['bruxizm','bruxisim','broxism'],'A','From the Greek word for gnashing the teeth; ends in -ism.'),
  s('Disease of the heart muscle','cardiomyopathy',['cardiomyapathy','cardiomiopathy','cardiomyopothy'],'B','Cardi/o (heart) + my/o (muscle) + -pathy (disease).'),
  s('Waxy substance produced in the outer ear canal; earwax','cerumen',['ceruman','serumen','cerumin'],'C','From Latin cera (wax). Begins with c and ends in -men.'),
  s('Rapid, jerky, dance-like involuntary movements','chorea',['chorrea','korea','choria'],'D','From the Greek word for dance. Ch sounds like k; one r.'),
  s('Softening of cartilage, often on the underside of the kneecap','chondromalacia',['chondromalasia','condromalacia','chondromalaccia'],'A','Chondr/o (cartilage) + -malacia (softening).'),
  s('Small triangular bone at the base of the spine; the tailbone','coccyx',['coccix','cocyx','coccyks'],'B','Double c in the middle, then y and x.'),
  s('Surgical opening from the colon through the abdominal wall','colostomy',['colostemy','collostomy','colostomey'],'C','Col/o (colon) + -stomy (new opening). One l.'),
  s('Bulging of the urinary bladder into the vaginal wall','cystocele',['cystocel','cystoseal','systocele'],'D','Cyst/o (bladder) + -cele (hernia, protrusion).'),
  s('Inflammation of the tear sac','dacryocystitis',['dacrocystitis','dacryocistitis','dacryocystitus'],'A','Dacry/o (tear) + cyst/o (sac) + -itis.'),
  s('Double vision','diplopia',['diplopea','diplobia','dyplopia'],'B','Dipl/o (double) + -opia (vision). Begins with dip-, not dyp-.'),
  s('Difficulty speaking clearly because of weak or poorly controlled speech muscles','dysarthria',['disarthria','dysarthrea','dysarthia'],'C','Dys- (difficult) + arthr/o (joint, articulation) + -ia.'),
  s('Painful or difficult urination','dysuria',['disuria','dysurea','dysuira'],'D','Dys- (painful, difficult) + ur/o (urine) + -ia.'),
  s('Growth of tissue like the uterine lining outside the uterus','endometriosis',['endometreosis','endometriosus','endomitriosis'],'A','Endo- (within) + metri/o (uterus) + -osis.'),
  s('Involuntary urination, especially bedwetting at night','enuresis',['enuresus','enurisis','ennuresis'],'B','En- (in) + ur/o (urine) + -esis (condition). One n.'),
  s('Inflammation of the flap of cartilage that covers the larynx during swallowing','epiglottitis',['epiglotitis','epiglottitus','epiglottiditis'],'C','Epi- (upon) + glott/o (glottis) + -itis. Double t before -itis.'),
  s('Bacterial skin infection with a raised, sharply bordered red rash','erysipelas',['erysipelis','erisipelas','erysippelas'],'D','From the Greek for red skin. Y after the r; one p.'),
  s('Small, visible twitching of groups of muscle fibers','fasciculation',['fasiculation','fascicullation','fasciculasion'],'A','From fascicle (small bundle). Keep the sc together.'),
  s('Inflammation of the filtering units of the kidney','glomerulonephritis',['glomerulonephritus','glomerulanephritis','glomerolonephritis'],'B','Glomerul/o (glomerulus) + nephr/o (kidney) + -itis.'),
  s('Excess male-pattern hair growth in women','hirsutism',['hirsuitism','hirsutizm','hersutism'],'C','From Latin hirsutus (hairy). No i after the u.'),
  s('Swelling of a kidney because urine cannot drain','hydronephrosis',['hydronephrosus','hydronefrosis','hydronephorsis'],'D','Hydr/o (water) + nephr/o (kidney) + -osis.'),
  s('Overactivity of the parathyroid glands that raises blood calcium','hyperparathyroidism',['hyperparathyrodism','hyperparathyroidizm','hyperparathiroidism'],'A','Hyper- (excessive) + parathyroid + -ism.'),
  s('Birth defect in which the urethral opening is on the underside of the penis','hypospadias',['hypospadius','hypospadeas','hipospadias'],'B','Hypo- (below) + Greek spadon (opening). Ends in -ias.'),
  s('Surgical removal of part of the iris','iridectomy',['iridectamy','iridecktomy','iriddectomy'],'C','Irid/o (iris) + -ectomy (surgical removal).'),
  s('Excess outward curvature of the upper (thoracic) spine','kyphosis',['kyphosus','kiphosis','kyposis'],'D','Kyph/o (hump) + -osis. Y after the k, then ph.'),
  s('Inflammation of the inner ear that causes vertigo and hearing changes','labyrinthitis',['labrynthitis','labyrinthitus','labyrinthytis'],'A','Labyrinth (inner ear) + -itis. The y comes after lab-.'),
  s('Benign tumor of smooth muscle, such as a uterine fibroid','leiomyoma',['liomyoma','leiomyomma','leiomioma'],'B','Lei/o (smooth) + my/o (muscle) + -oma (tumor).'),
  s('Excess inward curvature of the lower (lumbar) spine','lordosis',['lordosus','lordossis','lordisis'],'C','Lord/o (bent forward) + -osis.'),
  s('X-ray imaging of the breast','mammography',['mamography','mammograpy','mammographie'],'D','Mamm/o (breast) + -graphy (process of recording). Double m.'),
  s('Space in the chest between the lungs that contains the heart and great vessels','mediastinum',['mediastinem','medeastinum','mediastenum'],'A','From Latin for “in the middle.” Ends in -inum.'),
  s('Surgical incision into the eardrum, often to drain fluid','myringotomy',['miringotomy','myringotamy','myringottomy'],'B','Myring/o (eardrum) + -tomy (incision).'),
  s('Sleep disorder with sudden, uncontrollable episodes of daytime sleep','narcolepsy',['narcolepcy','narkolepsy','narcolapsy'],'C','Narc/o (sleep, stupor) + -lepsy (seizure).'),
  s('Rapid, involuntary rhythmic movement of the eyes','nystagmus',['nystagmis','nistagmus','nystagmous'],'D','From the Greek for nodding. Y after the n.'),
  s('Fungal infection of the fingernails or toenails','onychomycosis',['onycomycosis','onychomycosus','onichomycosis'],'A','Onych/o (nail) + myc/o (fungus) + -osis.'),
  s('Inflammation of a testis','orchitis',['orchitus','orkitis','orchititis'],'B','Orch/o (testis) + -itis. Ch sounds like k.')
 ],9537)
};
