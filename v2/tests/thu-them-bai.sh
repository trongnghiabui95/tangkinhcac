#!/usr/bin/env bash
# Tiêu chí #27: thêm 1 file .mdx hợp lệ (KHÔNG sửa code) → có trang mới, hiện ở trang chủ, trang bộ truyện, danh mục, menu.
# Chép bài thử vào content/, build, kiểm tra, rồi xoá bài thử.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=tests/fixtures/hop-le/pham-nhan-tu-tien/the-luc/hoang-phong-coc.mdx
DST=content/pham-nhan-tu-tien/the-luc/hoang-phong-coc.mdx
mkdir -p "$(dirname "$DST")"; cp "$SRC" "$DST"
trap 'rm -f "$DST"; rmdir "$(dirname "$DST")" 2>/dev/null || true' EXIT
npm run build >/dev/null 2>&1 || { echo "LỖI: build thất bại"; npm run build; exit 1; }
URL='/pham-nhan-tu-tien/the-luc/hoang-phong-coc/'
loi=0
kt() { if grep -q "$2" "$1"; then echo "OK   $3"; else echo "LỖI $3"; loi=1; fi; }
test -f "dist${URL}index.html" && echo "OK   có trang mới ${URL}" || { echo "LỖI không có trang ${URL}"; loi=1; }
kt dist/index.html "href=\"${URL}\"" "trang chủ (Bài mới cập nhật) có link bài"
kt dist/pham-nhan-tu-tien/index.html "href=\"${URL}\"" "trang bộ truyện có link bài"
kt dist/danh-muc/the-luc/index.html "href=\"${URL}\"" "trang danh mục /danh-muc/the-luc/ có link bài"
kt dist/pham-nhan-tu-tien/the-luc/index.html "href=\"${URL}\"" "trang /pham-nhan-tu-tien/the-luc/ có link bài"
kt dist/index.html 'href="/pham-nhan-tu-tien/the-luc/"' "menu: Truyện Tu Tiên → Phàm Nhân Tu Tiên → Thế lực (sinh từ nội dung)"
kt dist/sitemap-pham-nhan-tu-tien.xml "${URL}" "sitemap của bộ truyện có URL bài"
kt "dist${URL}index.html" '"@type":"Article"' "trang bài có JSON-LD Article"
kt "dist${URL}index.html" '"@type":"FAQPage"' "trang bài có JSON-LD FAQPage"
[ $loi -eq 0 ] && echo "errors: []" || echo "errors: có lỗi"
exit $loi
