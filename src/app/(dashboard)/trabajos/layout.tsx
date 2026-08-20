import { createClient } from "@/lib/supabase/server";
import { SidebarTrabajos } from "@/components/shared/SidebarTrabajos";
import {
  sortCategoriasConOtrosAlFinal,
  type CategoriaNav,
} from "@/lib/trabajos";

export default async function TrabajosSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: categoriasRaw }, { data: subtiposRaw }] = await Promise.all([
    supabase
      .from("trabajo_categorias")
      .select("id, nombre, owner_id")
      // Orden final lo define sortCategoriasConOtrosAlFinal (Techumbres primero).
      .order("nombre", { ascending: true }),
    supabase
      .from("trabajo_subtipos")
      .select("id, nombre, categoria_id")
      .order("nombre", { ascending: true }),
  ]);

  // RLS ya filtra; respaldo explícito en UI.
  const visibles = (categoriasRaw ?? []).filter((c) => {
    const ownerId = "owner_id" in c ? (c.owner_id as string | null) : null;
    return ownerId == null || ownerId === user?.id;
  });

  const categorias: CategoriaNav[] = sortCategoriasConOtrosAlFinal(
    visibles.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      subtipos: (subtiposRaw ?? []).filter((s) => s.categoria_id === c.id),
    })),
  );

  return (
    <div className="flex min-h-0 flex-1">
      <SidebarTrabajos categorias={categorias} />
      <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
