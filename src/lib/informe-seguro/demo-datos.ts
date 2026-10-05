import { problemasVacios, type BloqueProblema } from "@/lib/filtracion/problemas";
import { fuenteDesdeProyectos, type FuenteProyecto } from "@/lib/informe-seguro/fuente";
import {
  armarSnapshot,
  borradorInicial,
  type BorradorInforme,
  type EncabezadoInforme,
  type SnapshotInformeSeguro,
} from "@/lib/informe-seguro/snapshot";

function marco(titulo: string, fondo: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%" height="100%" fill="${fondo}"/><text x="32" y="250" fill="white" font-size="28" font-family="sans-serif">${titulo}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function bloque(
  parcial: Partial<BloqueProblema> & { activo: boolean },
): BloqueProblema {
  return {
    ...problemasVacios().techumbre,
    descripcion: "NOTA-INTERNA-NO-MOSTRAR",
    plan: "PLAN-INTERNO-NO-MOSTRAR",
    ...parcial,
  };
}

const encabezadoDemo: EncabezadoInforme = {
  nombre: "Informe para seguro — Temporal 16 ago 2026",
  nombreEvento: "Temporal 16 ago 2026",
  fechaEvento: "2026-08-16",
  direccionCentro: "Complejo Río Cristal, Antofagasta",
  numeroSiniestro: "SIN-2026-1842",
  numeroPoliza: null,
  contactoBodetek: "Pablo Díaz · +56 9 5555 0101",
  fechaEmision: "2026-10-05",
};

const problemasA = problemasVacios();
problemasA.techumbre = bloque({
  activo: true,
  ejecutadoPor: "maestros_bodetek",
  horasMaestros: "12,5",
  descripcion: "NOTA-INTERNA-NO-MOSTRAR techumbre",
});
problemasA.cielo = bloque({
  activo: true,
  ejecutadoPor: "proveedor_externo",
  proveedorId: "prov-marcelo",
  descripcion: "NOTA-INTERNA-NO-MOSTRAR cielo",
});
problemasA.electrico = bloque({
  activo: true,
  ejecutadoPor: "",
  descripcion: "NOTA-INTERNA-NO-MOSTRAR electrico",
});

const problemasB = problemasVacios();
problemasB.techumbre = bloque({
  activo: true,
  ejecutadoPor: "maestros_bodetek",
  horasMaestros: "",
  descripcion: "NOTA-INTERNA-NO-MOSTRAR sin horas",
});

export const fuenteDemo: FuenteProyecto[] = fuenteDesdeProyectos(
  [
    {
      id: "11111111-1111-4111-8111-111111111111",
      titulo: "Filtración — Local 1B",
      codigo_filtracion: "FLT-0001",
      recinto_codigo: "1B",
      recinto_nombre: "Local 1B",
      descripcion: "NOTA-INTERNA-NO-MOSTRAR ficha",
      plan_accion: "PLAN-INTERNO-NO-MOSTRAR ficha",
      problemas: problemasA,
      media: {
        antes: [
          {
            id: "m-tech",
            tipo_archivo: "foto",
            url: "demo/techumbre",
            thumbnail_key: null,
            nombre_archivo: "Techumbre 1B",
            created_at: "2026-08-17T12:00:00Z",
            problema_tipo: "techumbre",
          },
          {
            id: "m-cielo",
            tipo_archivo: "foto",
            url: "demo/cielo",
            thumbnail_key: null,
            nombre_archivo: "Cielo 1B",
            created_at: "2026-08-17T12:05:00Z",
            problema_tipo: "cielo",
          },
          {
            id: "m-suelta",
            tipo_archivo: "foto",
            url: "demo/recinto",
            thumbnail_key: null,
            nombre_archivo: "Vista del local",
            created_at: "2026-08-17T11:00:00Z",
            problema_tipo: null,
          },
        ],
        despues: [
          {
            id: "m-video",
            tipo_archivo: "video",
            url: "demo/video",
            thumbnail_key: "demo/video-thumb",
            nombre_archivo: "Recorrido",
            created_at: "2026-08-18T15:00:00Z",
            problema_tipo: "techumbre",
          },
        ],
      },
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      titulo: "Filtración — Local 7",
      codigo_filtracion: "FLT-0002",
      recinto_codigo: "7",
      recinto_nombre: "Local 7",
      descripcion: "NOTA-INTERNA-NO-MOSTRAR local 7",
      plan_accion: null,
      problemas: problemasB,
      media: { antes: [], despues: [] },
    },
  ],
  [{ id: "prov-marcelo", nombre_empresa: "Marcelo Ríos" }],
);

export const borradorDemo: BorradorInforme = (() => {
  const base = borradorInicial(fuenteDemo, encabezadoDemo, null);
  return {
    ...base,
    recintos: base.recintos.map((r) =>
      r.trabajoId.startsWith("1111")
        ? {
            ...r,
            descripcionSeguro:
              "El temporal del 16 de agosto afectó la cubierta, el cielo y la instalación eléctrica de este local.",
          }
        : {
            ...r,
            descripcionSeguro:
              "Se intervino la techumbre. El registro de horas de los maestros todavía está pendiente en la ficha.",
          },
    ),
    subproyectos: base.subproyectos.map((s) => {
      const textos: Record<string, string> = {
        techumbre:
          "Retiro de agua, cambio de planchas dañadas y sellado de traslapos de la cubierta.",
        cielo: "Reposición del cielo falso húmedo en el sector de bodega.",
        electrico: "Revisión del tablero y de los circuitos que quedaron sin energía.",
      };
      if (s.trabajoId.startsWith("2222")) {
        return {
          ...s,
          descripcionSeguro: "Reparación de la cubierta. Horas de maestros aún no registradas.",
        };
      }
      return { ...s, descripcionSeguro: textos[s.tipo] ?? "" };
    }),
  };
})();

export const snapshotDemo: SnapshotInformeSeguro = armarSnapshot(fuenteDemo, borradorDemo);

export const previewsDemo: Record<string, string> = {
  "demo/techumbre": marco("Techumbre 1B", "#1e3a5f"),
  "demo/cielo": marco("Cielo 1B", "#3f3f46"),
  "demo/recinto": marco("Vista del local", "#44403c"),
  "demo/video-thumb": marco("Video · recorrido", "#18181b"),
};
