/**
 * remark-spoiler – biến khối
 *   :::spoiler
 *   …nội dung…
 *   :::
 * (cú pháp remark-directive) thành <details class="spoiler"><summary>…</summary>…</details>.
 * Tiêu đề tuỳ chọn: :::spoiler[Kết cục của nhân vật]
 */
import { visit } from 'unist-util-visit';

export default function remarkSpoiler() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== 'containerDirective' || node.name !== 'spoiler') return;
      let tieuDe = 'Nội dung tiết lộ cốt truyện (spoiler) – bấm để xem';
      const dau = node.children[0];
      if (dau?.data?.directiveLabel) { tieuDe = dau.children.map((c) => c.value || '').join('') || tieuDe; node.children.shift(); }
      node.data = { hName: 'details', hProperties: { className: ['spoiler', 'khong-quang-cao'] } };
      node.children = [
        { type: 'paragraph', data: { hName: 'summary' }, children: [{ type: 'text', value: tieuDe }] },
        { type: 'blockquote', data: { hName: 'div', hProperties: { className: ['spoiler-noi-dung'] } }, children: node.children },
      ];
    });
    // Khối :: hoặc : khác (không phải spoiler) giữ nguyên chữ để không mất nội dung
    visit(tree, (node, i, cha) => {
      if ((node.type === 'leafDirective' || node.type === 'textDirective') && cha && i != null) {
        cha.children.splice(i, 1, { type: 'text', value: `:${node.type === 'leafDirective' ? ':' : ''}${node.name}` });
      }
    });
  };
}
