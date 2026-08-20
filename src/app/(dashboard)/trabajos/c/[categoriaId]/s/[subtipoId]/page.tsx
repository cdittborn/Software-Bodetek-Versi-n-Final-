import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventosListado } from "@/components/emergencias/EventosListado";
import { ProyectosPatentesListado } from "@/components/patentes/ProyectosPatentesListado";
import { TechosListado } from "@/components/techos/TechosListado";
import {
  isSubtipoClientesPatentes,
  isSubtipoLluviasYTemporales,
  isSubtipoRecepcionObras,
  isSubtipoRevisionesMantenciones,
  type EventoListado,
  type ProyectoPatenteListado,
  type RecintoOption,
  type TechoListado,
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

  if (isSubtipoRevisionesMantenciones(subtipo.nombre)) {
    const { data: techosRaw } = await supabase
      .from("trabajos")
      .select(
        `
        id,
        titulo,
        descripcion,
        materiales,
        plan_accion,
        estado,
        created_at,
        periodicidad_dias,
        fecha_ultima_revision,
        proxima_mantencion,
        categoria_id,
        subtipo_id
      `,
      )
      .eq("categoria_id", categoriaId)
      .eq("subtipo_id", subtipoId)
      .order("titulo", { ascending: true });

    const techos: TechoListado[] = (techosRaw ?? []).map((row) => ({
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      materiales: row.materiales,
      plan_accion: row.plan_accion,
      estado: row.estado,
      created_at: row.created_at,
      periodicidad_dias: row.periodicidad_dias,
      fecha_ultima_revision: row.fecha_ultima_revision,
      proxima_mantencion: row.proxima_mantencion,
      categoria_id: row.categoria_id,
      subtipo_id: row.subtipo_id,
    }));

    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <TechosListado
          techos={techos}
          categoriaId={categoriaId}
          subtipoId={subtipoId}
          puedeEditar={puedeEditar}
        />
      </main>
    );
  }

  if (isSubtipoClientesPatentes(subtipo.nombre) || isSubtipoRecepcionObras(subtipo.nombre)) {
    const [{ data: proyectosRaw }, { data: recintosRaw }] = await Promise.all([
      supabase
        .from("trabajos")
        .select(
          `
          id,
          titulo,
          descripcion,
          estado,
          created_at,
          fecha_termino,
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
        .order("codigo"),
    ]);

    const proyectos: ProyectoPatenteListado[] = (proyectosRaw ?? []).map((row) => {
      const recinto = one(
        row.recintos as Relacion<{ id: string; codigo: string; nombre: string }>,
      );
      return {
        id: row.id,
        titulo: row.titulo,
        descripcion: row.descripcion,
        estado: row.estado,
        created_at: row.created_at,
        fecha_termino: row.fecha_termino,
        recinto_id: row.recinto_id,
        recinto_codigo: recinto?.codigo ?? null,
        recinto_nombre: recinto?.nombre ?? null,
        categoria_id: row.categoria_id,
        subtipo_id: row.subtipo_id,
      };
    });

    const esRecepcion = isSubtipoRecepcionObras(subtipo.nombre);

    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <ProyectosPatentesListado
          variante={esRecepcion ? "recepcion" : "clientes"}
          titulo={subtipo.nombre}
          subtitulo={
            esRecepcion
              ? "Proyectos de recepción de obras: descripción, acciones, presupuesto y pagos"
              : "Cada cliente en proceso es un proyecto. Adjunta documentos, patente provisoria y acciones."
          }
          proyectos={proyectos}
          recintos={(recintosRaw ?? []) as RecintoOption[]}
          categoriaId={categoriaId}
          subtipoId={subtipoId}
          puedeEditar={puedeEditar}
        />
      </main>
    );
  }

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

  const { data: eventosRaw } = await supabase
    .from("eventos")
    .select("id, nombre, fecha, created_at")
    .eq("subtipo_id", subtipoId)
    .order("fecha", { ascending: false });

  const eventoIds = (eventosRaw ?? []).map((e) => e.id);
  const counts = new Map<string, number>();
  if (eventoIds.length > 0) {
    const { data: proyectos } = await supabase
      .from("trabajos")
      .select("evento_id")
      .in("evento_id", eventoIds);
    for (const p of proyectos ?? []) {
      if (!p.evento_id) continue;
      counts.set(p.evento_id, (counts.get(p.evento_id) ?? 0) + 1);
    }
  }

  const eventos: EventoListado[] = (eventosRaw ?? []).map((e) => ({
    id: e.id,
    nombre: e.nombre,
    fecha: e.fecha,
    created_at: e.created_at,
    proyectos_count: counts.get(e.id) ?? 0,
  }));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <EventosListado
        eventos={eventos}
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        puedeEditar={puedeEditar}
      />
    </main>
  );
}
