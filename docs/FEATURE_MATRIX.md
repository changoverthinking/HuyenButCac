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
| Chuyển chế độ Notes/Projects/MindMap/Whiteboard | STABLE | tab desktop + thanh điều hướng di động |
| PWA manifest + service worker (vite-plugin-pwa) | STABLE | test offline reload OK trên build local |
| i18n khung (vi mặc định) | IMPLEMENTING | chưa có tiếng Anh/Nhật |

## 1. Ghi chú cơ bản (Giai đoạn 3 — đang làm ở checkpoint này)
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Tạo/sửa/xóa ghi chú, autosave debounce | STABLE | gộp patch tiêu đề+nội dung, debounce 400ms |
| Cây thư mục nhiều cấp, kéo thả | IMPLEMENTING | tạo/xóa/di chuyển folder hoạt động; kéo thả UI TODO |
| Ghim / yêu thích / thẻ (tag) | STABLE | |
| Thùng rác + khôi phục (soft delete) | STABLE | có xóa vĩnh viễn và xác nhận |
| Tìm kiếm full-text (tiêu đề + nội dung, có/không dấu) | STABLE | dùng bỏ dấu tiếng Việt thủ công, index Dexie |
| Rich-text editor (H1-H6, bold/italic/list/checklist/quote/code/table cơ bản) | IMPLEMENTING | dùng contentEditable tự viết tối giản, chưa có TipTap/công thức/menu `/` |
| Bảng trong ghi chú | TODO | |
| Chèn ảnh | TODO | |
| Mẫu ghi chú (template) | TODO | |
| Khóa ghi chú bằng PIN + mã hóa AES-GCM thật | TODO | ưu tiên giai đoạn 7 |
| Undo/redo trong editor | TODO | |

## 2. Viết dự án (Giai đoạn 4 — checkpoint 2)
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Dexie v2 migration (projects/sections/chapters/tasks/milestones) | STABLE | version 1 giữ nguyên, chỉ thêm bảng |
| Tạo/chọn dự án, 4 loại (Phần mềm/Game/Công trình/Chung) | STABLE | chưa có icon/bìa/theme riêng cho từng dự án |
| Cấu trúc Phần→Chương (chưa có "Mục" cấp con của Chương) | IMPLEMENTING | Dự án→Phần→Chương hoạt động; cấp "Mục" trong Chương chưa tách riêng |
| Kéo sắp xếp chương | IMPLEMENTING | có API `reorderChapter` + test, UI kéo-thả bằng chuột chưa làm (chỉ đổi order qua code) |
| Trình viết tập trung (focus mode) | STABLE | ẩn UI khác, đếm từ, đồng hồ phiên viết, autosave 400ms |
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
| Node trung tâm, thêm nhánh, sửa, kéo, xóa đệ quy | STABLE | bảo vệ/tự phục hồi nút trung tâm |
| Connector cong tự cập nhật | STABLE |
| Layout nâng cao, export ảnh/PDF/OPML, undo/redo | TODO |

## 4. Bảng trắng (Giai đoạn 6)
| Hạng mục | Trạng thái |
|---|---|
| Tạo/chọn nhiều bảng, lưu/reload IndexedDB | STABLE |
| Sticky note, text, rectangle, ellipse | STABLE |
| Chọn, kéo, sửa chữ, xóa, zoom, grid | STABLE | vùng soạn chữ chọn được; tay nắm kéo riêng |
| Pan, minimap, connector, vẽ tay, group/layer/export | TODO |

## 5. Bảo mật (Giai đoạn 7)
| Hạng mục | Trạng thái |
|---|---|
| Web Crypto AES-GCM + Argon2id/PBKDF2 | TODO |
| PIN/biometric adapter | TODO |
| Threat model | STABLE (tài liệu) — xem THREAT_MODEL.md |

## 6. Đồng bộ / Cộng tác (Giai đoạn 8)
| Hạng mục | Trạng thái |
|---|---|
| SyncProvider interface (Local/EncryptedCloud) | TODO |
| Realtime collaboration (Yjs) | TODO |

## 7. Hoàn thiện (Giai đoạn 9)
| Hạng mục | Trạng thái |
|---|---|
| Giao diện di động cơ bản | STABLE | bottom nav + menu Notes dạng drawer |
| iPhone Safari QA thật | TODO — vẫn cần kiểm tra trên thiết bị thật |
| Accessibility audit | TODO |
| 6 theme đầy đủ | IMPLEMENTING — tokens đã định nghĩa cho cả 6, UI mới áp dụng đủ cho 2 theme mặc định |

---
**Giới hạn hiện tại:** các chức năng nền tảng của Ghi chú, Viết dự án, Mind map và Bảng trắng đã có. Các hạng mục nâng cao ghi TODO trong bảng, đặc biệt mã hóa thật, đồng bộ và cộng tác, chưa được triển khai.
