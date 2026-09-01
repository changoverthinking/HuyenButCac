# ARCHITECTURE — Huyền Bút Các 0.13.0

## Nguyên tắc

- **Local-first**: thao tác người dùng ghi vào IndexedDB trước; app vẫn dùng được khi offline.
- **Tách workspace theo tài khoản**: guest và mỗi Supabase `user.id` dùng database IndexedDB riêng. Đổi tài khoản không clear DB cũ.
- **GitHub Pages = static host**: frontend không chứa `service_role` hoặc database password.
- **Đồng bộ E2EE**: payload sync được AES-256-GCM mã hóa trên client bằng khóa Kho bảo mật trước khi gửi Supabase.
- **Ghi chú khóa riêng**: title/content/tag được mã hóa at-rest bằng mật khẩu ghi chú; key chỉ nằm trong RAM khi mở.

## Sơ đồ tầng

```text
UI (React)
   │
Zustand stores (cache UI, không phải nguồn sự thật)
   │
features/*Service.ts (nghiệp vụ, validation, sanitize)
   │
Dexie workspace DB (nguồn sự thật local)
   │
   ├─ guest workspace
   └─ user workspace theo Supabase user.id
          │
          └─ syncService -> WebCrypto AES-GCM -> Supabase sync_records
```

## Workspace local

`src/database/db.ts` export một live binding `db`. `switchWorkspace(userId)` đóng instance hiện tại và mở database:

- `huyen-but-cac-workspace-guest`
- `huyen-but-cac-workspace-<userId>`

Database cũ `huyen-but-cac` được **copy một lần** sang workspace phù hợp khi nâng cấp. Database cũ không bị clear trong quá trình migration.

App bootstrap Supabase session trước khi render nội dung workspace, tránh hiển thị thoáng dữ liệu của tài khoản trước.

## Đồng bộ

`src/features/sync/syncService.ts`:

1. Chỉ chạy khi workspace hiện tại khớp `user.id` và Kho đã mở.
2. Pull record của chính user (RLS + `.eq(user_id)`).
3. Không ghi đè record local có `syncState=local|pending`.
4. Chụp snapshot local.
5. Mã hóa snapshot rồi upload.
6. Chỉ đánh dấu `synced` nếu fingerprint record hiện tại vẫn giống snapshot đã upload.

Cách này ngăn trường hợp người dùng gõ thêm trong lúc request mạng đang chạy nhưng bản gõ mới bị đánh dấu nhầm là đã upload.

## Ghi nội bộ Dexie

Ghi do cloud/migration dùng marker trên **Dexie transaction hiện tại**, không dùng boolean toàn cục. Vì vậy ghi của người dùng chạy song song không bị nhầm thành ghi nội bộ.

## Xóa và tombstone

Soft-delete giữ dữ liệu để khôi phục. Hard-delete note xóa sạch title/content/tag/ciphertext và giữ tombstone tối thiểu (`id`, timestamps/metadata cần thiết) để thao tác xóa truyền sang thiết bị khác.

Project/Section/Chapter khi xóa sẽ gỡ liên kết Mind Map/Timeline không còn hợp lệ thay vì xóa sơ đồ người dùng đã vẽ.

## HTML rich-text

HTML được sanitize khi lưu và trước khi gán `innerHTML`. Script, iframe, SVG, handler `on*`, URL nguy hiểm và CSS tải tài nguyên bị loại bỏ.

## Bảo vệ khi đổi tài khoản giữa lúc sync

Mỗi `syncNow()` chụp cả `user.id` và đúng instance `HuyenButDB` đang hoạt động. Trước/sau các bước mạng và trước transaction ghi, `assertWorkspaceActive()` kiểm tra lại user/workspace. Nếu người dùng logout hoặc chuyển tài khoản giữa chừng, phiên sync cũ ném lỗi an toàn và dừng; nó không bao giờ tiếp tục bằng live binding `db` của workspace mới.

## Autosave tuần tự

`NoteEditor` và `FocusWriter` đưa các lần save vào một Promise queue. Một lần save cũ không thể hoàn thành sau một lần save mới rồi ghi đè dữ liệu mới. `pagehide`/`visibilitychange` cũng gọi flush, và nút thoát Focus Writer chờ flush hoàn tất trước khi đổi màn hình.

## Lịch Vạn Niên

- UI: `src/components/calendar/CalendarView.tsx`.
- Thuật toán: `src/features/calendar/lunarCalendar.ts`.
- Không lưu dữ liệu người dùng và không cần Supabase/API mạng.
- Tính Âm lịch Việt Nam theo UTC+7 từ Julian Day, Sóc, kinh độ Mặt Trời, tháng 11 âm và tháng nhuận.
- Can Chi ngày dùng chu kỳ Julian liên tục; Can Chi tháng/năm lấy theo năm/tháng âm.
- Test hồi quy: `src/tests/lunarCalendar.test.ts`.
