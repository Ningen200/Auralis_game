#!/usr/bin/env python3
"""Create a lightweight SVG sky gradient for Auralis; uses only Python stdlib."""
from pathlib import Path
import math

OUT = Path("public/generated/auralis_sky.svg")
OUT.parent.mkdir(parents=True, exist_ok=True)
stars = []
for i in range(85):
    x = (i * 1973 % 1600) + 1
    y = (i * 619 % 700) + 1
    r = 0.7 + (i % 4) * 0.35
    opacity = 0.25 + (i % 6) * 0.1
    stars.append(f'<circle cx="{x}" cy="{y}" r="{r:.1f}" fill="#d9f6ff" opacity="{opacity:.2f}"/>')
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
<defs>
 <linearGradient id="sky" x2="0" y2="1"><stop stop-color="#101b3b"/><stop offset=".48" stop-color="#536b9a"/><stop offset=".78" stop-color="#f1a77d"/><stop offset="1" stop-color="#f8d5a4"/></linearGradient>
 <radialGradient id="sun"><stop stop-color="#fff8d8"/><stop offset=".3" stop-color="#ffd99b" stop-opacity=".8"/><stop offset="1" stop-color="#ffb77c" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1600" height="900" fill="url(#sky)"/>
<circle cx="1080" cy="560" r="330" fill="url(#sun)"/>
{''.join(stars)}
<path d="M0 760 Q260 620 480 760 T900 740 T1600 700 V900 H0Z" fill="#152b49" opacity=".7"/>
</svg>'''
OUT.write_text(svg, encoding="utf-8")
print(f"Generated {OUT}")
