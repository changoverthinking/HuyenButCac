param([string]$Root = ".")
$PatchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Feature = Join-Path $Root "src/features/tieu-nhi"
New-Item -ItemType Directory -Force -Path $Feature | Out-Null
Copy-Item -Force (Join-Path $PatchRoot "src/features/tieu-nhi/TieuNhiLauncher.tsx") (Join-Path $Feature "TieuNhiLauncher.tsx")
Copy-Item -Force (Join-Path $PatchRoot "src/features/tieu-nhi/tieuNhi.worker.js") (Join-Path $Feature "tieuNhi.worker.js")
Copy-Item -Force (Join-Path $PatchRoot "src/features/tieu-nhi/tieu-nhi.css") (Join-Path $Feature "tieu-nhi.css")
Copy-Item -Force (Join-Path $PatchRoot "src/main.tsx") (Join-Path $Root "src/main.tsx")
Write-Host "Đã áp dụng Tiểu Nhị. Chạy: npm ci; npm run lint; npm run test; npm run build" -ForegroundColor Green
