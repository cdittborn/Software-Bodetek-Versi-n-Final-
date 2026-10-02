# Handoff — Bodetek

Para retomar en otro chat. Actualizado 2026-10-02.

## Estado de producción

- App: https://software-bodetek-versi-n-final.vercel.app
- Repo: https://github.com/cdittborn/Software-Bodetek-Versi-n-Final-
- `main` (al mergear este doc): último trabajo de Fachadas en `c119085` (PR #14, m² opcional).
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

Fuente de verdad: esa tabla, no la carpeta `supabase/migrations/` (hay archivos en el repo que no aparecen acá).

Fachadas (en este orden):

| version | name |
|---|---|
| `20260924120000` | `fachadas` |
| `20260928120000` | `fachadas_redisenio` |
| `20260928180000` | `fachadas_frecuencias_tipo` |
| `20260928200000` | `fachadas_fechas_base` |
| `20260928210000` | `fachadas_m2_nullable` |

La última quitó NOT NULL de `fachadas.alto_m`, `ancho_m`, `superficie_m2` y de los `*_snapshot` en `fachada_intervenciones`. Los CHECK `> 0` siguen (PostgreSQL los cumple si el valor es null). No se migró data.

Rollback de m² (no ejecutar salvo OK): `scripts/aplicar-fachadas-m2-nullable-rollback.sql`.

### Baseline de conteos

Captura de referencia: [`docs/baseline-2026-09-28.md`](baseline-2026-09-28.md) (29 tablas). Tras aplicar m²-nullable, **fuera de Fachadas** los conteos no cambiaron.

Consulta 2026-10-02 (solo `COUNT(*)`):

| tabla | n | nota |
|---|---:|---|
| `fachadas` | **1** | era 0 el 2026-09-28 |
| resto familia Fachadas (intervenciones, media, etc.) | 0 | |
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
| Foto estado actual | **Sí** — `223947.jpg` (`fachadas/{id}/general/…jpg`) |
| Última limpieza / reparación / pintura | **No** (las tres fechas null) |
| Medidas | alto 20,00 m · ancho 9,00 m · 180 m² |

No hay intervenciones.

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

1. **Preview de Vercel y env.** Las variables hay que setearlas también en Preview, no solo Production. Caso: `R2_PUBLIC_URL` ausente en Preview → `construirUrlPublica` tira «Falta R2_PUBLIC_URL» y las fotos/planos no cargan en el preview del PR. Production puede verse bien y Preview no. Tras agregar env, redesplegar el preview.
2. **No cargar código de Fachadas en la página compartida de subtipos** (`src/app/(dashboard)/trabajos/c/[categoriaId]/s/[subtipoId]/page.tsx` ni su grafo de imports). Si se importa, Lluvias paga el bundle y un bug de Fachadas puede tumbar esa ruta. El aislamiento es de rutas **y** de imports.
3. **Next.js 16 no es el de entrenamiento.** APIs y file structure pueden diferir. Antes de escribir código: leer la guía en `node_modules/next/dist/docs/` y respetar deprecations (`AGENTS.md` / `CLAUDE.md`).
4. **Migración ≠ deploy.** Guardar nulls (m², fechas) falla contra prod hasta aplicar la migración, aunque el preview ya tenga el UI. Primero SQL + OK, después merge.
5. **Pooler de sesión**, no transaction pooler ni `db.*.supabase.co` a ciegas: `\ir` + `BEGIN`/`COMMIT` necesitan una sola sesión.
