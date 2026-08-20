import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import {
  SUBTIPO_LLUVIAS_Y_TEMPORALES,
  eventoHref,
  subtipoHref,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

export default async function TrabajosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subtipo } = await supabase
    .from("trabajo_subtipos")
    .select("id, categoria_id, nombre")
    .eq("nombre", SUBTIPO_LLUVIAS_Y_TEMPORALES)
    .maybeSingle();

  if (!subtipo) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Trabajos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No se encontró el subtipo Lluvias y temporales.
        </p>
        <Link
          href="/trabajos/todos"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}
        >
          Vista general
        </Link>
      </main>
    );
  }

  const { data: evento } = await supabase
    .from("eventos")
    .select("id, nombre, fecha, subtipo_id")
    .eq("subtipo_id", subtipo.id)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (evento) {
    redirect(eventoHref(subtipo.categoria_id, subtipo.id, evento.id));
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Trabajos</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Todavía no hay eventos de Lluvias y temporales. Creá uno desde el
        subtipo o usá la vista general.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={subtipoHref(subtipo.categoria_id, subtipo.id)}
          className={cn(buttonVariants())}
        >
          Ir a Lluvias y temporales
        </Link>
        <Link
          href="/trabajos/todos"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Vista general
        </Link>
      </div>
    </main>
  );
}
