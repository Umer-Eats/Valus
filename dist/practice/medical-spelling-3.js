// Medical Spelling Practice Test 3. Original items written for Valus in the format of the HOSA 2026–27
// Round One sample items: a definition, then four spellings, one correct (Taber’s). Misspellings are
// common errors; accepted variant spellings (such as British forms) are never used as wrong answers.
import {q, mix} from './q.js';
const TAB='Taber’s Cyclopedic Medical Dictionary';
const SP='Medical Spelling';
// s(definition, correct, wrong spellings, letter, word-part note)
const s = (def, correct, wrong, letter, note) => q(SP, def, correct, wrong, letter, `The correct spelling is “${correct}.” ${note}`, TAB);

export default {
 id:'medical-spelling-3',
 event:'Medical Spelling',
 title:'Practice Test 3',
 subtitle:'Full-length Round One simulation',
 minutes:60,
 sources:'Taber’s Cyclopedic Medical Dictionary and Taber’s Audio Glossary',
 plan:[{area:SP,weight:100}],
 questions:mix([
  s('A localized collection of pus surrounded by inflamed tissue','abscess',['absess','abcess','abscesss'],'A','From Latin abscessus. It has “sc” in the middle and a double s at the end.'),
  s('Partial or complete loss of hair','alopecia',['allopecia','alopesia','alopecea'],'B','From Greek alopekia. One l, a “c” before the ending, and the ending -ia.'),
  s('Absence of menstrual periods','amenorrhea',['amenorhea','ammenorrhea','amenorrea'],'C','A- (without) + men/o (menses) + -rrhea (flow). Double r followed by h.'),
  s('A surgical connection between two tubular structures, such as blood vessels','anastomosis',['anastamosis','anastomoses','annastomosis'],'D','From Greek anastomoun (to provide a mouth). The vowels are a-a-o-o-i: anas-to-mo-sis.'),
  s('Chest pain caused by reduced blood flow to the heart muscle','angina',['angena','anjina','anginna'],'A','From Latin angina (strangling). It has a “g,” then -ina with one n.'),
  s('Loss of appetite, or an eating disorder involving food restriction','anorexia',['anorrexia','anorexsia','annorexia'],'B','An- (without) + orexia (appetite). One n and one r.'),
  s('Loss of the ability to produce or understand language','aphasia',['afasia','aphaisia','aphazia'],'C','A- (without) + -phasia (speech). Spelled with “ph” and an s.'),
  s('A condition of severely deficient oxygen supply, as in suffocation','asphyxia',['asphixia','asfyxia','asphyxsia'],'D','A- (without) + sphyxis (pulse). Note “ph” and the “y” before the x.'),
  s('A chronic disease with airway inflammation, wheezing and shortness of breath','asthma',['asma','asthama','athsma'],'A','From Greek asthma (panting). The “th” comes right after the s.'),
  s('The presence of bacteria in the blood','bacteremia',['bacterimia','bactaremia','bacteremea'],'B','Bacteri/o + -emia (blood condition). The vowels are e before -mia.'),
  s('Inflammation of the small airways, common in infants','bronchiolitis',['bronchialitis','broncholitis','bronchiolytis'],'C','Bronchiol/o (bronchiole) + -itis. Keep “-iol-” before the suffix.'),
  s('Inflammation of a fluid-filled sac near a joint','bursitis',['bursytis','burscitis','bersitis'],'D','Burs/o (bursa) + -itis (inflammation).'),
  s('Wasting of body weight and muscle due to chronic disease','cachexia',['cachexsia','cacexia','cachecsia'],'A','From Greek kakos (bad) + hexis (condition). Spelled “cach-” with an x before -ia.'),
  s('A cancer arising from epithelial tissue','carcinoma',['carsinoma','carcenoma','carcinnoma'],'B','Carcin/o (cancer) + -oma (tumor). The second c is followed by i: car-ci-no-ma.'),
  s('Clouding of the lens of the eye','cataract',['catarack','cateract','cattaract'],'C','From Greek kataraktes (waterfall). The vowels are all a’s: ca-ta-ract.'),
  s('A bacterial infection of the skin and tissue beneath it','cellulitis',['celulitis','cellulites','cellulitus'],'D','Cellul/o (little cell) + -itis. Double l in “cell.”'),
  s('A waxy fatty substance found in the blood and cell membranes','cholesterol',['cholestrol','colesterol','cholesterole'],'A','Chol/e (bile) + stere/o (solid) + -ol. Note “ch” and the e between “st” and “rol.”'),
  s('Leg pain with walking caused by poor circulation','claudication',['claudacation','cladication','claudicasion'],'B','From Latin claudicare (to limp). The vowels after “claud” are i-a-i-o.'),
  s('Inflammation of the membrane lining the eyelids, often called pinkeye','conjunctivitis',['conjuctivitis','conjunctivites','conjunctivitus'],'C','Conjunctiv/o (conjunctiva) + -itis. Do not drop the n before the c.'),
  s('Inflammation of the skin','dermatitis',['dermititis','dermatites','dermatytis'],'D','Dermat/o (skin) + -itis. Keep the a in “dermat.”'),
  s('A bacterial infection that forms a thick membrane in the throat','diphtheria',['diptheria','diphtheriah','diphthiria'],'A','From Greek diphthera (leather). Both “ph” and “th” are needed.'),
  s('An intestinal infection causing severe diarrhea with blood','dysentery',['dysentary','disentery','dysenterry'],'B','Dys- (bad, difficult) + enter/o (intestine) + -y.'),
  s('A test that records the electrical activity of the heart','electrocardiogram',['electrocardiagram','electrocardiogramm','electocardiogram'],'C','Electr/o + cardi/o (heart) + -gram (record). The combining vowel is o before -gram.'),
  s('Blockage of a blood vessel by a clot or other material carried in the blood','embolism',['embolysm','embollism','emboliism'],'D','From Greek embolos (plug). One l and the ending -ism.'),
  s('A lung disease in which the alveoli are damaged and enlarged','emphysema',['emphazema','emphysemma','emfysema'],'A','From Greek emphysan (to inflate). Note “ph,” the “y” and -sema.'),
  s('Viewing the inside of the body with a lighted instrument','endoscopy',['endoskopy','endoscopey','endascopy'],'B','Endo- (within) + -scopy (visual examination).'),
  s('Redness of the skin caused by increased blood flow','erythema',['erithema','erythemma','erythima'],'C','Erythr/o (red) + -ema. Note the “y” and “th.”'),
  s('Rapid, irregular, uncoordinated contractions of the heart muscle','fibrillation',['fibrilation','fibbrillation','fibrillasion'],'D','From Latin fibrilla (small fiber) + -ation. Double l.'),
  s('Inflammation of the stomach and intestines','gastroenteritis',['gastroenteritus','gastroentiritis','gastrointeritis'],'A','Gastr/o (stomach) + enter/o (intestine) + -itis.'),
  s('The stopping of bleeding','hemostasis',['hemastasis','hemostatis','hemostasys'],'B','Hem/o (blood) + -stasis (stopping). The combining vowel is o.'),
  s('Enlargement of the liver','hepatomegaly',['hepatomegally','hepatamegaly','hepatomeagly'],'C','Hepat/o (liver) + -megaly (enlargement). One l.'),
  s('Protrusion of an organ through a weak spot in the wall around it','hernia',['hernea','herniah','hurnia'],'D','From Latin hernia (rupture). The ending is -ia.'),
  s('Abnormal buildup of cerebrospinal fluid in the brain','hydrocephalus',['hydrocephalis','hydrocefalus','hydroencephalus'],'A','Hydr/o (water) + cephal/o (head) + -us.'),
  s('Enlargement of an organ or tissue due to increased cell size','hypertrophy',['hypertrophey','hypertrofy','hypertropy'],'B','Hyper- (excessive) + -trophy (development). Note “ph” before the y.'),
  s('A condition of low thyroid hormone production','hypothyroidism',['hypothyroidizm','hypothyrodism','hypothryoidism'],'C','Hypo- (below) + thyroid + -ism.'),
  s('A contagious bacterial skin infection with honey-colored crusts','impetigo',['impetego','impatigo','impetiggo'],'D','From Latin impetere (to attack). The vowels are e-i-o.'),
  s('Inability to control urination or defecation','incontinence',['incontinance','incontenence','incontinense'],'A','In- (not) + continence. The ending is -ence.'),
  s('The body’s response to injury with redness, heat, swelling and pain','inflammation',['inflamation','inflammasion','inflamattion'],'B','From Latin inflammare (to set on fire). Double m, one t.'),
  s('An increase in the number of white blood cells','leukocytosis',['leukocytosys','leukocytocis','leukocytossis'],'C','Leuk/o (white) + cyt/o (cell) + -osis (condition). Keep the “k” and the single s before -is.'),
  s('Disease or swelling of the lymph nodes','lymphadenopathy',['lymphadenapathy','lymphodenopathy','limphadenopathy'],'D','Lymph + aden/o (gland) + -pathy (disease).'),
  s('A general feeling of discomfort or uneasiness','malaise',['malase','malaize','mallaise'],'A','From French mal (bad) + aise (ease).'),
  s('A malignant tumor of pigment-producing skin cells','melanoma',['mellanoma','melenoma','melanomma'],'B','Melan/o (black) + -oma (tumor).'),
  s('Relating to the muscular tissue of the heart','myocardial',['miocardial','myocardeal','myocardiel'],'C','My/o (muscle) + cardi/o (heart) + -al.'),
  s('Sharp pain along the course of a nerve','neuralgia',['nueralgia','neuralga','neuralgea'],'D','Neur/o (nerve) + -algia (pain). The vowels are “eu.”'),
  s('A blockage or closing of a passage or vessel','occlusion',['oclusion','occlussion','occlution'],'A','From Latin occludere (to close up). Double c, single s.'),
  s('Infection and inflammation of bone and bone marrow','osteomyelitis',['osteomylitis','osteomyelytis','osteomyelites'],'B','Oste/o (bone) + myel/o (marrow) + -itis.'),
  s('A feeling of a pounding or racing heartbeat','palpitation',['palpatation','palpitasion','pallpitation'],'C','From Latin palpitare (to throb). Do not confuse with palpation, examining by touch.'),
  s('Inflammation of the lining around the lungs, causing painful breathing','pleurisy',['plurisy','pleurasy','pleurissy'],'D','From Greek pleura (side, rib). The vowels are “eu.”'),
  s('A runny nose with thin mucus discharge','rhinorrhea',['rhinorhea','rinorrhea','rhinorrea'],'A','Rhin/o (nose) + -rrhea (flow). Both r’s are needed before h.'),
  s('Serious infection with bacteria or their toxins in the blood','septicemia',['septicemea','septecemia','septisemia'],'B','Septic + -emia (blood condition).')
 ],7941)
};
