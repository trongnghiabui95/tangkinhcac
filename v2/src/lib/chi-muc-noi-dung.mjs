// Đọc nhanh frontmatter mọi bài trong content/ (dùng lúc build, không cần Astro):
// trả về danh sách mục từ { truyen, loai, slug, ten, ten_khac, url, file }.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const boNho = new Map();

export function docChiMuc(thuMucNoiDung, base = '/') {
  const khoa = path.resolve(thuMucNoiDung) + '|' + base;
  if (boNho.has(khoa)) return boNho.get(khoa);
  const goc = path.resolve(thuMucNoiDung);
  const ds = [];
  const duyet = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { duyet(p); continue; }
      if (!e.name.endsWith('.mdx')) continue;
      const { data } = matter(fs.readFileSync(p, 'utf8'));
      if (data.nhap) continue;
      const phan = path.relative(goc, p).split(path.sep);
      const truyen = phan[0];
      const laTruyen = phan.length === 2;
      const loai = laTruyen ? 'truyen' : phan[1];
      const slug = laTruyen ? truyen : path.basename(phan[2], '.mdx');
      const b = base.endsWith('/') ? base : base + '/';
      ds.push({
        truyen, loai, slug, file: p,
        ten: String(data.ten || '').normalize('NFC'),
        ten_khac: (data.ten_khac || []).map((t) => String(t).normalize('NFC')),
        url: laTruyen ? `${b}${truyen}/` : `${b}${truyen}/${loai}/${slug}/`,
      });
    }
  };
  duyet(goc);
  boNho.set(khoa, ds);
  return ds;
}
