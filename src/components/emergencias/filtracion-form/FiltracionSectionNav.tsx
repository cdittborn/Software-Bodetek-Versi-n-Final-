"use client";

import { cn } from "@/lib/utils";

export const SECCIONES_FILTRACION = [
  { id: "sec-01", label: "Ubicación" },
  { id: "sec-02", label: "Diagnóstico" },
  { id: "sec-03", label: "Antes/Después" },
  { id: "sec-04", label: "Planos" },
] as const;

type FiltracionSectionNavProps = {
  activeId?: string;
  onNavigate: (sectionId: string) => void;
};

export function FiltracionSectionNav({
  activeId,
  onNavigate,
}: FiltracionSectionNavProps) {
  const secciones = SECCIONES_FILTRACION;

  return (
    <nav className="shrink-0 border-b border-[#e4e4e7] bg-white px-4 py-2 md:hidden">
      <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {secciones.map((s) => (
          <li key={s.id} className="shrink-0">
            <button
              type="button"
              onClick={() => onNavigate(s.id)}
              className={cn(
                "min-h-[44px] rounded-full border px-3 py-2 text-xs font-medium whitespace-nowrap",
                activeId === s.id
                  ? "border-[#c8102e] bg-[#fdeced] text-[#a4131f]"
                  : "border-[#e4e4e7] bg-[#f4f4f5] text-[#3f3f46]",
              )}
            >
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
