// Medical Spelling Practice Test 1. Original items written for Valus in the format of the HOSA 2026–27
// Round One sample items: a definition, then four spellings, one correct (Taber’s). Misspellings are
// common errors; accepted variant spellings (such as British forms) are never used as wrong answers.
import {q, mix} from './q.js';
const TAB='Taber’s Cyclopedic Medical Dictionary';
const SP='Medical Spelling';
// s(definition, correct, wrong spellings, letter, word-part note)
const s = (def, correct, wrong, letter, note) => q(SP, def, correct, wrong, letter, `The correct spelling is “${correct}.” ${note}`, TAB);

export default {
 id:'medical-spelling-1',
 event:'Medical Spelling',
 title:'Practice Test 1',
 subtitle:'Full-length Round One simulation',
 minutes:60,
 sources:'Taber’s Cyclopedic Medical Dictionary and Taber’s Audio Glossary',
 plan:[{area:SP,weight:100}],
 questions:mix([
  s('Excessive thirst','polydipsia',['polydypsia','polidipsia','polydipsea'],'B','Poly- (many, much) + -dipsia (thirst). The y is in “poly,” and the i is in “dipsia.”'),
  s('Difficulty swallowing','dysphagia',['disphagia','dysphagea','dysfagia'],'D','Dys- (difficult) + -phagia (eating, swallowing). Do not confuse it with dysphasia, a speech disorder.'),
  s('Inflammation of the pancreas','pancreatitis',['pancreatitus','pancreatytis','pankreatitis'],'A','Pancreat/o + -itis (inflammation). The suffix for inflammation is always spelled -itis.'),
  s('Abnormal accumulation of fluid in the peritoneal cavity','ascites',['acites','ascities','assites'],'C','The word comes from the Greek askos, a bag or bladder, which explains the “sc.”'),
  s('Nosebleed','epistaxis',['epistaxsis','epistacsis','epitaxis'],'B','From Greek epi- (upon) + staxis (dripping). There is only an x, never “xs.”'),
  s('Yellow discoloration of the skin caused by excess bilirubin','jaundice',['jaundise','jandice','jaundace'],'D','From the French jaune (yellow). It keeps the “au” and ends in “-ice.”'),
  s('Inflammation of the larynx','laryngitis',['larangitis','laryngitus','larnygitis'],'A','Laryng/o (larynx) + -itis. Note the “ryng” order, as in larynx.'),
  s('Painful menstruation','dysmenorrhea',['dysmenorrhia','dysmenorhea','dismenorrhea'],'C','Dys- + men/o (menstruation) + -rrhea (flow). The “-rrhea” suffix has a double r and ends in -ea.'),
  s('An abnormally rapid heart rate','tachycardia',['tachicardia','tachycardea','tackycardia'],'B','Tachy- (fast) + cardi/o (heart) + -ia. “Tachy” is spelled with a y and “ch.”'),
  s('Surgical removal of the gallbladder','cholecystectomy',['cholecistectomy','cholecystectomey','colecystectomy'],'D','Chol/e (bile) + cyst/o (bladder) + -ectomy (removal). Both “ch” and the y in “cyst” matter.'),
  s('Hardening of the arteries','arteriosclerosis',['arterioscerosis','arteriosclerosus','arteriosklerosis'],'A','Arteri/o + scler/o (hard) + -osis (condition). Keep the l in “sclero.”'),
  s('Inflammation of the membranes covering the brain and spinal cord','meningitis',['meningitus','menengitis','meningytis'],'C','Mening/o (meninges) + -itis. The vowels are e-i-i-i: men-in-gi-tis.'),
  s('A benign tumor made of fat tissue','lipoma',['lypoma','lipomma','lipoama'],'B','Lip/o (fat) + -oma (tumor). “Lip” uses an i, and -oma has one m.'),
  s('Inflammation of the appendix','appendicitis',['appendecitis','appendicitus','apendicitis'],'D','Appendic/o + -itis. Double p in “append,” and an i after the d.'),
  s('A low level of potassium in the blood','hypokalemia',['hypocalemia','hypokalamia','hypokalimia'],'A','Hypo- (below) + kal/i (potassium, from Latin kalium) + -emia (blood condition). The k comes from kalium.'),
  s('Coughing or spitting up blood from the respiratory tract','hemoptysis',['hemoptisis','hemoptysys','hemoptesis'],'C','Hem/o (blood) + -ptysis (spitting). The suffix has one y: p-t-y-s-i-s.'),
  s('Incomplete expansion or collapse of part of a lung','atelectasis',['atelectisis','atelectesis','atalectasis'],'B','Atel/o (incomplete) + -ectasis (expansion). The suffix is spelled -ectasis.'),
  s('Itching','pruritus',['pruritis','pruritous','puritus'],'D','Pruritus is a noun from Latin prurire (to itch) and is not an inflammation, so it does not end in -itis.'),
  s('Ringing or buzzing in the ears','tinnitus',['tinnitis','tinitus','tinnitous'],'A','From Latin tinnire (to ring). It has a double n and ends in -us, because it is not an inflammation.'),
  s('Inflammation of the urinary bladder','cystitis',['cistitis','cystytis','cystitus'],'C','Cyst/o (bladder) + -itis. “Cyst” is spelled with a y.'),
  s('Surgical repair or reshaping of the nose','rhinoplasty',['rinoplasty','rhinoplastie','rhynoplasty'],'B','Rhin/o (nose) + -plasty (surgical repair). Rhin/o begins with “rh.”'),
  s('A swollen vein in the anal canal or rectum','hemorrhoid',['hemorroid','hemmorhoid','hemorrhiod'],'D','From Greek haima (blood) + rhoia (flow): one m, double r, and “-oid.”'),
  s('Excessive sweating','hyperhidrosis',['hyperhydrosis','hyperhidrosys','hiperhidrosis'],'A','Hyper- + hidr/o (sweat) + -osis. Sweat is “hidr,” not “hydr” (water), a very common error.'),
  s('Frequent, loose, watery stools','diarrhea',['diarrea','diarhea','diarreah'],'C','Dia- (through) + -rrhea (flow). The suffix keeps the double r and ends in -hea.'),
  s('Inflammation of the liver','hepatitis',['hepatitus','hepititis','hepatytis'],'B','Hepat/o (liver) + -itis. The vowels are e-a-i-i.'),
  s('Pertaining to the area between the ribs','intercostal',['intercostle','intercoastal','intercostel'],'D','Inter- (between) + cost/o (rib) + -al. “Coastal” refers to the coast, not ribs.'),
  s('Paralysis of one side of the body','hemiplegia',['hemiplegea','hemiplagia','hemipligia'],'A','Hemi- (half) + -plegia (paralysis). The suffix is spelled -plegia.'),
  s('Inflammation of the inner lining of the heart','endocarditis',['endocarditus','endocardytis','endocarditiss'],'C','Endo- (within) + cardi/o + -itis.'),
  s('Bluish discoloration of the skin from lack of oxygen','cyanosis',['cyanosys','cianosis','syanosis'],'B','Cyan/o (blue) + -osis. Cyan/o is spelled with a c and a y.'),
  s('A chronic disorder marked by recurrent seizures','epilepsy',['epilepsey','epilepcy','epylepsy'],'D','From Greek epilepsia (seizure). It ends in “-psy.”'),
  s('Vomiting of blood','hematemesis',['hematamesis','hematemisis','hemetemesis'],'A','Hemat/o (blood) + -emesis (vomiting). The suffix is -emesis.'),
  s('A visual examination of the colon with a flexible scope','colonoscopy',['colonoscapy','colonscopy','colonoskopy'],'C','Colon/o + -scopy (visual examination). Keep the connecting o.'),
  s('Pus in a body cavity, especially the pleural space','empyema',['empiema','empyma','emphyema'],'B','From Greek en (in) + pyon (pus). Pus is “py,” so the word has a y.'),
  s('Abnormal narrowing of a passage or opening','stenosis',['stenosys','stinosis','stenossis'],'D','Sten/o (narrow) + -osis (condition), as in aortic stenosis or spinal stenosis.'),
  s('A malignant tumor arising from bone','osteosarcoma',['osteosarkoma','ostiosarcoma','osteosarcomma'],'A','Oste/o (bone) + sarc/o (flesh) + -oma (tumor).'),
  s('Inflammation of the tonsils','tonsillitis',['tonsilitis','tonsillitus','tonsilitus'],'C','Tonsill/o + -itis. Tonsil has one l, but the combining form and “tonsillitis” have two.'),
  s('Excessive urination at night','nocturia',['nocturea','nokturia','nocturria'],'B','Noct/i (night) + -uria (urine condition).'),
  s('An anxiety disorder involving fear of open or crowded places','agoraphobia',['agorophobia','agoraphobea','agoraphopia'],'D','From Greek agora (marketplace) + -phobia (fear). The second vowel is a.'),
  s('Inflammation of a joint','arthritis',['arthritus','artheritis','arthritys'],'A','Arthr/o (joint) + -itis. There is no e between “arth” and “ritis.”'),
  s('Drooping of the upper eyelid','ptosis',['tosis','ptosys','ptossis'],'C','From Greek ptosis (a falling). The p is silent but required.'),
  s('The presence of gallstones','cholelithiasis',['cholelithiasus','colelithiasis','cholelythiasis'],'B','Chol/e (bile) + lith/o (stone) + -iasis (abnormal condition).'),
  s('Pertaining to the stomach and intestines','gastrointestinal',['gastrointestenal','gastrointestinel','gastrointestinnal'],'D','Gastr/o + intestin/o + -al.'),
  s('The breakdown of red blood cells','hemolysis',['hemolisis','hemolysys','hemolyssis'],'A','Hem/o (blood) + -lysis (breakdown). The suffix -lysis has one y.'),
  s('Swelling caused by excess fluid in the tissues','edema',['edemma','edima','eddema'],'C','From Greek oidema (swelling). The American spelling is “edema.”'),
  s('Surgical puncture of the chest wall to remove fluid','thoracentesis',['thoracentisis','thorasentesis','thoracentesys'],'B','Thorac/o (chest) + -centesis (surgical puncture to remove fluid).'),
  s('A sudden, recurring attack or intensification of symptoms','paroxysm',['paroxism','parroxysm','paroxysme'],'D','From Greek paroxysmos (irritation). One r, and a y before the final “sm.”'),
  s('Inflammation of the eyelid','blepharitis',['blepharitus','blephritis','blepheritis'],'A','Blephar/o (eyelid) + -itis.'),
  s('A balloon-like dilation of an artery wall','aneurysm',['anuerysm','aneurysim','aneurysme'],'C','From Greek aneurysma (a widening). The “eu” comes before the r.'),
  s('Inflammation of the gums','gingivitis',['gingevitis','gingivitus','gingivytis'],'B','Gingiv/o (gums) + -itis. All the vowels after “g” are i.'),
  s('Abnormal sideways curvature of the spine','scoliosis',['scoleosis','scoliosys','skoliosis'],'D','Scoli/o (curved) + -osis.')
 ],191)
};
