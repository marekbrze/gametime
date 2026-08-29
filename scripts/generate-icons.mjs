// Generator zestawu faviconów gametime (ADR-0036; workflow skilla favicon-gen).
//
// Uruchomienie (z roota repo — playwright rozwiązywany z node_modules):
//   node scripts/generate-icons.mjs
//
// Środowisko nie ma ImageMagick/rsvg — rasteryzacja przez headless chromium
// (playwright): inline SVG w dokładnym rozmiarze → screenshot PNG.
// Workaround fontconfig: glif to czyste kształty (stroke), zero tekstu, więc
// brak fontów systemowych nie przeszkadza (patrz memory: chromium-fontconfig-workaround).
//
// Brand (DESIGN.md): papaya oklch(0.72 0.17 48) → #f77e35, tusz oklch(0.20 0.02 48)
// → #1e130e (konwersja OKLCH→sRGB w docs/changes/seo-social-meta.md).
// Glif: wielkie geometryczne "G" (konstrukcja klasy Futura: annulus +
// poziomy ciernień w kontr) rysowane WYPEŁNIENIAMI. Wybór padł na wersję
// wielką po dwóch iteracjach małego "g", które czytało się jako "q" —
// przy 16 px rozpoznawalność jest całym sensem favicona. Symetryczny bbox
// (ring 9–23 w obu osiach) centruje się sam.

import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const PAPAYA = '#f77e35';
const INK = '#1e130e';

/** SVG faviconu. `rx` — promień narożnika tła (apple-touch: 0 = pełny kwadrat,
 *  iOS sam zaokrągla; zaokrągleń przez OS-y nie dublujemy). */
function faviconSvg(size, rx) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="${rx}" fill="${PAPAYA}" />
  <g fill="${INK}">
    <!-- ring: annulus (outer r7, inner r3.8), centrum (16,16) -->
    <path fill-rule="evenodd" d="M9 16 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 Z
      M12.2 16 a3.8 3.8 0 1 0 7.6 0 a3.8 3.8 0 1 0 -7.6 0 Z" />
    <!-- ciernień "G": pozioma belka z prawej wchodząca w kontr -->
    <rect x="17.4" y="14.2" width="5.6" height="3.6" />
  </g>
</svg>`;
}

const TARGETS = [
  { file: 'public/favicon-16.png', size: 16, rx: 8 },
  { file: 'public/favicon-32.png', size: 32, rx: 8 },
  { file: 'public/apple-touch-icon.png', size: 180, rx: 0 },
  { file: 'public/icon-192.png', size: 192, rx: 8 },
  { file: 'public/icon-512.png', size: 512, rx: 8 },
];

const browser = await chromium.launch();
try {
  for (const { file, size, rx } of TARGETS) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<!doctype html><body style="margin:0">${faviconSvg(size, rx)}</body>`,
    );
    const png = await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } });
    await writeFile(file, png);
    console.log(`${file} (${size}x${size})`);
    await page.close();
  }
} finally {
  await browser.close();
}
