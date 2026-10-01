/* reef
 *
 * A coral reef in bright shallow water. Light ripples on the surface and
 * falls in slanting rays. Kelp sways on the left; branching, brain and fan
 * corals crowd the sand; a pair of clownfish weave through an anemone. A
 * school of fish wheels past, a sea turtle glides through, jellyfish pulse
 * up toward the light, a crab sidles along the bottom and a clam breathes
 * bubbles. At night the reef turns bioluminescent.
 */
import { r2, rng, mix, Grid, cellRects, PX, GW, GH, SW, SH, glowDef } from '../lib.mjs';

const SAND = 60;

const PAL = {
  dawn:  { water: ['#3a6aa8', '#4a82b8', '#5c98c4', '#6eaccc', '#84bcd0', '#9ac8d0'], ray: '#ffe0c8', rayA: 0.18, sand: ['#e8c8a0', '#d4b088', '#f2d8b4'], fishA: 1, glow: 0, ink: '#ffffff', sub: '#eaf6ff', caption: '#ffffff', shadow: '#1a3a5a' },
  day:   { water: ['#1e88c8', '#26a0d4', '#30b4dc', '#42c4de', '#5cd2de', '#7adcdc'], ray: '#ffffff', rayA: 0.2, sand: ['#f2dcae', '#e0c48e', '#fae8c4'], fishA: 1, glow: 0, ink: '#ffffff', sub: '#eafcff', caption: '#ffffff', shadow: '#0c4a6a' },
  dusk:  { water: ['#3a4a8a', '#4a5e9a', '#5a76a8', '#6a8cb0', '#7c9ab0', '#90a4ac'], ray: '#ffc890', rayA: 0.2, sand: ['#d8b08a', '#c09474', '#e6c49c'], fishA: 0.95, glow: 0.3, ink: '#fff4e8', sub: '#ffe4d0', caption: '#fff4e8', shadow: '#2a2a4a' },
  night: { water: ['#040a1e', '#061026', '#08162e', '#0a1c36', '#0c223e', '#0e2846'], ray: '#7aa8ff', rayA: 0.04, sand: ['#2a3040', '#22283a', '#343a4c'], fishA: 0.5, glow: 1, ink: '#e8fbff', sub: '#b8e8f0', caption: '#c8f0f8', shadow: '#02060e' },
};

function fishCells(body, belly, fin) {
  return [[0, -1, body], [1, -1, body], [2, -1, body], [-1, 0, body], [0, 0, body], [1, 0, body], [2, 0, body], [3, 0, body],
    [0, 1, belly], [1, 1, belly], [2, 1, belly], [3, 0, '#1a1a2a'], [-2, -1, fin], [-2, 1, fin], [-2, 0, fin], [1, -2, fin]];
}

export function reef(phase) {
  const L = PAL[phase];
  const R = rng(3030);
  const night = phase === 'night';
  const g = new Grid();

  // Sand with ripples, rocks under the coral.
  for (let y = SAND; y < GH; y++) for (let x = 0; x < GW; x++) {
    const ripple = Math.sin(x / 4 + y * 1.3 + Math.sin(x / 13) * 2) > 0.7;
    g.put(x, y, ripple ? L.sand[2] : (x * 7 + y * 3) % 23 === 0 ? L.sand[1] : L.sand[0]);
  }
  for (let x = 0; x < GW; x++) { const t = SAND - Math.round(1.5 + 1.5 * Math.sin(x / 9) + Math.sin(x / 3.7)); g.box(x, t, x, SAND, L.sand[1]); }
  for (const [x, y, rx, ry] of [[40, 60, 10, 4], [96, 61, 12, 4], [150, 60, 9, 3]]) g.ellipse(x, y, rx, ry, (dx, dy) => mix(night ? '#3a3a52' : '#8a8494', '#000000', dy > 0 ? 0.25 : 0));

  // Corals. Night mixes them toward glowing.
  const c = (col) => (night ? mix(col, '#0a1c36', 0.55) : col);
  // brain coral
  g.ellipse(42, 56, 7, 4, (x, y) => c((x + y + 40) % 3 === 0 ? '#e88a5a' : '#f4a86e'));
  // branching coral, pink
  const branch = (x0, y0, h, col) => { for (let i = 0; i < 5; i++) { const bx = x0 + i * 2 - 4; g.box(bx, y0 - h + (i % 2) * 2, bx, y0, c(col)); g.put(bx - 1, y0 - h + 2 + (i % 2) * 2, c(col)); g.put(bx + 1, y0 - h + 4 + (i % 2), c(col)); } };
  branch(24, 58, 9, '#ff6fa8'); branch(112, 58, 10, '#ff9a4a'); branch(160, 58, 8, '#ff6fa8');
  // sea fans
  for (const [fx, fy, h, col] of [[70, 58, 12, '#b07aff'], [134, 58, 11, '#ff5e7e']]) {
    for (let k = -5; k <= 5; k++) for (let t = 0; t < h; t++) if ((k + t) % 2 === 0 && Math.abs(k) <= t * 0.6 + 1) g.put(fx + k, fy - t, c(col));
    g.box(fx, fy - 2, fx, fy, c(mix(col, '#000000', 0.3)));
  }
  // tube sponges and a starfish on a rock
  for (const [x, h, col] of [[88, 7, '#ffd23f'], [91, 9, '#ffb627'], [94, 6, '#ffd23f']]) { g.box(x, SAND - h, x + 1, SAND - 1, c(col)); g.box(x, SAND - h, x + 1, SAND - h, c(mix(col, '#000000', 0.35))); }
  for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-2, -1], [2, -1], [-1, 2], [1, 2]]) g.put(150 + dx, 57 + dy, c('#ff7a3a'));
  // the anemone, home to the clownfish
  for (let k = 0; k < 9; k++) { const x = 52 + k; g.box(x, SAND - 4 - (k % 3), x, SAND - 1, c(k % 2 ? '#c8a0ff' : '#e0c0ff')); g.put(x, SAND - 5 - (k % 3), c('#ffffff')); }
  // a clam, open
  g.box(124, 60, 129, 61, c('#8a7aa0')); g.box(124, 58, 129, 58, c('#a898c0')); g.put(126, 59, '#ffffff'); g.put(127, 59, '#f0e8ff');

  let body = '';

  // Light: the surface shimmering, rays falling.
  body += `<rect x="0" y="0" width="${SW}" height="6" fill="#ffffff" opacity="${night ? 0.08 : 0.35}"/>`;
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(R() * GW) * PX, w = 3 + Math.floor(R() * 5);
    body += `<rect x="${x}" y="2" width="${w * PX}" height="${PX}" fill="#ffffff" opacity="0"><animate attributeName="opacity" values="0;${night ? 0.2 : 0.7};0" dur="${r2(1.5 + R() * 2)}s" begin="${r2(R() * 2)}s" repeatCount="indefinite"/></rect>`;
  }
  for (let i = 0; i < 6; i++) {
    const x = 20 + i * 150 + R() * 40, w = 40 + R() * 40;
    body += `<polygon points="${r2(x)},0 ${r2(x + w)},0 ${r2(x + w - 160)},${SH} ${r2(x - 220)},${SH}" fill="url(#ray)" opacity="${L.rayA}"><animate attributeName="opacity" values="${L.rayA};${r2(L.rayA * 0.3)};${L.rayA}" dur="${r2(5 + R() * 4)}s" repeatCount="indefinite"/></polygon>`;
  }

  // Kelp on the left, swaying from its roots.
  for (const [kx, h, d] of [[6, 40, 4.2], [11, 46, 5], [16, 34, 3.8], [170, 36, 4.6]]) {
    const k = new Grid();
    for (let t = 0; t < h; t++) { const x = kx + Math.round(Math.sin(t / 6) * 1.5); k.put(x, SAND - t, c(t % 6 < 3 ? '#3a9a4a' : '#4ab05a')); if (t % 6 === 2) { k.put(x + 1, SAND - t, c('#5ac86a')); k.put(x + 2, SAND - t - 1, c('#5ac86a')); } }
    const piv = `${kx * PX} ${SAND * PX}`;
    body += `<g>${k.rects()}<animateTransform attributeName="transform" type="rotate" values="-5 ${piv};5 ${piv};-5 ${piv}" dur="${d}s" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"/></g>`;
  }

  body += g.rects();

  // Clownfish weaving in and out of the anemone.
  for (let i = 0; i < 2; i++) {
    const cells = [[0, 0, '#ff7a1a'], [1, 0, '#ffffff'], [2, 0, '#ff7a1a'], [3, 0, '#ff7a1a'], [4, 0, '#1a1a2a'], [1, -1, '#ff7a1a'], [2, -1, '#ff7a1a'], [1, 1, '#ff7a1a'], [2, 1, '#ffffff'], [-1, 0, '#ff9a3a'], [-1, -1, '#1a1a2a'], [-1, 1, '#1a1a2a']];
    const x = (52 + i * 4) * PX, y = (SAND - 8 - i * 2) * PX;
    body += `<g opacity="${L.fishA}" transform="translate(${x},${y})"><g>${cellRects(cells, '#ff7a1a')}<animateTransform attributeName="transform" type="scale" values="1 1;-1 1" keyTimes="0;0.5" calcMode="discrete" dur="${5 + i}s" repeatCount="indefinite"/></g>` +
      `<animateTransform attributeName="transform" type="translate" values="${x},${y};${x + 40},${y - 10};${x},${y}" dur="${5 + i}s" repeatCount="indefinite"/></g>`;
  }

  // A school of fish wheeling across in formation.
  let school = '';
  for (let i = 0; i < 14; i++) {
    const ox = (i % 5) * 24 + (Math.floor(i / 5) % 2) * 12, oy = Math.floor(i / 5) * 18 + (i % 2) * 5;
    school += `<g transform="translate(${ox},${oy})">${cellRects(fishCells('#4a7ad8', '#c8dcff', '#ffd23f'), '#4a7ad8')}<animateTransform attributeName="transform" type="translate" values="${ox},${oy};${ox + 3},${oy - 4};${ox},${oy}" dur="${r2(1.2 + (i % 4) * 0.2)}s" repeatCount="indefinite"/></g>`;
  }
  body += `<g opacity="${L.fishA}" transform="translate(${-130},${24 * PX})">${school}<animateTransform attributeName="transform" type="translate" values="${-130},${24 * PX};${SW * 0.5},${18 * PX};${SW + 30},${26 * PX}" dur="24s" repeatCount="indefinite"/></g>`;

  // A few loners going the other way.
  [[30, '#ffb627', '#fff2c0', 18], [44, '#ff5e7e', '#ffd0dc', 26], [14, '#2ec4b6', '#c8fff6', 22]].forEach(([row, b, belly, d], i) => {
    const y = row * PX;
    body += `<g opacity="${L.fishA}" transform="translate(${SW},${y})"><g transform="scale(-1 1)">${cellRects(fishCells(b, belly, mix(b, '#ffffff', 0.4)), b)}</g>` +
      `<animateTransform attributeName="transform" type="translate" values="${SW + 30},${y};${-40},${y + 12}" dur="${d}s" begin="${-i * 7}s" repeatCount="indefinite"/></g>`;
  });

  // The sea turtle, flippers rowing.
  const tg = new Grid(), tx = 20, ty = 20;
  tg.ellipse(tx, ty, 8, 4.5, (x, y) => ((x + y) % 4 === 0 ? '#5a7a3a' : (Math.abs(x) + Math.abs(y)) % 5 === 0 ? '#3a5a2a' : '#7a9a4a'));
  tg.box(tx + 8, ty - 1, tx + 11, ty + 1, '#a8c47a'); tg.put(tx + 10, ty - 1, '#1a1a2a'); tg.box(tx - 10, ty, tx - 8, ty, '#a8c47a');
  const flip = new Grid(); flip.box(tx + 2, ty - 7, tx + 6, ty - 5, '#a8c47a'); flip.box(tx + 2, ty + 5, tx + 6, ty + 7, '#a8c47a'); flip.box(tx - 7, ty - 5, tx - 5, ty - 4, '#a8c47a'); flip.box(tx - 7, ty + 4, tx - 5, ty + 5, '#a8c47a');
  const fp = `${(tx + 2) * PX} ${ty * PX}`;
  body += `<g opacity="${L.fishA}" transform="translate(${-200},0)">${tg.rects()}<g>${flip.rects()}<animateTransform attributeName="transform" type="rotate" values="-10 ${fp};10 ${fp};-10 ${fp}" dur="1.6s" repeatCount="indefinite"/></g>` +
    `<animateTransform attributeName="transform" type="translate" values="${-120},${18 * PX};${SW + 40},${8 * PX}" dur="42s" begin="-18s" repeatCount="indefinite"/></g>`;

  // Jellyfish pulsing upward.
  [[100, 40, '#ffb0e0', 22], [146, 30, '#c8b0ff', 28], [78, 48, '#ffc8a0', 25]].forEach(([jx, jy, col, d], i) => {
    const jg = new Grid();
    for (let y = -3; y <= 0; y++) for (let x = -4; x <= 4; x++) if (x * x / 16 + (y * y) / 9 <= 1) jg.put(10 + x, 10 + y, y < -1 ? mix(col, '#ffffff', 0.4) : col);
    for (const x of [-3, -1, 1, 3]) for (let t = 1; t < 7; t++) if ((t + x) % 2 === 0 || t < 3) jg.put(10 + x + (t % 3 === 0 ? 1 : 0), 10 + t, mix(col, '#ffffff', 0.2));
    const ox = (jx - 10) * PX, oy = (jy - 10) * PX;
    body += `<g transform="translate(${ox},${oy})"><g opacity="${night ? 1 : 0.75}">${night ? `<circle cx="50" cy="52" r="40" fill="url(#bio)"/>` : ''}${jg.rects()}<animateTransform attributeName="transform" type="scale" values="1 1;1.08 0.86;1 1" dur="1.8s" begin="${i * 0.5}s" repeatCount="indefinite"/></g>` +
      `<animateTransform attributeName="transform" type="translate" values="${ox},${oy + 60};${ox + 10},${oy - 140}" dur="${d}s" begin="${-i * 8}s" repeatCount="indefinite"/></g>`;
  });

  // A crab sidling along the sand.
  const crab = [[0, 0], [1, 0], [2, 0], [3, 0], [0, -1], [1, -1], [2, -1], [3, -1], [-1, 1], [4, 1], [-1, -2], [4, -2], [1, -2, '#1a1a2a'], [2, -2, '#1a1a2a'], [-1, 0], [4, 0]].map(([x, y, cc]) => [x, y, cc || '#e2462a']);
  body += `<g opacity="${L.fishA}" transform="translate(${80 * PX},${(SAND + 6) * PX})">${cellRects(crab, '#e2462a')}<animateTransform attributeName="transform" type="translate" values="${70 * PX},${(SAND + 6) * PX};${110 * PX},${(SAND + 6) * PX};${70 * PX},${(SAND + 6) * PX}" dur="16s" repeatCount="indefinite"/></g>`;

  // Bubbles from the clam.
  for (let k = 0; k < 7; k++) {
    const d = r2(4 + k * 0.4), b = -r2((k / 7) * d), s = 3 + (k % 3);
    body += `<rect x="${126.5 * PX}" y="${57 * PX}" width="${s}" height="${s}" fill="#eafcff" opacity="0.8"><animateTransform attributeName="transform" type="translate" values="0,0;${k % 2 ? 6 : -6},-140;0,${-57 * PX}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0.6;0" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></rect>`;
  }

  // Night: plankton sparkles and glowing coral tips.
  if (L.glow) {
    for (let i = 0; i < 60; i++) {
      const x = R() * SW, y = R() * SH, d = r2(1.5 + R() * 3);
      body += `<rect x="${r2(x)}" y="${r2(y)}" width="3" height="3" fill="${R() < 0.5 ? '#7af0ff' : '#b0ffd8'}" opacity="0"><animate attributeName="opacity" values="0;${r2(0.5 + R() * 0.5 * L.glow)};0" dur="${d}s" begin="${r2(R() * 3)}s" repeatCount="indefinite"/></rect>`;
    }
    for (const [x, y, col] of [[24, 49, '#ff6fa8'], [112, 48, '#ff9a4a'], [70, 46, '#b07aff'], [134, 47, '#ff5e7e'], [56, 54, '#e0c0ff'], [91, 51, '#ffd23f']])
      body += `<circle cx="${x * PX}" cy="${y * PX}" r="40" fill="${col}" opacity="0"><animate attributeName="opacity" values="${r2(0.12 * L.glow)};${r2(0.28 * L.glow)};${r2(0.12 * L.glow)}" dur="3.4s" repeatCount="indefinite"/></circle>`;
  }

  return {
    defs: `<linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.ray}" stop-opacity="1"/><stop offset="1" stop-color="${L.ray}" stop-opacity="0"/></linearGradient>` + glowDef('bio', '#ff9ae8', 0.5),
    body: `<g>${[...L.water].reverse().map((col, i) => `<rect x="0" y="${i * 12 * PX}" width="${SW}" height="${12 * PX + PX}" fill="${col}"/>`).join('')}</g>` + body,
    ink: L.ink, sub: L.sub, caption: L.caption, shadow: L.shadow, titleShadow: L.shadow, local: false,
    desc: `Pixel art of a coral reef in shallow water: light rays from a shimmering surface, swaying kelp, branching, brain and fan corals, clownfish in an anemone, a school of fish, a sea turtle, rising jellyfish, a crab on the sand and bubbles from a clam${L.glow > 0.5 ? ', glowing with bioluminescence' : ''}.`,
  };
}
