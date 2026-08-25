import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calcularCompletitud,
  esEntregaAtrasada,
  type FiltracionFormValues,
  type MediaCounts,
} from "./completitud";
import {
  filtrarPorTokensCampo,
  reemplazarTokenCampo,
  type FiltroCampoToken,
} from "./filtrosCampoEvento";
import {
  parseProblemas,
  problemasVacios,
  toggleTipoProblema,
  tiposActivos,
} from "./problemas";
import type { ProyectoFiltracionEnriquecido } from "./completitud.ts";

const mediaVacia: MediaCounts = {
  antes: 0,
  despues: 0,
  planoAgua: 0,
  planoReparacion: 0,
  cotizacion: 0,
};

function valuesBase(
  overrides: Partial<FiltracionFormValues> = {},
): FiltracionFormValues {
  return {
    recintoId: "r1",
    fechaEntregaEstimada: "2026-09-01",
    estado: "sin_asignar",
    ejecutadoPor: "none",
    proveedorId: "none",
    fechaEntregaReal: "",
    horasMaestros: "",
    numeroCotizacion: "",
    valorRecinto: "",
    valorTotalCotizacion: "",
    problemas: problemasVacios(),
    ...overrides,
  };
}

describe("tipos de problema", () => {
  it("toggle no pierde datos de otros problemas", () => {
    let p = problemasVacios();
    p = toggleTipoProblema(p, "techumbre", true);
    p = {
      ...p,
      techumbre: { ...p.techumbre, descripcion: "gotea", plan: "sellar" },
    };
    p = toggleTipoProblema(p, "canaleta", true);
    p = {
      ...p,
      canaleta: { ...p.canaleta, descripcion: "rota", plan: "cambiar" },
    };
    p = toggleTipoProblema(p, "techumbre", false);
    assert.equal(p.techumbre.activo, false);
    assert.equal(p.techumbre.descripcion, "gotea");
    assert.equal(p.techumbre.plan, "sellar");
    assert.equal(p.canaleta.descripcion, "rota");
    p = toggleTipoProblema(p, "techumbre", true);
    assert.equal(p.techumbre.descripcion, "gotea");
    assert.deepEqual(tiposActivos(p), ["techumbre", "canaleta"]);
  });

  it("legacy sin keyword cae a techumbre fallback", () => {
    const p = parseProblemas(null, "rotura", "reparar");
    assert.equal(p.techumbre.activo, true);
    assert.equal(p.techumbre.descripcion, "rotura");
    assert.equal(p.canaleta.activo, false);
    assert.equal(p.cielo.activo, false);
  });

  it("cielo americano no cuenta como tipo Cielo; techumbre en el texto sí confirma", () => {
    const material = parseProblemas(null, "daño en cielo americano", "");
    assert.deepEqual(tiposActivos(material), ["techumbre"]);
    const techumbreCieloAmericano = parseProblemas(
      null,
      "Techumbre con roturas y daño en cielos americanos",
      "",
    );
    assert.deepEqual(tiposActivos(techumbreCieloAmericano), ["techumbre"]);
    const cieloReal = parseProblemas(null, "cielo de oficinas colapsado", "");
    assert.deepEqual(tiposActivos(cieloReal), ["cielo"]);
  });

  it("legacy canaleta / eléctrico únicos; techumbre por keyword no es fallback", () => {
    const canaleta = parseProblemas(null, "Canaletas en muy mal estado", "definir método");
    assert.deepEqual(tiposActivos(canaleta), ["canaleta"]);
    const electrico = parseProblemas(null, "falla eléctrica en tablero", "");
    assert.deepEqual(tiposActivos(electrico), ["electrico"]);
    const electric = parseProblemas(null, "revision electrico pendiente", "");
    assert.deepEqual(tiposActivos(electric), ["electrico"]);
    const tech = parseProblemas(null, "Roturas en techumbre", "");
    assert.deepEqual(tiposActivos(tech), ["techumbre"]);
  });

  it("legacy con varias keywords queda ambiguo (todos los hits, no un solo tipo)", () => {
    const p = parseProblemas(
      null,
      "Rotura en techumbre + colapso de canaleta; cielos colapsados; circuitos eléctricos",
      "reparar",
    );
    assert.deepEqual(tiposActivos(p), ["techumbre", "canaleta", "cielo", "electrico"]);
    assert.equal(p.canaleta.descripcion, p.cielo.descripcion);
  });
});

describe("completitud compartida", () => {
  it("cotización solo aplica a proveedor externo", () => {
    const vacio = calcularCompletitud(valuesBase(), mediaVacia);
    assert.equal(vacio.faltantes.some((f) => f.id === "cotizacion"), false);
    assert.equal(vacio.faltantes.some((f) => f.id === "horas_maestros"), false);

    const proveedor = calcularCompletitud(
      valuesBase({ ejecutadoPor: "proveedor_externo" }),
      mediaVacia,
    );
    assert.equal(proveedor.faltantes.some((f) => f.id === "cotizacion"), true);
    assert.equal(proveedor.faltantes.some((f) => f.id === "horas_maestros"), false);

    const maestros = calcularCompletitud(
      valuesBase({ ejecutadoPor: "maestros_bodetek" }),
      mediaVacia,
    );
    assert.equal(maestros.faltantes.some((f) => f.id === "cotizacion"), false);
    assert.equal(maestros.faltantes.some((f) => f.id === "horas_maestros"), true);
  });

  it("cada tipo activo exige problema y plan", () => {
    const problemas = toggleTipoProblema(problemasVacios(), "cielo", true);
    const r = calcularCompletitud(valuesBase({ problemas }), mediaVacia);
    assert.equal(r.faltantes.some((f) => f.id === "descripcion_cielo"), true);
    assert.equal(r.faltantes.some((f) => f.id === "plan_cielo"), true);
    assert.equal(r.faltantes.some((f) => f.id === "descripcion_techumbre"), false);
  });
});

describe("entrega atrasada", () => {
  it("marca atrasada si estimada pasó y no hay entrega real", () => {
    const ahora = new Date("2026-08-25T12:00:00");
    assert.equal(esEntregaAtrasada("2026-08-20", null, ahora), true);
    assert.equal(esEntregaAtrasada("2026-08-20", "2026-08-21", ahora), false);
    assert.equal(esEntregaAtrasada("2026-09-01", null, ahora), false);
    assert.equal(esEntregaAtrasada(null, null, ahora), false);
  });
});

function proyectoFake(
  id: string,
  extra: Partial<ProyectoFiltracionEnriquecido>,
): ProyectoFiltracionEnriquecido {
  return {
    id,
    titulo: id,
    descripcion: null,
    plan_accion: null,
    problemas: problemasVacios(),
    estado: "sin_asignar",
    gravedad: "critico",
    ejecutado_por: null,
    proveedor_id: null,
    proveedor_nombre: null,
    proveedor_texto_legado: null,
    valor_reparacion: null,
    valor_total_cotizacion: null,
    numero_cotizacion: null,
    horas_maestros_bodetek: null,
    codigo_filtracion: null,
    created_by: null,
    created_by_nombre: null,
    created_at: "2026-08-01T00:00:00Z",
    fecha_inicio: null,
    fecha_entrega_estimada: null,
    fecha_termino: null,
    recinto_id: id,
    recinto_codigo: id,
    recinto_nombre: id,
    recinto_arrendatario: null,
    categoria_id: "c",
    subtipo_id: "s",
    evento_id: "e",
    media: {
      antes: [],
      despues: [],
      plano_agua: [],
      plano_reparacion: [],
      cotizacion: [],
    },
    completitud: calcularCompletitud(valuesBase(), mediaVacia),
    sinDespues: true,
    entregaAtrasada: false,
    ...extra,
  } as ProyectoFiltracionEnriquecido;
}

describe("filtros OR dentro del campo y AND entre campos", () => {
  const critico = proyectoFake("1", { gravedad: "critico", ejecutado_por: "proveedor_externo" });
  const medio = proyectoFake("2", { gravedad: "medio", ejecutado_por: "proveedor_externo" });
  const criticoMaestros = proyectoFake("3", {
    gravedad: "critico",
    ejecutado_por: "maestros_bodetek",
  });
  const list = [critico, medio, criticoMaestros];

  it("dos valores del mismo campo se combinan con OR", () => {
    const tokens: FiltroCampoToken[] = [
      { campo: "gravedad", valor: "critico", labelCampo: "Gravedad", labelValor: "Crítico" },
      { campo: "gravedad", valor: "medio", labelCampo: "Gravedad", labelValor: "Medio" },
    ];
    const r = filtrarPorTokensCampo(list, tokens);
    assert.deepEqual(r.map((p) => p.id).sort(), ["1", "2", "3"]);
  });

  it("valores de campos distintos se combinan con AND", () => {
    const tokens: FiltroCampoToken[] = [
      { campo: "gravedad", valor: "critico", labelCampo: "Gravedad", labelValor: "Crítico" },
      {
        campo: "ejecutado_por",
        valor: "proveedor_externo",
        labelCampo: "Ejecutado por",
        labelValor: "Proveedor externo",
      },
    ];
    const r = filtrarPorTokensCampo(list, tokens);
    assert.deepEqual(r.map((p) => p.id), ["1"]);
  });

  it("reemplazarTokenCampo agrega el segundo valor del mismo campo", () => {
    const t1: FiltroCampoToken = {
      campo: "gravedad",
      valor: "critico",
      labelCampo: "Gravedad",
      labelValor: "Crítico",
    };
    const t2: FiltroCampoToken = {
      campo: "gravedad",
      valor: "medio",
      labelCampo: "Gravedad",
      labelValor: "Medio",
    };
    const next = reemplazarTokenCampo(reemplazarTokenCampo([], t1), t2);
    assert.equal(next.length, 2);
  });
});
