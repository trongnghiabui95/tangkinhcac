// Kiểm thử tự động: mở từng trang bằng trình duyệt không giao diện, báo lỗi console.
// Chạy: node tools/kiem-tra/e2e.mjs        (cần Playwright + Chromium)
// Kết quả: mỗi trang 1 dòng OK/LỖI, cuối cùng là dòng `errors: [...]`. Có lỗi thì thoát mã 1.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const GOC = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const TRANG = [
  'index.html',
  'review.html?id=pham-nhan-tu-tien',
  'review.html?id=khong-ton-tai',
  'nhan-vat.html',
  'nhan-vat.html?id=han-lap',
  'nhan-vat.html?id=nam-cung-uyen',
  'nhan-vat.html?id=mac-dai-phu',
  'danh-sach.html?loai=tu-tien',
  'danh-sach.html?loai=anime',
  'danh-sach.html?the_loai=Tu%20Ti%C3%AAn',
  'the-luc.html?id=hoang-phong-coc',
  'the-luc.html?id=khong-ton-tai',
  'the-luc.html', 'tu-luyen.html', 'tim-kiem.html', 'de-cu.html', 'thuat-ngu.html',
  ...(process.env.TRANG_THEM ? process.env.TRANG_THEM.split(',') : []),
];
if (fs.existsSync(path.join(GOC, 'kiem-tra.html'))) TRANG.push('kiem-tra.html');
// Lỗi "được phép": file sinh sẵn chưa có (giai đoạn 3) → web tự chuyển nguồn khác.
const BO_QUA = [/\/data\/db\.json/];

const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.csv': 'text/csv', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const p = path.join(GOC, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(GOC) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': LOAI[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const errors = [];
for (const t of TRANG) {
  const page = await browser.newPage();
  const loi = [];
  page.on('pageerror', (e) => loi.push('JS: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) loi.push('console: ' + m.text()); });
  page.on('response', (r) => { if (r.status() >= 400 && !BO_QUA.some((x) => x.test(r.url()))) loi.push(`HTTP ${r.status()}: ${r.url()}`); });
  page.on('requestfailed', (r) => { if (!BO_QUA.some((x) => x.test(r.url()))) loi.push(`Tải hỏng: ${r.url()} (${r.failure()?.errorText})`); });
  try {
    await page.goto(BASE + t, { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(() => window.DB && DB.loadedAt > 0, null, { timeout: 15000 });
    await page.waitForTimeout(800);
    const baoLoi = await page.$('#noi-dung .alert-error');
    if (baoLoi) loi.push('Trang hiện khung lỗi: ' + (await baoLoi.innerText()).slice(0, 150));
  } catch (e) { loi.push('Không mở được: ' + e.message.split('\n')[0]); }
  console.log(`${loi.length ? 'LỖI' : 'OK '}  ${t}${loi.length ? '\n      - ' + loi.join('\n      - ') : ''}`);
  loi.forEach((l) => errors.push(`${t}: ${l}`));
  await page.close();
}
await browser.close();
server.close();
console.log('errors: ' + JSON.stringify(errors, null, 2));
process.exit(errors.length ? 1 : 0);
