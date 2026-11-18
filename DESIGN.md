---
version: alpha
name: Tu Chân Bảo Điển
description: Web review truyện Tu Tiên / Huyền Huyễn và Anime tiếng Việt, phong cách cổ phong tiên hiệp. Nền mực xanh đen (mặc định) hoặc giấy dó (sáng), điểm nhấn vàng kim và ngọc bích, họa tiết mây nhẹ, tiêu đề serif Noto Serif, nội dung Be Vietnam Pro. Bố cục kiểu wiki: thẻ bìa dọc 2:3, khung thông tin, mục lục bám theo.
colors:
  # Giao diện tối "tien-hiep" (mặc định). Tên biến trong CSS: token DaisyUI 5 (--color-*)
  primary: "#D4A944"          # vàng kim: link, nút chính, tiêu đề mục, điểm số
  on-primary: "#1B1405"
  secondary: "#3FB59B"        # ngọc bích: link trong infobox/đoạn văn, mốc thời gian
  on-secondary: "#04140F"
  accent: "#C0504D"           # chu sa: con dấu, cảnh báo nhẹ
  neutral: "#0B121A"          # nền trang (--color-base-200)
  surface: "#111A24"          # thẻ, mục (--color-base-100)
  surface-2: "#1B2735"        # nền phụ trong thẻ, khung chờ ảnh (--color-base-300)
  on-surface: "#EBE3CF"
  line: "rgba(212,169,68,.28)" # viền vàng mờ (--vien-vang)
  # Giao diện sáng "ngoc-sang"
  light-primary: "#A87A16"
  light-on-primary: "#FFFFFF"
  light-secondary: "#1F8A72"
  light-neutral: "#F2EBDB"
  light-surface: "#FBF7EE"
  light-surface-2: "#E4DAC4"
  light-on-surface: "#2A2418"
  # Nhãn chuyên mục (giống nhau ở 2 giao diện, chữ trắng)
  tag-tu-tien: "#C9952F"
  tag-anime: "#E0559A"
  tag-nhan-vat: "#4F8FD8"
  tag-the-luc: "#9B6BD6"
  tag-tu-luyen: "#2FA37F"
  tag-vat-pham: "#D0703A"
  tag-phan-dien: "#C84848"
  # Thương hiệu chủ quản yendan (chữ logo)
  yendan-light: "#7A1530"
  yendan-dark: "#FFE9EE"
typography:
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 2.25rem          # h1 trang review/nhân vật (1.5rem trên điện thoại)
    fontWeight: 700
    lineHeight: 1.2
  headline-md:
    fontFamily: Noto Serif
    fontSize: 1.35rem          # h2 tiêu đề mục
    fontWeight: 700
    lineHeight: 1.3
  headline-sm:
    fontFamily: Noto Serif
    fontSize: 1.05rem          # h3 tên thẻ, tên nhân vật
    fontWeight: 700
    lineHeight: 1.3
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.8
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: 1.3
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 13px             # cỡ nhỏ nhất được phép
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: 8px                      # nút, nhãn ô vuông, ảnh nhỏ (--bo-goc-nho)
  md: 14px                     # thẻ bài, mục, infobox (--bo-goc-the)
  full: 9999px                 # nhãn chuyên mục, chip nhân vật, ảnh tròn
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  gutter: 16px
  max-width: 1240px            # --rong-toi-da
  touch: 44px
components:
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
  cover-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
  tag:
    rounded: "{rounded.full}"
    typography: "{typography.label-sm}"
  infobox:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
  section:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 20px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    height: 44px
  page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
  page-light:
    backgroundColor: "{colors.light-neutral}"
    textColor: "{colors.light-on-surface}"
---

# Tu Chân Bảo Điển — hệ thống thiết kế

File này mô tả giao diện cho mọi AI agent (Claude Code, Codex…) và người làm web. Phần token ở đầu file là giá trị chuẩn; phần chữ bên dưới giải thích **khi nào và vì sao** dùng. Giá trị thật nằm ở đầu `assets/css/giao-dien.css` (khối `:root`, `[data-theme="tien-hiep"]`, `[data-theme="ngoc-sang"]`); hai nơi phải khớp nhau. Định dạng theo [google-labs-code/design.md](https://github.com/google-labs-code/design.md), cùng khuôn với `DESIGN.md` của Hôm Nay Nấu Gì.

**Đọc file này trước khi sửa bất cứ thứ gì nhìn thấy được.** Sau khi sửa, chạy mục [Kiểm tra giao diện](#kiểm-tra-giao-diện).

## Overview

Hình mẫu: **một bộ bảo điển tu chân**: sách cổ quý, ánh đèn vàng trên nền mực, mỗi quyển (tác phẩm) có bìa dọc và một tờ thông tin kiểu wiki. Người đọc là fan tu tiên/anime, đọc trên điện thoại buổi tối, muốn biết nhanh: truyện có hay không, nhân vật là ai, cảnh giới thế nào, rồi đào sâu bằng các liên kết.

Đặc điểm nhận diện:
- **Thư viện:** Tailwind v4 (browser) + DaisyUI 5 qua CDN, ghim phiên bản. Màu và bo góc đi qua token DaisyUI (`--color-*`, `--radius-*`); mọi ghi đè nằm trong `giao-dien.css` (không nằm trong `@layer` nên luôn thắng).
- **Phong cách cổ phong:** nền tối mực xanh đen là **mặc định**; giao diện sáng "giấy dó" bật bằng nút ☀/☾, lưu ở `localStorage` `tkc-giao-dien`.
- **Chữ:** tiêu đề Noto Serif 700 (có tiếng Việt, gợi sách cổ); nội dung Be Vietnam Pro. Chữ Hán chỉ dùng trên ảnh/logo, không dùng làm chữ giao diện.
- **Màu:** vàng kim là màu nhấn chính (link, nút, tiêu đề mục, điểm), ngọc bích cho liên kết trong đoạn văn và mốc thời gian, chu sa cho con dấu. Nhãn chuyên mục có màu riêng, luôn kèm chữ.
- **Ảnh là nhân vật chính:** bìa dọc 2:3, ảnh nhân vật 3:4. Ưu tiên ảnh chính thức có ghi nguồn (`nguon_anh`); không có thì tranh minh họa thủy mặc tự vẽ (`tools/ve_anh_mau.py`), không dùng ảnh giả trộn lẫn ảnh thật.
- **Họa tiết mây** trên nền trang là lựa chọn có chủ đích của chủ dự án (yêu cầu ban đầu): giữ thật mờ (≤ 7% độ đậm), không thêm họa tiết khác.
- **Thương hiệu chủ quản yendan** chỉ xuất hiện ở chân trang ("Một sản phẩm của yendan"); thanh menu chỉ dùng logo Tu Chân Bảo Điển: **quyển bảo điển mở, phía trên là ngọn linh khí ngọc bích, trên nền tròn vàng kim** (`assets/img/logo.svg`, không dùng chữ Hán). Con dấu thương hiệu trên tranh tự vẽ là chữ **TCBĐ**.

Trang review và trang nhân vật là trang **để đọc**: ưu tiên rõ ràng, liên kết chính xác; trang chủ được phép sinh động hơn ở banner trượt.

## Colors

- `{colors.primary}` (vàng kim) cho tiêu đề mục, nút chính, điểm số, mục lục đang xem. Trên nền sáng dùng `{colors.light-primary}` đậm hơn để đạt tương phản.
- `{colors.secondary}` (ngọc bích) cho link nằm trong infobox và đoạn văn (gạch chân), mốc timeline.
- Nhãn chuyên mục (`tag-*`) luôn có chữ ("Tu Tiên", "Anime", "Phản diện"…). Không truyền thông tin chỉ bằng màu.
- Chữ phụ dùng `on-surface` với độ mờ ≥ 60%; không đặt chữ mờ lên ảnh.
- Chữ trên ảnh (banner, đầu trang review) dùng chữ kem `#FFF6DC` trên lớp ảnh đã làm tối (`brightness(.4)`): đây là ngoại lệ có ghi chú.
- Mọi màu phải là biến CSS. Không viết hex/rgba trực tiếp trong quy tắc thành phần (xem Known Gaps).
- Mỗi màu ở giao diện tối phải có bản sáng tương ứng.

## Typography

- Chữ thân 16px, giãn dòng 1.8 (đoạn văn review dài).
- Thang chữ: h1 2.25rem (điện thoại 1.5rem), h2 1.35rem, h3 1.05rem, thân 1rem, nhãn 0.875rem, **nhỏ nhất 13px**.
- Đúng **một `h1` mỗi trang**, tiêu đề không nhảy cấp. Tiêu đề review dạng `[Review] Tên truyện | Cốt truyện, Nhân vật, Thế giới`; trang nhân vật `Tên | Tiểu sử, Sức mạnh, Mối quan hệ`.
- Đoạn văn dài tối đa ~70 ký tự mỗi dòng.
- Tên truyện/nhân vật dài phải xuống dòng gọn (thẻ cắt 2 dòng `line-clamp`).
- Không dùng chữ IN HOA giãn chữ cho nhãn nhỏ.
- Văn bản: tiếng Việt có dấu, xưng "bạn", câu ngắn. Không từ rỗng ("tuyệt vời", "đỉnh cao"), không bịa số liệu.

## Layout

- Ưu tiên điện thoại 360–390px rồi mở rộng. Khung tối đa `{spacing.max-width}`, lề `{spacing.gutter}`.
- Khoảng cách theo thang `4 / 8 / 12 / 16 / 24 / 32 / 48px`.
- Không cuộn ngang ở bất kỳ độ rộng 320–1920px. Dải nhân vật nổi bật và tab thể loại là hàng vuốt ngang có chủ đích.
- Lưới thẻ bìa: 2 cột điện thoại, 3 cột từ 640px, 4 cột từ 768px, 5 cột từ 1024px.
- Trang review (≥ 1024px): 3 cột `mục lục 230px | nội dung | infobox 300px`; điện thoại: infobox lên đầu, mục lục thu gọn thành ô bấm mở.
- Trang nhân vật: `nội dung | infobox 320px`; điện thoại infobox lên đầu.
- Mục không có dữ liệu thì **ẩn hẳn** (kể cả dòng mục lục), không để khung trống.

## Elevation & Depth

- Ba tầng: trang (`neutral`) → mục/thẻ (`surface`, viền vàng mờ 1px + bóng nhẹ `--bong-the`) → nền phụ trong thẻ (`surface-2`).
- Không lồng thẻ có bóng trong thẻ có bóng; khối con trong mục dùng nền `surface-2` (`.bac-the`), không bóng.
- Thanh menu dính trên cùng, nền `surface` 88% (xem Known Gaps về kính mờ).

## Shapes

- Bo góc: `sm` 8px (nút, ảnh nhỏ), `md` 14px (thẻ, mục, infobox), `full` (nhãn, chip, ảnh tròn nhân vật).
- Ảnh: bìa 2:3, nhân vật 3:4 (đầu ảnh ở trên – `object-position: top` trong thư viện ảnh nhân vật), logo/vật phẩm vuông, ảnh cảnh 3:2. Luôn `object-fit: cover`, có `aspect-ratio` để không nhảy bố cục, `loading="lazy"` trừ ảnh đầu trang.
- Icon: Lucide (cùng bộ nét). Không dùng emoji làm icon tính năng.

## Components

- **Thẻ tác phẩm** (`UI.workCard`): bìa 2:3, nhãn loại góc trên trái, điểm ★ góc trên phải, tên serif 2 dòng, ngày đăng.
- **Thẻ nhân vật** (`UI.charCard`): ảnh 3:4, nhãn vai trò (Phản diện màu `tag-phan-dien`), tên, biệt danh hoặc ghi chú quan hệ.
- **Chip nhân vật** (`UI.chip`): ảnh tròn 44px + tên, dùng trong danh sách thành viên, chủ sở hữu, nhân vật tiêu biểu.
- **Infobox** (`.infobox`): tiêu đề nền gradient vàng–ngọc nhạt, ảnh, bảng `th` vàng / `td`, dòng ngăn nét đứt; dòng nào trống thì bỏ.
- **Mục nội dung** (`.muc`): h2 serif vàng + icon, gạch dưới mảnh.
- **Mục lục** (`.muc-luc`): dính khi cuộn, tô sáng mục đang xem.
- **Spoiler**: phần sau dòng `[spoiler]` bị làm mờ, nút "Hiện phần có spoiler".
- **Bậc thang cảnh giới** (`.bac`): số tròn vàng + thẻ cảnh giới + chip nhân vật ở cảnh giới đó, nối bằng vạch 2px.
- **Dòng thời gian** (`.dong-thoi-gian`): chấm tròn viền ngọc, nhãn địa điểm + nhãn cảnh giới.
- **Ghi nguồn ảnh** (`UI.nguon`): dòng nghiêng nhỏ "Ảnh: …" dưới ảnh và trong chú thích khi phóng to.
- **Logo yendan** (chân trang): SVG nội tuyến `YENDAN` trong `layout.js`, cao 32px, chữ `currentColor` (`--mau-yendan`), quả cherry `#D21F3C`, lá xanh. Bộ gốc ở `assets/img/thuong-hieu/`.
- **Trạng thái rỗng**: nói cái gì trống và làm gì tiếp ("Chưa có tác phẩm nào. Hãy thêm dòng vào tab TacPham.").
- **Lỗi tải dữ liệu**: khung `alert-error` nói nguyên nhân và cách sửa (`config.js`, `?lammoi=1`).
- **Khung chờ** (`.cho`): khối phẳng nhấp nháy nhẹ đúng hình dạng nội dung sắp hiện.

## Do's and Don'ts

Nên:
- Dùng token có sẵn; thiếu thì thêm token vào `giao-dien.css` trước.
- Thử dữ liệu xấu nhất: tên rất dài, tác phẩm không có nhân vật, ảnh hỏng link, 320px, cả hai giao diện.
- Mỗi PR giao diện kèm ảnh chụp 390px sáng và tối (ảnh tải lên thư mục Drive "Anh PR Tang Kinh Cac", nhúng vào bình luận PR).
- Ghi nguồn mọi ảnh không tự vẽ.

Không được:
- Sao chép nội dung, ảnh, quảng cáo của thuvienanime.net hay trang khác.
- Thêm framework/thư viện nặng hoặc font mới khi chủ dự án chưa đồng ý.
- Chữ gradient, gradient tím–xanh, quầng sáng trang trí ngoài các vị trí đã có.
- Thêm sọc màu dày ở cạnh trái thẻ/tiêu đề mới (các chỗ cũ nằm trong Known Gaps).
- Emoji làm icon; nhãn IN HOA giãn chữ; nối mọi thông tin bằng "·".
- Giấu nội dung bằng `opacity: 0` chờ script mà không có đường lui khi JS lỗi.

## Motion

```yaml
motion:
  duration-press: 120ms
  duration-state: 200ms       # hover, đổi giao diện
  duration-enter: 600ms       # AOS hiện dần (đã đặt trong UI.refresh)
  ease-out: cubic-bezier(0.23, 1, 0.32, 1)
```

- Hiện dần khi cuộn (AOS, `once: true`) là yêu cầu của chủ dự án: chỉ dùng cho khối/thẻ, không cho chữ trong đoạn; phải gọi `AOS.refresh()` sau khi bố cục đổi (đã có trong `layout.js`).
- Banner tự trượt 5 giây/lần, dừng khi người dùng chạm.
- Chỉ animate `transform` và `opacity`. Không `transition: all`.
- `prefers-reduced-motion`: tắt AOS, tắt banner tự trượt, giữ đổi màu ngắn (xem Known Gaps).

## Kiểm tra giao diện

Chạy sau mỗi thay đổi nhìn thấy được. **Floor** sai thì chưa mở PR; **Reflex** sai thì sửa hoặc ghi lý do trong PR; **Finish** soi bằng mắt.

Ma trận: độ rộng 320, 390, 768, 1280 · giao diện tối (mặc định) và sáng (`localStorage` `tkc-giao-dien` = `ngoc-sang`) · trang chủ, review, nhân vật, danh sách, id không tồn tại.

**Floor**
1. Không cuộn ngang: `document.documentElement.scrollWidth <= innerWidth`.
2. Vùng bấm ≥ 44×44px cho `a, button, select, input` (trừ link trong đoạn văn và trong bảng infobox).
3. Tương phản chữ ≥ 4.5:1 (chữ lớn ≥ 3:1) ở cả hai giao diện.
4. Nhấn Tab: mọi phần tử nhận focus thấy rõ vòng focus.
5. Cỡ chữ tính toán ≥ 13px.
6. Ảnh có `alt`, có tỉ lệ giữ chỗ; ảnh hỏng tự thay ảnh dự phòng.
7. Đúng một `h1`, tiêu đề không nhảy cấp.
8. `node tools/kiem-tra/e2e.mjs`: mọi dòng `OK`, `errors: []` (workflow `kiem-tra` chạy tự động trên PR).

**Reflex** (dò nhanh trong `giao-dien.css`)
- `transition: all`; animate `width|height|top|left`.
- `border-left` dày hơn 1px mới thêm.
- Hex/rgba ngoài các khối token.
- `:hover` không nằm trong `@media (hover: hover)`.

**Finish**
- Chụp 390px tối và sáng (`deviceScaleFactor` 2).
- Phép thử nheo mắt: vẫn nhận ra bìa, tiêu đề, điểm, các nhóm.
- Chấm 5 mặt, mỗi mặt 0–4: Truy cập · Hiệu năng · Token và hai giao diện · Responsive · Nhất quán. Ghi tổng /20 vào mô tả PR. Mục tiêu ≥ 16/20.

## Known Gaps

Đo ngày 2026-11-18 (trang chủ, review, nhân vật × 320/390/1280 × tối/sáng). Sửa dần, mỗi PR một nhóm:

1. **Trang chủ không có `h1`** (0 ở mọi độ rộng): thêm h1 (có thể ẩn chữ, giữ cho trình đọc màn hình) "Tu Chân Bảo Điển – Review truyện Tu Tiên, Huyền Huyễn và Anime".
2. **Vùng bấm nhỏ hơn 44px**: 19–28 phần tử ở trang chủ, 42–50 ở review, 36–46 ở nhân vật (nút `btn-sm/xs`, nhãn thể loại là link, nút A–Z, chip).
3. **Chữ nhỏ hơn 13px**: 11px (dòng nguồn ảnh `text-[11px]`), 11.5px (nhãn `.nhan`), 12px (`text-xs`: ngày đăng, chú thích): nâng lên 13px.
4. **Sọc trái**: `.tieu-de-khoi h2::before` 6px, `.cau-noi` 4px, `.muc-luc a.dang-xem` 2px.
5. **Kính mờ** `backdrop-filter: blur(10px)` ở thanh menu: cân nhắc nền đặc.
6. **Hover** chưa bọc `@media (hover: hover)`; hover phóng to ảnh (`scale(1.05–1.06)`) ở thẻ bìa, ảnh tròn, thư viện ảnh.
7. **Chưa xử lý `prefers-reduced-motion`** (AOS, banner tự trượt, cuộn mượt).
8. **Màu viết trực tiếp** ngoài khối token: 8 chỗ (nhãn điểm `.the-diem`, chữ kem trên ảnh `#FFF6DC`/`#F5D27A`, họa tiết mây trong `url()`).
9. **Nội dung chờ JS**: toàn bộ trang dựng bằng JavaScript, tắt JS thì trống. Giai đoạn 3 (trang tĩnh, Issue #10) sẽ khắc phục.

## Nguồn tham khảo

Khuôn file và bộ kiểm tra Floor/Reflex/Finish theo `DESIGN.md` của Hôm Nay Nấu Gì (cùng chủ dự án), vốn tổng hợp từ google-labs-code/design.md (Apache-2.0), pbakaus/impeccable (Apache-2.0), nutlope/hallmark (MIT), emilkowalski/skills (MIT). Không chép mã.
