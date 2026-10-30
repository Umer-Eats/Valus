// Medical Spelling Practice Test 2. Original items written for Valus in the format of the HOSA 2026–27
// Round One sample items: a definition, then four spellings, one correct (Taber’s). Misspellings are
// common errors; accepted variant spellings (such as British forms) are never used as wrong answers.
import {q, mix} from './q.js';
const TAB='Taber’s Cyclopedic Medical Dictionary';
const SP='Medical Spelling';
// s(definition, correct, wrong spellings, letter, word-part note)
const s = (def, correct, wrong, letter, note) => q(SP, def, correct, wrong, letter, `The correct spelling is “${correct}.” ${note}`, TAB);

export default {
 id:'medical-spelling-2',
 event:'Medical Spelling',
 title:'Practice Test 2',
 subtitle:'Full-length Round One simulation',
 minutes:60,
 sources:'Taber’s Cyclopedic Medical Dictionary and Taber’s Audio Glossary',
 plan:[{area:SP,weight:100}],
 questions:mix([
  s('Loss of a large amount of blood in a short time','hemorrhage',['hemmorhage','hemorrage','hemorhage'],'A','Hem/o (blood) + -rrhage (bursting forth). One m, then a double r followed by h.'),
  s('Any irregularity in the rhythm of the heartbeat','arrhythmia',['arrythmia','arhythmia','arrhythmea'],'B','A- (without) + rhythm + -ia. The prefix doubles the r, and “rhythm” keeps its h.'),
  s('Profuse sweating, often with shock or a heart attack','diaphoresis',['diaforesis','diaphorisis','diaphoresus'],'C','From Greek dia- (through) + phoresis (carrying). It is spelled with “ph” and ends in -esis.'),
  s('An instrument used to measure blood pressure','sphygmomanometer',['sphygmanometer','sphigmomanometer','sphygmomanometor'],'D','Sphygm/o (pulse) + man/o (pressure) + -meter. Note the “y” in sphygm/o and the full “momano.”'),
  s('The branch of medicine dealing with the eye and its diseases','ophthalmology',['opthalmology','ophthamology','ophtalmology'],'A','Ophthalm/o (eye) + -logy. Both h’s are needed: “ph” and then “th” before the “al.”'),
  s('Inflammation of the lungs, usually caused by infection','pneumonia',['pnuemonia','neumonia','pneumonnia'],'B','Pneum/o (lung, air) + -ia. The silent p comes first, and the vowels are “eu,” not “ue.”'),
  s('A chronic skin disease with red patches covered by silvery scales','psoriasis',['soriasis','psoriasys','psoriasus'],'C','From Greek psora (itch) + -iasis (condition). The p is silent, and the ending is -iasis.'),
  s('A severe, life-threatening allergic reaction','anaphylaxis',['anaphalaxis','anaphylaxsis','anaphylactis'],'D','Ana- (against) + phylaxis (protection). The “y” follows “ph,” and the ending is a single x.'),
  s('Permanent abnormal dilation of the bronchi','bronchiectasis',['bronkiectasis','bronchiectesis','bronchiectasys'],'A','Bronchi/o (bronchus) + -ectasis (dilation). The suffix is spelled -ectasis with two a’s.'),
  s('Visual examination of the esophagus, stomach and duodenum','esophagogastroduodenoscopy',['esophogastroduodenoscopy','esophagogastroduodenscopy','esophagogastroduodenoskopy'],'B','Esophag/o + gastr/o + duoden/o + -scopy. Each combining vowel “o” joins the parts.'),
  s('Difficult or labored breathing','dyspnea',['dyspnia','dispnea','dysnea'],'C','Dys- (difficult) + -pnea (breathing). The prefix uses y, and the silent p stays in -pnea.'),
  s('Surgical removal of the uterus','hysterectomy',['histerectomy','hysterectemy','hysterectomey'],'D','Hyster/o (uterus) + -ectomy (excision). The y is in “hyster,” and the suffix is -ectomy.'),
  s('Deficient blood supply to a body part due to an obstruction','ischemia',['ishemia','iscemia','ischemea'],'A','From Greek ischein (to hold back) + -emia (blood). Keep the “sch” and end with -emia.'),
  s('A cancer of the blood-forming tissues with abnormal white blood cells','leukemia',['lukemia','leukimia','leukemea'],'B','Leuk/o (white) + -emia (blood condition). The root keeps “eu,” and the suffix is -emia.'),
  s('Death of tissue caused by an interruption of its blood supply','infarction',['infraction','infarcion','infarktion'],'C','From Latin infarcire (to stuff into). “Infraction” is a different word meaning a rule violation.'),
  s('A feeling of sickness with an urge to vomit','nausea',['nausia','nawsea','nausae'],'D','From Greek naus (ship), as in seasickness. The vowels are “au” and then “ea.”'),
  s('A condition of reduced bone mass that makes bones fragile','osteoporosis',['osteoperosis','ostioporosis','osteoporosus'],'A','Oste/o (bone) + por/o (pore) + -osis (condition). Note the “por” in the middle.'),
  s('An abnormal sensation of tingling, pricking or numbness','paresthesia',['parasthesia','parethesia','paresthesea'],'B','Para- (abnormal) shortened to “par” + -esthesia (sensation). The vowel after par is e.'),
  s('Inflammation of the throat','pharyngitis',['pharangitis','pharyngytis','pharyngitus'],'C','Pharyng/o (pharynx) + -itis. Spell the root like pharynx, with “ryng.”'),
  s('The branch of medicine dealing with joint and connective tissue diseases','rheumatology',['rhuematology','reumatology','rheumotology'],'D','From Greek rheuma (flow) + -logy. The h follows the r, and the vowels are “eu.”'),
  s('A chronic mental disorder with distorted thinking and perception','schizophrenia',['schizofrenia','schitzophrenia','skizophrenia'],'A','Schiz/o (split) + phren/o (mind) + -ia. Use “sch,” a single z and “ph.”'),
  s('An abnormally low number of platelets in the blood','thrombocytopenia',['thrombositopenia','thrombocytipenia','thrombocytopenea'],'B','Thromb/o (clot) + cyt/o (cell) + -penia (deficiency). Keep the “cyto” and the -penia ending.'),
  s('Surgical creation of an opening into the trachea','tracheostomy',['trachiostomy','tracheostemy','tracheostomey'],'C','Trache/o (trachea) + -stomy (new opening). The root keeps its e, and the suffix is -stomy.'),
  s('A temporary loss of consciousness; fainting','syncope',['sincope','syncopie','syncopy'],'D','From Greek synkope (a cutting short). It begins with “syn” and ends in -cope, with the final e pronounced.'),
  s('The iron-containing protein in red blood cells that carries oxygen','hemoglobin',['hemaglobin','hemogloben','hemoglobbin'],'A','Hem/o (blood) + globin (protein). The combining vowel is o, and globin ends in -in.'),
  s('A red blood cell','erythrocyte',['erithrocyte','erythrosyte','erythrocite'],'B','Erythr/o (red) + -cyte (cell). The y appears in both “erythr” and “cyte.”'),
  s('Listening to sounds within the body, usually with a stethoscope','auscultation',['ausculation','oscultation','auscultaion'],'C','From Latin auscultare (to listen). Keep the “sc” and the full “cult” before -ation.'),
  s('A chronic liver disease in which normal tissue is replaced by scar tissue','cirrhosis',['cirrosis','cirhosis','cirrhossis'],'D','From Greek kirrhos (orange-yellow) + -osis. Double r followed by h, then a single s.'),
  s('Inflammation of small pouches in the wall of the colon','diverticulitis',['diverticilitis','diverticulitus','diverticulites'],'A','Diverticul/o (pouch) + -itis. The root is “diverticul,” as in diverticulum.'),
  s('Inflammation of the brain','encephalitis',['encephilitis','encephalitus','encefalitis'],'B','Encephal/o (brain) + -itis. Use “ph” and the vowel a in “cephal.”'),
  s('A chronic disorder with widespread muscle pain and tender points','fibromyalgia',['fibromialgia','fibromyalga','fibromyalgea'],'C','Fibr/o (fiber) + my/o (muscle) + -algia (pain). The y is in “my,” and the suffix is -algia.'),
  s('An eye disease with increased pressure that can damage the optic nerve','glaucoma',['glacoma','glaucomma','glawcoma'],'D','From Greek glaukos (bluish gray) + -oma. It keeps “au” and has a single m.'),
  s('An abnormally high level of glucose in the blood','hyperglycemia',['hyperglicemia','hyperglysemia','hyperglycemea'],'A','Hyper- (above) + glyc/o (sugar) + -emia (blood). Use “y” in glyc and end with -emia.'),
  s('Visual examination of the abdominal cavity through small incisions','laparoscopy',['laproscopy','laparascopy','laparoscopey'],'B','Lapar/o (abdominal wall) + -scopy. The combining vowel is o, and “lapar” keeps both a’s.'),
  s('Excessive bleeding during menstruation','menorrhagia',['menoragia','menorhagia','menorrhagea'],'C','Men/o (menses) + -rrhagia (bursting forth). Double r followed by h, ending -agia.'),
  s('The formation of stones in the kidney','nephrolithiasis',['nefrolithiasis','nephrolythiasis','nephrolithiosis'],'D','Nephr/o (kidney) + lith/o (stone) + -iasis (condition). The suffix is -iasis, not -iosis.'),
  s('The specialty of the ear, nose and throat','otorhinolaryngology',['otorinolaryngology','otorhinolaringology','otorhinolarynology'],'A','Ot/o (ear) + rhin/o (nose) + laryng/o (larynx) + -logy. Keep the h in “rhino” and the “ryng.”'),
  s('Wavelike muscle contractions that move food through the digestive tract','peristalsis',['perristalsis','peristolsis','peristalisis'],'B','Peri- (around) + stalsis (contraction). A single r in peri, and “stalsis” has no extra syllable.'),
  s('Paralysis of all four limbs','quadriplegia',['quadraplegia','quadriplejia','quadriplegea'],'C','Quadri- (four) + -plegia (paralysis). The combining vowel is i, and the suffix is -plegia.'),
  s('Pain along the sciatic nerve, often down the back of the leg','sciatica',['siatica','sciattica','sciatika'],'D','From the Latin for the hip region. Keep the “sc,” a single t and the hard -ca ending.'),
  s('Beneath the skin','subcutaneous',['subcutanious','subcutaneus','subcutaineous'],'A','Sub- (under) + cutane/o (skin) + -ous. The root is “cutane,” and the ending is -eous.'),
  s('Abnormally rapid breathing','tachypnea',['tacypnea','tachypnia','tachypnae'],'B','Tachy- (rapid) + -pnea (breathing). Keep the h in “tachy” and the silent p in -pnea.'),
  s('A sensation that oneself or the surroundings are spinning','vertigo',['virtigo','vertiggo','vertego'],'C','From Latin vertere (to turn). It is spelled “ver” with a single g and the vowel i.'),
  s('Dryness of the mouth from reduced saliva','xerostomia',['zerostomia','xerostonia','xerostomea'],'D','Xer/o (dry) + stom/o (mouth) + -ia. It starts with x, though it is pronounced like z.'),
  s('Abnormal slowness of movement','bradykinesia',['bradikinesia','bradykinisia','bradykinesea'],'A','Brady- (slow) + -kinesia (movement). The y is in “brady,” and the suffix is -kinesia.'),
  s('A localized collection of blood outside the blood vessels','hematoma',['hemotoma','hematomma','hematomah'],'B','Hemat/o (blood) + -oma (mass). The combining form is “hemat,” followed by a single m.'),
  s('Describing a disease of unknown cause','idiopathic',['ideopathic','idiopathec','idiopathik'],'C','Idi/o (one’s own) + path/o (disease) + -ic. It begins “idio,” not “ideo.”'),
  s('Surgical removal of a breast','mastectomy',['masectomy','mastectemy','mastectomey'],'D','Mast/o (breast) + -ectomy (excision). Keep the t in “mast” before the suffix.'),
  s('Surgical puncture of the sac around the heart to remove fluid','pericardiocentesis',['paricardiocentesis','pericardiosentesis','pericardiocentisis'],'A','Peri- (around) + cardi/o (heart) + -centesis (puncture). Use c in -centesis and end in -esis.'),
  s('An inflammatory skin condition with itchy, red, scaly patches','eczema',['exema','eczama','eczemma'],'B','From Greek ekzema (to boil out). It is spelled with “cz,” then e, and a single m.')
 ],4028)
};
