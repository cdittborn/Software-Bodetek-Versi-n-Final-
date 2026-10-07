import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { PantallaInformeSeguro } from "@/components/informe-seguro/PantallaInformeSeguro";
import { contenidoPublico, resolverAccesoPublico } from "@/lib/informe-seguro/acceso";
import { claveFirmaSegura, clavesDeSnapshot } from "@/lib/informe-seguro/claves";
import {
  borradorRecordadoCompatible,
  claveBorradorInforme,
  escribirBorradorRecordado,
  leerBorradorRecordado,
} from "@/lib/informe-seguro/borrador-local";
import { borradorDemo, fuenteDemo, previewsDemo, snapshotDemo } from "@/lib/informe-seguro/demo-datos";
import { horaMinutoChile } from "@/lib/informe-seguro/fechas";
import {
  MENSAJE_GUARDADO_OTRA_PESTANA,
  completarVersionesRecinto,
  recortarBorradorGuardado,
  firmasPorRecinto,
} from "@/lib/informe-seguro/parcial";
import { explicarErrorGuardado } from "@/lib/informe-seguro/persistir";
import { listarFaltantes } from "@/lib/informe-seguro/faltantes";
import { formatHorasCl } from "@/lib/informe-seguro/formato";
import { MENSAJE_INFORME_PUBLICO } from "@/components/informe-seguro/InformePublicoNoDisponible";
import { isProtectedDashboardPath } from "@/lib/modulos";
import { urlInformeParaLiquidador } from "@/lib/informe-seguro/rutas";
import { armarSnapshot, borradorInicial } from "@/lib/informe-seguro/snapshot";
import { armarVistaLiquidador, puedeValidarRecinto, textoQuePaso } from "@/lib/informe-seguro/vista";

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

  it("token inválido y apagado dan el mismo resultado; el link no vence", () => {
    const casos = [
      { encontrado: false, tokenActivo: false },
      { encontrado: true, tokenActivo: false },
    ];
    const resultados = casos.map((c) => resolverAccesoPublico(c));
    assert.deepEqual(resultados, ["oculto", "oculto"]);
    assert.equal(
      contenidoPublico([{ numero: 1, contenido: snapshotDemo }], "oculto"),
      null,
    );
    assert.equal(
      resolverAccesoPublico({ encontrado: true, tokenActivo: true }),
      "ok",
    );
    const acceso = readFileSync(
      fileURLToPath(new URL("./acceso.ts", import.meta.url)),
      "utf8",
    );
    const publico = readFileSync(
      fileURLToPath(new URL("./cargarPublico.ts", import.meta.url)),
      "utf8",
    );
    assert.doesNotMatch(acceso, /tokenExpira|token_expira/);
    assert.doesNotMatch(publico, /token_expira/);
  });

  it("la vista del liquidador no muestra edición, plan ni archivos ocultos", () => {
    const vista = armarVistaLiquidador(fuenteDemo, borradorDemo);
    const html = renderToStaticMarkup(
      createElement(PantallaInformeSeguro, {
        modo: "liquidador",
        controles: false,
        fuente: vista.fuente,
        inicial: vista.borrador,
        urls: previewsDemo,
        recintoCodigo: "FLT-0001",
        onElegirRecinto: () => undefined,
        onVolverLista: () => undefined,
      }),
    );
    assert.equal(html.includes("Validar descripción"), false);
    assert.equal(html.includes("checkbox"), false);
    assert.equal(html.includes("Oculta"), false);
    assert.equal(html.includes("Cotización"), false);
    assert.equal(html.includes(PLAN), false);
    assert.equal(html.includes("12,5"), false);
    assert.equal(html.includes("Marcelo"), false);
    assert.match(html, /Qué pasó/);
    assert.match(html, /ANTES/);
    assert.match(html, /DESPUÉS/);
    assert.equal(html.includes(NOTA), false);
    assert.equal(html.includes("Por validar"), false);
    assert.equal(html.includes("Validada"), false);
    const vacio = armarVistaLiquidador(fuenteDemo, {
      ...borradorDemo,
      subproyectos: borradorDemo.subproyectos.map((s) =>
        s.tipo === "cielo" ? { ...s, descripcionSeguro: "" } : s,
      ),
      media: borradorDemo.media.map((m) =>
        m.trabajoMediaId === "m-despues" ? { ...m, incluido: false } : m,
      ),
    });
    assert.equal(
      vacio.borrador.subproyectos.find((s) => s.tipo === "cielo")?.descripcionSeguro,
      "",
    );
    assert.equal(
      vacio.fuente.some((p) => p.subproyectos.some((s) => s.tipo === "cielo")),
      false,
    );
    assert.equal(
      vacio.fuente.some((p) => p.codigo === "FLT-0002"),
      false,
    );
    assert.equal(JSON.stringify(vacio).includes(NOTA), false);
    assert.equal(JSON.stringify(vacio).includes(PLAN), false);
    assert.equal(
      vacio.fuente.some((p) => p.media.some((m) => m.id === "m-despues")),
      false,
    );
    assert.equal(textoQuePaso("", "nota de la ficha"), "nota de la ficha");
    assert.equal(textoQuePaso("texto propio", "nota de la ficha"), "texto propio");
    assert.equal(puedeValidarRecinto(borradorInicial(fuenteDemo, borradorDemo.encabezado), fuenteDemo[0]!.trabajoId), false);
    assert.equal(puedeValidarRecinto(borradorDemo, fuenteDemo[0]!.trabajoId), true);
  });

  it("el editor parte sin archivos en el informe y no ofrece guardar el vencimiento aparte", () => {
    const html = renderToStaticMarkup(
      createElement(PantallaInformeSeguro, {
        modo: "edicion",
        controles: true,
        fuente: fuenteDemo,
        inicial: borradorDemo,
        urls: previewsDemo,
        recintoCodigo: "FLT-0001",
        onElegirRecinto: () => undefined,
        onVolverLista: () => undefined,
        onGuardar: async () => ({ ok: true, tokenActivo: false, linkPath: null }),
        onActivar: async () => ({ ok: true, tokenActivo: true, linkPath: "/informe-seguro/x" }),
      }),
    );
    assert.equal(html.includes("Guardar vencimiento"), false);
    assert.equal(html.includes("Vence el"), false);
    assert.equal(html.includes("Volver a lo anotado"), false);
    assert.equal(html.includes("Oculta"), false);
    assert.match(html, /Quitar del informe/);
    assert.match(html, /Pasar los 3 visibles/);
    assert.match(html, /Quitar los 3 visibles/);
    assert.match(html, /En el informe/);
    assert.match(html, /5 de 5/);
    const inicial = borradorInicial(fuenteDemo, borradorDemo.encabezado);
    assert.equal(inicial.media.every((m) => m.incluido === false), true);
    assert.equal(inicial.recintos.every((r) => r.descripcionValidada === false), true);
    assert.equal(inicial.subproyectos.every((s) => s.descripcionSeguro === ""), true);
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

  it("el loader público lee lo guardado y no el plan ni versiones", () => {
    const src = readFileSync(
      fileURLToPath(new URL("./cargarPublico.ts", import.meta.url)),
      "utf8",
    );
    assert.match(src, /informe_seguro_recintos/);
    assert.match(src, /from\("trabajos"\)/);
    assert.match(src, /armarVistaLiquidador/);
    assert.doesNotMatch(src, /informe_seguro_versiones/);
    assert.doesNotMatch(src, /horas_maestros|valor_reparacion|cargarDatosEventoFiltracion/);
  });

  it("guardar el borrador va por una función y no escribe el encabezado", () => {
    const src = readFileSync(
      fileURLToPath(new URL("./persistir.ts", import.meta.url)),
      "utf8",
    );
    assert.match(src, /rpc\("guardar_borrador_informe_seguro"/);
    assert.doesNotMatch(src, /\.insert\(/);
    assert.doesNotMatch(src, /\.delete\(/);
    const escritura = src.slice(src.indexOf('rpc("guardar_borrador_informe_seguro"'));
    assert.doesNotMatch(escritura, /numero_poliza|nombre_evento|direccion_centro|contacto_bodetek/);
    const sql = readFileSync(
      fileURLToPath(
        new URL("../../../supabase/migrations/20261007013000_informe_seguro_guardado.sql", import.meta.url),
      ),
      "utf8",
    );
    assert.match(sql, /delete from public\.informe_seguro_media where informe_id = v_id/);
    assert.match(sql, /delete from public\.informe_seguro_subproyectos where informe_id = v_id/);
    assert.match(sql, /delete from public\.informe_seguro_recintos where informe_id = v_id/);
    assert.match(sql, /then prev\.validada_at/);
    assert.match(sql, /then prev\.validada_por/);
    assert.doesNotMatch(sql, /then now\(\) else null/);
    assert.doesNotMatch(sql, /numero_poliza/);
    assert.doesNotMatch(sql, /token_expira/);
    assert.doesNotMatch(sql, /public\.trabajo_media[^_]/);
    const pantalla = readFileSync(
      fileURLToPath(new URL("../../components/informe-seguro/PantallaInformeSeguro.tsx", import.meta.url)),
      "utf8",
    );
    assert.doesNotMatch(pantalla, /Vence el/);
  });

  it("la hora de Chile sale en HH:MM y el error de guardado no se esconde", () => {
    assert.equal(horaMinutoChile(new Date("2026-08-16T16:30:00Z")), "12:30");
    assert.equal(horaMinutoChile(new Date("2026-01-15T03:05:00Z")), "00:05");
    assert.equal(
      explicarErrorGuardado({ code: "PGRST202", message: "Could not find the function" }),
      "Falta aplicar la función de guardado del informe. No escribí nada en la base.",
    );
    const real = "new row for relation informes_seguro violates check constraint";
    assert.equal(explicarErrorGuardado({ code: "23514", message: real }), real);
    assert.equal(
      explicarErrorGuardado({
        code: "P0001",
        message: "PL/pgSQL function guardar_borrador_informe_seguro line 40",
      }),
      "PL/pgSQL function guardar_borrador_informe_seguro line 40",
    );
    assert.equal(
      explicarErrorGuardado({
        code: "P0001",
        message: `${MENSAJE_GUARDADO_OTRA_PESTANA}\nCONTEXT: PL/pgSQL`,
      }),
      MENSAJE_GUARDADO_OTRA_PESTANA,
    );
  });

  it("guardar manda solo los recintos cambiados y su versión", () => {
    const base = {
      ...borradorDemo,
      recintos: borradorDemo.recintos.map((r) => ({
        ...r,
        version: r.trabajoId.startsWith("1111") ? 4 : null,
      })),
    };
    const firmas = firmasPorRecinto(fuenteDemo, base);
    const editado = {
      ...base,
      subproyectos: base.subproyectos.map((s) =>
        s.trabajoId.startsWith("2222") ? { ...s, descripcionSeguro: "TEXTO-NUEVO" } : s,
      ),
    };
    const soloTexto = recortarBorradorGuardado(fuenteDemo, editado, firmas);
    assert.deepEqual(
      soloTexto.recintos.map((r) => r.trabajoId),
      [fuenteDemo[1]!.trabajoId],
    );
    assert.equal(soloTexto.recintos[0]?.version, null);
    assert.equal(soloTexto.subproyectos.every((s) => s.trabajoId.startsWith("2222")), true);
    assert.equal(soloTexto.media.length, 0);
    assert.equal(JSON.stringify(soloTexto).includes("TEXTO-NUEVO"), true);
    assert.equal(JSON.stringify(soloTexto).includes("m-tech"), false);

    const conArchivo = {
      ...editado,
      media: editado.media.map((m) =>
        m.trabajoMediaId === "m-tech" ? { ...m, incluido: false } : m,
      ),
    };
    const firmasTexto = firmasPorRecinto(fuenteDemo, editado);
    const soloArchivo = recortarBorradorGuardado(fuenteDemo, conArchivo, firmasTexto);
    assert.deepEqual(
      soloArchivo.recintos.map((r) => [r.trabajoId, r.version]),
      [[fuenteDemo[0]!.trabajoId, 4]],
    );
    assert.equal(soloArchivo.media.some((m) => m.trabajoMediaId === "m-tech"), true);
    assert.equal(soloArchivo.subproyectos.every((s) => s.trabajoId.startsWith("1111")), true);

    const todo = recortarBorradorGuardado(fuenteDemo, conArchivo, null);
    assert.equal(todo.recintos.length, base.recintos.length);

    const sinVersion = {
      ...base,
      recintos: base.recintos.map((r) => ({ ...r, version: undefined as unknown as null })),
    };
    const completado = completarVersionesRecinto(sinVersion, base);
    assert.equal(completado.recintos.find((r) => r.trabajoId.startsWith("1111"))?.version, 4);
    assert.equal(completado.recintos.find((r) => r.trabajoId.startsWith("2222"))?.version, null);
    const yaNull = completarVersionesRecinto(base, {
      ...base,
      recintos: base.recintos.map((r) => ({ ...r, version: 9 })),
    });
    assert.equal(yaNull.recintos.find((r) => r.trabajoId.startsWith("2222"))?.version, null);
    assert.equal(yaNull.recintos.find((r) => r.trabajoId.startsWith("1111"))?.version, 4);
  });

  it("la versión del recinto rechaza un guardado viejo y no borra el informe entero", () => {
    const sql = readFileSync(
      fileURLToPath(
        new URL("../../../supabase/migrations/20261007180000_informe_seguro_version_recinto.sql", import.meta.url),
      ),
      "utf8",
    );
    const rollback = readFileSync(
      fileURLToPath(new URL("../../../scripts/aplicar-informe-version-rollback.sql", import.meta.url)),
      "utf8",
    );
    assert.match(sql, /add column version integer not null default 1/);
    assert.match(sql, /version = r\.version \+ 1/);
    assert.match(sql, /p\.version is null and r\.trabajo_id is not null/);
    assert.match(sql, /Falta la versión del recinto/);
    assert.match(sql, /on conflict \(informe_id, trabajo_id\) do nothing/);
    assert.match(sql, /else null end,\n    1\n/);
    assert.equal(sql.includes(MENSAJE_GUARDADO_OTRA_PESTANA), true);
    assert.doesNotMatch(sql, /delete from public\.informe_seguro_recintos/);
    assert.match(sql, /delete from public\.informe_seguro_media m/);
    assert.match(sql, /m\.trabajo_id = p\.trabajo_id/);
    assert.match(sql, /then r\.validada_at/);
    assert.match(sql, /then r\.validada_por/);
    assert.doesNotMatch(sql, /token_expira/);
    assert.doesNotMatch(sql, /public\.trabajo_media[^_]/);
    assert.match(rollback, /20261007013000_informe_seguro_guardado\.sql/);
    assert.match(rollback, /drop column if exists version/);
  });

  it("el borrador recordado conserva textos y archivos al volver a abrir la pantalla", () => {
    const mapa = new Map<string, string>();
    const almacen = {
      getItem: (clave: string) => mapa.get(clave) ?? null,
      setItem: (clave: string, valor: string) => {
        mapa.set(clave, valor);
      },
      removeItem: (clave: string) => {
        mapa.delete(clave);
      },
    };
    const clave = claveBorradorInforme("evento-1");
    const editado = {
      ...borradorDemo,
      subproyectos: borradorDemo.subproyectos.map((s, index) =>
        index === 0 ? { ...s, descripcionSeguro: "TEXTO-LOCAL-2" } : s,
      ),
      media: borradorDemo.media.map((m, index) => (index === 0 ? { ...m, incluido: true } : m)),
    };
    escribirBorradorRecordado(almacen, clave, {
      borrador: editado,
      baseFirma: "servidor",
      guardadoA: null,
      firmasBase: { "11111111-1111-4111-8111-111111111111": "firma" },
    });
    const leido = leerBorradorRecordado(almacen, clave);
    assert.equal(leido?.borrador.subproyectos[0]?.descripcionSeguro, "TEXTO-LOCAL-2");
    assert.equal(leido?.borrador.media[0]?.incluido, true);
    assert.equal(leido?.borrador.subproyectos.length, borradorDemo.subproyectos.length);
    assert.equal(leido?.borrador.media.length, borradorDemo.media.length);
    assert.equal(leido?.firmasBase?.["11111111-1111-4111-8111-111111111111"], "firma");
    assert.equal(borradorRecordadoCompatible("servidor", "editado", "servidor"), true);
    assert.equal(borradorRecordadoCompatible("servidor", "servidor", "viejo"), true);
    assert.equal(borradorRecordadoCompatible("servidor-nuevo", "editado", "servidor-viejo"), false);
    assert.equal(leerBorradorRecordado(almacen, "otra"), null);
    almacen.setItem(clave, "{");
    assert.equal(leerBorradorRecordado(almacen, clave), null);
  });

  it("cambiar de recinto no recarga el informe y el guardado avisa en pantalla", () => {
    const ruta = readFileSync(
      fileURLToPath(new URL("../../components/informe-seguro/InformeSeguroRuta.tsx", import.meta.url)),
      "utf8",
    );
    const pantalla = readFileSync(
      fileURLToPath(new URL("../../components/informe-seguro/PantallaInformeSeguro.tsx", import.meta.url)),
      "utf8",
    );
    assert.match(ruta, /history\.pushState/);
    assert.doesNotMatch(ruta, /router\.push/);
    assert.match(pantalla, /Cambios sin guardar/);
    assert.match(pantalla, /Guardando…/);
    assert.match(pantalla, /Guardado a las /);
    assert.match(pantalla, /catch \(err\)/);
    assert.doesNotMatch(pantalla, /setBorrador\(inicial\)/);
    assert.doesNotMatch(pantalla, /Cambios guardados/);
  });

  it("la ruta pública no exige login", () => {
    assert.equal(isProtectedDashboardPath("/informe-seguro/abc"), false);
    assert.equal(isProtectedDashboardPath("/informe-seguro"), false);
    assert.equal(isProtectedDashboardPath("/trabajos/c/a/s/b/e/c/informe"), true);
  });

  it("el link del liquidador sale siempre de producción y el fallo público avisa en español", () => {
    assert.equal(
      urlInformeParaLiquidador("/informe-seguro/abc"),
      "https://software-bodetek-versi-n-final.vercel.app/informe-seguro/abc",
    );
    assert.equal(
      urlInformeParaLiquidador("informe-seguro/abc"),
      "https://software-bodetek-versi-n-final.vercel.app/informe-seguro/abc",
    );
    const pantalla = readFileSync(
      fileURLToPath(new URL("../../components/informe-seguro/PantallaInformeSeguro.tsx", import.meta.url)),
      "utf8",
    );
    assert.match(pantalla, /urlInformeParaLiquidador\(path\)/);
    assert.doesNotMatch(pantalla, /window\.location\.origin/);
    const pagina = readFileSync(
      fileURLToPath(new URL("../../app/informe-seguro/[token]/page.tsx", import.meta.url)),
      "utf8",
    );
    const error = readFileSync(
      fileURLToPath(new URL("../../app/informe-seguro/[token]/error.tsx", import.meta.url)),
      "utf8",
    );
    assert.match(pagina, /InformePublicoNoDisponible/);
    assert.match(error, /InformePublicoNoDisponible/);
    assert.equal(MENSAJE_INFORME_PUBLICO.includes("Pide a Bodetek"), true);
    assert.doesNotMatch(MENSAJE_INFORME_PUBLICO, /A server error occurred/);
  });
});
