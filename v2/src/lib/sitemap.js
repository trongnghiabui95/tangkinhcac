import { layBai, tachId, urlBai, url } from './tien-ich.js';
import { cacTrangNhanVat } from './danh-sach.js';
/** Mọi URL của 1 bộ truyện: { loc (tương đối), lastmod } */
export async function urlCuaTruyen(truyen) {
  const thuoc = (e) => tachId(e.id).truyen === truyen;
  const bai = [...await layBai('truyen', thuoc), ...await layBai('nhanVat', thuoc), ...await layBai('phapBao', thuoc), ...await layBai('canhGioi', thuoc)];
  const moiNhat = new Date(Math.max(...bai.map((b) => b.data.ngay_cap_nhat.getTime())));
  const dsTrang = (await cacTrangNhanVat()).filter((p) => p.truyen === truyen)
    .map((p) => ({ loc: p.trang === 1 ? url(`${truyen}/nhan-vat/`) : url(`${truyen}/nhan-vat/trang-${p.trang}/`), lastmod: moiNhat }));
  return [...bai.map((b) => ({ loc: urlBai(b.id), lastmod: b.data.ngay_cap_nhat })), ...dsTrang];
}
export const xml = (site, ds) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ds.map((u) => `  <url><loc>${new URL(u.loc, site).href}</loc><lastmod>${u.lastmod.toISOString().slice(0, 10)}</lastmod></url>`).join('\n')}
</urlset>
`;
