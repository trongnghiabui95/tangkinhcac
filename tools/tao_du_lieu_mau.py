# -*- coding: utf-8 -*-
"""
Sinh dữ liệu mẫu cho "Tu Chân Bảo Điển":
  - Tu-Chan-Bao-Dien-Mau.xlsx  (tải lên Google Sheets)
  - data/mau/<Tab>.csv        (web dùng tạm khi chưa nối Google Sheet)
  - Ảnh minh họa: xem tools/ve_anh_mau.py

Chạy:  python3 tools/tao_du_lieu_mau.py
"""
import csv, json, os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.worksheet.datavalidation import DataValidation

GOC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TP = "pham-nhan-tu-tien"
A = "assets/img/mau/"  # ảnh mẫu nằm trong repo; khi dùng thật hãy thay bằng link Google Drive

# ---------------------------------------------------------------- CẤU TRÚC CỘT
COT = {
    "TacPham": ["id", "loai", "ten_viet", "ten_trung", "ten_khac", "tac_gia", "the_loai", "tinh_trang",
                "so_chuong", "so_tap", "so_mua", "nen_tang", "nam", "studio", "diem", "diem_cot_truyen",
                "diem_nhan_vat", "diem_the_gioi", "diem_hinh_anh", "anh_bia", "nguon_anh", "tom_tat", "boi_canh",
                "uu_diem", "nhuoc_diem", "ket_luan", "ost_youtube", "noi_bat", "ngay_dang"],
    "AnhTruyen": ["tac_pham_id", "nhan_vat_id", "link_anh", "nguon_anh", "chu_thich"],
    "NhanVat": ["id", "tac_pham_id", "ten", "biet_danh", "vai_tro", "anh", "nguon_anh", "gioi_tinh", "chung_toc", "tuoi",
                "the_luc_ids", "nghe_nghiep", "loai_tu_luyen_ids", "cap_do_id", "tinh_trang", "xuat_than",
                "tinh_cach", "suc_manh", "vat_pham_ids", "cau_noi", "mo_ta_ngan", "noi_bat"],
    "CuocDoi": ["nhan_vat_id", "thu_tu", "giai_doan", "dia_diem_id", "su_kien", "cap_do_id"],
    "QuanHe": ["nhan_vat_id", "lien_quan_id", "quan_he", "ghi_chu"],
    "TheLuc": ["id", "tac_pham_id", "ten", "loai", "logo", "nguon_anh", "mo_ta", "thu_linh_id", "tru_so_id"],
    "LoaiTuLuyen": ["id", "tac_pham_id", "ten", "mo_ta"],
    "CapDo": ["id", "tac_pham_id", "thu_tu", "ten", "mo_ta"],
    "VatPham": ["id", "tac_pham_id", "ten", "loai", "pham_cap", "anh", "nguon_anh", "mo_ta", "chu_so_huu_id"],
    "DiaDiem": ["id", "tac_pham_id", "ten", "cap", "thuoc_id", "anh_ban_do", "nguon_anh", "mo_ta"],
    "HanhTrinh": ["tac_pham_id", "thu_tu", "dia_diem_id", "su_kien", "cap_do_id"],
    "ThuatNgu": ["id", "ten", "giai_thich", "tac_pham_id"],
    "DeCu": ["thu_tu", "tac_pham_id", "neu_thich_id", "ly_do"],
    "CaiDat": ["ten_web", "mo_ta_web", "logo", "link_fanpage", "link_youtube"],
}

# ---------------------------------------------------------------- DỮ LIỆU MẪU
DL = {}
DL["TacPham"] = [{
    "id": TP, "loai": "tu-tien", "ten_viet": "Phàm Nhân Tu Tiên", "ten_trung": "凡人修仙传",
    "ten_khac": "A Record of a Mortal's Journey to Immortality", "tac_gia": "Vong Ngữ (忘语)",
    "the_loai": "Tu Tiên, Huyền Huyễn, Phiêu Lưu", "tinh_trang": "Hoàn thành", "so_chuong": "2446",
    "so_tap": "", "so_mua": "", "nen_tang": "Khởi Điểm (Qidian)", "nam": "2008", "studio": "",
    "diem": "9.2", "diem_cot_truyen": "9", "diem_nhan_vat": "9.5", "diem_the_gioi": "9.5", "diem_hinh_anh": "8.5",
    "anh_bia": A + "bia-pham-nhan-tu-tien-goc.jpg", "nguon_anh": "Bìa tiểu thuyết gốc (Khởi Điểm)",
    "tom_tat": (
        "Hàn Lập là một thiếu niên nhà nghèo ở vùng quê hẻo lánh, tư chất bình thường, linh căn kém. "
        "Nhờ người chú giới thiệu, cậu được vào Thất Huyền Môn làm đệ tử ký danh và trở thành học trò của Mặc Đại Phu.\n"
        "[spoiler]\n"
        "Hàn Lập sớm nhận ra người thầy có mưu đồ đoạt xá thân thể mình. Bằng sự cẩn trọng và chút may mắn, cậu lật ngược tình thế, "
        "đồng thời có được chiếc bình nhỏ màu xanh bí ẩn – thứ có thể thúc chín linh thảo.\n"
        "Từ đó Hàn Lập bước vào giới tu tiên: gia nhập Hoàng Phong Cốc, liều mạng trong Huyết Sắc Cấm Địa để có cơ duyên Trúc Cơ, "
        "rồi phiêu bạt khắp Thiên Nam. Mỗi bước tiến đều phải trả giá bằng sự nhẫn nại, tính toán và không ít lần cận kề cái chết.\n"
        "Câu chuyện theo chân một 'phàm nhân' từng bước vươn lên, gặp gỡ đạo lữ Nam Cung Uyển, đối mặt các lão quái và cuối cùng chạm tới những cảnh giới cao nhất của Nhân Giới."
    ),
    "boi_canh": (
        "Thế giới chia thành nhiều giới, trong đó Nhân Giới là nơi khởi đầu. Phàm nhân và tu sĩ sống song song: "
        "phàm nhân chỉ biết đến võ lâm, còn tu sĩ tranh đoạt linh mạch, linh thảo và bí cảnh.\n"
        "Tu luyện dựa vào linh căn và tài nguyên. Người có linh căn kém như Hàn Lập phải bù bằng đan dược, pháp bảo và mưu trí. "
        "Các tông môn lớn của Việt Quốc liên kết thành Thất Phái để chống lại ma đạo."
    ),
    "uu_diem": (
        "Nhân vật chính thận trọng, thực tế, không 'bàn tay vàng' quá đà\n"
        "Hệ thống tu luyện chặt chẽ, logic\n"
        "Thế giới rộng, nhiều tầng lớp, nhiều bí cảnh\n"
        "Nhịp truyện ổn định, ít drama vô lý"
    ),
    "nhuoc_diem": (
        "Khởi đầu chậm, cần kiên nhẫn ở vài trăm chương đầu\n"
        "Tuyến tình cảm khá nhạt\n"
        "Một số đoạn giữa truyện lặp lại mô-típ đánh – chạy – bế quan"
    ),
    "ket_luan": (
        "Một trong những bộ tu tiên kinh điển nhất, đặt nền móng cho dòng 'phàm nhân lưu'. "
        "Rất đáng đọc nếu bạn thích nhân vật chính lý trí và thế giới tu tiên được xây dựng chi tiết."
    ),
    "ost_youtube": "", "noi_bat": "có", "ngay_dang": "2026-11-10",
}]

DL["TacPham"].append({
    "id": "tien-nghich", "loai": "tu-tien", "ten_viet": "Tiên Nghịch", "ten_trung": "仙逆", "ten_khac": "Renegade Immortal",
    "tac_gia": "Nhĩ Căn (耳根)", "the_loai": "Tu Tiên, Huyền Huyễn", "tinh_trang": "Hoàn thành", "so_chuong": "2088",
    "so_tap": "", "so_mua": "", "nen_tang": "Khởi Điểm (Qidian)", "nam": "2009", "studio": "",
    "diem": "8.8", "diem_cot_truyen": "9", "diem_nhan_vat": "9", "diem_the_gioi": "9", "diem_hinh_anh": "8",
    "anh_bia": A + "bia-tien-nghich-goc.jpg", "nguon_anh": "Bìa tiểu thuyết gốc (Khởi Điểm)",
    "tom_tat": ("Vương Lâm là một thiếu niên bình thường ở nước Triệu, tư chất không nổi bật nhưng ý chí kiên định. "
                "Một cơ duyên tình cờ đưa cậu bước vào con đường tu tiên.\n"
                "[spoiler]\n"
                "Biến cố gia đình khiến Vương Lâm trở nên lạnh lùng, quyết đoán và không ngại đi ngược trời để đạt mục đích. "
                "Hành trình của cậu là chuỗi báo thù, cơ duyên và cái giá phải trả trên con đường nghịch thiên."),
    "boi_canh": "Thế giới tu chân rộng lớn với nhiều quốc gia tu tiên, tông môn và tinh vực. Kẻ mạnh làm chủ, tài nguyên tu luyện luôn bị tranh đoạt khốc liệt.",
    "uu_diem": "Nhân vật chính quyết đoán, có chiều sâu\nKhông khí u buồn, nhiều đoạn cảm động\nThế giới mở rộng dần, nhiều tầng bí ẩn",
    "nhuoc_diem": "Nhịp truyện giữa chừng hơi chậm\nNhiều tên tông môn, cảnh giới dễ rối với người mới",
    "ket_luan": "Một tác phẩm kinh điển khác của dòng phàm nhân lưu, tối và nặng hơn Phàm Nhân Tu Tiên. Hợp với người thích nhân vật chính lạnh lùng, tâm cơ sâu.",
    "ost_youtube": "", "noi_bat": "không", "ngay_dang": "2026-11-15",
})

DL["AnhTruyen"] = [
    {"tac_pham_id": TP, "nhan_vat_id": "", "link_anh": A + "hoang-phong-coc-phim.jpg", "nguon_anh": "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)", "chu_thich": "Hoàng Phong Cốc giữa biển mây"},
    {"tac_pham_id": TP, "nhan_vat_id": "", "link_anh": A + "huyet-sac-cam-dia-phim.jpg", "nguon_anh": "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)", "chu_thich": "Trận chiến trong Huyết Sắc Cấm Địa"},
    {"tac_pham_id": TP, "nhan_vat_id": "", "link_anh": A + "bien-may-thien-nam-phim.jpg", "nguon_anh": "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)", "chu_thich": "Biển mây Thiên Nam"},
    {"tac_pham_id": TP, "nhan_vat_id": "", "link_anh": A + "yem-nguyet-tong-son-mon.jpg", "nguon_anh": "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)", "chu_thich": "Sơn môn Yểm Nguyệt Tông"},
    {"tac_pham_id": TP, "nhan_vat_id": "han-lap", "link_anh": A + "han-lap-ket-dan.jpg", "nguon_anh": "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)", "chu_thich": "Tạo hình Hàn Lập thời Kết Đan"},
    {"tac_pham_id": TP, "nhan_vat_id": "han-lap", "link_anh": A + "han-lap-poster.jpg", "nguon_anh": "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)", "chu_thich": "Hàn Lập – đệ tử Hoàng Phong Cốc"},
    {"tac_pham_id": TP, "nhan_vat_id": "han-lap", "link_anh": A + "han-lap.jpg", "chu_thich": "Tranh minh họa Hàn Lập"},
    {"tac_pham_id": TP, "nhan_vat_id": "nam-cung-uyen", "link_anh": A + "nam-cung-uyen-poster.jpg", "nguon_anh": "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)", "chu_thich": "Nam Cung Uyển – trưởng lão Yểm Nguyệt Tông"},
    {"tac_pham_id": TP, "nhan_vat_id": "nam-cung-uyen", "link_anh": A + "nam-cung-uyen.jpg", "chu_thich": "Tranh minh họa Nam Cung Uyển"},
]

DL["NhanVat"] = [
    {"id": "han-lap", "tac_pham_id": TP, "ten": "Hàn Lập", "biet_danh": "Hàn lão ma, Hàn Thiên Tôn", "vai_tro": "chinh",
     "anh": A + "han-lap-donghua.jpg", "nguon_anh": "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)", "gioi_tinh": "Nam", "chung_toc": "Nhân tộc", "tuoi": "Hơn vạn năm (cuối truyện)",
     "the_luc_ids": "hoang-phong-coc", "nghe_nghiep": "Luyện đan sư, Trận pháp sư, Luyện khí sư",
     "loai_tu_luyen_ids": "tu-khi, luyen-the", "cap_do_id": "luyen-hu", "tinh_trang": "Phi thăng",
     "xuat_than": "Con nhà nông nghèo ở một thôn nhỏ của Việt Quốc. Được người chú đưa vào Thất Huyền Môn, nơi cậu gặp Mặc Đại Phu và lần đầu tiếp xúc với con đường tu tiên.",
     "tinh_cach": "Cẩn thận đến mức đa nghi, luôn tính đường lui trước khi hành động.\nTrọng tình nghĩa với người đối tốt với mình nhưng không ngây thơ.\nKiên nhẫn, chịu khó, sẵn sàng bế quan hàng chục năm.",
     "suc_manh": "Sở trường luyện đan nhờ bình nhỏ thúc chín linh thảo, giúp tu vi tăng nhanh dù linh căn kém.\nĐiều khiển kiếm trận Thanh Trúc Phong Vân Kiếm.\nVề sau kiêm tu luyện thể, nhục thân cực kỳ cường hãn.",
     "vat_pham_ids": "chuong-thien-binh, thanh-truc-phong-van-kiem, truong-xuan-cong",
     "cau_noi": "Tu tiên chi lộ, vốn là nghịch thiên mà đi.\nCẩn thận mới lái được thuyền vạn năm.",
     "mo_ta_ngan": "Thiếu niên linh căn kém nhưng nhờ thận trọng và cơ duyên mà từng bước bước lên đỉnh cao tu tiên.", "noi_bat": "có"},
    {"id": "nam-cung-uyen", "tac_pham_id": TP, "ten": "Nam Cung Uyển", "biet_danh": "Uyển Nhi", "vai_tro": "phu",
     "anh": A + "nam-cung-uyen-donghua.jpg", "nguon_anh": "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)", "gioi_tinh": "Nữ", "chung_toc": "Nhân tộc", "tuoi": "Không rõ",
     "the_luc_ids": "yem-nguyet-tong", "nghe_nghiep": "", "loai_tu_luyen_ids": "tu-khi", "cap_do_id": "nguyen-anh",
     "tinh_trang": "Còn sống",
     "xuat_than": "Tu sĩ của Yểm Nguyệt Tông, một trong Thất Phái Việt Quốc. Gặp Hàn Lập trong Huyết Sắc Cấm Địa khi đang bị phản phệ công pháp.",
     "tinh_cach": "Điềm tĩnh, kiêu hãnh nhưng chung tình.\nQuyết đoán khi cần bảo vệ người thân.",
     "suc_manh": "Tu luyện công pháp chính tông của Yểm Nguyệt Tông, về sau đạt Nguyên Anh.",
     "vat_pham_ids": "", "cau_noi": "Ta đợi chàng, bao lâu cũng được.",
     "mo_ta_ngan": "Đạo lữ của Hàn Lập, nữ tu tài sắc vẹn toàn của Yểm Nguyệt Tông.", "noi_bat": "có"},
    {"id": "mac-dai-phu", "tac_pham_id": TP, "ten": "Mặc Đại Phu", "biet_danh": "Mặc Cư Nhân", "vai_tro": "phan-dien",
     "anh": A + "mac-dai-phu-donghua.jpg", "nguon_anh": "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)", "gioi_tinh": "Nam", "chung_toc": "Nhân tộc", "tuoi": "Trung niên",
     "the_luc_ids": "", "nghe_nghiep": "Thầy thuốc", "loai_tu_luyen_ids": "", "cap_do_id": "", "tinh_trang": "Đã chết",
     "xuat_than": "Thầy thuốc có tiếng trong Thất Huyền Môn, mang trong người độc thương nặng và âm mưu đoạt xá để kéo dài sinh mệnh.",
     "tinh_cach": "Thâm trầm, nhiều mưu kế, ngoài mặt hiền hòa.",
     "suc_manh": "Am hiểu y thuật, độc thuật và một số bí thuật tà môn.",
     "vat_pham_ids": "", "cau_noi": "Ngươi chính là thân thể ta chọn.",
     "mo_ta_ngan": "Sư phụ đầu tiên của Hàn Lập, người dẫn cậu vào cửa tu tiên nhưng cũng là kẻ muốn chiếm đoạt thân thể cậu.", "noi_bat": "không"},
]

DL["CuocDoi"] = [
    {"nhan_vat_id": "han-lap", "thu_tu": "1", "giai_doan": "Thất Huyền Môn", "dia_diem_id": "viet-quoc", "su_kien": "Bái Mặc Đại Phu làm thầy, luyện Trường Xuân Công, có được bình nhỏ màu xanh.", "cap_do_id": "luyen-khi"},
    {"nhan_vat_id": "han-lap", "thu_tu": "2", "giai_doan": "Hoàng Phong Cốc", "dia_diem_id": "viet-quoc", "su_kien": "Gia nhập Hoàng Phong Cốc, vào Huyết Sắc Cấm Địa lấy linh dược Trúc Cơ, gặp Nam Cung Uyển.", "cap_do_id": "truc-co"},
    {"nhan_vat_id": "han-lap", "thu_tu": "3", "giai_doan": "Phiêu bạt Thiên Nam", "dia_diem_id": "thien-nam", "su_kien": "Rời Việt Quốc vì chiến loạn, một mình tu luyện, kết thành Kim Đan.", "cap_do_id": "ket-dan"},
    {"nhan_vat_id": "han-lap", "thu_tu": "4", "giai_doan": "Nguyên Anh lão tổ", "dia_diem_id": "thien-nam", "su_kien": "Ngưng kết Nguyên Anh, trở thành nhân vật có tiếng khắp Thiên Nam.", "cap_do_id": "nguyen-anh"},
    {"nhan_vat_id": "han-lap", "thu_tu": "5", "giai_doan": "Đỉnh cao Nhân Giới", "dia_diem_id": "nhan-gioi", "su_kien": "Tiếp tục đột phá Hóa Thần, Luyện Hư và chuẩn bị phi thăng.", "cap_do_id": "luyen-hu"},
    {"nhan_vat_id": "nam-cung-uyen", "thu_tu": "1", "giai_doan": "Yểm Nguyệt Tông", "dia_diem_id": "viet-quoc", "su_kien": "Tu luyện tại tông môn, gặp Hàn Lập trong Huyết Sắc Cấm Địa.", "cap_do_id": "ket-dan"},
    {"nhan_vat_id": "nam-cung-uyen", "thu_tu": "2", "giai_doan": "Kết thành đạo lữ", "dia_diem_id": "thien-nam", "su_kien": "Đạt Nguyên Anh, chính thức kết làm đạo lữ với Hàn Lập.", "cap_do_id": "nguyen-anh"},
    {"nhan_vat_id": "mac-dai-phu", "thu_tu": "1", "giai_doan": "Thất Huyền Môn", "dia_diem_id": "viet-quoc", "su_kien": "Nhận Hàn Lập làm học trò, âm mưu đoạt xá nhưng thất bại.", "cap_do_id": ""},
]

DL["QuanHe"] = [
    {"nhan_vat_id": "han-lap", "lien_quan_id": "nam-cung-uyen", "quan_he": "dao-lu", "ghi_chu": "Gặp nhau ở Huyết Sắc Cấm Địa, về sau kết làm đạo lữ."},
    {"nhan_vat_id": "han-lap", "lien_quan_id": "mac-dai-phu", "quan_he": "su-phu", "ghi_chu": "Người thầy đầu tiên dạy Trường Xuân Công."},
    {"nhan_vat_id": "han-lap", "lien_quan_id": "mac-dai-phu", "quan_he": "ke-thu", "ghi_chu": "Âm mưu đoạt xá Hàn Lập."},
]

DL["TheLuc"] = [
    {"id": "hoang-phong-coc", "tac_pham_id": TP, "ten": "Hoàng Phong Cốc", "loai": "tong-mon", "logo": A + "logo-hoang-phong-coc-phim.jpg", "nguon_anh": "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)",
     "mo_ta": "Một trong Thất Phái của Việt Quốc, nơi Hàn Lập chính thức bước vào giới tu tiên. Nổi tiếng với các đệ tử luyện đan và trận pháp.",
     "thu_linh_id": "", "tru_so_id": "viet-quoc"},
    {"id": "yem-nguyet-tong", "tac_pham_id": TP, "ten": "Yểm Nguyệt Tông", "loai": "tong-mon", "logo": A + "logo-yem-nguyet-tong-phim.jpg", "nguon_anh": "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)",
     "mo_ta": "Tông môn lâu đời, mạnh nhất trong Thất Phái Việt Quốc, phần lớn đệ tử là nữ tu.",
     "thu_linh_id": "", "tru_so_id": "viet-quoc"},
]

DL["LoaiTuLuyen"] = [
    {"id": "tu-khi", "tac_pham_id": TP, "ten": "Pháp tu (tu khí)", "mo_ta": "Hấp thu linh khí trời đất vào đan điền, luyện hóa thành pháp lực để thi triển pháp thuật và điều khiển pháp bảo. Đây là con đường chính của đa số tu sĩ."},
    {"id": "luyen-the", "tac_pham_id": TP, "ten": "Luyện thể", "mo_ta": "Tôi luyện nhục thân bằng công pháp và linh dược đặc biệt, cơ thể cứng như pháp bảo. Rất gian khổ nên ít người theo, thường kiêm tu cùng pháp tu."},
]

DL["CapDo"] = [
    {"id": "luyen-khi", "tac_pham_id": TP, "thu_tu": "1", "ten": "Luyện Khí", "mo_ta": "Bước đầu cảm nhận và dẫn linh khí vào cơ thể. Chia thành nhiều tầng nhỏ, vẫn rất gần với phàm nhân."},
    {"id": "truc-co", "tac_pham_id": TP, "thu_tu": "2", "ten": "Trúc Cơ", "mo_ta": "Xây nền móng cho con đường tu tiên, thọ nguyên tăng lên khoảng hai trăm năm. Thường cần Trúc Cơ Đan."},
    {"id": "ket-dan", "tac_pham_id": TP, "thu_tu": "3", "ten": "Kết Đan", "mo_ta": "Ngưng tụ pháp lực thành Kim Đan trong đan điền. Đạt tới đây đã là cao thủ một phương."},
    {"id": "nguyen-anh", "tac_pham_id": TP, "thu_tu": "4", "ten": "Nguyên Anh", "mo_ta": "Kim Đan phá vỡ, hóa thành Nguyên Anh. Dù thân thể bị hủy, Nguyên Anh vẫn có thể thoát ra để đoạt xá hoặc trùng tu."},
    {"id": "hoa-than", "tac_pham_id": TP, "thu_tu": "5", "ten": "Hóa Thần", "mo_ta": "Bắt đầu cảm ngộ pháp tắc thiên địa, là tồn tại hàng đầu ở nhiều vùng của Nhân Giới."},
    {"id": "luyen-hu", "tac_pham_id": TP, "thu_tu": "6", "ten": "Luyện Hư", "mo_ta": "Luyện hóa hư không, sức mạnh vượt xa Hóa Thần. (Dữ liệu mẫu rút gọn: phía trên còn Hợp Thể, Đại Thừa… bạn có thể thêm dòng.)"},
]

DL["VatPham"] = [
    {"id": "chuong-thien-binh", "tac_pham_id": TP, "ten": "Bình nhỏ màu xanh (Chưởng Thiên Bình)", "loai": "phap-bao", "pham_cap": "Chí bảo",
     "anh": A + "chuong-thien-binh-phim.jpg", "nguon_anh": "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)", "mo_ta": "Chiếc bình nhỏ bí ẩn hấp thu tinh hoa ánh trăng, tạo ra giọt dịch xanh có thể thúc chín linh thảo hàng trăm năm. Bí mật lớn nhất của Hàn Lập.",
     "chu_so_huu_id": "han-lap"},
    {"id": "thanh-truc-phong-van-kiem", "tac_pham_id": TP, "ten": "Thanh Trúc Phong Vân Kiếm", "loai": "vu-khi", "pham_cap": "Pháp bảo bản mệnh",
     "anh": A + "thanh-truc-phong-van-kiem-phim.jpg", "nguon_anh": "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)", "mo_ta": "Bộ phi kiếm luyện từ Kim Lôi Trúc, có thể bày kiếm trận mang uy lực lôi điện, khắc chế tà ma.",
     "chu_so_huu_id": "han-lap"},
    {"id": "truong-xuan-cong", "tac_pham_id": TP, "ten": "Trường Xuân Công", "loai": "cong-phap", "pham_cap": "Công pháp nhập môn",
     "anh": A + "truong-xuan-cong.jpg", "mo_ta": "Công pháp đầu tiên Hàn Lập tu luyện, do Mặc Đại Phu truyền lại. Tốc độ chậm nhưng nền tảng vững.",
     "chu_so_huu_id": "han-lap"},
]

DL["DiaDiem"] = [
    {"id": "nhan-gioi", "tac_pham_id": TP, "ten": "Nhân Giới", "cap": "gioi", "thuoc_id": "", "anh_ban_do": A + "ban-do-nhan-gioi.jpg",
     "mo_ta": "Giới nơi phàm nhân và tu sĩ cấp thấp sinh sống, linh khí tương đối mỏng. Gồm nhiều đại lục và biển cả."},
    {"id": "thien-nam", "tac_pham_id": TP, "ten": "Thiên Nam", "cap": "vung", "thuoc_id": "nhan-gioi", "anh_ban_do": A + "ban-do-thien-nam.jpg", "nguon_anh": "Phim hoạt hình Phàm Nhân Tu Tiên (Bilibili)",
     "mo_ta": "Vùng đất rộng lớn phía nam, nhiều quốc gia tu tiên và tông môn san sát."},
    {"id": "viet-quoc", "tac_pham_id": TP, "ten": "Việt Quốc", "cap": "vung", "thuoc_id": "thien-nam", "anh_ban_do": "",
     "mo_ta": "Quê hương của Hàn Lập, có Thất Phái tu tiên cùng nhau trấn giữ."},
]

DL["HanhTrinh"] = [
    {"tac_pham_id": TP, "thu_tu": "1", "dia_diem_id": "viet-quoc", "su_kien": "Vào Thất Huyền Môn, bái Mặc Đại Phu làm thầy, có được bình nhỏ màu xanh.", "cap_do_id": "luyen-khi"},
    {"tac_pham_id": TP, "thu_tu": "2", "dia_diem_id": "viet-quoc", "su_kien": "Gia nhập Hoàng Phong Cốc, sống sót khỏi Huyết Sắc Cấm Địa.", "cap_do_id": "truc-co"},
    {"tac_pham_id": TP, "thu_tu": "3", "dia_diem_id": "thien-nam", "su_kien": "Rời quê hương, phiêu bạt khắp Thiên Nam, kết Kim Đan.", "cap_do_id": "ket-dan"},
    {"tac_pham_id": TP, "thu_tu": "4", "dia_diem_id": "thien-nam", "su_kien": "Ngưng kết Nguyên Anh, kết làm đạo lữ với Nam Cung Uyển.", "cap_do_id": "nguyen-anh"},
    {"tac_pham_id": TP, "thu_tu": "5", "dia_diem_id": "nhan-gioi", "su_kien": "Đột phá Hóa Thần rồi Luyện Hư, trở thành cường giả hàng đầu Nhân Giới.", "cap_do_id": "luyen-hu"},
]

DL["ThuatNgu"] = [
    {"id": "linh-can", "ten": "Linh căn", "giai_thich": "Tư chất bẩm sinh quyết định khả năng cảm nhận linh khí. Linh căn càng thuần (ít thuộc tính) thì tu luyện càng nhanh.", "tac_pham_id": ""},
    {"id": "dao-lu", "ten": "Đạo lữ", "giai_thich": "Bạn đời cùng tu luyện, tương tự vợ chồng trong giới tu tiên.", "tac_pham_id": ""},
    {"id": "dong-phu", "ten": "Động phủ", "giai_thich": "Nơi ở và bế quan của tu sĩ, thường đặt trên linh mạch và có trận pháp bảo vệ.", "tac_pham_id": ""},
    {"id": "doat-xa", "ten": "Đoạt xá", "giai_thich": "Thần hồn của một người chiếm lấy thân thể người khác để tiếp tục sống.", "tac_pham_id": ""},
    {"id": "binh-canh", "ten": "Bình cảnh", "giai_thich": "Giai đoạn tu vi bị kẹt, khó đột phá lên cảnh giới tiếp theo.", "tac_pham_id": ""},
]

DL["DeCu"] = [
    {"thu_tu": "1", "tac_pham_id": TP, "neu_thich_id": "", "ly_do": "Kinh điển của dòng phàm nhân lưu, ai mới đọc tu tiên cũng nên bắt đầu từ đây."},
    {"thu_tu": "2", "tac_pham_id": "tien-nghich", "neu_thich_id": TP,
     "ly_do": "Cùng dòng phàm nhân lưu, nhân vật chính cũng đi lên từ tư chất bình thường nhưng lạnh lùng, quyết đoán hơn Hàn Lập."},
]

DL["CaiDat"] = [{"ten_web": "Tu Chân Bảo Điển", "mo_ta_web": "Review truyện Tu Tiên, Huyền Huyễn và Anime: cốt truyện, nhân vật, thế giới, cảnh giới tu luyện.",
                 "logo": "", "link_fanpage": "", "link_youtube": ""}]

# Cột trang_thai (nháp/duyệt) ở cuối mọi tab nội dung; dữ liệu mẫu đều đã duyệt
for _tab in COT:
    if _tab != "CaiDat":
        COT[_tab] = COT[_tab] + ["trang_thai"]
        for _r in DL.get(_tab, []):
            _r.setdefault("trang_thai", "duyệt")

# Ảnh mẫu do Tu Chân Bảo Điển tự vẽ → ghi nguồn cho mọi dòng có ảnh
for _tab, _cot in [("TacPham", "anh_bia"), ("NhanVat", "anh"), ("AnhTruyen", "link_anh"),
                   ("TheLuc", "logo"), ("VatPham", "anh"), ("DiaDiem", "anh_ban_do")]:
    for _r in DL[_tab]:
        if _r.get(_cot) and not _r.get("nguon_anh"):
            _r["nguon_anh"] = "Minh họa: Tu Chân Bảo Điển"

# Giải thích cột cho tab hướng dẫn
GIAI_THICH = [
    ("Quy tắc chung", "Mỗi tab là 1 loại dữ liệu. Dòng 1 là tên cột – KHÔNG đổi tên, KHÔNG xoá cột. Thứ tự cột có thể đổi."),
    ("id", "Viết thường, không dấu, nối bằng gạch ngang. Ví dụ: han-lap, hoang-phong-coc. Không trùng nhau trong cùng tab."),
    ("Cột ..._id / ..._ids", "Chỉ ghi id của dòng ở tab khác. Nhiều id cách nhau bằng dấu phẩy: tu-khi, luyen-the"),
    ("Ảnh", "Dán link chia sẻ Google Drive (https://drive.google.com/file/d/.../view) hoặc link ảnh thường (https://...jpg)."),
    ("Đoạn văn dài", "Xuống dòng trong ô bằng Ctrl+Enter (Mac: Cmd+Enter). Mỗi dòng thành 1 đoạn trên web."),
    ("tom_tat", "Đặt một dòng chỉ có chữ [spoiler]: phần phía trên hiện bình thường, phần phía dưới bị che cho tới khi bấm 'Hiện spoiler'."),
    ("uu_diem / nhuoc_diem / cau_noi", "Mỗi dòng trong ô = 1 gạch đầu dòng / 1 câu nói."),
    ("loai (TacPham)", "tu-tien hoặc anime"),
    ("vai_tro (NhanVat)", "chinh / phu / lien-quan / phan-dien"),
    ("quan_he (QuanHe)", "dao-lu / vo / chong / su-phu / do-de / gia-dinh / ban / ke-thu. Đọc là: lien_quan_id là [quan_he] của nhan_vat_id. Web tự hiện chiều ngược lại."),
    ("loai (TheLuc)", "tong-mon / gia-toc / hoang-trieu / ma-dao … (tự đặt thêm được)"),
    ("loai (VatPham)", "phap-bao / vu-khi / dan-duoc / cong-phap"),
    ("cap (DiaDiem)", "gioi / vung / thanh / bi-canh. thuoc_id = id của nơi lớn hơn chứa nó."),
    ("noi_bat", "có / không"),
    ("ngay_dang", "Dạng 2026-11-10 hoặc 10/11/2026"),
    ("diem", "Thang 10, dùng dấu chấm: 9.2"),
    ("nguon_anh", "Nguồn của ảnh trên cùng dòng, ví dụ: Tencent Video, Bilibili, Poster chính thức. Web hiện dòng nhỏ 'Ảnh: …' dưới ảnh. Để trống thì không hiện."),
    ("trang_thai", "Cột cuối mỗi tab: để trống hoặc 'duyệt' = hiện trên web; 'nháp' = ẩn (dùng khi đang viết dở hoặc chờ duyệt). Tác phẩm nháp thì nhân vật, thế lực… của nó cũng ẩn theo; nhân vật nháp thì cuộc đời, quan hệ, ảnh riêng của nhân vật đó cũng ẩn."),
    ("DeCu", "Dòng có neu_thich_id trống = mục 'Người mới nên bắt đầu' (xếp theo thu_tu). Dòng có neu_thich_id = khối 'Nếu thích X thì đọc Y': X là neu_thich_id, Y là tac_pham_id, ly_do giải thích vì sao."),
    ("ost_youtube", "Link YouTube, nhiều link cách nhau bằng dấu phẩy. Để trống thì mục OST tự ẩn."),
    ("Tab này", "Tab _HuongDan chỉ để đọc, web không dùng. Có thể xoá."),
]

DROPDOWN = {
    ("TacPham", "loai"): "tu-tien,anime",
    **{(t, "trang_thai"): "duyệt,nháp" for t in ["TacPham", "AnhTruyen", "NhanVat", "CuocDoi", "QuanHe", "TheLuc", "LoaiTuLuyen",
                                                "CapDo", "VatPham", "DiaDiem", "HanhTrinh", "ThuatNgu", "DeCu"]},
    ("TacPham", "noi_bat"): "có,không",
    ("TacPham", "tinh_trang"): "Đang ra,Hoàn thành,Tạm ngưng",
    ("NhanVat", "vai_tro"): "chinh,phu,lien-quan,phan-dien",
    ("NhanVat", "noi_bat"): "có,không",
    ("QuanHe", "quan_he"): "dao-lu,vo,chong,su-phu,do-de,gia-dinh,ban,ke-thu",
    ("VatPham", "loai"): "phap-bao,vu-khi,dan-duoc,cong-phap",
    ("DiaDiem", "cap"): "gioi,vung,thanh,bi-canh",
}


def link_drive():
    """Đổi ảnh trong repo sang link Google Drive (nếu có tools/link_anh_drive.json)."""
    p = os.path.join(GOC, "tools", "link_anh_drive.json")
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}


def gia_tri_excel(v, drive):
    v = str(v)
    if v.startswith(A) and v[len(A):] in drive:
        return drive[v[len(A):]]
    return v


def tao_excel():
    drive = link_drive()
    wb = Workbook()
    wb.remove(wb.active)
    dau = PatternFill("solid", fgColor="1F2A37")
    for tab, cot in COT.items():
        ws = wb.create_sheet(tab)
        ws.append(cot)
        for r in DL.get(tab, []):
            ws.append([gia_tri_excel(r.get(c, ""), drive) for c in cot])
        for i, c in enumerate(cot, 1):
            cell = ws.cell(row=1, column=i)
            cell.font = Font(bold=True, color="F5D27A")
            cell.fill = dau
            dai = max([len(c)] + [min(len(str(r.get(c, ""))), 60) for r in DL.get(tab, [])])
            ws.column_dimensions[cell.column_letter].width = max(12, min(dai + 2, 50))
        for row in ws.iter_rows(min_row=2):
            for cell in row:
                cell.alignment = Alignment(wrap_text=True, vertical="top")
                cell.number_format = "@"  # giữ nguyên dạng chữ (không tự đổi 9.2 thành ngày…)
        ws.freeze_panes = "B2"
        for (t, c), vals in DROPDOWN.items():
            if t == tab:
                dv = DataValidation(type="list", formula1=f'"{vals}"', allow_blank=True)
                col = ws.cell(row=1, column=cot.index(c) + 1).column_letter
                dv.add(f"{col}2:{col}1000")
                ws.add_data_validation(dv)
    hd = wb.create_sheet("_HuongDan")
    hd.append(["Mục", "Cách nhập"])
    for r in GIAI_THICH:
        hd.append(list(r))
    hd.column_dimensions["A"].width = 30
    hd.column_dimensions["B"].width = 110
    for c in hd[1]:
        c.font = Font(bold=True, color="F5D27A"); c.fill = dau
    for row in hd.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical="top")
    out = os.path.join(GOC, "Tu-Chan-Bao-Dien-Mau.xlsx")
    wb.save(out)
    print("Đã tạo", out)


def tao_csv():
    for tab, cot in COT.items():
        p = os.path.join(GOC, "data", "mau", tab + ".csv")
        with open(p, "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cot)
            w.writeheader()
            for r in DL.get(tab, []):
                w.writerow({c: r.get(c, "") for c in cot})
    print("Đã tạo data/mau/*.csv")


# ---------------------------------------------------------------- ẢNH GIỮ CHỖ (SVG)
def svg(ten, w, h, chu, phu, mau1, mau2, hinh="nui"):
    trang_tri = {
        "nui": f'<path d="M0 {h*0.78} L{w*0.22} {h*0.5} L{w*0.4} {h*0.7} L{w*0.62} {h*0.42} L{w} {h*0.75} L{w} {h} L0 {h}Z" fill="#000" opacity=".35"/>'
               f'<circle cx="{w*0.75}" cy="{h*0.22}" r="{w*0.1}" fill="#f5d27a" opacity=".85"/>',
        "nguoi": f'<circle cx="{w/2}" cy="{h*0.38}" r="{w*0.16}" fill="#000" opacity=".35"/>'
                 f'<path d="M{w*0.2} {h} Q{w/2} {h*0.45} {w*0.8} {h}Z" fill="#000" opacity=".35"/>',
        "logo": f'<circle cx="{w/2}" cy="{h/2}" r="{w*0.36}" fill="none" stroke="#f5d27a" stroke-width="{w*0.03}" opacity=".9"/>'
                f'<circle cx="{w/2}" cy="{h/2}" r="{w*0.26}" fill="none" stroke="#f5d27a" stroke-width="{w*0.01}" opacity=".6"/>',
        "vat": f'<path d="M{w/2} {h*0.18} L{w*0.7} {h*0.5} L{w/2} {h*0.82} L{w*0.3} {h*0.5}Z" fill="#f5d27a" opacity=".55"/>',
        "bando": "".join(f'<path d="M{w*x} {h*y} q{w*0.08} -{h*0.1} {w*0.18} 0 t{w*0.16} {h*0.05} q-{w*0.1} {h*0.14} -{w*0.3} {h*0.06}Z" fill="#000" opacity=".3"/>'
                         for x, y in [(0.1, 0.3), (0.5, 0.25), (0.25, 0.62), (0.6, 0.65)]),
    }[hinh]
    may = f'<path d="M{w*0.05} {h*0.15} q{w*0.06} -{h*0.05} {w*0.12} 0 q{w*0.06} -{h*0.05} {w*0.12} 0" stroke="#fff" stroke-width="3" fill="none" opacity=".35"/>'
    noi = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{mau1}"/><stop offset="1" stop-color="{mau2}"/></linearGradient></defs>
<rect width="{w}" height="{h}" fill="url(#g)"/>{trang_tri}{may}
<rect x="{w*0.04}" y="{h*0.03}" width="{w*0.92}" height="{h*0.94}" fill="none" stroke="#f5d27a" stroke-opacity=".5" stroke-width="2" rx="8"/>
<text x="50%" y="{h*0.88}" text-anchor="middle" font-family="Georgia, serif" font-size="{w*0.075}" fill="#fff6dc">{chu}</text>
<text x="50%" y="{h*0.93}" text-anchor="middle" font-family="Georgia, serif" font-size="{w*0.04}" fill="#f5d27a">{phu}</text>
</svg>'''
    with open(os.path.join(GOC, "assets", "img", "mau", ten), "w", encoding="utf-8") as f:
        f.write(noi)


def tao_anh():
    svg("bia-pham-nhan-tu-tien.svg", 600, 900, "Phàm Nhân Tu Tiên", "凡人修仙传 · ảnh mẫu", "#1d4e5f", "#0b1320")
    svg("han-lap.svg", 600, 800, "Hàn Lập", "ảnh mẫu", "#2d6a5a", "#0e1a22", "nguoi")
    svg("nam-cung-uyen.svg", 600, 800, "Nam Cung Uyển", "ảnh mẫu", "#7a3b5c", "#170f1d", "nguoi")
    svg("mac-dai-phu.svg", 600, 800, "Mặc Đại Phu", "ảnh mẫu", "#4b3a2a", "#120d0a", "nguoi")
    svg("logo-hoang-phong-coc.svg", 400, 400, "Hoàng Phong Cốc", "", "#6b4f1d", "#1a1408", "logo")
    svg("logo-yem-nguyet-tong.svg", 400, 400, "Yểm Nguyệt Tông", "", "#3b3f7a", "#0f1022", "logo")
    svg("chuong-thien-binh.svg", 400, 400, "Bình nhỏ màu xanh", "", "#1f6b6b", "#0a1a1c", "vat")
    svg("thanh-truc-phong-van-kiem.svg", 400, 400, "Thanh Trúc Kiếm", "", "#2f6b3a", "#0b170e", "vat")
    svg("truong-xuan-cong.svg", 400, 400, "Trường Xuân Công", "", "#6b5a2f", "#18130a", "vat")
    svg("ban-do-nhan-gioi.svg", 1200, 800, "Bản đồ Nhân Giới", "ảnh mẫu", "#2a4b5e", "#0d1a24", "bando")
    svg("anh-truyen-1.svg", 1200, 800, "Hoàng Phong Cốc", "ảnh mẫu", "#5e4a2a", "#141008")
    svg("anh-truyen-2.svg", 1200, 800, "Huyết Sắc Cấm Địa", "ảnh mẫu", "#6b2424", "#160808")
    svg("anh-truyen-3.svg", 1200, 800, "Biển mây Thiên Nam", "ảnh mẫu", "#2c5a7a", "#0b1520")
    print("Đã tạo ảnh mẫu")


if __name__ == "__main__":
    tao_excel()
    tao_csv()
