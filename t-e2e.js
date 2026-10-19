const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push('PAGEERROR: ' + e));
  await p.goto('https://cheesegrade.netlify.app/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  // verify deployed version has new logic
  const has = await p.evaluate(() => ({
    findSetBox: typeof window.findSetBox === 'function',
    ocrCardNumber: typeof window.ocrCardNumber === 'function',
    showOcrDebug: typeof window.showOcrDebug === 'function',
    ASC: (typeof SETCODES !== 'undefined') && !!SETCODES['ASC'],
    numKey: typeof window.numKey === 'function'
  }));
  console.log('deployed globals:', JSON.stringify(has));
  // run OCR pipeline on the user's ASC photo
  const img = fs.readFileSync('C:/Users/phill/AppData/Local/Temp/asc_asc.png').toString('base64');
  const res = await p.evaluate(async (b64) => {
    const r = await fetch('data:image/png;base64,' + b64);
    const blob = await r.blob();
    const card = { bmp: await createImageBitmap(blob), w: 0, h: 0 };
    card.w = card.bmp.width; card.h = card.bmp.height;
    const out = {};
    const box = findSetBox(card);
    out.box = box ? { x: box.x, y: box.y, w: box.w, h: box.h } : null;
    if (box) {
      const N = await ocrCardNumber(card, box);
      out.num = N;
    }
    return out;
  }, img);
  console.log('OCR result:', JSON.stringify(res));
  console.log('JS errors:', errors.length, errors.slice(0, 3));
  await b.close();
})();
