// Drawing kit for spec-driven mock labs: rooms, furniture, equipment and people in the
// flat side-view style of the dental operatory. Floor line is y=380 in a 1000×440 view.
// Each piece returns {svg, hot:[x, y, w, h]} so the engine can place its click target.

const F = 380; // floor
const box = (x, y, w, h, cls = '', rx = 2) => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const txt = (x, y, s, cls = '') => `<text class="${cls}" x="${x}" y="${y}">${s}</text>`;

// ---------- people ----------
const LOOK = {skin: '#e6bf9f', skin2: '#c99d7e', hair: '#5a4334', top: '#4f7fb0', pants: '#3e4c6c', style: 'short'};
function head(cx, cy, L, face = 'side') {
  const hair = L.style === 'bald' ? `<path class="p-hair" d="M${cx - 9} ${cy + 1} Q${cx - 10} ${cy - 5} ${cx - 6} ${cy - 7}"/>`
    : L.style === 'long' ? `<path class="p-hairf" d="M${cx - 9.5} ${cy + 12} Q${cx - 12} ${cy - 11} ${cx + 1} ${cy - 11} Q${cx + 10} ${cy - 11} ${cx + 10} ${cy - 3} Q${cx + 4} ${cy - 8} ${cx - 2} ${cy - 6} Q${cx - 5} ${cy - 2} ${cx - 4} ${cy + 12} Z"/>`
    : L.style === 'bun' ? `<path class="p-hairf" d="M${cx - 9} ${cy + 3} Q${cx - 10} ${cy - 11} ${cx + 1} ${cy - 11} Q${cx + 10} ${cy - 11} ${cx + 10} ${cy - 3} Q${cx + 4} ${cy - 8} ${cx - 2} ${cy - 6} Q${cx - 5} ${cy - 3} ${cx - 6} ${cy + 5} Z"/><circle class="p-hairf" cx="${cx - 9}" cy="${cy - 7}" r="4.2"/>`
    : `<path class="p-hairf" d="M${cx - 9} ${cy + 3} Q${cx - 10} ${cy - 11} ${cx + 1} ${cy - 11.5} Q${cx + 10.5} ${cy - 11} ${cx + 10} ${cy - 3} Q${cx + 4} ${cy - 7.5} ${cx - 2} ${cy - 6} Q${cx - 5} ${cy - 3} ${cx - 5.5} ${cy + 5} Z"/>`;
  return `<circle class="p-skin" cx="${cx}" cy="${cy}" r="9.3"/><circle class="p-skin2" cx="${cx - 4}" cy="${cy + 1}" r="2.2"/>${hair}
    <circle class="p-eye" cx="${cx + 5}" cy="${cy - 1.5}" r="1.1"/><path class="p-nose" d="M${cx + 9} ${cy - .5} l2.2 3 l-2.2 .6"/><path class="p-mouth" d="M${cx + 4} ${cy + 5.5} q2.2 1.2 4.4 0"/>
    ${L.glasses ? `<circle class="p-glass" cx="${cx + 6}" cy="${cy - 1}" r="2.6"/><path class="p-glass" d="M${cx + 3.4} ${cy - 1} L${cx - 3} ${cy - .5}"/>` : ''}`;
}
const POSES = {
  stand: L => `<ellipse class="p-shadow" cx="0" cy="380" rx="16" ry="3"/>
    <path class="p-pants" d="M-5 338 L-6 375 M4 338 L5 375"/><path class="p-shoe" d="M-12 380 v-3 q0 -3 4 -3 h4 q5 0 6 6z M0 380 v-3 q0 -3 4 -3 h4 q5 0 6 6z"/>
    <path class="p-top" d="M-12 342 Q-14 304 -7 294 Q0 290 8 294 Q14 304 12 342 Z"/>
    <rect class="p-skin" x="-3" y="282" width="6" height="12" rx="2"/>${head(1, 273, L)}
    <path class="p-arm" d="M3 297 L5 320"/><path class="p-fore" d="M5 320 L10 334"/><circle class="p-skin" cx="10.5" cy="335" r="3.2"/>`,
  sit: L => `<path class="p-pants" d="M-6 336 H18 M18 336 L20 374"/><path class="p-shoe" d="M15 380 v-3 q0 -3 4 -3 h4 q5 0 6 6z"/>
    <path class="p-top" d="M-14 340 Q-16 304 -9 294 Q-2 290 6 294 Q12 304 10 340 Z"/>
    <rect class="p-skin" x="-5" y="282" width="6" height="12" rx="2"/>${head(-1, 273, L)}
    <path class="p-arm" d="M1 298 L5 320"/><path class="p-fore" d="M5 320 L20 326"/><circle class="p-skin" cx="22" cy="326.5" r="3.2"/>`,
  edge: L => `<path class="p-pants" d="M-6 318 H16 M16 318 L18 352"/><path class="p-shoe" d="M13 358 v-3 q0 -3 4 -3 h4 q5 0 6 6z"/>
    <path class="p-top" d="M-14 322 Q-16 286 -9 276 Q-2 272 6 276 Q12 286 10 322 Z"/>
    <rect class="p-skin" x="-5" y="264" width="6" height="12" rx="2"/>${head(-1, 255, L)}
    <path class="p-arm" d="M1 280 L5 302"/><path class="p-fore" d="M5 302 L18 309"/><circle class="p-skin" cx="20" cy="309.5" r="3.2"/>`,
  lie: L => `<path class="p-top" d="M-78 313 Q-82 298 -70 296 L-40 296 L-40 313 Z"/>
    <g transform="rotate(-90 -88 300)">${head(-88, 300, L)}</g>
    <path class="p-blanket" d="M-58 314 Q-60 297 -48 295 L96 297 Q110 298 110 314 Z"/><path class="p-fold" d="M-50 297 Q-55 305 -52 313"/>
    <path class="p-arm" d="M-64 303 L-36 306"/><path class="p-fore" d="M-36 306 L-12 303"/><circle class="p-skin" cx="-9" cy="302.5" r="3.2"/>`,
  floor: L => `<ellipse class="p-shadow" cx="10" cy="380" rx="70" ry="3"/>
    <g transform="rotate(-90 -58 368)">${head(-58, 368, L)}</g>
    <path class="p-top" d="M-48 377 Q-50 359 -40 358 L12 358 Q16 362 16 377 Z"/>
    <path class="p-pants" d="M14 361 L66 362 M14 372 L66 373"/><path class="p-shoe" d="M64 356 h5 v10 h-5z M64 367 h5 v10 h-5z"/>
    <path class="p-arm" d="M-34 362 L-10 352"/><circle class="p-skin" cx="-8" cy="351" r="3.2"/>`,
  walk: L => `${POSES.stand(L)}<g class="p-walker"><path d="M18 300 H44 M20 300 L16 380 M42 300 L46 380 M18 330 H44"/><circle cx="16" cy="379" r="2.4"/><circle cx="46" cy="379" r="2.4"/></g>`,
  wheel: L => POSES.sit(L).replace(/336/g, '340'),
  dog: () => `<g class="p-dog"><path class="body" d="M-40 300 Q-42 284 -24 282 L24 282 Q40 284 40 298 L38 304 L-38 304 Z"/>
    <path class="leg" d="M-32 302 V318 M-20 302 V318 M22 302 V318 M32 302 V318"/><path class="tail" d="M-40 288 Q-54 280 -52 268"/>
    <path class="body" d="M28 284 Q32 266 44 264 Q58 262 60 272 Q62 278 54 280 L44 290 Z"/><path class="ear" d="M44 264 Q38 270 40 280 Q46 276 48 266Z"/>
    <circle class="eye" cx="52" cy="270" r="1.3"/><circle class="nose" cx="60" cy="273" r="1.8"/><path class="collar" d="M36 280 L44 291"/></g>`
};
export function person(pose, look = {}, cls = '') {
  const L = {...LOOK, ...look};
  return `<g class="kit-person ${cls}" style="--skin:${L.skin};--skin2:${L.skin2};--hair:${L.hair};--top:${L.top};--pants:${L.pants}">${POSES[pose](L)}</g>`;
}
// The patient: every pose is drawn and CSS shows the one in use.
export function patientSvg(look, poses) {
  return `<g class="kit-pt" data-s="pt">${poses.map(p => `<g class="pose pose-${p}">${person(p, look)}</g>`).join('')}<g class="kit-pt-hot"></g></g>`;
}

// The student. Scrub color comes from --scrub. Classes on [data-s=op] show PPE.
export function operatorSvg() {
  return `<g class="kit-op" data-s="op"><g class="kit-face">
    <ellipse class="p-shadow" cx="0" cy="380" rx="18" ry="3"/>
    <path class="o-pants" d="M-6 334 L-7 374 M5 334 L6 374"/>
    <path class="o-shoe" d="M-13 380 v-3 q0 -4 5 -4 h4 q6 0 7 7z M0 380 v-3 q0 -4 5 -4 h4 q6 0 7 7z"/>
    <g class="o-arm back"><path class="o-sleeve" d="M-1 296 L3 316"/><path class="o-fore" d="M3 316 L14 326"/><circle class="o-hand" cx="16" cy="327" r="3.6"/></g>
    <path class="o-top" d="M-13 340 Q-15 302 -8 292 Q0 288 8 292 Q14 302 13 340 Z"/>
    <path class="o-topv" d="M-3 291 L1 300 L5 291"/><rect class="o-badge" x="5" y="305" width="5" height="7" rx="1"/>
    <g class="o-gown"><path d="M-15 364 L-15 302 Q-13 290 0 289 Q13 290 15 302 L15 364 Q0 368 -15 364 Z"/><path class="tie" d="M-15 334 h5"/></g>
    <rect class="o-neck" x="-3.5" y="279" width="7.5" height="11" rx="2.5"/>
    <circle class="o-head" cx="1" cy="271" r="9.5"/><circle class="o-ear" cx="-3" cy="272" r="2.3"/>
    <path class="o-hair" d="M-8.5 272 Q-10 259 1 258.5 Q11 259 10.5 267 Q5 262.5 -1 264.5 Q-5 267 -5.5 275 Z"/>
    <path class="o-cap" d="M-10 270 Q-11 257 1 256 Q12 257 11 266 Q4 262 -2 263 Q-7 265 -10 270Z"/>
    <circle class="o-eye" cx="6" cy="269.5" r="1.2"/><path class="o-nose" d="M9.7 270 l2.4 3.2 l-2.4 .6"/><path class="o-mouth" d="M5 277.5 q2.2 1.2 4.4 -.2"/>
    <g class="o-mask"><path d="M2.5 272.5 Q9 271.5 11.6 275 Q11.4 281 5.5 283.5 Q2 282 1.8 277 Z"/><path class="loop" d="M2.5 273.5 L-3 271.5 M3 281 L-3 274"/></g>
    <g class="o-eyewear"><rect x="2.5" y="266" width="10" height="6" rx="2.5"/><path d="M2.5 268.5 L-4 270.5"/></g>
    <g class="o-talk"><path d="M17 262 q5 6 0 12"/><path d="M22 258 q9 10 0 20"/></g>
    <g class="o-arm"><path class="o-sleeve" d="M4 295 L8 317"/><path class="o-fore" d="M8 317 L19 327"/><circle class="o-hand" cx="21" cy="328" r="3.8"/></g>
  </g></g>`;
}

// ---------- small items for tops of carts, tables and benches (centered on x, sitting on y) ----------
const ITEMS = {
  thermo: (x, y) => `<g class="it-thermo"><path d="M${x - 7} ${y} q0 -8 6 -9 l8 -3 q3 0 3 3 l-3 9z"/><rect class="scr" x="${x - 3}" y="${y - 7}" width="5" height="3" rx="1"/></g>`,
  gauze: (x, y) => `<g class="it-white">${box(x - 7, y - 4, 14, 4, '', 1)}${box(x - 6, y - 7, 12, 3, '', 1)}</g>`,
  tape: (x, y) => `<g class="it-tape"><circle cx="${x}" cy="${y - 5}" r="5"/><circle class="hole" cx="${x}" cy="${y - 5}" r="2"/></g>`,
  scissors: (x, y) => `<g class="it-metal"><path d="M${x - 8} ${y - 2} L${x + 6} ${y - 6} M${x - 8} ${y - 6} L${x + 6} ${y - 2}"/><circle cx="${x + 8}" cy="${y - 2}" r="2"/><circle cx="${x + 8}" cy="${y - 6}" r="2"/></g>`,
  cup: (x, y) => `<path class="it-cup" d="M${x - 5} ${y - 12} h10 l-1.5 12 h-7z"/>`,
  syringe: (x, y) => `<g class="it-syr"><rect x="${x - 10}" y="${y - 4}" width="16" height="4" rx="1"/><path d="M${x + 6} ${y - 2} h7 M${x - 10} ${y - 2} h-3 M${x - 13} ${y - 4} v4"/></g>`,
  vial: (x, y) => `<g class="it-vial">${box(x - 3.5, y - 12, 7, 12, '', 1.5)}${box(x - 4, y - 14, 8, 3, 'cap', 1)}</g>`,
  bottle: (x, y, c = '#b5793b') => `<g class="it-bottle" style="--c:${c}">${box(x - 5, y - 15, 10, 15, '', 2)}${box(x - 4, y - 18, 8, 4, 'cap', 1)}${box(x - 4, y - 11, 8, 5, 'lbl', 1)}</g>`,
  tubes: (x, y) => `<g class="it-tubes">${box(x - 12, y - 5, 24, 5, 'rack', 1)}${[-8, -3, 2, 7].map((d, i) => `<rect class="t c${i}" x="${x + d}" y="${y - 17}" width="3.4" height="13" rx="1.5"/>`).join('')}</g>`,
  glove: (x, y) => `<g class="it-glovebox">${box(x - 9, y - 10, 18, 10, '', 1.5)}<path d="M${x - 3} ${y - 10} q1 -5 5 -4 q3 -2 4 1"/></g>`,
  wipes: (x, y) => `<g class="it-wipes">${box(x - 6, y - 14, 12, 14, '', 3)}<path d="M${x - 2} ${y - 14} q2 -5 4 0"/></g>`,
  meter: (x, y) => `<g class="it-meter">${box(x - 6, y - 12, 12, 12, '', 2)}${box(x - 4, y - 10, 8, 4, 'scr', 1)}</g>`,
  clipboard: (x, y) => `<g class="it-clip">${box(x - 7, y - 3, 14, 3, '', 1)}<path d="M${x - 7} ${y - 3} l3 -1 h8 l3 1"/></g>`,
  pad: (x, y) => `<g class="it-pad">${box(x - 10, y - 2, 20, 2, '', 1)}</g>`,
  basin: (x, y) => `<path class="it-basin" d="M${x - 12} ${y - 8} h24 l-3 8 h-18z"/>`,
  stetho: (x, y) => `<g class="it-stetho"><path d="M${x - 8} ${y - 10} q0 9 8 9 q8 0 8 -9"/><circle cx="${x + 9}" cy="${y - 2}" r="3"/></g>`,
  cuff: (x, y) => `<g class="it-cuff">${box(x - 10, y - 5, 20, 5, '', 2)}<circle cx="${x + 13}" cy="${y - 6}" r="5"/></g>`,
  pipette: (x, y) => `<g class="it-pip"><path d="M${x} ${y - 24} v18 l-1.4 6"/>${box(x - 2.5, y - 30, 5, 8, '', 1.5)}</g>`,
  beaker: (x, y) => `<g class="it-beaker"><path d="M${x - 7} ${y - 16} v16 h14 v-16"/><path class="liq" d="M${x - 6.4} ${y - 7} h12.8 v6.4 h-12.8z"/></g>`,
  plate: (x, y) => `<g class="it-plate"><ellipse cx="${x}" cy="${y - 2}" rx="9" ry="2.6"/><ellipse class="agar" cx="${x}" cy="${y - 3}" rx="7.5" ry="1.8"/></g>`,
  slides: (x, y) => `<g class="it-slide">${box(x - 10, y - 2, 20, 2, '', .5)}${box(x - 9, y - 4.5, 20, 2, '', .5)}</g>`,
  timer: (x, y) => `<g class="it-timer">${box(x - 6, y - 9, 12, 9, '', 2)}${box(x - 4, y - 7, 8, 3.5, 'scr', 1)}</g>`,
  tray: (x, y) => `<g class="it-tray">${box(x - 14, y - 3, 28, 3, '', 1)}<path d="M${x - 10} ${y - 5} h7 M${x} ${y - 5} h9"/></g>`,
  bag: (x, y) => `<g class="it-bag"><path d="M${x - 8} ${y} v-12 q0 -3 3 -3 h10 q3 0 3 3 v12z"/><path class="strap" d="M${x - 4} ${y - 15} q4 -6 8 0"/></g>`,
  phone: (x, y) => `<g class="it-phone">${box(x - 9, y - 5, 18, 5, '', 2)}<path d="M${x - 8} ${y - 8} q8 -5 16 0"/></g>`
};
export const item = (name, x, y, c) => ITEMS[name](x, y, c);
const items = (list = [], x0, x1, y) => { const n = list.length; return list.map((nm, i) => item(nm, x0 + (x1 - x0) * (n === 1 ? .5 : i / (n - 1)), y)).join(''); };

// ---------- pieces ----------
export const PIECES = {
  sink: x => ({svg: `<g class="k-sink">${box(x - 65, 320, 130, 52, 'cab', 0)}<path class="door" d="M${x - 22} 324 V368 M${x + 22} 324 V368"/>${box(x - 69, 313, 138, 8, 'top')}
    <path class="basin" d="M${x - 40} 314 h56 q-3 10 -12 11 h-32 q-9 -1 -12 -11z"/><path class="faucet" d="M${x - 2} 314 v-18 q0 -7 -7 -7 h-9 v5"/>
    <g class="soap">${box(x + 26, 298, 11, 15, '', 3)}<path d="M${x + 31.5} 298 v-5 h5"/></g>
    <g class="towel">${box(x + 18, 232, 34, 40, '', 3)}<path d="M${x + 24} 272 v8 h22 v-8"/></g>
    <g class="rub">${box(x - 60, 246, 16, 24, '', 3)}<path d="M${x - 52} 270 v4"/>${txt(x - 52, 260, 'RUB', 'tiny')}</g></g>`, hot: [x - 69, 228, 138, 98]}),
  gloverack: x => ({svg: `<g class="k-glovebox">${box(x - 30, 214, 60, 40, 'frame', 3)}${[['S', '#8a6fd6'], ['M', '#6f9fe0'], ['L', '#5fb3a5']].map(([s, c], i) => `<g style="--c:${c}">${box(x - 27 + i * 19, 220, 16, 30, 'b', 1.5)}${txt(x - 19 + i * 19, 240, s, 'tiny w')}</g>`).join('')}</g>`, hot: [x - 32, 210, 64, 48]}),
  ppe: x => ({svg: `<g class="k-ppe">${box(x - 49, 150, 98, 124, 'panel', 4)}${txt(x, 166, 'PPE', 'lbl')}${box(x - 49, 198, 98, 4, 'shelf')}${box(x - 49, 240, 98, 4, 'shelf')}
    <g class="gowns">${box(x - 43, 186, 36, 5)}${box(x - 42, 181, 34, 5)}${box(x - 43, 176, 36, 5)}</g>
    <path class="goggles" d="M${x + 3} 190 q0 -6 9 -6 h12 q9 0 9 6 q0 6 -9 6 q-6 0 -6 -3 q0 3 -6 3 q-9 0 -9 -6z"/>
    <g class="maskbox">${box(x - 44, 220, 26, 20)}${txt(x - 31, 234, 'MASK', 'tiny w')}</g><g class="glovebox">${box(x - 13, 221, 26, 19)}${txt(x, 234, 'GLOVE', 'tiny w')}</g>
    <g class="capbox">${box(x + 17, 221, 26, 19)}${txt(x + 30, 234, 'CAP', 'tiny w')}</g></g>`, hot: [x - 52, 146, 104, 132]}),
  cart: (x, o = {}) => ({svg: `<g class="k-cart">${box(x - 35, 296, 70, 6, 'tray')}${box(x - 29, 304, 58, 62, 'body', 3)}<path class="drw" d="M${x - 29} 322 H${x + 29} M${x - 29} 340 H${x + 29}"/>
    ${[311, 329, 350].map(y => box(x - 7, y, 14, 3, 'h', 1)).join('')}<circle class="wheel" cx="${x - 23}" cy="372" r="4"/><circle class="wheel" cx="${x + 23}" cy="372" r="4"/>
    <g class="k-items">${items(o.items, x - 26, x + 26, 296)}</g>${o.label ? txt(x, 336, o.label, 'tiny') : ''}</g>`, hot: [x - 40, 262, 80, 118]}),
  table: (x, o = {}) => ({svg: `<g class="k-table">${box(x - 36, 296, 72, 6, 'top')}<path class="post" d="M${x + 24} 302 V374"/>${box(x + 6, 372, 36, 6, 'foot', 2)}
    <g class="k-items">${items(o.items, x - 28, x + 28, 296)}</g></g>`, hot: [x - 40, 268, 84, 112]}),
  bed: (x, o = {}) => ({svg: `<g class="k-bed">${o.headwall ? `<g class="headwall">${box(x - 150, 150, 70, 46, 'panel', 3)}<g class="flow"><circle cx="${x - 132}" cy="172" r="9"/><path d="M${x - 132} 181 v10"/>${box(x - 135, 158, 6, 12, 'tube', 2)}</g>${box(x - 112, 160, 22, 26, 'suct', 3)}${txt(x - 132, 206, 'O₂', 'tiny')}</g>` : ''}
    ${box(x - 124, 262, 10, 108, 'board', 3)}${box(x + 112, 286, 9, 84, 'board', 3)}
    ${box(x - 118, 318, 236, 12, 'frame', 3)}<path class="leg" d="M${x - 100} 330 V372 M${x + 100} 330 V372"/><circle class="wheel" cx="${x - 100}" cy="374" r="5"/><circle class="wheel" cx="${x + 100}" cy="374" r="5"/>
    ${box(x - 116, 304, 232, 16, 'mattress', 5)}<path class="pillow" d="M${x - 114} 306 q0 -10 10 -10 h22 q8 0 8 9z"/>
    </g>`, front: `<g class="k-rail">${box(x - 78, 298, 70, 13, 'railbar', 4)}<path d="M${x - 70} 301 v7 M${x - 56} 301 v7 M${x - 42} 301 v7 M${x - 28} 301 v7"/></g>`, hot: [x - 124, 258, 248, 120]}),
  homebed: x => ({svg: `<g class="k-homebed"><path class="board" d="M${x - 124} 372 V262 Q${x - 124} 248 ${x - 110} 248 H${x - 104} Q${x - 96} 248 ${x - 96} 262 V372z"/>${box(x + 106, 290, 12, 82, 'board', 3)}
    ${box(x - 112, 318, 222, 14, 'frame', 2)}<path class="leg" d="M${x - 104} 332 V374 M${x + 104} 332 V374"/>
    ${box(x - 110, 304, 218, 16, 'mattress', 5)}<path class="pillow" d="M${x - 108} 306 q0 -10 10 -10 h22 q8 0 8 9z"/></g>`, hot: [x - 126, 246, 248, 132]}),
  chair: x => ({svg: `<g class="k-chair"><path class="back" d="M${x - 30} 340 V286 Q${x - 30} 276 ${x - 20} 276 h4 Q${x - 8} 276 ${x - 8} 286 V340z"/>${box(x - 30, 336, 62, 12, 'seat', 4)}
    ${box(x + 18, 318, 14, 6, 'arm', 3)}<path class="leg" d="M${x - 26} 348 V378 M${x + 28} 348 V378"/></g>`, hot: [x - 34, 268, 70, 112]}),
  wheelchair: x => ({svg: `<g class="k-wc"><circle class="caster" cx="${x + 28}" cy="374" r="5"/>
    <path class="frame" d="M${x - 30} 282 V340 H${x + 24} L${x + 28} 370 M${x - 30} 282 h-6 M${x + 22} 340 l10 18 h6"/>${box(x - 30, 336, 54, 7, 'seat', 3)}${box(x - 32, 286, 6, 50, 'back', 2)}</g>`,
    front: `<g class="k-wc"><circle class="wheel" cx="${x - 6}" cy="352" r="26"/><circle class="hub" cx="${x - 6}" cy="352" r="3"/>${box(x - 4, 318, 30, 5, 'arm', 2)}<g class="brake">${box(x + 14, 344, 8, 5, '', 1)}</g></g>`, hot: [x - 38, 274, 76, 106]}),
  exam: x => ({svg: `<g class="k-exam">${box(x - 86, 318, 172, 14, 'pad', 5)}<path class="paper" d="M${x - 84} 318 H${x + 84}"/>${box(x - 76, 332, 152, 40, 'base', 3)}
    <path class="drw" d="M${x - 76} 350 H${x + 76} M${x} 332 V372"/>${box(x + 76, 352, 22, 8, 'step', 2)}<path class="headup" d="M${x - 86} 318 L${x - 98} 292 Q${x - 100} 286 ${x - 92} 286 L${x - 66} 316z"/></g>`, hot: [x - 100, 282, 200, 98]}),
  desk: (x, o = {}) => ({svg: `<g class="k-desk">${box(x - 36, 316, 72, 6, 'top')}${box(x - 30, 322, 60, 26, 'cubby')}<path class="leg" d="M${x - 26} 348 V380 M${x + 26} 348 V380"/>
    ${box(x - 3, 296, 6, 20, 'stand')}${box(x - 26, 258, 52, 38, 'mon', 3)}${box(x - 22, 262, 44, 28, 'scr', 1.5)}<path class="chart" d="M${x - 18} 268 h20 M${x - 18} 273 h32 M${x - 18} 278 h26 M${x - 18} 283 h14"/>${box(x - 20, 310, 34, 5, 'kb', 1.5)}
    ${o.label ? txt(x, 340, o.label, 'tiny') : ''}</g>`, hot: [x - 40, 252, 80, 128]}),
  bins: x => ({svg: `<g class="k-bins"><g class="trash"><path d="M${x - 37} 380 l-2 -30 h28 l-2 30z"/>${box(x - 41, 345, 32, 6)}<path class="lines" d="M${x - 32} 356 v18 M${x - 25} 356 v18 M${x - 18} 356 v18"/></g>
    <g class="bio"><path d="M${x + 3} 380 l-2 -30 h28 l-2 30z"/>${box(x - 1, 345, 32, 6)}<g class="sym"><circle cx="${x + 15}" cy="364" r="3"/><circle cx="${x + 15}" cy="358" r="3.2"/><circle cx="${x + 10}" cy="367" r="3.2"/><circle cx="${x + 20}" cy="367" r="3.2"/></g></g></g>`, hot: [x - 44, 340, 80, 42]}),
  sharps: x => ({svg: `<g class="k-sharps">${box(x - 14, 226, 28, 34, 'body', 3)}${box(x - 14, 222, 28, 7, 'lid', 2)}<path class="slot" d="M${x - 7} 225 h14"/>${txt(x, 246, 'SHARPS', 'tiny w')}</g>`, hot: [x - 18, 216, 36, 48]}),
  door: x => ({svg: `<g class="k-door">${box(x - 43, 226, 86, 154, 'hall', 0)}<path class="hline" d="M${x - 43} 300 H${x + 43}"/>${box(x - 49, 220, 98, 8, 'frame')}${box(x - 49, 220, 7, 160, 'frame')}${box(x + 42, 220, 7, 160, 'frame')}</g>`, hot: [x - 49, 220, 98, 160]}),
  bench: (x, o = {}) => { const w = o.w || 220, a = x - w / 2; return {svg: `<g class="k-bench">${box(a, 320, w, 52, 'cab', 0)}<path class="door" d="${Array.from({length: Math.floor(w / 55)}, (_, i) => `M${a + 55 * (i + 1)} 324 V368`).join(' ')}"/>${box(a - 4, 312, w + 8, 9, 'top')}
    ${box(a + 6, 200, w - 12, 5, 'shelf')}<path class="brk" d="M${a + 16} 205 v8 M${a + w - 16} 205 v8"/><g class="k-items">${items(o.shelf, a + 18, a + w - 18, 200)}</g>
    <g class="k-items">${(o.items || []).map((nm, i, l) => LAB[nm] ? LAB[nm](a + 26 + (w - 52) * (l.length === 1 ? .5 : i / (l.length - 1)), 312) : item(nm, a + 26 + (w - 52) * (l.length === 1 ? .5 : i / (l.length - 1)), 312)).join('')}</g></g>`, hot: [a - 4, o.tall ? 230 : 262, w + 8, o.tall ? 150 : 118]}; },
  shelves: (x, o = {}) => { const w = o.w || 160, a = x - w / 2, cols = ['#b5793b', '#3f7fbf', '#d9d4c7', '#6aa36a', '#c0504d', '#8a6fd6', '#e0b84a']; let k = 0;
    return {svg: `<g class="k-shelves">${box(a, 110, w, 262, 'frame', 3)}${[150, 196, 242, 288, 334].map(y => box(a + 4, y, w - 8, 4, 'shelf')).join('')}
      ${[150, 196, 242, 288, 334].map(y => Array.from({length: Math.floor((w - 16) / 15)}, (_, i) => item('bottle', a + 14 + i * 15, y, cols[(k++ * 3) % cols.length])).join('')).join('')}</g>`, hot: [a, 106, w, 270]}; },
  rxcounter: (x, o = {}) => ({svg: `<g class="k-rx">${box(x - 90, 322, 180, 50, 'cab', 0)}${box(x - 94, 313, 188, 10, 'top')}<path class="door" d="M${x - 30} 326 V368 M${x + 30} 326 V368"/>
    <g class="ctray"><path d="M${x - 20} 313 l4 -8 h32 l4 8z"/><path class="spat" d="M${x + 22} 304 l22 -6"/></g><g class="k-items">${items(o.items, x - 80, x - 34, 313)}</g></g>`, hot: [x - 96, 280, 192, 100]}),
  vettable: x => ({svg: `<g class="k-vt">${box(x - 80, 318, 160, 7, 'top', 2)}<path class="post" d="M${x} 325 V372"/>${box(x - 34, 370, 68, 8, 'foot', 3)}</g>`, hot: [x - 84, 252, 168, 128]}),
  mat: x => ({svg: `<g class="k-mat"><path d="M${x - 92} 380 l10 -8 h170 l10 8z"/></g>`, hot: [x - 92, 340, 184, 42]}),
  lectern: x => ({svg: `<g class="k-lectern"><path class="body" d="M${x - 22} 380 L${x - 18} 316 H${x + 18} L${x + 22} 380z"/><path class="top" d="M${x - 26} 316 L${x - 22} 304 H${x + 22} L${x + 26} 316z"/><g class="gavel"><path d="M${x + 4} 303 l10 -4"/>${box(x + 12, 296, 9, 5, '', 1.5)}</g></g>`, hot: [x - 30, 290, 60, 90]}),
  headtable: (x, o = {}) => ({svg: `<g class="k-htable">${box(x - (o.w || 120) / 2, 322, o.w || 120, 7, 'top', 2)}${box(x - (o.w || 120) / 2 + 4, 329, (o.w || 120) - 8, 44, 'skirt', 2)}<g class="k-items">${items(o.items, x - (o.w || 120) / 2 + 14, x + (o.w || 120) / 2 - 14, 322)}</g></g>`, hot: [x - (o.w || 120) / 2, 290, o.w || 120, 90]}),
  ortable: x => ({svg: `<g class="k-or">${box(x - 100, 306, 200, 10, 'pad', 4)}<path class="drape" d="M${x - 104} 300 h208 v26 l-12 18 h-184 l-12 -18z"/><circle class="head" cx="${x - 86}" cy="296" r="9"/>${box(x - 8, 316, 16, 52, 'col')}${box(x - 40, 368, 80, 8, 'foot', 3)}</g>`, hot: [x - 106, 280, 212, 100]}),
  mayo: (x, o = {}) => ({svg: `<g class="k-mayo">${box(x - 34, 284, 68, 6, 'tray', 2)}<path class="drape" d="M${x - 36} 282 h72 v18 h-72z"/><path class="post" d="M${x - 28} 300 V372 M${x - 46} 376 H${x + 6}"/><g class="k-items">${items(o.items, x - 26, x + 26, 282)}</g></g>`, hot: [x - 40, 262, 80, 118]}),
  backtable: (x, o = {}) => ({svg: `<g class="k-back">${box(x - 70, 312, 140, 6, 'top', 2)}<path class="drape" d="M${x - 72} 310 h144 v40 h-144z"/><path class="leg" d="M${x - 64} 350 V376 M${x + 64} 350 V376"/><g class="k-items">${items(o.items, x - 58, x + 58, 310)}</g></g>`, hot: [x - 74, 276, 148, 104]}),
  scrubsink: x => ({svg: `<g class="k-scrub">${box(x - 60, 290, 120, 40, 'tub', 6)}${box(x - 54, 330, 108, 42, 'cab', 2)}<path class="faucet" d="M${x - 20} 290 v-30 q0 -8 8 -8 h4 M${x + 20} 290 v-30 q0 -8 8 -8 h4"/>${box(x - 8, 368, 16, 8, 'pedal', 2)}
    <g class="brushes">${box(x + 38, 236, 20, 30, '', 3)}${txt(x + 48, 254, 'SCRUB', 'tiny w')}</g></g>`, hot: [x - 62, 230, 124, 150]}),
  walker: x => ({svg: `<g class="k-walker"><path d="M${x - 14} 300 H${x + 14} M${x - 12} 300 L${x - 16} 380 M${x + 12} 300 L${x + 16} 380 M${x - 14} 332 H${x + 14}"/></g>`, hot: [x - 20, 292, 40, 90]}),
  bars: x => ({svg: `<g class="k-bars"><path d="M${x - 90} 312 H${x + 90} M${x - 84} 312 V380 M${x + 84} 312 V380 M${x} 312 V380"/></g>`, hot: [x - 92, 300, 184, 80]}),
  rubble: x => ({svg: `<g class="k-rubble"><path d="M${x - 70} 380 l14 -26 l20 6 l12 -22 l26 10 l18 -8 l20 40z"/><path class="beam" d="M${x - 40} 360 L${x + 50} 330"/></g>`, hot: [x - 72, 326, 144, 54]}),
  jumpbag: x => ({svg: `<g class="k-jump"><path d="M${x - 24} 380 v-24 q0 -6 6 -6 h36 q6 0 6 6 v24z"/><path class="strap" d="M${x - 10} 350 q10 -12 20 0"/><path class="cross" d="M${x - 4} 365 h8 M${x} 361 v8"/></g>`, hot: [x - 28, 340, 56, 42]}),
  monitor: x => ({svg: `<g class="k-mon"><path class="pole" d="M${x} 230 V372 M${x - 18} 376 H${x + 18}"/>${box(x - 24, 206, 48, 34, 'case', 4)}${box(x - 20, 210, 40, 22, 'scr', 2)}<path class="wave" d="M${x - 18} 222 h8 l3 -7 l3 12 l3 -5 h19"/></g>`, hot: [x - 28, 200, 56, 180]}),
  eyechart: x => ({svg: `<g class="k-eye">${box(x - 28, 150, 56, 84, 'paper', 2)}${['E', 'F P', 'T O Z', 'L P E D', 'P E C F D'].map((r, i) => txt(x, 168 + i * 13, r, 'row r' + i)).join('')}<path class="line" d="M${x - 22} 230 h44"/></g>`, hot: [x - 32, 146, 64, 92]}),
  scale: x => ({svg: `<g class="k-scale">${box(x - 20, 370, 40, 8, 'base', 2)}<path class="post" d="M${x + 14} 370 V250"/>${box(x + 4, 246, 22, 10, 'beam', 2)}</g>`, hot: [x - 24, 240, 54, 140]}),
  victim: (x, o = {}) => ({svg: `<g class="k-victim">${person(o.pose || 'floor', o.look || {})}${o.tag ? `<g class="tagbox"></g>` : ''}</g>`.replace('<g class="kit-person', `<g transform="translate(${x} 0)" class="kit-person`), hot: o.pose === 'stand' ? [x - 18, 256, 36, 126] : o.pose === 'sit' ? [x - 18, 260, 44, 120] : [x - 66, 340, 140, 42]}),
  members: (x, o = {}) => { const n = o.n || 4, gap = o.gap || 40, cols = ['#7a5c9e', '#3f7fbf', '#c0504d', '#6aa36a', '#d08a3c', '#2f8f8a'], hair = ['#2a1d14', '#7a5232', '#d9b26b', '#111', '#5a4334'];
    return {svg: `<g class="k-members">${Array.from({length: n}, (_, i) => `<g transform="translate(${x - (n - 1) * gap / 2 + i * gap} 0) scale(${o.face || -1} 1)">${PIECES.chair(0).svg}${person('sit', {top: cols[i % cols.length], hair: hair[i % hair.length], style: i % 2 ? 'long' : 'short', skin: ['#e6bf9f', '#c99a7a', '#8d5a3b', '#f1d0b5'][i % 4]})}</g>`).join('')}</g>`, hot: [x - (n - 1) * gap / 2 - 34, 262, (n - 1) * gap + 68, 118]}; }
};

// Lab-bench equipment drawn on a bench top at y.
const LAB = {
  microscope: (x, y) => `<g class="lb-micro"><path class="arm" d="M${x + 6} ${y - 6} q8 -20 -2 -40"/>${box(x - 12, y - 6, 26, 6, 'base', 2)}${box(x - 6, y - 52, 9, 22, 'tube', 2)}<path class="eyep" d="M${x - 4} ${y - 52} l-4 -8"/>${box(x - 12, y - 24, 22, 3, 'stage', 1)}<circle class="knob" cx="${x + 8}" cy="${y - 16}" r="3.5"/></g>`,
  centrifuge: (x, y) => `<g class="lb-cent"><path d="M${x - 18} ${y} v-18 q0 -8 8 -8 h20 q8 0 8 8 v18z"/><path class="lid" d="M${x - 16} ${y - 26} q16 -8 32 0"/>${box(x - 8, y - 10, 16, 4, 'scr', 1)}</g>`,
  gelbox: (x, y) => `<g class="lb-gel">${box(x - 26, y - 14, 52, 14, 'tank', 3)}${box(x - 18, y - 11, 36, 6, 'gel', 1)}<path class="wells" d="M${x - 14} ${y - 11} v2 M${x - 8} ${y - 11} v2 M${x - 2} ${y - 11} v2 M${x + 4} ${y - 11} v2 M${x + 10} ${y - 11} v2"/><circle class="neg" cx="${x - 22}" cy="${y - 16}" r="2.4"/><circle class="pos" cx="${x + 22}" cy="${y - 16}" r="2.4"/></g>`,
  power: (x, y) => `<g class="lb-power">${box(x - 16, y - 20, 32, 20, 'case', 3)}${box(x - 11, y - 16, 16, 7, 'scr', 1)}<circle class="neg" cx="${x + 9}" cy="${y - 6}" r="2.4"/><circle class="pos" cx="${x - 2}" cy="${y - 6}" r="2.4"/></g>`,
  bath: (x, y) => `<g class="lb-bath">${box(x - 22, y - 18, 44, 18, 'case', 3)}<path class="water" d="M${x - 18} ${y - 14} h36"/>${box(x - 6, y - 10, 12, 5, 'scr', 1)}</g>`,
  rack: (x, y) => item('tubes', x, y),
  pipette: (x, y) => `<g class="lb-pips">${item('pipette', x - 6, y)}${item('pipette', x, y)}${item('pipette', x + 6, y)}${box(x - 10, y - 4, 20, 4, 'stand', 1)}</g>`,
  tips: (x, y) => `<g class="lb-tips">${box(x - 12, y - 10, 24, 10, '', 2)}<path d="M${x - 9} ${y - 10} v-3 M${x - 4} ${y - 10} v-3 M${x + 1} ${y - 10} v-3 M${x + 6} ${y - 10} v-3"/></g>`,
  beaker: (x, y) => item('beaker', x, y), plates: (x, y) => `${item('plate', x, y)}${item('plate', x, y - 3)}${item('plate', x, y - 6)}`,
  slides: (x, y) => item('slides', x, y), timer: (x, y) => item('timer', x, y), vial: (x, y) => item('vial', x, y), gloves: (x, y) => item('glove', x, y),
  bottle: (x, y) => item('bottle', x, y, '#3f7fbf'), stain: (x, y) => `${item('bottle', x - 7, y, '#7a3fbf')}${item('bottle', x + 7, y, '#c0504d')}`,
  loop: (x, y) => `<g class="lb-loop"><path d="M${x - 10} ${y - 3} L${x + 10} ${y - 8}"/><circle cx="${x + 12}" cy="${y - 9}" r="2"/></g>`,
  burner: (x, y) => `<g class="lb-burner">${box(x - 8, y - 6, 16, 6, '', 2)}${box(x - 3, y - 20, 6, 14, 'tube', 1)}<path class="flame" d="M${x} ${y - 32} q5 6 0 12 q-5 -6 0 -12z"/></g>`,
  ice: (x, y) => `<g class="lb-ice"><path d="M${x - 14} ${y} l-2 -14 h32 l-2 14z"/><path class="cube" d="M${x - 9} ${y - 14} h5 v-4 h-5z M${x + 1} ${y - 14} h5 v-5 h-5z"/></g>`,
  waste: (x, y) => `<g class="lb-waste"><path d="M${x - 9} ${y} l-1 -16 h20 l-1 16z"/><g class="sym"><circle cx="${x}" cy="${y - 8}" r="2.4"/></g></g>`,
  urine: (x, y) => `<g class="lb-urine"><path d="M${x - 7} ${y - 18} v18 h14 v-18"/><path class="liq" d="M${x - 6.4} ${y - 11} h12.8 v10.4 h-12.8z"/>${box(x - 8, y - 21, 16, 3, 'cap', 1)}</g>`,
  strips: (x, y) => `<g class="lb-strips">${box(x - 6, y - 16, 12, 16, '', 3)}${box(x - 7, y - 19, 14, 4, 'cap', 1.5)}<path class="band" d="M${x - 6} ${y - 9} h12"/></g>`,
  tape: (x, y) => item('tape', x, y), scissors: (x, y) => item('scissors', x, y), gauze: (x, y) => item('gauze', x, y), wipes: (x, y) => item('wipes', x, y), cup: (x, y) => item('cup', x, y)
};
export const LAB_ITEMS = Object.keys(LAB);

// ---------- room ----------
export const DECO = {
  window: x => `<g class="d-window">${box(x - 46, 80, 92, 86, 'frame', 3)}${box(x - 40, 86, 80, 74, 'sky', 1)}<path class="mull" d="M${x} 86 V160 M${x - 40} 123 H${x + 40}"/>${box(x - 50, 166, 100, 6, 'sill', 2)}</g>`,
  clock: x => `<g class="d-clock"><circle cx="${x}" cy="84" r="16"/><path d="M${x} 84 v-10 M${x} 84 l7 4"/></g>`,
  poster: (x, lines = []) => `<g class="d-poster">${box(x - 42, 82, 84, 66, '', 4)}${lines.map((l, i) => txt(x, 102 + i * 13, l, i ? 'p' : 'h')).join('')}</g>`,
  board: (x, title = '', lines = []) => `<g class="d-board">${box(x - 80, 70, 160, 104, 'frame', 4)}${box(x - 74, 76, 148, 92, 'face', 2)}${txt(x, 94, title, 'h')}${lines.map((l, i) => txt(x - 66, 112 + i * 13, l, 'p')).join('')}</g>`,
  frame: x => `<g class="d-frame">${box(x - 26, 100, 52, 40, 'f', 2)}${box(x - 21, 105, 42, 30, 'pic', 1)}<path class="hill" d="M${x - 21} 135 l14 -14 l10 8 l8 -6 l10 12z"/></g>`,
  plant: x => `<g class="d-plant"><path class="pot" d="M${x - 12} 380 l-3 -22 h30 l-3 22z"/><path class="leaf" d="M${x} 358 q-18 -20 -6 -40 q6 18 6 40 q2 -26 16 -34 q-2 22 -16 34"/></g>`,
  upper: (x, w = 150) => `<g class="d-upper">${box(x - w / 2, 152, w, 66, '', 3)}<path d="M${x} 152 v66"/>${box(x - 9, 196, 3, 12, 'h', 1)}${box(x + 6, 196, 3, 12, 'h', 1)}</g>`,
  curtain: x => `<g class="d-curtain"><path class="track" d="M${x - 70} 40 H${x + 70}"/><path class="open" d="M${x + 40} 42 h26 v300 q-6 6 -13 0 q-7 6 -13 0z"/><path class="shut" d="M${x - 66} 42 h132 v300 q-11 6 -22 0 q-11 6 -22 0 q-11 6 -22 0 q-11 6 -22 0 q-11 6 -22 0 q-11 6 -22 0z"/></g>`,
  orlight: x => `<g class="d-orlight"><path class="arm" d="M${x} 14 V44 L${x + 30} 70"/><ellipse class="head" cx="${x + 34}" cy="78" rx="28" ry="10"/><ellipse class="lens" cx="${x + 34}" cy="82" rx="20" ry="5"/></g>`,
  tree: x => `<g class="d-tree"><path class="trunk" d="M${x - 5} 380 V250 h10 V380z"/><circle class="leaf" cx="${x}" cy="226" r="40"/><circle class="leaf" cx="${x - 30}" cy="252" r="26"/><circle class="leaf" cx="${x + 30}" cy="250" r="28"/></g>`,
  building: (x, w = 200) => `<g class="d-bldg">${box(x - w / 2, 120, w, 260, 'wall', 0)}${Array.from({length: Math.floor(w / 50)}, (_, i) => box(x - w / 2 + 14 + i * 50, 150, 28, 36, 'win', 1) + box(x - w / 2 + 14 + i * 50, 220, 28, 36, 'win', 1)).join('')}<path class="crack" d="M${x - 20} 120 l10 40 l-14 30 l12 40"/></g>`,
  cone: x => `<g class="d-cone"><path d="M${x - 10} 380 l10 -30 l10 30z"/><path class="band" d="M${x - 6} 368 h12"/></g>`,
  flag: x => `<g class="d-flag"><path class="pole" d="M${x} 380 V90"/><path class="cloth" d="M${x} 94 h46 v30 h-46z"/><circle class="top" cx="${x}" cy="88" r="4"/></g>`,
  banner: (x, s = 'HOSA') => `<g class="d-banner">${box(x - 70, 40, 140, 30, '', 3)}${txt(x, 60, s, 'h')}</g>`,
  stool: x => `<g class="d-stool"><ellipse class="seat" cx="${x}" cy="344" rx="14" ry="4.5"/><path class="post" d="M${x} 348 V372 M${x - 14} 377 L${x} 372 L${x + 14} 377"/></g>`,
  rack: x => `<g class="d-rack"><path d="M${x} 380 V250 M${x - 16} 380 h32 M${x - 14} 254 h28"/>${box(x - 13, 256, 26, 34, 'cloth', 4)}</g>`
};
export function roomSvg(room) {
  if (room === 'outdoor') {
    return `<defs><linearGradient id="kit-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sky1"/><stop offset="1" class="sky2"/></linearGradient></defs>
      <rect class="r-sky" y="-1200" width="1000" height="1500" fill="url(#kit-sky)"/><path class="r-hills" d="M0 300 Q120 250 260 290 T560 282 T1000 288 V320 H0z"/>
      <rect class="r-ground" y="310" width="1000" height="1500"/><rect class="r-road" y="372" width="1000" height="1430"/><path class="r-roadline" d="M0 410 H1000"/>`;
  }
  const tiles = Array.from({length: 22}, (_, i) => `M${i * 48 - 10} 380 V1800`).join(' ');
  const rows = [404, 436, 476, 524, 580, 644, 716, 796, 884, 980, 1084, 1196, 1316, 1444, 1580, 1724].map(y => `M0 ${y} H1000`).join(' ');
  return `<rect class="r-ceil" y="-1200" width="1000" height="1214"/><rect class="r-crown" y="12" width="1000" height="5"/>
    <rect class="r-wall" y="17" width="1000" height="363"/><rect class="r-wall2" y="300" width="1000" height="74"/><path class="r-rail" d="M0 300 H1000"/>
    <rect class="r-floor" y="380" width="1000" height="1420"/><path class="r-tile" d="${room === 'home' || room === 'meeting' ? rows : tiles + ' ' + rows}"/><rect class="r-base" y="372" width="1000" height="8"/>`;
}
