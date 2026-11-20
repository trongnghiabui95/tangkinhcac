#!/usr/bin/env node
/**
 * dang-tiktok.mjs – đăng clip TikTok của Marketing qua Zernio API, sau khi chủ dự án duyệt (Issue #107).
 * Không cần thư viện: chỉ dùng Node có sẵn (fetch).
 *
 *   node scripts/dang-tiktok.mjs --thu-ket-noi
 *       Chỉ liệt kê tài khoản đã kết nối trong Zernio (tên, nền tảng). Không đăng gì.
 *   node scripts/dang-tiktok.mjs --dang --thu-muc <thư mục nhánh marketing/clips>
 *       Đọc khối cấu hình <!-- tiktok … --> trong thân Issue (biến ISSUE_BODY), tải clip lên Zernio rồi tạo bài TikTok
 *       công khai, bật nhãn "nội dung do AI tạo", hẹn giờ theo dang_luc (đã qua giờ → đăng ngay).
 *
 * Biến môi trường:
 *   ZERNIO_API_KEY         khoá API Zernio (secret GitHub). KHÔNG bao giờ in ra.
 *   ZERNIO_TIKTOK_ID       (tuỳ chọn) accountId TikTok muốn đăng, khi Zernio có nhiều tài khoản TikTok.
 *   ISSUE_BODY             thân Issue (chế độ --dang).
 *   ISSUE_NUMBER           số Issue (làm Idempotency-Key: chạy lại không đăng trùng).
 *   ZERNIO_API_URL         (chỉ để kiểm thử) địa chỉ API, mặc định https://zernio.com/api/v1
 *   KET_QUA                (tuỳ chọn) file ghi lời nhắn kết quả (Markdown) để workflow bình luận vào Issue.
 * Thoát mã 0 = thành công, 1 = lỗi (lời nhắn lỗi bằng tiếng Việt nằm trong KET_QUA / stdout).
 */
import fs from 'node:fs';
import path from 'node:path';

const API = (process.env.ZERNIO_API_URL || 'https://zernio.com/api/v1').replace(/\/$/, '');
const KHOA = process.env.ZERNIO_API_KEY || '';
const GIOI_HAN_CAPTION = 2200;   // TikTok: chú thích video tối đa 2.200 ký tự
const MIME = { '.mp4': 'video/mp4', '.m4v': 'video/x-m4v', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mpeg': 'video/mpeg', '.mpg': 'video/mpeg', '.avi': 'video/x-msvideo' };

class LoiDang extends Error {}
const tham = (ten) => { const i = process.argv.indexOf(ten); return i > -1 ? process.argv[i + 1] : undefined; };

/** Đọc khối <!-- tiktok … --> trong thân Issue → { clip, caption_file, dang_luc } */
export function docCauHinh(than) {
  const m = String(than || '').replace(/\r/g, '').match(/<!--\s*tiktok\s*\n([\s\S]*?)-->/i);
  if (!m) throw new LoiDang('Không thấy khối cấu hình `<!-- tiktok … -->` trong thân Issue.');
  const ch = {};
  for (const dong of m[1].split('\n')) {
    const k = dong.match(/^\s*([a-z_]+)\s*:\s*(.*?)\s*$/i);
    if (k) ch[k[1].toLowerCase()] = k[2];
  }
  for (const truong of ['clip', 'caption_file']) if (!ch[truong]) throw new LoiDang(`Khối cấu hình thiếu dòng \`${truong}:\`.`);
  return ch;
}

/** Đường dẫn file trong nhánh marketing/clips – không cho thoát ra ngoài thư mục */
function fileTrongNhanh(thuMuc, tuongDoi, ten) {
  const goc = path.resolve(thuMuc);
  const p = path.resolve(goc, tuongDoi);
  if (path.isAbsolute(tuongDoi) || !p.startsWith(goc + path.sep)) throw new LoiDang(`Đường dẫn \`${ten}\` không hợp lệ: \`${tuongDoi}\`.`);
  if (!fs.existsSync(p) || !fs.statSync(p).isFile()) throw new LoiDang(`Không thấy file \`${tuongDoi}\` trên nhánh \`marketing/clips\`.`);
  return p;
}

/** dang_luc → { publishNow } hoặc { scheduledFor }. Trống hoặc đã qua (hay còn < 2 phút) → đăng ngay */
export function thoiDiemDang(dangLuc, bayGio = Date.now()) {
  if (!dangLuc) return { publishNow: true };
  if (!/(Z|[+-]\d\d:?\d\d)$/i.test(dangLuc)) throw new LoiDang(`\`dang_luc\` cần ghi múi giờ, ví dụ \`2026-11-25T19:30:00+07:00\` (đang là \`${dangLuc}\`).`);
  const t = Date.parse(dangLuc);
  if (Number.isNaN(t)) throw new LoiDang(`\`dang_luc\` không đọc được: \`${dangLuc}\`.`);
  return t - bayGio < 2 * 60 * 1000 ? { publishNow: true } : { scheduledFor: new Date(t).toISOString() };
}

const gioVN = (iso) => new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false }) + ' (giờ VN)';

async function goi(duong, tuyChon = {}) {
  let r;
  try { r = await fetch(API + duong, { ...tuyChon, headers: { Authorization: `Bearer ${KHOA}`, 'Content-Type': 'application/json', ...(tuyChon.headers || {}) } }); }
  catch (e) { return { ok: false, status: 0, json: { error: `không kết nối được Zernio (${e.cause?.code || e.message})` } }; }
  const text = await r.text(); let json; try { json = JSON.parse(text); } catch { json = { text }; }
  return { ok: r.ok, status: r.status, json };
}
const loiZernio = (r) => {
  const chiTiet = String(r.json.error?.message || r.json.error || r.json.message || r.json.text || '').slice(0, 300);
  const goiY = r.status === 401 ? ' Khoá `ZERNIO_API_KEY` sai hoặc đã bị xoá – tạo khoá mới.' : r.status === 403 ? ' Tài khoản TikTok có thể đã mất kết nối trong Zernio – kết nối lại.' : r.status === 429 ? ' Gọi quá nhiều lần – thử lại sau.' : '';
  return `Zernio báo lỗi HTTP ${r.status}${chiTiet ? `: ${chiTiet}` : ''}.${goiY}`;
};
const tenTk = (a) => a.displayName || a.username || a.name || a.handle || '(không tên)';

async function danhSachTaiKhoan() {
  const r = await goi('/accounts');
  if (!r.ok) throw new LoiDang(`Không đọc được danh sách tài khoản. ${loiZernio(r)}`);
  return r.json.accounts || r.json.data || (Array.isArray(r.json) ? r.json : []);
}

async function thuKetNoi() {
  const ds = await danhSachTaiKhoan();
  const dong = ['## Thử kết nối Zernio', '', `✅ Khoá API dùng được. Có ${ds.length} tài khoản đã kết nối:`, '', '| Tên | Nền tảng | accountId |', '|---|---|---|'];
  for (const a of ds) dong.push(`| ${tenTk(a)} | ${a.platform} | ${a._id || a.id || a.accountId} |`);
  if (!ds.some((a) => String(a.platform).toLowerCase() === 'tiktok')) dong.push('', '⚠️ Chưa có tài khoản **TikTok** – vào zernio.com kết nối TikTok của kênh trước.');
  return dong.join('\n');
}

async function dang() {
  const ch = docCauHinh(process.env.ISSUE_BODY);
  const thuMuc = tham('--thu-muc') || 'nhanh-clip';
  if (!fs.existsSync(thuMuc)) throw new LoiDang('Không lấy được nhánh `marketing/clips` (nhánh chưa có?).');
  const clip = fileTrongNhanh(thuMuc, ch.clip, 'clip');
  const mime = MIME[path.extname(clip).toLowerCase()];
  if (!mime) throw new LoiDang(`Clip phải là video (.mp4, .mov, .webm…): \`${ch.clip}\`.`);
  const caption = fs.readFileSync(fileTrongNhanh(thuMuc, ch.caption_file, 'caption_file'), 'utf8').trim();
  if (!caption) throw new LoiDang(`File caption \`${ch.caption_file}\` đang trống.`);
  if ([...caption].length > GIOI_HAN_CAPTION) throw new LoiDang(`Caption dài ${[...caption].length} ký tự, TikTok chỉ nhận tối đa ${GIOI_HAN_CAPTION}.`);
  const luc = thoiDiemDang(ch.dang_luc);

  // 1. Tài khoản TikTok
  const tiktok = (await danhSachTaiKhoan()).filter((a) => String(a.platform).toLowerCase() === 'tiktok');
  const muonId = process.env.ZERNIO_TIKTOK_ID || '';
  const tk = muonId ? tiktok.find((a) => (a._id || a.id) === muonId) : tiktok.length === 1 ? tiktok[0] : null;
  if (!tiktok.length) throw new LoiDang('Zernio chưa có tài khoản TikTok nào – vào zernio.com kết nối TikTok của kênh.');
  if (!tk) throw new LoiDang(muonId ? `Không thấy tài khoản TikTok có accountId \`${muonId}\` (biến ZERNIO_TIKTOK_ID).` : `Zernio có ${tiktok.length} tài khoản TikTok – đặt biến repo \`ZERNIO_TIKTOK_ID\` để chọn 1 (xem bằng "Thử kết nối Zernio").`);
  const accountId = tk._id || tk.id;

  // 2. Kiểm tra tài khoản cho đăng công khai (không bắt buộc: Zernio lỗi thì bỏ qua bước này)
  const ci = await goi(`/accounts/${accountId}/tiktok/creator-info?mediaType=video`);
  if (ci.ok) {
    const muc = (ci.json.privacyLevels || []).map((p) => p.value || p);
    if (muc.length && !muc.includes('PUBLIC_TO_EVERYONE')) throw new LoiDang(`Tài khoản TikTok không cho đăng công khai lúc này (chỉ cho: ${muc.join(', ')}).`);
    if (ci.json.creator?.canPostMore === false) throw new LoiDang('TikTok báo tài khoản đã hết lượt đăng trong 24 giờ – thử lại sau.');
  }

  // 3. Tải clip lên Zernio
  const kichThuoc = fs.statSync(clip).size;
  const ps = await goi('/media/presign', { method: 'POST', body: JSON.stringify({ filename: path.basename(clip), contentType: mime, size: kichThuoc }) });
  if (!ps.ok || !ps.json.uploadUrl || !ps.json.publicUrl) throw new LoiDang(`Không xin được chỗ tải clip lên. ${loiZernio(ps)}`);
  let up;
  try { up = await fetch(ps.json.uploadUrl, { method: 'PUT', headers: { 'Content-Type': mime }, body: fs.readFileSync(clip) }); }
  catch (e) { throw new LoiDang(`Tải clip lên Zernio thất bại (${e.cause?.code || e.message}).`); }
  if (!up.ok) throw new LoiDang(`Tải clip lên Zernio thất bại (HTTP ${up.status}).`);

  // 4. Tạo bài TikTok: công khai + nhãn nội dung do AI tạo
  const r = await goi('/posts', {
    method: 'POST',
    headers: { 'Idempotency-Key': `tcbd-tiktok-issue-${process.env.ISSUE_NUMBER || path.basename(clip)}` },   // chạy lại không đăng trùng
    body: JSON.stringify({
      content: caption,
      mediaItems: [{ type: 'video', url: ps.json.publicUrl }],
      platforms: [{ platform: 'tiktok', accountId }],
      ...luc,
      tiktokSettings: {
        privacy_level: 'PUBLIC_TO_EVERYONE',
        allow_comment: true, allow_duet: true, allow_stitch: true,
        content_preview_confirmed: true, express_consent_given: true,
        videoMadeWithAi: true,   // bật nhãn "Nội dung do AI tạo" của TikTok
      },
    }),
  });
  if (!r.ok) throw new LoiDang(`Không tạo được bài TikTok. ${loiZernio(r)}`);
  const ketQua = [...(r.json.post?.platforms || []), ...(r.json.platformResults || [])].find((p) => String(p.platform).toLowerCase() === 'tiktok') || {};
  if (r.status === 207 || /fail|error/i.test(ketQua.status || '') || /fail/i.test(r.json.post?.status || '')) {
    throw new LoiDang(`TikTok từ chối bài: ${String(ketQua.errorMessage || ketQua.error || r.json.error || r.json.message || 'không rõ lý do').slice(0, 300)}`);
  }
  const link = ketQua.platformPostUrl;
  const dong = [`✅ **Đã gửi clip lên TikTok** (tài khoản ${tenTk(tk)}, công khai, có nhãn nội dung do AI tạo).`, ''];
  dong.push(luc.scheduledFor ? `- Hẹn giờ đăng: **${gioVN(luc.scheduledFor)}**` : `- Đăng ngay lúc: **${gioVN(ketQua.publishedAt || Date.now())}**`);
  dong.push(link ? `- Link bài: ${link}` : '- Link bài: TikTok thường mất vài phút mới có link – xem trong ứng dụng TikTok hoặc zernio.com.');
  dong.push(`- Clip: \`${ch.clip}\` · Mã bài Zernio: \`${r.json.post?._id || '?'}\``);
  return dong.join('\n');
}

async function main() {
  const ghi = (s) => { console.log(s); if (process.env.KET_QUA) fs.writeFileSync(process.env.KET_QUA, s + '\n'); };
  try {
    if (!KHOA) throw new LoiDang('Chưa có secret `ZERNIO_API_KEY` (Settings → Secrets and variables → Actions).');
    if (process.argv.includes('--thu-ket-noi')) ghi(await thuKetNoi());
    else if (process.argv.includes('--dang')) ghi(await dang());
    else throw new LoiDang('Cần chọn --thu-ket-noi hoặc --dang.');
  } catch (e) {
    ghi(`❌ **Chưa đăng được TikTok.** ${e instanceof LoiDang ? e.message : `Lỗi không lường trước: ${e.message}`}`);
    process.exit(1);
  }
}
if (import.meta.url === `file://${process.argv[1]}`) main();
