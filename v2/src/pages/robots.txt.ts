import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  return new Response(
`User-agent: *
Allow: /
Disallow: ${base}tim-kiem/
Disallow: ${base}pagefind/

User-agent: Mediapartners-Google
Allow: /

Sitemap: ${new URL(base + 'sitemap-index.xml', site).href}
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
