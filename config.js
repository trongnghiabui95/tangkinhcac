/* =====================================================================
   FILE CẤU HÌNH – bạn chỉ cần sửa file này, không cần đụng tới code khác.
   ===================================================================== */
window.CAU_HINH = {
  // Tên & mô tả mặc định (tab CaiDat trong Sheet sẽ ghi đè nếu có)
  tenWeb: 'Tu Chân Bảo Điển',
  moTaWeb: 'Review truyện Tu Tiên, Huyền Huyễn và Anime bằng tiếng Việt.',

  // ---- LINK CSV CỦA TỪNG TAB ----
  // Cách lấy: Google Sheet > Tệp > Chia sẻ > Công bố lên web > chọn TÊN TAB > chọn "Giá trị được phân tách bằng dấu phẩy (.csv)" > Công bố > copy link.
  // Dán link vào giữa 2 dấu nháy '...'. Để trống TacPham = web dùng dữ liệu mẫu trong thư mục data/mau.
  sheetCsv: {
    TacPham: '',
    AnhTruyen: '',
    NhanVat: '',
    CuocDoi: '',
    QuanHe: '',
    TheLuc: '',
    LoaiTuLuyen: '',
    CapDo: '',
    VatPham: '',
    DiaDiem: '',
    HanhTrinh: '',
    ThuatNgu: '',
    DeCu: '',
    CaiDat: '',
  },

  // Số phút giữ dữ liệu Google Sheet trong trình duyệt trước khi tải lại (dữ liệu mẫu không lưu tạm).
  // Muốn xem ngay thay đổi vừa sửa: mở trang kèm ?lammoi=1 (ví dụ index.html?lammoi=1)
  phutLuuTam: 30,

  // true = ưu tiên file data/db.json do GitHub Actions sinh sẵn (nhanh hơn). Chưa có file thì tự đọc Sheet.
  uuTienBanSinhSan: true,

  // Ảnh hiện khi ảnh trong Sheet bị lỗi hoặc để trống
  anhDuPhong: 'assets/img/anh-du-phong.svg',

  // Kích thước ảnh lấy từ Google Drive (w800 = rộng 800px)
  kichThuocAnhDrive: 'w1200',
};
