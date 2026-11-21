#!/usr/bin/env bash
# Issue #137: giao diện riêng cho loai: anime (One Piece là bộ đầu tiên).
# 1) Chép bộ MẪU (tests/fixtures/anime/…, dữ liệu tham khảo One Piece) vào content/, build, kiểm tra:
#    tên danh mục theo loại, Dòng thời gian Arc, Thứ tự xem, điểm MyAnimeList, nút xem chính thức,
#    bảng thông tin nhân vật (xuất hiện lần đầu, seiyuu, năng lực), bài arc (tập/chương), ẩn Xếp hạng sức mạnh.
# 2) Bộ tu tiên vẫn dùng tên danh mục cũ.
# 3) Xoá bộ mẫu, build lại: không còn dấu vết anime.
set -euo pipefail
cd "$(dirname "$0")/.."
SLUG=bo-thu-anime-tu-dong-xoa
SRC=tests/fixtures/anime/${SLUG}
DST=content/${SLUG}
if [ -e "$DST" ]; then echo "LỖI: $DST đã có sẵn. Dừng để không ghi đè/xoá nhầm."; exit 1; fi
cp -r "$SRC" "$DST"
trap 'rm -rf "$DST"' EXIT
loi=0
co()    { if grep -q -- "$2" "$1"; then echo "OK   $3"; else echo "LỖI $3"; loi=1; fi; }
khong() { if [ -f "$1" ] && grep -q -- "$2" "$1"; then echo "LỖI $3"; loi=1; else echo "OK   $3"; fi; }

echo "== Có bộ loai: anime =="
npm run build >/dev/null 2>&1 || { echo "LỖI: build thất bại"; npm run build; exit 1; }
B="dist/${SLUG}/index.html"
co "$B" 'id="cac-arc"' "trang bộ có khối Dòng thời gian Arc"
co "$B" 'href="#cac-arc"' "mục lục có Dòng thời gian Arc"
co "$B" 'Tập 1–61' "thẻ arc ghi tập từ–đến"
co "$B" 'Chương 1–100' "thẻ arc ghi chương manga"
co "$B" "href=\"/${SLUG}/cot-truyen/east-blue/\"" "arc có bài thì bấm được"
co "$B" 'Tập 1086 – nay' "arc đang chiếu chưa có tập cuối"
co "$B" 'arc-dang-chieu' "đánh dấu arc đang chiếu"
co "$B" 'id="thu-tu-xem"' "có khối Thứ tự xem cho người mới"
co "$B" 'Tập có thể bỏ qua (filler)' "có dòng tập filler"
co "$B" 'MyAnimeList' "băng rôn có điểm MyAnimeList"
co "$B" 'Xem chính thức ở:' "băng rôn có nút xem chính thức"
co "$B" 'href="https://www.crunchyroll.com/"' "nút xem chính thức trỏ đúng link"
co "$B" 'Toei Animation' "băng rôn có studio"
co "$B" '1.155 tập' "băng rôn có số tập"
co "$B" 'Hệ thống sức mạnh' "danh mục canh-gioi → Hệ thống sức mạnh"
co "$B" 'Năng lực / Vật phẩm' "danh mục phap-bao → Năng lực / Vật phẩm"
co "$B" 'Băng nhóm / Tổ chức' "danh mục the-luc → Băng nhóm / Tổ chức"
co "$B" 'Arc / Mùa phim' "danh mục cot-truyen → Arc / Mùa phim"
khong "$B" 'id="xep-hang-suc-manh"' "anime không có Xếp hạng sức mạnh theo cảnh giới"
co "$B" 'href="#canh-gioi">Hệ thống sức mạnh<' "mục lục dùng tên Hệ thống sức mạnh"
# "Bạn có biết" nằm sau các danh mục
python3 - "$B" <<'PY' && echo "OK   Bạn có biết nằm sau các danh mục" || { echo "LỖI Bạn có biết chưa nằm sau các danh mục"; loi=1; }
import sys; s=open(sys.argv[1]).read()
sys.exit(0 if s.index('id="the-luc"') < s.index('id="ban-co-biet"') and s.index('id="cac-arc"') < s.index('id="nhan-vat-chinh"') else 1)
PY
NV="dist/${SLUG}/nhan-vat/monkey-d-luffy/index.html"
co "$NV" 'Xuất hiện lần đầu' "nhân vật: dòng Xuất hiện lần đầu"
co "$NV" 'Mayumi Tanaka' "nhân vật: dòng Lồng tiếng (seiyuu)"
co "$NV" "href=\"/${SLUG}/phap-bao/trai-gomu-gomu/\">Trái Gomu Gomu</a>" "nhân vật: Năng lực link tới bài"
khong "$NV" 'khong-co-bai-nay' "năng lực chưa có bài thì ẩn"
co "$NV" 'East Blue</span>' "Cuộc đời hiện nhãn arc"
co "$NV" '<h2>Băng nhóm / Tổ chức</h2>' "nhân vật: mục thế lực đổi tên theo loại"
co "$NV" 'Năng lực / Vật phẩm của' "khối thẻ cuối bài dùng tên danh mục anime"
co "$NV" "\"name\":\"Arc / Mùa phim\"\|\"name\":\"Nhân vật\"" "JSON-LD breadcrumb có tên danh mục"
CT="dist/${SLUG}/cot-truyen/east-blue/index.html"
co "$CT" 'Arc / Mùa phim' "bài arc: breadcrumb Arc / Mùa phim"
co "$CT" '"name":"Arc / Mùa phim"' "bài arc: JSON-LD breadcrumb theo loại"
co "$CT" '<th scope="row">Tập</th><td>Tập 1–61</td>' "bài arc: infobox dòng Tập"
co "dist/${SLUG}/canh-gioi/index.html" '<h1>Hệ thống sức mạnh' "trang danh sách canh-gioi đổi tên"
co dist/index.html 'Arc / Mùa phim' "menu dùng tên danh mục theo loại"
echo "== Bộ tu tiên giữ nguyên =="
co dist/pham-nhan-tu-tien/index.html 'Hệ thống cảnh giới' "tu tiên vẫn là Hệ thống cảnh giới"
khong dist/pham-nhan-tu-tien/index.html 'id="cac-arc"' "tu tiên không có Dòng thời gian Arc"
khong dist/pham-nhan-tu-tien/index.html 'MyAnimeList' "tu tiên không có điểm MyAnimeList"

echo "== Không có bộ anime =="
rm -rf "$DST"
npm run build >/dev/null 2>&1 || { echo "LỖI: build thất bại"; npm run build; exit 1; }
test ! -e "dist/${SLUG}" && echo "OK   bộ mẫu đã xoá khỏi bản build" || { echo "LỖI bộ mẫu còn trong bản build"; loi=1; }
khong dist/index.html 'Arc / Mùa phim' "menu không còn tên danh mục anime"
[ $loi -eq 0 ] && echo "errors: []" || echo "errors: có lỗi"
exit $loi
