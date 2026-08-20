import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { construirUrlPublica } from "@/lib/r2/utils";
import { RecintoArchivosUploader } from "@/components/recintos/RecintoArchivosUploader";
import { etiquetaCodigoRecinto } from "@/lib/recintos";
import type { RecintoDocumento, RecintoPlanoArchivo } from "@/lib/recintos";

type PageProps = {
  params: Promise<{ recintoId: string }>;
};

export default async function DetalleRecintoPage({ params }: PageProps) {
  const { recintoId } = await params;
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

  const { data: recinto } = await supabase
    .from("recintos")
    .select(
      "id, codigo, nombre, tipo, sitio, galpon, arrendatario_actual, superficie_m2, superficie_1er_piso, superficie_2o_piso",
    )
    .eq("id", recintoId)
    .maybeSingle();

  if (!recinto) notFound();

  const [{ data: docsRaw }, { data: planosRaw }] = await Promise.all([
    supabase
      .from("recinto_documentos")
      .select("id, tipo, nombre_archivo, url, fecha_vencimiento, created_at")
      .eq("recinto_id", recintoId)
      .order("created_at", { ascending: false }),
    supabase
      .from("recinto_planos")
      .select("id, nombre_archivo, url, created_at")
      .eq("recinto_id", recintoId)
      .order("created_at", { ascending: false }),
  ]);

  const documentos: RecintoDocumento[] = (docsRaw ?? []).map((d) => ({
    id: d.id,
    tipo: d.tipo as RecintoDocumento["tipo"],
    nombre_archivo: d.nombre_archivo,
    url: d.url,
    publicUrl: construirUrlPublica(d.url),
    fecha_vencimiento: d.fecha_vencimiento,
    created_at: d.created_at,
  }));

  const planos: RecintoPlanoArchivo[] = (planosRaw ?? []).map((p) => ({
    id: p.id,
    nombre_archivo: p.nombre_archivo,
    url: p.url,
    publicUrl: construirUrlPublica(p.url),
    created_at: p.created_at,
  }));

  const contratos = documentos.filter((d) => d.tipo === "contrato_arriendo");
  const otros = documentos.filter((d) => d.tipo === "otro");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/recintos" className="hover:underline">
            Recintos
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {etiquetaCodigoRecinto(recinto)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {recinto.arrendatario_actual || "Sin arrendatario"} ·{" "}
          {recinto.tipo || "Sin tipo"}
        </p>
      </div>

      <RecintoArchivosUploader
        recintoId={recinto.id}
        tabla="recinto_documentos"
        tipo="contrato_arriendo"
        titulo="Contrato de arriendo"
        descripcion="Adjunta el contrato vigente. Puedes indicar fecha de vencimiento."
        items={contratos}
        puedeEditar={puedeEditar}
        conVencimiento
      />

      <RecintoArchivosUploader
        recintoId={recinto.id}
        tabla="recinto_documentos"
        tipo="otro"
        titulo="Otros documentos"
        descripcion="Modificaciones de contrato, poderes y respaldos relacionados."
        items={otros}
        puedeEditar={puedeEditar}
      />

      <RecintoArchivosUploader
        recintoId={recinto.id}
        tabla="recinto_planos"
        titulo="Planos del recinto"
        descripcion="Planos de esta bodega o local (distintos del plano general del complejo)."
        items={planos}
        puedeEditar={puedeEditar}
      />
    </main>
  );
}
