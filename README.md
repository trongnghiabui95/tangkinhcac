# Tàng Kinh Các

Web review truyện Tu Tiên / Huyền Huyễn và Anime bằng tiếng Việt. Nội dung lấy từ **Google Sheet**, ảnh lấy từ **Google Drive**, web chạy miễn phí trên **GitHub Pages**.

🌐 Web: **https://trongnghiabui95.github.io/tangkinhcac/**

👉 Hướng dẫn cài đặt từng bước cho người không chuyên: **[HUONG-DAN.md](HUONG-DAN.md)**

## Cấu trúc thư mục

```
tangkinhcac/
├── index.html              Trang chủ
├── review.html             Trang review tác phẩm   (review.html?id=pham-nhan-tu-tien)
├── nhan-vat.html           Trang nhân vật           (nhan-vat.html?id=han-lap; không có id = danh sách)
├── danh-sach.html          Danh sách review         (?loai=tu-tien | ?loai=anime | ?the_loai=Tu Tiên)
├── the-luc.html            ┐
├── tu-luyen.html           │
├── tim-kiem.html           ├ Giai đoạn 2 (hiện là trang "đang xây dựng")
├── de-cu.html              │
├── thuat-ngu.html          ┘
├── config.js               ⭐ FILE CẤU HÌNH – dán link CSV của Google Sheet vào đây
├── assets/
│   ├── css/giao-dien.css   ⭐ Màu sắc, font, bo góc (biến CSS ở đầu file)
│   ├── js/data.js          Đọc dữ liệu, lưu tạm 30 phút, các hàm getWork(), getCharacter()…
│   ├── js/layout.js        Menu, chân trang, nút sáng/tối, mẫu thẻ dùng chung
│   ├── js/trang/*.js       Mã riêng của từng trang
│   └── img/                Ảnh dự phòng + ảnh mẫu
├── data/
│   ├── mau/*.csv           Dữ liệu mẫu (web dùng khi config.js chưa có link Sheet)
│   └── db.json             (Giai đoạn 3) bản dữ liệu do GitHub Actions sinh sẵn
├── tools/
│   └── tao_du_lieu_mau.py  Sinh file Excel mẫu + CSV mẫu + ảnh mẫu
├── Tang-Kinh-Cac-Mau.xlsx  File mẫu để tải lên Google Sheets
└── .github/workflows/deploy.yml   Tự đăng web lên GitHub Pages
```

Giai đoạn 3 sẽ thêm: `tools/build.mjs` (đọc Sheet, kiểm tra lỗi, sinh `/review/ten-truyen/`, `/nhan-vat/ten-nhan-vat/`, `sitemap.xml`, `robots.txt`) và lịch chạy hằng ngày trong workflow.

## Thứ tự lấy dữ liệu (data.js)

1. Bản đã lưu trong trình duyệt (dưới 30 phút; thêm `?lammoi=1` để bỏ qua)
2. `data/db.json` do GitHub Actions sinh sẵn (nếu có)
3. Google Sheet (link CSV trong `config.js`)
4. Dữ liệu mẫu `data/mau/*.csv`

## Chạy thử trên máy

Mở Terminal trong thư mục này rồi chạy `python3 -m http.server 8000`, sau đó vào http://localhost:8000.
(Mở trực tiếp file `index.html` bằng cách nhấp đúp sẽ **không** đọc được dữ liệu vì trình duyệt chặn.)
