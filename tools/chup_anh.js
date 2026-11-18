// Chuyển các ảnh SVG trong tools/_svg thành JPG trong assets/img/mau (cần Playwright).
// Chạy: node tools/chup_anh.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const VAO = path.join(__dirname, '_svg'), RA = path.join(__dirname, '..', 'assets', 'img', 'mau');

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
