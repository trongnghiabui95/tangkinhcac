/* Trang chủ: banner, review mới, nhân vật nổi bật, đề cử theo thể loại, danh mục A–Z */
(function () {
  const { esc, img, boDau, num } = DB;
  const { icon, workCard, avatar, luoi, trong, LINK, nhanLoai } = UI;
  const THE_LOAI_DE_CU = ['Tu Tiên', 'Huyền Huyễn', 'Kiếm Hiệp', 'Isekai', 'Hành Động'];

  const tieuDe = (ten, ic, href) => `<div class="tieu-de-khoi"><h2>${icon(ic, 'w-6 h-6 text-primary')}${esc(ten)}</h2>
    ${href ? `<a href="${href}" class="btn btn-sm btn-outline btn-primary">Xem thêm ${icon('chevron-right')}</a>` : ''}</div>`;

  function banner(ds) {
    if (!ds.length) return '';
    const slides = ds.map((w) => `<div class="swiper-slide"><div class="banner-slide">
      <div class="banner-nen" style="background-image:url('${esc(img(w.anh_bia))}')"></div>
      <div class="banner-noi-dung">
        ${UI.anh(w.anh_bia, w.ten_viet, '', false)}
        <div class="min-w-0">
          <div class="flex flex-wrap gap-2 mb-2">${nhanLoai(w.loai)}${DB.getGenres(w).filter((g) => g !== UI.nhan('loaiTacPham', w.loai)).slice(0, 3).map((g) => `<span class="nhan nhan-vien text-white border-white/40">${esc(g)}</span>`).join('')}</div>
          <h2 class="text-2xl md:text-4xl font-bold leading-tight">${esc(w.ten_viet)}</h2>
          ${w.ten_trung ? `<div class="opacity-80 mt-1">${esc(w.ten_trung)}</div>` : ''}
          <p class="mt-3 opacity-90 line-clamp-3 max-w-2xl text-sm md:text-base">${esc(DB.lines(w.tom_tat).filter((l) => l !== '[spoiler]')[0] || '')}</p>
          <div class="mt-4 flex items-center gap-3">
            <a href="${LINK.work(w.id)}" class="btn btn-primary btn-sm md:btn-md">${icon('book-open')} Đọc review</a>
            ${num(w.diem) != null ? `<span class="text-xl font-bold text-[#f5d27a]">★ ${num(w.diem).toFixed(1)}</span>` : ''}
          </div>
        </div>
      </div></div></div>`).join('');
    return `<section class="khung mt-6" data-aos="fade-in"><div class="swiper banner" id="banner">
      <div class="swiper-wrapper">${slides}</div><div class="swiper-pagination"></div>
      <div class="swiper-button-prev hidden md:flex"></div><div class="swiper-button-next hidden md:flex"></div></div></section>`;
  }

  function nhanVatNoiBat(ds) {
    if (!ds.length) return '';
    return `<section class="khung mt-12">${tieuDe('Nhân vật nổi bật', 'sparkles', LINK.chars())}
      <div class="swiper" id="dai-nhan-vat"><div class="swiper-wrapper">
        ${ds.map((c) => `<div class="swiper-slide py-2">${avatar(c)}</div>`).join('')}
      </div></div></section>`;
  }

  function deCuTheoTheLoai() {
    const nhom = THE_LOAI_DE_CU.map((g) => ({ g, ds: DB.getWorksByGenre(g).slice(0, 5) }));
    return `<section class="khung mt-12" x-data="{tab: 0}">${tieuDe('Đề cử theo thể loại', 'award')}
      <div role="tablist" class="tabs tabs-box mb-4 overflow-x-auto flex-nowrap">
        ${nhom.map((n, i) => `<button role="tab" class="tab whitespace-nowrap" :class="tab===${i} && 'tab-active'" @click="tab=${i}">${esc(n.g)} <span class="opacity-60 ml-1">(${n.ds.length})</span></button>`).join('')}
      </div>
      ${nhom.map((n, i) => `<div x-show="tab===${i}" ${i ? 'x-cloak' : ''}>
        ${n.ds.length ? luoi(n.ds.map(workCard).join('')) : trong('Chưa có tác phẩm thể loại ' + n.g)}
        <div class="text-right mt-3"><a class="link link-primary text-sm" href="${LINK.genre(n.g)}">Xem tất cả ${esc(n.g)} →</a></div>
      </div>`).join('')}
    </section>`;
  }

  function danhMucAZ(ds) {
    if (!ds.length) return '';
    const nhom = {};
    ds.forEach((w) => {
      const chu = boDau(w.ten_viet).charAt(0).toUpperCase();
      const k = /[A-Z]/.test(chu) ? chu : '#';
      (nhom[k] = nhom[k] || []).push(w);
    });
    const keys = Object.keys(nhom).sort();
    return `<section class="khung mt-12">${tieuDe('Danh mục tác phẩm A–Z', 'list')}
      <div class="flex flex-wrap gap-1 mb-4">${keys.map((k) => `<a href="#az-${k}" class="btn btn-xs btn-ghost border border-[var(--vien-vang)]">${k}</a>`).join('')}</div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${keys.map((k) => `<div class="muc !mt-0" id="az-${k}"><div class="text-2xl font-bold text-primary font-tieu-de mb-2">${k}</div>
          <ul class="space-y-1">${nhom[k].sort((a, b) => a.ten_viet.localeCompare(b.ten_viet, 'vi')).map((w) =>
            `<li class="flex justify-between gap-2"><a class="hover:text-primary" href="${LINK.work(w.id)}">${esc(w.ten_viet)}</a>
             <span class="badge badge-sm badge-ghost" title="Số bài viết">${DB.countArticles(w.id)} bài</span></li>`).join('')}</ul></div>`).join('')}
      </div></section>`;
  }

  function ve() {
    const s = DB.getSettings();
    UI.setMeta({ title: '', description: s.mo_ta_web });
    const tatCa = DB.getWorks();
    const noiBat = DB.getFeaturedWorks();
    document.getElementById('noi-dung').innerHTML =
      banner(noiBat.length ? noiBat : tatCa.slice(0, 5)) +
      `<section class="khung mt-12">${tieuDe('Review mới', 'scroll-text', LINK.list())}
        ${tatCa.length ? luoi(tatCa.slice(0, 10).map(workCard).join('')) : trong('Chưa có tác phẩm nào. Hãy thêm dòng vào tab TacPham.')}</section>` +
      nhanVatNoiBat(DB.getFeaturedCharacters()) +
      deCuTheoTheLoai() +
      danhMucAZ(tatCa);

    if (window.Swiper) {
      if (document.getElementById('banner')) new Swiper('#banner', {
        loop: noiBat.length > 1, autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: '#banner .swiper-pagination', clickable: true },
        navigation: { nextEl: '#banner .swiper-button-next', prevEl: '#banner .swiper-button-prev' },
      });
      if (document.getElementById('dai-nhan-vat')) new Swiper('#dai-nhan-vat', {
        slidesPerView: 3.2, spaceBetween: 12, freeMode: true,
        breakpoints: { 640: { slidesPerView: 5 }, 1024: { slidesPerView: 8 } },
      });
    }
  }

  // khung chờ trong lúc tải
  document.getElementById('noi-dung').innerHTML =
    `<div class="khung mt-6"><div class="cho" style="height:360px"></div></div><div class="khung mt-12">${UI.khungCho(5)}</div>`;
  UI.khoiDong(ve);
})();
