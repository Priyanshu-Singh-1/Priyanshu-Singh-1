# How the plates work

Five animated SVGs on the profile are drawn by code and redrawn by a
scheduled GitHub Action. Nothing here is a screenshot or a hosted widget.

The theme is a crew of AI agents at work on the profile, drawn as
multiplayer cursors with name tags, like collaborators on a shared design
file. On every page load they build each plate, then keep tending it:
dragging, sorting, selecting, typing, reviewing.

The hero is the one loud thing: the whole profile as a canvas with its own
toolbar. The cards under it are quiet, transparent over a faint dot grid
with a hairline border, and each has one or two of the crew still at work
on it, shown at the top right like people in a shared file. Every plate
comes as `-light` and `-dark` files so text reads on either GitHub theme.

| Plate | What it shows | Changes when |
| :-- | :-- | :-- |
| `hero` | The profile as a canvas the whole crew builds: frames, name, sticky notes, how each product got built (with a BOOM when it ships), an activity feed; then a 96s story | Four times a day (the feed's numbers and the time-of-day status line) |
| `work` | Builder drags out a career line at Xeno that grows every month; scribe types the highlights | Monthly, or when you edit it |
| `projects` | Curator drags the things shipped in and keeps re-ranking them; reviewer leaves comments | You edit `data/profile.json` |
| `toolkit` | Planner lays out the stack as chips with real brand marks; daily drivers in gold | You edit `data/profile.json` |
| `heat` | Ops sweeps the last year and it lights up as a field of stars, plus this year, all-time, streaks and the last push | Every run |

## The crew

`"crew"` in `data/profile.json` names the agents, their colours and what they
do; `"canvas"` holds every word the hero prints (the sticky notes, the
pipeline, the comments, the status line for each time of day).
`scripts/agents.mjs` draws them: a cursor, click ripples, comment pins,
selections and marquees. Each moves in two SMIL stages: an intro that plays
once from load and holds (the plate being built), then a loop that repeats
from where the intro ends (the plate being tended).

On the hero that loop is a story of eight 12s cycles, about a minute and a
half, so someone who stays keeps finding something new. Each agent repeats
a 12s routine except in the cycles `ACT` and `BUSY` in `hero.mjs` give it a
set piece: a launch for each product (BOOM, confetti, the user count running
up, a toast), a standup where the crew circles up, the scribe typing
`"surprise"` for anyone still reading, and a victory lap in V formation. `anim()` refuses to
write a keyframe that goes back in time, because browsers silently drop the
whole animation when one does.

## The scenes

The pixel scenes from before the crew are still here. Set `"hero": "scene"`
in `data/profile.json` and the hero becomes a scene again, lit for dawn, day,
dusk or night in IST. `"scene"` pins one by name. Set to `"rotate"`, it
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
  redraw can't fail on a flaky API. `hero.mjs` draws the canvas, `cards.mjs`
  the cards and `agents.mjs` the crew on both; `scene.mjs` frames a pixel
  scene when that's the hero. `lib.mjs` holds what they share, including
  glyph widths for the embedded fonts so carets and selections land on
  real letter edges.
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
node scripts/draw.mjs           # status line from the current IST hour
PHASE=dusk node scripts/draw.mjs  # or force dawn | day | dusk | night
SCENE=koi node scripts/draw.mjs   # with "hero": "scene", force a scene
node scripts/draw.mjs --gallery   # every scene x every light
open dist/hero-dark.svg
```

## Rules the SVGs follow

GitHub shows README images through `<img>`, which strips scripts but runs
SMIL animation. Every animated element carries its finished state as its
attribute and animates in from the hidden state, so a renderer without SMIL
still shows a complete plate. Fonts are inlined as base64 woff2 because the
image proxy won't fetch them, and CSS sits in CDATA because SVG is XML.
