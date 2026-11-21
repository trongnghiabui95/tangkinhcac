// Khai báo nội dung web v2 theo CHUẨN FILE .MDX (Issue #27). Mọi giới hạn lấy từ src/lib/chuan-mdx.mjs.
//   v2/content/<series>/index.mdx                  → trang bộ truyện
//   v2/content/<series>/<category>/<slug>.mdx      → bài viết (category: nhan-vat | canh-gioi | cot-truyen | phap-bao | the-luc)
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CAC_DANH_MUC, CAC_LOAI_TRUYEN, GIOI_HAN, SLUG } from './lib/chuan-mdx.mjs';

const doDai = (ten: string, [min, max]: number[]) =>
  z.string().refine((s) => s.length >= min && s.length <= max, (s) => ({ message: `${ten} phải dài ${min}–${max} ký tự (đang có ${s.length})` }));
const slug = (ten: string) => z.string().regex(SLUG, `${ten} chỉ gồm chữ thường không dấu, số và gạch ngang`);
const nguonAnh = z.object({ ten: z.string().min(3, 'image_source.ten không được trống'), url: z.string().url('image_source.url phải là link đầy đủ (https://…)') });
const catAnh = z.object({
  tren: z.number().min(0).max(0.4).optional(),
  duoi: z.number().min(0).max(0.4).optional(),
  tam: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]).optional(),
});

export const collections = {
  // Trang bộ truyện: content/<series>/index.mdx (giữ trường cũ + universe)
  series: defineCollection({
    loader: glob({ pattern: '*/index.mdx', base: './content' }),
    schema: z.object({
      ten: z.string(),
      universe: slug('universe'),
      universe_ten: z.string().optional(),           // tên hiển thị của vũ trụ (mặc định = tên bộ truyện cùng slug)
      ten_trung: z.string().optional(),
      ten_khac: z.array(z.string()).default([]),
      tac_gia: z.string(),
      the_loai: z.array(z.string()),
      tinh_trang: z.enum(['Đang ra', 'Hoàn thành', 'Tạm ngưng']),
      diem: z.number().min(0).max(10).optional(),
      mo_ta: z.string().max(170),
      anh: z.object({ goc: z.string(), nguon: z.string(), nguon_url: z.string().url().optional(),
        cat_tren: z.number().optional(), cat_duoi: z.number().optional(), tam: z.tuple([z.number(), z.number()]).optional() }).optional(),
      ngay_dang: z.coerce.date(),
      ngay_cap_nhat: z.coerce.date(),
      nhap: z.boolean().default(false),
      // ---- Chuyển từ web cũ (Issue #51) – TUỲ CHỌN, bộ truyện cũ không có vẫn chạy ----
      loai: z.enum(CAC_LOAI_TRUYEN as [string, ...string[]]).default('tu-tien'),   // tu-tien | anime | donghua (cùng universe khác loai → nút qua lại, Issue #4)
      so_chuong: z.number().int().optional(),
      so_tap: z.number().int().optional(),
      so_mua: z.number().int().optional(),
      nen_tang: z.string().optional(),               // Khởi Điểm, Bilibili…
      nam: z.number().int().optional(),
      studio: z.string().optional(),
      diem_chi_tiet: z.object({ cot_truyen: z.number().min(0).max(10).optional(), nhan_vat: z.number().min(0).max(10).optional(),
        the_gioi: z.number().min(0).max(10).optional(), hinh_anh: z.number().min(0).max(10).optional() }).optional(),
      thu_vien: z.array(z.object({ anh: z.string(), nguon: z.string(), nguon_url: z.string().url().optional(),
        chu_thich: z.string(), nhan_vat: z.string().optional() })).default([]),   // ảnh trong anh-goc/<series>/
      ban_do: z.object({ anh: z.string(), nguon: z.string(), nguon_url: z.string().url().optional() }).optional(),
      dia_diem: z.array(z.object({ ten: z.string(), cap: z.string().optional(), thuoc: z.string().optional(), mo_ta: z.string() })).default([]),
      hanh_trinh: z.array(z.object({ dia_diem: z.string().optional(), su_kien: z.string(), canh_gioi: z.string().optional() })).default([]),
      thuat_ngu: z.array(z.object({ ten: z.string(), giai_thich: z.string() })).default([]),
      tuong_tu: z.array(z.object({ series: slug('tuong_tu.series'), ly_do: z.string() })).default([]),   // "Thích bộ này thì đọc…"
      cho_nguoi_moi: z.string().optional(),          // lý do đề cử cho người mới đọc (trang Đề cử)
      ost: z.array(z.object({ youtube: z.string(), ten: z.string() })).default([]),
      // ---- Issue #11 – TUỲ CHỌN ----
      ban_co_biet: z.array(z.object({ noi_dung: doDai('ban_co_biet.noi_dung', GIOI_HAN.banCoBiet),
        nguon: z.string().optional(), nguon_url: z.string().url().optional() })).default([]),   // thẻ "Bạn có biết" ở trang bộ
      // ---- Issue #137 (anime) – TUỲ CHỌN ----
      diem_mal: z.number().min(0).max(10).optional(),                 // điểm MyAnimeList
      xem_o: z.array(z.object({ ten: z.string(), url: z.string().url('xem_o.url phải là link đầy đủ (https://…)') })).default([]),   // nền tảng xem CHÍNH THỨC
      cac_arc: z.array(z.object({ ten: z.string(), slug: slug('cac_arc.slug').optional(),   // slug bài cot-truyen cùng bộ (có thì bấm được)
        tap_tu: z.number().int().min(0), tap_den: z.number().int().min(0).optional(),
        chuong: z.union([z.string(), z.number()]).optional(), nam: z.union([z.string(), z.number()]).optional(),
        dang_chieu: z.boolean().default(false) })).default([]),
      thu_tu_xem: z.string().optional(),             // "Thứ tự xem cho người mới"
      tap_filler: z.string().optional(),             // tập nên bỏ qua (có nguồn)
    }),
  }),

  // Bài viết theo chuẩn .mdx mới
  baiViet: defineCollection({
    // generateId: mã bài = đường dẫn file (<series>/<category>/<slug>). Mặc định Astro lấy trường `slug` làm mã,
    // khiến 2 bộ truyện có bài trùng slug (vd. cùng có he-thong-canh-gioi) đè mất bài của nhau.
    loader: glob({ pattern: '*/*/*.mdx', base: './content', generateId: ({ entry }) => entry.replace(/\.mdx$/, '') }),
    schema: z.object({
      title: doDai('title', GIOI_HAN.title),
      slug: slug('slug'),
      description: doDai('description', GIOI_HAN.description),
      keywords: z.array(z.string()).min(1, 'keywords cần ít nhất 1 từ khoá'),
      universe: slug('universe'),
      series: slug('series'),
      category: z.enum(CAC_DANH_MUC as [string, ...string[]], { message: `category phải là một trong: ${CAC_DANH_MUC.join(', ')}` }),
      aliases: z.array(z.string()).default([]),
      date: z.coerce.date(),
      updated: z.coerce.date(),
      infobox: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
      image: z.string().optional(),
      image_source: nguonAnh.optional(),
      image_crop: catAnh.optional(),
      spoiler: z.boolean().default(false),
      faqs: z.array(z.object({ q: z.string().min(5), a: z.string().min(5) }))
        .refine((a) => a.length >= GIOI_HAN.faqs[0] && a.length <= GIOI_HAN.faqs[1], (a) => ({ message: `faqs cần ${GIOI_HAN.faqs[0]}–${GIOI_HAN.faqs[1]} câu (đang có ${a.length})` })),
      nhap: z.boolean().default(false),
      // Trường quan hệ cũ – TUỲ CHỌN (thẻ nhân vật, huy hiệu cảnh giới, thứ tự cảnh giới)
      ten: z.string().optional(),                    // tên ngắn; mặc định rút từ title
      vai_tro: z.enum(['chinh', 'phu', 'lien-quan', 'phan-dien']).optional(),
      canh_gioi: z.string().optional(),              // slug bài canh-gioi cùng series
      phap_bao: z.array(z.string()).default([]),     // slug bài phap-bao cùng series
      thu_tu: z.number().int().optional(),           // thứ tự bậc (bài canh-gioi)
      youtube: z.string().optional(),
      // ---- Chuyển từ web cũ (Issue #51) – TUỲ CHỌN ----
      noi_bat: z.boolean().default(false),           // nhân vật nổi bật ở trang chủ
      bac: z.string().optional(),                    // nhân vật: tên bậc cảnh giới cao nhất (khớp cac_bac của bài canh-gioi)
      the_luc: z.array(z.string()).default([]),      // nhân vật: slug bài the-luc cùng bộ
      cuoc_doi: z.array(z.object({ giai_doan: z.string(), dia_diem: z.string().optional(), su_kien: z.string(), canh_gioi: z.string().optional(),
        arc: z.string().optional() })).default([]),   // arc: anime hiện nhãn arc thay cho cảnh giới (Issue #137)
      quan_he: z.array(z.object({ nhan_vat: z.string(), quan_he: z.string(), ghi_chu: z.string().optional() })).default([]),  // nhan_vat = slug bài nhân vật cùng bộ, hoặc tên
      cac_bac: z.array(z.object({ ten: z.string(), mo_ta: z.string(), the_gioi: z.string().optional() })).default([]),       // bài canh-gioi: các bậc theo thứ tự
      thu_linh: z.string().optional(),               // bài the-luc: slug bài nhân vật
      tru_so: z.string().optional(),                 // bài the-luc: tên địa điểm
      // ---- Issue #137 (anime) – TUỲ CHỌN ----
      xuat_hien_dau: z.string().optional(),          // nhân vật: "Tập 1 / Chương 1"
      seiyuu: z.string().optional(),                 // nhân vật: diễn viên lồng tiếng
      nang_luc: z.array(z.string()).default([]),     // nhân vật: slug bài phap-bao cùng bộ (năng lực / trái ác quỷ…)
      arc: z.object({ tap_tu: z.number().int().min(0), tap_den: z.number().int().min(0).optional(),
        chuong: z.union([z.string(), z.number()]).optional() }).optional(),   // bài cot-truyen: arc chiếu từ tập nào tới tập nào
    }).refine((d) => !d.image || d.image_source, { message: 'Có image thì phải có image_source (ten + url)', path: ['image_source'] }),
  }),
};
