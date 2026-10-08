/**
 * Recorre /dev/fachadas-v2 a 360 y 390 px.
 * Falla si la página se desborda, un control visible mide menos de 44 px,
 * el plano no abre el bottom sheet, o Ampliar mueve el scroll de la página.
 *
 *   npm run verify:fachadas:movil
 *   DEMO_URL=http://127.0.0.1:3010 node scripts/verificar-fachadas-movil.mjs
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs/diseno/fachadas/v2/comparacion");
const PORT = 3011;
const BASE = process.env.DEMO_URL || `http://127.0.0.1:${PORT}`;
const RUTAS = ["/dev/fachadas-v2", "/dev/fachadas-v2/plano"];
const ANCHOS = [360, 390];
const fallos = [];

function anotar(ancho, ruta, mensaje) {
  fallos.push(`${ancho}px ${ruta}: ${mensaje}`);
  console.error(`✗ ${ancho}px ${ruta}: ${mensaje}`);
}

async function esperarServidor(url) {
  const inicio = Date.now();
  while (Date.now() - inicio < 120_000) {
    try {
      const respuesta = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (respuesta.status < 500) return;
    } catch {
      // el servidor todavía está compilando
    }
    await new Promise((resolver) => setTimeout(resolver, 400));
  }
  throw new Error(`el servidor no respondió en ${url}`);
}

function iniciarServidor() {
  const bin = join(ROOT, "node_modules/next/dist/bin/next");
  const child = spawn(process.execPath, [bin, "dev", "-p", String(PORT), "--hostname", "127.0.0.1"], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });
  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return child;
}

async function puntoFachada(page, id) {
  return page.evaluate((fachadaId) => {
    const svg = document.querySelector("[data-plano='v2']");
    const poly = svg?.querySelector(`[data-fachada-visible="${fachadaId}"]`);
    if (!svg || !poly) return null;
    const pts = poly
      .getAttribute("points")
      .trim()
      .split(/\s+/)
      .map((par) => par.split(",").map(Number));
    const x = (pts[0][0] + pts[1][0]) / 2;
    const y = (pts[0][1] + pts[1][1]) / 2;
    const vb = svg.viewBox.baseVal;
    const rect = svg.getBoundingClientRect();
    return {
      x: rect.left + ((x - vb.x) / vb.width) * rect.width,
      y: rect.top + ((y - vb.y) / vb.height) * rect.height,
    };
  }, id);
}

async function cerrarHoja(page, id) {
  await page.getByRole("button", { name: "Cerrar" }).click();
  await page.waitForFunction(
    (fachadaId) => document.activeElement?.getAttribute("data-fachada-hit") === fachadaId,
    id,
    { timeout: 5_000 },
  );
}

async function revisar(page, ancho, ruta) {
  await page.goto(`${BASE}${ruta}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForSelector("[data-plano='v2']");
  await page.waitForFunction(() => document.querySelectorAll("[data-fachada-hit]").length === 69);

  const base = await page.evaluate(() => {
    const chicos = [];
    const selector = "a, button, [role=button], [role=tab], input, select, summary";
    for (const el of document.querySelectorAll(selector)) {
      if (el.closest("nextjs-portal, [data-nextjs-dialog-overlay], [data-next-badge]")) continue;
      const estilo = getComputedStyle(el);
      if (estilo.display === "none" || estilo.visibility === "hidden") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.width >= 44 && rect.height >= 44) continue;
      const exento = el.getAttribute("data-tactil-exento");
      if (exento && exento.trim()) continue;
      chicos.push({
        etiqueta: el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 40) || el.tagName,
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      });
    }
    const tabla = [...document.querySelectorAll("[data-tabla-fachadas]")].some((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    const vista = document.querySelector("[data-vista]")?.getAttribute("data-vista");
    const barra = document.querySelector("[data-barra-acciones]");
    let barraMal = false;
    if (vista === "ficha" || barra) {
      const posicion = barra ? getComputedStyle(barra).position : "";
      barraMal = posicion !== "fixed" && posicion !== "sticky";
    }
    return {
      desborde: document.documentElement.scrollWidth > window.innerWidth + 1,
      chicos,
      tabla,
      barraMal,
      visibles: document.querySelectorAll("[data-fachada-visible]").length,
      hits: document.querySelectorAll("[data-fachada-hit]").length,
      circulos: document.querySelectorAll("[data-plano] circle").length,
      touch: getComputedStyle(document.querySelector("[data-plano='v2']")).touchAction,
    };
  });

  if (base.desborde) anotar(ancho, ruta, "la página tiene scroll horizontal");
  if (base.chicos.length) anotar(ancho, ruta, `controles chicos: ${JSON.stringify(base.chicos)}`);
  if (base.tabla) anotar(ancho, ruta, "hay una tabla de fachadas visible");
  if (base.barraMal) anotar(ancho, ruta, "la barra de la ficha no está fija");
  if (base.visibles !== 69 || base.hits !== 69) {
    anotar(ancho, ruta, `se esperaban 69 fachadas y hay ${base.visibles}/${base.hits}`);
  }
  if (base.circulos !== 0) anotar(ancho, ruta, "el plano dibuja un circle");
  if (!base.touch.split(" ").includes("pan-y") && base.touch !== "pan-y") {
    anotar(ancho, ruta, `touch-action a 100 % es ${base.touch}`);
  }

  const ampliar = page.locator("[data-ampliar]");
  const cajaAmpliar = await ampliar.boundingBox();
  if (!cajaAmpliar || cajaAmpliar.width < 44 || cajaAmpliar.height < 44) {
    anotar(ancho, ruta, "Ampliar mide menos de 44 px");
  }

  const idTeclado = "s1-bodega-1a-f1";
  await page.locator(`[data-fachada-hit="${idTeclado}"]`).focus();
  await page.keyboard.press("Enter");
  await page.waitForSelector("[role=dialog]");
  if ((await page.locator("[data-tooltip]").count()) > 0) {
    anotar(ancho, ruta, "apareció un tooltip con el teclado");
  }
  const abrirTeclado = await page.getByRole("button", { name: "Abrir ficha" }).boundingBox();
  if (!abrirTeclado || abrirTeclado.width < 44 || abrirTeclado.height < 44) {
    anotar(ancho, ruta, "Abrir ficha mide menos de 44 px");
  }
  await cerrarHoja(page, idTeclado);

  const idToque = "s2-local-1-2-f1";
  const punto = await puntoFachada(page, idToque);
  if (!punto) anotar(ancho, ruta, "no está la fachada corta");
  else {
    await page.touchscreen.tap(punto.x, punto.y);
    try {
      await page.waitForSelector("[role=dialog]", { timeout: 3_000 });
    } catch {
      anotar(ancho, ruta, "tocar una fachada no abre el diálogo");
    }
    if ((await page.locator("[role=dialog]").count()) > 0) {
      const titulo = await page.locator("[role=dialog]").innerText();
      const nombre = await page.locator(`[data-fachada-hit="${idToque}"]`).getAttribute("data-nombre");
      if (!nombre || !titulo.includes(nombre)) {
        anotar(ancho, ruta, "el toque no seleccionó la fachada corta");
      }
      if ((await page.locator("[data-tooltip]").count()) > 0) {
        anotar(ancho, ruta, "apareció un tooltip al tocar");
      }
      await cerrarHoja(page, idToque);
    }
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  const cajaPlano = await page.locator("[data-plano='v2']").boundingBox();
  if (cajaPlano) {
    await page.mouse.move(cajaPlano.x + 12, cajaPlano.y + cajaPlano.height / 2);
    await page.mouse.wheel(0, 280);
  }
  const scrollY = await page.evaluate(() => window.scrollY);
  if (scrollY < 40) anotar(ancho, ruta, "la página no se desplaza en vertical con el plano a 100 %");
  await page.evaluate(() => window.scrollTo(0, 0));

  if (ruta.endsWith("/plano")) {
    await ampliar.click();
    await page.waitForFunction(() => {
      const caja = document.querySelector("[data-plano-scroll]");
      return caja != null && caja.scrollWidth > caja.clientWidth + 1;
    });
    const ampliado = await page.evaluate(() => {
      const caja = document.querySelector("[data-plano-scroll]");
      return {
        pagina: document.documentElement.scrollWidth > window.innerWidth + 1,
        interno: caja.scrollWidth > caja.clientWidth + 1,
      };
    });
    if (ampliado.pagina) anotar(ancho, ruta, "Ampliar desborda la página");
    if (!ampliado.interno) anotar(ancho, ruta, "Ampliar no scrollea dentro del plano");
    await page.screenshot({ path: join(OUT, `plano-${ancho}.png`) });

    const caja = await page.locator("[data-plano='v2']").boundingBox();
    if (caja) {
      const x = caja.x + 30;
      const y = caja.y + caja.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 36, y, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(250);
      if ((await page.locator("[role=dialog]").count()) > 0) {
        anotar(ancho, ruta, "arrastrar el plano ampliado abrió la hoja");
      }
    }
  }
}

mkdirSync(OUT, { recursive: true });
const propio = !process.env.DEMO_URL;
const servidor = propio ? iniciarServidor() : null;
try {
  if (propio) await esperarServidor(`${BASE}/dev/fachadas-v2/plano`);
  const browser = await chromium.launch({ headless: true });
  try {
    for (const ancho of ANCHOS) {
      const context = await browser.newContext({
        viewport: { width: ancho, height: 700 },
        hasTouch: true,
        isMobile: true,
      });
      const page = await context.newPage();
      for (const ruta of RUTAS) {
        console.log(`→ ${ancho}px ${ruta}`);
        await revisar(page, ancho, ruta);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
} finally {
  if (servidor && !servidor.killed) servidor.kill("SIGTERM");
}

if (fallos.length) {
  console.error(`\n${fallos.length} fallo(s)`);
  process.exit(1);
}
console.log("verify:fachadas:movil ok");
