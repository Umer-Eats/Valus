// Medical Math Practice Test 4. Original problems written for Valus from the HOSA 2026–27 test plan.
// Like the real test, every answer is typed in as a number, with the unit shown beside the box.
// Every problem uses the HOSA "Reference Materials Summary" equivalents
// (1 kg = 2.2 lb, 1 oz = 30 mL, 1 tsp = 5 mL, 1 tbsp = 15 mL, 1 cup = 240 mL, 1 mL = 15 gtts, 1 in = 2.54 cm)
// and its rounding rules: round only the final answer, nearest whole number unless stated, pediatric doses down.
import {w, mix} from './q.js';
const DHO='Simmers, DHO: Health Science', CRAIG='Craig, Dosage Calculations Made Easy', RX='Rewald et al., Pharmacy Calculations';
const ESS='Mathematical essentials', CONV='Measurement and conversion problems', DOSE='Drug dosages and intravenous solutions', SOL='Dilutions, solutions, and concentrations';

export default {
 id:'medical-math-4',
 event:'Medical Math',
 title:'Practice Test 4',
 subtitle:'Full-length Round One simulation',
 minutes:90,
 sources:'DHO: Health Science, Craig’s Dosage Calculations Made Easy, Pharmacy Calculations (ASHP), and the HOSA Reference Materials Summary',
 plan:[{area:ESS,weight:5},{area:CONV,weight:30},{area:DOSE,weight:35},{area:SOL,weight:30}],
 questions:mix([
  w(ESS,'Write the Roman numeral LXVIII as an Arabic number.','68','','L = 50, X = 10, V = 5 and III = 3. All are added because none is smaller than the numeral after it: 50 + 10 + 5 + 3 = 68.',DHO),
  w(ESS,'Express 7/20 as a decimal.','0.35','','Divide the numerator by the denominator: 7 ÷ 20 = 0.35. Write a leading zero before the decimal point.',DHO),
  w(ESS,'Solve for x: 3 : 8 = 12 : x','32','','In a proportion, the product of the means equals the product of the extremes: 3x = 8 × 12 = 96, so x = 32.',DHO),
  w(CONV,'Convert 3.4 mg to micrograms.','3400','mcg','1 mg = 1000 mcg, so 3.4 × 1000 = 3400 mcg. Move the decimal three places to the right going to a smaller unit.',DHO),
  w(CONV,'Convert 750 mL to liters.','0.75','L','1 L = 1000 mL, so 750 ÷ 1000 = 0.75 L. Move the decimal three places to the left going to a larger unit.',DHO),
  w(CONV,'A patient weighs 176 lb. What is the weight in kilograms?','80','kg','Divide pounds by the HOSA equivalent of 2.2 lb per kg: 176 ÷ 2.2 = 80 kg.',DHO),
  w(CONV,'An infant weighs 4.1 kg. What is the weight in pounds, to the nearest tenth?','9.0','lb','Multiply kilograms by 2.2: 4.1 × 2.2 = 9.02, which rounds to 9.0 lb to the nearest tenth.',DHO),
  w(CONV,'A patient’s temperature is 102.2 °F. What is it in degrees Celsius?','39','°C','°C = (°F − 32) ÷ 1.8 = (102.2 − 32) ÷ 1.8 = 70.2 ÷ 1.8 = 39 °C.',DHO),
  w(CONV,'Convert 35.5 °C to degrees Fahrenheit, to the nearest tenth.','95.9','°F','°F = (°C × 1.8) + 32 = (35.5 × 1.8) + 32 = 63.9 + 32 = 95.9 °F, a temperature that suggests hypothermia.',DHO),
  w(CONV,'A patient is 4 feet 11 inches tall. What is the height in centimeters, to the nearest whole number?','150','cm','4 ft 11 in = 59 in. Multiply by 2.54: 59 × 2.54 = 149.86, which rounds to 150 cm.',DHO),
  w(CONV,'A waist measures 81 cm. What is this in inches, to the nearest tenth?','31.9','in','Divide centimeters by 2.54: 81 ÷ 2.54 = 31.89, which rounds to 31.9 inches.',DHO),
  w(CONV,'A patient drinks 3 oz of juice and 2 cups of water and receives a 150-mL IV flush. What is the total intake in milliliters?','720','mL','3 oz × 30 = 90 mL, 2 cups × 240 = 480 mL, and the IV flush adds 150 mL: 90 + 480 + 150 = 720 mL.',DHO),
  w(CONV,'A patient’s 24-hour intake is 2100 mL and output is 2450 mL. What is the fluid balance in mL?','-350','mL','Balance = intake − output = 2100 − 2450 = −350 mL. A negative balance means more fluid was lost than taken in.',DHO),
  w(CONV,'How many tablespoons are in 3 fluid ounces?','6','tbsp','3 oz × 30 mL = 90 mL, and 90 mL ÷ 15 mL per tablespoon = 6 tbsp. One ounce equals 2 tablespoons.',DHO),
  w(CONV,'How many cups are in 600 mL?','2.5','cups','Using the HOSA equivalent of 1 cup = 240 mL: 600 ÷ 240 = 2.5 cups.',DHO),
  w(CONV,'A medication is due at 4:05 p.m. How is this time written in 24-hour (military) time?','1605','','For p.m. times after noon, add 12 to the hour: 4 + 12 = 16, so 4:05 p.m. is 1605. Minutes stay the same.',DHO,{accept:['16:05']}),
  w(CONV,'Using the HOSA equivalent of 15 drops per milliliter, how many drops are in 2.5 mL? Round to the nearest whole number.','38','gtts','Multiply milliliters by 15 drops per mL: 2.5 × 15 = 37.5, which rounds up to 38 drops.',DHO),
  w(CONV,'How many ounces are in 2.5 pounds?','40','oz','There are 16 ounces in 1 pound, so 2.5 × 16 = 40 oz. These are weight ounces, not fluid ounces.',DHO),
  w(DOSE,'The order is 1.2 g. Tablets on hand contain 400 mg each. How many tablets should be given?','3','tablets','Convert first: 1.2 g = 1200 mg. Then 1200 mg ÷ 400 mg per tablet = 3 tablets.',CRAIG),
  w(DOSE,'The order is 0.25 mg. Tablets on hand contain 125 mcg each. How many tablets should be given?','2','tablets','Convert to the same unit: 0.25 mg = 250 mcg. Then 250 ÷ 125 = 2 tablets.',CRAIG),
  w(DOSE,'The order is 200 mg of a suspension labeled 125 mg per 5 mL. How many mL should be given?','8','mL','Desired ÷ have × quantity = 200 ÷ 125 × 5 mL = 1.6 × 5 = 8 mL.',CRAIG),
  w(DOSE,'An injection is labeled 2 mg/mL. The order is 3 mg. How many mL should be given?','1.5','mL','Divide the ordered dose by the concentration: 3 mg ÷ 2 mg/mL = 1.5 mL.',CRAIG),
  w(DOSE,'A child weighs 13.6 kg. The order is 15 mg/kg. How many milligrams should be given?','204','mg','Multiply the weight by the dose per kilogram: 13.6 kg × 15 mg/kg = 204 mg.',CRAIG),
  w(DOSE,'A child weighs 38 lb. The order is 40 mg/kg/day divided every 12 hours. How many milligrams are given per dose?','345','mg','38 ÷ 2.2 = 17.27 kg. 17.27 × 40 = 690.9 mg/day, given in 2 doses: 690.9 ÷ 2 = 345.45. Pediatric doses round down to 345 mg.',CRAIG),
  w(DOSE,'A drug’s maximum safe dose is 100 mg/kg/day divided every 6 hours. What is the largest single dose for a 20-kg child?','500','mg','Maximum daily dose = 100 × 20 = 2000 mg. Every 6 hours is 4 doses, so 2000 ÷ 4 = 500 mg per dose.',CRAIG),
  w(DOSE,'2000 mL of IV fluid is ordered over 24 hours. What is the rate in mL/hr?','83','mL/hr','Rate = volume ÷ time = 2000 ÷ 24 = 83.33, which rounds to 83 mL/hr.',CRAIG),
  w(DOSE,'1000 mL is to infuse over 6 hours with a drop factor of 20 gtts/mL. What is the drip rate in drops per minute?','56','gtts/min','gtts/min = 1000 × 20 ÷ 360 min = 20,000 ÷ 360 = 55.56, which rounds to 56 gtts/min.',CRAIG),
  w(DOSE,'1 L of IV fluid is infusing at 50 mL/hr. How many hours will it take to finish?','20','hours','Time = volume ÷ rate. Convert 1 L to 1000 mL, then 1000 ÷ 50 = 20 hours.',CRAIG),
  w(DOSE,'A 50-mL piggyback is to infuse over 15 minutes with a drop factor of 15 gtts/mL. What is the drip rate?','50','gtts/min','gtts/min = 50 mL × 15 gtts/mL ÷ 15 min = 750 ÷ 15 = 50 gtts/min.',CRAIG),
  w(DOSE,'50 mL of an antibiotic is to infuse over 30 minutes by pump. What rate in mL/hr should be set?','100','mL/hr','Pumps run in mL per hour. 50 mL in 30 minutes equals 100 mL in 60 minutes, so set 100 mL/hr.',CRAIG),
  w(DOSE,'An insulin drip contains 50 units in 250 mL. The order is 4 units/hr. What is the rate in mL/hr?','20','mL/hr','Concentration = 50 ÷ 250 = 0.2 units/mL. Rate = 4 units/hr ÷ 0.2 units/mL = 20 mL/hr.',CRAIG),
  w(DOSE,'Norepinephrine 4 mg in 250 mL is running at 15 mL/hr. How many mcg/min is the patient receiving?','4','mcg/min','Concentration = 4000 mcg ÷ 250 mL = 16 mcg/mL. 15 mL/hr × 16 = 240 mcg/hr, and 240 ÷ 60 = 4 mcg/min.',RX),
  w(DOSE,'Using BSA = √(height in cm × weight in kg ÷ 3600), what is the BSA of a patient who is 150 cm tall and weighs 54 kg? Round to the nearest hundredth.','1.50','m²','150 × 54 = 8100, and 8100 ÷ 3600 = 2.25. The square root of 2.25 is 1.5, so BSA = 1.50 m².',RX),
  w(DOSE,'Using Young’s rule, what is the dose for a 4-year-old if the adult dose is 500 mg?','125','mg','Young’s rule: age ÷ (age + 12) × adult dose = 4 ÷ 16 × 500 = 0.25 × 500 = 125 mg.',CRAIG),
  w(DOSE,'A 25-kg child receives 250 mg every 8 hours. What is the dose in mg/kg/day?','30','mg/kg/day','Every 8 hours is 3 doses: 250 × 3 = 750 mg/day. Divide by weight: 750 ÷ 25 = 30 mg/kg/day.',CRAIG),
  w(SOL,'How many grams of drug are in 400 mL of a 2.5% solution?','10','g','A 2.5% solution has 2.5 g in every 100 mL, so 400 mL × 2.5 ÷ 100 = 10 g of drug.',RX),
  w(SOL,'0.5 g of a drug is dissolved to make 50 mL of solution. What is the percent strength (w/v)?','1','%','Percent w/v is grams of drug per 100 mL of solution: 0.5 g ÷ 50 mL × 100 = 1%.',RX),
  w(SOL,'Bupivacaine 0.25% contains how many milligrams of drug per milliliter?','2.5','mg/mL','0.25% = 0.25 g per 100 mL = 250 mg ÷ 100 mL = 2.5 mg/mL. Shortcut: percent × 10 = mg/mL.',RX),
  w(SOL,'Express a 1:250 solution as a percentage.','0.4','%','1:250 means 1 g in 250 mL. To get grams per 100 mL: 1 ÷ 250 × 100 = 0.4%.',RX),
  w(SOL,'Write a 5% solution as a ratio strength, 1:x.','20','','5% = 5 g per 100 mL. Divide 100 by 5 to find the volume for 1 g: 100 ÷ 5 = 20, so 1:20.',RX,{prefix:'1 :'}),
  w(SOL,'How many mL of 50% dextrose are needed to prepare 500 mL of 5% dextrose?','50','mL','C₁V₁ = C₂V₂: 50% × V₁ = 5% × 500 mL, so V₁ = 2500 ÷ 50 = 50 mL of 50% dextrose.',RX),
  w(SOL,'200 mL of a 10% solution is diluted to 4%. How many mL of water must be added?','300','mL','Final volume = 10 × 200 ÷ 4 = 500 mL. Water added = 500 − 200 = 300 mL.',RX),
  w(SOL,'How many mL of 95% alcohol are mixed with 5% alcohol to make 900 mL of 35% alcohol?','300','mL','By alligation, 95% gets 35 − 5 = 30 parts and 5% gets 95 − 35 = 60 parts (90 total). 900 × 30 ÷ 90 = 300 mL of 95%.',RX),
  w(SOL,'A sample is diluted 1:3, and that dilution is then diluted 1:10. What is the final dilution, 1:x?','30','','Multiply serial dilutions: 3 × 10 = 30, so the final dilution is 1:30.',RX,{prefix:'1 :'}),
  w(SOL,'A 1:10 dilution is made using 0.5 mL of sample. How many mL of diluent are needed?','4.5','mL','1:10 means 1 part sample in 10 total parts. Total = 0.5 × 10 = 5 mL, so diluent = 5 − 0.5 = 4.5 mL.',RX),
  w(SOL,'How many grams of drug are in a 28-g tube of 2% cream?','0.56','g','2% means 2 g per 100 g. 28 × 2 ÷ 100 = 0.56 g of drug in the tube.',RX),
  w(SOL,'40 mL of a 25% solution is diluted to a final volume of 250 mL. What is the new concentration?','4','%','Use C₁V₁ = C₂V₂ and solve for C₂: 25 × 40 ÷ 250 = 1000 ÷ 250 = 4%.',RX),
  w(SOL,'How many grams of drug are needed to make 500 mL of a 1:200 solution?','2.5','g','1:200 means 1 g in 200 mL. For 500 mL: 500 ÷ 200 = 2.5 g of drug.',RX),
  w(SOL,'200 mL of a 5% solution is mixed with 300 mL of a 20% solution. What is the final concentration?','14','%','Total drug = 10 g + 60 g = 70 g in 500 mL. 70 ÷ 500 × 100 = 14%.',RX),
  w(SOL,'0.2 mL of serum is diluted to a total volume of 10 mL. What is the dilution, 1:x?','50','','Dilution = total volume ÷ sample volume = 10 ÷ 0.2 = 50, so the dilution is 1:50.',RX,{prefix:'1 :'})
 ],6404)
};
