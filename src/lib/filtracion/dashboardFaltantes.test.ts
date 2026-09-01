import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calcularCompletitud,
  enriquecerProyecto,
  type FiltracionFormValues,
  type MediaCounts,
  type ProyectoFiltracionEnriquecido,
} from "./completitud";
import {
  bloqueProblemaVacio,
  parseProblemas,
  problemasVacios,
  TIPOS_PROBLEMA,
  type BloqueProblema,
  type TipoProblema,
} from "./problemas";
import {
  abrirCelda,
  calcularDashboardFaltantes,
  ESTADOS_S4,
  esCienPorEjecutor,
  esMixEjecutores,
  parseHorasHombre,
  parseValorClp,
} from "./dashboardFaltantes";
import type { TrabajoMediaItem } from "../trabajos";

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

function mediaStub(
  tipo: TrabajoMediaItem["tipo"],
  id: string,
): TrabajoMediaItem {
  return {
    id,
    tipo,
    tipo_archivo: "foto",
    url: `${id}.jpg`,
    publicUrl: `${id}.jpg`,
    nombre_archivo: `${id}.jpg`,
    created_at: "2026-08-01T00:00:00Z",
  };
}

function proyectoFake(
  id: string,
  extra: Partial<ProyectoFiltracionEnriquecido> = {},
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

function conTipo(
  p: ProyectoFiltracionEnriquecido,
  tipo: TipoProblema,
  extra: Partial<BloqueProblema> = {},
): ProyectoFiltracionEnriquecido {
  return {
    ...p,
    problemas: {
      ...p.problemas,
      [tipo]: { ...bloqueProblemaVacio(true), ...extra, activo: true },
    },
  };
}

function idsDe(items: { proyecto: ProyectoFiltracionEnriquecido }[]): string[] {
  return items.map((i) => i.proyecto.id).sort();
}

function keysDe(items: { key: string }[]): string[] {
  return items.map((i) => i.key).sort();
}

describe("dashboard faltantes — fotos después en negativo", () => {
  it("cuenta fichas SIN fotos de después, no las que sí las tienen", () => {
    const sin = conTipo(
      proyectoFake("sin", { gravedad: "critico" }),
      "techumbre",
    );
    const con = conTipo(
      proyectoFake("con", {
        gravedad: "medio",
        media: {
          antes: [],
          despues: [mediaStub("despues", "d1")],
          plano_agua: [],
          plano_reparacion: [],
          cotizacion: [],
        },
        sinDespues: false,
      }),
      "cielo",
    );
    const d = calcularDashboardFaltantes([sin, con]);
    assert.equal(d.heros.sinFotosDespues.n, 1);
    assert.deepEqual(idsDe(d.heros.sinFotosDespues.items), ["sin"]);
    assert.equal(d.s1.sinFotosDespues.total.n, 1);
    assert.equal(d.s1.sinFotosDespues.critico.n, 1);
    assert.equal(d.s1.sinFotosDespues.medio.n, 0);
    assert.deepEqual(
      keysDe(d.heros.sinFotosDespues.items),
      keysDe(d.s1.sinFotosDespues.total.items),
    );
    assert.equal(d.heros.proyectos.n, 2);
  });
});

describe("dashboard faltantes — misma query cifra/popup", () => {
  it("Sin fotos de antes × Crítico lista exactamente esas fichas", () => {
    const a = conTipo(
      proyectoFake("a", { gravedad: "critico" }),
      "techumbre",
    );
    const b = conTipo(
      proyectoFake("b", {
        gravedad: "critico",
        media: {
          antes: [mediaStub("antes", "a1")],
          despues: [],
          plano_agua: [],
          plano_reparacion: [],
          cotizacion: [],
        },
      }),
      "techumbre",
    );
    const c = conTipo(proyectoFake("c", { gravedad: "bajo" }), "cielo");
    const d = calcularDashboardFaltantes([a, b, c]);
    assert.equal(d.s1.sinFotosAntes.critico.n, 1);
    assert.deepEqual(idsDe(d.s1.sinFotosAntes.critico.items), ["a"]);
    assert.equal(d.s1.sinFotosAntes.total.n, 2);
    assert.deepEqual(idsDe(d.s1.sinFotosAntes.total.items), ["a", "c"]);
  });

  it("celda por tipo de subproyecto no incluye otros tipos", () => {
    const p = proyectoFake("mix-tipos", { gravedad: "medio" });
    const conDos = {
      ...p,
      problemas: {
        ...p.problemas,
        techumbre: {
          ...bloqueProblemaVacio(true),
          activo: true,
          ejecutadoPor: "proveedor_externo" as const,
        },
        cielo: {
          ...bloqueProblemaVacio(true),
          activo: true,
          ejecutadoPor: "" as const,
        },
      },
    };
    const d = calcularDashboardFaltantes([conDos]);
    assert.equal(d.s2.cantidad.techumbre.n, 1);
    assert.equal(d.s2.cantidad.cielo.n, 1);
    assert.equal(d.s2.sinAsignar.cielo.n, 1);
    assert.equal(d.s2.sinAsignar.techumbre.n, 0);
    assert.deepEqual(d.s2.sinAsignar.cielo.items.map((i) => i.key), [
      "mix-tipos:cielo",
    ]);
    assert.equal(d.heros.sinAsignar.n, 1);
    assert.equal(d.heros.proveedorN, 1);
    assert.equal(d.heros.maestrosN, 0);
  });
});

describe("dashboard faltantes — 100% vs mix", () => {
  it("distingue 100% proveedor, 100% maestros y mix; unassigned no cuenta como mix", () => {
    const cienProv = {
      ...proyectoFake("cien-p", { gravedad: "critico" }),
      problemas: {
        ...problemasVacios(),
        techumbre: {
          ...bloqueProblemaVacio(true),
          activo: true,
          ejecutadoPor: "proveedor_externo" as const,
        },
        cielo: {
          ...bloqueProblemaVacio(true),
          activo: true,
          ejecutadoPor: "proveedor_externo" as const,
        },
      },
    };
    const cienMae = conTipo(proyectoFake("cien-m", { gravedad: "bajo" }), "cielo", {
      ejecutadoPor: "maestros_bodetek",
    });
    const mix = {
      ...proyectoFake("mix", { gravedad: "medio" }),
      problemas: {
        ...problemasVacios(),
        techumbre: {
          ...bloqueProblemaVacio(true),
          activo: true,
          ejecutadoPor: "proveedor_externo" as const,
        },
        electrico: {
          ...bloqueProblemaVacio(true),
          activo: true,
          ejecutadoPor: "maestros_bodetek" as const,
        },
      },
    };
    const parcial = {
      ...proyectoFake("parcial", { gravedad: "critico" }),
      problemas: {
        ...problemasVacios(),
        techumbre: {
          ...bloqueProblemaVacio(true),
          activo: true,
          ejecutadoPor: "proveedor_externo" as const,
        },
        cielo: { ...bloqueProblemaVacio(true), activo: true, ejecutadoPor: "" as const },
      },
    };

    assert.equal(esCienPorEjecutor(cienProv, "proveedor_externo"), true);
    assert.equal(esCienPorEjecutor(mix, "proveedor_externo"), false);
    assert.equal(esMixEjecutores(mix), true);
    assert.equal(esMixEjecutores(parcial), false);
    assert.equal(esCienPorEjecutor(parcial, "proveedor_externo"), false);

    const d = calcularDashboardFaltantes([cienProv, cienMae, mix, parcial]);
    assert.deepEqual(idsDe(d.s1.cienProveedor.total.items), ["cien-p"]);
    assert.deepEqual(idsDe(d.s1.cienMaestros.total.items), ["cien-m"]);
    assert.deepEqual(idsDe(d.s1.mix.total.items), ["mix"]);
    assert.equal(d.s1.mix.medio.n, 1);
  });
});

describe("dashboard faltantes — textos, cotización y horas", () => {
  it("sección 3 separa texto anotado vs falta llenar por subproyecto", () => {
    const p = {
      ...proyectoFake("t", { gravedad: "critico" }),
      problemas: {
        ...problemasVacios(),
        techumbre: {
          ...bloqueProblemaVacio(true),
          activo: true,
          descripcion: "gotea",
          plan: "",
        },
        cielo: {
          ...bloqueProblemaVacio(true),
          activo: true,
          descripcion: "",
          plan: "pintar",
        },
      },
    };
    const d = calcularDashboardFaltantes([p]);
    assert.equal(d.s3.descripcion.anotado.n, 1);
    assert.equal(d.s3.descripcion.falta.n, 1);
    assert.equal(d.s3.plan.anotado.n, 1);
    assert.equal(d.s3.plan.falta.n, 1);
    assert.deepEqual(d.s3.descripcion.falta.items.map((i) => i.key), ["t:cielo"]);
    assert.deepEqual(d.s3.plan.falta.items.map((i) => i.key), ["t:techumbre"]);
    assert.equal(d.s3.totalSub.n, 2);
  });

  it("4a sin cotización adjunta ignora número escrito y usa media", () => {
    const p = conTipo(
      proyectoFake("cot", {
        gravedad: "critico",
        media: {
          antes: [],
          despues: [],
          plano_agua: [],
          plano_reparacion: [],
          cotizacion: [],
        },
      }),
      "techumbre",
      {
        ejecutadoPor: "proveedor_externo",
        numeroCotizacion: "123",
        valorRecinto: "1000",
        valorTotalCotizacion: "",
        estado: "en_proceso",
      },
    );
    const d = calcularDashboardFaltantes([p]);
    assert.equal(d.s4a.total.total.n, 1);
    assert.equal(d.s4a.sinCotizacion.total.n, 1);
    assert.equal(d.s4a.sinValorRecinto.total.n, 0);
    assert.equal(d.s4a.sinValorTotal.total.n, 1);
    assert.equal(d.s4a.estados.en_proceso.n, 1);
    assert.equal(d.s4a.estados.entregado.n, 0);
  });

  it("4b horas anotadas es conteo; horas de trabajo es suma y no una lista", () => {
    const p = {
      ...proyectoFake("h", { gravedad: "medio" }),
      problemas: {
        ...problemasVacios(),
        techumbre: {
          ...bloqueProblemaVacio(true),
          activo: true,
          ejecutadoPor: "maestros_bodetek" as const,
          horasMaestros: "4,5",
          estado: "en_proceso" as const,
        },
        cielo: {
          ...bloqueProblemaVacio(true),
          activo: true,
          ejecutadoPor: "maestros_bodetek" as const,
          horasMaestros: "",
          estado: "sin_empezar" as const,
        },
      },
    };
    const d = calcularDashboardFaltantes([p]);
    assert.equal(d.s4b.total.total.n, 2);
    assert.equal(d.s4b.conHoras.n, 1);
    assert.equal(d.s4b.horasTrabajo, 4.5);
    assert.equal(parseHorasHombre("8"), 8);
    assert.deepEqual(d.s4b.conHoras.items.map((i) => i.key), ["h:techumbre"]);
    assert.equal(d.s4b.estados.en_proceso.n, 1);
    assert.equal(d.s4b.estados.sin_empezar.n, 1);
  });
});

describe("dashboard faltantes — sin Canaleta", () => {
  it("solo los 4 tipos oficiales aparecen como subproyectos", () => {
    assert.deepEqual([...TIPOS_PROBLEMA], [
      "techumbre",
      "cielo",
      "electrico",
      "suciedad_piso",
    ]);
    const p = proyectoFake("x");
    const d = calcularDashboardFaltantes([p]);
    assert.equal(d.heros.subproyectos.n, 0);
    assert.ok(!("canaleta" in d.s2.cantidad));
  });
});

describe("dashboard faltantes — 4.2 estado independiente del ejecutor", () => {
  it("5 filas: Sin empezar…Entregado + Sin estado definido; la suma iguala 4.1", () => {
    assert.deepEqual(
      ESTADOS_S4.map((e) => e.label),
      [
        "Sin empezar",
        "En proceso",
        "Ejecutado — pendiente de entrega",
        "Entregado",
        "Sin estado definido",
      ],
    );
    const sinEmpezarProv = conTipo(
      proyectoFake("se-p", { gravedad: "critico" }),
      "techumbre",
      { ejecutadoPor: "proveedor_externo", estado: "sin_empezar" },
    );
    const vacioProv = conTipo(
      proyectoFake("vacio-p", { gravedad: "medio" }),
      "cielo",
      { ejecutadoPor: "proveedor_externo", estado: "" },
    );
    const sinEmpezarMae = conTipo(
      proyectoFake("se-m", { gravedad: "bajo" }),
      "electrico",
      { ejecutadoPor: "maestros_bodetek", estado: "sin_empezar" },
    );
    const vacioMae = conTipo(
      proyectoFake("vacio-m", { gravedad: "bajo" }),
      "suciedad_piso",
      { ejecutadoPor: "maestros_bodetek", estado: "" },
    );
    const d = calcularDashboardFaltantes([
      sinEmpezarProv,
      vacioProv,
      sinEmpezarMae,
      vacioMae,
    ]);
    assert.equal(d.s4a.total.total.n, 2);
    assert.equal(d.s4a.estados.sin_empezar.n, 1);
    assert.equal(d.s4a.estados.sin_estado.n, 1);
    assert.deepEqual(d.s4a.estados.sin_empezar.items.map((i) => i.key), [
      "se-p:techumbre",
    ]);
    assert.deepEqual(d.s4a.estados.sin_estado.items.map((i) => i.key), [
      "vacio-p:cielo",
    ]);
    assert.equal(
      ESTADOS_S4.reduce((acc, e) => acc + d.s4a.estados[e.key].n, 0),
      d.s4a.total.total.n,
    );
    assert.equal(d.s4b.total.total.n, 2);
    assert.equal(d.s4b.estados.sin_empezar.n, 1);
    assert.equal(d.s4b.estados.sin_estado.n, 1);
    assert.deepEqual(d.s4b.estados.sin_estado.items.map((i) => i.key), [
      "vacio-m:suciedad_piso",
    ]);
    assert.equal(
      ESTADOS_S4.reduce((acc, e) => acc + d.s4b.estados[e.key].n, 0),
      d.s4b.total.total.n,
    );
    const popup = abrirCelda(
      "Sin estado definido",
      "Proveedor externo",
      d.s4a.estados.sin_estado,
    );
    assert.deepEqual(popup.items.map((i) => i.key), ["vacio-p:cielo"]);
  });

  it("Sin estado definido no se mezcla con el hero Sin asignar", () => {
    const conEjecutorSinEstado = conTipo(
      proyectoFake("prov-vacio", { gravedad: "critico" }),
      "techumbre",
      { ejecutadoPor: "proveedor_externo", estado: "" },
    );
    const sinEjecutor = conTipo(
      proyectoFake("sin-ejec", { gravedad: "medio" }),
      "cielo",
      { ejecutadoPor: "", estado: "" },
    );
    const sinEjecutorConEstado = conTipo(
      proyectoFake("sin-ejec-estado", { gravedad: "bajo" }),
      "electrico",
      { ejecutadoPor: "", estado: "en_proceso" },
    );
    const d = calcularDashboardFaltantes([
      conEjecutorSinEstado,
      sinEjecutor,
      sinEjecutorConEstado,
    ]);
    assert.equal(d.s4a.total.total.n, 1);
    assert.equal(d.s4a.estados.sin_estado.n, 1);
    assert.deepEqual(d.s4a.estados.sin_estado.items.map((i) => i.key), [
      "prov-vacio:techumbre",
    ]);
    assert.equal(d.s4b.estados.sin_estado.n, 0);
    assert.equal(d.heros.sinAsignar.n, 2);
    assert.deepEqual(
      d.heros.sinAsignar.items.map((i) => i.key).sort(),
      ["sin-ejec:cielo", "sin-ejec-estado:electrico"].sort(),
    );
    assert.ok(
      !d.heros.sinAsignar.items.some((i) => i.key === "prov-vacio:techumbre"),
    );
  });

  it("JSON legado cruzado (proveedor + asignado maestros) entra en 4.2 proveedor Sin empezar", () => {
    const problemas = parseProblemas({
      techumbre: {
        activo: true,
        descripcion: "gotea",
        estado: "asignado_maestros_sin_empezar",
        ejecutadoPor: "proveedor_externo",
      },
    });
    const p = {
      ...proyectoFake("cruzado", { gravedad: "critico" }),
      problemas,
    };
    const d = calcularDashboardFaltantes([p]);
    assert.equal(d.heros.proveedorN, 1);
    assert.equal(d.heros.maestrosN, 0);
    assert.equal(d.s4a.estados.sin_empezar.n, 1);
    assert.equal(d.s4b.estados.sin_empezar.n, 0);
  });

  it("4.1 no hereda ejecutor/estado de la ficha: vacío en JSON queda fuera de proveedor", () => {
    const raw = proyectoFake("bodega-6", {
      gravedad: "critico",
      estado: "asignado_proveedor_en_proceso",
      ejecutado_por: "proveedor_externo",
      problemas: {
        ...problemasVacios(),
        techumbre: {
          ...bloqueProblemaVacio(true),
          activo: true,
          descripcion: "roturas",
          estado: "sin_asignar" as never,
          ejecutadoPor: "",
        },
        electrico: {
          ...bloqueProblemaVacio(true),
          activo: true,
          descripcion: "roturas",
          estado: "",
          ejecutadoPor: "",
        },
      },
    });
    const p = enriquecerProyecto(raw);
    assert.equal(p.problemas.techumbre.estado, "");
    assert.equal(p.problemas.techumbre.ejecutadoPor, "");
    assert.equal(p.problemas.electrico.estado, "");
    assert.equal(p.problemas.electrico.ejecutadoPor, "");
    assert.equal(p.ejecutado_por, null);
    const d = calcularDashboardFaltantes([p]);
    assert.equal(d.s4a.total.total.n, 0);
    assert.equal(d.s4a.estados.en_proceso.n, 0);
    assert.equal(d.s4a.estados.sin_estado.n, 0);
    assert.equal(d.heros.proveedorN, 0);
    assert.equal(d.heros.sinAsignar.n, 2);
  });
});

describe("dashboard faltantes — 4a costo estimado proveedor", () => {
  it("suma valor recinto (no valor total cotización) si hay cotización adjunta", () => {
    const conCotizA = conTipo(
      proyectoFake("a", {
        gravedad: "critico",
        proveedor_nombre: "Sodimac",
        media: {
          antes: [],
          despues: [],
          plano_agua: [],
          plano_reparacion: [],
          cotizacion: [
            { ...mediaStub("cotizacion", "ca"), problema_tipo: "techumbre" },
          ],
        },
      }),
      "techumbre",
      {
        ejecutadoPor: "proveedor_externo",
        valorRecinto: "1000000",
        valorTotalCotizacion: "9999999",
      },
    );
    const conCotizB = conTipo(
      proyectoFake("b", {
        gravedad: "medio",
        proveedor_nombre: "Construmart",
        media: {
          antes: [],
          despues: [],
          plano_agua: [],
          plano_reparacion: [],
          cotizacion: [
            { ...mediaStub("cotizacion", "cb"), problema_tipo: "cielo" },
          ],
        },
      }),
      "cielo",
      {
        ejecutadoPor: "proveedor_externo",
        valorRecinto: "850000",
        valorTotalCotizacion: "9999999",
      },
    );
    const sinCotiz = conTipo(
      proyectoFake("c", { gravedad: "bajo" }),
      "electrico",
      {
        ejecutadoPor: "proveedor_externo",
        valorRecinto: "500000",
      },
    );
    const sinValor = conTipo(
      proyectoFake("d", {
        media: {
          antes: [],
          despues: [],
          plano_agua: [],
          plano_reparacion: [],
          cotizacion: [
            {
              ...mediaStub("cotizacion", "cd"),
              problema_tipo: "suciedad_piso",
            },
          ],
        },
      }),
      "suciedad_piso",
      { ejecutadoPor: "proveedor_externo", valorRecinto: "" },
    );
    const maestro = conTipo(
      proyectoFake("m", {
        media: {
          antes: [],
          despues: [],
          plano_agua: [],
          plano_reparacion: [],
          cotizacion: [
            { ...mediaStub("cotizacion", "cm"), problema_tipo: "techumbre" },
          ],
        },
      }),
      "techumbre",
      { ejecutadoPor: "maestros_bodetek", valorRecinto: "700000" },
    );
    const d = calcularDashboardFaltantes([
      conCotizA,
      conCotizB,
      sinCotiz,
      sinValor,
      maestro,
    ]);
    assert.equal(d.s4a.costoEstimado.total, 1850000);
    assert.equal(d.s4a.costoEstimado.totalProveedor, 4);
    assert.equal(d.s4a.costoEstimado.conValorRecinto, 3);
    assert.deepEqual(
      d.s4a.costoEstimado.items.map((i) => i.key).sort(),
      ["a:techumbre", "b:cielo"],
    );
    const itemA = d.s4a.costoEstimado.items.find((i) => i.key === "a:techumbre");
    assert.equal(itemA?.valorRecinto, 1000000);
    assert.equal(itemA?.proveedorLabel, "Sodimac");
    const popup = abrirCelda(
      "Costo total estimado (proveedores externos)",
      "Valor recinto",
      {
        n: d.s4a.costoEstimado.items.length,
        items: d.s4a.costoEstimado.items,
      },
    );
    assert.equal(popup.items.length, 2);
  });

  it("parseValorClp entiende puntos de miles", () => {
    assert.equal(parseValorClp("1.850.000"), 1850000);
    assert.equal(parseValorClp(""), 0);
  });
});

describe("dashboard faltantes — popup reutiliza la misma lista", () => {
  it("abrirCelda entrega exactamente el array de la celda clickeada", () => {
    const a = conTipo(proyectoFake("a", { gravedad: "critico" }), "techumbre");
    const b = conTipo(proyectoFake("b", { gravedad: "medio" }), "cielo");
    const d = calcularDashboardFaltantes([a, b]);
    const popup = abrirCelda(
      "Sin fotos después",
      "Crítico",
      d.s1.sinFotosDespues.critico,
    );
    assert.equal(popup.items, d.s1.sinFotosDespues.critico.items);
    assert.equal(popup.items.length, d.s1.sinFotosDespues.critico.n);
    assert.equal(d.heros.sinFotosDespues.n, d.s1.sinFotosDespues.total.n);
  });
});
