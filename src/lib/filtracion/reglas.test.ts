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
  fechaEntregaEstimadaFicha,
  parseProblemas,
  problemasVacios,
  TIPOS_PROBLEMA,
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
  cotizacionPorTipo: {
    techumbre: 0,
    cielo: 0,
    electrico: 0,
    suciedad_piso: 0,
  },
};

function valuesBase(
  overrides: Partial<FiltracionFormValues> = {},
): FiltracionFormValues {
  return {
    recintoId: "r1",
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
    p = toggleTipoProblema(p, "cielo", true);
    p = {
      ...p,
      cielo: { ...p.cielo, descripcion: "colapsa", plan: "cambiar" },
    };
    p = toggleTipoProblema(p, "techumbre", false);
    assert.equal(p.techumbre.activo, false);
    assert.equal(p.techumbre.descripcion, "gotea");
    assert.equal(p.techumbre.plan, "sellar");
    assert.equal(p.cielo.descripcion, "colapsa");
    p = toggleTipoProblema(p, "techumbre", true);
    assert.equal(p.techumbre.descripcion, "gotea");
    assert.deepEqual(tiposActivos(p), ["techumbre", "cielo"]);
  });

  it("legacy sin keyword cae a techumbre fallback", () => {
    const p = parseProblemas(null, "rotura", "reparar");
    assert.equal(p.techumbre.activo, true);
    assert.equal(p.techumbre.descripcion, "rotura");
    assert.equal(p.cielo.activo, false);
    assert.ok(!("canaleta" in p));
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

  it("texto solo de canaleta cae a techumbre; eléctrico por keyword", () => {
    const canaleta = parseProblemas(null, "Canaletas en muy mal estado", "definir método");
    assert.deepEqual(tiposActivos(canaleta), ["techumbre"]);
    assert.equal(canaleta.techumbre.descripcion, "Canaletas en muy mal estado");
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
    assert.deepEqual(tiposActivos(p), ["techumbre", "cielo", "electrico"]);
    assert.equal(p.techumbre.descripcion, p.cielo.descripcion);
  });

  it("json legado con canaleta activa se absorbe en techumbre", () => {
    const p = parseProblemas({
      techumbre: { activo: false, descripcion: "", plan: "" },
      canaleta: { activo: true, descripcion: "canaleta rota", plan: "cambiar" },
      cielo: { activo: false, descripcion: "", plan: "" },
      electrico: { activo: false, descripcion: "", plan: "" },
    });
    assert.deepEqual(tiposActivos(p), ["techumbre"]);
    assert.equal(p.techumbre.descripcion, "canaleta rota");
    assert.equal(p.techumbre.plan, "cambiar");
    assert.ok(!("canaleta" in p));
  });
});

describe("completitud compartida", () => {
  it("cotización y horas aplican por tipo, no a nivel de ficha", () => {
    const vacio = calcularCompletitud(valuesBase(), mediaVacia);
    assert.equal(vacio.faltantes.some((f) => f.id === "cotizacion"), false);
    assert.equal(vacio.faltantes.some((f) => f.id === "horas_maestros"), false);
    assert.equal(vacio.faltantes.some((f) => f.id === "ejecutado_por"), false);

    let proveedorP = toggleTipoProblema(problemasVacios(), "techumbre", true);
    proveedorP = {
      ...proveedorP,
      techumbre: {
        ...proveedorP.techumbre,
        ejecutadoPor: "proveedor_externo",
      },
    };
    const proveedor = calcularCompletitud(
      valuesBase({ problemas: proveedorP }),
      mediaVacia,
    );
    assert.equal(
      proveedor.faltantes.some((f) => f.id === "cotizacion_techumbre"),
      true,
    );
    assert.equal(
      proveedor.faltantes.some((f) => f.id === "horas_maestros_techumbre"),
      false,
    );
    assert.equal(
      proveedor.faltantes.some((f) => f.id === "cotizacion_cielo"),
      false,
    );

    let maestrosP = toggleTipoProblema(problemasVacios(), "suciedad_piso", true);
    maestrosP = {
      ...maestrosP,
      suciedad_piso: {
        ...maestrosP.suciedad_piso,
        ejecutadoPor: "maestros_bodetek",
      },
    };
    const maestros = calcularCompletitud(
      valuesBase({ problemas: maestrosP }),
      mediaVacia,
    );
    assert.equal(
      maestros.faltantes.some((f) => f.id === "cotizacion_suciedad_piso"),
      false,
    );
    assert.equal(
      maestros.faltantes.some((f) => f.id === "horas_maestros_suciedad_piso"),
      true,
    );
  });

  it("cada tipo activo exige problema, plan, ejecutado por y fecha estimada", () => {
    const problemas = toggleTipoProblema(problemasVacios(), "cielo", true);
    const r = calcularCompletitud(valuesBase({ problemas }), mediaVacia);
    assert.equal(r.faltantes.some((f) => f.id === "descripcion_cielo"), true);
    assert.equal(r.faltantes.some((f) => f.id === "plan_cielo"), true);
    assert.equal(r.faltantes.some((f) => f.id === "ejecutado_por_cielo"), true);
    assert.equal(r.faltantes.some((f) => f.id === "fecha_entrega_cielo"), true);
    assert.equal(r.faltantes.some((f) => f.id === "descripcion_techumbre"), false);
    assert.equal(r.faltantes.some((f) => f.id === "fecha_entrega"), false);
  });

  it("los 4 tipos son Techumbre, Cielo, Eléctrico y Suciedad en piso", () => {
    assert.deepEqual([...TIPOS_PROBLEMA], [
      "techumbre",
      "cielo",
      "electrico",
      "suciedad_piso",
    ]);
    const p = toggleTipoProblema(problemasVacios(), "suciedad_piso", true);
    const r = calcularCompletitud(valuesBase({ problemas: p }), mediaVacia);
    assert.equal(
      r.faltantes.some((f) => f.id === "descripcion_suciedad_piso"),
      true,
    );
    assert.equal(r.faltantes.some((f) => f.id === "descripcion_canaleta"), false);
  });
});

describe("fecha de entrega estimada a nivel de ficha", () => {
  it("es el MAX de los problemas activos y no un campo a llenar aparte", () => {
    let p = toggleTipoProblema(problemasVacios(), "techumbre", true);
    p = toggleTipoProblema(p, "cielo", true);
    p = {
      ...p,
      techumbre: { ...p.techumbre, fechaEntregaEstimada: "2026-09-01" },
      cielo: { ...p.cielo, fechaEntregaEstimada: "2026-10-15" },
    };
    assert.equal(fechaEntregaEstimadaFicha(p), "2026-10-15");
    const r = calcularCompletitud(valuesBase({ problemas: p }), mediaVacia);
    assert.equal(r.faltantes.some((f) => f.id === "fecha_entrega"), false);
    assert.equal(r.faltantes.some((f) => f.id === "fecha_entrega_techumbre"), false);
    assert.equal(r.faltantes.some((f) => f.id === "fecha_entrega_cielo"), false);
  });

  it("queda vacía (Falta) si ningún problema activo tiene fecha", () => {
    const p = toggleTipoProblema(problemasVacios(), "electrico", true);
    assert.equal(fechaEntregaEstimadaFicha(p), "");
    const r = calcularCompletitud(valuesBase({ problemas: p }), mediaVacia);
    assert.equal(r.faltantes.some((f) => f.id === "fecha_entrega_electrico"), true);
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
    estado: "",
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

describe("estado independiente del ejecutor", () => {
  it("remapea los 6 estados legado sin perder el resto del bloque", () => {
    const casos: {
      estado: string;
      ejecutadoPor?: string;
      estadoNuevo: string;
      ejecutorNuevo: string;
    }[] = [
      { estado: "sin_asignar", ejecutadoPor: "proveedor_externo", estadoNuevo: "", ejecutorNuevo: "proveedor_externo" },
      { estado: "sin_asignar", ejecutadoPor: "", estadoNuevo: "", ejecutorNuevo: "" },
      {
        estado: "asignado_proveedor_sin_empezar",
        ejecutadoPor: "",
        estadoNuevo: "sin_empezar",
        ejecutorNuevo: "proveedor_externo",
      },
      {
        estado: "asignado_proveedor_sin_empezar",
        ejecutadoPor: "proveedor_externo",
        estadoNuevo: "sin_empezar",
        ejecutorNuevo: "proveedor_externo",
      },
      {
        estado: "asignado_maestros_sin_empezar",
        ejecutadoPor: "",
        estadoNuevo: "sin_empezar",
        ejecutorNuevo: "maestros_bodetek",
      },
      {
        estado: "asignado_maestros_sin_empezar",
        ejecutadoPor: "maestros_bodetek",
        estadoNuevo: "sin_empezar",
        ejecutorNuevo: "maestros_bodetek",
      },
      { estado: "en_proceso", ejecutadoPor: "proveedor_externo", estadoNuevo: "en_proceso", ejecutorNuevo: "proveedor_externo" },
      {
        estado: "ejecutado_pendiente_entrega",
        ejecutadoPor: "maestros_bodetek",
        estadoNuevo: "ejecutado_pendiente_entrega",
        ejecutorNuevo: "maestros_bodetek",
      },
      { estado: "entregado", ejecutadoPor: "proveedor_externo", estadoNuevo: "entregado", ejecutorNuevo: "proveedor_externo" },
    ];

    for (const c of casos) {
      const p = parseProblemas({
        techumbre: {
          activo: true,
          descripcion: "texto único gotea",
          plan: "sellar ahora",
          estado: c.estado,
          ejecutadoPor: c.ejecutadoPor ?? "",
          fechaEntregaEstimada: "2026-09-10",
          fechaEntregaReal: "2026-09-11",
          horasMaestros: "3,5",
          proveedorId: "prov-1",
          numeroCotizacion: "C-99",
          valorRecinto: "1000",
          valorTotalCotizacion: "2000",
        },
      });
      assert.equal(p.techumbre.estado, c.estadoNuevo, `estado ${c.estado}`);
      assert.equal(p.techumbre.ejecutadoPor, c.ejecutorNuevo, `ejecutor ${c.estado}`);
      assert.equal(p.techumbre.descripcion, "texto único gotea");
      assert.equal(p.techumbre.plan, "sellar ahora");
      assert.equal(p.techumbre.fechaEntregaEstimada, "2026-09-10");
      assert.equal(p.techumbre.fechaEntregaReal, "2026-09-11");
      assert.equal(p.techumbre.horasMaestros, "3,5");
      assert.equal(p.techumbre.numeroCotizacion, "C-99");
      assert.equal(p.techumbre.valorRecinto, "1000");
      assert.equal(p.techumbre.valorTotalCotizacion, "2000");
    }
  });

  it("el caso cruzado (proveedor + asignado a maestros) no pisa el ejecutor", () => {
    const p = parseProblemas({
      techumbre: {
        activo: true,
        descripcion: "cruzado",
        estado: "asignado_maestros_sin_empezar",
        ejecutadoPor: "proveedor_externo",
      },
    });
    assert.equal(p.techumbre.estado, "sin_empezar");
    assert.equal(p.techumbre.ejecutadoPor, "proveedor_externo");
    assert.equal(p.techumbre.descripcion, "cruzado");
  });

  it("cambiar ejecutor no reescribe el estado (no hay acoplamiento)", () => {
    let p = toggleTipoProblema(problemasVacios(), "techumbre", true);
    p = {
      ...p,
      techumbre: { ...p.techumbre, estado: "en_proceso", ejecutadoPor: "proveedor_externo" },
    };
    p = {
      ...p,
      techumbre: { ...p.techumbre, ejecutadoPor: "maestros_bodetek" },
    };
    assert.equal(p.techumbre.estado, "en_proceso");
    const r = calcularCompletitud(valuesBase({ problemas: p }), mediaVacia);
    assert.equal(r.faltantes.some((f) => f.id.includes("estado")), false);
  });

  it("estado vacío no cuenta como faltante de completitud", () => {
    const problemas = toggleTipoProblema(problemasVacios(), "cielo", true);
    assert.equal(problemas.cielo.estado, "");
    const r = calcularCompletitud(valuesBase({ problemas }), mediaVacia);
    assert.equal(r.faltantes.some((f) => /estado/i.test(f.id) || /estado/i.test(f.label)), false);
  });
});
