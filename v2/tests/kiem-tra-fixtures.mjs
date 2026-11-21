// Kiểm thử bộ kiểm tra nội dung: các file sai PHẢI làm dừng build, báo đúng file + đúng trường.
// Chạy: npm run test:noi-dung
import { spawnSync } from 'node:child_process';
const kq = spawnSync('node', ['scripts/kiem-tra-noi-dung.mjs', '--goc', 'tests/fixtures/sai/content'], { encoding: 'utf8' });
const ra = kq.stdout + kq.stderr;
const MONG_DOI = [
  ['thieu-faqs.mdx', 'faqs', 'thiếu trường bắt buộc'],
  ['title-qua-dai.mdx', 'title', 'dài 72 ký tự'],
  ['co-the-div.mdx', 'thân bài', '<div'],
  ['truyen-thu/index.mdx', 'ban_co_biet[1]', 'dài 9 ký tự'],
  ['truyen-thu/index.mdx', 'cac_arc[1]', 'tap_den (10) phải là số nguyên ≥ tap_tu (20)'],
];
let loi = 0;
if (kq.status === 0) { console.error('LỖI: bộ kiểm tra không dừng (exit 0) dù có file sai'); loi++; }
for (const [file, truong, chu] of MONG_DOI) {
  const dong = ra.split('\n').find((l) => l.startsWith('✗') && l.includes(file) && l.includes(`· ${truong}`) && l.includes(chu));
  console.log(`${dong ? 'OK ' : 'LỖI'}  ${file} → ${truong}${dong ? `\n      ${dong}` : ' (không thấy thông báo mong đợi)'}`);
  if (!dong) loi++;
}
console.log(loi ? `errors: ${loi}` : 'errors: []');
process.exit(loi ? 1 : 0);
