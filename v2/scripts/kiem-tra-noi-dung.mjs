#!/usr/bin/env node
/**
 * kiem-tra-noi-dung.mjs – kiểm tra mọi file .mdx theo CHUẨN FILE .MDX (Issue #27) TRƯỚC khi build.
 * Lỗi → in "✗ <file> · <trường>: <lý do>" và dừng (exit 1). Cảnh báo (⚠) không dừng build.
 *
 *   node scripts/kiem-tra-noi-dung.mjs                         kiểm tra content/
 *   node scripts/kiem-tra-noi-dung.mjs --goc tests/fixtures/sai/content
 *   node scripts/kiem-tra-noi-dung.mjs --chat-so-tu a.mdx b.mdx   số từ ngoài 800–1.200 thành LỖI cho các file này
 *                                                               (workflow PR dùng cho file mới/sửa)
 *   node scripts/kiem-tra-noi-dung.mjs --json bao-cao.json      ghi kết quả ra file (cho bot PR)
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import sharp from 'sharp';
import { CAC_DANH_MUC, GIOI_HAN, SLUG, demTu, timThe } from '../src/lib/chuan-mdx.mjs';

const GOC_V2 = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const thamSo = process.argv.slice(2);
const lay = (ten, macDinh) => { const i = thamSo.indexOf(ten); return i >= 0 ? thamSo[i + 1] : macDinh; };
const THU_MUC = path.resolve(GOC_V2, lay('--goc', 'content'));
const THU_MUC_ANH = path.resolve(GOC_V2, lay('--anh', 'anh-goc'));
const FILE_JSON = lay('--json', '');
const iChat = thamSo.indexOf('--chat-so-tu');
const CHAT_SO_TU = new Set(iChat >= 0 ? thamSo.slice(iChat + 1).filter((f) => !f.startsWith('--')).map((f) => path.resolve(f)) : []);

const loi = [], canhBao = [], tomTat = [];
// Tên đã dùng cho đường dẫn hệ thống: không được đặt làm thư mục bộ truyện / slug bài
const DANH_RIENG = new Set(['vu-tru', 'danh-muc', 'tim-kiem', 'anh', 'pagefind', '404', '_astro']);
const tuongDoi = (f) => path.relative(process.cwd(), f);
const baoLoi = (f, truong, lyDo) => loi.push(`✗ ${tuongDoi(f)} · ${truong}: ${lyDo}`);
const baoCanhBao = (f, truong, lyDo) => canhBao.push(`⚠ ${tuongDoi(f)} · ${truong}: ${lyDo}`);

/** Trang bộ truyện: các trường tuỳ chọn có giới hạn (ban_co_biet – Issue #11; anime – Issue #137).
 *  cacBai: Set "<category>/<slug>" các bài của bộ, để kiểm tra cac_arc[].slug trỏ đúng bài. */
function kiemTraIndex(f, cacBai = new Set()) {
  const d = docMdx(f)?.data;
  if (!d) return;
  if (d.ban_co_biet != null) {
    if (!Array.isArray(d.ban_co_biet)) baoLoi(f, 'ban_co_biet', 'phải là danh sách dạng [{ noi_dung, nguon? }]');
    else {
      const [min, max] = GIOI_HAN.banCoBiet;
      d.ban_co_biet.forEach((y, i) => {
        const nd = typeof y?.noi_dung === 'string' ? y.noi_dung.trim() : '';
        if (!nd) baoLoi(f, `ban_co_biet[${i + 1}]`, 'thiếu noi_dung');
        else if (nd.length < min || nd.length > max) baoLoi(f, `ban_co_biet[${i + 1}]`, `noi_dung dài ${nd.length} ký tự, cần ${min}–${max}`);
      });
    }
  }
  // ---- Issue #137: trường anime (đều tuỳ chọn) ----
  if (d.diem_mal != null && !(typeof d.diem_mal === 'number' && d.diem_mal >= 0 && d.diem_mal <= 10)) baoLoi(f, 'diem_mal', `"${d.diem_mal}" phải là số từ 0 đến 10, ví dụ 8.7`);
  if (d.xem_o != null) {
    if (!Array.isArray(d.xem_o)) baoLoi(f, 'xem_o', 'phải là danh sách dạng [{ ten, url }]');
    else d.xem_o.forEach((x, i) => {
      if (!x?.ten) baoLoi(f, `xem_o[${i + 1}]`, 'thiếu ten (tên nền tảng)');
      if (!/^https:\/\//.test(x?.url || '')) baoLoi(f, `xem_o[${i + 1}]`, 'url phải là link đầy đủ bắt đầu bằng https://');
    });
  }
  if (d.cac_arc != null) {
    if (!Array.isArray(d.cac_arc)) baoLoi(f, 'cac_arc', 'phải là danh sách dạng [{ ten, tap_tu, tap_den?, chuong?, nam?, slug?, dang_chieu? }]');
    else {
      d.cac_arc.forEach((a, i) => {
        const truong = `cac_arc[${i + 1}]`;
        if (!a?.ten) baoLoi(f, truong, 'thiếu ten (tên arc)');
        if (!Number.isInteger(a?.tap_tu)) baoLoi(f, truong, 'thiếu tap_tu (số tập bắt đầu, số nguyên)');
        else if (a.tap_den != null && !(Number.isInteger(a.tap_den) && a.tap_den >= a.tap_tu)) baoLoi(f, truong, `tap_den (${a.tap_den}) phải là số nguyên ≥ tap_tu (${a.tap_tu})`);
        if (a?.slug && !cacBai.has(`cot-truyen/${a.slug}`)) baoCanhBao(f, truong, `chưa có bài cot-truyen/${a.slug}.mdx – arc vẫn hiện nhưng chưa bấm được`);
      });
      if (d.cac_arc.filter((a) => a?.dang_chieu).length > 1) baoCanhBao(f, 'cac_arc', 'có nhiều hơn 1 arc dang_chieu: true');
    }
  }
}

function docMdx(f) {
  try { return matter(fs.readFileSync(f, 'utf8')); }
  catch (e) { baoLoi(f, 'frontmatter', `không đọc được YAML (${e.reason || e.message})`); return null; }
}

async function kiemTraAnh(f, series, anh) {
  const p = path.join(THU_MUC_ANH, series, anh);
  if (!fs.existsSync(p)) { baoLoi(f, 'image', `không có file ảnh ${tuongDoi(p)}`); return null; }
  try {
    const { width, height } = await sharp(p).metadata();
    if (Math.min(width, height) < GIOI_HAN.canhAnhToiThieu) baoLoi(f, 'image', `ảnh quá nhỏ ${width}×${height}px, cạnh ngắn cần ≥ ${GIOI_HAN.canhAnhToiThieu}px`);
    return { width, height, kb: Math.round(fs.statSync(p).size / 1024) };
  } catch { baoLoi(f, 'image', `file ${tuongDoi(p)} không phải ảnh hợp lệ`); return null; }
}

async function main() {
  if (!fs.existsSync(THU_MUC)) { console.error(`Không có thư mục ${THU_MUC}`); process.exit(1); }
  const cacSeries = fs.readdirSync(THU_MUC, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const slugTheoSeries = {};
  for (const series of cacSeries) {
    const thuMucSeries = path.join(THU_MUC, series);
    if (DANH_RIENG.has(series)) baoLoi(thuMucSeries, 'thư mục', `"${series}" trùng đường dẫn hệ thống của web, hãy đặt tên khác`);
    if (!SLUG.test(series)) baoLoi(thuMucSeries, 'thư mục', `tên thư mục bộ truyện "${series}" phải viết thường, không dấu, nối bằng gạch ngang`);
    if (!fs.existsSync(path.join(thuMucSeries, 'index.mdx'))) baoLoi(thuMucSeries, 'index.mdx', `bộ truyện "${series}" chưa có trang bộ truyện index.mdx`);
    slugTheoSeries[series] = new Set();
    for (const d of fs.readdirSync(thuMucSeries, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      if (!CAC_DANH_MUC.includes(d.name)) { baoLoi(path.join(thuMucSeries, d.name), 'category', `thư mục "${d.name}" không phải danh mục hợp lệ (${CAC_DANH_MUC.join(', ')})`); continue; }
      for (const tep of fs.readdirSync(path.join(thuMucSeries, d.name))) if (tep.endsWith('.mdx')) slugTheoSeries[series].add(`${d.name}/${tep.slice(0, -4)}`);
    }
    if (fs.existsSync(path.join(thuMucSeries, 'index.mdx'))) kiemTraIndex(path.join(thuMucSeries, 'index.mdx'), slugTheoSeries[series]);
  }

  for (const series of cacSeries) {
    for (const cs of slugTheoSeries[series]) {
      const [category, tenFile] = cs.split('/');
      const f = path.join(THU_MUC, series, category, tenFile + '.mdx');
      const doc = docMdx(f);
      if (!doc) continue;
      const d = doc.data;
      const bat = (truong) => { if (d[truong] === undefined || d[truong] === null || d[truong] === '') { baoLoi(f, truong, 'thiếu trường bắt buộc'); return false; } return true; };

      // 1. Trường bắt buộc + độ dài
      for (const t of ['title', 'slug', 'description', 'keywords', 'universe', 'series', 'category', 'date', 'updated', 'faqs']) bat(t);
      if (typeof d.title === 'string' && (d.title.length < GIOI_HAN.title[0] || d.title.length > GIOI_HAN.title[1]))
        baoLoi(f, 'title', `dài ${d.title.length} ký tự, cần ${GIOI_HAN.title[0]}–${GIOI_HAN.title[1]}`);
      if (typeof d.description === 'string' && (d.description.length < GIOI_HAN.description[0] || d.description.length > GIOI_HAN.description[1]))
        baoLoi(f, 'description', `dài ${d.description.length} ký tự, cần ${GIOI_HAN.description[0]}–${GIOI_HAN.description[1]}`);
      if (d.faqs !== undefined) {
        if (!Array.isArray(d.faqs)) baoLoi(f, 'faqs', 'phải là danh sách các câu { q, a }');
        else {
          if (d.faqs.length < GIOI_HAN.faqs[0] || d.faqs.length > GIOI_HAN.faqs[1]) baoLoi(f, 'faqs', `có ${d.faqs.length} câu, cần ${GIOI_HAN.faqs[0]}–${GIOI_HAN.faqs[1]}`);
          d.faqs.forEach((c, i) => { if (!c?.q || !c?.a) baoLoi(f, `faqs[${i + 1}]`, 'mỗi câu cần đủ q (câu hỏi) và a (trả lời)'); });
        }
      }
      // 2. slug / series / category khớp đường dẫn
      if (d.slug && !SLUG.test(d.slug)) baoLoi(f, 'slug', `"${d.slug}" phải viết thường, không dấu, nối bằng gạch ngang`);
      if (d.slug && /^trang-\d+$/.test(d.slug)) baoLoi(f, 'slug', `"${d.slug}" trùng đường dẫn phân trang, hãy đặt tên khác`);
      if (d.slug && d.slug !== tenFile) baoLoi(f, 'slug', `"${d.slug}" phải trùng tên file "${tenFile}"`);
      if (d.series && d.series !== series) baoLoi(f, 'series', `"${d.series}" phải trùng thư mục bộ truyện "${series}"`);
      if (d.category && d.category !== category) baoLoi(f, 'category', `"${d.category}" phải trùng thư mục danh mục "${category}"`);
      if (d.universe && !SLUG.test(d.universe)) baoLoi(f, 'universe', `"${d.universe}" phải viết thường, không dấu, nối bằng gạch ngang`);
      if (d.keywords && !Array.isArray(d.keywords)) baoLoi(f, 'keywords', 'phải là danh sách, ví dụ ["hàn lập là ai", "cảnh giới hàn lập"]');
      // 3. Ảnh
      let anh = null;
      if (d.image) {
        if (!d.image_source?.ten || !d.image_source?.url) baoLoi(f, 'image_source', 'có image thì phải ghi nguồn: image_source.ten và image_source.url');
        anh = await kiemTraAnh(f, series, d.image);
      }
      // 4. Thân bài: không HTML / component
      for (const t of timThe(doc.content)) baoLoi(f, `thân bài (dòng ${t.dong})`, `không được dùng thẻ HTML/component "${t.the}" – chỉ viết Markdown; spoiler dùng khối :::spoiler … :::`);
      if (/^##\s+(câu hỏi thường gặp|hỏi đáp|faq)\s*$/im.test(doc.content)) baoCanhBao(f, 'thân bài', 'không viết mục "Câu hỏi thường gặp" trong thân bài – FAQ lấy từ trường faqs');
      // 5. Quan hệ (tuỳ chọn) trỏ đúng bài
      if (d.canh_gioi && !slugTheoSeries[series].has(`canh-gioi/${d.canh_gioi}`)) baoCanhBao(f, 'canh_gioi', `chưa có bài canh-gioi/${d.canh_gioi}.mdx trong ${series}`);
      for (const pb of d.phap_bao || []) if (!slugTheoSeries[series].has(`phap-bao/${pb}`)) baoCanhBao(f, 'phap_bao', `chưa có bài phap-bao/${pb}.mdx trong ${series}`);
      for (const nl of d.nang_luc || []) if (!slugTheoSeries[series].has(`phap-bao/${nl}`)) baoCanhBao(f, 'nang_luc', `chưa có bài phap-bao/${nl}.mdx trong ${series}`);
      if (d.arc != null) {
        if (!Number.isInteger(d.arc?.tap_tu)) baoLoi(f, 'arc', 'thiếu arc.tap_tu (số tập bắt đầu, số nguyên)');
        else if (d.arc.tap_den != null && !(Number.isInteger(d.arc.tap_den) && d.arc.tap_den >= d.arc.tap_tu)) baoLoi(f, 'arc', `arc.tap_den (${d.arc.tap_den}) phải là số nguyên ≥ arc.tap_tu (${d.arc.tap_tu})`);
      }
      // 6. Số từ
      const soTu = demTu(doc.content);
      if (soTu < GIOI_HAN.soTu[0] || soTu > GIOI_HAN.soTu[1]) {
        const lyDo = `thân bài ${soTu} từ, cần ${GIOI_HAN.soTu[0]}–${GIOI_HAN.soTu[1]}`;
        if (CHAT_SO_TU.has(path.resolve(f))) baoLoi(f, 'số từ', lyDo);
        else if (!d.nhap) baoCanhBao(f, 'số từ', lyDo);
      }
      tomTat.push({ file: tuongDoi(f), nhap: !!d.nhap, soTu, title: d.title?.length ?? 0, description: d.description?.length ?? 0, faqs: Array.isArray(d.faqs) ? d.faqs.length : 0, anhGocKB: anh?.kb ?? null });
    }
  }

  const soBai = tomTat.length;
  canhBao.forEach((c) => console.warn(c));
  loi.forEach((l) => console.error(l));
  if (FILE_JSON) fs.writeFileSync(FILE_JSON, JSON.stringify({ loi, canhBao, tomTat }, null, 2));
  console.log(`Kiểm tra nội dung: ${soBai} bài, ${loi.length} lỗi, ${canhBao.length} cảnh báo.`);
  if (loi.length) { console.error('Dừng build: sửa các lỗi ✗ ở trên rồi chạy lại.'); process.exit(1); }
}
main();
