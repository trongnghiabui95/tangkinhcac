// Sitemap: URL tính hoàn toàn từ nội dung (Zero-Hardcode)
import { layBai, laySeries, slugSeries, cacVuTru, url, urlBai, urlSeries, urlVuTru, cacLoaiCo, cacTheLoai, urlLoai, urlTheLoai, urlDeCu, urlThuatNgu } from './tien-ich.js';
import { trangSeriesDanhMuc, trangDanhMuc } from './danh-sach.js';

const moiNhat = (ds, macDinh) => ds.length ? new Date(Math.max(...ds.map((d) => d.getTime()))) : macDinh;
const urlTrang = (goc, n) => (n === 1 ? goc : `${goc}trang-${n}/`);

/** Mọi URL của 1 bộ truyện: trang bộ, danh sách theo danh mục, từng bài */
export async function urlCuaSeries(slug) {
  const s = (await laySeries()).find((x) => slugSeries(x) === slug);
  const bai = await layBai((e) => e.data.series === slug);
  const capNhat = moiNhat(bai.map((b) => b.data.updated), s?.data.ngay_cap_nhat ?? new Date());
  const ds = (await trangSeriesDanhMuc()).filter((p) => p.series === slug)
    .map((p) => ({ loc: urlTrang(url(`${slug}/${p.category}/`), p.trang), lastmod: moiNhat(p.ds.map((b) => b.data.updated), capNhat) }));
  return [{ loc: urlSeries(slug), lastmod: capNhat }, ...ds, ...bai.map((b) => ({ loc: urlBai(b), lastmod: b.data.updated }))];
}
/** Trang chung: trang chủ, vũ trụ, danh mục */
export async function urlTrangChinh() {
  const bai = await layBai();
  const homNay = moiNhat(bai.map((b) => b.data.updated), new Date());
  const vt = (await cacVuTru()).map((v) => ({ loc: urlVuTru(v.slug), lastmod: moiNhat(bai.filter((b) => b.data.universe === v.slug).map((b) => b.data.updated), homNay) }));
  const dm = (await trangDanhMuc()).map((p) => ({ loc: urlTrang(url(`danh-muc/${p.category}/`), p.trang), lastmod: moiNhat(p.ds.map((b) => b.data.updated), homNay) }));
  // Issue #51: trang loại, thể loại, đề cử, thuật ngữ
  const series = await laySeries();
  const capNhatBo = (ds) => moiNhat(ds.map((s) => s.data.ngay_cap_nhat), homNay);
  const them = [
    ...(await cacLoaiCo()).map((l) => ({ loc: urlLoai(l.loai), lastmod: capNhatBo(l.ds) })),
    ...(await cacTheLoai()).map((t) => ({ loc: urlTheLoai(t.ten), lastmod: capNhatBo(t.ds) })),
    ...(series.some((s) => s.data.cho_nguoi_moi || s.data.tuong_tu.length) ? [{ loc: urlDeCu(), lastmod: capNhatBo(series) }] : []),
    { loc: urlThuatNgu(), lastmod: capNhatBo(series) },
    // Issue #67: trang thông tin
    ...['gioi-thieu/', 'lien-he/', 'chinh-sach-bao-mat/'].map((p) => ({ loc: url(p), lastmod: new Date('2026-11-19') })),
  ];
  return [{ loc: url(''), lastmod: homNay }, ...vt, ...dm, ...them];
}
export const xml = (site, ds) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ds.map((u) => `  <url><loc>${new URL(u.loc, site).href}</loc><lastmod>${u.lastmod.toISOString().slice(0, 10)}</lastmod></url>`).join('\n')}
</urlset>
`;
