/* =====================================================================
   layout.js – menu, chân trang, nút sáng/tối và các mẫu giao diện dùng chung
   ===================================================================== */
(function () {
  'use strict';
  const { esc, img, imgAlt, url, num, formatDate } = DB;

  /* ------------------------------------------------------------ nhãn tiếng Việt */
  const NHAN = {
    loaiTacPham: { 'tu-tien': 'Tu Tiên', anime: 'Anime' },
    vaiTro: { chinh: 'Nhân vật chính', phu: 'Nhân vật phụ', 'lien-quan': 'Nhân vật liên quan', 'phan-dien': 'Phản diện' },
    quanHe: { 'dao-lu': 'Đạo lữ', vo: 'Vợ', chong: 'Chồng', 'su-phu': 'Sư phụ', 'do-de': 'Đồ đệ', 'gia-dinh': 'Gia đình', ban: 'Bằng hữu', 'ke-thu': 'Kẻ thù' },
    loaiTheLuc: { 'tong-mon': 'Tông môn', 'gia-toc': 'Gia tộc', 'hoang-trieu': 'Hoàng triều', 'ma-dao': 'Ma đạo', 'yeu-toc': 'Yêu tộc', 'thuong-hoi': 'Thương hội' },
    loaiVatPham: { 'phap-bao': 'Pháp bảo', 'vu-khi': 'Vũ khí / Thần binh', 'dan-duoc': 'Đan dược', 'cong-phap': 'Công pháp' },
    capDiaDiem: { gioi: 'Giới', vung: 'Vùng', thanh: 'Thành', 'bi-canh': 'Bí cảnh' },
  };
  // Đổi slug lạ thành chữ đẹp: "tong-mon-moi" → "Tong mon moi"
  const tuSlug = (s) => { s = String(s || '').replace(/-/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); };
  const nhan = (nhom, key) => (NHAN[nhom] && NHAN[nhom][key]) || tuSlug(key);

  /* ------------------------------------------------------------ đường dẫn */
  const R = DB.ROOT;
  const LINK = {
    home: () => R + 'index.html',
    list: (loai) => R + 'danh-sach.html' + (loai ? '?loai=' + encodeURIComponent(loai) : ''),
    genre: (g) => R + 'danh-sach.html?the_loai=' + encodeURIComponent(g),
    work: (id, hash) => R + 'review.html?id=' + encodeURIComponent(id) + (hash ? '#' + hash : ''),
    char: (id) => R + 'nhan-vat.html?id=' + encodeURIComponent(id),
    chars: (workId) => R + 'nhan-vat.html' + (workId ? '?tac_pham=' + encodeURIComponent(workId) : ''),
    // Giai đoạn 1: thế lực / cấp độ / vật phẩm / địa điểm dẫn về đúng mục trong trang review
    faction: (f) => f ? LINK.work(f.tac_pham_id, 'the-luc-' + f.id) : '#',
    level: (l) => l ? LINK.work(l.tac_pham_id, 'cap-do-' + l.id) : '#',
    item: (v) => v ? LINK.work(v.tac_pham_id, 'vat-pham-' + v.id) : '#',
    place: (p) => p ? LINK.work(p.tac_pham_id, 'dia-diem-' + p.id) : '#',
  };

  /* ------------------------------------------------------------ biểu tượng & ảnh */
  const icon = (name, cls = 'w-4 h-4') => `<i data-lucide="${name}" class="${cls}"></i>`;

  function anh(link, alt = '', cls = '', lazy = true) {
    const alt2 = imgAlt(link);
    return `<img src="${esc(img(link))}" alt="${esc(alt)}" class="${cls}" ${lazy ? 'loading="lazy"' : ''} decoding="async"` +
      `${alt2 ? ` data-alt="${esc(alt2)}"` : ''} onerror="UI.anhLoi(this)">`;
  }
  function anhLoi(el) {
    if (el.dataset.alt && !el.dataset.daThu) { el.dataset.daThu = '1'; el.src = el.dataset.alt; return; }
    el.onerror = null; el.src = DB.fallback();
  }

  // Dòng ghi nguồn ảnh (cột nguon_anh). Không có thì không hiện gì.
  const ghiNguon = (n) => { n = String(n || '').trim(); return n ? (/^(ảnh|minh họa|nguồn)/i.test(n) ? n : 'Ảnh: ' + n) : ''; };
  const nguon = (n, cls = 'text-center') => ghiNguon(n) ? `<p class="text-[11px] opacity-60 italic mt-1 ${cls}">${esc(ghiNguon(n))}</p>` : '';
  // Chú thích trong khung phóng to ảnh: "Chú thích — Ảnh: nguồn"
  const tieuDeAnh = (chu, n) => [chu, ghiNguon(n)].filter(Boolean).join(' — ');

  /* ------------------------------------------------------------ mẫu thẻ */
  const nhanLoai = (loai) => loai ? `<span class="nhan nhan-${esc(loai)}">${esc(nhan('loaiTacPham', loai))}</span>` : '';
  const diemTag = (d) => num(d) != null ? `<span class="the-diem">★ ${num(d).toFixed(1)}</span>` : '';

  function workCard(w) {
    return `<a href="${LINK.work(w.id)}" class="the-bai group" data-aos="fade-up">
      <figure class="the-anh">${anh(w.anh_bia, w.ten_viet)}${nhanLoai(w.loai)}${diemTag(w.diem)}</figure>
      <div class="p-3">
        <h3 class="the-ten text-[0.95rem]">${esc(w.ten_viet)}</h3>
        <p class="text-xs opacity-60 mt-1 flex items-center gap-1">${icon('calendar', 'w-3 h-3')} ${esc(formatDate(w.ngay_dang)) || '—'}</p>
      </div></a>`;
  }

  function charCard(c, ghiChu) {
    const vai = c.vai_tro === 'phan-dien' ? 'nhan-phan-dien' : 'nhan-nhan-vat';
    return `<a href="${LINK.char(c.id)}" class="the-bai group" data-aos="fade-up">
      <figure class="the-anh nv">${anh(c.anh, c.ten)}<span class="nhan ${vai}">${esc(nhan('vaiTro', c.vai_tro))}</span></figure>
      <div class="p-3">
        <h3 class="the-ten text-[0.95rem]">${esc(c.ten)}</h3>
        ${ghiChu ? `<p class="text-xs opacity-70 mt-1">${esc(ghiChu)}</p>` : (c.biet_danh ? `<p class="text-xs opacity-60 mt-1 line-clamp-1">${esc(c.biet_danh)}</p>` : '')}
      </div></a>`;
  }

  function avatar(c, cls = '') {
    return `<a href="${LINK.char(c.id)}" class="block text-center group ${cls}" title="${esc(c.ten)}">
      ${anh(c.anh, c.ten, 'anh-tron')}
      <span class="block mt-2 text-sm font-semibold group-hover:text-primary">${esc(c.ten)}</span></a>`;
  }
  // chip nhỏ có ảnh tròn (dùng cho danh sách thành viên, chủ sở hữu…)
  function chip(c) {
    if (!c) return '';
    return `<a href="${LINK.char(c.id)}" class="inline-flex items-center gap-2 pr-3 rounded-full bg-base-200 hover:bg-base-300 border border-[var(--vien-vang)]">
      ${anh(c.anh, c.ten, 'anh-tron nho')}<span class="text-sm">${esc(c.ten)}</span></a>`;
  }

  function breadcrumb(items) {
    return `<nav class="breadcrumbs text-sm" aria-label="breadcrumb"><ul>` +
      items.map((it) => `<li>${it.href ? `<a href="${it.href}">${esc(it.ten)}</a>` : `<span>${esc(it.ten)}</span>`}</li>`).join('') +
      `</ul></nav>`;
  }

  const luoi = (html, cls = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5') => `<div class="grid ${cls} gap-4">${html}</div>`;
  const khungCho = (n = 5) => luoi(Array.from({ length: n }, () =>
    `<div><div class="cho" style="aspect-ratio:2/3"></div><div class="cho h-4 mt-3 w-3/4"></div><div class="cho h-3 mt-2 w-1/2"></div></div>`).join(''));
  const trong = (msg) => `<div class="text-center opacity-60 py-10">${icon('feather', 'w-8 h-8 mx-auto mb-2')}${esc(msg)}</div>`;
  const loi = (e) => `<div class="khung py-16"><div class="alert alert-error"><span>${icon('triangle-alert')}</span>
    <div><b>Không tải được dữ liệu.</b><br><span class="text-sm">${esc(e && e.message || e)}</span><br>
    <span class="text-sm">Hãy kiểm tra link CSV trong config.js, hoặc thử tải lại trang với <code>?lammoi=1</code>.</span></div></div></div>`;

  /* ------------------------------------------------------------ meta / SEO cơ bản */
  function setMeta({ title, description, image }) {
    const ten = DB.getSettings().ten_web;
    document.title = title ? `${title} – ${ten}` : ten;
    const set = (sel, attr, key, val) => {
      if (!val) return;
      let m = document.head.querySelector(sel);
      if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.appendChild(m); }
      m.setAttribute('content', val);
    };
    set('meta[name="description"]', 'name', 'description', description);
    set('meta[property="og:title"]', 'property', 'og:title', document.title);
    set('meta[property="og:description"]', 'property', 'og:description', description);
    set('meta[property="og:image"]', 'property', 'og:image', image ? img(image) : '');
  }

  /* ------------------------------------------------------------ thư viện ngoài */
  let lightbox = null;
  function refresh() {
    if (window.lucide) lucide.createIcons();
    if (window.GLightbox) { if (lightbox) lightbox.destroy(); lightbox = GLightbox({ selector: '.glightbox', touchNavigation: true, loop: true }); }
    if (window.AOS) {
      if (!refresh.aos) {
        AOS.init({ once: true, duration: 600, offset: 40 }); refresh.aos = true;
        // Bố cục còn thay đổi khi Tailwind xếp lớp và ảnh tải xong → tính lại vị trí vài lần
        window.addEventListener('load', () => AOS.refresh());
        new ResizeObserver(() => { clearTimeout(refresh.t); refresh.t = setTimeout(() => AOS.refresh(), 150); }).observe(document.body);
      } else AOS.refreshHard();
    }
  }

  /* ------------------------------------------------------------ giao diện sáng / tối */
  const KHOA_GD = 'tkc-giao-dien';
  function doiGiaoDien() {
    const html = document.documentElement;
    const moi = html.dataset.theme === 'ngoc-sang' ? 'tien-hiep' : 'ngoc-sang';
    html.dataset.theme = moi;
    try { localStorage.setItem(KHOA_GD, moi); } catch (e) { /* */ }
  }

  /* ------------------------------------------------------------ menu & chân trang */
  const MENU = [
    { ten: 'Trang chủ', href: 'index.html', icon: 'house' },
    { ten: 'Review Truyện Tu Tiên', href: 'danh-sach.html?loai=tu-tien', icon: 'scroll-text' },
    { ten: 'Review Anime', href: 'danh-sach.html?loai=anime', icon: 'clapperboard' },
    { ten: 'Nhân Vật', href: 'nhan-vat.html', icon: 'users' },
    { ten: 'Thế Lực', href: 'the-luc.html', icon: 'castle' },
    { ten: 'Hệ Thống Tu Luyện', href: 'tu-luyen.html', icon: 'mountain' },
    { ten: 'Đề Cử', href: 'de-cu.html', icon: 'award' },
    { ten: 'Thuật Ngữ', href: 'thuat-ngu.html', icon: 'book-a' },
    { ten: 'Tìm kiếm', href: 'tim-kiem.html', icon: 'search' },
  ];
  function dangMo(href) {
    const [file, qs] = href.split('?');
    const here = location.pathname.split('/').pop() || 'index.html';
    if (here !== file) return false;
    if (!qs) return !location.search.includes('loai=') || file !== 'danh-sach.html';
    return location.search.includes(qs);
  }

  function veDauTrang() {
    const el = document.getElementById('dau-trang');
    if (!el) return;
    const ten = DB.getSettings().ten_web;
    const links = MENU.map((m) => `<a href="${R + m.href}" class="${dangMo(m.href) ? 'dang-mo' : ''} flex items-center gap-1.5">${icon(m.icon)}${esc(m.ten)}</a>`).join('');
    el.innerHTML = `<header class="dau-trang" x-data="{mo:false}">
      <div class="khung flex items-center gap-3 h-16">
        <button class="btn btn-ghost btn-sm btn-square lg:hidden" @click="mo=!mo" aria-label="Mở menu">${icon('menu', 'w-5 h-5')}</button>
        <a href="${LINK.home()}" class="flex items-center gap-2 shrink-0">
          <span class="w-9 h-9 rounded-full grid place-items-center bg-primary text-primary-content font-bold font-tieu-de">藏</span>
          <span class="logo-chu text-xl">${esc(ten)}</span>
        </a>
        <form action="${R}tim-kiem.html" class="ml-auto hidden sm:block">
          <label class="input input-sm w-56 lg:w-72 bg-base-200">${icon('search', 'w-4 h-4 opacity-60')}
            <input type="search" name="q" placeholder="Tìm truyện, nhân vật…" aria-label="Tìm kiếm"></label>
        </form>
        <button class="btn btn-ghost btn-sm btn-square ml-auto sm:ml-0" onclick="UI.doiGiaoDien()" aria-label="Đổi giao diện sáng/tối" title="Sáng / Tối">
          ${icon('sun-moon', 'w-5 h-5')}</button>
      </div>
      <nav class="menu-ngang khung hidden lg:flex items-center gap-1 pb-2 overflow-x-auto">${links}</nav>
      <nav class="menu-ngang lg:hidden border-t border-[var(--vien-vang)]" x-show="mo" x-transition x-cloak @click.outside="mo=false">
        <div class="khung py-2 flex flex-col">${links}
          <form action="${R}tim-kiem.html" class="mt-2 sm:hidden"><label class="input input-sm w-full bg-base-200">${icon('search', 'w-4 h-4 opacity-60')}
            <input type="search" name="q" placeholder="Tìm truyện, nhân vật…"></label></form>
        </div>
      </nav>
    </header>`;
  }

  function veChanTrang() {
    const el = document.getElementById('chan-trang');
    if (!el) return;
    const s = DB.getSettings();
    el.innerHTML = `<footer class="chan-trang mt-16">
      <div class="khung py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div><div class="logo-chu text-xl mb-2">${esc(s.ten_web)}</div><p class="opacity-70 leading-relaxed">${esc(s.mo_ta_web)}</p></div>
        <div><div class="font-semibold mb-2">Chuyên mục</div>
          <ul class="space-y-1 opacity-80">${MENU.slice(1, 6).map((m) => `<li><a class="hover:text-primary" href="${R + m.href}">${esc(m.ten)}</a></li>`).join('')}</ul></div>
        <div><div class="font-semibold mb-2">Theo dõi</div>
          <div class="flex gap-2">
            ${s.link_fanpage ? `<a class="btn btn-sm btn-outline" href="${esc(s.link_fanpage)}" target="_blank" rel="noopener">${icon('facebook')} Fanpage</a>` : ''}
            ${s.link_youtube ? `<a class="btn btn-sm btn-outline" href="${esc(s.link_youtube)}" target="_blank" rel="noopener">${icon('youtube')} YouTube</a>` : ''}
          </div>
          <p class="opacity-50 mt-4 text-xs">Nguồn dữ liệu: ${esc(DB.source || '…')}</p></div>
      </div>
      <div class="text-center text-xs opacity-50 pb-6">© ${new Date().getFullYear()} ${esc(s.ten_web)}. Nội dung review do ${esc(s.ten_web)} biên soạn.</div>
    </footer>`;
  }

  // Vẽ menu ngay (dùng tên mặc định), sau khi có dữ liệu thì vẽ lại theo tab CaiDat
  veDauTrang(); veChanTrang();
  function khoiDong(veTrang) {
    return DB.load().then(() => { veDauTrang(); veChanTrang(); veTrang(); refresh(); cuonToiNeo(); })
      .catch((e) => { console.error(e); const m = document.getElementById('noi-dung'); if (m) m.innerHTML = loi(e); refresh(); });
  }
  // Sau khi vẽ xong, cuộn tới #neo trên URL (vì nội dung được vẽ sau khi trang đã mở)
  function cuonToiNeo() {
    if (!location.hash) return;
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  }

  window.UI = { NHAN, nhan, LINK, icon, anh, anhLoi, nguon, tieuDeAnh, nhanLoai, workCard, charCard, avatar, chip, breadcrumb, luoi, khungCho, trong, loi, setMeta, refresh, doiGiaoDien, khoiDong };
})();
