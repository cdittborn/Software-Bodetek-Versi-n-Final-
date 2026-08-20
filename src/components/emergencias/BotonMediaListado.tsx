"use client";

import { useState, type ReactNode } from "react";
import { MediaPreviewDialog } from "@/components/emergencias/MediaPreviewDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TrabajoMediaItem } from "@/lib/trabajos";

type BotonMediaListadoProps = {
  label: string;
  icon: ReactNode;
  items: TrabajoMediaItem[];
  className?: string;
};

export function BotonMediaListado({
  label,
  icon,
  items,
  className,
}: BotonMediaListadoProps) {
  const [open, setOpen] = useState(false);
  const count = items.length;
  const disabled = count === 0;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        title={disabled ? `${label}: sin archivos` : `${label} (${count})`}
        aria-label={`${label}${disabled ? ", sin archivos" : `, ${count}`}`}
        className={cn(
          "h-8 gap-1 px-2 text-xs",
          disabled && "opacity-50",
          className,
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setOpen(true);
        }}
      >
        {icon}
        <span className="tabular-nums">{count}</span>
      </Button>
      <MediaPreviewDialog
        open={open}
        onOpenChange={setOpen}
        titulo={label}
        items={items}
      />
    </>
  );
}
