// Kiểm tra SEO trên dist/ sau build: JSON-LD hợp lệ + đủ trường Google yêu cầu, URL tuyệt đối theo SITE_URL,
// <title>/description/canonical/og đúng. Chạy: node tests/kiem-tra-seo.mjs [SITE_URL]
import fs from 'node:fs'; import path from 'node:path';
const SITE = (process.argv[2] || process.env.SITE_URL || 'https://tuchanbaodien.pages.dev').replace(/\/$/, '');
const loi = []; let soTrang = 0;
const duyet = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? duyet(path.join(d, e.name)) : e.name === 'index.html' ? [path.join(d, e.name)] : []);
const lay = (h, re) => (h.match(re) || [])[1];
const tuyetDoi = (u, f, ten) => { if (typeof u !== 'string' || !u.startsWith(SITE + '/')) loi.push(`${f}: ${ten} không phải URL tuyệt đối theo SITE_URL (${u})`); };
const BAT_BUOC = {
  Article: ['headline', 'image', 'datePublished', 'dateModified', 'author', 'publisher', 'mainEntityOfPage'],
  FAQPage: ['mainEntity'], BreadcrumbList: ['itemListElement'], Review: ['itemReviewed', 'author'],
};
for (const f of duyet('dist').filter((f) => !/\/(tim-kiem|404)\//.test(f))) {
  soTrang++;
  const h = fs.readFileSync(f, 'utf8'); const t = path.relative('dist', path.dirname(f)) || '(trang chủ)';
  const title = lay(h, /<title>([^<]*)<\/title>/), desc = lay(h, /<meta name="description" content="([^"]*)"/);
  const can = lay(h, /<link rel="canonical" href="([^"]*)"/), ogu = lay(h, /<meta property="og:url" content="([^"]*)"/);
  if (!title) loi.push(`${t}: thiếu <title>`); if (!desc) loi.push(`${t}: thiếu meta description`);
  tuyetDoi(can, t, 'canonical'); if (can !== ogu) loi.push(`${t}: og:url khác canonical`);
  const ogi = lay(h, /<meta property="og:image" content="([^"]*)"/); if (ogi) tuyetDoi(ogi, t, 'og:image');
  const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch { loi.push(`${t}: JSON-LD không phải JSON hợp lệ`); return null; } }).filter(Boolean);
  for (const o of ld) {
    for (const k of BAT_BUOC[o['@type']] || []) if (o[k] == null || (Array.isArray(o[k]) && !o[k].length)) loi.push(`${t}: ${o['@type']} thiếu ${k}`);
    if (o['@type'] === 'Article') {
      if (o.headline !== title) loi.push(`${t}: Article.headline khác <title>`);
      if (o.headline.length > 110) loi.push(`${t}: headline > 110 ký tự`);
      (o.image || []).forEach((u) => tuyetDoi(u, t, 'Article.image'));
      tuyetDoi(o.publisher?.logo?.url, t, 'publisher.logo');
      if (isNaN(Date.parse(o.datePublished)) || isNaN(Date.parse(o.dateModified))) loi.push(`${t}: ngày không đúng ISO 8601`);
    }
    if (o['@type'] === 'BreadcrumbList') o.itemListElement.forEach((x, i) => { if (x.position !== i + 1 || !x.name) loi.push(`${t}: Breadcrumb mục ${i + 1} sai`); tuyetDoi(x.item, t, `Breadcrumb[${i + 1}].item`); });
    if (o['@type'] === 'FAQPage') o.mainEntity.forEach((q, i) => { if (q['@type'] !== 'Question' || !q.name || q.acceptedAnswer?.['@type'] !== 'Answer' || !q.acceptedAnswer.text) loi.push(`${t}: FAQ câu ${i + 1} sai cấu trúc`); });
  }
  console.log(`${t.padEnd(52)} title ${String(title?.length).padStart(3)} | desc ${String(desc?.length).padStart(3)} | JSON-LD: ${ld.map((o) => o['@type']).join(', ') || '-'}`);
}
// sitemap: mọi trang (trừ tìm kiếm/404) phải có trong sitemap
const sm = fs.readdirSync('dist').filter((x) => /^sitemap-.*\.xml$/.test(x) && x !== 'sitemap-index.xml').map((x) => fs.readFileSync(path.join('dist', x), 'utf8')).join('');
for (const f of duyet('dist').filter((f) => !/\/(tim-kiem|404)\//.test(f))) {
  const u = SITE + '/' + path.relative('dist', path.dirname(f)).replace(/\\/g, '/'); const uu = u.endsWith('/') ? u : u + '/';
  if (!sm.includes(`<loc>${uu}</loc>`)) loi.push(`sitemap thiếu ${uu}`);
}
console.log(`\n${soTrang} trang. errors: ${JSON.stringify(loi, null, 1)}`);
process.exit(loi.length ? 1 : 0);
