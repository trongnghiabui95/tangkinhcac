// Tiện ích dùng chung: đường dẫn, ảnh, tên, nhóm bài theo bộ / danh mục / vũ trụ, menu.
// ZERO-HARDCODE: không có tên truyện, nhân vật, menu hay đường dẫn bài viết nào viết cứng ở đây –
// mọi thứ tính từ v2/content/ lúc build.
import { getCollection } from 'astro:content';
import anhJson from '../data/anh.json';
import { DANH_MUC, CAC_DANH_MUC, tenNgan, LOAI_TRUYEN as LOAI_TRUYEN_MENU, CAC_LOAI_TRUYEN as CAC_LOAI_TRUYEN_MENU } from './chuan-mdx.mjs';

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
/** Issue #4: các bộ cùng `universe` nhưng KHÁC `loai` (bản truyện ↔ bản donghua/anime) – tự hai chiều, không cần khai báo ở cả hai file */
export async function cacBanKhac(s) {
  return (await laySeries()).filter((x) => x.data.universe === s.data.universe && x.data.loai !== s.data.loai && slugSeries(x) !== slugSeries(s))
    .sort((a, b) => CAC_LOAI_TRUYEN_MENU.indexOf(a.data.loai) - CAC_LOAI_TRUYEN_MENU.indexOf(b.data.loai) || a.data.ten.localeCompare(b.data.ten, 'vi'));
}
/** Menu sinh từ nội dung: các bộ truyện + các danh mục đang có bài */
export async function layMenu() {
  const [series, bai] = await Promise.all([laySeries(), layBai()]);
  const danhMucCo = CAC_DANH_MUC.filter((c) => bai.some((b) => b.data.category === c));
  return {
    // Issue #51: loại bộ truyện (Tu Tiên, Anime…), Đề cử, Thuật ngữ – chỉ hiện khi có dữ liệu
    // Issue #56: menu theo thứ bậc Loại truyện → Bộ truyện → Danh mục của bộ đó
    loai: CAC_LOAI_TRUYEN_MENU.filter((l) => series.some((s) => s.data.loai === l)).map((l) => ({
      loai: l, ten: LOAI_TRUYEN_MENU[l].ten, href: url(`loai/${l}/`),
      series: series.filter((s) => s.data.loai === l).map((s) => ({
        ten: s.data.ten, href: urlSeries(slugSeries(s)),
        danhMuc: CAC_DANH_MUC.filter((c) => bai.some((b) => b.data.series === slugSeries(s) && b.data.category === c))
          .map((c) => ({ c, ten: DANH_MUC[c].tenSoNhieu, href: urlSeriesDanhMuc(slugSeries(s), c) })),
      })),
    })),
    deCu: series.some((s) => s.data.cho_nguoi_moi || s.data.tuong_tu.length) ? url('de-cu/') : null,
    thuatNgu: series.some((s) => s.data.thuat_ngu.length) ? url('thuat-ngu/') : null,
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

/* ---------- Tính năng chuyển từ web cũ (Issue #51) ---------- */
import { LOAI_TRUYEN, CAC_LOAI_TRUYEN, NHAN_QUAN_HE } from './chuan-mdx.mjs';
export { LOAI_TRUYEN, CAC_LOAI_TRUYEN, NHAN_QUAN_HE };
/** chuỗi → slug: "Huyền Huyễn" → "huyen-huyen" */
export const taoSlug = (s) => boDau(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const urlLoai = (loai) => url(`loai/${loai}/`);
export const urlTheLoai = (tl) => url(`the-loai/${taoSlug(tl)}/`);
export const urlDeCu = () => url('de-cu/');
export const urlThuatNgu = () => url('thuat-ngu/');
/** Các loại bộ truyện đang có ít nhất 1 bộ */
export async function cacLoaiCo() {
  const series = await laySeries();
  return CAC_LOAI_TRUYEN.filter((l) => series.some((s) => s.data.loai === l)).map((l) => ({ loai: l, ...LOAI_TRUYEN[l], ds: series.filter((s) => s.data.loai === l) }));
}
/** Các thể loại (từ the_loai của bộ truyện) kèm danh sách bộ, sắp theo số bộ giảm dần */
export async function cacTheLoai() {
  const m = new Map();
  for (const s of await laySeries()) for (const tl of s.data.the_loai) {
    const k = taoSlug(tl); const cu = m.get(k) || { slug: k, ten: tl, ds: [] }; cu.ds.push(s); m.set(k, cu);
  }
  return [...m.values()].sort((a, b) => b.ds.length - a.ds.length || a.ten.localeCompare(b.ten, 'vi'));
}
/** Mọi thuật ngữ của mọi bộ (kèm bộ truyện), sắp A–Z */
export async function layThuatNgu() {
  return (await laySeries()).flatMap((s) => s.data.thuat_ngu.map((t) => ({ ...t, series: s })))
    .sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
}
/** Tìm bài cùng bộ theo slug hoặc theo tên (không phân biệt hoa thường, không dấu) */
export function timBai(cungBo, khoa, category) {
  const k = taoSlug(khoa);
  return cungBo.find((e) => (!category || e.data.category === category) && (e.data.slug === khoa || taoSlug(tenBai(e)) === k)) || null;
}
/** Ảnh thư viện (đã xử lý) của 1 bộ; loc(nhan_vat) để lấy ảnh riêng của nhân vật */
export function layThuVien(s, nhanVat) {
  const slug = slugSeries(s);
  return s.data.thu_vien.filter((a) => (nhanVat ? a.nhan_vat === nhanVat : true))
    .map((a) => ({ ...a, xl: anhJson[`${slug}/thu-vien/${a.anh.split('/').pop().replace(/\.[^.]+$/, '')}`] })).filter((a) => a.xl);
}
export const layBanDo = (s) => anhJson[`${slugSeries(s)}/ban-do/ban-do`] || null;
export const nhanQuanHe = (q) => NHAN_QUAN_HE[q] || q;
