# QA Mobile Stability Audit — Huyền Bút Các 0.18.0

Ngày audit: 04/09/2026.
Baseline: `main` commit `5d0b28c63855f82da543008c6b08f33c40b76dbb`.

## Phạm vi

Audit source toàn ứng dụng, tập trung vào lỗi tương tác trên điện thoại/iOS được tái hiện qua ảnh người dùng:

1. Banner PWA **“Đã có bản cập nhật mới / Cập nhật ngay”** lệch khỏi màn hình.
2. Form Tử Vi bị nhảy khi nhập/chọn ngày giờ.
3. Bàn Tử Vi bị cắt/kéo ngang trên màn hình điện thoại.
4. Rà các rủi ro cùng loại trên toàn ứng dụng: control iOS dưới 16px, fixed width trong media mobile, import tương đối, cú pháp TS/TSX, cấu trúc CSS và regression engine Huyền Học.

## Lỗi phát hiện và đã sửa

### M01 — Banner cập nhật PWA bị dịch sang trái trên mobile

**Nguyên nhân:** component dùng Tailwind `left-1/2 -translate-x-1/2`. Với Tailwind hiện tại, phần dịch có thể đi qua CSS `translate`, trong khi hotfix mobile chỉ reset `transform`. Sau khi đổi `left/right` sang hai mép màn hình, phép dịch -50% vẫn tồn tại và kéo banner ra ngoài viewport.

**Sửa:**
- Bỏ `left-1/2` / `-translate-x-1/2` khỏi component.
- Dùng class riêng `.hbc-update-prompt` quản lý toàn bộ vị trí.
- Mobile reset cả `transform` và `translate`.
- Tôn trọng `safe-area-inset-left/right/bottom`.
- Bổ sung `role=status`, `aria-live=polite`.
- Khóa double tap khi quá trình cập nhật đang chạy, nút chuyển thành “Đang cập nhật…”.

### M02 — iOS tự zoom/nhảy viewport khi focus input

**Nguyên nhân:** nhiều control trong app, đặc biệt Huyền Học/Tử Vi, kế thừa font dưới 16px. Safari iPhone tự phóng viewport khi focus input/select/textarea có cỡ chữ nhỏ.

**Sửa:** áp rule mobile toàn `.app-shell--figma` để text controls dùng `font-size:16px !important`; không tác động checkbox/radio/range/color. Date/time/datetime-local có chiều cao tối thiểu 44px.

### M03 — Tử Vi tháo toàn bộ form trong lúc date input đang chuyển trạng thái

**Nguyên nhân:** `if (!parsed) return ...` nằm trước JSX form. Khi native date input tạm trả chuỗi rỗng/không hoàn chỉnh, toàn component bị thay bằng thông báo lỗi rồi dựng lại ngay khi có ngày hợp lệ. Đây là một nguồn layout jump độc lập với iOS zoom.

**Sửa:** form luôn được giữ trong DOM; lỗi ngày/giờ chỉ hiện inline bên dưới cấu hình. Không unmount form trong lúc người dùng chỉnh.

### M04 — Ngày không hợp lệ có thể bị JavaScript tự chuẩn hóa

**Nguyên nhân:** `new Date(year, month - 1, day)` tự chuyển các ngày như 31/02 sang tháng sau nếu dữ liệu không đi qua native date picker chuẩn.

**Sửa:** sau khi tạo `Date`, kiểm tra round-trip `year/month/day`; nếu khác dữ liệu nhập thì báo không hợp lệ thay vì lập lá số với ngày bị đổi ngầm.

### M05 — Bàn Tử Vi ép rộng 760–820px trên điện thoại

**Nguyên nhân:** CSS mobile đặt `min-width:820px` và dưới 430px đặt `min-width:760px`. Màn hình 390–430px vì vậy buộc phải horizontal scroll và có thể giữ `scrollLeft` sau khi dữ liệu thay đổi, tạo cảm giác lá số “nhảy” hoặc bị cắt.

**Sửa:**
- Loại bỏ fixed min-width 760/820.
- Mobile dùng `width:100%; min-width:0; max-width:100%`.
- 4 cột co theo viewport.
- `overflow-x:hidden` cho wrapper lá số.
- Header cung, tên sao, badge và metadata được compact/wrap trên mobile để không tạo min-content overflow.

### M06 — Nội dung sao/cung có thể đẩy rộng cell trên mobile

**Nguyên nhân:** tên sao dùng `white-space:nowrap` trong cell rất hẹp.

**Sửa:** trên mobile cho tên sao wrap/overflow-wrap, giảm typography có kiểm soát, badge cho phép wrap và mọi cell có `min-width:0`.

## Audit toàn source

Sau sửa:

- 93 file TypeScript/TSX trong `src` (92 file source không tính `.d.ts`) được parse lại, gồm regression test mobile mới.
- **0 syntax error** TS/TSX.
- **0 missing relative import**.
- 10 stylesheet được kiểm tra cân bằng block/comment/string: **0 CSS brace error**.
- Quét media query mobile: **0 fixed `width/min-width > 430px`** trong breakpoint hẹp.
- Kiểm tra regression source mobile: **12/12 PASS**.
- Semantic TypeScript check riêng cho `UpdatePrompt.tsx`: **PASS**.
- Semantic TypeScript check cho `HuyenHocPanel.tsx` + toàn engine Huyền Học bằng DOM/React type stubs: **PASS**.

## Regression thuật toán

Engine Huyền Học không bị thay đổi bởi hotfix UI. Tuy vậy đã compile strict lại các module thuần và chạy regression:

- `metaphysics.test.ts`: **27/27 PASS** qua runner tương thích Vitest nhẹ.
- Fuzz Tử Vi + Huyền Không: **206.640 assertions PASS**.
- Kiểm tra nhanh Âm lịch/Can Chi/Bát Trạch/Tử Vi/Phi Tinh/Tướng Số: **6/6 PASS**.

## CI baseline của đúng commit main trước hotfix

GitHub Actions run `33836484111` của commit `5d0b28c...` đã hoàn tất **SUCCESS** với các bước:

- `npm ci`: PASS
- Oxlint: PASS
- `tsc -b && vite build`: PASS
- Vitest: PASS
- GitHub Pages deploy: PASS

Hotfix này chỉ thay 5 file UI/CSS; không sửa database, service đồng bộ, engine Huyền Học, Tàng Thư data, Tiểu Nhị data hay schema.

## Giới hạn QA cần nói rõ

Môi trường đóng gói cục bộ không có npm cache đầy đủ và Node hiện tại là 22.16.0, thấp hơn engine của dự án 22.22.2, nên không chạy lại nguyên `npm ci -> lint -> build -> Vitest` tại chỗ sau hotfix. Việc đó sẽ được GitHub Actions chạy lại ngay khi người dùng upload/push patch vào `main`.

Không thể khẳng định “không còn lỗi trên mọi thiết bị” chỉ bằng source audit. Các hạn chế đã ghi trong `docs/KNOWN_ISSUES.md` như Web Push cần VAPID, blob local-only, native widget và QA thiết bị thật vẫn là giới hạn kiến trúc/cấu hình, không phải lỗi UI vừa sửa.

## File thay đổi

- `src/components/common/UpdatePrompt.tsx`
- `src/components/metaphysics/HuyenHocPanel.tsx`
- `src/hotfix-tangthu-mobile.css`
- `src/media-fixes.css`
- `src/metaphysics.css`
- `src/tests/metaphysicsMobileUi.test.tsx`
- `docs/QA_MOBILE_STABILITY_AUDIT_0.18.0.md` (tài liệu audit mới)
