import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { construirUrlPublica } from "@/lib/r2/utils";
import { DetalleEmergencia } from "@/components/emergencias/DetalleEmergencia";
import type {
  EmergenciaListado,
  RecintoOption,
  TrabajoMediaItem,
} from "@/lib/trabajos";

type Relacion<T> = T | T[] | null;

function one<T>(value: Relacion<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type PageProps = {
  params: Promise<{ categoriaId: string; subtipoId: string; trabajoId: string }>;
};

export default async function DetalleEmergenciaPage({ params }: PageProps) {
  const { categoriaId, subtipoId, trabajoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: row } = await supabase
    .from("trabajos")
    .select(
      `
      id,
      titulo,
      descripcion,
      plan_accion,
      estado,
      created_at,
      fecha_inicio,
      recinto_id,
      categoria_id,
      subtipo_id,
      recintos ( id, codigo, nombre )
    `,
    )
    .eq("id", trabajoId)
    .maybeSingle();

  if (
    !row ||
    row.categoria_id !== categoriaId ||
    row.subtipo_id !== subtipoId
  ) {
    notFound();
  }

  const recinto = one(
    row.recintos as Relacion<{ id: string; codigo: string; nombre: string }>,
  );

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

  const [{ data: recintosRaw }, { data: mediaRaw }] = await Promise.all([
    supabase
      .from("recintos")
      .select("id, codigo, nombre, arrendatario_actual")
      .order("codigo"),
    supabase
      .from("trabajo_media")
      .select("id, tipo, tipo_archivo, url, created_at")
      .eq("trabajo_id", trabajoId)
      .order("created_at", { ascending: true }),
  ]);

  const emergencia: EmergenciaListado = {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    plan_accion: row.plan_accion,
    estado: row.estado,
    created_at: row.created_at,
    fecha_inicio: row.fecha_inicio,
    recinto_id: row.recinto_id,
    recinto_codigo: recinto?.codigo ?? null,
    recinto_nombre: recinto?.nombre ?? null,
    categoria_id: row.categoria_id,
    subtipo_id: row.subtipo_id,
  };

  const media: TrabajoMediaItem[] = (mediaRaw ?? []).map((m) => ({
    id: m.id,
    tipo: m.tipo as "antes" | "despues",
    tipo_archivo: m.tipo_archivo as "foto" | "video",
    url: m.url,
    publicUrl: construirUrlPublica(m.url),
    created_at: m.created_at,
  }));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <DetalleEmergencia
        emergencia={emergencia}
        recintos={(recintosRaw ?? []) as RecintoOption[]}
        mediaAntes={media.filter((m) => m.tipo === "antes")}
        mediaDespues={media.filter((m) => m.tipo === "despues")}
        puedeEditar={permiso?.puede_editar === true}
      />
    </main>
  );
}
