// Sinh JSON-LD (schema.org) cho Google. Mỗi hàm trả về 1 object; layout gắn vào <head>.
const TO_CHUC = (site) => ({ '@type': 'Organization', name: 'Tu Chân Bảo Điển', url: site });

/** BreadcrumbList từ [{ ten, url (tuyệt đối) }] */
export const schemaBreadcrumb = (cap) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: cap.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.ten, ...(c.url ? { item: c.url } : {}) })),
});

/**
 * Trang nhân vật: Article (bài viết về nhân vật) + about (nhân vật hư cấu, kiểu Person).
 * Ghi chú: Google dành ProfilePage cho trang hồ sơ người/tổ chức THẬT; nhân vật hư cấu dùng Article an toàn hơn.
 * Đặt kieu = 'ProfilePage' nếu vẫn muốn thử.
 */
export function schemaNhanVat({ ten, ten_khac, moTa, urlTrang, anh, ngayDang, ngayCapNhat, truyen, urlTruyen, toChuc, site, kieu = 'Article' }) {
  const nhanVat = {
    '@type': 'Person', name: ten, ...(ten_khac?.length ? { alternateName: ten_khac } : {}),
    description: moTa, ...(anh ? { image: anh } : {}),
    subjectOf: { '@type': 'Book', name: truyen, url: urlTruyen },
    ...(toChuc?.length ? { memberOf: toChuc.map((t) => ({ '@type': 'Organization', name: t })) } : {}),
  };
  if (kieu === 'ProfilePage') {
    return { '@context': 'https://schema.org', '@type': 'ProfilePage', url: urlTrang, dateCreated: ngayDang, dateModified: ngayCapNhat, mainEntity: nhanVat };
  }
  return {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: `${ten} | Tiểu sử, Sức mạnh, Mối quan hệ`, description: moTa,
    ...(anh ? { image: [anh] } : {}), datePublished: ngayDang, dateModified: ngayCapNhat,
    mainEntityOfPage: { '@type': 'WebPage', '@id': urlTrang },
    author: TO_CHUC(site), publisher: TO_CHUC(site), about: nhanVat, inLanguage: 'vi',
  };
}

/** FAQPage từ [{ hoi, dap }]. (Từ 2023 Google chỉ hiện kết quả FAQ đặc biệt cho trang chính phủ/y tế,
 *  nhưng dữ liệu vẫn hợp lệ và giúp máy tìm kiếm/AI hiểu nội dung.) */
export const schemaFaq = (faq) => faq?.length ? {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map((c) => ({ '@type': 'Question', name: c.hoi, acceptedAnswer: { '@type': 'Answer', text: c.dap } })),
} : null;

/** Trang truyện: Review của Book */
export const schemaReviewTruyen = ({ ten, tacGia, moTa, urlTrang, anh, diem, ngayDang, ngayCapNhat, site }) => ({
  '@context': 'https://schema.org', '@type': 'Review',
  name: `[Review] ${ten}`, description: moTa, url: urlTrang, datePublished: ngayDang, dateModified: ngayCapNhat,
  author: TO_CHUC(site), publisher: TO_CHUC(site), inLanguage: 'vi',
  itemReviewed: { '@type': 'Book', name: ten, author: { '@type': 'Person', name: tacGia }, ...(anh ? { image: anh } : {}) },
  ...(diem != null ? { reviewRating: { '@type': 'Rating', ratingValue: diem, bestRating: 10, worstRating: 0 } } : {}),
});

/** Trang mục từ khác (pháp bảo, cảnh giới) */
export const schemaBaiViet = ({ tieuDe, moTa, urlTrang, anh, ngayDang, ngayCapNhat, site }) => ({
  '@context': 'https://schema.org', '@type': 'Article', headline: tieuDe, description: moTa,
  ...(anh ? { image: [anh] } : {}), datePublished: ngayDang, dateModified: ngayCapNhat,
  mainEntityOfPage: { '@type': 'WebPage', '@id': urlTrang }, author: TO_CHUC(site), publisher: TO_CHUC(site), inLanguage: 'vi',
});
