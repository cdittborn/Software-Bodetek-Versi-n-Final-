import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormCrearUsuario } from "@/components/usuarios/FormCrearUsuario";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function UsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: miPerfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  if (!miPerfil || !["admin", "pablo"].includes(miPerfil.rol)) {
    redirect("/trabajos");
  }

  const { data: perfiles, error } = await supabase
    .from("perfiles")
    .select("id, nombre, rol")
    .order("nombre", { ascending: true });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de perfiles y altas en Auth
          </p>
        </div>
        <FormCrearUsuario />
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Columna DB: perfiles.nombre ← metadata nombre_completo */}
                <TableHead>Nombre completo</TableHead>
                <TableHead>Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(perfiles ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">
                    No hay perfiles aún.
                  </TableCell>
                </TableRow>
              ) : (
                (perfiles ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.nombre ?? "—"}</TableCell>
                    <TableCell className="capitalize">{p.rol}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
