// Sitemap riêng cho từng bộ truyện: /sitemap-<truyen>.xml
import type { APIRoute } from 'astro';
import { layBai, tachId } from '../lib/tien-ich.js';
import { urlCuaTruyen, xml } from '../lib/sitemap.js';
export async function getStaticPaths() {
  return (await layBai('truyen')).map((e) => ({ params: { truyen: tachId(e.id).truyen } }));
}
export const GET: APIRoute = async ({ params, site }) =>
  new Response(xml(site, await urlCuaTruyen(params.truyen)), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
