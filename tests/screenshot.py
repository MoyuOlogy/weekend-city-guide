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

# 首次访问会强制弹新手引导 —— 截图时必须显式控制这个状态，否则「有没有弹」取决于
# 上一次跑留下来的 localStorage，截出来的东西就不确定了。
SEED_GUIDED = '<script>try{localStorage.setItem("wcg.guided.v2","1")}catch(e){}</script>'
CLEAR_GUIDED = '<script>try{localStorage.removeItem("wcg.guided.v2")}catch(e){}</script>'
# 引导看过之后关于页默认显示「项目说明」，这个脚本把它切回「新手指引」再截
SHOW_GUIDE_TAB = ('<script>document.addEventListener("DOMContentLoaded",function(){'
                  'try{setAboutTab("guide")}catch(e){}});</script>')
# 直接在 DOMContentLoaded 里起引导：这样首帧就是「高亮 + 说明卡」的样子
SPOTLIGHT = ('<script>document.addEventListener("DOMContentLoaded",function(){'
             'try{startTour(1,true)}catch(e){}});</script>')

# (文件名, 视口宽, 视口高, 目标页面, 注入到 <head> 的脚本)
CASES = [
    ('desktop-feed', 1440, 900, 'feed', SEED_GUIDED),
    ('desktop-calendar', 1440, 1000, 'calendar', SEED_GUIDED),
    ('desktop-guide', 1440, 900, 'guide', SEED_GUIDED),
    ('desktop-onboarding', 1440, 900, 'about', SEED_GUIDED + SHOW_GUIDE_TAB),
    ('desktop-about', 1440, 900, 'about', SEED_GUIDED),
    ('desktop-me', 1440, 900, 'me', SEED_GUIDED),
    ('mobile-feed', 390, 844, 'feed', SEED_GUIDED),
    ('mobile-calendar', 390, 900, 'calendar', SEED_GUIDED),
    ('mobile-me', 390, 844, 'me', SEED_GUIDED),
    ('mobile-tour', 390, 844, 'feed', CLEAR_GUIDED),        # 第一次访问：引导遮罩
    ('desktop-tour', 1440, 900, 'feed', SEED_GUIDED + SPOTLIGHT),   # 高亮态（第 2 步：天气条）
]


def patch(page: str, head: str = '') -> str:
    """把目标页面设成默认可见，隐藏其余页面，并同步导航高亮与分类条显隐。

    head 里的脚本插在 <head> 最前面：它在解析阶段就执行，早于所有 defer 脚本，
    所以用来预置 localStorage 状态（比如「已经看过引导」）是可靠的。
    """
    s = HTML.replace('<head>', '<head>\n' + head, 1)
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


def shot(name: str, w: int, h: int, page: str, head: str = '') -> None:
    # 临时页必须放在目标 HTML 所在目录（仓库根目录）：index.html 用相对路径引用
    # assets/css/*、assets/js/*，放到 tests/ 下这些引用会全部 404。
    work = ROOT
    inner = work / f'_shot-inner-{name}.html'
    inner.write_text(patch(page, head), encoding='utf-8')
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
    print(f'{name:22s} {png.stat().st_size if png.exists() else 0:>9,d} bytes  ({w}x{h}, page={page})')


if __name__ == '__main__':
    if not BROWSER:
        sys.exit('找不到 Edge / Chrome，无法截图')
    OUT.mkdir(exist_ok=True)
    for n, w, h, p, head in CASES:
        shot(n, w, h, p, head)
    print(f'\n输出目录：{OUT}')
