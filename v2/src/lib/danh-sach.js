// Sinh mọi trang danh sách có phân trang (24 thẻ/trang) – dùng chung cho getStaticPaths.
import { layBai, laySeries, slugSeries, chiaTrang, CAC_DANH_MUC } from './tien-ich.js';

/** /<series>/<category>/ và /<series>/<category>/trang-n/ */
export async function trangSeriesDanhMuc() {
  const [series, bai] = await Promise.all([laySeries(), layBai()]);
  const out = [];
  for (const s of series) for (const c of CAC_DANH_MUC) {
    const ds = bai.filter((b) => b.data.series === slugSeries(s) && b.data.category === c)
      .sort((a, b) => (a.data.thu_tu ?? 999) - (b.data.thu_tu ?? 999) || a.data.title.localeCompare(b.data.title, 'vi'));
    if (!ds.length) continue;
    for (const p of chiaTrang(ds)) out.push({ series: slugSeries(s), tenSeries: s.data.ten, category: c, ...p });
  }
  return out;
}
/** /danh-muc/<category>/ và /danh-muc/<category>/trang-n/ */
export async function trangDanhMuc() {
  const bai = await layBai();
  return CAC_DANH_MUC.flatMap((c) => {
    const ds = bai.filter((b) => b.data.category === c);
    return ds.length ? chiaTrang(ds).map((p) => ({ category: c, ...p })) : [];
  });
}
