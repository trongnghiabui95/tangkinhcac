# Tàng Kinh Các – quy tắc dự án

Web review truyện Tu Tiên / Huyền Huyễn và Anime bằng tiếng Việt. Chủ dự án **không chuyên lập trình**: mọi giải thích, mô tả PR, hướng dẫn đều viết tiếng Việt, rõ ràng, từng bước.

**Trước khi sửa bất cứ thứ gì nhìn thấy được: đọc `DESIGN.md`** (token, quy tắc, bộ kiểm tra giao diện Floor/Reflex/Finish).

## Ngăn xếp
- **HTML + CSS + JavaScript thuần**, không framework, **không bước build bắt buộc** (mở bằng `python3 -m http.server` là chạy).
- Thư viện chỉ nạp qua CDN, ghim phiên bản cụ thể: Tailwind v4 browser, DaisyUI 5, Alpine.js, Swiper, GLightbox, PapaParse, AOS, Lucide (giai đoạn sau: Fuse.js, vis-network).
- Dữ liệu: Google Sheet công bố CSV (link trong `config.js`) → `assets/js/data.js`. Khi chưa có link thì dùng `data/mau/*.csv`.
- Ảnh: Google Drive (link chia sẻ) hoặc link ảnh thường; ảnh mẫu trong `assets/img/mau/`.
- Deploy: GitHub Pages qua `.github/workflows/deploy.yml` (push lên `main`).

## Cấu trúc thư mục
```
*.html                    mỗi loại trang 1 file (index, review, nhan-vat, danh-sach, the-luc, tu-luyen, tim-kiem, de-cu, thuat-ngu, kiem-tra)
config.js                 link CSV từng tab + cài đặt
assets/css/giao-dien.css  biến màu/font/bo góc ở đầu file, rồi tới bố cục
assets/js/data.js         tải dữ liệu, lưu tạm localStorage 30 phút, hàm DB.getWork(), DB.getCharacter()…
assets/js/layout.js       menu, chân trang, sáng/tối, mẫu thẻ dùng chung (UI.*)
assets/js/trang/*.js      mã riêng từng trang
data/mau/*.csv            dữ liệu mẫu (sinh bởi tools/tao_du_lieu_mau.py – sửa script rồi chạy lại, đừng sửa tay CSV)
tools/                    script phụ: dữ liệu mẫu, vẽ ảnh, kiem-tra/ (kiểm thử)
.github/workflows/        deploy.yml (đăng web), kiem-tra.yml (kiểm thử PR)
```

## Quy tắc dữ liệu
- Cột `id`: **viết thường, không dấu, nối bằng gạch ngang** (`han-lap`, `hoang-phong-coc`), không trùng trong cùng tab.
- Cột `..._id` / `..._ids` chỉ chứa id; nhiều id cách nhau bằng dấu phẩy.
- Đoạn văn dài: xuống dòng trong ô = đoạn mới. `tom_tat` có dòng `[spoiler]` để chia phần che.
- Thêm cột mới: cập nhật cùng lúc `tools/tao_du_lieu_mau.py` (COT + dữ liệu + giải thích `_HuongDan`), chạy lại script để sinh `data/mau/*.csv` và `Tang-Kinh-Cac-Mau.xlsx`, cập nhật `HUONG-DAN.md`. Dữ liệu cũ không có cột mới vẫn phải chạy bình thường.
- Mục nào không có dữ liệu thì tự ẩn (kể cả dòng trong mục lục).

## Quy tắc ảnh
1. Ưu tiên ảnh trên mạng (poster/ảnh chính thức, bìa gốc, ảnh phim; ví dụ API wiki Fandom `api.php?action=query&prop=pageimages|imageinfo`).
2. Không tìm được thì tự vẽ bằng `tools/ve_anh_mau.py` → `node tools/chup_anh.js`.
3. Luôn ghi nguồn ở cột `nguon_anh`.
4. Cắt đúng tỉ lệ: bìa 2:3 (hoặc 3:4), nhân vật 3:4 lấy mặt làm tâm, logo/vật phẩm vuông 400px, cảnh/bản đồ ngang ≤ 1400px.
5. Tải lên thư mục Drive "Anh Tang Kinh Cac" (id `1cYx0rRSr3Zv0Yl6ytn4oGl0N4N51l0N1`), ghi link vào `tools/link_anh_drive.json`.

## Điều cấm
- **Không sửa link Google Sheet trong `config.js`** (chỉ chủ dự án sửa).
- **Không thêm thư viện nặng** hay bước build bắt buộc; không thêm framework (React, Vue…).
- **Không đụng dữ liệu thật** (Google Sheet, Drive của chủ dự án) khi chưa được yêu cầu; chỉ sửa dữ liệu mẫu.
- Không sao chép nội dung/ảnh/quảng cáo của thuvienanime.net.
- Không push thẳng lên `main` khi làm Issue.

## Quy trình làm Issue → PR
1. **1 Issue = 1 PR.** Nhánh `dev/<so-issue>-<ten-ngan>` (ví dụ `dev/7-trang-the-luc`). Gắn nhãn `dang-lam` cho Issue khi bắt đầu.
2. Tôn trọng mục **Phụ thuộc** của Issue; Issue có nhãn `bi-chan` thì bỏ qua cho tới khi nhãn được gỡ.
3. Trước khi mở PR, chạy trên máy:
   ```bash
   python3 tools/kiem-tra/doc_csv.py
   node tools/kiem-tra/e2e.mjs        # cần Playwright
   ```
   Kết quả phải `errors: []`.
4. Mô tả PR (tiếng Việt): `Closes #<số>`, đã làm gì, cách kiểm tra từng tiêu chí, ảnh chụp màn hình trước/sau (với thay đổi giao diện), kết quả chạy thử trên máy.
5. Workflow `kiem-tra` phải xanh. Chủ dự án là người merge. Đổi nhãn Issue sang `cho-duyet` khi PR sẵn sàng.
