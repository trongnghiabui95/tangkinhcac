#!/usr/bin/env node
/**
 * dang-mang-xa-hoi.mjs – đăng link bài mới lên mạng xã hội qua Zernio API (Issue #105).
 * Không cần thư viện: chỉ dùng Node có sẵn (fetch) + đọc frontmatter bằng biểu thức đơn giản.
 *
 *   node scripts/dang-mang-xa-hoi.mjs content/<series>/<category>/<slug>.mdx [file khác…]
 *
 * Biến môi trường:
 *   ZERNIO_API_KEY   khoá API Zernio (secret GitHub). Không có khoá → chỉ IN nội dung sẽ đăng (chạy thử), không gửi gì.
 *   ZERNIO_NEN_TANG  nền tảng được đăng, cách nhau bằng dấu phẩy (mặc định: facebook,threads,linkedin,bluesky).
 *                    Không đăng X/Twitter nếu không ghi rõ, vì X tính phí từng lần gọi.
 *   SITE_URL         địa chỉ web (mặc định https://tuchanbaodien.com)
 *   CHO_TRANG_GIAY   chờ tối đa bao nhiêu giây cho trang bài lên web thật (mặc định 900)
 * In bảng kết quả Markdown ra stdout (workflow ghi vào trang tóm tắt). Có lỗi gửi → thoát mã 1.
 */
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://zernio.com/api/v1';
const KHOA = process.env.ZERNIO_API_KEY || '';
const SITE = (process.env.SITE_URL || 'https://tuchanbaodien.com').replace(/\/$/, '');
const NEN_TANG = (process.env.ZERNIO_NEN_TANG || 'facebook,threads,linkedin,bluesky').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const CHO = Number(process.env.CHO_TRANG_GIAY || 900);
const GOC = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

/** Đọc vài trường frontmatter cần dùng (chuỗi một dòng) */
function docBai(file) {
  const s = fs.readFileSync(path.resolve(GOC, file), 'utf8');
  const fm = (s.match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
  const lay = (k) => { const m = fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')); return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''; };
  const phan = path.relative(path.join(GOC, 'content'), path.resolve(GOC, file)).split(path.sep);
  return { file, series: phan[0], category: phan[1], slug: (phan[2] || '').replace(/\.mdx$/, ''), title: lay('title'), description: lay('description'), nhap: lay('nhap') === 'true' };
}

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));
async function choTrangLen(url) {
  const het = Date.now() + CHO * 1000;
  while (Date.now() < het) {
    try { const r = await fetch(url, { method: 'GET', redirect: 'follow' }); if (r.ok) return true; } catch {}
    await ngu(15000);
  }
  return false;
}

async function goi(duong, tuyChon = {}) {
  let r;
  try { r = await fetch(API + duong, { ...tuyChon, headers: { Authorization: `Bearer ${KHOA}`, 'Content-Type': 'application/json', ...(tuyChon.headers || {}) } }); }
  catch (e) { return { ok: false, status: 0, json: { error: `không kết nối được Zernio (${e.cause?.code || e.message})` } }; }
  const text = await r.text(); let json; try { json = JSON.parse(text); } catch { json = { text }; }
  return { ok: r.ok, status: r.status, json };
}

async function main() {
  const bai = process.argv.slice(2).filter((f) => f.endsWith('.mdx')).map(docBai).filter((b) => b.slug && b.title && !b.nhap);
  const dong = ['| Bài | Link | Kết quả |', '|---|---|---|'];
  if (!bai.length) { console.log('Không có bài mới (đã xuất bản) để đăng.'); return; }

  let taiKhoan = [];
  if (KHOA) {
    const r = await goi('/accounts?status=connected&category=social');
    if (!r.ok) { console.log(`❌ Không đọc được danh sách tài khoản Zernio (HTTP ${r.status}${r.json.error ? ': ' + r.json.error : ''}). ${r.status === 401 ? 'Khoá ZERNIO_API_KEY sai hoặc đã bị xoá – tạo khoá mới.' : ''}`); process.exit(1); }
    taiKhoan = (r.json.accounts || []).filter((a) => NEN_TANG.includes(String(a.platform).toLowerCase()));
    if (!taiKhoan.length) { console.log(`⚠️ Zernio chưa có tài khoản nào thuộc: ${NEN_TANG.join(', ')}. Vào zernio.com kết nối Facebook Page (hoặc Threads…) trước.`); process.exit(1); }
  }

  let loi = 0;
  for (const b of bai) {
    const url = `${SITE}/${b.series}/${b.category}/${b.slug}/`;
    const noiDung = `${b.title}\n\n${b.description}\n\n👉 Đọc bài: ${url}`;
    if (!KHOA) { dong.push(`| ${b.title} | ${url} | 🧪 Chạy thử (chưa có khoá ZERNIO_API_KEY) – nội dung sẽ đăng:<br>${noiDung.replace(/\n/g, '<br>')} |`); continue; }
    if (!(await choTrangLen(url))) { dong.push(`| ${b.title} | ${url} | ❌ Trang chưa lên web sau ${CHO} giây – chưa đăng |`); loi++; continue; }
    const r = await goi('/posts', {
      method: 'POST',
      headers: { 'Idempotency-Key': `tcbd-${b.series}-${b.category}-${b.slug}` },   // chạy lại cũng không đăng trùng
      body: JSON.stringify({ content: noiDung, publishNow: true, platforms: taiKhoan.map((a) => ({ platform: a.platform, accountId: a._id })) }),
    });
    if (r.ok) {
      const ketQua = (r.json.post?.platforms || []).map((p) => `${p.platform}: ${p.platformPostUrl ? `[đã đăng](${p.platformPostUrl})` : (p.status || 'đã gửi')}`).join(' · ');
      dong.push(`| ${b.title} | ${url} | ✅ ${ketQua || 'đã gửi tới ' + taiKhoan.map((a) => a.platform).join(', ')} |`);
    } else {
      dong.push(`| ${b.title} | ${url} | ❌ Zernio báo lỗi HTTP ${r.status}: ${String(r.json.error || r.json.message || r.json.text || '').slice(0, 200)} |`); loi++;
    }
  }
  console.log(dong.join('\n'));
  if (loi) process.exit(1);
}
main();
