/* sky islands
 *
 * Islands of grass and rock hang over a sea of cloud. The big one has a
 * cottage and a waterfall pouring off its edge into the clouds; a rope
 * bridge sways across to a smaller one with a windmill. They bob, slowly and
 * out of step. A whale swims through the sky behind them, tail rolling.
 * After dark, crystals under the islands glow, lanterns light the bridge and
 * the whale's spots shine.
 */
import { r2, rng, mix, Grid, cellRects, PX, GW, GH, SW, SH, skyBands, stars, birds, clouds, glowDef } from '../lib.mjs';

const PAL = {
  dawn:  { sky: ['#6f8fd8', '#9a9ad8', '#c8a2d0', '#eeb0bc', '#fac4a8', '#fedcb0'], cloud: '#fff2f0', cloudShade: '#f0c8d0', grass: ['#7cc46a', '#9ad680', '#5ea852'], rock: ['#a8866e', '#8a6c58', '#c4a088'], whale: ['#7a8cc8', '#c8d4f4', '#5a6aa8'], ink: '#2a2350', sub: '#4a3d73', caption: '#3a3050', glow: 0.3, birds: '#5a5070' },
  day:   { sky: ['#4aa8f0', '#5eb4f2', '#76c0f4', '#8ecbf6', '#a8d8f8', '#c4e4fa'], cloud: '#ffffff', cloudShade: '#dceefa', grass: ['#6cd04a', '#8ee468', '#4eb43c'], rock: ['#b48a68', '#946e52', '#d0a684'], whale: ['#5a7ac8', '#d6e4fa', '#3e5aa8'], ink: '#0e2a47', sub: '#1d4a70', caption: '#2a4a6a', glow: 0, birds: '#2b4a66' },
  dusk:  { sky: ['#4a5cb8', '#7860b0', '#b0689e', '#e07c82', '#f8a06a', '#fec880'], cloud: '#ffd8c0', cloudShade: '#eaa0a0', grass: ['#a0b452', '#bccc66', '#829a44'], rock: ['#9a6a54', '#7a5040', '#b88468'], whale: ['#6a5aa0', '#f0c8d0', '#4a3a80'], ink: '#2b1c48', sub: '#4d2f5e', caption: '#3a2a4a', glow: 0.6, birds: '#3d2a48' },
  night: { sky: ['#0b1236', '#101942', '#16204e', '#1c285a', '#233166', '#2b3a72'], cloud: '#3a4a7e', cloudShade: '#2c3a66', grass: ['#2e5a4a', '#3a6c58', '#24483c'], rock: ['#4a4058', '#3a3248', '#5a5068'], whale: ['#28386e', '#5a6aa8', '#1c2858'], ink: '#f1f4ff', sub: '#c4cfe8', caption: '#dfe8f5', glow: 1, stars: true },
};

function island(g, cx, top, w, depth, L, rand, tuft = true) {
  // grass cap
  for (let x = -w; x <= w; x++) {
    const y = top + Math.round(Math.abs(x) > w - 2 ? 1 : 0);
    g.box(cx + x, y, cx + x, y + 1, L.grass[(x + cx) % 5 === 0 ? 1 : 0]);
    if (tuft && rand() < 0.25) g.put(cx + x, y - 1, L.grass[1]);
  }
  // rocky underside tapering to a point
  for (let d = 2; d <= depth; d++) {
    const half = Math.round(w * (1 - (d / depth) ** 1.4) + rand() * 1.4);
    for (let x = -half; x <= half; x++) {
      const c = d % 4 === 0 ? L.rock[1] : x > half / 2 ? L.rock[1] : x < -half / 2 ? L.rock[2] : L.rock[0];
      g.put(cx + x, top + d, c);
    }
  }
}

export function skyIslands(phase) {
  const L = PAL[phase];
  const R = rng(4242);

  // Two cloud seas scrolling at different speeds below everything.
  const sea = (y0, col, shade, dur, seed) => {
    const g = new Grid(GW * 2, GH), r = rng(seed);
    for (let x = 0; x < GW * 2; x++) {
      const top = Math.round(y0 + 2 * Math.sin((2 * Math.PI * x * 3) / GW) + 1.5 * Math.sin((2 * Math.PI * x * 7) / GW + 1));
      g.box(x, top, x, GH - 1, col); g.put(x, top + 2, shade);
    }
    return `<g>${g.rects()}<animateTransform attributeName="transform" type="translate" values="0,0;${-GW * PX},0" dur="${dur}s" repeatCount="indefinite"/></g>`;
  };

  // The sky whale, swimming slowly west behind the islands.
  const whale = new Grid();
  const wx = 20, wy = 16;
  for (let x = 0; x < 34; x++) {
    const half = Math.round(5.5 * Math.sin(Math.PI * Math.min(1, (x + 2) / 30)) ** 0.8);
    for (let y = -half; y <= half; y++) whale.put(wx + x, wy + y, y > half / 3 ? L.whale[1] : L.whale[0]);
  }
  for (let x = 0; x < 30; x += 3) whale.put(wx + 4 + x, wy + 3, L.whale[2]);
  whale.put(wx + 4, wy - 1, '#ffffff'); whale.put(wx + 4, wy, '#1a1a2a');
  whale.box(wx + 12, wy + 4, wx + 15, wy + 6, L.whale[0]); whale.box(wx + 13, wy + 7, wx + 14, wy + 7, L.whale[0]);
  const spots = [[10, -3], [16, -4], [22, -3], [27, -2], [14, -1], [20, -1]].map(([x, y]) => [wx + x, wy + y]);
  for (const [x, y] of spots) whale.put(x, y, phase === 'night' ? '#9af0ff' : mix(L.whale[0], '#ffffff', 0.25));
  const fluke = new Grid();
  fluke.box(wx + 33, wy - 1, wx + 35, wy + 1, L.whale[0]); fluke.box(wx + 36, wy - 4, wx + 37, wy - 2, L.whale[0]); fluke.box(wx + 36, wy + 2, wx + 37, wy + 4, L.whale[0]);
  const fpiv = `${(wx + 33) * PX} ${wy * PX}`;
  const whaleG = `<g transform="translate(${-10 * PX},0)">${whale.rects()}<g>${fluke.rects()}<animateTransform attributeName="transform" type="rotate" values="-12 ${fpiv};12 ${fpiv};-12 ${fpiv}" dur="2.6s" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"/></g>` +
    (phase === 'night' ? `<circle cx="${(wx + 18) * PX}" cy="${(wy - 2) * PX}" r="120" fill="url(#crystal)" opacity="0.25"/>` : '') +
    `<animateTransform attributeName="transform" type="translate" values="${SW},6;${SW * 0.4},-4;${-60 * PX},8" dur="70s" begin="-30s" repeatCount="indefinite"/></g>`;

  // Islands. The big one and the small one share a bob so the bridge holds.
  const big = new Grid(), small = new Grid(), tiny = new Grid();
  island(big, 122, 34, 26, 20, L, R);
  island(small, 58, 42, 13, 12, L, R);
  island(tiny, 164, 20, 7, 7, L, R);
  // cottage, pines, and a pond with the waterfall's source on the big island
  big.box(110, 27, 119, 33, '#f6e6c8'); big.box(117, 27, 119, 33, '#e0c8a0');
  for (let y = 0; y < 5; y++) big.box(109 + y, 26 - y, 120 - y, 26 - y, y % 2 ? '#3a6ab0' : '#4a7ac8');
  big.box(113, 30, 114, 33, '#6a4428'); big.put(117, 29, phase === 'night' || phase === 'dusk' ? '#ffd27a' : '#9ad0f0');
  big.box(118, 19, 118, 22, '#5a5a6a');
  for (const [tx, h] of [[130, 8], [136, 6], [141, 9], [127, 5]]) {
    big.box(tx, 33 - 2, tx, 33, '#6a4428');
    for (let k = 0; k < h; k++) { const half = Math.floor((h - k) / 2.2); big.box(tx - half, 31 - k, tx + half, 31 - k, L.grass[2]); }
  }
  big.box(143, 33, 147, 33, '#5ab4e8');
  // windmill on the small island
  small.box(56, 33, 59, 41, '#f0e6d8'); small.box(55, 32, 60, 32, '#c84a3a'); small.box(57, 38, 58, 41, '#7a4a2a');
  // a lone tree on the tiny island
  tiny.box(164, 16, 164, 19, '#6a4428'); for (let y = -2; y <= 2; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y < 9) tiny.put(164 + x, 13 + y, L.grass[x < 0 ? 1 : 2]);

  // Crystals glowing under the islands after dark.
  for (const [x, y] of [[118, 48], [126, 50], [122, 53], [56, 50], [62, 49], [164, 25]]) { (x > 100 ? (x > 150 ? tiny : big) : small).box(x, y, x + 1, y + 2, '#7af0ff'); }
  const crystals = L.glow ? [[118, 49], [126, 51], [122, 54], [56, 51], [62, 50]].map(([x, y]) => `<circle cx="${x * PX}" cy="${y * PX}" r="30" fill="url(#crystal)" opacity="${L.glow}"><animate attributeName="opacity" values="${L.glow};${r2(L.glow * 0.5)};${L.glow}" dur="${r2(2 + (x % 3) * 0.6)}s" repeatCount="indefinite"/></circle>`).join('') : '';

  // The waterfall: a scrolling stripe tile clipped to a column off the east edge.
  const fall = new Grid();
  const FX0 = 146, FX1 = 148, FT = 34;
  const wcol = ['#e8f6ff', '#ffffff', '#b8e0f8', '#d4ecfc'];
  for (let x = FX0; x <= FX1; x++) for (let y = FT - 4; y < GH; y++) fall.put(x, y, wcol[(y + x * 2) % 4]);
  const waterfall = `<g clip-path="url(#fall)"><g>${fall.rects()}<animateTransform attributeName="transform" type="translate" values="0,0;0,${4 * PX}" dur="0.35s" repeatCount="indefinite"/></g></g>` +
    `<rect x="${(FX0 - 1) * PX}" y="${(GH - 14) * PX}" width="${5 * PX}" height="${3 * PX}" fill="#ffffff" opacity="0.8"><animate attributeName="opacity" values="0.8;0.3;0.8" dur="0.6s" repeatCount="indefinite"/></rect>`;

  // Rope bridge between the big and small islands, with lanterns.
  const b0 = [71, 42], b1 = [96, 35];
  let plank = '', lamps = '';
  for (let i = 0; i <= 25; i++) {
    const t = i / 25, x = b0[0] + (b1[0] - b0[0]) * t, y = b0[1] + (b1[1] - b0[1]) * t + 4 * Math.sin(Math.PI * t);
    plank += `<rect x="${r2(x * PX)}" y="${r2(y * PX)}" width="4" height="${i % 2 ? 4 : 3}" fill="${i % 2 ? '#8a5a30' : '#a8743a'}"/>`;
    if (L.glow && i % 8 === 4) lamps += `<circle cx="${r2(x * PX)}" cy="${r2((y - 3) * PX)}" r="16" fill="url(#lantern)"/><rect x="${r2(x * PX - 2)}" y="${r2((y - 3.5) * PX)}" width="5" height="5" fill="#ffd27a"/>`;
  }
  const rope = `<path d="M${b0[0] * PX} ${(b0[1] - 4) * PX} Q ${((b0[0] + b1[0]) / 2) * PX} ${((b0[1] + b1[1]) / 2) * PX} ${b1[0] * PX} ${(b1[1] - 4) * PX}" stroke="#7a5a3a" stroke-width="1.5" fill="none"/>`;
  const blade = (hx, hy) => `<g>${[0, 90, 180, 270].map((a) => `<rect x="${hx - 2}" y="${hy - 30}" width="5" height="28" fill="#f6efe2" stroke="#b8a890" transform="rotate(${a} ${hx} ${hy})"/>`).join('')}<animateTransform attributeName="transform" type="rotate" values="0 ${hx} ${hy};360 ${hx} ${hy}" dur="4s" repeatCount="indefinite"/></g>`;

  const bob = (inner, a, d, b) => `<g>${inner}<animateTransform attributeName="transform" type="translate" values="0,0;0,${a};0,0" dur="${d}s" begin="${b}s" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"/></g>`;
  const pair = bob(small.rects() + blade(57.5 * PX, 33 * PX) + rope + plank + lamps + big.rects() + waterfall + crystals, 6, 7, 0);
  const lone = bob(tiny.rects(), 5, 5, -2);

  return {
    defs: `<clipPath id="fall"><rect x="${FX0 * PX}" y="${FT * PX}" width="${(FX1 - FX0 + 1) * PX}" height="${SH}"/></clipPath>` + glowDef('crystal', '#7af0ff', 0.8) + glowDef('lantern', '#ffcf73', 0.8),
    body: skyBands(L.sky, GH) + (L.stars ? stars(R, 90, 50) : '') + clouds(R, [[20, 10, 16, 140], [140, 6, 12, 120], [90, 24, 10, 100]], L.cloud, L.cloudShade, 0.8) +
      whaleG + sea(56, mix(L.cloud, L.sky[5], 0.3), L.cloudShade, 90, 3) + lone + pair + sea(62, L.cloud, L.cloudShade, 50, 9) + (L.birds ? birds(L.birds, 4, 30, 32) : ''),
    ink: L.ink, sub: L.sub, caption: L.caption, local: false,
    desc: `Pixel art of floating islands over a sea of clouds: a big island with a cottage, pines and a waterfall pouring off its edge, a rope bridge to a smaller island with a spinning windmill, and a tiny one with a single tree, all gently bobbing, while a whale swims through the sky behind them${L.glow ? '; crystals glow under the islands and lanterns light the bridge' : ''}.`,
  };
}
