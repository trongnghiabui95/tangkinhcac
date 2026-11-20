#!/usr/bin/env node
/**
 * Kiểm thử scripts/kiem-tra-web.mjs (không cần mạng): dựng 2 máy chủ tạm trên máy phục vụ thư mục dist/
 * (cần `npm run build` trước), rồi thử 3 trường hợp:
 *   1. cả hai địa chỉ chạy            → thoát 0, "Web chạy bình thường"
 *   2. tên miền chính hỏng, pages chạy → thoát 1, "Lỗi tên miền/DNS"
 *   3. cả hai hỏng (trả 500)           → thoát 1, "Web hỏng"
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';

const GOC = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(GOC, 'dist');
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('✗ Chưa có dist/ – chạy npm run build trước.'); process.exit(1); }

const mayChu = (hong) => new Promise((ok) => {
  const s = http.createServer((req, res) => {
    if (hong) { res.writeHead(500); return res.end('loi'); }
    let p = path.join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(DIST)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) { res.writeHead(404); return res.end('khong co'); }
    res.writeHead(200); res.end(fs.readFileSync(p));
  }).listen(0, '127.0.0.1', () => ok(s));
});
const diaChi = (s) => `http://127.0.0.1:${s.address().port}`;
const chay = (...thamSo) => new Promise((ok) => execFile(process.execPath,
  [path.join(GOC, 'scripts/kiem-tra-web.mjs'), '--het-gio', '3000', ...thamSo], (e, out) => ok({ ma: e ? e.code : 0, out })));

const tot = await mayChu(false), tot2 = await mayChu(false), hong = await mayChu(true), hong2 = await mayChu(true);
const ca = [
  ['cả hai chạy', [diaChi(tot), diaChi(tot2)], 0, 'Web chạy bình thường'],
  ['tên miền hỏng, pages chạy', [diaChi(hong), diaChi(tot2)], 1, 'Lỗi tên miền/DNS'],
  ['cả hai hỏng', [diaChi(hong), diaChi(hong2)], 1, 'Web hỏng'],
];
let loi = 0;
for (const [ten, [c, p], maMuon, chuMuon] of ca) {
  const r = await chay('--chinh', c, '--pages', p);
  const dat = r.ma === maMuon && r.out.includes(chuMuon) && (maMuon !== 0 || (r.out.match(/Bài ngẫu nhiên/g) || []).length === 6);
  console.log(`${dat ? '✓' : '✗'} ${ten}: thoát ${r.ma} (muốn ${maMuon}), có "${chuMuon}": ${r.out.includes(chuMuon)}`);
  if (!dat) { loi++; console.log(r.out); }
}
for (const s of [tot, tot2, hong, hong2]) s.close();
console.log(loi ? `✗ ${loi} trường hợp sai` : '✓ kiem-tra-web: cả 3 trường hợp đúng');
process.exit(loi ? 1 : 0);
