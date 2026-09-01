#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then echo "Usage: ./apply-patch.sh /path/to/HuyenButCac"; exit 2; fi
PATCH_ROOT="$(cd "$(dirname "$0")" && pwd)"
TARGET="$(cd "$TARGET" && pwd)"
[[ -f "$TARGET/package.json" ]] || { echo "Target không phải thư mục gốc HuyenButCac."; exit 3; }
items=(
  '.github/workflows/deploy.yml'
  'CHANGELOG_0.15.0.md'
  'src/App.tsx'
  'src/app-enhancements.css'
  'src/app/appConfig.ts'
  'src/components/common/ResponsiveSidebar.tsx'
  'src/components/editor/NoteEditor.tsx'
  'src/components/editor/RichTextToolbar.tsx'
  'src/components/library/LibraryView.css'
  'src/components/library/LibraryView.tsx'
  'src/components/notes-mode/NotesModeView.tsx'
  'src/features/library/libraryService.ts'
  'src/main.tsx'
  'src/stores/themeStore.ts'
  'src/tests/libraryService.test.ts'
  'src/themes/festival-themes.css'
  'src/types/entities.ts'
)
for item in "${items[@]}"; do
  mkdir -p "$TARGET/$(dirname "$item")"
  cp -f "$PATCH_ROOT/$item" "$TARGET/$item"
  echo "Applied: $item"
done
echo "Patch 0.15.0 đã áp dụng. Chạy: npm ci && npm run build && npm run test"
