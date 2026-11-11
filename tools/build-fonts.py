#!/usr/bin/env python3
"""把 fonts-src/ 里的完整字体切成三档 WOFF2，输出到主题的 source/fonts/。

用法：
  python3 -m venv /tmp/ftvenv && /tmp/ftvenv/bin/pip install fonttools brotli
  /tmp/ftvenv/bin/python tools/build-fonts.py          # 全部重建并生成 fonts.css
  /tmp/ftvenv/bin/python tools/build-fonts.py GenRyu    # 只重建名称含 GenRyu 的字体
  /tmp/ftvenv/bin/python tools/build-fonts.py --css     # 只重新生成 fonts.css

每个字体生成：
  <名称>-core.woff2    一级常用字 + 标点 + 拉丁字母（几乎所有页面只需要这一档）
  <名称>-site.woff2    站内文章与模板实际用到、但不在 core 里的字（通常只有几十个字，几十 KB）
  <名称>-uXXXX.woff2   其余字形按码位每 4096 个分一块（U+4000–4FFF 为 u4000，依此类推），兜底用
fonts.css 用 unicode-range 声明各档；新增文章含有新的生僻字后，运行
  /tmp/ftvenv/bin/python tools/build-fonts.py --site
即可只重建 site 档并刷新 fonts.css。
"""
import sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "fonts-src"
OUT = ROOT / "themes/iris-paper/source/fonts"

FONTS = [
    "ChillJinshuSongPro_Regular.woff",
    "ChillJinshuSongPro_Soft.otf",
    "GenRyuMin2TW-M.otf",
    "GenRyuMin2TW-B.otf",
    "GenRyuMin2TW-H.otf",
]


def decode_range(codec, lead, trail):
    chars = set()
    for hi in range(*lead):
        for lo in range(*trail):
            try:
                chars.add(ord(bytes([hi, lo]).decode(codec)))
            except (UnicodeDecodeError, TypeError):
                pass
    return chars


# GB2312：一级字 B0A1–D7F9，二级字 D8A1–F7FE。
gb_level1 = decode_range("gb2312", (0xB0, 0xD8), (0xA1, 0xFF))
gb_level2 = decode_range("gb2312", (0xD8, 0xF8), (0xA1, 0xFF))
# Big5：常用字 A440–C67E，次常用字 C940–F9D5。
big5 = decode_range("big5", (0xA4, 0xFA), (0x40, 0xFF))

symbols = set(range(0x20, 0x7F))                    # 基本拉丁
symbols |= set(range(0xA0, 0x100))                  # 拉丁补充
symbols |= set(range(0x2000, 0x2070))               # 通用标点
symbols |= set(range(0x3000, 0x3040))               # CJK 标点
symbols |= set(range(0xFF00, 0xFFF0))               # 全角形式
symbols |= set(range(0x3040, 0x3100))               # 假名
symbols |= set(range(0x2100, 0x2200))               # 字母式符号、数字形式
symbols |= set(range(0x2460, 0x2500))               # 带圈数字等

core_want = gb_level1 | symbols
BLOCK = 0x1000


def merge(chars, gap):
    """把码点合并成区间；允许区间内有不超过 gap 的空洞，换取更短的 unicode-range。"""
    out = []
    for c in sorted(chars):
        if out and c - out[-1][1] - 1 <= gap:
            out[-1][1] = c
        else:
            out.append([c, c])
    return out


core_ranges = merge(core_want, 3)
core_set = {c for a, b in core_ranges for c in range(a, b + 1)}


def css_range(ranges):
    return ",".join(f"U+{a:X}" if a == b else f"U+{a:X}-{b:X}" for a, b in ranges)


def write(font_path, unicodes, target):
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    options.glyph_names = False
    options.hinting = False
    font = subset.load_font(str(font_path), options)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    subset.save_font(font, str(target), options)
    font.close()


FACES = [
    # (family, weight, 文件名前缀)
    ("ChillJinshuSongPro", "400", "ChillJinshuSongPro_Regular"),
    ("ChillJinshuSongPro", "700", "ChillJinshuSongPro_Soft"),
    ("GenRyuMin2TW", "500", "GenRyuMin2TW-M"),
    ("GenRyuMin2TW", "700", "GenRyuMin2TW-B"),
    ("GenRyuMin2TW", "900", "GenRyuMin2TW-H"),
]


def site_chars():
    """扫描站内内容，收集所有出现过的字符。"""
    text = []
    for pattern in ("source/**/*.md", "source/**/*.html", "themes/iris-paper/layout/**/*.ejs",
                    "themes/iris-paper/_config.yml", "_config.yml"):
        for file in ROOT.glob(pattern):
            text.append(file.read_text(encoding="utf-8", errors="ignore"))
    return {ord(ch) for ch in "".join(text) if ord(ch) >= 0x80}


def blocks_of(path):
    cmap = set(TTFont(str(path), lazy=True).getBestCmap().keys())
    rest = {}
    for c in cmap - core_set:
        rest.setdefault(c // BLOCK * BLOCK, set()).add(c)
    return cmap, rest


def write_css():
    """后声明的字体优先：先写各码位块，最后写 core，让常用字总是命中 core。"""
    lines = ["/* 由 tools/build-fonts.py 生成；不要手工编辑。 */",
             "@font-face {",
             '  font-family: "Material Symbols Outlined";',
             "  font-style: normal;",
             "  font-weight: 100 700;",
             "  font-display: block;",
             '  src: url("../fonts/MaterialSymbolsOutlined.woff2") format("woff2");',
             "}", ""]
    face_blocks = {stem: sorted(blocks_of(SRC / (stem + (".woff" if stem.endswith("Regular") else ".otf")))[1])
                   for _, _, stem in FACES}
    for family, weight, stem in FACES:
        for start in face_blocks[stem]:
            lines += ["@font-face {", f'  font-family: "{family}";', "  font-style: normal;",
                      f"  font-weight: {weight};", "  font-display: swap;",
                      f'  src: url("../fonts/{stem}-u{start:X}.woff2") format("woff2");',
                      f"  unicode-range: U+{start:X}-{start + BLOCK - 1:X};", "}", ""]
    for family, weight, stem in FACES:
        path = SRC / (stem + (".woff" if stem.endswith("Regular") else ".otf"))
        extra = merge(site_chars() & set(TTFont(str(path), lazy=True).getBestCmap()) - core_set, 0)
        if extra:
            lines += ["@font-face {", f'  font-family: "{family}";', "  font-style: normal;",
                      f"  font-weight: {weight};", "  font-display: swap;",
                      f'  src: url("../fonts/{stem}-site.woff2") format("woff2");',
                      f"  unicode-range: {css_range(extra)};", "}", ""]
    for family, weight, stem in FACES:
        lines += ["@font-face {", f'  font-family: "{family}";', "  font-style: normal;",
                  f"  font-weight: {weight};", "  font-display: swap;",
                  f'  src: url("../fonts/{stem}-core.woff2") format("woff2");',
                  f"  unicode-range: {css_range(core_ranges)};", "}", ""]
    text = "\n".join(lines)
    (ROOT / "themes/iris-paper/source/css/fonts.css").write_text(text, encoding="utf-8")
    print("fonts.css", len(text) // 1024, "KB")


def main():
    args = sys.argv[1:]
    if args == ["--css"]:
        write_css()
        return
    if args == ["--site"]:
        for name in FONTS:
            path = SRC / name
            cmap = set(TTFont(str(path), lazy=True).getBestCmap())
            chars = site_chars() & cmap - core_set
            target = OUT / f"{path.stem}-site.woff2"
            if chars:
                write(path, chars, target)
                print(f"{target.name:46} {len(chars):6d} 字  {target.stat().st_size / 1024:8.0f} KB", flush=True)
            elif target.exists():
                target.unlink()
        write_css()
        return
    OUT.mkdir(parents=True, exist_ok=True)
    for name in FONTS:
        if args and not any(key in name for key in args):
            continue
        path = SRC / name
        cmap, rest = blocks_of(path)
        jobs = [("core", cmap & core_set)] + [(f"u{start:X}", chars) for start, chars in sorted(rest.items())]
        for tier, chars in jobs:
            target = OUT / f"{path.stem}-{tier}.woff2"
            write(path, chars, target)
            print(f"{target.name:46} {len(chars):6d} 字  {target.stat().st_size / 1024:8.0f} KB", flush=True)
    if not args:
        main_site()


def main_site():
    sys.argv = [sys.argv[0], "--site"]
    main()


if __name__ == "__main__":
    main()
