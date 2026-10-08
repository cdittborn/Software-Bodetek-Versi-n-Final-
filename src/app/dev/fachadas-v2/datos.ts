import { FACHADAS_PLANO } from "@/components/fachadas/plano/geometria";
import type { FichaPlano } from "@/components/fachadas/plano/PlanoFachadas";
import type { EstadoPlano } from "@/lib/fachadas/plano";

const MUESTRA: Record<string, EstadoPlano> = {
  "s1-bodega-1a-f1": "requiere_trabajo",
  "s1-local-1-f1": "programada",
  "s2-bodega-s1-f1": "en_ejecucion",
  "s2-local-1-2-f1": "al_dia",
};

export const ESTADOS_DEV: Record<string, EstadoPlano> = Object.fromEntries(
  FACHADAS_PLANO.map((fachada) => [fachada.id, MUESTRA[fachada.id] ?? "sin_evaluar"]),
);

export const FICHAS_DEV: Record<string, FichaPlano> = Object.fromEntries(
  FACHADAS_PLANO.map((fachada) => [
    fachada.id,
    {
      superficieM2: null,
      ultimaIntervencion: fachada.id === "s1-local-1-f1" ? "20 sep 2026" : null,
    },
  ]),
);
