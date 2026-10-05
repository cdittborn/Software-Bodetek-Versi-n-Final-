/**
 * Sube 4 fotos + 1 video de una vez en la galería de la fachada y en antes/después.
 * Uso: DEMO_URL=http://localhost:3010 node scripts/probar-subida-multiple.mjs
 */
import { chromium } from "playwright";
import { PNG } from "pngjs";

const BASE = process.env.DEMO_URL || "http://localhost:3010";

function png(n) {
  const img = new PNG({ width: 12, height: 8 });
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = (n * 40) % 255;
    img.data[i + 1] = 80;
    img.data[i + 2] = 140;
    img.data[i + 3] = 255;
  }
  return PNG.sync.write(img);
}

const FOTOS = [1, 2, 3, 4].map((n) => ({
  name: `foto-${n}.png`,
  mimeType: "image/png",
  buffer: png(n),
}));
const VIDEO = {
  name: "clip.mp4",
  mimeType: "video/mp4",
  buffer: Buffer.from("000000186674797069736f6d0000000069736f6d", "hex"),
};
const ARCHIVOS = [...FOTOS, VIDEO];
const NOMBRES = ARCHIVOS.map((a) => a.name);

async function exigirCinco(page, zona) {
  const input = page.locator(`[data-zona="${zona}"] input[data-origen="galeria"]`);
  const meta = await input.evaluate((el) => ({
    multiple: el.multiple,
    capture: el.getAttribute("capture"),
    accept: el.getAttribute("accept"),
  }));
  if (!meta.multiple) throw new Error(`${zona}: la galería no tiene multiple`);
  if (meta.capture) throw new Error(`${zona}: la galería no debe usar capture`);
  if (meta.accept !== "image/*,video/*") {
    throw new Error(`${zona}: accept inesperado ${meta.accept}`);
  }
  const camara = await page
    .locator(`[data-zona="${zona}"] input[data-origen="camara"]`)
    .evaluate((el) => el.getAttribute("capture"));
  if (camara !== "environment") throw new Error(`${zona}: la cámara no abre capture`);
  await input.setInputFiles(ARCHIVOS);
  for (const nombre of NOMBRES) {
    await page
      .locator(`[data-zona="${zona}"] [data-nombre="${nombre}"]`)
      .waitFor({ state: "visible", timeout: 25_000 });
  }
  const visibles = await page.locator(`[data-zona="${zona}"] [data-nombre]`).evaluateAll((els) =>
    els.map((el) => el.getAttribute("data-nombre")),
  );
  for (const nombre of NOMBRES) {
    if (!visibles.includes(nombre)) throw new Error(`${zona}: falta ${nombre}`);
  }
  console.log(zona, "ok", NOMBRES.length);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(`${BASE}/dev/fachadas-mobile/ficha`, { waitUntil: "networkidle", timeout: 60_000 });
await exigirCinco(page, "estado-fachada");
await page.setViewportSize({ width: 1440, height: 900 });
await page.locator('[data-zona="estado-fachada"] [data-nombre="foto-1.png"]').waitFor();
await page.goto(`${BASE}/dev/fachadas-mobile/intervencion`, {
  waitUntil: "networkidle",
  timeout: 60_000,
});
await page.setViewportSize({ width: 390, height: 844 });
await exigirCinco(page, "antes");
await exigirCinco(page, "despues");
await page.setViewportSize({ width: 1440, height: 900 });
await page.locator('[data-zona="antes"] [data-nombre="clip.mp4"]').waitFor();
await browser.close();
console.log("subida múltiple ok");
