/* koi
 *
 * A garden pond seen from straight above. Seven koi (kohaku, ogon, showa,
 * tancho, chagoi) swim their own loops with their tails beating and their
 * shadows on the bed below. Lily pads, pink lotus and a white water lily,
 * marigold and rose petals drifting, sunlight wobbling over the water, a
 * dragonfly darting between pads. After dark the koi go quiet, the moon sits
 * on the water and floating diyas drift across it.
 */
import { P, r2, rng, mix, Grid, PX, GW, GH, SW, SH, fireflies, glowDef } from '../lib.mjs';

const CX = 98, CY = 40, RX = 76, RY = 29;
const edge = (a) => 1 + 0.06 * Math.sin(3 * a + 0.4) + 0.04 * Math.sin(5 * a + 1.3) + 0.03 * Math.sin(8 * a);

const PAL = {
  day: {
    grass: ['#6cc24a', '#5ab33e', '#80d25c', '#4c9c34'], stone: ['#9aa3ab', '#b6bec5', '#7b848d'],
    waterEdge: '#5cc8cc', waterDeep: '#1b6f8a', caustic: '#eafcff', causticA: 0.16,
    pad: ['#3a9a3a', '#55b24a', '#2c7a2e'], fish: 1, ink: '#ffffff', sub: '#f2fff4', titleShadow: '#1e4a33', caption: '#ffffff', shadow: '#1e4a33',
    flowers: ['#ff9f1c', '#ffd23f', '#ffffff', '#ff6f9e'], dragonfly: true,
  },
  dawn: {
    grass: ['#8fbf6a', '#7fb05c', '#a2cd7c', '#6c9a4e'], stone: ['#a8a4b0', '#c2bec8', '#8a8692'],
    waterEdge: '#a8c4dc', waterDeep: '#4a6e9a', caustic: '#fff0e8', causticA: 0.14,
    pad: ['#4a9446', '#62aa56', '#367a36'], fish: 0.95, ink: '#ffffff', sub: '#fff6f2', titleShadow: '#4a3d5a', caption: '#ffffff', shadow: '#4a3d5a',
    flowers: ['#ff9f3c', '#ffd35a', '#ffffff', '#ff7a9e'], dragonfly: true,
  },
  dusk: {
    grass: ['#a6ae4a', '#94a040', '#b8c058', '#7c8834'], stone: ['#a89a94', '#c4b4ac', '#8a7c78'],
    waterEdge: '#e0a6a0', waterDeep: '#5a4878', caustic: '#ffe4b8', causticA: 0.14,
    pad: ['#5a8a3e', '#72a04c', '#46702f'], fish: 0.9, ink: '#ffffff', sub: '#fff2e6', titleShadow: '#4a2a3a', caption: '#ffffff', shadow: '#4a2a3a',
    flowers: ['#ff8c1a', '#ffc93c', '#fff4e0', '#ff5e7e'], dragonfly: false, diyas: 3,
  },
  night: {
    grass: ['#1f3a2a', '#1a3324', '#25452f', '#14291c'], stone: ['#3e4656', '#4e5668', '#30384a'],
    waterEdge: '#2c4c70', waterDeep: '#0c1a36', caustic: '#cfd8ff', causticA: 0.05,
    pad: ['#1c3e2c', '#244a34', '#163222'], fish: 0.55, ink: '#f1f4ff', sub: '#d6e0f2', titleShadow: '#0c1430', caption: '#dfe8f5', shadow: '#0c1430',
    flowers: ['#8a6a3a', '#9a8a4a', '#a8a8b8', '#8a5a6a'], dragonfly: false, diyas: 7, moon: true, fireflies: true,
  },
};

const KOI = [
  { base: '#fbf6ee', spots: '#e2462a', kind: 'kohaku' },
  { base: '#ffb12e', spots: '#ffd36a', kind: 'ogon' },
  { base: '#1e1e24', spots: '#e2462a', alt: '#fbf6ee', kind: 'showa' },
  { base: '#fbf6ee', spots: '#e2462a', kind: 'tancho' },
  { base: '#ff7a2a', spots: '#fbf6ee', kind: 'kohaku-inverse' },
  { base: '#b08a5a', spots: '#cfa874', kind: 'chagoi' },
  { base: '#fbf6ee', spots: '#ff8a3a', kind: 'kohaku' },
];

/** A koi sprite facing +x, centred near the origin, in 4px cells. */
function koiSprite(k, a, R) {
  const C = 4, cells = [];
  const body = [[-1, 1, 6], [0, 0, 8], [1, 1, 6]];
  for (const [y, x0, x1] of body) for (let x = x0; x <= x1; x++) {
    let c = k.base;
    if (k.kind === 'tancho') c = x >= 6 && x <= 7 && y === 0 ? k.spots : k.base;
    else if (k.kind === 'ogon' || k.kind === 'chagoi') c = (x + y) % 3 === 0 ? k.spots : k.base;
    else if (R() < 0.42) c = k.spots;
    if (k.alt && R() < 0.2) c = k.alt;
    cells.push([x, y, c]);
  }
  cells.push([8, 0, mix(k.base, '#000000', 0.15)]);
  const fins = [[4, -2], [4, 2], [5, -2], [5, 2]].map(([x, y]) => [x, y, mix(k.base, '#ffffff', 0.4)]);
  const tail = [[-1, 0], [-2, -1], [-2, 1], [-3, -1], [-3, 1], [-4, -2], [-4, 2]].map(([x, y]) => [x, y, mix(k.base, '#ffffff', 0.25)]);
  const rects = (cs, col, o = 1) => cs.map(([x, y, c]) => `<rect x="${x * C - 8}" y="${y * C - 2}" width="${C}" height="${C}" fill="${col || c}" opacity="${o}"/>`).join('');
  const all = [...cells, ...fins, ...tail];
  return `<g transform="translate(7,9)">${rects(all, '#000000', 0.22)}</g>` +
    `<g opacity="${a}">${rects(cells)}${rects(fins)}<g>${rects(tail)}<animateTransform attributeName="transform" type="rotate" values="-14 -8 0;14 -8 0;-14 -8 0" dur="${r2(0.5 + R() * 0.3)}s" repeatCount="indefinite"/></g></g>`;
}

export function koi(phase) {
  const L = PAL[phase];
  const R = rng(8);
  const g = new Grid();

  // Grass with a little texture and flowers along the edges.
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) g.put(x, y, L.grass[Math.sin(x / 9 + y / 5) + Math.sin(y / 7 - x / 13) > 0.8 ? 1 : 0]);
  for (let i = 0; i < 420; i++) { const x = Math.floor(R() * GW), y = Math.floor(R() * GH); g.put(x, y, L.grass[2]); g.put(x, y + 1, L.grass[3]); }
  for (let i = 0; i < 70; i++) { const x = Math.floor(R() * GW), y = Math.floor(R() * GH); g.put(x, y, L.flowers[Math.floor(R() * L.flowers.length)]); }

  // The pond, deeper toward the middle, with a ring of river stones.
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const dx = (x - CX) / RX, dy = (y - CY) / RY, a = Math.atan2(dy, dx), d = Math.hypot(dx, dy) / edge(a);
    if (d <= 1) g.put(x, y, mix(L.waterEdge, L.waterDeep, Math.round(Math.min(1, Math.pow(1 - d, 0.6) * 1.15) * 7) / 7));   // 8 depth steps keep the file small
    else if (d <= 1.07) g.put(x, y, L.stone[(x * 5 + y * 3) % 3]);
  }
  for (let k = 0; k < 90; k++) {
    const a = (k / 90) * Math.PI * 2, e = edge(a) * 1.04;
    const x = Math.round(CX + Math.cos(a) * RX * e), y = Math.round(CY + Math.sin(a) * RY * e), c = L.stone[k % 3];
    g.box(x - 1, y - 1, x + 1, y, c); g.put(x, y + 1, mix(c, '#000000', 0.25));
  }

  // Stepping stones across the grass in the bottom left.
  for (const [x, y] of [[6, 64], [14, 68], [3, 56], [22, 70]]) g.ellipse(x, y, 3, 1.6, (dx, dy) => (dy < 0 ? L.stone[1] : L.stone[0]));

  // Lily pads with their notch, lotus and a water lily on some.
  const pads = [[60, 24, 4], [70, 50, 5], [120, 22, 4], [142, 46, 5], [104, 58, 3], [156, 30, 3], [40, 40, 4], [88, 36, 3], [130, 34, 3], [52, 56, 3]];
  pads.forEach(([px, py, r], i) => {
    const notch = (i * 1.7) % (Math.PI * 2);
    g.ellipse(px, py, r * 1.2, r * 0.9, (x, y) => {
      const a = Math.atan2(y, x), da = Math.abs(((a - notch + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (da < 0.35) return null;
      return (x === 0 || y === 0) ? L.pad[1] : x > 0 ? L.pad[0] : L.pad[2];
    });
  });
  for (const [x, y, c, h] of [[60, 24, '#ff7aa8', '#ffe0ec'], [142, 46, '#ff7aa8', '#ffe0ec'], [120, 22, '#ffffff', '#ffe66a']]) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]]) g.put(x + dx, y + dy, c);
    g.put(x - 2, y, c); g.put(x + 2, y, c); g.put(x, y - 2, c); g.put(x, y + 2, c); g.put(x, y, h);
  }

  // Sunlight wobbling on the surface.
  let caustics = '';
  for (let i = 0; i < 12; i++) {
    const x = (CX - 60 + R() * 120) * PX, y = (CY - 20 + R() * 40) * PX, d = r2(6 + R() * 6);
    caustics += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="${r2(30 + R() * 30)}" ry="${r2(8 + R() * 8)}" fill="${L.caustic}" opacity="${L.causticA}">` +
      `<animateTransform attributeName="transform" type="translate" values="0,0;${r2(18 - R() * 36)},${r2(6 - R() * 12)};0,0" dur="${d}s" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values="${L.causticA};${r2(L.causticA * 0.3)};${L.causticA}" dur="${r2(d * 0.7)}s" repeatCount="indefinite"/></ellipse>`;
  }

  // Koi, each on its own loop. animateMotion turns them along the path.
  const loops = [[90, 40, 40, 13, 0], [110, 36, 52, 18, 1], [74, 44, 26, 10, 1], [130, 40, 26, 12, 0], [96, 30, 60, 10, 0], [64, 34, 18, 9, 0], [118, 50, 34, 8, 1]];
  let fish = '';
  loops.forEach(([cx, cy, rx, ry, cw], i) => {
    const X = cx * PX, Y = cy * PX, RXp = rx * PX, RYp = ry * PX, s = cw ? 1 : 0;
    // Four cubic quarter-arcs: an ellipse that every SMIL engine walks the same way.
    const k = 0.5523, ey = cw ? RYp : -RYp, ex = RXp;
    const path = `M0 0 C0 ${r2(-k * ey)} ${r2(ex - k * ex)} ${-ey} ${ex} ${-ey} C${r2(ex + k * ex)} ${-ey} ${2 * ex} ${r2(-k * ey)} ${2 * ex} 0 ` +
      `C${2 * ex} ${r2(k * ey)} ${r2(ex + k * ex)} ${ey} ${ex} ${ey} C${r2(ex - k * ex)} ${ey} 0 ${r2(k * ey)} 0 0`;
    const dur = r2(16 + R() * 18), begin = -r2(R() * dur);
    // Motion goes on an inner group: per spec it wraps the element's own
    // transform, so a translate on the same element would get rotated too.
    fish += `<g transform="translate(${X - RXp},${Y})"><g>${koiSprite(KOI[i], L.fish, R)}<animateMotion path="${path}" dur="${dur}s" begin="${begin}s" rotate="auto" repeatCount="indefinite"/></g></g>`;
  });

  // Petals drifting across.
  let petals = '';
  for (let i = 0; i < 8; i++) {
    const y = (CY - 18 + R() * 36) * PX, c = i % 3 ? '#ff9f1c' : '#ff6f9e', d = r2(40 + R() * 30), b = -r2(R() * d);
    petals += `<g transform="translate(${30 * PX},${r2(y)})"><g><rect x="-3" y="-2" width="6" height="4" rx="2" fill="${c}"/><rect x="-1" y="-1" width="2" height="2" fill="#ffffff" opacity="0.5"/>` +
      `<animateTransform attributeName="transform" type="rotate" values="0;360" dur="${r2(d / 3)}s" repeatCount="indefinite"/></g>` +
      `<animateTransform attributeName="transform" type="translate" values="${30 * PX},${r2(y)};${165 * PX},${r2(y + 20 - R() * 40)}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></g>`;
  }

  // Rings where something touched the surface.
  let rings = '';
  for (let i = 0; i < 5; i++) {
    const x = (CX - 50 + R() * 100) * PX, y = (CY - 18 + R() * 36) * PX, d = r2(2.4 + R() * 1.6), b = r2(R() * 3);
    rings += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="3" ry="2" fill="none" stroke="${L.caustic}" stroke-width="1.5" opacity="0"><animate attributeName="rx" values="3;34" dur="${d}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="ry" values="2;22" dur="${d}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></ellipse>`;
  }

  // A dragonfly that darts from pad to pad and hovers.
  let dragon = '';
  if (L.dragonfly) {
    const stops = [[60, 21], [70, 46], [120, 19], [142, 42], [88, 33]].map(([x, y]) => `${x * PX},${y * PX}`);
    const vals = stops.flatMap((s) => [s, s]).concat(stops[0]).join(';');
    const kt = stops.flatMap((_, i) => [r2(i / stops.length), r2(i / stops.length + 0.85 / stops.length)]).concat(1).join(';');
    dragon = `<g transform="translate(${stops[0].replace(',', ',')})"><rect x="-1" y="-10" width="3" height="16" fill="#2a6ae0"/><rect x="-1" y="-12" width="3" height="3" fill="#1a3a8a"/>` +
      `<g opacity="0.55"><rect x="-14" y="-8" width="12" height="3" rx="1.5" fill="#e6f4ff"/><rect x="3" y="-8" width="12" height="3" rx="1.5" fill="#e6f4ff"/><rect x="-12" y="-3" width="10" height="3" rx="1.5" fill="#e6f4ff"/><rect x="3" y="-3" width="10" height="3" rx="1.5" fill="#e6f4ff"/>` +
      `<animate attributeName="opacity" values="0.55;0.2;0.55" dur="0.12s" repeatCount="indefinite"/></g>` +
      `<animateTransform attributeName="transform" type="translate" values="${vals}" keyTimes="${kt}" dur="14s" repeatCount="indefinite"/></g>`;
  }

  // After dark: the moon on the water and diyas floating on leaf boats.
  let night = '';
  if (L.moon) night += `<ellipse cx="${118 * PX}" cy="${30 * PX}" rx="34" ry="22" fill="url(#moon)"/><ellipse cx="${118 * PX}" cy="${30 * PX}" rx="16" ry="11" fill="#f2f0e2" opacity="0.85"><animate attributeName="rx" values="16;18;15;16" dur="3s" repeatCount="indefinite"/></ellipse>`;
  for (let i = 0; i < (L.diyas || 0); i++) {
    const y = (CY - 16 + (i * 37) % 32) * PX, d = r2(60 + i * 9), b = -r2((i / (L.diyas || 1)) * d);
    night += `<g transform="translate(${40 * PX},${y})"><circle r="40" fill="url(#diya)"/><rect x="-9" y="-3" width="18" height="6" rx="3" fill="#3f7a30"/><rect x="-4" y="-3" width="8" height="4" fill="#a8582a"/>` +
      `<rect x="-2" y="-8" width="4" height="5" fill="#ffd27a"><animate attributeName="opacity" values="1;0.6;1" dur="${r2(0.4 + (i % 3) * 0.15)}s" repeatCount="indefinite"/></rect>` +
      `<animateTransform attributeName="transform" type="translate" values="${40 * PX},${y};${160 * PX},${r2(y + 30)}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></g>`;
  }

  return {
    defs: glowDef('diya', '#ffb04a', 0.7) + glowDef('moon', '#e8ecff', 0.5),
    body: g.rects() + caustics + rings + fish + petals + night + dragon + (L.fireflies ? fireflies(R, 20, [0, 72], [0, 176]) : ''),
    ink: L.ink, sub: L.sub, caption: L.caption, shadow: L.shadow, titleShadow: L.titleShadow,
    desc: `Pixel art of a garden pond seen from above: seven koi swimming their own loops with their shadows below them, lily pads, pink lotus and a white water lily, petals drifting${L.dragonfly ? ', a dragonfly darting between pads' : ''}${L.moon ? ', the moon on the water and floating diyas' : L.diyas ? ' and a few floating diyas' : ''}, edged with river stones and grass.`,
  };
}
