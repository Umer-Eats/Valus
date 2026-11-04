// Medical Math Practice Test 5. Original problems written for Valus from the HOSA 2026–27 test plan.
// Like the real test, every answer is typed in as a number, with the unit shown beside the box.
// Every problem uses the HOSA "Reference Materials Summary" equivalents
// (1 kg = 2.2 lb, 1 oz = 30 mL, 1 tsp = 5 mL, 1 tbsp = 15 mL, 1 cup = 240 mL, 1 mL = 15 gtts, 1 in = 2.54 cm)
// and its rounding rules: round only the final answer, nearest whole number unless stated, pediatric doses down.
import {w, mix} from './q.js';
const DHO='Simmers, DHO: Health Science', CRAIG='Craig, Dosage Calculations Made Easy', RX='Rewald et al., Pharmacy Calculations';
const ESS='Mathematical essentials', CONV='Measurement and conversion problems', DOSE='Drug dosages and intravenous solutions', SOL='Dilutions, solutions, and concentrations';

export default {
 id:'medical-math-5',
 event:'Medical Math',
 title:'Practice Test 5',
 subtitle:'Full-length Round One simulation',
 minutes:90,
 sources:'DHO: Health Science, Craig’s Dosage Calculations Made Easy, Pharmacy Calculations (ASHP), and the HOSA Reference Materials Summary',
 plan:[{area:ESS,weight:5},{area:CONV,weight:30},{area:DOSE,weight:35},{area:SOL,weight:30}],
 questions:mix([
  w(ESS,'Write the Roman numeral LXXVI as an Arabic number.','76','','L = 50, XX = 20, V = 5 and I = 1. All are added because none is smaller than the numeral after it: 50 + 20 + 5 + 1 = 76.',DHO),
  w(ESS,'Express 3/8 as a decimal.','0.375','','Divide the numerator by the denominator: 3 ÷ 8 = 0.375. Write a leading zero before the decimal point.',DHO),
  w(ESS,'What is 35% of 180?','63','','Change the percent to a decimal and multiply: 0.35 × 180 = 63. Percent means “per hundred.”',DHO),
  w(CONV,'Convert 0.6 g to milligrams.','600','mg','1 g = 1000 mg, so 0.6 × 1000 = 600 mg. Move the decimal three places to the right going to a smaller unit.',DHO),
  w(CONV,'Convert 1750 mcg to milligrams.','1.75','mg','1 mg = 1000 mcg, so 1750 ÷ 1000 = 1.75 mg. Move the decimal three places to the left going to a larger unit.',DHO),
  w(CONV,'A patient weighs 143 lb. What is the weight in kilograms?','65','kg','Divide pounds by the HOSA equivalent of 2.2 lb per kg: 143 ÷ 2.2 = 65 kg.',DHO),
  w(CONV,'A newborn weighs 3.5 kg. What is the weight in pounds, to the nearest tenth?','7.7','lb','Multiply kilograms by the HOSA equivalent of 2.2 lb per kg: 3.5 × 2.2 = 7.7 lb.',DHO),
  w(CONV,'A patient’s temperature is 98.6 °F. What is it in degrees Celsius?','37','°C','°C = (°F − 32) ÷ 1.8 = (98.6 − 32) ÷ 1.8 = 66.6 ÷ 1.8 = 37 °C, normal body temperature.',DHO),
  w(CONV,'Convert 38.5 °C to degrees Fahrenheit, to the nearest tenth.','101.3','°F','°F = (°C × 1.8) + 32 = (38.5 × 1.8) + 32 = 69.3 + 32 = 101.3 °F, which is a fever.',DHO),
  w(CONV,'A patient is 5 feet 4 inches tall. What is the height in centimeters, to the nearest whole number?','163','cm','5 ft 4 in = 64 in. Multiply by 2.54: 64 × 2.54 = 162.56, which rounds to 163 cm.',DHO),
  w(CONV,'An infant’s head measures 30 cm around. What is this in inches, to the nearest tenth?','11.8','in','Divide centimeters by 2.54: 30 ÷ 2.54 = 11.81, which rounds to 11.8 inches.',DHO),
  w(CONV,'A patient drinks 6 oz of tea, 1.5 cups of broth and 2 tbsp of liquid medicine. What is the total intake in mL?','570','mL','6 oz × 30 = 180 mL, 1.5 cups × 240 = 360 mL and 2 tbsp × 15 = 30 mL: 180 + 360 + 30 = 570 mL.',DHO),
  w(CONV,'How many milliliters are in 4 teaspoons?','20','mL','Using the HOSA equivalent of 1 tsp = 5 mL: 4 × 5 = 20 mL. Three teaspoons make one tablespoon.',DHO),
  w(CONV,'How many fluid ounces are in 1.5 L?','50','oz','1.5 L = 1500 mL. Using the HOSA equivalent of 1 oz = 30 mL: 1500 ÷ 30 = 50 fluid ounces.',DHO),
  w(CONV,'A medication is due at 11:30 p.m. How is this time written in 24-hour (military) time?','2330','','For p.m. times after noon, add 12 to the hour: 11 + 12 = 23, so 11:30 p.m. is 2330. Minutes stay the same.',DHO,{accept:['23:30']}),
  w(CONV,'A patient voids 350 mL, 275 mL and 400 mL during a shift. What is the total urine output in mL?','1025','mL','Add each measured output: 350 + 275 + 400 = 1025 mL of urine for the shift.',DHO),
  w(CONV,'Using the HOSA equivalent of 15 drops per milliliter, how many milliliters are in 45 drops?','3','mL','Divide drops by 15 drops per mL: 45 ÷ 15 = 3 mL. Drops are abbreviated gtts.',DHO),
  w(CONV,'Convert 0.075 L to milliliters.','75','mL','1 L = 1000 mL, so 0.075 × 1000 = 75 mL. Move the decimal three places to the right.',DHO),
  w(DOSE,'The order is 0.5 g. Tablets on hand contain 250 mg each. How many tablets should be given?','2','tablets','Convert first: 0.5 g = 500 mg. Then 500 mg ÷ 250 mg per tablet = 2 tablets.',CRAIG),
  w(DOSE,'The order is 75 mcg. Tablets on hand contain 0.025 mg each. How many tablets should be given?','3','tablets','Convert to the same unit: 0.025 mg = 25 mcg. Then 75 mcg ÷ 25 mcg per tablet = 3 tablets.',CRAIG),
  w(DOSE,'The order is 375 mg of a suspension labeled 250 mg per 5 mL. How many mL should be given?','7.5','mL','Desired ÷ have × quantity = 375 ÷ 250 × 5 mL = 1.5 × 5 = 7.5 mL.',CRAIG),
  w(DOSE,'An injection is labeled 40 mg/mL. The order is 30 mg. How many mL should be given?','0.75','mL','Divide the ordered dose by the concentration: 30 mg ÷ 40 mg/mL = 0.75 mL.',CRAIG),
  w(DOSE,'A child weighs 22 kg. The order is 10 mg/kg. How many milligrams should be given?','220','mg','Multiply the weight by the dose per kilogram: 22 kg × 10 mg/kg = 220 mg.',CRAIG),
  w(DOSE,'A child weighs 44 lb. The order is 30 mg/kg/day divided every 8 hours. How many milligrams are given per dose?','200','mg','44 ÷ 2.2 = 20 kg. 20 × 30 = 600 mg/day, given in 3 doses (every 8 hours): 600 ÷ 3 = 200 mg per dose.',CRAIG),
  w(DOSE,'A drug’s safe range is 50–100 mg/kg/day. What is the maximum safe daily dose for a 15-kg child?','1500','mg','Use the top of the range: 15 kg × 100 mg/kg/day = 1500 mg per day.',CRAIG),
  w(DOSE,'1500 mL of IV fluid is ordered over 12 hours. What is the rate in mL/hr?','125','mL/hr','Rate = volume ÷ time = 1500 mL ÷ 12 hr = 125 mL/hr. Check: 125 × 12 = 1500 mL.',CRAIG),
  w(DOSE,'1000 mL is to infuse over 8 hours with a drop factor of 15 gtts/mL. What is the drip rate in drops per minute?','31','gtts/min','gtts/min = 1000 × 15 ÷ 480 min = 15,000 ÷ 480 = 31.25, which rounds to 31 gtts/min.',CRAIG),
  w(DOSE,'500 mL of IV fluid is infusing at 80 mL/hr. How many hours will it take to finish? Round to the nearest hundredth.','6.25','hours','Time = volume ÷ rate = 500 ÷ 80 = 6.25 hours, which is 6 hours and 15 minutes.',CRAIG),
  w(DOSE,'A 100-mL piggyback is to infuse over 30 minutes with a drop factor of 10 gtts/mL. What is the drip rate?','33','gtts/min','gtts/min = 100 mL × 10 gtts/mL ÷ 30 min = 1000 ÷ 30 = 33.3, which rounds to 33 gtts/min.',CRAIG),
  w(DOSE,'150 mL of an antibiotic is to infuse over 45 minutes by pump. What rate in mL/hr should be set?','200','mL/hr','Pumps run in mL per hour: 150 mL ÷ 45 min × 60 min = 200 mL/hr.',CRAIG),
  w(DOSE,'Heparin 25,000 units is in 500 mL. The order is 1000 units/hr. What is the rate in mL/hr?','20','mL/hr','Concentration = 25,000 ÷ 500 = 50 units/mL. Rate = 1000 units/hr ÷ 50 units/mL = 20 mL/hr.',CRAIG),
  w(DOSE,'Dopamine 400 mg in 250 mL is ordered at 5 mcg/kg/min for an 80-kg patient. What is the rate in mL/hr?','15','mL/hr','Dose = 5 × 80 = 400 mcg/min × 60 = 24,000 mcg/hr. Concentration = 400,000 mcg ÷ 250 mL = 1600 mcg/mL. 24,000 ÷ 1600 = 15 mL/hr.',RX),
  w(DOSE,'Using BSA = √(height in cm × weight in kg ÷ 3600), what is the BSA of a patient who is 180 cm tall and weighs 80 kg? Round to the nearest hundredth.','2.00','m²','180 × 80 = 14,400, and 14,400 ÷ 3600 = 4. The square root of 4 is 2, so BSA = 2.00 m².',RX),
  w(DOSE,'Using Clark’s rule, what is the dose for a 30-lb child if the adult dose is 600 mg?','120','mg','Clark’s rule: weight in lb ÷ 150 × adult dose = 30 ÷ 150 × 600 = 0.2 × 600 = 120 mg.',CRAIG),
  w(DOSE,'An infusion of 900 mL is started at 0900 and runs at 150 mL/hr. At what time (24-hour) will it finish?','1500','','900 mL ÷ 150 mL/hr = 6 hours. 0900 + 6 hours = 1500, which is 3:00 p.m.',CRAIG,{accept:['15:00']}),
  w(SOL,'How many grams of sodium chloride are in 250 mL of 0.9% normal saline?','2.25','g','0.9% means 0.9 g per 100 mL, so 250 × 0.9 ÷ 100 = 2.25 g of sodium chloride.',RX),
  w(SOL,'3 g of a drug is dissolved to make 150 mL of solution. What is the percent strength (w/v)?','2','%','Percent w/v is grams of drug per 100 mL of solution: 3 g ÷ 150 mL × 100 = 2%.',RX),
  w(SOL,'Bupivacaine 0.5% contains how many milligrams of drug per milliliter?','5','mg/mL','0.5% = 0.5 g per 100 mL = 500 mg ÷ 100 mL = 5 mg/mL. Shortcut: percent × 10 = mg/mL.',RX),
  w(SOL,'Epinephrine 1:1000 contains how many milligrams per milliliter?','1','mg/mL','1:1000 means 1 g in 1000 mL, which is 1000 mg in 1000 mL, or 1 mg/mL.',RX),
  w(SOL,'Express a 1:400 solution as a percentage.','0.25','%','1:400 means 1 g in 400 mL. To get grams per 100 mL: 1 ÷ 400 × 100 = 0.25%.',RX),
  w(SOL,'Write a 2.5% solution as a ratio strength, 1:x.','40','','2.5% = 2.5 g per 100 mL. Divide 100 by 2.5 to find the volume for 1 g: 100 ÷ 2.5 = 40, so 1:40.',RX,{prefix:'1 :'}),
  w(SOL,'How many mL of a 25% solution are needed to prepare 250 mL of a 10% solution?','100','mL','C₁V₁ = C₂V₂: 25% × V₁ = 10% × 250 mL, so V₁ = 2500 ÷ 25 = 100 mL of the 25% solution.',RX),
  w(SOL,'150 mL of a 20% solution is diluted to 5%. How many mL of water must be added?','450','mL','Final volume = 20 × 150 ÷ 5 = 600 mL. Water added = 600 − 150 = 450 mL.',RX),
  w(SOL,'How many mL of 70% alcohol are mixed with 10% alcohol to make 600 mL of 30% alcohol?','200','mL','By alligation, 70% gets 30 − 10 = 20 parts and 10% gets 70 − 30 = 40 parts (60 total). 600 × 20 ÷ 60 = 200 mL of 70%.',RX),
  w(SOL,'A sample is diluted 1:2, and that dilution is then diluted 1:8. What is the final dilution, 1:x?','16','','Multiply serial dilution factors: 2 × 8 = 16, so the final dilution is 1:16.',RX,{prefix:'1 :'}),
  w(SOL,'A 1:5 dilution is made using 2 mL of sample. How many mL of diluent are needed?','8','mL','1:5 means 1 part sample in 5 total parts. Total = 2 × 5 = 10 mL, so diluent = 10 − 2 = 8 mL.',RX),
  w(SOL,'How many grams of drug are in a 15-g tube of 1% ointment?','0.15','g','1% means 1 g of drug per 100 g of ointment. 15 × 1 ÷ 100 = 0.15 g of drug in the tube.',RX),
  w(SOL,'60 mL of a 15% solution is diluted to a final volume of 300 mL. What is the new concentration?','3','%','Use C₁V₁ = C₂V₂ and solve for C₂: 15 × 60 ÷ 300 = 900 ÷ 300 = 3%.',RX),
  w(SOL,'How many grams of drug are in 1 L of a 1:2000 solution?','0.5','g','1:2000 means 1 g in 2000 mL. For 1000 mL: 1000 ÷ 2000 = 0.5 g of drug.',RX),
  w(SOL,'100 mL of a 10% solution is mixed with 400 mL of a 5% solution. What is the final concentration?','6','%','Total drug = 10 g + 20 g = 30 g in 500 mL. 30 ÷ 500 × 100 = 6%.',RX)
 ],9504)
};
