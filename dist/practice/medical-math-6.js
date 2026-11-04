// Medical Math Practice Test 6. Original problems written for Valus from the HOSA 2026–27 test plan.
// Like the real test, every answer is typed in as a number, with the unit shown beside the box.
// Every problem uses the HOSA "Reference Materials Summary" equivalents
// (1 kg = 2.2 lb, 1 oz = 30 mL, 1 tsp = 5 mL, 1 tbsp = 15 mL, 1 cup = 240 mL, 1 mL = 15 gtts, 1 in = 2.54 cm)
// and its rounding rules: round only the final answer, nearest whole number unless stated, pediatric doses down.
import {w, mix} from './q.js';
const DHO='Simmers, DHO: Health Science', CRAIG='Craig, Dosage Calculations Made Easy', RX='Rewald et al., Pharmacy Calculations';
const ESS='Mathematical essentials', CONV='Measurement and conversion problems', DOSE='Drug dosages and intravenous solutions', SOL='Dilutions, solutions, and concentrations';

export default {
 id:'medical-math-6',
 event:'Medical Math',
 title:'Practice Test 6',
 subtitle:'Full-length Round One simulation',
 minutes:90,
 sources:'DHO: Health Science, Craig’s Dosage Calculations Made Easy, Pharmacy Calculations (ASHP), and the HOSA Reference Materials Summary',
 plan:[{area:ESS,weight:5},{area:CONV,weight:30},{area:DOSE,weight:35},{area:SOL,weight:30}],
 questions:mix([
  w(ESS,'Write the Roman numeral XCIX as an Arabic number.','99','','XC = 100 − 10 = 90 and IX = 10 − 1 = 9, because each smaller numeral comes before a larger one. Together: 90 + 9 = 99.',DHO),
  w(ESS,'Round 3.14159 to the nearest hundredth.','3.14','','The hundredths digit is 4; the next digit (1) is less than 5, so the 4 stays the same: 3.14.',DHO),
  w(ESS,'Solve for x: 4 : x = 12 : 27','9','','The product of the means equals the product of the extremes: 12x = 4 × 27 = 108, so x = 9.',DHO),
  w(CONV,'Convert 0.045 g to milligrams.','45','mg','1 g = 1000 mg, so 0.045 × 1000 = 45 mg. Move the decimal three places to the right going to a smaller unit.',DHO),
  w(CONV,'Convert 650 mcg to milligrams.','0.65','mg','1 mg = 1000 mcg, so 650 ÷ 1000 = 0.65 mg. Write a leading zero before the decimal point.',DHO),
  w(CONV,'A patient weighs 209 lb. What is the weight in kilograms?','95','kg','Divide pounds by the HOSA equivalent of 2.2 lb per kg: 209 ÷ 2.2 = 95 kg.',DHO),
  w(CONV,'A premature infant weighs 2.7 kg. What is the weight in pounds, to the nearest tenth?','5.9','lb','Multiply kilograms by 2.2: 2.7 × 2.2 = 5.94, which rounds to 5.9 lb to the nearest tenth.',DHO),
  w(CONV,'A patient’s temperature is 96.8 °F. What is it in degrees Celsius?','36','°C','°C = (°F − 32) ÷ 1.8 = (96.8 − 32) ÷ 1.8 = 64.8 ÷ 1.8 = 36 °C, slightly below average body temperature.',DHO),
  w(CONV,'Convert 36.2 °C to degrees Fahrenheit, to the nearest tenth.','97.2','°F','°F = (°C × 1.8) + 32 = (36.2 × 1.8) + 32 = 65.16 + 32 = 97.16, which rounds to 97.2 °F.',DHO),
  w(CONV,'A patient is 5 feet 9 inches tall. What is the height in centimeters, to the nearest whole number?','175','cm','5 ft 9 in = 69 in. Multiply by 2.54: 69 × 2.54 = 175.26, which rounds to 175 cm.',DHO),
  w(CONV,'A child is 127 cm tall. What is the height in inches?','50','in','Divide centimeters by the HOSA equivalent of 2.54 cm per inch: 127 ÷ 2.54 = 50 inches.',DHO),
  w(CONV,'A patient drinks 8 oz of milk and 1 cup of soup and receives 120 mL by IV. What is the total intake in mL?','600','mL','8 oz × 30 = 240 mL, 1 cup = 240 mL and the IV adds 120 mL: 240 + 240 + 120 = 600 mL.',DHO),
  w(CONV,'How many teaspoons are in 3 tablespoons?','9','tsp','3 tbsp × 15 mL = 45 mL, and 45 ÷ 5 mL per teaspoon = 9 tsp. One tablespoon equals 3 teaspoons.',DHO),
  w(CONV,'How many fluid ounces are in 2 cups?','16','oz','2 cups × 240 mL = 480 mL, and 480 ÷ 30 mL per ounce = 16 fluid ounces.',DHO),
  w(CONV,'A medication is due at 7:50 p.m. How is this time written in 24-hour (military) time?','1950','','For p.m. times after noon, add 12 to the hour: 7 + 12 = 19, so 7:50 p.m. is 1950. Minutes stay the same.',DHO,{accept:['19:50']}),
  w(CONV,'Using the HOSA equivalent of 15 drops per milliliter, how many drops are in 4 mL?','60','gtts','Multiply milliliters by 15 drops per mL: 4 × 15 = 60 drops. Drops are abbreviated gtts.',DHO),
  w(CONV,'Convert 0.3 L to milliliters.','300','mL','1 L = 1000 mL, so 0.3 × 1000 = 300 mL. Move the decimal three places to the right.',DHO),
  w(CONV,'A patient’s 24-hour intake is 1850 mL and output is 1600 mL. What is the fluid balance in mL?','250','mL','Balance = intake − output = 1850 − 1600 = +250 mL. A positive balance means more fluid was taken in than lost.',DHO),
  w(DOSE,'The order is 1.5 g. Tablets on hand contain 500 mg each. How many tablets should be given?','3','tablets','Convert first: 1.5 g = 1500 mg. Then 1500 mg ÷ 500 mg per tablet = 3 tablets.',CRAIG),
  w(DOSE,'The order is 0.1 mg. Tablets on hand contain 50 mcg each. How many tablets should be given?','2','tablets','Convert to the same unit: 0.1 mg = 100 mcg. Then 100 mcg ÷ 50 mcg per tablet = 2 tablets.',CRAIG),
  w(DOSE,'The order is 160 mg of a liquid labeled 100 mg per 5 mL. How many mL should be given?','8','mL','Desired ÷ have × quantity = 160 ÷ 100 × 5 mL = 1.6 × 5 = 8 mL.',CRAIG),
  w(DOSE,'An injection is labeled 250 mg/mL. The order is 400 mg. How many mL should be given?','1.6','mL','Divide the ordered dose by the concentration: 400 mg ÷ 250 mg/mL = 1.6 mL.',CRAIG),
  w(DOSE,'A child weighs 18.5 kg. The order is 8 mg/kg. How many milligrams should be given?','148','mg','Multiply the weight by the dose per kilogram: 18.5 kg × 8 mg/kg = 148 mg.',CRAIG),
  w(DOSE,'A child weighs 33 lb. The order is 50 mg/kg/day divided every 6 hours. How many milligrams are given per dose?','187','mg','33 ÷ 2.2 = 15 kg. 15 × 50 = 750 mg/day, given in 4 doses: 750 ÷ 4 = 187.5. Pediatric doses round down to 187 mg.',CRAIG),
  w(DOSE,'A drug’s safe range is 25–35 mg/kg/day. What is the maximum safe daily dose for a 12-kg child?','420','mg','Use the top of the range: 12 kg × 35 mg/kg/day = 420 mg per day. An order of 100 mg every 6 hours (400 mg/day) would be within range.',CRAIG),
  w(DOSE,'1800 mL of IV fluid is ordered over 16 hours. What is the rate in mL/hr?','113','mL/hr','Rate = volume ÷ time = 1800 mL ÷ 16 hr = 112.5, which rounds to 113 mL/hr.',CRAIG),
  w(DOSE,'500 mL is to infuse over 4 hours with a drop factor of 20 gtts/mL. What is the drip rate in drops per minute?','42','gtts/min','gtts/min = 500 × 20 ÷ 240 min = 10,000 ÷ 240 = 41.67, which rounds to 42 gtts/min.',CRAIG),
  w(DOSE,'750 mL of IV fluid is infusing at 60 mL/hr. How many hours will it take to finish?','12.5','hours','Time = volume ÷ rate = 750 ÷ 60 = 12.5 hours, which is 12 hours and 30 minutes.',CRAIG),
  w(DOSE,'A 100-mL piggyback is to infuse over 20 minutes with a drop factor of 15 gtts/mL. What is the drip rate?','75','gtts/min','gtts/min = 100 mL × 15 gtts/mL ÷ 20 min = 1500 ÷ 20 = 75 gtts/min.',CRAIG),
  w(DOSE,'25 mL of a medication is to infuse over 10 minutes by pump. What rate in mL/hr should be set?','150','mL/hr','Pumps run in mL per hour: 25 mL ÷ 10 min × 60 min = 150 mL/hr.',CRAIG),
  w(DOSE,'An insulin drip contains 100 units in 100 mL. The order is 6 units/hr. What is the rate in mL/hr?','6','mL/hr','Concentration = 100 ÷ 100 = 1 unit/mL. Rate = 6 units/hr ÷ 1 unit/mL = 6 mL/hr.',CRAIG),
  w(DOSE,'Dobutamine 250 mg in 250 mL is ordered at 10 mcg/kg/min for a 70-kg patient. What is the rate in mL/hr?','42','mL/hr','Dose = 10 × 70 = 700 mcg/min × 60 = 42,000 mcg/hr. Concentration = 250,000 mcg ÷ 250 mL = 1000 mcg/mL. 42,000 ÷ 1000 = 42 mL/hr.',RX),
  w(DOSE,'Using BSA = √(height in cm × weight in kg ÷ 3600), what is the BSA of a patient who is 160 cm tall and weighs 64 kg? Round to the nearest hundredth.','1.69','m²','160 × 64 = 10,240, and 10,240 ÷ 3600 = 2.844. The square root of 2.844 is 1.686, which rounds to 1.69 m².',RX),
  w(DOSE,'Using Fried’s rule, what is the dose for a 10-month-old infant if the adult dose is 300 mg?','20','mg','Fried’s rule: age in months ÷ 150 × adult dose = 10 ÷ 150 × 300 = 20 mg.',CRAIG),
  w(DOSE,'An infusion of 1000 mL is started at 1100 and runs at 125 mL/hr. At what time (24-hour) will it finish?','1900','','1000 mL ÷ 125 mL/hr = 8 hours. 1100 + 8 hours = 1900, which is 7:00 p.m.',CRAIG,{accept:['19:00']}),
  w(SOL,'How many grams of dextrose are in 1 L of D5W (5% dextrose in water)?','50','g','5% means 5 g per 100 mL, so 1000 mL × 5 ÷ 100 = 50 g of dextrose.',RX),
  w(SOL,'12 g of a drug is dissolved to make 400 mL of solution. What is the percent strength (w/v)?','3','%','Percent w/v is grams of drug per 100 mL of solution: 12 g ÷ 400 mL × 100 = 3%.',RX),
  w(SOL,'Chlorhexidine 0.12% oral rinse contains how many milligrams of drug per milliliter?','1.2','mg/mL','0.12% = 0.12 g per 100 mL = 120 mg ÷ 100 mL = 1.2 mg/mL. Shortcut: percent × 10 = mg/mL.',RX),
  w(SOL,'Epinephrine 1:10,000 contains how many milligrams per milliliter?','0.1','mg/mL','1:10,000 means 1 g (1000 mg) in 10,000 mL, so 1000 ÷ 10,000 = 0.1 mg/mL.',RX),
  w(SOL,'Express a 1:50 solution as a percentage.','2','%','1:50 means 1 g in 50 mL. To get grams per 100 mL: 1 ÷ 50 × 100 = 2%.',RX),
  w(SOL,'Write a 0.5% solution as a ratio strength, 1:x.','200','','0.5% = 0.5 g per 100 mL. Divide 100 by 0.5 to find the volume for 1 g: 100 ÷ 0.5 = 200, so 1:200.',RX,{prefix:'1 :'}),
  w(SOL,'How many mL of a 70% solution are needed to prepare 350 mL of a 20% solution?','100','mL','C₁V₁ = C₂V₂: 70% × V₁ = 20% × 350 mL, so V₁ = 7000 ÷ 70 = 100 mL of the 70% solution.',RX),
  w(SOL,'50 mL of an 18% solution is diluted to 6%. How many mL of water must be added?','100','mL','Final volume = 18 × 50 ÷ 6 = 150 mL. Water added = 150 − 50 = 100 mL.',RX),
  w(SOL,'How many mL of 90% alcohol are mixed with 30% alcohol to make 480 mL of 50% alcohol?','160','mL','By alligation, 90% gets 50 − 30 = 20 parts and 30% gets 90 − 50 = 40 parts (60 total). 480 × 20 ÷ 60 = 160 mL of 90%.',RX),
  w(SOL,'A sample is diluted 1:3 three times in a row. What is the final dilution, 1:x?','27','','Multiply serial dilution factors: 3 × 3 × 3 = 27, so the final dilution is 1:27.',RX,{prefix:'1 :'}),
  w(SOL,'A 1:20 dilution is made using 0.25 mL of sample. How many mL of diluent are needed?','4.75','mL','1:20 means 1 part sample in 20 total parts. Total = 0.25 × 20 = 5 mL, so diluent = 5 − 0.25 = 4.75 mL.',RX),
  w(SOL,'How many grams of drug are in a 45-g tube of 0.5% cream?','0.225','g','0.5% means 0.5 g of drug per 100 g of cream. 45 × 0.5 ÷ 100 = 0.225 g of drug in the tube.',RX),
  w(SOL,'25 mL of a 40% solution is diluted to a final volume of 200 mL. What is the new concentration?','5','%','Use C₁V₁ = C₂V₂ and solve for C₂: 40 × 25 ÷ 200 = 1000 ÷ 200 = 5%.',RX),
  w(SOL,'How many grams of drug are in 250 mL of a 1:5000 solution?','0.05','g','1:5000 means 1 g in 5000 mL. For 250 mL: 250 ÷ 5000 = 0.05 g of drug.',RX),
  w(SOL,'300 mL of a 10% solution is mixed with 200 mL of a 25% solution. What is the final concentration?','16','%','Total drug = 30 g + 50 g = 80 g in 500 mL. 80 ÷ 500 × 100 = 16%.',RX)
 ],9604)
};
