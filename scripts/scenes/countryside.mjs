/* countryside
 *
 * An afternoon outside Bhilai, in 5px pixels. Paddy fields, a tiled hut with
 * a haystack and marigolds, a pond with lotus and two ducks, a mango tree
 * with a kid on a swing, a charpai with chai and a book, a dog asleep next
 * to it. Kites over the hills, birds, drifting clouds. After dark: the moon,
 * fireflies and a lantern by the door.
 *
 * Lit for the hour in IST, so it changes four times a day.
 */

import { P, PIXEL, MONO, esc, r2, rng, mix, Grid, cellRects, PX, GW, GH, SW, SH, skyBands, stars, clouds, birds, wisp, fireflies, glowDef } from '../lib.mjs';

const HORIZON = 44;

const PAL = {
  day: {
    sky: ['#3fa7ec', '#55b2ef', '#6cbdf1', '#86c9f3', '#a1d5f5', '#bce1f7', '#d7edf9'],
    cloud: '#ffffff', cloudShade: '#d6eaf8',
    hillFar: '#9dcac6', hillMid: '#6db57a', hillTree: '#4f9a5c',
    field: ['#8ad552', '#77c648'], fieldDark: '#5aa83a', bund: '#aee07a', path: '#e6c88e', pathEdge: '#c9ab6e',
    pond: '#5cbbe8', pondTop: '#bfe6f8', pondDeep: '#3b95c8', pondHi: '#e9f8ff',
    pad: '#3f9a48', padDark: '#2c7a38', lotus: '#ff8fb8', lotusHi: '#ffe0ec',
    trunk: '#7a4b2a', trunkDark: '#583520', leaf: ['#1f6d37', '#2c8a43', '#43a851', '#6cc463'], mango: '#ffb627',
    wall: '#f3d6ab', wallShade: '#d7b383', roof: '#d45a2e', roofDark: '#a8402a', door: '#6b4428', window: '#5a3a22',
    hay: '#f4c650', hayDark: '#cf9a2e', flowers: ['#ff9f1c', '#ffd23f', '#ff5e7e'],
    rope: '#e4cf9f', wood: '#8a5a30', weave: ['#ecd7a6', '#cfb27c'],
    ink: '#0e2a47', sub: '#1d4a70', caption: '#123a22',
    sign: '#b98048', signDark: '#8a5a30', signInk: '#fff7e8',
    sun: { x: 120, y: 9, r: 5, c: '#fff6d2', rim: '#ffe28a', halo: 0.35 },
    birds: '#28405e', kites: true, kid: true, ducks: true,
  },
  dawn: {
    sky: ['#86aee3', '#a3b5e1', '#c8b8da', '#ebbcc8', '#f8c8ad', '#fcd8a4', '#fee8bd'],
    cloud: '#fff1ea', cloudShade: '#efc9cf',
    hillFar: '#b4aacb', hillMid: '#86ab8b', hillTree: '#6c9474',
    field: ['#9ccf6f', '#8bc162'], fieldDark: '#71a64f', bund: '#c3e293', path: '#ecd0a6', pathEdge: '#cdb085',
    pond: '#a9bfe4', pondTop: '#ffe2c8', pondDeep: '#8aa4d0', pondHi: '#fff3e2',
    pad: '#4c9a52', padDark: '#367c40', lotus: '#ff9cc0', lotusHi: '#ffe6ef',
    trunk: '#6e4630', trunkDark: '#4f3222', leaf: ['#2a5f3e', '#367849', '#4e9255', '#77ad6a'], mango: '#ffbf4a',
    wall: '#f1d2b2', wallShade: '#d3ad8c', roof: '#cf5a3a', roofDark: '#a3442f', door: '#5f3d27', window: '#ffcf7a',
    hay: '#f0c46a', hayDark: '#c99843', flowers: ['#ff9f3c', '#ffd35a', '#ff6f8e'],
    rope: '#e6d0ad', wood: '#83563a', weave: ['#efd8b4', '#d1b28b'],
    ink: '#2a2350', sub: '#4a3d73', caption: '#2f3a28',
    sign: '#b98048', signDark: '#8a5a30', signInk: '#fff7e8',
    sun: { x: 54, y: 33, r: 6, c: '#ffe7b0', rim: '#ffc88a', halo: 0.75 },
    birds: '#4a4366', kites: true, kid: true, ducks: true, mist: true, lantern: true,
  },
  dusk: {
    sky: ['#5871c4', '#7f73bd', '#b878ab', '#e88b8c', '#f9a672', '#fdc36b', '#fedd8f'],
    cloud: '#ffd8b8', cloudShade: '#f1a69b',
    hillFar: '#9d82aa', hillMid: '#7e9a5d', hillTree: '#61804a',
    field: ['#b6c657', '#a4b74b'], fieldDark: '#899b3c', bund: '#d6de7e', path: '#efc58e', pathEdge: '#cea06a',
    pond: '#d0a6b8', pondTop: '#ffd08a', pondDeep: '#a9849e', pondHi: '#fff0c8',
    pad: '#5a8a3e', padDark: '#476e30', lotus: '#ff8fae', lotusHi: '#ffe0e6',
    trunk: '#5e3a26', trunkDark: '#43291b', leaf: ['#2c4f2c', '#3c6634', '#5a823c', '#86a548'], mango: '#ffb02e',
    wall: '#f3c99a', wallShade: '#cf9f72', roof: '#c8502c', roofDark: '#963a25', door: '#4f3020', window: '#ffc86b',
    hay: '#f6c04a', hayDark: '#c88d2a', flowers: ['#ff8c1a', '#ffc93c', '#ff5e7e'],
    rope: '#e8c98f', wood: '#7c4e2c', weave: ['#f0d29a', '#cfa970'],
    ink: '#2b1c48', sub: '#4d2f5e', caption: '#3a2a10',
    sign: '#b07440', signDark: '#7f522c', signInk: '#fff4e0',
    sun: { x: 100, y: 33, r: 7, c: '#fff0b0', rim: '#ffb554', halo: 0.9 },
    birds: '#3d2a48', kites: true, kid: true, ducks: true, lantern: true,
  },
  night: {
    sky: ['#0f1c40', '#14244c', '#1a2c58', '#203565', '#273f72', '#2f4a7e', '#38558a'],
    cloud: '#3c5283', cloudShade: '#2e416d',
    hillFar: '#26395f', hillMid: '#1e3d3d', hillTree: '#173232',
    field: ['#245039', '#204833'], fieldDark: '#1a3d2b', bund: '#2f6247', path: '#5d5b52', pathEdge: '#4a4a44',
    pond: '#2a4377', pondTop: '#3e5a92', pondDeep: '#1f3566', pondHi: '#e6ebff',
    pad: '#1f4b33', padDark: '#173a28', lotus: '#c48aa6', lotusHi: '#e9c9d8',
    trunk: '#3b2a20', trunkDark: '#2a1e17', leaf: ['#0f2a22', '#163a2c', '#204a37', '#2c5c43'], mango: '#7a6a2a',
    wall: '#8e7e6e', wallShade: '#6e6052', roof: '#7c3c2c', roofDark: '#5a2b20', door: '#2a1e17', window: '#ffc86b',
    hay: '#8c7339', hayDark: '#6c5728', flowers: ['#a8743a', '#b0954a', '#a0566a'],
    rope: '#8a7c62', wood: '#4a3424', weave: ['#8c7a5c', '#6f604a'],
    ink: '#f1f4ff', sub: '#c4cfe8', caption: '#dfe6f7',
    sign: '#7a5634', signDark: '#553a22', signInk: '#ffe9c4',
    moon: { x: 118, y: 9, r: 5 },
    stars: true, fireflies: true, lantern: true,
  },
};


function paintLand(g, L, rand) {
  // Sun or moon first: low suns sit behind the hills.
  if (L.sun) { g.disc(L.sun.x, L.sun.y, L.sun.r + 1, L.sun.rim); g.disc(L.sun.x, L.sun.y, L.sun.r, L.sun.c); }
  if (L.moon) {
    g.disc(L.moon.x, L.moon.y, L.moon.r, '#f6f1dc');
    for (const [dx, dy] of [[-2, -1], [1, 2], [2, -2], [-1, 2]]) g.put(L.moon.x + dx, L.moon.y + dy, '#ddd5b8');
  }

  // Two ranges of low hills, the far one hazier, a few trees on the near one.
  for (let x = 0; x < GW; x++) {
    const far = Math.round(31 + 3.5 * Math.sin(x / 19 + 0.8) + 1.8 * Math.sin(x / 7.3 + 2));
    g.box(x, far, x, HORIZON - 1, L.hillFar);
  }
  for (let x = 0; x < GW; x++) {
    const mid = Math.round(37.5 + 2.6 * Math.sin(x / 12.5 + 2.4) + 1.2 * Math.sin(x / 4.9));
    g.box(x, mid, x, HORIZON - 1, L.hillMid);
    if (x % 9 === 3 || x % 13 === 0) { g.put(x, mid - 1, L.hillTree); g.put(x + 1, mid - 1, L.hillTree); g.put(x, mid - 2, L.hillTree); }
  }

  // Paddy in widening bands toward the viewer, with ridges (bunds) between them.
  let lastBand = -1;
  for (let y = HORIZON; y < GH; y++) {
    const d = y - HORIZON, band = Math.floor(Math.sqrt(d + 0.5) * 2.4);
    const ridge = band !== lastBand && d > 0;
    for (let x = 0; x < GW; x++) {
      g.put(x, y, ridge && (x + y) % 3 ? L.bund : L.field[band % 2]);
      if (!ridge && d > 4 && (x * 3 + y * 7) % (d > 14 ? 7 : 11) === 0) g.put(x, y, L.fieldDark);
    }
    lastBand = band;
  }

  // The pond, lighter where it mirrors the sky near the far bank.
  const pcx = 94, pcy = 61, rx = 22, ry = 5.4;
  for (let y = Math.floor(pcy - ry); y <= Math.ceil(pcy + ry); y++) for (let x = pcx - rx - 1; x <= pcx + rx + 1; x++) {
    const e = ((x - pcx) / rx) ** 2 + ((y - pcy) / ry) ** 2;
    if (e > 1) continue;
    const t = (y - (pcy - ry)) / (2 * ry);
    g.put(x, y, e > 0.82 ? L.pondDeep : mix(L.pondTop, L.pond, Math.min(1, t * 1.6)));
  }
  for (let i = 0; i < 9; i++) {
    const x = pcx - rx + 3 + Math.floor(rand() * (rx * 2 - 6)), y = pcy - 2 + Math.floor(rand() * 5);
    if (g.get(x, y) && g.get(x + 1, y)) { g.put(x, y, L.pondHi); if (rand() < 0.6) g.put(x + 1, y, L.pondHi); }
  }
  for (const [x, y, w] of [[80, 60, 3], [86, 63, 4], [101, 59, 3], [106, 62, 3], [93, 64, 3], [111, 61, 2]]) {
    g.box(x, y, x + w - 1, y, L.pad); g.put(x + 1, y, L.padDark);
  }
  for (const [x, y] of [[87, 62], [102, 58], [107, 61]]) {
    g.put(x - 1, y, L.lotus); g.put(x, y, L.lotus); g.put(x + 1, y, L.lotus); g.put(x, y - 1, L.lotusHi);
  }
  // reeds and a couple of cattails at the banks
  for (const [x, h] of [[72, 3], [73, 4], [74, 2], [116, 3], [117, 4], [115, 2]]) {
    g.box(x, 61 - h, x, 61, L.fieldDark);
    if (h === 4) g.put(x, 61 - h - 1, L.trunk);
  }

  // A path from the hut door out of the frame.
  for (let y = 51; y < GH; y++) {
    const t = (y - 51) / (GH - 51);
    const cx = 29 + 30 * Math.sqrt(t), w = 0.6 + t * 2.4;
    for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) g.put(x, y, Math.abs(x - cx) > w - 0.6 ? L.pathEdge : L.path);
  }

  // The hut: lime-washed walls, a terracotta tiled roof, a small chimney.
  g.box(18, 43, 40, 51, L.wall);
  g.box(37, 43, 40, 51, L.wallShade);
  for (let y = 36; y <= 43; y++) {
    const half = 7 + (y - 36);
    g.box(29 - half, y, 29 + half, y, (y - 36) % 2 ? L.roofDark : L.roof);
  }
  g.box(22, 35, 36, 35, L.roofDark);
  g.box(34, 32, 35, 35, L.roofDark);
  g.box(27, 46, 30, 51, L.door);
  g.box(20, 45, 23, 47, L.window); g.box(20, 44, 23, 44, L.wallShade);
  g.put(32, 46, L.lantern ? '#ffd27a' : '#8a6a3a'); g.put(32, 45, '#5a4030');

  // Haystack, golden and striped.
  for (let y = 44; y <= 51; y++) { const half = Math.round(Math.sqrt(Math.max(0, 1 - ((y - 51) / 7.5) ** 2)) * 5); g.box(47 - half, y, 47 + half, y, (y + 1) % 3 ? L.hay : L.hayDark); }
  g.put(47, 43, L.hayDark);

  // Marigolds and a few more flowers along the front of the hut.
  for (let x = 12; x <= 44; x++) {
    if (x >= 26 && x <= 31) continue;
    if (rand() < 0.55) { g.put(x, 53, L.fieldDark); g.put(x, 52, L.flowers[Math.floor(rand() * 3)]); }
  }

  // The kite flyer by the pond, one arm up holding the strings.
  if (L.kites) {
    g.box(59, 49, 60, 49, '#2a1a14'); g.box(59, 50, 60, 50, '#c68a5a');
    g.box(58, 51, 61, 53, '#ffd23f'); g.put(61, 50, '#c68a5a'); g.put(62, 49, '#c68a5a');
    g.box(58, 54, 58, 55, '#3a4a8a'); g.box(61, 54, 61, 55, '#3a4a8a');
  }

  // Mango tree: trunk, flare, bark, two limbs.
  g.box(147, 30, 151, 55, L.trunk);
  g.box(151, 30, 151, 55, L.trunkDark);
  g.box(145, 55, 153, 58, L.trunk); g.box(152, 55, 153, 58, L.trunkDark); g.put(144, 58, L.trunk); g.put(154, 58, L.trunkDark);
  for (const [x, y] of [[148, 37], [149, 43], [148, 49]]) g.put(x, y, L.trunkDark);
  g.line(148, 33, 133, 30, L.trunk); g.line(148, 32, 133, 29, L.trunk);
  g.line(151, 31, 166, 25, L.trunk);

  // Charpai under the tree, with a book and a glass of chai on it.
  g.box(154, 54, 172, 54, L.wood); g.box(154, 56, 172, 56, L.wood);
  for (let x = 154; x <= 172; x++) g.put(x, 55, L.weave[(x % 2)]);
  g.box(154, 57, 154, 59, L.wood); g.box(172, 57, 172, 59, L.wood);
  g.box(157, 53, 160, 53, '#f4efe2'); g.put(158, 53, '#d9cfb8'); g.put(156, 53, '#c84a3a');
  g.box(167, 52, 168, 53, '#c98b4a'); g.box(167, 52, 168, 52, '#f2ead8');

  // A dog asleep beside it.
  g.box(161, 60, 167, 62, '#c8853f'); g.box(160, 61, 160, 62, '#c8853f');
  g.box(162, 60, 166, 60, '#d99a55'); g.box(166, 61, 168, 62, '#b5733a');
  g.put(168, 62, '#2a1e17'); g.put(166, 60, '#8a5226'); g.put(160, 60, '#8a5226');
}

/** The canopy is its own layer so it can sway a pixel in the breeze. */
function paintCanopy(L, rand) {
  const g = new Grid();
  const blobs = [[138, 22, 10], [152, 15, 11], [165, 21, 10], [128, 28, 7], [158, 28, 9], [145, 27, 9], [172, 28, 6]];
  for (let y = 0; y < GH; y++) for (let x = 110; x < GW; x++) {
    let best = null;
    for (const [cx, cy, r] of blobs) { const d = Math.hypot(x - cx, y - cy); if (d <= r && (!best || d / r < best.k)) best = { cx, cy, r, d, k: d / r }; }
    if (!best) continue;
    if (best.d > best.r - 1.2 && rand() < 0.35) continue;      // ragged leafy edge
    const nx = (x - best.cx) / best.r, ny = (y - best.cy) / best.r;
    const light = -0.55 * nx - 0.85 * ny + (rand() - 0.5) * 0.5;
    g.put(x, y, L.leaf[Math.max(0, Math.min(3, Math.floor((light + 1) * 2)))]);
  }
  for (const [x, y] of [[134, 30], [141, 31], [155, 33], [162, 29], [148, 34], [169, 31]]) { g.put(x, y, L.mango); g.put(x, y + 1, mix(L.mango, '#c45a1a', 0.35)); }
  return g;
}

/** Swing, ropes, and (in daylight) a kid on it. Rotates about the branch. */
function paintSwing(L) {
  const g = new Grid();
  g.box(132, 31, 132, 49, L.rope); g.box(139, 31, 139, 49, L.rope);
  g.box(131, 50, 140, 50, L.wood);
  if (L.kid) {
    g.box(135, 42, 136, 42, '#2a1a14');               // hair
    g.box(135, 43, 136, 44, '#c68a5a');               // face
    g.box(134, 45, 137, 48, '#ff5e7e');               // kurta
    g.put(133, 45, '#c68a5a'); g.put(138, 45, '#c68a5a');
    g.box(137, 49, 140, 49, '#3a4a8a');               // legs out front
    g.put(141, 49, '#2a1e17');
  }
  return g;
}


export function countryside(phase) {
  const L = PAL[phase];
  const rand = rng(21_21_81_38);
  const g = new Grid();
  paintLand(g, L, rand);
  const canopy = paintCanopy(L, rng(77));
  const swing = paintSwing(L);
  const R = rng(9);
  const parts = [];

  const sky = skyBands(L.sky, HORIZON);

  const halo = L.sun ? `<circle cx="${L.sun.x * PX}" cy="${L.sun.y * PX}" r="${L.sun.r * PX * 4.5}" fill="url(#halo)" opacity="${L.sun.halo}"/>`
    : L.moon ? `<circle cx="${L.moon.x * PX}" cy="${L.moon.y * PX}" r="${L.moon.r * PX * 4}" fill="url(#halo)" opacity="0.35"/>` : '';
  const haloStop = L.sun ? L.sun.rim : '#cfd8ff';

  const starField = L.stars ? stars(R, 80, 36) : '';

  const cloudLayer = clouds(R, [[26, 12, 22, 150], [70, 20, 16, 120], [140, 6, 18, 170], [10, 33, 14, 110]], L.cloud, L.cloudShade, L.stars ? 0.5 : 0.95);

  // Kites over the hills, all three flown by a kid standing by the pond.
  // Strings are their own paths so the hand stays put while the kites bob.
  let kites = '';
  const hand = [61.5 * PX, 49.5 * PX];
  if (L.kites) [[64, 22, '#ffb627', '#ff7a1a', 6], [86, 15, '#ff4f8b', '#cf2f6c', 7.5], [106, 25, '#2ec4b6', '#178f86', 5.5]].forEach(([kx, ky, c1, c2, dur], i) => {
    const cells = [];
    for (let dy = -3; dy <= 3; dy++) { const w = 3 - Math.abs(dy); for (let dx = -w; dx <= w; dx++) cells.push([dx, dy, dx < 0 === dy < 0 ? c1 : c2]); }
    for (let dy = -3; dy <= 3; dy++) cells.push([0, dy, mix(c2, '#000000', 0.25)]);
    const tail = [[0, 4], [-1, 5], [0, 6], [1, 7], [0, 8]].map(([x, y], k) => [x, y, k % 2 ? c1 : '#ffffff']);
    const bob = [[0, 0], [6, -8], [-4, 3], [0, 0]], begin = -r2(i * 1.7);
    const d = ([ox, oy]) => { const sx = kx * PX + ox + 2, sy = (ky + 3.5) * PX + oy; return `M${r2(sx)} ${r2(sy)} Q ${r2((sx + hand[0]) / 2 + 10)} ${r2((sy + hand[1]) / 2 + 30)} ${hand[0]} ${hand[1]}`; };
    kites += `<path d="${d(bob[0])}" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.6"><animate attributeName="d" values="${bob.map(d).join(';')}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></path>` +
      `<g transform="translate(${kx * PX},${ky * PX})"><g>${cellRects(cells, c1)}<g>${cellRects(tail, c1)}<animateTransform attributeName="transform" type="translate" values="0,0;-3,1;2,0;0,0" dur="1.4s" repeatCount="indefinite"/></g>` +
      `<animateTransform attributeName="transform" type="translate" values="${bob.map(([x, y]) => `${x},${y}`).join(';')}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g></g>`;
  });

  const birdLayer = L.birds ? birds(L.birds) : '';

  // Ducks paddle across the pond and turn around.
  let ducks = '';
  if (L.ducks) [[90, 59, 26, 0], [99, 61, 32, -9]].forEach(([dx, dy, dur, begin]) => {
    const cells = [[-2, -1], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1, '#b9b2a2'], [0, 1, '#b9b2a2'], [1, 1, '#b9b2a2'], [2, 1, '#b9b2a2'],
      [2, -1], [2, -2], [3, -2], [3, -1], [4, -2, '#ffa31a'], [3, -2, '#2a2a2a']];
    ducks += `<g transform="translate(${dx * PX},${dy * PX})"><g>${cellRects(cells, '#ffffff')}` +
      `<animateTransform attributeName="transform" type="scale" values="1 1;-1 1" keyTimes="0;0.5" dur="${dur}s" begin="${begin}s" calcMode="discrete" repeatCount="indefinite"/></g>` +
      `<animateTransform attributeName="transform" type="translate" values="${(dx - 12) * PX},${dy * PX};${(dx + 10) * PX},${dy * PX};${(dx - 12) * PX},${dy * PX}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g>`;
  });

  // Ripples blink on the pond.
  let ripples = '';
  for (let i = 0; i < 5; i++) {
    const x = (80 + i * 7 + (i % 2) * 3) * PX, y = (59 + (i % 3) * 2) * PX;
    ripples += `<rect x="${x}" y="${y}" width="${2 * PX}" height="${PX}" fill="${L.pondHi}" opacity="0"><animate attributeName="opacity" values="0;0.8;0" dur="${r2(2.5 + i * 0.6)}s" begin="${r2(i * 0.7)}s" repeatCount="indefinite"/></rect>`;
  }

  // Smoke from the hut's chimney, steam off the chai.
  const smoke = wisp(34.5, 31, 4, 6, 26, -38, L.stars ? '#7d8aa8' : '#f4f1ec', 0.5, 2) + wisp(167.5, 51, 3, 2.6, 4, -24, '#ffffff', 0.8);

  // Zzz from the dog.
  let zzz = '';
  for (let k = 0; k < 3; k++) {
    zzz += `<text x="${170 * PX}" y="${59 * PX}" font-family="${PIXEL}" font-size="${9 + k * 2}" fill="${L.caption}" opacity="0">z` +
      `<animate attributeName="opacity" values="0;0.85;0" dur="3.6s" begin="${r2(k * 1.2)}s" repeatCount="indefinite"/>` +
      `<animateTransform attributeName="transform" type="translate" values="0,0;8,-26" dur="3.6s" begin="${r2(k * 1.2)}s" repeatCount="indefinite"/></text>`;
  }

  const flies = L.fireflies ? fireflies(R, 28) : '';

  // Warm light from the lantern and the window after the sun gets low.
  const lamp = L.lantern
    ? `<g style="mix-blend-mode:screen"><circle cx="${32.5 * PX}" cy="${46.5 * PX}" r="46" fill="url(#lamp)" opacity="${L.stars ? 0.9 : 0.6}"><animate attributeName="opacity" values="${L.stars ? '0.9;0.65;0.95;0.9' : '0.6;0.45;0.6'}" dur="3.2s" repeatCount="indefinite"/></circle>` +
      `<rect x="${20 * PX}" y="${45 * PX}" width="${4 * PX}" height="${3 * PX}" fill="#ffd27a" opacity="0.5"/></g>` : '';

  const mist = L.mist ? `<g opacity="0.45"><rect x="0" y="${(HORIZON - 1) * PX}" width="${SW}" height="${4 * PX}" fill="#fff4ec"/><rect x="0" y="${(HORIZON + 6) * PX}" width="${SW}" height="${2 * PX}" fill="#fff4ec" opacity="0.6"/>` +
    `<animate attributeName="opacity" values="0.45;0.25;0.45" dur="10s" repeatCount="indefinite"/></g>` : '';

  // Canopy sways a pixel; the swing swings about its branch.
  const canopyG = `<g>${canopy.rects()}<animateTransform attributeName="transform" type="translate" values="0,0;2,0;0,0;-1,0;0,0" dur="7s" repeatCount="indefinite"/></g>`;
  const piv = `${135.5 * PX} ${30 * PX}`;
  const swingG = `<g transform="rotate(6 ${piv})">${swing.rects()}<animateTransform attributeName="transform" type="rotate" values="-13 ${piv};13 ${piv};-13 ${piv}" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" dur="3.4s" repeatCount="indefinite"/></g>`;

  // A wooden signboard on the field, bottom left.
  const sx = 3 * PX, sy = 61 * PX, sw = 46 * PX, sh = 8 * PX;
  const sign = `<g>
<rect x="${sx + 5 * PX}" y="${sy + sh}" width="${PX}" height="${3 * PX}" fill="${L.signDark}"/><rect x="${sx + sw - 6 * PX}" y="${sy + sh}" width="${PX}" height="${3 * PX}" fill="${L.signDark}"/>
<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="${L.signDark}"/><rect x="${sx + PX}" y="${sy + PX}" width="${sw - 2 * PX}" height="${sh - 2 * PX}" fill="${L.sign}"/>
<rect x="${sx + PX}" y="${sy + PX * 3.6}" width="${sw - 2 * PX}" height="1" fill="${L.signDark}" opacity="0.5"/>
<text x="${sx + sw / 2}" y="${sy + 16}" text-anchor="middle" font-family="${PIXEL}" font-weight="700" font-size="11" fill="${L.signInk}">${esc(P.place.name.toLowerCase())}, ${esc(P.place.region.toLowerCase())}</text>
<text x="${sx + sw / 2}" y="${sy + 31}" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${L.signInk}" opacity="0.9">${P.place.lat.toFixed(2)}°N  ${P.place.lon.toFixed(2)}°E</text></g>`;

  return {
    defs: glowDef('halo', haloStop) + glowDef('lamp', '#ffb04a'),
    body: `${sky}${halo}${starField}${cloudLayer}${g.rects()}${mist}${ripples}${ducks}${smoke}${swingG}${canopyG}${kites}${birdLayer}${zzz}${lamp}${flies}${sign}`,
    ink: L.ink, sub: L.sub, caption: L.caption, coords: false,
    desc: `Pixel-art countryside outside ${P.place.name}, ${P.place.region}: paddy fields and low hills, a tiled hut with a haystack and marigolds, a pond with lotus${L.ducks ? ' and two ducks' : ''}, a mango tree with ${L.kid ? 'a kid on a swing' : 'an empty swing'}, a charpai with chai and a book, a sleeping dog${L.kites ? ', kites and birds overhead' : ''}${L.fireflies ? ', fireflies and the moon' : ''}.`,
  };
}
