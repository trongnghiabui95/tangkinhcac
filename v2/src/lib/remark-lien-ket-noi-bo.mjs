/**
 * remark-lien-ket-noi-bo – TỰ ĐỘNG GẮN LIÊN KẾT NỘI BỘ lúc build (Issue #31).
 *
 * Từ điển tên: tên ngắn rút từ title (hoặc `ten`), `aliases`, và giá trị infobox có khoá là tên khác
 * (Biệt hiệu, Đạo hiệu… – xem KHOA_INFOBOX_TEN_KHAC trong chuan-mdx.mjs) của bài khác trong content/.
 * Gặp tên trong thân bài thì biến LẦN XUẤT HIỆN ĐẦU TIÊN thành liên kết tới bài đó.
 *  - Chỉ nối trong cùng một bộ truyện (tránh tên cảnh giới của truyện A trỏ sang truyện B); tên truyện thì nối mọi nơi.
 *  - KHÔNG nối trong: tiêu đề, liên kết có sẵn, code, khối spoiler (:::spoiler), mục "Câu hỏi thường gặp"/FAQ
 *    trong thân bài. (FAQ và infobox của frontmatter không đi qua plugin này nên cũng không bị gắn.)
 *  - Không tự nối về chính bài đang viết. Ưu tiên tên dài trước; so khớp đủ từ (không cắt giữa chữ).
 *  - Giới hạn số liên kết mỗi bài (GIOI_HAN.lienKetTuDong = 10). Khi có nhiều hơn giới hạn, ưu tiên bài
 *    CŨNG NHẮC LẠI tên bài này (để 2 bài nhắc tên nhau có link 2 chiều), rồi tới thứ tự xuất hiện.
 *  - Ghi danh sách link đã gắn của từng bài ra file báo cáo JSON (mặc định bao-cao/lien-ket-noi-bo.json,
 *    hoặc biến môi trường BAO_CAO_LIEN_KET) để bot PR đưa vào bảng cho QA.
 * Tuỳ chọn: { thuMucNoiDung: 'content', base: '/', toiDaMoiBai: 10, doDaiToiThieu: 3, tepBaoCao }
 */
import fs from 'node:fs';
import path from 'node:path';
import { visitParents, SKIP } from 'unist-util-visit-parents';
import { toString } from 'mdast-util-to-string';
import { docChiMuc } from './chi-muc-noi-dung.mjs';
import { GIOI_HAN } from './chuan-mdx.mjs';

const KHONG_NOI_TRONG = new Set(['link', 'linkReference', 'heading', 'inlineCode', 'code', 'definition', 'html']);
const TIEU_DE_FAQ = /câu hỏi thường gặp|hỏi\s*(?:&|và|-|–)?\s*đáp|\bfaqs?\b/iu;
const thoatRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const taoRegex = (ds) => new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])(${ds.map(thoatRegex).join('|')})(?![\\p{L}\\p{M}\\p{N}])`, 'gu');
const laSpoiler = (n) => n.type === 'containerDirective' && n.name === 'spoiler';

/** Thân bài thô bỏ phần không được nối (spoiler, tiêu đề, mục FAQ) – để đoán bài kia có nối ngược về không */
function phanDuocNoi(than) {
  const ra = [];
  let trongSpoiler = false, faqCap = 0;
  for (const dong of than.split('\n')) {
    if (/^\s*:::\s*spoiler/.test(dong)) { trongSpoiler = true; continue; }
    if (trongSpoiler) { if (/^\s*:::\s*$/.test(dong)) trongSpoiler = false; continue; }
    const h = dong.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      if (faqCap && h[1].length <= faqCap) faqCap = 0;
      if (TIEU_DE_FAQ.test(h[2])) faqCap = h[1].length;
      continue;
    }
    if (!faqCap) ra.push(dong);
  }
  return ra.join('\n');
}

// Báo cáo dùng chung cho cả lần build (mỗi lần chạy Node là 1 bản mới, ghi đè file cũ)
const baoCao = new Map();
function ghiBaoCao(tep, khoa, giaTri) {
  baoCao.set(khoa, giaTri);
  try {
    fs.mkdirSync(path.dirname(tep), { recursive: true });
    const sapXep = Object.fromEntries([...baoCao.entries()].sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(tep, JSON.stringify({ toiDaMoiBai: giaTri.toiDa, bai: sapXep }, null, 2));
  } catch { /* báo cáo chỉ phục vụ QA – không làm hỏng build */ }
}

export default function remarkLienKetNoiBo(tuyChon = {}) {
  const {
    thuMucNoiDung = 'content', base = '/', toiDaMoiBai = GIOI_HAN.lienKetTuDong, doDaiToiThieu = 3,
    tepBaoCao = process.env.BAO_CAO_LIEN_KET || path.resolve(thuMucNoiDung, '..', 'bao-cao', 'lien-ket-noi-bo.json'),
  } = tuyChon;
  const goc = path.resolve(thuMucNoiDung);

  return function (tree, file) {
    const tatCa = docChiMuc(goc, base);
    const fileHienTai = file.path ? path.resolve(file.path) : '';
    const muc = tatCa.find((m) => m.file === fileHienTai);
    const truyenHienTai = muc?.series;

    // Bảng tên → mục (chỉ cùng truyện, hoặc là chính tên truyện)
    const bang = new Map();
    for (const m of tatCa) {
      if (m.file === fileHienTai) continue;
      if (m.category !== 'series' && m.series !== truyenHienTai) continue;
      for (const ten of [m.ten, ...m.ten_khac]) {
        if (ten.length >= doDaiToiThieu && !bang.has(ten)) bang.set(ten, m);
      }
    }
    if (!bang.size) return;
    const re = taoRegex([...bang.keys()].sort((a, b) => b.length - a.length));

    // Bài kia có nhắc tên bài này (ở phần được nối) không → được ưu tiên để có link 2 chiều
    const tenBaiNay = muc ? [muc.ten, ...muc.ten_khac].filter((t) => t.length >= doDaiToiThieu) : [];
    const reNguoc = tenBaiNay.length ? taoRegex(tenBaiNay) : null;
    const coNoiNguoc = new Map();
    const noiNguoc = (m) => {
      if (!reNguoc) return false;
      if (!coNoiNguoc.has(m.url)) { reNguoc.lastIndex = 0; coNoiNguoc.set(m.url, reNguoc.test(phanDuocNoi(m.than || ''))); }
      return coNoiNguoc.get(m.url);
    };

    // Đánh dấu mục FAQ trong thân bài (tiêu đề FAQ → hết mục khi gặp tiêu đề cùng cấp/cao hơn)
    const nutFaq = new Set();
    const duyetFaq = (cha) => {
      let cap = 0;
      for (const con of cha.children || []) {
        if (con.type === 'heading') {
          if (cap && con.depth <= cap) cap = 0;
          if (TIEU_DE_FAQ.test(toString(con))) { cap = con.depth; continue; }
        }
        if (cap) nutFaq.add(con);
        else if (con.children && con.type !== 'heading') duyetFaq(con);
      }
    };
    duyetFaq(tree);
    const biCam = (toTien) => toTien.some((a) => KHONG_NOI_TRONG.has(a.type) || laSpoiler(a) || nutFaq.has(a)
      || (a.type?.startsWith('mdxJsx') && a.name === 'a'));

    // Lượt 1: gom ứng viên (mỗi bài đích 1 lần, theo thứ tự xuất hiện)
    const ungVien = new Map();
    visitParents(tree, 'text', (node, toTien) => {
      if (biCam(toTien)) return;
      for (const khop of node.value.normalize('NFC').matchAll(re)) {
        const m = bang.get(khop[1]);
        if (m && !ungVien.has(m.url)) ungVien.set(m.url, { m, thuTu: ungVien.size, nguoc: noiNguoc(m) });
      }
    });
    const duocChon = new Set([...ungVien.values()]
      .sort((a, b) => (b.nguoc - a.nguoc) || (a.thuTu - b.thuTu))
      .slice(0, toiDaMoiBai).map((u) => u.m.url));

    // Lượt 2: gắn link ở lần xuất hiện đầu tiên của các bài được chọn
    const daNoi = [];
    const daNoiUrl = new Set();
    if (duocChon.size) visitParents(tree, 'text', (node, toTien) => {
      if (biCam(toTien)) return;
      const chu = node.value.normalize('NFC');
      const manh = [];
      let viTri = 0;
      for (const khop of chu.matchAll(re)) {
        const m = bang.get(khop[1]);
        if (!m || !duocChon.has(m.url) || daNoiUrl.has(m.url)) continue;
        daNoiUrl.add(m.url);
        daNoi.push({ chu: khop[1], url: m.url, loai: m.category, haiChieu: ungVien.get(m.url).nguoc });
        if (khop.index > viTri) manh.push({ type: 'text', value: chu.slice(viTri, khop.index) });
        manh.push({
          type: 'link', url: m.url, title: m.ten,
          data: { hProperties: { className: ['lien-ket-noi-bo'], 'data-loai': m.category } },
          children: [{ type: 'text', value: khop[1] }],
        });
        viTri = khop.index + khop[1].length;
      }
      if (!manh.length) return;
      if (viTri < chu.length) manh.push({ type: 'text', value: chu.slice(viTri) });
      const cha = toTien[toTien.length - 1];
      const i = cha.children.indexOf(node);
      cha.children.splice(i, 1, ...manh);
      return [SKIP, i + manh.length];
    });

    if (muc) {
      ghiBaoCao(tepBaoCao, path.relative(path.dirname(goc), muc.file).split(path.sep).join('/'), {
        url: muc.url, toiDa: toiDaMoiBai, soLink: daNoi.length,
        boQua: [...ungVien.values()].filter((u) => !duocChon.has(u.m.url)).map((u) => u.m.url),
        lienKet: daNoi,
      });
    }
  };
}
