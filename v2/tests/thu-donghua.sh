#!/usr/bin/env bash
# Issue #4: loại Donghua + nối bản truyện ↔ bản donghua bằng `universe`.
# 1) Chép 1 bộ mẫu (loai: donghua, universe: pham-nhan-tu-tien) vào content/, build, kiểm tra:
#    menu có Donghua, có trang /loai/donghua/, hai trang hiện nút qua lại, bộ đứng một mình không có nút.
# 2) Xoá bộ mẫu, build lại, kiểm tra: không còn menu/trang Donghua, trang truyện không còn nút.
set -euo pipefail
cd "$(dirname "$0")/.."
SLUG=bo-thu-donghua-tu-dong-xoa
SRC=tests/fixtures/donghua/${SLUG}
DST=content/${SLUG}
if [ -e "$DST" ]; then echo "LỖI: $DST đã có sẵn. Dừng để không ghi đè/xoá nhầm."; exit 1; fi
cp -r "$SRC" "$DST"
trap 'rm -rf "$DST"' EXIT
loi=0
co()    { if grep -q "$2" "$1"; then echo "OK   $3"; else echo "LỖI $3"; loi=1; fi; }
khong() { if [ -f "$1" ] && grep -q "$2" "$1"; then echo "LỖI $3"; loi=1; else echo "OK   $3"; fi; }

echo "== Có bộ loai: donghua =="
npm run build >/dev/null 2>&1 || { echo "LỖI: build thất bại"; npm run build; exit 1; }
test -f dist/loai/donghua/index.html && echo "OK   có trang /loai/donghua/" || { echo "LỖI không có trang /loai/donghua/"; loi=1; }
co dist/index.html 'href="/loai/donghua/"' "menu có mục Donghua"
co dist/loai/donghua/index.html "href=\"/${SLUG}/\"" "trang /loai/donghua/ có bộ mẫu"
co dist/pham-nhan-tu-tien/index.html "class=\"nut-vien\" href=\"/${SLUG}/\"" "trang bản truyện có nút sang bản donghua"
co dist/pham-nhan-tu-tien/index.html 'Xem bản donghua' "chữ nút 'Xem bản donghua' (lấy từ LOAI_TRUYEN)"
co "dist/${SLUG}/index.html" 'class="nut-vien" href="/pham-nhan-tu-tien/"' "trang bản donghua có nút về bản truyện (tự hai chiều)"
co "dist/${SLUG}/index.html" 'Đọc bản truyện' "chữ nút 'Đọc bản truyện'"
khong dist/tien-nghich/index.html 'class="ban-khac"' "bộ đứng một mình (Tiên Nghịch) không có nút"

echo "== Không có bộ loai: donghua =="
rm -rf "$DST"
npm run build >/dev/null 2>&1 || { echo "LỖI: build thất bại"; npm run build; exit 1; }
test ! -e dist/loai/donghua && echo "OK   không có trang /loai/donghua/" || { echo "LỖI vẫn có trang /loai/donghua/"; loi=1; }
khong dist/index.html 'href="/loai/donghua/"' "menu không hiện Donghua"
khong dist/pham-nhan-tu-tien/index.html 'class="ban-khac"' "trang bản truyện không còn nút"
[ $loi -eq 0 ] && echo "errors: []" || echo "errors: có lỗi"
exit $loi
