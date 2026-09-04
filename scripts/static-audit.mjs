import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const errors = [];
const checks = [];
const pass = (name) => checks.push(name);
const fail = (name, detail) => errors.push(`${name}: ${detail}`);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function walk(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(rel) : [rel];
  });
}

// 1) Mọi relative import phải trỏ tới file/module tồn tại.
const codeFiles = walk('src').filter((file) => /\.(?:ts|tsx|js|jsx)$/.test(file));
const importPattern = /(?:from\s*|import\s*)["'](\.{1,2}\/[^"']+)["']/g;
const candidates = (base) => [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.css`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
for (const file of codeFiles) {
  const source = read(file);
  let match;
  while ((match = importPattern.exec(source))) {
    const base = path.resolve(root, path.dirname(file), match[1]);
    if (!candidates(base).some((candidate) => fs.existsSync(candidate))) fail('Relative import', `${file} -> ${match[1]}`);
  }
}
if (!errors.some((item) => item.startsWith('Relative import:'))) pass('Relative imports');

// 2) Version phải đồng nhất giữa package, lock và app config.
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const appConfig = read('src/app/appConfig.ts');
const appVersion = appConfig.match(/version:\s*["']([^"']+)["']/)?.[1];
if (pkg.version !== lock.version || pkg.version !== lock.packages?.['']?.version || pkg.version !== appVersion) {
  fail('Version consistency', `package=${pkg.version}, lock=${lock.version}/${lock.packages?.['']?.version}, app=${appVersion}`);
} else pass('Version consistency');

// 3) Huyền Học phải mount trực tiếp trong CalendarView và giữ lazy chunk.
const calendar = read('src/components/calendar/CalendarView.tsx');
const mainEntry = read('src/main.tsx');
const huyenHocBridge = read('src/components/metaphysics/HuyenHocBridge.tsx');
if (!calendar.includes('lazy(() => import("../metaphysics/HuyenHocPanel")') || !calendar.includes('<HuyenHocPanel />') || mainEntry.includes('HuyenHocBridge') || huyenHocBridge.includes('MutationObserver') || huyenHocBridge.includes('querySelector')) {
  fail('HuyenHoc isolation', 'HuyenHoc must be lazy-mounted directly inside CalendarView and legacy bridge must stay inert');
} else pass('HuyenHoc lazy isolation');

// 4) Hotfix cũ phải được hợp nhất vào stylesheet sở hữu tính năng; file cũ chỉ còn stub để upload đè an toàn.
const hotfixStub = read('src/hotfix-tangthu-mobile.css');
const libraryCss = read('src/components/library/LibraryView.css');
const appCss = read('src/app-enhancements.css');
if (hotfixStub.includes('{') || mainEntry.includes('hotfix-tangthu-mobile.css') || !libraryCss.includes('.library-modal-backdrop') || !appCss.includes('.hbc-update-prompt')) {
  fail('CSS ownership', 'old hotfix is active/imported or migrated rules are missing');
} else pass('CSS hotfix merged');

// 5) CSS structural sanity: bỏ comment/string đơn giản rồi cân bằng block.
for (const file of walk('src').filter((item) => item.endsWith('.css'))) {
  const source = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0;
  for (const char of source) {
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth < 0) break;
  }
  if (depth !== 0) fail('CSS braces', `${file} depth=${depth}`);
}
if (!errors.some((item) => item.startsWith('CSS braces:'))) pass('CSS block balance');

// 6) Data-safety hooks must remain wired to both editors and update paths.
for (const file of ['src/components/editor/NoteEditor.tsx', 'src/components/projects/FocusWriter.tsx']) {
  if (!read(file).includes('registerBeforeReloadFlush')) fail('Autosave lifecycle', `${file} is not registered`);
}
if (!read('src/components/common/UpdatePrompt.tsx').includes('prepareForReload')) fail('Update safety', 'UpdatePrompt does not prepare/flush pending writes');
if (!read('src/components/settings/SafeUpdateSettings.tsx').includes('uploadLatestWorkspaceBackup')) fail('Update safety', 'SafeUpdateSettings does not create full cloud backup');
if (!errors.some((item) => item.startsWith('Autosave lifecycle:')) && !errors.some((item) => item.startsWith('Update safety:'))) pass('Autosave/update safety wiring');

// 7) SQL migration must include both private bucket and cursor capability handshake.
const migration = read('supabase/migration_0_19_0_private_backups.sql');
if (!migration.includes("hbc-private") || !migration.includes('hbc_sync_cursor_version') || !migration.includes('hbc_sync_records_touch_server_updated_at')) fail('Supabase migration', 'backup/cursor primitives missing');
else pass('Supabase migration primitives');


// 8) Cursor sync không được nhảy qua thay đổi đồng thời từ thiết bị khác.
const syncService = read('src/features/sync/syncService.ts');
if (!syncService.includes('Chỉ tiến cursor tới mốc đã THỰC SỰ pull') || /\.upsert\([\s\S]{0,500}?\.select\("server_updated_at"\)/.test(syncService)) {
  fail('Sync cursor safety', 'cursor must advance only from pulled rows, never from own upload timestamps');
} else pass('Concurrent sync cursor safety');

// 9) Restore chỉ được chạm database/store thuộc backup của đúng workspace.
const backupService = read('src/features/backup/workspaceBackupService.ts');
if (!backupService.includes('assertBackupScope(backup)') || !backupService.includes('const restoreStores = databaseBackup.stores.filter')) {
  fail('Backup restore scope', 'workspace/database/store restore guards are missing');
} else pass('Backup restore scope isolation');

// 10) Prewarm phải ghi vào đúng cacheName mà Workbox CacheFirst sử dụng.
const pushSw = read('public/push-sw.js');
const viteConfig = read('vite.config.ts');
for (const cacheName of ['hbc-pdf-runtime-v1', 'hbc-document-runtime-v1']) {
  if (!pushSw.includes(cacheName) || !viteConfig.includes(cacheName)) fail('PWA prewarm cache', `${cacheName} mismatch`);
}
if (!errors.some((item) => item.startsWith('PWA prewarm cache:'))) pass('PWA prewarm cache ownership');

// 11) Workflow dùng action majors chạy Node 24 để tránh cảnh báo/runtime Node 20 cũ.
const workflow = read('.github/workflows/deploy.yml');
for (const action of ['actions/checkout@v7', 'actions/setup-node@v7', 'actions/upload-artifact@v7', 'actions/configure-pages@v6', 'actions/upload-pages-artifact@v5', 'actions/deploy-pages@v5']) {
  if (!workflow.includes(action)) fail('GitHub Actions runtime', `${action} missing`);
}
if (!errors.some((item) => item.startsWith('GitHub Actions runtime:'))) pass('GitHub Actions Node 24 majors');


// 12) Các engine/công cụ ngoài phạm vi patch phải giữ byte-for-byte baseline 0.18.0.
const coreBaseline = JSON.parse(read('scripts/unchanged-src-baseline-0.18.json'));
for (const [file, expectedHash] of Object.entries(coreBaseline)) {
  const actualHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
  if (actualHash !== expectedHash) fail('Core regression hash', `${file} changed outside the 0.19 stability scope`);
}
if (!errors.some((item) => item.startsWith('Core regression hash:'))) pass('Unrelated source files unchanged');

// 13) Runtime stability: sync/auth/update không được làm mất thao tác đang soạn.
const lifecycle = read('src/features/app/appLifecycle.ts');
const appSource = read('src/App.tsx');
const notificationSource = read('src/features/calendar/notificationService.ts');
if (!lifecycle.includes('trackPendingWrite') || !lifecycle.includes('prepareForReload') || !lifecycle.includes('FLUSH_TIMEOUT_MS')) {
  fail('Runtime data safety', 'pending write queue / reload preparation / timeout missing');
}
if (!syncService.includes('flushPendingWrites()') || !syncService.includes('fingerprint(local) !== fingerprint(nextRecord)')) {
  fail('Runtime data safety', 'sync must flush local writes and ignore identical remote payloads');
}
if (!appSource.includes('authEventSeen') || !appSource.includes('SYNC_TABLES_BY_MODE')) {
  fail('Runtime data safety', 'auth race guard or table-scoped UI refresh missing');
}
if (!backupService.includes('DEVICE_LOCAL_STORES') || !backupService.includes('isDeviceLocalStorageKey')) {
  fail('Runtime data safety', 'device-local notification state must not cross backup/restore');
}
if (!notificationSource.includes('checkDueCalendarReminders().catch')) {
  fail('Runtime data safety', 'calendar reminder runtime must contain background errors');
}
if (!errors.some((item) => item.startsWith('Runtime data safety:'))) pass('Runtime data-safety guards');

if (errors.length) {
  console.error(`STATIC AUDIT FAILED (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`STATIC AUDIT PASS (${checks.length} groups)`);
for (const check of checks) console.log(`- ${check}`);
