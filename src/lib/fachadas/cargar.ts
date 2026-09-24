import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecintoOption } from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";
import type { IntervencionIndicadores } from "@/lib/fachadas/indicadores";
import {
  mapCotizacion,
  mapFachadaDetalle,
  mapFachadaListado,
  mapHojalateria,
  mapIntervencionResumen,
  mapMaterial,
  mapMedia,
  rowAIndicadores,
} from "@/lib/fachadas/mapear";
import type {
  CatalogosFachadas,
  ConteosBorrarFachada,
  FachadaDetalle,
  FachadaListadoItem,
  IntervencionDetalle,
} from "@/lib/fachadas/tipos";
import { estadoFachadaDesdeDb } from "@/lib/fachadas/estado";

export function esTablaFachadasAusente(message: string | undefined): boolean {
  if (!message) return false;
  return /fachadas|fachada_|proveedor_rubros/i.test(message) && /does not exist|schema cache|could not find/i.test(message);
}

type Relacion<T> = T | T[] | null;

function many<T>(value: Relacion<T>): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function cargarCatalogosFachadas(
  supabase: SupabaseClient,
): Promise<CatalogosFachadas> {
  const [{ data: recintosRaw }, { data: proveedoresRaw }, { data: rubrosRaw }] =
    await Promise.all([
      supabase
        .from("recintos")
        .select("id, codigo, nombre, arrendatario_actual")
        .order("codigo"),
      supabase
        .from("proveedores")
        .select("id, nombre_empresa")
        .order("nombre_empresa"),
      supabase.from("proveedor_rubros").select("proveedor_id, rubro"),
    ]);
  // Si la migración aún no está aplicada, el listado de proveedores sigue usable.

  const rubrosPorId = new Map<string, string[]>();
  for (const r of rubrosRaw ?? []) {
    const list = rubrosPorId.get(r.proveedor_id) ?? [];
    list.push(r.rubro);
    rubrosPorId.set(r.proveedor_id, list);
  }

  const proveedores: ProveedorOption[] = (proveedoresRaw ?? []).map((p) => ({
    id: p.id,
    nombre_empresa: p.nombre_empresa,
    rubros: rubrosPorId.get(p.id) ?? [],
  }));

  return {
    recintos: (recintosRaw ?? []) as RecintoOption[],
    proveedores,
  };
}

async function cargarIndicadoresDeIntervenciones(
  supabase: SupabaseClient,
  intervencionIds: string[],
  fachadaPorIntervencion: Map<string, { fachadaId: string; recintoId: string | null }>,
): Promise<Map<string, IntervencionIndicadores>> {
  const out = new Map<string, IntervencionIndicadores>();
  if (intervencionIds.length === 0) return out;

  const [
    { data: ints },
    { data: tipos },
    { data: cotiz },
    { data: cotizTipos },
    { data: hojas },
    { data: mats },
  ] = await Promise.all([
    supabase
      .from("fachada_intervenciones")
      .select(
        "id, fachada_id, proveedor_id, ejecutado_por, requiere_hojalateria, sin_materiales, fecha_inicio, fecha_termino, alto_m_snapshot, ancho_m_snapshot, superficie_m2_snapshot",
      )
      .in("id", intervencionIds),
    supabase
      .from("fachada_intervencion_tipos")
      .select("intervencion_id, tipo, dias")
      .in("intervencion_id", intervencionIds),
    supabase
      .from("fachada_cotizaciones")
      .select("id, intervencion_id, valor_neto, valor_bruto, cotizacion_key, factura_key")
      .in("intervencion_id", intervencionIds),
    supabase.from("fachada_cotizacion_tipos").select("cotizacion_id, tipo"),
    supabase
      .from("fachada_hojalateria")
      .select("intervencion_id, proveedor_id, valor_neto, valor_bruto")
      .in("intervencion_id", intervencionIds),
    supabase
      .from("fachada_materiales")
      .select("intervencion_id, valor_neto, valor_bruto")
      .in("intervencion_id", intervencionIds),
  ]);

  const tiposPorC = new Map<string, string[]>();
  for (const t of cotizTipos ?? []) {
    const list = tiposPorC.get(t.cotizacion_id) ?? [];
    list.push(t.tipo);
    tiposPorC.set(t.cotizacion_id, list);
  }

  for (const i of ints ?? []) {
    const meta = fachadaPorIntervencion.get(i.id);
    out.set(
      i.id,
      rowAIndicadores({
        ...i,
        recinto_id: meta?.recintoId ?? null,
        tipos: (tipos ?? [])
          .filter((t) => t.intervencion_id === i.id)
          .map((t) => ({ tipo: t.tipo, dias: Number(t.dias) })),
        cotizaciones: (cotiz ?? [])
          .filter((c) => c.intervencion_id === i.id)
          .map((c) => ({
            valor_neto: c.valor_neto,
            valor_bruto: c.valor_bruto,
            cotizacion_key: c.cotizacion_key,
            factura_key: c.factura_key,
            tipos: tiposPorC.get(c.id) ?? [],
          })),
        hojalaterias: (hojas ?? [])
          .filter((h) => h.intervencion_id === i.id)
          .map((h) => ({
            proveedor_id: h.proveedor_id,
            valor_neto: h.valor_neto,
            valor_bruto: h.valor_bruto,
          })),
        materiales: (mats ?? [])
          .filter((m) => m.intervencion_id === i.id)
          .map((m) => ({ valor_neto: m.valor_neto, valor_bruto: m.valor_bruto })),
      }),
    );
  }
  return out;
}

export async function cargarFachadasSubtipo(
  supabase: SupabaseClient,
  recintos: RecintoOption[],
): Promise<{
  fachadas: FachadaListadoItem[];
  intervenciones: IntervencionIndicadores[];
  error: string | null;
  tablasAusentes: boolean;
}> {
  const { data, error } = await supabase
    .from("fachadas")
    .select(
      "id, nombre, recinto_id, superficie_m2, foto_key, fachada_intervenciones ( id, estado, created_at )",
    )
    .order("nombre");

  if (error) {
    return {
      fachadas: [],
      intervenciones: [],
      error: error.message,
      tablasAusentes: esTablaFachadasAusente(error.message),
    };
  }

  const fachadas = (data ?? []).map((row) =>
    mapFachadaListado(
      {
        ...row,
        intervenciones: many(
          row.fachada_intervenciones as Relacion<{
            id: string;
            estado: string | null;
            created_at: string;
          }>,
        ),
      },
      recintos,
    ),
  );

  const intsMeta = new Map<string, { fachadaId: string; recintoId: string | null }>();
  const ids: string[] = [];
  for (const row of data ?? []) {
    for (const i of many(
      row.fachada_intervenciones as Relacion<{ id: string; estado: string | null; created_at: string }>,
    )) {
      ids.push(i.id);
      intsMeta.set(i.id, { fachadaId: row.id, recintoId: row.recinto_id });
    }
  }

  const mapa = await cargarIndicadoresDeIntervenciones(supabase, ids, intsMeta);
  return {
    fachadas,
    intervenciones: [...mapa.values()],
    error: null,
    tablasAusentes: false,
  };
}

export async function cargarFachadaDetalle(
  supabase: SupabaseClient,
  fachadaId: string,
  recintos: RecintoOption[],
): Promise<{ fachada: FachadaDetalle | null; error: string | null; tablasAusentes: boolean }> {
  const { data, error } = await supabase
    .from("fachadas")
    .select(
      "id, nombre, recinto_id, alto_m, ancho_m, superficie_m2, notas, foto_key, foto_nombre, plano_key, plano_nombre, fachada_intervenciones ( id, estado, fecha_inicio, fecha_termino, ejecutado_por, created_at )",
    )
    .eq("id", fachadaId)
    .maybeSingle();

  if (error) {
    return {
      fachada: null,
      error: error.message,
      tablasAusentes: esTablaFachadasAusente(error.message),
    };
  }
  if (!data) return { fachada: null, error: null, tablasAusentes: false };

  const ints = many(
    data.fachada_intervenciones as Relacion<{
      id: string;
      estado: string | null;
      fecha_inicio: string | null;
      fecha_termino: string | null;
      ejecutado_por: string | null;
      created_at: string;
    }>,
  );
  const meta = new Map(
    ints.map((i) => [i.id, { fachadaId: data.id, recintoId: data.recinto_id }]),
  );
  const indicadores = await cargarIndicadoresDeIntervenciones(
    supabase,
    ints.map((i) => i.id),
    meta,
  );
  const resumenes = ints
    .slice()
    .sort((a, b) => {
      const fa = a.fecha_inicio ?? a.created_at;
      const fb = b.fecha_inicio ?? b.created_at;
      return fb.localeCompare(fa);
    })
    .map((i) => {
      const ind = indicadores.get(i.id);
      if (!ind) {
        return mapIntervencionResumen({
          ...i,
          indicadores: rowAIndicadores({
            id: i.id,
            fachada_id: data.id,
            recinto_id: data.recinto_id,
            proveedor_id: null,
            ejecutado_por: i.ejecutado_por,
            requiere_hojalateria: false,
            sin_materiales: false,
            fecha_inicio: i.fecha_inicio,
            fecha_termino: i.fecha_termino,
            alto_m_snapshot: 1,
            ancho_m_snapshot: 1,
            superficie_m2_snapshot: 0,
            tipos: [],
            cotizaciones: [],
            hojalaterias: [],
            materiales: [],
          }),
        });
      }
      return mapIntervencionResumen({ ...i, indicadores: ind });
    });

  return {
    fachada: mapFachadaDetalle(data, recintos, resumenes),
    error: null,
    tablasAusentes: false,
  };
}

export async function cargarIntervencionDetalle(
  supabase: SupabaseClient,
  intervencionId: string,
): Promise<{
  intervencion: IntervencionDetalle | null;
  error: string | null;
  tablasAusentes: boolean;
}> {
  const { data: row, error } = await supabase
    .from("fachada_intervenciones")
    .select(
      "id, fachada_id, estado, fecha_inicio, fecha_termino, notas, ejecutado_por, proveedor_id, requiere_hojalateria, sin_materiales, alto_m_snapshot, ancho_m_snapshot, superficie_m2_snapshot, fachadas ( id, nombre )",
    )
    .eq("id", intervencionId)
    .maybeSingle();

  if (error) {
    return {
      intervencion: null,
      error: error.message,
      tablasAusentes: esTablaFachadasAusente(error.message),
    };
  }
  if (!row) return { intervencion: null, error: null, tablasAusentes: false };

  const fachadaRel = many(row.fachadas as Relacion<{ id: string; nombre: string }>)[0];

  const [{ data: tipos }, { data: cotiz }, { data: hojas }, { data: mats }, { data: media }] =
    await Promise.all([
      supabase
        .from("fachada_intervencion_tipos")
        .select("tipo, dias")
        .eq("intervencion_id", intervencionId),
      supabase
        .from("fachada_cotizaciones")
        .select(
          "id, proveedor_id, numero_cotizacion, valor_neto, valor_iva, valor_bruto, cotizacion_key, cotizacion_nombre, factura_key, factura_nombre, fachada_cotizacion_tipos ( tipo )",
        )
        .eq("intervencion_id", intervencionId),
      supabase
        .from("fachada_hojalateria")
        .select(
          "id, proveedor_id, descripcion, valor_neto, valor_iva, valor_bruto, cotizacion_key, cotizacion_nombre, factura_key, factura_nombre",
        )
        .eq("intervencion_id", intervencionId),
      supabase
        .from("fachada_materiales")
        .select(
          "id, fecha_compra, proveedor_id, numero_factura, material, valor_neto, valor_iva, valor_bruto, factura_key, factura_nombre",
        )
        .eq("intervencion_id", intervencionId),
      supabase
        .from("fachada_media")
        .select("id, tipo, tipo_archivo, object_key, nombre_archivo, thumbnail_key")
        .eq("intervencion_id", intervencionId)
        .order("created_at"),
    ]);

  return {
    intervencion: {
      id: row.id,
      fachadaId: row.fachada_id,
      fachadaNombre: fachadaRel?.nombre ?? "Fachada",
      estado: estadoFachadaDesdeDb(row.estado),
      fechaInicio: row.fecha_inicio,
      fechaTermino: row.fecha_termino,
      notas: row.notas,
      ejecutadoPor:
        row.ejecutado_por === "maestros_bodetek" ||
        row.ejecutado_por === "proveedor_externo"
          ? row.ejecutado_por
          : null,
      proveedorId: row.proveedor_id,
      requiereHojalateria: row.requiere_hojalateria,
      sinMateriales: row.sin_materiales,
      altoMSnapshot: Number(row.alto_m_snapshot),
      anchoMSnapshot: Number(row.ancho_m_snapshot),
      superficieM2Snapshot: Number(row.superficie_m2_snapshot),
      tipos: (tipos ?? [])
        .map((t) => ({
          tipo: t.tipo as IntervencionDetalle["tipos"][number]["tipo"],
          dias: Number(t.dias),
        }))
        .filter((t) =>
          t.tipo === "limpieza" || t.tipo === "reparacion" || t.tipo === "pintura",
        ),
      cotizaciones: (cotiz ?? []).map((c) =>
        mapCotizacion({
          ...c,
          tipos: many(
            c.fachada_cotizacion_tipos as Relacion<{ tipo: string }>,
          ).map((t) => t.tipo),
        }),
      ),
      hojalaterias: (hojas ?? []).map(mapHojalateria),
      materiales: (mats ?? []).map(mapMaterial),
      media: (media ?? [])
        .map(mapMedia)
        .filter((m): m is NonNullable<typeof m> => m != null),
    },
    error: null,
    tablasAusentes: false,
  };
}

export async function cargarConteosBorrarFachada(
  supabase: SupabaseClient,
  fachadaId: string,
): Promise<ConteosBorrarFachada> {
  const { data: ints } = await supabase
    .from("fachada_intervenciones")
    .select("id")
    .eq("fachada_id", fachadaId);
  const ids = (ints ?? []).map((i) => i.id);
  if (ids.length === 0) {
    return { intervenciones: 0, cotizaciones: 0, fotos: 0 };
  }
  const [{ count: cotizaciones }, { count: fotos }] = await Promise.all([
    supabase
      .from("fachada_cotizaciones")
      .select("id", { count: "exact", head: true })
      .in("intervencion_id", ids),
    supabase
      .from("fachada_media")
      .select("id", { count: "exact", head: true })
      .in("intervencion_id", ids),
  ]);
  return {
    intervenciones: ids.length,
    cotizaciones: cotizaciones ?? 0,
    fotos: fotos ?? 0,
  };
}
