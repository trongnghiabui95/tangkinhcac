#!/usr/bin/env node
/**
 * process-images.mjs – xử lý ảnh lúc build (chạy trước `astro build`).
 *
 * Đọc frontmatter mọi file content/**\/*.mdx có khối `anh:` rồi với từng ảnh gốc trong anh-goc/<truyen>/:
 *   1. Xoay đúng chiều theo EXIF, cắt bỏ dải trên/dưới (khung đen, phụ đề) theo cat_tren / cat_duoi.
 *   2. Cắt về tỉ lệ chuẩn (nhân vật 3:4, bìa 2:3, pháp bảo 1:1). Tâm cắt chọn tự động bằng
 *      sharp.strategy.attention (vùng nổi bật – thường là khuôn mặt) hoặc ép bằng `tam: [x, y]`.
 *   3. Xuất WebP nhiều cỡ (srcset), không phóng to ảnh nhỏ; xoá toàn bộ EXIF/XMP (sharp mặc định không chép
 *      metadata sang ảnh mới). Mỗi file phải < 80KB: thử chất lượng 80 → 72 → … → 40, lấy mức cao nhất đạt;
 *      xuống 40 vẫn quá 80KB thì báo lỗi (Issue #30).
 *   0. Kiểm ảnh gốc trước: không có file / không phải ảnh / cạnh ngắn < 600px → báo lỗi rõ, không crash.
 *   4. Đặt tên chuẩn SEO: <slug>-<truyen>.webp, <slug>-<truyen>-300.webp; ảnh chia sẻ <slug>-<truyen>-og.jpg (1200×630).
 *   5. Ghi src/data/anh.json (đường dẫn, kích thước, srcset, nguồn) cho component ảnh dùng.
 * Có bộ nhớ đệm: ảnh gốc và tuỳ chọn không đổi thì bỏ qua (build lại nhanh).
 *
 * Chạy: node scripts/process-images.mjs   (thêm --lam-lai để xử lý lại toàn bộ)
 * Kiểm thử dùng thư mục khác: --noi-dung <dir> --anh-goc <dir> --ra <dir> --manifest <file>
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import matter from 'gray-matter';
import { GIOI_HAN } from '../src/lib/chuan-mdx.mjs';

const GOC = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const thamSo = process.argv.slice(2);
const lay = (ten, macDinh) => { const i = thamSo.indexOf(ten); return i >= 0 ? path.resolve(thamSo[i + 1]) : macDinh; };
const THU_MUC_NOI_DUNG = lay('--noi-dung', path.join(GOC, 'content'));
const THU_MUC_ANH_GOC = lay('--anh-goc', path.join(GOC, 'anh-goc'));
const THU_MUC_RA = lay('--ra', path.join(GOC, 'public', 'anh'));
const FILE_MANIFEST = lay('--manifest', path.join(GOC, 'src', 'data', 'anh.json'));
const GOC_PUBLIC = path.dirname(THU_MUC_RA);   // đường dẫn trong manifest tính từ đây (anh/<truyen>/…)
const LAM_LAI = process.argv.includes('--lam-lai');

// Hồ sơ theo loại bài: tỉ lệ, các chiều rộng xuất ra (lớn nhất = bản chính), mức cắt mặc định
const HO_SO = {
  'nhan-vat': { tiLe: 3 / 4, rong: [600, 300], catTren: 0.04, catDuoi: 0.12 },
  'bia':      { tiLe: 2 / 3, rong: [1000, 500], catTren: 0, catDuoi: 0, canhToiThieu: 500 },   // bìa hiện tối đa ~240px trên thẻ
  'phap-bao': { tiLe: 1,     rong: [600, 300], catTren: 0.04, catDuoi: 0.1 },
  'canh-gioi':{ tiLe: 16 / 9, rong: [1000, 500], catTren: 0, catDuoi: 0.1 },
  'cot-truyen':{ tiLe: 16 / 9, rong: [1000, 500], catTren: 0, catDuoi: 0.1 },
  'the-luc':  { tiLe: 1,     rong: [600, 300], catTren: 0.04, catDuoi: 0.1 },
  // Trang bộ truyện (Issue #51): thư viện ảnh (ảnh ngang 3:2, ảnh dọc 3:4) và bản đồ thế giới
  'thu-vien': { tiLe: 3 / 2, rong: [1000, 500], catTren: 0, catDuoi: 0 },
  'thu-vien-doc': { tiLe: 3 / 4, rong: [600, 300], catTren: 0, catDuoi: 0 },
  'ban-do':   { tiLe: 3 / 2, rong: [1200, 600], catTren: 0, catDuoi: 0 },
};
// Mỗi file WebP phải nhỏ hơn TOI_DA_KB; thử lần lượt các mức chất lượng, lấy mức cao nhất đạt
const TOI_DA_KB = 80;
const CAC_CHAT_LUONG = [80, 72, 64, 56, 48, 40];
const CANH_TOI_THIEU = GIOI_HAN.canhAnhToiThieu;   // 600px – cùng giới hạn với scripts/kiem-tra-noi-dung.mjs
const CHAT_LUONG = { TOI_DA_KB, CAC_CHAT_LUONG, CANH_TOI_THIEU, phienBan: 2 };   // đưa vào dấu vết bộ nhớ đệm

/** Nén WebP: giảm chất lượng dần tới khi < TOI_DA_KB. Trả { buf, q, kb }; không đạt thì báo lỗi rõ. */
async function nenWebp(nguon, rong, tenFile) {
  let cuoi;
  for (const q of CAC_CHAT_LUONG) {
    const buf = await sharp(nguon).resize(rong).webp({ quality: q, effort: 6 }).toBuffer();
    cuoi = { buf, q, kb: +(buf.length / 1024).toFixed(1) };
    if (buf.length < TOI_DA_KB * 1024) return cuoi;
  }
  throw new Error(`${tenFile} vẫn nặng ${cuoi.kb}KB ở chất lượng thấp nhất ${cuoi.q} (cần < ${TOI_DA_KB}KB). ` +
    'Hãy chọn ảnh gốc ít chi tiết/nhiễu hơn hoặc cắt sát hơn (image_crop).');
}

/** Kiểm ảnh gốc: có file, đúng là ảnh, cạnh ngắn ≥ 600px. Trả metadata. */
async function kiemTraGoc(fileGoc, viTri, toiThieu = CANH_TOI_THIEU) {
  const rel = path.relative(process.cwd(), fileGoc);
  if (!existsSync(fileGoc)) throw new Error(`không có file ảnh gốc ${rel} (khai báo ở ${viTri})`);
  let m;
  try { m = await sharp(fileGoc).metadata(); }
  catch { throw new Error(`file ${rel} không phải ảnh hợp lệ (hỏng hoặc sai định dạng) – khai báo ở ${viTri}`); }
  if (!m.width || !m.height) throw new Error(`file ${rel} không đọc được kích thước ảnh – khai báo ở ${viTri}`);
  const ngan = Math.min(m.width, m.height);
  if (ngan < toiThieu) throw new Error(`ảnh ${rel} quá nhỏ ${m.width}×${m.height}px: cạnh ngắn ${ngan}px, cần ≥ ${toiThieu}px (khai báo ở ${viTri})`);
  return m;
}

async function* duyet(thuMuc) {
  for (const d of await fs.readdir(thuMuc, { withFileTypes: true })) {
    const p = path.join(thuMuc, d.name);
    if (d.isDirectory()) yield* duyet(p);
    else if (d.name.endsWith('.mdx')) yield p;
  }
}

/** Từ đường dẫn content/<truyen>/<loai>/<slug>.mdx suy ra truyện, loại, slug, tên file đầu ra */
function phanTich(fileMdx) {
  const tuongDoi = path.relative(THU_MUC_NOI_DUNG, fileMdx).split(path.sep);
  const truyen = tuongDoi[0];
  if (tuongDoi.length === 2) return { truyen, loai: 'bia', slug: 'bia', ten: `bia-${truyen}` };
  const loai = tuongDoi[1], slug = path.basename(tuongDoi[2], '.mdx');
  return { truyen, loai, slug, ten: `${slug}-${truyen}` };
}

async function xuLy(viec) {
  const { truyen, loai, slug, ten, anh } = viec;
  const hs = HO_SO[viec.hoSo || loai];
  if (!hs) throw new Error(`Chưa có hồ sơ ảnh cho loại "${loai}"`);
  const fileGoc = path.join(THU_MUC_ANH_GOC, truyen, anh.goc);
  const meta = await kiemTraGoc(fileGoc, `${truyen}/${loai}/${slug}`, hs.canhToiThieu);

  const catTren = anh.cat_tren ?? hs.catTren, catDuoi = anh.cat_duoi ?? hs.catDuoi;
  const st = await fs.stat(fileGoc);
  const dauVet = crypto.createHash('sha1').update(JSON.stringify([st.size, st.mtimeMs, catTren, catDuoi, anh.tam, hs, CHAT_LUONG])).digest('hex').slice(0, 12);
  const thuMucRa = path.join(THU_MUC_RA, truyen);
  await fs.mkdir(thuMucRa, { recursive: true });

  // 1) Xoay theo EXIF rồi cắt dải trên/dưới
  const anhXoay = await sharp(fileGoc).rotate().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = anhXoay.info;
  const tren = Math.round(H * catTren), cao = H - tren - Math.round(H * catDuoi);
  if (cao < 50) throw new Error(`${ten}: cat_tren + cat_duoi quá lớn, ảnh còn ${cao}px`);
  let khung = sharp(anhXoay.data).extract({ left: 0, top: tren, width: W, height: cao });

  // 2) Cắt về tỉ lệ chuẩn: kích thước lớn nhất không vượt ảnh gốc (không phóng to)
  let rong = Math.min(hs.rong[0], W, Math.floor(cao * hs.tiLe));
  let caoRa = Math.round(rong / hs.tiLe);
  if (anh.tam) {
    // Ép tâm cắt thủ công: lấy vùng lớn nhất đúng tỉ lệ quanh điểm tam
    let cw = Math.min(W, Math.floor(cao * hs.tiLe)), ch = Math.round(cw / hs.tiLe);
    const x = Math.max(0, Math.min(W - cw, Math.round(anh.tam[0] * W - cw / 2)));
    const y = Math.max(0, Math.min(cao - ch, Math.round(anh.tam[1] * cao - ch / 2)));
    khung = sharp(await khung.toBuffer()).extract({ left: x, top: y, width: cw, height: ch });
    khung = khung.resize(rong, caoRa);
  } else {
    khung = khung.resize(rong, caoRa, { fit: 'cover', position: sharp.strategy.attention });
  }
  const banChinh = await khung.toBuffer();

  // 3) Xuất WebP nhiều cỡ (không chép metadata → EXIF bị xoá), mỗi file < 80KB
  const srcset = [];
  for (const w of [...new Set([rong, ...hs.rong.slice(1).filter((x) => x < rong)])]) {
    const tenFile = w === rong ? `${ten}.webp` : `${ten}-${w}.webp`;
    const { buf, q, kb } = await nenWebp(banChinh, w, tenFile);
    await fs.writeFile(path.join(thuMucRa, tenFile), buf);
    srcset.push({ w, src: `anh/${truyen}/${tenFile}`, chat_luong: q, kb });
  }

  // 4) Ảnh chia sẻ mạng xã hội 1200×630: nền mờ tối + ảnh chính ở giữa (JPEG để mọi nền tảng đọc được)
  const og = `${ten}-og.jpg`;
  const nen = await sharp(banChinh).resize(1200, 630, { fit: 'cover' }).blur(28).modulate({ brightness: 0.45 }).toBuffer();
  const giua = await sharp(banChinh).resize({ height: 570, width: 1100, fit: 'inside' }).toBuffer();
  await sharp(nen).composite([{ input: giua, gravity: 'center' }]).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(thuMucRa, og));

  return {
    khoa: `${truyen}/${loai}/${slug}`,
    du_lieu: { src: srcset[0].src, width: rong, height: caoRa, srcset, og: `anh/${truyen}/${og}`, nguon: anh.nguon, nguon_url: anh.nguon_url,
      chat_luong: srcset[0].chat_luong, kb: srcset[0].kb, goc: { width: meta.width, height: meta.height, kb: Math.round(st.size / 1024) }, dau_vet: dauVet },
    dauVet,
  };
}

async function main() {
  const cu = existsSync(FILE_MANIFEST) ? JSON.parse(await fs.readFile(FILE_MANIFEST, 'utf8')) : {};
  const moi = {};
  const viecLam = [];
  for await (const f of duyet(THU_MUC_NOI_DUNG)) {
    const { data } = matter(await fs.readFile(f, 'utf8'));
    // Bài viết (chuẩn .mdx mới): image + image_crop + image_source. Trang bộ truyện: khối anh cũ.
    const anh = data.image
      ? { goc: data.image, nguon: data.image_source?.ten, nguon_url: data.image_source?.url,
          cat_tren: data.image_crop?.tren, cat_duoi: data.image_crop?.duoi, tam: data.image_crop?.tam }
      : data.anh;
    const pt = phanTich(f);
    // Trang bộ truyện: thư viện ảnh + bản đồ (mỗi ảnh 1 việc, khoá <truyen>/thu-vien/<tên file> và <truyen>/ban-do/ban-do)
    if (pt.loai === 'bia') {
      for (const a of data.thu_vien || []) {
        const ten = path.basename(a.anh).replace(/\.[^.]+$/, '');
        const m = await sharp(path.join(THU_MUC_ANH_GOC, pt.truyen, a.anh)).metadata().catch(() => ({}));
        viecLam.push({ truyen: pt.truyen, loai: 'thu-vien', hoSo: m.height > m.width ? 'thu-vien-doc' : 'thu-vien', slug: ten, ten: `${ten}-${pt.truyen}`,
          anh: { goc: a.anh, nguon: a.nguon, nguon_url: a.nguon_url } });
      }
      if (data.ban_do?.anh) viecLam.push({ truyen: pt.truyen, loai: 'ban-do', slug: 'ban-do', ten: `ban-do-${pt.truyen}`,
        anh: { goc: data.ban_do.anh, nguon: data.ban_do.nguon, nguon_url: data.ban_do.nguon_url } });
    }
    if (!anh?.goc) continue;
    viecLam.push({ ...pt, anh });
  }
  let daXuLy = 0, boQua = 0;
  const loi = [];
  for (const v of viecLam) {
    const khoa = `${v.truyen}/${v.loai}/${v.slug}`;
    try {
      // Bộ nhớ đệm: dấu vết giống và file còn đó → giữ nguyên
      const hs = HO_SO[v.hoSo || v.loai];
      const fileGoc = path.join(THU_MUC_ANH_GOC, v.truyen, v.anh.goc);
      if (!LAM_LAI && cu[khoa] && existsSync(fileGoc) && existsSync(path.join(GOC_PUBLIC, cu[khoa].src))) {
        const st = await fs.stat(fileGoc);
        const dv = crypto.createHash('sha1').update(JSON.stringify([st.size, st.mtimeMs, v.anh.cat_tren ?? hs.catTren, v.anh.cat_duoi ?? hs.catDuoi, v.anh.tam, hs, CHAT_LUONG])).digest('hex').slice(0, 12);
        if (dv === cu[khoa].dau_vet) { moi[khoa] = { ...cu[khoa], nguon: v.anh.nguon, nguon_url: v.anh.nguon_url }; boQua++; continue; }
      }
      const kq = await xuLy(v);
      moi[kq.khoa] = kq.du_lieu; daXuLy++;
      console.log(`✓ ${kq.du_lieu.src}  ${kq.du_lieu.width}×${kq.du_lieu.height}  ${kq.du_lieu.kb}KB (chất lượng ${kq.du_lieu.chat_luong}; gốc ${kq.du_lieu.goc.kb}KB)  +${kq.du_lieu.srcset.length - 1} cỡ nhỏ, ảnh chia sẻ`);
    } catch (e) { loi.push(`${khoa}: ${e.message}`); }
  }
  await fs.mkdir(path.dirname(FILE_MANIFEST), { recursive: true });
  await fs.writeFile(FILE_MANIFEST, JSON.stringify(moi, null, 2) + '\n');
  console.log(`Ảnh: xử lý ${daXuLy}, giữ nguyên ${boQua}, lỗi ${loi.length}.`);
  if (loi.length) { loi.forEach((l) => console.error('✗ ' + l)); process.exit(1); }
}

main();
