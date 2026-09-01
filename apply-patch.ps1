param(
  [Parameter(Mandatory=$true)]
  [string]$Target
)

$ErrorActionPreference = "Stop"
$PatchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Target = (Resolve-Path $Target).Path

if (-not (Test-Path (Join-Path $Target "package.json"))) {
  throw "Target không phải thư mục gốc HuyenButCac (không thấy package.json)."
}

$items = @(
  ".github/workflows/deploy.yml",
  "CHANGELOG_0.15.0.md",
  "src/App.tsx",
  "src/app-enhancements.css",
  "src/app/appConfig.ts",
  "src/components/common/ResponsiveSidebar.tsx",
  "src/components/editor/NoteEditor.tsx",
  "src/components/editor/RichTextToolbar.tsx",
  "src/components/library/LibraryView.css",
  "src/components/library/LibraryView.tsx",
  "src/components/notes-mode/NotesModeView.tsx",
  "src/features/library/libraryService.ts",
  "src/main.tsx",
  "src/stores/themeStore.ts",
  "src/tests/libraryService.test.ts",
  "src/themes/festival-themes.css",
  "src/types/entities.ts"
)

foreach ($item in $items) {
  $src = Join-Path $PatchRoot $item
  $dst = Join-Path $Target $item
  $parent = Split-Path -Parent $dst
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
  Copy-Item -Force $src $dst
  Write-Host "Applied: $item"
}

Write-Host "Patch 0.15.0 đã áp dụng. Chạy: npm ci; npm run build; npm run test" -ForegroundColor Green
