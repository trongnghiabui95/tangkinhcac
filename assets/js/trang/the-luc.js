/* Trang Thế lực:
   - the-luc.html                     → danh sách thế lực, nhóm theo tác phẩm, lọc theo tác phẩm và loại
   - the-luc.html?id=hoang-phong-coc  → trang chi tiết một thế lực */
(function () {
  const { esc, img, paragraphs, lines } = DB;
  const { icon, anh, nguon, tieuDeAnh, chip, charCard, luoi, breadcrumb, nhan, LINK, trong } = UI;
  const q = new URLSearchParams(location.search);
  const id = q.get('id');

  /* ================================================================ DANH SÁCH */
  function theThe(f) {
    const tv = DB.getMembers(f.id);
    return `<a href="${LINK.faction(f)}" class="the-bai the-luc-the flex gap-4 p-4 items-start" data-aos="fade-up">
      ${anh(f.logo, f.ten, 'w-16 h-16 rounded-full object-cover border-2 border-primary shrink-0')}
      <div class="min-w-0">
        <h3 class="the-ten text-lg">${esc(f.ten)}</h3>
        <div class="flex flex-wrap gap-2 items-center mt-1">
          <span class="nhan nhan-the-luc">${esc(nhan('loaiTheLuc', f.loai))}</span>
          <span class="text-[13px] opacity-75">${tv.length} thành viên</span>
        </div>
        ${f.mo_ta ? `<p class="text-sm opacity-85 mt-2 line-clamp-2">${esc(lines(f.mo_ta)[0])}</p>` : ''}
      </div></a>`;
  }

  function veDanhSach() {
    UI.setMeta({ title: 'Thế Lực', description: 'Tông môn, gia tộc, hoàng triều, ma đạo trong các truyện Tu Tiên, Huyền Huyễn và Anime.' });
    const tatCa = DB.getFactions();
    const tacPham = DB.getWorks().filter((w) => DB.getFactionsByWork(w.id).length);
    const loaiCo = [...new Set(tatCa.map((f) => f.loai).filter(Boolean))];
    const chonTp = q.get('tac_pham') || '', chonLoai = q.get('loai') || '';
    document.getElementById('noi-dung').innerHTML = `<div class="khung py-8">
      ${breadcrumb([{ ten: 'Trang chủ', href: LINK.home() }, { ten: 'Thế Lực' }])}
      <h1 class="text-3xl font-bold mt-3 mb-2">Thế Lực</h1>
      <p class="opacity-80 mb-5">Tông môn, gia tộc, hoàng triều và các phe phái trong từng bộ truyện.</p>
      <div class="flex flex-wrap gap-3 mb-6">
        <select id="loc-tp" class="select w-auto bg-base-100 min-h-11" aria-label="Lọc theo tác phẩm"><option value="">Tất cả tác phẩm</option>
          ${tacPham.map((w) => `<option value="${esc(w.id)}" ${w.id === chonTp ? 'selected' : ''}>${esc(w.ten_viet)}</option>`).join('')}</select>
        <select id="loc-loai" class="select w-auto bg-base-100 min-h-11" aria-label="Lọc theo loại thế lực"><option value="">Mọi loại</option>
          ${loaiCo.map((l) => `<option value="${esc(l)}" ${l === chonLoai ? 'selected' : ''}>${esc(nhan('loaiTheLuc', l))}</option>`).join('')}</select>
      </div>
      <div id="ds-tl"></div></div>`;
    const loc = () => {
      const tp = document.getElementById('loc-tp').value, loai = document.getElementById('loc-loai').value;
      const nhom = DB.getWorks().map((w) => ({ w, ds: DB.getFactionsByWork(w.id).filter((f) => !loai || f.loai === loai) }))
        .filter((n) => n.ds.length && (!tp || n.w.id === tp));
      document.getElementById('ds-tl').innerHTML = nhom.length
        ? nhom.map((n) => `<section class="mb-10">
            <div class="tieu-de-khoi"><h2><a href="${LINK.work(n.w.id, 'the-luc')}" class="hover:text-primary">${esc(n.w.ten_viet)}</a></h2>
              <span class="text-[13px] opacity-75">${n.ds.length} thế lực</span></div>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">${n.ds.map(theThe).join('')}</div></section>`).join('')
        : trong(tatCa.length ? 'Không có thế lực phù hợp bộ lọc. Hãy chọn "Tất cả tác phẩm" hoặc "Mọi loại".'
          : 'Chưa có thế lực nào. Hãy thêm dòng vào tab TheLuc trong Google Sheet.');
      UI.refresh();
    };
    document.getElementById('loc-tp').onchange = loc;
    document.getElementById('loc-loai').onchange = loc;
    loc();
  }

  /* ================================================================ CHI TIẾT */
  function infobox(f, w) {
    const tl = DB.getCharacter(f.thu_linh_id), ts = DB.getPlace(f.tru_so_id), tv = DB.getMembers(f.id);
    const hang = [
      ['Loại', esc(nhan('loaiTheLuc', f.loai))],
      ['Bộ', w ? `<a href="${LINK.work(w.id)}">${esc(w.ten_viet)}</a>` : ''],
      ['Thủ lĩnh', tl ? `<a href="${LINK.char(tl.id)}">${esc(tl.ten)}</a>` : ''],
      ['Trụ sở', ts ? `<a href="${LINK.place(ts)}">${esc(ts.ten)}</a>` : ''],
      ['Thành viên', tv.length ? `${tv.length} nhân vật` : ''],
    ].filter(([, v]) => v);
    return `<aside class="infobox">
      <div class="infobox-tieu-de">${esc(f.ten)}</div>
      <a href="${esc(img(f.logo))}" class="glightbox block p-3" data-title="${esc(tieuDeAnh(f.ten, f.nguon_anh))}">${anh(f.logo, f.ten, 'w-full max-w-[220px] mx-auto rounded-lg aspect-square object-cover', false)}${nguon(f.nguon_anh)}</a>
      <table><tbody>${hang.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</tbody></table></aside>`;
  }

  function veChiTiet() {
    const f = DB.getFaction(id);
    const main = document.getElementById('noi-dung');
    if (!f) {
      UI.setMeta({ title: 'Không tìm thấy thế lực', description: '' });
      main.innerHTML = `<div class="khung py-20 text-center">${icon('search-x', 'w-12 h-12 mx-auto opacity-50')}
        <h1 class="text-2xl font-bold mt-4">Không tìm thấy thế lực</h1><p class="opacity-80 mt-2">Mã "${esc(id)}" không có trong tab TheLuc.</p>
        <a class="btn btn-primary mt-6 min-h-11" href="${LINK.factions()}">Xem tất cả thế lực</a></div>`;
      return;
    }
    const w = DB.getWork(f.tac_pham_id);
    const tl = DB.getCharacter(f.thu_linh_id), ts = DB.getPlace(f.tru_so_id), tv = DB.getMembers(f.id);
    const khac = DB.getFactionsByWork(f.tac_pham_id).filter((x) => x.id !== f.id);
    UI.setMeta({ title: `${f.ten} | Thế lực trong ${w ? w.ten_viet : 'truyện'}`, description: (lines(f.mo_ta)[0] || '').slice(0, 160), image: f.logo });

    const MUC = [
      { id: 'gioi-thieu', ten: 'Giới thiệu', ic: 'scroll', html: f.mo_ta ? `<div class="noi-dung">${paragraphs(f.mo_ta)}</div>` : '' },
      { id: 'thu-linh', ten: 'Thủ lĩnh', ic: 'crown', html: tl ? `<div class="flex flex-wrap gap-3">${chip(tl)}</div>` : '' },
      { id: 'tru-so', ten: 'Trụ sở', ic: 'map-pin', html: ts ? `<div class="bac-the"><a class="font-bold text-lg hover:text-primary" href="${LINK.place(ts)}">${esc(ts.ten)}</a>
          ${ts.mo_ta ? `<div class="noi-dung text-sm mt-1">${paragraphs(ts.mo_ta)}</div>` : ''}
          <a class="btn btn-sm btn-ghost mt-2 min-h-11" href="${LINK.place(ts)}">${icon('map')} Xem trên bản đồ thế giới</a></div>` : '' },
      { id: 'thanh-vien', ten: `Thành viên (${tv.length})`, ic: 'users', html: tv.length ? luoi(tv.map((c) => charCard(c)).join(''), 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4') : '' },
      { id: 'the-luc-khac', ten: 'Thế lực khác cùng truyện', ic: 'castle', html: khac.length ? `<div class="grid sm:grid-cols-2 gap-4">${khac.map(theThe).join('')}</div>` : '' },
    ].filter((m) => m.html);

    main.innerHTML = `
      <section class="dau-bai">
        <div class="banner-nen" style="background-image:url('${esc(img(f.logo))}')"></div>
        <div class="dau-bai-noi-dung khung py-6 md:py-10">
          ${breadcrumb([{ ten: 'Trang chủ', href: LINK.home() }, { ten: 'Thế Lực', href: LINK.factions() },
            ...(w ? [{ ten: w.ten_viet, href: LINK.factions(w.id) }] : []), { ten: f.ten }])}
          <div class="flex gap-5 items-end mt-4">
            ${anh(f.logo, f.ten, 'w-20 h-20 md:w-28 md:h-28 rounded-full object-cover border-4 border-primary shrink-0', false)}
            <div class="min-w-0">
              <span class="nhan nhan-the-luc mb-2">${esc(nhan('loaiTheLuc', f.loai))}</span>
              <h1 class="text-2xl md:text-4xl font-bold leading-tight">${esc(f.ten)}</h1>
              ${w ? `<div class="mt-2">Bộ: <a class="font-semibold text-[#f5d27a] underline underline-offset-4" href="${LINK.work(w.id)}">${esc(w.ten_viet)}</a></div>` : ''}
            </div>
          </div>
        </div>
      </section>
      <div class="khung mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div class="order-1 lg:order-2 lg:sticky lg:top-24">${infobox(f, w)}</div>
        <div class="order-2 lg:order-1 min-w-0">
          ${MUC.length ? MUC.map((m) => `<section id="${m.id}" class="muc" data-aos="fade-up"><h2>${icon(m.ic, 'w-5 h-5')}${m.ten}</h2>${m.html}</section>`).join('')
            : `<div class="muc">${trong('Thế lực này chưa có mô tả, thủ lĩnh hay thành viên. Hãy bổ sung trong tab TheLuc và cột the_luc_ids của tab NhanVat.')}</div>`}
          ${w ? `<a class="btn btn-outline btn-primary mt-5 min-h-11" href="${LINK.work(w.id, 'the-luc')}">${icon('arrow-left')} Về mục Thế lực của ${esc(w.ten_viet)}</a>` : ''}
        </div>
      </div>`;
  }

  document.getElementById('noi-dung').innerHTML = `<div class="khung py-8"><div class="cho h-8 w-1/2"></div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8"><div class="cho h-32"></div><div class="cho h-32"></div><div class="cho h-32"></div></div></div>`;
  UI.khoiDong(id ? veChiTiet : veDanhSach);
})();
