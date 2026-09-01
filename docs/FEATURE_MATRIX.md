# FEATURE MATRIX — Huyền Bút Các

Trạng thái: TODO | IMPLEMENTING | TESTING | STABLE | BLOCKED
Chỉ đánh dấu STABLE khi: hoạt động thật, lưu được, reload không mất, test đạt, build thành công, không còn nút giả.

## 0. Nền tảng
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Vite + React + TS strict scaffold | STABLE | `npm run build` chạy sạch |
| Tailwind v4 (@tailwindcss/vite) + CSS variables | STABLE | 6 theme tokens đã định nghĩa |
| Zustand store | STABLE | notesStore, foldersStore, uiStore |
| Dexie (IndexedDB) schema + migration v1 | STABLE | xem `src/database/db.ts` |
| Chuyển chế độ Notes/Projects/MindMap/Whiteboard/Vạn niên | STABLE | tab desktop + thanh điều hướng di động |
| PWA manifest + service worker (vite-plugin-pwa) | STABLE | test offline reload OK trên build local |
| i18n khung (vi mặc định) | IMPLEMENTING | chưa có tiếng Anh/Nhật |

## 1. Ghi chú cơ bản (Giai đoạn 3 — đang làm ở checkpoint này)
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Tạo/sửa/xóa ghi chú, autosave debounce | STABLE | gộp patch tiêu đề+nội dung, debounce 400ms |
| Cây thư mục nhiều cấp, kéo thả | IMPLEMENTING | cây nhiều cấp + tạo thư mục con + API move hoạt động; kéo-thả UI TODO |
| Ghim / yêu thích / thẻ (tag) | STABLE | |
| Thùng rác + khôi phục (soft delete) | STABLE | có xóa vĩnh viễn và xác nhận |
| Tìm kiếm full-text (tiêu đề + nội dung, có/không dấu) | STABLE | dùng bỏ dấu tiếng Việt thủ công, index Dexie |
| Rich-text editor cơ bản | STABLE | H1-H3, đoạn/trích dẫn/mã, 5 font, 7 cỡ, đậm/nghiêng/gạch chân/gạch ngang, màu, căn lề, danh sách, undo/redo |
| Bảng trong ghi chú | TODO | |
| Chèn ảnh | TODO | |
| Mẫu ghi chú (template) | TODO | |
| Khóa ghi chú bằng mật khẩu + AES-GCM thật | TESTING | PBKDF2 + AES-256-GCM; ciphertext lưu IndexedDB, key chỉ ở RAM |
| Undo/redo trong editor | STABLE | dùng lịch sử chỉnh sửa của trình duyệt |

## 2. Viết dự án (Giai đoạn 4 — checkpoint 2)
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Dexie v2 migration (projects/sections/chapters/tasks/milestones) | STABLE | version 1 giữ nguyên, chỉ thêm bảng |
| Tạo/chọn dự án, 4 loại (Phần mềm/Game/Công trình/Chung) | STABLE | chưa có icon/bìa/theme riêng cho từng dự án |
| Cấu trúc Phần→Chương (chưa có "Mục" cấp con của Chương) | IMPLEMENTING | Dự án→Phần→Chương hoạt động; cấp "Mục" trong Chương chưa tách riêng |
| Kéo sắp xếp chương | IMPLEMENTING | có API `reorderChapter` + test, UI kéo-thả bằng chuột chưa làm (chỉ đổi order qua code) |
| Trình viết tập trung (focus mode) | STABLE | rich text, đếm từ trực tiếp, đồng hồ, autosave 400ms + lưu khi thoát |
| Tác phẩm hàng trăm nghìn từ | STABLE | lưu theo Phần/Chương riêng; cảnh báo khi một chương vượt 20.000 từ |
| Mục tiêu số từ / tiến độ ngày / typewriter mode | TODO | |
| Kanban | STABLE | 5 cột theo đúng trạng thái TODO/IMPLEMENTING/TESTING/STABLE/BLOCKED tinh thần mục 9.4 |
| Milestone | STABLE | checklist đơn giản, chưa có deadline UI (field có sẵn) |
| Timeline/Calendar view | TODO | |
| Xuất Markdown | STABLE | test xác nhận cấu trúc phần/chương đúng |
| Xuất PDF/HTML/JSON/ZIP/DOCX | TODO | |
| Mẫu dự án Phần mềm/Game/Công trình (field chuyên biệt) | TODO | mới có phân loại `kind`, chưa có field/tab riêng cho từng loại |

## 3. Sơ đồ tư duy (Giai đoạn 5)
| Hạng mục | Trạng thái |
|---|---|
| Tạo nhiều sơ đồ, lưu/reload IndexedDB | STABLE |
| Đổi tên/xóa toàn bộ sơ đồ | STABLE |
| Node trung tâm, thêm nhánh, sửa, kéo, xóa đệ quy | STABLE | bảo vệ/tự phục hồi nút trung tâm |
| Connector cong tự cập nhật | STABLE |
| Layout nâng cao, export ảnh/PDF/OPML, undo/redo | TODO |

## 4. Bảng trắng (Giai đoạn 6)
| Hạng mục | Trạng thái |
|---|---|
| Tạo/chọn nhiều bảng, lưu/reload IndexedDB | STABLE |
| Đổi tên/xóa toàn bộ bảng | STABLE |
| Sticky note, text, rectangle, ellipse | STABLE |
| Chọn, kéo, sửa chữ, xóa, zoom, grid | STABLE | vùng soạn chữ chọn được; tay nắm kéo riêng |
| Pan, minimap, connector, vẽ tay, group/layer/export | TODO |

## 5. Bảo mật (Giai đoạn 7)
| Hạng mục | Trạng thái |
|---|---|
| Web Crypto AES-GCM + PBKDF2 | TESTING | dùng cho Kho đồng bộ và khóa ghi chú |
| PIN/biometric adapter | TODO |
| Threat model | STABLE (tài liệu) — xem THREAT_MODEL.md |

## 6. Đồng bộ / Cộng tác (Giai đoạn 8)
| Hạng mục | Trạng thái |
|---|---|
| Đồng bộ Supabase E2EE | TESTING | local-first, snapshot/fingerprint chống race, workspace theo tài khoản |
| Realtime collaboration (Yjs) | TODO |

## 7. Hoàn thiện (Giai đoạn 9)
| Hạng mục | Trạng thái |
|---|---|
| Giao diện di động cơ bản | STABLE | bottom nav + menu Notes dạng drawer |
| iPhone Safari QA thật | TODO — vẫn cần kiểm tra trên thiết bị thật |
| Accessibility audit | TODO |
| 6 theme đầy đủ | IMPLEMENTING — tokens đã định nghĩa cho cả 6, UI mới áp dụng đủ cho 2 theme mặc định |

## 8. Cá nhân hóa và nhạc nền
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Thư viện MP3 lưu cục bộ | STABLE | nhiều tệp, đổi tên/xóa, thống kê dung lượng |
| Player phát/tạm dừng/tua/trước/sau | STABLE | dùng HTML Audio |
| Ngẫu nhiên/lặp danh sách/lặp một bài/âm lượng | STABLE | ghi nhớ thiết lập trên thiết bị |
| Điều khiển Media Session | STABLE | hoạt động khi hệ điều hành/trình duyệt hỗ trợ |
| Ảnh nền người dùng | STABLE | lưu Blob IndexedDB, thay/xóa và trở về mặc định |
| Đồng bộ MP3/ảnh nền giữa thiết bị | TODO | hiện chỉ lưu trên thiết bị đã tải lên |


## 9. Lịch Vạn Niên & nhắc hạn
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Dương lịch + Âm lịch Việt Nam + Can Chi | TESTING | regression 8 mốc Tết/Giao thừa/Âm lịch đạt; cần QA thêm trên thiết bị thật |
| Ghi chú/lịch hẹn theo ngày | TESTING | CRUD, màu, cả ngày, reminder, tombstone scrub |
| Đồng bộ lịch E2EE theo tài khoản | TESTING | `calendarEvents` nằm trong `SYNC_TABLES` |
| Notification khi app đang chạy | TESTING | kiểm tra mỗi 30 giây, biên nhận local theo thiết bị |
| Web Push khi app đóng | TESTING | Supabase Edge Function + pg_cron + delivery receipt theo endpoint; cần cấu hình VAPID/Supabase thực tế |
| PWA shortcut / badge / cài ra màn hình | TESTING | shortcut Hôm nay/Đặt lịch; install prompt trên nền tảng hỗ trợ |
| Native live widget iOS/Android | BLOCKED | PWA không có chuẩn widget native đa nền tảng; cần wrapper/native Swift/Kotlin nếu muốn WidgetKit/App Widget |

---
**Giới hạn hiện tại:** mã hóa và đồng bộ E2EE đã có implementation và regression test source, nhưng vẫn cần CI/QA trên GitHub Pages và iPhone thật trước khi nâng trạng thái TESTING → STABLE. Cộng tác realtime vẫn chưa triển khai.
