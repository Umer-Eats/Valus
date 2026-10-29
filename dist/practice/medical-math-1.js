// Medical Math Practice Test 1. Original problems written for Valus from the HOSA 2026–27 test plan.
// Like the real test, every answer is typed in as a number, with the unit shown beside the box.
// Every problem uses the HOSA "Reference Materials Summary" equivalents
// (1 kg = 2.2 lb, 1 oz = 30 mL, 1 tsp = 5 mL, 1 mL = 15 gtts, 1 in = 2.54 cm, 1 m = 39.4 in) and its
// rounding rules: round only the final answer, nearest whole number unless stated, pediatric doses down.
import {w, mix} from './q.js';
const DHO='Simmers, DHO: Health Science', CRAIG='Craig, Dosage Calculations Made Easy', RX='Rewald et al., Pharmacy Calculations';
const ESS='Mathematical essentials', CONV='Measurement and conversion problems', DOSE='Drug dosages and intravenous solutions', SOL='Dilutions, solutions, and concentrations';

export default {
 id:'medical-math-1',
 event:'Medical Math',
 title:'Practice Test 1',
 subtitle:'Full-length Round One simulation',
 minutes:90,
 sources:'DHO: Health Science, Craig’s Dosage Calculations Made Easy, Pharmacy Calculations (ASHP), and the HOSA Reference Materials Summary',
 plan:[{area:ESS,weight:5},{area:CONV,weight:30},{area:DOSE,weight:35},{area:SOL,weight:30}],
 questions:mix([
  w(ESS,'Express 3/8 as a percentage, rounded to the nearest tenth.','37.5','%','3 ÷ 8 = 0.375, and 0.375 × 100 = 37.5%. The problem asks for the nearest tenth, so 37.5% stays as written.',DHO),
  w(ESS,'A medication is due at 1:45 p.m. How is this time written in 24-hour (military) time?','1345','','For p.m. times after noon, add 12 to the hour: 1 + 12 = 13, so 1:45 p.m. is 1345.',DHO,{accept:['13:45']}),
  w(ESS,'Solve for x: 4 : 25 = x : 150','24','','Write the proportion as 4/25 = x/150. Cross-multiply: 25x = 600, so x = 24.',DHO),
  w(CONV,'A patient weighs 154 lb. What is the weight in kilograms?','70','kg','Divide pounds by 2.2: 154 ÷ 2.2 = 70 kg. Multiplying by 2.2 instead gives 339, a common error.',DHO),
  w(CONV,'A child’s temperature is 38.5 °C. What is it in degrees Fahrenheit, to the nearest tenth?','101.3','°F','°F = (°C × 9/5) + 32 = (38.5 × 1.8) + 32 = 69.3 + 32 = 101.3 °F.',DHO),
  w(CONV,'A patient’s temperature is 104 °F. What is it in degrees Celsius?','40','°C','°C = (°F − 32) × 5/9 = (104 − 32) × 5/9 = 72 × 5/9 = 40 °C. Forgetting to multiply by 5/9 gives 72.',DHO),
  w(CONV,'A patient is 5 feet 4 inches tall. What is the height in centimeters?','163','cm','5 ft × 12 = 60 in, plus 4 in = 64 in. 64 × 2.54 = 162.56 cm, which rounds to 163 cm.',DHO),
  w(CONV,'At lunch a patient drinks 1.5 cups of juice and 3 oz of water. What is the total oral intake in milliliters?','450','mL','1 cup = 240 mL, so 1.5 cups = 360 mL. 3 oz × 30 mL = 90 mL. 360 + 90 = 450 mL.',DHO),
  w(CONV,'Over a shift, a patient receives 1000 mL of IV fluid and drinks 2 cups of water and 4 oz of juice. Urine output is 1350 mL. What is the fluid balance?','+250','mL','Intake = 1000 + (2 × 240) + (4 × 30) = 1000 + 480 + 120 = 1600 mL. Balance = intake − output = 1600 − 1350 = +250 mL.',DHO),
  w(CONV,'Convert 0.25 g to milligrams.','250','mg','1 g = 1000 mg, so 0.25 × 1000 = 250 mg. Moving the decimal three places to the right converts grams to milligrams.',CRAIG),
  w(CONV,'Convert 750 mcg to milligrams.','0.75','mg','1 mg = 1000 mcg, so 750 ÷ 1000 = 0.75 mg. Note the leading zero required by medical protocol.',CRAIG),
  w(CONV,'An oral medication dose is 7.5 mL. How many teaspoons is this?','1.5','tsp','1 tsp = 5 mL, so 7.5 mL ÷ 5 mL per tsp = 1.5 tsp. Dosing cups or oral syringes are more accurate than kitchen spoons.',DHO),
  w(CONV,'Using the HOSA equivalent of 15 drops per milliliter, how many drops are in 2 mL?','30','gtts','2 mL × 15 gtts/mL = 30 gtts. Dividing instead (2 ÷ 15) gives a fraction of a drop, a sign the setup is upside down.',DHO),
  w(CONV,'A newborn weighs 7 lb 8 oz. What is the weight in kilograms, to the nearest tenth?','3.4','kg','8 oz = 0.5 lb (16 oz = 1 lb), so the baby weighs 7.5 lb. 7.5 ÷ 2.2 = 3.409, which rounds to 3.4 kg.',DHO),
  w(CONV,'A patient is 1.75 m tall. What is the height in inches?','69','in','1 m = 39.4 in, so 1.75 × 39.4 = 68.95 in, which rounds to 69 in.',DHO),
  w(CONV,'A hemoglobin result is 14 g/dL. How many grams per liter is this?','140','g/L','10 dL = 1 L, so 14 g/dL × 10 = 140 g/L. A liter holds ten times as much as a deciliter, so the number gets larger.',DHO),
  w(CONV,'Calculate the body surface area of a patient who is 160 cm tall and weighs 81 kg. Round to the nearest hundredth.','1.90','m²','BSA = √(height cm × weight kg ÷ 3600) = √(160 × 81 ÷ 3600) = √(12,960 ÷ 3600) = √3.6 = 1.897, which rounds to 1.90 m². Forgetting the square root gives 3.60.',DHO),
  w(CONV,'A bottle holds 4 oz of cough syrup. The dose is 2 tsp. How many full doses does the bottle contain?','12','doses','1 oz = 6 tsp, so 4 oz = 24 tsp. 24 tsp ÷ 2 tsp per dose = 12 doses.',DHO),
  w(DOSE,'The order is 0.5 g of a drug. Tablets on hand contain 250 mg each. How many tablets should be given?','2','tablets','Convert to the same unit: 0.5 g = 500 mg. 500 mg ÷ 250 mg per tablet = 2 tablets.',CRAIG),
  w(DOSE,'The order is 375 mg of an oral suspension. The label reads 250 mg per 5 mL. How many mL should be given? Round to the nearest tenth.','7.5','mL','Desired ÷ have × quantity = 375 ÷ 250 × 5 mL = 1.5 × 5 = 7.5 mL.',CRAIG),
  w(DOSE,'A child weighs 44 lb. The order is 15 mg/kg. How many milligrams should the child receive?','300','mg','44 lb ÷ 2.2 = 20 kg. 20 kg × 15 mg/kg = 300 mg. Multiplying 44 × 15 without converting gives 660 mg.',CRAIG),
  w(DOSE,'A child weighs 35 lb. The order is 10 mg/kg/day divided into 3 equal doses. How many mg are in each dose?','53','mg','35 ÷ 2.2 = 15.909 kg. 15.909 × 10 = 159.09 mg/day ÷ 3 = 53.03 mg per dose. Pediatric doses are always rounded down, so the answer is 53 mg.',CRAIG),
  w(DOSE,'Using Clark’s rule, what is the dose for a 50-lb child if the adult dose is 300 mg?','100','mg','Clark’s rule: child dose = (weight in lb ÷ 150) × adult dose = (50 ÷ 150) × 300 = 100 mg.',RX),
  w(DOSE,'1000 mL of IV fluid is ordered to infuse over 8 hours. What is the rate in mL/hr?','125','mL/hr','Rate = total volume ÷ total time = 1000 mL ÷ 8 hr = 125 mL/hr. Infusion pumps are set in mL/hr.',CRAIG),
  w(DOSE,'1000 mL is to infuse over 8 hours using tubing with a drop factor of 15 gtts/mL. What is the flow rate in gtts/min?','31','gtts/min','Rate = 125 mL/hr. gtts/min = (mL/hr × drop factor) ÷ 60 = (125 × 15) ÷ 60 = 31.25, which rounds to 31 gtts/min.',CRAIG),
  w(DOSE,'An IV is ordered at 50 mL/hr using microdrip tubing (60 gtts/mL). What is the flow rate in gtts/min?','50','gtts/min','With 60 gtts/mL tubing, gtts/min equals mL/hr: (50 × 60) ÷ 60 = 50 gtts/min.',CRAIG),
  w(DOSE,'An infusion of 750 mL is started at 0800 and runs at 100 mL/hr. At what time will it finish?','1530','','750 mL ÷ 100 mL/hr = 7.5 hours = 7 hours 30 minutes. 0800 + 7:30 = 1530.',CRAIG,{accept:['15:30']}),
  w(DOSE,'A heparin drip contains 25,000 units in 500 mL. The order is 1,000 units/hr. What rate in mL/hr should be set?','20','mL/hr','Concentration = 25,000 units ÷ 500 mL = 50 units/mL. 1,000 units/hr ÷ 50 units/mL = 20 mL/hr.',CRAIG),
  w(DOSE,'A patient needs 35 units of U-100 insulin. How many mL is this?','0.35','mL','U-100 insulin contains 100 units per mL. 35 units ÷ 100 units/mL = 0.35 mL.',CRAIG),
  w(DOSE,'A vial of powder is reconstituted to 200 mg/mL. The order is 350 mg. How many mL should be drawn up, to the nearest tenth?','1.8','mL','350 ÷ 200 = 1.75 mL. To the nearest tenth, look at the hundredths digit (5) and round up: 1.8 mL.',RX),
  w(DOSE,'Dopamine is ordered at 5 mcg/kg/min for an 80-kg patient. The bag contains 400 mg in 250 mL. What rate in mL/hr is needed?','15','mL/hr','Dose = 5 × 80 = 400 mcg/min × 60 = 24,000 mcg/hr. Concentration = 400 mg ÷ 250 mL = 1.6 mg/mL = 1,600 mcg/mL. 24,000 ÷ 1,600 = 15 mL/hr.',CRAIG),
  w(DOSE,'A chemotherapy drug is ordered at 100 mg/m². The patient’s BSA is 1.5 m². What dose should be given?','150','mg','BSA-based dose = ordered dose per m² × the patient’s BSA = 100 mg/m² × 1.5 m² = 150 mg.',CRAIG),
  w(DOSE,'The safe range for a drug is 20–40 mg/kg/day. An 18-kg child is ordered 250 mg every 8 hours. By how many mg per day does the order exceed the safe maximum?','30','mg','Safe maximum = 18 kg × 40 mg/kg/day = 720 mg/day. Ordered = 250 mg × 3 doses = 750 mg/day. 750 − 720 = 30 mg/day over the maximum, so the order is unsafe and the prescriber should be contacted.',CRAIG),
  w(DOSE,'An infusion contains 2 g of a drug in 500 mL and is running at 30 mL/hr. How many mg/hr is the patient receiving?','120','mg/hr','Concentration = 2000 mg ÷ 500 mL = 4 mg/mL. 4 mg/mL × 30 mL/hr = 120 mg/hr.',CRAIG),
  w(DOSE,'Amoxicillin 500 mg PO every 8 hours is ordered for 10 days. Capsules are 250 mg. How many capsules are needed for the full course?','60','capsules','Each dose is 500 ÷ 250 = 2 capsules. Every 8 hours = 3 doses per day, so 2 × 3 × 10 days = 60 capsules.',RX),
  w(SOL,'How many grams of dextrose are in 500 mL of D5W (5% dextrose in water)?','25','g','A percent solution (w/v) is grams per 100 mL. 5% = 5 g per 100 mL, so 500 mL contains 5 × 5 = 25 g.',RX),
  w(SOL,'How many grams of sodium chloride are in 1 L of normal saline (0.9% NaCl)?','9','g','0.9% (w/v) = 0.9 g per 100 mL. 1 L = 1000 mL, which is 10 × 100 mL, so 0.9 g × 10 = 9 g of sodium chloride.',RX),
  w(SOL,'How many mL of full-strength (100%) bleach are needed to make 500 mL of a 10% bleach solution?','50','mL','C1V1 = C2V2: 100% × V1 = 10% × 500 mL, so V1 = 50 mL. Add 450 mL of water to reach 500 mL.',DHO),
  w(SOL,'How many mL of a 10% stock solution are needed to prepare 250 mL of a 4% solution?','100','mL','C1V1 = C2V2: 10% × V1 = 4% × 250 mL = 1000, so V1 = 100 mL of stock, diluted to a total of 250 mL.',RX),
  w(SOL,'Epinephrine is labeled 1:1000. What is its concentration in mg/mL?','1','mg/mL','A ratio strength of 1:1000 means 1 g in 1000 mL = 1000 mg in 1000 mL = 1 mg/mL.',RX),
  w(SOL,'Lidocaine 2% contains how many milligrams of drug per milliliter?','20','mg/mL','2% = 2 g per 100 mL = 2000 mg per 100 mL = 20 mg/mL. A quick rule: percent × 10 = mg/mL.',RX),
  w(SOL,'A 1:4 dilution of serum is made with 1 part serum. How many parts of diluent are added?','3','parts','In a 1:4 dilution, the sample is 1 part of 4 total parts, so 3 parts of diluent are added. Adding 4 parts would make a 1:5 dilution.',DHO),
  w(SOL,'A sample is diluted 1:10, and that dilution is diluted 1:10 two more times. Write the final dilution as 1:x.','1000','','In serial dilutions, multiply the dilution factors: 10 × 10 × 10 = 1000, so the final dilution is 1:1000. Adding them (1:30) is a common error.',DHO,{prefix:'1 :'}),
  w(SOL,'A technician mixes 70% and 20% alcohol to make 100 mL of 40% alcohol. How many mL of the 70% alcohol are needed?','40','mL','Alligation: 70% gets 40 − 20 = 20 parts; 20% gets 70 − 40 = 30 parts; total 50 parts. 70%: 20/50 × 100 mL = 40 mL (and 60 mL of 20%).',RX),
  w(SOL,'Potassium chloride is available as 2 mEq/mL. The order is 30 mEq. How many mL are needed?','15','mL','Volume = desired dose ÷ concentration = 30 mEq ÷ 2 mEq/mL = 15 mL. Concentrated potassium must always be diluted before IV use.',RX),
  w(SOL,'20 mL of a 25% solution is added to 80 mL of water. What is the concentration of the new solution?','5','%','Amount of solute = 20 mL × 25% = 5 g. Final volume = 20 + 80 = 100 mL. 5 g ÷ 100 mL = 5%. Using 80 mL as the final volume gives 6.25%.',RX),
  w(SOL,'How many mL of 50% dextrose are needed to prepare 200 mL of 10% dextrose?','40','mL','C1V1 = C2V2: 50% × V1 = 10% × 200 mL = 2000, so V1 = 40 mL of 50% dextrose plus 160 mL of diluent.',RX),
  w(SOL,'4 g of a drug is dissolved to make 200 mL of solution. What is the percent strength (w/v)?','2','%','Percent w/v = grams per 100 mL. 4 g in 200 mL is the same as 2 g in 100 mL, so the solution is 2%.',RX),
  w(SOL,'How many grams of hydrocortisone are in a 30-g tube of 1% hydrocortisone cream?','0.3','g','For a cream, percent is weight in weight: 1% = 1 g per 100 g. 30 g × 0.01 = 0.3 g.',RX),
  w(SOL,'Express a 1:200 solution as a percentage.','0.5','%','1:200 means 1 part in 200 parts: 1 ÷ 200 = 0.005. Multiply by 100 to convert to a percentage: 0.5%.',RX)
 ],5)
};
