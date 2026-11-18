// Đọc nhanh frontmatter mọi bài trong content/ (dùng lúc build, ngoài Astro – cho plugin liên kết nội bộ):
// trả về [{ series, category, slug, ten, ten_khac, url, file }]. Bỏ bài nháp (trừ khi XEM_NHAP=1).
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { tenNgan } from './chuan-mdx.mjs';

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
      const { data } = matter(fs.readFileSync(fIndex, 'utf8'));
      if (!data.nhap || XEM_NHAP) ds.push({ series, category: 'series', slug: series, file: fIndex, url: `${b}${series}/`,
        ten: String(data.ten || '').normalize('NFC'), ten_khac: (data.ten_khac || []).map((t) => String(t).normalize('NFC')) });
    }
    for (const category of fs.readdirSync(path.join(goc, series), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
      for (const tep of fs.readdirSync(path.join(goc, series, category)).filter((t) => t.endsWith('.mdx'))) {
        const f = path.join(goc, series, category, tep);
        const { data } = matter(fs.readFileSync(f, 'utf8'));
        if (data.nhap && !XEM_NHAP) continue;
        const slug = tep.slice(0, -4);
        ds.push({ series, category, slug, file: f, url: `${b}${series}/${category}/${slug}/`,
          ten: String(data.ten || tenNgan(data.title)).normalize('NFC'),
          ten_khac: (data.aliases || []).map((t) => String(t).normalize('NFC')) });
      }
    }
  }
  boNho.set(khoa, ds);
  return ds;
}
