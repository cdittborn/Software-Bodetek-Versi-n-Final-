SELECT c.relname AS tabla, c.relrowsecurity AS rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('compras_materiales', 'compra_material_trabajos')
ORDER BY 1;

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('compras_materiales', 'compra_material_trabajos')
ORDER BY 1, 2;

SELECT count(*)::int AS n_compras FROM public.compras_materiales;
SELECT count(*)::int AS n_asociaciones FROM public.compra_material_trabajos;
