/* balloons
 *
 * Hot air balloons rising over a patchwork valley: quilted fields, a river
 * winding through, red-roofed farms, hedgerows, a church spire, mountains
 * behind. Each balloon has its own pattern, rises at its own pace, sways a
 * little, and its burner flickers. After dark they're tethered low for a
 * night glow, each envelope lighting up like a lantern when its burner
 * fires.
 */
import { r2, rng, mix, Grid, cellRects, PX, GW, GH, SW, SH, skyBands, stars, clouds, birds, glowDef, ridge } from '../lib.mjs';

const HZ = 40;

const PAL = {
  dawn:  { sky: ['#7a9ad8', '#a2a6d8', '#ccaed2', '#eebcc0', '#fbcca8', '#fee0b4'], mtn: ['#a8a2c8', '#8a86b0'], fields: ['#9cc87a', '#b8d48a', '#d8d08a', '#8ab86c', '#c4c47e'], river: '#c8d0ec', roof: '#c85a44', ink: '#2a2350', sub: '#4a3d73', caption: '#3a3050', cloud: '#fff2ee', cloudShade: '#f0cad0', night: false, birds: '#5a5070', mist: true },
  day:   { sky: ['#3ea6ec', '#52b0ef', '#6abcf2', '#84c8f4', '#9ed4f6', '#bae0f8'], mtn: ['#9ac4d8', '#7aa8c4'], fields: ['#7ccf52', '#a8dc6a', '#e8d468', '#5ab848', '#c8d860'], river: '#7ac8f0', roof: '#d8503a', ink: '#0e2a47', sub: '#1d4a70', caption: '#1e3a2a', cloud: '#ffffff', cloudShade: '#dceefa', night: false, birds: '#2b4a66' },
  dusk:  { sky: ['#4a5cb8', '#7a62b0', '#b46a9c', '#e47e80', '#f9a068', '#fec880'], mtn: ['#8a6e98', '#6e5682'], fields: ['#a8b054', '#c4bc5e', '#e0a85a', '#8a9a48', '#c8a456'], river: '#f0b890', roof: '#b8442e', ink: '#2b1c48', sub: '#4d2f5e', caption: '#fff4e6', shadow: '#3a2a4a', cloud: '#ffd2b8', cloudShade: '#e8a0a0', night: false, birds: '#3d2a48' },
  night: { sky: ['#070b22', '#0b112c', '#101836', '#151e40', '#1a264a', '#203054'], mtn: ['#1e2a48', '#18223c'], fields: ['#1e3a2c', '#24402e', '#2e3a28', '#1a3426', '#28382a'], river: '#3a5a8a', roof: '#4a2a24', ink: '#f1f4ff', sub: '#c4cfe8', caption: '#dfe8f5', shadow: '#070b22', cloud: '#2a3660', cloudShade: '#1e2850', night: true, stars: true },
};

const ENVELOPES = [
  ['#e63946', '#ffd23f', 'stripes'], ['#2ec4b6', '#ffffff', 'stripes'], ['#7b5cff', '#ffb627', 'band'],
  ['#ff7a1a', '#ffe8c8', 'chevron'], ['#2a7ad8', '#ff4f8b', 'stripes'], ['#ffd23f', '#e63946', 'band'],
];

function balloon(scale, [c1, c2, pat], lit) {
  const g = new Grid(40, 40), cx = 20, top = 2;
  const R = 8 * scale, H = Math.round(R * 2.3);
  for (let y = 0; y < H; y++) {
    const t = y / H;
    const half = t < 0.62 ? Math.sqrt(Math.max(0, 1 - ((t - 0.42) / 0.42) ** 2)) * R : R * (1 - (t - 0.62) / 0.38) * 0.82 + 1;
    const hw = Math.max(1, Math.round(half));
    for (let x = -hw; x <= hw; x++) {
      const gore = Math.floor(((x / hw) + 1) * 3);
      let c = pat === 'stripes' ? (gore % 2 ? c1 : c2) : pat === 'band' ? (t > 0.38 && t < 0.52 ? c2 : c1) : ((gore + Math.floor(t * 8)) % 2 ? c1 : c2);
      if (x > hw * 0.45) c = mix(c, '#000000', 0.18);
      if (x < -hw * 0.5 && t < 0.4) c = mix(c, '#ffffff', 0.18);
      if (lit) c = mix(c, '#ffe0a0', 0.25);
      g.put(cx + x, top + y, c);
    }
  }
  const bt = top + H + Math.round(2 * scale);
  g.line(cx - Math.round(R * 0.3), top + H - 1, cx - 1, bt, '#5a4a3a'); g.line(cx + Math.round(R * 0.3), top + H - 1, cx + 1, bt, '#5a4a3a');
  const bw = Math.max(1, Math.round(scale * 1.5));
  g.box(cx - bw, bt, cx + bw, bt + Math.max(1, Math.round(scale * 1.5)), '#8a5a30');
  return { g, burner: [cx, top + H + 1], cx, top, H, R };
}

export function balloons(phase) {
  const L = PAL[phase];
  const R = rng(1783);
  const g = new Grid();

  // Mountains, then the valley quilt in perspective.
  const far = ridge([[22, 26, 1.3], [64, 22, 1.1], [110, 27, 1.4], [150, 21, 1.2]], HZ, 0.5);
  const near = ridge([[40, 33, 3], [96, 34, 3.4], [146, 32, 2.8]], HZ, 0.3);
  for (let x = 0; x < GW; x++) {
    for (let y = far[x]; y <= HZ; y++) g.put(x, y, !L.night && y < far[x] + 3 && far[x] < 30 ? '#ffffff' : L.mtn[0]);
    for (let y = near[x]; y <= HZ; y++) g.put(x, y, L.mtn[1]);
  }
  let row = HZ, k = 0;
  while (row < GH) {
    const h = 2 + Math.floor((row - HZ) / 5);
    let x = -Math.floor(R() * 10), j = 0;
    while (x < GW) {
      const w = 8 + Math.floor(R() * 10) + h * 2;
      const c = L.fields[(k + j * 3 + Math.floor(R() * 2)) % L.fields.length];
      g.box(x, row, x + w - 1, row + h - 1, c);
      if (h > 3 && (j + k) % 2 === 0) for (let yy = row + 1; yy < row + h; yy += 2) g.box(x + 1, yy, x + w - 2, yy, mix(c, '#000000', 0.08));   // furrows
      g.box(x + w - 1, row, x + w - 1, row + h - 1, mix(L.fields[3], '#000000', 0.3));                                                      // hedgerow
      x += w; j++;
    }
    g.box(0, row, GW - 1, row, mix(L.fields[3], '#000000', 0.25));
    row += h; k++;
  }
  // A river winding toward us.
  for (let y = HZ; y < GH; y++) {
    const t = (y - HZ) / (GH - HZ), cx = 70 + 26 * Math.sin(t * 4.2) + t * 20, w = 1 + t * 5;
    for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) g.put(x, y, Math.abs(x - cx) > w - 1 ? mix(L.river, '#ffffff', 0.3) : L.river);
  }
  // Farms, trees, a spire.
  for (const [fx, fy, s] of [[24, 46, 1], [120, 44, 1], [150, 52, 2], [40, 60, 2], [100, 64, 2]]) {
    g.box(fx, fy - 2 * s, fx + 4 * s, fy, L.night ? '#5a5048' : '#f4ecdc'); g.box(fx - 1, fy - 3 * s, fx + 4 * s + 1, fy - 2 * s - 1, L.roof);
    if (L.night) g.put(fx + s, fy - s, '#ffcf6b');
  }
  for (let i = 0; i < 26; i++) { const x = Math.floor(R() * GW), y = HZ + 2 + Math.floor(R() * (GH - HZ - 2)), s = y > 58 ? 2 : 1; g.disc(x, y, s, mix(L.fields[3], '#000000', 0.35)); }
  g.box(132, 37, 135, HZ + 2, L.night ? '#4a4a5a' : '#e8e2d8'); for (let y = 0; y < 6; y++) g.put(133 + (y % 2 ? 1 : 0), 31 + y, L.night ? '#4a4a5a' : '#e8e2d8');

  let body = '';

  // Balloons. By day they rise through the frame on long loops; at night they
  // sit tethered low and glow when their burners fire.
  const specs = [[0.7, 30, 52, 34], [1.0, 78, 60, 46], [0.55, 104, 40, 30], [1.25, 132, 72, 56], [0.85, 158, 48, 40], [0.6, 56, 44, 28]];
  specs.forEach(([sc, x, dur, sway], i) => {
    const lit = L.night;
    const b = balloon(sc, ENVELOPES[i % ENVELOPES.length], lit);
    const ox = (x - 20) * PX, size = (b.H + 6) * PX;
    const flame = `<rect x="${b.burner[0] * PX - 2}" y="${b.burner[1] * PX}" width="${PX}" height="${PX * 1.4}" fill="#ffb627" opacity="0"><animate attributeName="opacity" values="0;0;1;0.6;1;0" keyTimes="0;0.6;0.65;0.75;0.85;1" dur="${r2(2.2 + i * 0.4)}s" repeatCount="indefinite"/></rect>`;
    const glow = lit ? `<ellipse cx="${b.cx * PX}" cy="${(b.top + b.H * 0.45) * PX}" rx="${b.R * PX * 1.6}" ry="${b.R * PX * 1.8}" fill="url(#envglow)" opacity="0.15"><animate attributeName="opacity" values="0.15;0.15;0.85;0.5;0.85;0.15" keyTimes="0;0.6;0.65;0.75;0.85;1" dur="${r2(2.2 + i * 0.4)}s" repeatCount="indefinite"/></ellipse>` : '';
    const art = `${glow}${b.g.rects()}${flame}`;
    const swayG = `<g>${art}<animateTransform attributeName="transform" type="translate" values="0,0;${r2(sway / 10)},2;0,0;${r2(-sway / 10)},-2;0,0" dur="${r2(6 + i)}s" repeatCount="indefinite"/></g>`;
    if (lit) {
      const y = (GH - b.H - 14 - (i % 3) * 3) * PX;
      body += `<g transform="translate(${ox},${y})">${swayG}<path d="M${b.cx * PX} ${(b.top + b.H + 4) * PX} L${b.cx * PX - 10} ${SH - y}" stroke="#6a6a7a" stroke-width="1" opacity="0.6"/></g>`;
    } else {
      const y0 = SH + 20, y1 = -size - 20, begin = -r2(((i * 0.37) % 1) * dur);
      body += `<g transform="translate(${ox},${r2((y0 + y1) / 2)})">${swayG}<animateTransform attributeName="transform" type="translate" values="${ox},${y0};${ox + sway},${r2((y0 + y1) / 2)};${ox + sway * 1.6},${y1}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g>`;
    }
  });

  const mist = L.mist ? `<rect x="0" y="${(HZ - 1) * PX}" width="${SW}" height="${5 * PX}" fill="#fff4ec" opacity="0.4"/>` : '';
  const sun = phase === 'day' ? `<circle cx="${150 * PX}" cy="${8 * PX}" r="80" fill="url(#sun)" opacity="0.5"/><rect x="${147 * PX}" y="${5 * PX}" width="${7 * PX}" height="${7 * PX}" rx="12" fill="#fff6d2"/>`
    : phase === 'dawn' ? `<circle cx="${44 * PX}" cy="${36 * PX}" r="110" fill="url(#sun)" opacity="0.7"/>`
    : phase === 'dusk' ? `<circle cx="${120 * PX}" cy="${34 * PX}" r="120" fill="url(#sun)" opacity="0.8"/>` : '';

  return {
    defs: glowDef('envglow', '#ffcf73', 0.8) + glowDef('sun', '#fff0b0', 0.8),
    body: skyBands(L.sky, HZ) + sun + (L.stars ? stars(R, 90, 30) : '') + clouds(R, [[16, 14, 18, 160], [96, 8, 14, 140], [150, 24, 12, 120]], L.cloud, L.cloudShade, L.night ? 0.4 : 0.9) +
      g.rects() + mist + (L.birds ? birds(L.birds, 3, 20, 34) : '') + body,
    ink: L.ink, sub: L.sub, caption: L.caption, shadow: L.shadow, local: false,
    desc: L.night ? 'Pixel art of a balloon night glow: six hot air balloons tethered low over a dark patchwork valley, each envelope lighting up like a lantern when its burner fires, under the stars.'
      : 'Pixel art of six hot air balloons with different patterns rising over a patchwork valley of quilted fields, a winding river, red-roofed farms, a church spire and mountains, their burners flickering.',
  };
}
