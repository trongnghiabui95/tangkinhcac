/* Danh sách tác phẩm: danh-sach.html?loai=tu-tien | ?loai=anime | ?the_loai=Tu Tiên */
(function () {
  const { esc } = DB;
  const { luoi, workCard, breadcrumb, trong, LINK, nhan } = UI;
  const q = new URLSearchParams(location.search);
  const loai = q.get('loai') || '', theLoai = q.get('the_loai') || '';

  function ve() {
    const ten = theLoai ? 'Thể loại: ' + theLoai : loai ? 'Review ' + (loai === 'anime' ? 'Anime' : 'Truyện ' + nhan('loaiTacPham', loai)) : 'Tất cả review';
    UI.setMeta({ title: ten, description: ten + ' – danh sách bài review trên ' + DB.getSettings().ten_web });
    let ds = theLoai ? DB.getWorksByGenre(theLoai) : DB.getWorks(loai);
    const sapXep = (kieu) => {
      const a = ds.slice();
      if (kieu === 'diem') a.sort((x, y) => (DB.num(y.diem) || 0) - (DB.num(x.diem) || 0));
      if (kieu === 'ten') a.sort((x, y) => x.ten_viet.localeCompare(y.ten_viet, 'vi'));
      return a;
    };
    document.getElementById('noi-dung').innerHTML = `<div class="khung py-8">
      ${breadcrumb([{ ten: 'Trang chủ', href: LINK.home() }, { ten }])}
      <div class="flex flex-wrap items-end justify-between gap-3 mt-3 mb-6">
        <h1 class="text-3xl font-bold">${esc(ten)} <span class="text-base opacity-60">(${ds.length})</span></h1>
        <select id="sap-xep" class="select select-sm w-auto bg-base-100">
          <option value="moi">Mới nhất</option><option value="diem">Điểm cao nhất</option><option value="ten">Tên A–Z</option></select>
      </div><div id="luoi-tp"></div></div>`;
    const veLuoi = () => {
      const a = sapXep(document.getElementById('sap-xep').value);
      document.getElementById('luoi-tp').innerHTML = a.length ? luoi(a.map(workCard).join('')) : trong('Chưa có bài review nào ở mục này.');
      UI.refresh();
    };
    document.getElementById('sap-xep').onchange = veLuoi;
    veLuoi();
  }
  document.getElementById('noi-dung').innerHTML = `<div class="khung py-8">${UI.khungCho(5)}</div>`;
  UI.khoiDong(ve);
})();
