// Kiểm thử plugin liên kết nội bộ tự động (Issue #31) trên một bộ truyện GIẢ tạo trong thư mục tạm
// (không phụ thuộc bài thật của BA):
//  1. Hai bài nhắc tên nhau → link 2 chiều, kể cả khi bài có nhiều tên hơn giới hạn.
//  2. Không bài nào quá GIOI_HAN.lienKetTuDong link.
//  3. Không link trong khối spoiler, mục FAQ, tiêu đề; tên lấy từ aliases + infobox (Biệt hiệu…).
//  4. Không nối sang bài của bộ truyện khác. 5. Có file báo cáo JSON cho bot PR.
// Chạy: node tests/kiem-tra-lien-ket.mjs
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkSpoiler from '../src/lib/remark-spoiler.mjs';
import remarkLienKetNoiBo from '../src/lib/remark-lien-ket-noi-bo.mjs';
import { GIOI_HAN } from '../src/lib/chuan-mdx.mjs';

const TOI_DA = GIOI_HAN.lienKetTuDong;
const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'lien-ket-'));
const goc = path.join(tam, 'content');
const viet = (f, fm, than) => { fs.mkdirSync(path.dirname(path.join(goc, f)), { recursive: true });
  fs.writeFileSync(path.join(goc, f), `---\n${fm}\n---\n${than}\n`); };

// Bộ truyện giả "truyen-a" có 14 nhân vật Nhân Vật Một … Nhân Vật Mười Bốn
const SO = ['Một', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười Một', 'Mười Hai', 'Mười Ba', 'Mười Bốn'];
const tenNV = (i) => `Nhân Vật ${SO[i]}`;
const slug = (i) => `nv-${i + 1}`;
viet('truyen-a/index.mdx', 'ten: "Truyện Giả A"', 'Truyện thử.');
viet('truyen-b/index.mdx', 'ten: "Truyện Giả B"', 'Truyện thử khác.');
// Bài thuộc truyện B trùng tên với nhân vật A – KHÔNG được nối từ truyện A
viet('truyen-b/nhan-vat/kiem-khach.mdx', 'title: "Kiếm Khách Vô Danh là ai? Bài thử"', 'Bài của truyện B.');

// nv-1: nhắc 13 người còn lại (vượt giới hạn); nv-14 đứng CUỐI nhưng nhắc ngược lại nv-1 → phải được ưu tiên
const nhacTatCa = SO.slice(1).map((_, k) => tenNV(k + 1)).join(', ');
viet(`truyen-a/nhan-vat/${slug(0)}.mdx`, `title: "${tenNV(0)} là ai? Bài thử"\naliases: ["Lão Một"]`, [
  '## Nhân Vật Hai trong tiêu đề', '',
  `Gặp gỡ: ${nhacTatCa}. Kiếm Khách Vô Danh cũng có mặt.`, '',
  ':::spoiler', 'Trong spoiler có Nhân Vật Mười Bốn.', ':::',
].join('\n'));
for (let i = 1; i < SO.length; i++) {
  const nhac = i === SO.length - 1 ? `Bạn thân của Lão Một.` : `Một người bình thường.`;
  viet(`truyen-a/nhan-vat/${slug(i)}.mdx`, `title: "${tenNV(i)} là ai? Bài thử"`, nhac);
}
// Bài có spoiler + mục FAQ; tên lấy từ infobox Biệt hiệu của bài khác
viet('truyen-a/nhan-vat/an-si.mdx', 'title: "Ẩn Sĩ Họ Trần là ai? Bài thử"\ninfobox:\n  Biệt hiệu: "Độc Nhãn Long"\n  Tên gốc: "陈隐士"', 'Ẩn sĩ.');
viet('truyen-a/the-luc/mon-phai.mdx', 'title: "Môn Phái Thử là gì? Bài thử"', [
  'Đoạn đầu nhắc Độc Nhãn Long.', '',
  ':::spoiler', 'Nhân Vật Hai chết ở đây.', ':::', '',
  '## Câu hỏi thường gặp', '', 'Nhân Vật Ba có mạnh không?', '',
  '## Phần sau', '', 'Nhân Vật Bốn xuất hiện.',
].join('\n'));

const tepBaoCao = path.join(tam, 'bao-cao', 'lien-ket-noi-bo.json');
const xuLy = unified().use(remarkParse).use(remarkDirective).use(remarkSpoiler)
  .use(remarkLienKetNoiBo, { thuMucNoiDung: goc, base: '/', tepBaoCao })
  .use(remarkRehype).use(rehypeStringify);
const html = (f) => { const p = path.join(goc, f); return String(xuLy.processSync({ path: p, value: fs.readFileSync(p, 'utf8').replace(/^---[\s\S]*?---\n/, '') })); };
const links = (h) => [...h.matchAll(/<a href="([^"]+)"[^>]*class="lien-ket-noi-bo"[^>]*>([^<]*)<\/a>/g)].map((m) => ({ url: m[1], chu: m[2] }));

let loi = 0;
const kt = (dk, mo) => { console.log(`${dk ? 'OK ' : 'LỖI'}  ${mo}`); if (!dk) loi++; };

const h1 = html('truyen-a/nhan-vat/nv-1.mdx');
const l1 = links(h1);
const h14 = html('truyen-a/nhan-vat/nv-14.mdx');
kt(l1.length === TOI_DA, `bài nhắc 13 tên chỉ gắn đúng ${TOI_DA} link (có ${l1.length})`);
kt(l1.some((l) => l.url === '/truyen-a/nhan-vat/nv-14/'), 'nv-1 → nv-14 có link (ưu tiên vì nv-14 nhắc ngược lại dù đứng cuối)');
kt(links(h14).some((l) => l.url === '/truyen-a/nhan-vat/nv-1/' && l.chu === 'Lão Một'), 'nv-14 → nv-1 có link qua aliases "Lão Một" → link 2 chiều');
kt(!/<h2[^>]*>[^<]*<a /.test(h1), 'không link trong tiêu đề');
kt(!l1.some((l) => l.url.includes('truyen-b/nhan-vat')), 'không nối sang bài của bộ truyện khác');
kt(!/<details[\s\S]*lien-ket-noi-bo[\s\S]*<\/details>/.test(h1), 'không link trong spoiler (nv-1)');

const hMp = html('truyen-a/the-luc/mon-phai.mdx');
const lMp = links(hMp);
kt(lMp.some((l) => l.chu === 'Độc Nhãn Long' && l.url === '/truyen-a/nhan-vat/an-si/'), 'tên lấy từ infobox "Biệt hiệu" được nối');
kt(!lMp.some((l) => l.chu === 'Nhân Vật Hai'), 'không link tên chỉ nằm trong spoiler');
kt(!lMp.some((l) => l.chu === 'Nhân Vật Ba'), 'không link trong mục "Câu hỏi thường gặp"');
kt(lMp.some((l) => l.chu === 'Nhân Vật Bốn'), 'mục sau FAQ vẫn được nối bình thường');

const bc = JSON.parse(fs.readFileSync(tepBaoCao, 'utf8'));
const b1 = bc.bai['content/truyen-a/nhan-vat/nv-1.mdx'];
kt(b1 && b1.soLink === TOI_DA && b1.lienKet.length === TOI_DA && b1.boQua.length === 3, 'file báo cáo ghi đủ link đã gắn + số bị bỏ qua');
kt(Object.values(bc.bai).every((b) => b.soLink <= TOI_DA), `báo cáo: không bài nào quá ${TOI_DA} link`);

fs.rmSync(tam, { recursive: true, force: true });
console.log(loi ? `errors: ${loi}` : 'errors: []');
process.exit(loi ? 1 : 0);
