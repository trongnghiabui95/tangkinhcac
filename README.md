# Tu Chân Bảo Điển

Web review truyện Tu Tiên / Huyền Huyễn và Anime bằng tiếng Việt: hồ sơ nhân vật, hệ thống cảnh giới, pháp bảo, thế lực, đề cử, thuật ngữ.

🌐 Web: **https://tuchanbaodien.com**

- Toàn bộ mã nguồn và nội dung nằm trong thư mục [`v2/`](v2/) (Astro + MDX + Pagefind).
- Hướng dẫn chi tiết (thêm bài, ảnh, lệnh, đăng web): **[v2/README-V2.md](v2/README-V2.md)**.
- Quy tắc cho người làm / AI: [CLAUDE.md](CLAUDE.md) · Hệ thống thiết kế: [DESIGN.md](DESIGN.md).

## Thêm bài mới (tóm tắt)
1. Tạo file `v2/content/<bo-truyen>/<danh-muc>/<slug>.mdx` theo mẫu trong `v2/README-V2.md` mục 3.
2. Ảnh (nếu có) đặt trong `v2/anh-goc/<bo-truyen>/…`, ghi nguồn trong file.
3. Mở Pull Request: GitHub tự kiểm tra và ghi bảng tóm tắt; Cloudflare tạo bản xem trước.
4. Merge vào `main` → web tự cập nhật sau 2–3 phút.

## Web cũ
Web cũ (HTML + Google Sheet, `trongnghiabui95.github.io/tuchanbaodien`) đã ngừng. Địa chỉ cũ tự chuyển sang trang tương ứng trên web mới. Mã web cũ vẫn xem được trong lịch sử Git (trước Issue #52).
