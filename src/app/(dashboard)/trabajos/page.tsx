import { redirect } from "next/navigation";
import { MousePointerClick } from "lucide-react";
import { getAuthUser } from "@/lib/supabase/sesion";

export default async function TrabajosPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex w-full flex-1 flex-col px-4 py-6 min-[760px]:px-8 min-[760px]:py-7">
      <header>
        <div className="text-[10.5px] font-bold tracking-[1.3px] text-ink-faint uppercase">
          Trabajos
        </div>
        <h1 className="mt-1 text-[22px] font-semibold text-ink">Trabajos</h1>
        <p className="mt-1 text-[13.5px] text-ink-mute">
          Elige una categoría del menú para ver sus trabajos.
        </p>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <div className="flex size-[52px] items-center justify-center rounded-xl border border-line bg-menu text-ink-faint">
          <MousePointerClick className="size-6" strokeWidth={1.6} aria-hidden />
        </div>
        <div className="mt-4 text-[15px] font-semibold text-ink">Nada seleccionado</div>
        <p className="mt-1 text-[13px] text-ink-mute">
          Abre una categoría del menú de la izquierda para empezar.
        </p>
      </div>
    </main>
  );
}
