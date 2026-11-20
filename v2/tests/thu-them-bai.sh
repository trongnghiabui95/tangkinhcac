#!/usr/bin/env bash
# Tiêu chí #27: thêm 1 file .mdx hợp lệ (KHÔNG sửa code) → có trang mới, hiện ở trang chủ, trang bộ truyện, danh mục, menu.
# Chép bài thử vào content/, build, kiểm tra, rồi xoá bài thử.
set -euo pipefail
cd "$(dirname "$0")/.."
# Slug riêng cho bài thử (không bao giờ đặt tên bài thật như vậy) để không đè/xoá nhầm bài thật.
SLUG=bai-thu-tu-dong-xoa
SRC=tests/fixtures/hop-le/pham-nhan-tu-tien/the-luc/${SLUG}.mdx
DST=content/pham-nhan-tu-tien/the-luc/${SLUG}.mdx
# Khoá an toàn: file đích đã có sẵn → dừng, KHÔNG ghi đè, KHÔNG xoá.
if [ -e "$DST" ]; then
  echo "LỖI: $DST đã có sẵn. Dừng để không ghi đè/xoá nhầm file này. Hãy đổi tên hoặc xoá nó bằng tay rồi chạy lại."
  exit 1
fi
# Issue #11: bộ truyện mẫu có ban_co_biet + bài cảnh giới + nhân vật có `bac` (cả bộ chép vào rồi xoá)
BO=truyen-mau-tu-dong-xoa
BO_DST=content/${BO}
if [ -e "$BO_DST" ]; then
  echo "LỖI: $BO_DST đã có sẵn. Dừng để không ghi đè/xoá nhầm thư mục này."
  exit 1
fi
mkdir -p "$(dirname "$DST")"; cp "$SRC" "$DST"
cp -r "tests/fixtures/hop-le/${BO}" "$BO_DST"
trap 'rm -f "$DST"; rmdir "$(dirname "$DST")" 2>/dev/null || true; rm -rf "$BO_DST"' EXIT
npm run build >/dev/null 2>&1 || { echo "LỖI: build thất bại"; npm run build; exit 1; }
URL="/pham-nhan-tu-tien/the-luc/${SLUG}/"
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
# ---- Issue #11: Bạn có biết + Xếp hạng sức mạnh ----
BO_HTML="dist/${BO}/index.html"
kt "$BO_HTML" 'id="ban-co-biet"' "bộ mẫu: có khối Bạn có biết"
kt "$BO_HTML" 'href="#ban-co-biet"' "bộ mẫu: mục lục có Bạn có biết"
kt "$BO_HTML" 'id="xep-hang-suc-manh"' "bộ mẫu: có khối Xếp hạng sức mạnh"
kt "$BO_HTML" 'href="#xep-hang-suc-manh"' "bộ mẫu: mục lục có Xếp hạng sức mạnh"
node -e '
const h = require("fs").readFileSync(process.argv[1], "utf8");
const bcb = (h.match(/<ul class="ban-co-biet"[\s\S]*?<\/ul>/) || [""])[0];
const li = bcb.match(/<li[ >]/g) || [], an = bcb.match(/<li hidden/g) || [];
const ok1 = li.length === 4 && an.length === 1;
console.log((ok1 ? "OK  " : "LỖI") + " bộ mẫu: in đủ 4 ý, ẩn sẵn 1 ý (hiện 3) – thấy " + li.length + " ý, ẩn " + an.length);
const xh = (h.match(/<ol class="xep-hang"[\s\S]*?<\/ol>/) || [""])[0];
const ds = [...xh.matchAll(/aria-label="Hạng (\d+)"[\s\S]*?chip-nv-ten">([^<]+)</g)].map((m) => m[1] + ":" + m[2]).join(", ");
const mong = "1:Nhân Vật Mẫu Giáp, 1:Nhân Vật Mẫu Bính, 3:Nhân Vật Mẫu Ất";
const ok2 = ds === mong;
console.log((ok2 ? "OK  " : "LỖI") + " bộ mẫu: thứ tự xếp hạng theo cac_bac (cùng bậc cùng hạng, không có bac thì không xếp) – " + ds);
process.exit(ok1 && ok2 ? 0 : 1);
' "$BO_HTML" || loi=1
# Bộ thật không có ban_co_biet → không có khối Bạn có biết; có < 2 nhân vật ghi `bac` → không có khối Xếp hạng
node --input-type=module -e '
import fs from "node:fs"; import matter from "gray-matter";
let loi = 0;
for (const bo of fs.readdirSync("content")) {
  if (bo === process.argv[1] || !fs.existsSync(`content/${bo}/index.mdx`)) continue;
  const h = fs.readFileSync(`dist/${bo}/index.html`, "utf8");
  const coBcb = (matter.read(`content/${bo}/index.mdx`).data.ban_co_biet || []).length > 0;
  const nv = fs.existsSync(`content/${bo}/nhan-vat`) ? fs.readdirSync(`content/${bo}/nhan-vat`).filter((f) => matter.read(`content/${bo}/nhan-vat/${f}`).data.bac).length : 0;
  if (!coBcb) { const ok = !h.includes("id=\"ban-co-biet\""); loi += !ok; console.log(`${ok ? "OK  " : "LỖI"} ${bo}: không có ban_co_biet → khối Bạn có biết tự ẩn`); }
  if (nv < 2) { const ok = !h.includes("id=\"xep-hang-suc-manh\""); loi += !ok; console.log(`${ok ? "OK  " : "LỖI"} ${bo}: ${nv} nhân vật có bac → khối Xếp hạng tự ẩn`); }
}
process.exit(loi ? 1 : 0);
' "$BO" || loi=1
[ $loi -eq 0 ] && echo "errors: []" || echo "errors: có lỗi"
exit $loi
