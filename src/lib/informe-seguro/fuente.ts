import {
  TIPOS_PROBLEMA,
  TIPO_PROBLEMA_LABEL,
  tiposActivos,
  type ProblemasFiltracion,
  type TipoProblema,
} from "@/lib/filtracion/problemas";

export type EjecutorVivo = "maestros_bodetek" | "proveedor_externo" | "";

export type MomentoMedia = "antes" | "despues";

export type FuenteMedia = {
  id: string;
  problemaTipo: TipoProblema | null;
  momento: MomentoMedia;
  tipoArchivo: "foto" | "video";
  key: string;
  thumbnailKey: string | null;
  nombre: string | null;
  createdAt: string;
};

export type FuenteSubproyecto = {
  tipo: TipoProblema;
  ejecutor: EjecutorVivo;
  horasTexto: string;
  proveedorNombre: string | null;
  /** Descripción del problema en la ficha. No es el plan de acción. */
  notaAnotada: string;
  /** Reservado. El plan de acción no sale de la ficha hacia el informe. */
  notasInternas: string;
};

export type FuenteProyecto = {
  trabajoId: string;
  codigo: string;
  titulo: string;
  recintoCodigo: string;
  arrendatario: string;
  recintoEtiqueta: string;
  notasInternas: string;
  subproyectos: FuenteSubproyecto[];
  media: FuenteMedia[];
};

export type ProyectoInformeInput = {
  id: string;
  titulo: string | null;
  codigo_filtracion: string | null;
  recinto_codigo: string | null;
  recinto_nombre: string | null;
  recinto_arrendatario?: string | null;
  descripcion: string | null;
  plan_accion: string | null;
  problemas: ProblemasFiltracion;
  media: {
    antes: MediaInformeInput[];
    despues: MediaInformeInput[];
  };
};

export type MediaInformeInput = {
  id: string;
  tipo_archivo: string;
  url: string;
  thumbnail_key?: string | null;
  nombre_archivo: string | null;
  created_at: string;
  problema_tipo?: string | null;
};

const TIPOS = new Set<string>(TIPOS_PROBLEMA);

function esTipo(value: string | null | undefined): value is TipoProblema {
  return typeof value === "string" && TIPOS.has(value);
}

function etiquetaRecinto(p: ProyectoInformeInput): string {
  const codigo = p.recinto_codigo?.trim();
  const nombre = p.recinto_nombre?.trim();
  if (codigo && nombre && codigo !== nombre) return `${codigo} · ${nombre}`;
  return codigo || nombre || "Recinto";
}

export function fuenteDesdeProyectos(
  proyectos: ProyectoInformeInput[],
  proveedores: { id: string; nombre_empresa: string }[],
): FuenteProyecto[] {
  const nombres = new Map(proveedores.map((p) => [p.id, p.nombre_empresa.trim()]));

  return proyectos
    .map((p) => {
      const subs = tiposActivos(p.problemas).map((tipo) => {
        const bloque = p.problemas[tipo];
        const ejecutor =
          bloque.ejecutadoPor === "maestros_bodetek" ||
          bloque.ejecutadoPor === "proveedor_externo"
            ? bloque.ejecutadoPor
            : "";
        const proveedorNombre = bloque.proveedorId
          ? (nombres.get(bloque.proveedorId) ?? null)
          : null;
        return {
          tipo,
          ejecutor,
          horasTexto: bloque.horasMaestros,
          proveedorNombre,
          notaAnotada: bloque.descripcion.trim(),
          notasInternas: "",
        } satisfies FuenteSubproyecto;
      });

      const media: FuenteMedia[] = [];
      for (const momento of ["antes", "despues"] as const) {
        for (const item of p.media[momento]) {
          if (item.tipo_archivo !== "foto" && item.tipo_archivo !== "video") continue;
          if (!item.url?.trim()) continue;
          media.push({
            id: item.id,
            problemaTipo: esTipo(item.problema_tipo) ? item.problema_tipo : null,
            momento,
            tipoArchivo: item.tipo_archivo,
            key: item.url,
            thumbnailKey: item.thumbnail_key?.trim() || null,
            nombre: item.nombre_archivo,
            createdAt: item.created_at,
          });
        }
      }
      media.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));

      return {
        trabajoId: p.id,
        codigo: p.codigo_filtracion?.trim() || "Sin código",
        titulo: p.titulo?.trim() || etiquetaRecinto(p),
        recintoCodigo: p.recinto_codigo?.trim() || etiquetaRecinto(p),
        arrendatario: p.recinto_arrendatario?.trim() || p.recinto_nombre?.trim() || "",
        recintoEtiqueta: etiquetaRecinto(p),
        notasInternas: "",
        subproyectos: subs,
        media,
      } satisfies FuenteProyecto;
    })
    .filter((p) => p.subproyectos.length > 0)
    .sort((a, b) => a.recintoEtiqueta.localeCompare(b.recintoEtiqueta, "es"));
}

export function fuenteSinNotas(fuente: FuenteProyecto[]): FuenteProyecto[] {
  return fuente.map((proyecto) => ({
    ...proyecto,
    notasInternas: "",
    subproyectos: proyecto.subproyectos.map((sub) => ({
      ...sub,
      notaAnotada: "",
      notasInternas: "",
    })),
  }));
}

export { TIPO_PROBLEMA_LABEL };
