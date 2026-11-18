import { layBai, tachId, MOI_TRANG } from './tien-ich.js';
const THU_TU = { chinh: 0, phu: 1, 'lien-quan': 2, 'phan-dien': 3 };
/** Mọi trang danh sách nhân vật của mọi truyện: [{ truyen, trang, tongTrang, ds, tp }] */
export async function cacTrangNhanVat() {
  const nv = await layBai('nhanVat');
  const tps = await layBai('truyen');
  const nhom = new Map();
  for (const e of nv) { const t = tachId(e.id).truyen; (nhom.get(t) ?? nhom.set(t, []).get(t)).push(e); }
  const out = [];
  for (const [truyen, ds] of nhom) {
    ds.sort((a, b) => THU_TU[a.data.vai_tro] - THU_TU[b.data.vai_tro] || a.data.ten.localeCompare(b.data.ten, 'vi'));
    const tongTrang = Math.max(1, Math.ceil(ds.length / MOI_TRANG));
    const tp = tps.find((e) => tachId(e.id).truyen === truyen);
    for (let trang = 1; trang <= tongTrang; trang++) out.push({ truyen, trang, tongTrang, tp, ds: ds.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG) });
  }
  return out;
}
