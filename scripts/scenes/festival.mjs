/* festival
 *
 * The rooftops of a mohalla on a festival day, lit by the hour.
 *   subah  pigeons on the parapet, the first two kites up
 *   din    Sankranti: a sky full of patangs, three flyers on three roofs,
 *          one kite cut loose and drifting away with its string trailing
 *   shaam  the last kites, the diyas lit, string lights coming on
 *   raat   Diwali: fireworks, rockets, diyas flickering along every parapet,
 *          an akash kandil swaying on its bamboo, a rangoli on our roof
 */
import { P, r2, rng, mix, Grid, cellRects, PX, GW, GH, SW, SH, skyBands, stars, birds, glowDef } from '../lib.mjs';

const NEAR = 58;

const PAL = {
  dawn: {
    sky: ['#8fb2e2', '#b3b7dd', '#d6bad3', '#efc0c0', '#f9cfae', '#fde1b8'],
    houses: ['#f2b8a8', '#b8cce8', '#f6dc96', '#c4e0b8', '#e4c0e0', '#ffd0b0', '#a8dcd4'], shade: 0.1,
    kites: 2, pigeons: true, diyas: false, lights: false, fireworks: false, lit: 0.15,
    roof: '#c9b8b0', roofDark: '#a8968e', parapet: '#e8d8cc', ink: '#2a2350', sub: '#4a3d73', caption: '#3a3050', birds: '#5a5070',
  },
  day: {
    sky: ['#3ea6ec', '#52b0ef', '#69bbf1', '#82c7f3', '#9cd2f5', '#b8def7'],
    houses: ['#ffb4a2', '#9fc8f0', '#ffd96a', '#a8e0a0', '#e8b0e8', '#ffc690', '#7fd8cc'], shade: 0,
    kites: 9, pigeons: false, diyas: false, lights: false, fireworks: false, lit: 0, cut: true,
    roof: '#d8cfc8', roofDark: '#b8aca4', parapet: '#f4ece4', ink: '#0e2a47', sub: '#1d4a70', caption: '#2a2a3a', birds: '#2b4a66',
  },
  dusk: {
    sky: ['#4f62b8', '#7c66b0', '#b56e9e', '#e5807f', '#f9a068', '#fec784'],
    houses: ['#e09a8e', '#8ea8cc', '#e8bc66', '#94bc88', '#c49ac4', '#eaa880', '#74b4ac'], shade: 0.18,
    kites: 3, pigeons: false, diyas: true, lights: true, fireworks: false, lit: 0.5,
    roof: '#a8908c', roofDark: '#8a7472', parapet: '#d2bcb2', ink: '#2b1c48', sub: '#4d2f5e', caption: '#fff4e6', shadow: '#3a2a3a', birds: '#3d2a48',
  },
  night: {
    sky: ['#120f2e', '#18143a', '#1e1946', '#251e52', '#2c245e', '#342a6a'],
    houses: ['#5a3e52', '#3e4a6e', '#5e5038', '#3c5444', '#56405e', '#634a44', '#355454'], shade: 0.15,
    kites: 0, pigeons: false, diyas: true, lights: true, fireworks: true, lit: 0.8, stars: true,
    roof: '#4a3c4c', roofDark: '#3a2e3c', parapet: '#5e4e5e', ink: '#fff2dc', sub: '#f0d8c0', caption: '#fff0dc', shadow: '#120f2e', birds: null,
  },
};

const KITE_COLORS = [['#ff4f8b', '#ffd23f'], ['#2ec4b6', '#ffffff'], ['#ffb627', '#ff4f4f'], ['#7b5cff', '#ffd23f'], ['#ff7a1a', '#ffffff'],
  ['#2ea84a', '#ffd23f'], ['#e63946', '#1d3557'], ['#00a8e8', '#ff4f8b'], ['#ffd23f', '#ff4f8b']];

function kiteCells(c1, c2) {
  const cells = [];
  for (let dy = -3; dy <= 3; dy++) { const w = 3 - Math.abs(dy); for (let dx = -w; dx <= w; dx++) cells.push([dx, dy, dy < 0 ? c1 : (dx < 0 ? c2 : c1)]); }
  for (let dy = -3; dy <= 3; dy++) cells.push([0, dy, mix(c1, '#000000', 0.3)]);
  cells.push([-1, 4, c2], [0, 4, c2], [1, 4, c2]);
  return cells;
}

export function festival(phase) {
  const L = PAL[phase];
  const R = rng(1110);
  const g = new Grid();
  const lit = [], parapets = [];

  // Three rows of houses, each with a parapet we can line with diyas later.
  const row = (base, hMin, hMax, wMin, wMax, depth) => {
    let x = -3;
    while (x < GW) {
      const w = wMin + Math.floor(R() * (wMax - wMin)), h = hMin + Math.floor(R() * (hMax - hMin));
      const c = mix(L.houses[Math.floor(R() * L.houses.length)], '#2a2440', L.shade + depth * 0.18);
      const top = base - h;
      g.box(x, top, x + w - 1, NEAR, c);
      g.box(x, top - 1, x + w - 1, top, mix(c, '#ffffff', 0.25));                 // parapet
      parapets.push([x, x + w - 1, top - 1, depth]);
      if (R() < 0.45) { const tx = x + 2 + Math.floor(R() * Math.max(1, w - 6)); g.box(tx, top - 4, tx + 3, top - 2, '#22262e'); }
      if (depth === 0 && R() < 0.35) { const dx = x + 2; g.box(dx, top - 6, dx + 4, top - 1, mix(c, '#000000', 0.1)); g.box(dx + 1, top - 4, dx + 2, top - 1, mix(c, '#000000', 0.45)); } // stair mumty
      for (let wy = top + 2; wy < base - 1; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 4) {
        if (R() < L.lit) lit.push([wx, wy]); else { g.box(wx, wy, wx + 1, wy + 1, mix(c, '#2a2e38', 0.35)); }
      }
      x += w + (R() < 0.25 ? 1 : 0);
    }
  };
  row(40, 3, 8, 8, 14, 2);
  row(48, 4, 10, 10, 18, 1);
  row(56, 5, 11, 12, 22, 0);
  for (const [x, y] of lit) { g.box(x, y, x + 1, y + 1, '#ffcf73'); }

  // A temple shikhara in the middle distance, with its flag.
  const T = 120;
  for (let y = 0; y < 12; y++) g.box(T - 5 + Math.floor(y / 2.2), 40 - y, T + 5 - Math.floor(y / 2.2), 40 - y, mix('#f4e6d2', '#2a2440', L.shade + 0.2));
  g.box(T, 26, T, 28, '#5a4a3a'); g.box(T + 1, 26, T + 3, 27, '#ff8c1a');

  // Our roof: floor, a rangoli in the middle, a bamboo pole at the left.
  g.box(0, NEAR, GW - 1, GH - 1, L.roof);
  for (let y = NEAR; y < GH; y += 3) g.box(0, y, GW - 1, y, L.roofDark);
  const rg = [['#ff4f8b', 7], ['#ffd23f', 6], ['#ff7a1a', 5], ['#2ea84a', 4], ['#ffffff', 3], ['#7b5cff', 2], ['#ffd23f', 1]];
  for (const [c, r] of rg) g.ellipse(88, 65, r * 2.6, r * 0.78, c);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.put(88 + Math.round(Math.cos(a) * 21), 65 + Math.round(Math.sin(a) * 6.2), '#ff4f8b'); g.put(88 + Math.round(Math.cos(a) * 23), 65 + Math.round(Math.sin(a) * 6.8), '#ffd23f'); }
  g.box(8, 18, 8, GH - 1, '#b8924a'); g.box(9, 18, 9, GH - 1, '#9a7a3a');
  for (let y = 22; y < GH; y += 7) g.box(8, y, 9, y, '#7a5a2a');

  let body = '';

  // Akash kandil: a star lantern hanging off the bamboo, swaying.
  const kx = 18, ky = 26;
  const kandil = new Grid();
  const STAR = ['....X....', '...XOX...', 'XXXOOOXXX', '.XOOCOOX.', '..XOOOX..', '.XOX.XOX.', 'XX.....XX'];
  STAR.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') kandil.put(kx - 4 + x, ky - 3 + y, ch === 'C' ? '#fff6c8' : ch === 'O' ? '#ffd23f' : '#ff4f4f'); }));
  for (let t = 4; t < 10; t++) { kandil.put(kx - 2, ky + t, ['#ff4f8b', '#ffd23f', '#2ec4b6'][t % 3]); kandil.put(kx + 2, ky + t + 1, ['#2ec4b6', '#ff4f8b', '#ffd23f'][t % 3]); }
  const kpiv = `${kx * PX} ${(ky - 8) * PX}`;
  body += `<path d="M${9 * PX} ${(ky - 8) * PX} H${kx * PX} V${(ky - 3) * PX}" stroke="#7a5a2a" stroke-width="2" fill="none"/>` +
    `<g transform="rotate(3 ${kpiv})">${L.diyas ? `<circle cx="${kx * PX}" cy="${ky * PX}" r="60" fill="url(#warm)" opacity="0.8"/>` : ''}${kandil.rects()}` +
    `<animateTransform attributeName="transform" type="rotate" values="-6 ${kpiv};6 ${kpiv};-6 ${kpiv}" dur="3.6s" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"/></g>`;

  // Kite flyers: a kid with a charkhi on our roof, two more on other roofs.
  const flyers = [[38, NEAR - 1], [64, 43], [150, 45]];
  if (L.kites) {
    const kid = new Grid();
    const [fx, fy] = flyers[0];
    kid.box(fx - 1, fy - 11, fx + 1, fy - 10, '#2a1a14'); kid.box(fx - 1, fy - 9, fx + 1, fy - 8, '#c68a5a');
    kid.box(fx - 2, fy - 7, fx + 2, fy - 3, '#ffd23f'); kid.box(fx - 2, fy - 2, fx - 1, fy, '#3a4a8a'); kid.box(fx + 1, fy - 2, fx + 2, fy, '#3a4a8a');
    kid.put(fx + 3, fy - 8, '#c68a5a'); kid.put(fx + 4, fy - 9, '#c68a5a');
    kid.box(fx - 5, fy - 6, fx - 3, fy - 4, '#d04a3a'); kid.put(fx - 4, fy - 5, '#ffffff');                        // charkhi
    for (const [x, y] of flyers.slice(1)) { kid.box(x, y - 5, x + 1, y - 1, '#3a3a4a'); kid.box(x, y - 7, x + 1, y - 6, '#2a2a34'); kid.put(x + 2, y - 6, '#3a3a4a'); }
    body += kid.rects();

    const spots = [[70, 26], [96, 12], [112, 30], [128, 14], [150, 22], [104, 22], [140, 33], [168, 10], [84, 32]].slice(0, L.kites);
    spots.forEach(([x, y], i) => {
      const [c1, c2] = KITE_COLORS[i % KITE_COLORS.length];
      const [hx, hy] = flyers[x < 80 ? 0 : x < 125 ? (i % 2 ? 1 : 0) : 2];
      const hand = [(hx + (hx === 38 ? 4 : 2)) * PX, (hy - (hx === 38 ? 9 : 6)) * PX];
      const bob = [[0, 0], [5, -7], [-4, 3], [0, 0]], dur = r2(5 + (i % 4) * 1.2), begin = -r2(i * 1.3);
      const d = ([ox, oy]) => { const sx = x * PX + ox + 2, sy = (y + 3.5) * PX + oy; return `M${r2(sx)} ${r2(sy)} Q ${r2((sx + hand[0]) / 2 - 20)} ${r2((sy + hand[1]) / 2 + 40)} ${hand[0]} ${hand[1]}`; };
      body += `<path d="${d(bob[0])}" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.55"><animate attributeName="d" values="${bob.map(d).join(';')}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></path>` +
        `<g transform="translate(${x * PX},${y * PX})"><g>${cellRects(kiteCells(c1, c2), c1)}` +
        `<animateTransform attributeName="transform" type="translate" values="${bob.map(([a, b]) => `${a},${b}`).join(';')}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g></g>`;
    });

    // One kite has been cut. It tumbles away downwind, string trailing.
    if (L.cut) {
      const cells = kiteCells('#ff4f4f', '#ffffff');
      body += `<g transform="translate(${130 * PX},${16 * PX})"><g>${cellRects(cells, '#ff4f4f')}<path d="M0 ${4 * PX} q 20 30 -10 70" stroke="#ffffff" stroke-width="1" fill="none" opacity="0.6"/>` +
        `<animateTransform attributeName="transform" type="rotate" values="0;40;-20;60;0" dur="9s" repeatCount="indefinite"/></g>` +
        `<animateTransform attributeName="transform" type="translate" values="${168 * PX},${6 * PX};${120 * PX},${14 * PX};${70 * PX},${30 * PX};${30 * PX},${44 * PX}" dur="18s" repeatCount="indefinite"/>` +
        `<animate attributeName="opacity" values="1;1;1;0" keyTimes="0;0.6;0.9;1" dur="18s" repeatCount="indefinite"/></g>`;
    }
  }

  // Pigeons along our parapet at dawn, one of them bobbing.
  if (L.pigeons) for (let i = 0; i < 6; i++) {
    const x = 30 + i * 19 + (i % 2) * 4, y = NEAR - 1;
    const cells = [[0, 0, '#8a8f9e'], [1, 0, '#8a8f9e'], [2, 0, '#6e7384'], [0, -1, '#9aa0ae'], [1, -1, '#9aa0ae'], [-1, -1, '#7a8090'], [-1, -2, '#5e6474'], [-2, -2, '#d08a3a']];
    body += `<g>${cellRects(cells, '#8a8f9e', x, y)}${i % 2 ? '' : `<animateTransform attributeName="transform" type="translate" values="0,0;0,0;-2,2;0,0" keyTimes="0;0.7;0.85;1" dur="${2 + i * 0.3}s" repeatCount="indefinite"/>`}</g>`;
  }

  // String lights between the bamboo and the far side, two sets alternating.
  if (L.lights) {
    const bulbs = [[], []];
    for (let x = 10; x < GW; x += 3) {
      const t = (x - 10) / (GW - 10), y = 20 + Math.round(10 * Math.sin(Math.PI * t * 1.5) * (1 - t) + t * 14);
      bulbs[(x / 3) % 2 | 0].push([x, y, ['#ff4f4f', '#ffd23f', '#2ec4b6', '#ff4f8b', '#7bdc6a'][(x / 3) % 5 | 0]]);
    }
    body += `<path d="${bulbs.flat().sort((a, b) => a[0] - b[0]).map(([x, y], i) => `${i ? 'L' : 'M'}${x * PX + 2} ${y * PX - 1}`).join(' ')}" stroke="#2a2430" stroke-width="1" fill="none" opacity="0.6"/>`;
    bulbs.forEach((set, k) => {
      body += `<g>${set.map(([x, y, c]) => `<rect x="${x * PX}" y="${y * PX}" width="${PX}" height="${PX}" fill="${c}"/><rect x="${x * PX - 3}" y="${y * PX - 3}" width="${PX + 6}" height="${PX + 6}" fill="${c}" opacity="0.25"/>`).join('')}` +
        `<animate attributeName="opacity" values="${k ? '1;0.35;1' : '0.35;1;0.35'}" dur="1.2s" repeatCount="indefinite"/></g>`;
    });
  }

  // Diyas: along the nearer parapets and in a ring around the rangoli.
  if (L.diyas) {
    let spots = [];
    for (const [a, b, y, depth] of parapets) if (depth < 2) for (let x = a + 2; x < b - 1; x += depth ? 5 : 4) spots.push([x, y - 1, depth]);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; spots.push([88 + Math.round(Math.cos(a) * 26), 65 + Math.round(Math.sin(a) * 7.5) - 1, 0]); }
    spots = spots.filter(([x]) => x > 0 && x < GW - 1);
    body += spots.map(([x, y, depth], i) => {
      const f = r2(0.35 + ((i * 37) % 10) / 20);
      return `<g><rect x="${x * PX - 6}" y="${y * PX - 8}" width="${PX + 12}" height="${PX + 12}" fill="#ffb04a" opacity="0.18"/>` +
        `<rect x="${x * PX - 2}" y="${(y + 1) * PX}" width="${PX + 4}" height="${PX - 1}" fill="#a8582a"/>` +
        `<rect x="${x * PX}" y="${y * PX}" width="${PX}" height="${PX}" fill="#ffd27a"><animate attributeName="opacity" values="1;0.55;0.9;1" dur="${f}s" repeatCount="indefinite"/></rect>` +
        `<rect x="${x * PX + 1}" y="${y * PX - 3}" width="3" height="3" fill="#fff4c0"><animate attributeName="height" values="3;1;4;3" dur="${f}s" repeatCount="indefinite"/></rect></g>`;
    }).join('');
  }

  // Fireworks: a rocket climbs, bursts into a ring of sparks that sag and fade.
  let fw = '';
  if (L.fireworks) {
    const bursts = [[46, 12, '#ffd23f', 3.4, 0], [102, 8, '#ff4f8b', 4.1, 1.2], [148, 14, '#2ec4b6', 3.7, 2.1], [76, 20, '#ffffff', 4.6, 3], [128, 22, '#7bdc6a', 3.9, 0.6], [164, 6, '#ff9a3c', 4.4, 2.6]];
    for (const [x, y, c, dur, b] of bursts) {
      const cx = x * PX, cy = y * PX, n = 14, rad = 30 + (x % 3) * 8;
      fw += `<rect x="${cx}" y="${cy}" width="3" height="${PX}" fill="#ffe8b0" opacity="0"><animateTransform attributeName="transform" type="translate" values="0,${SH - cy};0,0;0,0" keyTimes="0;0.24;1" dur="${dur}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0.9;0;0" keyTimes="0;0.24;0.25;1" dur="${dur}s" begin="${b}s" repeatCount="indefinite"/></rect>`;
      fw += `<circle cx="${cx}" cy="${cy}" r="${rad * 1.4}" fill="url(#burst)" opacity="0"><animate attributeName="opacity" values="0;0;0.55;0;0" keyTimes="0;0.25;0.3;0.6;1" dur="${dur}s" begin="${b}s" repeatCount="indefinite"/></circle>`;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2, ex = r2(Math.cos(a) * rad), ey = r2(Math.sin(a) * rad);
        const kc = k % 3 ? c : '#ffffff';
        fw += `<rect x="${cx - 2}" y="${cy - 2}" width="4" height="4" fill="${kc}" opacity="0">` +
          `<animateTransform attributeName="transform" type="translate" values="0,0;0,0;${r2(ex * 0.7)},${r2(ey * 0.7)};${ex},${r2(ey + 14)};${ex},${r2(ey + 14)}" keyTimes="0;0.25;0.4;0.75;1" dur="${dur}s" begin="${b}s" repeatCount="indefinite"/>` +
          `<animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.25;0.28;0.75;1" dur="${dur}s" begin="${b}s" repeatCount="indefinite"/></rect>`;
      }
    }
  }

  const sun = phase === 'day' ? `<circle cx="${160 * PX}" cy="${6 * PX}" r="70" fill="url(#warm)" opacity="0.4"/><rect x="${157 * PX}" y="${3 * PX}" width="${7 * PX}" height="${7 * PX}" rx="10" fill="#fff4c8"/>`
    : phase === 'dawn' ? `<circle cx="${40 * PX}" cy="${36 * PX}" r="90" fill="url(#warm)" opacity="0.6"/>` : '';

  return {
    defs: glowDef('warm', '#ffb04a') + glowDef('burst', '#fff2c8', 0.6),
    body: skyBands(L.sky, 44) + sun + (L.stars ? stars(R, 70, 30) : '') + fw + g.rects() + body + (L.birds ? birds(L.birds, 5, 6, 28) : ''),
    ink: L.ink, sub: L.sub, caption: L.caption, shadow: L.shadow,
    desc: `Pixel art of the rooftops of a mohalla in ${P.place.name} on a festival day: pastel houses with water tanks, a temple shikhara, a bamboo pole with a swaying akash kandil and a rangoli on our roof. ` +
      (phase === 'day' ? 'Sankranti: the sky is full of kites flown from three roofs, and one cut kite tumbles away.' : phase === 'dawn' ? 'Pigeons sit along the parapet as the first kites go up.' :
        phase === 'dusk' ? 'The last kites, diyas lit along the parapets and string lights coming on.' : 'Diwali night: fireworks bursting, diyas flickering along every parapet and string lights twinkling.'),
  };
}
