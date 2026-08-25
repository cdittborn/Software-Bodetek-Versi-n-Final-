"use client";

import { Button } from "@/components/ui/button";

type FiltracionFormFooterProps = {
  onCancel: () => void;
  saving?: boolean;
  isEdit?: boolean;
};

export function FiltracionFormFooter({
  onCancel,
  saving = false,
  isEdit = false,
}: FiltracionFormFooterProps) {
  return (
    <>
      <footer className="hidden shrink-0 items-center justify-end gap-2 border-t border-[#e4e4e7] bg-[#fbfbfb] px-6 py-4 md:flex">
        <Button type="button" variant="outline" className="min-h-[44px]" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="min-h-[44px] bg-[#c8102e] text-white hover:bg-[#a80d26]"
        >
          {saving ? "Guardando…" : isEdit ? "Guardar" : "Crear filtración"}
        </Button>
      </footer>

      <div className="sticky bottom-0 border-t border-[#e4e4e7] bg-white p-4 md:hidden">
        <Button
          type="submit"
          disabled={saving}
          className="h-11 min-h-[44px] w-full bg-[#c8102e] text-base font-semibold text-white hover:bg-[#a80d26]"
        >
          {saving ? "Guardando…" : "Guardar reporte"}
        </Button>
      </div>
    </>
  );
}
