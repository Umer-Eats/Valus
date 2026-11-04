// Medical Spelling Practice Test 6. Original items written for Valus in the format of the HOSA 2026–27
// Round One sample items: a definition, then four spellings, one correct (Taber’s). Misspellings are
// common errors; accepted variant spellings (such as British forms) are never used as wrong answers.
import {q, mix} from './q.js';
const TAB='Taber’s Cyclopedic Medical Dictionary';
const SP='Medical Spelling';
// s(definition, correct, wrong spellings, letter, word-part note)
const s = (def, correct, wrong, letter, note) => q(SP, def, correct, wrong, letter, `The correct spelling is “${correct}.” ${note}`, TAB);

export default {
 id:'medical-spelling-6',
 event:'Medical Spelling',
 title:'Practice Test 6',
 subtitle:'Full-length Round One simulation',
 minutes:60,
 sources:'Taber’s Cyclopedic Medical Dictionary and Taber’s Audio Glossary',
 plan:[{area:SP,weight:100}],
 questions:mix([
  s('Examination of the inside of a joint with a small camera','arthroscopy',['arthroscophy','arthoscopy','arthrascopy'],'A','Arthr/o (joint) + -scopy (visual examination).'),
  s('Involuntary, repeated twitching or closing of the eyelid','blepharospasm',['blepherospasm','blepharospazm','blepharaspasm'],'B','Blephar/o (eyelid) + -spasm (involuntary contraction).'),
  s('Inflammation of the bile ducts, often from infection','cholangitis',['cholangytis','colangitis','cholangitus'],'C','Chol/e (bile) + angi/o (vessel) + -itis.'),
  s('Early fusion of the skull sutures in an infant, causing an abnormal head shape','craniosynostosis',['craniosynostasis','cranyosynostosis','craniosinostosis'],'D','Crani/o (skull) + syn- (together) + ost/o (bone) + -osis.'),
  s('Abnormal, involuntary movements, sometimes caused by long-term drug use','dyskinesia',['diskinesia','dyskenesia','dyskinesea'],'A','Dys- (abnormal) + kinesi/o (movement) + -ia.'),
  s('Recording of the electrical activity of the brain','electroencephalogram',['electroencephelogram','electroencephalagram','electroenciphalogram'],'B','Electr/o + encephal/o (brain) + -gram (record).'),
  s('Surgical removal of plaque and the inner lining of an artery','endarterectomy',['endarterectemy','endartarectomy','endartrectomy'],'C','End- (within) + arter/o (artery) + -ectomy.'),
  s('Inflammation of the area where tendons attach near the elbow, such as tennis elbow','epicondylitis',['epicondilitis','epicondylitus','epicondolitis'],'D','Epi- (upon) + condyl/o (knob of bone) + -itis.'),
  s('Surgical opening into the stomach through the abdominal wall, often for a feeding tube','gastrostomy',['gastrostemy','gastrostommy','gastrostomey'],'A','Gastr/o (stomach) + -stomy (new opening).'),
  s('Weakness on one side of the body','hemiparesis',['hemiparisis','hemiperesis','hemiparesus'],'B','Hemi- (half) + -paresis (slight paralysis).'),
  s('Collection of fluid in the sac around a testis','hydrocele',['hydrocel','hydroseal','hydrocelle'],'C','Hydr/o (water) + -cele (swelling, hernia).'),
  s('Raised, overgrown scar that extends beyond the original wound','keloid',['kelloid','keliod','keloyd'],'D','From the Greek for claw-like. The -oid ending means resembling.'),
  s('Surgical removal of part of the back of a vertebra to relieve pressure on nerves','laminectomy',['lamenectomy','laminectemy','laminnectomy'],'A','Lamin/o (lamina, part of a vertebra) + -ectomy.'),
  s('Usually benign tumor of the membranes that cover the brain and spinal cord','meningioma',['meningeoma','meningoma','menengioma'],'B','Mening/o (meninges) + -oma (tumor). Keep the i before -oma.'),
  s('Viral infection with fever, sore throat and swollen lymph nodes, often from Epstein-Barr virus','mononucleosis',['mononucliosis','mononucleosus','mononeucleosis'],'C','Mono- (one) + nucle/o (nucleus) + -osis. Named for unusual white cells.'),
  s('Surgical removal of an ovary','oophorectomy',['oopherectomy','oophrectomy','oophorectemy'],'D','Oophor/o (ovary) + -ectomy. Begins with two o’s.'),
  s('Softening of bones in adults from poor mineralization, often due to low vitamin D','osteomalacia',['osteomalasia','osteomalaccia','ostiomalacia'],'A','Oste/o (bone) + -malacia (softening).'),
  s('Autoimmune disease that causes blisters on the skin and mucous membranes','pemphigus',['pemphigis','pemfigus','pemphegus'],'B','From the Greek for blister. Ph sounds like f.'),
  s('Test that measures how much air the lungs move and how fast','spirometry',['spirommetry','spyrometry','spirometery'],'C','Spir/o (breathing) + -metry (process of measuring).'),
  s('Inflammation of the mucous lining of the mouth','stomatitis',['stomatitus','stomititis','stomattitis'],'D','Stomat/o (mouth) + -itis.'),
  s('Hardening of the bones of the middle ear that causes hearing loss','otosclerosis',['otosclerosus','otosklerosis','ottosclerosis'],'A','Ot/o (ear) + scler/o (hard) + -osis.'),
  s('Decrease in all three types of blood cells','pancytopenia',['pancytopena','pancitopenia','pancytapenia'],'B','Pan- (all) + cyt/o (cell) + -penia (deficiency).'),
  s('Procedure to remove fluid from the abdominal cavity with a needle','paracentesis',['paracentisis','paracentesus','parasentesis'],'C','Para- (beside) + -centesis (surgical puncture to remove fluid).'),
  s('Inflammation of the sac around the heart','pericarditis',['pericardites','pericarditus','pericardidis'],'D','Peri- (around) + cardi/o (heart) + -itis.'),
  s('Inflammation of the membrane that lines the abdominal cavity','peritonitis',['peritonitus','peritonytis','perotonitis'],'A','Peritone/o (peritoneum) + -itis. The final e of peritone/o drops.'),
  s('Abnormal sensitivity to light','photophobia',['fotophobia','photofobia','photophobea'],'B','Phot/o (light) + -phobia (fear, sensitivity).'),
  s('Lung disease caused by breathing in dust, such as coal or silica','pneumoconiosis',['pneumoconeosis','pnuemoconiosis','pneumokoniosis'],'C','Pneum/o (lung) + coni/o (dust) + -osis.'),
  s('Gradual loss of the eye’s ability to focus on near objects with age','presbyopia',['presbiopia','prebyopia','presbyopea'],'D','Presby/o (old age) + -opia (vision).'),
  s('Surgical removal of the prostate gland','prostatectomy',['prostrateectomy','prostatectamy','prostatecktomy'],'A','Prostat/o (prostate) + -ectomy. Prostate has no r after the t.'),
  s('Infection of the kidney and renal pelvis','pyelonephritis',['pylonephritis','pyelonephritus','pyelonefritis'],'B','Pyel/o (renal pelvis) + nephr/o (kidney) + -itis.'),
  s('Breakdown of skeletal muscle that releases its contents into the blood','rhabdomyolysis',['rabdomyolysis','rhabdomyolisis','rhabdomylysis'],'C','Rhabd/o (rod-shaped, striated) + my/o (muscle) + -lysis (breakdown).'),
  s('Disease of the retina, often from diabetes or high blood pressure','retinopathy',['retenopathy','retinopathey','retinapathy'],'D','Retin/o (retina) + -pathy (disease).'),
  s('Surgical removal of a fallopian tube','salpingectomy',['salpingectemy','salphingectomy','salpinjectomy'],'A','Salping/o (fallopian tube) + -ectomy.'),
  s('Autoimmune disease that causes hardening and thickening of the skin','scleroderma',['scleraderma','sclerodurma','sklerodermma'],'B','Scler/o (hard) + -derma (skin).'),
  s('Formation of stones in a salivary gland or duct','sialolithiasis',['sialolithisis','sialolythiasis','sialolithiases'],'C','Sial/o (saliva) + lith/o (stone) + -iasis (condition).'),
  s('Forward slipping of one vertebra over the one below it','spondylolisthesis',['spondylolisthisis','spondilolisthesis','spondylolithesis'],'D','Spondyl/o (vertebra) + -listhesis (slipping).'),
  s('Enlargement of the spleen','splenomegaly',['splenomegally','splenomegaley','spleenomegaly'],'A','Splen/o (spleen) + -megaly (enlargement). One e in splen-.'),
  s('Misalignment of the eyes so they do not look at the same point','strabismus',['strabismis','strabismous','strabizmus'],'B','From the Greek for squinting. Ends in -ismus.'),
  s('Birth defect in which fingers or toes are joined together','syndactyly',['syndactily','sindactyly','syndactaly'],'C','Syn- (together) + dactyl/o (digit) + -y.'),
  s('Inflammation of a tendon and the sheath that surrounds it','tenosynovitis',['tenosinovitis','tenosynovitus','tenosynivitis'],'D','Ten/o (tendon) + synov/o (synovial sheath) + -itis.'),
  s('Surgical removal of the thyroid gland','thyroidectomy',['thyroidectemy','thyrodectomy','thyroidecktomy'],'A','Thyroid + -ectomy (surgical removal).'),
  s('Twisted neck with the head tilted to one side because of muscle spasm','torticollis',['torticolis','tortecollis','torticollus'],'B','From Latin tortus (twisted) + collum (neck). Double l.'),
  s('Compulsive pulling out of one’s own hair','trichotillomania',['trichotilomania','trichotillomainia','tricotillomania'],'C','Trich/o (hair) + Greek tillein (to pull) + -mania.'),
  s('Raised, itchy welts on the skin; hives','urticaria',['urticarea','uticaria','urtecaria'],'D','From Latin urtica (nettle) + -aria.'),
  s('Inflammation of the middle, pigmented layer of the eye','uveitis',['uvietis','uveitus','uveites'],'A','Uve/o (uvea, the middle layer of the eye) + -itis.'),
  s('Contagious viral disease with an itchy, blistering rash; chickenpox','varicella',['varicela','varricella','varisella'],'B','From variola (smallpox) + -ella (small). Double l.'),
  s('Surgical cutting of the vas deferens for male sterilization','vasectomy',['vasectemy','vasecktomy','vassectomy'],'C','Vas/o (vessel, duct) + -ectomy.'),
  s('Puncture of a vein with a needle to draw blood','venipuncture',['venapuncture','venipunture','venipunkture'],'D','Ven/i (vein) + puncture. The combining vowel is i.'),
  s('Loss of skin pigment that causes smooth white patches','vitiligo',['vitaligo','vitiligio','vitilligo'],'A','From Latin; one l before the i-g-o ending.'),
  s('Yellowish fatty deposits on or around the eyelids','xanthelasma',['xanthalasma','zanthelasma','xanthelazma'],'B','Xanth/o (yellow) + Greek elasma (plate). Begins with x.')
 ],9637)
};
