import { Suspense } from "react";
import { IndicadorNavegacion } from "@/components/shared/IndicadorNavegacion";
import { MenuLateral } from "@/components/shared/menu/MenuLateral";
import { MenuEsqueleto } from "@/components/shared/PaginaEsqueleto";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background min-[760px]:flex-row">
      <IndicadorNavegacion />
      <Suspense fallback={<MenuEsqueleto />}>
        <MenuLateral />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
