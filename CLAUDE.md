# Tàng Kinh Các – ghi chú cho Claude

Web review truyện Tu Tiên / Huyền Huyễn và Anime (tiếng Việt). HTML/CSS/JS thuần, dữ liệu từ Google Sheet (CSV), ảnh trên Google Drive, deploy GitHub Pages qua `.github/workflows/deploy.yml`. Người dùng không chuyên lập trình: giải thích bằng tiếng Việt, từng bước.

## Quy tắc ảnh (người dùng yêu cầu)
1. **Ưu tiên lấy ảnh trên mạng**: poster/ảnh chính thức, bìa gốc, ảnh trong phim (ví dụ wiki Fandom của bộ truyện qua API `api.php?action=query&prop=pageimages|imageinfo`).
2. **Không tìm được thì tự vẽ** bằng `tools/ve_anh_mau.py` (SVG thủy mặc) → `node tools/chup_anh.js` ra JPG.
3. Luôn ghi nguồn vào cột `nguon_anh` (ví dụ "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)", "Minh họa: Tàng Kinh Các").
4. Cắt đúng tỉ lệ: bìa 2:3 (hoặc 3:4), nhân vật 3:4 lấy mặt làm trung tâm, logo/vật phẩm vuông 400px, ảnh cảnh/bản đồ ngang ≤1400px. Bỏ phần chữ/khung thừa.
5. Tải ảnh vào thư mục Drive "Anh Tang Kinh Cac" (id `1cYx0rRSr3Zv0Yl6ytn4oGl0N4N51l0N1`, đã chia sẻ "bất kỳ ai có link"), ghi link vào `tools/link_anh_drive.json`, chạy `python3 tools/tao_du_lieu_mau.py` để cập nhật Excel mẫu + `data/mau/*.csv`.

## Cấu trúc
- `config.js`: link CSV từng tab; `assets/js/data.js`: tải/lưu tạm/tra cứu; `assets/js/layout.js`: menu, mẫu thẻ, `UI.*`; `assets/js/trang/*.js`: từng trang.
- Kế hoạch: Giai đoạn 1 xong; Giai đoạn 2 (Thế Lực, Tu Luyện, Tìm kiếm, Đề Cử, Thuật Ngữ, kiem-tra.html); Giai đoạn 3 (sơ đồ quan hệ, build tĩnh + SEO). Làm xong giai đoạn nào dừng lại cho người dùng xem.
