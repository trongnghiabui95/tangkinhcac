// Tiện ích dùng chung: đường dẫn, ảnh, tên, nhóm bài theo bộ / danh mục / vũ trụ, menu.
// ZERO-HARDCODE: không có tên truyện, nhân vật, menu hay đường dẫn bài viết nào viết cứng ở đây –
// mọi thứ tính từ v2/content/ lúc build.
import { getCollection } from 'astro:content';
import anhJson from '../data/anh.json';
import { DANH_MUC, CAC_DANH_MUC, tenNgan } from './chuan-mdx.mjs';

export { DANH_MUC, CAC_DANH_MUC };
const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
const XEM_NHAP = (import.meta.env.XEM_NHAP ?? process.env.XEM_NHAP) === '1';   // chỉ dùng khi làm việc

export const url = (p = '') => BASE + String(p).replace(/^\/+/, '');
export const boDau = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
export const MOI_TRANG = 24;
export const NHAN_VAI_TRO = { chinh: 'Nhân vật chính', phu: 'Nhân vật phụ', 'lien-quan': 'Nhân vật liên quan', 'phan-dien': 'Phản diện' };

/* ---------- đọc nội dung (bỏ nháp) ---------- */
const conHien = (e) => XEM_NHAP || !e.data.nhap;
export const layBai = async (loc = () => true) => (await getCollection('baiViet', (e) => conHien(e) && loc(e)))
  .sort((a, b) => b.data.updated.getTime() - a.data.updated.getTime());
export const laySeries = async () => (await getCollection('series', conHien)).sort((a, b) => a.data.ten.localeCompare(b.data.ten, 'vi'));
export const slugSeries = (s) => s.id.split('/')[0];

/* ---------- tên & đường dẫn ---------- */
export const tenBai = (e) => e.data.ten || tenNgan(e.data.title);
export const urlBai = (e) => url(`${e.data.series}/${e.data.category}/${e.data.slug}/`);
export const urlSeries = (slug) => url(`${slug}/`);
export const urlSeriesDanhMuc = (slug, category) => url(`${slug}/${category}/`);
export const urlDanhMuc = (category) => url(`danh-muc/${category}/`);
export const urlVuTru = (universe) => url(`vu-tru/${universe}/`);

/* ---------- ảnh đã xử lý (src/data/anh.json do scripts/process-images.mjs sinh) ---------- */
export const layAnh = (e) => anhJson[`${e.data.series}/${e.data.category}/${e.data.slug}`] || null;
export const layAnhSeries = (s) => anhJson[`${slugSeries(s)}/bia/bia`] || null;

/* ---------- nhóm ---------- */
export async function cacVuTru() {
  const series = await laySeries();
  const m = new Map();
  for (const s of series) {
    const u = s.data.universe;
    const ten = s.data.universe_ten || (slugSeries(s) === u ? s.data.ten : undefined);
    const cu = m.get(u) || { slug: u, ten: undefined, series: [] };
    cu.ten = cu.ten || ten;
    cu.series.push(s);
    m.set(u, cu);
  }
  for (const v of m.values()) v.ten = v.ten || v.series.map((s) => s.data.ten).join(' · ');
  return [...m.values()].sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
}
/** Menu sinh từ nội dung: các bộ truyện + các danh mục đang có bài */
export async function layMenu() {
  const [series, bai] = await Promise.all([laySeries(), layBai()]);
  const danhMucCo = CAC_DANH_MUC.filter((c) => bai.some((b) => b.data.category === c));
  return {
    series: series.map((s) => ({ ten: s.data.ten, href: urlSeries(slugSeries(s)) })),
    danhMuc: danhMucCo.map((c) => ({ c, ten: DANH_MUC[c].tenSoNhieu, href: urlDanhMuc(c) })),
  };
}
/** Chia trang: [{ trang, tongTrang, ds }] */
export function chiaTrang(ds, moiTrang = MOI_TRANG) {
  const tong = Math.max(1, Math.ceil(ds.length / moiTrang));
  return Array.from({ length: tong }, (_, i) => ({ trang: i + 1, tongTrang: tong, ds: ds.slice(i * moiTrang, (i + 1) * moiTrang) }));
}
/** Ảnh cho thẻ bài: ảnh riêng của bài, không có thì mượn ảnh bìa bộ truyện (để thẻ không bị khung trống) */
export const layAnhThe = (e) => layAnh(e) || anhJson[`${e.data.series}/bia/bia`] || null;
