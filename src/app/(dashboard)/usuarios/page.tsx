import { redirect } from "next/navigation";
import { FormCrearUsuario } from "@/components/usuarios/FormCrearUsuario";
import { PantallaUsuarios } from "@/components/usuarios/PantallaUsuarios";
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

  const { personas, categorias, puedeGuardar } = await cargarPantallaUsuarios(supabase);

  return (
    <PantallaUsuarios
      personas={personas}
      categorias={categorias}
      puedeGuardar={puedeGuardar}
      crearUsuario={<FormCrearUsuario />}
    />
  );
}
