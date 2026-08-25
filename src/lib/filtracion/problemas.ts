export const TIPOS_PROBLEMA = [
  "techumbre",
  "canaleta",
  "cielo",
  "electrico",
] as const;

export type TipoProblema = (typeof TIPOS_PROBLEMA)[number];

export const TIPO_PROBLEMA_LABEL: Record<TipoProblema, string> = {
  techumbre: "Techumbre",
  canaleta: "Canaleta",
  cielo: "Cielo",
  electrico: "Eléctrico",
};

export type BloqueProblema = {
  activo: boolean;
  descripcion: string;
  plan: string;
};

export type ProblemasFiltracion = Record<TipoProblema, BloqueProblema>;

export function bloqueProblemaVacio(activo = false): BloqueProblema {
  return { activo, descripcion: "", plan: "" };
}

export function problemasVacios(): ProblemasFiltracion {
  return {
    techumbre: bloqueProblemaVacio(),
    canaleta: bloqueProblemaVacio(),
    cielo: bloqueProblemaVacio(),
    electrico: bloqueProblemaVacio(),
  };
}

function asBloque(value: unknown): BloqueProblema {
  if (!value || typeof value !== "object") return bloqueProblemaVacio();
  const v = value as Record<string, unknown>;
  return {
    activo: v.activo === true,
    descripcion: typeof v.descripcion === "string" ? v.descripcion : "",
    plan: typeof v.plan === "string" ? v.plan : "",
  };
}

const KEYWORDS_TIPO: { tipo: TipoProblema; needles: string[] }[] = [
  { tipo: "techumbre", needles: ["techumbre"] },
  { tipo: "canaleta", needles: ["canaleta"] },
  { tipo: "cielo", needles: ["cielo"] },
  { tipo: "electrico", needles: ["electric", "eléctric"] },
];

/** "cielo americano(s)" es material, no tipo de problema. */
export function blobSinCieloAmericano(blob: string): string {
  return blob.replace(/cielos?\s+americanos?/gi, " ");
}

/** Palabras clave en descripcion+plan (substring, case-insensitive). */
export function keywordsTipoProblema(blob: string): TipoProblema[] {
  const t = blobSinCieloAmericano(blob).toLowerCase();
  const hits: TipoProblema[] = [];
  for (const { tipo, needles } of KEYWORDS_TIPO) {
    if (needles.some((n) => t.includes(n))) hits.push(tipo);
  }
  return hits;
}

/**
 * Backfill de texto legado.
 * 0 keywords → Techumbre (fallback, no confirmado por texto).
 * 1 keyword → ese tipo (techumbre acá SÍ es confirmado).
 * 2+ → todos los hits (ambiguo; no se elige uno).
 */
export function problemasDesdeTextoLegado(
  descripcion?: string | null,
  plan?: string | null,
): ProblemasFiltracion {
  const base = problemasVacios();
  const desc = descripcion?.trim() ?? "";
  const p = plan?.trim() ?? "";
  if (!desc && !p) return base;
  const hits = keywordsTipoProblema(`${desc}\n${p}`);
  const tipos: TipoProblema[] = hits.length === 0 ? ["techumbre"] : hits;
  for (const tipo of tipos) {
    base[tipo] = { activo: true, descripcion: desc, plan: p };
  }
  return base;
}

export function parseProblemas(
  raw: unknown,
  descripcionLegado?: string | null,
  planLegado?: string | null,
): ProblemasFiltracion {
  const base = problemasVacios();

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    let any = false;
    for (const tipo of TIPOS_PROBLEMA) {
      if (tipo in obj) {
        base[tipo] = asBloque(obj[tipo]);
        any = true;
      }
    }
    if (any) return base;
  }

  return problemasDesdeTextoLegado(descripcionLegado, planLegado);
}

export function toggleTipoProblema(
  problemas: ProblemasFiltracion,
  tipo: TipoProblema,
  activo: boolean,
): ProblemasFiltracion {
  return {
    ...problemas,
    [tipo]: { ...problemas[tipo], activo },
  };
}

export function tiposActivos(problemas: ProblemasFiltracion): TipoProblema[] {
  return TIPOS_PROBLEMA.filter((t) => problemas[t].activo);
}

export function concatenarDescripcion(problemas: ProblemasFiltracion): string {
  return tiposActivos(problemas)
    .map((t) => {
      const texto = problemas[t].descripcion.trim();
      if (!texto) return "";
      return `[${TIPO_PROBLEMA_LABEL[t]}] ${texto}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

export function concatenarPlan(problemas: ProblemasFiltracion): string {
  return tiposActivos(problemas)
    .map((t) => {
      const texto = problemas[t].plan.trim();
      if (!texto) return "";
      return `[${TIPO_PROBLEMA_LABEL[t]}] ${texto}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

export function idDescripcionProblema(tipo: TipoProblema): string {
  return `descripcion_${tipo}`;
}

export function idPlanProblema(tipo: TipoProblema): string {
  return `plan_${tipo}`;
}
