/**
 * cards.mjs: the plates under the hero, in the hero's language but quiet.
 *
 * No panels of colour: each card is transparent with a hairline border, so
 * the tiny planet stays the only loud thing on the page. What ties them to
 * it is the detail: a little pixel planet by every title, a few faint stars,
 * the pixel display face, and data drawn as starlight, brighter for more,
 * gold (the walker's hair) for the most. A light and a dark file per card,
 * so text reads on either GitHub theme.
 *
 *   work      a career line at Xeno that grows each month, then the rest
 *   projects  things shipped, each with its own small world
 *   toolkit   the stack as chips with real brand marks
 *   heat      the last year as a field of stars, with the numbers that matter
 */
import { P, S, ICONS, MONO, PIXEL, esc, r2, rng, mix, svg } from './lib.mjs';

const CW = 880, PAD = 28;
const MONO_W = (size) => size * 0.6;           // JetBrains Mono advance
const ym = (s) => { const [y, m = 1] = String(s).split('-').map(Number); return y * 12 + (m - 1); };
const nowYM = () => { const d = new Date(); return d.getUTCFullYear() * 12 + d.getUTCMonth(); };
const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const ymLabel = (s) => { if (!s) return 'now'; const [y, m] = String(s).split('-'); return m ? `${MON[+m - 1]} ${y}` : y; };
const span = (a, b) => { const n = Math.max(0, b - a); const y = Math.floor(n / 12), m = n % 12; return [y && `${y}y`, m && `${m}m`].filter(Boolean).join(' ') || '<1m'; };
const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));

/** Finished state by default; fade in after `at` seconds when SMIL runs. */
const fadeIn = (at, d = 0.25) => `<animate attributeName="opacity" values="0;0;1" keyTimes="0;${r2(at / (at + d))};1" dur="${r2(at + d)}s" fill="freeze"/>`;

const THEMES = {
  dark:  { ink: '#e6edf3', mute: '#9aa6b8', dim: '#6e7a8c', gold: '#ffd23f', goldText: '#ffd23f', green: '#7ad25a', data: '#ffffff', line: '#e6edf3', star: '#ffffff', tint: '#ffffff', onGold: '#1d1442' },
  light: { ink: '#1f2a37', mute: '#5b6878', dim: '#8a95a3', gold: '#f2b705', goldText: '#a86e00', green: '#3e9e3e', data: '#1f3a68', line: '#1f2a37', star: '#3a5aa0', tint: '#1f3a68', onGold: '#1d1442' },
};
let T = null;
export function setTheme(name) { T = { ...THEMES[name], name }; }
setTheme('dark');

/* Starlight: level 0..5 as white at rising opacity, the top level in gold. */
const LIGHT = [0.08, 0.22, 0.4, 0.6, 0.85, 1];
const starFill = (lv) => (lv >= 5 ? `fill="${T.gold}"` : `fill="${T.data}" fill-opacity="${LIGHT[lv]}"`);

/** A tiny pixel planet: the bullet every card title carries. */
function planetGlyph(x, y, c = T.green, ring = false) {
  const cells = [[1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [1, 4], [2, 4], [3, 4]];
  const s = 3;
  let out = cells.map(([cx, cy]) => `<rect x="${x + cx * s}" y="${y + cy * s}" width="${s}" height="${s}" fill="${cx + cy > 5 ? mix(c, '#000000', 0.3) : cx + cy < 3 ? mix(c, '#ffffff', 0.35) : c}"/>`).join('');
  if (ring) out += `<rect x="${x - 4}" y="${y + 2 * s}" width="${5 * s + 8}" height="2" fill="#f6deb0"/>`;
  return out;
}

/** Hairline frame, a few faint stars, the planet bullet and the title. */
function frame(h, title, right, seed) {
  const R = rng(seed);
  let stars = '';
  for (let i = 0; i < Math.round(h / 28); i++) {
    const x = r2(16 + R() * (CW - 32)), y = r2(14 + R() * (h - 28)), o = r2(0.12 + R() * 0.2);
    stars += `<rect x="${x}" y="${y}" width="2" height="2" fill="${T.star}" opacity="${o}">${R() < 0.4 ? `<animate attributeName="opacity" values="${o};0.02;${o}" dur="${r2(3 + R() * 3)}s" repeatCount="indefinite"/>` : ''}</rect>`;
  }
  return `<rect x="0.5" y="0.5" width="${CW - 1}" height="${h - 1}" rx="12" fill="${T.tint}" fill-opacity="0.02" stroke="${T.line}" stroke-opacity="0.13"/>${stars}
${planetGlyph(PAD, 26, T.green, title.length % 2 === 0)}
<text x="${PAD + 26}" y="40" font-family="${PIXEL}" font-weight="700" font-size="15" fill="${T.ink}">${esc(title)}</text>
${right ? `<text x="${CW - PAD}" y="40" text-anchor="end" font-family="${MONO}" font-size="11" fill="${T.mute}">${esc(right)}</text>` : ''}`;
}

const doc = (h, title, desc, body) => svg({ w: CW, h, fonts: ['Silkscreen', 'JetBrains Mono'], title: `${P.name}: ${title}`, desc, body });

/* ───────── work ───────── */

export function work() {
  const F = P.work.featured, now = nowYM();
  const start = ym(F.roles[0][2]);
  const total = Math.max(1, (F.roles.at(-1)[3] ? ym(F.roles.at(-1)[3]) : now) - start);
  const x0 = PAD, axisW = CW - 2 * PAD, gap = 4, ay = 100, ah = 22;
  let ladder = '', ticks = '';
  F.roles.forEach(([short, , from, to], i) => {
    const a = ym(from), b = to ? ym(to) : now, live = !to;
    const sx = x0 + ((a - start) / total) * axisW + (i ? gap / 2 : 0);
    const w = Math.max(30, ((b - a) / total) * axisW - (i ? gap / 2 : 0) - (i < F.roles.length - 1 ? gap / 2 : 0));
    const at = 0.25 + i * 0.35, txt = live ? T.onGold : T.ink;
    ladder += `<rect x="${r2(sx)}" y="${ay}" width="${r2(w)}" height="${ah}" rx="11" ${live ? `fill="${T.gold}"` : `fill="${T.data}" fill-opacity="${[0.1, 0.2][i] ?? 0.2}"`}>` +
      `<animate attributeName="width" values="0;0;${r2(w)}" keyTimes="0;${r2(at / (at + 0.4))};1" dur="${r2(at + 0.4)}s" fill="freeze"/></rect>` +
      `<g>${fadeIn(at + 0.3)}<text x="${r2(sx + 12)}" y="${ay + 15}" font-family="${PIXEL}" font-weight="700" font-size="11" fill="${txt}">${esc(short)}</text>` +
      (w > 190 ? `<text x="${r2(sx + w - (live ? 30 : 12))}" y="${ay + 15}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${txt}" opacity="0.85">${esc(span(a, b))}</text>` : '') + `</g>`;
    ticks += `<text x="${r2(sx)}" y="${ay + ah + 18}" font-family="${MONO}" font-size="11" fill="${T.mute}">${ymLabel(from)}</text>`;
    if (live) {
      const ex = sx + w;
      ticks += `<text x="${r2(ex)}" y="${ay + ah + 18}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${T.goldText}">now</text>` +
        `<circle cx="${r2(ex - 13)}" cy="${ay + ah / 2}" r="5" fill="${T.onGold}" fill-opacity="0.5"><animate attributeName="r" values="4;8;4" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite"/></circle>`;
    }
  });
  const hy = ay + ah + 48;
  const lines = F.highlights.map((t, i) => `<g>${fadeIn(1.3 + i * 0.12)}<rect x="${x0 + 2}" y="${hy + i * 22 - 8}" width="5" height="5" fill="${T.gold}"/>` +
    `<text x="${x0 + 16}" y="${hy + i * 22}" font-family="${MONO}" font-size="12.5" fill="${T.ink}">${esc(t)}</text></g>`).join('');
  const dy = hy + F.highlights.length * 22 + 6, colW = (CW - 2 * PAD) / P.work.others.length;
  const others = P.work.others.map((o, i) => {
    const x = PAD + i * colW, y = dy + 30;
    return `<g>${fadeIn(1.9 + i * 0.1)}${i ? `<path d="M${r2(x - 12)} ${y - 14} V${y + 50}" stroke="${T.line}" stroke-opacity="0.12"/>` : ''}
<text x="${r2(x)}" y="${y}" font-family="${MONO}" font-size="11" fill="${o.to ? T.mute : T.goldText}">${ymLabel(o.from)} to ${ymLabel(o.to)}</text>
<text x="${r2(x)}" y="${y + 22}" font-family="${PIXEL}" font-weight="700" font-size="12" fill="${T.ink}">${esc(o.org)}</text>
<text x="${r2(x)}" y="${y + 40}" font-family="${MONO}" font-size="12" fill="${T.ink}">${esc(o.role)}</text>
<text x="${r2(x)}" y="${y + 56}" font-family="${MONO}" font-size="11" fill="${T.mute}">${esc(o.kind)}</text></g>`;
  }).join('');
  const h = dy + 100;
  return doc(h, 'work',
    `${F.org}, ${F.about}, for ${span(start, now)}: ` + F.roles.map(([, full, a, b]) => `${full} from ${ymLabel(a)} to ${ymLabel(b)}`).join(', ') + '. ' + F.highlights.join('. ') + '. Also: ' +
      P.work.others.map((o) => `${o.org}, ${o.role} (${o.kind}), ${ymLabel(o.from)} to ${ymLabel(o.to)}`).join('; ') + '.',
    frame(h, 'work', `at ${F.org.toLowerCase()} for ${span(start, now)}`, 22) +
    `<text x="${PAD}" y="80" font-family="${PIXEL}" font-weight="700" font-size="18" fill="${T.ink}">${esc(F.org.toLowerCase())}</text>
<text x="${PAD + F.org.length * 15 + 14}" y="80" font-family="${MONO}" font-size="12" fill="${T.mute}">${esc(F.about)}</text>` +
    ladder + ticks + lines + `<path d="M${PAD} ${dy} H${CW - PAD}" stroke="${T.line}" stroke-opacity="0.12"/>` + others);
}

/* ───────── projects ───────── */

export function projects() {
  const rows = P.projects, rh = 44, top = 66;
  let body = '';
  rows.forEach((p, i) => {
    const y = top + i * rh, at = 0.2 + i * 0.12;
    // each project gets a small world of its own colour, slowly turning
    const cx = PAD + 12, cy = y + 13;
    body += `<g>${fadeIn(at)}<circle cx="${cx}" cy="${cy}" r="9" fill="${p.color}"/><circle cx="${cx + 3}" cy="${cy + 3}" r="9" fill="#000000" opacity="0.22" clip-path="url(#orb${i})"/>` +
      `<clipPath id="orb${i}"><circle cx="${cx}" cy="${cy}" r="9"/></clipPath>` +
      `<g clip-path="url(#orb${i})"><g><rect x="${cx - 9}" y="${cy - 5}" width="7" height="4" fill="#ffffff" opacity="0.35"/><rect x="${cx + 2}" y="${cy + 2}" width="5" height="3" fill="#ffffff" opacity="0.25"/><rect x="${cx + 14}" y="${cy - 5}" width="7" height="4" fill="#ffffff" opacity="0.35"/>` +
      `<animateTransform attributeName="transform" type="translate" values="0,0;-23,0" dur="${6 + i}s" repeatCount="indefinite"/></g></g>` +
      (i % 3 === 0 ? `<ellipse cx="${cx}" cy="${cy}" rx="14" ry="3.5" fill="none" stroke="#e8c88a" stroke-width="2" opacity="0.8"/>` : '') +
      `<text x="${PAD + 38}" y="${y + 14}" font-family="${PIXEL}" font-weight="700" font-size="12" fill="${T.ink}">${esc(p.name)}</text>` +
      `<text x="${PAD + 38}" y="${y + 30}" font-family="${MONO}" font-size="12" fill="${T.mute}">${esc(p.about)}</text>` +
      `<text x="${CW - PAD}" y="${y + 14}" text-anchor="end" font-family="${MONO}" font-weight="700" font-size="12" fill="${T.goldText}">${esc(p.metric)}</text>` +
      '</g>';
    if (i < rows.length - 1) body += `<path d="M${PAD + 38} ${y + rh - 8} H${CW - PAD}" stroke="${T.line}" stroke-opacity="0.08"/>`;
  });
  const h = top + rows.length * rh + 10;
  return doc(h, 'things shipped', rows.map((p) => `${p.name} (${p.metric}): ${p.about}. ${p.stack}.`).join(' '),
    frame(h, 'things shipped', 'links below', 33) + body);
}

/* ───────── toolkit ───────── */

export function toolkit() {
  const labelW = 180, cx0 = PAD + labelW, cx1 = CW - PAD, chipH = 24, gapX = 6, gapY = 8, icon = 12, fs = 11;
  let y = 64, body = '', n = 0;
  for (const g of P.toolkit) {
    let x = cx0, rowY = y;
    body += `<text x="${PAD}" y="${rowY + 16}" font-family="${PIXEL}" font-size="11" fill="${T.mute}">${esc(g.group)}</text>`;
    for (const [label, slug, daily] of g.items) {
      const w = Math.round(10 + icon + 7 + label.length * MONO_W(fs) + 10);
      if (x + w > cx1) { x = cx0; rowY += chipH + gapY; }
      const ic = slug && ICONS[slug], col = daily ? T.gold : T.mute;
      const mark = ic
        ? `<path transform="translate(${x + 10},${rowY + (chipH - icon) / 2}) scale(${r2(icon / 24)})" d="${ic.path}" fill="${col}"/>`
        : `<rect x="${x + 10}" y="${rowY + (chipH - icon) / 2}" width="${icon}" height="${icon}" rx="3" fill="${col}"/><text x="${x + 10 + icon / 2}" y="${rowY + chipH / 2 + 3.5}" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="8" fill="${T.name === 'dark' ? '#0d1117' : '#ffffff'}">${esc(label.slice(0, 2).toLowerCase())}</text>`;
      body += `<g>${fadeIn(0.15 + n * 0.03)}<rect x="${x + 0.5}" y="${rowY + 0.5}" width="${w}" height="${chipH}" rx="12" fill="${daily ? T.gold : T.tint}" fill-opacity="${daily ? 0.12 : 0.04}" stroke="${daily ? T.gold : T.line}" stroke-opacity="${daily ? 0.75 : 0.14}"/>${mark}` +
        `<text x="${x + 10 + icon + 7}" y="${rowY + chipH / 2 + 4}" font-family="${MONO}" font-size="${fs}" fill="${T.ink}">${esc(label)}</text></g>`;
      x += w + gapX; n++;
    }
    y = rowY + chipH + 12;
  }
  const h = y + 26, keyW = 'in production every day'.length * MONO_W(11);
  body += `<rect x="${r2(CW - PAD - keyW - 18)}" y="${h - 28}" width="10" height="10" rx="5" fill="${T.gold}" fill-opacity="0.16" stroke="${T.gold}"/>
<text x="${CW - PAD}" y="${h - 19}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${T.mute}">in production every day</text>`;
  return doc(h, 'toolkit', P.toolkit.map((g) => `${g.group}: ${g.items.map(([l, , d]) => l + (d ? ' (daily)' : '')).join(', ')}`).join('. ') + '.',
    frame(h, 'toolkit', 'the stack, grouped by job', 44) + body);
}

function levels(values) {
  const nz = values.filter((v) => v > 0).sort((a, b) => a - b);
  const q = (p) => nz[Math.min(nz.length - 1, Math.floor(p * nz.length))] ?? 1;
  const cuts = [q(0.25), q(0.5), q(0.75), q(0.93)];
  return (n) => (n <= 0 ? 0 : n <= cuts[0] ? 1 : n <= cuts[1] ? 2 : n <= cuts[2] ? 3 : n <= cuts[3] ? 4 : 5);
}

/* ───────── heat ───────── */

export function heat() {
  const cell = 12, gap = 3, pitch = cell + gap, days = S.days || [];
  const firstDow = days.length ? new Date(days[0].date + 'T00:00:00Z').getUTCDay() : 0;
  const weeks = Math.ceil((days.length + firstDow) / 7) || 53, gridW = weeks * pitch - gap;
  const x0 = Math.round((CW - gridW) / 2), y0 = 82, lvl = levels(days.map((d) => d.n));
  let cells = '', months = '', lastMonth = -1, lastLabelCol = -9;
  days.forEach((d, i) => {
    const idx = i + firstDow, col = Math.floor(idx / 7), row = idx % 7, x = x0 + col * pitch, y = y0 + row * pitch, lv = lvl(d.n);
    // the one orchestrated moment: the year lights up west to east, like stars coming out
    const at = r2(0.25 + col * 0.028 + row * 0.01);
    const anim = lv ? (lv >= 5
      ? `<animate attributeName="opacity" values="0.15;0.15;1" keyTimes="0;${r2(at / (at + 0.4))};1" dur="${r2(at + 0.4)}s" fill="freeze"/>`
      : `<animate attributeName="fill-opacity" values="${LIGHT[0]};${LIGHT[0]};${LIGHT[lv]}" keyTimes="0;${r2(at / (at + 0.4))};1" dur="${r2(at + 0.4)}s" fill="freeze"/>`) : '';
    cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${lv >= 4 ? 6 : 2}" ${starFill(lv)}><title>${d.n} on ${d.date}</title>${anim}</rect>`;
    if (lv >= 5) cells += `<circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="11" fill="${T.gold}" opacity="0.18"><animate attributeName="opacity" values="0.18;0.05;0.18" dur="${r2(2 + (col % 4) * 0.5)}s" repeatCount="indefinite"/></circle>`;
    const m = parseInt(d.date.slice(5, 7), 10) - 1;
    if (m !== lastMonth && row === 0) {
      if (col < weeks - 2 && col - lastLabelCol >= 3) { months += `<text x="${x}" y="${y0 - 10}" font-family="${MONO}" font-size="11" fill="${T.mute}">${MON[m]}</text>`; lastLabelCol = col; }
      lastMonth = m;
    }
  });
  const ly = y0 + 7 * pitch + 12, rampX = x0 + gridW - 70 - 6 * pitch;
  const legend = `<text x="${rampX - 8}" y="${ly + 10}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${T.mute}">fewer</text>` +
    LIGHT.map((_, i) => `<rect x="${rampX + i * pitch}" y="${ly}" width="${cell}" height="${cell}" rx="${i >= 4 ? 6 : 2}" ${starFill(i)}/>`).join('') +
    `<text x="${x0 + gridW}" y="${ly + 10}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${T.mute}">more</text>`;
  // One row of numbers: this year, all-time, both streaks, and the last push.
  const ago = (iso) => { if (!iso) return ''; const m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`; };
  const firstYear = Object.keys(S.monthly || {}).sort()[0]?.slice(0, 4);
  const repo = S.lastPush?.repo ? (S.lastPush.repo.length > 20 ? S.lastPush.repo.slice(0, 19) + '…' : S.lastPush.repo) : '—';
  const stats = [[fmt(S.total), 'this year'], [fmt(S.allTime), `since ${firstYear || 'the start'}`], [fmt(S.longest), 'longest streak, days'],
    [fmt(S.current), 'current streak, days'], [repo, `last push, ${ago(S.lastPush?.at)}`]];
  const sy = ly + 54, colW = gridW / stats.length;
  const row = stats.map(([v, l], i) => { const x = x0 + i * colW, small = i === 4; return `${i ? `<path d="M${r2(x - 14)} ${sy - 26} V${sy + 12}" stroke="${T.line}" stroke-opacity="0.12"/>` : ''}
<text x="${r2(x)}" y="${sy}" font-family="${small ? MONO : PIXEL}" font-weight="700" font-size="${small ? 12 : 18}" fill="${i === 0 ? T.goldText : T.ink}">${esc(v)}</text>
<text x="${r2(x)}" y="${sy + 18}" font-family="${MONO}" font-size="11" fill="${T.mute}">${esc(l)}</text>`; }).join('');
  const h = sy + 38;
  return doc(h, 'a year of commits',
    `The last year of GitHub contributions as a field of stars, brighter for busier days. ${fmt(S.total)} contributions, longest streak ${fmt(S.longest)} days, current streak ${fmt(S.current)} days, ${fmt(S.allTime)} all-time, last push to ${S.lastPush?.repo ?? 'n/a'}.`,
    frame(h, 'a year of commits, in starlight', `charted ${(S.generated || '').slice(0, 10)}`, 66) + months + cells + legend + row);
}

