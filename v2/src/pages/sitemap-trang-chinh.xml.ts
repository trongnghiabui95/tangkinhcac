// Sitemap trang chung: trang chủ, /vu-tru/…, /danh-muc/…
import type { APIRoute } from 'astro';
import { urlTrangChinh, xml } from '../lib/sitemap.js';
export const GET: APIRoute = async ({ site }) => new Response(xml(site, await urlTrangChinh()), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
