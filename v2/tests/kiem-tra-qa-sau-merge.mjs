// Kiểm thử quy tắc "can-qa-lai" (Issue #136): PR nội dung đã merge mà chưa QA duyệt → canQaLai = true.
// Chạy: node tests/kiem-tra-qa-sau-merge.mjs (trong v2/)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const thuMuc = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-sau-merge-'));
const CA = [
  // [mô tả, nhãn, nhánh, merged, canQaLai mong đợi]
  ['nội dung, merge khi chưa approved', ['noi-dung'], 'noi-dung/bai-a', true, true],
  ['nội dung, merge khi còn tra-ve', ['noi-dung', 'tra-ve'], 'noi-dung/bai-b', true, true],
  ['nội dung, merge khi có approved nhưng còn tra-ve', ['noi-dung', 'approved', 'tra-ve'], 'noi-dung/bai-c', true, true],
  ['nội dung, merge khi đã approved', ['noi-dung', 'approved'], 'noi-dung/bai-d', true, false],
  ['nhánh noi-dung/* không nhãn, merge chưa approved', [], 'noi-dung/bai-e', true, true],
  ['nội dung, đóng không merge', ['noi-dung'], 'noi-dung/bai-f', false, false],
  ['PR dev, merge', ['dev'], 'dev/136-can-qa-lai', true, false],
];
let loi = 0;
CA.forEach(([moTa, nhan, nhanh, merged, mongDoi], i) => {
  const f = path.join(thuMuc, `su-kien-${i}.json`);
  fs.writeFileSync(f, JSON.stringify({ action: 'closed', pull_request: { number: i + 1, merged, labels: nhan.map((name) => ({ name })), head: { ref: nhanh } } }));
  const kq = spawnSync('node', ['scripts/qa-trang-thai.mjs', f], { encoding: 'utf8' });
  let thuc; try { thuc = JSON.parse(kq.stdout).canQaLai; } catch { thuc = `lỗi: ${kq.stderr}`; }
  const dung = thuc === mongDoi;
  if (!dung) loi++;
  console.log(`${dung ? 'OK ' : 'LỖI'}  ${moTa} → canQaLai=${thuc} (mong đợi ${mongDoi})`);
});
fs.rmSync(thuMuc, { recursive: true, force: true });
console.log(loi ? `errors: ${loi}` : 'errors: []');
process.exit(loi ? 1 : 0);
