"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FiltracionFormShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function FiltracionFormShell({
  open,
  onOpenChange,
  children,
}: FiltracionFormShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex max-h-[100dvh] flex-col gap-0 overflow-hidden p-0",
          "fixed inset-0 top-0 left-0 h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 rounded-none border-0 ring-0",
          "md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[92vh] md:w-[1000px] md:max-w-[calc(100%-2rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:border-[#e4e4e7] md:shadow-2xl",
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
