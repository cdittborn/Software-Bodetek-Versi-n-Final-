import {
  cotizacionCompletaDesdeEmergencia,
  entregaAtrasada,
  type ProyectoFiltracionEnriquecido,
} from "@/lib/filtracion/completitud";
import {
  esAsignadoMaestrosBodetek,
  esAsignadoProveedorExterno,
  esSinAsignarEjecutado,
  esSinCotizacionProveedor,
} from "@/lib/filtracion/filtrosEvento";
import {
  ESTADOS_LLUVIAS,
  ESTADO_TRABAJO_LABEL,
  EJECUTADO_POR_LABEL,
  GRAVEDADES_LLUVIAS,
  GRAVEDAD_LLUVIAS_LABEL,
} from "@/lib/trabajos";
import {
  TIPOS_PROBLEMA,
  TIPO_PROBLEMA_LABEL,
  type TipoProblema,
} from "@/lib/filtracion/problemas";

export type CampoFiltrable =
  | "gravedad"
  | "estado"
  | "ejecutado_por"
  | "proveedor"
  | "plano_agua"
  | "plano_reparacion"
  | "antes"
  | "despues"
  | "cotizacion"
  | "entrega"
  | "recinto"
  | "arrendatario"
  | "tipo_problema";

export type FiltroCampoToken = {
  campo: CampoFiltrable;
  valor: string;
  labelCampo: string;
  labelValor: string;
};

export type OpcionFiltroCampo = {
  valor: string;
  label: string;
};

export const CAMPOS_FILTRABLES: { id: CampoFiltrable; label: string }[] = [
  { id: "gravedad", label: "Gravedad" },
  { id: "tipo_problema", label: "Tipo de problema" },
  { id: "estado", label: "Estado" },
  { id: "ejecutado_por", label: "Ejecutado por" },
  { id: "proveedor", label: "Proveedor" },
  { id: "recinto", label: "Recinto" },
  { id: "arrendatario", label: "Arrendatario" },
  { id: "plano_agua", label: "Plano agua" },
  { id: "plano_reparacion", label: "Plano reparación" },
  { id: "antes", label: "Antes" },
  { id: "despues", label: "Después" },
  { id: "cotizacion", label: "Cotización" },
  { id: "entrega", label: "Entrega" },
];

export const LABEL_CAMPO_FILTRABLE: Record<CampoFiltrable, string> =
  Object.fromEntries(CAMPOS_FILTRABLES.map((c) => [c.id, c.label])) as Record<
    CampoFiltrable,
    string
  >;

export function campoTieneBusquedaInterna(campo: CampoFiltrable): boolean {
  return campo === "recinto" || campo === "arrendatario";
}

function cotizacionCompleta(p: ProyectoFiltracionEnriquecido): boolean {
  if (esAsignadoProveedorExterno(p) || p.ejecutado_por === "ambos") {
    return cotizacionCompletaDesdeEmergencia(p);
  }
  if (esAsignadoMaestrosBodetek(p)) {
    return (p.horas_maestros_bodetek ?? 0) > 0;
  }
  return false;
}

function cotizacionIncompleta(p: ProyectoFiltracionEnriquecido): boolean {
  if (esSinCotizacionProveedor(p)) return true;
  if (esAsignadoMaestrosBodetek(p)) {
    return (p.horas_maestros_bodetek ?? 0) <= 0;
  }
  if (p.ejecutado_por === "ambos") {
    return !cotizacionCompletaDesdeEmergencia(p);
  }
  return false;
}

function cotizacionNoAplica(p: ProyectoFiltracionEnriquecido): boolean {
  return esSinAsignarEjecutado(p);
}

export function coincideTokenCampo(
  p: ProyectoFiltracionEnriquecido,
  token: FiltroCampoToken,
): boolean {
  switch (token.campo) {
    case "gravedad":
      return p.gravedad === token.valor;
    case "estado":
      if (token.valor === "vacio") return !p.estado;
      return p.estado === token.valor;
    case "ejecutado_por":
      if (token.valor === "sin_asignar") return esSinAsignarEjecutado(p);
      return p.ejecutado_por === token.valor;
    case "proveedor":
      return p.proveedor_id === token.valor;
    case "recinto":
      return p.recinto_id === token.valor;
    case "arrendatario":
      return (p.recinto_arrendatario ?? "").trim() === token.valor;
    case "plano_agua":
      return token.valor === "con"
        ? p.media.plano_agua.length > 0
        : p.media.plano_agua.length === 0;
    case "plano_reparacion":
      return token.valor === "con"
        ? p.media.plano_reparacion.length > 0
        : p.media.plano_reparacion.length === 0;
    case "antes":
      return token.valor === "con"
        ? p.media.antes.length > 0
        : p.media.antes.length === 0;
    case "despues":
      return token.valor === "con"
        ? p.media.despues.length > 0
        : p.media.despues.length === 0;
    case "cotizacion":
      if (token.valor === "completa") return cotizacionCompleta(p);
      if (token.valor === "incompleta") return cotizacionIncompleta(p);
      return cotizacionNoAplica(p);
    case "tipo_problema":
      return p.problemas[token.valor as TipoProblema]?.activo === true;
    case "entrega":
      if (token.valor === "atrasada") return p.entregaAtrasada;
      if (token.valor === "a_tiempo") {
        return (
          p.fecha_entrega_estimada != null &&
          !entregaAtrasada(p) &&
          p.fecha_termino == null
        );
      }
      return p.fecha_entrega_estimada == null;
    default:
      return true;
  }
}

export function tokenKey(token: Pick<FiltroCampoToken, "campo" | "valor">): string {
  return `${token.campo}:${token.valor}`;
}

export function filtrarPorTokensCampo(
  proyectos: ProyectoFiltracionEnriquecido[],
  tokens: FiltroCampoToken[],
): ProyectoFiltracionEnriquecido[] {
  if (tokens.length === 0) return proyectos;
  const porCampo = new Map<CampoFiltrable, FiltroCampoToken[]>();
  for (const t of tokens) {
    const list = porCampo.get(t.campo) ?? [];
    list.push(t);
    porCampo.set(t.campo, list);
  }
  return proyectos.filter((p) =>
    [...porCampo.values()].every((grupo) =>
      grupo.some((t) => coincideTokenCampo(p, t)),
    ),
  );
}

export function opcionesEstaticasCampo(
  campo: CampoFiltrable,
): OpcionFiltroCampo[] {
  switch (campo) {
    case "gravedad":
      return GRAVEDADES_LLUVIAS.map((g) => ({
        valor: g,
        label: GRAVEDAD_LLUVIAS_LABEL[g],
      }));
    case "estado":
      return [
        { valor: "vacio", label: "—" },
        ...ESTADOS_LLUVIAS.map((e) => ({
          valor: e,
          label: ESTADO_TRABAJO_LABEL[e],
        })),
      ];
    case "ejecutado_por":
      return [
        {
          valor: "proveedor_externo",
          label: EJECUTADO_POR_LABEL.proveedor_externo,
        },
        {
          valor: "maestros_bodetek",
          label: EJECUTADO_POR_LABEL.maestros_bodetek,
        },
        { valor: "sin_asignar", label: "Sin asignar" },
        { valor: "ambos", label: EJECUTADO_POR_LABEL.ambos },
      ];
    case "plano_agua":
    case "plano_reparacion":
    case "antes":
    case "despues":
      return [
        { valor: "con", label: "Con evidencia / archivo" },
        { valor: "sin", label: "Sin evidencia / archivo" },
      ];
    case "cotizacion":
      return [
        { valor: "completa", label: "Completa" },
        { valor: "incompleta", label: "Sin cotización" },
        { valor: "no_aplica", label: "No aplica" },
      ];
    case "tipo_problema":
      return TIPOS_PROBLEMA.map((t) => ({
        valor: t,
        label: TIPO_PROBLEMA_LABEL[t],
      }));
    case "entrega":
      return [
        { valor: "atrasada", label: "Atrasada" },
        { valor: "a_tiempo", label: "A tiempo (pendiente)" },
        { valor: "sin_fecha", label: "Sin fecha estimada" },
      ];
    default:
      return [];
  }
}

export function opcionesDinamicasCampo(
  campo: CampoFiltrable,
  proyectos: ProyectoFiltracionEnriquecido[],
): OpcionFiltroCampo[] {
  switch (campo) {
    case "proveedor": {
      const map = new Map<string, string>();
      for (const p of proyectos) {
        if (p.proveedor_id && p.proveedor_nombre) {
          map.set(p.proveedor_id, p.proveedor_nombre);
        }
      }
      return [...map.entries()]
        .map(([valor, label]) => ({ valor, label }))
        .sort((a, b) => a.label.localeCompare(b.label, "es"));
    }
    case "recinto": {
      const map = new Map<string, string>();
      for (const p of proyectos) {
        if (p.recinto_id) {
          const label = p.recinto_codigo ?? p.recinto_nombre ?? p.recinto_id;
          map.set(p.recinto_id, label);
        }
      }
      return [...map.entries()]
        .map(([valor, label]) => ({ valor, label }))
        .sort((a, b) => a.label.localeCompare(b.label, "es"));
    }
    case "arrendatario": {
      const set = new Set<string>();
      for (const p of proyectos) {
        const a = p.recinto_arrendatario?.trim();
        if (a) set.add(a);
      }
      return [...set]
        .sort((a, b) => a.localeCompare(b, "es"))
        .map((valor) => ({ valor, label: valor }));
    }
    default:
      return opcionesEstaticasCampo(campo);
  }
}

export function opcionesCampo(
  campo: CampoFiltrable,
  proyectos: ProyectoFiltracionEnriquecido[],
): OpcionFiltroCampo[] {
  if (
    campo === "proveedor" ||
    campo === "recinto" ||
    campo === "arrendatario"
  ) {
    return opcionesDinamicasCampo(campo, proyectos);
  }
  return opcionesEstaticasCampo(campo);
}

export function crearTokenCampo(
  campo: CampoFiltrable,
  opcion: OpcionFiltroCampo,
): FiltroCampoToken {
  return {
    campo,
    valor: opcion.valor,
    labelCampo: LABEL_CAMPO_FILTRABLE[campo],
    labelValor: opcion.label,
  };
}

export function reemplazarTokenCampo(
  tokens: FiltroCampoToken[],
  nuevo: FiltroCampoToken,
): FiltroCampoToken[] {
  const sinMismoValor = tokens.filter(
    (t) => !(t.campo === nuevo.campo && t.valor === nuevo.valor),
  );
  if (sinMismoValor.length !== tokens.length) return sinMismoValor;
  return [...tokens, nuevo];
}

export function tieneTokenCampo(
  tokens: FiltroCampoToken[],
  campo: CampoFiltrable,
  valor: string,
): boolean {
  return tokens.some((t) => t.campo === campo && t.valor === valor);
}

export function filtrarOpcionesPorTexto(
  opciones: OpcionFiltroCampo[],
  q: string,
): OpcionFiltroCampo[] {
  const n = q.trim().toLowerCase();
  if (!n) return opciones;
  return opciones.filter((o) => o.label.toLowerCase().includes(n));
}
