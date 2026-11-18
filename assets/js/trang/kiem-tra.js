/* Trang kiem-tra.html (ẩn, không có trên menu): liệt kê lỗi dữ liệu trong Google Sheet
   để người kiểm (Checker) và chủ dự án biết dòng nào cần sửa. Đọc DB.tablesGoc (đủ mọi dòng, kể cả nháp). */
(function () {
  const { esc, ids, boDau, img, imgAlt } = DB;
  const { icon, breadcrumb, LINK } = UI;

  // Cột bắt buộc của từng tab (thiếu cột ở dòng tiêu đề = lỗi; ô trống ở dòng có nội dung = lỗi)
  const BAT_BUOC = {
    TacPham: ['id', 'loai', 'ten_viet'], NhanVat: ['id', 'tac_pham_id', 'ten', 'vai_tro'],
    AnhTruyen: ['tac_pham_id', 'link_anh'], CuocDoi: ['nhan_vat_id', 'giai_doan'],
    QuanHe: ['nhan_vat_id', 'lien_quan_id', 'quan_he'], TheLuc: ['id', 'tac_pham_id', 'ten'],
    LoaiTuLuyen: ['id', 'tac_pham_id', 'ten'], CapDo: ['id', 'tac_pham_id', 'thu_tu', 'ten'],
    VatPham: ['id', 'tac_pham_id', 'ten'], DiaDiem: ['id', 'tac_pham_id', 'ten'],
    HanhTrinh: ['tac_pham_id', 'su_kien'], ThuatNgu: ['id', 'ten', 'giai_thich'], DeCu: ['tac_pham_id'],
    CaiDat: ['ten_web'],
  };
  // Cột liên kết → tab đích (cột đuôi _id / _ids)
  const DICH = {
    tac_pham_id: 'TacPham', nhan_vat_id: 'NhanVat', lien_quan_id: 'NhanVat', thu_linh_id: 'NhanVat', chu_so_huu_id: 'NhanVat',
    the_luc_ids: 'TheLuc', loai_tu_luyen_ids: 'LoaiTuLuyen', cap_do_id: 'CapDo', vat_pham_ids: 'VatPham',
    dia_diem_id: 'DiaDiem', tru_so_id: 'DiaDiem', thuoc_id: 'DiaDiem',
    neu_thich_id: 'TacPham',
  };
  // Cột ảnh: [tab, cột, bắt buộc?]
  const ANH = [['TacPham', 'anh_bia', true], ['NhanVat', 'anh', true], ['AnhTruyen', 'link_anh', true],
    ['TheLuc', 'logo', false], ['VatPham', 'anh', false], ['DiaDiem', 'anh_ban_do', false], ['CaiDat', 'logo', false]];
  const GIA_TRI = {
    'TacPham.loai': ['tu-tien', 'anime', 'donghua'], 'NhanVat.vai_tro': ['chinh', 'phu', 'lien-quan', 'phan-dien'],
    'QuanHe.quan_he': ['dao-lu', 'vo', 'chong', 'su-phu', 'do-de', 'gia-dinh', 'ban', 'ke-thu'],
  };
  const ID_CHUAN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const goiYId = (v) => boDau(v).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  /* -------------------------------------------------------------- dò lỗi */
  function doLoi(goc) {
    const loi = [];
    const them = (tab, r, cot, giaTri, loai, goiY) => loi.push({
      tab, dong: r ? r._dong : 1, cot, giaTri: giaTri == null ? '' : String(giaTri), loai, goiY,
      trangThai: r && DB.laNhap(r) ? 'nháp' : 'duyệt',
    });
    const idCua = {};
    DB.TABS.forEach((t) => { idCua[t] = new Set((goc[t] || []).map((r) => r.id).filter(Boolean)); });

    DB.TABS.forEach((tab) => {
      const rows = goc[tab] || [];
      if (!rows.length) return;
      const cotCo = new Set(rows.flatMap((r) => Object.keys(r)));
      // 1. Thiếu cột bắt buộc ở dòng tiêu đề
      (BAT_BUOC[tab] || []).forEach((c) => {
        if (!cotCo.has(c)) them(tab, null, c, '', 'Thiếu cột bắt buộc', `Thêm cột "${c}" vào dòng 1 của tab ${tab}.`);
      });
      const daGap = new Map();
      rows.forEach((r) => {
        // 2. Ô bắt buộc để trống
        (BAT_BUOC[tab] || []).forEach((c) => {
          if (cotCo.has(c) && !r[c]) them(tab, r, c, '', 'Thiếu dữ liệu bắt buộc', `Điền "${c}" cho dòng này.`);
        });
        // 3. id sai chuẩn / trùng
        if (r.id) {
          if (!ID_CHUAN.test(r.id)) them(tab, r, 'id', r.id, 'id sai chuẩn', `Viết thường, không dấu, nối bằng gạch ngang, ví dụ: ${goiYId(r.id) || 'ten-nhan-vat'}`);
          if (daGap.has(r.id)) them(tab, r, 'id', r.id, 'id bị trùng', `Trùng với dòng ${daGap.get(r.id)}. Đổi một trong hai id cho khác nhau.`);
          else daGap.set(r.id, r._dong);
        }
        // 4. Liên kết tới id không tồn tại
        Object.keys(r).forEach((c) => {
          if (!/_ids?$/.test(c) || !r[c] || c === 'id') return;
          const dich = DICH[c];
          if (!dich) return;
          ids(r[c]).forEach((v) => {
            if (!idCua[dich].has(v)) them(tab, r, c, v, 'Liên kết sai', `Không có id "${v}" trong tab ${dich}. Kiểm tra lỗi gõ hoặc thêm dòng đó vào ${dich}.`);
          });
        });
        // 5. Giá trị ngoài danh sách cho phép
        Object.entries(GIA_TRI).forEach(([k, ds]) => {
          const [t, c] = k.split('.');
          if (t === tab && r[c] && !ds.includes(r[c])) them(tab, r, c, r[c], 'Giá trị không hợp lệ', `Chỉ dùng: ${ds.join(', ')}.`);
        });
      });
    });
    // 6. Ảnh trống (cột bắt buộc) – ảnh hỏng được kiểm riêng vì phải tải thử
    ANH.forEach(([tab, cot, batBuoc]) => (goc[tab] || []).forEach((r) => {
      if (batBuoc && !r[cot] && !(BAT_BUOC[tab] || []).includes(cot)) them(tab, r, cot, '', 'Thiếu ảnh', 'Dán link ảnh Google Drive (đã chia sẻ "Bất kỳ ai có đường liên kết").');
    }));
    return loi;
  }

  // Tải thử từng ảnh (thử cả link dự phòng của Drive). Trả về danh sách lỗi ảnh hỏng.
  function taiThu(src, alt) {
    return new Promise((res) => {
      const im = new Image(); let xong = false;
      const ket = (ok) => { if (!xong) { xong = true; res(ok); } };
      im.onload = () => ket(true);
      im.onerror = () => { if (alt && im.src !== alt) im.src = alt; else ket(false); };
      setTimeout(() => ket(false), 15000);
      im.src = src;
    });
  }
  async function doAnhHong(goc) {
    const viec = [];
    ANH.forEach(([tab, cot]) => (goc[tab] || []).forEach((r) => {
      if (r[cot]) viec.push(taiThu(img(r[cot]), imgAlt(r[cot])).then((ok) => ok ? null : {
        tab, dong: r._dong, cot, giaTri: r[cot], loai: 'Ảnh không tải được',
        goiY: 'Kiểm tra link và quyền chia sẻ "Bất kỳ ai có đường liên kết" của ảnh/thư mục Drive.',
        trangThai: DB.laNhap(r) ? 'nháp' : 'duyệt',
      }));
    }));
    return (await Promise.all(viec)).filter(Boolean);
  }

  /* -------------------------------------------------------------- hiển thị */
  let tatCa = [];
  const locTab = () => document.getElementById('loc-tab').value;
  const locTT = () => document.getElementById('loc-tt').value;
  const daLoc = () => tatCa.filter((l) => (!locTab() || l.tab === locTab()) && (!locTT() || l.trangThai === locTT()));

  function veBang() {
    const ds = daLoc().sort((a, b) => DB.TABS.indexOf(a.tab) - DB.TABS.indexOf(b.tab) || a.dong - b.dong);
    document.getElementById('so-loi').textContent = ds.length;
    document.getElementById('bang-loi').innerHTML = ds.length ? `<div class="overflow-x-auto"><table class="table table-sm">
      <thead><tr><th>Tab</th><th>Dòng</th><th>Cột</th><th>Giá trị</th><th>Lỗi</th><th>Gợi ý sửa</th><th>Trạng thái</th></tr></thead>
      <tbody>${ds.map((l) => `<tr data-loi="${esc(l.loai)}">
        <td class="font-semibold">${esc(l.tab)}</td><td>${l.dong}</td><td><code>${esc(l.cot)}</code></td>
        <td class="max-w-[16rem] break-all">${l.giaTri ? `<code>${esc(l.giaTri)}</code>` : '<span class="opacity-50">(trống)</span>'}</td>
        <td><span class="badge badge-error badge-sm whitespace-nowrap">${esc(l.loai)}</span></td>
        <td class="text-sm">${esc(l.goiY)}</td><td>${esc(l.trangThai)}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="text-center py-10">${icon('circle-check', 'w-10 h-10 mx-auto text-success')}<p class="mt-2 font-semibold">Không có lỗi nào${locTab() || locTT() ? ' trong bộ lọc này' : ''}.</p></div>`;
    UI.refresh();
  }

  function taiCsv() {
    const dong = [['tab', 'dong', 'cot', 'gia_tri', 'loi', 'goi_y', 'trang_thai'],
      ...daLoc().map((l) => [l.tab, l.dong, l.cot, l.giaTri, l.loai, l.goiY, l.trangThai])];
    const csv = '﻿' + dong.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `loi-du-lieu-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  async function ve() {
    UI.setMeta({ title: 'Kiểm tra dữ liệu', description: 'Danh sách lỗi dữ liệu trong Google Sheet.' });
    const goc = DB.tablesGoc || DB.tables;
    tatCa = doLoi(goc);
    const tongDong = DB.TABS.reduce((s, t) => s + (goc[t] || []).length, 0);
    document.getElementById('noi-dung').innerHTML = `<div class="khung py-8">
      ${breadcrumb([{ ten: 'Trang chủ', href: LINK.home() }, { ten: 'Kiểm tra dữ liệu' }])}
      <h1 class="text-3xl font-bold mt-3">Kiểm tra dữ liệu</h1>
      <p class="opacity-80 mt-2">Đã đọc ${tongDong} dòng ở ${DB.TABS.length} tab (nguồn: ${esc(DB.source)}). Số dòng là số dòng trong Google Sheet (dòng 1 là tên cột).
        Sửa xong trong Sheet, chờ khoảng 5 phút rồi bấm <b>Tải lại dữ liệu</b>.</p>
      <div class="flex flex-wrap gap-3 items-center mt-5 mb-4">
        <select id="loc-tab" class="select select-sm w-auto bg-base-100" aria-label="Lọc theo tab"><option value="">Mọi tab</option>${DB.TABS.map((t) => `<option>${t}</option>`).join('')}</select>
        <select id="loc-tt" class="select select-sm w-auto bg-base-100" aria-label="Lọc theo trạng thái"><option value="">Nháp và duyệt</option><option value="duyệt">Chỉ đã duyệt</option><option value="nháp">Chỉ nháp</option></select>
        <a class="btn btn-sm btn-outline" href="?lammoi=1">${icon('refresh-cw')} Tải lại dữ liệu</a>
        <button id="tai-csv" class="btn btn-sm btn-primary">${icon('download')} Tải danh sách lỗi (CSV)</button>
      </div>
      <div class="muc"><h2>${icon('list-checks', 'w-5 h-5')} Lỗi tìm thấy: <span id="so-loi">…</span></h2>
        <p id="dang-thu-anh" class="text-sm opacity-70 mb-3">${icon('loader', 'w-4 h-4 inline animate-spin')} Đang tải thử từng ảnh…</p>
        <div id="bang-loi"></div></div>
    </div>`;
    document.getElementById('loc-tab').onchange = veBang;
    document.getElementById('loc-tt').onchange = veBang;
    document.getElementById('tai-csv').onclick = taiCsv;
    veBang();
    tatCa = tatCa.concat(await doAnhHong(goc));
    document.getElementById('dang-thu-anh').textContent = 'Đã tải thử xong mọi ảnh.';
    document.body.dataset.kiemTraXong = '1';
    veBang();
  }

  document.getElementById('noi-dung').innerHTML = `<div class="khung py-8"><div class="cho h-8 w-1/2"></div><div class="cho h-64 mt-6"></div></div>`;
  UI.khoiDong(ve);
})();
