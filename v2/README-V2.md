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
├── astro.config.mjs              cấu hình: site, URL đẹp, plugin remark/rehype
├── package.json                  lệnh: npm run build = xử lý ảnh → astro build → pagefind
├── content/                      ⭐ NỘI DUNG (mỗi bài 1 file .mdx)
│   └── pham-nhan-tu-tien/
│       ├── index.mdx             trang review truyện
│       ├── nhan-vat/han-lap.mdx  hồ sơ nhân vật
│       ├── phap-bao/*.mdx        pháp bảo
│       └── canh-gioi/*.mdx       cảnh giới (thu_tu = bậc)
├── anh-goc/                      ⭐ ẢNH GỐC (chưa xử lý) theo truyện
│   └── pham-nhan-tu-tien/{nhan-vat,phap-bao,bia}/…
├── scripts/process-images.mjs    xử lý ảnh bằng sharp (mục 3)
├── public/anh/                   ảnh đã xử lý (WebP, sinh tự động)
└── src/
    ├── content.config.ts         khai báo cột frontmatter (kiểm tra sai kiểu lúc build)
    ├── data/anh.json             danh sách ảnh đã xử lý (sinh tự động)
    ├── lib/
    │   ├── remark-lien-ket-noi-bo.mjs   tự gắn liên kết nội bộ (mục 4)
    │   ├── remark-cau-hoi.mjs           rút "Câu hỏi thường gặp" → FAQPage
    │   ├── rehype-chen-quang-cao.mjs    chèn quảng cáo giữa bài an toàn
    │   ├── schema.js                    JSON-LD: Article, BreadcrumbList, FAQPage, Review
    │   ├── sitemap.js, danh-sach.js, tien-ich.js, chi-muc-noi-dung.mjs
    ├── components/
    │   ├── CharacterCardImage.astro     ảnh thẻ: figure/figcaption, khung cổ phong, huy hiệu cảnh giới
    │   ├── DisclaimerBanner.astro       miễn trừ trách nhiệm (chân trang)
    │   ├── AdUnit.astro                 ô quảng cáo đặt tay
    │   ├── YouTubeFacade.astro          video: chỉ tải YouTube khi bấm
    │   ├── Spoiler.astro, Breadcrumb.astro, PhanTrang.astro, TrangMucTu.astro, DanhSachNhanVat.astro
    ├── layouts/BoCuc.astro       <head> SEO: title, description, canonical, Open Graph, JSON-LD
    └── pages/
        ├── [truyen]/nhan-vat/[slug].astro   ⭐ trang chi tiết nhân vật (mục 5)
        ├── [truyen]/nhan-vat/index.astro + trang-[so].astro   danh sách 24 thẻ/trang
        ├── [truyen]/index.astro, [truyen]/phap-bao/[slug].astro, [truyen]/canh-gioi/[slug].astro
        ├── tim-kiem.astro                    tìm kiếm Pagefind
        └── robots.txt.ts, sitemap-index.xml.ts, sitemap-[truyen].xml.ts, sitemap-trang-chinh.xml.ts
```
URL sinh ra: `/pham-nhan-tu-tien/`, `/pham-nhan-tu-tien/nhan-vat/han-lap/`, `/pham-nhan-tu-tien/nhan-vat/trang-2/`, `/sitemap-pham-nhan-tu-tien.xml`.

## 3. Thêm một nhân vật
1. Bỏ ảnh gốc vào `anh-goc/<truyen>/nhan-vat/<slug>.jpg` (png/webp đều được).
2. Tạo `content/<truyen>/nhan-vat/<slug>.mdx`, chép phần đầu từ `han-lap.mdx`:
   ```yaml
   ---
   ten: Hàn Lập
   ten_khac: [Hàn lão ma]           # dùng cho tìm kiếm + tự gắn liên kết
   mo_ta: (≤ 170 ký tự, thành meta description + đoạn mở đầu)
   vai_tro: chinh                   # chinh | phu | lien-quan | phan-dien
   canh_gioi: luyen-hu              # slug trong canh-gioi/
   phap_bao: [chuong-thien-binh]
   anh:
     goc: nhan-vat/han-lap.jpg
     nguon: Tạo hình nhân vật Hàn Lập – Minh họa từ hoạt hình Phàm Nhân Tu Tiên (Bilibili)
     cat_duoi: 0.12                 # cắt bỏ 12% dưới (phụ đề). cat_tren tương tự
     # tam: [0.5, 0.3]              # nếu tự động cắt lệch mặt: ép tâm cắt (x, y từ 0 tới 1)
   ngay_dang: 2026-11-10
   ngay_cap_nhat: 2026-11-18
   spoiler: true
   # youtube: <id video chính thức>  # hiện khung video (chỉ tải YouTube khi bấm)
   ---
   ```
3. Viết nội dung bằng Markdown: `## Mục`. Đoạn tiết lộ cốt truyện bọc trong `<Spoiler>…</Spoiler>`. Cuối bài có thể thêm:
   ```md
   ## Câu hỏi thường gặp
   ### Câu hỏi?
   Câu trả lời.
   ```
   Mục này tự thành dữ liệu FAQPage.
4. Không cần tự chèn link: tên nhân vật, pháp bảo, cảnh giới cùng truyện được nối tự động ở lần xuất hiện đầu.
5. Chạy `npm run build` (hoặc để GitHub tự build). Sai kiểu dữ liệu (ví dụ `vai_tro: chính` có dấu) thì build báo lỗi, chỉ đúng file.

## 4. Lệnh và biến môi trường
```bash
cd v2
npm ci
npm run build          # ảnh → HTML → chỉ mục tìm kiếm, kết quả ở dist/
npm run preview        # xem thử ở http://localhost:4321
```
| Biến | Ý nghĩa |
|---|---|
| `SITE_URL` | Địa chỉ web thật (canonical, sitemap, Open Graph). Mặc định `https://trongnghiabui95.github.io` |
| `BASE_PATH` | Đường dẫn con nếu web không nằm ở gốc tên miền (ví dụ `/tangkinhcac/v2/`) |
| `PUBLIC_ADSENSE_CLIENT` | Mã `ca-pub-…`. Trống = không có quảng cáo |
| `PUBLIC_ADSENSE_SLOT_GIUA_BAI`, `PUBLIC_ADSENSE_SLOT_CUOI_BAI` | Mã ô quảng cáo (nếu dùng ô cố định thay vì quảng cáo tự động) |
| `QC_XEM_THU=1` | Hiện khung giữ chỗ quảng cáo để xem vị trí (chỉ dùng khi làm việc, **không** bật khi đăng thật) |
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
