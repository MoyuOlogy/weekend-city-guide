"""双端截图工具：把 index.html 复制一份、预置成目标页面状态，再交给无头浏览器截图。

用法（仓库根目录）： python tests/screenshot.py [输出目录]
默认输出到 tests/_shots/。

为什么不用「注入脚本切页面再截图」：`--screenshot` 在页面 load 的时候就抓拍了，
注入的 setTimeout 还没轮到跑，结果每个页面截出来字节数完全一样（都是首页）——
而 DOM dump 明明是 page-me，说明产品没问题、是截图时机不对。
直接把初始 hidden / on 状态改好，首帧就是目标页面，确定性最好。

为什么窄屏要套一层 iframe：Windows 无头窗口有最小宽度（实测约 503px），
直接 --window-size=390 只是把 503px 宽的渲染裁成 390，量到的布局是错的。
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
OUT = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent / '_shots'

BROWSERS = [
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
]
BROWSER = next((b for b in BROWSERS if pathlib.Path(b).exists()), None)

PAGES = ['feed', 'calendar', 'team', 'checkin', 'guide', 'me', 'about']

# (文件名, 视口宽, 视口高, 目标页面)
CASES = [
    ('desktop-feed', 1440, 900, 'feed'),
    ('desktop-calendar', 1440, 1000, 'calendar'),
    ('desktop-guide', 1440, 900, 'guide'),
    ('desktop-me', 1440, 900, 'me'),
    ('desktop-about', 1440, 900, 'about'),
    ('mobile-feed', 390, 844, 'feed'),
    ('mobile-calendar', 390, 900, 'calendar'),
    ('mobile-me', 390, 844, 'me'),
]


def patch(page: str) -> str:
    """把目标页面设成默认可见，隐藏其余页面，并同步导航高亮与分类条显隐。"""
    s = HTML
    for p in PAGES:
        tag = f'<main id="page-{p}"'
        m = re.search(re.escape(tag) + r'([^>]*)>', s)
        attrs = m.group(1).replace(' hidden', '')          # 先清掉原有 hidden，再按需加回
        if p != page:
            attrs += ' hidden'
        s = s[:m.start()] + tag + attrs + '>' + s[m.end():]
    if page != 'feed':                                     # 分类导航条只在首页有意义
        s = s.replace('<nav class="catbar">', '<nav class="catbar" hidden>')
    s = re.sub(r'(class="(?:rail-item|tb)(?: on)?")', lambda m: m.group(1).replace(' on', ''), s)
    s = s.replace(f'class="rail-item" data-page="{page}"', f'class="rail-item on" data-page="{page}"')
    s = s.replace(f'class="tb" data-page="{page}"', f'class="tb on" data-page="{page}"')
    if page in ('calendar', 'about'):                      # 移动端这两页挂在「我的」下面
        s = s.replace('class="tb" data-page="me"', 'class="tb on" data-page="me"')
    return s


def shot(name: str, w: int, h: int, page: str) -> None:
    # 临时页必须放在目标 HTML 所在目录（仓库根目录）：index.html 用相对路径引用
    # assets/css/*、assets/js/*，放到 tests/ 下这些引用会全部 404。
    work = ROOT
    inner = work / f'_shot-inner-{name}.html'
    inner.write_text(patch(page), encoding='utf-8')
    target, win_w, win_h = inner, w, h
    if w < 700:                                            # 窄屏用 iframe 强制精确视口
        wrap = work / f'_shot-wrap-{name}.html'
        wrap.write_text(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head>'
            f'<body style="margin:0;background:#fff"><iframe src="{inner.name}" '
            f'style="width:{w}px;height:{h}px;border:0;display:block"></iframe></body></html>',
            encoding='utf-8',
        )
        target, win_w, win_h = wrap, w + 120, h + 120

    png = OUT / f'{name}.png'
    subprocess.run([
        BROWSER, '--headless=new', '--disable-gpu', '--no-sandbox',
        '--allow-file-access-from-files', '--hide-scrollbars',
        '--force-prefers-reduced-motion',                  # 虚拟时钟不推进动画，不关掉会整页发灰
        '--virtual-time-budget=8000',
        f'--window-size={win_w},{win_h}', f'--screenshot={png}',
        'file:///' + str(target).replace('\\', '/'),
    ], capture_output=True)
    inner.unlink(missing_ok=True)
    if target is not inner:
        target.unlink(missing_ok=True)
    print(f'{name:20s} {png.stat().st_size if png.exists() else 0:>9,d} bytes  ({w}x{h}, page={page})')


if __name__ == '__main__':
    if not BROWSER:
        sys.exit('找不到 Edge / Chrome，无法截图')
    OUT.mkdir(exist_ok=True)
    for n, w, h, p in CASES:
        shot(n, w, h, p)
    print(f'\n输出目录：{OUT}')
