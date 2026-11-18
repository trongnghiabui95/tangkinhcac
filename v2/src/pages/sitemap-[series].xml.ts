// Sitemap riêng cho từng bộ truyện: /sitemap-<series>.xml
import type { APIRoute } from 'astro';
import { laySeries, slugSeries } from '../lib/tien-ich.js';
import { urlCuaSeries, xml } from '../lib/sitemap.js';
export async function getStaticPaths() {
  return (await laySeries()).map((s) => ({ params: { series: slugSeries(s) } }));
}
export const GET: APIRoute = async ({ params, site }) =>
  new Response(xml(site, await urlCuaSeries(params.series!)), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
