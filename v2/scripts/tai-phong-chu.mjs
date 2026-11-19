#!/usr/bin/env node
/**
 * tai-phong-chu.mjs – tải phông Be Vietnam Pro + Noto Serif (giấy phép OFL, được phép tự lưu) từ Google Fonts về public/phong/
 * và sinh src/styles/phong-chu.css. Chỉ chạy lại khi muốn đổi phông/độ đậm; KHÔNG chạy trong lúc build.
 * Lý do tự lưu: phông nằm cùng tên miền với web → tải sớm (preload), không chờ kết nối sang Google,
 * hết hiện tượng chữ "nhảy" (CLS) khi phông về muộn.   Chạy: node scripts/tai-phong-chu.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
const GOC = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const URL_CSS = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&family=Noto+Serif:wght@700&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
// Chỉ giữ 'vietnamese' + 'latin'. KHÔNG giữ 'latin-ext': dải của nó trùng các chữ ă, đ, ơ, ư… nên trình duyệt tải thừa
// thêm ~100KB/trang, trong khi mọi chữ tiếng Việt đã có đủ trong 'vietnamese' (đã kiểm bằng fontTools, Issue #64).
const GIU = ['vietnamese', 'latin'];
const css = await (await fetch(URL_CSS, { headers: { 'user-agent': UA } })).text();
const khoi = [...css.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face \{([^}]+)\}/g)];
const thuMuc = path.join(GOC, 'public/phong'); fs.mkdirSync(thuMuc, { recursive: true });
let ra = '/* Sinh bởi scripts/tai-phong-chu.mjs – đừng sửa tay. Phông OFL tự lưu ở public/phong/. */\n';
for (const [, tap, than] of khoi) {
  if (!GIU.includes(tap)) continue;
  const ho = than.match(/font-family: '([^']+)'/)[1], dam = than.match(/font-weight: (\d+)/)[1];
  const url = than.match(/url\((https:[^)]+)\)/)[1], dai = than.match(/unicode-range: ([^;]+)/)[1];
  const ten = `${ho.toLowerCase().replace(/ /g, '-')}-${dam}-${tap}.woff2`;
  fs.writeFileSync(path.join(thuMuc, ten), Buffer.from(await (await fetch(url)).arrayBuffer()));
  ra += `@font-face { font-family: '${ho}'; font-style: normal; font-weight: ${dam}; font-display: swap; src: url('/phong/${ten}') format('woff2'); unicode-range: ${dai}; }\n`;
  console.log('tải', ten);
}
fs.writeFileSync(path.join(GOC, 'src/styles/phong-chu.css'), ra);
