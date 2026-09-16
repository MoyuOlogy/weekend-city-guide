# 周末探索 · 自动化验证
#
# 用法（仓库根目录，Windows PowerShell 5.1 或 PowerShell 7 均可）：
#   powershell -File tests\run-tests.ps1
#   （PowerShell 7： pwsh -File tests/run-tests.ps1 ）
#
# 五套验证：
#   1. 颜色审计   断言全站没有蓝/紫色相（hue 185°–335°）
#   2. 行为测试   注入 behavior.snippet.html，真实浏览器跑交互断言
#   3. 按钮审计   注入 buttons.snippet.html，真实鼠标事件序列逐个点击 + 逐张卡片遍历
#   4. 布局测试   注入 layout.snippet.html，用 iframe 精确模拟 375px / 1280px 验证桌面与移动端
#   5. 同步测试   注入 sync.snippet.html，真连 textdb.dev 跑跨设备同步
#
# 依赖：Node.js（颜色审计）、Microsoft Edge 或 Chrome（无头浏览器）。
# 测试页面写到 tests/_tmp-*.html，跑完即删；每个套件的完整输出留在 tests/_logs/*.txt。

# 注意：不能设成 'Stop' —— Edge 会把无关警告写进 stderr，PS 5.1 会把它当终止错误
$ErrorActionPreference = 'Continue'
# 控制台按 UTF-8 输出，否则中文断言名在日志里是乱码
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false } catch {}
$root = Split-Path -Parent $PSScriptRoot
$index = Join-Path $root 'index.html'

$edgeCandidates = @(
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)
$browser = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { Write-Host "找不到 Edge/Chrome，无法运行浏览器测试" -ForegroundColor Red; exit 1 }

function Invoke-BrowserSuite {
  param([string]$SnippetName, [int]$BudgetMs)
  $snippet = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot $SnippetName)
  $html = Get-Content -Raw -Encoding UTF8 $index
  $tmp = Join-Path $PSScriptRoot ("_tmp-" + [IO.Path]::GetFileNameWithoutExtension($SnippetName) + ".html")
  Set-Content -Path $tmp -Value $html.Replace('</body>', $snippet + "`r`n</body>") -Encoding UTF8 -NoNewline

  $profile = Join-Path $env:TEMP ("wcgtests-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
  $dump = Join-Path $env:TEMP ("wcgdump-" + [guid]::NewGuid().ToString('N').Substring(0, 8) + ".html")
  $uri = 'file:///' + ($tmp -replace '\\', '/')
  # --allow-file-access-from-files：布局测试需要在 iframe 里读同源文档
  # --force-prefers-reduced-motion：触发无障碍降级分支，同时避免动画冻结导致截图/内容不可见
  #
  # 不要用 `& $browser ... | Out-File`：PowerShell 管道会按控制台代码页（中文 Windows 是 CP936）
  # 解码浏览器输出的 UTF-8 字节，日志里中文全成乱码、`★` 这类字符还会丢，
  # 导致按 `★` 过滤的日志看不全。这里用 Process + StandardOutputEncoding 显式按 UTF-8 读。
  $argList = @(
    '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
    '--force-prefers-reduced-motion', "--user-data-dir=$profile",
    "--virtual-time-budget=$BudgetMs", '--dump-dom', $uri
  )
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $browser
  $psi.Arguments = ($argList -join ' ')
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.StandardOutputEncoding = New-Object System.Text.UTF8Encoding $false
  $psi.StandardErrorEncoding = New-Object System.Text.UTF8Encoding $false
  $psi.CreateNoWindow = $true
  $proc = [System.Diagnostics.Process]::Start($psi)
  $dom = $proc.StandardOutput.ReadToEnd()
  $proc.StandardError.ReadToEnd() | Out-Null     # 不读会填满管道缓冲，把子进程卡死
  $proc.WaitForExit()
  $m = [regex]::Match($dom, '(?s)<pre id="TESTOUT"[^>]*>(.*?)</pre>')

  # 每个套件的完整输出留一份 UTF-8 日志，失败时方便直接翻（tests/_logs 不入库）
  $logDir = Join-Path $PSScriptRoot '_logs'
  if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
  $logFile = Join-Path $logDir ([IO.Path]::GetFileNameWithoutExtension($SnippetName) + '.txt')
  if ($m.Success) {
    $text = $m.Groups[1].Value -replace '&lt;', '<' -replace '&gt;', '>' -replace '&quot;', '"' -replace '&amp;', '&'
  } else {
    $text = '没有拿到测试输出（浏览器启动失败 / 虚拟时间预算不够？）'
  }
  Set-Content -Path $logFile -Value $text -Encoding UTF8
  Remove-Item $tmp, $dump -Force -ErrorAction SilentlyContinue
  Remove-Item $profile -Recurse -Force -ErrorAction SilentlyContinue
  if (-not $m.Success) { return @{ Text = $text; Failed = 1 } }

  $failed = ($text -split "`n" | Where-Object { $_ -match '^FAIL' }).Count
  return @{ Text = $text.Trim(); Failed = $failed }
}

function Invoke-Suite {
  param([string]$Title, [string]$Snippet, [int]$BudgetMs)
  Write-Host "`n===== $Title =====" -ForegroundColor Cyan
  $r = Invoke-BrowserSuite -SnippetName $Snippet -BudgetMs $BudgetMs
  $r.Text -split "`n" | Where-Object { $_ -match 'TESTS|^FAIL|★' } | ForEach-Object { Write-Host $_ }
  if ($r.Failed -gt 0) { return 1 }
  return 0
}

$exit = 0

Write-Host "`n===== 1/5 颜色审计（禁用蓝紫） =====" -ForegroundColor Cyan
node (Join-Path $PSScriptRoot 'color-audit.js')
if ($LASTEXITCODE -ne 0) { $exit = 1 }

$exit += Invoke-Suite -Title '2/5 行为测试'               -Snippet 'behavior.snippet.html' -BudgetMs 40000
$exit += Invoke-Suite -Title '3/5 按钮真实性与跳转审计'    -Snippet 'buttons.snippet.html'  -BudgetMs 60000
$exit += Invoke-Suite -Title '4/5 布局与移动端适配'        -Snippet 'layout.snippet.html'   -BudgetMs 90000
$exit += Invoke-Suite -Title '5/5 跨设备同步（真实网络）'  -Snippet 'sync.snippet.html'     -BudgetMs 40000

if ($exit -eq 0) { Write-Host "`n全部通过 ✅" -ForegroundColor Green } else { Write-Host "`n存在失败项 ❌" -ForegroundColor Red }
exit $exit
