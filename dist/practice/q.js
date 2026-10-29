// Builds one practice question. The correct option is placed at `letter` (A–D) so each test
// can spread its answer key evenly; the three wrong options keep their order around it.
export const q = (topic, prompt, correct, wrong, letter, explain, ref) => {
  const at = 'ABCD'.indexOf(letter);
  if (at < 0 || wrong.length !== 3) throw new Error('Bad practice question: ' + prompt);
  return {topic, prompt, options:[...wrong.slice(0, at), correct, ...wrong.slice(at)], answer:at, explain, ref};
};

// Builds one write-in question, like the Medical Math test: the student types a number and the
// unit (and an optional prefix such as "1 :") is shown beside the box. `accept` lists other
// spellings that count as correct, such as "13:45" for 1345.
export const w = (topic, prompt, answer, unit, explain, ref, {prefix = '', accept = []} = {}) =>
  ({topic, prompt, input:'number', answer:String(answer), unit, prefix, accept, explain, ref});

// Questions are written grouped by topic; mix() interleaves them in a fixed order (same seed,
// same order every time), so saved answers always line up with the same questions.
export const mix = (questions, seed = 7) => {
  const list = questions.slice();
  let s = seed >>> 0;
  const rand = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list;
};
