# Tu Chân Bảo Điển v2: Astro + MDX + Pagefind (bản đề xuất)

Đây là **bản kiến trúc mới, chạy song song** với web hiện tại (HTML/JS thuần + Google Sheet). Web hiện tại **không bị ảnh hưởng**. Thư mục `v2/` không được đăng lên GitHub Pages cho tới khi bạn quyết định chuyển.

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
aliases: ["Hàn lão ma"]            # tên khác: tìm kiếm + tự gắn liên kết
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

**Kiểm tra khi build** (`scripts/kiem-tra-noi-dung.mjs`, thông báo tiếng Việt ghi file + trường + lý do): title 50–65; description 140–160; faqs 3–6; slug không dấu, trùng tên file, không trùng đường dẫn hệ thống (`trang-2`…); series/category trùng thư mục; bộ truyện có `index.mdx`; file ảnh có thật và cạnh ngắn ≥ 600px; có ảnh thì phải ghi nguồn; thân bài không có thẻ HTML/component.

**Xem cả bài nháp khi làm việc**: `XEM_NHAP=1 npm run build && npm run preview` (bản này có dải đỏ cảnh báo và `noindex`, **không đăng**).

## 4. Lệnh và biến môi trường
```bash
cd v2
npm ci
npm run build          # kiểm tra nội dung → ảnh → HTML → chỉ mục tìm kiếm, kết quả ở dist/
npm run test:noi-dung  # 3 file sai phải bị chặn
bash tests/thu-them-bai.sh   # thêm 1 bài hợp lệ → phải có trang mới
npm run preview        # xem thử ở http://localhost:4321
```
| Biến | Ý nghĩa |
|---|---|
| `SITE_URL` | Địa chỉ web thật (canonical, sitemap, Open Graph). Mặc định `https://trongnghiabui95.github.io` |
| `BASE_PATH` | Đường dẫn con nếu web không nằm ở gốc tên miền (ví dụ `/tangkinhcac/v2/`) |
| `PUBLIC_ADSENSE_CLIENT` | Mã `ca-pub-…`. Trống = không có quảng cáo |
| `PUBLIC_ADSENSE_SLOT_GIUA_BAI`, `PUBLIC_ADSENSE_SLOT_CUOI_BAI` | Mã ô quảng cáo (nếu dùng ô cố định thay vì quảng cáo tự động) |
| `QC_XEM_THU=1` | Hiện khung giữ chỗ quảng cáo để xem vị trí (chỉ dùng khi làm việc, **không** bật khi đăng thật) |
| `XEM_NHAP=1` | Build kèm bài nháp để xem thử (không đăng) |
| `TIM_TOAN_VAN=1` | Tìm cả thân bài (chỉ mục lớn hơn nhiều, xem mục 6) |

Đăng lên **Cloudflare Pages**: thư mục gốc `v2`, lệnh build `npm run build`, thư mục kết quả `dist`, biến `SITE_URL` = tên miền thật.

## 5. Quy tắc quảng cáo đã cài
- Giữa bài: sau mỗi 3 mục `##`, đặt trước tiêu đề mục kế tiếp. Không đặt sát ảnh, video, spoiler, component ảnh, nút chuyển chương, và không đặt trong mục Câu hỏi thường gặp. Vị trí vi phạm thì dời sang mục sau.
- Cuối bài: 1 ô (`AdUnit`), cách lưới ảnh nhân vật ≥ 40px.
- Mọi ô có nhãn "Quảng cáo", lề ≥ 40px, chiều cao giữ chỗ 290px (không nhảy trang). Quảng cáo chỉ được yêu cầu khi ô sắp lọt vào màn hình.
- Không quảng cáo ở trang tìm kiếm và 404 (đều `noindex`).

## 6. Số đo thật
**Ảnh** (6 ảnh mẫu): WebP 600×800, 6–43 KB; bản 300px cho thẻ nhỏ; ảnh chia sẻ 1200×630. Đã kiểm: không còn EXIF/XMP/ICC. Build lại chỉ xử lý ảnh đổi (bộ nhớ đệm).

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
- **Nhập liệu:** bản hiện tại nhập bằng Google Sheet. Bản này viết file `.mdx`, khó hơn với người không chuyên. Nên có thêm script **Sheet → MDX** chạy trên GitHub mỗi ngày, để vẫn nhập bằng Sheet.
- **Chuyển dữ liệu cũ:** chưa chuyển (mới có 1 truyện mẫu).
- **Next.js:** không làm, lý do ở mục 1.
- **ProfilePage:** `schemaNhanVat({ kieu: 'ProfilePage' })` có sẵn, nhưng Google dành loại này cho hồ sơ người thật, nên mặc định dùng Article.
- **FAQPage:** dữ liệu hợp lệ, nhưng từ 2023 Google chỉ hiện kết quả FAQ dạng đặc biệt cho trang chính phủ/y tế.
