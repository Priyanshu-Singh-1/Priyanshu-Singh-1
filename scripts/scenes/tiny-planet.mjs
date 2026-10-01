/* tiny planet
 *
 * A world small enough to walk around before lunch. A kid in a red scarf
 * walks on top of it while it turns beneath them: a cottage with a smoking
 * chimney, a round tree, a windmill, a lamp post, a well and a patch of
 * flowers come round one by one. The sun's side stays lit while the planet
 * turns. Around it: a ringed giant, a little moon, drifting rocks, a comet
 * every so often, and the sky of space tinted by the hour.
 */
import { r2, rng, mix, Grid, cellRects, PX, GW, GH, SW, SH, skyBands, stars, glowDef } from '../lib.mjs';

const CX = 124, CY = 41, RAD = 21;            // the planet, in grid units
const SPIN = 48;                               // seconds per revolution

const PAL = {
  dawn:  { sky: ['#2a2a5e', '#4a3a78', '#7a4a8a', '#b25e8e', '#e07c8a', '#f6a38a'], stars: 40, ground: ['#7fc06a', '#6aae58', '#94d27c'], sea: '#5aa0d8', ink: '#fff4ec', sub: '#ffe0d4', caption: '#fff4ec', lamp: true, neb: '#ff9ab0' },
  day:   { sky: ['#3d6fd0', '#4f82dc', '#6396e6', '#7aaaee', '#93bef4', '#aed0f8'], stars: 18, ground: ['#7ad25a', '#62bc48', '#96e47a'], sea: '#4ab0f0', ink: '#ffffff', sub: '#eaf2ff', caption: '#ffffff', lamp: false, neb: '#ffffff' },
  dusk:  { sky: ['#2c2058', '#4e2a70', '#7e3478', '#b04a72', '#e0706a', '#f8a26a'], stars: 50, ground: ['#a4b85a', '#8ea24c', '#bcd06e'], sea: '#7a8ad0', ink: '#fff2e2', sub: '#ffdcc4', caption: '#fff2e2', lamp: true, neb: '#ffb070' },
  night: { sky: ['#05071a', '#080c24', '#0c122e', '#111838', '#161e42', '#1c254c'], stars: 120, ground: ['#3a6a4a', '#2e5a3e', '#4a7c58'], sea: '#2a4a8a', ink: '#f1f4ff', sub: '#c4cfe8', caption: '#dfe8f5', lamp: true, neb: '#7a6aff' },
};

/** Sprites are drawn standing on the planet's north pole, then rotated into place. */
function sprite(kind, L) {
  const g = new Grid();
  const top = CY - RAD;                          // ground level at the pole
  const X = CX;
  if (kind === 'house') {
    g.box(X - 3, top - 5, X + 3, top, '#f6e2c0'); g.box(X + 2, top - 5, X + 3, top, '#e2c8a0');
    for (let y = 0; y < 4; y++) g.box(X - 4 + y, top - 6 - y, X + 4 - y, top - 6 - y, y % 2 ? '#c84a3a' : '#e05a44');
    g.box(X - 1, top - 2, X, top, '#7a4a2a'); g.put(X + 2, top - 3, L.lamp ? '#ffd27a' : '#8ac8f0');
    g.box(X + 2, top - 10, X + 2, top - 8, '#8a3a2a');
  } else if (kind === 'tree') {
    g.box(X, top - 4, X, top, '#7a4a2a');
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 17) g.put(X + x, top - 8 + y, y < -1 ? '#5ac85a' : x > 1 ? '#2e8a3c' : '#43a84c');
    g.put(X - 2, top - 9, '#ff5e5e'); g.put(X + 1, top - 6, '#ff5e5e'); g.put(X + 2, top - 10, '#ff5e5e');
  } else if (kind === 'windmill') {
    for (let y = 0; y < 9; y++) g.box(X - 1 - (y < 3 ? 1 : 0), top - y, X + 1 + (y < 3 ? 1 : 0), top - y, y % 3 ? '#f0e6d8' : '#d6c8b4');
    g.box(X - 1, top - 10, X + 1, top - 9, '#c84a3a');
  } else if (kind === 'lamp') {
    g.box(X, top - 7, X, top, '#3a3a48'); g.box(X - 1, top - 9, X + 1, top - 8, L.lamp ? '#ffe9a8' : '#c8d0dc'); g.box(X - 1, top - 10, X + 1, top - 10, '#3a3a48');
  } else if (kind === 'well') {
    g.box(X - 2, top - 2, X + 2, top, '#9aa0aa'); g.box(X - 2, top - 2, X + 2, top - 2, '#b8bec8');
    g.box(X - 2, top - 6, X - 2, top - 3, '#7a4a2a'); g.box(X + 2, top - 6, X + 2, top - 3, '#7a4a2a'); g.box(X - 3, top - 7, X + 3, top - 7, '#c84a3a');
  } else if (kind === 'flowers') {
    for (const [dx, c] of [[-3, '#ff5e9e'], [-1, '#ffd23f'], [1, '#ff8a3a'], [3, '#b07aff']]) { g.box(X + dx, top - 2, X + dx, top, '#3a8a3a'); g.put(X + dx, top - 3, c); }
  }
  return g;
}

export function tinyPlanet(phase) {
  const L = PAL[phase];
  const R = rng(612);
  const P = `${CX * PX} ${CY * PX}`;

  // Nebula wisps and the stars behind everything.
  const neb = `<ellipse cx="${40 * PX}" cy="${44 * PX}" rx="260" ry="70" fill="url(#neb)" opacity="0.35" transform="rotate(-14 ${40 * PX} ${44 * PX})"/>` +
    `<ellipse cx="${150 * PX}" cy="${12 * PX}" rx="200" ry="50" fill="url(#neb)" opacity="0.22"/>`;

  // A ringed giant and a small moon far off.
  const far = new Grid();
  far.disc(28, 52, 9, '#e8b46a');
  for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) if (x * x + y * y <= 85 && (y + 9) % 4 < 2) far.put(28 + x, 52 + y, '#d49a52');
  for (let x = -16; x <= 16; x++) { const y = Math.round(x * 0.22); if (Math.abs(x) > 8 || y > 0) { far.put(28 + x, 52 + y, '#f6deb0'); far.put(28 + x, 53 + y, '#c8a070'); } }
  far.disc(74, 26, 3, '#cfd4de'); far.put(73, 25, '#aab0bc'); far.put(75, 27, '#aab0bc');

  // Rocks drifting past, slowly turning.
  let rocks = '';
  [[54, 40, 2, 70], [92, 60, 1, 50], [160, 18, 2, 90], [10, 30, 1, 60]].forEach(([x, y, r, d], i) => {
    const rg = new Grid(); rg.disc(0 + 10, 0 + 10, r, '#8a7c90'); rg.put(9, 9, '#a89cb0');
    rocks += `<g transform="translate(${(x - 10) * PX},${(y - 10) * PX})"><g>${rg.rects()}<animateTransform attributeName="transform" type="rotate" values="0 50 50;360 50 50" dur="${d / 3}s" repeatCount="indefinite"/></g>` +
      `<animateTransform attributeName="transform" type="translate" values="${(x - 10) * PX},${(y - 10) * PX};${(x - 30) * PX},${(y - 4) * PX};${(x - 10) * PX},${(y - 10) * PX}" dur="${d}s" repeatCount="indefinite"/></g>`;
  });

  // A comet crosses now and then.
  const comet = `<g opacity="0"><path d="M0 0 L-90 -26" stroke="url(#tail)" stroke-width="6" stroke-linecap="round"/><rect x="-4" y="-4" width="8" height="8" fill="#ffffff"/>` +
    `<animateTransform attributeName="transform" type="translate" values="${SW + 40},40;${SW * 0.35},${SH * 0.4};${SW * 0.35},${SH * 0.4}" keyTimes="0;0.18;1" dur="16s" repeatCount="indefinite"/>` +
    `<animate attributeName="opacity" values="0;1;0;0" keyTimes="0;0.05;0.18;1" dur="16s" repeatCount="indefinite"/></g>`;

  // The planet: a static disc, a turning surface, and a fixed day/night shade.
  const base = new Grid();
  base.disc(CX, CY, RAD, L.ground[0]);
  const surf = new Grid();
  for (const [ax, ay, r, c] of [[-8, -6, 6, L.sea], [9, 7, 5, L.sea], [-4, 12, 4, L.sea], [12, -10, 3, L.ground[2]], [-14, 4, 3, L.ground[1]], [2, -2, 4, L.ground[1]], [-10, -14, 3, L.ground[2]]])
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const px = CX + ax + x, py = CY + ay + y;
      if (x * x + y * y <= r * r && (px - CX) ** 2 + (py - CY) ** 2 <= (RAD - 1) ** 2) surf.put(px, py, c);
    }
  const objs = [['house', 0], ['tree', 55], ['windmill', 115], ['lamp', 170], ['well', 225], ['flowers', 290], ['tree', 320]];
  let things = '';
  for (const [k, a] of objs) {
    things += `<g transform="rotate(${a} ${P})">${sprite(k, L).rects()}</g>`;
    if (k === 'windmill') {
      const hx = CX * PX + 2, hy = (CY - RAD - 9) * PX + 2;
      things += `<g transform="rotate(${a} ${P})"><g>${[0, 90, 180, 270].map((b) => `<rect x="${hx - 2}" y="${hy - 26}" width="5" height="24" fill="#f6efe2" stroke="#b8a890" stroke-width="1" transform="rotate(${b} ${hx} ${hy})"/>`).join('')}` +
        `<animateTransform attributeName="transform" type="rotate" values="0 ${hx} ${hy};360 ${hx} ${hy}" dur="3s" repeatCount="indefinite"/></g></g>`;
    }
    if (k === 'house') things += `<g transform="rotate(${a} ${P})">${[0, 1, 2].map((i) => `<rect x="${(CX + 2) * PX}" y="${(CY - RAD - 11) * PX}" width="${PX}" height="${PX}" fill="#ffffff" opacity="0"><animateTransform attributeName="transform" type="translate" values="0,0;8,-26" dur="2.4s" begin="${i * 0.8}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0" dur="2.4s" begin="${i * 0.8}s" repeatCount="indefinite"/></rect>`).join('')}</g>`;
    if (k === 'lamp' && L.lamp) things += `<g transform="rotate(${a} ${P})"><circle cx="${CX * PX + 2}" cy="${(CY - RAD - 8.5) * PX}" r="26" fill="url(#lampglow)"/></g>`;
  }
  const spin = `<g>${surf.rects()}${things}<animateTransform attributeName="transform" type="rotate" values="0 ${P};-360 ${P}" dur="${SPIN}s" repeatCount="indefinite"/></g>`;
  const shade = `<circle cx="${CX * PX}" cy="${CY * PX}" r="${RAD * PX + 3}" fill="url(#terminator)"/>` +
    `<circle cx="${CX * PX}" cy="${CY * PX}" r="${(RAD + 1.5) * PX}" fill="none" stroke="${mix(L.sky[5], '#ffffff', 0.4)}" stroke-width="3" opacity="0.35"/>`;

  // The walker on top, legs swapping, scarf in the wind.
  const walk = (a) => {
    const g = new Grid(), x = CX, y = CY - RAD - 1;
    g.box(x - 1, y - 8, x + 1, y - 7, '#f0c890'); g.box(x - 1, y - 9, x + 1, y - 9, '#ffd23f');           // face, golden hair
    g.box(x - 1, y - 6, x + 1, y - 3, '#3a6ad0'); g.put(x + 2, y - 5, '#f0c890'); g.put(x - 2, y - 4, '#f0c890');
    g.box(x - 1, y - 6, x + 1, y - 6, '#e03a3a');
    if (a) { g.put(x - 1, y - 2, '#2a2a3a'); g.put(x - 2, y - 1, '#2a2a3a'); g.put(x + 1, y - 2, '#2a2a3a'); g.put(x + 1, y - 1, '#2a2a3a'); }
    else { g.put(x - 1, y - 2, '#2a2a3a'); g.put(x - 1, y - 1, '#2a2a3a'); g.put(x + 1, y - 2, '#2a2a3a'); g.put(x + 2, y - 1, '#2a2a3a'); }
    return g.rects();
  };
  const scarf = `<g>${cellRects([[0, 0], [1, 0], [2, 1], [3, 1]].map(([x, y]) => [x, y, '#e03a3a']), '#e03a3a', CX - 5, CY - RAD - 7)}` +
    `<animateTransform attributeName="transform" type="translate" values="0,0;0,-2;0,1;0,0" dur="0.9s" repeatCount="indefinite"/></g>`;
  const walker = `<g>${walk(0)}<animate attributeName="opacity" values="1;0" dur="0.6s" calcMode="discrete" repeatCount="indefinite"/></g>` +
    `<g opacity="0">${walk(1)}<animate attributeName="opacity" values="0;1" dur="0.6s" calcMode="discrete" repeatCount="indefinite"/></g>` + scarf;

  // A pocket moon on a tilted orbit: in front of the planet on one half of
  // its loop, hidden behind it on the other.
  const orbit = (front) => {
    const rx = (RAD + 11) * PX, ry = 7 * PX, k = 0.5523;
    const path = `M${-rx} 0 C${-rx} ${-k * ry} ${-k * rx} ${-ry} 0 ${-ry} C${k * rx} ${-ry} ${rx} ${-k * ry} ${rx} 0 C${rx} ${k * ry} ${k * rx} ${ry} 0 ${ry} C${-k * rx} ${ry} ${-rx} ${k * ry} ${-rx} 0`;
    const vis = front ? 'values="0;0;1;1;0" keyTimes="0;0.5;0.5;1;1"' : 'values="1;1;0;0" keyTimes="0;0.5;0.5;1"';
    return `<g transform="translate(${CX * PX},${CY * PX}) rotate(-12)"><g><rect x="-7" y="-7" width="14" height="14" rx="4" fill="#d8dce6"/><rect x="-3" y="-4" width="4" height="4" fill="#b4bac8"/>` +
      `<animateMotion path="${path}" dur="14s" repeatCount="indefinite"/><animate attributeName="opacity" ${vis} calcMode="discrete" dur="14s" repeatCount="indefinite"/></g></g>`;
  };
  let shooting = '';
  if (phase === 'night' || phase === 'dusk') for (let i = 0; i < 3; i++) {
    const x = 30 + i * 70, y = 8 + i * 6, d = 7 + i * 2;
    shooting += `<g opacity="0"><path d="M0 0 L-46 -14" stroke="url(#tail)" stroke-width="3" stroke-linecap="round"/><rect x="-2" y="-2" width="4" height="4" fill="#ffffff"/>` +
      `<animateTransform attributeName="transform" type="translate" values="${x * PX},${y * PX};${(x - 16) * PX},${(y + 9) * PX};${(x - 16) * PX},${(y + 9) * PX}" keyTimes="0;0.08;1" dur="${d}s" begin="${i * 2.3}s" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values="0;1;0;0" keyTimes="0;0.02;0.08;1" dur="${d}s" begin="${i * 2.3}s" repeatCount="indefinite"/></g>`;
  }

  return {
    defs: glowDef('lampglow', '#ffd27a', 0.8) + glowDef('neb', L.neb, 0.8) +
      `<radialGradient id="terminator" cx="72%" cy="70%" r="65%"><stop offset="0.35" stop-color="#0a0a24" stop-opacity="0.4"/><stop offset="0.75" stop-color="#0a0a24" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="tail" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="1" stop-color="#9ad0ff" stop-opacity="0"/></linearGradient>`,
    body: skyBands(L.sky, GH) + neb + stars(R, L.stars, GH) + shooting + comet + far.rects() + rocks + orbit(false) + base.rects() + spin + shade + walker + orbit(true),
    ink: L.ink, sub: L.sub, caption: L.caption, local: false,
    desc: 'Pixel art of a tiny planet in space with a kid in a red scarf walking on top as it turns beneath them, bringing round a cottage with a smoking chimney, trees, a spinning windmill, a lamp post, a well and flowers. A pocket moon circles it. Behind: a ringed planet, a small moon, drifting rocks and a comet.',
  };
}
