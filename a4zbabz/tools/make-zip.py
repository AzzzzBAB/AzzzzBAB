#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把可部署的文件打包成 dist/a4zbabz-site.zip（用于上传宝塔）。"""
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "dist", "a4zbabz-site.zip")
FILES = [
    "index.html", "works.html", "notes.html", "note.html",
    "about.html", "404.html", "robots.txt",
]

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for f in FILES:
        z.write(os.path.join(ROOT, f), f)
    for base, _dirs, files in os.walk(os.path.join(ROOT, "assets")):
        for fn in files:
            p = os.path.join(base, fn)
            z.write(p, os.path.relpath(p, ROOT).replace(os.sep, "/"))

print("built:", OUT)
with zipfile.ZipFile(OUT) as z:
    for n in z.namelist():
        print("  ", n)
