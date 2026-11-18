/* Trang Đề cử: de-cu.html (?loai=&the_loai=&tinh_trang=&diem=)
   - "Người mới nên bắt đầu": dòng DeCu không có neu_thich_id, theo thu_tu
   - "Nếu thích X thì đọc Y": dòng DeCu có neu_thich_id (X) → tac_pham_id (Y), kèm lý do
   - "Tất cả tác phẩm phù hợp": lưới thẻ theo bộ lọc */
(function () {
  const { esc, num, boDau } = DB;
  const { icon, workCard, luoi, breadcrumb, trong, nhan, LINK, anh, nhanLoai } = UI;
  const q = new URLSearchParams(location.search);
  const LOC = { loai: q.get('loai') || '', the_loai: q.get('the_loai') || '', tinh_trang: q.get('tinh_trang') || '', diem: q.get('diem') || '' };
  const chuan = (s) => boDau(s).toLowerCase().trim();

  function hopLoc(w) {
    if (!w) return false;
    if (LOC.loai && w.loai !== LOC.loai) return false;
    if (LOC.the_loai && !DB.getGenres(w).some((g) => chuan(g) === chuan(LOC.the_loai))) return false;
    if (LOC.tinh_trang && chuan(w.tinh_trang) !== chuan(LOC.tinh_trang)) return false;
    if (LOC.diem && (num(w.diem) ?? 0) < num(LOC.diem)) return false;
    return true;
  }
  const dangLoc = () => Object.values(LOC).some(Boolean);

  function oChon(id, ten, giaTri, cacLuaChon) {
    return `<label class="form-control flex flex-col gap-1 text-sm font-semibold">${esc(ten)}
      <select id="${id}" class="select bg-base-100 min-h-11 w-full sm:w-48">
        ${cacLuaChon.map(([v, t]) => `<option value="${esc(v)}" ${v === giaTri ? 'selected' : ''}>${esc(t)}</option>`).join('')}
      </select></label>`;
  }

  function theDeCu(r) {
    const w = r.tacPham;
    return `<article class="bac-the grid grid-cols-[96px_1fr] gap-4 items-start" data-aos="fade-up">
      <a href="${LINK.work(w.id)}" class="block rounded-lg overflow-hidden aspect-[2/3]">${anh(w.anh_bia, w.ten_viet, 'w-full h-full object-cover')}</a>
      <div class="min-w-0">
        <div class="flex flex-wrap gap-1 mb-1">${nhanLoai(w.loai)}${num(w.diem) != null ? `<span class="nhan nhan-vien">★ ${num(w.diem).toFixed(1)}</span>` : ''}</div>
        <h3 class="font-bold text-lg leading-snug"><a class="hover:text-primary" href="${LINK.work(w.id)}">${esc(w.ten_viet)}</a></h3>
        <p class="mt-2 leading-relaxed">${esc(r.ly_do)}</p>
        <a href="${LINK.work(w.id)}" class="btn btn-primary btn-sm min-h-11 mt-3">${icon('book-open')} Đọc review</a>
      </div></article>`;
  }

  function theNeuThich(r) {
    const x = DB.getWork(r.neu_thich_id), y = r.tacPham;
    const nho = (w) => `<a href="${LINK.work(w.id)}" class="flex flex-col items-center gap-2 text-center w-24 shrink-0 group">
      <span class="block w-24 aspect-[2/3] rounded-lg overflow-hidden border border-[var(--vien-vang)]">${anh(w.anh_bia, w.ten_viet, 'w-full h-full object-cover')}</span>
      <span class="text-sm font-semibold leading-snug group-hover:text-primary">${esc(w.ten_viet)}</span></a>`;
    return `<article class="bac-the" data-aos="fade-up">
      <p class="noi-dung font-semibold mb-3">Nếu bạn thích <a class="lien-ket" href="${LINK.work(x.id)}">${esc(x.ten_viet)}</a> thì đọc tiếp <a class="lien-ket" href="${LINK.work(y.id)}">${esc(y.ten_viet)}</a></p>
      <div class="flex items-center gap-3">${nho(x)}${icon('arrow-right', 'w-6 h-6 text-primary shrink-0')}${nho(y)}</div>
      ${r.ly_do ? `<p class="mt-3 leading-relaxed"><b class="text-primary">Vì sao:</b> ${esc(r.ly_do)}</p>` : ''}
    </article>`;
  }

  function ve() {
    UI.setMeta({ title: 'Đề Cử', description: 'Đề cử truyện Tu Tiên, Huyền Huyễn và Anime: cho người mới, theo thể loại, nếu thích truyện này thì đọc truyện nào tiếp.' });
    const tatCa = DB.getWorks();
    const deCu = DB.getRecommendations();
    const nguoiMoi = deCu.filter((r) => !r.neu_thich_id && hopLoc(r.tacPham));
    const neuThich = deCu.filter((r) => r.neu_thich_id && DB.getWork(r.neu_thich_id) && hopLoc(r.tacPham));
    const phuHop = tatCa.filter(hopLoc);

    const cacLoai = [...new Set(tatCa.map((w) => w.loai).filter(Boolean))];
    const cacTheLoai = [...new Set(tatCa.flatMap((w) => DB.getGenres(w)))].sort((a, b) => a.localeCompare(b, 'vi'));
    const cacTinhTrang = [...new Set(tatCa.map((w) => w.tinh_trang).filter(Boolean))];

    document.getElementById('noi-dung').innerHTML = `<div class="khung py-8">
      ${breadcrumb([{ ten: 'Trang chủ', href: LINK.home() }, { ten: 'Đề Cử' }])}
      <h1 class="text-3xl font-bold mt-3">Đề Cử</h1>
      <p class="mt-2 opacity-80 max-w-2xl leading-relaxed">Chưa biết đọc gì tiếp? Bắt đầu từ các bộ dành cho người mới, hoặc chọn theo bộ bạn đã thích.</p>

      <form id="bo-loc" class="flex flex-wrap gap-3 items-end mt-6 mb-8" aria-label="Bộ lọc đề cử">
        ${oChon('loc-loai', 'Loại', LOC.loai, [['', 'Tất cả'], ...cacLoai.map((l) => [l, nhan('loaiTacPham', l)])])}
        ${oChon('loc-the-loai', 'Thể loại', LOC.the_loai, [['', 'Mọi thể loại'], ...cacTheLoai.map((g) => [g, g])])}
        ${oChon('loc-tinh-trang', 'Tình trạng', LOC.tinh_trang, [['', 'Mọi tình trạng'], ...cacTinhTrang.map((t) => [t, t])])}
        ${oChon('loc-diem', 'Điểm từ', LOC.diem, [['', 'Mọi mức điểm'], ['7', 'Từ 7 điểm'], ['8', 'Từ 8 điểm'], ['9', 'Từ 9 điểm']])}
        ${dangLoc() ? `<a href="de-cu.html" class="btn btn-ghost min-h-11">${icon('x')} Bỏ lọc</a>` : ''}
      </form>

      <section class="muc" id="nguoi-moi"><h2>${icon('sprout', 'w-5 h-5')} Người mới nên bắt đầu</h2>
        ${nguoiMoi.length ? `<div class="grid md:grid-cols-2 gap-4">${nguoiMoi.map(theDeCu).join('')}</div>`
          : trong(dangLoc() ? 'Không có đề cử cho người mới khớp bộ lọc. Thử bỏ bớt điều kiện.' : 'Chưa có đề cử. Thêm dòng vào tab DeCu (để trống neu_thich_id).')}
      </section>

      ${neuThich.length || !dangLoc() ? `<section class="muc" id="neu-thich"><h2>${icon('git-branch', 'w-5 h-5')} Nếu thích bộ này thì đọc bộ nào</h2>
        ${neuThich.length ? `<div class="grid md:grid-cols-2 gap-4">${neuThich.map(theNeuThich).join('')}</div>`
          : trong('Chưa có gợi ý. Thêm dòng vào tab DeCu và điền neu_thich_id là id bộ người đọc đã thích.')}
      </section>` : ''}

      <section class="muc" id="phu-hop"><h2>${icon('library', 'w-5 h-5')} ${dangLoc() ? 'Tác phẩm khớp bộ lọc' : 'Tất cả tác phẩm'} <span class="opacity-60 text-base font-normal">(${phuHop.length})</span></h2>
        ${phuHop.length ? luoi(phuHop.map(workCard).join('')) : trong('Không có tác phẩm nào khớp bộ lọc. Thử bỏ bớt điều kiện.')}
      </section>
    </div>`;

    // Đổi bộ lọc → cập nhật URL (chia sẻ được) và vẽ lại
    const dongBo = () => {
      LOC.loai = document.getElementById('loc-loai').value;
      LOC.the_loai = document.getElementById('loc-the-loai').value;
      LOC.tinh_trang = document.getElementById('loc-tinh-trang').value;
      LOC.diem = document.getElementById('loc-diem').value;
      const u = new URLSearchParams(Object.entries(LOC).filter(([, v]) => v));
      history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
      ve(); UI.refresh();
    };
    document.querySelectorAll('#bo-loc select').forEach((s) => { s.onchange = dongBo; });
    document.getElementById('bo-loc').onsubmit = (e) => e.preventDefault();
  }

  document.getElementById('noi-dung').innerHTML = `<div class="khung py-8">${UI.khungCho(4)}</div>`;
  UI.khoiDong(ve);
})();
