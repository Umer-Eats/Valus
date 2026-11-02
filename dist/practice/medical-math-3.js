// Medical Math Practice Test 3. Original problems written for Valus from the HOSA 2026–27 test plan.
// Like the real test, every answer is typed in as a number, with the unit shown beside the box.
// Every problem uses the HOSA "Reference Materials Summary" equivalents
// (1 kg = 2.2 lb, 1 oz = 30 mL, 1 tsp = 5 mL, 1 tbsp = 15 mL, 1 cup = 240 mL, 1 mL = 15 gtts, 1 in = 2.54 cm)
// and its rounding rules: round only the final answer, nearest whole number unless stated, pediatric doses down.
import {w, mix} from './q.js';
const DHO='Simmers, DHO: Health Science', CRAIG='Craig, Dosage Calculations Made Easy', RX='Rewald et al., Pharmacy Calculations';
const ESS='Mathematical essentials', CONV='Measurement and conversion problems', DOSE='Drug dosages and intravenous solutions', SOL='Dilutions, solutions, and concentrations';

export default {
 id:'medical-math-3',
 event:'Medical Math',
 title:'Practice Test 3',
 subtitle:'Full-length Round One simulation',
 minutes:90,
 sources:'DHO: Health Science, Craig’s Dosage Calculations Made Easy, Pharmacy Calculations (ASHP), and the HOSA Reference Materials Summary',
 plan:[{area:ESS,weight:5},{area:CONV,weight:30},{area:DOSE,weight:35},{area:SOL,weight:30}],
 questions:mix([
  w(ESS,'Write the Roman numeral XXIX as an Arabic number.','29','','XX = 20 and IX = 10 − 1 = 9, so XXIX = 29. A smaller numeral before a larger one is subtracted.',DHO),
  w(ESS,'Round 2.456 to the nearest tenth.','2.5','','The tenths digit is 4 and the next digit is 5, which is 5 or more, so round up to 2.5. Look only at the digit right after the place you keep.',DHO),
  w(ESS,'12 is what percent of 48?','25','%','Divide the part by the whole and multiply by 100: 12 ÷ 48 = 0.25, and 0.25 × 100 = 25%.',DHO),
  w(CONV,'Convert 0.08 g to milligrams.','80','mg','1 g = 1000 mg, so 0.08 × 1000 = 80 mg. Move the decimal three places to the right when going from grams to milligrams.',DHO),
  w(CONV,'Convert 2,500 mcg to milligrams.','2.5','mg','1 mg = 1000 mcg, so 2500 ÷ 1000 = 2.5 mg. Move the decimal three places to the left going to a larger unit.',DHO),
  w(CONV,'A patient weighs 61.5 kg. What is the weight in pounds, to the nearest tenth?','135.3','lb','Multiply kilograms by 2.2 to get pounds: 61.5 × 2.2 = 135.3 lb.',DHO),
  w(CONV,'A child weighs 27 lb 8 oz. What is the weight in kilograms, to the nearest tenth?','12.5','kg','16 oz = 1 lb, so 8 oz = 0.5 lb and the weight is 27.5 lb. Divide by 2.2: 27.5 ÷ 2.2 = 12.5 kg.',DHO),
  w(CONV,'A patient’s temperature is 100.4 °F. What is it in degrees Celsius?','38','°C','°C = (°F − 32) ÷ 1.8 = (100.4 − 32) ÷ 1.8 = 68.4 ÷ 1.8 = 38 °C, a common fever threshold.',DHO),
  w(CONV,'Convert 36.8 °C to degrees Fahrenheit, to the nearest tenth.','98.2','°F','°F = (°C × 1.8) + 32 = (36.8 × 1.8) + 32 = 66.24 + 32 = 98.24, which rounds to 98.2 °F.',DHO),
  w(CONV,'A patient is 5 feet 10 inches tall. What is the height in centimeters, to the nearest whole number?','178','cm','5 ft 10 in = 70 in. Multiply by 2.54: 70 × 2.54 = 177.8, which rounds to 178 cm.',DHO),
  w(CONV,'A patient is 160 cm tall. What is the height in inches, to the nearest whole number?','63','in','Divide centimeters by 2.54: 160 ÷ 2.54 = 62.99, which rounds to 63 inches.',DHO),
  w(CONV,'A patient drinks 1½ cups of tea, 8 oz of milk and 1 cup of broth. What is the total intake in milliliters?','840','mL','1½ cups = 360 mL, 8 oz × 30 = 240 mL and 1 cup = 240 mL, so 360 + 240 + 240 = 840 mL.',DHO),
  w(CONV,'A patient voids 400 mL, 275 mL and 325 mL, and a wound drain collects 60 mL. What is the total output?','1060','mL','Output includes urine and drainage: 400 + 275 + 325 + 60 = 1060 mL.',DHO),
  w(CONV,'How many teaspoons are in 1 fluid ounce?','6','tsp','1 oz = 30 mL and 1 tsp = 5 mL, so 30 ÷ 5 = 6 teaspoons in 1 ounce.',DHO),
  w(CONV,'How many fluid ounces are in 4 tablespoons?','2','oz','Convert to milliliters first: 4 tbsp × 15 mL = 60 mL. Then 60 mL ÷ 30 mL per ounce = 2 oz.',DHO),
  w(CONV,'A medication is due at 9:20 p.m. How is this time written in 24-hour (military) time?','2120','','For p.m. times after noon, add 12 to the hour: 9 + 12 = 21, so 9:20 p.m. is 2120.',DHO,{accept:['21:20']}),
  w(CONV,'Convert 0.6 L to milliliters.','600','mL','1 L = 1000 mL, so 0.6 × 1000 = 600 mL. Moving the decimal three places right converts liters to milliliters.',DHO),
  w(CONV,'Using the HOSA equivalent of 15 drops per milliliter, how many milliliters are in 120 drops?','8','mL','Divide the drops by the HOSA drops-per-milliliter equivalent: 120 ÷ 15 = 8 mL.',DHO),
  w(DOSE,'The order is 0.75 g. Tablets on hand contain 250 mg each. How many tablets should be given?','3','tablets','Convert first: 0.75 g = 750 mg. Then 750 mg ÷ 250 mg per tablet = 3 tablets.',CRAIG),
  w(DOSE,'The order is 62.5 mcg. Tablets on hand contain 0.125 mg. How many tablets should be given?','0.5','tablet','Convert first: 0.125 mg = 125 mcg. Then 62.5 ÷ 125 = 0.5 tablet, given only if the tablet is scored.',CRAIG),
  w(DOSE,'The order is 400 mg of a suspension labeled 250 mg per 5 mL. How many mL should be given?','8','mL','Desired ÷ have × quantity = 400 ÷ 250 × 5 mL = 1.6 × 5 = 8 mL.',CRAIG),
  w(DOSE,'An injection is labeled 40 mg/mL. The order is 30 mg. How many mL should be given, to the nearest hundredth?','0.75','mL','30 mg ÷ 40 mg/mL = 0.75 mL. Small injection volumes are usually measured to the hundredth in a 1-mL syringe.',CRAIG),
  w(DOSE,'A child weighs 22 kg. The order is 5 mg/kg. How many milligrams should be given?','110','mg','Multiply the weight by the dose per kilogram: 22 kg × 5 mg/kg = 110 mg.',CRAIG),
  w(DOSE,'A child weighs 48 lb. The order is 25 mg/kg/day divided every 8 hours. How many milligrams are given per dose?','181','mg','48 ÷ 2.2 = 21.818 kg. 21.818 × 25 = 545.45 mg/day, and every 8 hours is 3 doses: 545.45 ÷ 3 = 181.8. Pediatric doses round down to 181 mg.',CRAIG),
  w(DOSE,'1500 mL of IV fluid is ordered to infuse over 10 hours. What is the rate in mL/hr?','150','mL/hr','Rate = total volume ÷ time = 1500 mL ÷ 10 hr = 150 mL/hr. An infusion pump is set in mL/hr.',CRAIG),
  w(DOSE,'500 mL is to infuse over 4 hours with a drop factor of 15 gtts/mL. What is the drip rate in drops per minute?','31','gtts/min','gtts/min = volume × drop factor ÷ minutes = 500 × 15 ÷ 240 = 31.25, which rounds to 31 gtts/min.',CRAIG),
  w(DOSE,'An IV is ordered at 75 mL/hr with microdrip tubing (60 gtts/mL). What is the drip rate in drops per minute?','75','gtts/min','With a 60 gtts/mL set, drops per minute equal mL per hour: 75 × 60 ÷ 60 min = 75 gtts/min.',CRAIG),
  w(DOSE,'An antibiotic in 100 mL is to infuse over 20 minutes with tubing that delivers 10 gtts/mL. What is the drip rate?','50','gtts/min','gtts/min = 100 mL × 10 gtts/mL ÷ 20 min = 1000 ÷ 20 = 50 gtts/min.',CRAIG),
  w(DOSE,'A heparin bag contains 25,000 units in 250 mL. The order is 1,200 units/hr. What is the rate in mL/hr?','12','mL/hr','Concentration = 25,000 ÷ 250 = 100 units/mL. Rate = 1,200 ÷ 100 = 12 mL/hr.',CRAIG),
  w(DOSE,'500 mL of IV fluid starts at 1300 and runs at 125 mL/hr. At what time (24-hour) will it finish?','1700','','Time = volume ÷ rate = 500 ÷ 125 = 4 hours. Adding 4 hours to 1300 gives a finish time of 1700.',CRAIG,{accept:['17:00']}),
  w(DOSE,'A patient needs 22 units of U-100 insulin. How many mL is this?','0.22','mL','U-100 insulin has 100 units per mL, so 22 ÷ 100 = 0.22 mL, or 22 units on a U-100 insulin syringe.',CRAIG),
  w(DOSE,'A drug is ordered at 75 mg/m². The patient’s body surface area is 1.6 m². What dose should be given?','120','mg','Multiply the dose per square meter by the BSA: 75 mg/m² × 1.6 m² = 120 mg.',RX),
  w(DOSE,'Dobutamine 250 mg in 250 mL is ordered at 5 mcg/kg/min for a 60-kg patient. What is the rate in mL/hr?','18','mL/hr','Concentration = 1 mg/mL = 1000 mcg/mL. Dose = 5 × 60 = 300 mcg/min × 60 = 18,000 mcg/hr. 18,000 ÷ 1000 = 18 mL/hr.',RX),
  w(DOSE,'Using Clark’s rule, what is the dose for a 30-lb child if the adult dose is 300 mg?','60','mg','Clark’s rule: child’s weight in lb ÷ 150 × adult dose = 30 ÷ 150 × 300 = 0.2 × 300 = 60 mg.',CRAIG),
  w(DOSE,'A vial is reconstituted to 100 mg/mL. The order is 275 mg. How many mL should be given, to the nearest tenth?','2.8','mL','275 mg ÷ 100 mg/mL = 2.75 mL, which rounds to 2.8 mL to the nearest tenth.',CRAIG),
  w(SOL,'6 g of a drug is dissolved to make 300 mL of solution. What is the percent strength (w/v)?','2','%','Percent w/v is grams of drug per 100 mL of solution: 6 g ÷ 300 mL × 100 = 2%.',RX),
  w(SOL,'How many grams of dextrose are in 250 mL of D5W (5% dextrose)?','12.5','g','5% means 5 g per 100 mL, so 250 mL × 5 ÷ 100 = 12.5 g of dextrose.',RX),
  w(SOL,'How many grams of sodium chloride are in 2 L of normal saline (0.9% NaCl)?','18','g','0.9% means 0.9 g per 100 mL. 2 L = 2000 mL, so 2000 × 0.9 ÷ 100 = 18 g.',RX),
  w(SOL,'Lidocaine 1% contains how many milligrams of drug per milliliter?','10','mg/mL','1% = 1 g per 100 mL = 1000 mg ÷ 100 mL = 10 mg/mL. A quick shortcut: percent × 10 = mg/mL.',RX),
  w(SOL,'Express a 1:2000 solution as a percentage.','0.05','%','1:2000 means 1 g in 2000 mL. To get grams per 100 mL: 1 ÷ 2000 × 100 = 0.05%.',RX),
  w(SOL,'Write a 0.2% solution as a ratio strength, 1:x.','500','','0.2% = 0.2 g per 100 mL. Divide 100 by 0.2 to find the volume for 1 g: 100 ÷ 0.2 = 500, so 1:500.',RX,{prefix:'1 :'}),
  w(SOL,'How many mL of a 15% stock solution are needed to prepare 300 mL of a 2% solution?','40','mL','C₁V₁ = C₂V₂: 15% × V₁ = 2% × 300 mL, so V₁ = 600 ÷ 15 = 40 mL of stock.',RX),
  w(SOL,'60 mL of a 20% solution is diluted to 8%. How many mL of water must be added?','90','mL','Final volume = 20 × 60 ÷ 8 = 150 mL. Water added = 150 − 60 = 90 mL.',RX),
  w(SOL,'How many mL of 60% alcohol are mixed with 10% alcohol to make 500 mL of 30% alcohol?','200','mL','By alligation, 60% gets 30 − 10 = 20 parts and 10% gets 60 − 30 = 30 parts (50 total). 500 × 20 ÷ 50 = 200 mL of 60%.',RX),
  w(SOL,'A sample is diluted 1:5, and that dilution is then diluted 1:4. What is the final dilution, 1:x?','20','','Multiply serial dilutions: 5 × 4 = 20, so the final dilution is 1:20.',RX,{prefix:'1 :'}),
  w(SOL,'A 1:8 dilution is made using 2 mL of serum. How many mL of diluent are needed?','14','mL','1:8 means 1 part sample in 8 total parts. Total = 2 × 8 = 16 mL, so diluent = 16 − 2 = 14 mL.',RX),
  w(SOL,'How many milligrams of drug are in a 45-g tube of 0.1% ointment?','45','mg','0.1% means 0.1 g per 100 g. 45 × 0.1 ÷ 100 = 0.045 g, and 0.045 g × 1000 = 45 mg.',RX),
  w(SOL,'25 mL of a 12% solution is diluted to a final volume of 150 mL. What is the new concentration?','2','%','Use C₁V₁ = C₂V₂ and solve for C₂: 12 × 25 ÷ 150 = 300 ÷ 150 = 2%.',RX),
  w(SOL,'How many grams of drug are needed to make 1 L of a 1:1000 solution?','1','g','1:1000 means 1 g in 1000 mL, so 1 L of solution contains exactly 1 g of drug.',RX),
  w(SOL,'100 mL of a 10% solution is mixed with 300 mL of a 30% solution. What is the final concentration?','25','%','Total drug = 10 g + 90 g = 100 g in 400 mL. 100 ÷ 400 × 100 = 25%.',RX)
 ],5404)
};
