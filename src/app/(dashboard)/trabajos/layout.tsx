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

  const [{ data: categoriasRaw }, { data: subtiposRaw }] = await Promise.all([
    supabase
      .from("trabajo_categorias")
      .select("id, nombre")
      .order("nombre", { ascending: true }),
    supabase
      .from("trabajo_subtipos")
      .select("id, nombre, categoria_id")
      .order("nombre", { ascending: true }),
  ]);

  const categorias: CategoriaNav[] = sortCategoriasConOtrosAlFinal(
    (categoriasRaw ?? []).map((c) => ({
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
