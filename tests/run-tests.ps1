# 周末探索 · 自动化验证
#
# 用法（在仓库根目录，Windows PowerShell 5.1 或 PowerShell 7 均可）：
#   powershell -File tests\run-tests.ps1
#   （PowerShell 7： pwsh -File tests/run-tests.ps1 ）
#
# 做三件事：
#   1. 颜色审计：断言全站没有蓝/紫色相（hue 185°–335°）
#   2. 行为测试：把 tests/behavior.snippet.html 注入 index.html，用真实浏览器跑 47 项断言
#   3. 同步测试：把 tests/sync.snippet.html 注入 index.html，真连 textdb.dev 跑跨设备同步
#
# 依赖：Node.js（颜色审计）、Microsoft Edge（无头浏览器）。测试页面会被写到 tests/_tmp-*.html，跑完即删。

# 注意：不能设成 'Stop' —— Edge 会把无关警告写进 stderr，PS 5.1 会把它当终止错误
$ErrorActionPreference = 'Continue'
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
  & $browser --headless=new --disable-gpu --no-sandbox "--user-data-dir=$profile" "--virtual-time-budget=$BudgetMs" --dump-dom $uri 2>$null | Out-File -Encoding UTF8 $dump

  $dom = Get-Content -Raw -Encoding UTF8 $dump
  $m = [regex]::Match($dom, '(?s)<pre id="TESTOUT"[^>]*>(.*?)</pre>')
  Remove-Item $tmp, $dump -Force -ErrorAction SilentlyContinue
  Remove-Item $profile -Recurse -Force -ErrorAction SilentlyContinue
  if (-not $m.Success) { return @{ Text = '没有拿到测试输出（浏览器启动失败？）'; Failed = 1 } }

  $text = $m.Groups[1].Value -replace '&lt;', '<' -replace '&gt;', '>' -replace '&amp;', '&' -replace '&quot;', '"'
  $failed = ($text -split "`n" | Where-Object { $_ -match '^FAIL' }).Count
  return @{ Text = $text.Trim(); Failed = $failed }
}

$exit = 0

Write-Host "`n===== 1/3 颜色审计（禁用蓝紫） =====" -ForegroundColor Cyan
node (Join-Path $PSScriptRoot 'color-audit.js')
if ($LASTEXITCODE -ne 0) { $exit = 1 }

Write-Host "`n===== 2/3 行为测试 =====" -ForegroundColor Cyan
$r = Invoke-BrowserSuite -SnippetName 'behavior.snippet.html' -BudgetMs 20000
$r.Text -split "`n" | Where-Object { $_ -match 'TESTS|^FAIL' }
if ($r.Failed -gt 0) { $exit = 1 }

Write-Host "`n===== 3/3 跨设备同步测试（真实网络） =====" -ForegroundColor Cyan
$r2 = Invoke-BrowserSuite -SnippetName 'sync.snippet.html' -BudgetMs 30000
$r2.Text -split "`n" | Where-Object { $_ -match 'TESTS|^FAIL|^PASS :: ★' }
if ($r2.Failed -gt 0) { $exit = 1 }

if ($exit -eq 0) { Write-Host "`n全部通过 ✅" -ForegroundColor Green } else { Write-Host "`n存在失败项 ❌" -ForegroundColor Red }
exit $exit
