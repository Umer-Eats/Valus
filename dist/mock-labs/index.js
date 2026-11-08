// Spec-driven mock procedure labs, one per event. CPR/First Aid and Dental Science have their own hand-built labs.
import l0 from './biotechnology.js';
import l1 from './cert-skills.js';
import l2 from './clinical-lab-science.js';
import l3 from './clinical-nursing.js';
import l4 from './clinical-specialty.js';
import l5 from './emergency-medical-technician.js';
import l6 from './genetics.js';
import l7 from './home-health-aide.js';
import l8 from './life-support-skills.js';
import l9 from './medical-assisting.js';
import l10 from './nursing-assisting.js';
import l11 from './occupational-therapy.js';
import l12 from './parliamentary-procedure.js';
import l13 from './patient-care-technician.js';
import l14 from './personal-care.js';
import l15 from './pharmacy-science.js';
import l16 from './phlebotomy.js';
import l17 from './physical-therapy.js';
import l18 from './respiratory-therapy.js';
import l19 from './sports-medicine.js';
import l20 from './surgical-technologist.js';
import l21 from './veterinary-science.js';

export const SPEC_LABS = [l0, l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13, l14, l15, l16, l17, l18, l19, l20, l21];
export const specLabFor = event => SPEC_LABS.find(l => l.event === event) || null;
