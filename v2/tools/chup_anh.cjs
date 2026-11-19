// Chuyển các ảnh SVG trong tools/_svg thành JPG trong anh-goc/_tu-ve/ (cần Playwright).
// Chạy trong thư mục v2/: node tools/chup_anh.cjs – rồi chép ảnh cần dùng vào anh-goc/<series>/… và khai báo trong .mdx
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const VAO = path.join(__dirname, '_svg'), RA = path.join(__dirname, '..', 'anh-goc', '_tu-ve');

(async () => {
  fs.mkdirSync(RA, { recursive: true });
  const b = await chromium.launch();
  for (const f of fs.readdirSync(VAO).filter((x) => x.endsWith('.svg'))) {
    const noiDung = fs.readFileSync(path.join(VAO, f), 'utf8');
    const [, w, h] = noiDung.match(/width="(\d+)" height="(\d+)"/);
    const p = await b.newPage({ viewport: { width: +w, height: +h } });
    await p.setContent(`<html><body style="margin:0">${noiDung}</body></html>`);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(RA, f.replace('.svg', '.jpg')), type: 'jpeg', quality: 86 });
    await p.close();
    console.log('✓', f.replace('.svg', '.jpg'));
  }
  await b.close();
})();
