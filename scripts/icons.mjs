/**
 * Builds data/icons.json once, locally: the brand marks the toolkit card
 * draws, as raw 24x24 SVG paths from simple-icons (CC0).
 *
 *   npm i --no-save simple-icons && node scripts/icons.mjs
 *
 * The output is committed, so the scheduled workflow installs nothing.
 * A slug simple-icons doesn't carry (AWS, OpenAI) gets a lettered tile instead.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const si = require('simple-icons');
const P = JSON.parse(readFileSync(new URL('../data/profile.json', import.meta.url), 'utf8'));
const out = {};
for (const g of P.toolkit) for (const [label, slug] of g.items) {
  if (!slug) continue;
  const icon = si['si' + slug[0].toUpperCase() + slug.slice(1)];
  if (icon) out[slug] = { path: icon.path, hex: icon.hex };
  else console.warn(`  no simple-icon for ${slug} (${label}): it will get a lettered tile`);
}
writeFileSync(new URL('../data/icons.json', import.meta.url), JSON.stringify(out) + '\n');
console.log(`wrote data/icons.json: ${Object.keys(out).length} icons`);
