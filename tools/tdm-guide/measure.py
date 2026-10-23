#!/usr/bin/env python3
"""Prints lines and visible-text words per authoring unit: python3 tools/tdm-guide/measure.py [NN ...]"""
import re, glob, os, sys
only = set(sys.argv[1:])
def words(h):
    h = re.sub(r"<(script|style)[\s\S]*?</\1>", " ", h); h = re.sub(r"<[^>]+>", " ", h); return len(h.split())
here = os.path.dirname(os.path.abspath(__file__)); tl = tw = 0
for d in sorted(glob.glob(os.path.join(here, "chapters", "*", ""))):
    n = os.path.basename(d[:-1])[:2]
    if only and n not in only: continue
    t = "".join(open(f, encoding="utf8").read() for f in sorted(glob.glob(d + "*.html")))
    l, w = t.count("\n"), words(t); tl += l; tw += w
    print(f"{os.path.basename(d[:-1]):58} {l:6} lines {w:7} words")
print(f"{'TOTAL':58} {tl:6} lines {tw:7} words")
