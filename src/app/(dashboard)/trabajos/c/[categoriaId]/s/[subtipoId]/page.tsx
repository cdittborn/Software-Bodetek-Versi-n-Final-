import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmergenciasListado } from "@/components/emergencias/EmergenciasListado";
import {
  isSubtipoLluviasYTemporales,
  type EmergenciaListado,
  type RecintoOption,
} from "@/lib/trabajos";

type Relacion<T> = T | T[] | null;

function one<T>(value: Relacion<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type PageProps = {
  params: Promise<{ categoriaId: string; subtipoId: string }>;
};

export default async function SubtipoTrabajosPage({ params }: PageProps) {
  const { categoriaId, subtipoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: categoria }, { data: subtipo }] = await Promise.all([
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
  ]);

  if (!categoria || !subtipo || subtipo.categoria_id !== categoriaId) {
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

  const puedeEditar = permiso?.puede_editar === true;

  if (!isSubtipoLluviasYTemporales(subtipo.nombre)) {
    const { count } = await supabase
      .from("trabajos")
      .select("id", { count: "exact", head: true })
      .eq("categoria_id", categoriaId)
      .eq("subtipo_id", subtipoId);

    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{subtipo.nombre}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{categoria.nombre}</p>
        <p className="mt-6 text-sm text-muted-foreground">
          Vista específica pendiente. Hay {count ?? 0} trabajo(s) en este subtipo.
        </p>
      </main>
    );
  }

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
        created_at,
        fecha_inicio,
        recinto_id,
        categoria_id,
        subtipo_id,
        recintos ( id, codigo, nombre )
      `,
      )
      .eq("categoria_id", categoriaId)
      .eq("subtipo_id", subtipoId)
      .order("created_at", { ascending: false }),
    supabase
      .from("recintos")
      .select("id, codigo, nombre, arrendatario_actual")
      .order("codigo", { ascending: true }),
  ]);

  const emergencias: EmergenciaListado[] = (trabajosRaw ?? []).map((row) => {
    const recinto = one(
      row.recintos as Relacion<{ id: string; codigo: string; nombre: string }>,
    );
    return {
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
  });

  const recintos: RecintoOption[] = recintosRaw ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <EmergenciasListado
        emergencias={emergencias}
        recintos={recintos}
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        puedeEditar={puedeEditar}
      />
    </main>
  );
}
