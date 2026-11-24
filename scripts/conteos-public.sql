-- Solo lectura. Una línea "tabla|filas" por cada tabla de public y de auth.users.
SET default_transaction_read_only = on;

select n.nspname || '.' || c.relname as tabla,
  (xpath('/row/c/text()', query_to_xml(
    format('select count(*) as c from %I.%I', n.nspname, c.relname),
    false, true, ''
  )))[1]::text::int as n
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where (n.nspname = 'public' and c.relkind = 'r')
  or (n.nspname = 'auth' and c.relname = 'users')
order by 1;
