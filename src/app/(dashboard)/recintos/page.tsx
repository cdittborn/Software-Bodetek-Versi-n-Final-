import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { construirUrlPublica } from "@/lib/r2/utils";
import { RecintosTabla } from "@/components/recintos/RecintosTabla";
import { PlanoMapa } from "@/components/recintos/PlanoMapa";
import { buttonVariants } from "@/components/ui/button";
import {
  etiquetasDesdePosiciones,
  type RecintoListado,
} from "@/lib/recintos";

export default async function RecintosPage() {
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

  if (!perfil || !["admin", "pablo", "asistente"].includes(perfil.rol)) {
    redirect("/trabajos");
  }

  const puedeEditar = perfil.rol === "admin" || perfil.rol === "pablo";

  const [{ data, error }, { data: planoRow }] = await Promise.all([
    supabase
      .from("recintos")
      .select(
        "id, codigo, nombre, tipo, sitio, galpon, arrendatario_actual, superficie_m2, superficie_1er_piso, superficie_2o_piso",
      )
      .order("sitio", { ascending: true })
      .order("codigo", { ascending: true }),
    supabase
      .from("planos")
      .select("id, nombre, imagen_key")
      .eq("activo", true)
      .maybeSingle(),
  ]);

  const recintos = (data ?? []) as RecintoListado[];

  let etiquetas: ReturnType<typeof etiquetasDesdePosiciones> = [];
  let imagenUrl: string | null = null;

  if (planoRow) {
    imagenUrl = construirUrlPublica(planoRow.imagen_key);
    const { data: posiciones } = await supabase
      .from("recinto_posiciones_plano")
      .select(
        "id, recinto_id, x_pct, y_pct, recintos ( id, codigo, sitio, galpon, arrendatario_actual )",
      )
      .eq("plano_id", planoRow.id);

    etiquetas = etiquetasDesdePosiciones(posiciones ?? []);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recintos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bodegas y locales por sitio
          </p>
        </div>
        {puedeEditar ? (
          <Link
            href="/recintos/plano"
            className={buttonVariants({ variant: "outline" })}
          >
            Editar plano
          </Link>
        ) : null}
      </div>

      {imagenUrl ? (
        <PlanoMapa imagenUrl={imagenUrl} etiquetas={etiquetas} />
      ) : puedeEditar ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Todavía no hay plano. Súbelo en{" "}
          <Link href="/recintos/plano" className="underline">
            Editar plano
          </Link>
          .
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : (
        <RecintosTabla recintos={recintos} />
      )}
    </main>
  );
}
