/**
 * rehype-chen-quang-cao – chèn ô quảng cáo AdSense vào GIỮA BÀI một cách an toàn.
 *  - Sau mỗi `moiSoH2` mục (mặc định 3): đặt ô quảng cáo ngay TRƯỚC thẻ <h2> thứ 4, 7, 10…
 *  - Không đặt sát ảnh/hình (figure, img, picture), video, nút điều hướng (nav), component ảnh/spoiler/chuyển chương
 *    hay khối được đánh dấu `khong-quang-cao`; vị trí nào vi phạm thì dời sang trước thẻ <h2> kế tiếp.
 *  - Không đặt trong mục "Câu hỏi thường gặp".
 *  - Ô quảng cáo có nhãn "Quảng cáo", lề trên/dưới ≥ 32px và chiều cao giữ chỗ (CSS .quang-cao) để không nhảy trang.
 *  - Chưa có mã AdSense (adsenseClient trống): không chèn gì; đặt xemThu=true để thấy khung giữ chỗ khi làm việc.
 */
const GAN_ANH = new Set(['figure', 'img', 'picture', 'video', 'iframe', 'nav']);
const laPhanTu = (n) => n && n.type === 'element';
const coLop = (n, lop) => [].concat(n.properties?.className || []).includes(lop);
// Component MDX (<Spoiler>, <AnhNhanVat>, <YouTube…>…) chưa thành HTML ở bước này → nhận theo tên
const COMPONENT_TRANH = /^(Spoiler|Anh|Image|Figure|Picture|Video|YouTube|Gallery|ThuVienAnh|ChuyenChuong|Nav)/i;
const laComponentTranh = (n) => n && n.type?.startsWith('mdxJsx') && COMPONENT_TRANH.test(n.name || '');
const chuaAnh = (n) => laComponentTranh(n) || (laPhanTu(n) && (GAN_ANH.has(n.tagName) || coLop(n, 'khong-quang-cao') || (n.children || []).some(chuaAnh)));
const chu = (n) => n.type === 'text' ? n.value : (n.children || []).map(chu).join('');

export default function rehypeChenQuangCao({ moiSoH2 = 3, adsenseClient = '', slot = '', xemThu = process.env.QC_XEM_THU === '1' } = {}) {
  return function (tree) {
    // Ô giữa bài thủ công cần CẢ mã nhà xuất bản lẫn mã ô; chưa có mã ô thì để Quảng cáo tự động của AdSense lo (Issue #97)
    if (!(adsenseClient && slot) && !xemThu) return;
    const con = tree.children;
    let soH2 = 0, soQuangCao = 0, dangCho = false;
    for (let i = 0; i < con.length; i++) {
      const n = con[i];
      if (!laPhanTu(n) || n.tagName !== 'h2') continue;
      soH2++;
      if (/câu hỏi thường gặp|hỏi đáp|faq/i.test(chu(n))) break;           // không quảng cáo trong FAQ
      if (soH2 > 1 && (soH2 - 1) % moiSoH2 === 0) dangCho = true;
      if (!dangCho) continue;
      // phần tử liền trước (bỏ khoảng trắng) không được là ảnh/video/nav
      let j = i - 1;
      while (j >= 0 && con[j].type === 'text' && !con[j].value.trim()) j--;
      if (j >= 0 && chuaAnh(con[j])) continue;                       // vẫn chờ, thử ở <h2> sau
      dangCho = false;
      soQuangCao++;
      con.splice(i, 0, oQuangCao(soQuangCao, adsenseClient, slot));
      i++;
    }
  };
}

function oQuangCao(so, client, slot) {
  const ins = client && slot
    ? { type: 'element', tagName: 'ins', properties: {
        className: ['adsbygoogle'], style: 'display:block', dataAdClient: client,
        ...(slot ? { dataAdSlot: slot } : {}), dataAdFormat: 'auto', dataFullWidthResponsive: 'true' }, children: [] }
    : { type: 'element', tagName: 'div', properties: { className: ['quang-cao-xem-thu'] }, children: [{ type: 'text', value: `Vị trí quảng cáo giữa bài #${so} (chưa cấu hình AdSense)` }] };
  return {
    type: 'element', tagName: 'aside',
    properties: { className: ['quang-cao'], ariaLabel: 'Quảng cáo', dataViTri: `giua-bai-${so}`, dataPagefindIgnore: 'all' },
    children: [{ type: 'element', tagName: 'span', properties: { className: ['nhan-quang-cao'] }, children: [{ type: 'text', value: 'Quảng cáo' }] }, ins],
  };
}
