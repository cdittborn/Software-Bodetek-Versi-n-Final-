/**
 * Capturas Playwright de /trabajos/fachadas/demo vs docs/diseno/fachadas.
 * Uso: node --experimental-strip-types no; npx playwright (tras npm i -D playwright).
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs/diseno/fachadas/comparacion");
const REF = join(ROOT, "docs/diseno/fachadas");
const BASE = process.env.DEMO_URL || "http://127.0.0.1:3010";

const PAGES = [
  {
    name: "1_dashboard",
    path: "/trabajos/fachadas/demo",
    ref: "1_Resumen_dashboard.png",
    width: 1660,
    height: 2200,
    fullPage: true,
    hideSwitcher: true,
  },
  {
    name: "2_ficha",
    path: "/trabajos/fachadas/demo/ficha",
    ref: "2_Ficha_fachada.png",
    width: 1660,
    height: 2200,
    fullPage: true,
    hideSwitcher: true,
  },
  {
    name: "3_intervencion",
    path: "/trabajos/fachadas/demo/intervencion",
    ref: "3_Nueva_intervencion.png",
    width: 900,
    height: 2200,
    fullPage: true,
    hideSwitcher: true,
    waitSelector: "h1",
  },
  {
    name: "4_nueva",
    path: "/trabajos/fachadas/demo/nueva",
    ref: "4_Nueva_fachada.png",
    width: 1100,
    height: 1400,
    fullPage: false,
    hideSwitcher: true,
    waitSelector: "[data-slot=dialog-content], h2",
  },
  {
    name: "5_reporte",
    path: "/trabajos/fachadas/demo/reporte",
    ref: "5_Reporte_directorio.png",
    width: 1440,
    height: 900,
    fullPage: false,
    hideSwitcher: true,
  },
];

function sideBySide(aBuf, bBuf, outPath) {
  const a = PNG.sync.read(aBuf);
  const b = PNG.sync.read(bBuf);
  const h = Math.max(a.height, b.height);
  const w = a.width + b.width + 16;
  const out = new PNG({ width: w, height: h });
  out.data.fill(240);
  PNG.bitblt(a, out, 0, 0, a.width, a.height, 0, 0);
  PNG.bitblt(b, out, 0, 0, b.width, b.height, a.width + 16, 0);
  writeFileSync(outPath, PNG.sync.write(out));
}

function diffPct(aBuf, bBuf, diffPath) {
  const a = PNG.sync.read(aBuf);
  const b = PNG.sync.read(bBuf);
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const imgA = new PNG({ width: w, height: h });
  const imgB = new PNG({ width: w, height: h });
  PNG.bitblt(a, imgA, 0, 0, w, h, 0, 0);
  PNG.bitblt(b, imgB, 0, 0, w, h, 0, 0);
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(imgA.data, imgB.data, diff.data, w, h, { threshold: 0.12 });
  writeFileSync(diffPath, PNG.sync.write(diff));
  return { n, pct: Math.round((n / (w * h)) * 10000) / 100, w, h };
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const notes = [];

for (const p of PAGES) {
  const page = await browser.newPage({
    viewport: { width: p.width, height: p.height },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}${p.path}`, { waitUntil: "networkidle", timeout: 60_000 });
  if (p.waitSelector) {
    await page.waitForSelector(p.waitSelector, { timeout: 15_000 }).catch(() => {});
  }
  if (p.hideSwitcher) {
    await page.addStyleTag({
      content: `[data-demo-switcher]{display:none !important}`,
    });
  }
  await page.waitForTimeout(400);
  const shotPath = join(OUT, `${p.name}_demo.png`);
  await page.screenshot({ path: shotPath, fullPage: p.fullPage });
  const demoBuf = readFileSync(shotPath);
  const refPath = join(REF, p.ref);
  if (existsSync(refPath)) {
    const refBuf = readFileSync(refPath);
    const pair = join(OUT, `${p.name}_lado_a_lado.png`);
    sideBySide(refBuf, demoBuf, pair);
    const d = diffPct(refBuf, demoBuf, join(OUT, `${p.name}_diff.png`));
    notes.push(`${p.name}: ${d.pct}% px distintos (${d.n} / ${d.w}x${d.h})`);
  }
  await page.close();
}

await browser.close();
writeFileSync(join(OUT, "resumen.txt"), notes.join("\n") + "\n");
console.log(notes.join("\n"));
