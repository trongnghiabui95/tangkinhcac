#!/usr/bin/env node
/**
 * process-images.mjs – xử lý ảnh lúc build (chạy trước `astro build`).
 *
 * Đọc frontmatter mọi file content/**\/*.mdx có khối `anh:` rồi với từng ảnh gốc trong anh-goc/<truyen>/:
 *   1. Xoay đúng chiều theo EXIF, cắt bỏ dải trên/dưới (khung đen, phụ đề) theo cat_tren / cat_duoi.
 *   2. Cắt về tỉ lệ chuẩn (nhân vật 3:4, bìa 2:3, pháp bảo 1:1). Tâm cắt chọn tự động bằng
 *      sharp.strategy.attention (vùng nổi bật – thường là khuôn mặt) hoặc ép bằng `tam: [x, y]`.
 *   3. Xuất WebP chất lượng 80 ở nhiều cỡ (srcset), không phóng to ảnh nhỏ; xoá toàn bộ EXIF/XMP
 *      (sharp mặc định không chép metadata sang ảnh mới).
 *   4. Đặt tên chuẩn SEO: <slug>-<truyen>.webp, <slug>-<truyen>-300.webp; ảnh chia sẻ <slug>-<truyen>-og.jpg (1200×630).
 *   5. Ghi src/data/anh.json (đường dẫn, kích thước, srcset, nguồn) cho component ảnh dùng.
 * Có bộ nhớ đệm: ảnh gốc và tuỳ chọn không đổi thì bỏ qua (build lại nhanh).
 *
 * Chạy: node scripts/process-images.mjs   (thêm --lam-lai để xử lý lại toàn bộ)
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import matter from 'gray-matter';

const GOC = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const THU_MUC_NOI_DUNG = path.join(GOC, 'content');
const THU_MUC_ANH_GOC = path.join(GOC, 'anh-goc');
const THU_MUC_RA = path.join(GOC, 'public', 'anh');
const FILE_MANIFEST = path.join(GOC, 'src', 'data', 'anh.json');
const LAM_LAI = process.argv.includes('--lam-lai');

// Hồ sơ theo loại bài: tỉ lệ, các chiều rộng xuất ra (lớn nhất = bản chính), mức cắt mặc định
const HO_SO = {
  'nhan-vat': { tiLe: 3 / 4, rong: [600, 300], catTren: 0.04, catDuoi: 0.12 },
  'bia':      { tiLe: 2 / 3, rong: [1000, 500], catTren: 0, catDuoi: 0 },
  'phap-bao': { tiLe: 1,     rong: [600, 300], catTren: 0.04, catDuoi: 0.1 },
  'canh-gioi':{ tiLe: 16 / 9, rong: [1000, 500], catTren: 0, catDuoi: 0.1 },
};
const CHAT_LUONG = 80;

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
  const hs = HO_SO[loai];
  if (!hs) throw new Error(`Chưa có hồ sơ ảnh cho loại "${loai}"`);
  const fileGoc = path.join(THU_MUC_ANH_GOC, truyen, anh.goc);
  if (!existsSync(fileGoc)) throw new Error(`Thiếu ảnh gốc: ${path.relative(GOC, fileGoc)} (khai báo trong ${truyen}/${loai}/${slug})`);

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

  // 3) Xuất WebP nhiều cỡ (không chép metadata → EXIF bị xoá)
  const srcset = [];
  for (const w of [...new Set([rong, ...hs.rong.slice(1).filter((x) => x < rong)])]) {
    const tenFile = w === rong ? `${ten}.webp` : `${ten}-${w}.webp`;
    await sharp(banChinh).resize(w).webp({ quality: CHAT_LUONG, effort: 5 }).toFile(path.join(thuMucRa, tenFile));
    srcset.push({ w, src: `anh/${truyen}/${tenFile}` });
  }

  // 4) Ảnh chia sẻ mạng xã hội 1200×630: nền mờ tối + ảnh chính ở giữa (JPEG để mọi nền tảng đọc được)
  const og = `${ten}-og.jpg`;
  const nen = await sharp(banChinh).resize(1200, 630, { fit: 'cover' }).blur(28).modulate({ brightness: 0.45 }).toBuffer();
  const giua = await sharp(banChinh).resize({ height: 570, width: 1100, fit: 'inside' }).toBuffer();
  await sharp(nen).composite([{ input: giua, gravity: 'center' }]).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(thuMucRa, og));

  return {
    khoa: `${truyen}/${loai}/${slug}`,
    du_lieu: { src: srcset[0].src, width: rong, height: caoRa, srcset, og: `anh/${truyen}/${og}`, nguon: anh.nguon, dau_vet: dauVet },
    dauVet,
  };
}

async function main() {
  const cu = existsSync(FILE_MANIFEST) ? JSON.parse(await fs.readFile(FILE_MANIFEST, 'utf8')) : {};
  const moi = {};
  const viecLam = [];
  for await (const f of duyet(THU_MUC_NOI_DUNG)) {
    const { data } = matter(await fs.readFile(f, 'utf8'));
    if (!data.anh?.goc) continue;
    viecLam.push({ ...phanTich(f), anh: data.anh });
  }
  let daXuLy = 0, boQua = 0;
  const loi = [];
  for (const v of viecLam) {
    const khoa = `${v.truyen}/${v.loai}/${v.slug}`;
    try {
      // Bộ nhớ đệm: dấu vết giống và file còn đó → giữ nguyên
      const hs = HO_SO[v.loai];
      const fileGoc = path.join(THU_MUC_ANH_GOC, v.truyen, v.anh.goc);
      if (!LAM_LAI && cu[khoa] && existsSync(fileGoc) && existsSync(path.join(GOC, 'public', cu[khoa].src))) {
        const st = await fs.stat(fileGoc);
        const dv = crypto.createHash('sha1').update(JSON.stringify([st.size, st.mtimeMs, v.anh.cat_tren ?? hs.catTren, v.anh.cat_duoi ?? hs.catDuoi, v.anh.tam, hs, CHAT_LUONG])).digest('hex').slice(0, 12);
        if (dv === cu[khoa].dau_vet) { moi[khoa] = { ...cu[khoa], nguon: v.anh.nguon }; boQua++; continue; }
      }
      const kq = await xuLy(v);
      moi[kq.khoa] = kq.du_lieu; daXuLy++;
      console.log(`✓ ${kq.du_lieu.src}  ${kq.du_lieu.width}×${kq.du_lieu.height}  (+${kq.du_lieu.srcset.length - 1} cỡ nhỏ, ảnh chia sẻ)`);
    } catch (e) { loi.push(`${khoa}: ${e.message}`); }
  }
  await fs.mkdir(path.dirname(FILE_MANIFEST), { recursive: true });
  await fs.writeFile(FILE_MANIFEST, JSON.stringify(moi, null, 2) + '\n');
  console.log(`Ảnh: xử lý ${daXuLy}, giữ nguyên ${boQua}, lỗi ${loi.length}.`);
  if (loi.length) { loi.forEach((l) => console.error('✗ ' + l)); process.exit(1); }
}

main();
