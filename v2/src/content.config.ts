// Khai báo "bộ sưu tập" nội dung: mỗi file .mdx trong content/ là 1 bài.
// Thư mục: content/<slug-truyen>/index.mdx | nhan-vat/*.mdx | phap-bao/*.mdx | canh-gioi/*.mdx
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const anh = z.object({
  goc: z.string(),                         // file ảnh gốc trong anh-goc/<truyen>/ (ví dụ nhan-vat/han-lap.png)
  nguon: z.string(),                       // ghi nguồn hiển thị ở <figcaption>
  cat_tren: z.number().min(0).max(0.4).optional(), // tỉ lệ cắt bỏ phía trên (khung đen, logo kênh)
  cat_duoi: z.number().min(0).max(0.4).optional(), // tỉ lệ cắt bỏ phía dưới (phụ đề)
  tam: z.tuple([z.number(), z.number()]).optional(), // [x, y] 0–1: ép tâm cắt khi tự động chọn sai
}).optional();

const chung = {
  ten: z.string(),
  ten_khac: z.array(z.string()).default([]),       // tên gọi khác → dùng cho tìm kiếm + tự gắn liên kết
  mo_ta: z.string().max(170),                      // meta description
  anh,
  ngay_dang: z.coerce.date(),
  ngay_cap_nhat: z.coerce.date(),
  spoiler: z.boolean().default(false),
  nhap: z.boolean().default(false),                // true = không xuất bản
};

export const collections = {
  truyen: defineCollection({
    loader: glob({ pattern: '*/index.mdx', base: './content' }),
    schema: z.object({
      ...chung,
      ten_trung: z.string().optional(),
      tac_gia: z.string(),
      the_loai: z.array(z.string()),
      tinh_trang: z.enum(['Đang ra', 'Hoàn thành', 'Tạm ngưng']),
      diem: z.number().min(0).max(10).optional(),
    }),
  }),
  nhanVat: defineCollection({
    loader: glob({ pattern: '*/nhan-vat/*.mdx', base: './content' }),
    schema: z.object({
      ...chung,
      vai_tro: z.enum(['chinh', 'phu', 'lien-quan', 'phan-dien']),
      gioi_tinh: z.string().optional(),
      chung_toc: z.string().optional(),
      canh_gioi: z.string().optional(),            // slug trong canh-gioi/
      tong_mon: z.array(z.string()).default([]),
      phap_bao: z.array(z.string()).default([]),   // slug trong phap-bao/
      tinh_trang: z.string().optional(),
      youtube: z.string().optional(),              // id video giới thiệu (facade)
    }),
  }),
  phapBao: defineCollection({
    loader: glob({ pattern: '*/phap-bao/*.mdx', base: './content' }),
    schema: z.object({ ...chung, loai: z.string(), pham_cap: z.string().optional(), chu_so_huu: z.string().optional() }),
  }),
  canhGioi: defineCollection({
    loader: glob({ pattern: '*/canh-gioi/*.mdx', base: './content' }),
    schema: z.object({ ...chung, thu_tu: z.number().int() }),
  }),
};
