-- Aplica tablas de compras de materiales en producción.
-- Esperar confirmación humana antes de correr el .sh.

BEGIN;

\ir ../supabase/migrations/20260901233000_compras_materiales.sql

COMMIT;
