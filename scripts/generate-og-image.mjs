// Generator og-image gametime (ADR-0036): renderuje scripts/og-image.html
// w headless chromium i zapisuje public/og-image.png (1200×630).
//
// Uruchomienie (z roota repo — playwright z node_modules):
//   FONTCONFIG_FILE=~/.fonts.conf node scripts/generate-og-image.mjs
// (workaround fontconfig: memory chromium-fontconfig-workaround; Geist ładowany
// przez @font-face z node_modules, bo środowisko nie ma fontów systemowych)

import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto('file://' + path.join(dirname, 'og-image.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150); // ustabilizowanie rasterów po załadowaniu fontu
  const png = await page.screenshot();
  await writeFile('public/og-image.png', png);
  console.log('public/og-image.png (1200x630)');
} finally {
  await browser.close();
}
