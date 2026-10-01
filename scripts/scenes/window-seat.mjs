/* window seat
 *
 * The window seat of a sleeper coach somewhere out of Bhilai. Seafoam walls,
 * barred window, a louvred shutter half down. Outside, the country slides
 * past in four layers at four speeds: hills, then fields with trees, huts, a
 * palm and a little temple, then the electric poles, then the trackside
 * scrub. A kulhad of chai steams on the sill next to a newspaper and a cone of
 * peanuts, the cage fan spins, and the whole view rocks with the rails.
 * After dark the village lights go by and the tube light comes on.
 */
import { P, PIXEL, r2, rng, mix, Grid, cellRects, PX, GW, GH, SW, SH, skyBands, stars, clouds, birds, wisp, glowDef } from '../lib.mjs';

// Window opening, in grid units.
const WX0 = 8, WX1 = 167, WY0 = 20, WY1 = 63;
const IX0 = WX0 + 2, IX1 = WX1 - 2, IY0 = WY0 + 2, IY1 = WY1 - 2;
const IW = IX1 - IX0 + 1;                   // one period of every scrolling layer
const HZ = 47;                              // horizon row outside

const PAL = {
  day: {
    sky: ['#4aa9ec', '#62b5ef', '#7cc2f2', '#98cff4', '#b3dbf6', '#cde7f8'],
    sun: { x: 140, y: 33, r: 3, c: '#fff6d2', rim: '#ffe28a' },
    hill: '#8fbfb4', field: ['#8fd457', '#7cc64c'], fieldDark: '#5fa93c', tree: ['#2e8a43', '#46a853', '#6cc463'], trunk: '#6b4428',
    wall: '#86b3a8', wallDark: '#6f9c91', wallLight: '#a3cbc0', frame: '#d3dadd', frameDark: '#98a4ab', bar: '#b9c4ca', barHi: '#eef2f4',
    hut: '#f1d3a8', roof: '#d0582e', temple: '#fbf6ec', flag: '#ff8c1a', pole: '#5b5f66', wire: '#3f444b', scrub: ['#3d7a35', '#4f9440'],
    ink: '#163f39', sub: '#25544c', caption: '#1f4a43', clouds: true, birds: '#2b4a66', lights: 0, tube: false,
  },
  dawn: {
    sky: ['#8fb0e0', '#b2b5dc', '#d7b9d2', '#f2c0bd', '#fbd0a8', '#fee2b6'],
    sun: { x: 36, y: 44, r: 4, c: '#ffe7b0', rim: '#ffc88a' },
    hill: '#a9a3c3', field: ['#9fce73', '#8fc266'], fieldDark: '#74a64f', tree: ['#36704a', '#4b8a57', '#6ea86a'], trunk: '#5f3d27',
    wall: '#8faea6', wallDark: '#7a978f', wallLight: '#a9c3bb', frame: '#d8d6da', frameDark: '#a29fa8', bar: '#bfbfc6', barHi: '#f2eeee',
    hut: '#f1d2b2', roof: '#cf5a3a', temple: '#fff1e6', flag: '#ff8c3a', pole: '#615d68', wire: '#4a4652', scrub: ['#4a7240', '#5a8a4a'],
    ink: '#2c3a52', sub: '#45506a', caption: '#3a4a5a', clouds: true, birds: '#4a4366', lights: 0.25, tube: false, mist: true,
  },
  dusk: {
    sky: ['#5a6fc0', '#8c74b6', '#c97ea0', '#f0927f', '#fbae68', '#fed38a'],
    sun: { x: 118, y: 43, r: 5, c: '#fff0b0', rim: '#ffb554' },
    hill: '#8a6f95', field: ['#b0bf55', '#9fb24a'], fieldDark: '#86973c', tree: ['#2f4d2e', '#456a36', '#6a8a42'], trunk: '#4a2e1e',
    wall: '#93a894', wallDark: '#7c917e', wallLight: '#adbfa8', frame: '#dcd2c8', frameDark: '#a8998c', bar: '#c4b8ac', barHi: '#fff1e2',
    hut: '#f0c89a', roof: '#c4502c', temple: '#ffe8cc', flag: '#ff7a1a', pole: '#4a3a46', wire: '#3a2c38', scrub: ['#3a5a2c', '#4a6c36'],
    ink: '#2a2340', sub: '#4a3a55', caption: '#3a3040', clouds: true, birds: '#3d2a48', lights: 0.55, tube: false,
  },
  night: {
    sky: ['#0f1c40', '#142450', '#1a2c5c', '#213669', '#294176', '#324c84'],
    moon: { x: 128, y: 31, r: 3 },
    hill: '#1f3156', field: ['#1f4433', '#1b3d2e'], fieldDark: '#163428', tree: ['#0f2a22', '#163a2c', '#1f4a37'], trunk: '#2a1e17',
    wall: '#5a7d76', wallDark: '#4a6b65', wallLight: '#6c918a', frame: '#9aa6ab', frameDark: '#6f7a80', bar: '#87929a', barHi: '#c8d0d4',
    hut: '#6e6052', roof: '#5a2b20', temple: '#b8b0a2', flag: '#a85a20', pole: '#0c1220', wire: '#0a0f1a', scrub: ['#0e1f18', '#132a20'],
    ink: '#f1f4ff', sub: '#d6e0f2', caption: '#dfe8f5', clouds: false, birds: null, lights: 1, tube: true, stars: true,
  },
};

/** Integer harmonics keep every layer seamless over one period of IW columns. */
const wave = (x, k, a, ph = 0) => a * Math.sin((2 * Math.PI * k * x) / IW + ph);

function scrolling(paint, dur, id) {
  const g = new Grid(IW * 2, GH);
  paint(g);
  return `<g>${g.rects(IX0)}<animateTransform attributeName="transform" type="translate" values="0,0;${-IW * PX},0" dur="${dur}s" repeatCount="indefinite"/></g>`;
}

export function windowSeat(phase) {
  const L = PAL[phase];
  const R = rng(32);

  // ── outside ──
  const sky = `<g transform="translate(0,${IY0 * PX})">${skyBands(L.sky, HZ - IY0)}</g>`;
  const orb = new Grid();
  if (L.sun) { orb.disc(L.sun.x, L.sun.y, L.sun.r + 1, L.sun.rim); orb.disc(L.sun.x, L.sun.y, L.sun.r, L.sun.c); }
  if (L.moon) { orb.disc(L.moon.x, L.moon.y, L.moon.r, '#f6f1dc'); orb.put(L.moon.x - 1, L.moon.y, '#ddd5b8'); orb.put(L.moon.x + 1, L.moon.y + 1, '#ddd5b8'); }
  const halo = L.sun ? `<circle cx="${L.sun.x * PX}" cy="${L.sun.y * PX}" r="${L.sun.r * PX * 5}" fill="url(#halo)" opacity="0.7"/>`
    : `<circle cx="${L.moon.x * PX}" cy="${L.moon.y * PX}" r="${L.moon.r * PX * 5}" fill="url(#halo)" opacity="0.35"/>`;
  const starField = L.stars ? stars(R, 50, HZ - 2, (x, y) => y < IY0 || x < IX0 || x > IX1) : '';
  const cloudLayer = L.clouds ? clouds(R, [[30, 29, 14, 70], [100, 27, 18, 90], [150, 33, 10, 60]], '#ffffff', mix(L.sky[3], '#ffffff', 0.5), 0.85) : '';

  const hills = scrolling((g) => {
    for (let x = 0; x < IW * 2; x++) {
      const top = Math.round(38 + wave(x, 2, 3) + wave(x, 5, 1.6, 1) + wave(x, 9, 0.7, 2));
      g.box(x, top, x, HZ, L.hill);
    }
  }, 120);

  const mid = scrolling((g) => {
    for (let y = HZ; y <= IY1; y++) for (let x = 0; x < IW * 2; x++) {
      const band = Math.floor(Math.sqrt(y - HZ + 0.5) * 2.2) % 2;
      g.put(x, y, (x * 3 + y * 5) % 9 === 0 && y > HZ + 2 ? L.fieldDark : L.field[band]);
    }
    for (const off of [0, IW]) {
      // trees
      for (const [tx, r] of [[6, 5], [16, 3], [27, 4], [41, 6], [73, 4], [96, 5], [131, 6], [147, 4]]) {
        const x = off + tx;
        g.box(x, HZ - 2, x, HZ + 1, L.trunk); if (r > 4) g.box(x + 1, HZ - 2, x + 1, HZ + 1, mix(L.trunk, '#000000', 0.25));
        for (let y = -r; y <= r; y++) for (let dx = -r - 1; dx <= r + 1; dx++) if (dx * dx / 1.3 + y * y <= r * r) {
          const shade = y < -r / 3 ? 2 : y < r / 3 ? 1 : 0;
          g.put(x + dx, HZ - 2 - r + y, L.tree[dx < 0 && shade < 2 ? shade + 1 : shade]);
        }
      }
      // a hut
      const hx = off + 55;
      g.box(hx, HZ - 3, hx + 7, HZ, L.hut);
      for (let y = 0; y < 3; y++) g.box(hx - 1 + y, HZ - 6 + y, hx + 8 - y, HZ - 6 + y, y % 2 ? mix(L.roof, '#000000', 0.2) : L.roof);
      g.box(hx + 3, HZ - 2, hx + 4, HZ, mix(L.trunk, '#000000', 0.2));
      if (L.lights) g.put(hx + 1, HZ - 2, '#ffcf6b');
      // a palm
      const px = off + 84;
      for (let y = 0; y < 14; y++) { const dx = Math.round(Math.sin(y / 5) * 1.6); g.put(px + dx, HZ - y, L.trunk); g.put(px + dx + 1, HZ - y, mix(L.trunk, '#000000', 0.25)); }
      const [cx, cy] = [px + 1, HZ - 14];
      const fronds = [[-1, -1], [-2, -1], [-3, -1], [-4, 0], [-5, 1], [-5, 2], [1, -1], [2, -1], [3, -1], [4, 0], [5, 1], [5, 2],
        [-1, -2], [-2, -3], [-3, -3], [1, -2], [2, -3], [3, -3], [-2, 0], [-3, 1], [2, 0], [3, 1], [0, -1], [0, -2]];
      for (const [dx, dy] of fronds) g.put(cx + dx, cy + dy, Math.abs(dx) > 3 || dy < -2 ? L.tree[0] : L.tree[1]);
      g.put(cx, cy, '#8a6a2a'); g.put(cx + 1, cy, '#7a5a22');
      // a small temple with a saffron flag
      const tx = off + 110;
      g.box(tx, HZ - 4, tx + 6, HZ, L.temple);
      for (let y = 0; y < 6; y++) g.box(tx + 1 + Math.floor(y / 2), HZ - 5 - y, tx + 5 - Math.floor(y / 2), HZ - 5 - y, L.temple);
      g.box(tx + 3, HZ - 14, tx + 3, HZ - 11, L.pole);
      g.box(tx + 4, HZ - 14, tx + 6, HZ - 13, L.flag);
      g.box(tx + 2, HZ - 2, tx + 4, HZ, mix(L.temple, '#5a3a22', 0.6));
      if (L.lights) g.put(tx + 3, HZ - 2, '#ffd27a');
      // village lights scattered after dusk
      if (L.lights) for (const lx of [14, 34, 50, 66, 101, 121, 140]) if ((lx * 7) % 10 < L.lights * 10) g.put(off + lx, HZ - 1 + (lx % 3), '#ffcf6b');
    }
  }, 34);

  const poles = scrolling((g) => {
    for (let k = 0; k < (IW * 2) / 52; k++) {
      const x = k * 52 + 20;
      g.box(x, IY0 + 4, x, IY1 - 1, L.pole);
      g.box(x - 3, IY0 + 6, x + 3, IY0 + 6, L.pole);
      for (const [wy, sag] of [[IY0 + 8, 2]]) for (let dx = 0; dx <= 52; dx++) {
        const t = dx / 52, y = wy + Math.round(sag * 4 * t * (1 - t));
        g.put(x + dx, y, L.wire);
      }
    }
  }, 7);

  const scrub = scrolling((g) => {
    for (let x = 0; x < IW * 2; x++) {
      const top = Math.round(IY1 - 1 + wave(x, 13, 1.2) + wave(x, 31, 0.8, 1));
      for (let y = top; y <= IY1; y++) g.put(x, y, L.scrub[(x + y) % 5 === 0 ? 1 : 0]);
    }
  }, 2.4);

  const mist = L.mist ? `<rect x="${IX0 * PX}" y="${(HZ - 2) * PX}" width="${IW * PX}" height="${4 * PX}" fill="#fff4ec" opacity="0.35"/>` : '';
  const flock = L.birds ? birds(L.birds, 3, IY0 + 3, 30) : '';
  const outside = `<g clip-path="url(#win)"><g>${sky}${halo}${starField}${orb.rects()}${cloudLayer}${flock}${hills}${mist}${mid}${poles}${scrub}` +
    `<animateTransform attributeName="transform" type="translate" values="0,0;0,2;0,0;0,1;0,0" dur="1.15s" repeatCount="indefinite"/></g>` +
    `<path d="M${(IX0 + 18) * PX} ${IY0 * PX} l60 0 l-110 ${(IY1 - IY0 + 1) * PX} l-60 0 Z M${(IX0 + 96) * PX} ${IY0 * PX} l24 0 l-110 ${(IY1 - IY0 + 1) * PX} l-24 0 Z" fill="#ffffff" opacity="${L.stars ? 0.05 : 0.09}"/></g>`;

  // ── inside: wall, window frame, louvred shutter, bars, sill ──
  const g = new Grid();
  g.box(0, 0, GW - 1, GH - 1, L.wall);
  for (let y = 0; y < GH; y += 18) g.box(0, y, GW - 1, y, mix(L.wall, L.wallLight, 0.5));        // panel seams
  g.box(WX0 - 2, WY0 - 2, WX1 + 2, WY1 + 2, L.wallDark);
  g.box(WX0, WY0, WX1, WY1, L.frame);
  g.box(WX0, WY1 - 1, WX1, WY1, L.frameDark);
  for (let y = IY0; y <= IY1; y++) for (let x = IX0; x <= IX1; x++) g.c[y][x] = null;
  for (const [x, y] of [[IX0, IY0], [IX1, IY0], [IX0, IY1], [IX1, IY1]]) g.put(x, y, L.frame);
  for (let y = IY0; y < IY0 + 3; y++) g.box(IX0, y, IX1, y, y % 2 ? L.frameDark : L.frame);   // shutter, part way down
  g.box(IX0, IY0 + 3, IX1, IY0 + 3, L.frameDark);
  for (const by of [32, 43, 53]) { g.box(IX0, by, IX1, by, L.bar); g.box(IX0, by - 1, IX1, by - 1, L.barHi); }
  g.box(WX0 - 3, WY1 + 1, WX1 + 3, WY1 + 3, L.frame); g.box(WX0 - 3, WY1 + 3, WX1 + 3, WY1 + 3, L.frameDark);

  // On the sill: newspaper, a paper cone of peanuts, a kulhad of chai.
  g.box(26, 61, 42, 63, '#f1ece0'); for (let x = 27; x < 42; x += 2) g.put(x, 62, '#b9b2a2'); g.box(26, 61, 42, 61, '#d9d2c2'); g.box(28, 61, 33, 61, '#c84a3a');
  for (let y = 0; y < 5; y++) g.box(60 + Math.floor(y / 2), 59 + y, 64 - Math.floor(y / 2), 59 + y, y === 0 ? '#c9a46a' : '#e0c08a');
  g.put(61, 58, '#a8743a'); g.put(63, 58, '#b8844a'); g.put(62, 57, '#a8743a');
  g.box(122, 59, 127, 59, '#9a4a28'); g.box(122, 60, 127, 63, '#b8643a'); g.box(123, 64, 126, 64, '#9a4a28'); g.box(123, 59, 126, 59, '#7a4a2a');
  g.box(127, 60, 127, 62, '#a65530');

  // Berth number stencilled on the wall.
  const stencil = `<text x="${10 * PX}" y="${70.5 * PX}" font-family="${PIXEL}" font-weight="700" font-size="14" fill="${L.wallDark}">S4  32</text>`;

  // The cage fan in the corner, always on.
  const fx = 162 * PX, fy = 10 * PX;
  const fan = `<g><circle cx="${fx}" cy="${fy}" r="34" fill="none" stroke="${L.frameDark}" stroke-width="3"/><circle cx="${fx}" cy="${fy}" r="22" fill="none" stroke="${L.frameDark}" stroke-width="2" opacity="0.7"/>` +
    `<g>${[0, 120, 240].map((a) => `<rect x="${fx - 4}" y="${fy - 30}" width="8" height="26" rx="4" fill="${L.frame}" transform="rotate(${a} ${fx} ${fy})"/>`).join('')}` +
    `<animateTransform attributeName="transform" type="rotate" values="0 ${fx} ${fy};360 ${fx} ${fy}" dur="0.45s" repeatCount="indefinite"/></g>` +
    `<circle cx="${fx}" cy="${fy}" r="6" fill="${L.frameDark}"/>${[0, 45, 90, 135].map((a) => `<rect x="${fx - 34}" y="${fy - 1}" width="68" height="2" fill="${L.frameDark}" opacity="0.6" transform="rotate(${a} ${fx} ${fy})"/>`).join('')}</g>`;

  const tube = L.tube
    ? `<rect x="${92 * PX}" y="${2 * PX}" width="${30 * PX}" height="${PX}" fill="#f4fbff"/><ellipse cx="${107 * PX}" cy="${3 * PX}" rx="260" ry="90" fill="url(#tube)"/>`
    : `<rect x="${92 * PX}" y="${2 * PX}" width="${30 * PX}" height="${PX}" fill="${L.frameDark}"/>`;
  const steam = wisp(124.5, 58, 4, 2.8, 6, -34, '#ffffff', 0.75);

  return {
    defs: `<clipPath id="win"><rect x="${IX0 * PX}" y="${IY0 * PX}" width="${IW * PX}" height="${(IY1 - IY0 + 1) * PX}"/></clipPath>` +
      glowDef('halo', L.sun ? L.sun.rim : '#cfd8ff') + glowDef('tube', '#eaf6ff', 0.35),
    body: outside + g.rects() + stencil + fan + tube + steam,
    ink: L.ink, sub: L.sub, caption: L.caption,
    desc: `Pixel art from the window seat of a sleeper coach near ${P.place.name}: seafoam walls, a barred window with the shutter half down, and outside the country sliding past in layers at different speeds, hills, fields with trees, a hut, a palm and a small temple, electric poles and trackside scrub. A kulhad of chai steams on the sill beside a newspaper and a cone of peanuts, the cage fan spins, and the view rocks with the rails${L.lights ? '; village lights pass in the dark' : ''}.`,
  };
}
