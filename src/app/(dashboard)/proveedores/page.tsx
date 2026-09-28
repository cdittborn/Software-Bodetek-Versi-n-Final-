import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getPerfil } from "@/lib/supabase/sesion";
import { ProveedoresListado } from "@/components/proveedores/ProveedoresListado";
import type { Proveedor } from "@/lib/proveedores";

export default async function ProveedoresPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) redirect("/login");

  const perfil = await getPerfil(user.id);

  if (!perfil?.rol) redirect("/login");

  const [{ data: permiso }, { data: rows, error }, { data: rubrosRaw }] =
    await Promise.all([
      supabase
        .from("modulo_permisos")
        .select("puede_ver, puede_editar")
        .eq("rol", perfil.rol)
        .eq("modulo", "proveedores")
        .maybeSingle(),
      supabase
        .from("proveedores")
        .select(
          "id, nombre_empresa, nombre_contacto, celular, email, presente_antofagasta, created_at",
        )
        .order("nombre_empresa", { ascending: true }),
      supabase.from("proveedor_rubros").select("proveedor_id, rubro"),
    ]);

  if (!permiso?.puede_ver) redirect("/trabajos");

  const rubrosPorId = new Map<string, string[]>();
  for (const r of rubrosRaw ?? []) {
    const list = rubrosPorId.get(r.proveedor_id) ?? [];
    list.push(r.rubro);
    rubrosPorId.set(r.proveedor_id, list);
  }

  const proveedores = ((rows ?? []) as Proveedor[]).map((p) => ({
    ...p,
    rubros: rubrosPorId.get(p.id) ?? [],
  }));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      {error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : (
        <ProveedoresListado
          proveedores={proveedores}
          puedeEditar={permiso.puede_editar === true}
        />
      )}
    </main>
  );
}
