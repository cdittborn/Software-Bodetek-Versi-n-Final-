import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProveedoresListado } from "@/components/proveedores/ProveedoresListado";
import type { Proveedor } from "@/lib/proveedores";

export default async function ProveedoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil?.rol) redirect("/login");

  const { data: permiso } = await supabase
    .from("modulo_permisos")
    .select("puede_ver, puede_editar")
    .eq("rol", perfil.rol)
    .eq("modulo", "proveedores")
    .maybeSingle();

  if (!permiso?.puede_ver) redirect("/trabajos");

  const { data: rows, error } = await supabase
    .from("proveedores")
    .select(
      "id, nombre_empresa, nombre_contacto, celular, email, presente_antofagasta, created_at",
    )
    .order("nombre_empresa", { ascending: true });

  const proveedores = (rows ?? []) as Proveedor[];

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
