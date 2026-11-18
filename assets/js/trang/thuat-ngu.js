/* Trang Thuật ngữ: từ điển tu tiên A–Z
   - thuat-ngu.html                 → toàn bộ thuật ngữ, nhóm theo chữ cái đầu (bỏ dấu)
   - thuat-ngu.html?q=linh+can      → lọc sẵn theo từ khoá (gõ không dấu vẫn ra)
   - thuat-ngu.html?tac_pham=<id>   → chỉ thuật ngữ chung + thuật ngữ của tác phẩm đó
   - thuat-ngu.html#linh-can        → nhảy tới đúng thuật ngữ (mỗi thuật ngữ có neo #id) */
(function () {
  const { esc, boDau, paragraphs } = DB;
  const { icon, breadcrumb, LINK } = UI;
  const q = new URLSearchParams(location.search);
  const CHU_CAI = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const chuan = (s) => boDau(s).toLowerCase().replace(/\s+/g, ' ').trim();
  const chuDau = (ten) => { const c = boDau(ten).trim().charAt(0).toUpperCase(); return /[A-Z]/.test(c) ? c : '#'; };

  let tatCa = [];

  function loc() {
    const tu = chuan(document.getElementById('tim-tn').value);
    const tp = document.getElementById('loc-tp').value;
    const cacTu = tu ? tu.split(' ') : [];
    return tatCa.filter((t) => {
      if (tp && t.tac_pham_id && t.tac_pham_id !== tp) return false;
      if (!cacTu.length) return true;
      const noi = chuan(t.ten + ' ' + t.giai_thich);
      return cacTu.every((x) => noi.includes(x));
    });
  }

  function capNhatUrl() {
    const u = new URL(location.href);
    const tu = document.getElementById('tim-tn').value.trim();
    const tp = document.getElementById('loc-tp').value;
    tu ? u.searchParams.set('q', tu) : u.searchParams.delete('q');
    tp ? u.searchParams.set('tac_pham', tp) : u.searchParams.delete('tac_pham');
    history.replaceState(null, '', u);
  }

  function veDanhSach() {
    const ds = loc();
    const nhom = {};
    ds.forEach((t) => (nhom[chuDau(t.ten)] = nhom[chuDau(t.ten)] || []).push(t));
    const coChu = [...CHU_CAI, '#'].filter((c) => nhom[c]);

    // Thanh chữ cái: chữ có thuật ngữ thì bấm được, chữ không có thì mờ
    document.getElementById('thanh-chu-cai').innerHTML = [...CHU_CAI, '#'].map((c) => nhom[c]
      ? `<a href="#chu-${c === '#' ? 'khac' : c}" class="chu-cai" aria-label="Thuật ngữ bắt đầu bằng ${c}">${c}</a>`
      : `<span class="chu-cai tat" aria-hidden="true">${c}</span>`).join('');

    document.getElementById('so-tn').textContent = `${ds.length} / ${tatCa.length} thuật ngữ`;

    const tu = document.getElementById('tim-tn').value.trim();
    document.getElementById('ds-tn').innerHTML = ds.length ? coChu.map((c) => `
      <section id="chu-${c === '#' ? 'khac' : c}" class="nhom-chu">
        <h2 class="text-2xl font-bold text-primary font-tieu-de mb-3">${c}</h2>
        <div class="grid gap-3 md:grid-cols-2">${nhom[c].map((t) => {
          const w = t.tac_pham_id ? DB.getWork(t.tac_pham_id) : null;
          return `<article id="${esc(t.id)}" class="muc !mt-0 thuat-ngu">
            <h3 class="text-lg font-bold flex flex-wrap items-center gap-2">
              <a href="#${esc(t.id)}" class="hover:text-primary">${esc(t.ten)}</a>
              ${w ? `<a href="${LINK.work(w.id)}" class="nhan nhan-tu-tien">${esc(w.ten_viet)}</a>` : '<span class="nhan nhan-vien">Dùng chung</span>'}
            </h3>
            <div class="noi-dung mt-2">${paragraphs(t.giai_thich)}</div>
          </article>`;
        }).join('')}</div>
      </section>`).join('')
      : `<div class="text-center py-10">${icon('search-x', 'w-10 h-10 mx-auto opacity-60')}
          <p class="mt-3 font-semibold">${tatCa.length ? `Không tìm thấy thuật ngữ nào khớp “${esc(tu)}”.` : 'Chưa có thuật ngữ nào.'}</p>
          <p class="opacity-80 mt-1">${tatCa.length ? 'Thử gõ ngắn hơn, bỏ dấu, hoặc chọn “Mọi tác phẩm”.' : 'Thêm dòng vào tab ThuatNgu trong Google Sheet.'}</p>
          ${tatCa.length ? '<button id="xoa-loc" class="btn btn-primary mt-4">Xoá bộ lọc</button>' : ''}</div>`;
    const xoa = document.getElementById('xoa-loc');
    if (xoa) xoa.onclick = () => { document.getElementById('tim-tn').value = ''; document.getElementById('loc-tp').value = ''; capNhatUrl(); veDanhSach(); };
    UI.refresh();
  }

  function ve() {
    UI.setMeta({ title: 'Thuật Ngữ', description: 'Từ điển thuật ngữ tu tiên, huyền huyễn A–Z: linh căn, đạo lữ, động phủ, đoạt xá…' });
    tatCa = DB.getTerms();
    const tacPham = DB.getWorks().filter((w) => tatCa.some((t) => t.tac_pham_id === w.id));
    const chonTp = q.get('tac_pham') || '';

    document.getElementById('noi-dung').innerHTML = `<div class="khung py-8">
      ${breadcrumb([{ ten: 'Trang chủ', href: LINK.home() }, { ten: 'Thuật Ngữ' }])}
      <h1 class="text-3xl font-bold mt-3">Thuật Ngữ</h1>
      <p class="opacity-80 mt-2 max-w-[70ch]">Từ điển các khái niệm hay gặp trong truyện tu tiên, huyền huyễn. Gõ không dấu vẫn tìm được, ví dụ “linh can”.</p>
      <div class="flex flex-wrap gap-3 items-end mt-5">
        <label class="form-control w-full sm:w-80">
          <span class="text-sm font-semibold mb-1 block">Tìm thuật ngữ</span>
          <span class="input w-full bg-base-100 min-h-11">${icon('search', 'w-4 h-4 opacity-60')}
            <input id="tim-tn" type="search" placeholder="Ví dụ: linh can" value="${esc(q.get('q') || '')}" autocomplete="off"></span>
        </label>
        ${tacPham.length ? `<label class="form-control">
          <span class="text-sm font-semibold mb-1 block">Tác phẩm</span>
          <select id="loc-tp" class="select bg-base-100 min-h-11"><option value="">Mọi tác phẩm</option>
            ${tacPham.map((w) => `<option value="${esc(w.id)}" ${w.id === chonTp ? 'selected' : ''}>${esc(w.ten_viet)}</option>`).join('')}</select>
        </label>` : '<select id="loc-tp" class="hidden" aria-hidden="true"><option value=""></option></select>'}
        <span id="so-tn" class="text-sm opacity-70 pb-3"></span>
      </div>
      <nav id="thanh-chu-cai" class="thanh-chu-cai mt-5" aria-label="Nhảy tới chữ cái"></nav>
      <div id="ds-tn" class="mt-6 space-y-8"></div>
    </div>`;

    const o = document.getElementById('tim-tn');
    let hen;
    o.addEventListener('input', () => { clearTimeout(hen); hen = setTimeout(() => { capNhatUrl(); veDanhSach(); }, 120); });
    document.getElementById('loc-tp').onchange = () => { capNhatUrl(); veDanhSach(); };
    veDanhSach();
  }

  document.getElementById('noi-dung').innerHTML = `<div class="khung py-8"><div class="cho h-8 w-1/3"></div><div class="cho h-12 mt-6"></div>
    <div class="grid md:grid-cols-2 gap-3 mt-6"><div class="cho h-28"></div><div class="cho h-28"></div><div class="cho h-28"></div><div class="cho h-28"></div></div></div>`;
  UI.khoiDong(ve);
})();
