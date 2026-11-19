// Đọc nhanh frontmatter mọi bài trong content/ (dùng lúc build, ngoài Astro – cho plugin liên kết nội bộ):
// trả về [{ series, category, slug, ten, ten_khac, url, file, than }]. Bỏ bài nháp (trừ khi XEM_NHAP=1).
//  ten_khac = aliases + giá trị infobox có khoá là tên khác (Biệt hiệu, Đạo hiệu… – xem KHOA_INFOBOX_TEN_KHAC).
//  than = thân bài (chữ thô, đã bỏ frontmatter) – để plugin liên kết biết hai bài có nhắc tên nhau không.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { tenNgan, KHOA_INFOBOX_TEN_KHAC } from './chuan-mdx.mjs';

const nfc = (t) => String(t).normalize('NFC').trim();
// Bỏ giá trị có chữ Hán/Nhật/Hàn (tên gốc) – không xuất hiện trong thân bài tiếng Việt
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
function tenTuInfobox(infobox) {
  if (!infobox || typeof infobox !== 'object') return [];
  return Object.entries(infobox)
    .filter(([k]) => KHOA_INFOBOX_TEN_KHAC.test(String(k).trim()))
    .flatMap(([, v]) => String(v).split(/[,;]/))
    .map(nfc).filter((t) => t && !CJK.test(t));
}

const boNho = new Map();
const XEM_NHAP = process.env.XEM_NHAP === '1';

export function docChiMuc(thuMucNoiDung, base = '/') {
  const khoa = path.resolve(thuMucNoiDung) + '|' + base;
  if (boNho.has(khoa)) return boNho.get(khoa);
  const goc = path.resolve(thuMucNoiDung);
  const b = base.endsWith('/') ? base : base + '/';
  const ds = [];
  for (const series of fs.readdirSync(goc, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
    const fIndex = path.join(goc, series, 'index.mdx');
    if (fs.existsSync(fIndex)) {
      const { data, content } = matter(fs.readFileSync(fIndex, 'utf8'));
      if (!data.nhap || XEM_NHAP) ds.push({ series, category: 'series', slug: series, file: fIndex, url: `${b}${series}/`,
        ten: nfc(data.ten || ''), ten_khac: (data.ten_khac || []).map(nfc), than: content.normalize('NFC') });
    }
    for (const category of fs.readdirSync(path.join(goc, series), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
      for (const tep of fs.readdirSync(path.join(goc, series, category)).filter((t) => t.endsWith('.mdx'))) {
        const f = path.join(goc, series, category, tep);
        const { data, content } = matter(fs.readFileSync(f, 'utf8'));
        if (data.nhap && !XEM_NHAP) continue;
        const slug = tep.slice(0, -4);
        const ten = nfc(data.ten || tenNgan(data.title));
        const tenKhac = [...new Set([...(data.aliases || []).map(nfc), ...tenTuInfobox(data.infobox)])].filter((t) => t && t !== ten);
        ds.push({ series, category, slug, file: f, url: `${b}${series}/${category}/${slug}/`, ten, ten_khac: tenKhac, than: content.normalize('NFC') });
      }
    }
  }
  boNho.set(khoa, ds);
  return ds;
}
