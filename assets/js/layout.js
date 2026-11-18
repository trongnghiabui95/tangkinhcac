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
    faction: (f) => f ? R + 'the-luc.html?id=' + encodeURIComponent(f.id) : '#',
    factions: (workId) => R + 'the-luc.html' + (workId ? '?tac_pham=' + encodeURIComponent(workId) : ''),
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

  // Logo thương hiệu chủ quản yendan (bé Yên Đan – Cherry). Chữ theo currentColor để đổi màu sáng/tối.
  const YENDAN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 213 80" role="img" aria-labelledby="yendan-t" class="logo-yendan"><title id="yendan-t">yendan</title><path d="M14.9 74.6Q13.2 74.6 12.1 73.7Q11.1 72.8 10.8 71.3Q10.6 69.9 11.3 68.3L15 60.1V64.2L5.5 42.3Q4.7 40.6 5 39.1Q5.2 37.7 6.5 36.8Q7.7 35.9 9.8 35.9Q11.6 35.9 12.7 36.8Q13.8 37.6 14.7 39.9L20.3 54.5H18.4L24.3 39.9Q25.2 37.6 26.4 36.8Q27.5 35.9 29.5 35.9Q31.2 35.9 32.2 36.8Q33.2 37.7 33.4 39.1Q33.6 40.6 32.9 42.3L20.2 70.8Q19.2 73.1 18 73.8Q16.8 74.6 14.9 74.6ZM52.2 64.6Q47.2 64.6 43.5 62.9Q39.8 61.1 37.9 57.8Q35.9 54.6 35.9 50.2Q35.9 45.9 37.8 42.7Q39.7 39.5 42.9 37.7Q46.2 35.8 50.4 35.8Q53.5 35.8 56 36.8Q58.5 37.8 60.3 39.7Q62.1 41.5 63.1 44.2Q64 46.8 64 50.1Q64 51.2 63.4 51.7Q62.7 52.2 61.4 52.2H44.3V47.5H56.7L55.8 48.3Q55.8 46.2 55.2 44.9Q54.7 43.6 53.6 42.9Q52.5 42.3 50.9 42.3Q49.1 42.3 47.9 43.1Q46.6 43.9 45.9 45.5Q45.3 47 45.3 49.4V49.9Q45.3 53.9 47 55.6Q48.8 57.3 52.5 57.3Q53.7 57.3 55.3 57Q56.9 56.7 58.4 56.1Q59.8 55.5 60.9 55.9Q62 56.3 62.5 57.1Q63.1 58 63.2 59.1Q63.2 60.2 62.7 61.2Q62.1 62.3 60.8 62.8Q58.9 63.7 56.7 64.2Q54.5 64.6 52.2 64.6ZM73.2 64.5Q70.9 64.5 69.6 63.2Q68.3 61.9 68.3 59.5V40.9Q68.3 38.5 69.5 37.2Q70.8 35.9 73.2 35.9Q75.5 35.9 76.7 37.2Q78 38.5 78 40.9V43.6L77.4 41.3Q78.7 38.6 81.2 37.2Q83.7 35.8 86.9 35.8Q90.2 35.8 92.3 37.1Q94.4 38.4 95.5 41Q96.6 43.7 96.6 47.7V59.5Q96.6 61.9 95.3 63.2Q94 64.5 91.6 64.5Q89.2 64.5 87.9 63.2Q86.6 61.9 86.6 59.5V48.1Q86.6 45.6 85.7 44.5Q84.9 43.4 83.2 43.4Q80.9 43.4 79.6 44.9Q78.3 46.3 78.3 48.7V59.5Q78.3 64.5 73.2 64.5Z" fill="currentColor"/><path d="M134.3 64V20C134.3 12 139.3 8 145.3 6" stroke="#5B3A1E" stroke-width="7.5" fill="none" stroke-linecap="round"/><path transform="translate(144.3 7) rotate(-25) scale(0.6)" d="M0 0C6 -12 22 -16 34 -10C26 2 12 6 0 0Z" fill="#16A34A"/><path transform="translate(144.3 7) rotate(-25) scale(0.6)" d="M2 -1C12 -6 22 -9 30 -9" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M118.3 34.7C124.3 30.7 135.3 33.5 135.3 48.9C135.3 60.8 126.8 65 118.3 65C109.8 65 101.3 60.8 101.3 48.9C101.3 33.5 112.4 30.7 118.3 34.7Z" fill="#D21F3C"/><ellipse cx="111.2" cy="43.8" rx="3.1" ry="5.1" transform="rotate(25 111.2 43.8)" fill="#fff" fill-opacity=".55"/><path d="M155.8 64.6Q152.6 64.6 150.2 63.4Q147.7 62.3 146.4 60.2Q145 58.2 145 55.5Q145 52.5 146.6 50.8Q148.1 49 151.6 48.3Q155.1 47.5 160.8 47.5H163.9V52.2H160.8Q158.7 52.2 157.2 52.5Q155.8 52.9 155.1 53.5Q154.5 54.1 154.5 55.2Q154.5 56.4 155.4 57.3Q156.3 58.1 158 58.1Q159.4 58.1 160.5 57.5Q161.6 56.9 162.3 55.8Q163 54.7 163 53.2V46.8Q163 44.7 161.9 43.9Q160.9 43.1 158.4 43.1Q157 43.1 155.4 43.4Q153.7 43.7 151.6 44.5Q150.1 45 149 44.6Q148 44.2 147.4 43.3Q146.8 42.3 146.8 41.2Q146.8 40.1 147.5 39.1Q148.2 38.1 149.7 37.5Q152.4 36.5 154.7 36.2Q156.9 35.8 158.8 35.8Q163.4 35.8 166.4 37.1Q169.4 38.5 170.9 41.2Q172.4 43.9 172.4 48.2V59.5Q172.4 61.9 171.2 63.2Q170 64.5 167.8 64.5Q165.5 64.5 164.3 63.2Q163.1 61.9 163.1 59.5V58L163.4 58.8Q163.1 60.6 162.1 61.9Q161.1 63.2 159.5 63.9Q157.9 64.6 155.8 64.6ZM183 64.5Q180.6 64.5 179.3 63.2Q178 61.9 178 59.5V40.9Q178 38.5 179.3 37.2Q180.6 35.9 182.9 35.9Q185.3 35.9 186.5 37.2Q187.7 38.5 187.7 40.9V43.6L187.1 41.3Q188.4 38.6 190.9 37.2Q193.4 35.8 196.6 35.8Q199.9 35.8 202.1 37.1Q204.2 38.4 205.2 41Q206.3 43.7 206.3 47.7V59.5Q206.3 61.9 205 63.2Q203.7 64.5 201.3 64.5Q198.9 64.5 197.6 63.2Q196.3 61.9 196.3 59.5V48.1Q196.3 45.6 195.5 44.5Q194.6 43.4 192.9 43.4Q190.7 43.4 189.3 44.9Q188 46.3 188 48.7V59.5Q188 64.5 183 64.5Z" fill="currentColor"/></svg>';

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
          <img src="${R}assets/img/logo.svg" alt="" width="36" height="36" class="w-9 h-9">
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
      <div class="khung pb-6 flex flex-col items-center gap-2 text-center">
        <div class="flex items-center gap-2 text-sm"><span class="opacity-70">Một sản phẩm của</span><span class="thuong-hieu">${YENDAN}</span></div>
        <div class="text-xs opacity-60">© ${new Date().getFullYear()} ${esc(s.ten_web)}. Nội dung review do ${esc(s.ten_web)} biên soạn.</div>
      </div>
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
