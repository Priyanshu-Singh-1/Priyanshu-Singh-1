/* aurora
 *
 * A log cabin in snowy pines under big mountains. Snow drifts down. Smoke
 * curls from the chimney, the windows are warm, a snowman keeps watch, a kid
 * sleds down the hill again and again, and someone skates loops on the
 * frozen lake. Peaks blush at dusk. At night the aurora comes out: curtains
 * of green and violet rippling over the ridge.
 */
import { r2, rng, mix, Grid, cellRects, PX, GW, GH, SW, SH, skyBands, stars, glowDef, ridge } from '../lib.mjs';

const PAL = {
  dawn:  { sky: ['#4a5c9a', '#6a74b0', '#9a8ac0', '#c8a0c4', '#e8b8c4', '#f6d0c8'], peak: ['#e8e4f4', '#b8b4d8', '#8a88b8'], snow: ['#f4f2fa', '#d8d6ea', '#c0bede'], pine: ['#2e4a52', '#3a5c62'], ice: '#c8d4ec', aurora: 0, lit: 0.8, ink: '#2a2350', sub: '#4a3d73', caption: '#3a3a5a' },
  day:   { sky: ['#3a8ae0', '#4c9ae6', '#62aaec', '#7cbaf0', '#98caf4', '#b4daf8'], peak: ['#ffffff', '#d4e2f2', '#a8bcd8'], snow: ['#ffffff', '#e6eef8', '#cddbec'], pine: ['#1e5a3a', '#2a7048'], ice: '#bfe0f4', aurora: 0, lit: 0.1, ink: '#0e2a47', sub: '#1d4a70', caption: '#2a4a6a' },
  dusk:  { sky: ['#3a3a7a', '#5a4488', '#88508e', '#b8628c', '#e08088', '#f4a890'], peak: ['#ffd0c0', '#e8a0a8', '#a07898'], snow: ['#f6e6ea', '#dcc6d4', '#c0a8c0'], pine: ['#2a3a4a', '#344858'], ice: '#d0b8d0', aurora: 0, lit: 1, ink: '#fff2ec', sub: '#ffe0d6', caption: '#3a2a4a' },
  night: { sky: ['#030818', '#050c22', '#08122c', '#0b1836', '#0f1e40', '#14264a'], peak: ['#8a9ac0', '#5a6a90', '#3a4a6e'], snow: ['#9aa8c8', '#7a88aa', '#5e6c8e'], pine: ['#0a1820', '#10222a'], ice: '#3a5078', aurora: 1, lit: 1, ink: '#f1f4ff', sub: '#c4cfe8', caption: '#dfe8f5', stars: true },
};

export function aurora(phase) {
  const L = PAL[phase];
  const R = rng(66);
  const g = new Grid();

  // Two ranges: big snowy peaks behind, lower forested ridges in front.
  const back = ridge([[18, 22, 1.1], [58, 14, 0.9], [96, 19, 1.0], [136, 12, 0.85], [170, 20, 1.0]], 50, 0.6);
  const peakTop = (x) => Math.min(...[[18, 22], [58, 14], [96, 19], [136, 12], [170, 20]].map(([px, pt]) => pt + Math.abs(x - px) / 0.95));
  for (let x = 0; x < GW; x++) for (let y = back[x]; y < 50; y++) {
    const lit = (x % 40) < 20 === (x < 96);
    const snowLine = peakTop(x) + 9 + Math.round(Math.sin(x * 0.9) * 1.5);
    g.put(x, y, y < snowLine ? (lit ? L.peak[0] : L.peak[1]) : (lit ? L.peak[1] : L.peak[2]));
  }
  const front = ridge([[30, 36, 2.6], [80, 38, 2.2], [124, 35, 2.8], [168, 39, 2.4]], 50, 0.5);
  for (let x = 0; x < GW; x++) for (let y = front[x]; y < 50; y++) g.put(x, y, y - front[x] < 2 ? L.snow[1] : mix(L.snow[2], L.pine[0], 0.45));

  // A slope from the left down to the lake, and the frozen lake to the right.
  for (let x = 0; x < GW; x++) {
    const slope = x < 90 ? Math.round(44 + (x / 90) * 6) : 50;
    for (let y = slope; y < GH; y++) g.put(x, y, (x * 3 + y * 7) % 29 === 0 ? L.snow[1] : L.snow[0]);
  }
  g.ellipse(132, 62, 38, 5.5, (x, y) => (y < -2 ? mix(L.ice, '#ffffff', 0.3) : L.ice));
  for (let i = 0; i < 12; i++) { const x = 100 + Math.floor(R() * 64), y = 59 + Math.floor(R() * 6); if (g.get(x, y) === L.ice) g.box(x, y, x + 2, y, mix(L.ice, '#ffffff', 0.5)); }

  // Pines in a few rows.
  const pine = (x, base, h) => {
    g.box(x, base - 1, x, base, '#4a3020');
    for (let k = 0; k < h; k++) { const half = Math.floor((h - k) / 2.4); g.box(x - half, base - 1 - k, x + half, base - 1 - k, k % 3 === 0 ? L.pine[1] : L.pine[0]); if (k % 3 === 1 && half > 0) { g.put(x - half, base - 1 - k, L.snow[0]); g.put(x + half, base - 1 - k, L.snow[1]); } }
    g.put(x, base - h, L.snow[0]);
  };
  for (let x = 92; x < GW; x += 5) pine(x + (x % 3), 50 + (x % 2), 7 + (x * 7) % 5);
  for (const [x, b, h] of [[4, 48, 12], [10, 47, 9], [60, 52, 10], [70, 53, 13], [80, 55, 9], [164, 58, 14], [172, 57, 11]]) pine(x, b, h);

  // The cabin: logs, a snowy roof, warm windows, a door, a chimney.
  const cx = 28, cb = 50;
  g.box(cx, cb - 8, cx + 16, cb, '#8a5a34');
  for (let y = cb - 8; y <= cb; y += 2) g.box(cx, y, cx + 16, y, '#6e4428');
  for (let y = 0; y < 6; y++) g.box(cx - 2 + y, cb - 9 - y, cx + 18 - y, cb - 9 - y, y === 0 ? L.snow[1] : L.snow[0]);
  g.box(cx + 12, cb - 17, cx + 13, cb - 12, '#6a4a3a'); g.box(cx + 12, cb - 17, cx + 13, cb - 17, L.snow[0]);
  const lit = L.lit > 0.5 ? '#ffcf6b' : '#5a7090';
  g.box(cx + 2, cb - 6, cx + 5, cb - 4, lit); g.box(cx + 11, cb - 6, cx + 14, cb - 4, lit);
  g.put(cx + 3, cb - 5, '#6e4428'); g.put(cx + 12, cb - 5, '#6e4428');
  g.box(cx + 7, cb - 5, cx + 9, cb, '#4a2e1c');
  g.box(cx + 4, cb + 1, cx + 12, cb + 1, mix(L.snow[1], '#4a3020', 0.15));   // shovelled step

  // A snowman by the cabin.
  g.disc(52, 53, 3, L.snow[0]); g.disc(52, 48, 2, L.snow[0]); g.put(51, 47, '#1a1a2a'); g.put(53, 47, '#1a1a2a'); g.put(52, 48, '#ff8a2a');
  g.box(50, 50, 54, 50, '#d03a3a'); g.box(51, 44, 53, 45, '#2a2a3a'); g.box(50, 46, 54, 46, '#2a2a3a');
  g.line(49, 50, 46, 48, '#6a4428'); g.line(55, 50, 58, 48, '#6a4428');

  let body = '';

  // Aurora: a curtain of soft rays whose brightness ripples along it, under a
  // faint wide glow. Smooth on purpose, so it skips the pixel grid.
  if (L.aurora) {
    let rays = '';
    for (let i = 0; i < 64; i++) {
      const x = 20 + i * 13.5, w = 12;
      const top = 18 + 34 * (0.5 + 0.5 * Math.sin(i / 7 + 0.5)) + 10 * Math.sin(i / 2.7);
      const h = 120 + 50 * Math.sin(i / 5 + 1);
      const col = i > 40 && i < 54 ? 1 : 0, d = 6, b = -r2((i / 64) * d * 2);
      rays += `<rect x="${r2(x)}" y="${r2(top)}" width="${w}" height="${r2(h)}" fill="url(#ray${col})" opacity="${r2(0.4 * L.aurora)}">` +
        `<animate attributeName="opacity" values="${r2(0.25 * L.aurora)};${r2(0.85 * L.aurora)};${r2(0.25 * L.aurora)}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/>` +
        `<animate attributeName="y" values="${r2(top)};${r2(top - 10)};${r2(top)}" dur="${d * 1.6}s" begin="${b}s" repeatCount="indefinite"/></rect>`;
    }
    body += `<g style="mix-blend-mode:screen" shape-rendering="auto"><ellipse cx="${SW / 2}" cy="110" rx="480" ry="70" fill="url(#aurglow)" opacity="${r2(0.5 * L.aurora)}"/>${rays}</g>`;
  }

  body += g.rects();

  // Window glow and chimney smoke.
  if (L.lit > 0.5) body += `<circle cx="${(cx + 8) * PX}" cy="${(cb - 5) * PX}" r="90" fill="url(#warm)" opacity="0.5"/>`;
  for (let k = 0; k < 6; k++) {
    const d = 6, b = -r2((k / 6) * d);
    body += `<g transform="translate(${(cx + 12.5) * PX},${(cb - 18) * PX})"><rect x="-4" y="-4" width="${PX * 2}" height="${PX * 2}" fill="${phase === 'night' ? '#8a96b8' : '#f4f2f6'}" opacity="0.7"><animateTransform attributeName="transform" type="translate" values="0,0;14,-40;40,-80" dur="${d}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0.4;0" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></rect></g>`;
  }

  // A kid on a red sled, down the slope and back to the top, over and over.
  const sled = [[0, 0, '#d03a3a'], [1, 0, '#d03a3a'], [2, 0, '#d03a3a'], [3, 0, '#d03a3a'], [4, -1, '#d03a3a'], [1, -1, '#3a6ad0'], [2, -1, '#3a6ad0'], [1, -2, '#3a6ad0'], [2, -2, '#3a6ad0'], [1, -3, '#f0c890'], [2, -3, '#f0c890'], [1, -4, '#ffd23f'], [2, -4, '#e03a3a'], [3, -2, '#e03a3a']];
  const sx0 = 4, sy0 = 45, sx1 = 86, sy1 = 51;
  body += `<g transform="translate(${sx0 * PX},${sy0 * PX})">${cellRects(sled, '#d03a3a')}` +
    `<animateTransform attributeName="transform" type="translate" values="${sx0 * PX},${sy0 * PX};${sx0 * PX},${sy0 * PX};${sx1 * PX},${sy1 * PX};${sx1 * PX},${sy1 * PX}" keyTimes="0;0.3;0.75;1" calcMode="spline" keySplines="0 0 1 1;0.5 0 1 1;0 0 1 1" dur="8s" repeatCount="indefinite"/>` +
    `<animate attributeName="opacity" values="1;1;1;0" keyTimes="0;0.75;0.95;1" dur="8s" repeatCount="indefinite"/></g>`;

  // A skater looping on the lake.
  const skater = [[0, 0, '#2a2a3a'], [1, 0, '#2a2a3a'], [0, -1, '#7a3ad0'], [1, -1, '#7a3ad0'], [0, -2, '#7a3ad0'], [1, -2, '#7a3ad0'], [-1, -2, '#7a3ad0'], [2, -1, '#7a3ad0'], [0, -3, '#f0c890'], [1, -3, '#f0c890'], [0, -4, '#ffffff'], [1, -4, '#ffffff']];
  const k = 0.5523, ex = 22 * PX, ey = 3 * PX;
  const loop = `M0 0 C0 ${-k * ey} ${ex - k * ex} ${-ey} ${ex} ${-ey} C${ex + k * ex} ${-ey} ${2 * ex} ${-k * ey} ${2 * ex} 0 C${2 * ex} ${k * ey} ${ex + k * ex} ${ey} ${ex} ${ey} C${ex - k * ex} ${ey} 0 ${k * ey} 0 0`;
  body += `<g transform="translate(${110 * PX},${62 * PX})"><g>${cellRects(skater, '#7a3ad0')}<animateMotion path="${loop}" dur="9s" repeatCount="indefinite"/></g></g>`;

  // Snow, always falling, swaying as it goes.
  for (let i = 0; i < 90; i++) {
    const x = R() * SW, d = r2(6 + R() * 6), b = -r2(R() * d), s = R() < 0.3 ? 4 : 3;
    body += `<rect x="${r2(x)}" y="-10" width="${s}" height="${s}" fill="#ffffff" opacity="${r2(0.6 + R() * 0.4)}"><animateTransform attributeName="transform" type="translate" values="0,0;${r2(10 - R() * 20)},${SH / 2};${r2(10 - R() * 20)},${SH + 20}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></rect>`;
  }
  // Glints on the snow by day.
  if (phase === 'day' || phase === 'dawn') for (let i = 0; i < 16; i++) {
    const x = Math.floor(R() * GW) * PX, y = (56 + Math.floor(R() * 15)) * PX;
    body += `<rect x="${x}" y="${y}" width="3" height="3" fill="#ffffff" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="${r2(1 + R() * 2)}s" begin="${r2(R() * 2)}s" repeatCount="indefinite"/></rect>`;
  }

  const grads = [['#b07aff', '#5affb0'], ['#ff7ad8', '#b07aff']].map(([a, b], i) => `<linearGradient id="ray${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}" stop-opacity="0"/><stop offset="0.25" stop-color="${a}" stop-opacity="0.5"/><stop offset="0.6" stop-color="${b}" stop-opacity="0.95"/><stop offset="1" stop-color="${b}" stop-opacity="0"/></linearGradient>`).join('') + glowDef('aurglow', '#5affb0', 0.6);
  return {
    defs: grads + glowDef('warm', '#ffb04a', 0.7),
    body: skyBands(L.sky, 50) + (L.stars ? stars(R, 110, 34) : '') + body,
    ink: L.ink, sub: L.sub, caption: L.caption, local: false,
    desc: `Pixel art of a log cabin in snowy pines under tall mountains: snow falling, smoke from the chimney, warm windows, a snowman, a kid sledding down the hill and a skater looping on a frozen lake${L.aurora > 0.5 ? ', with the aurora rippling green and violet overhead' : ''}.`,
  };
}
