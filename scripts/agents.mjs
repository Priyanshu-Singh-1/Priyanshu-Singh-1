/**
 * agents.mjs: the crew. A handful of AI agents work on every plate, drawn as
 * multiplayer cursors with name tags. They build the plate when it loads,
 * then keep tending it: dragging, sorting, selecting, typing, reviewing.
 *
 * Motion runs in two SMIL stages:
 *   intro  from t=0, once, holding its last frame: the plate being built
 *   loop   from T0 (where the intro ends), every P seconds: the tending
 * Frames are [seconds, value]; loop frames count seconds into the loop.
 * As everywhere, attributes hold the finished state, so a renderer without
 * SMIL still shows the whole plate, with the cursors at rest.
 */
import { P, MONO, PIXEL, esc, r2, textWidth } from './lib.mjs';

const lum = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const CREW = Object.fromEntries(P.crew.map(([name, color, job]) => [name, { name, color, job, on: lum(color) > 0.5 ? '#16181d' : '#ffffff' }]));

const EASE = '0.42 0 0.2 1';
const pad = (list, D) => {
  const f = list.map(([t, v]) => [r2(Math.min(Math.max(t, 0), D)), v]);
  if (f[0][0] > 0) f.unshift([0, f[0][1]]);
  if (f.at(-1)[0] < D) f.push([D, f.at(-1)[1]]);
  return f;
};

/**
 * One SMIL animation. With `L` ({T0, P}) it starts at T0 and repeats every P;
 * otherwise it runs once over D seconds and freezes. `type` makes it an
 * animateTransform.
 */
export function anim(attr, list, { D, L, calc = 'spline', type } = {}) {
  const dur = L ? L.P : D, f = pad(list, dur);
  // a keyframe that goes back in time makes browsers drop the whole animation, silently
  f.forEach(([t], i) => { if (i && t < f[i - 1][0]) throw new Error(`${attr ?? type} keyframes go back in time: ${f[i - 1][0]}s then ${t}s`); });
  const head = type ? `animateTransform attributeName="transform" type="${type}"` : `animate attributeName="${attr}"`;
  const mode = calc === 'spline' ? `calcMode="spline" keySplines="${Array(f.length - 1).fill(EASE).join(';')}"` : `calcMode="${calc}"`;
  const time = L ? `begin="${L.T0}s" dur="${dur}s" repeatCount="indefinite"` : `dur="${dur}s" fill="freeze"`;
  return `<${head} values="${f.map((x) => x[1]).join(';')}" keyTimes="${f.map((x) => r2(x[0] / dur * 100) / 100).join(';')}" ${mode} ${time}/>`;
}

/** Opacity that is on during each [from, to] window and off otherwise. */
export function shown(windows, opts, fade = 0.16) {
  const list = [[0, 0]];
  for (const [a, b] of windows) list.push([a, 0], [a + fade, 1], [b - fade, 1], [b, 0]);
  return anim('opacity', list, { ...opts, calc: 'linear' });
}

/** Opacity for something that arrives at `t` during the intro and stays. */
export const arrive = (t, D, d = 0.2) => anim('opacity', [[0, 0], [t, 0], [t + d, 1]], { D, calc: 'linear' });

export const ARROW = 'M0 0 L0 16.5 L4.5 12.4 L7.4 18.8 L10.3 17.5 L7.5 11.3 L13.2 11.3 Z';
export const tagWidth = (name) => textWidth(name, 10.5) + 13;

export const crewDefs = () =>
  `<filter id="lift" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.4" flood-color="#000000" flood-opacity="0.35"/></filter>`;

/**
 * A cursor with its name tag. `intro` and `loop` are [t, x, y] frames for the
 * pointer's tip. The intro is closed onto the loop's first frame at T0, and
 * the loop back onto its own first frame, so neither ever jumps.
 */
export function cursor(name, intro, loop, { T0, P: LP }, { left = false } = {}) {
  const a = CREW[name], pt = ([t, x, y]) => [t, `${r2(x)},${r2(y)}`], tx = left ? -tagWidth(name) - 2 : 11;
  const [, rx, ry] = loop[0];
  const i = [...intro, [T0, rx, ry]], l = [...loop, [LP, rx, ry]];
  return `<g transform="translate(${r2(rx)},${r2(ry)})">${anim(null, i.map(pt), { type: 'translate', D: T0 })}${anim(null, l.map(pt), { type: 'translate', L: { T0, P: LP } })}` +
    `<g filter="url(#lift)"><path d="${ARROW}" fill="${a.color}" stroke="#ffffff" stroke-width="1.3" stroke-linejoin="round"/>` +
    `<rect x="${r2(tx)}" y="16" width="${r2(tagWidth(name))}" height="17" rx="5" fill="${a.color}"/>` +
    `<text x="${r2(tx + 6.5)}" y="28" font-family="${MONO}" font-weight="700" font-size="10.5" fill="${a.on}">${esc(name)}</text></g></g>`;
}

/** Click ripples, [t, x, y] each, in the intro and in the loop. */
export function clicks(name, intro, loop, L) {
  const c = CREW[name].color;
  const ring = (t, x, y, o) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="15" fill="none" stroke="${c}" stroke-width="2" opacity="0">` +
    anim('r', [[t, 3], [t + 0.45, 15]], o) + anim('opacity', [[t - 0.02, 0], [t, 0.95], [t + 0.45, 0]], { ...o, calc: 'linear' }) + '</circle>';
  return intro.map(([t, x, y]) => ring(t, x, y, { D: L.T0 })).join('') + loop.map(([t, x, y]) => ring(t, x, y, { L })).join('');
}

/** Initials in coloured circles, overlapping right to left from x1. */
export function avatars(names, x1, cy, r, ring) {
  const step = r * 1.45;
  const at = names.map((n, i) => [n, x1 - r - (names.length - 1 - i) * step]);
  const svg = at.map(([n, x]) => `<circle cx="${r2(x)}" cy="${cy}" r="${r}" fill="${CREW[n].color}" stroke="${ring}" stroke-width="2"/>` +
    `<text x="${r2(x)}" y="${r2(cy + r * 0.36)}" text-anchor="middle" font-family="${PIXEL}" font-weight="700" font-size="${r2(r * 0.95)}" fill="${CREW[n].on}">${esc(n[0])}</text>`).join('');
  return { svg, at: Object.fromEntries(at), left: x1 - 2 * r - (names.length - 1) * step };
}

/**
 * A comment pin with its note, like a multiplayer canvas: the pin's tip at
 * (x, y), the note to its right, or to its left with `flip`.
 */
export function pin(name, x, y, text, vis, T, flip = false) {
  const a = CREW[name], w = textWidth(text, 11) + 18, s = flip ? -1 : 1;
  const head = `M0 0 V-13 A13 13 0 1 ${flip ? 0 : 1} ${13 * s} 0 Z`;
  const nx = flip ? -30 - w : 30;
  return `<g opacity="0">${vis}<g transform="translate(${r2(x)},${r2(y)})" filter="url(#lift)">` +
    `<path d="${head}" fill="${a.color}" stroke="#ffffff" stroke-width="1.5"/>` +
    `<text x="${13 * s}" y="-9" text-anchor="middle" font-family="${PIXEL}" font-weight="700" font-size="11" fill="${a.on}">${esc(name[0])}</text>` +
    `<rect x="${r2(nx)}" y="-25" width="${r2(w)}" height="22" rx="11" fill="${T.panel}" stroke="${a.color}" stroke-width="1.2"/>` +
    `<text x="${r2(nx + 9)}" y="-10" font-family="${MONO}" font-size="11" fill="${T.ink}">${esc(text)}</text></g></g>`;
}

/** A selection: outline, corner handles and a size or name tag below it (or above). */
export function selection(name, x, y, w, h, label, vis, { above = false, maxX = 876 } = {}) {
  const a = CREW[name];
  const handles = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]
    .map(([hx, hy]) => `<rect x="${r2(hx - 3)}" y="${r2(hy - 3)}" width="6" height="6" fill="#ffffff" stroke="${a.color}" stroke-width="1.2"/>`).join('');
  const lw = textWidth(label, 10) + 12, lx = Math.min(Math.max(x + w / 2 - lw / 2, 4), maxX - lw), ly = above ? y - 23 : y + h + 7;
  return `<g opacity="0">${vis}<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="${a.color}" fill-opacity="0.06" stroke="${a.color}" stroke-width="1.3"/>${handles}` +
    `<rect x="${r2(lx)}" y="${r2(ly)}" width="${r2(lw)}" height="16" rx="4" fill="${a.color}"/>` +
    `<text x="${r2(lx + lw / 2)}" y="${r2(ly + 11.5)}" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="10" fill="${a.on}">${esc(label)}</text></g>`;
}

/** A dashed marquee dragged from (x, y) out to w by h over [a, b], then gone. */
export function marquee(name, x, y, w, h, [a, b], L) {
  const c = CREW[name].color;
  return `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="${c}" fill-opacity="0.08" stroke="${c}" stroke-dasharray="4 3" opacity="0">` +
    anim('width', [[a, 0], [b, w]], { L }) + anim('height', [[a, 0], [b, h]], { L }) + shown([[a, b + 0.12]], { L }, 0.04) + '</rect>';
}
