/* Trang Review tác phẩm: review.html?id=... */
(function () {
  const { esc, img, num, lines, paragraphs, ids, formatDate, youtubeIds } = DB;
  const { icon, anh, nguon, tieuDeAnh, chip, charCard, workCard, luoi, breadcrumb, nhan, nhanLoai, LINK } = UI;
  const id = new URLSearchParams(location.search).get('id');

  /* ---------------------------------------------------------------- các mục */
  // Mỗi hàm trả về '' nếu không có dữ liệu → mục đó và dòng mục lục tự ẩn.

  function tomTat(w) {
    const ds = lines(w.tom_tat);
    if (!ds.length) return '';
    let i = ds.findIndex((l) => /^\[spoiler\]$/i.test(l));
    if (i < 0) i = 1; // không đánh dấu: đoạn đầu hiện, phần còn lại là spoiler
    const truoc = ds.slice(0, i).filter((l) => !/^\[spoiler\]$/i.test(l));
    const sau = ds.slice(i).filter((l) => !/^\[spoiler\]$/i.test(l));
    const p = (arr) => arr.map((l) => `<p>${esc(l)}</p>`).join('');
    return `<div class="noi-dung">${p(truoc)}</div>` + (sau.length ? `
      <div x-data="{mo:false}" class="mt-3">
        <div class="noi-dung" :class="!mo && 'spoiler-an'">${p(sau)}</div>
        <button class="btn btn-sm btn-warning btn-outline mt-3" @click="mo=!mo">
          ${icon('eye')} <span x-text="mo ? 'Ẩn spoiler' : 'Hiện phần có spoiler'">Hiện phần có spoiler</span></button>
      </div>` : '');
  }

  function thuVienAnh(w) {
    const ds = DB.getImages(w.id);
    if (!ds.length) return '';
    return `<div class="luoi-anh grid grid-cols-2 md:grid-cols-3 gap-3">${ds.map((a) =>
      `<a href="${esc(img(a.link_anh))}" class="glightbox" data-gallery="truyen" data-title="${esc(tieuDeAnh(a.chu_thich, a.nguon_anh))}">${anh(a.link_anh, a.chu_thich)}</a>`).join('')}</div>`;
  }

  function nhanVatChinh(w) {
    const ds = DB.getCharactersByWork(w.id, 'chinh');
    if (!ds.length) return '';
    return ds.map((c) => {
      const doi = DB.getLife(c.id);
      return `<article class="grid sm:grid-cols-[180px_1fr] gap-5 py-4 first:pt-0 border-b border-dashed border-[var(--vien-vang)] last:border-0" data-aos="fade-up">
        <a href="${LINK.char(c.id)}" class="block the-bai"><figure class="the-anh nv">${anh(c.anh, c.ten)}</figure></a>
        <div>
          <h3 class="text-xl font-bold"><a href="${LINK.char(c.id)}" class="hover:text-primary">${esc(c.ten)}</a></h3>
          ${c.biet_danh ? `<div class="text-sm opacity-70 mb-2">Biệt danh: ${esc(c.biet_danh)}</div>` : ''}
          <div class="noi-dung">${paragraphs(c.mo_ta_ngan)}</div>
          ${doi.length ? `<div class="mt-3 text-sm"><b class="text-primary">Tóm tắt cuộc đời:</b>
            <ol class="list-decimal ml-5 mt-1 space-y-0.5">${doi.map((d) => `<li><b>${esc(d.giai_doan)}</b>${d.cap_do_id && DB.getLevel(d.cap_do_id) ? ` <span class="opacity-60">(${esc(DB.getLevel(d.cap_do_id).ten)})</span>` : ''}</li>`).join('')}</ol></div>` : ''}
          <a href="${LINK.char(c.id)}" class="btn btn-primary btn-sm mt-4">Xem chi tiết ${icon('arrow-right')}</a>
        </div></article>`;
    }).join('');
  }

  const luoiNhanVat = (ds) => ds.length ? luoi(ds.map((c) => charCard(c)).join(''), 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4') : '';

  function theLuc(w) {
    const ds = DB.getFactionsByWork(w.id);
    if (!ds.length) return '';
    return `<div class="grid md:grid-cols-2 gap-4">${ds.map((f) => {
      const tl = DB.getCharacter(f.thu_linh_id), ts = DB.getPlace(f.tru_so_id), tv = DB.getMembers(f.id);
      return `<div id="the-luc-${esc(f.id)}" class="bac-the !p-4" data-aos="fade-up">
        <div class="flex gap-4 items-center">
          ${anh(f.logo, f.ten, 'w-16 h-16 rounded-full object-cover border-2 border-primary shrink-0')}
          <div><h3 class="text-lg font-bold">${esc(f.ten)}</h3><span class="nhan nhan-the-luc">${esc(nhan('loaiTheLuc', f.loai))}</span>${nguon(f.nguon_anh, 'text-left')}</div>
        </div>
        <div class="noi-dung text-sm mt-3">${paragraphs(f.mo_ta)}</div>
        <dl class="text-sm mt-3 space-y-2">
          ${tl ? `<div class="flex gap-2 items-center flex-wrap"><dt class="font-semibold text-primary">Thủ lĩnh:</dt><dd>${chip(tl)}</dd></div>` : ''}
          ${ts ? `<div><dt class="inline font-semibold text-primary">Trụ sở:</dt> <dd class="inline"><a class="lien-ket" href="#dia-diem-${esc(ts.id)}">${esc(ts.ten)}</a></dd></div>` : ''}
          ${tv.length ? `<div><dt class="font-semibold text-primary mb-1">Thành viên:</dt><dd class="flex flex-wrap gap-2">${tv.map(chip).join('')}</dd></div>` : ''}
        </dl></div>`;
    }).join('')}</div>`;
  }

  function loaiTuLuyen(w) {
    const ds = DB.getCultivationTypes(w.id);
    if (!ds.length) return '';
    return `<div class="grid sm:grid-cols-2 gap-4">${ds.map((t) => `<div id="loai-${esc(t.id)}" class="bac-the" data-aos="fade-up">
      <h3 class="font-bold text-lg flex items-center gap-2">${icon('flame', 'w-5 h-5 text-secondary')}${esc(t.ten)}</h3>
      <div class="noi-dung text-sm mt-2">${paragraphs(t.mo_ta)}</div></div>`).join('')}</div>`;
  }

  function capDo(w) {
    const ds = DB.getLevels(w.id);
    if (!ds.length) return '';
    return `<p class="text-sm opacity-70 mb-4">Từ thấp đến cao:
      ${ds.map((l) => `<a class="lien-ket" href="#cap-do-${esc(l.id)}">${esc(l.ten)}</a>`).join(' → ')}</p>
      <div class="bac-thang">${ds.map((l, i) => {
        const nv = DB.getCharactersByLevel(l.id);
        return `<div class="bac" id="cap-do-${esc(l.id)}" data-aos="fade-up">
          <div class="bac-so">${i + 1}</div>
          <div class="bac-the"><h3 class="font-bold text-lg">${esc(l.ten)}</h3>
            <div class="noi-dung text-sm mt-1">${paragraphs(l.mo_ta)}</div>
            ${nv.length ? `<div class="mt-3 flex flex-wrap gap-2 items-center"><span class="text-xs opacity-60">Nhân vật tiêu biểu:</span>${nv.map(chip).join('')}</div>` : ''}
          </div></div>`;
      }).join('')}</div>`;
  }

  function vatPham(w) {
    const ds = DB.getItems(w.id);
    if (!ds.length) return '';
    const nhom = {};
    ds.forEach((v) => (nhom[v.loai] = nhom[v.loai] || []).push(v));
    return Object.keys(nhom).map((k) => `<h3 class="font-bold mt-2 mb-3 flex items-center gap-2">${icon('gem', 'w-4 h-4 text-primary')}${esc(nhan('loaiVatPham', k))}</h3>
      <div class="grid gap-3 mb-4">${nhom[k].map((v) => {
        const chu = DB.getCharacter(v.chu_so_huu_id);
        return `<div id="vat-pham-${esc(v.id)}" class="bac-the flex gap-4" data-aos="fade-up">
          <a href="${esc(img(v.anh))}" class="glightbox shrink-0" data-gallery="vat-pham" data-title="${esc(tieuDeAnh(v.ten, v.nguon_anh))}">${anh(v.anh, v.ten, 'w-24 h-24 rounded-lg object-cover')}</a>
          <div class="min-w-0"><h4 class="font-bold">${esc(v.ten)}</h4>
            <div class="flex flex-wrap gap-1 my-1"><span class="nhan nhan-vat-pham">${esc(nhan('loaiVatPham', v.loai))}</span>${v.pham_cap ? `<span class="nhan nhan-vien">${esc(v.pham_cap)}</span>` : ''}</div>
            <div class="noi-dung text-sm">${paragraphs(v.mo_ta)}</div>${nguon(v.nguon_anh, 'text-left')}
            ${chu ? `<div class="mt-2 text-sm flex items-center gap-2 flex-wrap"><span class="opacity-60">Chủ sở hữu:</span>${chip(chu)}</div>` : ''}
          </div></div>`;
      }).join('')}</div>`).join('');
  }

  function banDo(w) {
    const cay = DB.getPlaceTree(w.id);
    if (!cay.length) return '';
    const anhBanDo = DB.getPlaces(w.id).filter((p) => p.anh_ban_do);
    const veNhanh = (ds) => `<ul>${ds.map((p) => `<li id="dia-diem-${esc(p.id)}">
      <div class="flex items-center gap-2 flex-wrap"><span class="font-bold">${esc(p.ten)}</span><span class="nhan nhan-vien">${esc(nhan('capDiaDiem', p.cap))}</span></div>
      ${p.mo_ta ? `<div class="text-sm opacity-80 mt-1">${esc(p.mo_ta)}</div>` : ''}
      ${p.con.length ? veNhanh(p.con) : ''}</li>`).join('')}</ul>`;
    return (anhBanDo.length ? `<div class="luoi-anh grid gap-3 mb-5 ${anhBanDo.length > 1 ? 'sm:grid-cols-2' : ''}">${anhBanDo.map((p) =>
      `<a href="${esc(img(p.anh_ban_do))}" class="glightbox" data-gallery="ban-do" data-title="${esc(tieuDeAnh('Bản đồ ' + p.ten, p.nguon_anh))}">${anh(p.anh_ban_do, 'Bản đồ ' + p.ten)}</a>${nguon(p.nguon_anh)}`).join('')}</div>` : '') +
      `<div class="cay [&>ul]:ml-0 [&>ul]:pl-0 [&>ul]:border-0">${veNhanh(cay)}</div>`;
  }

  function hanhTrinh(w) {
    const ds = DB.getJourney(w.id);
    if (!ds.length) return '';
    return `<div class="dong-thoi-gian">${ds.map((h) => {
      const p = DB.getPlace(h.dia_diem_id), l = DB.getLevel(h.cap_do_id);
      return `<div class="moc" data-aos="fade-up">
        <div class="flex flex-wrap gap-2 items-center text-sm">
          ${p ? `<a href="#dia-diem-${esc(p.id)}" class="nhan nhan-vien">${icon('map-pin', 'w-3 h-3')}${esc(p.ten)}</a>` : ''}
          ${l ? `<a href="#cap-do-${esc(l.id)}" class="nhan nhan-tu-luyen">${icon('mountain', 'w-3 h-3')}${esc(l.ten)}</a>` : ''}
        </div>
        <div class="mt-1">${esc(h.su_kien)}</div></div>`;
    }).join('')}</div>`;
  }

  function danhGia(w) {
    const tieuChi = [['Cốt truyện', w.diem_cot_truyen], ['Nhân vật', w.diem_nhan_vat], ['Thế giới', w.diem_the_gioi], ['Hình ảnh', w.diem_hinh_anh]]
      .filter(([, d]) => num(d) != null);
    const uu = lines(w.uu_diem), nhuoc = lines(w.nhuoc_diem);
    if (!tieuChi.length && !uu.length && !nhuoc.length && !w.ket_luan && num(w.diem) == null) return '';
    const d = num(w.diem);
    return `<div class="grid md:grid-cols-[160px_1fr] gap-6 items-center">
        ${d != null ? `<div class="text-center"><div class="radial-progress text-primary font-bold text-2xl" style="--value:${d * 10};--size:8rem;--thickness:10px" role="progressbar">${d.toFixed(1)}</div>
          <div class="text-sm opacity-70 mt-2">Điểm của trang / 10</div></div>` : '<div></div>'}
        <div class="space-y-3">${tieuChi.map(([t, v]) => `<div><div class="flex justify-between text-sm"><span>${t}</span><b>${num(v).toFixed(1)}</b></div>
          <progress class="progress progress-primary w-full" value="${num(v) * 10}" max="100"></progress></div>`).join('')}</div>
      </div>
      ${uu.length || nhuoc.length ? `<div class="grid md:grid-cols-2 gap-4 mt-6">
        <div class="bac-the border-success/40"><h3 class="font-bold text-success flex items-center gap-2 mb-2">${icon('thumbs-up')} Ưu điểm</h3>
          <ul class="space-y-1.5 text-sm">${uu.map((x) => `<li class="flex gap-2">${icon('check', 'w-4 h-4 text-success shrink-0 mt-0.5')}<span>${esc(x)}</span></li>`).join('')}</ul></div>
        <div class="bac-the border-error/40"><h3 class="font-bold text-error flex items-center gap-2 mb-2">${icon('thumbs-down')} Nhược điểm</h3>
          <ul class="space-y-1.5 text-sm">${nhuoc.map((x) => `<li class="flex gap-2">${icon('x', 'w-4 h-4 text-error shrink-0 mt-0.5')}<span>${esc(x)}</span></li>`).join('')}</ul></div>
      </div>` : ''}
      ${w.ket_luan ? `<div class="mt-6 cau-noi not-italic"><b class="text-primary">Kết luận: </b>${esc(w.ket_luan).replace(/\n/g, '<br>')}</div>` : ''}`;
  }

  function ost(w) {
    const ds = youtubeIds(w.ost_youtube);
    if (!ds.length) return '';
    return `<div class="grid md:grid-cols-2 gap-4">${ds.map((v) => `<div class="aspect-video rounded-lg overflow-hidden border border-[var(--vien-vang)]">
      <iframe class="w-full h-full" src="https://www.youtube-nocookie.com/embed/${v}" title="OST" loading="lazy" allowfullscreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`).join('')}</div>`;
  }

  function tuongTu(w) {
    const ds = DB.getSimilarWorks(w, 5);
    return ds.length ? luoi(ds.map(workCard).join(''), 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5') : '';
  }

  /* ---------------------------------------------------------------- infobox */
  function infobox(w) {
    const hang = [
      ['Tên tiếng Việt', esc(w.ten_viet)], ['Tên tiếng Trung', esc(w.ten_trung)], ['Tên khác', esc(w.ten_khac)],
      ['Tác giả', esc(w.tac_gia)],
      ['Thể loại', DB.getGenres(w).map((g) => `<a href="${LINK.genre(g)}">${esc(g)}</a>`).join(', ')],
      ['Tình trạng', w.tinh_trang ? `<span class="badge badge-sm ${/hoàn/i.test(w.tinh_trang) ? 'badge-success' : 'badge-warning'}">${esc(w.tinh_trang)}</span>` : ''],
      ['Số chương', esc(w.so_chuong)], ['Số tập', esc(w.so_tap)], ['Số mùa', esc(w.so_mua)],
      ['Nền tảng', esc(w.nen_tang)], ['Năm phát hành', esc(w.nam)], ['Studio', esc(w.studio)],
      ['Điểm đánh giá', num(w.diem) != null ? `<b class="text-primary text-base">★ ${num(w.diem).toFixed(1)}</b> / 10` : ''],
    ].filter(([, v]) => v);
    return `<aside class="infobox">
      <div class="infobox-tieu-de">${esc(w.ten_viet)}</div>
      <a href="${esc(img(w.anh_bia))}" class="glightbox block p-3" data-title="${esc(tieuDeAnh(w.ten_viet, w.nguon_anh))}">${anh(w.anh_bia, w.ten_viet, 'w-full max-w-[200px] mx-auto lg:max-w-none rounded-lg aspect-[2/3] object-cover', false)}${nguon(w.nguon_anh)}</a>
      <table><tbody>${hang.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</tbody></table></aside>`;
  }

  /* ---------------------------------------------------------------- vẽ trang */
  function ve() {
    const w = DB.getWork(id);
    const main = document.getElementById('noi-dung');
    if (!w) {
      main.innerHTML = `<div class="khung py-20 text-center">${icon('search-x', 'w-12 h-12 mx-auto opacity-50')}
        <h1 class="text-2xl font-bold mt-4">Không tìm thấy tác phẩm</h1><p class="opacity-70 mt-2">Mã "${esc(id || '')}" không có trong tab TacPham.</p>
        <a class="btn btn-primary mt-6" href="${LINK.home()}">Về trang chủ</a></div>`;
      return;
    }
    const loaiTen = nhan('loaiTacPham', w.loai);
    const tieuDe = `[Review] ${w.ten_viet} | Cốt truyện, Nhân vật, Thế giới`;
    const moTa = (lines(w.tom_tat)[0] || '').slice(0, 160);
    UI.setMeta({ title: tieuDe, description: moTa, image: w.anh_bia });

    const phu = DB.getCharactersByWork(w.id, 'phu');
    const lienQuan = DB.getCharactersByWork(w.id, ['lien-quan', 'phan-dien']);
    const MUC = [
      { id: 'tom-tat', ten: 'Nội dung / Tóm tắt', ic: 'book-open', html: tomTat(w) },
      { id: 'boi-canh', ten: 'Bối cảnh thế giới', ic: 'globe', html: w.boi_canh ? `<div class="noi-dung">${paragraphs(w.boi_canh)}</div>` : '' },
      { id: 'thu-vien-anh', ten: 'Thư viện ảnh', ic: 'images', html: thuVienAnh(w) },
      { id: 'nhan-vat-chinh', ten: 'Nhân vật chính', ic: 'crown', html: nhanVatChinh(w) },
      { id: 'nhan-vat-phu', ten: 'Nhân vật phụ', ic: 'users', html: luoiNhanVat(phu) },
      { id: 'phan-dien', ten: 'Nhân vật liên quan / Phản diện', ic: 'skull', html: luoiNhanVat(lienQuan) },
      { id: 'the-luc', ten: 'Thế lực', ic: 'castle', html: theLuc(w) },
      { id: 'loai-tu-luyen', ten: 'Các loại tu luyện', ic: 'flame', html: loaiTuLuyen(w) },
      { id: 'cap-do', ten: 'Các cấp độ tu luyện', ic: 'mountain', html: capDo(w) },
      { id: 'vat-pham', ten: 'Trang bị và vũ khí', ic: 'sword', html: vatPham(w) },
      { id: 'ban-do', ten: 'Bản đồ thế giới', ic: 'map', html: banDo(w) },
      { id: 'hanh-trinh', ten: 'Hành trình nhân vật chính', ic: 'footprints', html: hanhTrinh(w) },
      { id: 'danh-gia', ten: 'Đánh giá', ic: 'star', html: danhGia(w) },
      { id: 'ost', ten: 'OST', ic: 'music', html: ost(w) },
      { id: 'tuong-tu', ten: 'Tác phẩm tương tự', ic: 'library', html: tuongTu(w) },
    ].filter((m) => m.html);

    const mucLuc = MUC.map((m, i) => `<a href="#${m.id}" data-muc="${m.id}">${icon(m.ic, 'w-4 h-4 shrink-0')}<span>${i + 1}. ${m.ten}</span></a>`).join('');

    main.innerHTML = `
      <section class="dau-bai">
        <div class="banner-nen" style="background-image:url('${esc(img(w.anh_bia))}')"></div>
        <div class="dau-bai-noi-dung khung py-6 md:py-10">
          ${breadcrumb([{ ten: 'Trang chủ', href: LINK.home() }, { ten: loaiTen, href: LINK.list(w.loai) }, { ten: w.ten_viet }])}
          <div class="flex gap-5 items-end mt-4">
            ${anh(w.anh_bia, w.ten_viet, 'hidden sm:block w-36 md:w-44 rounded-lg shadow-2xl aspect-[2/3] object-cover shrink-0', false)}
            <div>
              <div class="flex flex-wrap gap-2 mb-3">${nhanLoai(w.loai)}${DB.getGenres(w).filter((g) => g !== loaiTen).map((g) => `<a href="${LINK.genre(g)}" class="nhan nhan-vien text-white border-white/40">${esc(g)}</a>`).join('')}</div>
              <h1 class="text-2xl md:text-4xl font-bold leading-tight">${esc(tieuDe)}</h1>
              <div class="mt-3 flex flex-wrap gap-4 text-sm opacity-90">
                ${w.tac_gia ? `<span class="flex items-center gap-1">${icon('feather')} ${esc(w.tac_gia)}</span>` : ''}
                ${w.ngay_dang ? `<span class="flex items-center gap-1">${icon('calendar')} ${esc(formatDate(w.ngay_dang))}</span>` : ''}
                ${num(w.diem) != null ? `<span class="flex items-center gap-1 text-[#f5d27a] font-bold">${icon('star')} ${num(w.diem).toFixed(1)}/10</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      </section>
      <div class="khung mt-6 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)_300px] items-start">
        <div class="order-1 lg:order-3 lg:sticky lg:top-24">${infobox(w)}</div>
        <nav class="order-2 lg:order-1 muc-luc" aria-label="Mục lục">
          <details class="lg:hidden collapse collapse-arrow bg-base-100 border border-[var(--vien-vang)]">
            <summary class="collapse-title font-semibold">${icon('list', 'w-4 h-4 inline')} Mục lục</summary>
            <div class="collapse-content">${mucLuc}</div></details>
          <div class="hidden lg:block muc !p-3"><div class="font-bold mb-2 px-2 text-primary">Mục lục</div>${mucLuc}</div>
        </nav>
        <div class="order-3 lg:order-2 min-w-0">
          ${MUC.map((m) => `<section id="${m.id}" class="muc" data-aos="fade-up"><h2>${icon(m.ic, 'w-5 h-5')}${m.ten}</h2>${m.html}</section>`).join('')}
        </div>
      </div>`;

    // Tô sáng mục đang đọc trong mục lục
    const links = [...document.querySelectorAll('.muc-luc a[data-muc]')];
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) links.forEach((a) => a.classList.toggle('dang-xem', a.dataset.muc === e.target.id));
    }), { rootMargin: '-90px 0px -70% 0px' });
    MUC.forEach((m) => io.observe(document.getElementById(m.id)));
  }

  document.getElementById('noi-dung').innerHTML = `<div class="khung py-8"><div class="cho h-8 w-2/3"></div><div class="cho h-4 w-1/3 mt-3"></div>
    <div class="grid lg:grid-cols-[1fr_300px] gap-6 mt-8"><div class="space-y-4"><div class="cho h-40"></div><div class="cho h-40"></div></div><div class="cho h-96"></div></div></div>`;
  UI.khoiDong(ve);
})();
