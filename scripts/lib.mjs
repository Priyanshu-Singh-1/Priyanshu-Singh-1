/**
 * lib.mjs: everything the plates share. Data, fonts, theme tokens, the SVG
 * wrapper, the pixel grid, and a few motion helpers used by several scenes.
 */
import { readFileSync, existsSync } from 'node:fs';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
export const P = read('profile.json');
export const S = existsSync(new URL('../data/stats.json', import.meta.url)) ? read('stats.json') : { days: [], monthly: {} };
const FONTS = read('fonts.json');
export const ICONS = read('icons.json');

export const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
export const PIXEL = "'Silkscreen','JetBrains Mono',ui-monospace,monospace";
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
export const r2 = (n) => Math.round(n * 100) / 100;
export function fontFace(families) {
  return families.flatMap((fam) => Object.entries(FONTS[fam] || {}).map(([w, b64]) =>
    `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${b64}) format('woff2')}`)).join('');
}

/* Card tokens. A quiet slate ground and one marigold accent; the heat ramp,
   ember to cream, is kept for data. The scene has its own palettes. */

export const THEME = {
  dark: {
    bg: '#0e1319', panel: '#121922', panel2: '#161f2a', line: '#232f3d', ink: '#ece8df', mute: '#8e99a8', dim: '#566273',
    accent: '#ffb02e', accentTint: '#2a2414',
    ramp: ['#18202a', '#40201a', '#7c2915', '#c4421a', '#f7822b', '#ffd27e'],
  },
  light: {
    bg: '#f3f5f7', panel: '#ffffff', panel2: '#f6f8fa', line: '#d5dce4', ink: '#17202a', mute: '#586577', dim: '#8793a2',
    accent: '#b86200', accentTint: '#fff4e3',
    ramp: ['#e3e8ee', '#f8d6b6', '#f1a56c', '#e06a2f', '#bf421a', '#7b2310'],
  },
};


export function svg({ w, h, title, desc, fonts = [], css = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
<style><![CDATA[${fontFace(fonts)}${css}]]></style>
${body}
</svg>
`;
}

/** mulberry32: deterministic scatter, so a redraw doesn't reshuffle the stars. */

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}


/* ── the pixel world ── */

export const PX = 5, GW = 176, GH = 72, SW = GW * PX, SH = GH * PX;

export class Grid {
  constructor(w = GW, h = GH) { this.w = w; this.h = h; this.c = Array.from({ length: h }, () => new Array(w).fill(null)); }
  put(x, y, c) { x = Math.round(x); y = Math.round(y); if (c && x >= 0 && x < this.w && y >= 0 && y < this.h) this.c[y][x] = c; }
  get(x, y) { return this.c[y]?.[x] ?? null; }
  box(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.put(x, y, c); }
  disc(cx, cy, r, c) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) this.put(cx + x, cy + y, c); }
  ellipse(cx, cy, rx, ry, c) { for (let y = Math.floor(-ry); y <= Math.ceil(ry); y++) for (let x = Math.floor(-rx); x <= Math.ceil(rx); x++) if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) this.put(cx + x, cy + y, typeof c === 'function' ? c(x, y) : c); }
  line(x0, y0, x1, y1, c) { const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) this.put(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c); }
  /** Run-length encode rows into rects: a fraction of one-rect-per-pixel. */
  rects(ox = 0, oy = 0) {
    const out = [];
    for (let y = 0; y < this.h; y++) {
      let x = 0;
      while (x < this.w) {
        const c = this.c[y][x];
        if (!c) { x++; continue; }
        let e = x; while (e + 1 < this.w && this.c[y][e + 1] === c) e++;
        out.push(`<rect x="${(x + ox) * PX}" y="${(y + oy) * PX}" width="${(e - x + 1) * PX}" height="${PX}" fill="${c}"/>`);
        x = e + 1;
      }
    }
    return out.join('');
  }
}

export const cellRects = (cells, c, ox = 0, oy = 0) =>
  cells.map(([x, y, cc]) => `<rect x="${(x + ox) * PX}" y="${(y + oy) * PX}" width="${PX}" height="${PX}" fill="${cc || c}"/>`).join('');

/** Sky as horizontal bands: one rect per band rather than one per pixel. */
export function skyBands(colors, rows, w = SW) {
  const bh = Math.ceil(rows / colors.length);
  return colors.map((c, i) => `<rect x="0" y="${i * bh * PX}" width="${w}" height="${bh * PX + PX}" fill="${c}"/>`).join('');
}

export function stars(R, n, maxRow, avoid = () => false) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = Math.floor(R() * GW), y = Math.floor(R() * maxRow), big = R() < 0.14;
    if (avoid(x, y)) continue;
    const tw = R() < 0.4 ? `<animate attributeName="opacity" values="1;0.2;1" dur="${r2(2 + R() * 3)}s" begin="${r2(R() * 3)}s" repeatCount="indefinite"/>` : '';
    out += `<rect x="${x * PX + 1}" y="${y * PX + 1}" width="${big ? 4 : 2}" height="${big ? 4 : 2}" fill="${R() < 0.2 ? '#ffe9c2' : '#e2e9ff'}" opacity="${r2(0.5 + R() * 0.5)}">${tw}</rect>`;
  }
  return out;
}

/** Puffs that rise from (x0, y0) in grid units, drift by (dx, dy) pixels and fade. */
export function wisp(x0, y0, n, dur, dx, dy, col, peak, size = 1) {
  let out = '';
  for (let k = 0; k < n; k++) {
    const f = (k + 0.5) / n, begin = -r2(f * dur);
    const at = (t) => `${r2(dx * t + Math.sin(t * 6 + k) * 3)},${r2(dy * t)}`;
    const shape = size > 1 ? [[0, 0], [1, 0], [0, -1], [-1, 0], [0, 1]] : [[0, 0]];
    out += `<g transform="translate(${x0 * PX},${y0 * PX})"><g transform="translate(${at(f)})" opacity="${r2(peak * (1 - f))}">${cellRects(shape, col)}` +
      `<animateTransform attributeName="transform" type="translate" values="${at(0)};${at(0.5)};${at(1)}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values="${peak};${r2(peak * 0.6)};0" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g></g>`;
  }
  return out;
}

/** A loose line of birds, two wing frames each, crossing the sky. */
export function birds(color, n = 4, row = 9, dur = 26) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const up = [[-2, -1], [-1, 0], [0, 0], [1, 0], [2, -1]], down = [[-2, 1], [-1, 0], [0, 0], [1, 0], [2, 1]];
    const y = (row + i * 2 + (i % 2) * 3) * PX, begin = -r2(i * 2.6 + 9);
    const flap = (fr, on) => `<g opacity="${on ? 1 : 0}">${cellRects(fr, color)}<animate attributeName="opacity" values="${on ? '1;0' : '0;1'}" dur="0.5s" calcMode="discrete" repeatCount="indefinite" begin="${r2(i * 0.13)}s"/></g>`;
    out += `<g transform="translate(${(120 + i * 8) * PX},${y})">${flap(up, true)}${flap(down, false)}` +
      `<animateTransform attributeName="transform" type="translate" values="${-12 * PX},${y};${SW * 0.5},${y - 15};${SW + 12 * PX},${y - 5}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g>`;
  }
  return out;
}

export function cloudShape(rand, w) {
  const cells = [], parts = [[0, 0, 3], [Math.round(w * 0.3), -2, 4], [Math.round(w * 0.6), -1, 3.5], [w, 0.5, 2.5]];
  const seen = new Set();
  for (const [cx, cy, r] of parts) for (let y = -Math.ceil(r); y <= Math.ceil(r); y++) for (let x = -Math.ceil(r) - 1; x <= Math.ceil(r) + 1; x++) {
    if ((x * x) / 1.5 + y * y > r * r || cy + y > 2) continue;
    const k = `${cx + x},${cy + y}`;
    if (!seen.has(k)) { seen.add(k); cells.push([cx + x, cy + y]); }
  }
  return cells;
}

/** Clouds drifting east forever; negative begins spread them across the sky on load. */
export function clouds(R, list, light, shade, opacity = 0.95) {
  let out = '';
  for (const [x, y, w, dur] of list) {
    const shape = cloudShape(R, w).map(([cx, cy]) => [cx, cy, cy >= 1 ? shade : light]);
    const travel = SW + (w + 12) * PX, start = -(w + 6) * PX;
    const begin = -r2(((x * PX - start) / travel) * dur);
    out += `<g transform="translate(${x * PX},${y * PX})" opacity="${opacity}">${cellRects(shape, light)}` +
      `<animateTransform attributeName="transform" type="translate" values="${start},${y * PX};${start + travel},${y * PX}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g>`;
  }
  return out;
}

export function fireflies(R, n, rows = [40, 64], cols = [8, 168]) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = (cols[0] + R() * (cols[1] - cols[0])) * PX, y = (rows[0] + R() * (rows[1] - rows[0])) * PX, d = r2(4 + R() * 5);
    out += `<g transform="translate(${r2(x)},${r2(y)})"><rect x="-4" y="-4" width="13" height="13" fill="#e8ff7a" opacity="0.18"/><rect width="5" height="5" fill="#f2ff9e"/>` +
      `<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.2;0.5;0.7;1" dur="${d}s" begin="${r2(R() * 4)}s" repeatCount="indefinite"/>` +
      `<animateTransform attributeName="transform" type="translate" values="${r2(x)},${r2(y)};${r2(x + 14)},${r2(y - 9)};${r2(x + 4)},${r2(y + 6)};${r2(x)},${r2(y)}" dur="${r2(d * 2.2)}s" repeatCount="indefinite"/></g>`;
  }
  return out;
}

/** Soft radial glow, for suns, moons, lamps, diyas. */
export const glowDef = (id, color, a = 0.9) =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${a}"/><stop offset="0.35" stop-color="${color}" stop-opacity="${r2(a * 0.38)}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;

/**
 * A mountain range from a list of peaks [x, top, slope]. Returns the ridge
 * row for each column; jitter roughens the slopes so they read as rock.
 */
export function ridge(peaks, base, jitter = 0.8) {
  const out = [];
  for (let x = 0; x < GW; x++) {
    let top = base;
    for (const [px, pt, sl] of peaks) top = Math.min(top, pt + Math.abs(x - px) / sl);
    out.push(Math.round(top + Math.sin(x * 1.7) * jitter + Math.sin(x / 2.3) * jitter * 0.6));
  }
  return out;
}

/* ── time ── */

export const LOCAL = { dawn: 'subah', day: 'din', dusk: 'shaam', night: 'raat' };

export function localNow() {
  const d = new Date(Date.now() + (P.place.utcOffsetMinutes ?? 330) * 60_000);
  return { h: d.getUTCHours(), m: d.getUTCMinutes(), doy: Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5) };
}
export function phaseFor({ h, m }) {
  const t = h + m / 60;
  return t >= 5.5 && t < 8.5 ? 'dawn' : t >= 8.5 && t < 17.5 ? 'day' : t >= 17.5 && t < 19.5 ? 'dusk' : 'night';
}
