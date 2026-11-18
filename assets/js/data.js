/* =====================================================================
   data.js – tải dữ liệu (bản sinh sẵn / Google Sheet / dữ liệu mẫu),
   lưu tạm trong trình duyệt và cung cấp các hàm tra cứu cho mọi trang.
   Dùng:  DB.load().then(() => { const tp = DB.getWork('pham-nhan-tu-tien'); ... })
   ===================================================================== */
(function () {
  'use strict';

  const TABS = ['TacPham', 'AnhTruyen', 'NhanVat', 'CuocDoi', 'QuanHe', 'TheLuc', 'LoaiTuLuyen',
    'CapDo', 'VatPham', 'DiaDiem', 'HanhTrinh', 'ThuatNgu', 'DeCu', 'CaiDat'];
  const CFG = window.CAU_HINH || {};
  // Đổi số phiên bản khi cấu trúc dữ liệu đổi → mọi trình duyệt tự bỏ bản lưu tạm cũ
  const KHOA_CACHE = 'tkc-du-lieu-v2';
  try { ['tkc-du-lieu-v1', 'tvt-du-lieu-v1'].forEach((k) => localStorage.removeItem(k)); } catch (e) { /* */ }

  // Thư mục gốc của web (tính từ vị trí file này: assets/js/data.js → ../../)
  const ROOT = new URL('../../', (document.currentScript && document.currentScript.src) || location.href).href;

  /* ------------------------------------------------------------ tiện ích */
  const str = (v) => (v == null ? '' : String(v)).trim();
  const ids = (v) => str(v).split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  const yes = (v) => ['có', 'co', 'x', 'yes', 'true', '1', 'y'].includes(str(v).toLowerCase());
  const num = (v) => { const n = parseFloat(str(v).replace(',', '.')); return isNaN(n) ? null : n; };
  const boDau = (s) => str(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  const esc = (s) => str(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lines = (v) => str(v).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const paragraphs = (v) => lines(v).map((l) => `<p>${esc(l)}</p>`).join('');

  function url(path) {
    path = str(path);
    if (!path) return '';
    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    return new URL(path.replace(/^\/+/, ''), ROOT).href;
  }

  // Lấy FILE_ID từ mọi kiểu link Google Drive
  function driveId(link) {
    const s = str(link);
    if (!/drive\.google\.com|docs\.google\.com|googleusercontent\.com/.test(s)) return null;
    const m = s.match(/\/d\/([\w-]{10,})/) || s.match(/[?&]id=([\w-]{10,})/);
    return m ? m[1] : null;
  }

  // Đổi link trong Sheet thành link ảnh hiển thị được
  function img(link) {
    const id = driveId(link);
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=${CFG.kichThuocAnhDrive || 'w1200'}`;
    return url(link) || url(CFG.anhDuPhong);
  }
  // Link dự phòng thứ 2 cho ảnh Drive (dùng khi link thumbnail lỗi)
  function imgAlt(link) {
    const id = driveId(link);
    return id ? `https://lh3.googleusercontent.com/d/${id}=w1200` : '';
  }
  const fallback = () => url(CFG.anhDuPhong);

  function youtubeIds(v) {
    return ids(v).map((s) => {
      const m = s.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
      return m ? m[1] : (/^[\w-]{11}$/.test(s) ? s : null);
    }).filter(Boolean);
  }

  function parseDate(v) {
    const s = str(v);
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    return null;
  }
  function formatDate(v) {
    const d = parseDate(v);
    if (!d) return str(v);
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  /* ------------------------------------------------------------ đọc dữ liệu */
  function parseCsv(text) {
    const res = Papa.parse(text, {
      header: true,
      skipEmptyLines: false,
      transformHeader: (h) => str(h).toLowerCase().replace(/^﻿/, ''),
    });
    return res.data
      .map((r, i) => { const o = {}; for (const k in r) if (k) o[k] = str(r[k]); o._dong = i + 2; return o; })
      .filter((r) => Object.entries(r).some(([k, v]) => k !== '_dong' && v));
  }

  async function fetchText(u) {
    const r = await fetch(u, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`Không tải được ${u} (mã ${r.status})`);
    return r.text();
  }

  async function taiTuSheet() {
    const links = CFG.sheetCsv || {};
    const out = {};
    await Promise.all(TABS.map(async (t) => {
      out[t] = links[t] ? parseCsv(await fetchText(links[t])) : [];
    }));
    return out;
  }

  async function taiMau() {
    const out = {};
    await Promise.all(TABS.map(async (t) => {
      try { out[t] = parseCsv(await fetchText(url(`data/mau/${t}.csv`))); } catch (e) { out[t] = []; }
    }));
    return out;
  }

  async function taiBanSinhSan() {
    const r = await fetch(url('data/db.json'), { cache: 'no-cache' });
    if (!r.ok) return null;
    const j = await r.json();
    return j && j.tables ? j.tables : null;
  }

  const DB = { tables: {}, source: '', loadedAt: 0 };
  let dangTai = null;

  DB.load = function () {
    if (dangTai) return dangTai;
    dangTai = (async () => {
      const q = new URLSearchParams(location.search);
      const lamMoi = q.has('lammoi');
      const coSheet = !!(CFG.sheetCsv && CFG.sheetCsv.TacPham);
      const chuKy = JSON.stringify(CFG.sheetCsv || {});
      let tables = null, source = '';

      // 1) Dữ liệu Google Sheet đã lưu tạm trong trình duyệt (chỉ lưu tạm Sheet vì Sheet tải chậm;
      //    dữ liệu mẫu và bản sinh sẵn là file tĩnh, luôn đọc mới để không bị dữ liệu/ảnh cũ)
      if (lamMoi) { try { localStorage.removeItem(KHOA_CACHE); } catch (e) { /* */ } }
      if (!lamMoi && coSheet) {
        try {
          const c = JSON.parse(localStorage.getItem(KHOA_CACHE) || 'null');
          if (c && c.chuKy === chuKy && Date.now() - c.t < (CFG.phutLuuTam || 30) * 60000) {
            tables = c.tables; source = c.source + ' (lưu tạm)';
          }
        } catch (e) { /* bỏ qua */ }
      }
      // 2) Bản sinh sẵn data/db.json (GitHub Actions)
      if (!tables && CFG.uuTienBanSinhSan !== false && q.get('nguon') !== 'sheet') {
        try { tables = await taiBanSinhSan(); if (tables) source = 'bản sinh sẵn'; } catch (e) { tables = null; }
      }
      // 3) Google Sheet  4) Dữ liệu mẫu
      if (!tables) {
        if (coSheet) { tables = await taiTuSheet(); source = 'Google Sheet'; }
        else { tables = await taiMau(); source = 'dữ liệu mẫu'; }
      }
      if (source === 'Google Sheet') {
        try { localStorage.setItem(KHOA_CACHE, JSON.stringify({ t: Date.now(), chuKy, source, tables })); } catch (e) { /* đầy bộ nhớ */ }
      }

      TABS.forEach((t) => { tables[t] = (tables[t] || []).map((r, i) => (r._dong ? r : { ...r, _dong: i + 2 })); });
      DB.tablesGoc = tables;            // đủ mọi dòng, kể cả nháp (dùng cho kiem-tra.html)
      DB.tables = locNhap(tables);      // web chỉ dùng dòng đã duyệt
      DB.source = source; DB.loadedAt = Date.now();
      lapChiMuc();
      return DB;
    })();
    return dangTai;
  };

  DB.clearCache = () => { try { localStorage.removeItem(KHOA_CACHE); } catch (e) { /* */ } };

  /* ------------------------------------------------------------ nháp / duyệt */
  // Cột trang_thai: "nháp" (có dấu hay không, hoa hay thường) thì ẩn khỏi web. Trống hoặc "duyệt" thì hiện.
  const laNhap = (r) => boDau(r && r.trang_thai).toLowerCase().replace(/\s+/g, '') === 'nhap';
  DB.laNhap = laNhap;
  function locNhap(goc) {
    const out = {};
    TABS.forEach((t) => { out[t] = (goc[t] || []).filter((r) => !laNhap(r)); });
    // Tác phẩm nháp → ẩn mọi thứ thuộc tác phẩm đó
    const tpAn = new Set((goc.TacPham || []).filter(laNhap).map((r) => r.id));
    const tpCon = new Set(out.TacPham.map((r) => r.id));
    TABS.forEach((t) => {
      if (t === 'TacPham' || t === 'CaiDat' || t === 'ThuatNgu') return;
      out[t] = out[t].filter((r) => !r.tac_pham_id || !tpAn.has(r.tac_pham_id));
    });
    out.ThuatNgu = out.ThuatNgu.filter((r) => !r.tac_pham_id || !tpAn.has(r.tac_pham_id));
    out.DeCu = out.DeCu.filter((r) => tpCon.has(r.tac_pham_id));
    // Nhân vật nháp/ẩn → ẩn cuộc đời, quan hệ, ảnh riêng của nhân vật đó
    const nvCon = new Set(out.NhanVat.map((r) => r.id));
    out.CuocDoi = out.CuocDoi.filter((r) => nvCon.has(r.nhan_vat_id));
    out.QuanHe = out.QuanHe.filter((r) => nvCon.has(r.nhan_vat_id) && nvCon.has(r.lien_quan_id));
    out.AnhTruyen = out.AnhTruyen.filter((r) => !r.nhan_vat_id || nvCon.has(r.nhan_vat_id));
    return out;
  }

  /* ------------------------------------------------------------ chỉ mục theo id */
  const idx = {};
  function lapChiMuc() {
    ['TacPham', 'NhanVat', 'TheLuc', 'LoaiTuLuyen', 'CapDo', 'VatPham', 'DiaDiem', 'ThuatNgu'].forEach((t) => {
      idx[t] = new Map();
      DB.tables[t].forEach((r) => { if (r.id && !idx[t].has(r.id)) idx[t].set(r.id, r); });
    });
  }
  const T = (t) => DB.tables[t] || [];
  const byThuTu = (a, b) => (num(a.thu_tu) ?? 999) - (num(b.thu_tu) ?? 999);

  /* ------------------------------------------------------------ TÁC PHẨM */
  DB.getWorks = (loai) => T('TacPham').filter((w) => !loai || w.loai === loai)
    .sort((a, b) => (parseDate(b.ngay_dang) || 0) - (parseDate(a.ngay_dang) || 0));
  DB.getWork = (id) => idx.TacPham.get(id) || null;
  DB.getFeaturedWorks = () => DB.getWorks().filter((w) => yes(w.noi_bat));
  DB.getGenres = (w) => ids(w && w.the_loai);
  DB.getWorksByGenre = (genre) => {
    const g = boDau(genre).toLowerCase();
    return DB.getWorks().filter((w) => DB.getGenres(w).some((x) => boDau(x).toLowerCase() === g));
  };
  DB.getSimilarWorks = (w, n = 6) => {
    const mine = DB.getGenres(w).map((x) => boDau(x).toLowerCase());
    return DB.getWorks().filter((o) => o.id !== w.id)
      .map((o) => ({ o, s: DB.getGenres(o).filter((x) => mine.includes(boDau(x).toLowerCase())).length + (o.loai === w.loai ? 0.5 : 0) }))
      .filter((x) => x.s >= 1).sort((a, b) => b.s - a.s).slice(0, n).map((x) => x.o);
  };
  DB.countArticles = (workId) => 1 + DB.getCharactersByWork(workId).length;

  /* ------------------------------------------------------------ NHÂN VẬT */
  DB.getCharacters = () => T('NhanVat');
  DB.getCharacter = (id) => idx.NhanVat.get(id) || null;
  DB.getCharactersByWork = (workId, vaiTro) => T('NhanVat').filter((c) => c.tac_pham_id === workId &&
    (!vaiTro || (Array.isArray(vaiTro) ? vaiTro.includes(c.vai_tro) : c.vai_tro === vaiTro)));
  DB.getFeaturedCharacters = () => T('NhanVat').filter((c) => yes(c.noi_bat));
  DB.getCharactersByLevel = (levelId) => T('NhanVat').filter((c) => c.cap_do_id === levelId);
  DB.getLife = (charId) => T('CuocDoi').filter((r) => r.nhan_vat_id === charId).sort(byThuTu);

  // Quan hệ: "lien_quan_id là [quan_he] của nhan_vat_id". Tự suy ra chiều ngược lại.
  const NGUOC = { 'su-phu': 'do-de', 'do-de': 'su-phu', vo: 'chong', chong: 'vo' };
  DB.getRelations = (charId) => {
    const out = [], seen = new Set();
    const add = (otherId, loai, ghiChu) => {
      const k = otherId + '|' + loai;
      if (seen.has(k)) return; seen.add(k);
      out.push({ nhanVat: DB.getCharacter(otherId), id: otherId, quan_he: loai, ghi_chu: ghiChu });
    };
    T('QuanHe').forEach((r) => {
      if (r.nhan_vat_id === charId) add(r.lien_quan_id, r.quan_he, r.ghi_chu);
      else if (r.lien_quan_id === charId) add(r.nhan_vat_id, NGUOC[r.quan_he] || r.quan_he, r.ghi_chu);
    });
    return out;
  };

  /* ------------------------------------------------------------ THẾ LỰC, TU LUYỆN, VẬT PHẨM, ĐỊA ĐIỂM */
  DB.getFactions = () => T('TheLuc');
  DB.getFaction = (id) => idx.TheLuc.get(id) || null;
  DB.getFactionsByWork = (workId) => T('TheLuc').filter((f) => f.tac_pham_id === workId);
  DB.getMembers = (factionId) => T('NhanVat').filter((c) => ids(c.the_luc_ids).includes(factionId));

  DB.getCultivationType = (id) => idx.LoaiTuLuyen.get(id) || null;
  DB.getCultivationTypes = (workId) => T('LoaiTuLuyen').filter((r) => r.tac_pham_id === workId);
  DB.getLevel = (id) => idx.CapDo.get(id) || null;
  DB.getLevels = (workId) => T('CapDo').filter((r) => r.tac_pham_id === workId).sort(byThuTu);

  DB.getItem = (id) => idx.VatPham.get(id) || null;
  DB.getItems = (workId) => T('VatPham').filter((r) => r.tac_pham_id === workId);

  DB.getPlace = (id) => idx.DiaDiem.get(id) || null;
  DB.getPlaces = (workId) => T('DiaDiem').filter((r) => r.tac_pham_id === workId);
  // Cây cha – con: [{...diaDiem, con: [...]}]
  DB.getPlaceTree = (workId) => {
    const ds = DB.getPlaces(workId).map((p) => ({ ...p, con: [] }));
    const map = new Map(ds.map((p) => [p.id, p]));
    const goc = [];
    ds.forEach((p) => { const cha = map.get(p.thuoc_id); (cha && cha !== p ? cha.con : goc).push(p); });
    return goc;
  };
  DB.getJourney = (workId) => T('HanhTrinh').filter((r) => r.tac_pham_id === workId).sort(byThuTu);

  /* ------------------------------------------------------------ ẢNH, THUẬT NGỮ, ĐỀ CỬ, CÀI ĐẶT */
  DB.getImages = (workId, charId) => T('AnhTruyen').filter((r) =>
    (charId ? r.nhan_vat_id === charId : (r.tac_pham_id === workId && !r.nhan_vat_id)));
  DB.getTerms = () => T('ThuatNgu').slice().sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
  DB.getRecommendations = () => T('DeCu').slice().sort(byThuTu)
    .map((r) => ({ ...r, tacPham: DB.getWork(r.tac_pham_id) })).filter((r) => r.tacPham);
  DB.getSettings = () => {
    const s = T('CaiDat')[0] || {};
    return {
      ten_web: s.ten_web || CFG.tenWeb || 'Tàng Kinh Các',
      mo_ta_web: s.mo_ta_web || CFG.moTaWeb || '',
      logo: s.logo || '', link_fanpage: s.link_fanpage || '', link_youtube: s.link_youtube || '',
    };
  };

  /* ------------------------------------------------------------ xuất ra ngoài */
  Object.assign(DB, { TABS, ROOT, str, ids, yes, num, boDau, esc, lines, paragraphs, url, img, imgAlt, fallback, driveId, youtubeIds, parseDate, formatDate, parseCsv });
  window.DB = DB;
})();
