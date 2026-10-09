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
const RUTAS = [
  "/dev/fachadas-v2",
  "/dev/fachadas-v2/plano",
  "/dev/fachadas-v2/main",
  "/dev/fachadas-v2/main?editar=0",
];
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
  let registro = "";
  const child = spawn(process.execPath, [bin, "dev", "-p", String(PORT), "--hostname", "127.0.0.1"], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });
  const anotar = (chunk) => {
    registro += chunk.toString();
    process.stdout.write(chunk);
  };
  child.stdout.on("data", anotar);
  child.stderr.on("data", anotar);
  child.registro = () => registro;
  return child;
}

function urlYaEnUso(registro) {
  if (!registro.includes("already running")) return null;
  const urls = [...registro.matchAll(/Local:\s+(https?:\/\/\S+)/g)].map((match) => match[1]);
  return urls.find((url) => !url.includes(`:${PORT}`)) ?? null;
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
  await page.waitForSelector("[role=dialog]", { state: "hidden", timeout: 5_000 });
  await page.waitForFunction(
    (fachadaId) => document.activeElement?.getAttribute("data-fachada-hit") === fachadaId,
    id,
    { timeout: 5_000 },
  );
}

async function revisar(page, ancho, ruta) {
  await page.goto(`${base}${ruta}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForSelector("[data-plano='v2']");
  await page.waitForFunction(() => document.querySelectorAll("[data-fachada-hit]").length === 69);

  const medicion = await page.evaluate(() => {
    const chicos = [];
    const selector = "a, button, [role=button], [role=tab], input, select, summary";
    for (const el of document.querySelectorAll(selector)) {
      if (el.closest("nextjs-portal, [data-nextjs-dialog-overlay], [data-next-badge]")) continue;
      if (el.getAttribute("aria-hidden") === "true" || el.closest("[aria-hidden='true']")) continue;
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

  if (medicion.desborde) anotar(ancho, ruta, "la página tiene scroll horizontal");
  if (medicion.chicos.length) anotar(ancho, ruta, `controles chicos: ${JSON.stringify(medicion.chicos)}`);
  if (medicion.tabla) anotar(ancho, ruta, "hay una tabla de fachadas visible");
  if (medicion.barraMal) anotar(ancho, ruta, "la barra de la ficha no está fija");
  if (medicion.visibles !== 69 || medicion.hits !== 69) {
    anotar(ancho, ruta, `se esperaban 69 fachadas y hay ${medicion.visibles}/${medicion.hits}`);
  }
  if (medicion.circulos !== 0) anotar(ancho, ruta, "el plano dibuja un circle");
  if (!medicion.touch.split(" ").includes("pan-y") && medicion.touch !== "pan-y") {
    anotar(ancho, ruta, `touch-action a 100 % es ${medicion.touch}`);
  }

  const ampliar = page.locator("[data-ampliar]");
  const cajaAmpliar = await ampliar.boundingBox();
  if (!cajaAmpliar || cajaAmpliar.width < 44 || cajaAmpliar.height < 44) {
    anotar(ancho, ruta, "Ampliar mide menos de 44 px");
  }

  const idTeclado = "s1-bodega-1a-f1";
  await page.locator(`[data-fachada-hit="${idTeclado}"]`).evaluate((el) => el.focus());
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

  await page.locator("[data-plano='v2']").evaluate((el) => el.scrollIntoView({ block: "start" }));
  const antesScroll = await page.evaluate(() => window.scrollY);
  const cajaPlano = await page.locator("[data-plano='v2']").boundingBox();
  if (cajaPlano) {
    const sesion = await page.context().newCDPSession(page);
    const x = cajaPlano.x + 24;
    const y = Math.min(cajaPlano.y + 48, cajaPlano.y + cajaPlano.height / 2);
    await sesion.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (const dy of [24, 56, 96]) {
      await sesion.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y - dy }],
      });
    }
    await sesion.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sesion.detach();
  }
  await page.waitForTimeout(200);
  const scrollY = await page.evaluate(() => window.scrollY);
  if (scrollY < antesScroll + 40) anotar(ancho, ruta, "la página no se desplaza en vertical con el plano a 100 %");
  if ((await page.locator("[role=dialog]").count()) > 0) {
    anotar(ancho, ruta, "desplazar el plano en vertical abrió la hoja");
  }
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

  if (ruta.includes("/main")) await revisarMain(page, ancho, ruta);
}

async function revisarMain(page, ancho, ruta) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const secciones = await page.evaluate(() => {
    const ids = ["tabs", "kpis", "plano", "lista", "vencimientos", "trabajos"];
    return ids.map((id) => {
      const el = document.querySelector(`[data-seccion="${id}"]`);
      if (!el) return null;
      return el.getBoundingClientRect().top + window.scrollY;
    });
  });
  if (secciones.some((top) => top == null)) {
    anotar(ancho, ruta, "falta una sección del orden móvil");
  } else {
    for (let indice = 1; indice < secciones.length; indice += 1) {
      if (secciones[indice] + 1 < secciones[indice - 1]) {
        anotar(ancho, ruta, "el orden de secciones no es tabs, KPIs, plano, lista, vencimientos, trabajos");
        break;
      }
    }
  }

  const tarjetas = await page.locator("[data-tarjetas-fachadas]").boundingBox();
  if (!tarjetas || tarjetas.height < 44) anotar(ancho, ruta, "no se ven las tarjetas por local");

  const ampliar = page.locator("[data-ampliar]");
  await ampliar.click();
  try {
    await page.waitForFunction(() => {
      const caja = document.querySelector("[data-plano-scroll]");
      return caja != null && caja.scrollWidth > caja.clientWidth + 1;
    });
  } catch {
    anotar(ancho, ruta, "Ampliar no scrollea dentro del plano");
  }
  const ampliado = await page.evaluate(() => {
    const caja = document.querySelector("[data-plano-scroll]");
    const leyenda = document.querySelector("[data-leyenda-scroll]");
    const overflow = leyenda ? getComputedStyle(leyenda).overflowX : "";
    return {
      pagina: document.documentElement.scrollWidth > window.innerWidth + 1,
      interno: caja != null && caja.scrollWidth > caja.clientWidth + 1,
      leyenda: overflow === "auto" || overflow === "scroll",
    };
  });
  if (ampliado.pagina) anotar(ancho, ruta, "Ampliar desborda la página");
  if (!ampliado.interno) anotar(ancho, ruta, "Ampliar no scrollea dentro del plano");
  if (!ampliado.leyenda) anotar(ancho, ruta, "los chips de la leyenda no scrollean en horizontal");
  if ((await ampliar.getAttribute("aria-pressed")) !== "true") {
    anotar(ancho, ruta, "Ampliar no queda presionado");
  }
  await ampliar.click();

  const puedeEditar = !ruta.includes("editar=0");
  const boton = page.locator("[data-registrar]");
  const cantidad = await boton.count();
  if (!puedeEditar && cantidad !== 0) anotar(ancho, ruta, "el botón fijo aparece sin permiso de edición");
  if (puedeEditar) {
    if (cantidad !== 1) anotar(ancho, ruta, "falta el botón fijo de registrar");
    else {
      const caja = await boton.boundingBox();
      if (!caja || caja.height < 44 || caja.width < 44) {
        anotar(ancho, ruta, "el botón fijo mide menos de 44 px");
      }
      const tapa = await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
        const fijo = document.querySelector("[data-registrar]");
        const trabajos = document.querySelector("[data-seccion='trabajos']");
        const filas = [...document.querySelectorAll("[data-fila-fachada]")];
        const ultima = filas[filas.length - 1];
        const tope = fijo.getBoundingClientRect().top;
        const fondo = (el) => (el ? el.getBoundingClientRect().bottom : 0);
        return {
          trabajos: fondo(trabajos) > tope + 1,
          fila: fondo(ultima) > tope + 1,
        };
      });
      if (tapa.trabajos) anotar(ancho, ruta, "el botón fijo tapa Trabajos realizados");
      if (tapa.fila) anotar(ancho, ruta, "el botón fijo tapa la última tarjeta");
    }
  }

  const fila = page.locator("[data-tarjetas-fachadas] [data-fila-fachada]").first();
  await fila.click();
  try {
    await page.waitForURL(/ficha/, { timeout: 15_000 });
  } catch {
    anotar(ancho, ruta, "la fila no abre la ficha");
  }
  if (!page.url().includes("ficha")) anotar(ancho, ruta, "la fila no abre la ficha");

  await page.goto(`${base}${ruta}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.locator("[data-plano='v2']").evaluate((el) => el.scrollIntoView({ block: "center" }));
  const punto = await puntoFachada(page, "s1-local-1-f1");
  if (!punto) anotar(ancho, ruta, "no está la fachada del plano");
  else {
    await page.touchscreen.tap(punto.x, punto.y);
    try {
      await page.waitForSelector("[role=dialog]", { timeout: 3_000 });
      await page.getByRole("button", { name: "Abrir ficha" }).click();
      await page.waitForURL(/ficha/, { timeout: 15_000 });
      if (!page.url().includes("ficha")) anotar(ancho, ruta, "Abrir ficha no navega a la ficha");
    } catch {
      anotar(ancho, ruta, "Abrir ficha no navega a la ficha");
    }
  }
}

mkdirSync(OUT, { recursive: true });
let base = process.env.DEMO_URL || BASE;
let servidor = null;
if (!process.env.DEMO_URL) {
  servidor = iniciarServidor();
  const inicio = Date.now();
  while (Date.now() - inicio < 20_000) {
    if (urlYaEnUso(servidor.registro()) || servidor.exitCode != null) break;
    if (servidor.registro().includes("Ready")) {
      try {
        const respuesta = await fetch(`http://127.0.0.1:${PORT}/dev/fachadas-v2/plano`, {
          signal: AbortSignal.timeout(2_000),
        });
        if (respuesta.status < 500) break;
      } catch {
        // el puerto todavía no atiende, o Next cedió ante otro dev server
      }
    }
    await new Promise((resolver) => setTimeout(resolver, 300));
  }
  const ajeno = urlYaEnUso(servidor.registro());
  if (ajeno) {
    base = ajeno;
    if (!servidor.killed) servidor.kill("SIGTERM");
    servidor = null;
  }
}
try {
  await esperarServidor(`${base}/dev/fachadas-v2/plano`);
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
