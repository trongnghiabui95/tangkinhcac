# Hướng dẫn cài đặt "Tàng Kinh Các" (dành cho người không chuyên)

Bạn sẽ làm 5 việc, mỗi việc chỉ cần trình duyệt web:

| # | Việc | Thời gian |
|---|------|-----------|
| A | Đưa file Sheet mẫu lên Google Sheets | 5 phút |
| B | Công bố từng tab ra CSV và dán link vào `config.js` | 15 phút |
| C | Tạo thư mục ảnh trên Google Drive | 5 phút |
| D | Bật GitHub Pages (code đã có sẵn trên GitHub) | 3 phút |
| E | (Tuỳ chọn) Gắn tên miền riêng | 15 phút + chờ |

> 💡 Chưa làm bước B thì web vẫn chạy bằng **dữ liệu mẫu** có sẵn, nên bạn có thể làm bước D trước để xem web.

---

## A. Đưa file Sheet mẫu lên Google Sheets

1. Vào https://drive.google.com và đăng nhập Gmail.
2. Bấm **+ Mới** → **Tải tệp lên** → chọn file `Tang-Kinh-Cac-Mau.xlsx`.
3. Nhấp đúp vào file vừa tải lên, file mở bằng Google Trang tính.
4. ⚠️ Quan trọng: bấm **Tệp → Lưu dưới dạng Google Trang tính**. Một bản Google Sheet mới sẽ mở ra. **Từ giờ chỉ dùng bản mới này** (biểu tượng màu xanh lá, không có chữ XLSX). Có thể xoá file .xlsx cũ.
5. Đổi tên file tuỳ ý, ví dụ "Tàng Kinh Các – Dữ liệu".

File có 14 tab dữ liệu (TacPham, NhanVat, …) và 1 tab `_HuongDan` giải thích cách nhập từng cột.

**Quy tắc vàng khi nhập:**
- Không đổi tên tab, không đổi tên cột ở dòng 1.
- Cột `id` viết thường, không dấu, nối bằng gạch ngang: `han-lap`, `hoang-phong-coc`.
- Cột kết thúc bằng `_id` / `_ids` chỉ ghi **id**, nhiều id cách nhau bằng dấu phẩy.
- Muốn xuống dòng trong ô: bấm **Ctrl + Enter** (Mac: **⌘ + Enter**).

---

## B. Công bố từng tab ra CSV và dán link vào `config.js`

Việc này làm **14 lần**, mỗi tab một lần, nhưng rất nhanh.

1. Trong Google Sheet: **Tệp → Chia sẻ → Công bố lên web**.
2. Ở ô thứ nhất (đang ghi "Toàn bộ tài liệu") chọn **tên tab**, ví dụ `TacPham`.
3. Ở ô thứ hai (đang ghi "Trang web") chọn **Giá trị được phân tách bằng dấu phẩy (.csv)**.
4. Bấm **Công bố** → **OK**. Một đường link hiện ra, dạng
   `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=123456&single=true&output=csv`
5. Bấm vào link để chọn hết rồi copy (Ctrl + C).
6. Mở file `config.js`, dán link vào đúng dòng của tab đó, giữa hai dấu nháy:
   ```js
   TacPham: 'https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv',
   ```
7. Làm tiếp với tab sau: đổi ô thứ nhất sang tab khác, chọn lại CSV, copy link mới, dán vào dòng tương ứng.
8. Mở mục **Nội dung và cài đặt đã công bố** (phía dưới hộp thoại) và đảm bảo ô **Tự động công bố lại khi có thay đổi** đã được tích.

> ✅ Kiểm tra nhanh: dán link vào thanh địa chỉ trình duyệt. Nếu thấy chữ (hoặc trình duyệt tải về file .csv) là đúng.
> ⏱ Sau khi sửa Sheet, Google cần **khoảng 5 phút** để cập nhật bản công bố. Trình duyệt của bạn còn lưu dữ liệu cũ thêm tối đa 30 phút. Muốn xem ngay, thêm `?lammoi=1` vào cuối địa chỉ, ví dụ `.../index.html?lammoi=1`.

> Công bố lên web nghĩa là ai có link cũng xem được nội dung Sheet. Đừng để thông tin riêng tư trong file này.

---

## C. Tạo thư mục ảnh trên Google Drive

> ✅ **Đã làm sẵn:** thư mục **Anh Tang Kinh Cac** trên Drive của bạn đã có 13 ảnh minh họa mẫu và đã chia sẻ "Bất kỳ ai có đường liên kết": https://drive.google.com/drive/folders/1cYx0rRSr3Zv0Yl6ytn4oGl0N4N51l0N1 . File `Tang-Kinh-Cac-Mau.xlsx` đã điền sẵn link Drive của các ảnh này. Khi thêm truyện mới, cứ bỏ ảnh vào đúng thư mục đó rồi làm từ bước 4.

1. Trong Google Drive: **+ Mới → Thư mục mới**, đặt tên `Anh Tang Kinh Cac`.
2. Nhấp chuột phải vào thư mục → **Chia sẻ** → **Chia sẻ**.
3. Ở mục **Quyền truy cập chung** chọn **Bất kỳ ai có đường liên kết**, vai trò **Người xem** → **Xong**.
   Mọi ảnh bạn bỏ vào thư mục này sẽ tự được chia sẻ theo.
4. Kéo thả ảnh vào thư mục. Nên đặt tên dễ nhớ, ví dụ `han-lap.jpg`, `bia-pham-nhan-tu-tien.jpg`.
5. Lấy link một ảnh: nhấp chuột phải vào ảnh → **Chia sẻ** → **Sao chép đường liên kết**.
   Link có dạng `https://drive.google.com/file/d/1AbC...xyz/view?usp=sharing`.
6. Dán nguyên link đó vào ô ảnh trong Sheet (`anh_bia`, `anh`, `logo`, `anh_ban_do`, `link_anh`). Web tự đổi sang dạng hiển thị được.

**Gợi ý kích thước:** ảnh bìa dọc tỉ lệ 2:3 (ví dụ 600×900), ảnh nhân vật 3:4 (600×800), logo hình vuông, bản đồ ngang. Nên dưới 1 MB/ảnh để web nhanh.
**Ảnh lỗi?** Web sẽ hiện ảnh "Chưa có ảnh". Hãy kiểm tra lại quyền chia sẻ của thư mục.
Ô ảnh cũng nhận link ảnh thường (`https://...jpg` từ Cloudinary, GitHub…), nên sau này muốn đổi nơi lưu ảnh cũng không phải sửa code.

---

## D. Đưa code lên GitHub và bật GitHub Pages

### D1. Code đã có sẵn trên GitHub
Toàn bộ code đã được đưa lên repo **https://github.com/trongnghiabui95/tangkinhcac** (nhánh `main`). Bạn không cần tải file bằng tay.

> Muốn sửa `config.js` sau này: vào file trên GitHub → bấm biểu tượng ✏️ → sửa → **Commit changes**. Web tự cập nhật sau 1–2 phút.

> Nếu sau này bạn tạo repo mới khác: bấm **uploading an existing file** trong repo, kéo thả toàn bộ file vào. Riêng thư mục ẩn `.github` thường không được kéo theo; tạo bằng **Add file → Create new file**, đặt tên `.github/workflows/deploy.yml`, rồi dán nội dung file đó vào.

### D2. Bật GitHub Pages (làm 1 lần)
1. Trong repo: **Settings** → menu trái **Pages**.
2. Mục **Build and deployment → Source** chọn **GitHub Actions**.
3. Sang tab **Actions** → chọn **Đăng web lên GitHub Pages** → **Run workflow** → **Run workflow**.
4. Chờ biểu tượng chuyển sang ✅ xanh (khoảng 1 phút). Web của bạn ở địa chỉ:
   **`https://trongnghiabui95.github.io/tangkinhcac/`**

Từ giờ, mỗi lần bạn sửa file trên GitHub, web tự đăng lại. **Sửa nội dung trong Google Sheet thì không cần làm gì trên GitHub cả.**

---

## E. (Tuỳ chọn) Gắn tên miền riêng

1. Mua tên miền (ví dụ ở Mắt Bão, PA Việt Nam, Tenten, Namecheap…), ví dụ `tangkinhcac.vn` hoặc `tangkinhcac.net` (lưu ý: `tangkinhcac.com` đã có người dùng).
2. Vào trang quản lý DNS của nơi bán tên miền, thêm các bản ghi:

   | Loại | Tên (Host) | Giá trị |
   |------|-----------|---------|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | trongnghiabui95.github.io |

3. Trên GitHub: **Settings → Pages → Custom domain**, gõ `www.tangkinhcac.vn` → **Save**.
4. Chờ từ vài phút tới 24 giờ để DNS cập nhật, rồi tích **Enforce HTTPS**.

---

## F. Thêm truyện mới hoặc nhân vật mới (không cần sửa code)

### Thêm một truyện
1. **Drive:** tải ảnh bìa (và ảnh truyện nếu có) vào thư mục ảnh, copy link.
2. **Tab `TacPham`:** thêm 1 dòng mới.
   - `id`: ví dụ `tien-nghich` (không dấu, không trùng).
   - `loai`: `tu-tien` hoặc `anime`.
   - `the_loai`: `Tu Tiên, Huyền Huyễn` (dùng đúng chữ để hiện trong mục "Đề cử theo thể loại": Tu Tiên, Huyền Huyễn, Kiếm Hiệp, Isekai, Hành Động).
   - `anh_bia`: dán link Drive.
   - `tom_tat`: muốn che spoiler thì thêm một dòng chỉ có chữ `[spoiler]`. Phần dưới dòng đó sẽ bị làm mờ.
   - `noi_bat`: `có` nếu muốn lên banner trang chủ.
   - `ngay_dang`: `2026-11-20`.
3. Các tab khác (tuỳ có dữ liệu tới đâu): `TheLuc`, `LoaiTuLuyen`, `CapDo`, `VatPham`, `DiaDiem`, `HanhTrinh`, `AnhTruyen`. Ở mỗi dòng ghi `tac_pham_id` = `tien-nghich`.
   **Mục nào bỏ trống thì trang review tự ẩn mục đó.**
4. Mở web kèm `?lammoi=1` để xem ngay. Trang mới nằm ở `review.html?id=tien-nghich`.

### Thêm một nhân vật
1. Tải ảnh nhân vật lên Drive, copy link.
2. **Tab `NhanVat`:** thêm dòng với `id`, `tac_pham_id`, `ten`, `vai_tro` (`chinh` / `phu` / `lien-quan` / `phan-dien`), `anh`…
   - `the_luc_ids`, `loai_tu_luyen_ids`, `vat_pham_ids`: các id cách nhau bằng dấu phẩy.
   - `cap_do_id`: id cấp độ cao nhất (lấy ở tab `CapDo`).
   - `cau_noi`: mỗi câu một dòng.
3. **Tab `CuocDoi`:** mỗi giai đoạn 1 dòng (`thu_tu` 1, 2, 3…).
4. **Tab `QuanHe`:** mỗi mối quan hệ 1 dòng, **chỉ cần ghi một chiều**.
   Ví dụ `han-lap | mac-dai-phu | su-phu` nghĩa là "Mặc Đại Phu là **sư phụ** của Hàn Lập". Trang của Mặc Đại Phu tự hiện Hàn Lập là **đồ đệ**.
5. **Tab `AnhTruyen`:** ảnh riêng của nhân vật thì điền cả `nhan_vat_id`.
6. Trang mới nằm ở `nhan-vat.html?id=<id>`.

### Lỗi thường gặp
| Hiện tượng | Cách sửa |
|---|---|
| Sửa Sheet rồi mà web chưa đổi | Chờ ~5 phút, rồi mở web kèm `?lammoi=1` |
| Ảnh hiện "Chưa có ảnh" | Thư mục Drive chưa chia sẻ "Bất kỳ ai có đường liên kết", hoặc link dán sai |
| Nhân vật/thế lực không hiện ở trang truyện | `tac_pham_id` gõ sai hoặc thừa dấu cách |
| Liên kết tới người/vật không hiện | id trong cột `..._id(s)` không trùng với id thật (Giai đoạn 2 có trang `kiem-tra.html` liệt kê các lỗi này) |
| Web báo "Không tải được dữ liệu" | Link trong `config.js` sai, hoặc tab chưa được công bố lên web |
