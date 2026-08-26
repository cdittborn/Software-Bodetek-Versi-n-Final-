import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { construirUrlPublica } from "@/lib/r2/utils";
import { thumbnailPublicUrl } from "@/lib/media/urls";
import {
  isSubtipoLluviasYTemporales,
  parseMonto,
  type EmergenciaConMedia,
  emptyEmergenciaMedia,
  type EmergenciaListadoMedia,
  type RecintoOption,
  type TrabajoMediaItem,
  type TrabajoMediaTipo,
  type TrabajoMediaTipoArchivo,
} from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";

type Relacion<T> = T | T[] | null;

function one<T>(value: Relacion<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function emptyMedia(): EmergenciaListadoMedia {
  return emptyEmergenciaMedia();
}

export type DatosEventoFiltracion = {
  categoriaId: string;
  subtipoId: string;
  eventoId: string;
  eventoNombre: string;
  emergencias: EmergenciaConMedia[];
  recintos: RecintoOption[];
  proveedores: ProveedorOption[];
  puedeEditar: boolean;
};

export type CargarDatosEventoFiltracionParams = {
  categoriaId: string;
  subtipoId: string;
  eventoId: string;
};

export async function cargarDatosEventoFiltracion(
  supabase: SupabaseClient,
  params: CargarDatosEventoFiltracionParams,
): Promise<DatosEventoFiltracion | null> {
  const { categoriaId, subtipoId, eventoId } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: categoria }, { data: subtipo }, { data: evento }] =
    await Promise.all([
      supabase
        .from("trabajo_categorias")
        .select("id, nombre")
        .eq("id", categoriaId)
        .maybeSingle(),
      supabase
        .from("trabajo_subtipos")
        .select("id, nombre, categoria_id")
        .eq("id", subtipoId)
        .maybeSingle(),
      supabase
        .from("eventos")
        .select("id, nombre, subtipo_id")
        .eq("id", eventoId)
        .maybeSingle(),
    ]);

  if (
    !categoria ||
    !subtipo ||
    !evento ||
    subtipo.categoria_id !== categoriaId ||
    evento.subtipo_id !== subtipoId ||
    !isSubtipoLluviasYTemporales(subtipo.nombre)
  ) {
    return null;
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  const { data: permiso } = await supabase
    .from("modulo_permisos")
    .select("puede_editar")
    .eq("rol", perfil?.rol ?? "")
    .eq("modulo", "trabajos")
    .maybeSingle();

  const [
    { data: trabajosRaw },
    { data: recintosRaw },
    { data: proveedoresRaw },
  ] = await Promise.all([
    supabase
      .from("trabajos")
      .select(
        `
        id,
        titulo,
        descripcion,
        plan_accion,
        problemas,
        estado,
        gravedad,
        ejecutado_por,
        proveedor_id,
        proveedor_texto_legado,
        valor_reparacion,
        valor_total_cotizacion,
        numero_cotizacion,
        horas_maestros_bodetek,
        codigo_filtracion,
        created_by,
        fecha_termino,
        created_at,
        fecha_inicio,
        fecha_entrega_estimada,
        recinto_id,
        categoria_id,
        subtipo_id,
        evento_id,
        recintos ( id, codigo, nombre, arrendatario_actual ),
        proveedores ( id, nombre_empresa ),
        creador:perfiles!trabajos_created_by_fkey ( id, nombre )
      `,
      )
      .eq("evento_id", eventoId)
      .order("created_at", { ascending: false }),
    supabase
      .from("recintos")
      .select("id, codigo, nombre, arrendatario_actual")
      .order("codigo", { ascending: true }),
    supabase
      .from("proveedores")
      .select("id, nombre_empresa")
      .order("nombre_empresa", { ascending: true }),
  ]);

  const trabajoIds = (trabajosRaw ?? []).map((row) => row.id);
  const mediaByTrabajo = new Map<string, EmergenciaListadoMedia>();

  if (trabajoIds.length > 0) {
    const { data: mediaRaw } = await supabase
      .from("trabajo_media")
      .select(
        "id, trabajo_id, tipo, tipo_archivo, url, thumbnail_key, nombre_archivo, created_at, proveedor_id, problema_tipo, proveedores ( id, nombre_empresa )",
      )
      .in("trabajo_id", trabajoIds)
      .in("tipo", [
        "antes",
        "despues",
        "plano_filtraciones",
        "plano_agua",
        "plano_reparacion",
        "cotizacion",
      ])
      .order("created_at", { ascending: true });

    for (const m of mediaRaw ?? []) {
      if (!m.trabajo_id || !m.tipo) continue;
      const bucket = mediaByTrabajo.get(m.trabajo_id) ?? emptyMedia();
      const prov = one(
        m.proveedores as Relacion<{ id: string; nombre_empresa: string }>,
      );
      const thumbKey = m.thumbnail_key ?? null;
      const item: TrabajoMediaItem = {
        id: m.id,
        tipo: m.tipo as TrabajoMediaTipo,
        tipo_archivo: m.tipo_archivo as TrabajoMediaTipoArchivo,
        url: m.url,
        publicUrl: construirUrlPublica(m.url),
        thumbnail_key: thumbKey,
        thumbnailPublicUrl: thumbnailPublicUrl(thumbKey),
        nombre_archivo: m.nombre_archivo,
        created_at: m.created_at,
        proveedor_id: m.proveedor_id ?? null,
        proveedor_nombre: prov?.nombre_empresa ?? null,
        problema_tipo: (m as { problema_tipo?: string | null }).problema_tipo ?? null,
      };
      if (m.tipo === "antes") bucket.antes.push(item);
      else if (m.tipo === "despues") bucket.despues.push(item);
      else if (m.tipo === "plano_agua" || m.tipo === "plano_filtraciones")
        bucket.plano_agua.push(item);
      else if (m.tipo === "plano_reparacion") bucket.plano_reparacion.push(item);
      else if (m.tipo === "cotizacion") bucket.cotizacion.push(item);
      mediaByTrabajo.set(m.trabajo_id, bucket);
    }
  }

  const emergencias: EmergenciaConMedia[] = (trabajosRaw ?? []).map((row) => {
    const recinto = one(
      row.recintos as Relacion<{
        id: string;
        codigo: string;
        nombre: string;
        arrendatario_actual: string | null;
      }>,
    );
    const proveedor = one(
      row.proveedores as Relacion<{ id: string; nombre_empresa: string }>,
    );
    const creador = one(
      row.creador as Relacion<{ id: string; nombre: string }>,
    );
    return {
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      plan_accion: row.plan_accion,
      problemas: row.problemas ?? null,
      estado: row.estado,
      gravedad: row.gravedad,
      ejecutado_por: row.ejecutado_por,
      proveedor_id: row.proveedor_id ?? null,
      proveedor_nombre: proveedor?.nombre_empresa ?? null,
      proveedor_texto_legado: row.proveedor_texto_legado ?? null,
      valor_reparacion:
        row.valor_reparacion == null
          ? null
          : parseMonto(row.valor_reparacion as string | number),
      valor_total_cotizacion:
        row.valor_total_cotizacion == null
          ? null
          : parseMonto(row.valor_total_cotizacion as string | number),
      numero_cotizacion: row.numero_cotizacion ?? null,
      horas_maestros_bodetek:
        row.horas_maestros_bodetek == null
          ? null
          : Number(row.horas_maestros_bodetek),
      codigo_filtracion: row.codigo_filtracion ?? null,
      created_by: row.created_by ?? null,
      created_by_nombre: creador?.nombre ?? null,
      created_at: row.created_at,
      fecha_inicio: row.fecha_inicio,
      fecha_entrega_estimada: row.fecha_entrega_estimada ?? null,
      fecha_termino: row.fecha_termino ?? null,
      recinto_id: row.recinto_id,
      recinto_codigo: recinto?.codigo ?? null,
      recinto_nombre: recinto?.nombre ?? null,
      recinto_arrendatario: recinto?.arrendatario_actual ?? null,
      categoria_id: row.categoria_id,
      subtipo_id: row.subtipo_id,
      evento_id: row.evento_id,
      media: mediaByTrabajo.get(row.id) ?? emptyMedia(),
    };
  });

  const recintos: RecintoOption[] = (recintosRaw ?? []).map((r) => ({
    id: r.id,
    codigo: r.codigo,
    nombre: r.nombre,
    arrendatario_actual: r.arrendatario_actual ?? null,
  }));

  const proveedores: ProveedorOption[] = (proveedoresRaw ?? []).map((p) => ({
    id: p.id,
    nombre_empresa: p.nombre_empresa,
  }));

  return {
    categoriaId,
    subtipoId,
    eventoId: evento.id,
    eventoNombre: evento.nombre,
    emergencias,
    recintos,
    proveedores,
    puedeEditar: permiso?.puede_editar === true,
  };
}
