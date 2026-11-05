/**
 * cards.mjs: the plates under the hero, quiet, each with some of the crew
 * still at work on it.
 *
 * Each card is transparent with a hairline border over a faint dot grid, the
 * hero's canvas, so the hero stays the loud thing. Its agents sit at the top
 * right like collaborators on a shared file; when the card loads they build
 * it, then they keep tending it. Data is drawn as starlight, brighter for
 * more, gold for the most. A light and a dark file per card, so text reads on
 * either GitHub theme.
 *
 *   work      builder grows the career line, scribe types the highlights
 *   projects  curator drags the projects in and reorders them, reviewer comments
 *   toolkit   planner lays out the chips, then selects them
 *   heat      ops lights up the year and reads out the busiest day
 */
import { P, S, ICONS, MONO, PIXEL, esc, r2, svg, textWidth } from './lib.mjs';
import { CREW, anim, shown, arrive, cursor, clicks, avatars, pin, selection, marquee, crewDefs } from './agents.mjs';

const CW = 880, PAD = 28;
const MONO_W = (size) => size * 0.6;           // JetBrains Mono advance
const ym = (s) => { const [y, m = 1] = String(s).split('-').map(Number); return y * 12 + (m - 1); };
const nowYM = () => { const d = new Date(); return d.getUTCFullYear() * 12 + d.getUTCMonth(); };
const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const ymLabel = (s) => { if (!s) return 'now'; const [y, m] = String(s).split('-'); return m ? `${MON[+m - 1]} ${y}` : y; };
const span = (a, b) => { const n = Math.max(0, b - a); const y = Math.floor(n / 12), m = n % 12; return [y && `${y}y`, m && `${m}m`].filter(Boolean).join(' ') || '<1m'; };
const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));
const day = (iso) => `${MON[+iso.slice(5, 7) - 1]} ${+iso.slice(8, 10)}`;

const THEMES = {
  dark:  { ink: '#e6edf3', mute: '#9aa6b8', dim: '#6e7a8c', gold: '#ffd23f', goldText: '#ffd23f', data: '#ffffff', line: '#e6edf3', tint: '#ffffff', onGold: '#1d1442', panel: '#161b22', ground: '#0d1117', grid: '#ffffff' },
  light: { ink: '#1f2a37', mute: '#5b6878', dim: '#8a95a3', gold: '#f2b705', goldText: '#a86e00', data: '#1f3a68', line: '#1f2a37', tint: '#1f3a68', onGold: '#1d1442', panel: '#ffffff', ground: '#ffffff', grid: '#1f3a68' },
};
let T = null;
export function setTheme(name) { T = { ...THEMES[name], name }; }
setTheme('dark');

/* Starlight: level 0..5 as white at rising opacity, the top level in gold. */
const LIGHT = [0.08, 0.22, 0.4, 0.6, 0.85, 1];
const starFill = (lv) => (lv >= 5 ? `fill="${T.gold}"` : `fill="${T.data}" fill-opacity="${LIGHT[lv]}"`);

/** Hairline border over a faint dot grid: a patch of the hero's canvas. */
const frame = (h) => `<defs><pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="1" fill="${T.grid}" fill-opacity="0.08"/></pattern>${crewDefs()}</defs>` +
  `<rect x="0.5" y="0.5" width="${CW - 1}" height="${h - 1}" rx="12" fill="url(#dots)" stroke="${T.line}" stroke-opacity="0.13"/>`;

/** The frame mark and title on the left; who's on this card and a note on the right. */
function header(title, right, crew) {
  const rw = right ? textWidth(right, 11) + 14 : 0, av = avatars(crew, CW - PAD - rw, 36, 8, T.ground);
  const mark = `<path d="M${PAD + 1} 32 H${PAD + 13} M${PAD + 1} 38 H${PAD + 13} M${PAD + 4} 29 V41 M${PAD + 10} 29 V41" stroke="${T.gold}" stroke-width="1.6"/>`;
  return {
    home: (n) => [0, av.at[n], 40],
    svg: mark + `<text x="${PAD + 24}" y="40" font-family="${PIXEL}" font-weight="700" font-size="15" fill="${T.ink}">${esc(title)}</text>` + av.svg +
      (right ? `<text x="${CW - PAD}" y="40" text-anchor="end" font-family="${MONO}" font-size="11" fill="${T.mute}">${esc(right)}</text>` : ''),
  };
}

const doc = (h, title, desc, body) => svg({ w: CW, h, fonts: ['Silkscreen', 'JetBrains Mono'], title: `${P.name}: ${title}`, desc, body });

/* ───────── work ───────── */

export function work() {
  const F = P.work.featured, now = nowYM(), T0 = 5.0, L = { T0, P: 10 }, I = { D: T0 };
  const start = ym(F.roles[0][2]);
  const total = Math.max(1, (F.roles.at(-1)[3] ? ym(F.roles.at(-1)[3]) : now) - start);
  const x0 = PAD, axisW = CW - 2 * PAD, gap = 4, ay = 100, ah = 22, mid = ay + ah / 2;
  const head = header('work', `at ${F.org.toLowerCase()} for ${span(start, now)}`, ['builder', 'scribe']);
  let ladder = '', ticks = '', over = '';
  const bars = F.roles.map(([short, , from, to], i) => {
    const a = ym(from), b = to ? ym(to) : now;
    const sx = x0 + ((a - start) / total) * axisW + (i ? gap / 2 : 0);
    const w = Math.max(30, ((b - a) / total) * axisW - (i ? gap / 2 : 0) - (i < F.roles.length - 1 ? gap / 2 : 0));
    return { short, from, a, b, sx, w, live: !to, at: 0.45 + i * 0.5 };
  });
  bars.forEach(({ short, from, a, b, sx, w, live, at }, i) => {
    const txt = live ? T.onGold : T.ink;
    ladder += `<rect x="${r2(sx)}" y="${ay}" width="${r2(w)}" height="${ah}" rx="11" ${live ? `fill="${T.gold}"` : `fill="${T.data}" fill-opacity="${[0.1, 0.2][i] ?? 0.2}"`}>${anim('width', [[at, 0], [at + 0.45, r2(w)]], I)}</rect>` +
      `<g>${arrive(at + 0.35, T0)}<text x="${r2(sx + 12)}" y="${ay + 15}" font-family="${PIXEL}" font-weight="700" font-size="11" fill="${txt}">${esc(short)}</text>` +
      (w > 190 ? `<text x="${r2(sx + w - (live ? 30 : 12))}" y="${ay + 15}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${txt}" opacity="0.85">${esc(span(a, b))}</text>` : '') + `</g>`;
    ticks += `<text x="${r2(sx)}" y="${ay + ah + 18}" font-family="${MONO}" font-size="11" fill="${T.mute}">${ymLabel(from)}</text>`;
    if (live) {
      const ex = sx + w;
      ticks += `<text x="${r2(ex)}" y="${ay + ah + 18}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${T.goldText}">now</text>` +
        `<circle cx="${r2(ex - 13)}" cy="${mid}" r="5" fill="${T.onGold}" fill-opacity="0.5"><animate attributeName="r" values="4;8;4" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite"/></circle>`;
    }
  });

  // the scribe types each highlight; later it reads them back, one at a time
  const hy = ay + ah + 48, hl = (i) => 2.1 + i * 0.6, hw = F.highlights.map((t) => textWidth(t, 12.5));
  const lines = F.highlights.map((t, i) => {
    const y = hy + i * 22, full = r2(hw[i] + 22);
    return `<rect x="${x0 + 10}" y="${y - 13}" width="${r2(hw[i] + 14)}" height="18" rx="3" fill="${CREW.scribe.color}" fill-opacity="0.2" opacity="0">${shown([[i * 2.5 + 0.3, i * 2.5 + 2.2]], { L })}</rect>` +
      `<clipPath id="hl${i}"><rect x="${x0}" y="${y - 14}" width="${full}" height="20">${anim('width', [[hl(i), 0], [hl(i) + 0.5, full]], { D: T0, calc: 'linear' })}</rect></clipPath>` +
      `<g clip-path="url(#hl${i})"><rect x="${x0 + 2}" y="${y - 8}" width="5" height="5" fill="${T.gold}"/>` +
      `<text x="${x0 + 16}" y="${y}" font-family="${MONO}" font-size="12.5" fill="${T.ink}">${esc(t)}</text></g>`;
  }).join('');

  const dy = hy + F.highlights.length * 22 + 6, colW = (CW - 2 * PAD) / P.work.others.length;
  const others = P.work.others.map((o, i) => {
    const x = PAD + i * colW, y = dy + 30;
    return `<g>${arrive(4.5 + i * 0.08, T0)}${i ? `<path d="M${r2(x - 12)} ${y - 14} V${y + 50}" stroke="${T.line}" stroke-opacity="0.12"/>` : ''}
<text x="${r2(x)}" y="${y}" font-family="${MONO}" font-size="11" fill="${o.to ? T.mute : T.goldText}">${ymLabel(o.from)} to ${ymLabel(o.to)}</text>
<text x="${r2(x)}" y="${y + 22}" font-family="${PIXEL}" font-weight="700" font-size="12" fill="${T.ink}">${esc(o.org)}</text>
<text x="${r2(x)}" y="${y + 40}" font-family="${MONO}" font-size="12" fill="${T.ink}">${esc(o.role)}</text>
<text x="${r2(x)}" y="${y + 56}" font-family="${MONO}" font-size="11" fill="${T.mute}">${esc(o.kind)}</text></g>`;
  }).join('');
  const h = dy + 116;

  // builder: drags each role out to its length, then minds the live one
  const lv = bars.find((b) => b.live) ?? bars.at(-1), handle = [lv.sx + lv.w - 40, mid + 3];
  const oi = Math.max(0, P.work.others.findIndex((o) => !o.to)), o = P.work.others[oi];
  const ob = { x: PAD + oi * colW - 8, y: dy + 14, w: colW - 16, h: 70 };
  over += selection('builder', lv.sx - 3, ay - 3, lv.w + 6, ah + 6, `${lv.short} · ${span(lv.a, lv.b)}`, shown([[0.4, 3.8]], { L })) +
    selection('builder', ob.x, ob.y, ob.w, ob.h, `${o.org.toLowerCase()} · ${span(ym(o.from), o.to ? ym(o.to) : now)}`, shown([[5.2, 8.2]], { L }));
  const crew = cursor('builder', [head.home('builder'), ...bars.flatMap((b) => [[b.at, b.sx + 3, mid + 3], [b.at + 0.45, b.sx + b.w - 3, mid + 3]])],
    [handle, [3.9, handle[0] - 12, handle[1] + 14], [4.8, ob.x + ob.w + 2, ob.y + 4], [8.3, ob.x + ob.w + 6, ob.y + 10]].map((f, i) => (i ? f : [0, ...f])), L, { left: true }) +
    cursor('scribe', [head.home('scribe'), ...F.highlights.flatMap((_, i) => [[hl(i) - 0.06, x0 + 14, hy + i * 22 + 3], [hl(i) + 0.5, x0 + 18 + hw[i], hy + i * 22 + 3]])],
      F.highlights.flatMap((_, i) => [[i * 2.5 + 0.25, x0 + 20 + hw[i], hy + i * 22 + 2], [i * 2.5 + 2.2, x0 + 24 + hw[i], hy + i * 22 + 5]]), L);

  return doc(h, 'work',
    `${F.org}, ${F.about}, for ${span(start, now)}: ` + F.roles.map(([, full, a, b]) => `${full} from ${ymLabel(a)} to ${ymLabel(b)}`).join(', ') + '. ' + F.highlights.join('. ') + '. Also: ' +
      P.work.others.map((x) => `${x.org}, ${x.role} (${x.kind}), ${ymLabel(x.from)} to ${ymLabel(x.to)}`).join('; ') + '. Two agent cursors, builder and scribe, build the card and keep tending it.',
    frame(h) + head.svg +
    `<text x="${PAD}" y="80" font-family="${PIXEL}" font-weight="700" font-size="18" fill="${T.ink}">${esc(F.org.toLowerCase())}</text>
<text x="${PAD + textWidth(F.org, 18, 'silk') + 14}" y="80" font-family="${MONO}" font-size="12" fill="${T.mute}">${esc(F.about)}</text>` +
    ladder + ticks + lines + `<path d="M${PAD} ${dy} H${CW - PAD}" stroke="${T.line}" stroke-opacity="0.12"/>` + others + over + crew);
}

/* ───────── projects ───────── */

export function projects() {
  const rows = P.projects, rh = 44, top = 66, T0 = 4.4, L = { T0, P: 12 }, I = { D: T0 };
  const head = header('things shipped', 'links below', ['curator', 'reviewer']);
  const notes = P.canvas.comments.projects, ra = (i) => 0.4 + i * 0.55;
  // the curator swaps the last two rows and back: re-ranking, never done
  const [sa, sb] = [rows.length - 2, rows.length - 1];
  let body = '';
  rows.forEach((p, i) => {
    const y = top + i * rh, cx = PAD + 12, cy = y + 13;
    const swap = i === sa ? `0,${rh}` : i === sb ? `0,${-rh}` : null;
    body += `<g>${swap ? anim(null, [[2.0, '0,0'], [2.8, swap], [8.0, swap], [8.8, '0,0']], { type: 'translate', L }) : ''}` +
      `<g>${anim(null, [[ra(i), '90,0'], [ra(i) + 0.42, '0,0']], { type: 'translate', D: T0 })}${arrive(ra(i) - 0.04, T0, 0.15)}` +
      `<circle cx="${cx}" cy="${cy}" r="9" fill="${p.color}"/><circle cx="${cx + 3}" cy="${cy + 3}" r="9" fill="#000000" opacity="0.22" clip-path="url(#orb${i})"/>` +
      `<clipPath id="orb${i}"><circle cx="${cx}" cy="${cy}" r="9"/></clipPath>` +
      `<g clip-path="url(#orb${i})"><g><rect x="${cx - 9}" y="${cy - 5}" width="7" height="4" fill="#ffffff" opacity="0.35"/><rect x="${cx + 2}" y="${cy + 2}" width="5" height="3" fill="#ffffff" opacity="0.25"/><rect x="${cx + 14}" y="${cy - 5}" width="7" height="4" fill="#ffffff" opacity="0.35"/>` +
      `<animateTransform attributeName="transform" type="translate" values="0,0;-23,0" dur="${6 + i}s" repeatCount="indefinite"/></g></g>` +
      (i % 3 === 0 ? `<ellipse cx="${cx}" cy="${cy}" rx="14" ry="3.5" fill="none" stroke="#e8c88a" stroke-width="2" opacity="0.8"/>` : '') +
      `<text x="${PAD + 38}" y="${y + 14}" font-family="${PIXEL}" font-weight="700" font-size="12" fill="${T.ink}">${esc(p.name)}</text>` +
      `<text x="${PAD + 38}" y="${y + 30}" font-family="${MONO}" font-size="12" fill="${T.mute}">${esc(p.about)}</text>` +
      `<text x="${CW - PAD}" y="${y + 14}" text-anchor="end" font-family="${MONO}" font-weight="700" font-size="12" fill="${T.goldText}">${esc(p.metric)}</text></g></g>`;
    if (i < rows.length - 1) body += `<path d="M${PAD + 38} ${y + rh - 8} H${CW - PAD}" stroke="${T.line}" stroke-opacity="0.08"/>`;
  });
  const h = top + rows.length * rh + 10;

  const tip = (i) => [CW - PAD - textWidth(rows[i].metric, 12) - 8, top + i * rh + 6];
  const grab = (i) => [PAD + 44, top + i * rh + 9];
  const over = pin('reviewer', ...tip(0), notes[0], shown([[3.9, 6.6]], { L }), T, true) +
    pin('reviewer', ...tip(1), notes[1], shown([[2.9, 4.2]], I) + shown([[9.0, 11.4]], { L }), T, true);
  const restC = [PAD + 300, top + 28], restR = [CW - 210, h - 40];
  const crew = cursor('curator', [head.home('curator'), ...rows.flatMap((_, i) => [[ra(i) - 0.06, grab(i)[0] + 90, grab(i)[1]], [ra(i) + 0.42, ...grab(i)]])],
    [[0, ...restC], [1.6, ...grab(sb)], [2.0, ...grab(sb)], [2.8, ...grab(sa)], [3.4, grab(sa)[0] + 24, grab(sa)[1] + 10],
      [7.4, ...grab(sa)], [8.0, ...grab(sa)], [8.8, ...grab(sb)], [9.4, grab(sb)[0] + 24, grab(sb)[1] - 14]], L) +
    clicks('curator', [], [[1.75, ...grab(sb)], [7.75, ...grab(sa)]], L) +
    cursor('reviewer', [head.home('reviewer'), [2.7, ...tip(1)], [3.2, tip(1)[0] + 10, tip(1)[1] + 14]],
      [[0, ...restR], [3.6, ...tip(0)], [4.3, tip(0)[0] + 10, tip(0)[1] + 14], [8.7, ...tip(1)], [9.4, tip(1)[0] + 10, tip(1)[1] + 14]], L) +
    clicks('reviewer', [[2.8, ...tip(1)]], [[3.7, ...tip(0)], [8.8, ...tip(1)]], L);

  return doc(h, 'things shipped', rows.map((p) => `${p.name} (${p.metric}): ${p.about}. ${p.stack}.`).join(' ') + ' The curator agent drags the rows in and keeps re-ranking them; the reviewer leaves comments.',
    frame(h) + head.svg + body + over + crew);
}

/* ───────── toolkit ───────── */

export function toolkit() {
  const labelW = 180, cx0 = PAD + labelW, cx1 = CW - PAD, chipH = 24, gapX = 6, gapY = 8, icon = 12, fs = 11;
  const head = header('toolkit', 'the stack, grouped by job', ['planner']);
  // lay the chips out first; the planner sweeps each row and drops them in
  const rows = [];
  let y = 64;
  P.toolkit.forEach((g, gi) => {
    let x = cx0, row = { y, gi, chips: [], first: true };
    rows.push(row);
    for (const [label, slug, daily] of g.items) {
      const w = Math.round(10 + icon + 7 + label.length * MONO_W(fs) + 10);
      if (x + w > cx1) { x = cx0; row = { y: row.y + chipH + gapY, gi, chips: [], first: false }; rows.push(row); }
      row.chips.push({ x, w, label, slug, daily });
      x += w + gapX;
    }
    y = row.y + chipH + 12;
  });
  const rs = (j) => 0.35 + j * 0.5, sweep = 0.42, T0 = rs(rows.length - 1) + sweep + 0.6, L = { T0, P: 10 };
  let body = '';
  rows.forEach((row, j) => {
    const end = row.chips.at(-1).x + row.chips.at(-1).w;
    row.end = end;
    if (row.first) body += `<text x="${PAD}" y="${row.y + 16}" font-family="${PIXEL}" font-size="11" fill="${T.mute}">${arrive(rs(j), T0)}${esc(P.toolkit[row.gi].group)}</text>`;
    for (const c of row.chips) {
      const at = rs(j) + ((c.x - cx0) / Math.max(1, end - cx0)) * sweep;
      const ic = c.slug && ICONS[c.slug], col = c.daily ? T.gold : T.mute;
      const mark = ic
        ? `<path transform="translate(${c.x + 10},${row.y + (chipH - icon) / 2}) scale(${r2(icon / 24)})" d="${ic.path}" fill="${col}"/>`
        : `<rect x="${c.x + 10}" y="${row.y + (chipH - icon) / 2}" width="${icon}" height="${icon}" rx="3" fill="${col}"/><text x="${c.x + 10 + icon / 2}" y="${row.y + chipH / 2 + 3.5}" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="8" fill="${T.name === 'dark' ? '#0d1117' : '#ffffff'}">${esc(c.label.slice(0, 2).toLowerCase())}</text>`;
      body += `<g>${arrive(at, T0, 0.15)}<rect x="${c.x + 0.5}" y="${row.y + 0.5}" width="${c.w}" height="${chipH}" rx="12" fill="${c.daily ? T.gold : T.tint}" fill-opacity="${c.daily ? 0.12 : 0.04}" stroke="${c.daily ? T.gold : T.line}" stroke-opacity="${c.daily ? 0.75 : 0.14}"/>${mark}` +
        `<text x="${c.x + 10 + icon + 7}" y="${row.y + chipH / 2 + 4}" font-family="${MONO}" font-size="${fs}" fill="${T.ink}">${esc(c.label)}</text></g>`;
    }
  });
  const h = y + 26, keyW = 'in production every day'.length * MONO_W(11);
  body += `<g>${arrive(T0 - 0.4, T0)}<rect x="${r2(CW - PAD - keyW - 18)}" y="${h - 28}" width="10" height="10" rx="5" fill="${T.gold}" fill-opacity="0.16" stroke="${T.gold}"/>
<text x="${CW - PAD}" y="${h - 19}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${T.mute}">in production every day</text></g>`;

  // loop: marquee the last group, then point out one daily driver
  const last = rows.filter((r) => r.gi === P.toolkit.length - 1), m = { x: cx0 - 6, y: last[0].y - 6, w: Math.max(...last.map((r) => r.end)) - cx0 + 12, h: last.at(-1).y + chipH - last[0].y + 12 };
  const dRow = rows.find((r) => r.gi === Math.min(1, P.toolkit.length - 1)), dc = dRow.chips.find((c) => c.daily) ?? dRow.chips[0];
  const nSel = last.reduce((n, r) => n + r.chips.length, 0);
  const over = marquee('planner', m.x, m.y, m.w, m.h, [[1.0, 1.6]], L) + selection('planner', m.x, m.y, m.w, m.h, `${nSel} selected`, shown([[1.6, 4.4]], { L }, 0.05)) +
    selection('planner', dc.x - 3, dRow.y - 3, dc.w + 7, chipH + 7, 'daily driver', shown([[5.8, 8.4]], { L }));
  const rest = [cx0 + Math.max(...last.map((r) => r.end)) - cx0 + 60, last.at(-1).y + 4];
  const crew = cursor('planner', [head.home('planner'), ...rows.flatMap((r, j) => [[rs(j) - 0.06, cx0 + 6, r.y + 17], [rs(j) + sweep, r.end - 4, r.y + 17]])],
    [[0, ...rest], [1.0, m.x, m.y], [1.6, m.x + m.w, m.y + m.h], [2.1, m.x + m.w + 10, m.y + m.h - 4], [4.4, m.x + m.w + 14, m.y + m.h - 8],
      [5.6, dc.x + dc.w + 5, dRow.y - 2], [8.4, dc.x + dc.w + 9, dRow.y + 2]], L) + clicks('planner', [], [[5.7, dc.x + dc.w + 5, dRow.y - 2]], L);

  return doc(h, 'toolkit', P.toolkit.map((g) => `${g.group}: ${g.items.map(([l, , d]) => l + (d ? ' (daily)' : '')).join(', ')}`).join('. ') + '. The planner agent lays the chips out row by row.',
    frame(h) + head.svg + body + over + crew);
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
  const head = header('a year of commits', `charted ${(S.generated || '').slice(0, 10)}`, ['ops']);
  const lit = (col, row) => r2(0.25 + col * 0.028 + row * 0.01), T0 = r2(lit(weeks, 7) + 0.6), L = { T0, P: 10 };
  const pos = (i) => { const idx = i + firstDow; return [x0 + Math.floor(idx / 7) * pitch, y0 + (idx % 7) * pitch]; };
  let cells = '', months = '', lastMonth = -1, lastLabelCol = -9;
  days.forEach((d, i) => {
    const idx = i + firstDow, col = Math.floor(idx / 7), row = idx % 7, [x, y] = pos(i), lv = lvl(d.n);
    // the one orchestrated moment: ops sweeps the year and it lights up behind them, west to east
    const at = lit(col, row);
    const a = lv ? (lv >= 5
      ? `<animate attributeName="opacity" values="0.15;0.15;1" keyTimes="0;${r2(at / (at + 0.4))};1" dur="${r2(at + 0.4)}s" fill="freeze"/>`
      : `<animate attributeName="fill-opacity" values="${LIGHT[0]};${LIGHT[0]};${LIGHT[lv]}" keyTimes="0;${r2(at / (at + 0.4))};1" dur="${r2(at + 0.4)}s" fill="freeze"/>`) : '';
    cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${lv >= 4 ? 6 : 2}" ${starFill(lv)}><title>${d.n} on ${d.date}</title>${a}</rect>`;
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
  const h = sy + 52;

  // ops: sweeps the year, then reads out the busiest day and the current streak
  const midY = y0 + 3 * pitch + 6, sweepEnd = lit(weeks - 1, 3);
  const sweep = Array.from({ length: Math.ceil(weeks / 4) + 1 }, (_, k) => { const c = Math.min(weeks - 1, k * 4); return [lit(c, 3), x0 + c * pitch + 6, midY]; });
  let over = '', loop = [[0, rampX - 150, ly - 4]];
  const bi = days.reduce((b, d, i) => (d.n > (days[b]?.n ?? -1) ? i : b), 0);
  if (days.length) {
    const [bx, by] = pos(bi), lead = days.length - (S.current || 0);
    const sx = x0 + 3 * colW, sw = Math.max(textWidth(stats[3][0], 18, 'silk'), textWidth(stats[3][1], 11)) + 12;
    over += selection('ops', bx - 3, by - 3, cell + 6, cell + 6, `${days[bi].n} on ${day(days[bi].date)}`, shown([[1.0, 4.0]], { L }), { above: true }) +
      (S.current ? selection('ops', sx - 6, sy - 20, sw, 44, `since ${day(days[Math.max(0, lead)].date)}`, shown([[5.3, 8.2]], { L })) : '');
    loop.push([0.8, bx + cell / 2, by + cell / 2], [4.0, bx + cell / 2 + 6, by + cell / 2 + 8], [5.0, sx + sw - 20, sy - 4], [8.2, sx + sw - 14, sy + 2]);
  }
  const crew = cursor('ops', [head.home('ops'), [0.18, x0 - 6, midY], ...sweep, [sweepEnd + 0.4, x0 + gridW - 30, midY + 20]], loop, L, { left: true }) +
    clicks('ops', [], days.length ? [[0.9, pos(bi)[0] + cell / 2, pos(bi)[1] + cell / 2]] : [], L);

  return doc(h, 'a year of commits',
    `The last year of GitHub contributions as a field of stars, brighter for busier days, lit up by the ops agent sweeping across it. ${fmt(S.total)} contributions, longest streak ${fmt(S.longest)} days, current streak ${fmt(S.current)} days, ${fmt(S.allTime)} all-time, last push to ${S.lastPush?.repo ?? 'n/a'}.`,
    frame(h) + head.svg + months + cells + legend + row + over + crew);
}
