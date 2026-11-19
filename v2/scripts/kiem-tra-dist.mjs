#!/usr/bin/env node
/**
 * kiem-tra-dist.mjs – kiểm tra bản build dist/ (chạy SAU `npm run build`), chung cho mọi bài (không viết cứng tên bài):
 *   1. Link nội bộ hỏng: mọi <a href> trỏ trong web phải có trang/file tương ứng trong dist/.
 *   2. Mỗi bài đã xuất bản (nhap: false) trong content/ có trang /<series>/<category>/<slug>/ và có JSON-LD Article.
 *   3. Sitemap (sitemap-*.xml) có đủ URL của mọi bài đã xuất bản.
 * Chạy: node scripts/kiem-tra-dist.mjs [--json bao-cao-dist.json]   (lỗi → exit 1)
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const GOC = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(GOC, 'dist');
const CONTENT = path.join(GOC, 'content');
const BASE = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');
const SITE = process.env.SITE_URL || 'https://tuchanbaodien.pages.dev';
const iJson = process.argv.indexOf('--json');
const FILE_JSON = iJson > 0 ? process.argv[iJson + 1] : '';

if (!fs.existsSync(DIST)) { console.error('Chưa có dist/ – chạy npm run build trước.'); process.exit(1); }

const duyet = (d, duoi) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  return e.isDirectory() ? duyet(p, duoi) : (p.endsWith(duoi) ? [p] : []);
});
const trangCua = (p) => '/' + path.relative(DIST, p).replace(/index\.html$/, '').split(path.sep).join('/');

/** URL nội bộ → file trong dist (null nếu không có) */
function timFile(urlPath) {
  let p = decodeURIComponent(urlPath);
  if (!p.startsWith(BASE)) return null;
  p = p.slice(BASE.length);
  const ung = [path.join(DIST, p), path.join(DIST, p, 'index.html')];
  return ung.find((f) => fs.existsSync(f) && fs.statSync(f).isFile()) || null;
}

// 1. Link nội bộ hỏng
const lienKetHong = [];
const cacTrang = duyet(DIST, '.html');
for (const f of cacTrang) {
  // bỏ <script>/<template>: link trong mã JS (vd. kết quả tìm kiếm Pagefind) không phải link thật
  const html = fs.readFileSync(f, 'utf8').replace(/<(script|template)\b[\s\S]*?<\/\1>/gi, '');
  for (const m of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
    const href = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|tel:|#|javascript:|data:)/i.test(href) || href.startsWith('//')) continue;
    const duongDan = new URL(href, 'http://x' + trangCua(f)).pathname;
    if (!timFile(duongDan)) lienKetHong.push({ trang: trangCua(f), href });
  }
}

// 2 + 3. Bài đã xuất bản có trang, có Article, có trong sitemap
const locSitemap = new Set(duyet(DIST, '.xml').filter((f) => /sitemap-/.test(path.basename(f)))
  .flatMap((f) => [...fs.readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])));
const baiThieu = [];
let soBai = 0;
for (const f of duyet(CONTENT, '.mdx')) {
  const phan = path.relative(CONTENT, f).split(path.sep);
  if (phan.length !== 3) continue;                       // bỏ index.mdx của bộ truyện
  const { data } = matter(fs.readFileSync(f, 'utf8'));
  if (data.nhap) continue;
  soBai++;
  const url = `${BASE}${phan[0]}/${phan[1]}/${phan[2].replace(/\.mdx$/, '')}/`;
  const tep = timFile(url);
  const ten = path.relative(GOC, f);
  if (!tep) { baiThieu.push({ file: ten, loi: `không có trang ${url}` }); continue; }
  if (!/"@type":"Article"/.test(fs.readFileSync(tep, 'utf8'))) baiThieu.push({ file: ten, loi: `trang ${url} thiếu JSON-LD Article` });
  if (!locSitemap.has(new URL(url, SITE).href)) baiThieu.push({ file: ten, loi: `sitemap thiếu ${new URL(url, SITE).href}` });
}

const kq = { soTrang: cacTrang.length, soBai, lienKetHong, baiThieu };
if (FILE_JSON) fs.writeFileSync(FILE_JSON, JSON.stringify(kq, null, 2));
lienKetHong.forEach((l) => console.error(`✗ link hỏng · trang ${l.trang} → ${l.href}`));
baiThieu.forEach((b) => console.error(`✗ ${b.file} · ${b.loi}`));
console.log(`Kiểm tra dist: ${cacTrang.length} trang, ${soBai} bài đã xuất bản, ${lienKetHong.length} link hỏng, ${baiThieu.length} lỗi bài.`);
process.exit(lienKetHong.length || baiThieu.length ? 1 : 0);
