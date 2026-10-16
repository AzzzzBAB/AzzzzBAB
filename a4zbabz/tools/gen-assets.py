#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为演示数据生成占位图标与二维码图（SVG）。
- 图标：assets/img/icon-<id>.svg   （彩色圆角方块 + 名称首字）
- 二维码：assets/img/qr-<id>.svg   （占位图案，非真实二维码）

真实上线时，把 icon-<id>.svg / qr-<id>.svg 换成你自己的图片即可（文件名保持一致）。
"""
import hashlib
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")

# 与站点配色一致的图标底色（会按 id 取模选一个）
COLORS = ["#1f5bd8", "#2e9e63", "#e4572e", "#8a5bd8", "#c8912b", "#1f8fd8"]

# 从 data.js 里粗取 works 的 id 与 name（避免引入 JS 解析器）
DATA = os.path.join(ROOT, "assets", "js", "data.js")
text = open(DATA, encoding="utf-8").read()
items = re.findall(r'id:\s*"([^"]+)",\s*\n\s*name:\s*"([^"]+)"', text)


def color_for(s):
    h = int(hashlib.md5(s.encode("utf-8")).hexdigest(), 16)
    return COLORS[h % len(COLORS)]


def icon_svg(ch, color):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img">
  <rect width="96" height="96" rx="20" fill="{color}"/>
  <text x="48" y="49" text-anchor="middle" dominant-baseline="central"
        font-family="PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif"
        font-size="46" font-weight="600" fill="#ffffff">{ch}</text>
</svg>
'''


def qr_svg(seed, modules=21, px=6):
    """生成一个确定性的『像二维码』的占位图案。"""
    h = hashlib.sha256(seed.encode("utf-8")).digest()
    bits = []
    for b in h:
        for i in range(8):
            bits.append((b >> i) & 1)
    # 用简单的 xorshift 扩展成足够多的比特
    state = int.from_bytes(h, "little") | 1
    need = modules * modules
    while len(bits) < need:
        state ^= (state << 13) & ((1 << 64) - 1)
        state ^= state >> 7
        state ^= (state << 17) & ((1 << 64) - 1)
        bits.append(state & 1)

    def finder(ox, oy):
        r = []
        for y in range(7):
            for x in range(7):
                on = x in (0, 6) or y in (0, 6) or (2 <= x <= 4 and 2 <= y <= 4)
                r.append((ox + x, oy + y, on))
        return r

    # 保护区（finder 及其周围 1 格留白）
    reserved = set()
    for ox, oy in [(0, 0), (modules - 7, 0), (0, modules - 7)]:
        for x in range(-1, 8):
            for y in range(-1, 8):
                reserved.add((ox + x, oy + y))

    rects = []
    n = 0
    for y in range(modules):
        for x in range(modules):
            if (x, y) in reserved:
                continue
            on = bits[n % len(bits)] if n < len(bits) else 0
            n += 1
            if on:
                rects.append((x, y))
    for (x, y, on) in finder(0, 0) + finder(modules - 7, 0) + finder(0, modules - 7):
        if on and 0 <= x < modules and 0 <= y < modules:
            rects.append((x, y))

    body = "".join(
        f'<rect x="{x}" y="{y}" width="1" height="1"/>' for (x, y) in rects
    )
    size = modules * px
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {modules} {modules}" '
        f'width="{size}" height="{size}" shape-rendering="crispEdges" role="img" '
        f'aria-label="二维码占位图">\n'
        f'  <rect width="{modules}" height="{modules}" fill="#ffffff"/>\n'
        f'  <g fill="#171a19">{body}</g>\n</svg>\n'
    )


def main():
    os.makedirs(IMG, exist_ok=True)
    for wid, name in items:
        ch = name[0]
        with open(os.path.join(IMG, f"icon-{wid}.svg"), "w", encoding="utf-8") as f:
            f.write(icon_svg(ch, color_for(wid)))
        with open(os.path.join(IMG, f"qr-{wid}.svg"), "w", encoding="utf-8") as f:
            f.write(qr_svg(wid))
        print("generated", wid, name)
    print(f"共 {len(items)} 项 -> {IMG}")


if __name__ == "__main__":
    main()
