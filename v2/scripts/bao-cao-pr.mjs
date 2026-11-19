#!/usr/bin/env node
/**
 * bao-cao-pr.mjs – lập bảng tóm tắt cho QA (Markdown) từ kết quả các bước kiểm tra.
 *   --noi-dung <json>   kết quả scripts/kiem-tra-noi-dung.mjs --json
 *   --dist <json>       kết quả scripts/kiem-tra-dist.mjs --json (có thể thiếu nếu build hỏng)
 *   --thay-doi <txt>    danh sách file .mdx mới/sửa trong PR (mỗi dòng 1 file, tính từ v2/)
 *   --buoc "ten=ok|loi" (lặp lại) kết quả từng bước của workflow
 *   --lien-ket <json>   báo cáo liên kết nội bộ tự gắn (mặc định bao-cao/lien-ket-noi-bo.json – do plugin ghi lúc build)
 * In Markdown ra stdout.
 */
import fs from 'node:fs';
import path from 'node:path';
import { GIOI_HAN } from '../src/lib/chuan-mdx.mjs';

const GOC = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const a = process.argv.slice(2);
const lay = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : ''; };
const docJson = (f) => { try { return f && fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; } catch { return null; } };
const noiDung = docJson(lay('--noi-dung')) || { loi: [], canhBao: [], tomTat: [] };
const dist = docJson(lay('--dist'));
const thayDoi = lay('--thay-doi') && fs.existsSync(lay('--thay-doi'))
  ? fs.readFileSync(lay('--thay-doi'), 'utf8').split('\n').map((s) => s.trim()).filter((s) => s.endsWith('.mdx')) : [];
const buoc = a.flatMap((x, i) => (x === '--buoc' ? [a[i + 1]] : [])).map((s) => s.split('='));
const anh = docJson(path.join(GOC, 'src/data/anh.json')) || {};
const lienKet = docJson(lay('--lien-ket') || path.join(GOC, 'bao-cao/lien-ket-noi-bo.json'));

const trongKhoang = (v, [min, max]) => v >= min && v <= max;
const dau = (ok) => (ok ? '✅' : '❌');
const chuan = (p) => p.replace(/^\.?\/*/, '').replace(/^v2\//, '');

const dong = [];
const chiTietLink = [];
for (const f of thayDoi) {
  const phan = chuan(f).split('/');               // content/<series>/<category>/<slug>.mdx
  if (phan.length !== 4) continue;                // bỏ index.mdx của bộ truyện
  const [, series, category, tep] = phan;
  const slug = tep.replace(/\.mdx$/, '');
  const t = noiDung.tomTat.find((x) => chuan(x.file) === chuan(f));
  if (!t) { dong.push(`| \`${slug}\` | ❌ không đọc được | | | | | | |`); continue; }
  const trang = path.join(GOC, 'dist', series, category, slug, 'index.html');
  const lk = lienKet?.bai?.[chuan(f)];
  const soLink = lk ? lk.soLink : fs.existsSync(trang) ? (fs.readFileSync(trang, 'utf8').match(/class="lien-ket-noi-bo"/g) || []).length : null;
  const toiDaLink = lk?.toiDa ?? lienKet?.toiDaMoiBai ?? GIOI_HAN.lienKetTuDong;
  if (lk) chiTietLink.push(`- **${category}/${slug}** (${lk.soLink}/${toiDaLink}): `
    + (lk.lienKet.length ? lk.lienKet.map((l) => `${l.chu}${l.haiChieu ? ' ⇄' : ''} (\`${l.url}\`)`).join(', ') : '_không có_')
    + (lk.boQua.length ? ` · _bỏ qua do quá giới hạn: ${lk.boQua.length}_` : ''));
  const a1 = anh[`${series}/${category}/${slug}`];
  const anhFile = a1 && path.join(GOC, 'public', a1.src);
  const kb = anhFile && fs.existsSync(anhFile) ? Math.round(fs.statSync(anhFile).size / 1024) : null;
  dong.push(`| \`${category}/${slug}\` | ${t.nhap ? '📝 nháp' : '🌐 xuất bản'} | ${dau(trongKhoang(t.soTu, GIOI_HAN.soTu))} ${t.soTu} | ${dau(trongKhoang(t.title, GIOI_HAN.title))} ${t.title} | ${dau(trongKhoang(t.description, GIOI_HAN.description))} ${t.description} | ${dau(trongKhoang(t.faqs, GIOI_HAN.faqs))} ${t.faqs} | ${kb != null ? `${dau(kb < 80)} ${kb} KB` : t.anhGocKB != null ? `gốc ${t.anhGocKB} KB` : '—'} | ${soLink == null ? '—' : `${dau(soLink <= toiDaLink)} ${soLink}`} |`);
}

const loi = [
  ...noiDung.loi,
  ...(dist ? dist.lienKetHong.map((l) => `✗ link hỏng · trang \`${l.trang}\` → \`${l.href}\``) : []),
  ...(dist ? dist.baiThieu.map((b) => `✗ ${b.file} · ${b.loi}`) : []),
];
const buocLoi = buoc.filter(([, kq]) => kq !== 'success' && kq !== 'skipped');
const ok = !loi.length && !buocLoi.length;

const md = [
  '<!-- bao-cao-v2 -->',
  `## ${ok ? '✅ Nội dung v2 đạt chuẩn' : '❌ Nội dung v2 chưa đạt – cần sửa trước khi merge'}`,
  '',
  buoc.length ? `**Các bước:** ${buoc.map(([ten, kq]) => `${kq === 'success' ? '✅' : kq === 'skipped' ? '⏭' : '❌'} ${ten}`).join(' · ')}` : '',
  '',
  thayDoi.length ? `### Bài mới/sửa trong PR (${dong.length})` : '### Không có bài .mdx mới/sửa trong PR',
  ...(dong.length ? [
    '',
    `| Bài | Trạng thái | Số từ (${GIOI_HAN.soTu.join('–')}) | Title (${GIOI_HAN.title.join('–')} ký tự) | Description (${GIOI_HAN.description.join('–')}) | FAQ (${GIOI_HAN.faqs.join('–')}) | Ảnh (< 80 KB) | Link nội bộ tự gắn (≤ ${GIOI_HAN.lienKetTuDong}) |`,
    '|---|---|---|---|---|---|---|---|',
    ...dong,
  ] : []),
  chiTietLink.length ? `\n<details><summary>Link nội bộ tự gắn của từng bài (⇄ = bài kia cũng link ngược lại)</summary>\n\n${chiTietLink.join('\n')}\n</details>` : '',
  '',
  loi.length ? `### Lỗi (${loi.length})\n\n${loi.map((l) => `- ${l.replace(/^✗\s*/, '')}`).join('\n')}` : '',
  noiDung.canhBao.length ? `\n<details><summary>Cảnh báo (${noiDung.canhBao.length}) – không chặn merge</summary>\n\n${noiDung.canhBao.map((c) => `- ${c.replace(/^⚠\s*/, '')}`).join('\n')}\n</details>` : '',
  '',
  dist ? `_Bản build: ${dist.soTrang} trang, ${dist.soBai} bài đã xuất bản, ${dist.lienKetHong.length} link nội bộ hỏng._` : '_Không có kết quả kiểm tra bản build (build lỗi)._',
  '',
  '_Bảng do workflow `v2-build` tự cập nhật mỗi lần đẩy code. Chuẩn: Issue #27 · `v2/README-V2.md` mục 3._',
].filter((x) => x !== undefined).join('\n');
process.stdout.write(md.replace(/\n{3,}/g, '\n\n') + '\n');
