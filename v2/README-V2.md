# Tu Chân Bảo Điển v2: Astro + MDX + Pagefind

Đây là **web chính thức** của Tu Chân Bảo Điển, đăng trên Cloudflare Pages: https://tuchanbaodien.com. Web cũ (HTML/JS + Google Sheet) đã được chuyển hết tính năng sang đây (Issue #51) và xoá khỏi repo (Issue #52); địa chỉ GitHub Pages cũ tự chuyển hướng sang web này.

## 1. Vì sao Astro (không phải Next.js)
| Tiêu chí | Astro | Next.js (App Router, `output: 'export'`) |
|---|---|---|
| JavaScript gửi xuống trình duyệt | **0 KB mặc định**, chỉ thêm khi cần (facade YouTube, tìm kiếm) | Luôn kèm React runtime (~90 KB+) |
| MDX + plugin remark/rehype | Có sẵn | Có, cấu hình phức tạp hơn |
| Pagefind | Chạy thẳng trên `dist/` | Chạy trên `out/` |
| Tốc độ build 5.000 trang | ~3 phút (đo thật, xem mục 6) | Tương đương hoặc chậm hơn |

Trang bách khoa chủ yếu là **trang để đọc**, nên Astro hợp hơn: HTML tĩnh thuần, phục vụ từ CDN (Cloudflare Pages/GitHub Pages), chi phí 0 đồng.

## 2. Cấu trúc thư mục
```
v2/
├── content/                              ⭐ NỘI DUNG – mỗi bài 1 file .mdx (chuẩn ở mục 3)
│   └── <series>/                         thư mục bộ truyện (slug không dấu)
│       ├── index.mdx                     trang bộ truyện (có trường universe)
│       ├── nhan-vat/<slug>.mdx           ┐
│       ├── canh-gioi/<slug>.mdx          │ category = tên thư mục con
│       ├── cot-truyen/<slug>.mdx         │ (chỉ 5 danh mục này)
│       ├── phap-bao/<slug>.mdx           │
│       └── the-luc/<slug>.mdx            ┘
├── anh-goc/<series>/<category>/<slug>.(jpg|png|webp)   ảnh gốc (build tự cắt, nén, xoá EXIF)
├── scripts/
│   ├── kiem-tra-noi-dung.mjs             ⭐ kiểm tra chuẩn .mdx TRƯỚC khi build (lỗi → dừng)
│   └── process-images.mjs                xử lý ảnh bằng sharp
├── tests/
│   ├── fixtures/sai/…                    3 file sai cố ý (thiếu faqs, title 72 ký tự, có <div>)
│   ├── fixtures/hop-le/…                 1 bài hợp lệ để thử "thêm file → có trang"
│   ├── kiem-tra-fixtures.mjs             npm run test:noi-dung
│   └── thu-them-bai.sh                   bash tests/thu-them-bai.sh
└── src/
    ├── content.config.ts                 khai báo trường (Zod) – giới hạn lấy từ lib/chuan-mdx.mjs
    ├── lib/chuan-mdx.mjs                 ⭐ NGUỒN DUY NHẤT của mọi giới hạn (title, description, faqs, số từ, danh mục)
    ├── lib/remark-spoiler.mjs            khối :::spoiler … :::
    ├── lib/remark-lien-ket-noi-bo.mjs, rehype-chen-quang-cao.mjs, schema.js, sitemap.js, tien-ich.js, danh-sach.js
    ├── components/                       CharacterCardImage, TheBai, LuoiBai, TrangDanhSach, AdUnit, YouTubeFacade…
    ├── layouts/BoCuc.astro               <head> SEO + menu SINH TỪ NỘI DUNG
    └── pages/
        ├── index.astro                   trang chủ: bài mới · theo bộ · theo danh mục
        ├── [series]/index.astro          /<series>/
        ├── [series]/[category]/[slug].astro          /<series>/<category>/<slug>/  (trang bài)
        ├── [series]/[category]/index.astro + trang-[so].astro   danh sách 24 bài/trang
        ├── danh-muc/[category]/…         /danh-muc/<category>/ (mọi bộ)
        ├── vu-tru/[universe]/index.astro /vu-tru/<universe>/
        └── tim-kiem.astro, robots.txt.ts, sitemap-index.xml.ts, sitemap-[series].xml.ts, sitemap-trang-chinh.xml.ts
```

### Nguyên tắc Zero-Hardcode (bắt buộc)
Không viết cứng tên truyện, nhân vật, menu, bảng cảnh giới hay đường dẫn bài trong `src/`. Mọi trang, menu, danh sách, JSON-LD, sitemap sinh 100% lúc build từ `content/`. **BA chỉ cần thêm file .mdx là web có trang mới.** Kiểm tra: `grep -rniI "tên-truyện-bất-kỳ" src --exclude-dir=data` phải không ra gì.

## 3. Chuẩn file .mdx & thêm bài mới
Chuẩn đầy đủ: Issue #27. Tóm tắt:
```yaml
---
title: "Hàn Lập là ai? Tiểu sử, cảnh giới, đạo lữ trong Phàm Nhân Tu Tiên"   # 50–65 ký tự
slug: han-lap                      # TRÙNG tên file, không dấu
description: "…"                   # 140–160 ký tự
keywords: ["hàn lập là ai", "đạo lữ hàn lập"]
universe: pham-nhan-tu-tien        # vũ trụ (nhiều bộ chung thế giới thì dùng chung)
series: pham-nhan-tu-tien          # TRÙNG thư mục bộ truyện
category: nhan-vat                 # TRÙNG thư mục con
aliases: ["Hàn lão ma"]            # tên khác: tìm kiếm + tự gắn liên kết (xem "Liên kết nội bộ tự động" bên dưới)
date: 2026-11-20
updated: 2026-11-20
infobox:                           # bảng thông tin cạnh ảnh; giá trị trùng tên bài khác cùng bộ tự thành link
  Thế lực: Hoàng Phong Cốc
  Đạo lữ: Nam Cung Uyển
image: nhan-vat/han-lap.webp       # trong anh-goc/<series>/
image_source: { ten: "…", url: "https://…" }
image_crop: { duoi: 0.1 }          # bỏ khung đen/phụ đề – KHÔNG dùng để xoá logo/watermark
spoiler: true
faqs:                              # 3–6 câu (thành khối FAQ + JSON-LD FAQPage)
  - q: "Hàn Lập có mấy vợ?"
    a: "…"
nhap: false                        # true = chưa xuất bản
# Tuỳ chọn: ten, vai_tro (chinh|phu|lien-quan|phan-dien), canh_gioi, phap_bao, thu_tu, youtube
---
```
- Thân bài **chỉ Markdown** (`##`, `###`, danh sách, bảng). Không HTML/CSS/script/component. Spoiler:
  ```
  :::spoiler
  …nội dung…
  :::
  ```
- Không viết mục "Câu hỏi thường gặp" trong thân bài; FAQ lấy từ `faqs`.
- Độ dài 800–1.200 từ. Build chỉ **cảnh báo**, workflow PR (Issue #28) sẽ chặn với file mới/sửa.

**Kiểm tra khi build** (`scripts/kiem-tra-noi-dung.mjs`, thông báo tiếng Việt ghi file + trường + lý do): title 50–65; description 140–160; faqs 3–6; slug không dấu, trùng tên file, không trùng đường dẫn hệ thống (`trang-2`…); series/category trùng thư mục; bộ truyện có `index.mdx`; file ảnh có thật và cạnh ngắn ≥ 480px (`GIOI_HAN.canhAnhToiThieu`); có ảnh thì phải ghi nguồn; thân bài không có thẻ HTML/component.

**Xử lý ảnh khi build** (`scripts/process-images.mjs`, Issue #30):
- Đọc ảnh từ `image` (+ `image_crop`, `image_source`), cắt theo tỉ lệ danh mục (nhân vật 3:4, pháp bảo/thế lực vuông, cảnh giới/cốt truyện 16:9, bìa 2:3), xuất WebP nhiều cỡ (600px + 300px) và ảnh chia sẻ 1200×630. **Xoá toàn bộ EXIF/XMP/IPTC**.
- **Mỗi file WebP phải < 80KB**: thử chất lượng 80 → 72 → 64 → 56 → 48 → 40, lấy mức cao nhất đạt. Xuống 40 vẫn > 80KB thì dừng build, báo rõ tên file và cỡ, ví dụ:
  `✗ <series>/nhan-vat/<slug>: <slug>-<series>.webp vẫn nặng 191.9KB ở chất lượng thấp nhất 40 (cần < 80KB)…` → chọn ảnh gốc ít nhiễu hơn hoặc cắt sát hơn.
- Ảnh gốc lỗi thì báo rõ, không treo/crash: không có file (`không có file ảnh gốc …`), không phải ảnh (`… không phải ảnh hợp lệ`), quá nhỏ (`ảnh … quá nhỏ 400×533px: cạnh ngắn 400px, cần ≥ 480px`).
- Chất lượng thật dùng và cỡ KB ghi vào `src/data/anh.json` (`chat_luong`, `kb`, `goc`, từng cỡ trong `srcset`). Đổi ngưỡng 80KB/các mức chất lượng thì build sau tự làm lại ảnh (nằm trong dấu vết bộ nhớ đệm).
- Chú thích dưới ảnh: `Ảnh: <image_source.ten>` có link tới `image_source.url`.
- **Không** có bước xoá logo/watermark (xem mục 7).
- Kiểm thử: `npm run test:anh` (tự tạo ảnh ~2MB có EXIF, ảnh 400px, file hỏng trong thư mục tạm).

**Xem cả bài nháp khi làm việc**: `XEM_NHAP=1 npm run build && npm run preview` (bản này có dải đỏ cảnh báo và `noindex`, **không đăng**).

### Trường tuỳ chọn chuyển từ web cũ (Issue #51)
Không bắt buộc; bỏ trống thì mục tương ứng tự ẩn. Ví dụ đầy đủ: `content/pham-nhan-tu-tien/index.mdx`, `nhan-vat/han-lap.mdx`, `canh-gioi/he-thong-canh-gioi.mdx`.

**Trang bộ truyện (`index.mdx`)**
| Trường | Hiện ở đâu |
|---|---|
| `loai: tu-tien` / `anime` | Menu "Truyện Tu Tiên" / "Anime", trang `/loai/<loai>/` |
| `so_chuong`, `so_tap`, `so_mua`, `nen_tang`, `nam`, `studio` | Khung thông tin |
| `diem_chi_tiet: { cot_truyen, nhan_vat, the_gioi, hinh_anh }` | Mục "Đánh giá" (thanh điểm) |
| `ban_do: { anh, nguon }` + `dia_diem: [{ ten, cap, thuoc, mo_ta }]` | Mục "Bản đồ thế giới" (ảnh trong `anh-goc/<series>/ban-do/`) |
| `hanh_trinh: [{ dia_diem, canh_gioi, su_kien }]` | Mục "Hành trình nhân vật chính" |
| `thu_vien: [{ anh, nguon, chu_thich, nhan_vat? }]` | Mục "Thư viện ảnh" (ảnh trong `anh-goc/<series>/thu-vien/`); có `nhan_vat` thì hiện cả ở trang nhân vật |
| `ost: [{ youtube, ten }]` | Mục "OST" |
| `thuat_ngu: [{ ten, giai_thich }]` | Mục "Thuật ngữ" + trang `/thuat-ngu/` (tìm được bằng ô tìm kiếm) |
| `tuong_tu: [{ series, ly_do }]`, `cho_nguoi_moi` | "Tác phẩm tương tự" + trang `/de-cu/` |
| `ban_co_biet: [{ noi_dung, nguon?, nguon_url? }]` | Mục "Bạn có biết" (Issue #11): hiện 3 thẻ; có hơn 3 ý thì mỗi lượt xem chọn ngẫu nhiên 3 ý (JS nhỏ, tắt JS vẫn thấy 3 ý đầu). `noi_dung` dài 30–220 ký tự (`GIOI_HAN.banCoBiet`), sai là dừng build |

**Bài nhân vật**: `noi_bat: true` (trang chủ), `bac` (tên bậc cảnh giới cao nhất – hiện ở bậc thang cảnh giới), `the_luc: ["Tên/slug"]`, `cuoc_doi: [{ giai_doan, dia_diem, canh_gioi, su_kien }]`, `quan_he: [{ nhan_vat: slug, quan_he: dao-lu|su-phu|de-tu|ke-thu|ban-be|gia-dinh|dong-mon|chữ tự do, ghi_chu }]`.
**Bài cảnh giới**: `cac_bac: [{ ten, the_gioi, mo_ta }]` theo thứ tự → bậc thang kèm nhân vật ở từng bậc.
**Xếp hạng sức mạnh** (trang bộ, Issue #11 – không cần trường mới): lấy `bac` của từng bài nhân vật, đối chiếu thứ tự `cac_bac` trong bài cảnh giới của chính bộ đó (bài đầu tiên theo `thu_tu` có `cac_bac`), xếp từ cao xuống thấp; cùng bậc thì cùng hạng. Tên bậc so khớp **không phân biệt hoa thường/dấu** nhưng phải là đúng một tên trong `cac_bac` – ghi tên khác (vd. "Bước thứ ba" khi `cac_bac` không có bậc đó) thì nhân vật không được xếp. Khối chỉ hiện khi xếp được ≥ 2 nhân vật (`GIOI_HAN.xepHangToiThieu`).
**Bài thế lực**: `thu_linh` (slug nhân vật), `tru_so`; thành viên tự lấy từ `the_luc` của bài nhân vật.

## 4. Lệnh và biến môi trường
```bash
cd v2
npm ci
npm run build          # kiểm tra nội dung → ảnh → HTML → chỉ mục tìm kiếm, kết quả ở dist/
npm run test:noi-dung  # 3 file sai phải bị chặn
npm run test:anh       # ảnh: < 80KB, không EXIF, chặn ảnh nhỏ/hỏng/thiếu
bash tests/thu-them-bai.sh   # thêm 1 bài hợp lệ → phải có trang mới
npm run preview        # xem thử ở http://localhost:4321
```
| Biến | Ý nghĩa |
|---|---|
| `SITE_URL` | Địa chỉ web thật (canonical, sitemap, Open Graph). Mặc định `https://tuchanbaodien.com` |
| `BASE_PATH` | Đường dẫn con nếu web không nằm ở gốc tên miền (ví dụ `/tu-chan/`) |
| `PUBLIC_ADSENSE_CLIENT` | Mã `ca-pub-…`. Trống = không có quảng cáo |
| `PUBLIC_ADSENSE_SLOT_GIUA_BAI`, `PUBLIC_ADSENSE_SLOT_CUOI_BAI` | Mã ô quảng cáo (nếu dùng ô cố định thay vì quảng cáo tự động) |
| `QC_XEM_THU=1` | Hiện khung giữ chỗ quảng cáo để xem vị trí (chỉ dùng khi làm việc, **không** bật khi đăng thật) |
| `XEM_NHAP=1` | Build kèm bài nháp để xem thử (không đăng) |
| `TIM_TOAN_VAN=1` | Tìm cả thân bài (chỉ mục lớn hơn nhiều, xem mục 6) |

### Liên kết nội bộ tự động
Lúc build, plugin `src/lib/remark-lien-ket-noi-bo.mjs` tự biến tên bài khác **cùng bộ truyện** thành link (chỉ lần nhắc đầu tiên):
- **Tên dùng để nhận ra bài**: tên ngắn rút từ `title` (phần trước "là ai/là gì"), `aliases`, và giá trị infobox có khoá *Biệt hiệu / Biệt danh / Tên khác / Danh hiệu / Đạo hiệu…* (bỏ tên chữ Hán). Tên truyện thì nối ở mọi bộ.
- **Tối đa 10 link mỗi bài** (`GIOI_HAN.lienKetTuDong` trong `src/lib/chuan-mdx.mjs`). Quá 10 thì ưu tiên bài *cũng nhắc lại* bài này → 2 bài nhắc tên nhau có link 2 chiều.
- **Không gắn link** trong tiêu đề, khối `:::spoiler`, mục "Câu hỏi thường gặp" trong thân bài, FAQ và infobox ở frontmatter.
- Danh sách link của từng bài được ghi ra `bao-cao/lien-ket-noi-bo.json` (không đưa lên git); bot PR đưa vào bảng tóm tắt (cột "Link nội bộ tự gắn" + mục xổ xuống, ⇄ = có link 2 chiều).
- Kiểm thử: `npm run test:lien-ket` (cũng chạy trong `npm run test:noi-dung`).

### Kiểm tra tự động trên mỗi PR (workflow `v2-build`)
Mỗi PR có sửa `v2/` chạy lần lượt:
1. **Kiểm tra nội dung** – bài `.mdx` **mới/sửa trong PR** mà thân bài ngoài 800–1.200 từ là **lỗi** (bài cũ không sửa chỉ cảnh báo).
2. **Build** – ảnh → HTML → chỉ mục tìm kiếm.
3. **Kiểm tra bản build** (`node scripts/kiem-tra-dist.mjs`) – link nội bộ hỏng; mỗi bài đã xuất bản có trang, có JSON-LD Article; sitemap đủ URL. Chung cho mọi bài, không viết cứng tên bài.
4. **Bot ghi bảng tóm tắt vào PR** (`scripts/bao-cao-pr.mjs`): số từ, độ dài title/description, số FAQ, dung lượng ảnh, số link nội bộ tự gắn (≤ 10) và danh sách link của từng bài mới/sửa. Mỗi lần đẩy code, bot sửa lại đúng bình luận đó (không đăng chồng).
5. Bước nào lỗi → dấu ❌ đỏ trên PR, chi tiết nằm trong bảng.

### Đăng web: Cloudflare Pages (làm 1 lần)
1. Vào <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → tab **Pages** → **Connect to Git**.
2. Chọn GitHub, cho phép Cloudflare đọc repo `tuchanbaodien`, chọn repo đó.
3. Điền:
   | Ô | Giá trị |
   |---|---|
   | Project name | `tuchanbaodien` (web sẽ ở `https://tuchanbaodien.com`) |
   | Production branch | `main` |
   | Framework preset | `Astro` (hoặc `None`) |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory (Advanced) | `v2` |
4. **Environment variables** (mục Advanced) thêm 2 biến: `SITE_URL` = `https://tuchanbaodien.com`, `NODE_VERSION` = `22.23.5`.
5. Bấm **Save and Deploy**. Lần đầu mất khoảng 2–3 phút.
6. Bản xem trước cho từng PR: Cloudflare bật sẵn. Kiểm tra ở **Settings → Builds & deployments → Preview branches** = *All non-Production branches*. Mỗi PR sẽ có bình luận/nút "Cloudflare Pages" kèm link `https://<mã>.tuchanbaodien.pages.dev`.
7. Từ nay merge vào `main` → Cloudflare tự build lại và cập nhật `tuchanbaodien.com`. Địa chỉ GitHub Pages cũ chỉ còn trang chuyển hướng (`.github/chuyen-huong/`).
8. Khi có tên miền thật: **Custom domains** → thêm tên miền, rồi đổi `SITE_URL` sang tên miền đó và bấm **Retry deployment**.

### Kiểm tra web còn chạy hằng ngày (workflow `kiem-tra-web`)
- Mỗi sáng **6:30 giờ VN** (và khi bấm chạy tay ở tab **Actions → kiem-tra-web → Run workflow**), GitHub tự mở web thật: trang chủ, sitemap và **3 bài ngẫu nhiên** lấy từ sitemap – phải trả mã 200 và có `<title>`. Kiểm tra cả **tên miền chính** lẫn bản **Cloudflare Pages** (`*.pages.dev`).
- Tên miền chính lỗi mà bản pages.dev vẫn chạy → kết luận **"Lỗi tên miền/DNS"**; cả hai lỗi → **"Web hỏng"** (xem lần deploy gần nhất).
- Lỗi → workflow **đỏ** + mở 1 Issue **"🔴 Web không lên"** (nhãn `bug`, `P0`); nếu Issue đó đang mở thì chỉ bình luận thêm, không tạo trùng. Web lên lại → bot bình luận **"Web đã lên lại"** (đóng Issue bằng tay sau khi xem).
- Địa chỉ đọc từ biến repo **Settings → Secrets and variables → Actions → Variables**: `SITE_URL` (mặc định `https://tuchanbaodien.com`), `PAGES_URL` (mặc định `https://tuchanbaodien.pages.dev`). Chạy tay có thể nhập địa chỉ khác để thử.
- Chạy trên máy: `node scripts/kiem-tra-web.mjs --chinh <địa chỉ> --pages <địa chỉ>`. Kiểm thử không cần mạng: `npm run build && npm run test:web`.

## 5. Quy tắc quảng cáo đã cài
- Giữa bài: sau mỗi 3 mục `##`, đặt trước tiêu đề mục kế tiếp. Không đặt sát ảnh, video, spoiler, component ảnh, nút chuyển chương, và không đặt trong mục Câu hỏi thường gặp. Vị trí vi phạm thì dời sang mục sau.
- Cuối bài: 1 ô (`AdUnit`), cách lưới ảnh nhân vật ≥ 40px.
- Mọi ô có nhãn "Quảng cáo", lề ≥ 40px, chiều cao giữ chỗ 290px (không nhảy trang). Quảng cáo chỉ được yêu cầu khi ô sắp lọt vào màn hình.
- Không quảng cáo ở trang tìm kiếm và 404 (đều `noindex`).

## 6. Số đo thật
**Ảnh** (6 ảnh mẫu): WebP cỡ chính 11–42 KB, đều ở chất lượng 80 (giới hạn < 80KB/file); bản 300px cho thẻ nhỏ; ảnh chia sẻ 1200×630. Đã kiểm: không còn EXIF/XMP/ICC. Build lại chỉ xử lý ảnh đổi (bộ nhớ đệm).

**Tìm kiếm** (thử với 5.062 bài giả lập):
| Chế độ | Mỗi lần tìm tải | Kích thước chỉ mục trên server |
|---|---|---|
| Mặc định: tên + tên khác + mô tả | **6–14 KB chỉ mục + 2–7 KB đoạn trích** | 21 MB (chia mảnh, không ai tải hết) |
| `TIM_TOAN_VAN=1`: cả thân bài | 85–220 KB chỉ mục + 6–20 KB đoạn trích | 25 MB |

Cộng thêm **~140–170 KB phần cố định** (bộ máy Pagefind, tải 1 lần rồi trình duyệt giữ lại). Gõ không dấu vẫn ra ("han lap" → Hàn Lập, "han lao ma" → Hàn Lập, "uyen nhi" → Nam Cung Uyển).

**Build**: 5.266 trang trong khoảng 3 phút.

**Kiểm giao diện (DESIGN.md Floor)**: 320–1280px không cuộn ngang, 1 `h1`, không chữ < 13px, ảnh có `alt`, ảnh đầu trang tải ngay, còn lại tải lười.

## 7. Về bản quyền ảnh (đọc kỹ)
- Cắt khung, nén, phủ lớp tối, khung viền hay huy hiệu **không biến ảnh thành "sử dụng chuyển đổi"** về mặt pháp lý, và **không làm mất quyền** của chủ sở hữu. Điều giúp trang review an toàn hơn là: mục đích bình luận, chỉ dùng **ít ảnh, độ phân giải thấp** (600px), **ghi nguồn rõ**, có kênh nhận yêu cầu gỡ, và gỡ nhanh khi được yêu cầu. Script và component ở đây hỗ trợ đúng những việc đó.
- `cat_tren` / `cat_duoi` dùng để bỏ **khung đen và phụ đề** cho ảnh gọn. Script **không có** tính năng xoá logo hay watermark của nhà sản xuất. Ở nhiều nước, xoá thông tin quản lý bản quyền bị cấm riêng (ví dụ Điều 1202 DMCA của Mỹ). Logo trên ảnh Mặc Đại Phu được giữ nguyên.
- Google AdSense có thể hạn chế quảng cáo trên trang dùng nội dung vi phạm bản quyền. Ưu tiên ảnh quảng bá chính thức, poster, hoặc tranh tự vẽ (`tools/ve_anh_mau.py` của bản hiện tại).

## 8. Chưa làm / cần quyết
- **Nhập liệu:** nội dung viết bằng file `.mdx` (BA/AI viết, chủ dự án duyệt qua PR). Google Sheet của web cũ không còn dùng.
- **Chuyển dữ liệu cũ:** chưa chuyển (mới có 1 truyện mẫu).
- **Next.js:** không làm, lý do ở mục 1.
- **ProfilePage:** `schemaNhanVat({ kieu: 'ProfilePage' })` có sẵn, nhưng Google dành loại này cho hồ sơ người thật, nên mặc định dùng Article.
- **FAQPage:** dữ liệu hợp lệ, nhưng từ 2023 Google chỉ hiện kết quả FAQ dạng đặc biệt cho trang chính phủ/y tế.
