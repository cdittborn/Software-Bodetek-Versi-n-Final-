-- Ajusta los GRANT después de aplicar 20261006120000.
-- Los privilegios por defecto del esquema dejan ALL en authenticated.
-- UNA sesión: BEGIN → COMMIT. No borra filas.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

revoke all on table public.informes_seguro from public, anon, authenticated;
revoke all on table public.informe_seguro_recintos from public, anon, authenticated;
revoke all on table public.informe_seguro_subproyectos from public, anon, authenticated;
revoke all on table public.informe_seguro_media from public, anon, authenticated;
revoke all on table public.informe_seguro_versiones from public, anon, authenticated;

grant select, insert, update, delete on table public.informes_seguro to authenticated;
grant select, insert, update, delete on table public.informe_seguro_recintos to authenticated;
grant select, insert, update, delete on table public.informe_seguro_subproyectos to authenticated;
grant select, insert, update, delete on table public.informe_seguro_media to authenticated;
grant select, insert, delete on table public.informe_seguro_versiones to authenticated;

grant all on table public.informes_seguro to service_role;
grant all on table public.informe_seguro_recintos to service_role;
grant all on table public.informe_seguro_subproyectos to service_role;
grant all on table public.informe_seguro_media to service_role;
grant all on table public.informe_seguro_versiones to service_role;

COMMIT;
