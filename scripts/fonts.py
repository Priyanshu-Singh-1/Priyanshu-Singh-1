#!/usr/bin/env python3
"""
Builds data/fonts.json once, locally: the two faces the plates embed, as
base64 woff2 subsets. GitHub serves README images through a proxy that won't
fetch webfonts from inside an SVG, so the only way a face shows up is inlined.

  JetBrains Mono 400/700   the kcat log, stats, captions
  Silkscreen     400/700   pixel display face, matches the scene's 5px grid

Both are OFL-licensed and pulled from their upstream GitHub repos.
Run:  pip install fonttools brotli && python3 scripts/fonts.py
The output is committed, so the scheduled workflow never needs Python.
"""
import base64, io, json, pathlib, urllib.request
from fontTools import subset

SRC = {
    "JetBrains Mono": {
        "400": "https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf",
        "700": "https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Bold.ttf",
    },
    "Silkscreen": {
        "400": "https://raw.githubusercontent.com/google/fonts/main/ofl/silkscreen/Silkscreen-Regular.ttf",
        "700": "https://raw.githubusercontent.com/google/fonts/main/ofl/silkscreen/Silkscreen-Bold.ttf",
    },
}
# Printable ASCII plus the handful of symbols the plates actually print.
UNICODES = "U+0020-007E,U+00B0,U+00B7,U+2014,U+2019,U+2026,U+2192,U+2605,U+25B8"

root = pathlib.Path(__file__).resolve().parent.parent
out = {}
for family, weights in SRC.items():
    out[family] = {}
    for w, url in weights.items():
        raw = urllib.request.urlopen(url).read()
        opts = subset.Options(flavor="woff2", layout_features=["kern"], hinting=False, desubroutinize=True, name_IDs=[1, 2], notdef_outline=True)
        font = subset.load_font(io.BytesIO(raw), opts)
        s = subset.Subsetter(opts)
        s.populate(unicodes=subset.parse_unicodes(UNICODES))
        s.subset(font)
        buf = io.BytesIO(); font.save(buf)
        out[family][w] = base64.b64encode(buf.getvalue()).decode()
        print(f"  {family} {w}: {len(raw):>7} -> {len(buf.getvalue()):>6} bytes")

(root / "data" / "fonts.json").write_text(json.dumps(out) + "\n")
print("wrote data/fonts.json")
