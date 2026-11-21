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
/** Issue #137: tên danh mục đổi theo loại bộ (thư mục giữ nguyên). Loại không khai báo ở đây → dùng tên trong DANH_MUC. */
export const DANH_MUC_THEO_LOAI = {
  anime: {
    'canh-gioi': { ten: 'Hệ thống sức mạnh', tenSoNhieu: 'Hệ thống sức mạnh' },
    'phap-bao': { ten: 'Năng lực / Vật phẩm', tenSoNhieu: 'Năng lực / Vật phẩm' },
    'the-luc': { ten: 'Băng nhóm / Tổ chức', tenSoNhieu: 'Băng nhóm / Tổ chức' },
    'cot-truyen': { ten: 'Arc / Mùa phim', tenSoNhieu: 'Arc / Mùa phim' },
  },
};
/** Tên danh mục theo loại bộ: danhMuc('canh-gioi', 'anime').ten → "Hệ thống sức mạnh" */
export const danhMuc = (category, loai) => ({ ...DANH_MUC[category], ...(DANH_MUC_THEO_LOAI[loai]?.[category] || {}) });
/** Loại bộ truyện (trường `loai` trong index.mdx). Menu chỉ hiện loại nào đang có bộ.
 *  `nut`: chữ nút trên trang bộ truyện khác loại cùng `universe` dẫn tới bộ loại này (Issue #4), ví dụ trang truyện chữ → "Xem bản donghua". */
export const LOAI_TRUYEN = {
  'tu-tien': { ten: 'Truyện Tu Tiên', nut: 'Đọc bản truyện', moTa: 'Review truyện Tu Tiên, Huyền Huyễn: cốt truyện, nhân vật, hệ thống cảnh giới, pháp bảo.' },
  anime: { ten: 'Anime', nut: 'Xem bản anime', moTa: 'Review Anime: cốt truyện, nhân vật, sức mạnh và các mùa phim.',
    // Issue #137: trang bộ theo Arc (Dòng thời gian Arc, thứ tự xem, ẩn Xếp hạng sức mạnh theo cảnh giới)
    theoArc: true, chuDanhSach: 'tiểu sử, sức mạnh, năng lực và các mối quan hệ' },
  donghua: { ten: 'Donghua', nut: 'Xem bản donghua', moTa: 'Review Donghua (hoạt hình Trung Quốc): các mùa phim, nhân vật, chất lượng hình ảnh và độ bám nguyên tác.' },
};
export const CAC_LOAI_TRUYEN = Object.keys(LOAI_TRUYEN);
/** Chữ mô tả trang danh sách bài của 1 bộ (loại không khai báo chuDanhSach → chữ mặc định của truyện tu tiên) */
export const chuDanhSach = (loai) => LOAI_TRUYEN[loai]?.chuDanhSach || 'tiểu sử, cảnh giới, pháp bảo và các mối quan hệ';
/** Nhãn quan hệ nhân vật (trường quan_he[].quan_he). Giá trị khác ghi sao hiện vậy. */
export const NHAN_QUAN_HE = { 'dao-lu': 'Đạo lữ', 'su-phu': 'Sư phụ', 'de-tu': 'Đệ tử', 'ke-thu': 'Kẻ thù', 'ban-be': 'Bạn bè', 'gia-dinh': 'Gia đình', 'dong-mon': 'Đồng môn' };

export const GIOI_HAN = {
  title: [50, 65],          // ký tự
  description: [140, 160],  // ký tự
  faqs: [3, 6],             // số câu
  soTu: [800, 1200],        // số từ thân bài (build chỉ cảnh báo; workflow PR chặn file mới/sửa)
  canhAnhToiThieu: 480,     // px, cạnh ngắn ảnh gốc (thẻ nhân vật hiện tối đa ~290px; hạ từ 600 ở Issue #69 vì nhiều nhân vật phụ chỉ có ảnh ~500px)
  lienKetTuDong: 10,        // số liên kết nội bộ tự gắn tối đa mỗi bài (remark-lien-ket-noi-bo)
  banCoBiet: [30, 220],     // ký tự, mỗi ý ban_co_biet[].noi_dung ở index.mdx (Issue #11)
  banCoBietHien: 3,         // số thẻ "Bạn có biết" hiện cùng lúc; có nhiều hơn thì mỗi lượt xem chọn ngẫu nhiên
  xepHangToiThieu: 2,       // khối "Xếp hạng sức mạnh" chỉ hiện khi xếp được ít nhất ngần này nhân vật
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
