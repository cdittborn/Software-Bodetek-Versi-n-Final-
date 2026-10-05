import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { VistaInformeSeguro } from "@/components/informe-seguro/VistaInformeSeguro";
import { contenidoPublico, resolverAccesoPublico } from "@/lib/informe-seguro/acceso";
import { claveFirmaSegura, clavesDeSnapshot } from "@/lib/informe-seguro/claves";
import { borradorDemo, fuenteDemo, previewsDemo, snapshotDemo } from "@/lib/informe-seguro/demo-datos";
import { listarFaltantes } from "@/lib/informe-seguro/faltantes";
import { formatHorasCl } from "@/lib/informe-seguro/formato";
import { isProtectedDashboardPath } from "@/lib/modulos";
import { armarSnapshot, borradorInicial } from "@/lib/informe-seguro/snapshot";

const NOTA = "NOTA-INTERNA-NO-MOSTRAR";
const PLAN = "PLAN-INTERNO-NO-MOSTRAR";

describe("informe para seguro", () => {
  it("formatea horas con coma decimal", () => {
    assert.equal(formatHorasCl(12.5), "12,5");
    assert.equal(formatHorasCl(4), "4");
  });

  it("cuenta subproyectos sin ejecutor y maestros sin horas", () => {
    const todos = listarFaltantes(fuenteDemo);
    assert.equal(todos.sinEjecutor.length, 1);
    assert.equal(todos.sinEjecutor[0]?.tipo, "electrico");
    assert.equal(todos.sinHoras.length, 1);
    assert.equal(todos.sinHoras[0]?.codigo, "FLT-0002");
    assert.equal(todos.total, 2);

    const sinElectrico = {
      ...borradorDemo,
      subproyectos: borradorDemo.subproyectos.map((s) =>
        s.tipo === "electrico" ? { ...s, incluido: false } : s,
      ),
    };
    const filtrado = listarFaltantes(fuenteDemo, sinElectrico);
    assert.equal(filtrado.sinEjecutor.length, 0);
    assert.equal(filtrado.sinHoras.length, 1);
    assert.equal(filtrado.total, 1);
  });

  it("no copia notas internas ni URLs al snapshot, y deja cotizaciones vacías", () => {
    const json = JSON.stringify(snapshotDemo);
    assert.equal(json.includes(NOTA), false);
    assert.equal(json.includes(PLAN), false);
    assert.equal(json.includes("publicUrl"), false);
    assert.equal(json.includes("http"), false);
    assert.deepEqual(snapshotDemo.cotizaciones, []);
    assert.equal(snapshotDemo.resumen.recintos, 2);
    assert.equal(snapshotDemo.resumen.subproyectos, 4);
    assert.equal(snapshotDemo.resumen.maestros, 2);
    assert.equal(snapshotDemo.resumen.proveedor, 1);
    assert.equal(snapshotDemo.resumen.horasMaestros, 12.5);

    const local1 = snapshotDemo.recintos.find((r) => r.codigo === "FLT-0001");
    assert.ok(local1);
    assert.equal(local1.horasMaestros, 12.5);
    assert.equal(local1.media.length, 1);
    assert.equal(local1.media[0]?.key, "demo/recinto");
    const cielo = local1.subproyectos.find((s) => s.tipo === "cielo");
    assert.equal(cielo?.ejecutor, "proveedor_externo");
    assert.equal(cielo?.proveedorNombre, "Marcelo Ríos");
    assert.equal(cielo?.horasMaestros, null);
    const techumbre = local1.subproyectos.find((s) => s.tipo === "techumbre");
    assert.equal(techumbre?.horasMaestros, 12.5);
    assert.equal(techumbre?.media.some((m) => m.esPortada && m.tipoArchivo === "foto"), true);
  });

  it("el borrador posterior no cambia la versión ya publicada", () => {
    const publicado = snapshotDemo;
    const despues = armarSnapshot(fuenteDemo, {
      ...borradorDemo,
      recintos: borradorDemo.recintos.map((r) => ({
        ...r,
        descripcionSeguro: "TEXTO-DE-BORRADOR-NUEVO",
      })),
    });
    const acceso = resolverAccesoPublico({
      encontrado: true,
      tokenActivo: true,
      tokenExpira: null,
      hoy: "2026-10-05",
      hayVersion: true,
    });
    const vista = contenidoPublico(
      [
        { numero: 1, contenido: publicado },
        { numero: 2, contenido: despues },
      ].slice(0, 1),
      acceso,
    );
    assert.equal(vista?.encabezado.nombre, publicado.encabezado.nombre);
    assert.equal(JSON.stringify(vista).includes("TEXTO-DE-BORRADOR-NUEVO"), false);
    assert.equal(
      vista?.recintos[0]?.descripcionSeguro,
      publicado.recintos[0]?.descripcionSeguro,
    );
  });

  it("token inválido, apagado, vencido y sin versión dan el mismo resultado", () => {
    const hoy = "2026-10-05";
    const casos = [
      { encontrado: false, tokenActivo: false, tokenExpira: null, hoy, hayVersion: false },
      { encontrado: true, tokenActivo: false, tokenExpira: null, hoy, hayVersion: true },
      { encontrado: true, tokenActivo: true, tokenExpira: "2026-10-04", hoy, hayVersion: true },
      { encontrado: true, tokenActivo: true, tokenExpira: null, hoy, hayVersion: false },
    ];
    const resultados = casos.map((c) => resolverAccesoPublico(c));
    assert.deepEqual(resultados, ["oculto", "oculto", "oculto", "oculto"]);
    assert.equal(
      contenidoPublico([{ numero: 1, contenido: snapshotDemo }], "oculto"),
      null,
    );
    assert.equal(
      resolverAccesoPublico({
        encontrado: true,
        tokenActivo: true,
        tokenExpira: hoy,
        hoy,
        hayVersion: true,
      }),
      "ok",
    );
  });

  it("la vista pública no muestra alertas internas ni cotizaciones", () => {
    const html = renderToStaticMarkup(
      createElement(VistaInformeSeguro, {
        snapshot: snapshotDemo,
        urls: previewsDemo,
      }),
    );
    assert.equal(/sin ejecutor definido/i.test(html), false);
    assert.equal(/sin horas/i.test(html), false);
    assert.equal(/Faltan/i.test(html), false);
    assert.equal(html.includes("Cotización"), false);
    assert.equal(html.includes(NOTA), false);
    assert.equal(html.includes(PLAN), false);
    assert.match(html, /Sin ejecutor/);
    assert.match(html, /Marcelo Ríos/);
    assert.match(html, /12,5/);
    assert.equal(html.includes("TEXTO-DE-BORRADOR-NUEVO"), false);
  });

  it("solo firma claves del snapshot, nunca una URL", () => {
    const claves = clavesDeSnapshot(snapshotDemo);
    assert.ok(claves.includes("demo/techumbre"));
    assert.ok(claves.includes("demo/video-thumb"));
    assert.equal(claves.every((c) => !c.includes("http")), true);
    assert.equal(claveFirmaSegura("https://evil.example/x"), false);
    assert.equal(claveFirmaSegura("../secret"), false);
    const inicial = borradorInicial(fuenteDemo, borradorDemo.encabezado);
    assert.equal(inicial.recintos.length, 2);
    assert.equal(inicial.media.some((m) => m.esPortada), true);
  });

  it("el loader público no lee el borrador ni las tablas internas", () => {
    const src = readFileSync(
      fileURLToPath(new URL("./cargarPublico.ts", import.meta.url)),
      "utf8",
    );
    assert.match(src, /informe_seguro_versiones/);
    assert.doesNotMatch(
      src,
      /informe_seguro_recintos|informe_seguro_subproyectos|informe_seguro_media|cargarDatosEventoFiltracion|from\("trabajos"\)/,
    );
  });

  it("la ruta pública no exige login", () => {
    assert.equal(isProtectedDashboardPath("/informe-seguro/abc"), false);
    assert.equal(isProtectedDashboardPath("/informe-seguro"), false);
    assert.equal(isProtectedDashboardPath("/trabajos/c/a/s/b/e/c/informe"), true);
  });
});
