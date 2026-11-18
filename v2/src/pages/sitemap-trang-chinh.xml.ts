import type { APIRoute } from 'astro';
import { url } from '../lib/tien-ich.js';
import { xml } from '../lib/sitemap.js';
export const GET: APIRoute = ({ site }) => new Response(xml(site, [{ loc: url(''), lastmod: new Date() }]), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
