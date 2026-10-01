# How the plates work

Five animated SVGs on the profile are drawn by code and redrawn by a
scheduled GitHub Action. Nothing here is a screenshot or a hosted widget.

The scene is the one loud thing: it carries its own sky. The cards under it
are deliberately quiet, transparent with a hairline border, and tie back to
it in the details: a pixel planet by each title, a few faint stars, the
pixel display face, and data drawn as starlight with gold for the most.
They come as `-light` and `-dark` files so text reads on either GitHub theme.

| Plate | What it shows | Changes when |
| :-- | :-- | :-- |
| `scene` | The tiny planet, lit for dawn, day, dusk or night in IST | Four times a day |
| `work` | A career line at Xeno that grows every month, highlights, and the rest | Monthly, or when you edit it |
| `projects` | Things shipped, each with its own small world | You edit `data/profile.json` |
| `toolkit` | The stack as chips with real brand marks; daily drivers in gold | You edit `data/profile.json` |
| `heat` | The last year as a field of stars, plus this year, all-time, streaks and the last push | Every run |

## The scenes

This profile pins `tiny-planet`. `"scene"` in `data/profile.json` pins one by name. Set to `"rotate"`, it
shows a different scene each day (the same all day, by IST date), cycling
through the `"rotation"` list. Twelve are built in.

In the rotation by default:

| Name | What's in it | After dark |
| :-- | :-- | :-- |
| `tiny-planet` | A kid walking on a tiny planet as it turns beneath them: cottage, windmill, trees, a well come round; a ringed giant, drifting rocks, a comet | Lamp post lit, a sky full of stars |
| `sky-islands` | Floating islands over a sea of cloud, a waterfall pouring off one, a rope bridge, a windmill, a whale swimming through the sky | Glowing crystals, lanterns on the bridge, the whale's spots shine |
| `reef` | Light rays, kelp, corals, clownfish in an anemone, a school of fish, a sea turtle, jellyfish, a crab, bubbles | Bioluminescence |
| `aurora` | A log cabin in snowy pines, a kid sledding, a skater on the lake, a snowman, snow falling; peaks blush at dusk | The aurora |
| `lighthouse` | A striped lighthouse on a headland, the sea rolling in, a sailboat, gulls, a whale blowing far out | The beam sweeps the water |
| `balloons` | Hot air balloons rising over a patchwork valley, burners flickering | A tethered night glow |

Also built in, set closer to home: `countryside`, `window-seat`,
`chitrakote`, `monsoon`, `festival`, `koi`. Add any of them to `"rotation"`.

Preview everything: `node scripts/draw.mjs --gallery` writes every scene in
every light to `dist/gallery/`. Each scene lives in `scripts/scenes/` and is
a pure function of the lighting phase, so adding one is a file plus a line in
`scripts/scene.mjs`.

## Pieces

- `data/profile.json` holds every word the plates print: your roles and
  dates, projects, contests, the toolkit (the third value `true` marks a daily
  driver), the place and its coordinates. Edit this, not the renderer. A
  role with `null` as its end date is current and keeps growing.
- `scripts/fetch.mjs` is the only file that touches the network. It asks
  GitHub's GraphQL API first and falls back to the public contributions page,
  so it runs locally with no token. If both fail it keeps the last numbers.
- `scripts/draw.mjs` is pure. It reads `data/*.json` and writes `dist/`, so a
  redraw can't fail on a flaky API. `scene.mjs` frames the hero and
  `cards.mjs` draws the cards; `lib.mjs` holds what they share.
- `scripts/fonts.py` subsets JetBrains Mono and Silkscreen into
  `data/fonts.json`. Run it once; the result is committed.
- `scripts/icons.mjs` copies brand marks from simple-icons into
  `data/icons.json`. Rerun it (`npm i --no-save simple-icons && node
  scripts/icons.mjs`) after adding a tool to the toolkit.
- `.github/workflows/relight.yml` fetches, draws and force-pushes `dist/` to
  the `output` branch as a single commit. The README reads images from that
  branch, so `main` never fills up with bot commits.

## Run it locally

```sh
node scripts/fetch.mjs          # no token needed
node scripts/draw.mjs           # lighting from the current IST hour
PHASE=dusk node scripts/draw.mjs  # or force dawn | day | dusk | night
SCENE=koi node scripts/draw.mjs   # or force a scene
node scripts/draw.mjs --gallery   # every scene x every light
open dist/scene.svg
```

## Rules the SVGs follow

GitHub shows README images through `<img>`, which strips scripts but runs
SMIL animation. Every animated element carries its finished state as its
attribute and animates in from the hidden state, so a renderer without SMIL
still shows a complete plate. Fonts are inlined as base64 woff2 because the
image proxy won't fetch them, and CSS sits in CDATA because SVG is XML.
