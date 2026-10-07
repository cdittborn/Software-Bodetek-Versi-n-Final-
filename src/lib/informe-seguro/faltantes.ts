import { TIPO_PROBLEMA_LABEL, type TipoProblema } from "@/lib/filtracion/problemas";
import { parseHorasHombre } from "@/lib/informe-seguro/formato";
import type { FuenteProyecto } from "@/lib/informe-seguro/fuente";
import type { BorradorInforme } from "@/lib/informe-seguro/snapshot";

export type FaltanteInforme = {
  trabajoId: string;
  codigo: string;
  recinto: string;
  titulo: string;
  tipo: TipoProblema;
  tipoLabel: string;
  motivo: "sin_ejecutor" | "sin_horas";
};

export type ListaFaltantesInforme = {
  sinEjecutor: FaltanteInforme[];
  sinHoras: FaltanteInforme[];
  total: number;
};

function incluido(
  borrador: BorradorInforme | undefined,
  trabajoId: string,
  tipo: TipoProblema,
): boolean {
  if (!borrador) return true;
  const rec = borrador.recintos.find((r) => r.trabajoId === trabajoId);
  if (rec && !rec.incluido) return false;
  const sub = borrador.subproyectos.find(
    (s) => s.trabajoId === trabajoId && s.tipo === tipo,
  );
  if (sub && !sub.incluido) return false;
  return true;
}

/** Sin ejecutor, o Maestros Bodetek sin horas. El borrador, si viene, limita a lo incluido. */
export function listarFaltantes(
  fuente: FuenteProyecto[],
  borrador?: BorradorInforme,
): ListaFaltantesInforme {
  const sinEjecutor: FaltanteInforme[] = [];
  const sinHoras: FaltanteInforme[] = [];

  for (const proyecto of fuente) {
    for (const sub of proyecto.subproyectos) {
      if (!incluido(borrador, proyecto.trabajoId, sub.tipo)) continue;
      const base = {
        trabajoId: proyecto.trabajoId,
        codigo: proyecto.codigo,
        recinto: proyecto.recintoEtiqueta,
        titulo: proyecto.titulo,
        tipo: sub.tipo,
        tipoLabel: TIPO_PROBLEMA_LABEL[sub.tipo],
      };
      if (!sub.ejecutor) {
        sinEjecutor.push({ ...base, motivo: "sin_ejecutor" });
        continue;
      }
      if (sub.ejecutor === "maestros_bodetek" && parseHorasHombre(sub.horasTexto) <= 0) {
        sinHoras.push({ ...base, motivo: "sin_horas" });
      }
    }
  }

  return {
    sinEjecutor,
    sinHoras,
    total: sinEjecutor.length + sinHoras.length,
  };
}
