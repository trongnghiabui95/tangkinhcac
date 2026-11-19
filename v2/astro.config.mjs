// Tu Chân Bảo Điển v2 – Astro xuất toàn bộ HTML tĩnh (SSG), không database, không server.
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkLienKetNoiBo from './src/lib/remark-lien-ket-noi-bo.mjs';
import remarkDirective from 'remark-directive';
import remarkSpoiler from './src/lib/remark-spoiler.mjs';
import rehypeChenQuangCao from './src/lib/rehype-chen-quang-cao.mjs';

// Địa chỉ web thật (dùng cho canonical, sitemap, Open Graph). Đổi khi gắn tên miền riêng.
const SITE = process.env.SITE_URL || 'https://trongnghiabui95.github.io';
const BASE = process.env.BASE_PATH || '/';
// Mã AdSense (ca-pub-xxxxxxxx). Để trống = không chèn quảng cáo thật.
const ADSENSE = process.env.PUBLIC_ADSENSE_CLIENT || '';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory' },          // /pham-nhan-tu-tien/nhan-vat/han-lap/index.html → URL đẹp
  integrations: [mdx()],
  markdown: {
    // Astro 7: plugin remark/rehype chạy qua bộ xử lý unified (@astrojs/markdown-remark)
    processor: unified({
      remarkPlugins: [
        remarkDirective,                 // cú pháp :::spoiler … :::
        remarkSpoiler,
        [remarkLienKetNoiBo, { thuMucNoiDung: 'content', base: BASE }],   // tối đa GIOI_HAN.lienKetTuDong link/bài; báo cáo: bao-cao/lien-ket-noi-bo.json
      ],
      rehypePlugins: [
        [rehypeChenQuangCao, { moiSoH2: 3, adsenseClient: ADSENSE, slot: process.env.PUBLIC_ADSENSE_SLOT_GIUA_BAI || '' }],
      ],
    }),
  },
});
