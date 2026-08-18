import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { construirUrlPublica } from "@/lib/r2/utils";
import { EditorPlanoRecintos } from "@/components/recintos/EditorPlanoRecintos";
import { buttonVariants } from "@/components/ui/button";
import {
  etiquetasDesdePosiciones,
  type RecintoListado,
} from "@/lib/recintos";

export default async function RecintosPlanoPage() {
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

  if (!perfil || !["admin", "pablo"].includes(perfil.rol)) {
    redirect("/recintos");
  }

  const [{ data: recintosRaw }, { data: planoRow }] = await Promise.all([
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

  const recintos = (recintosRaw ?? []) as RecintoListado[];
  let etiquetas: ReturnType<typeof etiquetasDesdePosiciones> = [];

  if (planoRow) {
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
          <h1 className="text-2xl font-semibold tracking-tight">Plano</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sube la imagen y arrastra las etiquetas (arrendatario) sobre cada
            recinto
          </p>
        </div>
        <Link href="/recintos" className={buttonVariants({ variant: "outline" })}>
          Volver
        </Link>
      </div>
      <EditorPlanoRecintos
        plano={
          planoRow
            ? {
                id: planoRow.id,
                nombre: planoRow.nombre,
                imagenUrl: construirUrlPublica(planoRow.imagen_key),
              }
            : null
        }
        etiquetasIniciales={etiquetas}
        recintos={recintos}
      />
    </main>
  );
}
