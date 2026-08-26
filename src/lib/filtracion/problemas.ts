import {
  ESTADOS_LLUVIAS,
  type EjecutadoPor,
  type EstadoLluvias,
} from "@/lib/trabajos";

export const TIPOS_PROBLEMA = [
  "techumbre",
  "cielo",
  "electrico",
  "suciedad_piso",
] as const;

export type TipoProblema = (typeof TIPOS_PROBLEMA)[number];

export const TIPO_PROBLEMA_LABEL: Record<TipoProblema, string> = {
  techumbre: "Techumbre",
  cielo: "Cielo",
  electrico: "Eléctrico",
  suciedad_piso: "Suciedad en piso",
};

export const EJECUTADO_POR_PROBLEMA = [
  "maestros_bodetek",
  "proveedor_externo",
] as const;

export type EjecutadoPorProblema = (typeof EJECUTADO_POR_PROBLEMA)[number];

export const ESTADOS_PROBLEMA = ESTADOS_LLUVIAS;

export type EstadoProblema = EstadoLluvias;

const ORDEN_ESTADO_PROBLEMA: EstadoProblema[] = [
  "sin_asignar",
  "asignado_proveedor_sin_empezar",
  "asignado_maestros_sin_empezar",
  "en_proceso",
  "ejecutado_pendiente_entrega",
  "entregado",
];

export type BloqueProblema = {
  activo: boolean;
  descripcion: string;
  plan: string;
  ejecutadoPor: EjecutadoPorProblema | "";
  estado: EstadoProblema;
  fechaEntregaEstimada: string;
  fechaEntregaReal: string;
  horasMaestros: string;
  proveedorId: string;
  numeroCotizacion: string;
  valorRecinto: string;
  valorTotalCotizacion: string;
};

export type ProblemasFiltracion = Record<TipoProblema, BloqueProblema>;

export type FichaLegadoProblemas = {
  ejecutadoPor?: string | null;
  estado?: string | null;
  fechaEstimada?: string | null;
  fechaReal?: string | null;
  horas?: number | string | null;
  proveedorId?: string | null;
  numeroCotizacion?: string | null;
  valorRecinto?: number | string | null;
  valorTotal?: number | string | null;
};

export function bloqueProblemaVacio(activo = false): BloqueProblema {
  return {
    activo,
    descripcion: "",
    plan: "",
    ejecutadoPor: "",
    estado: "sin_asignar",
    fechaEntregaEstimada: "",
    fechaEntregaReal: "",
    horasMaestros: "",
    proveedorId: "",
    numeroCotizacion: "",
    valorRecinto: "",
    valorTotalCotizacion: "",
  };
}

export function problemasVacios(): ProblemasFiltracion {
  return {
    techumbre: bloqueProblemaVacio(),
    cielo: bloqueProblemaVacio(),
    electrico: bloqueProblemaVacio(),
    suciedad_piso: bloqueProblemaVacio(),
  };
}

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asEjecutadoPorProblema(value: unknown): EjecutadoPorProblema | "" {
  if (value === "maestros_bodetek" || value === "proveedor_externo") return value;
  return "";
}

export function normalizarEstadoProblema(value: unknown): EstadoProblema {
  if (value === "asignado_proveedor_en_proceso" || value === "asignado_maestros_en_proceso") {
    return "en_proceso";
  }
  if (value === "terminado") return "entregado";
  if (
    typeof value === "string" &&
    (ESTADOS_LLUVIAS as readonly string[]).includes(value)
  ) {
    return value as EstadoProblema;
  }
  return "sin_asignar";
}

export function esEstadoCierreFiltracion(estado: string): boolean {
  const e = normalizarEstadoProblema(estado);
  return e === "ejecutado_pendiente_entrega" || e === "entregado";
}

function asBloque(value: unknown): BloqueProblema {
  const base = bloqueProblemaVacio();
  if (!value || typeof value !== "object") return base;
  const v = value as Record<string, unknown>;
  return {
    activo: v.activo === true,
    descripcion: typeof v.descripcion === "string" ? v.descripcion : "",
    plan: typeof v.plan === "string" ? v.plan : "",
    ejecutadoPor: asEjecutadoPorProblema(v.ejecutadoPor ?? v.ejecutado_por),
    estado: normalizarEstadoProblema(v.estado),
    fechaEntregaEstimada: asString(
      v.fechaEntregaEstimada ?? v.fecha_entrega_estimada,
    ),
    fechaEntregaReal: asString(v.fechaEntregaReal ?? v.fecha_entrega_real),
    horasMaestros: asString(v.horasMaestros ?? v.horas_maestros),
    proveedorId: asString(v.proveedorId ?? v.proveedor_id),
    numeroCotizacion: asString(v.numeroCotizacion ?? v.numero_cotizacion),
    valorRecinto: asString(v.valorRecinto ?? v.valor_recinto),
    valorTotalCotizacion: asString(
      v.valorTotalCotizacion ?? v.valor_total_cotizacion,
    ),
  };
}

function fechaMax(a: string, b: string): string {
  const x = a.trim();
  const y = b.trim();
  if (!x) return y;
  if (!y) return x;
  return x >= y ? x : y;
}

function textoCombinado(a: string, b: string): string {
  const x = a.trim();
  const y = b.trim();
  if (!x) return y;
  if (!y || x === y) return x;
  return `${x}\n\n${y}`;
}

/** Canaleta dejó de ser tipo: su bloque se absorbe en Techumbre. */
export function absorberCanaletaEnTechumbre(
  techumbre: BloqueProblema,
  canaleta: BloqueProblema,
): BloqueProblema {
  if (
    !canaleta.activo &&
    !canaleta.descripcion.trim() &&
    !canaleta.plan.trim() &&
    !canaleta.ejecutadoPor &&
    !canaleta.fechaEntregaEstimada.trim() &&
    !canaleta.fechaEntregaReal.trim()
  ) {
    return techumbre;
  }
  return {
    activo: techumbre.activo || canaleta.activo,
    descripcion: textoCombinado(techumbre.descripcion, canaleta.descripcion),
    plan: textoCombinado(techumbre.plan, canaleta.plan),
    ejecutadoPor: techumbre.ejecutadoPor || canaleta.ejecutadoPor,
    estado:
      techumbre.estado !== "sin_asignar" ? techumbre.estado : canaleta.estado,
    fechaEntregaEstimada: fechaMax(
      techumbre.fechaEntregaEstimada,
      canaleta.fechaEntregaEstimada,
    ),
    fechaEntregaReal: fechaMax(
      techumbre.fechaEntregaReal,
      canaleta.fechaEntregaReal,
    ),
    horasMaestros: techumbre.horasMaestros.trim()
      ? techumbre.horasMaestros
      : canaleta.horasMaestros,
    proveedorId: techumbre.proveedorId.trim()
      ? techumbre.proveedorId
      : canaleta.proveedorId,
    numeroCotizacion: techumbre.numeroCotizacion.trim()
      ? techumbre.numeroCotizacion
      : canaleta.numeroCotizacion,
    valorRecinto: techumbre.valorRecinto.trim()
      ? techumbre.valorRecinto
      : canaleta.valorRecinto,
    valorTotalCotizacion: techumbre.valorTotalCotizacion.trim()
      ? techumbre.valorTotalCotizacion
      : canaleta.valorTotalCotizacion,
  };
}

const KEYWORDS_TIPO: { tipo: TipoProblema; needles: string[] }[] = [
  { tipo: "techumbre", needles: ["techumbre"] },
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
    base[tipo] = { ...bloqueProblemaVacio(true), descripcion: desc, plan: p };
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
    if ("canaleta" in obj) {
      base.techumbre = absorberCanaletaEnTechumbre(
        base.techumbre,
        asBloque(obj.canaleta),
      );
      any = true;
    }
    if (any) return base;
  }

  return problemasDesdeTextoLegado(descripcionLegado, planLegado);
}

function textoOVacio(value: number | string | null | undefined): string {
  if (value == null) return "";
  const t = String(value).trim();
  return t;
}

/**
 * Copia campos de ficha (legado, un solo valor) a cada problema activo
 * que todavía no los tiene. No pisa datos ya guardados por tipo.
 */
export function hidratarProblemasDesdeFicha(
  problemas: ProblemasFiltracion,
  ficha: FichaLegadoProblemas,
): ProblemasFiltracion {
  const activos = tiposActivos(problemas);
  if (activos.length === 0) return problemas;

  const next: ProblemasFiltracion = { ...problemas };
  const ejecutadoFicha = asEjecutadoPorProblema(ficha.ejecutadoPor);
  const estadoFicha = normalizarEstadoProblema(ficha.estado);
  const fechaEst = (ficha.fechaEstimada ?? "").trim();
  const fechaReal = (ficha.fechaReal ?? "").trim();
  const horas = textoOVacio(ficha.horas);
  const proveedorId = (ficha.proveedorId ?? "").trim();
  const numero = (ficha.numeroCotizacion ?? "").trim();
  const valorRecinto = textoOVacio(ficha.valorRecinto);
  const valorTotal = textoOVacio(ficha.valorTotal);

  for (const tipo of activos) {
    const b = { ...next[tipo] };
    if (!b.ejecutadoPor && ejecutadoFicha) b.ejecutadoPor = ejecutadoFicha;
    if (b.estado === "sin_asignar" && estadoFicha !== "sin_asignar") {
      b.estado = estadoFicha;
    }
    if (!b.fechaEntregaEstimada && fechaEst) b.fechaEntregaEstimada = fechaEst;
    if (!b.fechaEntregaReal && fechaReal) b.fechaEntregaReal = fechaReal;
    next[tipo] = b;
  }

  const primerMaestros = activos.find(
    (t) => next[t].ejecutadoPor === "maestros_bodetek",
  );
  if (
    primerMaestros &&
    !activos.some((t) => next[t].horasMaestros.trim()) &&
    horas
  ) {
    next[primerMaestros] = { ...next[primerMaestros], horasMaestros: horas };
  }

  const primerProveedor = activos.find(
    (t) => next[t].ejecutadoPor === "proveedor_externo",
  );
  if (primerProveedor) {
    const b = { ...next[primerProveedor] };
    const ningunoCotiza = !activos.some(
      (t) =>
        next[t].proveedorId ||
        next[t].numeroCotizacion ||
        next[t].valorRecinto ||
        next[t].valorTotalCotizacion,
    );
    if (ningunoCotiza) {
      if (!b.proveedorId && proveedorId) b.proveedorId = proveedorId;
      if (!b.numeroCotizacion && numero) b.numeroCotizacion = numero;
      if (!b.valorRecinto && valorRecinto) b.valorRecinto = valorRecinto;
      if (!b.valorTotalCotizacion && valorTotal) b.valorTotalCotizacion = valorTotal;
    }
    next[primerProveedor] = b;
  }

  return next;
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

/** MAX de fechas de entrega estimada de problemas activos. Vacío si ninguna. */
export function fechaEntregaEstimadaFicha(
  problemas: ProblemasFiltracion,
): string {
  let max = "";
  for (const tipo of tiposActivos(problemas)) {
    const d = problemas[tipo].fechaEntregaEstimada.trim();
    if (d && d > max) max = d;
  }
  return max;
}

/**
 * MAX de fechas reales solo si todos los problemas activos tienen una.
 * Si falta alguna, la ficha aún no tiene entrega real.
 */
export function fechaEntregaRealFicha(problemas: ProblemasFiltracion): string {
  const activos = tiposActivos(problemas);
  if (activos.length === 0) return "";
  let max = "";
  for (const tipo of activos) {
    const d = problemas[tipo].fechaEntregaReal.trim();
    if (!d) return "";
    if (d > max) max = d;
  }
  return max;
}

export function ejecutadoPorAgregadoFicha(
  problemas: ProblemasFiltracion,
): EjecutadoPor | null {
  const set = new Set<EjecutadoPorProblema>();
  for (const tipo of tiposActivos(problemas)) {
    const v = problemas[tipo].ejecutadoPor;
    if (v) set.add(v);
  }
  if (set.size === 0) return null;
  if (set.size === 2) return "ambos";
  return [...set][0];
}

export function estadoAgregadoFicha(
  problemas: ProblemasFiltracion,
): EstadoProblema {
  const activos = tiposActivos(problemas);
  if (activos.length === 0) return "sin_asignar";
  let minIdx = ORDEN_ESTADO_PROBLEMA.length - 1;
  for (const tipo of activos) {
    const idx = ORDEN_ESTADO_PROBLEMA.indexOf(
      normalizarEstadoProblema(problemas[tipo].estado),
    );
    if (idx >= 0 && idx < minIdx) minIdx = idx;
  }
  return ORDEN_ESTADO_PROBLEMA[minIdx];
}

export function horasMaestrosAgregadas(
  problemas: ProblemasFiltracion,
): number | null {
  let sum = 0;
  let any = false;
  for (const tipo of tiposActivos(problemas)) {
    if (problemas[tipo].ejecutadoPor !== "maestros_bodetek") continue;
    const n = Number(
      problemas[tipo].horasMaestros.trim().replace(/\./g, "").replace(",", "."),
    );
    if (Number.isFinite(n) && n > 0) {
      sum += n;
      any = true;
    }
  }
  return any ? sum : null;
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

export function idEjecutadoPorProblema(tipo: TipoProblema): string {
  return `ejecutado_por_${tipo}`;
}

export function idFechaEstimadaProblema(tipo: TipoProblema): string {
  return `fecha_entrega_${tipo}`;
}

export function idProveedorProblema(tipo: TipoProblema): string {
  return `proveedor_${tipo}`;
}

export function idCotizacionProblema(tipo: TipoProblema): string {
  return `cotizacion_${tipo}`;
}

export function idHorasProblema(tipo: TipoProblema): string {
  return `horas_maestros_${tipo}`;
}
