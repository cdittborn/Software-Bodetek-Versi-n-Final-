import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { construirUrlPublica } from "@/lib/r2/utils";
import { EmergenciasListado } from "@/components/emergencias/EmergenciasListado";
import {
  isSubtipoLluviasYTemporales,
  parseMonto,
  type EmergenciaConMedia,
  type EmergenciaListadoMedia,
  type RecintoOption,
  type TrabajoMediaItem,
  type TrabajoMediaTipo,
  type TrabajoMediaTipoArchivo,
} from "@/lib/trabajos";

type Relacion<T> = T | T[] | null;

function one<T>(value: Relacion<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function emptyMedia(): EmergenciaListadoMedia {
  return {
    antes: [],
    despues: [],
    plano_filtraciones: [],
    cotizacion: [],
  };
}

type PageProps = {
  params: Promise<{ categoriaId: string; subtipoId: string; eventoId: string }>;
};

export default async function EventoProyectosPage({ params }: PageProps) {
  const { categoriaId, subtipoId, eventoId } = await params;
  const supabase = await createClient();
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
    notFound();
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

  const [{ data: trabajosRaw }, { data: recintosRaw }] = await Promise.all([
    supabase
      .from("trabajos")
      .select(
        `
        id,
        titulo,
        descripcion,
        plan_accion,
        estado,
        gravedad,
        ejecutado_por,
        proveedor,
        valor_reparacion,
        created_at,
        fecha_inicio,
        fecha_entrega_estimada,
        recinto_id,
        categoria_id,
        subtipo_id,
        evento_id,
        recintos ( id, codigo, nombre, arrendatario_actual )
      `,
      )
      .eq("evento_id", eventoId)
      .order("created_at", { ascending: false }),
    supabase
      .from("recintos")
      .select("id, codigo, nombre, arrendatario_actual")
      .order("codigo", { ascending: true }),
  ]);

  const trabajoIds = (trabajosRaw ?? []).map((row) => row.id);
  const mediaByTrabajo = new Map<string, EmergenciaListadoMedia>();

  if (trabajoIds.length > 0) {
    const { data: mediaRaw } = await supabase
      .from("trabajo_media")
      .select("id, trabajo_id, tipo, tipo_archivo, url, nombre_archivo, created_at")
      .in("trabajo_id", trabajoIds)
      .in("tipo", ["antes", "despues", "plano_filtraciones", "cotizacion"])
      .order("created_at", { ascending: true });

    for (const m of mediaRaw ?? []) {
      if (!m.trabajo_id || !m.tipo) continue;
      const bucket = mediaByTrabajo.get(m.trabajo_id) ?? emptyMedia();
      const item: TrabajoMediaItem = {
        id: m.id,
        tipo: m.tipo as TrabajoMediaTipo,
        tipo_archivo: m.tipo_archivo as TrabajoMediaTipoArchivo,
        url: m.url,
        publicUrl: construirUrlPublica(m.url),
        nombre_archivo: m.nombre_archivo,
        created_at: m.created_at,
      };
      if (m.tipo === "antes") bucket.antes.push(item);
      else if (m.tipo === "despues") bucket.despues.push(item);
      else if (m.tipo === "plano_filtraciones")
        bucket.plano_filtraciones.push(item);
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
    return {
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      plan_accion: row.plan_accion,
      estado: row.estado,
      gravedad: row.gravedad,
      ejecutado_por: row.ejecutado_por,
      proveedor: row.proveedor,
      valor_reparacion:
        row.valor_reparacion == null
          ? null
          : parseMonto(row.valor_reparacion as string | number),
      created_at: row.created_at,
      fecha_inicio: row.fecha_inicio,
      fecha_entrega_estimada: row.fecha_entrega_estimada ?? null,
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

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-10">
      <EmergenciasListado
        emergencias={emergencias}
        recintos={recintos}
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        eventoId={evento.id}
        eventoNombre={evento.nombre}
        puedeEditar={permiso?.puede_editar === true}
      />
    </main>
  );
}
