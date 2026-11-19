# Tu Chân Bảo Điển – quy tắc dự án

Web review truyện Tu Tiên / Huyền Huyễn và Anime bằng tiếng Việt: https://tuchanbaodien.com. Chủ dự án **không chuyên lập trình**: mọi giải thích, mô tả PR, hướng dẫn đều viết tiếng Việt, rõ ràng, từng bước.

**Trước khi sửa bất cứ thứ gì nhìn thấy được: đọc `DESIGN.md`** (token, quy tắc, bộ kiểm tra giao diện Floor/Reflex/Finish).

Web cũ (HTML + Google Sheet, GitHub Pages) **đã bị xoá** ở Issue #52. Toàn bộ web nằm trong thư mục `v2/`. GitHub Pages chỉ còn trang chuyển hướng sang Cloudflare (`.github/chuyen-huong/`).

## Ngăn xếp
- **Astro (SSG) + MDX + Pagefind + sharp**, chạy Node 22. Không thêm framework giao diện (React, Vue…) hay thư viện nặng; biểu tượng là SVG Lucide nội tuyến (`v2/src/lib/bieu-tuong.js`).
- Nội dung: file `.mdx` trong `v2/content/` (không còn Google Sheet).
- Ảnh gốc: `v2/anh-goc/<series>/…` → `scripts/process-images.mjs` tự cắt, nén WebP < 80KB lúc build.
- Phông: tự lưu ở `v2/public/phong/` (`scripts/tai-phong-chu.mjs`).
- Đăng web: **Cloudflare Pages** (thư mục gốc `v2`, lệnh `npm run build`, kết quả `dist`, biến `SITE_URL`, `NODE_VERSION`). Merge vào `main` là tự đăng; mỗi PR có bản xem trước.

## Cấu trúc thư mục
```
v2/content/<series>/index.mdx                trang bộ truyện
v2/content/<series>/<category>/<slug>.mdx    bài viết (category: nhan-vat | canh-gioi | cot-truyen | phap-bao | the-luc)
v2/anh-goc/                                  ảnh gốc (bìa, nhân vật, thư viện, bản đồ…)
v2/src/lib/chuan-mdx.mjs                     MỌI giới hạn + danh mục + loại truyện (chỉ khai báo ở đây)
v2/src/{pages,components,layouts,styles}     giao diện
v2/scripts/                                  kiểm tra nội dung, xử lý ảnh, kiểm tra bản build, bảng tóm tắt PR, tải phông
v2/tests/                                    kiểm thử
v2/tools/                                    vẽ ảnh minh họa (ve_anh_mau.py → chup_anh.cjs)
.github/workflows/                           v2-build.yml (kiểm tra PR + bot bảng tóm tắt), deploy.yml (chuyển hướng GitHub Pages)
```

## Chuẩn file .mdx & Zero-Hardcode
- Chuẩn đầy đủ: Issue #27 và `v2/README-V2.md` mục 3 (kể cả các trường tuỳ chọn: loại truyện, đánh giá chi tiết, bản đồ, hành trình, thư viện ảnh, thuật ngữ, đề cử, cuộc đời, quan hệ, bậc cảnh giới…).
- Giới hạn: title 50–65 ký tự, description 140–160, faqs 3–6, thân bài 800–1.200 từ – chỉ khai báo ở `v2/src/lib/chuan-mdx.mjs`.
- `id`/slug/tên thư mục: **viết thường, không dấu, nối bằng gạch ngang**; slug trùng tên file.
- `npm run build` chạy `scripts/kiem-tra-noi-dung.mjs` trước: sai chuẩn là dừng build.
- **Zero-Hardcode**: không viết cứng tên truyện, nhân vật, menu, bảng cảnh giới, đường dẫn bài trong `v2/src/`. Trang, menu, danh sách, JSON-LD, sitemap sinh từ `v2/content/`. Mục nào không có dữ liệu thì tự ẩn (kể cả trong mục lục, menu).
- Thân bài .mdx chỉ Markdown; spoiler dùng `:::spoiler … :::`; không chèn HTML/component.
- Thêm trường mới: khai báo trong `v2/src/content.config.ts` dạng **tuỳ chọn** (nội dung cũ không có vẫn chạy), cập nhật `v2/README-V2.md`.

## Quy tắc ảnh
1. Ưu tiên ảnh trên mạng (poster/ảnh chính thức, bìa gốc, ảnh phim; ví dụ API wiki Fandom `api.php?action=query&prop=pageimages|imageinfo`).
2. Không tìm được thì tự vẽ bằng `v2/tools/ve_anh_mau.py` → `node v2/tools/chup_anh.cjs`.
3. Luôn ghi nguồn (`image_source` / `nguon`). Không thêm bước xoá logo, watermark.
4. Cạnh ngắn ảnh gốc ≥ 600px (bìa ≥ 500px). Tỉ lệ do `process-images.mjs` cắt: nhân vật 3:4, bìa 2:3, pháp bảo/thế lực 1:1, cảnh 16:9, thư viện 3:2 hoặc 3:4.
5. Ảnh gửi chủ dự án/PR: thư mục Drive "Anh Tang Kinh Cac" (id `1cYx0rRSr3Zv0Yl6ytn4oGl0N4N51l0N1`).

## Điều cấm
- **Không thêm thư viện nặng** hay framework giao diện.
- **Không đụng dữ liệu thật** của chủ dự án (Drive, tài khoản Cloudflare…) khi chưa được yêu cầu.
- Không sao chép nội dung/ảnh/quảng cáo của thuvienanime.net.
- Không push thẳng lên `main` khi làm Issue.

## Quy trình làm Issue → PR
1. **1 Issue = 1 PR.** Nhánh `dev/<so-issue>-<ten-ngan>` (ví dụ `dev/7-trang-the-luc`). Gắn nhãn `dang-lam` cho Issue khi bắt đầu.
2. Tôn trọng mục **Phụ thuộc** của Issue; Issue có nhãn `bi-chan` thì bỏ qua cho tới khi nhãn được gỡ.
3. Trước khi mở PR, chạy trong `v2/`:
   ```bash
   npm run build
   node scripts/kiem-tra-dist.mjs
   npm run test:noi-dung && npm run test:seo && npm run test:anh
   bash tests/thu-them-bai.sh
   ```
   Kết quả phải `errors: []` / không lỗi.
4. Mô tả PR (tiếng Việt): `Closes #<số>`, đã làm gì, cách kiểm tra từng tiêu chí, ảnh chụp màn hình trước/sau (điện thoại + máy tính với thay đổi giao diện), kết quả chạy thử trên máy.
5. Workflow `v2-build` phải xanh (bot ghi bảng tóm tắt vào PR). Chủ dự án là người merge. Đổi nhãn Issue sang `cho-duyet` khi PR sẵn sàng.
