// JSON-LD (schema.org) sinh từ frontmatter. Mọi URL tuyệt đối tính từ SITE_URL (Astro.site).
import { TEN_WEB } from './thong-tin-web.mjs';
export const toChuc = (site) => ({ '@type': 'Organization', name: TEN_WEB, url: site, logo: { '@type': 'ImageObject', url: new URL('logo.png', site).href, width: 512, height: 512 } });

/** BreadcrumbList từ [{ ten, url (tuyệt đối) }] */
export const schemaBreadcrumb = (cap) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: cap.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.ten, ...(c.url ? { item: c.url } : {}) })),
});

/** Article cho mọi bài viết. Bài nhân vật thêm `about` (nhân vật hư cấu, kiểu Person). */
export function schemaArticle({ title, description, urlTrang, anh, anhOg, date, updated, keywords, site, tenSeries, urlSeries, nhanVat }) {
  const anhDs = [anhOg, anh].filter(Boolean);   // Google khuyên ảnh rộng ≥ 1200px: đặt ảnh chia sẻ 1200×630 trước
  return {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: title, description, ...(anhDs.length ? { image: anhDs } : {}), url: urlTrang,
    datePublished: date.toISOString(), dateModified: updated.toISOString(),
    mainEntityOfPage: { '@type': 'WebPage', '@id': urlTrang },
    author: toChuc(site), publisher: toChuc(site), inLanguage: 'vi',
    ...(keywords?.length ? { keywords: keywords.join(', ') } : {}),
    isPartOf: { '@type': 'CreativeWorkSeries', name: tenSeries, url: urlSeries },
    ...(nhanVat ? { about: { '@type': 'Person', name: nhanVat.ten, ...(nhanVat.aliases?.length ? { alternateName: nhanVat.aliases } : {}) } } : {}),
  };
}

/** FAQPage từ faqs [{ q, a }] */
export const schemaFaq = (faqs) => faqs?.length ? {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqs.map((c) => ({ '@type': 'Question', name: c.q, acceptedAnswer: { '@type': 'Answer', text: c.a } })),
} : null;

/** Trang bộ truyện: Review của Book */
export const schemaReviewTruyen = ({ ten, tacGia, moTa, urlTrang, anh, diem, ngayDang, ngayCapNhat, site }) => ({
  '@context': 'https://schema.org', '@type': 'Review',
  name: `[Review] ${ten}`, description: moTa, url: urlTrang, datePublished: ngayDang, dateModified: ngayCapNhat,
  author: toChuc(site), publisher: toChuc(site), inLanguage: 'vi',
  itemReviewed: { '@type': 'Book', name: ten, author: { '@type': 'Person', name: tacGia }, ...(anh ? { image: anh } : {}) },
  ...(diem != null ? { reviewRating: { '@type': 'Rating', ratingValue: diem, bestRating: 10, worstRating: 0 } } : {}),
});

/** Trang chủ: WebSite (kèm ô tìm kiếm) + Organization */
export const schemaWebSite = (site, urlTimKiem) => ({
  '@context': 'https://schema.org', '@type': 'WebSite', name: TEN_WEB, url: site, inLanguage: 'vi', publisher: toChuc(site),
  potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${urlTimKiem}?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
});
