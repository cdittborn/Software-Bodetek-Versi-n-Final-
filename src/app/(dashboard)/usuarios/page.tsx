import { redirect } from "next/navigation";
import { PantallaUsuarios } from "@/components/usuarios/PantallaUsuarios";
import { idsConAccesoBloqueado } from "@/lib/categorias/accesosBloqueados";
import { cargarPantallaUsuarios } from "@/lib/categorias/cargarUsuarios";
import { createClient } from "@/lib/supabase/server";

export default async function UsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: miPerfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).maybeSingle();
  if (miPerfil?.rol !== "admin") redirect("/trabajos");

  const [{ personas, categorias, puedeGuardar }, bloqueados] = await Promise.all([
    cargarPantallaUsuarios(supabase),
    idsConAccesoBloqueado(),
  ]);

  return (
    <PantallaUsuarios
      personas={personas.map((persona) => ({
        ...persona,
        accesoBloqueado: bloqueados.has(persona.id),
      }))}
      categorias={categorias}
      puedeGuardar={puedeGuardar}
    />
  );
}
