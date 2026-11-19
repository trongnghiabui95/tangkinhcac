/**
 * CHUẨN FILE .MDX (Issue #27) – nguồn duy nhất cho mọi giới hạn.
 * content.config.ts (Zod) và scripts/kiem-tra-noi-dung.mjs đều đọc từ đây.
 */
export const DANH_MUC = {
  'nhan-vat': { ten: 'Nhân vật', tenSoNhieu: 'Nhân vật' },
  'canh-gioi': { ten: 'Cảnh giới', tenSoNhieu: 'Hệ thống cảnh giới' },
  'cot-truyen': { ten: 'Cốt truyện', tenSoNhieu: 'Cốt truyện' },
  'phap-bao': { ten: 'Pháp bảo', tenSoNhieu: 'Pháp bảo' },
  'the-luc': { ten: 'Thế lực', tenSoNhieu: 'Thế lực' },
};
export const CAC_DANH_MUC = Object.keys(DANH_MUC);

export const GIOI_HAN = {
  title: [50, 65],          // ký tự
  description: [140, 160],  // ký tự
  faqs: [3, 6],             // số câu
  soTu: [800, 1200],        // số từ thân bài (build chỉ cảnh báo; workflow PR chặn file mới/sửa)
  canhAnhToiThieu: 600,     // px, cạnh ngắn ảnh gốc
  lienKetTuDong: 10,        // số liên kết nội bộ tự gắn tối đa mỗi bài (remark-lien-ket-noi-bo)
};
/** Khoá infobox có giá trị là TÊN KHÁC của chính bài (dùng thêm cho liên kết nội bộ tự động) */
export const KHOA_INFOBOX_TEN_KHAC = /^(biệt hiệu|biệt danh|tên khác|tên gọi khác|danh hiệu|ngoại hiệu|đạo hiệu|pháp hiệu)$/iu;
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Bỏ khối code để không bắt nhầm */
const boCode = (s) => s.replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, ' ')).replace(/`[^`\n]*`/g, (m) => ' '.repeat(m.length));

/** Đếm từ thân bài (không tính frontmatter, cú pháp Markdown, dòng :::) */
export function demTu(than) {
  return boCode(than)
    .replace(/^:::.*$/gm, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .split(/\s+/)
    .filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

/** Tìm thẻ HTML / component trong thân bài → [{ dong, the }] */
export function timThe(than) {
  const ra = [];
  boCode(than).split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/<\/?([A-Za-z][\w.:-]*)(\s[^<>]*)?\/?>|<!--/g)) ra.push({ dong: i + 1, the: m[0].slice(0, 40) });
    if (/^\s*(import|export)\s/.test(l)) ra.push({ dong: i + 1, the: l.trim().slice(0, 40) });
  });
  return ra;
}

/** Tên ngắn để hiện trên thẻ, menu, liên kết: phần đầu của title trước "là ai", "là gì", "?", ":", "|", "–" */
export function tenNgan(title = '') {
  return String(title).split(/\s+là (?:ai|gì)(?![\p{L}])|[?:|–—]| - /iu)[0].trim() || String(title).trim();
}
