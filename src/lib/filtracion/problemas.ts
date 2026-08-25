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

  const desc = descripcionLegado?.trim() ?? "";
  const plan = planLegado?.trim() ?? "";
  if (desc || plan) {
    base.techumbre = { activo: true, descripcion: desc, plan };
  }
  return base;
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
