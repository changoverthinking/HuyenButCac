import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = [
  'src/features/projects/projectsService.ts',
  'src/stores/projectsStore.ts',
  'src/components/projects/ProjectsView.tsx',
  'src/components/auth/AccountPanel.tsx',
  'src/tests/projectsService.test.ts',
];

let restored = 0;
for (const relative of targets) {
  const file = path.join(root, relative);
  const backup = `${file}.bak-chapter-vault`;
  if (!fs.existsSync(backup)) {
    console.log(`- Không có bản sao lưu: ${relative}`);
    continue;
  }
  fs.copyFileSync(backup, file);
  console.log(`✓ Đã khôi phục: ${relative}`);
  restored += 1;
}

if (!restored) {
  console.error('\nKhông tìm thấy file .bak-chapter-vault. Hãy chạy script trong đúng thư mục gốc HuyenButCac.');
  process.exitCode = 1;
} else {
  console.log(`\nĐã khôi phục ${restored} file từ bản sao lưu.`);
}
