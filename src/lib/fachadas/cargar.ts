import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecintoOption } from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";
import { asMedidaNullable, type IntervencionIndicadores } from "@/lib/fachadas/indicadores";
import {
  mapArchivoEstado,
  mapCotizacion,
  mapDocumento,
  mapFachadaDetalle,
  mapFachadaListado,
  mapHojalateria,
  mapIntervencionResumen,
  mapMaterial,
  mapMedia,
  rowAIndicadores,
} from "@/lib/fachadas/mapear";
import type {
  ArchivoEstadoFachada,
  CatalogosFachadas,
  ConteosBorrarFachada,
  FachadaDetalle,
  FachadaListadoItem,
  IntervencionDetalle,
  PortadaIntervencion,
} from "@/lib/fachadas/tipos";
import { urlPublicaONull } from "@/lib/fachadas/url";
import { estadoFachadaDesdeDb } from "@/lib/fachadas/estado";
import { logErrorFachadas } from "@/lib/fachadas/log";

export function esTablaFachadasAusente(message: string | undefined): boolean {
  if (!message) return false;
  return /fachadas|fachada_|proveedor_rubros/i.test(message) && /does not exist|schema cache|could not find/i.test(message);
}

function esColumnaFachadasAusente(message: string | undefined): boolean {
  if (!message) return false;
  return /does not exist|schema cache|could not find/i.test(message);
}

type Relacion<T> = T | T[] | null;

async function selectFachadasConFallback(
  query: (select: string) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>,
  selects: string[],
): Promise<{ data: unknown; error: { message: string } | null }> {
  let last: { data: unknown; error: { message: string } | null } = {
    data: null,
    error: { message: "No se pudo cargar las fachadas." },
  };
  for (const select of selects) {
    last = await query(select);
    if (!last.error) return last;
    if (!esColumnaFachadasAusente(last.error.message)) return last;
  }
  return last;
}

function many<T>(value: Relacion<T>): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function cargarCatalogosFachadas(
  supabase: SupabaseClient,
): Promise<CatalogosFachadas> {
  try {
    const [
      { data: recintosRaw, error: recintosError },
      { data: proveedoresRaw, error: proveedoresError },
      { data: rubrosRaw, error: rubrosError },
    ] = await Promise.all([
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
    if (recintosError) logErrorFachadas("catalogos recintos", recintosError);
    if (proveedoresError) {
      logErrorFachadas("catalogos proveedores", proveedoresError);
    }
    // Si la migración aún no está aplicada, el listado de proveedores sigue usable.
    if (rubrosError) logErrorFachadas("catalogos proveedor_rubros", rubrosError);

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
  } catch (err) {
    logErrorFachadas("cargarCatalogosFachadas", err);
    return { recintos: [], proveedores: [] };
  }
}

async function cargarIndicadoresDeIntervenciones(
  supabase: SupabaseClient,
  intervencionIds: string[],
  fachadaPorIntervencion: Map<string, { fachadaId: string; recintoId: string | null }>,
): Promise<Map<string, IntervencionIndicadores>> {
  const out = new Map<string, IntervencionIndicadores>();
  if (intervencionIds.length === 0) return out;

  try {
  const [
    { data: ints, error: intsError },
    { data: tipos, error: tiposError },
    { data: cotiz, error: cotizError },
    { data: hojas, error: hojasError },
    { data: mats, error: matsError },
    { data: docs, error: docsError },
  ] = await Promise.all([
    supabase
      .from("fachada_intervenciones")
      .select(
        "id, fachada_id, proveedor_id, ejecutado_por, estado, requiere_hojalateria, sin_materiales, fecha_inicio, fecha_termino, alto_m_snapshot, ancho_m_snapshot, superficie_m2_snapshot",
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
    supabase
      .from("fachada_hojalateria")
      .select("intervencion_id, proveedor_id, valor_neto, valor_bruto")
      .in("intervencion_id", intervencionIds),
    supabase
      .from("fachada_materiales")
      .select("intervencion_id, valor_neto, valor_bruto, tipo")
      .in("intervencion_id", intervencionIds),
    supabase
      .from("fachada_documentos")
      .select("intervencion_id, tipo_documento, categoria, valor_neto, estado")
      .in("intervencion_id", intervencionIds),
  ]);
  if (intsError) logErrorFachadas("indicadores intervenciones", intsError);
  if (tiposError) logErrorFachadas("indicadores tipos", tiposError);
  if (cotizError) logErrorFachadas("indicadores cotizaciones", cotizError);
  if (hojasError) logErrorFachadas("indicadores hojalateria", hojasError);
  if (matsError) logErrorFachadas("indicadores materiales", matsError);
  if (docsError) logErrorFachadas("indicadores documentos", docsError);

  const cotizIds = (cotiz ?? []).map((c) => c.id);
  const { data: cotizTipos, error: cotizTiposError } =
    cotizIds.length === 0
      ? { data: [] as { cotizacion_id: string; tipo: string }[], error: null }
      : await supabase
          .from("fachada_cotizacion_tipos")
          .select("cotizacion_id, tipo")
          .in("cotizacion_id", cotizIds);
  if (cotizTiposError) {
    logErrorFachadas("indicadores cotizacion_tipos", cotizTiposError);
  }

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
        estado: i.estado,
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
          .map((m) => ({
            valor_neto: m.valor_neto,
            valor_bruto: m.valor_bruto,
            tipo: m.tipo,
          })),
        documentos: (docs ?? [])
          .filter((d) => d.intervencion_id === i.id)
          .map((d) => ({
            tipo_documento: d.tipo_documento,
            categoria: d.categoria,
            valor_neto: d.valor_neto,
            estado: d.estado,
          })),
      }),
    );
  }
  return out;
  } catch (err) {
    logErrorFachadas("cargarIndicadoresDeIntervenciones", err);
    return out;
  }
}

export async function cargarFachadasSubtipo(
  supabase: SupabaseClient,
  recintos: RecintoOption[],
): Promise<{
  fachadas: FachadaListadoItem[];
  intervenciones: IntervencionIndicadores[];
  portadas: PortadaIntervencion[];
  error: string | null;
  tablasAusentes: boolean;
}> {
  try {
  const selectPlano =
    "id, nombre, letra, recinto_id, superficie_m2, svg_id, ubicacion, tipo_espacio, unidad_label, orden, largo_plano_m, evaluada_en, frecuencia_revision_meses, frecuencia_limpieza_meses, frecuencia_reparacion_meses, frecuencia_pintura_meses, ultima_limpieza_fecha, ultima_reparacion_fecha, ultima_pintura_fecha, foto_key, fachada_intervenciones ( id, estado, created_at )";
  const selectFechas =
    "id, nombre, letra, recinto_id, superficie_m2, frecuencia_revision_meses, frecuencia_limpieza_meses, frecuencia_reparacion_meses, frecuencia_pintura_meses, ultima_limpieza_fecha, ultima_reparacion_fecha, ultima_pintura_fecha, foto_key, fachada_intervenciones ( id, estado, created_at )";
  const selectFreqs =
    "id, nombre, letra, recinto_id, superficie_m2, frecuencia_revision_meses, frecuencia_limpieza_meses, frecuencia_reparacion_meses, frecuencia_pintura_meses, foto_key, fachada_intervenciones ( id, estado, created_at )";
  const selectLegacy =
    "id, nombre, letra, recinto_id, superficie_m2, frecuencia_revision_meses, foto_key, fachada_intervenciones ( id, estado, created_at )";
  const { data, error } = await selectFachadasConFallback(
    async (select) => {
      const res = await supabase.from("fachadas").select(select).order("nombre");
      return { data: res.data, error: res.error };
    },
    [selectPlano, selectFechas, selectFreqs, selectLegacy],
  );
  const rows = (data ?? []) as Array<{
    id: string;
    nombre: string;
    letra?: string | null;
    recinto_id: string | null;
    superficie_m2: number;
    frecuencia_revision_meses?: number | null;
    frecuencia_limpieza_meses?: number | null;
    frecuencia_reparacion_meses?: number | null;
    frecuencia_pintura_meses?: number | null;
    ultima_limpieza_fecha?: string | null;
    ultima_reparacion_fecha?: string | null;
    ultima_pintura_fecha?: string | null;
    foto_key: string | null;
    svg_id?: string | null;
    ubicacion?: string | null;
    tipo_espacio?: string | null;
    unidad_label?: string | null;
    orden?: number | null;
    largo_plano_m?: number | null;
    evaluada_en?: string | null;
    fachada_intervenciones?: Relacion<{
      id: string;
      estado: string | null;
      created_at: string;
    }>;
  }>;

  if (error) {
    logErrorFachadas("cargarFachadasSubtipo", error);
    return {
      fachadas: [],
      intervenciones: [],
      portadas: [],
      error: error.message,
      tablasAusentes: esTablaFachadasAusente(error.message),
    };
  }

  const fachadas = rows.map((row) =>
    mapFachadaListado(
      {
        ...row,
        intervenciones: many(row.fachada_intervenciones ?? null),
      },
      recintos,
    ),
  );
  const archivosPorFachada = await cargarArchivosEstado(
    supabase,
    fachadas.map((f) => f.id),
  );
  for (const fachada of fachadas) {
    const portada = urlPortadaEstado(archivosPorFachada.get(fachada.id) ?? []);
    if (portada) fachada.fotoUrl = portada;
  }

  const intsMeta = new Map<string, { fachadaId: string; recintoId: string | null }>();
  const ids: string[] = [];
  for (const row of rows) {
    for (const i of many(row.fachada_intervenciones ?? null)) {
      ids.push(i.id);
      intsMeta.set(i.id, { fachadaId: row.id, recintoId: row.recinto_id });
    }
  }

  const [mapa, portadas] = await Promise.all([
    cargarIndicadoresDeIntervenciones(supabase, ids, intsMeta),
    cargarPortadasIntervenciones(supabase, ids),
  ]);
  return {
    fachadas,
    intervenciones: [...mapa.values()],
    portadas,
    error: null,
    tablasAusentes: false,
  };
  } catch (err) {
    logErrorFachadas("cargarFachadasSubtipo threw", err);
    const message =
      err instanceof Error ? err.message : "No se pudieron cargar las fachadas.";
    return {
      fachadas: [],
      intervenciones: [],
      portadas: [],
      error: message,
      tablasAusentes: esTablaFachadasAusente(message),
    };
  }
}

function urlPortadaEstado(archivos: ArchivoEstadoFachada[]): string | null {
  const fotos = archivos.filter((a) => a.tipoArchivo === "foto");
  const portada = fotos.find((a) => a.esPortada) ?? fotos[0];
  if (!portada) return null;
  return portada.thumbnailUrl || portada.publicUrl;
}

async function cargarArchivosEstado(
  supabase: SupabaseClient,
  fachadaIds: string[],
): Promise<Map<string, ArchivoEstadoFachada[]>> {
  const out = new Map<string, ArchivoEstadoFachada[]>();
  if (fachadaIds.length === 0) return out;
  try {
    const selectMomento =
      "id, fachada_id, tipo_archivo, object_key, thumbnail_key, nombre_archivo, es_portada, orden, fecha, momento, duracion_seg";
    const selectLegacy =
      "id, fachada_id, tipo_archivo, object_key, thumbnail_key, nombre_archivo, es_portada, orden, fecha";
    const loaded = await selectFachadasConFallback(
      async (select) => {
        const res = await supabase
          .from("fachada_archivos")
          .select(select)
          .in("fachada_id", fachadaIds)
          .order("orden", { ascending: true });
        return { data: res.data, error: res.error };
      },
      [selectMomento, selectLegacy],
    );
    if (loaded.error) {
      logErrorFachadas("cargarArchivosEstado", loaded.error);
      return out;
    }
    const data = (loaded.data ?? []) as Array<{
      id: string;
      fachada_id: string;
      tipo_archivo: string;
      object_key: string;
      thumbnail_key: string | null;
      nombre_archivo: string | null;
      es_portada: boolean | null;
      orden: number | null;
      fecha: string | null;
      momento?: string | null;
      duracion_seg?: number | null;
    }>;
    for (const row of data) {
      const item: ArchivoEstadoFachada = mapArchivoEstado(row);
      const lista = out.get(row.fachada_id) ?? [];
      lista.push(item);
      out.set(row.fachada_id, lista);
    }
  } catch (err) {
    logErrorFachadas("cargarArchivosEstado threw", err);
  }
  return out;
}

async function cargarPortadasIntervenciones(
  supabase: SupabaseClient,
  intervencionIds: string[],
): Promise<PortadaIntervencion[]> {
  if (intervencionIds.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from("fachada_media")
      .select("intervencion_id, tipo, thumbnail_key, es_portada, tipo_archivo")
      .in("intervencion_id", intervencionIds)
      .eq("tipo_archivo", "foto");
    if (error) {
      logErrorFachadas("cargarPortadasIntervenciones", error);
      return [];
    }
    const byInt = new Map<string, PortadaIntervencion>();
    for (const id of intervencionIds) {
      byInt.set(id, { intervencionId: id, antesUrl: null, despuesUrl: null });
    }
    const sorted = [...(data ?? [])].sort((a, b) =>
      Number(b.es_portada) - Number(a.es_portada),
    );
    for (const row of sorted) {
      const slot = byInt.get(row.intervencion_id);
      if (!slot) continue;
      const url = urlPublicaONull(row.thumbnail_key);
      if (row.tipo === "antes" && !slot.antesUrl) slot.antesUrl = url;
      if (row.tipo === "despues" && !slot.despuesUrl) slot.despuesUrl = url;
    }
    return [...byInt.values()].filter((p) => p.antesUrl || p.despuesUrl);
  } catch (err) {
    logErrorFachadas("cargarPortadasIntervenciones threw", err);
    return [];
  }
}

export async function cargarFachadaDetalle(
  supabase: SupabaseClient,
  fachadaId: string,
  recintos: RecintoOption[],
): Promise<{ fachada: FachadaDetalle | null; error: string | null; tablasAusentes: boolean }> {
  try {
  const selectPlano =
    "id, nombre, letra, recinto_id, alto_m, ancho_m, superficie_m2, svg_id, ubicacion, tipo_espacio, unidad_label, orden, largo_plano_m, evaluada_en, frecuencia_revision_meses, frecuencia_limpieza_meses, frecuencia_reparacion_meses, frecuencia_pintura_meses, ultima_limpieza_fecha, ultima_reparacion_fecha, ultima_pintura_fecha, notas, foto_key, foto_nombre, plano_key, plano_nombre, fachada_intervenciones ( id, estado, fecha_inicio, fecha_termino, ejecutado_por, created_at )";
  const selectFechas =
    "id, nombre, letra, recinto_id, alto_m, ancho_m, superficie_m2, frecuencia_revision_meses, frecuencia_limpieza_meses, frecuencia_reparacion_meses, frecuencia_pintura_meses, ultima_limpieza_fecha, ultima_reparacion_fecha, ultima_pintura_fecha, notas, foto_key, foto_nombre, plano_key, plano_nombre, fachada_intervenciones ( id, estado, fecha_inicio, fecha_termino, ejecutado_por, created_at )";
  const selectFreqs =
    "id, nombre, letra, recinto_id, alto_m, ancho_m, superficie_m2, frecuencia_revision_meses, frecuencia_limpieza_meses, frecuencia_reparacion_meses, frecuencia_pintura_meses, notas, foto_key, foto_nombre, plano_key, plano_nombre, fachada_intervenciones ( id, estado, fecha_inicio, fecha_termino, ejecutado_por, created_at )";
  const selectLegacy =
    "id, nombre, letra, recinto_id, alto_m, ancho_m, superficie_m2, frecuencia_revision_meses, notas, foto_key, foto_nombre, plano_key, plano_nombre, fachada_intervenciones ( id, estado, fecha_inicio, fecha_termino, ejecutado_por, created_at )";
  const loaded = await selectFachadasConFallback(
    async (select) => {
      const res = await supabase
        .from("fachadas")
        .select(select)
        .eq("id", fachadaId)
        .maybeSingle();
      return { data: res.data, error: res.error };
    },
    [selectPlano, selectFechas, selectFreqs, selectLegacy],
  );
  const error = loaded.error;
  const data = loaded.data as {
    id: string;
    nombre: string;
    letra?: string | null;
    recinto_id: string | null;
    alto_m: number;
    ancho_m: number;
    superficie_m2: number;
    frecuencia_revision_meses?: number | null;
    frecuencia_limpieza_meses?: number | null;
    frecuencia_reparacion_meses?: number | null;
    frecuencia_pintura_meses?: number | null;
    ultima_limpieza_fecha?: string | null;
    ultima_reparacion_fecha?: string | null;
    ultima_pintura_fecha?: string | null;
    notas: string | null;
    foto_key: string | null;
    foto_nombre: string | null;
    plano_key: string | null;
    plano_nombre: string | null;
    svg_id?: string | null;
    ubicacion?: string | null;
    tipo_espacio?: string | null;
    unidad_label?: string | null;
    orden?: number | null;
    largo_plano_m?: number | null;
    evaluada_en?: string | null;
    fachada_intervenciones?: Relacion<{
      id: string;
      estado: string | null;
      fecha_inicio: string | null;
      fecha_termino: string | null;
      ejecutado_por: string | null;
      created_at: string;
    }>;
  } | null;

  if (error) {
    logErrorFachadas("cargarFachadaDetalle", error);
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

  const fachada = mapFachadaDetalle(data, recintos, resumenes);
  const archivos = (await cargarArchivosEstado(supabase, [data.id])).get(data.id) ?? [];
  fachada.archivos = archivos;
  const portada =
    archivos.find((a) => a.esPortada && a.tipoArchivo === "foto") ??
    archivos.find((a) => a.tipoArchivo === "foto");
  if (portada) {
    fachada.foto = {
      key: portada.objectKey,
      nombre: portada.nombreArchivo,
      url: portada.publicUrl || portada.thumbnailUrl,
    };
  }
  return {
    fachada,
    error: null,
    tablasAusentes: false,
  };
  } catch (err) {
    logErrorFachadas("cargarFachadaDetalle threw", err);
    const message =
      err instanceof Error ? err.message : "No se pudo cargar la fachada.";
    return {
      fachada: null,
      error: message,
      tablasAusentes: esTablaFachadasAusente(message),
    };
  }
}

export async function cargarIntervencionDetalle(
  supabase: SupabaseClient,
  intervencionId: string,
): Promise<{
  intervencion: IntervencionDetalle | null;
  error: string | null;
  tablasAusentes: boolean;
}> {
  try {
  const { data: row, error } = await supabase
    .from("fachada_intervenciones")
    .select(
      "id, fachada_id, estado, fecha_inicio, fecha_termino, notas, ejecutado_por, proveedor_id, maestros_asignados, requiere_hojalateria, sin_materiales, alto_m_snapshot, ancho_m_snapshot, superficie_m2_snapshot, fachadas ( id, nombre )",
    )
    .eq("id", intervencionId)
    .maybeSingle();

  if (error) {
    logErrorFachadas("cargarIntervencionDetalle", error);
    return {
      intervencion: null,
      error: error.message,
      tablasAusentes: esTablaFachadasAusente(error.message),
    };
  }
  if (!row) return { intervencion: null, error: null, tablasAusentes: false };

  const fachadaRel = many(row.fachadas as Relacion<{ id: string; nombre: string }>)[0];

  const [
    { data: tipos },
    { data: cotiz },
    { data: hojas },
    { data: mats },
    { data: media },
    { data: docs },
  ] =
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
          "id, tipo, fecha_compra, proveedor_id, numero_factura, material, valor_neto, valor_iva, valor_bruto, factura_key, factura_nombre",
        )
        .eq("intervencion_id", intervencionId),
      supabase
        .from("fachada_media")
        .select(
          "id, tipo, tipo_archivo, object_key, nombre_archivo, thumbnail_key, es_portada, orden, fecha",
        )
        .eq("intervencion_id", intervencionId)
        .order("orden")
        .order("created_at"),
      supabase
        .from("fachada_documentos")
        .select(
          "id, tipo_documento, categoria, proveedor_id, numero, fecha, valor_neto, archivo_key, archivo_nombre, estado",
        )
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
      maestrosAsignados: row.maestros_asignados ?? null,
      requiereHojalateria: row.requiere_hojalateria,
      sinMateriales: row.sin_materiales,
      altoMSnapshot: asMedidaNullable(row.alto_m_snapshot),
      anchoMSnapshot: asMedidaNullable(row.ancho_m_snapshot),
      superficieM2Snapshot: asMedidaNullable(row.superficie_m2_snapshot),
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
      documentos: (docs ?? [])
        .map(mapDocumento)
        .filter((d): d is NonNullable<typeof d> => d != null),
      media: (media ?? [])
        .map(mapMedia)
        .filter((m): m is NonNullable<typeof m> => m != null),
    },
    error: null,
    tablasAusentes: false,
  };
  } catch (err) {
    logErrorFachadas("cargarIntervencionDetalle threw", err);
    const message =
      err instanceof Error ? err.message : "No se pudo cargar la intervención.";
    return {
      intervencion: null,
      error: message,
      tablasAusentes: esTablaFachadasAusente(message),
    };
  }
}

async function cargarIntervencionesDetalle(
  supabase: SupabaseClient,
  intervencionIds: string[],
): Promise<IntervencionDetalle[]> {
  if (intervencionIds.length === 0) return [];
  const { data: rows, error } = await supabase
    .from("fachada_intervenciones")
    .select(
      "id, fachada_id, estado, fecha_inicio, fecha_termino, notas, ejecutado_por, proveedor_id, maestros_asignados, requiere_hojalateria, sin_materiales, alto_m_snapshot, ancho_m_snapshot, superficie_m2_snapshot, fachadas ( id, nombre )",
    )
    .in("id", intervencionIds);
  if (error || !rows) {
    if (error) logErrorFachadas("cargarIntervencionesDetalle", error);
    return [];
  }

  const [
    { data: tipos },
    { data: cotiz },
    { data: hojas },
    { data: mats },
    { data: media },
    { data: docs },
  ] = await Promise.all([
    supabase
      .from("fachada_intervencion_tipos")
      .select("intervencion_id, tipo, dias")
      .in("intervencion_id", intervencionIds),
    supabase
      .from("fachada_cotizaciones")
      .select(
        "id, intervencion_id, proveedor_id, numero_cotizacion, valor_neto, valor_iva, valor_bruto, cotizacion_key, cotizacion_nombre, factura_key, factura_nombre, fachada_cotizacion_tipos ( tipo )",
      )
      .in("intervencion_id", intervencionIds),
    supabase
      .from("fachada_hojalateria")
      .select(
        "id, intervencion_id, proveedor_id, descripcion, valor_neto, valor_iva, valor_bruto, cotizacion_key, cotizacion_nombre, factura_key, factura_nombre",
      )
      .in("intervencion_id", intervencionIds),
    supabase
      .from("fachada_materiales")
      .select(
        "id, intervencion_id, tipo, fecha_compra, proveedor_id, numero_factura, material, valor_neto, valor_iva, valor_bruto, factura_key, factura_nombre",
      )
      .in("intervencion_id", intervencionIds),
    supabase
      .from("fachada_media")
      .select(
        "id, intervencion_id, tipo, tipo_archivo, object_key, nombre_archivo, thumbnail_key, es_portada, orden, fecha",
      )
      .in("intervencion_id", intervencionIds)
      .order("orden")
      .order("created_at"),
    supabase
      .from("fachada_documentos")
      .select(
        "id, intervencion_id, tipo_documento, categoria, proveedor_id, numero, fecha, valor_neto, archivo_key, archivo_nombre, estado",
      )
      .in("intervencion_id", intervencionIds)
      .order("created_at"),
  ]);

  const ofInt = (id: string) => ({
    tipos: (tipos ?? []).filter((t) => t.intervencion_id === id),
    cotiz: (cotiz ?? []).filter((c) => c.intervencion_id === id),
    hojas: (hojas ?? []).filter((h) => h.intervencion_id === id),
    mats: (mats ?? []).filter((m) => m.intervencion_id === id),
    media: (media ?? []).filter((m) => m.intervencion_id === id),
    docs: (docs ?? []).filter((d) => d.intervencion_id === id),
  });

  const orden = new Map(intervencionIds.map((id, i) => [id, i]));
  const detalles = rows.map((row) => {
    const fachadaRel = many(row.fachadas as Relacion<{ id: string; nombre: string }>)[0];
    const rel = ofInt(row.id);
    const detalle: IntervencionDetalle = {
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
      maestrosAsignados: row.maestros_asignados ?? null,
      requiereHojalateria: row.requiere_hojalateria,
      sinMateriales: row.sin_materiales,
      altoMSnapshot: asMedidaNullable(row.alto_m_snapshot),
      anchoMSnapshot: asMedidaNullable(row.ancho_m_snapshot),
      superficieM2Snapshot: asMedidaNullable(row.superficie_m2_snapshot),
      tipos: rel.tipos
        .map((t) => ({
          tipo: t.tipo as IntervencionDetalle["tipos"][number]["tipo"],
          dias: Number(t.dias),
        }))
        .filter(
          (t) =>
            t.tipo === "limpieza" || t.tipo === "reparacion" || t.tipo === "pintura",
        ),
      cotizaciones: rel.cotiz.map((c) =>
        mapCotizacion({
          ...c,
          tipos: many(
            c.fachada_cotizacion_tipos as Relacion<{ tipo: string }>,
          ).map((t) => t.tipo),
        }),
      ),
      hojalaterias: rel.hojas.map(mapHojalateria),
      materiales: rel.mats.map(mapMaterial),
      documentos: rel.docs
        .map(mapDocumento)
        .filter((d): d is NonNullable<typeof d> => d != null),
      media: rel.media
        .map(mapMedia)
        .filter((m): m is NonNullable<typeof m> => m != null),
    };
    return detalle;
  });
  detalles.sort((a, b) => (orden.get(a.id) ?? 0) - (orden.get(b.id) ?? 0));
  return detalles;
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

export async function cargarFichaFachada(
  supabase: SupabaseClient,
  fachadaId: string,
  recintos: RecintoOption[],
): Promise<{
  fachada: FachadaDetalle | null;
  intervenciones: IntervencionDetalle[];
  error: string | null;
  tablasAusentes: boolean;
}> {
  const base = await cargarFachadaDetalle(supabase, fachadaId, recintos);
  if (!base.fachada) {
    return { ...base, intervenciones: [] };
  }
  const ids = base.fachada.intervenciones.map((i) => i.id);
  const intervenciones = await cargarIntervencionesDetalle(supabase, ids);
  return {
    fachada: base.fachada,
    intervenciones,
    error: base.error,
    tablasAusentes: base.tablasAusentes,
  };
}

