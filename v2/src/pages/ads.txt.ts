// /ads.txt – khai báo người bán quảng cáo được phép (Google AdSense bắt buộc). Sinh từ mã nhà xuất bản ở thong-tin-web.mjs.
import { ADSENSE_CLIENT } from '../lib/thong-tin-web.mjs';
export const GET = () => new Response(
  ADSENSE_CLIENT ? `google.com, ${ADSENSE_CLIENT.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n` : '# Chưa cấu hình AdSense\n',
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
