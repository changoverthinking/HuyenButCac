#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-.}"
SOURCE="$(cd "$(dirname "$0")" && pwd)"
files=(
  "src/App.tsx"
  "src/app/appConfig.ts"
  "src/app-enhancements.css"
  "src/components/common/Icons.tsx"
  "src/components/common/NoteList.tsx"
  "src/components/editor/NoteEditor.tsx"
  "src/components/notes-mode/NotesModeView.tsx"
)
for file in "${files[@]}"; do
  mkdir -p "$TARGET/$(dirname "$file")"
  cp -f "$SOURCE/$file" "$TARGET/$file"
  echo "Applied $file"
done
echo "Huyen But UI V2 applied. Commit/push để GitHub Actions kiểm tra build + test."
