/**
 * hero.mjs: the top plate. The profile as a shared canvas that the crew
 * (agents.mjs) builds when it loads, then keeps tending:
 *
 *   planner   drags out the four frames, later measures and selects them
 *   scribe    types the name, then writes the activity log line by line
 *   curator   sorts the sticky notes, then flips the board's sort order
 *   builder   places and wires the pipeline, then health-checks it
 *   ops       starts the log and draws the lag chart, then watches it
 *   reviewer  drops comment pins
 *
 * Words come from data/profile.json ("canvas", "crew"). The light only
 * changes the status line: subah, din, shaam or raat, as in the scenes.
 */
import { P, S, MONO, PIXEL, LOCAL, esc, r2, rng, svg, textWidth } from './lib.mjs';
import { CREW, ARROW, anim, shown, arrive, cursor, clicks, avatars, pin, selection, marquee, crewDefs } from './agents.mjs';

const W = 880, H = 452, BAR = 40;
const T0 = 6.8, L = { T0, P: 12 }, I = { D: T0 };   // intro length, loop
const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));

const THEMES = {
  dark: { bg: '#0d1117', dot: '#262f3b', bar: '#11161d', edge: '#30363d', frame: '#131a22', frameLine: '#2c3642', ink: '#e6edf3', mute: '#8d98a7', dim: '#5d6876', accent: '#ffd23f', ok: '#3fb950', panel: '#1a222c', wire: '#4b5868' },
  light: { bg: '#f6f8fa', dot: '#d3d9e0', bar: '#ffffff', edge: '#d0d7de', frame: '#ffffff', frameLine: '#d3dae2', ink: '#1f2328', mute: '#59636e', dim: '#8c959f', accent: '#bf8700', ok: '#1a7f37', panel: '#ffffff', wire: '#9aa5b1' },
};

// The four frames, and when the planner drags each out: [start, end] seconds
// and the corner it starts from, chosen so the planner never crosses the page.
const F = {
  hello: { x: 28, y: 78, w: 452, h: 132, at: [0.35, 0.8], from: 'tl', label: 'hello.frame' },
  board: { x: 508, y: 78, w: 344, h: 132, at: [0.95, 1.4], from: 'bl', label: 'now.board' },
  log: { x: 508, y: 242, w: 344, h: 172, at: [1.55, 2.0], from: 'tr', label: 'activity' },
  flow: { x: 28, y: 242, w: 452, h: 172, at: [2.15, 2.6], from: 'br' },
};
const corner = (f, c) => [c[1] === 'l' ? f.x : f.x + f.w, c[0] === 't' ? f.y : f.y + f.h];
const opposite = (c) => (c[0] === 't' ? 'b' : 't') + (c[1] === 'l' ? 'r' : 'l');

export function hero(themeName, phase) {
  const T = THEMES[themeName], C = P.canvas, names = Object.keys(CREW);
  F.flow.label = C.flow.name;
  let body = '', over = '', crew = '';

  /* ── toolbar: file name, tools, who's here ── */
  const pres = avatars(names, W - 76, 20, 11, T.bar);
  const tools = [
    (x) => `<path transform="translate(${x - 4},12) scale(0.62)" d="${ARROW}" fill="${T.ink}"/>`,
    (x) => `<path d="M${x - 6} 17 H${x + 6} M${x - 6} 23 H${x + 6} M${x - 3} 14 V26 M${x + 3} 14 V26" stroke="${T.mute}" stroke-width="1.5"/>`,
    (x) => `<rect x="${x - 6}" y="15" width="12" height="10" rx="2" fill="none" stroke="${T.mute}" stroke-width="1.5"/>`,
    (x) => `<path d="M${x - 5} 15 H${x + 5} M${x} 15 V26" stroke="${T.mute}" stroke-width="1.5"/>`,
    (x) => `<path d="M${x - 6} 26 V20 A6 6 0 1 1 ${x} 26 Z" fill="none" stroke="${T.mute}" stroke-width="1.5" stroke-linejoin="round"/>`,
  ];
  let bar = `<rect width="${W}" height="${BAR}" fill="${T.bar}"/><path d="M0 ${BAR - 0.5} H${W}" stroke="${T.edge}"/>` +
    `<rect x="16" y="11" width="18" height="18" rx="5" fill="${T.accent}"/><path transform="translate(21.5,14) scale(0.62)" d="${ARROW}" fill="${T.bar}"/>` +
    `<text x="44" y="24.5" font-family="${MONO}" font-size="12" fill="${T.ink}">${esc(P.topic)}<tspan fill="${T.mute}"> / canvas</tspan></text>` +
    `<rect x="${W / 2 - 73}" y="7" width="26" height="26" rx="6" fill="${T.accent}" fill-opacity="0.16"/>` +
    tools.map((f, i) => f(W / 2 - 60 + i * 30)).join('') + pres.svg +
    `<circle cx="${W - 62}" cy="20" r="3.5" fill="${T.ok}"><animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite"/></circle>` +
    `<text x="${W - 54}" y="24" font-family="${MONO}" font-size="11" fill="${T.ink}">${names.length} live</text>`;
  const home = (n) => [0, pres.at[n], 24];

  /* ── frames, dragged out by the planner ── */
  const planIntro = [home('planner')];
  for (const f of Object.values(F)) {
    const [a, b] = f.at, [sx, sy] = corner(f, f.from), [ex, ey] = corner(f, opposite(f.from));
    planIntro.push([a, sx, sy], [b, ex, ey]);
    body += `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="8" fill="${T.frame}" stroke="${T.frameLine}">` +
      anim('x', [[a, sx], [b, f.x]], I) + anim('y', [[a, sy], [b, f.y]], I) + anim('width', [[a, 0], [b, f.w]], I) + anim('height', [[a, 0], [b, f.h]], I) + '</rect>' +
      `<text x="${f.x + 1}" y="${f.y - 8}" font-family="${MONO}" font-size="10.5" fill="${T.mute}">${arrive(a, T0)}${esc(f.label)}</text>`;
  }

  /* ── hello.frame: the scribe types the name, tagline and what's now ── */
  const Hf = F.hello, sig = P.signature, em = textWidth(sig, 1, 'silk');
  const size = Math.min(34, Math.floor((Hf.w - 44) / em)), nameW = textWidth(sig, size, 'silk');
  const nx = Hf.x + 20, ny = Hf.y + 52, chars = [...sig], dt = 0.085, ta = 0.95, tb = ta + chars.length * dt;
  const typed = chars.map((_, k) => [ta + k * dt, r2(textWidth(chars.slice(0, k).join(''), size, 'silk'))]).concat([[tb, r2(nameW)]]);
  const nowText = `▸ now ${C.now}`, nowW = textWidth(nowText, 12), na = 2.45, nb = 3.45;
  body += `<defs><clipPath id="typed"><rect x="${nx - 2}" y="${ny - size}" width="${r2(nameW + 4)}" height="${r2(size * 1.3)}">${anim('width', typed.map(([t, w]) => [t, w + 2]), { D: T0, calc: 'discrete' })}</rect></clipPath>` +
    `<clipPath id="nowline"><rect x="${nx - 2}" y="${Hf.y + 92}" width="${r2(nowW + 4)}" height="20">${anim('width', [[na, 0], [nb, nowW + 4]], { D: T0, calc: 'linear' })}</rect></clipPath></defs>` +
    `<text clip-path="url(#typed)" x="${nx}" y="${ny}" font-family="${PIXEL}" font-weight="700" font-size="${size}" fill="${T.ink}">${esc(sig)}</text>` +
    `<rect x="${nx}" y="${r2(ny - size * 0.78)}" width="2" height="${r2(size * 0.84)}" fill="${CREW.scribe.color}" opacity="0">` +
    anim('x', typed.map(([t, w]) => [t, nx + w + 2]), { D: T0, calc: 'discrete' }) + shown([[ta - 0.05, tb + 0.3]], I, 0.02) + '</rect>' +
    `<text x="${nx}" y="${ny + 28}" font-family="${MONO}" font-size="13" fill="${T.ink}">${arrive(tb + 0.1, T0, 0.3)}${esc(P.tagline)}</text>` +
    `<text clip-path="url(#nowline)" x="${nx}" y="${Hf.y + 106}" font-family="${MONO}" font-size="12" fill="${T.mute}"><tspan fill="${T.accent}">▸ now</tspan> ${esc(C.now)}</text>`;
  const tagEnd = nx + textWidth(P.tagline, 13);

  /* ── now.board: the curator sorts a pile of sticky notes ── */
  const B = F.board, sw = (B.w - 36) / 2, sh = 50;
  const slot = (k) => [B.x + 12 + (k % 2) * (sw + 12), B.y + 12 + Math.floor(k / 2) * (sh + 10)];
  const pile = [[612, 134, -8], [664, 112, 7], [598, 106, 11], [676, 142, -6]];
  const grab = [26, 16], g0 = 1.7, gstep = 0.62, gdur = 0.42;
  const curIntro = [home('curator')];
  C.board.forEach((n, k) => {
    const [x, y] = slot(k), [px, py, rot] = pile[k], [rx, ry] = slot(n.recent), g = g0 + k * gstep;
    const off = `${px - x},${py - y}`, swap = `${rx - x},${ry - y}`;
    curIntro.push([g - 0.06, px + grab[0], py + grab[1]], [g + gdur, x + grab[0], y + grab[1]]);
    body += `<g transform="translate(${x},${y})"><g>${anim(null, [[1.2, '0,0'], [2.0, swap], [7.2, swap], [8.0, '0,0']], { type: 'translate', L })}` +
      `<g>${anim(null, [[g, off], [g + gdur, '0,0']], { type: 'translate', D: T0 })}<g>${anim(null, [[g, `${rot} ${sw / 2} ${sh / 2}`], [g + gdur, `0 ${sw / 2} ${sh / 2}`]], { type: 'rotate', D: T0 })}` +
      `<g>${arrive(1.42 + k * 0.05, T0, 0.12)}<rect width="${sw}" height="${sh}" rx="6" fill="${n.color}"/><path d="M${sw - 12} ${sh} L${sw} ${sh - 12} V${sh - 6} A6 6 0 0 1 ${sw - 6} ${sh} Z" fill="#000000" opacity="0.12"/>` +
      `<text x="11" y="21" font-family="${PIXEL}" font-weight="700" font-size="12" fill="#1d1f24">${esc(n.title)}</text>` +
      `<text x="11" y="38" font-family="${MONO}" font-size="10.5" fill="#3f434b">${esc(n.sub)}</text></g></g></g></g></g>`;
  });
  const sortX = B.x + B.w, sortY = B.y - 8, tri = `<path d="M${sortX - 7} ${sortY - 6} h7 l-3.5 4 Z" fill="${T.mute}"/>`;
  const sortLabel = (txt, win) => `<text x="${sortX - 12}" y="${sortY}" text-anchor="end" font-family="${MONO}" font-size="10.5" fill="${T.mute}">${win}sort: <tspan fill="${T.ink}">${txt}</tspan></text>`;
  body += `<g>${arrive(B.at[0], T0)}${tri}${sortLabel('impact', anim('opacity', [[0, 1], [1.0, 1], [1.01, 0], [7.0, 0], [7.01, 1]], { L, calc: 'discrete' }))}` +
    `<g opacity="0">${anim('opacity', [[0, 0], [1.0, 0], [1.01, 1], [7.0, 1], [7.01, 0]], { L, calc: 'discrete' })}${sortLabel('recent', '')}</g></g>`;
  const sortTip = [sortX - 66, sortY - 4];

  /* ── the flow: the builder places and wires the pipeline ── */
  const Fl = F.flow, nodes = C.flow.nodes, nw = 80, nh = 44, gap = (Fl.w - 40 - nodes.length * nw) / (nodes.length - 1);
  const nodeAt = nodes.map((_, i) => [Fl.x + 20 + i * (nw + gap), Fl.y + 22]);
  const cen = (i) => [nodeAt[i][0] + nw / 2, nodeAt[i][1] + nh / 2];
  const n0 = 2.8, nstep = 0.6, buildIntro = [home('builder')], buildClicks = [];
  nodes.forEach(([title, sub], i) => {
    const [x, y] = nodeAt[i], [cx, cy] = cen(i), t = n0 + i * nstep, check = 7.8 + i * 0.55;
    buildIntro.push([t, cx, cy]); buildClicks.push([t, cx, cy]);
    body += `<g transform="translate(${cx},${cy})"><g>${anim(null, [[t, '0.5'], [t + 0.25, '1']], { type: 'scale', D: T0 })}${arrive(t, T0, 0.12)}<g transform="translate(${-cx},${-cy})">` +
      `<rect x="${x}" y="${y}" width="${nw}" height="${nh}" rx="8" fill="${T.panel}" stroke="${T.frameLine}" stroke-width="1.2">${anim('stroke', [[0, T.frameLine], [check, T.frameLine], [check + 0.15, T.ok], [check + 0.9, T.ok], [check + 1.2, T.frameLine]], { L, calc: 'linear' })}</rect>` +
      `<text x="${x + 10}" y="${y + 19}" font-family="${MONO}" font-weight="700" font-size="11" fill="${T.ink}">${esc(title)}</text>` +
      `<text x="${x + 10}" y="${y + 34}" font-family="${MONO}" font-size="10" fill="${T.mute}">${esc(sub)}</text></g></g></g>`;
    if (i === nodes.length - 1) return;
    const x1 = x + nw + 3, x2 = nodeAt[i + 1][0] - 4, len = r2(x2 - x1), w0 = t + 0.2, w1 = t + 0.5;
    buildIntro.push([w0, x1, cy], [w1, x2, cy]);
    body += `<path d="M${r2(x1)} ${cy} H${r2(x2)}" stroke="${T.wire}" stroke-width="1.5" stroke-dasharray="${len}">${anim('stroke-dashoffset', [[w0, len], [w1, 0]], { D: T0, calc: 'linear' })}</path>` +
      `<path d="M${r2(x2 - 5)} ${cy - 4} L${r2(x2)} ${cy} L${r2(x2 - 5)} ${cy + 4}" fill="none" stroke="${T.wire}" stroke-width="1.5">${arrive(w1 - 0.05, T0, 0.1)}</path>`;
    for (let j = 0; j < 2; j++) body += `<rect x="-2.5" y="-2.5" width="5" height="5" fill="${T.accent}" opacity="0" transform="translate(${r2(x1)},${cy})">` +
      `<animateTransform attributeName="transform" type="translate" values="${r2(x1)},${cy};${r2(x2 - 6)},${cy}" dur="1.4s" begin="${r2(T0 + i * 0.25 + j * 0.7)}s" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.8;1" dur="1.4s" begin="${r2(T0 + i * 0.25 + j * 0.7)}s" repeatCount="indefinite"/></rect>`;
  });

  /* ── the lag chart: ops draws it, then it scrolls like a live panel ── */
  const cx0 = Fl.x + 20, cw = Fl.w - 40, cy0 = Fl.y + 92, ch = 62, N = 48, step = cw / N, R = rng(11);
  const v = Array.from({ length: N }, (_, i) => 0.14 + R() * 0.13 + 0.42 * Math.exp(-(((i - 15) / 2.2) ** 2)) + 0.22 * Math.exp(-(((i - 36) / 1.6) ** 2)));
  const pts = Array.from({ length: 2 * N + 1 }, (_, i) => [r2(cx0 + i * step), r2(cy0 + ch - v[i % N] * ch)]);
  const line = 'M' + pts.map((p) => p.join(' ')).join(' L');
  const opsY = cy0 + 22, live = [F.log.x + F.log.w - 30, F.log.y - 12];
  body += `<text x="${cx0}" y="${Fl.y + 80}" font-family="${MONO}" font-size="10.5" fill="${T.mute}">${arrive(F.flow.at[1], T0)}${esc(C.flow.watch)}</text>` +
    `<text x="${Fl.x + Fl.w - 20}" y="${Fl.y + 80}" text-anchor="end" font-family="${MONO}" font-size="10.5" fill="${T.ok}">${arrive(F.flow.at[1], T0)}● healthy</text>` +
    [0, 0.5, 1].map((f) => `<path d="M${cx0} ${r2(cy0 + f * ch)} H${cx0 + cw}" stroke="${T.frameLine}" stroke-dasharray="2 4">${arrive(F.flow.at[1], T0)}</path>`).join('') +
    `<defs><linearGradient id="lagfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.ok}" stop-opacity="0.28"/><stop offset="1" stop-color="${T.ok}" stop-opacity="0"/></linearGradient>` +
    `<clipPath id="chart"><rect x="${cx0}" y="${cy0 - 4}" width="${cw}" height="${ch + 4}">${anim('width', [[3.0, 0], [4.2, cw]], { D: T0, calc: 'linear' })}</rect></clipPath></defs>` +
    `<g clip-path="url(#chart)"><g><animateTransform attributeName="transform" type="translate" values="0,0;${r2(-cw)},0" dur="16s" begin="${T0}s" repeatCount="indefinite"/>` +
    `<path d="${line} L${pts.at(-1)[0]} ${cy0 + ch} L${cx0} ${cy0 + ch} Z" fill="url(#lagfill)"/><path d="${line}" fill="none" stroke="${T.ok}" stroke-width="1.6" stroke-linejoin="round"/></g></g>` +
    `<g transform="translate(${cx0 + 10},0)">${anim(null, [[0, `${cx0 + 10},0`], [4.8, `${cx0 + cw - 10},0`]], { type: 'translate', L })}` +
    `<path d="M0 ${cy0 - 4} V${cy0 + ch}" stroke="${CREW.ops.color}" stroke-dasharray="3 3" opacity="0">${shown([[0.3, 4.8]], { L })}</path></g>`;

  /* ── activity: the scribe writes a log that scrolls like a live feed ── */
  const Lg = F.log, lh = 19, rows = 5, rowY = Lg.y + 34, sstep = 1.5, tx = Lg.x + 85;
  const log = [
    ['ops', `pulled ${fmt(S.total)} contributions`],
    ['curator', 'sorted now.board by impact'],
    ['builder', `wired the flow, ${nodes.length}/${nodes.length} green`],
    ['reviewer', 'approved hello.frame'],
    ['ops', `current streak: ${fmt(S.current)} days`],
    ['curator', 'sorted now.board by recent'],
    ['planner', `measured hello.frame`],
    ['reviewer', `pinned "${C.comments.board}" on now.board`],
  ].map(([n, t]) => [n, t.length > 37 ? t.slice(0, 36) + '…' : t]);
  const lineEnd = (k) => tx + textWidth(log[k][1], 11);
  let feed = '';
  for (let c = 0; c < log.length + rows - 1; c++) {
    const [n, t] = log[c % log.length], y = rowY + c * lh, full = r2(lineEnd(c % log.length) - Lg.x);
    // copies 0..3 are written during the intro; the rest are typed as they arrive at the bottom
    const enter = (c - rows + 1) * sstep;
    const reveal = c < rows - 1 ? '' : anim('width', [[0, 0], [enter + 0.05, 0], [enter + 0.55, full]], { L, calc: 'linear' }) + (c === rows - 1 ? anim('width', [[0, 0]], I) : '');
    feed += `<clipPath id="row${c}"><rect x="${Lg.x}" y="${y - 12}" width="${full}" height="${lh}">${reveal}</rect></clipPath>` +
      `<g clip-path="url(#row${c})">${c < rows - 1 ? arrive([2.3, 4.1, 5.0, 5.8][c], T0, 0.25) : ''}<circle cx="${Lg.x + 18}" cy="${y - 4}" r="3.5" fill="${CREW[n].color}"/>` +
      `<text x="${Lg.x + 28}" y="${y}" font-family="${MONO}" font-weight="700" font-size="11" fill="${T.ink}">${esc(n)}</text>` +
      `<text x="${tx}" y="${y}" font-family="${MONO}" font-size="11" fill="${T.mute}">${esc(t)}</text></g>`;
  }
  const scroll = [];
  for (let k = 0; k < log.length; k++) scroll.push([k * sstep, `0,${-k * lh}`], [(k + 1) * sstep - 0.35, `0,${-k * lh}`]);
  scroll.push([log.length * sstep, `0,${-log.length * lh}`]);
  body += `<defs><clipPath id="feed"><rect x="${Lg.x + 1}" y="${rowY - 14}" width="${Lg.w - 2}" height="${rows * lh + 1}"/></clipPath>` +
    `<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.frame}"/><stop offset="1" stop-color="${T.frame}" stop-opacity="0"/></linearGradient></defs>` +
    `<g clip-path="url(#feed)"><g>${anim(null, scroll, { type: 'translate', L })}${feed}</g></g>` +
    `<rect x="${Lg.x + 1}" y="${rowY - 14}" width="${Lg.w - 2}" height="12" fill="url(#fade)" opacity="0">${arrive(F.log.at[1], T0)}</rect>` +
    `<g>${arrive(F.log.at[1], T0)}<rect x="${Lg.x + 12}" y="${Lg.y + 130}" width="${Lg.w - 24}" height="28" rx="7" fill="${T.bg}" stroke="${T.frameLine}"/>` +
    `<rect x="${Lg.x + 24}" y="${Lg.y + 138}" width="1.5" height="13" fill="${T.mute}"><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1.1s" repeatCount="indefinite"/></rect>` +
    `<text x="${Lg.x + 31}" y="${Lg.y + 148}" font-family="${MONO}" font-size="11" fill="${T.dim}">brief the crew…</text></g>` +
    `<g>${arrive(F.log.at[0], T0)}<circle cx="${live[0] - 8}" cy="${Lg.y - 11.5}" r="3.5" fill="${T.ok}"/>` +
    `<circle cx="${live[0] - 8}" cy="${Lg.y - 11.5}" r="3.5" fill="none" stroke="${T.ok}"><animate attributeName="r" values="3.5;8;3.5" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/></circle>` +
    `<text x="${Lg.x + Lg.w}" y="${Lg.y - 8}" text-anchor="end" font-family="${MONO}" font-size="10.5" fill="${T.mute}">live</text></g>`;

  /* ── comments and selections, over the work ── */
  const helloPin = [tagEnd + 12, ny + 30], flowPin = [cx0 + cw - 30, cy0 + 16], boardPin = [B.x + B.w - 64, B.y + 20];
  over += pin('reviewer', ...helloPin, C.comments.hello, shown([[5.3, 6.5]], I) + shown([[8.3, 10.8]], { L }), T) +
    pin('reviewer', ...flowPin, C.comments.flow, shown([[0.4, 2.8]], { L }), T, true) +
    pin('reviewer', ...boardPin, C.comments.board, shown([[4.0, 6.4]], { L }), T, true);
  const sel = { x: nx - 8, y: r2(ny - size * 0.92), w: r2(nameW + 14), h: r2(size * 1.08) };
  over += marquee('planner', sel.x, sel.y, sel.w, sel.h, [1.4, 2.0], L) +
    selection('planner', sel.x, sel.y, sel.w, sel.h, `${Math.round(sel.w)} x ${Math.round(sel.h)}`, shown([[2.0, 5.2]], { L }, 0.05)) +
    marquee('planner', B.x + 6, B.y + 6, B.w - 12, B.h - 12, [8.6, 9.2], L) +
    selection('planner', B.x + 6, B.y + 6, B.w - 12, B.h - 12, `${C.board.length} notes`, shown([[9.2, 11.2]], { L }, 0.05));
  const [k1x, k1y] = nodeAt[1];
  over += selection('builder', k1x - 3, k1y - 3, nw + 6, nh + 6, nodes[1][0], shown([[1.3, 3.2]], { L }, 0.08));

  /* ── the crew ── */
  const rest = { planner: [494, 224], curator: [B.x + B.w - 46, B.y + B.h - 8], builder: [cen(1)[0] + 30, cen(1)[1] + 26], reviewer: [flowPin[0] + 12, flowPin[1] + 14] };
  planIntro.push([3.4, 470, 214]);
  crew += cursor('planner', planIntro, [[0, ...rest.planner], [1.4, sel.x, sel.y], [2.0, sel.x + sel.w, sel.y + sel.h], [2.5, sel.x + sel.w + 14, sel.y + sel.h + 8],
    [5.0, sel.x + sel.w + 18, sel.y + sel.h + 4], [6.4, ...rest.planner], [8.6, B.x + 6, B.y + 6], [9.2, B.x + B.w - 6, B.y + B.h - 6], [9.7, B.x + B.w - 24, B.y + B.h + 2], [11.2, B.x + B.w - 30, B.y + B.h]], L);

  const [now0x, now0y] = [nx, Hf.y + 110];
  const scribeLoop = [];
  const yb = rowY + (rows - 1) * lh + 3;
  for (let k = 0; k < log.length; k++) {
    const e = lineEnd((k + rows - 1) % log.length);
    scribeLoop.push([k * sstep + 0.05, Lg.x + 16, yb], [k * sstep + 0.55, e + 3, yb], [k * sstep + 0.95, e + 3, yb]);
  }
  crew += cursor('scribe', [home('scribe'), [ta - 0.05, nx + 4, ny + 4], ...typed.map(([t, w]) => [t, nx + w + 4, ny + 4]), [tb + 0.2, nx + nameW + 6, ny + 6],
    [na, now0x, now0y], [nb, nx + nowW + 4, now0y], [4.6, nx + nowW + 20, now0y + 6], [6.75, Lg.x + 16, yb]], scribeLoop, L);

  crew += cursor('curator', [...curIntro, [4.5, ...rest.curator]], [[0, ...rest.curator], [0.85, ...sortTip], [1.3, sortTip[0] + 8, sortTip[1] + 12],
    [3.0, slot(1)[0] + 60, slot(1)[1] + 30], [5.2, slot(2)[0] + 90, slot(2)[1] + 26], [6.7, ...sortTip], [7.3, sortTip[0] + 8, sortTip[1] + 12], [9.4, slot(3)[0] + 40, slot(3)[1] + 30]], L);
  crew += clicks('curator', [], [[1.0, ...sortTip], [7.0, ...sortTip]], L);

  crew += cursor('builder', [...buildIntro, [5.4, cen(3)[0] + 10, cen(3)[1] + 16]], [[0, ...rest.builder], [1.0, cen(1)[0] + 10, cen(1)[1] + 6], [3.2, cen(1)[0] + 14, cen(1)[1] + 10],
    [4.6, cen(2)[0] - 10, cen(2)[1] + 30], [7.8, ...cen(0)], [8.35, ...cen(1)], [8.9, ...cen(2)], [9.45, ...cen(3)], [10.4, cen(3)[0] + 10, cen(3)[1] + 18]], L);
  crew += clicks('builder', buildClicks, nodes.map((_, i) => [7.8 + i * 0.55, ...cen(i)]), L);

  crew += cursor('ops', [home('ops'), [2.0, ...live], [2.5, live[0] + 10, live[1] + 14], [3.0, cx0 + 10, opsY], [4.2, cx0 + cw - 10, opsY], [6.0, cx0 + cw / 2, opsY + 8]],
    [[0, cx0 + 10, opsY], [4.8, cx0 + cw - 10, opsY], [5.6, ...live], [6.4, live[0] + 10, live[1] + 16], [8.2, cx0 + cw * 0.6, opsY - 30]], L);
  crew += clicks('ops', [[2.15, ...live]], [[6.0, ...live]], L);

  crew += cursor('reviewer', [home('reviewer'), [5.0, ...helloPin], [5.6, helloPin[0] + 14, helloPin[1] + 12]],
    [[0, ...flowPin], [0.8, ...rest.reviewer], [2.9, rest.reviewer[0] + 4, rest.reviewer[1] - 6], [3.8, ...boardPin], [4.4, boardPin[0] + 10, boardPin[1] + 14],
      [7.9, ...helloPin], [8.6, helloPin[0] + 14, helloPin[1] + 12], [10.9, helloPin[0] + 20, helloPin[1] + 16]], L);
  crew += clicks('reviewer', [[5.15, ...helloPin]], [[0.25, ...flowPin], [3.85, ...boardPin], [8.15, ...helloPin]], L);

  /* ── status line ── */
  const place = P.place.name.toLowerCase();
  const status = `<text x="28" y="${H - 14}" font-family="${MONO}" font-size="11" fill="${T.mute}">${esc(`${LOCAL[phase]} in ${place}`)} <tspan fill="${T.dim}">·</tspan> ${esc(C.shifts[phase])}</text>` +
    `<text x="${W - 28}" y="${H - 14}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${T.dim}">rebuilt by ${names.length} agents on every load</text>`;

  const all = `<defs><clipPath id="round"><rect width="${W}" height="${H}" rx="14"/></clipPath>` +
    `<pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${T.dot}"/></pattern>${crewDefs()}</defs>` +
    `<g clip-path="url(#round)"><rect width="${W}" height="${H}" fill="${T.bg}"/><rect y="${BAR}" width="${W}" height="${H - BAR}" fill="url(#dots)"/>` +
    bar + body + over + status + crew + '</g>' +
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${T.edge}"/>`;
  return svg({
    w: W, h: H, fonts: ['Silkscreen', 'JetBrains Mono'],
    title: `${P.name}, built by agents`,
    desc: `A shared canvas, like a multiplayer design tool, with ${names.length} AI agents shown as named cursors building ${P.name}'s profile: ` +
      names.map((n) => `${n} ${CREW[n].job}`).join(', ') + `. The name, ${P.signature}, is typed out with the tagline "${P.tagline}" and "now: ${C.now}". ` +
      `Sticky notes get sorted: ${C.board.map((n) => `${n.title} (${n.sub})`).join(', ')}. A pipeline is wired: ${nodes.map((n) => n[0]).join(' to ')}, with a live lag chart. ` +
      `An activity feed scrolls as the agents work. ${LOCAL[phase]} in ${place}: ${C.shifts[phase]}.`,
    body: all,
  });
}
