/**
 * remark-lien-ket-noi-bo – TỰ ĐỘNG GẮN LIÊN KẾT NỘI BỘ lúc build.
 *
 * Quét chữ trong bài; gặp tên (tên ngắn rút từ title, `ten`, hoặc `aliases`) của bài khác đã có
 * trong content/ thì biến LẦN XUẤT HIỆN ĐẦU TIÊN thành liên kết tới trang đó.
 *  - Chỉ nối trong cùng một bộ truyện (tránh tên cảnh giới của truyện A trỏ sang truyện B); tên truyện thì nối mọi nơi.
 *  - Không nối trong tiêu đề, trong liên kết có sẵn, trong code; không tự nối về chính bài đang viết.
 *  - Ưu tiên tên dài trước (tên 4 chữ được xét trước tên 2 chữ trùng phần đầu); so khớp đủ từ (không cắt giữa chữ).
 *  - Giới hạn số liên kết mỗi bài (mặc định 40) để không "nhồi link".
 * Tuỳ chọn: { thuMucNoiDung: 'content', base: '/', toiDaMoiBai: 40, doDaiToiThieu: 3 }
 */
import path from 'node:path';
import { visitParents, SKIP } from 'unist-util-visit-parents';
import { docChiMuc } from './chi-muc-noi-dung.mjs';

const KHONG_NOI_TRONG = new Set(['link', 'linkReference', 'heading', 'inlineCode', 'code', 'definition', 'html']);
const thoatRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function remarkLienKetNoiBo(tuyChon = {}) {
  const { thuMucNoiDung = 'content', base = '/', toiDaMoiBai = 40, doDaiToiThieu = 3 } = tuyChon;

  return function (tree, file) {
    const tatCa = docChiMuc(path.resolve(thuMucNoiDung), base);
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
    const ten = [...bang.keys()].sort((a, b) => b.length - a.length);
    const re = new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])(${ten.map(thoatRegex).join('|')})(?![\\p{L}\\p{M}\\p{N}])`, 'gu');

    const daNoi = new Set();
    let soLienKet = 0;
    visitParents(tree, 'text', (node, toTien) => {
      if (soLienKet >= toiDaMoiBai) return;
      if (toTien.some((a) => KHONG_NOI_TRONG.has(a.type) || (a.type?.startsWith('mdxJsx') && a.name === 'a'))) return;
      const chu = node.value.normalize('NFC');
      const manh = [];
      let viTri = 0;
      re.lastIndex = 0;
      for (const khop of chu.matchAll(re)) {
        const m = bang.get(khop[1]);
        if (!m || daNoi.has(m.url) || soLienKet >= toiDaMoiBai) continue;
        daNoi.add(m.url); soLienKet++;
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
  };
}
