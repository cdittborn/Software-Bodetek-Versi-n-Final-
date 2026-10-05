import { createClient } from "@/lib/supabase/client";
import { estadoFachadaHaciaDb, type EstadoFachada } from "@/lib/fachadas/estado";
import {
  asMedidaNullable,
  copiarSnapshotAlCrear,
  actualizarSnapshotDesdeFachada,
  estadoDocumentoDefault,
  hayNombreFachadaDuplicado,
  MENSAJE_NOMBRE_FACHADA_DUPLICADO,
  normalizarFechaBase,
  redondearM2,
  type CategoriaDocumentoFachada,
  type EjecutadoPorFachada,
  type EstadoMedidasForm,
  type SnapshotMedidas,
  type TipoDocumentoFachada,
  type TipoIntervencionFachada,
  type TipoMaterialFachada,
} from "@/lib/fachadas/indicadores";
import { ivaDesdeNeto, brutoDesde } from "@/lib/filtracion/materiales";
import { hoyIsoChile } from "@/lib/fachadas/ficha";

function normalizarMedida(
  n: number | null | undefined,
  label: string,
): number | null {
  if (n == null) return null;
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`${label} debe ser mayor a 0`);
  }
  return redondearM2(n);
}

function normalizarMedidas(sug: EstadoMedidasForm): {
  altoM: number | null;
  anchoM: number | null;
  superficieM2: number | null;
} {
  return {
    altoM: normalizarMedida(sug.altoM, "Alto"),
    anchoM: normalizarMedida(sug.anchoM, "Ancho"),
    superficieM2: normalizarMedida(sug.superficieM2, "Superficie"),
  };
}

export type GuardarFachadaCampos = {
  nombre: string;
  medidas: EstadoMedidasForm;
  frecuenciaLimpiezaMeses: number;
  frecuenciaReparacionMeses: number;
  frecuenciaPinturaMeses: number;
  ultimaLimpiezaFecha: string | null;
  ultimaReparacionFecha: string | null;
  ultimaPinturaFecha: string | null;
  notas: string | null;
};

function fechasBasePayload(input: GuardarFachadaCampos) {
  const hoy = hoyIsoChile();
  return {
    ultima_limpieza_fecha: normalizarFechaBase(input.ultimaLimpiezaFecha, hoy),
    ultima_reparacion_fecha: normalizarFechaBase(input.ultimaReparacionFecha, hoy),
    ultima_pintura_fecha: normalizarFechaBase(input.ultimaPinturaFecha, hoy),
  };
}

function exigirFrecuencia(n: number, label: string): number {
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`La frecuencia de ${label} debe ser mayor a 0`);
  }
  return Math.round(n);
}

async function exigirNombreUnico(
  nombre: string,
  excludeId?: string,
): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("fachadas").select("id, nombre");
  if (error) throw new Error(error.message);
  if (hayNombreFachadaDuplicado(nombre, data ?? [], excludeId)) {
    throw new Error(MENSAJE_NOMBRE_FACHADA_DUPLICADO);
  }
}

export async function crearFachada(input: GuardarFachadaCampos): Promise<string> {
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("El nombre de la fachada es obligatorio");
  await exigirNombreUnico(nombre);
  const sug = normalizarMedidas(input.medidas);
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("fachadas")
    .insert({
      nombre,
      letra: null,
      recinto_id: null,
      alto_m: sug.altoM,
      ancho_m: sug.anchoM,
      superficie_m2: sug.superficieM2,
      frecuencia_limpieza_meses: exigirFrecuencia(input.frecuenciaLimpiezaMeses, "limpieza"),
      frecuencia_reparacion_meses: exigirFrecuencia(
        input.frecuenciaReparacionMeses,
        "reparación",
      ),
      frecuencia_pintura_meses: exigirFrecuencia(input.frecuenciaPinturaMeses, "pintura"),
      ...fechasBasePayload(input),
      notas: input.notas?.trim() || null,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(mensajeErrorFachada(error));
  return data.id;
}

export async function guardarFachada(
  input: GuardarFachadaCampos & { id: string },
): Promise<void> {
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("El nombre de la fachada es obligatorio");
  await exigirNombreUnico(nombre, input.id);
  const sug = normalizarMedidas(input.medidas);
  const supabase = createClient();
  const { error } = await supabase
    .from("fachadas")
    .update({
      nombre,
      alto_m: sug.altoM,
      ancho_m: sug.anchoM,
      superficie_m2: sug.superficieM2,
      frecuencia_limpieza_meses: exigirFrecuencia(input.frecuenciaLimpiezaMeses, "limpieza"),
      frecuencia_reparacion_meses: exigirFrecuencia(
        input.frecuenciaReparacionMeses,
        "reparación",
      ),
      frecuencia_pintura_meses: exigirFrecuencia(input.frecuenciaPinturaMeses, "pintura"),
      ...fechasBasePayload(input),
      notas: input.notas?.trim() || null,
    })
    .eq("id", input.id);
  if (error) throw new Error(mensajeErrorFachada(error));
}

export async function guardarArchivoFachada(
  fachadaId: string,
  campo: "foto" | "plano",
  key: string | null,
  nombre: string | null,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("fachadas")
    .update(
      campo === "foto"
        ? { foto_key: key, foto_nombre: nombre }
        : { plano_key: key, plano_nombre: nombre },
    )
    .eq("id", fachadaId);
  if (error) throw new Error(error.message);
}

export async function crearIntervencion(fachadaId: string): Promise<string> {
  const supabase = createClient();
  const { data: fachada, error: fErr } = await supabase
    .from("fachadas")
    .select("alto_m, ancho_m, superficie_m2")
    .eq("id", fachadaId)
    .maybeSingle();
  if (fErr || !fachada) throw new Error(fErr?.message ?? "Fachada no encontrada");
  const snap = copiarSnapshotAlCrear({
    altoM: asMedidaNullable(fachada.alto_m),
    anchoM: asMedidaNullable(fachada.ancho_m),
    superficieM2: asMedidaNullable(fachada.superficie_m2),
    superficieManual: true,
  });
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("fachada_intervenciones")
    .insert({
      fachada_id: fachadaId,
      estado: "programada",
      alto_m_snapshot: snap.altoMSnapshot,
      ancho_m_snapshot: snap.anchoMSnapshot,
      superficie_m2_snapshot: snap.superficieM2Snapshot,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear la intervención");
  }
  return data.id;
}

function mensajeErrorFachada(error: { code?: string; message?: string } | null): string {
  if (!error) return "No se pudo guardar la fachada";
  if (error.code === "23505") {
    return MENSAJE_NOMBRE_FACHADA_DUPLICADO;
  }
  return error.message || "No se pudo guardar la fachada";
}

export async function actualizarSnapshotIntervencion(
  intervencionId: string,
  fachadaId: string,
): Promise<SnapshotMedidas> {
  const supabase = createClient();
  const { data: fachada, error: fErr } = await supabase
    .from("fachadas")
    .select("alto_m, ancho_m, superficie_m2")
    .eq("id", fachadaId)
    .maybeSingle();
  if (fErr || !fachada) throw new Error(fErr?.message ?? "Fachada no encontrada");
  const snap = actualizarSnapshotDesdeFachada({
    altoM: asMedidaNullable(fachada.alto_m),
    anchoM: asMedidaNullable(fachada.ancho_m),
    superficieM2: asMedidaNullable(fachada.superficie_m2),
    superficieManual: true,
  });
  const { error } = await supabase
    .from("fachada_intervenciones")
    .update({
      alto_m_snapshot: snap.altoMSnapshot,
      ancho_m_snapshot: snap.anchoMSnapshot,
      superficie_m2_snapshot: snap.superficieM2Snapshot,
    })
    .eq("id", intervencionId);
  if (error) throw new Error(error.message);
  return snap;
}

export type GuardarDocumentoInput = {
  id: string;
  proveedorId: string | null;
  numero: string | null;
  fecha: string | null;
  valorNeto: number;
  estado: string;
  tipoDocumento?: TipoDocumentoFachada;
};

export type GuardarIntervencionInput = {
  id: string;
  estado: EstadoFachada;
  fechaInicio: string | null;
  fechaTermino: string | null;
  notas: string | null;
  ejecutadoPor: EjecutadoPorFachada | null;
  proveedorId: string | null;
  maestrosAsignados: string | null;
  requiereHojalateria: boolean;
  sinMateriales: boolean;
  tipos: { tipo: TipoIntervencionFachada; dias: number }[];
  documentos: GuardarDocumentoInput[];
  hojalateria: {
    id: string | null;
    proveedorId: string | null;
    descripcion: string | null;
  } | null;
  materiales: {
    id: string;
    tipo: TipoMaterialFachada;
    material: string;
    valorNeto: number;
  }[];
};

export async function guardarIntervencion(
  input: GuardarIntervencionInput,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("fachada_intervenciones")
    .update({
      estado: estadoFachadaHaciaDb(input.estado),
      fecha_inicio: input.fechaInicio || null,
      fecha_termino: input.fechaTermino || null,
      notas: input.notas?.trim() || null,
      ejecutado_por: input.ejecutadoPor,
      proveedor_id:
        input.ejecutadoPor === "proveedor_externo" ? input.proveedorId : null,
      maestros_asignados:
        input.ejecutadoPor === "maestros_bodetek"
          ? input.maestrosAsignados?.trim() || null
          : null,
      requiere_hojalateria: input.requiereHojalateria,
      sin_materiales: input.sinMateriales || input.materiales.length === 0,
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);

  const { error: delTipos } = await supabase
    .from("fachada_intervencion_tipos")
    .delete()
    .eq("intervencion_id", input.id);
  if (delTipos) throw new Error(delTipos.message);
  if (input.tipos.length > 0) {
    const { error: insTipos } = await supabase
      .from("fachada_intervencion_tipos")
      .insert(
        input.tipos.map((t) => ({
          intervencion_id: input.id,
          tipo: t.tipo,
          dias: t.dias,
        })),
      );
    if (insTipos) throw new Error(insTipos.message);
  }

  for (const d of input.documentos) {
    const { error: u } = await supabase
      .from("fachada_documentos")
      .update({
        proveedor_id: d.proveedorId,
        numero: d.numero?.trim() || null,
        fecha: d.fecha || null,
        valor_neto: Math.max(0, Math.round(d.valorNeto)),
        estado: d.estado,
        ...(d.tipoDocumento ? { tipo_documento: d.tipoDocumento } : {}),
      })
      .eq("id", d.id);
    if (u) throw new Error(u.message);
  }

  if (input.requiereHojalateria) {
    const meta = input.hojalateria;
    if (meta?.id) {
      const { error: u } = await supabase
        .from("fachada_hojalateria")
        .update({
          proveedor_id: meta.proveedorId,
          descripcion: meta.descripcion?.trim() || null,
          valor_neto: 0,
          valor_iva: 0,
          valor_bruto: 0,
        })
        .eq("id", meta.id);
      if (u) throw new Error(u.message);
    }
  }

  for (const m of input.materiales) {
    const neto = Math.max(0, Math.round(m.valorNeto));
    const iva = ivaDesdeNeto(neto);
    const { error: u } = await supabase
      .from("fachada_materiales")
      .update({
        tipo: m.tipo,
        material: m.material.trim(),
        valor_neto: neto,
        valor_iva: iva,
        valor_bruto: brutoDesde(neto, iva),
      })
      .eq("id", m.id);
    if (u) throw new Error(u.message);
  }
}

export async function insertarDocumento(input: {
  intervencionId: string;
  tipoDocumento: TipoDocumentoFachada;
  categoria: CategoriaDocumentoFachada;
}): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("fachada_documentos")
    .insert({
      intervencion_id: input.intervencionId,
      tipo_documento: input.tipoDocumento,
      categoria: input.categoria,
      valor_neto: 0,
      estado: estadoDocumentoDefault(input.tipoDocumento),
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo agregar el documento");
  }
  return data.id;
}

export async function borrarDocumento(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("fachada_documentos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function guardarArchivoDocumento(
  id: string,
  key: string | null,
  nombre: string | null,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("fachada_documentos")
    .update({ archivo_key: key, archivo_nombre: nombre })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertarHojalateriaVacia(intervencionId: string): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("fachada_hojalateria")
    .insert({
      intervencion_id: intervencionId,
      valor_neto: 0,
      valor_iva: 0,
      valor_bruto: 0,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo agregar hojalatería");
  return data.id;
}

export async function insertarMaterialVacio(
  intervencionId: string,
  tipo: TipoMaterialFachada = "otros",
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fachada_materiales")
    .insert({
      intervencion_id: intervencionId,
      tipo,
      material: "",
      valor_neto: 0,
      valor_iva: 0,
      valor_bruto: 0,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo agregar el material");
  return data.id;
}

export async function borrarMaterial(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("fachada_materiales").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function borrarFachada(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("fachadas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function marcarPortadaArchivoEstado(input: {
  id: string;
  fachadaId: string;
}): Promise<void> {
  const supabase = createClient();
  const { data: fila, error: readErr } = await supabase
    .from("fachada_archivos")
    .select("id, tipo_archivo")
    .eq("id", input.id)
    .maybeSingle();
  if (readErr || !fila) throw new Error(readErr?.message ?? "No se encontró el archivo");
  if (fila.tipo_archivo !== "foto") {
    throw new Error("La portada solo puede ser una foto");
  }
  const { error: clearErr } = await supabase
    .from("fachada_archivos")
    .update({ es_portada: false })
    .eq("fachada_id", input.fachadaId)
    .eq("es_portada", true);
  if (clearErr) throw new Error(clearErr.message);
  const { error } = await supabase
    .from("fachada_archivos")
    .update({ es_portada: true })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
}

export async function borrarArchivoEstado(id: string): Promise<void> {
  const supabase = createClient();
  const { data: fila, error: readErr } = await supabase
    .from("fachada_archivos")
    .select("id, fachada_id, es_portada")
    .eq("id", id)
    .maybeSingle();
  if (readErr || !fila) throw new Error(readErr?.message ?? "No se encontró el archivo");
  const { error } = await supabase.from("fachada_archivos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (!fila.es_portada) return;
  const { data: siguiente } = await supabase
    .from("fachada_archivos")
    .select("id")
    .eq("fachada_id", fila.fachada_id)
    .eq("tipo_archivo", "foto")
    .order("orden", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!siguiente) return;
  await supabase.from("fachada_archivos").update({ es_portada: true }).eq("id", siguiente.id);
}

export async function marcarPortadaMedia(input: {
  id: string;
  intervencionId: string;
  tipo: "antes" | "despues";
}): Promise<void> {
  const supabase = createClient();
  const { data: fila, error: readErr } = await supabase
    .from("fachada_media")
    .select("id, tipo_archivo")
    .eq("id", input.id)
    .maybeSingle();
  if (readErr || !fila) throw new Error(readErr?.message ?? "No se encontró el archivo");
  if (fila.tipo_archivo !== "foto") {
    throw new Error("La portada solo puede ser una foto");
  }
  const { error: clearErr } = await supabase
    .from("fachada_media")
    .update({ es_portada: false })
    .eq("intervencion_id", input.intervencionId)
    .eq("tipo", input.tipo)
    .eq("es_portada", true);
  if (clearErr) throw new Error(clearErr.message);
  const { error } = await supabase
    .from("fachada_media")
    .update({ es_portada: true })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
}
