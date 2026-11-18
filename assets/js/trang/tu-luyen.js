/* Trang Hệ Thống Tu Luyện: tu-luyen.html (?tac_pham=id1,id2,id3)
   - Chọn 0–1 tác phẩm: mỗi tác phẩm 1 khối (loại tu luyện + bậc thang cảnh giới)
   - Chọn 2–3 tác phẩm: bảng so sánh các cảnh giới song song theo bậc
   Bấm một cảnh giới để xem mô tả và các nhân vật đang ở cảnh giới đó. */
(function () {
  const { esc, ids, paragraphs } = DB;
  const { icon, chip, breadcrumb, LINK, nhanLoai } = UI;
  const TOI_DA = 3;

  // Tác phẩm có ít nhất 1 cảnh giới hoặc 1 loại tu luyện
  const coHeThong = () => DB.getWorks().filter((w) => DB.getLevels(w.id).length || DB.getCultivationTypes(w.id).length);

  function dangChon(tatCa) {
    const hopLe = new Set(tatCa.map((w) => w.id));
    return ids(new URLSearchParams(location.search).get('tac_pham')).filter((id) => hopLe.has(id)).slice(0, TOI_DA);
  }
  function ghiUrl(chon) {
    const q = new URLSearchParams(location.search);
    if (chon.length) q.set('tac_pham', chon.join(',')); else q.delete('tac_pham');
    const s = q.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
  }

  /* -------------------------------------------------------------- chi tiết 1 cảnh giới */
  function chiTiet(l) {
    const nv = DB.getCharactersByLevel(l.id);
    return `<div class="noi-dung text-sm mt-2">${paragraphs(l.mo_ta) || '<p class="opacity-70">Chưa có mô tả cho cảnh giới này.</p>'}</div>
      <div class="mt-3 flex flex-wrap gap-2 items-center">
        <span class="text-sm opacity-70">Nhân vật đang ở cảnh giới này:</span>
        ${nv.length ? nv.map(chip).join('') : '<span class="text-sm opacity-70">chưa có</span>'}
      </div>`;
  }

  /* -------------------------------------------------------------- chế độ khối (0–1 tác phẩm) */
  function khoi(w) {
    const loai = DB.getCultivationTypes(w.id), cap = DB.getLevels(w.id);
    return `<section class="muc" aria-labelledby="tp-${esc(w.id)}">
      <h2 id="tp-${esc(w.id)}">${icon('mountain', 'w-5 h-5')}<a class="hover:underline" href="${LINK.work(w.id, 'cap-do')}">${esc(w.ten_viet)}</a></h2>
      <div class="flex flex-wrap gap-2 mb-4">${nhanLoai(w.loai)}<span class="text-sm opacity-70">${cap.length} cảnh giới · ${loai.length} loại tu luyện</span></div>
      ${loai.length ? `<h3 class="font-bold mb-2">Các loại tu luyện</h3>
        <div class="grid sm:grid-cols-2 gap-3 mb-5">${loai.map((t) => `<div class="bac-the"><div class="font-bold flex items-center gap-2">${icon('flame', 'w-4 h-4 text-secondary')}${esc(t.ten)}</div>
          <div class="noi-dung text-sm mt-1">${paragraphs(t.mo_ta)}</div></div>`).join('')}</div>` : ''}
      ${cap.length ? `<h3 class="font-bold mb-3">Cảnh giới từ thấp đến cao</h3>
        <div class="bac-thang">${cap.map((l, i) => `<div class="bac" id="cap-do-${esc(l.id)}">
          <div class="bac-so">${i + 1}</div>
          <details class="bac-the tl-mo" data-cap="${esc(l.id)}">
            <summary class="tl-tom-tat"><span class="font-bold text-lg">${esc(l.ten)}</span>
              <span class="text-sm opacity-70 ml-auto">${DB.getCharactersByLevel(l.id).length} nhân vật</span>${icon('chevron-down', 'w-4 h-4 tl-mui')}</summary>
            ${chiTiet(l)}
          </details></div>`).join('')}</div>` : '<p class="opacity-70">Tác phẩm này chưa có cảnh giới. Thêm dòng vào tab CapDo trong Google Sheet.</p>'}
    </section>`;
  }

  /* -------------------------------------------------------------- chế độ so sánh (2–3 tác phẩm) */
  function soSanh(ds) {
    const cot = ds.map((w) => DB.getLevels(w.id));
    const soBac = Math.max(0, ...cot.map((c) => c.length));
    const o = (l) => l ? `<button type="button" class="tl-o" id="cap-do-${esc(l.id)}" data-cap="${esc(l.id)}" aria-controls="tl-chi-tiet">${esc(l.ten)}</button>`
      : '<span class="tl-o tl-o-trong" aria-label="Không có cảnh giới ở bậc này">—</span>';
    return `<section class="muc">
      <h2>${icon('columns-3', 'w-5 h-5')}So sánh cảnh giới theo bậc</h2>
      <p class="text-sm opacity-80 mb-3">Mỗi cột là một tác phẩm, mỗi hàng là một bậc (theo cột <code>thu_tu</code>). Các hệ cảnh giới khác nhau nên cùng bậc chỉ để tham khảo. Bấm một cảnh giới để xem chi tiết.</p>
      <div class="tl-khung-cuon" tabindex="0" role="region" aria-label="Bảng so sánh cảnh giới (vuốt ngang nếu cần)">
        <table class="tl-bang" style="--so-cot:${ds.length}">
          <thead><tr><th scope="col" class="tl-bac">Bậc</th>${ds.map((w) => `<th scope="col"><a href="${LINK.work(w.id, 'cap-do')}">${esc(w.ten_viet)}</a></th>`).join('')}</tr></thead>
          <tbody>${Array.from({ length: soBac }, (_, i) => `<tr><th scope="row" class="tl-bac">${i + 1}</th>${cot.map((c) => `<td>${o(c[i])}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
      <div id="tl-chi-tiet" class="bac-the mt-4" aria-live="polite"><p class="text-sm opacity-80">Chọn một cảnh giới trong bảng để xem mô tả và nhân vật.</p></div>
    </section>`;
  }
  function moChiTiet(id) {
    const l = DB.getLevel(id), hop = document.getElementById('tl-chi-tiet');
    if (!l || !hop) return;
    const w = DB.getWork(l.tac_pham_id);
    document.querySelectorAll('.tl-o[data-cap]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cap === id)));
    hop.innerHTML = `<div class="font-bold text-lg">${esc(l.ten)} <span class="text-sm font-normal opacity-70">· ${esc(w ? w.ten_viet : '')}, bậc ${esc(l.thu_tu)}</span></div>${chiTiet(l)}`;
    UI.refresh();
  }

  /* -------------------------------------------------------------- vẽ trang */
  function ve() {
    UI.setMeta({ title: 'Hệ Thống Tu Luyện', description: 'Các loại tu luyện và cảnh giới từ thấp đến cao trong từng truyện, so sánh hệ cảnh giới giữa các truyện.' });
    const tatCa = coHeThong();
    const chon = dangChon(tatCa);
    const hien = chon.length ? chon.map(DB.getWork) : tatCa;
    const main = document.getElementById('noi-dung');
    main.innerHTML = `<div class="khung py-8">
      ${breadcrumb([{ ten: 'Trang chủ', href: LINK.home() }, { ten: 'Hệ Thống Tu Luyện' }])}
      <h1 class="text-3xl font-bold mt-3">Hệ Thống Tu Luyện</h1>
      <p class="opacity-80 mt-2 max-w-3xl">Xem các loại tu luyện và bậc thang cảnh giới của từng truyện. Chọn 2–3 truyện để so sánh cảnh giới song song.</p>
      ${tatCa.length ? `<fieldset class="mt-5">
        <legend class="font-semibold mb-2">Chọn tác phẩm <span class="text-sm font-normal opacity-70">(tối đa ${TOI_DA})</span></legend>
        <div class="flex flex-wrap gap-2">${tatCa.map((w) => `<label class="tl-chon"><input type="checkbox" class="checkbox checkbox-sm checkbox-primary" value="${esc(w.id)}" ${chon.includes(w.id) ? 'checked' : ''}>
          <span>${esc(w.ten_viet)}</span></label>`).join('')}</div>
        <p id="tl-bao" class="text-sm mt-2 opacity-80" aria-live="polite"></p>
      </fieldset>
      <div class="mt-6">${hien.length >= 2 ? soSanh(hien) : hien.map(khoi).join('')}</div>`
      : `<div class="text-center py-12 opacity-80">${icon('mountain', 'w-10 h-10 mx-auto mb-2')}<p>Chưa có hệ thống tu luyện nào. Hãy thêm dòng vào tab <b>CapDo</b> và <b>LoaiTuLuyen</b> trong Google Sheet.</p></div>`}
    </div>`;

    // Chọn tác phẩm → cập nhật URL rồi vẽ lại
    main.querySelectorAll('.tl-chon input').forEach((cb) => cb.addEventListener('change', () => {
      const moi = [...main.querySelectorAll('.tl-chon input:checked')].map((x) => x.value);
      if (moi.length > TOI_DA) { cb.checked = false; document.getElementById('tl-bao').textContent = `Chỉ so sánh được tối đa ${TOI_DA} tác phẩm.`; return; }
      ghiUrl(moi); ve(); UI.refresh();
    }));
    main.querySelectorAll('.tl-o[data-cap]').forEach((b) => b.addEventListener('click', () => moChiTiet(b.dataset.cap)));

    // Neo #cap-do-<id>: mở đúng cảnh giới
    const neo = decodeURIComponent(location.hash.slice(1));
    if (neo.startsWith('cap-do-')) {
      const id = neo.slice(7);
      const d = main.querySelector(`details[data-cap="${CSS.escape(id)}"]`);
      if (d) d.open = true;
      if (main.querySelector(`.tl-o[data-cap="${CSS.escape(id)}"]`)) moChiTiet(id);
    }
  }

  document.getElementById('noi-dung').innerHTML = `<div class="khung py-8"><div class="cho h-8 w-1/2"></div><div class="cho h-64 mt-6"></div></div>`;
  UI.khoiDong(ve);
})();
