// Sitemap gốc: trỏ tới sitemap trang chính + sitemap từng bộ truyện
import type { APIRoute } from 'astro';
import { layBai, tachId, url } from '../lib/tien-ich.js';
import { urlCuaTruyen } from '../lib/sitemap.js';
export const GET: APIRoute = async ({ site }) => {
  const ds = await layBai('truyen');
  const muc = [{ loc: url('sitemap-trang-chinh.xml'), lastmod: new Date() }];
  for (const t of ds) {
    const truyen = tachId(t.id).truyen;
    const u = await urlCuaTruyen(truyen);
    muc.push({ loc: url(`sitemap-${truyen}.xml`), lastmod: new Date(Math.max(...u.map((x) => x.lastmod.getTime()))) });
  }
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${muc.map((m) => `  <sitemap><loc>${new URL(m.loc, site).href}</loc><lastmod>${m.lastmod.toISOString().slice(0, 10)}</lastmod></sitemap>`).join('\n')}
</sitemapindex>
`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
