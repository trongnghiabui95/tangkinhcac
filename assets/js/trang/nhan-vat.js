/* Trang Nhân vật:
   - nhan-vat.html?id=han-lap        → trang chi tiết
   - nhan-vat.html (?tac_pham=...)   → lưới tất cả nhân vật, có bộ lọc */
(function () {
  const { esc, img, ids, lines, paragraphs } = DB;
  const { icon, anh, nguon, tieuDeAnh, chip, charCard, luoi, breadcrumb, nhan, LINK, trong } = UI;
  const q = new URLSearchParams(location.search);
  const id = q.get('id');

  /* ================================================================ DANH SÁCH */
  function veDanhSach() {
    UI.setMeta({ title: 'Nhân Vật', description: 'Danh sách nhân vật trong các truyện Tu Tiên, Huyền Huyễn và Anime.' });
    const tatCa = DB.getCharacters();
    const tacPham = DB.getWorks();
    const chon = q.get('tac_pham') || '';
    document.getElementById('noi-dung').innerHTML = `<div class="khung py-8">
      ${breadcrumb([{ ten: 'Trang chủ', href: LINK.home() }, { ten: 'Nhân Vật' }])}
      <h1 class="text-3xl font-bold mt-3 mb-5">Nhân Vật</h1>
      <div class="flex flex-wrap gap-3 mb-6">
        <select id="loc-tp" class="select select-sm w-auto bg-base-100"><option value="">Tất cả tác phẩm</option>
          ${tacPham.map((w) => `<option value="${esc(w.id)}" ${w.id === chon ? 'selected' : ''}>${esc(w.ten_viet)}</option>`).join('')}</select>
        <select id="loc-vt" class="select select-sm w-auto bg-base-100"><option value="">Mọi vai trò</option>
          ${Object.entries(UI.NHAN.vaiTro).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div id="ds-nv"></div></div>`;
    const loc = () => {
      const tp = document.getElementById('loc-tp').value, vt = document.getElementById('loc-vt').value;
      const ds = tatCa.filter((c) => (!tp || c.tac_pham_id === tp) && (!vt || c.vai_tro === vt));
      document.getElementById('ds-nv').innerHTML = ds.length ? luoi(ds.map((c) => charCard(c)).join('')) : trong('Không có nhân vật phù hợp.');
      UI.refresh();
    };
    document.getElementById('loc-tp').onchange = loc;
    document.getElementById('loc-vt').onchange = loc;
    loc();
  }

  /* ================================================================ CHI TIẾT */
  function infobox(c, w) {
    const lien = (arr, fn) => arr.filter(Boolean).map(fn).join(', ');
    const theLuc = ids(c.the_luc_ids).map(DB.getFaction);
    const loaiTL = ids(c.loai_tu_luyen_ids).map(DB.getCultivationType);
    const cap = DB.getLevel(c.cap_do_id);
    const tinhTrangMau = /chết/i.test(c.tinh_trang) ? 'badge-error' : /phi thăng/i.test(c.tinh_trang) ? 'badge-warning' : 'badge-success';
    const hang = [
      ['Bộ', w ? `<a href="${LINK.work(w.id)}">${esc(w.ten_viet)}</a>` : ''],
      ['Biệt danh / Danh hiệu', esc(c.biet_danh)],
      ['Vai trò', esc(nhan('vaiTro', c.vai_tro))],
      ['Giới tính', esc(c.gioi_tinh)], ['Chủng tộc', esc(c.chung_toc)], ['Tuổi', esc(c.tuoi)],
      ['Thế lực', lien(theLuc, (f) => `<a href="${LINK.faction(f)}">${esc(f.ten)}</a>`)],
      ['Nghề nghiệp', esc(c.nghe_nghiep)],
      ['Loại tu luyện', lien(loaiTL, (t) => `<a href="${LINK.work(t.tac_pham_id, 'loai-tu-luyen')}">${esc(t.ten)}</a>`)],
      ['Cấp độ cao nhất', cap ? `<a href="${LINK.level(cap)}">${esc(cap.ten)}</a>` : ''],
      ['Tình trạng', c.tinh_trang ? `<span class="badge badge-sm ${tinhTrangMau}">${esc(c.tinh_trang)}</span>` : ''],
    ].filter(([, v]) => v);
    return `<aside class="infobox">
      <div class="infobox-tieu-de">${esc(c.ten)}</div>
      <a href="${esc(img(c.anh))}" class="glightbox block p-3" data-gallery="nhan-vat" data-title="${esc(tieuDeAnh(c.ten, c.nguon_anh))}">${anh(c.anh, c.ten, 'w-full max-w-[220px] mx-auto lg:max-w-none rounded-lg aspect-[3/4] object-cover', false)}${nguon(c.nguon_anh)}</a>
      <table><tbody>${hang.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</tbody></table></aside>`;
  }

  function cuocDoi(c) {
    const ds = DB.getLife(c.id);
    if (!ds.length) return '';
    return `<div class="dong-thoi-gian">${ds.map((d) => {
      const p = DB.getPlace(d.dia_diem_id), l = DB.getLevel(d.cap_do_id);
      return `<div class="moc" data-aos="fade-up">
        <h3 class="font-bold text-lg">${esc(d.giai_doan)}</h3>
        <div class="flex flex-wrap gap-2 my-1">
          ${p ? `<a href="${LINK.place(p)}" class="nhan nhan-vien">${icon('map-pin', 'w-3 h-3')}${esc(p.ten)}</a>` : ''}
          ${l ? `<a href="${LINK.level(l)}" class="nhan nhan-tu-luyen">${icon('mountain', 'w-3 h-3')}${esc(l.ten)}</a>` : ''}
        </div>
        <div class="noi-dung">${paragraphs(d.su_kien)}</div></div>`;
    }).join('')}</div>`;
  }

  function sucManh(c) {
    const vp = ids(c.vat_pham_ids).map(DB.getItem).filter(Boolean);
    const loaiTL = ids(c.loai_tu_luyen_ids).map(DB.getCultivationType).filter(Boolean);
    if (!c.suc_manh && !vp.length && !loaiTL.length) return '';
    return `${c.suc_manh ? `<div class="noi-dung">${paragraphs(c.suc_manh)}</div>` : ''}
      ${loaiTL.length ? `<div class="mt-4 flex flex-wrap gap-2 items-center"><span class="text-sm font-semibold text-primary">Con đường tu luyện:</span>
        ${loaiTL.map((t) => `<a href="${LINK.work(t.tac_pham_id, 'loai-tu-luyen')}" class="nhan nhan-tu-luyen">${esc(t.ten)}</a>`).join('')}</div>` : ''}
      ${vp.length ? `<h3 class="font-bold mt-5 mb-3 flex items-center gap-2">${icon('gem', 'w-4 h-4 text-primary')}Công pháp, pháp bảo đang dùng</h3>
        <div class="grid sm:grid-cols-2 gap-3">${vp.map((v) => `<a href="${LINK.item(v)}" class="bac-the flex gap-3 items-center hover:border-primary">
          ${anh(v.anh, v.ten, 'w-14 h-14 rounded-lg object-cover shrink-0')}
          <div class="min-w-0"><div class="font-semibold">${esc(v.ten)}</div>
          <div class="flex gap-1 flex-wrap mt-1"><span class="nhan nhan-vat-pham">${esc(nhan('loaiVatPham', v.loai))}</span>${v.pham_cap ? `<span class="nhan nhan-vien">${esc(v.pham_cap)}</span>` : ''}</div></div></a>`).join('')}</div>` : ''}`;
  }

  function quanHe(c) {
    const ds = DB.getRelations(c.id).filter((r) => r.nhanVat);
    if (!ds.length) return '';
    const thuTu = Object.keys(UI.NHAN.quanHe);
    const nhom = {};
    ds.forEach((r) => (nhom[r.quan_he] = nhom[r.quan_he] || []).push(r));
    const viTri = (k) => (thuTu.indexOf(k) < 0 ? 99 : thuTu.indexOf(k));
    const keys = Object.keys(nhom).sort((a, b) => viTri(a) - viTri(b));
    return keys.map((k) => `<h3 class="font-bold mt-1 mb-3 flex items-center gap-2">${icon(k === 'ke-thu' ? 'swords' : 'heart-handshake', 'w-4 h-4 text-primary')}${esc(nhan('quanHe', k))}</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-5">${nhom[k].map((r) => charCard(r.nhanVat, r.ghi_chu)).join('')}</div>`).join('');
  }

  function thuVienAnh(c) {
    const ds = DB.getImages(null, c.id);
    if (!ds.length) return '';
    return `<div class="luoi-anh grid grid-cols-2 md:grid-cols-3 gap-3">${ds.map((a) =>
      `<a href="${esc(img(a.link_anh))}" class="glightbox" data-gallery="anh-nv" data-title="${esc(tieuDeAnh(a.chu_thich, a.nguon_anh))}">${anh(a.link_anh, a.chu_thich || c.ten)}</a>`).join('')}</div>`;
  }

  function cauNoi(c) {
    const ds = lines(c.cau_noi);
    return ds.length ? `<div class="space-y-3">${ds.map((x) => `<blockquote class="cau-noi">“${esc(x.replace(/^["“”]|["“”]$/g, ''))}”</blockquote>`).join('')}</div>` : '';
  }

  function cungTruyen(c) {
    const ds = DB.getCharactersByWork(c.tac_pham_id).filter((x) => x.id !== c.id).slice(0, 8);
    return ds.length ? luoi(ds.map((x) => charCard(x)).join(''), 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4') : '';
  }

  function veChiTiet() {
    const c = DB.getCharacter(id);
    const main = document.getElementById('noi-dung');
    if (!c) {
      main.innerHTML = `<div class="khung py-20 text-center">${icon('search-x', 'w-12 h-12 mx-auto opacity-50')}
        <h1 class="text-2xl font-bold mt-4">Không tìm thấy nhân vật</h1><p class="opacity-70 mt-2">Mã "${esc(id)}" không có trong tab NhanVat.</p>
        <a class="btn btn-primary mt-6" href="${LINK.chars()}">Xem tất cả nhân vật</a></div>`;
      return;
    }
    const w = DB.getWork(c.tac_pham_id);
    const tieuDe = `${c.ten} | Tiểu sử, Sức mạnh, Mối quan hệ`;
    UI.setMeta({ title: tieuDe, description: (c.mo_ta_ngan || lines(c.xuat_than)[0] || '').slice(0, 160), image: c.anh });

    const MUC = [
      { id: 'xuat-than', ten: 'Bối cảnh và xuất thân', ic: 'scroll', html: c.xuat_than ? `<div class="noi-dung">${paragraphs(c.xuat_than)}</div>` : '' },
      { id: 'cuoc-doi', ten: 'Cuộc đời', ic: 'footprints', html: cuocDoi(c) },
      { id: 'tinh-cach', ten: 'Tính cách', ic: 'brain', html: c.tinh_cach ? `<div class="noi-dung">${paragraphs(c.tinh_cach)}</div>` : '' },
      { id: 'suc-manh', ten: 'Sức mạnh và năng lực', ic: 'zap', html: sucManh(c) },
      { id: 'quan-he', ten: 'Mối quan hệ', ic: 'heart-handshake', html: quanHe(c) },
      { id: 'thu-vien-anh', ten: 'Thư viện ảnh', ic: 'images', html: thuVienAnh(c) },
      { id: 'cau-noi', ten: 'Câu nói nổi tiếng', ic: 'quote', html: cauNoi(c) },
      { id: 'cung-truyen', ten: 'Nhân vật cùng truyện', ic: 'users', html: cungTruyen(c) },
    ].filter((m) => m.html);

    main.innerHTML = `
      <section class="dau-bai">
        <div class="banner-nen" style="background-image:url('${esc(img(c.anh))}')"></div>
        <div class="dau-bai-noi-dung khung py-6 md:py-10">
          ${breadcrumb([{ ten: 'Trang chủ', href: LINK.home() },
            ...(w ? [{ ten: nhan('loaiTacPham', w.loai), href: LINK.list(w.loai) }, { ten: w.ten_viet, href: LINK.work(w.id) }] : []),
            { ten: c.ten }])}
          <div class="flex gap-5 items-end mt-4">
            ${anh(c.anh, c.ten, 'w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-primary shrink-0', false)}
            <div class="min-w-0">
              <span class="nhan ${c.vai_tro === 'phan-dien' ? 'nhan-phan-dien' : 'nhan-nhan-vat'} mb-2">${esc(nhan('vaiTro', c.vai_tro))}</span>
              <h1 class="text-2xl md:text-4xl font-bold leading-tight">${esc(tieuDe)}</h1>
              ${w ? `<div class="mt-2 text-base">Bộ: <a class="font-semibold text-[#f5d27a] underline underline-offset-4" href="${LINK.work(w.id)}">${esc(w.ten_viet)}</a></div>` : ''}
            </div>
          </div>
        </div>
      </section>
      <div class="khung mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div class="order-1 lg:order-2 lg:sticky lg:top-24">${infobox(c, w)}</div>
        <div class="order-2 lg:order-1 min-w-0">
          ${c.mo_ta_ngan ? `<p class="text-lg leading-relaxed mb-5 font-tieu-de italic opacity-90">${esc(c.mo_ta_ngan)}</p>` : ''}
          <div class="flex flex-wrap gap-2 mb-5">${MUC.map((m) => `<a href="#${m.id}" class="btn btn-xs btn-ghost border border-[var(--vien-vang)]">${icon(m.ic, 'w-3 h-3')}${m.ten}</a>`).join('')}</div>
          ${MUC.map((m) => `<section id="${m.id}" class="muc" data-aos="fade-up"><h2>${icon(m.ic, 'w-5 h-5')}${m.ten}</h2>${m.html}</section>`).join('')}
        </div>
      </div>`;
  }

  document.getElementById('noi-dung').innerHTML = `<div class="khung py-8"><div class="cho h-8 w-2/3"></div>
    <div class="grid lg:grid-cols-[1fr_320px] gap-6 mt-8"><div class="space-y-4"><div class="cho h-40"></div><div class="cho h-40"></div></div><div class="cho h-96"></div></div></div>`;
  UI.khoiDong(id ? veChiTiet : veDanhSach);
})();
