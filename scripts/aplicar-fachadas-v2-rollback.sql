-- Deshace el plano de Fachadas v2 y el seed.
-- Restaura la fachada 95c58c33… (nombre, medidas, sin recinto) y borra las 68 nuevas.
-- Conserva sus 10 archivos y su intervención. UNA sesión: BEGIN → COMMIT.
-- No ejecutar salvo OK explícito, y solo junto con la pantalla anterior.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

\ir ../supabase/rollback/20261008120000_fachadas_v2_plano_down.sql

COMMIT;

notify pgrst, 'reload schema';
