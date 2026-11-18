/**
 * remark-cau-hoi – rút mục "Câu hỏi thường gặp" cuối bài thành dữ liệu FAQ.
 * Cách viết trong .mdx:
 *   ## Câu hỏi thường gặp
 *   ### Hàn Lập đạt cảnh giới gì cuối truyện?
 *   Đoạn trả lời…
 * Kết quả nằm ở remarkPluginFrontmatter.faq = [{ hoi, dap }] → trang dùng để sinh JSON-LD FAQPage.
 */
import { toString } from 'mdast-util-to-string';

const LA_MUC_FAQ = /^(câu hỏi thường gặp|hỏi đáp|faq)$/i;

export default function remarkCauHoi() {
  return function (tree, file) {
    const faq = [];
    let trongFaq = false, cauHoi = null;
    for (const node of tree.children) {
      if (node.type === 'heading' && node.depth === 2) {
        trongFaq = LA_MUC_FAQ.test(toString(node).trim());
        cauHoi = null;
        continue;
      }
      if (!trongFaq) continue;
      if (node.type === 'heading' && node.depth === 3) {
        cauHoi = { hoi: toString(node).trim(), dap: '' };
        faq.push(cauHoi);
      } else if (cauHoi && node.type !== 'heading') {
        const t = toString(node).trim();
        if (t) cauHoi.dap = (cauHoi.dap ? cauHoi.dap + '\n' : '') + t;
      }
    }
    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.faq = faq.filter((c) => c.hoi && c.dap);
  };
}
