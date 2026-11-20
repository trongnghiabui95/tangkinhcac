#!/usr/bin/env node
/**
 * qa-trang-thai.mjs – trạng thái duyệt QA của 1 PR (Issue #72). Không cần thư viện, chạy được với Node có sẵn trên máy GitHub.
 *   node scripts/qa-trang-thai.mjs [--dong] [file sự kiện GitHub]   (mặc định $GITHUB_EVENT_PATH; --dong: chỉ in câu tiếng Việt, PR không phải nội dung thì in rỗng)
 * In JSON: { apDung, trangThai, dong }
 *   apDung     PR nội dung? (có nhãn `noi-dung` hoặc nhánh `noi-dung/*`). PR dev/* → false, không bị chặn.
 *   trangThai  khong-ap-dung | da-duyet | chua-duyet | tra-ve
 *   dong       câu tiếng Việt để ghi vào bảng tóm tắt
 * Quy tắc: còn nhãn `tra-ve` → bị trả về (đỏ, dù có `approved`); có `approved` → đã duyệt (xanh); còn lại → chưa duyệt (đỏ).
 */
import fs from 'node:fs';
const NHAN_NOI_DUNG = 'noi-dung', NHAN_DUYET = 'approved', NHAN_TRA_VE = 'tra-ve', TIEN_TO_NHANH = 'noi-dung/';
const thamSo = process.argv.slice(2);
const chiDong = thamSo.includes('--dong');
const file = thamSo.find((x) => !x.startsWith('--')) || process.env.GITHUB_EVENT_PATH;
const pr = JSON.parse(fs.readFileSync(file, 'utf8')).pull_request || {};
const nhan = (pr.labels || []).map((l) => l.name);
const apDung = nhan.includes(NHAN_NOI_DUNG) || String(pr.head?.ref || '').startsWith(TIEN_TO_NHANH);
let trangThai = 'khong-ap-dung', dong = 'QA: không áp dụng (PR không phải bài nội dung)';
if (apDung) {
  if (nhan.includes(NHAN_TRA_VE)) { trangThai = 'tra-ve'; dong = '❌ **QA: bị trả về** (nhãn `tra-ve`) – BA sửa theo góp ý, QA gỡ `tra-ve` và gắn `approved` thì mới merge được'; }
  else if (nhan.includes(NHAN_DUYET)) { trangThai = 'da-duyet'; dong = '✅ **QA: đã duyệt** (nhãn `approved`)'; }
  else { trangThai = 'chua-duyet'; dong = '⏳ **QA: chưa duyệt** – chờ QA gắn nhãn `approved` rồi mới merge'; }
}
process.stdout.write(chiDong ? (apDung ? dong : '') : JSON.stringify({ apDung, trangThai, dong }) + '\n');
