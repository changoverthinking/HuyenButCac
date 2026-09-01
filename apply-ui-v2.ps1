param(
  [string]$Target = "."
)
$ErrorActionPreference = "Stop"
$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$files = @(
  "src/App.tsx",
  "src/app/appConfig.ts",
  "src/app-enhancements.css",
  "src/components/common/Icons.tsx",
  "src/components/common/NoteList.tsx",
  "src/components/editor/NoteEditor.tsx",
  "src/components/notes-mode/NotesModeView.tsx"
)
foreach ($file in $files) {
  $src = Join-Path $source $file
  $dst = Join-Path $Target $file
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dst) | Out-Null
  Copy-Item -Force $src $dst
  Write-Host "Applied $file"
}
Write-Host "Huyen But UI V2 applied. Commit/push để GitHub Actions kiểm tra build + test."
