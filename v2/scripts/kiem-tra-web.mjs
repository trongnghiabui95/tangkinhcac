#!/usr/bin/env node
/**
 * kiem-tra-web.mjs – kiểm tra web THẬT còn lên không (chạy hằng ngày bằng workflow kiem-tra-web.yml).
 * Không cần thư viện: chỉ dùng fetch có sẵn của Node 22.
 *
 * Với mỗi địa chỉ (tên miền chính + bản Cloudflare Pages):
 *   1. Trang chủ → mã 200 và có <title>
 *   2. sitemap-index.xml (hoặc sitemap.xml) → mã 200, đọc được danh sách URL (kể cả sitemap con)
 *   3. 3 bài ngẫu nhiên lấy từ sitemap → mã 200 và có <title>
 *
 * Cách dùng:
 *   node scripts/kiem-tra-web.mjs --chinh https://tuchanbaodien.com --pages https://tuchanbaodien.pages.dev \
 *        [--json ket-qua.json] [--md tom-tat.md] [--so-bai 3] [--het-gio 20000]
 * Thoát mã 1 nếu có địa chỉ lỗi. Kết luận (lỗi tên miền/DNS, web hỏng…) nằm trong JSON (khoa "ketLuan") và bảng Markdown.
 */
import fs from 'node:fs';

const a = process.argv.slice(2);
const lay = (k, md = '') => { const i = a.indexOf(k); return i >= 0 && a[i + 1] ? a[i + 1] : md; };
const boGach = (u) => u.trim().replace(/\/+$/, '');
const CHINH = boGach(lay('--chinh', process.env.SITE_URL || 'https://tuchanbaodien.com'));
const PAGES = boGach(lay('--pages', process.env.PAGES_URL || ''));
const SO_BAI = Number(lay('--so-bai', '3'));
const HET_GIO = Number(lay('--het-gio', '20000'));
const LAN_THU = 3; // thử lại để tránh báo nhầm do mạng chập chờn

async function tai(url) {
  let loiCuoi = '';
  for (let lan = 1; lan <= LAN_THU; lan++) {
    const t0 = Date.now();
    try {
      const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(HET_GIO), headers: { 'user-agent': 'TCBD-kiem-tra-web/1.0' } });
      const chu = await r.text();
      const kq = { url, ma: r.status, ms: Date.now() - t0, chu };
      if (r.status < 500 || lan === LAN_THU) return kq; // 4xx là lỗi thật, không cần thử lại
      loiCuoi = `mã ${r.status}`;
    } catch (e) {
      loiCuoi = (e.cause?.code || e.name || 'lỗi') + (e.cause?.message ? `: ${e.cause.message}` : e.message ? `: ${e.message}` : '');
    }
    if (lan < LAN_THU) await new Promise((ok) => setTimeout(ok, 2000 * lan));
  }
  return { url, ma: 0, ms: 0, chu: '', loi: loiCuoi };
}

const coTitle = (html) => /<title[^>]*>\s*[^<\s][^<]*<\/title>/i.test(html);
const docLoc = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, '&'));
/** sitemap ghi URL theo tên miền chính → đổi sang địa chỉ đang kiểm tra (để bản pages.dev kiểm chính nó). */
const doiGoc = (u, goc) => { try { const x = new URL(u); return goc + x.pathname + x.search; } catch { return u; } };
const ngauNhien = (ds, n) => [...ds].sort(() => Math.random() - 0.5).slice(0, n);

function ghiDong(muc, ten, r, can) {
  const ok = r.ma === 200 && (!can.title || coTitle(r.chu));
  const ghiChu = r.loi ? `không kết nối được (${r.loi})`
    : r.ma !== 200 ? `mã ${r.ma}`
    : can.title && !coTitle(r.chu) ? 'thiếu <title>' : '';
  muc.dong.push({ ten, url: r.url, ma: r.ma, ms: r.ms, ok, ghiChu });
  return ok;
}

async function kiemTra(goc, nhan) {
  const muc = { nhan, goc, ok: true, dong: [] };
  // 1. Trang chủ
  const tc = await tai(goc + '/');
  if (!ghiDong(muc, 'Trang chủ', tc, { title: true })) muc.ok = false;
  // 2. Sitemap
  let sm = await tai(goc + '/sitemap-index.xml');
  if (sm.ma !== 200) { const sm2 = await tai(goc + '/sitemap.xml'); if (sm2.ma === 200) sm = sm2; }
  const smOk = sm.ma === 200 && /<(urlset|sitemapindex)/i.test(sm.chu);
  muc.dong.push({ ten: 'Sitemap', url: sm.url, ma: sm.ma, ms: sm.ms, ok: smOk,
    ghiChu: sm.loi ? `không kết nối được (${sm.loi})` : sm.ma !== 200 ? `mã ${sm.ma}` : smOk ? '' : 'không phải XML sitemap' });
  if (!smOk) { muc.ok = false; return muc; }
  let urls = [];
  if (/<sitemapindex/i.test(sm.chu)) {
    for (const con of docLoc(sm.chu)) {
      const r = await tai(doiGoc(con, goc));
      if (r.ma === 200) urls.push(...docLoc(r.chu));
      else { muc.ok = false; muc.dong.push({ ten: 'Sitemap con', url: r.url, ma: r.ma, ms: r.ms, ok: false, ghiChu: r.loi || `mã ${r.ma}` }); }
    }
  } else urls = docLoc(sm.chu);
  urls = [...new Set(urls.map((u) => doiGoc(u, goc)))];
  // Bài viết = đường dẫn 3 cấp /<series>/<category>/<slug>/ ; không có thì lấy trang bất kỳ (trừ trang chủ)
  const bai = urls.filter((u) => new URL(u).pathname.split('/').filter(Boolean).length === 3);
  const chon = ngauNhien(bai.length ? bai : urls.filter((u) => new URL(u).pathname !== '/'), SO_BAI);
  if (!chon.length) { muc.ok = false; muc.dong.push({ ten: 'Bài ngẫu nhiên', url: sm.url, ma: 0, ms: 0, ok: false, ghiChu: 'sitemap không có URL nào' }); }
  for (const u of chon) if (!ghiDong(muc, 'Bài ngẫu nhiên', await tai(u), { title: true })) muc.ok = false;
  muc.soUrlSitemap = urls.length;
  return muc;
}

const ketQua = [await kiemTra(CHINH, 'Tên miền chính')];
if (PAGES && PAGES !== CHINH) ketQua.push(await kiemTra(PAGES, 'Cloudflare Pages'));

const [c, p] = ketQua;
let ketLuan;
if (c.ok && (!p || p.ok)) ketLuan = 'Web chạy bình thường.';
else if (!c.ok && p?.ok) ketLuan = 'Lỗi tên miền/DNS: bản Cloudflare Pages vẫn chạy nhưng tên miền chính không lên – kiểm tra cài đặt tên miền/DNS trên Cloudflare.';
else if (!c.ok && p && !p.ok) ketLuan = 'Web hỏng: cả tên miền chính lẫn bản Cloudflare Pages đều lỗi – kiểm tra lần đăng (deploy) gần nhất trên Cloudflare Pages.';
else if (!c.ok) ketLuan = 'Tên miền chính không lên (không kiểm tra bản Cloudflare Pages).';
else ketLuan = 'Tên miền chính vẫn chạy nhưng bản Cloudflare Pages lỗi – xem lại dự án trên Cloudflare Pages.';
const ok = ketQua.every((m) => m.ok);

const md = [
  `## ${ok ? '✅' : '🔴'} Kiểm tra web còn chạy – ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} (giờ VN)`,
  '',
  `**Kết luận:** ${ketLuan}`,
  '',
  ...ketQua.flatMap((m) => [
    `### ${m.ok ? '✅' : '❌'} ${m.nhan}: ${m.goc}${m.soUrlSitemap != null ? ` · sitemap có ${m.soUrlSitemap} trang` : ''}`,
    '',
    '| Mục | Địa chỉ | Mã | Thời gian | Kết quả |',
    '|---|---|---|---|---|',
    ...m.dong.map((d) => `| ${d.ten} | ${d.url} | ${d.ma || '—'} | ${d.ms ? `${d.ms} ms` : '—'} | ${d.ok ? '✅ đạt' : `❌ ${d.ghiChu}`} |`),
    '',
  ]),
].join('\n');

const json = { ok, ketLuan, ketQua };
if (lay('--json')) fs.writeFileSync(lay('--json'), JSON.stringify(json, null, 2));
if (lay('--md')) fs.writeFileSync(lay('--md'), md + '\n');
console.log(md);
process.exit(ok ? 0 : 1);
