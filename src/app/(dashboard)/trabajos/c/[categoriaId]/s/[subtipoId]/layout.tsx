import { exigirSubtipoVisible } from "@/lib/categorias/acceso";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ categoriaId: string; subtipoId: string }>;
}) {
  const { categoriaId, subtipoId } = await params;
  await exigirSubtipoVisible(categoriaId, subtipoId);
  return children;
}
