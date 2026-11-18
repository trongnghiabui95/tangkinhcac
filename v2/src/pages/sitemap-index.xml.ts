// Sitemap gốc: trang chung + từng bộ truyện
import type { APIRoute } from 'astro';
import { laySeries, slugSeries, url } from '../lib/tien-ich.js';
import { urlCuaSeries, urlTrangChinh } from '../lib/sitemap.js';
export const GET: APIRoute = async ({ site }) => {
  const moiNhat = (ds: { lastmod: Date }[]) => new Date(Math.max(...ds.map((x) => x.lastmod.getTime())));
  const muc = [{ loc: url('sitemap-trang-chinh.xml'), lastmod: moiNhat(await urlTrangChinh()) }];
  for (const s of await laySeries()) muc.push({ loc: url(`sitemap-${slugSeries(s)}.xml`), lastmod: moiNhat(await urlCuaSeries(slugSeries(s))) });
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${muc.map((m) => `  <sitemap><loc>${new URL(m.loc, site).href}</loc><lastmod>${m.lastmod.toISOString().slice(0, 10)}</lastmod></sitemap>`).join('\n')}
</sitemapindex>
`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
