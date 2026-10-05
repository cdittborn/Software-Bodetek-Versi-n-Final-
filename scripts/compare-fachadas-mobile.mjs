/**
 * Capturas Playwright a 390 px de /dev/fachadas-mobile vs docs/diseno/fachadas/mobile.
 * También deja una captura a 1440 px del dashboard y de la ficha.
 * Uso: DEMO_URL=http://127.0.0.1:3010 node scripts/compare-fachadas-mobile.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs/diseno/fachadas/comparacion");
const REF = join(ROOT, "docs/diseno/fachadas/mobile");
const BASE = process.env.DEMO_URL || "http://localhost:3010";

const PAGES = [
  {
    name: "1_dashboard",
    path: "/dev/fachadas-mobile",
    ref: "1_Movil_Dashboard.png",
  },
  {
    name: "2_ficha",
    path: "/dev/fachadas-mobile/ficha",
    ref: "2_Movil_Ficha_fachada.png",
  },
  {
    name: "3_intervencion",
    path: "/dev/fachadas-mobile/intervencion",
    ref: "3_Movil_Nueva_intervencion.png",
  },
  {
    name: "4_nueva",
    path: "/dev/fachadas-mobile/nueva",
    ref: "4_Movil_Nueva_fachada.png",
  },
];

function fitWidth(buf, width) {
  const src = PNG.sync.read(buf);
  if (src.width === width) return src;
  const height = Math.max(1, Math.round((src.height * width) / src.width));
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    const sy = Math.min(src.height - 1, Math.floor((y * src.height) / height));
    for (let x = 0; x < width; x++) {
      const sx = Math.min(src.width - 1, Math.floor((x * src.width) / width));
      const si = (sy * src.width + sx) * 4;
      const di = (y * width + x) * 4;
      out.data[di] = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = 255;
    }
  }
  return out;
}

function sideBySide(a, b, outPath) {
  const h = Math.max(a.height, b.height);
  const w = a.width + b.width + 16;
  const out = new PNG({ width: w, height: h });
  out.data.fill(255);
  PNG.bitblt(a, out, 0, 0, a.width, a.height, 0, 0);
  PNG.bitblt(b, out, 0, 0, b.width, b.height, a.width + 16, 0);
  writeFileSync(outPath, PNG.sync.write(out));
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

for (const p of PAGES) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}${p.path}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.addStyleTag({
    content: `[data-demo-switcher], nextjs-portal { display:none !important; }`,
  });
  if (p.path.endsWith("/intervencion") || p.path.endsWith("/nueva")) {
    await page.addStyleTag({
      content: `
        header { display: none !important; }
        .fachadas-scope.fd-modal-form,
        .fd-form-sheet[data-slot="dialog-content"] {
          position: relative !important;
          inset: auto !important;
          top: auto !important;
          left: auto !important;
          transform: none !important;
          translate: none !important;
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
        }
        .fachadas-scope .fd-form-actions { position: static !important; }
      `,
    });
  }
  await page.waitForTimeout(400);
  const shotPath = join(OUT, `${p.name}_mobile.png`);
  await page.screenshot({ path: shotPath, fullPage: true });
  const refPath = join(REF, p.ref);
  if (existsSync(refPath)) {
    const demo = fitWidth(readFileSync(shotPath), 390);
    const ref = fitWidth(readFileSync(refPath), 390);
    sideBySide(ref, demo, join(OUT, `${p.name}_lado_a_lado.png`));
  }
  await page.close();
}

for (const p of [
  { name: "desktop_dashboard", path: "/dev/fachadas-mobile" },
  { name: "desktop_ficha", path: "/dev/fachadas-mobile/ficha" },
]) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}${p.path}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.addStyleTag({
    content: `[data-demo-switcher], nextjs-portal { display:none !important; }`,
  });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: join(OUT, `${p.name}_1440.png`),
    fullPage: true,
  });
  await page.close();
}

await browser.close();
console.log("capturas en", OUT);
