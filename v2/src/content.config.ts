// Khai báo nội dung web v2 theo CHUẨN FILE .MDX (Issue #27). Mọi giới hạn lấy từ src/lib/chuan-mdx.mjs.
//   v2/content/<series>/index.mdx                  → trang bộ truyện
//   v2/content/<series>/<category>/<slug>.mdx      → bài viết (category: nhan-vat | canh-gioi | cot-truyen | phap-bao | the-luc)
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CAC_DANH_MUC, GIOI_HAN, SLUG } from './lib/chuan-mdx.mjs';

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
    }),
  }),

  // Bài viết theo chuẩn .mdx mới
  baiViet: defineCollection({
    loader: glob({ pattern: '*/*/*.mdx', base: './content' }),
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
    }).refine((d) => !d.image || d.image_source, { message: 'Có image thì phải có image_source (ten + url)', path: ['image_source'] }),
  }),
};
