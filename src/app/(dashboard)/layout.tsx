import { Suspense } from "react";
import { NavPrincipal } from "@/components/shared/NavPrincipal";
import { IndicadorNavegacion } from "@/components/shared/IndicadorNavegacion";
import { NavEsqueleto } from "@/components/shared/PaginaEsqueleto";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <IndicadorNavegacion />
      <Suspense fallback={<NavEsqueleto />}>
        <NavPrincipal />
      </Suspense>
      <div className="flex min-h-0 flex-1">{children}</div>
    </div>
  );
}
