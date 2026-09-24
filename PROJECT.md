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
| Gráficos | recharts (previsto) | Dashboard de Fachadas; aún no instalado |
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
    fachadas/
      indicadores.ts
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

**Lluvias y temporales:** un trabajo con categoría `Techumbres y canales` y subtipo `Lluvias y temporales`, agrupado por `evento_id`.
- `estado` (Lluvias): `sin_asignar` | `asignado_proveedor_sin_empezar` | `asignado_maestros_sin_empezar` | `asignado_proveedor_en_proceso` | `asignado_maestros_en_proceso` | `terminado`
- `gravedad`: `critico` | `medio` | `bajo`
- `ejecutado_por`: `maestros_bodetek` | `proveedor_externo` | `ambos` (nullable)
- `proveedor`, `valor_reparacion` (nullable)
- Media: `antes`/`despues`, `plano_filtraciones`, `cotizacion`
- Dashboard: `/trabajos/c/.../s/.../e/[eventoId]/dashboard`

**Revisiones y mantenciones periódicas:** un `trabajo` (Techo) en la misma categoría. `recinto_id` queda null. Campos: `materiales`, `fecha_ultima_revision`, `periodicidad_dias`, `proxima_mantencion` (calculada en la app). Media `adjunto` (fotos/videos) y `cotizacion` (una sola). Tareas en `trabajo_acciones.estado`.

**`trabajo_media`:** evidencia de un trabajo.
- `tipo`: `antes` | `despues` (Lluvias); `adjunto` | `patente_provisoria` (Patentes); `adjunto` | `cotizacion` (Techos); `null` solo en cajón inbox
- `tipo_archivo`: `foto` | `video` | `documento`
- `nombre_archivo`: nombre original (nullable)
- `url`: **key** del objeto en R2 (ej: `trabajos/abc123/foto1.jpg`), no una URL completa. La URL pública o prefirmada se construye en runtime con `construirUrlPublica(key)` o un GetObject prefirmado.

**Patentes:** categoría `Patentes` con subtipos `Clientes con patentes en proceso` y `Proyecto recepción de obras`. Cada cliente o recepción es un `trabajo` (proyecto).
- `trabajo_acciones`: seguimiento (`descripcion`, `fecha_entrega`, `hecha`)
- `trabajo_presupuesto_items`: desglose (`concepto`, `monto`)
- `trabajo_pagos`: pagos por hito (`hito`, `monto`, `fecha_pago`)
- `trabajos.fecha_termino`: fecha de entrega del proyecto completo (recepción de obras)
- `trabajos.descripcion`: comentario / descripción general

### 4.3 RLS y permisos

- Roles: `admin`, `pablo`, `asistente`, `socio`, `cliente`.
- `modulo_permisos` controla `puede_ver` / `puede_editar` por módulo (`rentas`, `trabajos`, `ggcc`, `legal`, `usuarios`, `recintos`).
- Middleware y `NavPrincipal` usan `puede_ver`; pantallas usan `puede_editar` para CTAs de escritura.
- Módulo `recintos`: lo ven `admin`, `pablo` y `asistente` (este último solo lectura). `socio` y `cliente` no.
- Ficha `/recintos/[id]`: `recinto_documentos` (`contrato_arriendo` | `otro`, `fecha_vencimiento`) y `recinto_planos`. Prefijos R2 `recintos/{id}/documentos/` y `recintos/{id}/planos/`.

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

### 4.5 Fachadas (Imagen → Fachadas)

Módulo propio: **no** reutiliza `trabajos` ni `compras_materiales` (esas compras exigen `evento_id` y el trigger `compra_trabajo_mismo_evento`). Pórtico y Letreros siguen pendientes.

Migración: `supabase/migrations/20260924120000_fachadas.sql` (aún no aplicada en prod).

**Catálogo `fachadas`**
- `recinto_id` opcional (`on delete set null`). Unique `(recinto_id, nombre)` más índice único parcial `unique (nombre) where recinto_id is null` (fachadas generales).
- Medidas: `alto_m`, `ancho_m`, `superficie_m2` (todas `numeric` not null, check > 0).
- En el formulario, `superficie_m2` se autocompleta con alto × ancho mientras el usuario no la edite a mano (vanos, portones, formas irregulares). Hint `alto × ancho = X m²` si difiere.
- Foto general: `foto_key` / `foto_nombre`.
- Plano: `plano_key` / `plano_nombre` (PDF o imagen, nullable). Preview si es imagen; link de descarga si es PDF.
- `updated_at` con trigger `set_updated_at()` (función creada en esta migración; no existía antes).

**Intervención `fachada_intervenciones`**
- Snapshot de las tres medidas: se copia desde la fachada **solo al crear**. Editar la intervención no lo toca. Solo se refresca con la acción explícita «Actualizar medidas desde la fachada» (con confirmación). Los indicadores usan **siempre** el snapshot.
- Estado (filtración) en BD: `null` o `sin_empezar` | `en_proceso` | `ejecutado_pendiente_entrega` | `entregado`. La app mapea `null ↔ ""` en `src/lib/fachadas/estado.ts` para `ESTADO_TRABAJO_LABEL`, filtros y formularios.
- Fechas `fecha_inicio` / `fecha_termino`. Si ambas existen, la UI muestra «duración calendario» (informativa; no entra en días/m²).
- `ejecutado_por`: `maestros_bodetek` | `proveedor_externo`.
- `proveedor_id` → `proveedores` `on delete restrict`.
- `requiere_hojalateria` (boolean). `sin_materiales` (boolean, default false; checkbox «Esta intervención no usó materiales»).
- Si `ejecutado_por` = Maestros Bodetek, la UI oculta cotizaciones. Si ya había cotizaciones y se cambia el ejecutor, se avisa antes de guardar (no se borran en silencio).

**Tipos + días `fachada_intervencion_tipos`**
- Tipos: `limpieza` | `reparacion` | `pintura` (labels: Limpieza, Reparación, Pintura).
- `dias` > 0. La **suma por tipo** es el indicador principal de días.

**Cotizaciones `fachada_cotizaciones` + `fachada_cotizacion_tipos`**
- IVA/bruto igual que materiales (`valor_bruto = valor_neto + valor_iva`).
- Cotización y factura son PDFs separados: `cotizacion_key/_nombre` y `factura_key/_nombre` (la factura se puede adjuntar después).
- Una cotización cubre uno o más tipos. Varias cotizaciones pueden cubrir tipos distintos.
- `proveedor_id` `on delete restrict`.

**Hojalatería `fachada_hojalateria` (0..N)**
- No hay columnas `hojalateria_*` en la intervención: solo el flag `requiere_hojalateria`.
- `proveedor_id` `on delete restrict`, `descripcion`, cotización/factura (key + nombre), `valor_neto` / `_iva` / `_bruto` con el mismo check que materiales.

**Materiales `fachada_materiales`**
- Propios de la intervención (Maestros). No reutilizan `compras_materiales`.
- `proveedor_id` → catálogo (`on delete restrict`). Desplegable filtrado por rubro `materiales` + «mostrar todos».

**Media `fachada_media`**
- `antes` | `despues` (foto/video).

**`proveedor_rubros`**
- Rubros: `limpieza` | `reparacion` | `pintura` | `hojalateria` | `materiales` | `andamios` | `albanileria` | `otro`.
- Filtro de proveedores con opción «mostrar todos».
- Borrar un proveedor usado en intervenciones/cotizaciones/hojalatería/materiales falla (`ON DELETE RESTRICT`). La UI muestra «Este proveedor tiene trabajos asociados; no se puede eliminar».

**Completitud (dos criterios independientes)**
- **Completa para días:** snapshot m² > 0 y ≥1 tipo con días.
- **Completa para costos:** ejecutor definido; si es proveedor externo, ≥1 cotización con neto y PDF de cotización; si hay hojalatería, ≥1 registro con neto y proveedor; si es Maestros Bodetek, ≥1 material o `sin_materiales = true`.
- Documentación: «M de N cotizaciones con factura» (sin factura igual suma al costo).
- Cada indicador muestra «calculado sobre M de N».

**Indicadores (`src/lib/fachadas/indicadores.ts`)**
- m² intervenidos: cada fachada una sola vez (último snapshot de las intervenciones completas para días), con o sin recinto.
- Días: suma por tipo (solo completas para días). `días/m²` usa esos días y esos m²; la duración calendario no entra.
- Costos: cotizaciones (solo si el ejecutor es proveedor externo) + hojalaterías + materiales, sobre las completas para costos.

**RLS:** igual que `eventos` (select: admin/pablo/asistente/socio/cliente; insert/update: admin/pablo/asistente; delete: admin/pablo).

### 4.6 Storage (Cloudflare R2)

- **Ya no se usa Supabase Storage.**
- Todo archivo binario vive en un único bucket R2: **`bodeteksoftware`**, organizado por prefijos:
  - `trabajos/{trabajo_id}/...`
  - `planos/...` (imagen de fondo del complejo; lectura pública vía `R2_PUBLIC_URL`)
  - `recintos/{recinto_id}/documentos/...` y `recintos/{recinto_id}/planos/...`
  - `fachadas/{fachada_id}/general/...` (foto general)
  - `fachadas/{fachada_id}/plano/...` (PDF o imagen)
  - `fachadas/{fachada_id}/intervenciones/{intervencion_id}/fotos/...` (antes/después)
  - `fachadas/{fachada_id}/intervenciones/{intervencion_id}/docs/...` (cotizaciones, facturas, hojalatería, materiales)
  - `protocolos/...`
  - `medidores/...` (futuro)
  - `facturas/...` (futuro)
  - `legal/...` (futuro)
- `autorizarCarpeta` valida los prefijos de Fachadas: la fachada existe; si el path incluye intervención, esa fila existe y pertenece a la fachada; el usuario tiene rol de escritura (`admin` / `pablo` / `asistente`).
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
