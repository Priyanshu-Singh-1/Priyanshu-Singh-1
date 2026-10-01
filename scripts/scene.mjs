/**
 * scene.mjs: the hero plate. Picks a scene, frames it, signs it.
 *
 * data/profile.json "scene" chooses which one:
 *   any key of SCENES below, to pin it
 *   "rotate"  a different one each day, the same all day (IST), cycling
 *             through profile.json "rotation" (or DEFAULT_ROTATION)
 *
 * Every scene is a function of the lighting phase (dawn, day, dusk, night)
 * returning its layers, its ink colours and a description. This file adds the
 * clip, the signature, the caption and the border, so scenes stay pure art.
 */
import { P, THEME, PIXEL, MONO, esc, svg, SW, SH } from './lib.mjs';
import { LOCAL } from './lib.mjs';
import { countryside } from './scenes/countryside.mjs';
import { windowSeat } from './scenes/window-seat.mjs';
import { chitrakote } from './scenes/chitrakote.mjs';
import { monsoon } from './scenes/monsoon.mjs';
import { festival } from './scenes/festival.mjs';
import { koi } from './scenes/koi.mjs';
import { tinyPlanet } from './scenes/tiny-planet.mjs';
import { skyIslands } from './scenes/sky-islands.mjs';
import { reef } from './scenes/reef.mjs';
import { aurora } from './scenes/aurora.mjs';
import { lighthouse } from './scenes/lighthouse.mjs';
import { balloons } from './scenes/balloons.mjs';

export const SCENES = {
  countryside,
  'window-seat': windowSeat,
  chitrakote,
  monsoon,
  festival,
  koi,
  'tiny-planet': tinyPlanet,
  'sky-islands': skyIslands,
  reef,
  aurora,
  lighthouse,
  balloons,
};

/** What "rotate" cycles through when profile.json doesn't list its own. */
export const DEFAULT_ROTATION = ['tiny-planet', 'sky-islands', 'reef', 'aurora', 'lighthouse', 'balloons'];

export function pickScene(now) {
  const want = process.env.SCENE || P.scene || 'rotate';
  if (want !== 'rotate') {
    if (!SCENES[want]) throw new Error(`unknown scene "${want}": pick one of ${Object.keys(SCENES).join(', ')} or rotate`);
    return want;
  }
  const names = (P.rotation || DEFAULT_ROTATION).filter((n) => SCENES[n]);
  return names[now.doy % names.length];
}

export function scene(name, themeName, phase, now) {
  const T = THEME[themeName];
  const s = SCENES[name](phase);
  const hh = String(now.h).padStart(2, '0'), mm = String(now.m).padStart(2, '0');
  const place = P.place.name.toLowerCase();
  const where = s.coords === false ? place : `${place}, ${P.place.lat.toFixed(2)}°N ${P.place.lon.toFixed(2)}°E`;
  // Scenes set somewhere else entirely just say what the light is doing here.
  const line = s.local === false ? `${phase} where I am, ${hh}:${mm} ${P.place.tzLabel}` : `${LOCAL[phase]} in ${where}, ${hh}:${mm} ${P.place.tzLabel}`;
  const shadow = s.shadow ? ` style="paint-order:stroke" stroke="${s.shadow}" stroke-width="3" stroke-linejoin="round"` : '';
  const ts = s.titleShadow ? ` style="paint-order:stroke" stroke="${s.titleShadow}" stroke-width="4" stroke-linejoin="round"` : '';
  const text = `
<text x="26" y="58" font-family="${PIXEL}" font-weight="700" font-size="34" fill="${s.ink}" letter-spacing="1"${ts}>${esc(P.signature)}</text>
<text x="28" y="84" font-family="${MONO}" font-size="13" fill="${s.sub}"${ts}>${esc(P.tagline)}</text>
<text x="${SW - 16}" y="${SH - 12}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${s.caption}" opacity="0.9"${shadow}>${esc(line)}</text>`;
  const body = `
<defs><clipPath id="frame"><rect width="${SW}" height="${SH}" rx="14"/></clipPath>${s.defs || ''}</defs>
<g clip-path="url(#frame)" shape-rendering="crispEdges">${s.body}</g>
${text}
<rect x="0.5" y="0.5" width="${SW - 1}" height="${SH - 1}" rx="14" fill="none" stroke="${T.line}"/>`;
  return svg({
    w: SW, h: SH, fonts: ['Silkscreen', 'JetBrains Mono'],
    title: `${P.name}, ${P.place.name}`,
    desc: `${s.desc} Lit for ${phase}, ${hh}:${mm} ${P.place.tzLabel}. Signed ${P.signature}, ${P.tagline}.`,
    body,
  });
}
