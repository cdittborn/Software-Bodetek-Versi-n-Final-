-- Quita solo las columnas de validación. No toca el resto del informe.
-- UNA sesión: BEGIN → COMMIT. No ejecutar salvo OK explícito.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

alter table public.informe_seguro_recintos
  drop column if exists descripcion_validada,
  drop column if exists validada_at,
  drop column if exists validada_por;

delete from supabase_migrations.schema_migrations
where version = '20261006233000';

COMMIT;
