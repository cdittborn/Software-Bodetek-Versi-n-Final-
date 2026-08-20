import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TrabajosListado } from "@/components/trabajos/TrabajosListado";
import type {
  CategoriaOption,
  PerfilOption,
  RecintoOption,
  SubtipoOption,
  TrabajoListado,
} from "@/lib/trabajos";

type Relacion<T> = T | T[] | null;

function one<T>(value: Relacion<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type TrabajoRow = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  fecha_inicio: string | null;
  fecha_termino: string | null;
  periodicidad_dias: number | null;
  proxima_mantencion: string | null;
  created_at: string;
  categoria_id: string | null;
  subtipo_id: string | null;
  recinto_id: string | null;
  responsable: string | null;
  trabajo_categorias: Relacion<{ id: string; nombre: string }>;
  trabajo_subtipos: Relacion<{ id: string; nombre: string }>;
  recintos: Relacion<{ id: string; codigo: string; nombre: string }>;
  responsable_perfil: Relacion<{ id: string; nombre: string | null }>;
};

export default async function TrabajosTodosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil?.rol) {
    redirect("/login");
  }

  const { data: permiso } = await supabase
    .from("modulo_permisos")
    .select("puede_editar")
    .eq("rol", perfil.rol)
    .eq("modulo", "trabajos")
    .maybeSingle();

  const puedeEditar = permiso?.puede_editar === true;

  const [
    { data: trabajosRaw, error: trabajosError },
    { data: categoriasRaw },
    { data: subtiposRaw },
    { data: recintosRaw },
    { data: perfilesRaw },
  ] = await Promise.all([
    supabase
      .from("trabajos")
      .select(
        `
          id,
          titulo,
          descripcion,
          estado,
          fecha_inicio,
          fecha_termino,
          periodicidad_dias,
          proxima_mantencion,
          created_at,
          categoria_id,
          subtipo_id,
          recinto_id,
          responsable,
          trabajo_categorias ( id, nombre ),
          trabajo_subtipos ( id, nombre ),
          recintos ( id, codigo, nombre ),
          responsable_perfil:perfiles!trabajos_responsable_fkey ( id, nombre )
        `,
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("trabajo_categorias")
      .select("id, nombre")
      .order("nombre", { ascending: true }),
    supabase
      .from("trabajo_subtipos")
      .select("id, nombre, categoria_id")
      .order("nombre", { ascending: true }),
    supabase
      .from("recintos")
      .select("id, codigo, nombre, arrendatario_actual")
      .order("codigo", { ascending: true }),
    supabase
      .from("perfiles")
      .select("id, nombre")
      .order("nombre", { ascending: true }),
  ]);

  const trabajos: TrabajoListado[] = ((trabajosRaw ?? []) as TrabajoRow[]).map(
    (row) => {
      const categoria = one(row.trabajo_categorias);
      const subtipo = one(row.trabajo_subtipos);
      const recinto = one(row.recintos);
      const responsable = one(row.responsable_perfil);

      return {
        id: row.id,
        titulo: row.titulo,
        descripcion: row.descripcion,
        estado: row.estado,
        fecha_inicio: row.fecha_inicio,
        fecha_termino: row.fecha_termino,
        periodicidad_dias: row.periodicidad_dias,
        proxima_mantencion: row.proxima_mantencion,
        created_at: row.created_at,
        categoria_id: row.categoria_id,
        categoria_nombre: categoria?.nombre ?? null,
        subtipo_id: row.subtipo_id,
        subtipo_nombre: subtipo?.nombre ?? null,
        recinto_id: row.recinto_id,
        recinto_codigo: recinto?.codigo ?? null,
        responsable_id: row.responsable,
        responsable_nombre: responsable?.nombre ?? null,
      };
    },
  );

  const categorias: CategoriaOption[] = (categoriasRaw ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
  }));

  const subtipos: SubtipoOption[] = (subtiposRaw ?? []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    categoria_id: s.categoria_id,
  }));

  const recintos: RecintoOption[] = (recintosRaw ?? []).map((r) => ({
    id: r.id,
    codigo: r.codigo,
    nombre: r.nombre,
    arrendatario_actual: r.arrendatario_actual ?? null,
  }));

  const perfiles: PerfilOption[] = (perfilesRaw ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
  }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vista general</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Listado de todos los trabajos de todas las categorías.
        </p>
      </div>

      {trabajosError ? (
        <p className="text-sm text-destructive">{trabajosError.message}</p>
      ) : (
        <TrabajosListado
          trabajos={trabajos}
          categorias={categorias}
          subtipos={subtipos}
          recintos={recintos}
          perfiles={perfiles}
          puedeEditar={puedeEditar}
        />
      )}
    </main>
  );
}
