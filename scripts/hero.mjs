/**
 * hero.mjs: the top plate. The profile as a shared canvas that the crew
 * (agents.mjs) builds when it loads, then keeps working on for a story of
 * about a minute and a half before it starts over:
 *
 *   planner   drags out the four frames, later measures and selects them
 *   scribe    types the name, then writes the activity log line by line
 *   curator   sorts the sticky notes, then flips the board's sort order
 *   builder   lays out how each product got built, then checks every step
 *   ops       ships each product, with a bang, and keeps the log live
 *   reviewer  drops comment pins
 *
 * The story is eight 12s cycles. In most of them each agent runs its
 * routine; some cycles are set pieces instead (ACT): a launch per product,
 * a standup where the whole crew circles up, a surprise for anyone still
 * reading, and a victory lap. Words come from data/profile.json ("canvas",
 * "crew"). The light only changes the status line.
 */
import { P, S, MONO, PIXEL, LOCAL, esc, r2, rng, svg, textWidth } from './lib.mjs';
import { CREW, ARROW, anim, shown, arrive, cursor, clicks, avatars, pin, selection, marquee, crewDefs } from './agents.mjs';

const W = 880, H = 452, BAR = 40;
const T0 = 7.6, I = { D: T0 };                       // the intro, and where the story starts
const CYC = 12, NC = 8, LS = { T0, P: CYC * NC }, L12 = { T0, P: CYC };
const ACT = { launch: [1, 3], standup: 5, surprise: 6, lap: 7 };
const BUSY = { planner: [5, 6, 7], scribe: [5, 6, 7], curator: [5, 7], builder: [5, 7], reviewer: [1, 3, 5, 6, 7], ops: [1, 3, 5, 7] };
const free = (who) => [...Array(NC).keys()].filter((c) => !BUSY[who].includes(c));
/** An agent's 12s routine, repeated through every cycle it isn't busy with a set piece. */
const tile = (who, list) => free(who).flatMap((c) => list.map(([t, ...v]) => [c * CYC + t, ...v]));
const tileWins = (who, wins) => free(who).flatMap((c) => wins.map(([a, b]) => [c * CYC + a, c * CYC + b]));
const byTime = (list) => [...list].sort((a, b) => a[0] - b[0]);
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
  let body = '', over = '', fx = '', crew = '';

  /* ── toolbar: file name, tools, who's here ── */
  const pres = avatars(names, W - 76, 20, 11, T.bar);
  const tools = [
    (x) => `<path transform="translate(${x - 4},12) scale(0.62)" d="${ARROW}" fill="${T.ink}"/>`,
    (x) => `<path d="M${x - 6} 17 H${x + 6} M${x - 6} 23 H${x + 6} M${x - 3} 14 V26 M${x + 3} 14 V26" stroke="${T.mute}" stroke-width="1.5"/>`,
    (x) => `<rect x="${x - 6}" y="15" width="12" height="10" rx="2" fill="none" stroke="${T.mute}" stroke-width="1.5"/>`,
    (x) => `<path d="M${x - 5} 15 H${x + 5} M${x} 15 V26" stroke="${T.mute}" stroke-width="1.5"/>`,
    (x) => `<path d="M${x - 6} 26 V20 A6 6 0 1 1 ${x} 26 Z" fill="none" stroke="${T.mute}" stroke-width="1.5" stroke-linejoin="round"/>`,
  ];
  const bar = `<rect width="${W}" height="${BAR}" fill="${T.bar}"/><path d="M0 ${BAR - 0.5} H${W}" stroke="${T.edge}"/>` +
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
  const wk = (s, k) => r2(textWidth([...s].slice(0, k).join(''), size, 'silk'));
  const typed = chars.map((_, k) => [ta + k * dt, wk(sig, k)]).concat([[tb, r2(nameW)]]);
  const nowText = `▸ now ${C.now}`, nowW = textWidth(nowText, 12), na = 2.45, nb = 3.45;

  // the surprise: the scribe deletes the name, says hi to whoever's still here, then puts it back
  const sb = ACT.surprise * CYC, sur = [...C.surprise], surW = textWidth(C.surprise, size, 'silk');
  const del = sb + 1.2, say = sb + 2.4, unsay = sb + 7.4, back = sb + 8.5, ds = 0.06;
  const nameLoop = [[0, nameW + 4], ...chars.map((_, j) => [del + j * ds, wk(sig, chars.length - 1 - j) + 2]),
    ...chars.map((_, k) => [back + k * dt, wk(sig, k) + 2]), [back + chars.length * dt, nameW + 4]];
  const surLoop = [[0, 0], ...sur.map((_, k) => [say + k * dt, wk(C.surprise, k) + 2]), [say + sur.length * dt, surW + 4],
    ...sur.map((_, j) => [unsay + j * ds, wk(C.surprise, sur.length - 1 - j) + 2]), [unsay + sur.length * ds, 0]];
  const caretLoop = [[0, nx + nameW + 2], ...nameLoop.slice(1, -1), ...surLoop.slice(1, -1)].map(([t, w], i) => [t, i ? nx + w : w]);
  caretLoop.push([back + chars.length * dt, nx + nameW + 2]);
  body += `<defs><clipPath id="typed"><rect x="${nx - 2}" y="${ny - size}" width="${r2(nameW + 4)}" height="${r2(size * 1.3)}">` +
    anim('width', typed.map(([t, w]) => [t, w + 2]), { D: T0, calc: 'discrete' }) + anim('width', nameLoop, { L: LS, calc: 'discrete' }) + '</rect></clipPath>' +
    `<clipPath id="hi"><rect x="${nx - 2}" y="${ny - size}" width="0" height="${r2(size * 1.3)}">${anim('width', surLoop, { L: LS, calc: 'discrete' })}</rect></clipPath>` +
    `<clipPath id="nowline"><rect x="${nx - 2}" y="${Hf.y + 92}" width="${r2(nowW + 4)}" height="20">${anim('width', [[na, 0], [nb, nowW + 4]], { D: T0, calc: 'linear' })}</rect></clipPath></defs>` +
    `<text clip-path="url(#typed)" x="${nx}" y="${ny}" font-family="${PIXEL}" font-weight="700" font-size="${size}" fill="${T.ink}">${esc(sig)}</text>` +
    `<text clip-path="url(#hi)" x="${nx}" y="${ny}" font-family="${PIXEL}" font-weight="700" font-size="${size}" fill="${CREW.scribe.color}">${esc(C.surprise)}</text>` +
    `<rect x="${nx}" y="${r2(ny - size * 0.78)}" width="2" height="${r2(size * 0.84)}" fill="${CREW.scribe.color}" opacity="0">` +
    anim('x', typed.map(([t, w]) => [t, nx + w + 2]), { D: T0, calc: 'discrete' }) + shown([[ta - 0.05, tb + 0.3]], I, 0.02) +
    anim('x', byTime(caretLoop), { L: LS, calc: 'discrete' }) + shown([[del - 0.3, back + chars.length * dt + 0.4]], { L: LS }, 0.02) + '</rect>' +
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
    body += `<g transform="translate(${x},${y})"><g>${anim(null, tile('curator', [[1.2, '0,0'], [2.0, swap], [7.2, swap], [8.0, '0,0']]), { type: 'translate', L: LS })}` +
      `<g>${anim(null, [[g, off], [g + gdur, '0,0']], { type: 'translate', D: T0 })}<g>${anim(null, [[g, `${rot} ${sw / 2} ${sh / 2}`], [g + gdur, `0 ${sw / 2} ${sh / 2}`]], { type: 'rotate', D: T0 })}` +
      `<g>${arrive(1.42 + k * 0.05, T0, 0.12)}<rect width="${sw}" height="${sh}" rx="6" fill="${n.color}"/><path d="M${sw - 12} ${sh} L${sw} ${sh - 12} V${sh - 6} A6 6 0 0 1 ${sw - 6} ${sh} Z" fill="#000000" opacity="0.12"/>` +
      `<text x="11" y="21" font-family="${PIXEL}" font-weight="700" font-size="12" fill="#1d1f24">${esc(n.title)}</text>` +
      `<text x="11" y="38" font-family="${MONO}" font-size="10.5" fill="#3f434b">${esc(n.sub)}</text></g></g></g></g></g>`;
  });
  const sortX = B.x + B.w, sortY = B.y - 8, tri = `<path d="M${sortX - 7} ${sortY - 6} h7 l-3.5 4 Z" fill="${T.mute}"/>`;
  const sortLabel = (txt, win) => `<text x="${sortX - 12}" y="${sortY}" text-anchor="end" font-family="${MONO}" font-size="10.5" fill="${T.mute}">${win}sort: <tspan fill="${T.ink}">${txt}</tspan></text>`;
  body += `<g>${arrive(B.at[0], T0)}${tri}${sortLabel('impact', anim('opacity', tile('curator', [[1.0, 1], [1.01, 0], [7.0, 0], [7.01, 1]]), { L: LS, calc: 'discrete' }))}` +
    `<g opacity="0">${anim('opacity', tile('curator', [[1.0, 0], [1.01, 1], [7.0, 1], [7.01, 0]]), { L: LS, calc: 'discrete' })}${sortLabel('recent', '')}</g></g>`;
  const sortTip = [sortX - 66, sortY - 4];

  /* ── product.flow: how each product got built, idea to launch; ops ships it, with a bang ── */
  const Fl = F.flow, stages = C.flow.stages, lanes = C.flow.lanes, n = stages.length, nw = 82, nh = 40, laneH = 76;
  const gap = (Fl.w - 40 - n * nw) / (n - 1);
  const at = (k, i) => [Fl.x + 20 + i * (nw + gap), Fl.y + 34 + k * laneH];
  const cen = (k, i) => [at(k, i)[0] + nw / 2, at(k, i)[1] + nh / 2];
  const shipIntro = (k) => 3.95 + k * 1.3, shipAct = (k) => ACT.launch[k] * CYC + 1.5;
  const n0 = 2.75, nstep = 0.3, buildIntro = [home('builder')], buildClicks = [], checks = [];
  const live = [F.log.x + F.log.w - 30, F.log.y - 12];
  const flash = (s, c) => [[s, T.frameLine], [s + 0.1, c], [s + 0.9, c], [s + 1.1, T.frameLine]];

  // the launch figure counts up to itself when its product ships
  function counter(x, y, text, k) {
    const m = String(text).match(/^([\d.]+)(k?)\+?\s*(.*)$/), when = [[shipIntro(k), I], [shipAct(k), { L: LS }]];
    const t0 = (o) => `<text x="${x}" y="${y}" font-family="${MONO}" font-weight="700" font-size="10" fill="${T.accent}"${o}>`;
    if (!m) return `${t0('')}${esc(text)}</text>`;
    const v = parseFloat(m[1]) * (m[2] ? 1000 : 1), steps = [0.06, 0.18, 0.36, 0.6, 0.84], d = 0.15, run = steps.length * d;
    const label = (f) => { const x = v * f; return `${x >= 1000 ? (x / 1000).toFixed(1) + 'k' : Math.round(x)} ${m[3]}`; };
    return t0('') + when.map(([t, o]) => anim('opacity', [[0, 1], [t, 1], [t + 0.01, 0], [t + run, 0], [t + run + 0.01, 1]], { ...o, calc: 'linear' })).join('') + `${esc(text)}</text>` +
      steps.map((f, j) => t0(' opacity="0"') + when.map(([t, o]) => shown([[t + j * d, t + (j + 1) * d]], o, 0.01)).join('') + `${esc(label(f))}</text>`).join('');
  }

  lanes.forEach((lane, k) => {
    const hy = Fl.y + 24 + k * laneH;
    body += `<g>${arrive(F.flow.at[1] + 0.1 + k * 0.1, T0)}<circle cx="${Fl.x + 24}" cy="${hy - 4}" r="4" fill="${lane.color}"/>` +
      `<text x="${Fl.x + 34}" y="${hy}" font-family="${MONO}" font-weight="700" font-size="11" fill="${T.ink}">${esc(lane.site)}</text>` +
      `<text x="${Fl.x + Fl.w - 20}" y="${hy}" text-anchor="end" font-family="${MONO}" font-size="10.5" fill="${T.mute}">${esc(lane.name)}</text>` +
      (k ? `<path d="M${Fl.x + 20} ${hy - 22} H${Fl.x + Fl.w - 20}" stroke="${T.frameLine}" stroke-dasharray="2 4"/>` : '') + '</g>';
    stages.forEach((stage, i) => {
      const [x, y] = at(k, i), [cx, cy] = cen(k, i), t = n0 + k * 1.3 + i * nstep, last = i === n - 1, check = 7.8 + (k * n + i) * 0.3;
      buildIntro.push([t, cx, cy]); buildClicks.push([t, cx, cy]); checks.push([check, cx, cy]);
      const strokes = byTime([...tile('builder', [[check, T.frameLine], [check + 0.15, T.ok], [check + 0.9, T.ok], [check + 1.2, T.frameLine]]), ...(last ? flash(shipAct(k), T.accent) : [])]);
      body += `<g transform="translate(${cx},${cy})"><g>${anim(null, [[t, '0.5'], [t + 0.2, '1']], { type: 'scale', D: T0 })}${arrive(t, T0, 0.12)}<g transform="translate(${-cx},${-cy})">` +
        `<rect x="${x}" y="${y}" width="${nw}" height="${nh}" rx="8" fill="${T.panel}" stroke="${T.frameLine}" stroke-width="1.2">` +
        (last ? anim('stroke', flash(shipIntro(k), T.accent), { D: T0, calc: 'linear' }) : '') + anim('stroke', strokes, { L: LS, calc: 'linear' }) + '</rect>' +
        `<text x="${x + 9}" y="${y + 16}" font-family="${MONO}" font-weight="700" font-size="11" fill="${T.ink}">${esc(stage)}</text>` +
        (last ? counter(x + 9, y + 31, lane.steps[i], k) : `<text x="${x + 9}" y="${y + 31}" font-family="${MONO}" font-size="10" fill="${T.mute}">${esc(lane.steps[i])}</text>`) +
        '</g></g></g>';
      if (last) return;
      const x1 = x + nw + 3, x2 = at(k, i + 1)[0] - 4, len = r2(x2 - x1), w0 = t + 0.1, w1 = t + 0.28;
      buildIntro.push([w0, x1, cy], [w1, x2, cy]);
      body += `<path d="M${r2(x1)} ${cy} H${r2(x2)}" stroke="${T.wire}" stroke-width="1.5" stroke-dasharray="${len}">${anim('stroke-dashoffset', [[w0, len], [w1, 0]], { D: T0, calc: 'linear' })}</path>` +
        `<path d="M${r2(x2 - 5)} ${cy - 4} L${r2(x2)} ${cy} L${r2(x2 - 5)} ${cy + 4}" fill="none" stroke="${T.wire}" stroke-width="1.5">${arrive(w1 - 0.05, T0, 0.1)}</path>`;
      for (let j = 0; j < 2; j++) body += `<rect x="-2" y="-2" width="4" height="4" fill="${lane.color}" opacity="0" transform="translate(${r2(x1)},${cy})">` +
        `<animateTransform attributeName="transform" type="translate" values="${r2(x1)},${cy};${r2(x2 - 6)},${cy}" dur="1.1s" begin="${r2(T0 + (k * n + i) * 0.2 + j * 0.55)}s" repeatCount="indefinite"/>` +
        `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.8;1" dur="1.1s" begin="${r2(T0 + (k * n + i) * 0.2 + j * 0.55)}s" repeatCount="indefinite"/></rect>`;
    });
  });

  // BOOM: a shockwave, a flash, confetti in the crew's colours, then the number floats up
  const confetti = [...names.map((x) => CREW[x].color), T.accent];
  function boom(k, t, o, seed) {
    const [cx, cy] = cen(k, n - 1), R = rng(seed), lin = { ...o, calc: 'linear' };
    let out = `<circle cx="${cx}" cy="${cy}" r="70" fill="none" stroke="${T.accent}" stroke-width="3" opacity="0">${anim('r', [[t, 8], [t + 0.7, 70]], o)}${anim('opacity', [[t - 0.02, 0], [t, 0.9], [t + 0.7, 0]], lin)}</circle>` +
      `<circle cx="${cx}" cy="${cy}" r="46" fill="${T.accent}" opacity="0">${anim('opacity', [[t - 0.02, 0], [t, 0.35], [t + 0.5, 0]], lin)}</circle>`;
    for (let i = 0; i < 24; i++) {
      const ang = ((-170 + R() * 160) * Math.PI) / 180, sp = 70 + R() * 95, vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp, dur = 1.3 + R() * 0.35;
      const path = [0, 0.25, 0.5, 0.75, 1].map((u) => { const s = u * dur; return [t + s, `${r2(vx * s)},${r2(vy * s + 85 * s * s)}`]; });
      out += `<g transform="translate(${cx},${cy})"><rect x="-2" y="-2" width="${R() < 0.5 ? 4 : 6}" height="${R() < 0.5 ? 4 : 3}" fill="${confetti[i % confetti.length]}" opacity="0">` +
        anim(null, path, { ...lin, type: 'translate' }) + anim('opacity', [[t - 0.02, 0], [t, 1], [t + dur * 0.7, 1], [t + dur, 0]], lin) + '</rect></g>';
    }
    out += `<g transform="translate(${cx},${cy - 34})"><g opacity="0">${anim(null, [[t, '0.2'], [t + 0.18, '1.25'], [t + 0.34, '1']], { ...o, type: 'scale' })}` +
      anim('opacity', [[t - 0.02, 0], [t + 0.04, 1], [t + 1.0, 1], [t + 1.3, 0]], lin) +
      `<text y="8" text-anchor="middle" font-family="${PIXEL}" font-weight="700" font-size="22" fill="${T.accent}" stroke="${T.frame}" stroke-width="5" stroke-linejoin="round" style="paint-order:stroke">BOOM!</text></g></g>` +
      `<text x="${cx}" y="${cy - 30}" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="13" fill="${T.accent}" stroke="${T.frame}" stroke-width="4" stroke-linejoin="round" style="paint-order:stroke" opacity="0">` +
      anim(null, [[t + 1.0, '0,0'], [t + 2.3, '0,-34']], { ...o, type: 'translate' }) + anim('opacity', [[t + 0.98, 0], [t + 1.1, 1], [t + 1.9, 1], [t + 2.3, 0]], lin) + `${esc(lanes[k].steps[n - 1])}!</text>`;
    return out;
  }
  const toast = (text, wins) => {
    const w = textWidth(text, 11) + 36, x = W / 2 - w / 2;
    return `<g opacity="0">${shown(wins, { L: LS }, 0.25)}<rect x="${r2(x)}" y="47" width="${r2(w)}" height="25" rx="12.5" fill="${T.ink}"/>` +
      `<circle cx="${r2(x + 15)}" cy="59.5" r="4" fill="${T.accent}"/><text x="${r2(x + 26)}" y="63.5" font-family="${MONO}" font-size="11" fill="${T.bg}">${esc(text)}</text></g>`;
  };
  lanes.forEach((lane, k) => {
    fx += boom(k, shipIntro(k), I, 21 + k) + boom(k, shipAct(k), { L: LS }, 41 + k) +
      toast(`shipped ${lane.site} · ${lane.steps[n - 1]}`, [[shipAct(k) + 0.2, shipAct(k) + 3.4]]);
  });

  /* ── activity: the scribe writes a log that scrolls like a live feed, every 12s ── */
  const Lg = F.log, lh = 19, rows = 5, rowY = Lg.y + 34, sstep = 1.5, tx = Lg.x + 85;
  const log = [
    ['ops', `pulled ${fmt(S.total)} contributions`],
    ['curator', 'sorted now.board by impact'],
    ['builder', `wired ${lanes.length} product flows, all green`],
    ['reviewer', 'approved hello.frame'],
    ['ops', `shipped ${lanes[0].site}`],
    ['curator', 'sorted now.board by recent'],
    ['planner', 'measured hello.frame'],
    ['reviewer', `pinned "${C.comments.board}" on now.board`],
  ].map(([who, t]) => [who, t.length > 37 ? t.slice(0, 36) + '…' : t]);
  const lineEnd = (k) => tx + textWidth(log[k][1], 11);
  let feed = '';
  for (let c = 0; c < log.length + rows - 1; c++) {
    const [who, t] = log[c % log.length], y = rowY + c * lh, full = r2(lineEnd(c % log.length) - Lg.x);
    // copies 0..3 are written during the intro; the rest are typed as they arrive at the bottom
    const enter = (c - rows + 1) * sstep;
    const reveal = c < rows - 1 ? '' : anim('width', [[0, 0], [enter + 0.05, 0], [enter + 0.55, full]], { L: L12, calc: 'linear' }) + (c === rows - 1 ? anim('width', [[0, 0]], I) : '');
    feed += `<clipPath id="row${c}"><rect x="${Lg.x}" y="${y - 12}" width="${full}" height="${lh}">${reveal}</rect></clipPath>` +
      `<g clip-path="url(#row${c})">${c < rows - 1 ? arrive([2.3, 4.1, 5.0, 5.8][c], T0, 0.25) : ''}<circle cx="${Lg.x + 18}" cy="${y - 4}" r="3.5" fill="${CREW[who].color}"/>` +
      `<text x="${Lg.x + 28}" y="${y}" font-family="${MONO}" font-weight="700" font-size="11" fill="${T.ink}">${esc(who)}</text>` +
      `<text x="${tx}" y="${y}" font-family="${MONO}" font-size="11" fill="${T.mute}">${esc(t)}</text></g>`;
  }
  const scroll = [];
  for (let k = 0; k < log.length; k++) scroll.push([k * sstep, `0,${-k * lh}`], [(k + 1) * sstep - 0.35, `0,${-k * lh}`]);
  scroll.push([log.length * sstep, `0,${-log.length * lh}`]);
  body += `<defs><clipPath id="feed"><rect x="${Lg.x + 1}" y="${rowY - 14}" width="${Lg.w - 2}" height="${rows * lh + 1}"/></clipPath>` +
    `<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.frame}"/><stop offset="1" stop-color="${T.frame}" stop-opacity="0"/></linearGradient></defs>` +
    `<g clip-path="url(#feed)"><g>${anim(null, scroll, { type: 'translate', L: L12 })}${feed}</g></g>` +
    `<rect x="${Lg.x + 1}" y="${rowY - 14}" width="${Lg.w - 2}" height="12" fill="url(#fade)" opacity="0">${arrive(F.log.at[1], T0)}</rect>` +
    `<g>${arrive(F.log.at[1], T0)}<rect x="${Lg.x + 12}" y="${Lg.y + 130}" width="${Lg.w - 24}" height="28" rx="7" fill="${T.bg}" stroke="${T.frameLine}"/>` +
    `<rect x="${Lg.x + 24}" y="${Lg.y + 138}" width="1.5" height="13" fill="${T.mute}"><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1.1s" repeatCount="indefinite"/></rect>` +
    `<text x="${Lg.x + 31}" y="${Lg.y + 148}" font-family="${MONO}" font-size="11" fill="${T.dim}">brief the crew…</text></g>` +
    `<g>${arrive(F.log.at[0], T0)}<circle cx="${live[0] - 8}" cy="${Lg.y - 11.5}" r="3.5" fill="${T.ok}"/>` +
    `<circle cx="${live[0] - 8}" cy="${Lg.y - 11.5}" r="3.5" fill="none" stroke="${T.ok}"><animate attributeName="r" values="3.5;8;3.5" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/></circle>` +
    `<text x="${Lg.x + Lg.w}" y="${Lg.y - 8}" text-anchor="end" font-family="${MONO}" font-size="10.5" fill="${T.mute}">live</text></g>`;

  /* ── comments and selections, over the work ── */
  const launchAt = (k) => at(k, n - 1), cheerPin = (k) => [launchAt(k)[0] + nw - 6, launchAt(k)[1] + 4];
  const helloPin = [tagEnd + 12, ny + 30], flowPin = cheerPin(1), boardPin = [B.x + B.w - 64, B.y + 20], stayPin = [nx + 200, Hf.y + Hf.h + 27];
  const sv = (who, wins, fade) => shown(tileWins(who, wins), { L: LS }, fade);
  over += pin('reviewer', ...helloPin, C.comments.hello, shown([[5.3, 6.5]], I) + sv('reviewer', [[8.3, 10.8]]), T) +
    pin('reviewer', ...flowPin, C.comments.flow, sv('reviewer', [[0.4, 2.8]]), T, true) +
    pin('reviewer', ...boardPin, C.comments.board, sv('reviewer', [[4.0, 6.4]]), T, true) +
    lanes.map((lane, k) => pin('reviewer', ...cheerPin(k), lane.cheer, shown([[shipAct(k) + 2.4, shipAct(k) + 5.5]], { L: LS }), T, true)).join('') +
    pin('reviewer', ...stayPin, C.comments.stayed, shown([[sb + 4.2, sb + 7.4]], { L: LS }), T);
  const sel = { x: nx - 8, y: r2(ny - size * 0.92), w: r2(nameW + 14), h: r2(size * 1.08) };
  over += marquee('planner', sel.x, sel.y, sel.w, sel.h, tileWins('planner', [[1.4, 2.0]]), LS) +
    selection('planner', sel.x, sel.y, sel.w, sel.h, `${Math.round(sel.w)} x ${Math.round(sel.h)}`, sv('planner', [[2.0, 5.2]], 0.05)) +
    marquee('planner', B.x + 6, B.y + 6, B.w - 12, B.h - 12, tileWins('planner', [[8.6, 9.2]]), LS) +
    selection('planner', B.x + 6, B.y + 6, B.w - 12, B.h - 12, `${C.board.length} notes`, sv('planner', [[9.2, 11.2]], 0.05)) +
    selection('builder', at(1, 1)[0] - 3, at(1, 1)[1] - 3, nw + 6, nh + 6, `${stages[1]} · ${lanes[1].site}`, sv('builder', [[1.3, 3.2]], 0.08)) +
    lanes.map((_, k) => selection('ops', launchAt(k)[0] - 3, launchAt(k)[1] - 3, nw + 6, nh + 6, '', sv('ops', [[[1.2, 3.4], [3.9, 5.4]][k]]))).join('');

  /* ── standup: the canvas dims and the whole crew circles up ── */
  const su = ACT.standup * CYC, mid = [440, 236];
  const cardW = Math.max(210, textWidth(C.standup[1], 11) + 36), cardX = mid[0] - cardW / 2, cardY = mid[1] - 36;
  const team = avatars(names, mid[0] + (14 + (names.length - 1) * 7 * 1.45) / 2, cardY + 54, 7, T.panel);
  fx += `<rect y="${BAR}" width="${W}" height="${H - BAR}" fill="${T.bg}" opacity="0">${anim('opacity', [[su + 0.8, 0], [su + 1.6, 0.66], [su + 9.0, 0.66], [su + 10.0, 0]], { L: LS, calc: 'linear' })}</rect>` +
    `<ellipse cx="${mid[0]}" cy="${mid[1]}" rx="180" ry="105" fill="none" stroke="${T.accent}" stroke-width="1.5" stroke-dasharray="3 7" opacity="0">${shown([[su + 1.5, su + 8.6]], { L: LS }, 0.4)}` +
    `<animate attributeName="stroke-dashoffset" values="0;-40" dur="2s" repeatCount="indefinite"/></ellipse>` +
    `<g opacity="0">${shown([[su + 1.8, su + 9.2]], { L: LS }, 0.3)}<rect x="${r2(cardX)}" y="${cardY}" width="${r2(cardW)}" height="72" rx="10" fill="${T.panel}" stroke="${T.frameLine}"/>` +
    `<text x="${mid[0]}" y="${cardY + 22}" text-anchor="middle" font-family="${PIXEL}" font-weight="700" font-size="13" fill="${T.ink}">${esc(C.standup[0])}</text>` +
    `<text x="${mid[0]}" y="${cardY + 40}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${T.mute}">${esc(C.standup[1])}</text>${team.svg}</g>` +
    toast(C.lap, [[ACT.lap * CYC + 1.4, ACT.lap * CYC + 9.4]]);

  /* ── the crew: routines, tiled through the story, and their set pieces ── */
  const rest = {
    planner: [494, 224], scribe: [Lg.x + 16, rowY + (rows - 1) * lh + 3], curator: [B.x + B.w - 46, B.y + B.h - 8],
    builder: [cen(0, 1)[0] + 30, Fl.y + 24 + laneH - 16], reviewer: [flowPin[0] + 12, flowPin[1] + 14], ops: [cen(0, n - 1)[0] + 10, cen(0, n - 1)[1] + 14],
  };
  const orbit = (j, who) => {
    const out = [[su, ...rest[who]]];
    for (let s = 1.6; s <= 8.01; s += 0.2) { const th = -Math.PI / 2 + (j / names.length) * 2 * Math.PI + ((s - 1.6) / 6.4) * 2 * Math.PI; out.push([su + s, mid[0] + 180 * Math.cos(th), mid[1] + 105 * Math.sin(th)]); }
    return [...out, [su + 10.4, ...rest[who]]];
  };
  const OFF = [[0, 0], [-34, -26], [-34, 26], [-68, -52], [-68, 52], [-102, 0]];
  const lap = (j, who) => {
    const b = ACT.lap * CYC, [ox, oy] = OFF[j % OFF.length], out = [[b, ...rest[who]], [b + 1.8, 40 + ox, 236 + oy]];
    for (let s = 2.0; s <= 7.01; s += 0.25) out.push([b + s, 40 + ((s - 2) / 5) * 1040 + ox, 236 + 44 * Math.sin((2 * Math.PI * (s - 2)) / 2.5) + oy]);
    return [...out, [b + 7.02, -180 + ox, 236 + oy], [b + 9.0, 440 + ox, 236 + oy], [b + 10.8, ...rest[who]]];
  };
  const story = (who, routine, ...acts) => {
    const j = names.indexOf(who);
    return byTime([...tile(who, [[0, ...rest[who]], ...routine, [CYC, ...rest[who]]]), ...orbit(j, who), ...lap(j, who), ...acts.flat()]);
  };

  planIntro.push([3.4, 470, 214]);
  crew += cursor('planner', planIntro, story('planner', [[1.4, sel.x, sel.y], [2.0, sel.x + sel.w, sel.y + sel.h], [2.5, sel.x + sel.w + 14, sel.y + sel.h + 8],
    [5.0, sel.x + sel.w + 18, sel.y + sel.h + 4], [6.4, ...rest.planner], [8.6, B.x + 6, B.y + 6], [9.2, B.x + B.w - 6, B.y + B.h - 6], [9.7, B.x + B.w - 24, B.y + B.h + 2], [11.2, B.x + B.w - 30, B.y + B.h]],
  [[sb, ...rest.planner], [sb + 2.0, 486, 150], [sb + 9.5, 488, 158], [sb + CYC, ...rest.planner]]), LS);

  const yb = rest.scribe[1], scribeRoutine = [];
  for (let k = 0; k < log.length; k++) {
    const e = lineEnd((k + rows - 1) % log.length);
    scribeRoutine.push([k * sstep + 0.05, Lg.x + 16, yb], [k * sstep + 0.55, e + 3, yb], [k * sstep + 0.95, e + 3, yb]);
  }
  crew += cursor('scribe', [home('scribe'), [ta - 0.05, nx + 4, ny + 4], ...typed.map(([t, w]) => [t, nx + w + 4, ny + 4]), [tb + 0.2, nx + nameW + 6, ny + 6],
    [na, nx, Hf.y + 110], [nb, nx + nowW + 4, Hf.y + 110], [4.6, nx + nowW + 20, Hf.y + 116], [6.75, ...rest.scribe]],
  story('scribe', scribeRoutine, [[sb, ...rest.scribe], [sb + 1.0, nx + nameW + 4, ny + 4], [del + (chars.length - 1) * ds, nx + 4, ny + 4], [say, nx + 4, ny + 4],
    [say + sur.length * dt, nx + surW + 4, ny + 4], [unsay, nx + surW + 6, ny + 6], [unsay + sur.length * ds, nx + 4, ny + 4], [back, nx + 4, ny + 4],
    [back + chars.length * dt, nx + nameW + 4, ny + 4], [sb + 11, nx + nameW + 20, ny + 10], [sb + CYC, ...rest.scribe]]), LS);

  crew += cursor('curator', [...curIntro, [4.5, ...rest.curator]], story('curator', [[0.85, ...sortTip], [1.3, sortTip[0] + 8, sortTip[1] + 12],
    [3.0, slot(1)[0] + 60, slot(1)[1] + 30], [5.2, slot(2)[0] + 90, slot(2)[1] + 26], [6.7, ...sortTip], [7.3, sortTip[0] + 8, sortTip[1] + 12], [9.4, slot(3)[0] + 40, slot(3)[1] + 30]]), LS);
  crew += clicks('curator', [], tile('curator', [[1.0, ...sortTip], [7.0, ...sortTip]]), LS);

  const cl = (k, i) => cen(k, i);
  crew += cursor('builder', [...buildIntro, [5.4, cl(1, n - 1)[0] + 10, cl(1, n - 1)[1] + 16]], story('builder', [[1.0, cl(1, 1)[0] + 10, cl(1, 1)[1] + 6], [3.2, cl(1, 1)[0] + 14, cl(1, 1)[1] + 10],
    [4.6, cl(0, 2)[0] - 10, cl(0, 2)[1] + 26], ...checks, [10.6, checks.at(-1)[1] + 10, checks.at(-1)[2] + 16]]), LS);
  crew += clicks('builder', buildClicks, tile('builder', checks), LS);

  const ship = (k) => { const b = ACT.launch[k] * CYC, [x, y] = cen(k, n - 1); return [[b, ...rest.ops], [b + 1.2, x, y], [b + 1.5, x, y], [b + 2.1, x + 16, y + 18], [b + 6.0, x + 30, y + 26], [b + CYC, ...rest.ops]]; };
  crew += cursor('ops', [home('ops'), [2.0, ...live], [2.5, live[0] + 10, live[1] + 14], [3.85, ...cen(0, n - 1)], [4.4, cen(0, n - 1)[0] + 14, cen(0, n - 1)[1] + 16],
    [5.15, ...cen(1, n - 1)], [5.8, cen(1, n - 1)[0] + 14, cen(1, n - 1)[1] + 16]],
  story('ops', [[0.9, ...cen(0, n - 1)], [1.4, ...rest.ops], [3.6, ...cen(1, n - 1)], [4.1, cen(1, n - 1)[0] + 10, cen(1, n - 1)[1] + 14], [5.8, ...live], [6.2, ...live],
    [6.6, live[0] + 10, live[1] + 16], [9.0, Fl.x + Fl.w - 60, Fl.y + 20]], ...lanes.map((_, k) => ship(k))), LS);
  crew += clicks('ops', [[2.15, ...live], [shipIntro(0), ...cen(0, n - 1)], [shipIntro(1), ...cen(1, n - 1)]],
    byTime([...tile('ops', [[6.0, ...live]]), ...lanes.map((_, k) => [shipAct(k), ...cen(k, n - 1)])]), LS);

  const cheer = (k) => { const b = ACT.launch[k] * CYC, p = cheerPin(k); return [[b, ...flowPin], [b + 3.6, ...p], [b + 4.1, p[0] + 12, p[1] + 14], [b + 7.5, p[0] + 18, p[1] + 20], [b + CYC, ...flowPin]]; };
  rest.reviewer = flowPin;
  crew += cursor('reviewer', [home('reviewer'), [5.0, ...helloPin], [5.6, helloPin[0] + 14, helloPin[1] + 12]],
    story('reviewer', [[0.8, flowPin[0] + 12, flowPin[1] + 14], [2.9, flowPin[0] + 16, flowPin[1] + 8], [3.8, ...boardPin], [4.4, boardPin[0] + 10, boardPin[1] + 14],
      [7.9, ...helloPin], [8.6, helloPin[0] + 14, helloPin[1] + 12], [10.9, helloPin[0] + 20, helloPin[1] + 16]],
    ...lanes.map((_, k) => cheer(k)), [[sb, ...flowPin], [sb + 3.9, ...stayPin], [sb + 4.4, stayPin[0] - 30, stayPin[1] + 10], [sb + 7.6, stayPin[0] - 24, stayPin[1] + 14], [sb + CYC, ...flowPin]]), LS);
  crew += clicks('reviewer', [[5.15, ...helloPin]], byTime([...tile('reviewer', [[0.25, ...flowPin], [3.85, ...boardPin], [8.15, ...helloPin]]),
    ...lanes.map((_, k) => [ACT.launch[k] * CYC + 3.75, ...cheerPin(k)]), [sb + 4.0, ...stayPin]]), LS);

  /* ── status line ── */
  const place = P.place.name.toLowerCase();
  const status = `<text x="28" y="${H - 14}" font-family="${MONO}" font-size="11" fill="${T.mute}">${esc(`${LOCAL[phase]} in ${place}`)} <tspan fill="${T.dim}">·</tspan> ${esc(C.shifts[phase])}</text>` +
    `<text x="${W - 28}" y="${H - 14}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${T.dim}">rebuilt by ${names.length} agents on every load</text>`;

  const all = `<defs><clipPath id="round"><rect width="${W}" height="${H}" rx="14"/></clipPath>` +
    `<pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${T.dot}"/></pattern>${crewDefs()}</defs>` +
    `<g clip-path="url(#round)"><rect width="${W}" height="${H}" fill="${T.bg}"/><rect y="${BAR}" width="${W}" height="${H - BAR}" fill="url(#dots)"/>` +
    bar + body + over + fx + status + crew + '</g>' +
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${T.edge}"/>`;
  return svg({
    w: W, h: H, fonts: ['Silkscreen', 'JetBrains Mono'],
    title: `${P.name}, built by agents`,
    desc: `A shared canvas, like a multiplayer design tool, with ${names.length} AI agents shown as named cursors building ${P.name}'s profile: ` +
      names.map((x) => `${x} ${CREW[x].job}`).join(', ') + `. The name, ${P.signature}, is typed out with the tagline "${P.tagline}" and "now: ${C.now}". ` +
      `Sticky notes get sorted: ${C.board.map((x) => `${x.title} (${x.sub})`).join(', ')}. A product flow shows how each product was built, ${stages.join(', ')}: ` +
      lanes.map((l) => `${l.site} (${l.steps.join(', ')})`).join(' and ') + `; each launch goes boom, with confetti, and its user count runs up. ` +
      `Over about a minute and a half the crew also holds a standup in a circle, types "${C.surprise}" for anyone still reading, and flies a victory lap. ` +
      `An activity feed scrolls as they work. ${LOCAL[phase]} in ${place}: ${C.shifts[phase]}.`,
    body: all,
  });
}
