/**
 * draw.mjs: renders every plate into dist/.
 *
 *   scene     the hero: a pixel scene, relit for the hour in IST
 *   work, projects, toolkit, heat
 *             quiet cards in the scene's language, light and dark (cards.mjs)
 *
 * Pure: reads data/*.json and never the network, so a redraw always succeeds.
 *
 * GitHub rules every plate is written against:
 *   - README images are <img>, so no <script>. Motion is SMIL, which GitHub
 *     does run inside <img>-embedded SVG.
 *   - Animated elements carry their FINISHED state as attributes and animate
 *     in from hidden, so a renderer without SMIL still shows a whole plate.
 *   - Webfonts can't be fetched through GitHub's image proxy, so the faces are
 *     inlined as base64 woff2 (scripts/fonts.py), brand marks as raw paths
 *     (scripts/icons.mjs).
 *   - CSS lives in CDATA, because SVG is XML and a stray '<' kills the file.
 *
 * Usage:
 *   node scripts/draw.mjs                  lighting from the clock
 *   PHASE=night node scripts/draw.mjs      force dawn | day | dusk | night
 *   SCENE=koi node scripts/draw.mjs        force a scene
 *   node scripts/draw.mjs --gallery        every scene x every phase, into dist/gallery/
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { P, S, localNow, phaseFor } from './lib.mjs';
import { scene, pickScene, SCENES } from './scene.mjs';
import { setTheme, work, projects, toolkit, heat } from './cards.mjs';

const OUT = new URL('../dist/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const now = localNow();
const pad = (n) => String(n).padStart(2, '0');

if (process.argv.includes('--gallery')) {
  const dir = new URL('gallery/', OUT);
  mkdirSync(dir, { recursive: true });
  for (const name of Object.keys(SCENES)) for (const ph of ['dawn', 'day', 'dusk', 'night'])
    writeFileSync(new URL(`${name}-${ph}.svg`, dir), scene(name, 'dark', ph, now));
  console.log(`gallery: ${Object.keys(SCENES).length} scenes x 4 phases in dist/gallery/`);
  process.exit(0);
}

const phase = process.env.PHASE || phaseFor(now);
const name = pickScene(now);
// The scene carries its own sky, so it's one file. The cards are transparent
// and quiet, so they come in a light and a dark version for GitHub's themes.
writeFileSync(new URL('scene.svg', OUT), scene(name, 'dark', phase, now));
const cards = { work, projects, toolkit, heat };
for (const t of ['dark', 'light']) {
  setTheme(t);
  for (const [k, fn] of Object.entries(cards)) writeFileSync(new URL(`${k}-${t}.svg`, OUT), fn());
}
const plates = { scene: 1, ...cards };
writeFileSync(new URL('stats.json', OUT), JSON.stringify(S) + '\n');   // rides along as the next run's cache
console.log(`drew ${Object.keys(plates).length} plates: ${name} at ${phase}, ${pad(now.h)}:${pad(now.m)} ${P.place.tzLabel}`);
