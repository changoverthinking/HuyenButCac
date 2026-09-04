# FEATURE MATRIX — Huyền Bút Các 0.19.0

Trạng thái: TODO | IMPLEMENTING | TESTING | STABLE | BLOCKED

## 0. Nền tảng
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| React 19 + Vite + TypeScript strict | STABLE | CI typecheck/build pass |
| Tailwind v4 + CSS variables | STABLE | 20 theme gồm theme sự kiện |
| Zustand stores | STABLE | notes/folders/projects/theme/appearance |
| Dexie workspace DB | STABLE | guest và từng account tách riêng; schema chính v7 |
| Notes/Library/Projects/MindMap/Whiteboard/Calendar | STABLE | desktop + mobile navigation |
| PWA install/offline shell | STABLE | Workbox + update prompt; landscape được phép từ 0.17.1; Cài đặt cuộn/vuốt ổn định hơn từ 0.18.0 |
| i18n | IMPLEMENTING | tiếng Việt chính; chưa có EN/JP đầy đủ |

## 1. Ghi chú
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| CRUD + autosave tuần tự | STABLE | flush pagehide/visibility, chống save race |
| Cây thư mục nhiều cấp | STABLE | tạo thư mục con, rename/delete |
| Drag/drop chuyển thư mục | TODO | backend `moveFolder` đã có |
| Pin/favorite/tag/trash | STABLE | soft delete + hard-delete tombstone |
| Full-text không dấu | STABLE | title/content/tag |
| Rich text cơ bản | STABLE | toolbar hiện dùng `execCommand` |
| Khóa ghi chú AES-GCM | STABLE | key chỉ RAM; regression tests |
| Table / ảnh inline / template | TODO | cần editor mới hoặc extension layer |

## 2. Dự án & viết truyện
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Project/Section/Chapter | STABLE | reorder/move chapter có test |
| Focus Writer | STABLE | rich text, autosave, timer, word count |
| Mục tiêu tổng số từ | STABLE | UI + progress bar |
| Daily goal / typewriter mode | TODO | |
| Kanban + Milestone | STABLE | 5 trạng thái, milestone CRUD |
| Story Bible | STABLE | nhân vật/địa danh/lore/timeline CRUD + Context Pack |
| Story Bible search/reorder/auto-link | TODO | |
| Export Markdown | STABLE | Project + Context Pack |
| PDF/DOCX/HTML/JSON/ZIP export | TODO | |
| Project timeline/calendar view | TODO | |

## 3. Tàng Thư
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Sách/tiểu thuyết/PDF metadata | STABLE | IndexedDB riêng theo workspace |
| PDF reader | STABLE | PDF.js, page navigation, render canvas |
| Last page + pinned page | STABLE | nhớ vị trí đọc local |
| Cover image | STABLE | crop/zoom/position/blur từ 0.17.x |
| Project cover | STABLE | crop/zoom/position/blur |
| Full backup/restore Tàng Thư | STABLE | snapshot giữ metadata + PDF Blob + bìa; cloud backup E2EE khi mở Kho |
| Sync Tàng Thư realtime/auto-merge đa thiết bị | TODO | 0.19 dùng snapshot full-workspace thay vì auto-merge blob |

## 4. Tiểu Nhị AI
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Local Qwen3 0.6B WebGPU | TESTING | lazy load trong Web Worker |
| Online Puter + tool calling | TESTING | model cấu hình được, không nhúng API key |
| RAG Notes/Projects/Story Bible/Library | TESTING | 0.17.1 sửa >20 notes và scope attachment |
| PDF/DOCX/EPUB/TXT/MD/CSV/JSON/XML/HTML | TESTING | document indexing local |
| Image analysis Online | TESTING | file ảnh explicit |
| Long-term memory/history | TESTING | local DB tách workspace |
| Write action confirmation | STABLE | create/update/delete soft phải confirm |
| Avatar Tiểu Nhị tùy chỉnh | STABLE | ảnh 1:1 crop/zoom/blur |
| AI memory/index full cloud backup | STABLE | nằm trong full-workspace backup E2EE |
| AI memory/index realtime sync cloud | TODO | |

## 5. Sơ đồ tư duy
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Nhiều map, node/edge CRUD | STABLE | |
| Project ↔ MindMap sync | STABLE | có regression tests |
| Pan/zoom/pinch/vẽ tay | STABLE | |
| Export PNG/PDF/OPML | TODO | |
| Undo/redo history đầy đủ | TODO | |

## 6. Bảng trắng
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Nhiều board + object CRUD | STABLE | note/text/rectangle/ellipse |
| Move/resize/edit/zoom/pan/pinch | STABLE | |
| Connector | STABLE | |
| Vẽ tay + dash/arrow/smooth/lock | STABLE | |
| Minimap/group/layer/export | TODO | |

## 7. Giao diện / cá nhân hóa
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| 20 theme | STABLE | chọn trong Tài khoản → Cài đặt |
| Reduce motion/high contrast/font scale | STABLE | |
| Ảnh nền chung + từng tab | STABLE | cover/contain/manual, crop/zoom/blur/opacity |
| Ảnh tab công cụ/account/Tiểu Nhị | STABLE | |
| Backup ảnh giao diện giữa thiết bị | STABLE | full-workspace backup E2EE |
| Sync ảnh giao diện realtime | TODO | snapshot backup chưa phải auto-merge |
| MP3 player + Media Session | STABLE | local-only media |

## 8. Bảo mật / Sync
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Workspace isolation | STABLE | regression tests |
| Note lock AES-GCM + PBKDF2 | STABLE | |
| Supabase E2EE sync | TESTING | delta upload; remote cursor khi server 0.19 hỗ trợ, fallback full-pull an toàn |
| Vault reset | TESTING | RPC/migration theo hướng dẫn |
| PIN/biometric | TODO | |
| Realtime collaboration | TODO | Yjs/CRDT chưa triển khai |

## 9. Lịch Vạn Niên
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Dương/Âm/Can Chi | TESTING | regression tests |
| Event + reminder | TESTING | CRUD, E2EE sync, local receipt |
| Notification khi app mở | TESTING | local runtime |
| Web Push khi app đóng | IMPLEMENTING | source có; VAPID deployment hiện chưa cấu hình đầy đủ |
| PWA shortcuts/badge | TESTING | |
| Native widget | BLOCKED | cần native wrapper |

## 10. QA còn cần
| Hạng mục | Trạng thái |
|---|---|
| GitHub Actions build/lint/test/deploy | STABLE |
| iPhone/iPad Safari QA thật | TODO |
| Accessibility audit | TODO |
| Full workspace backup/restore | STABLE |
| Main bundle cold-start optimization | TESTING | Huyền Học lazy khỏi entry path; cần số đo CI 0.19 |
