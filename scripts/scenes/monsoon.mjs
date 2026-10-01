/* monsoon
 *
 * A terrace in Bhilai in the middle of the monsoon. Rain slants across
 * everything. Behind the parapet, a jumble of pastel rooftops with their
 * black water tanks and a neem tree. On ours: tulsi, marigolds and a cactus
 * on the parapet, washing that nobody took in swaying on the line, the tank
 * overflowing, a cat keeping dry under its stand, a frog by the puddle and a
 * paper boat on it. Someone stands at the edge under a red umbrella, just
 * watching. Lightning after dark; by day, a faint rainbow.
 */
import { P, r2, rng, mix, Grid, cellRects, PX, GW, GH, SW, SH, skyBands, clouds, glowDef } from '../lib.mjs';

const PARA = 44, FLOOR = 51;

const PAL = {
  day: {
    sky: ['#7a91ac', '#8ba1ba', '#9cb0c7', '#aebfd3', '#c0cede', '#d0dbe7'],
    cloud: '#b4c2d2', cloudShade: '#94a3b5', rainA: 0.5, rainN: 150, rainbow: 0.3, lit: 0.1,
    houses: ['#e6b4a2', '#a9c6d6', '#efd28e', '#b9d6ae', '#d6badb', '#f1c7a8'], tankC: '#24282f',
    parapet: '#b4b9be', coping: '#ced3d8', paraDark: '#969ba2', floor: '#8b9198', wet: '#7a8087',
    puddle: '#b7c6d6', puddleHi: '#e6eef6', leaf: ['#2a6a3c', '#3a8048', '#56a05a'], trunk: '#5e4632',
    ink: '#1a2838', sub: '#2c3c50', caption: '#f4f6f8', shadow: '#3c4654',
  },
  dawn: {
    sky: ['#8c8ca8', '#a29db5', '#b9adc0', '#cfbdc6', '#e0cccd', '#ecdad4'],
    cloud: '#c4b8c4', cloudShade: '#a89ca9', rainA: 0.4, rainN: 90, rainbow: 0, lit: 0.3,
    houses: ['#e2b2a8', '#b0bed6', '#ecd09a', '#bccfb0', '#d4b8d4', '#efc4ae'], tankC: '#2a2a32',
    parapet: '#b8b4bc', coping: '#d2ced4', paraDark: '#9a96a0', floor: '#8f8c96', wet: '#7e7b86',
    puddle: '#d8c8d0', puddleHi: '#f6ece8', leaf: ['#355e42', '#46744e', '#5e9060'], trunk: '#584232',
    ink: '#2a2848', sub: '#46405e', caption: '#fbf6f4', shadow: '#5a5266', mist: true,
  },
  dusk: {
    sky: ['#4c5374', '#635d7f', '#7f6789', '#9a738f', '#b5828f', '#cc9690'],
    cloud: '#6e6a88', cloudShade: '#56536f', rainA: 0.5, rainN: 150, rainbow: 0, lit: 0.6, lightning: true,
    houses: ['#b8877e', '#8798ac', '#c2a676', '#93a688', '#a891a8', '#c39a86'], tankC: '#1a1a22',
    parapet: '#8e8a96', coping: '#a8a4b0', paraDark: '#74707e', floor: '#6c6974', wet: '#5e5b66',
    puddle: '#a08aa0', puddleHi: '#f0c8a8', leaf: ['#25432e', '#33573a', '#4a7248'], trunk: '#3e2e24',
    ink: '#fff2e8', sub: '#f0d8cc', caption: '#fff2e8', shadow: '#3a3046',
  },
  night: {
    sky: ['#121829', '#171f33', '#1c263d', '#222d47', '#283551', '#2e3c5a'],
    cloud: '#2c3650', cloudShade: '#222b42', rainA: 0.45, rainN: 150, rainbow: 0, lit: 0.85, lightning: true,
    houses: ['#5e4c50', '#4a5468', '#62584a', '#4c5a4c', '#5a4e5e', '#64544c'], tankC: '#0c0e14',
    parapet: '#4e5260', coping: '#5e6272', paraDark: '#40434f', floor: '#3c404c', wet: '#33363f',
    puddle: '#3a4a6a', puddleHi: '#ffd08a', leaf: ['#122a20', '#183628', '#224433'], trunk: '#2a2018',
    ink: '#f1f4ff', sub: '#c4cfe8', caption: '#dfe8f5', shadow: '#0c1220', street: true,
  },
};

export function monsoon(phase) {
  const L = PAL[phase];
  const R = rng(7_2026);
  const g = new Grid();

  // Rooftops behind the parapet, three ragged rows, each with its black tank.
  const lit = [];
  const row = (base, hMin, hMax, wMin, wMax, shade) => {
    let x = -2;
    while (x < GW) {
      const w = wMin + Math.floor(R() * (wMax - wMin)), h = hMin + Math.floor(R() * (hMax - hMin));
      const c = mix(L.houses[Math.floor(R() * L.houses.length)], '#5a6070', shade);
      g.box(x, base - h, x + w - 1, PARA, c);
      g.box(x, base - h, x + w - 1, base - h, mix(c, '#ffffff', 0.18));
      if (R() < 0.6) { const tx = x + 1 + Math.floor(R() * Math.max(1, w - 5)); g.box(tx, base - h - 3, tx + 3, base - h - 1, L.tankC); g.box(tx, base - h - 2, tx + 3, base - h - 2, mix(L.tankC, '#ffffff', 0.12)); }
      for (let wy = base - h + 2; wy < base - 1; wy += 3) for (let wx = x + 1; wx < x + w - 1; wx += 3) {
        if (R() < L.lit) lit.push([wx, wy]); else g.put(wx, wy, mix(c, '#2a2e38', 0.4));
      }
      x += w + (R() < 0.3 ? 1 : 0);
    }
  };
  row(34, 3, 8, 7, 14, 0.35);
  row(39, 3, 9, 8, 15, 0.18);
  row(44, 2, 7, 9, 16, 0.05);
  for (const [x, y] of lit) g.put(x, y, '#ffcf73');

  // A neem tree breaking the skyline.
  for (const [cx, cy, r] of [[118, 26, 6], [126, 23, 7], [134, 27, 5], [124, 30, 5]])
    for (let y = -r; y <= r; y++) for (let x = -r - 1; x <= r + 1; x++) if (x * x / 1.3 + y * y <= r * r && R() < 0.9) g.put(cx + x, cy + y, L.leaf[y < -r / 3 ? 2 : y < r / 3 ? 1 : 0]);
  g.box(125, 31, 126, 40, L.trunk);

  // The parapet, its coping, and drainage holes.
  g.box(0, PARA, GW - 1, FLOOR - 1, L.parapet);
  g.box(0, PARA, GW - 1, PARA, L.coping);
  g.box(0, FLOOR - 1, GW - 1, FLOOR - 1, L.paraDark);
  for (let x = 6; x < GW; x += 23) g.box(x, FLOOR - 2, x + 1, FLOOR - 2, L.paraDark);
  for (let x = 0; x < GW; x++) if ((x * 13) % 7 === 0) g.put(x, PARA + 2 + (x % 3), mix(L.parapet, '#4a5a4a', 0.25));   // monsoon moss

  // Wet terrace floor and the puddle.
  for (let y = FLOOR; y < GH; y++) for (let x = 0; x < GW; x++) g.put(x, y, (Math.sin(x / 7) + Math.sin(y / 3 + x / 19)) > 1.35 ? L.wet : L.floor);
  g.ellipse(88, 62, 28, 5.5, (x, y) => (y < -2 ? mix(L.puddle, L.puddleHi, 0.35) : L.puddle));
  for (let i = 0; i < 7; i++) { const x = 66 + Math.floor(R() * 44), y = 60 + Math.floor(R() * 4); if (Math.abs(x - 88) < 24 - Math.abs(y - 62) * 3) g.put(x, y, L.puddleHi); }

  // Pots on the parapet: tulsi in its brick planter, marigolds, a cactus, money plant.
  g.box(16, 38, 27, PARA - 1, '#b5543a'); g.box(16, 38, 27, 38, '#d06a4a'); g.box(19, 40, 24, 41, '#9a4430');
  for (const [cx, cy, r] of [[21, 34, 4], [18, 35, 2], [25, 35, 2]]) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r && R() < 0.85) g.put(cx + x, cy + y, L.leaf[(x + y) % 3 === 0 ? 2 : 1]);
  g.box(48, 40, 54, PARA - 1, '#c46a3e'); g.box(47, 40, 55, 40, '#d88050');
  for (const [x, y] of [[48, 38], [50, 37], [52, 38], [54, 37], [49, 36], [53, 36], [51, 35]]) { g.put(x, y, '#ff9f1c'); g.put(x, y + 1, L.leaf[1]); }
  g.box(102, 41, 106, PARA - 1, '#c46a3e'); g.box(103, 34, 104, 40, L.leaf[1]); g.box(101, 36, 101, 38, L.leaf[1]); g.box(106, 35, 106, 37, L.leaf[1]); g.put(104, 33, '#ff6f8e');
  g.box(158, 40, 164, PARA - 1, '#b5543a');
  for (let i = 0; i < 12; i++) g.put(158 + (i % 7), 39 - (i % 3), L.leaf[2]);
  for (let y = PARA; y < PARA + 6; y++) g.put(160 + (y % 2), y, L.leaf[1]);

  // Our tank on its brick stand, with the overflow pipe, and a cat under it.
  g.box(138, 40, 156, 41, '#9a4a34'); g.box(139, 42, 140, FLOOR + 1, '#8a4030'); g.box(154, 42, 155, FLOOR + 1, '#8a4030');
  g.box(139, 20, 155, 39, L.tankC);
  for (const y of [24, 29, 34]) g.box(139, y, 155, y, mix(L.tankC, '#ffffff', 0.12));
  g.box(141, 18, 153, 19, L.tankC); g.box(144, 17, 150, 17, mix(L.tankC, '#ffffff', 0.15));
  g.box(141, 21, 142, 38, mix(L.tankC, '#ffffff', 0.08));
  g.box(134, 22, 138, 22, '#c9ccd0'); g.put(134, 23, '#c9ccd0');
  g.box(145, 49, 149, 51, '#3a3a3e'); g.box(145, 48, 146, 48, '#3a3a3e'); g.put(145, 47, '#3a3a3e'); g.put(146, 47, '#3a3a3e');
  g.box(150, 51, 152, 51, '#3a3a3e'); g.put(146, 49, '#d8e060');

  // Things left out on the terrace: a bucket filling with rain, chappals, a plastic chair.
  g.box(30, 59, 37, 65, '#3a7ad0'); g.box(29, 58, 38, 58, '#5a96e6'); g.box(31, 66, 36, 66, '#2c62b0'); g.box(30, 59, 37, 59, '#a9c8f0');
  g.box(33, 56, 34, 56, '#6a6a70'); g.put(31, 57, '#6a6a70'); g.put(36, 57, '#6a6a70');
  g.box(44, 66, 46, 67, '#8a3a2a'); g.box(48, 67, 50, 68, '#8a3a2a'); g.put(45, 65, '#e0c040'); g.put(49, 66, '#e0c040');
  g.box(8, 54, 17, 55, '#e8eaee'); g.box(8, 56, 9, 62, '#d6d9de'); g.box(16, 56, 17, 62, '#d6d9de'); g.box(8, 47, 9, 53, '#e8eaee'); g.box(8, 47, 17, 48, '#e8eaee');
  for (let x = 10; x < 16; x += 2) g.box(x, 49, x, 53, '#d6d9de');

  // A frog by the puddle.
  g.box(116, 62, 118, 63, '#5aa040'); g.put(116, 61, '#7ac050'); g.put(118, 61, '#7ac050'); g.put(116, 61, '#7ac050'); g.box(115, 64, 119, 64, '#4a8a34');

  // The clothesline, sagging from its pole to the tank stand.
  const line = (x) => 26 + Math.round(3.5 * Math.sin((Math.PI * (x - 6)) / 132));
  g.box(5, 22, 6, FLOOR, '#7a6a5a');
  for (let x = 6; x <= 138; x++) g.put(x, line(x), '#4a4a50');
  const clothes = [[24, 6, 8, '#d23c3c', 'kurta'], [38, 5, 6, '#f2c84a', 'towel'], [50, 3, 12, '#e86aa8', 'dupatta'], [62, 6, 7, '#3c78c8', 'shirt'], [76, 2, 3, '#f4f4f4', 'sock'], [80, 2, 3, '#f4f4f4', 'sock'], [90, 5, 6, '#4aa86a', 'towel']];
  let wash = '';
  clothes.forEach(([x, w, h, c, kind], i) => {
    const top = line(x + Math.floor(w / 2));
    const cl = new Grid();
    cl.box(x, top + 1, x + w - 1, top + h, c);
    if (kind === 'towel') for (let yy = top + 2; yy <= top + h; yy += 2) cl.box(x, yy, x + w - 1, yy, mix(c, '#ffffff', 0.35));
    if (kind === 'kurta') { cl.box(x - 1, top + 1, x - 1, top + 3, c); cl.box(x + w, top + 1, x + w, top + 3, c); cl.box(x + 2, top + 1, x + 3, top + 2, mix(c, '#000000', 0.2)); }
    if (kind === 'shirt') { cl.box(x + 2, top + 1, x + 3, top + h, mix(c, '#ffffff', 0.25)); }
    if (kind === 'dupatta') for (let yy = top + 1; yy <= top + h; yy++) if (yy % 3 === 0) cl.box(x, yy, x + w - 1, yy, '#ffd23f');
    cl.put(x, top, '#e8d8a8'); cl.put(x + w - 1, top, '#e8d8a8');
    const piv = `${(x + w / 2) * PX} ${top * PX}`, a = 3 + (i % 3);
    wash += `<g transform="rotate(${a / 2} ${piv})">${cl.rects()}<animateTransform attributeName="transform" type="rotate" values="${-a} ${piv};${a} ${piv};${-a} ${piv}" dur="${r2(2.2 + i * 0.25)}s" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"/></g>`;
  });

  // Somebody at the parapet under a red umbrella, back to us.
  const p = new Grid(), ox = 44;
  p.box(66 + ox, 41, 70 + ox, 52, '#e8e2d4'); p.box(66 + ox, 47, 70 + ox, 52, '#3c4a7a'); p.box(65 + ox, 42, 65 + ox, 46, '#e8e2d4'); p.box(71 + ox, 42, 71 + ox, 45, '#e8e2d4');
  p.box(67 + ox, 38, 69 + ox, 40, '#1e1a18'); p.box(66 + ox, 53, 67 + ox, 53, '#2a2420'); p.box(69 + ox, 53, 70 + ox, 53, '#2a2420');
  p.box(68 + ox, 31, 68 + ox, 41, '#3a3a3a');
  for (let y = 0; y < 5; y++) { const half = 3 + y * 2; p.box(68 + ox - half, 27 + y, 68 + ox + half, 27 + y, y % 2 ? '#c42a2a' : '#e03a3a'); }
  p.box(57 + ox, 32, 79 + ox, 32, '#a82222'); p.put(68 + ox, 26, '#3a3a3a');
  const person = p.rects();

  // Rain: slanted streaks, each on its own loop.
  let rain = '';
  for (let i = 0; i < L.rainN; i++) {
    const x = Math.floor(R() * (SW + 120)), y0 = -40 - Math.floor(R() * 60), dur = r2(0.55 + R() * 0.35), begin = -r2(R() * dur);
    const len = 8 + Math.floor(R() * 6);
    rain += `<rect x="${x}" y="${y0}" width="2" height="${len}" fill="#eef5ff" opacity="${r2(L.rainA * (0.6 + R() * 0.4))}" transform="skewX(-14)">` +
      `<animateTransform attributeName="transform" type="translate" values="0,0;-60,${SH + 80}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" additive="sum"/></rect>`;
  }

  // Splashes on the terrace and rings on the puddle.
  let splash = '';
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(R() * GW) * PX, y = (FLOOR + 2 + Math.floor(R() * 18)) * PX, d = r2(0.5 + R() * 0.7), b = r2(R() * 2);
    splash += `<g opacity="0"><rect x="${x - 4}" y="${y - 3}" width="3" height="3" fill="#eef5ff"/><rect x="${x + 4}" y="${y - 3}" width="3" height="3" fill="#eef5ff"/><rect x="${x}" y="${y}" width="4" height="2" fill="#eef5ff"/>` +
      `<animate attributeName="opacity" values="0;0.8;0" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></g>`;
  }
  for (let i = 0; i < 6; i++) {
    const cx = (70 + Math.floor(R() * 36)) * PX, cy = (60 + Math.floor(R() * 4)) * PX, d = r2(1.2 + R()), b = r2(R() * 2);
    splash += `<ellipse cx="${cx}" cy="${cy}" rx="4" ry="1.5" fill="none" stroke="${L.puddleHi}" stroke-width="1.5" opacity="0"><animate attributeName="rx" values="3;20" dur="${d}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="ry" values="1;5" dur="${d}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></ellipse>`;
  }

  splash += `<ellipse cx="${33.5 * PX}" cy="${59.5 * PX}" rx="4" ry="1" fill="none" stroke="#e6f0ff" stroke-width="1.5" opacity="0"><animate attributeName="rx" values="3;14" dur="1.1s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0" dur="1.1s" repeatCount="indefinite"/></ellipse>`;

  // Overflow from the tank: a pixel stream that never stops.
  let pour = '';
  for (let k = 0; k < 7; k++) {
    const d = 0.7, b = -r2((k / 7) * d);
    pour += `<rect x="${134 * PX}" y="${24 * PX}" width="${PX}" height="${2 * PX}" fill="#dceaff" opacity="0.85"><animateTransform attributeName="transform" type="translate" values="0,0;-6,${27 * PX}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></rect>`;
  }

  // The paper boat, bobbing as it drifts across the puddle and back.
  const boat = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [3, -1], [3, -2], [2, -1], [4, -1]].map(([x, y]) => [x, y, y < 0 ? '#ffffff' : y === 1 ? '#d8dde4' : '#f2f4f7']);
  const paper = `<g transform="translate(${84 * PX},${60 * PX})"><g>${cellRects(boat, '#fff')}<animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="1.4s" repeatCount="indefinite"/></g>` +
    `<animateTransform attributeName="transform" type="translate" values="${70 * PX},${60 * PX};${98 * PX},${60 * PX};${70 * PX},${60 * PX}" dur="26s" repeatCount="indefinite"/></g>`;

  // Lightning: a bolt and a flash, every so often.
  let storm = '';
  if (L.lightning) {
    const bolt = new Grid();
    let bx = 96;
    for (let y = 2; y < 30; y++) { bx += [-1, 0, 1, 1, -1][Math.floor(R() * 5)]; bolt.put(bx, y, '#fffbe6'); bolt.put(bx + 1, y, '#fff2b0'); if (y === 14) for (let k = 1; k < 7; k++) bolt.put(bx - k, y + k, '#fff2b0'); }
    const kt = 'values="0;0;1;0;0.8;0" keyTimes="0;0.88;0.885;0.9;0.91;1"';
    storm = `<g opacity="0">${bolt.rects()}<animate attributeName="opacity" ${kt} dur="8s" repeatCount="indefinite"/></g>` +
      `<rect width="${SW}" height="${SH}" fill="#e8eeff" opacity="0"><animate attributeName="opacity" values="0;0;0.35;0;0.22;0" keyTimes="0;0.88;0.885;0.9;0.91;1" dur="8s" repeatCount="indefinite"/></rect>`;
  }

  const rainbow = L.rainbow ? (() => {
    const rb = new Grid(), bands = ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'];
    for (let y = 0; y < 34; y++) for (let x = 90; x < GW; x++) { const i = Math.floor(Math.hypot((x - 140) / 1.2, y - 44) - 30); if (i >= 0 && i < 6) rb.put(x, y, bands[i]); }
    return `<g opacity="${L.rainbow}">${rb.rects()}</g>`;
  })() : '';
  const lamp = L.street ? `<circle cx="${30 * PX}" cy="${30 * PX}" r="90" fill="url(#lamp)" opacity="0.5"/><rect x="${30 * PX}" y="${29 * PX}" width="${2 * PX}" height="${PX}" fill="#ffe6a8"/>` : '';
  const mist = L.mist ? `<rect x="0" y="${24 * PX}" width="${SW}" height="${16 * PX}" fill="#f4e8ee" opacity="0.3"/>` : '';

  return {
    defs: glowDef('lamp', '#ffcf73'),
    body: skyBands(L.sky, 40) + rainbow + clouds(R, [[10, 6, 26, 160], [60, 3, 30, 190], [120, 8, 24, 150], [150, 2, 20, 130], [90, 12, 18, 120]], L.cloud, L.cloudShade, 1) +
      storm.split('<rect width')[0] + g.rects() + lamp + mist + wash + pour + person + paper + splash + rain + (storm ? '<rect width' + storm.split('<rect width')[1] : ''),
    ink: L.ink, sub: L.sub, caption: L.caption, shadow: L.shadow,
    desc: `Pixel art of a terrace in ${P.place.name} in the monsoon: rain slanting over pastel rooftops with black water tanks and a neem tree, tulsi, marigolds and a cactus on the parapet, washing swaying on the line, the tank overflowing, a cat keeping dry under its stand, a frog by a puddle with a paper boat on it, and someone at the parapet under a red umbrella${L.lightning ? ', with lightning' : ''}${L.rainbow ? ', and a faint rainbow' : ''}.`,
  };
}
