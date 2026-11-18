/* Trang tạm cho các mục của giai đoạn 2 */
(function () {
  const ten = document.body.dataset.ten || 'Mục này';
  UI.khoiDong(() => {
    UI.setMeta({ title: ten, description: ten + ' – đang xây dựng.' });
    document.getElementById('noi-dung').innerHTML = `<div class="khung py-20 text-center">
      ${UI.breadcrumb([{ ten: 'Trang chủ', href: UI.LINK.home() }, { ten }])}
      ${UI.icon('hammer', 'w-12 h-12 mx-auto mt-10 text-primary')}
      <h1 class="text-3xl font-bold mt-4">${DB.esc(ten)}</h1>
      <p class="opacity-70 mt-2">Trang này sẽ hoàn thiện ở giai đoạn 2.</p>
      <a class="btn btn-primary mt-6" href="${UI.LINK.home()}">Về trang chủ</a></div>`;
  });
})();
