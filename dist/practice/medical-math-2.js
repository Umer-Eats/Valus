// Medical Math Practice Test 2. Original problems written for Valus from the HOSA 2026–27 test plan.
// Like the real test, every answer is typed in as a number, with the unit shown beside the box.
// Every problem uses the HOSA "Reference Materials Summary" equivalents
// (1 kg = 2.2 lb, 1 oz = 30 mL, 1 tsp = 5 mL, 1 tbsp = 15 mL, 1 cup = 240 mL, 1 mL = 15 gtts, 1 in = 2.54 cm)
// and its rounding rules: round only the final answer, nearest whole number unless stated, pediatric doses down.
import {w, mix} from './q.js';
const DHO='Simmers, DHO: Health Science', CRAIG='Craig, Dosage Calculations Made Easy', RX='Rewald et al., Pharmacy Calculations';
const ESS='Mathematical essentials', CONV='Measurement and conversion problems', DOSE='Drug dosages and intravenous solutions', SOL='Dilutions, solutions, and concentrations';

export default {
 id:'medical-math-2',
 event:'Medical Math',
 title:'Practice Test 2',
 subtitle:'Full-length Round One simulation',
 minutes:90,
 sources:'DHO: Health Science, Craig’s Dosage Calculations Made Easy, Pharmacy Calculations (ASHP), and the HOSA Reference Materials Summary',
 plan:[{area:ESS,weight:5},{area:CONV,weight:30},{area:DOSE,weight:35},{area:SOL,weight:30}],
 questions:mix([
  w(ESS,'Write the Roman numeral XLIV as an Arabic number.','44','','XL = 50 − 10 = 40 and IV = 5 − 1 = 4, so XLIV = 44. A smaller numeral before a larger one is subtracted.',DHO),
  w(ESS,'Round 0.0467 to the nearest hundredth.','0.05','','The hundredths digit is 4 and the next digit is 6, which is 5 or more, so round up to 0.05. Keep the leading zero.',DHO),
  w(ESS,'What is 15% of 240?','36','','Convert the percent to a decimal and multiply: 0.15 × 240 = 36.',DHO),
  w(CONV,'Convert 2.5 L to milliliters.','2500','mL','1 L = 1000 mL, so 2.5 × 1000 = 2500 mL. Move the decimal three places to the right.',DHO),
  w(CONV,'A patient weighs 198 lb. What is the weight in kilograms?','90','kg','Divide pounds by 2.2: 198 ÷ 2.2 = 90 kg. Multiplying instead gives 435.6, a common error.',DHO),
  w(CONV,'A patient is 6 feet 1 inch tall. What is the height in centimeters, to the nearest whole number?','185','cm','6 ft × 12 = 72 in, plus 1 in = 73 in. 73 × 2.54 = 185.42 cm, which rounds to 185 cm.',DHO),
  w(CONV,'Convert 37.2 °C to degrees Fahrenheit, to the nearest tenth.','99.0','°F','°F = (°C × 1.8) + 32 = (37.2 × 1.8) + 32 = 66.96 + 32 = 98.96, which rounds to 99.0 °F.',DHO),
  w(CONV,'A patient’s temperature is 95 °F. What is it in degrees Celsius?','35','°C','°C = (°F − 32) × 5/9 = 63 × 5/9 = 35 °C. This is hypothermia.',DHO),
  w(CONV,'How many milliliters are in 3 tablespoons?','45','mL','1 tbsp = 15 mL, so 3 × 15 = 45 mL. One tablespoon equals 3 teaspoons.',DHO),
  w(CONV,'Convert 1.2 mg to micrograms.','1200','mcg','1 mg = 1000 mcg, so 1.2 × 1000 = 1200 mcg. Moving to a smaller unit makes the number larger.',CRAIG),
  w(CONV,'Convert 450 mg to grams.','0.45','g','1 g = 1000 mg, so 450 ÷ 1000 = 0.45 g. Always write a leading zero before a decimal point.',CRAIG),
  w(CONV,'A patient has 2 cups of coffee, 6 oz of soup and ½ cup of gelatin. What is the total intake in milliliters?','780','mL','2 cups = 480 mL, 6 oz × 30 = 180 mL and ½ cup = 120 mL. Gelatin melts at body temperature, so it counts as fluid: 480 + 180 + 120 = 780 mL.',DHO),
  w(CONV,'A newborn weighs 3.2 kg. What is the weight in pounds, to the nearest tenth?','7.0','lb','Multiply kilograms by 2.2: 3.2 × 2.2 = 7.04, which rounds to 7.0 lb.',DHO),
  w(CONV,'A dose of 45 mL is ordered. How many teaspoons is this?','9','tsp','1 tsp = 5 mL, so 45 ÷ 5 = 9 tsp. This is also 3 tbsp, or 1.5 oz.',DHO),
  w(CONV,'Over a shift, a patient voids 350 mL, 425 mL and 300 mL and vomits 150 mL. What is the total output?','1225','mL','Output includes urine, emesis and drainage: 350 + 425 + 300 + 150 = 1225 mL.',DHO),
  w(CONV,'A patient is 152 cm tall. What is the height in inches, to the nearest whole number?','60','in','Divide centimeters by 2.54: 152 ÷ 2.54 = 59.84, which rounds to 60 in.',DHO),
  w(CONV,'Calculate the body surface area of a patient who is 180 cm tall and weighs 80 kg, to the nearest hundredth.','2.00','m²','BSA = √(cm × kg ÷ 3600) = √(180 × 80 ÷ 3600) = √(14,400 ÷ 3600) = √4 = 2.00 m².',DHO),
  w(CONV,'How many ounces are in 0.5 L, to the nearest tenth?','16.7','oz','0.5 L = 500 mL, and 500 ÷ 30 mL per oz = 16.67, which rounds to 16.7 oz.',DHO),
  w(DOSE,'Digoxin 0.125 mg is ordered. Tablets contain 0.25 mg. How many tablets should be given?','0.5','tablets','Desired ÷ have = 0.125 ÷ 0.25 = 0.5 tablet. Only give a half tablet if the tablet is scored.',CRAIG),
  w(DOSE,'The order is 80 mg of an oral suspension labeled 125 mg per 5 mL. How many mL should be given, to the nearest tenth?','3.2','mL','Desired ÷ have × quantity = 80 ÷ 125 × 5 mL = 0.64 × 5 = 3.2 mL.',CRAIG),
  w(DOSE,'A child weighs 66 lb. The order is 20 mg/kg/day divided every 12 hours. How many mg are in each dose?','300','mg','66 ÷ 2.2 = 30 kg. 30 × 20 = 600 mg/day. Every 12 hours means 2 doses: 600 ÷ 2 = 300 mg per dose.',CRAIG),
  w(DOSE,'Using Young’s rule, what is the dose for a 6-year-old if the adult dose is 500 mg?','166','mg','Young’s rule: age ÷ (age + 12) × adult dose = 6 ÷ 18 × 500 = 166.67 mg. Pediatric doses are rounded down, so 166 mg.',CRAIG),
  w(DOSE,'Using Fried’s rule, what is the dose for a 10-month-old infant if the adult dose is 150 mg?','10','mg','Fried’s rule: age in months ÷ 150 × adult dose = 10 ÷ 150 × 150 = 10 mg.',CRAIG),
  w(DOSE,'1200 mL of IV fluid is ordered over 10 hours. What is the rate in mL/hr?','120','mL/hr','For a pump, divide total volume by total hours: 1200 mL ÷ 10 hr = 120 mL/hr.',CRAIG),
  w(DOSE,'250 mL is to infuse over 2 hours with a drop factor of 20 gtts/mL. What is the flow rate in gtts/min?','42','gtts/min','(Volume × drop factor) ÷ minutes = (250 × 20) ÷ 120 = 41.67, which rounds to 42 gtts/min.',CRAIG),
  w(DOSE,'An antibiotic in 100 mL is to infuse over 30 minutes with tubing that delivers 10 gtts/mL. What is the flow rate in gtts/min?','33','gtts/min','(100 × 10) ÷ 30 = 33.3, which rounds to 33 gtts/min. Use the infusion time in minutes.',CRAIG),
  w(DOSE,'1000 mL is infusing at 80 mL/hr. How many hours will it take, to the nearest tenth?','12.5','hours','Volume ÷ rate = 1000 ÷ 80 = 12.5 hours, which is 12 hours 30 minutes.',CRAIG),
  w(DOSE,'A heparin infusion contains 20,000 units in 250 mL and runs at 15 mL/hr. How many units per hour is the patient receiving?','1200','units/hr','Concentration = 20,000 ÷ 250 = 80 units/mL. 80 × 15 mL/hr = 1200 units/hr.',CRAIG),
  w(DOSE,'Insulin is ordered at 0.1 units/kg/hr for a 70-kg patient. The bag contains 100 units in 100 mL. What rate in mL/hr should be set?','7','mL/hr','Dose = 0.1 × 70 = 7 units/hr. The bag has 1 unit/mL, so the rate is 7 mL/hr.',CRAIG),
  w(DOSE,'Nitroglycerin 50 mg in 250 mL is running at 6 mL/hr. How many mcg/min is the patient receiving?','20','mcg/min','50 mg = 50,000 mcg ÷ 250 mL = 200 mcg/mL. 200 × 6 = 1200 mcg/hr ÷ 60 = 20 mcg/min.',CRAIG),
  w(DOSE,'A 1-g vial is reconstituted to 250 mg/mL. The order is 600 mg. How many mL should be drawn up?','2.4','mL','600 mg ÷ 250 mg/mL = 2.4 mL. Check the label for the diluent volume and the resulting concentration.',CRAIG),
  w(DOSE,'A 240-mL bottle of liquid medicine is ordered at 10 mL twice a day. How many days will it last?','12','days','Daily use is 10 mL × 2 doses = 20 mL. The bottle lasts 240 ÷ 20 = 12 days.',RX),
  w(DOSE,'The order is 1.5 g per day. Tablets contain 500 mg. How many tablets are given per day?','3','tablets','Convert to the same unit first: 1.5 g = 1500 mg. 1500 ÷ 500 = 3 tablets per day.',CRAIG),
  w(DOSE,'A 15-kg child receives 225 mg of a drug per day. What is the dose in mg/kg/day?','15','mg/kg/day','225 mg ÷ 15 kg = 15 mg/kg/day. Compare this with the safe range in the drug reference.',CRAIG),
  w(DOSE,'A drug is ordered at 50 mg/m². The patient’s BSA is 1.8 m². What dose should be given?','90','mg','Dose = 50 mg/m² × 1.8 m² = 90 mg. BSA dosing is common for chemotherapy.',CRAIG),
  w(SOL,'How many grams of dextrose are in 1000 mL of D10W?','100','g','D10W is 10% dextrose, or 10 g per 100 mL. 1000 mL × 10 g/100 mL = 100 g.',RX),
  w(SOL,'How many grams of sodium chloride are in 500 mL of 0.45% NaCl?','2.25','g','0.45% NaCl (half-normal saline) has 0.45 g per 100 mL. 500 ÷ 100 × 0.45 = 2.25 g.',RX),
  w(SOL,'How many mL of full-strength stock are needed to make 1000 mL of a 1:20 solution?','50','mL','A 1:20 solution is 1 part stock in 20 parts total: 1000 ÷ 20 = 50 mL of stock, plus 950 mL of diluent.',RX),
  w(SOL,'Express a 1:5000 solution as a percentage.','0.02','%','1 ÷ 5000 = 0.0002. Multiply by 100 to get a percentage: 0.02%.',RX),
  w(SOL,'Write a 0.1% solution as a ratio strength, 1:x.','1000','','0.1% = 0.1 g per 100 mL = 1 g per 1000 mL, so the ratio strength is 1:1000.',RX,{prefix:'1 :'}),
  w(SOL,'How many mL of a 25% stock solution are needed to make 500 mL of a 5% solution?','100','mL','C1V1 = C2V2: 25 × V1 = 5 × 500, so V1 = 2500 ÷ 25 = 100 mL of stock, plus 400 mL of diluent.',RX),
  w(SOL,'30 mL of a 15% solution is diluted to 10%. How many mL of water must be added?','15','mL','30 × 15 = 10 × V2, so V2 = 45 mL total. 45 − 30 = 15 mL of water added.',RX),
  w(SOL,'12.5 g of a drug is dissolved to make 250 mL of solution. What is the percent strength (w/v)?','5','%','Percent w/v is grams of drug per 100 mL of solution: 12.5 ÷ 250 × 100 = 5%.',RX),
  w(SOL,'A 0.5% solution contains how many milligrams of drug per milliliter?','5','mg/mL','0.5% means 0.5 g per 100 mL, which is 500 mg per 100 mL, or 5 mg in each mL.',RX),
  w(SOL,'A sample is diluted 1:2, then 1:5, then 1:10. Write the final dilution as 1:x.','100','','Multiply serial dilution factors: 2 × 5 × 10 = 100, so the final dilution is 1:100.',DHO,{prefix:'1 :'}),
  w(SOL,'How many mL of 95% alcohol are mixed with 50% alcohol to make 900 mL of 70% alcohol?','400','mL','Alligation: 95% gets 70 − 50 = 20 parts and 50% gets 95 − 70 = 25 parts, 45 parts total. 20 ÷ 45 × 900 = 400 mL.',RX),
  w(SOL,'Magnesium sulfate 50% is ordered as a 2-g dose. How many mL are needed?','4','mL','50% = 50 g per 100 mL = 500 mg/mL. 2 g = 2000 mg ÷ 500 mg/mL = 4 mL.',RX),
  w(SOL,'How many grams of drug are in a 60-g tube of 2.5% ointment?','1.5','g','For ointments, percent is weight in weight: 2.5 g per 100 g. 60 × 0.025 = 1.5 g.',RX),
  w(SOL,'1 g of drug is dissolved in enough water to make 250 mL. Write the ratio strength as 1:x.','250','','Ratio strength for solids in liquids is grams to milliliters: 1 g in 250 mL is 1:250.',RX,{prefix:'1 :'}),
  w(SOL,'50 mL of a 40% solution is diluted to a final volume of 200 mL. What is the new concentration?','10','%','C2 = C1V1 ÷ V2 = 40 × 50 ÷ 200 = 10%. The amount of drug stays the same; only the volume changes.',RX)
 ],29)
};
