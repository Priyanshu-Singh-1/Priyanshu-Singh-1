/* chitrakote
 *
 * Chitrakote falls on the Indravati, in Bastar: Chhattisgarh's own wide
 * horseshoe of water. The river slides over a curved basalt lip in four
 * streams, the water really falls (a striped tile scrolling down behind a
 * clip), the plunge pool churns and throws up mist, and by day a pixel
 * rainbow stands in the spray. Sal forest on both cliffs, egrets overhead,
 * a doongi rocking on the pool. At night: moonlit water, fireflies.
 */
import { P, r2, rng, mix, Grid, cellRects, PX, GW, GH, SW, SH, skyBands, stars, birds, fireflies, glowDef } from '../lib.mjs';

const LIP = 31, BASE = 57;
const STREAMS = [[24, 46], [53, 85], [93, 123], [130, 150]];
const lip = (x) => LIP + Math.round(7 * ((x - 88) / 62) ** 2);

const PAL = {
  day: {
    sky: ['#4fb0ee', '#68bcf1', '#83c8f3', '#a0d4f5', '#bde0f7'],
    sun: { x: 150, y: 7, r: 4, c: '#fff6d2', rim: '#ffe28a' },
    forest: ['#2f6f4a', '#3f8a58', '#5aa866'], river: '#4e9ec8', riverHi: '#c4e8f8',
    rock: ['#7a4e34', '#94603e', '#5e3b28', '#b07a4c'], water: ['#cfe9f6', '#e9f7fd', '#ffffff', '#9fcbe3'],
    pool: '#4fa3cb', poolDark: '#3a86b0', poolHi: '#d4eef9', foam: '#ffffff', boulder: ['#4a4a54', '#5f5f6a', '#363640'],
    leaf: ['#1f5f36', '#2c7a43', '#43984f', '#68b85d'], boat: '#7a4a2a', mist: 0.55,
    ink: '#0e2a47', sub: '#1d4a70', caption: '#f4f8fb', shadow: '#1b3a52', rainbow: 0.42, birds: '#ffffff',
  },
  dawn: {
    sky: ['#90b2e2', '#b8b6dc', '#ddbad0', '#f5c4b8', '#fdd8ac'],
    sun: { x: 22, y: 21, r: 4, c: '#ffe7b0', rim: '#ffc88a' },
    forest: ['#4a6e5a', '#5a8466', '#76a07a'], river: '#8fa6d0', riverHi: '#ffe6d0',
    rock: ['#7e5444', '#98664e', '#62403a', '#b4805e'], water: ['#e6e2ef', '#f6f0f6', '#ffffff', '#b8b8d4'],
    pool: '#94a8d2', poolDark: '#7a8ebc', poolHi: '#ffe8dc', foam: '#fff8f4', boulder: ['#55505e', '#686272', '#423e4a'],
    leaf: ['#2a5a3e', '#3a7048', '#558a58', '#7aa86a'], boat: '#6e4630', mist: 0.75,
    ink: '#2a2350', sub: '#4a3d73', caption: '#fff8f2', shadow: '#4a3d5a', rainbow: 0.3, birds: '#fff6f0',
  },
  dusk: {
    sky: ['#5a70c2', '#8a74b8', '#c47ea2', '#ef9282', '#fdb86e'],
    sun: { x: 160, y: 20, r: 6, c: '#fff0b0', rim: '#ffb554' },
    forest: ['#3a4a32', '#4e6038', '#6e7c44'], river: '#c89a8e', riverHi: '#ffd896',
    rock: ['#7a4430', '#94583a', '#5a3224', '#b87444'], water: ['#ffe2c6', '#fff1de', '#fffaf0', '#e6b8a0'],
    pool: '#c4948e', poolDark: '#a87a7a', poolHi: '#ffe0b0', foam: '#fff6ea', boulder: ['#4a3a40', '#5e4a50', '#382c32'],
    leaf: ['#2a4a2a', '#3a6032', '#567a3a', '#7e9a46'], boat: '#5e3a24', mist: 0.5,
    ink: '#2b1c48', sub: '#4d2f5e', caption: '#fff4e6', shadow: '#4a2a3a', rainbow: 0, birds: '#3d2a48',
  },
  night: {
    sky: ['#0f1c40', '#152650', '#1c305e', '#243a6c', '#2c4579'],
    moon: { x: 148, y: 8, r: 4 },
    forest: ['#12243a', '#18304a', '#1f3c56'], river: '#2c4878', riverHi: '#b8c8ee',
    rock: ['#3a3442', '#4a4252', '#2c2834', '#5a5064'], water: ['#9fb4d8', '#c4d4ee', '#e6eeff', '#7890b8'],
    pool: '#2c4a7c', poolDark: '#22396a', poolHi: '#c8d6f4', foam: '#dfe8ff', boulder: ['#1c2230', '#262e3e', '#141a26'],
    leaf: ['#0e2420', '#14322a', '#1c4034', '#26503f'], boat: '#2a1e17', mist: 0.32,
    ink: '#f1f4ff', sub: '#c4cfe8', caption: '#dfe8f5', shadow: '#0c1430', rainbow: 0, stars: true, fireflies: true,
  },
};

function canopy(g, blobs, L, rand) {
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    let best = null;
    for (const [cx, cy, r] of blobs) { const d = Math.hypot(x - cx, y - cy); if (d <= r && (!best || d / r < best.k)) best = { cx, cy, r, d, k: d / r }; }
    if (!best || (best.d > best.r - 1.2 && rand() < 0.35)) continue;
    const light = -0.55 * (x - best.cx) / best.r - 0.85 * (y - best.cy) / best.r + (rand() - 0.5) * 0.5;
    g.put(x, y, L.leaf[Math.max(0, Math.min(3, Math.floor((light + 1) * 2)))]);
  }
}

export function chitrakote(phase) {
  const L = PAL[phase];
  const R = rng(1986);
  const g = new Grid();

  if (L.sun) { g.disc(L.sun.x, L.sun.y, L.sun.r + 1, L.sun.rim); g.disc(L.sun.x, L.sun.y, L.sun.r, L.sun.c); }
  if (L.moon) { g.disc(L.moon.x, L.moon.y, L.moon.r, '#f6f1dc'); for (const [dx, dy] of [[-1, -1], [1, 1], [2, -1]]) g.put(L.moon.x + dx, L.moon.y + dy, '#ddd5b8'); }

  // Far forest ridge, then the river running toward the lip.
  for (let x = 0; x < GW; x++) {
    const t = Math.round(21 + 1.8 * Math.sin(x / 6.5) + 1.2 * Math.sin(x / 2.7 + 1) + 1.5 * Math.sin(x / 17));
    for (let y = t; y < 27; y++) g.put(x, y, L.forest[y - t < 2 ? 2 : y - t < 4 ? 1 : 0]);
  }
  for (let y = 27; y <= LIP + 8; y++) for (let x = 0; x < GW; x++) if (y < lip(x)) g.put(x, y, L.river);
  for (let i = 0; i < 40; i++) { const x = Math.floor(R() * GW), y = 27 + Math.floor(R() * 6); if (y < lip(x) - 1) { g.put(x, y, L.riverHi); g.put(x + 1, y, L.riverHi); } }

  // Cliff face: basalt strata below the lip, everywhere water isn't falling.
  for (let x = 0; x < GW; x++) for (let y = lip(x); y < BASE; y++) {
    const strata = (y + Math.round(Math.sin(x / 9) * 1.5)) % 5;
    g.put(x, y, strata === 0 ? L.rock[2] : (x + y * 3) % 11 === 0 ? L.rock[3] : L.rock[strata < 3 ? 0 : 1]);
  }

  // Rocky outcrops between the streams, with a little scrub on top.
  for (let k = 0; k < STREAMS.length - 1; k++) {
    const a = STREAMS[k][1] + 1, b = STREAMS[k + 1][0] - 1;
    for (let x = a; x <= b; x++) { const top = lip(x) - 2 - (x === a || x === b ? 0 : 1); g.box(x, top, x, lip(x), L.rock[1]); g.put(x, top - 1, L.leaf[2]); if ((x + k) % 2) g.put(x, top - 2, L.leaf[3]); }
  }

  // Plunge pool and foreground water.
  for (let y = BASE; y < GH; y++) for (let x = 0; x < GW; x++) {
    const d = y - BASE;
    g.put(x, y, d < 4 ? mix(L.foam, L.pool, d / 4) : L.pool);
  }
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(R() * GW), y = BASE + 4 + Math.floor(R() * (GH - BASE - 4)), w = 2 + Math.floor(R() * 4);
    g.box(x, y, x + w, y, R() < 0.5 ? L.poolDark : L.poolHi);
  }

  // Boulders at the bottom corners.
  for (const [cx, cy, rx, ry] of [[6, 68, 12, 5], [20, 70, 9, 4], [164, 67, 14, 6], [148, 70, 8, 3], [60, 71, 6, 2]])
    g.ellipse(cx, cy, rx, ry, (x, y) => (y < -ry / 3 ? L.boulder[1] : x > rx / 3 ? L.boulder[2] : L.boulder[0]));

  // Sal forest on both cliff tops, kept clear of the title.
  canopy(g, [[6, 30, 7], [16, 28, 6], [26, 31, 5], [2, 36, 6]], L, R);
  canopy(g, [[152, 26, 7], [163, 22, 8], [172, 27, 6], [144, 31, 5], [168, 33, 6]], L, R);

  // ── the falls ──
  // A striped tile, periodic in 8 rows, scrolls down behind a column clip.
  const water = new Grid();
  const ph = [];
  let acc = 0;
  for (let x = 0; x < GW; x++) { acc += (R() - 0.5) * 3; ph[x] = ((Math.round(acc) % 8) + 8) % 8; }
  const seq = [0, 0, 1, 2, 1, 0, 3, 0];
  for (const [a, b] of STREAMS) for (let x = a; x <= b; x++) for (let y = lip(x) - 8; y < BASE + 1; y++) water.put(x, y, L.water[seq[(y + ph[x]) % 8]]);
  let clip = '';
  for (const [a, b] of STREAMS) for (let x = a; x <= b; x++) clip += `<rect x="${x * PX}" y="${lip(x) * PX}" width="${PX}" height="${(BASE - lip(x) + 1) * PX}"/>`;
  const falls = `<g clip-path="url(#falls)"><g>${water.rects()}<animateTransform attributeName="transform" type="translate" values="0,0;0,${8 * PX}" dur="0.75s" repeatCount="indefinite"/></g></g>`;
  let sheen = '';
  for (const [a, b] of STREAMS) for (let x = a; x <= b; x++) {
    sheen += `<rect x="${x * PX}" y="${(lip(x) + 1) * PX}" width="${PX}" height="${4 * PX}" fill="${mix(L.river, L.water[0], 0.35)}" opacity="0.75"/>`;
    const edge = Math.min(x - a, b - x);
    if (edge < 3) sheen += `<rect x="${x * PX}" y="${lip(x) * PX}" width="${PX}" height="${(BASE - lip(x)) * PX}" fill="${L.rock[2]}" opacity="${r2(0.4 - edge * 0.12)}"/>`;
  }
  const lipFoam = STREAMS.map(([a, b]) => { let s = ''; for (let x = a; x <= b; x++) s += `<rect x="${x * PX}" y="${lip(x) * PX}" width="${PX}" height="${PX}" fill="${L.foam}"/>`; return s; }).join('');

  // Foam where the water hits, flickering.
  let foam = '';
  for (let i = 0; i < 26; i++) {
    const [a, b] = STREAMS[i % 4];
    const x = a + Math.floor(R() * (b - a)), y = BASE - 1 + Math.floor(R() * 3);
    foam += `<rect x="${x * PX}" y="${y * PX}" width="${(2 + Math.floor(R() * 3)) * PX}" height="${PX}" fill="${L.foam}"><animate attributeName="opacity" values="1;0.2;1" dur="${r2(0.6 + R() * 0.8)}s" begin="${r2(R())}s" repeatCount="indefinite"/></rect>`;
  }

  // Spray: soft clouds of mist rising from the pool.
  let mist = '';
  for (let i = 0; i < 9; i++) {
    const x = (34 + i * 13) * PX, y = (BASE - 2) * PX, dur = r2(5 + R() * 3), begin = -r2(R() * dur);
    mist += `<ellipse cx="${x}" cy="${y}" rx="${r2(60 + R() * 40)}" ry="${r2(22 + R() * 10)}" fill="${L.foam}" opacity="0">` +
      `<animate attributeName="opacity" values="0;${L.mist};0" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>` +
      `<animateTransform attributeName="transform" type="translate" values="0,10;6,-34" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></ellipse>`;
  }
  const haze = `<rect x="0" y="${(BASE - 9) * PX}" width="${SW}" height="${14 * PX}" fill="url(#spray)" opacity="${L.mist}"/>`;

  // A pixel rainbow in the spray, when the sun is out.
  let rainbow = '';
  if (L.rainbow) {
    const rb = new Grid(), cx = 88, cy = 70, bands = ['#ff4d4d', '#ff9a3c', '#ffe14d', '#5ed36a', '#4aa3ff', '#8a6bff'];
    for (let y = 30; y < BASE + 2; y++) for (let x = 40; x < 140; x++) {
      const d = Math.hypot((x - cx) / 1.15, y - cy), i = Math.floor(d - 30);
      if (i >= 0 && i < 6) rb.put(x, y, bands[i]);
    }
    rainbow = `<g opacity="${L.rainbow}">${rb.rects()}<animate attributeName="opacity" values="${L.rainbow};${r2(L.rainbow * 0.55)};${L.rainbow}" dur="6s" repeatCount="indefinite"/></g>`;
  }

  // The doongi, rocking, with a boatman and his pole.
  const boat = new Grid();
  boat.box(112, 64, 128, 64, L.boat); boat.box(113, 65, 127, 65, mix(L.boat, '#000000', 0.3)); boat.put(111, 63, L.boat); boat.put(129, 63, L.boat);
  boat.box(119, 59, 121, 63, '#f2ede2'); boat.box(119, 58, 121, 58, '#c68a5a'); boat.box(119, 57, 121, 57, '#d04a3a');
  boat.line(123, 52, 117, 68, '#a8743a');
  const piv = `${120 * PX} ${64 * PX}`;
  const boatG = `<g transform="rotate(1.5 ${piv})">${boat.rects()}<animateTransform attributeName="transform" type="rotate" values="-2.5 ${piv};2.5 ${piv};-2.5 ${piv}" dur="3.2s" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"/></g>`;
  let rings = '';
  for (let i = 0; i < 2; i++) rings += `<ellipse cx="${120 * PX}" cy="${66 * PX}" rx="60" ry="8" fill="none" stroke="${L.poolHi}" stroke-width="2" opacity="0"><animate attributeName="rx" values="50;110" dur="3.2s" begin="${i * 1.6}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="3.2s" begin="${i * 1.6}s" repeatCount="indefinite"/></ellipse>`;

  const halo = L.sun ? `<circle cx="${L.sun.x * PX}" cy="${L.sun.y * PX}" r="${L.sun.r * PX * 5}" fill="url(#halo)" opacity="0.6"/>`
    : `<circle cx="${L.moon.x * PX}" cy="${L.moon.y * PX}" r="${L.moon.r * PX * 5}" fill="url(#halo)" opacity="0.4"/>`;

  return {
    defs: `<clipPath id="falls">${clip}</clipPath>` + glowDef('halo', L.sun ? L.sun.rim : '#cfd8ff') +
      `<linearGradient id="spray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.foam}" stop-opacity="0"/><stop offset="0.6" stop-color="${L.foam}" stop-opacity="0.7"/><stop offset="1" stop-color="${L.foam}" stop-opacity="0"/></linearGradient>`,
    body: skyBands(L.sky, 27) + halo + (L.stars ? stars(R, 60, 20) : '') + g.rects() + falls + sheen + lipFoam + foam + rainbow + haze + mist + rings + boatG +
      (L.birds ? birds(L.birds, 4, 8, 30) : '') + (L.fireflies ? fireflies(R, 22, [24, 40], [0, 176]) : ''),
    ink: L.ink, sub: L.sub, caption: L.caption, shadow: L.shadow,
    desc: `Pixel art of Chitrakote falls on the Indravati in Bastar, Chhattisgarh: a wide horseshoe of water pouring over a basalt lip in four streams into a churning pool, mist rising${L.rainbow ? ', a rainbow in the spray' : ''}, sal forest on both cliffs and a boatman in a small wooden boat rocking on the pool${L.fireflies ? ', under the moon with fireflies' : ''}.`,
  };
}
