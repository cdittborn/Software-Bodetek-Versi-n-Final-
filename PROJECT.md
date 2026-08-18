# PROJECT.md — Bodetek Software

Documento de referencia del proyecto. Mantener actualizado cuando cambie el stack o la arquitectura.

## 1. Resumen

Bodetek es una plataforma web para gestión de un centro comercial / bodegas: trabajos, rentas, GGCC, legal y usuarios. Frontend Next.js (App Router) + backend Supabase (Auth, Postgres, RLS) + archivos en Cloudflare R2.

## 2. Stack tecnológico

| Capa | Tecnología | Notas |
|------|------------|--------|
| Frontend | Next.js 16 (App Router, TypeScript, Tailwind, shadcn) | Carpeta `src/` |
| Auth + DB | Supabase (Auth, Postgres, RLS) | Proyecto `jzmlhgvmetljbpjguvoz` |
| Formularios | react-hook-form + zod | Validación en cliente y API |
| Almacenamiento de archivos | Cloudflare R2 | S3-compatible, sin costo de egress. Reemplaza a Supabase Storage. |

## 3. Estructura de carpetas (relevante)

```
src/
  app/
    (auth)/login/
    (dashboard)/trabajos/
    (dashboard)/recintos/
    (dashboard)/recintos/plano/
    (dashboard)/usuarios/
    api/
      usuarios/route.ts
      storage/presign/route.ts   # URLs prefirmadas R2 (PutObject)
  components/
    shared/
    trabajos/
    usuarios/
    recintos/
    ui/
  lib/
    supabase/   # client, server, admin, middleware
    r2/
      client.ts   # Cliente S3 → R2 (solo servidor)
      utils.ts    # construirUrlPublica(key)
    modulos.ts
    trabajos.ts
middleware.ts
supabase/
  migrations/
  seed.sql
```

## 4. Arquitectura de datos y archivos

### 4.1 Auth y perfiles

- Usuarios en `auth.users`; perfiles en `public.perfiles` (rol, nombre).
- Trigger `on_auth_user_created`: al crear usuario en Auth, inserta perfil.
- Metadata de Auth usa `nombre_completo` → se guarda en columna `perfiles.nombre`.

### 4.2 Trabajos, emergencias y media

Tablas principales: `trabajos`, `trabajo_categorias`, `trabajo_subtipos`, `trabajo_media` (antes `trabajo_fotos`), `protocolos`, `recintos`, `modulo_permisos`.

**`trabajos.estado`:** valores de trabajo general (`planificado`, `en_curso`, `completado`, `mantencion_periodica`) y de emergencia (`pendiente`, `en_proceso`, `terminado`).

**`trabajos.plan_accion`:** texto libre (nullable). Pensado para el subtipo Lluvias y temporales.

**Lluvias y temporales:** un trabajo con categoría `Techumbres y canales` y subtipo `Lluvias y temporales`, más un `recinto` asociado.

**`trabajo_media`:** evidencia de un trabajo.
- `tipo`: momento `antes` | `despues`
- `tipo_archivo`: `foto` | `video`
- `url`: **key** del objeto en R2 (ej: `trabajos/abc123/foto1.jpg`), no una URL completa. La URL pública o prefirmada se construye en runtime con `construirUrlPublica(key)` o un GetObject prefirmado.

### 4.3 RLS y permisos

- Roles: `admin`, `pablo`, `asistente`, `socio`, `cliente`.
- `modulo_permisos` controla `puede_ver` / `puede_editar` por módulo (`rentas`, `trabajos`, `ggcc`, `legal`, `usuarios`, `recintos`).
- Middleware y `NavPrincipal` usan `puede_ver`; pantallas usan `puede_editar` para CTAs de escritura.
- Módulo `recintos`: lo ven `admin`, `pablo` y `asistente` (este último solo lectura). `socio` y `cliente` no.

### 4.4 Recintos

Tabla `recintos`: locales y bodegas. Unique compuesto `(sitio, galpon, codigo)` — el mismo código puede existir en sitios distintos.

Columnas: `codigo`, `nombre`, `tipo`, `sitio`, `galpon`, `arrendatario_actual`, `superficie_m2` (total), `superficie_1er_piso`, `superficie_2o_piso`, `plano_url`.

`tipo` (check): `local` | `bodega` | `estacionamiento` | `area_comun` | `oficina` (nullable).

Importación: CSV en `data/recintos_import.csv`, script `scripts/import-recintos.mjs` (dry-run por defecto; `--apply` hace upsert).

**Plano del complejo**
- `planos`: imagen de fondo (`imagen_key` en R2, prefijo `planos/`). Un solo plano `activo` a la vez.
- `recinto_posiciones_plano`: `recinto_id` + `x_pct` / `y_pct` (0–100, origen arriba-izquierda, ancla al centro de la etiqueta). Unique `(plano_id, recinto_id)`.
- El arrendatario se lee de `recintos.arrendatario_actual`, no se copia al plano.
- UI: `/recintos` muestra el plano; `/recintos/plano` (admin/pablo) sube la imagen y arrastra o edita X/Y.

### 4.5 Storage (Cloudflare R2)

- **Ya no se usa Supabase Storage.**
- Todo archivo binario vive en un único bucket R2: **`bodeteksoftware`**, organizado por prefijos:
  - `trabajos/{trabajo_id}/...`
  - `planos/...` (imagen de fondo del complejo; lectura pública vía `R2_PUBLIC_URL`)
  - `protocolos/...`
  - `medidores/...` (futuro)
  - `facturas/...` (futuro)
  - `legal/...` (futuro)
- **Flujo de subida:**
  1. El navegador pide una URL prefirmada al servidor: `POST /api/storage/presign`.
  2. Sube el archivo **directo a R2** con esa URL (`PUT`).
  3. Avisa al servidor para persistir la referencia (`key`) en la tabla correspondiente (`trabajo_media`, etc.).
- **Acceso de lectura:**
  - Contenido bajo `trabajos/` es **público** vía `R2_PUBLIC_URL`.
  - Contenido bajo `protocolos/` y `legal/` es **privado**: se genera URL prefirmada de lectura cuando se necesita.

## 5. Variables de entorno

| Variable | Público | Uso |
|----------|---------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | Cliente Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Cliente Supabase (publishable/anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Solo servidor (crear usuarios Admin API) |
| `R2_ACCOUNT_ID` | No | Endpoint R2 |
| `R2_ACCESS_KEY_ID` | No | Credencial R2 |
| `R2_SECRET_ACCESS_KEY` | No | Credencial R2 |
| `R2_BUCKET_NAME` | No | Nombre del bucket |
| `R2_PUBLIC_URL` | No* | Base para URLs públicas de lectura (`trabajos/…`) |

\* `R2_PUBLIC_URL` no es un secreto crítico (URL pública del bucket), pero se mantiene en servidor/env para no hardcodear. Si en el futuro se necesita en el navegador, se puede exponer como `NEXT_PUBLIC_R2_PUBLIC_URL`.

Archivo local: `.env.local` (gitignored). Plantilla: `.env.example`.
