import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  DashboardEvento,
  type DashboardEventoStats,
} from "@/components/emergencias/DashboardEvento";
import {
  ESTADOS_LLUVIAS,
  GRAVEDADES_LLUVIAS,
  isEstadoLluvias,
  isGravedadLluvias,
  isSubtipoLluviasYTemporales,
  type EmergenciaListado,
  type EstadoLluvias,
  type GravedadLluvias,
} from "@/lib/trabajos";

type Relacion<T> = T | T[] | null;

function one<T>(value: Relacion<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type PageProps = {
  params: Promise<{ categoriaId: string; subtipoId: string; eventoId: string }>;
};

export default async function EventoDashboardPage({ params }: PageProps) {
  const { categoriaId, subtipoId, eventoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: subtipo }, { data: evento }] = await Promise.all([
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
    !subtipo ||
    !evento ||
    subtipo.categoria_id !== categoriaId ||
    evento.subtipo_id !== subtipoId ||
    !isSubtipoLluviasYTemporales(subtipo.nombre)
  ) {
    notFound();
  }

  const { data: trabajosRaw } = await supabase
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
      recinto_id,
      categoria_id,
      subtipo_id,
      evento_id,
      recintos ( id, codigo, nombre, arrendatario_actual )
    `,
    )
    .eq("evento_id", eventoId);

  const proyectos: EmergenciaListado[] = (trabajosRaw ?? []).map((row) => {
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
      valor_reparacion: null,
      created_at: row.created_at,
      fecha_inicio: row.fecha_inicio,
      recinto_id: row.recinto_id,
      recinto_codigo: recinto?.codigo ?? null,
      recinto_nombre: recinto?.nombre ?? null,
      recinto_arrendatario: recinto?.arrendatario_actual ?? null,
      categoria_id: row.categoria_id,
      subtipo_id: row.subtipo_id,
      evento_id: row.evento_id,
    };
  });

  const ids = proyectos.map((p) => p.id);
  const conCotizacion = new Set<string>();
  if (ids.length > 0) {
    const { data: cotizaciones } = await supabase
      .from("trabajo_media")
      .select("trabajo_id")
      .eq("tipo", "cotizacion")
      .in("trabajo_id", ids);
    for (const c of cotizaciones ?? []) {
      if (c.trabajo_id) conCotizacion.add(c.trabajo_id);
    }
  }

  const porEstado = Object.fromEntries(
    ESTADOS_LLUVIAS.map((e) => [e, 0]),
  ) as Record<EstadoLluvias, number>;
  const porGravedad = Object.fromEntries(
    GRAVEDADES_LLUVIAS.map((g) => [g, 0]),
  ) as Record<GravedadLluvias, number>;

  let conPlanAccion = 0;
  for (const p of proyectos) {
    if (isEstadoLluvias(p.estado)) porEstado[p.estado] += 1;
    if (p.gravedad && isGravedadLluvias(p.gravedad)) {
      porGravedad[p.gravedad] += 1;
    }
    if (p.plan_accion?.trim()) conPlanAccion += 1;
  }

  const stats: DashboardEventoStats = {
    total: proyectos.length,
    porEstado,
    conPlanAccion,
    conCotizacion: conCotizacion.size,
    porGravedad,
    criticos: proyectos.filter((p) => p.gravedad === "critico"),
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <DashboardEvento
        eventoNombre={evento.nombre}
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        eventoId={eventoId}
        stats={stats}
      />
    </main>
  );
}
