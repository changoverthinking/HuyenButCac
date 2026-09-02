#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
mkdir -p "$ROOT/src/features/tieu-nhi"
cp -f "$(dirname "$0")/src/features/tieu-nhi/TieuNhiLauncher.tsx" "$ROOT/src/features/tieu-nhi/TieuNhiLauncher.tsx"
cp -f "$(dirname "$0")/src/features/tieu-nhi/tieuNhi.worker.js" "$ROOT/src/features/tieu-nhi/tieuNhi.worker.js"
cp -f "$(dirname "$0")/src/features/tieu-nhi/tieu-nhi.css" "$ROOT/src/features/tieu-nhi/tieu-nhi.css"
cp -f "$(dirname "$0")/src/main.tsx" "$ROOT/src/main.tsx"
echo "Đã áp dụng Tiểu Nhị. Chạy: npm ci && npm run lint && npm run test && npm run build"
