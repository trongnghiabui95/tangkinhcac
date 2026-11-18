/* Trang Tìm kiếm: tim-kiem.html?q=...&loai=...
   Tìm trên tác phẩm, nhân vật, thế lực, vật phẩm, thuật ngữ, cảnh giới, địa điểm.
   Gõ không dấu vẫn ra ("han lap" → Hàn Lập). Khớp chứa-chuỗi bỏ dấu trước, rồi mới tới tìm mờ (Fuse.js). */
(function () {
  const { esc, boDau, ids } = DB;
  const { icon, anh, breadcrumb, LINK, nhan } = UI;
  const TOI_DA = 10; // mỗi nhóm hiện tối đa
  const NHOM = [
    { k: 'tac-pham', ten: 'Tác phẩm', ic: 'book-open' },
    { k: 'nhan-vat', ten: 'Nhân vật', ic: 'users' },
    { k: 'the-luc', ten: 'Thế lực', ic: 'castle' },
    { k: 'vat-pham', ten: 'Vật phẩm', ic: 'gem' },
    { k: 'thuat-ngu', ten: 'Thuật ngữ', ic: 'book-a' },
    { k: 'canh-gioi', ten: 'Cảnh giới', ic: 'mountain' },
    { k: 'dia-diem', ten: 'Địa điểm', ic: 'map-pin' },
  ];
  const chuan = (s) => boDau(s).toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
  const q0 = new URLSearchParams(location.search);
  let tuKhoa = q0.get('q') || '';
  let loaiChon = q0.get('loai') || '';
  let chiMuc = [], fuse = null;

  /* -------------------------------------------------------------- lập chỉ mục */
  function lapChiMuc() {
    const tenTP = (id) => (DB.getWork(id) || {}).ten_viet || '';
    const muc = [];
    const them = (loai, ten, phu, anhLink, href, truong) => muc.push({
      loai, ten, phu, anh: anhLink, href,
      tenChuan: chuan(ten), khoa: chuan([ten, ...truong].filter(Boolean).join(' ')),
    });
    DB.getWorks().forEach((w) => them('tac-pham', w.ten_viet, [nhan('loaiTacPham', w.loai), w.tac_gia].filter(Boolean).join(' – '),
      w.anh_bia, LINK.work(w.id), [w.ten_trung, w.ten_khac, w.tac_gia, w.the_loai]));
    DB.getCharacters().forEach((c) => them('nhan-vat', c.ten, [nhan('vaiTro', c.vai_tro), tenTP(c.tac_pham_id)].filter(Boolean).join(' – '),
      c.anh, LINK.char(c.id), [c.biet_danh]));
    DB.getFactions().forEach((f) => them('the-luc', f.ten, [nhan('loaiTheLuc', f.loai), tenTP(f.tac_pham_id)].filter(Boolean).join(' – '),
      f.logo, LINK.faction(f), []));
    DB.tables.VatPham.forEach((v) => them('vat-pham', v.ten, [nhan('loaiVatPham', v.loai), v.pham_cap, tenTP(v.tac_pham_id)].filter(Boolean).join(' – '),
      v.anh, LINK.item(v), [v.pham_cap]));
    DB.getTerms().forEach((t) => them('thuat-ngu', t.ten, (t.giai_thich || '').slice(0, 90) + ((t.giai_thich || '').length > 90 ? '…' : ''),
      '', DB.ROOT + 'thuat-ngu.html#' + encodeURIComponent(t.id), []));
    DB.tables.CapDo.forEach((l) => them('canh-gioi', l.ten, ['Cảnh giới thứ ' + l.thu_tu, tenTP(l.tac_pham_id)].filter(Boolean).join(' – '),
      '', LINK.level(l), []));
    DB.tables.DiaDiem.forEach((p) => them('dia-diem', p.ten, [nhan('capDiaDiem', p.cap), tenTP(p.tac_pham_id)].filter(Boolean).join(' – '),
      p.anh_ban_do, LINK.place(p), []));
    chiMuc = muc;
    fuse = window.Fuse ? new Fuse(muc, { keys: [{ name: 'tenChuan', weight: 2 }, { name: 'khoa', weight: 1 }], threshold: 0.34, ignoreLocation: true, minMatchCharLength: 2 }) : null;
  }

  /* -------------------------------------------------------------- tìm */
  function tim(chu) {
    const q = chuan(chu);
    if (!q) return [];
    // 1) khớp chứa-chuỗi (bỏ dấu). Ưu tiên: tên bắt đầu bằng > tên có từ bắt đầu bằng > trường khác có từ bắt đầu bằng > chứa ở giữa từ
    const dauTu = (chuoi) => (' ' + chuoi).includes(' ' + q);
    const diem = (m) => (m.tenChuan.startsWith(q) ? 0 : dauTu(m.tenChuan) ? 1 : dauTu(m.khoa) ? 2 : m.khoa.includes(q) ? 3 : 9);
    const tu = q.split(' ');
    const khop = chiMuc.filter((m) => diem(m) < 9 || tu.every((t) => (' ' + m.khoa).includes(' ' + t)))
      .sort((a, b) => diem(a) - diem(b) || a.ten.localeCompare(b.ten, 'vi'));
    if (khop.length || !fuse) return khop;
    // 2) không khớp đúng → tìm mờ cho lỗi gõ ("han lapp", "nam cung uyn")
    return fuse.search(q).map((r) => r.item);
  }

  /* -------------------------------------------------------------- hiển thị */
  function theKetQua(m) {
    const n = NHOM.find((x) => x.k === m.loai);
    const hinh = m.anh ? anh(m.anh, m.ten, 'tk-anh') : `<span class="tk-anh tk-anh-icon">${icon(n.ic, 'w-5 h-5')}</span>`;
    return `<li><a class="tk-dong" href="${m.href}">${hinh}
      <span class="min-w-0"><span class="tk-ten">${esc(m.ten)}</span>${m.phu ? `<span class="tk-phu">${esc(m.phu)}</span>` : ''}</span>
      ${icon('chevron-right', 'w-4 h-4 ml-auto shrink-0 opacity-60')}</a></li>`;
  }

  function veKetQua() {
    const vung = document.getElementById('tk-ket-qua');
    const loc = document.getElementById('tk-loc');
    if (!chuan(tuKhoa)) {
      loc.innerHTML = '';
      const goiY = [...DB.getWorks().slice(0, 2).map((w) => w.ten_viet), ...DB.getFeaturedCharacters().slice(0, 3).map((c) => c.ten), 'linh can'];
      vung.innerHTML = `<div class="muc text-center">
        <p>Gõ tên truyện, nhân vật, thế lực, pháp bảo hay thuật ngữ. Gõ không dấu cũng được, ví dụ <b>han lap</b>.</p>
        <div class="flex flex-wrap justify-center gap-2 mt-4">${goiY.map((g) => `<button type="button" class="tk-chip" data-goi-y="${esc(g)}">${esc(g)}</button>`).join('')}</div></div>`;
      vung.querySelectorAll('[data-goi-y]').forEach((b) => { b.onclick = () => datTuKhoa(b.dataset.goiY); });
      UI.refresh();
      return;
    }
    const kq = tim(tuKhoa);
    const theoNhom = NHOM.map((n) => ({ ...n, ds: kq.filter((m) => m.loai === n.k) })).filter((n) => n.ds.length);
    if (loaiChon && !theoNhom.some((n) => n.k === loaiChon)) loaiChon = '';
    loc.innerHTML = theoNhom.length > 1 ? [{ k: '', ten: 'Tất cả', ds: kq }, ...theoNhom].map((n) =>
      `<button type="button" class="tk-chip" aria-pressed="${loaiChon === n.k}" data-loai="${n.k}">${esc(n.ten)} <span class="opacity-70">(${n.ds.length})</span></button>`).join('') : '';
    loc.querySelectorAll('[data-loai]').forEach((b) => { b.onclick = () => { loaiChon = b.dataset.loai; capNhatUrl(); veKetQua(); }; });

    if (!kq.length) {
      vung.innerHTML = `<div class="muc text-center" id="tk-rong">
        ${icon('search-x', 'w-10 h-10 mx-auto opacity-60')}
        <p class="mt-3">Không tìm thấy kết quả cho <b>“${esc(tuKhoa)}”</b>.</p>
        <p class="opacity-80 mt-1">Thử gõ ngắn hơn, kiểm tra chính tả, hoặc xem các truyện được đề cử.</p>
        <div class="flex flex-wrap justify-center gap-3 mt-5">
          <a class="btn btn-primary tk-nut" href="${DB.ROOT}de-cu.html">${icon('award')} Xem trang Đề cử</a>
          <a class="btn btn-outline tk-nut" href="${LINK.list()}">${icon('library')} Tất cả review</a>
        </div></div>`;
      UI.refresh();
      return;
    }
    vung.innerHTML = `<p class="text-sm opacity-80 mb-4" role="status">Tìm thấy ${kq.length} kết quả cho “${esc(tuKhoa)}”.</p>` +
      theoNhom.filter((n) => !loaiChon || n.k === loaiChon).map((n) => `<section class="muc" data-nhom="${n.k}">
        <h2>${icon(n.ic, 'w-5 h-5')}${esc(n.ten)} <span class="text-base opacity-70">(${n.ds.length})</span></h2>
        <ul class="tk-ds">${n.ds.slice(0, TOI_DA).map(theKetQua).join('')}</ul>
        ${n.ds.length > TOI_DA ? `<p class="text-sm opacity-70 mt-2">Còn ${n.ds.length - TOI_DA} kết quả khác, hãy gõ cụ thể hơn.</p>` : ''}
      </section>`).join('');
    UI.refresh();
  }

  function capNhatUrl() {
    const p = new URLSearchParams();
    if (tuKhoa.trim()) p.set('q', tuKhoa.trim());
    if (loaiChon) p.set('loai', loaiChon);
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
    UI.setMeta({ title: tuKhoa.trim() ? `Tìm “${tuKhoa.trim()}”` : 'Tìm kiếm', description: 'Tìm truyện, nhân vật, thế lực, vật phẩm, thuật ngữ trên ' + DB.getSettings().ten_web + '.' });
  }

  function datTuKhoa(v) {
    tuKhoa = v; loaiChon = '';
    const o = document.getElementById('tk-o');
    if (o) o.value = v;
    capNhatUrl(); veKetQua();
  }

  function ve() {
    lapChiMuc();
    document.getElementById('noi-dung').innerHTML = `<div class="khung py-8">
      ${breadcrumb([{ ten: 'Trang chủ', href: LINK.home() }, { ten: 'Tìm kiếm' }])}
      <h1 class="text-3xl font-bold mt-3 mb-5">Tìm kiếm</h1>
      <form id="tk-form" role="search" class="mb-4" onsubmit="return false">
        <label for="tk-o" class="block font-semibold mb-2">Từ khóa</label>
        <div class="tk-o-khung">${icon('search', 'w-5 h-5 opacity-70 shrink-0')}
          <input id="tk-o" type="search" name="q" autocomplete="off" placeholder="Ví dụ: han lap, binh nho, truc co…" value="${esc(tuKhoa)}">
        </div>
      </form>
      <div id="tk-loc" class="flex flex-wrap gap-2 mb-5" aria-label="Lọc theo loại"></div>
      <div id="tk-ket-qua"></div>
    </div>`;
    let hen = null;
    document.getElementById('tk-o').addEventListener('input', (e) => {
      clearTimeout(hen);
      hen = setTimeout(() => { tuKhoa = e.target.value; capNhatUrl(); veKetQua(); }, 200);
    });
    capNhatUrl();
    veKetQua();
    if (!tuKhoa) document.getElementById('tk-o').focus();
  }

  document.getElementById('noi-dung').innerHTML = `<div class="khung py-8"><div class="cho h-8 w-1/3"></div><div class="cho h-12 mt-6"></div><div class="cho h-48 mt-6"></div></div>`;
  UI.khoiDong(ve);
})();
