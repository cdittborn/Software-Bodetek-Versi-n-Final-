import { NavPrincipal } from "@/components/shared/NavPrincipal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <NavPrincipal />
      <div className="flex min-h-0 flex-1">{children}</div>
    </div>
  );
}
