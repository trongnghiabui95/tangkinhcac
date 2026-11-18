// Tiện ích dùng chung cho các trang: đường dẫn, ảnh, bỏ dấu, lọc nháp, nhãn.
import { getCollection } from 'astro:content';
import anhJson from '../data/anh.json';

const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
export const url = (p = '') => BASE + String(p).replace(/^\/+/, '');
export const urlTuyetDoi = (p, site) => new URL(url(p), site).href;

/** id của glob loader: "pham-nhan-tu-tien/nhan-vat/han-lap" → { truyen, loai, slug } */
export function tachId(id) {
  const [truyen, loai, slug] = id.split('/');
  return slug ? { truyen, loai, slug } : { truyen, loai: 'truyen', slug: truyen };
}
export const urlBai = (id) => {
  const { truyen, loai, slug } = tachId(id);
  return loai === 'truyen' ? url(`${truyen}/`) : url(`${truyen}/${loai}/${slug}/`);
};

/** Ảnh đã xử lý (src/data/anh.json do scripts/process-images.mjs sinh) */
export function layAnh(id) {
  const { truyen, loai, slug } = tachId(id);
  return anhJson[loai === 'truyen' ? `${truyen}/bia/bia` : `${truyen}/${loai}/${slug}`] || null;
}

export const boDau = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

/** getCollection bỏ bài nháp (nhap: true) */
export const layBai = (ten, loc = () => true) => getCollection(ten, (e) => !e.data.nhap && loc(e));

export const NHAN = {
  vai_tro: { chinh: 'Nhân vật chính', phu: 'Nhân vật phụ', 'lien-quan': 'Nhân vật liên quan', 'phan-dien': 'Phản diện' },
  loai: { 'nhan-vat': 'Nhân vật', 'phap-bao': 'Pháp bảo', 'canh-gioi': 'Cảnh giới', truyen: 'Truyện' },
};
export const MOI_TRANG = 24;   // tối đa 24 thẻ / trang danh sách
