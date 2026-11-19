#!/usr/bin/env node
/**
 * kiem-tra-anh.mjs – kiểm thử scripts/process-images.mjs (Issue #30).
 * Tự tạo ảnh thử trong thư mục tạm (không commit ảnh lớn), chạy script rồi kiểm:
 *   1. Ảnh ~2MB có EXIF → .webp 3:4, mọi cỡ < 80KB, không còn EXIF, manifest ghi chat_luong + kb.
 *   1b. Ảnh nhiều chi tiết (chất lượng 80 > 80KB) → tự giảm chất lượng tới khi < 80KB.
 *   2. Ảnh 400px → bị chặn, thông báo rõ "quá nhỏ … cần ≥ 600px".
 *   3. File hỏng (không phải ảnh) → báo "không phải ảnh hợp lệ", không crash.
 *   4. Khai báo ảnh không có file → báo "không có file ảnh gốc".
 *   5. Ảnh nhiễu cực mạnh, xuống chất lượng 40 vẫn > 80KB → báo lỗi có tên file + cỡ KB.
 * Chạy: npm run test:anh   (in thêm kết quả exiftool nếu máy có cài)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const GOC_V2 = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SCRIPT = path.join(GOC_V2, 'scripts', 'process-images.mjs');
const loi = [];
const kiem = (dk, moTa) => { console.log(`${dk ? '✓' : '✗'} ${moTa}`); if (!dk) loi.push(moTa); };

/** Ảnh nhiễu ngẫu nhiên (khó nén) w×h, trộn với dải màu để giống ảnh chụp nhiều chi tiết */
function nhieu(w, h, doNhieu = 1) {
  const buf = crypto.randomBytes(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    const nen = [(x * 255) / w, (y * 255) / h, ((x + y) * 128) / (w + h)];
    for (let c = 0; c < 3; c++) buf[i + c] = Math.round(nen[c] * (1 - doNhieu) + buf[i + c] * doNhieu);
  }
  return sharp(buf, { raw: { width: w, height: h, channels: 3 } });
}

const mdx = (anh) => `---\ntitle: Bài thử ảnh\nimage: ${anh}\nimage_source:\n  ten: Nguồn thử\n  url: https://example.com/anh\n---\nNội dung thử.\n`;

function chay(tam, ten, ganAnh) {
  const noiDung = path.join(tam, ten, 'content');
  const anhGoc = path.join(tam, ten, 'anh-goc');
  fs.mkdirSync(path.join(noiDung, 'truyen-thu', 'nhan-vat'), { recursive: true });
  fs.mkdirSync(path.join(anhGoc, 'truyen-thu', 'nhan-vat'), { recursive: true });
  for (const [slug, file] of Object.entries(ganAnh)) fs.writeFileSync(path.join(noiDung, 'truyen-thu', 'nhan-vat', `${slug}.mdx`), mdx(`nhan-vat/${file}`));
  const ra = path.join(tam, ten, 'public', 'anh'), manifest = path.join(tam, ten, 'anh.json');
  const r = spawnSync('node', [SCRIPT, '--lam-lai', '--noi-dung', noiDung, '--anh-goc', anhGoc, '--ra', ra, '--manifest', manifest], { encoding: 'utf8' });
  return { ...r, anhGoc: path.join(anhGoc, 'truyen-thu', 'nhan-vat'), ra, manifest };
}

const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'kiem-tra-anh-'));
try {
  // ── 1. Ảnh lớn ~2MB có EXIF → WebP 3:4 < 80KB, không EXIF
  {
    const ca = chay(tam, 'lon', {});
    const fileLon = path.join(ca.anhGoc, 'anh-lon.jpg');
    await nhieu(1800, 2400, 0.3).jpeg({ quality: 90 })
      .withExif({ IFD0: { Make: 'MayAnhThu', Model: 'Thu-30', Copyright: 'Chu so huu thu', Software: 'kiem-tra-anh' } })
      .toFile(fileLon);
    const kbGoc = Math.round(fs.statSync(fileLon).size / 1024);
    const exifGoc = (await sharp(fileLon).metadata()).exif;
    kiem(kbGoc >= 1500 && kbGoc <= 3000, `ảnh gốc thử nặng ${kbGoc}KB (~2MB)`);
    kiem(!!exifGoc, 'ảnh gốc thử có EXIF');
    const r = chay(tam, 'lon', { 'nhan-vat-thu': 'anh-lon.jpg' });
    process.stdout.write(r.stdout);
    kiem(r.status === 0, 'process-images chạy xong không lỗi');
    const m = JSON.parse(fs.readFileSync(r.manifest, 'utf8'))['truyen-thu/nhan-vat/nhan-vat-thu'];
    kiem(m && typeof m.chat_luong === 'number' && typeof m.kb === 'number', `manifest ghi chat_luong=${m?.chat_luong}, kb=${m?.kb}`);
    for (const s of m?.srcset || []) {
      const f = path.join(path.dirname(r.ra), s.src);
      const kb = fs.statSync(f).size / 1024;
      const meta = await sharp(f).metadata();
      kiem(meta.format === 'webp', `${s.src}: định dạng webp`);
      kiem(kb < 80, `${s.src}: ${kb.toFixed(1)}KB < 80KB (chất lượng ${s.chat_luong})`);
      kiem(Math.abs(meta.width / meta.height - 3 / 4) < 0.01, `${s.src}: tỉ lệ 3:4 (${meta.width}×${meta.height})`);
      kiem(!meta.exif && !meta.xmp && !meta.iptc, `${s.src}: không còn EXIF/XMP/IPTC`);
      const et = spawnSync('exiftool', ['-a', '-G1', '-s', '-EXIF:all', '-XMP:all', '-IPTC:all', f], { encoding: 'utf8' });
      if (!et.error) {
        kiem(et.stdout.trim() === '', `${s.src}: exiftool không thấy thẻ EXIF/XMP/IPTC nào`);
        console.log(`   exiftool ${path.basename(f)}:\n` + spawnSync('exiftool', ['-s', '-FileType', '-FileSize', '-ImageSize', '-Make', '-Model', '-Copyright', f], { encoding: 'utf8' }).stdout.replace(/^/gm, '     '));
      }
    }
  }
  // ── 1b. Ảnh nhiều chi tiết: chất lượng 80 vượt 80KB → phải tự giảm
  {
    const ca = chay(tam, 'chi-tiet', {});
    await nhieu(600, 800, 0.2).png().toFile(path.join(ca.anhGoc, 'chi-tiet.png'));
    const r = chay(tam, 'chi-tiet', { 'nhieu-chi-tiet': 'chi-tiet.png' });
    process.stdout.write(r.stdout);
    const m = JSON.parse(fs.readFileSync(r.manifest, 'utf8'))['truyen-thu/nhan-vat/nhieu-chi-tiet'];
    kiem(r.status === 0 && m.chat_luong < 80 && m.chat_luong >= 40, `ảnh nhiều chi tiết tự giảm chất lượng xuống ${m?.chat_luong}`);
    kiem(m.kb < 80 && fs.statSync(path.join(path.dirname(r.ra), m.src)).size < 80 * 1024, `bản chính sau khi giảm: ${m?.kb}KB < 80KB`);
  }
  // ── 2–4. Ảnh nhỏ, file hỏng, thiếu file: báo lỗi rõ, không crash
  {
    const ca = chay(tam, 'loi', {});
    await nhieu(400, 533, 0.2).jpeg().toFile(path.join(ca.anhGoc, 'anh-400.jpg'));
    fs.writeFileSync(path.join(ca.anhGoc, 'hong.jpg'), 'day khong phai la anh');
    const r = chay(tam, 'loi', { 'anh-nho': 'anh-400.jpg', 'anh-hong': 'hong.jpg', 'thieu-anh': 'khong-co.jpg' });
    console.log(r.stdout + r.stderr);
    kiem(r.status === 1, 'build dừng (exit 1) khi có ảnh lỗi');
    kiem(!/at .*\.mjs:\d+/.test(r.stderr), 'không in stack trace (không crash)');
    kiem(/anh-nho: .*quá nhỏ 400×533px: cạnh ngắn 400px, cần ≥ 600px/.test(r.stderr), 'ảnh 400px bị chặn với thông báo rõ');
    kiem(/anh-hong: .*hong\.jpg không phải ảnh hợp lệ/.test(r.stderr), 'file hỏng báo "không phải ảnh hợp lệ"');
    kiem(/thieu-anh: không có file ảnh gốc .*khong-co\.jpg/.test(r.stderr), 'thiếu file báo "không có file ảnh gốc"');
  }
  // ── 5. Ảnh không thể nén < 80KB → báo lỗi có tên file + cỡ
  {
    const ca = chay(tam, 'nang', {});
    await nhieu(900, 1200, 1).png().toFile(path.join(ca.anhGoc, 'nhieu.png'));
    const r = chay(tam, 'nang', { 'qua-nang': 'nhieu.png' });
    console.log(r.stderr.trim());
    kiem(r.status === 1, 'build dừng khi ảnh không nén nổi < 80KB');
    kiem(/qua-nang-truyen-thu\.webp vẫn nặng [\d.]+KB ở chất lượng thấp nhất 40 \(cần < 80KB\)/.test(r.stderr), 'thông báo có tên file + cỡ KB + chất lượng thấp nhất');
  }
} finally {
  fs.rmSync(tam, { recursive: true, force: true });
}
console.log(loi.length ? `\nKiểm thử ảnh: ${loi.length} lỗi.` : '\nKiểm thử ảnh: tất cả đạt.');
process.exit(loi.length ? 1 : 0);
