/* lighthouse
 *
 * A striped lighthouse on a green headland, the keeper's cottage beside it.
 * The sea rolls in bands toward the cliff and breaks white on the rocks. A
 * sailboat bobs across, gulls wheel, and far out a whale surfaces to blow.
 * At night the lamp turns: a long beam sweeps out over the water and back.
 */
import { r2, rng, mix, Grid, cellRects, PX, GW, GH, SW, SH, skyBands, stars, clouds, glowDef } from '../lib.mjs';

const HZ = 38;                                       // horizon
const LX = 150, LTOP = 6, CLIFF = 34;                // lighthouse column, lantern row, cliff top

const PAL = {
  dawn:  { sky: ['#6e88d0', '#9a94d0', '#c8a0c8', '#eeb0b4', '#fbc4a4', '#fed8ac'], sea: ['#7a8ac8', '#8e9ad0', '#a6aed8', '#c0c2e0'], foam: '#fff4f0', cliff: ['#8a7a7a', '#a6948e', '#6e6060'], grass: '#7aa86a', sun: { x: 40, y: 34, r: 5, c: '#ffe7b0', rim: '#ffc88a' }, cloud: '#fff0ea', cloudShade: '#efc6cc', beam: 0.2, lit: true, ink: '#2a2350', sub: '#4a3d73', caption: '#ffffff', shadow: '#4a4070', gulls: '#ffffff' },
  day:   { sky: ['#3ea0ea', '#52acee', '#68b8f0', '#80c4f2', '#9ad0f4', '#b6dcf6'], sea: ['#1a78c0', '#2288c8', '#3a9cd0', '#5cb4dc'], foam: '#ffffff', cliff: ['#9a8a7a', '#b8a694', '#7a6c60'], grass: '#6cc24a', sun: { x: 104, y: 9, r: 5, c: '#fff6d2', rim: '#ffe28a' }, cloud: '#ffffff', cloudShade: '#dceefa', beam: 0, lit: false, ink: '#0e2a47', sub: '#1d4a70', caption: '#ffffff', shadow: '#0e4a7a', gulls: '#ffffff' },
  dusk:  { sky: ['#4a5cb8', '#7a62b0', '#b46a9c', '#e47e80', '#f9a068', '#fec880'], sea: ['#5a5ea8', '#7a6aa8', '#a8789e', '#d08a8a'], foam: '#fff0e0', cliff: ['#6e5a5a', '#8a7270', '#544444'], grass: '#8a9a4a', sun: { x: 70, y: 36, r: 7, c: '#fff0b0', rim: '#ffb554' }, cloud: '#ffd2b8', cloudShade: '#e8a0a0', beam: 0.45, lit: true, ink: '#2b1c48', sub: '#4d2f5e', caption: '#fff4e6', shadow: '#3a2a4a', gulls: '#3d2a48' },
  night: { sky: ['#060c22', '#0a122c', '#0e1836', '#121e40', '#16244a', '#1c2c54'], sea: ['#0a1630', '#0e1c3a', '#142446', '#1c2e54'], foam: '#aab8e0', cliff: ['#2a2a3a', '#36364a', '#202030'], grass: '#1e3a2e', moon: { x: 100, y: 10, r: 4 }, cloud: '#2a3660', cloudShade: '#1e2850', beam: 1, lit: true, stars: true, ink: '#f1f4ff', sub: '#c4cfe8', caption: '#dfe8f5', shadow: '#060c22', gulls: null },
};

export function lighthouse(phase) {
  const L = PAL[phase];
  const R = rng(1848);
  const g = new Grid();
  const orb = L.sun || L.moon;

  if (L.sun) { g.disc(L.sun.x, L.sun.y, L.sun.r + 1, L.sun.rim); g.disc(L.sun.x, L.sun.y, L.sun.r, L.sun.c); }
  if (L.moon) { g.disc(L.moon.x, L.moon.y, L.moon.r, '#f6f1dc'); g.put(L.moon.x - 1, L.moon.y - 1, '#ddd5b8'); g.put(L.moon.x + 2, L.moon.y + 1, '#ddd5b8'); }

  // A far island on the horizon.
  for (let x = 4; x < 40; x++) { const h = Math.round(3 * Math.sin(((x - 4) / 36) * Math.PI) + Math.sin(x / 3)); g.box(x, HZ - h, x, HZ - 1, mix(L.sea[0], L.cliff[2], 0.5)); }

  // The headland: rock face, grass on top, a path, boulders at the foot.
  for (let x = 118; x < GW; x++) {
    const top = CLIFF - Math.round((x - 118) < 10 ? (10 - (x - 118)) * -0.6 : 1.5 * Math.sin(x / 7));
    for (let y = top; y < GH; y++) {
      const face = y - top;
      g.put(x, y, face < 2 ? L.grass : (x + y * 2) % 9 === 0 ? L.cliff[2] : (x % 7 < 3 ? L.cliff[1] : L.cliff[0]));
    }
  }
  for (let y = CLIFF; y < GH; y++) { const edge = 118 - Math.round((y - CLIFF) * 0.35); for (let x = edge; x < 118; x++) g.put(x, y, x === edge ? L.cliff[2] : L.cliff[0]); }
  for (const [x, y, r] of [[108, 66, 4], [114, 69, 3], [100, 70, 3]]) g.ellipse(x, y, r * 1.4, r, (dx, dy) => (dy < 0 ? L.cliff[1] : L.cliff[2]));

  // Lighthouse: white tower with red bands, gallery, lantern, cap.
  for (let y = LTOP + 6; y < CLIFF; y++) {
    const half = 3 + Math.floor((y - LTOP - 6) / 9);
    const band = Math.floor((y - LTOP - 6) / 5) % 2;
    g.box(LX - half, y, LX + half, y, band ? '#d23c3c' : '#f6f2ea');
    g.put(LX + half, y, band ? '#a82a2a' : '#d6d0c4');
  }
  g.box(LX - 5, LTOP + 5, LX + 5, LTOP + 5, '#2a2a34');                       // gallery
  g.box(LX - 3, LTOP + 1, LX + 3, LTOP + 4, L.lit ? '#ffe9a8' : '#c8d8e8');    // lantern room
  g.box(LX - 3, LTOP + 1, LX - 3, LTOP + 4, '#2a2a34'); g.box(LX + 3, LTOP + 1, LX + 3, LTOP + 4, '#2a2a34');
  for (let y = 0; y < 3; y++) g.box(LX - 3 + y, LTOP - y, LX + 3 - y, LTOP - y, '#2a2a34');
  g.box(LX - 1, LTOP + 20, LX + 1, LTOP + 22, L.lit ? '#ffcf6b' : '#3a3a48');
  g.box(LX - 1, CLIFF - 4, LX + 1, CLIFF - 1, '#3a2a24');

  // Keeper's cottage.
  g.box(128, CLIFF - 6, 140, CLIFF - 1, '#f2ece0'); g.box(138, CLIFF - 6, 140, CLIFF - 1, '#d6cfc0');
  for (let y = 0; y < 4; y++) g.box(127 + y, CLIFF - 7 - y, 141 - y, CLIFF - 7 - y, y % 2 ? '#2e5a8a' : '#3a6aa0');
  g.box(131, CLIFF - 4, 133, CLIFF - 2, L.lit ? '#ffcf6b' : '#7aa8c8'); g.box(135, CLIFF - 4, 136, CLIFF - 1, '#5a3a24');
  g.box(137, CLIFF - 13, 138, CLIFF - 10, '#7a4a3a');
  for (let x = 124; x < 146; x += 3) { g.put(x, CLIFF - 2, '#e8e0d0'); g.put(x, CLIFF - 1, '#e8e0d0'); }  // picket fence
  g.box(124, CLIFF - 2, 145, CLIFF - 2, '#e8e0d0');

  // The sea: bands that scroll toward the shore, so the swell keeps coming.
  const sea = new Grid(GW * 2, GH);
  for (let y = HZ; y < GH; y++) {
    const band = Math.min(L.sea.length - 1, Math.floor(((y - HZ) / (GH - HZ)) * L.sea.length));
    for (let x = 0; x < GW * 2; x++) {
      const period = 8 + Math.floor((y - HZ) / 4) * 3;
      const crest = (x + y * 5) % period === 0 || ((x + 1 + y * 5) % period === 0 && y > HZ + 10);
      sea.put(x, y, crest ? mix(L.sea[band], L.foam, 0.55) : L.sea[band]);
    }
  }
  const seaG = `<g>${sea.rects()}<animateTransform attributeName="transform" type="translate" values="0,0;${-GW * PX},0" dur="60s" repeatCount="indefinite"/></g>`;
  const streak = orb ? (() => { let s = ''; for (let y = HZ; y < GH; y += 2) { const w = 2 + (y - HZ) / 4; s += `<rect x="${r2((orb.x - w / 2 + ((y * 7) % 3) - 1) * PX)}" y="${y * PX}" width="${r2(w * PX)}" height="${PX}" fill="${L.sun ? L.sun.rim : '#e8ecff'}" opacity="${L.sun ? 0.55 : 0.4}"><animate attributeName="opacity" values="${L.sun ? '0.55;0.25;0.55' : '0.4;0.15;0.4'}" dur="${r2(1.5 + (y % 5) * 0.3)}s" repeatCount="indefinite"/></rect>`; } return s; })() : '';

  // Surf breaking on the cliff foot and the rocks.
  let surf = '';
  for (let i = 0; i < 18; i++) {
    const y = HZ + 6 + Math.floor(R() * (GH - HZ - 6)), x = 118 - Math.round((y - CLIFF) * 0.35) - 1 - Math.floor(R() * 4);
    surf += `<rect x="${x * PX}" y="${y * PX}" width="${(2 + Math.floor(R() * 3)) * PX}" height="${PX}" fill="${L.foam}" opacity="0"><animate attributeName="opacity" values="0;0.95;0" dur="${r2(1.4 + R())}s" begin="${r2(R() * 2)}s" repeatCount="indefinite"/></rect>`;
  }

  // A sailboat bobbing and slowly crossing.
  const boat = new Grid();
  boat.box(0 + 20, 20, 12 + 20, 20, '#7a4a2a'); boat.box(1 + 20, 21, 11 + 20, 21, '#5a3420');
  boat.box(26, 9, 26, 19, '#5a3a24');
  for (let y = 0; y < 9; y++) boat.box(27, 10 + y, 27 + Math.floor(y * 0.7), 10 + y, '#fbf6ec');
  for (let y = 0; y < 7; y++) boat.box(25 - Math.floor(y * 0.5), 12 + y, 25, 12 + y, '#e04a3a');
  boat.put(26, 8, '#ffd23f');
  const bx = 70 * PX, by = (HZ + 12) * PX;
  const boatG = `<g transform="translate(${bx - 100},${by - 100})"><g>${boat.rects()}${L.lit && phase !== 'dawn' ? `<circle cx="${26 * PX}" cy="${19 * PX}" r="18" fill="url(#lamp)"/>` : ''}<animateTransform attributeName="transform" type="rotate" values="-3 130 100;3 130 100;-3 130 100" dur="3s" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"/></g>` +
    `<animateTransform attributeName="transform" type="translate" values="${-20 * PX},${by - 100};${90 * PX},${by - 106};${-20 * PX},${by - 100}" dur="90s" begin="-30s" repeatCount="indefinite"/></g>`;

  // Far out, a whale surfaces and blows.
  const spout = `<g transform="translate(${96 * PX},${(HZ + 2) * PX})">` +
    `<g opacity="0"><rect x="-12" y="-2" width="30" height="6" rx="3" fill="${mix(L.sea[0], '#000000', 0.3)}"/>` +
    [[-3, -6], [0, -10], [3, -14], [-2, -16], [4, -18], [0, -20], [-5, -14], [6, -10]].map(([x, y]) => `<rect x="${x}" y="${y}" width="4" height="4" fill="${L.foam}"/>`).join('') +
    `<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.7;0.73;0.86;1" dur="12s" repeatCount="indefinite"/></g></g>`;

  // Gulls wheeling over the headland.
  let gulls = '';
  if (L.gulls) for (let i = 0; i < 3; i++) {
    const cx = (120 + i * 12) * PX, cy = (16 + i * 4) * PX, r = 40 + i * 14;
    const up = [[-2, -1], [-1, 0], [0, 0], [1, 0], [2, -1]], down = [[-2, 1], [-1, 0], [0, 0], [1, 0], [2, 1]];
    const flap = (fr, on) => `<g opacity="${on ? 1 : 0}">${cellRects(fr, L.gulls)}<animate attributeName="opacity" values="${on ? '1;0' : '0;1'}" dur="0.6s" calcMode="discrete" repeatCount="indefinite"/></g>`;
    const k = 0.5523, path = `M0 0 C0 ${-k * r * 0.5} ${r - k * r} ${-r * 0.5} ${r} ${-r * 0.5} C${r + k * r} ${-r * 0.5} ${2 * r} ${-k * r * 0.5} ${2 * r} 0 C${2 * r} ${k * r * 0.5} ${r + k * r} ${r * 0.5} ${r} ${r * 0.5} C${r - k * r} ${r * 0.5} 0 ${k * r * 0.5} 0 0`;
    gulls += `<g transform="translate(${cx - r},${cy})"><g>${flap(up, true)}${flap(down, false)}<animateMotion path="${path}" dur="${9 + i * 2}s" begin="${-i * 3}s" repeatCount="indefinite"/></g></g>`;
  }

  // The beam: a long soft cone from the lantern that swings out and back.
  const lx = LX * PX + 2, ly = (LTOP + 2.5) * PX;
  const beam = L.beam ? `<g transform="translate(${lx},${ly})" style="mix-blend-mode:screen" shape-rendering="auto">` +
    `<g><polygon points="0,-4 -760,-70 -760,60 0,4" fill="url(#beam)" opacity="${L.beam}"/>` +
    `<animateTransform attributeName="transform" type="scale" values="1 1;0.05 1;-0.6 1;0.05 1;1 1" keyTimes="0;0.3;0.5;0.7;1" dur="8s" repeatCount="indefinite"/></g>` +
    `<circle r="60" fill="url(#lamp)"><animate attributeName="opacity" values="1;0.5;0.3;0.5;1" keyTimes="0;0.3;0.5;0.7;1" dur="8s" repeatCount="indefinite"/></circle></g>` : '';

  const halo = orb ? `<circle cx="${orb.x * PX}" cy="${orb.y * PX}" r="${orb.r * PX * 5}" fill="url(#halo)" opacity="${L.sun ? 0.6 : 0.35}"/>` : '';
  return {
    defs: glowDef('halo', L.sun ? L.sun.rim : '#cfd8ff') + glowDef('lamp', '#ffe9a8', 0.9) +
      `<linearGradient id="beam" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff3c0" stop-opacity="0.85"/><stop offset="1" stop-color="#fff3c0" stop-opacity="0"/></linearGradient>`,
    body: skyBands(L.sky, HZ) + halo + (L.stars ? stars(R, 90, HZ - 4) : '') + clouds(R, [[10, 14, 18, 150], [80, 6, 22, 180], [130, 22, 14, 130]], L.cloud, L.cloudShade, L.stars ? 0.5 : 0.9) +
      seaG + streak + spout + boatG + g.rects() + surf + gulls +
      beam,
    ink: L.ink, sub: L.sub, caption: L.caption, shadow: L.shadow, local: false,
    desc: `Pixel art of a red-and-white lighthouse on a green headland with the keeper's cottage and a picket fence, the sea rolling in and breaking on the rocks, a sailboat bobbing across, ${L.gulls ? 'gulls wheeling, ' : ''}and a whale blowing far out${L.beam > 0.5 ? ', with the lighthouse beam sweeping over the water' : ''}.`,
  };
}
