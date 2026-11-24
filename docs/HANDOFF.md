# Handoff — Bodetek

Para retomar en otro chat. Actualizado 2026-11-24.

## Estado de producción

- App: https://software-bodetek-versi-n-final.vercel.app
- Repo: https://github.com/cdittborn/Software-Bodetek-Versi-n-Final-
- `main`: `931cf6f` (PR #23, fase 1 del plano de Fachadas v2).
- `rediseno-lluvias`: menú lateral, editor del menú, "Otros trabajos CD" archivada y categorías visibles por persona. Lista para publicar, todavía sin merge. Estado por sección en `docs/rediseno-lluvias/ESPEC-REDISENO.md`.
- Tests y build en verde en las dos ramas. `npm run lint` falla con los mismos 35 errores en `main` y en `rediseno-lluvias` (reglas `react-hooks/error-boundaries`, `set-state-in-effect` y `refs`); son anteriores al rediseño.
- Vercel: funciones `regions: ["gru1"]` (`vercel.json`). El middleware Edge es global (`x-vercel-id` puede ser `yul1`/`cle1`).
- Supabase ref: `jzmlhgvmetljbpjguvoz`. Conexión de migraciones: **session pooler** (`aws-1-sa-east-1.pooler.supabase.com`, usuario `postgres.{ref}`, puerto 5432, `sslmode=require`). El host `db.*.supabase.co` a menudo no tiene IPv4 en estos agentes.

Rutas protegidas (sin sesión) responden **307 → `/login`**, no 500. Eso significa que cargan.

### IDs útiles

| Qué | ID |
|---|---|
| Categoría Imagen | `6610bbfd-cdbf-4090-a5ec-8679e76795da` |
| Subtipo Fachadas | `58af02ea-84d4-4ec1-b537-3f7bad8f33cf` |
| Categoría Techumbres y canales | `8fc81213-50bb-4403-ae8c-f6a2902059c4` |
| Subtipo Lluvias y temporales | `9595d715-d7eb-4c0d-85d7-cfea3168b600` |
| Evento Temporal 16 ago 2026 | `703356ea-67df-4490-9f92-bb88886973e4` |
| Única fachada en prod (2026-10-02) | `95c58c33-5034-4403-977b-6bd04efb4310` |

Fachadas en prod: `/trabajos/fachadas/{cat}/{sub}`.  
Lluvias: `/trabajos/c/{cat}/s/{sub}` y dashboard `/trabajos/c/{cat}/s/{sub}/e/{eventoId}/dashboard`.

### Migraciones aplicadas (`supabase_migrations.schema_migrations`)

Fuente de verdad: esa tabla, no la carpeta `supabase/migrations/`. Al 2026-11-24 tiene 42 filas; la última es `20261107180000`.

Cinco archivos del repo no están registrados en la tabla, pero sus objetos sí existen en prod (revisado el 2026-11-24): `20260825190000_filtracion_problemas`, `20260826120000_filtracion_problemas_ejecucion`, `20260826140000_quitar_tipo_canaleta`, `20260901220000_estado_independiente_ejecutor` y `20260901233000_compras_materiales`. Se aplicaron con scripts que no los anotaron. No volver a correrlos.

No hay migraciones escritas sin aplicar.

Rediseño (rama `rediseno-lluvias`, aplicadas **antes** del merge; el `main` actual funciona con ellas porque no escribe en el menú y nadie tiene la vista recortada):

| version | name | Aplicada | Rollback |
|---|---|---|---|
| `20261103230000` | `menu_categorias` | entre el 4 y el 7 de noviembre de 2026 | `supabase/rollback/20261103230000_menu_categorias_down.sql` y `scripts/aplicar-menu-categorias-rollback.sql` |
| `20261104120000` | `usuario_visibilidad` | entre el 6 y el 7 de noviembre de 2026, después de corregirla en el PR #25 | `supabase/rollback/20261104120000_usuario_visibilidad_down.sql` y `scripts/aplicar-usuario-visibilidad-rollback.sql` |
| `20261107180000` | `menu_solo_gerente` | 7 de noviembre de 2026, con OK de Cristóbal | No hay script. Para deshacerla: borrar las seis políticas `Menu solo gerente …` y volver a crear `guardar_menu_categorias` como estaba en `20261103230000` |

La tabla no guarda la fecha de aplicación; las fechas salen de los commits y del PR #25. Ningún rollback se ejecutó.

- `menu_categorias`: columnas `orden`, `color`, `clave`, `protegida` y `archivada` en `trabajo_categorias` (y las mismas, salvo `color` y `archivada`, en `trabajo_subtipos`). Triggers que impiden borrar categorías con trabajos, eventos o marcadas como protegidas. Función `guardar_menu_categorias`. Marcó "Otros trabajos CD" como archivada (sus trabajos y archivos siguen).
- `usuario_visibilidad`: tabla `usuario_visibilidad`, columna `perfiles.visibilidad_personalizada` (false = ve todo), funciones `ve_*` y políticas restrictivas de lectura en trabajos, eventos, `trabajo_media`, compras, Fachadas e informe. Al 2026-11-24 la tabla tiene 0 filas: todos ven todo.
- `menu_solo_gerente`: seis políticas restrictivas para que solo `admin` (Gerente General) inserte, edite o borre categorías y subcategorías, y `guardar_menu_categorias` con la misma condición. Las políticas viejas de admin y Pablo siguen, pero se suman con AND.

Cómo se aplicaron, las tres igual: `scripts/aplicar-<nombre>-commit.sh` cuenta las filas de todas las tablas (`scripts/conteos-public.sql`), abre una sola sesión con `BEGIN`, incluye la migración con `\ir`, inserta la fila en `schema_migrations` y hace `COMMIT`. Luego verifica en una conexión nueva (`scripts/verificar-<nombre>.sql`) y vuelve a contar; si algún conteo cambió, termina en error. `menu_categorias` y `usuario_visibilidad` se probaron antes en local con `scripts/probar-<nombre>-local.sh`.

Otras ya aplicadas: `20261008120000` `fachadas_v2_plano` (script `scripts/aplicar-fachadas-v2-commit.sh`, rollback `supabase/rollback/20261008120000_fachadas_v2_plano_down.sql`).

Fachadas (en este orden):

| version | name |
|---|---|
| `20260924120000` | `fachadas` |
| `20260928120000` | `fachadas_redisenio` |
| `20260928180000` | `fachadas_frecuencias_tipo` |
| `20260928200000` | `fachadas_fechas_base` |
| `20260928210000` | `fachadas_m2_nullable` |
| `20261005120000` | `fachada_archivos` |

`fachadas_m2_nullable` quitó NOT NULL de `fachadas.alto_m`, `ancho_m`, `superficie_m2` y de los `*_snapshot` en `fachada_intervenciones`. Los CHECK `> 0` siguen (PostgreSQL los cumple si el valor es null). No se migró data.

`fachada_archivos` (aplicada 2026-10-05, antes del merge del PR #16) es la galería del estado actual. `fachadas.foto_key` sigue, en desuso. Rollback sin ejecutar: `scripts/aplicar-fachada-archivos-rollback.sql`.

`20261006120000` `informe_seguro` **aplicada desde el 2026-10-05**. Crea solo las cinco tablas del informe. `informe_seguro_versiones` no tiene policy de UPDATE y `authenticated` solo tiene SELECT, INSERT y DELETE. `informes_seguro` tiene el trigger `informes_seguro_set_updated_at` (`set_updated_at()`). Los privilegios por defecto del esquema dejaban ALL en `authenticated`; se revocaron en la misma migración y, en prod, con `scripts/ajustar-grants-informe-seguro.sql` (ya ejecutado, tablas en 0). Rollback sin ejecutar: `scripts/aplicar-informe-seguro-rollback.sql`.

`20261006233000` `informe_seguro_validacion` **aplicada el 2026-10-07**. Agrega en `informe_seguro_recintos` las columnas `descripcion_validada` (boolean, default false), `validada_at` y `validada_por` (FK a `perfiles`). No borra filas. RLS y conteos del resto de las tablas quedaron iguales. Rollback sin ejecutar: `scripts/aplicar-informe-validacion-rollback.sql`.

`20261007013000` `informe_seguro_guardado` **aplicada el 2026-10-07**. Crea `guardar_borrador_informe_seguro` (`uuid, text, jsonb, jsonb, jsonb`), `SECURITY INVOKER`. Reemplaza recintos, textos y archivos del informe que se guarda. Si el recinto sigue validado, conserva `validada_at` y `validada_por`. No escribe `token_expira` ni toca `trabajo_media`. Conteos tras aplicarla: `trabajo_media` 466, `trabajos` 42, `recintos` 34, las cinco tablas del informe en 0. Script: `scripts/aplicar-informe-guardado-commit.sql`. Rollback sin ejecutar: `scripts/aplicar-informe-seguro-rollback.sql`.

`20261007180000` `informe_seguro_version_recinto` **aplicada el 2026-10-07**. Agrega `informe_seguro_recintos.version` (`integer not null default 1`). Las 29 filas quedaron en 1. La función guarda solo los recintos del payload y sube esa versión en 1; si no coincide, no escribe nada. Conteos sin cambio en esa pasada: informes 1, recintos 29, subproyectos 74, media del informe 361, versiones 0, `trabajo_media` 466. `validada_at`, `validada_por`, los textos y los archivos pasados siguieron iguales. Script: `scripts/aplicar-informe-version-commit.sql`. Rollback solo junto con la pantalla anterior: `scripts/aplicar-informe-version-rollback.sql`.

La página pública `/informe-seguro/[token]` lee con `createAdminClient()`. Hace falta `SUPABASE_SERVICE_ROLE_KEY` en Vercel, en **Production y en Preview**. Sin ella la página responde 500 antes de leer la fila. La URL pública y la anon key no alcanzan.

Rollback de m² (no ejecutar salvo OK): `scripts/aplicar-fachadas-m2-nullable-rollback.sql`.

### Baseline de conteos

Captura de referencia: [`docs/baseline-2026-09-28.md`](baseline-2026-09-28.md) (29 tablas). Tras aplicar m²-nullable, **fuera de Fachadas** los conteos no cambiaron.

Consulta 2026-10-05 (solo `COUNT(*)`), después de la galería y de las subidas de prueba en el preview (apuntan a esta misma base):

| tabla | n | nota |
|---|---:|---|
| `fachadas` | **1** | era 0 el 2026-09-28 |
| `fachada_archivos` | **10** | 1 portada (`223956.jpg`) y 9 fotos más. Sin videos en esta tabla |
| `fachada_intervenciones` | **1** | creada desde el preview (la base de Preview es la de producción) |
| resto familia Fachadas (media, cotizaciones, etc.) | 0 | |
| `compra_material_trabajos` | 61 | igual |
| `compras_materiales` | 4 | |
| `eventos` | 1 | |
| `modulo_permisos` | 21 | |
| `perfiles` | 2 | |
| `proveedores` | 5 | |
| `recintos` | 34 | |
| `trabajo_categorias` | 7 | |
| `trabajo_media` | 466 | |
| `trabajo_subtipos` | 17 | |
| `trabajos` | 42 | |

Antes de una migración en prod: volvé a contar las 29 tablas. Después: las que no son de Fachadas deben coincidir, salvo que el usuario haya pedido lo contrario.

### Fachada «Local 1 - Rio Cristal» (2026-10-02)

Nombre completo en BD: `Local 1 - Rio Cristal - Fachada trasera (Calle interior acceso V. Jara)`.

| Campo | Estado |
|---|---|
| Plano | **No** (`plano_key` / `plano_nombre` null) |
| Foto estado actual | **Sí** — portada `223956.jpg` en `fachada_archivos` (`foto_key` se conserva) |
| Última limpieza / reparación / pintura | **No** (las tres fechas null) |
| Medidas | alto 20,00 m · ancho 9,00 m · 180 m² |

No hay intervenciones.

### Roles y permisos (desde el rediseño)

| Rol en la base | En pantalla | Qué hace |
|---|---|---|
| `admin` | Gerente General | Todo. Es el único que edita el menú, crea personas, quita o devuelve el acceso y elige qué categorías ve cada uno |
| `pablo` | Administrador | Edita trabajos, recintos, proveedores y el informe. No ve Usuarios ni el lápiz del menú (tiene `usuarios` en `modulo_permisos`, pero el menú y la página lo filtran) |
| `asistente` | Ver y editar | Se crea desde Usuarios con "Ver y editar" |
| `socio` | Solo ver | Se crea desde Usuarios con "Solo ver" |
| `cliente` | Consulta | Ya no se crea desde la app |

Quitar acceso bloquea el inicio de sesión en Supabase Auth (`ban_duration`). No borra la cuenta, el perfil ni lo que subió. Al 2026-11-24 en `perfiles` solo hay un `admin` y un `pablo`.

### Ramas

- Activas: `main`, `rediseno-lluvias` y `cursor/fachadas-v2-fase2-6302` (PR #24, borrador). Cuando el rediseño llegue a `main`, la fase 2 de Fachadas tendrá que integrar `main` y resolver el conflicto en la lista de tests de `package.json`.
- Obsoletas, se pueden borrar:
  - `docs/lluvias-estado-actual`: el mismo `ESTADO-ACTUAL.md` que ya está en `docs/rediseno-lluvias/`.
  - `cursor/limpiar-disparo-respaldos-6302`: borra un workflow que ya no existe en `main`.
  - `cursor/visibilidad-cascada-storage-3eff`: entró a `rediseno-lluvias` con el PR #25.
  - Todas las demás `cursor/*` ya están en `main` y no tienen commits propios.

---

## Reglas de trabajo

1. **Ramas:** `cursor/<nombre-en-minusculas>-6302` desde `origin/main` actual (`git fetch origin main` primero). Prefijo `cursor/`, sufijo `-6302`.
2. **Un PR por tarea.** No mezclar temas. Draft hasta que el usuario pida merge.
3. **Nunca mergear a `main` ni aplicar SQL en prod sin OK explícito** en el chat. «Mostrame el SQL» no es OK para aplicar.
4. **`gh` es de lectura** (logs, PRs, checks). Crear/actualizar PRs con la herramienta de PRs del agente. Merge solo si el usuario lo pidió.
5. **Antes de mergear:** `git fetch origin main`; si `main` avanzó, integrar; `npm test` y `npm run build` en verde; quitar draft; merge; esperar Production Ready; probar Lluvias y Fachadas (307 a login, no 500); recontar filas.

### Migraciones en prod

Misma mecánica siempre:

1. Mostrar el SQL al usuario. Pedir OK.
2. Baseline de conteos (SELECT).
3. Una sesión: `BEGIN` → `\ir` la migración → `INSERT` en `schema_migrations` → `COMMIT`. Script tipo `scripts/aplicar-fachadas-*-commit.sh`.
4. El apply **no** puede tener `ROLLBACK`. El SQL de apply **sí** debe tener `COMMIT`.
5. Verificación en **conexión nueva, solo SELECT**.
6. Dejar el rollback listo y **no ejecutarlo** hasta un OK aparte.
7. Si el host directo no resuelve IPv4, reescribir a session pooler (el `.sh` ya lo hace). Abortar si la URI no contiene el ref `jzmlhgvmetljbpjguvoz`.

### Respaldos

Bucket R2 privado **`bodetek-respaldos`**, separado del de la app. Detalle: [`docs/respaldos.md`](respaldos.md).

- DB diario 04:00 Chile → `db/AAAA-MM-DD.sql.gz` (retención 30 días).
- Archivos domingo 04:00 → `archivos/` (incremental, no borra).
- Cron solo en `main`. El repo no guarda dumps.
- El cron de las 06:00 y 07:00 UTC puede atrasarse. No se exige que sean las 04:00 Chile: si `db/AAAA-MM-DD.sql.gz` (fecha Chile) no existe, se sube; si ya existe, el job termina en verde sin repetir. Una ejecución manual siempre reemplaza el dump del día. Si no queda subido, el job queda en rojo.
- Archivos: igual, con marcador `marcadores/archivos-semana-<domingo Chile>.txt`. La copia baja cada objeto y lo vuelve a subir (Get + Put). R2 no implementa `CopyObject` con `x-amz-tagging-directive: REPLACE`, que es lo que manda `aws s3 sync` entre dos buckets.

### CORS del bucket de la app (`bodeteksoftware`)

Policy vigente desde el 2026-10-05 (Cloudflare R2 → bucket `bodeteksoftware` → Settings → CORS). Cubre producción, el dev local, los previews del equipo y la URL exacta del preview del PR #16. Métodos `GET`, `PUT`, `POST`, `HEAD`. Headers `*`.

```json
[
  {
    "AllowedOrigins": [
      "https://software-bodetek-versi-n-final.vercel.app",
      "http://localhost:3000",
      "https://*-cda7.vercel.app",
      "https://software-bodetek-versi-n-final-git-cursor-fachadas-b58be2-cda7.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["*"]
  }
]
```

El bucket de respaldos `bodetek-respaldos` no lleva CORS.

---

## Convenciones de Fachadas

- **Montos en valor neto** (UI y cálculos). IVA/bruto se derivan si hace falta; los KPI de dashboard son netos.
- **Coma decimal chilena**, 2 decimales en metros/m² del formulario (`InputDecimalCl` / `parseDecimalCl`). Totales de superficie del dashboard: enteros (`2.860`).
- **Rutas aisladas:** `/trabajos/fachadas/[categoriaId]/[subtipoId]/…`. Nunca colgar la ficha bajo `/trabajos/c/.../s/...` (eso es Lluvias y el resto). Test: `src/lib/fachadas/aislamiento-rutas.test.ts`.
- **Estilos** solo bajo `.fachadas-scope`.
- **Diseños:** [`docs/diseno/fachadas/`](diseno/fachadas/) (capturas Claude Design). Fuente de layout/color/chips; no son datos de prod.
- **Demo:** `/trabajos/fachadas/demo` (exige login de trabajos). Datos **en memoria** (`src/lib/fachadas/demo-datos.ts`), sin I/O. Bodega 17 está sin m² a propósito. Cifras 2026: superficie 2.860 de 5.833 (44 de 45); estados 18/4/9/14.
- **m²:** opcionales, escritos a mano (no alto × ancho). Sin dato: «Sin m²» en gris, nunca 0. Se excluyen **solo** de costo/m², días/m² y m² totales/intervenidos/restantes («calculado sobre M de N»). Costos, días, estado y vencimientos siguen igual.
- **Fechas de último trabajo** (`ultima_*_fecha`): base para próximas y estado. Null = desconocida o nunca. No entran en costos/días/m².
- **Snapshot:** las intervenciones copian medidas al crear. Los indicadores leen el snapshot, no la ficha viva. `Number(null) === 0` en JS: mapear con `asMedidaNullable`, nunca `Number(columna_nullable)`.
- **hoyIsoChile()** (no UTC del servidor) para «hoy» en estado/vencimientos.

---

## Lecciones aprendidas

1. **Preview de Vercel y env.** Las variables de R2 hay que setearlas también en el entorno **Preview** de Vercel, no solo en Production: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` y `R2_PUBLIC_URL`. Sin `R2_PUBLIC_URL`, `construirUrlPublica` tira «Falta R2_PUBLIC_URL» y las fotos y los planos no cargan en el preview del PR. Sin el resto, la URL firmada no se puede armar. Production puede verse bien y Preview no. Tras agregarlas, redesplegar el preview. El PUT del navegador además exige la CORS de `bodeteksoftware` (arriba): si el origen del preview no está, la subida falla con «Error al subir a R2 (red/CORS)». La página pública del informe (`/informe-seguro/[token]`) necesita además `SUPABASE_SERVICE_ROLE_KEY` en **Production y Preview**. Sin esa clave, `createAdminClient()` tira y Next muestra «A server error occurred» antes de leer la fila.
2. **No cargar código de Fachadas en la página compartida de subtipos** (`src/app/(dashboard)/trabajos/c/[categoriaId]/s/[subtipoId]/page.tsx` ni su grafo de imports). Si se importa, Lluvias paga el bundle y un bug de Fachadas puede tumbar esa ruta. El aislamiento es de rutas **y** de imports.
3. **Next.js 16 no es el de entrenamiento.** APIs y file structure pueden diferir. Antes de escribir código: leer la guía en `node_modules/next/dist/docs/` y respetar deprecations (`AGENTS.md` / `CLAUDE.md`).
4. **Migración ≠ deploy.** Guardar nulls (m², fechas) falla contra prod hasta aplicar la migración, aunque el preview ya tenga el UI. Primero SQL + OK, después merge.
5. **Pooler de sesión**, no transaction pooler ni `db.*.supabase.co` a ciegas: `\ir` + `BEGIN`/`COMMIT` necesitan una sola sesión.
6. **Consultas de solo lectura.** El pooler ignora `PGOPTIONS='-c default_transaction_read_only=on'`. Para revisar prod sin riesgo, abrir la sesión con `set default_transaction_read_only = on` en el mismo `psql` y confirmar con `show transaction_read_only`. `SUPABASE_DB_URL` puede traer espacios al principio o al final: recortarla antes de usarla.
7. **Las vistas previas de Vercel usan la base de producción.** Crear personas, quitar acceso o recortar la vista desde una vista previa cambia datos reales.
