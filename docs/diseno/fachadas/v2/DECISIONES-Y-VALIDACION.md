# Fachadas v2 · Validación contra el repo y prompt para Cursor (paquete v3, con móvil)

Revisado contra `cdittborn/Software-Bodetek-Versi-n-Final-` en `main` (`cbe19c3`, 7 oct 2026), más `docs/HANDOFF.md` y `PROJECT.md`.

**Qué cambió respecto de la validación anterior.** El paquete v3 solo agrega `MainMovil.dc.html`, `FichaMovil.dc.html`, la sección §8 bis (móvil) y criterios móviles por fase. El plano, el JSON y el resto de los diseños son idénticos a la v2. El JSON **todavía trae el error** de los Locales 4 y 5 (ver 1.2), así que hay que usar el corregido que adjunto. La validación móvil está en la nueva sección **1.3**, y cada fase del prompt trae ahora sus criterios a 360 y 390 px.

> **Hallazgo principal.** El diseño se pensó como si Fachadas partiera de cero. No es así: el módulo ya existe en producción y es bastante completo. Tiene 11 tablas, cálculo de estado y vencimientos con tests, ficha, intervenciones con costos por documento, subida a R2 con miniaturas y un reporte.
>
> Por eso la v2 **no** debe crear `fachada_medios`, `fachada_mantenciones`, `fachada_documentos` ni guardar un `estado` editable a mano. Debe **extender** lo que ya hay.
>
> Varias decisiones del §9 del traspaso cambian por esa razón. Las detallo abajo.

---

## Parte 1 · Validación

### 1.1 Los 14 puntos

| # | Punto | Resultado | Decisión |
|---|---|---|---|
| 1 | **Esquema** | **Cambia.** Ya existen `fachadas`, `fachada_intervenciones`, `fachada_intervencion_tipos`, `fachada_documentos`, `fachada_materiales`, `fachada_hojalateria`, `fachada_media` (antes/después **por intervención**) y `fachada_archivos` (galería **por fachada**). Hay tablas legacy sin uso que no se borran: `fachada_cotizaciones` y `fachada_cotizacion_tipos`. `fachadas` **no** tiene `svg_id`, `estado`, `ubicacion` ni `tipo_espacio`. `fachadas.recinto_id` existe, pero se dejó "sin uso en la UI". | **Falta crear** solo lo mínimo, todo aditivo en una migración: (a) columnas nuevas en `fachadas`; (b) tabla `fachada_recintos` (N:M); (c) columnas `momento` y `duracion_seg` en `fachada_archivos`; (d) tabla `fachadas_reportes` para el link público. **Datos v1:** en prod hay **1 fachada** (*Local 1 - Rio Cristal - Fachada trasera…*, `95c58c33-…`), con 10 archivos y 1 intervención, y ningún id v1 guardado. No hay nada que migrar desde la v1. Esa fila se **actualiza** a `svg_id = 's1-local-1-f1'` y no se duplica. Las otras 68 se insertan. |
| 2 | **Alto y superficie reales** | **No hay datos.** La única fachada en prod tiene alto 20 m, ancho 9 m y 180 m². El largo de 17,7 m del plano no calza con esos 9 m de ancho. En el repo, los m² son opcionales y se escriben a mano (`fachadas_m2_nullable`): sin dato se muestra «Sin m²» y nunca 0. | Sembrar solo `ancho_m = largo_m_aprox` y dejar `alto_m` y `superficie_m2` **en null**. Los KPIs ya muestran «calculado sobre M de N». **Pregunta 2.** Los 7,0 / 5,0 / 3,0 m son supuestos, y cargarlos haría pasar 7.735 m² inventados como dato real. |
| 3 | **Unidades** | **Parcial.** Las 31 unidades existen en `recintos` (34 filas, unique `(sitio, galpon, codigo)`; los códigos están en `data/recintos_import.csv`). El taller, los baños, la bodega y la oficina de maestros, el comedor, el acceso y el cierre de Huasco **no existen**. `recintos.tipo` ya admite `area_comun`. | Los 5 espacios comunes se crean como `recintos` con `tipo = 'area_comun'`: taller, baños, bodega de maestros, oficina de administración y comedor. El acceso y el cierre de Huasco **no son recintos**: quedan sin unidad, con `tipo_espacio = 'perimetro'` (para el acceso, `espacio_comun`) y una etiqueta en `fachadas.unidad_label`. **Pregunta 5.** |
| 4 | **Temporadas** | **No hay tabla.** Hoy el dashboard filtra por **año calendario** (`fechaDesde = AAAA-01-01`, selector «Ene – oct 2026»). El diseño usa "desde 1 jul". | Sin tabla nueva. Se agrega una regla en código (`src/lib/fachadas/temporada.ts`) con una constante `MES_INICIO_TEMPORADA`. **Pregunta 1** (julio o enero). |
| 5 | **Documentos** | **Ya existe.** `fachada_documentos` guarda cotizaciones, facturas y boletas por intervención, con su estado y valor neto. Además, `fachadas.plano_key` guarda el plano. | **Ok:** reutilizar. La sección Documentos de la ficha une los `fachada_documentos` de todas sus intervenciones con el plano. No se crea `fachada_documentos` nuevo. |
| 6 | **Mantenciones periódicas** | **Ya existe.** Las columnas `frecuencia_{limpieza,reparacion,pintura}_meses` y `ultima_*_fecha`, más las funciones `proximasPorTipo()` y `proximosVencimientos()` en `src/lib/fachadas/indicadores.ts`, con una ventana de 60 días. | **Ok:** reutilizar. No se crea `fachada_mantenciones`. La regla de "naranjo si faltan ≤30 días" pasa a `VENTANA_VENCE_PRONTO_DIAS`, que hoy vale 60. Hay que alinear: propongo dejar 60 en el cálculo y pintar naranjo con ≤30. |
| 7 | **Estado "programada" e historial** | **Cambia.** El estado **no se guarda**: lo calcula `estadoCalculadoFachada()`. Hay intervención en ejecución → `en_ejecucion`; hay intervención programada futura → `programada`; algún tipo está vencido → `requiere_trabajo`; si no → `al_dia`. No existe `sin_evaluar`. | **No** crear `estado` editable, ni trigger, ni `fachada_estado_historial`. Un estado manual chocaría con el calculado y rompería tests. (a) `sin_evaluar` se deriva de la nueva columna `fachadas.evaluada_en date`: si es null y no hay intervenciones, la fachada está sin evaluar. (b) El **modo antes** se calcula con la misma función a la fecha de inicio de temporada. El estado de cada intervención a esa fecha se infiere de sus fechas (`termino ≤ D` → terminada; `inicio ≤ D` → en ejecución; si no → programada). No se necesita historial. (c) El botón «Cambiar estado» se cambia por **«Marcar como evaluada»** y **«Programar intervención»**. |
| 8 | **"Intervenida"** | **Ok.** `conteosEstado()` ya define `intervenidas = al_dia + en_ejecucion`. | Ok, sin cambios. |
| 9 | **Roles** | Gerente = `modulo_permisos.puede_editar` del módulo `trabajos` (lo usa `page.tsx`). RLS de Fachadas: insert y update para admin, pablo y asistente; delete para admin y pablo; select para los 5 roles. | Ok. "Solo gerente" = `puedeEditar`. Las tablas nuevas copian el bloque RLS de `20261005120000_fachada_archivos.sql`. |
| 10 | **Acceso de socios** | El repo **ya tiene el patrón (a)**: `/informe-seguro/[token]`. Usa un token de ≥32 caracteres y `token_activo`, publica versiones como snapshot `jsonb`, lee con `createAdminClient()` y firma URLs de R2 por 2 horas. La ruta queda fuera de `isProtectedDashboardPath`. | **Opción (a)**, copiando ese patrón: tabla `fachadas_reportes` con token, versiones publicadas como snapshot (solo agregados, sin arrendatarios ni documentos) y la página `/reporte-fachadas/[token]`. Ojo: las fotos de `fachadas/` hoy se sirven con `R2_PUBLIC_URL` (son URLs públicas con UUID). En el reporte público se usan **URLs firmadas**, igual que en el informe. **Pregunta 4** (caducidad). |
| 11 | **Medios** | **Ya existe casi todo.** El uploader `useColaSubida` hace PUT presignado directo a R2. Las fotos se comprimen con `reducirImagenMaxLado()`, el póster de video sale de `miniaturaDesdeVideo()` y el límite de video es 200 MB (`cola-subida.ts`). `autorizarCarpeta` valida los prefijos `fachadas/`. Falta guardar la duración: el código la calcula y la descarta. | Las fotos y videos "generales" antes/después van en **`fachada_archivos`** (ya es por fachada, sin intervención), con una columna nueva `momento ('antes'\|'despues')`. La destacada reutiliza `es_portada`, cambiando el índice único a `(fachada_id, momento)`. Los 10 archivos actuales quedan en `'antes'`. **No** crear `fachada_medios`. `fachada_media` (por intervención) se conserva y no se borra, pero la ficha deja de mostrarla separada. |
| 12 | **PDF** | **Ya existe** `BotonImprimirInforme` (`window.print`) en el informe del seguro. | Ok: usar `window.print()` con CSS de impresión. No hace falta una librería. |
| 13 | **Código existente** | Ruta real: `/trabajos/fachadas/[categoriaId]/[subtipoId]`, vía rewrite `beforeFiles` en `next.config.ts` desde `/trabajos/c/…/s/58af02ea…`. Ya existen `DashboardFachadas.tsx` (906 líneas, con KPIs, tabs, la grilla «Estado de las N fachadas» y la tabla), `DetalleFachadaVista.tsx`, `ComparadorAntesDespues.tsx` (por intervención, con subida), `ReporteDirectorio.tsx` (con login), `ZonaFotos`, `GaleriaEstadoFachada` y `ChipEstadoFachada`. shadcn (`base-nova`) solo trae button, dialog, input, label, select, sonner, table y textarea: **no hay** sheet, tooltip ni tabs. **No hay** librería de zoom ni de comparador. | Reutilizar y modificar esos componentes; no crear paralelos. Zoom **sin librería nueva**: `viewBox` en estado más pointer events (el repo prohíbe dependencias no pedidas). La ficha **sigue siendo la ruta** `/f/[fachadaId]`: es enlazable, móvil y ya tiene tests. No se convierte en un Sheet; la tarjeta flotante del plano da la vista rápida. |
| 14 | **Colores y tipografía** | Tipografía de la app: **Manrope + JetBrains Mono** (`layout.tsx`), no Geist. L/R/P/H en `src/lib/fachadas/ui.ts`: sky-600 / orange-500 / violet-600 / slate-600. Colores de estado actuales: en ejecución **teal** `#148a84`, requiere `#9b1b2e`. Rojo marca `#e30613` ✓. | Tipografía: mandan Manrope y JetBrains Mono. L/R/P/H: mandan los de `ui.ts`. Estados: manda **la paleta aprobada del diseño** (azul para en ejecución), reemplazando `COLOR_ESTADO_CALC` y `COLOR_CELDA_ESTADO` en `ui.ts` como fuente única. |

### 1.2 Otros choques encontrados

1. **Error de datos en `fachadas-v2.json`.** `s1-local-4-f1/f2` y `s1-local-5-f1/f2` tenían `unidad_ids: ["s2-local-4"]` y `["s2-local-5"]`, que son locales del **Sitio 2**. Lo corregí a `s1-local-4` y `s1-local-5`. Usar el `fachadas-v2.json` corregido que adjunto.
2. **Lista de "eliminadas" ambigua.** El §2 dice que no se dibujan `s2-bodega-s6-f2`, `s2-oficina-10-f1` y `s2-bodega-6-f1`, pero la v2 **sí** tiene polylines con esos mismos ids. Son otros muros, renumerados. Esa lista son **ids v1**. Hay 19 svg_id v2 que reutilizan el texto de un id v1 con otro significado (por ejemplo, el `s2-bodega-s5-f1` de la v2 es el `s2-bodega-s5-f2` de la v1). Como no hay ids v1 guardados en prod, no hay riesgo real. El criterio de aceptación debe decir "69 polylines y ninguna de Bodega 7 u 8", no "ningún id de la lista".
3. **viewBox.** El SVG v2 dice `0 0 1594 945`, mientras que el traspaso y `Plano.dc.html` usan `930`. El contenido termina en y=916, así que no se corta nada, pero el tooltip calcula % con 930. Fuente de verdad: **945** (el archivo).
4. **Texto incorrecto en el reporte.** «Cada línea es un muro exterior» es falso: 51 de 69 son interiores. Cambiarlo a «Cada línea es un muro del centro».
5. **Hojalatería no es un "tipo" de intervención.** `fachada_intervencion_tipos` solo acepta limpieza, reparación y pintura. Hojalatería es `requiere_hojalateria` más documentos de categoría `hojalateria`. `trabajosRealizados()` ya reparte así los montos L/R/P/H. No inventar una tabla ni un tipo nuevo.
6. **Costos.** El diseño muestra MO y materiales por intervención como dos números simples. En el repo salen de `costoNetoIntervencion()`: documentos aprobados o facturados más materiales. Usar esa función tal cual.
7. **Datos de ejemplo.** La demo `/trabajos/fachadas/demo`, con `demo-datos.ts` y sus tests, es intencional y debe seguir pasando. La regla "nada de datos de ejemplo" aplica a los componentes reales, no a la demo.
8. **Aislamiento.** `src/lib/fachadas/aislamiento-rutas.test.ts` exige que la página compartida de subtipos no importe nada de Fachadas. `<PlanoFachadas>` va en `src/components/fachadas/`.
9. **Reglas del repo** (`docs/HANDOFF.md`): rama `cursor/<nombre>-6302`, un PR draft por tarea y **nunca** aplicar SQL en prod ni mergear sin OK explícito. Las migraciones van con scripts `apply`/`verificar`/`rollback` en `scripts/`. Estilos solo bajo `.fachadas-scope`. Usar `hoyIsoChile()` y `asMedidaNullable()`.

### 1.3 Móvil (§8 bis) contra lo que ya existe

El PR #16 ya dejó una vista móvil de Fachadas. Buena parte de §8 bis se resuelve **extendiendo** esa base, no partiendo de cero.

| Requisito §8 bis | Qué hay en el repo | Decisión |
|---|---|---|
| Breakpoint `md` (768 px) | **Ok.** `fachadas.css` ya usa `@media (max-width: 767px)` y los componentes usan `max-md:`. | Mantener. Todo lo nuevo usa `max-md:` / `md:` bajo `.fachadas-scope`. |
| Orden de secciones en la vista principal | `fachadas.css` fija un orden distinto (`fd-dash-filtros`, `-kpis`, `-venc`, `-mapa`, `-antes`, `-lista`). | **Cambia** al orden del diseño: tabs → KPIs → plano → Todas las fachadas → Próximos vencimientos → Trabajos realizados y Quién ejecutó. |
| Bottom sheet al tocar una fachada | No hay componente de sheet ni librería de drawer. Sí hay `components/ui/dialog.tsx` (base-ui, con foco y escape). | Construir el bottom sheet sobre ese `Dialog`, posicionado abajo en móvil. **No** agregar `vaul` ni otra dependencia. |
| Plano compacto, «Ampliar» al 230 % y pinch | — | Ampliar = contenedor con `overflow-x: auto` y ancho 230 %. El pinch usa el mismo zoom por `viewBox` de la Fase 1. Es el único scroll horizontal permitido, junto con los chips. |
| Líneas «más gruesas (8 px)» en el plano compacto | **Choque:** en `Plano.dc.html` el grosor está en unidades del `viewBox` (1594 de ancho). A 360 px, 8 unidades se ven como ~2 px, y una hit-area de 20 unidades mide ~5 px, imposible de tocar. | Grosores en píxeles de pantalla con `vector-effect: non-scaling-stroke`. Tocar elige la fachada **más cercana** al dedo (hasta 22 px), así las vecinas no se pisan. |
| Tabla → tarjetas por local | La tabla actual ya tiene `overflow-x` en móvil. | En móvil se reemplaza por tarjetas. Ambas vistas salen de la misma función de filas agrupadas por unidad: un solo cálculo y dos renders. |
| Botón fijo «Registrar intervención» en la vista principal | **Choque:** hoy una intervención solo se crea desde la ficha (`crearIntervencion(fachadaId)` en `DetalleFachadaVista`). Desde el dashboard no se sabe para qué fachada es. | Agregar un paso previo **«¿En qué fachada?»**: pantalla completa con buscador y la lista agrupada, o tocar la fachada en el plano. Después crea la intervención y abre el formulario. Lo mismo vale para el botón de escritorio. |
| Ficha a pantalla completa, con barra superior y barra de acciones fijas | La ficha ya es una ruta propia (`/f/[fachadaId]`) y ya se reordena en móvil (`.fachadas-ficha`). | Ok, encaja con mantenerla como ruta (1.1, punto 13). Faltan la barra superior fija (volver de 44 px + título) y la barra de acciones fija abajo, con `env(safe-area-inset-bottom)`. |
| Pestañas ANTES / DESPUÉS con contador | — | En móvil, pestañas. En desktop, dos columnas. Mismo componente. |
| «Tomar o subir» con un solo `<input … capture>` | **Ya existe** `BotonesCapturaGaleria` (`ZonaFotos.tsx`) con **dos** inputs: cámara (`capture="environment"`) y galería (`multiple`). | **Cambia.** Un solo input con `capture` obliga a usar la cámara en Android y no deja elegir de la galería, así que no se podrían subir fotos tomadas antes. Se mantienen los dos botones existentes, «Cámara» y «Galería», con el texto «— antes» o «— después» según la pestaña. El criterio «la subida abre la cámara» se cumple con el botón Cámara. |
| Botón «Estado» en la barra de la ficha | — | Por la decisión 1.1, punto 7, abre un sheet con «Marcar como evaluada» y «Programar intervención». No hay cambio manual de estado. |
| Formularios en pantalla completa, teclado numérico y fecha nativa | **Ya existe.** `FormularioIntervencion` usa `.fd-modal-form`, que en móvil es pantalla completa. Las fechas son `type="date"` y los montos usan `inputMode="numeric"` / `"decimal"` (`CamposFormulario`). | Ok, reutilizar. No crear un `Drawer`. |
| Probar a 360 y 390 px | Ya están Playwright y pixelmatch, más `scripts/compare-fachadas-mobile.mjs` (capturas a 390 de `/dev/fachadas-mobile`). | Agregar `scripts/verificar-fachadas-movil.mjs`. Recorre 360 y 390 px y falla si: hay scroll horizontal de página (`scrollWidth > innerWidth`), algún control interactivo mide menos de 44×44, tocar una fachada no abre un `role="dialog"`, se ve la tabla en vez de las tarjetas o la barra de acciones no está fija. Corre contra páginas de `/dev/` que montan los componentes **reales** con datos de prueba. Esos datos viven solo en `src/app/dev/**` y en tests, nunca en los componentes. |

---

## Parte 2 · Preguntas para el gerente

Siguen abiertas las mismas cinco de la validación anterior; el paquete v3 no las responde. El móvil no agrega preguntas nuevas: todo lo de §8 bis se pudo decidir con el código.

1. **Temporada.** ¿La campaña se mide de **julio a junio** (el «Julio · inicio» del diseño) o por **año calendario**, como hoy en el dashboard? *Si no respondes, uso julio.*
2. **Superficies.** ¿Cargo los altos supuestos (7 m bodegas, 5 m locales, 3 m comunes) como dato provisorio, o dejo «Sin m²» hasta medir cada fachada? *Recomiendo dejarlo vacío.* Así el directorio no ve 7.735 m² inventados.
3. **Bordes inferiores del Sitio 2** (Local 1 y 2, Local 3, Local 4 y Local 5). ¿Dan a la Av. Pérez Zujovic, es decir, son **exteriores**? El plano v1 decía "circulación Sitio 2".
4. **Link para socios.** ¿El link de WhatsApp **no vence** y se apaga a mano, como el del informe del seguro, o vence a los **N días**?
5. **Espacios comunes.** ¿Está bien que taller, baños, bodega de maestros, oficina de administración y comedor aparezcan también en el módulo **Recintos** como «área común»?

---

## Parte 3 · Prompt para Cursor

> Pega desde aquí hasta el final. Antes, copia el paquete al repo:
> `docs/diseno/fachadas/v2/plano/plano-bodetek-v2.svg`, `docs/diseno/fachadas/v2/plano/fachadas-v2.json` (**el corregido**), `docs/diseno/fachadas/v2/diseno/*.dc.html` y `docs/diseno/fachadas/v2/datos/estados-ejemplo-mockup.json`.

```markdown
# Tarea: Fachadas v2 — plano interactivo, antes/después general y reporte para socios

## Contexto obligatorio (léelo antes de tocar nada)
- docs/HANDOFF.md (reglas de ramas, PR, migraciones en prod) y PROJECT.md §4.5–4.6.
- AGENTS.md: Next.js 16 no es el de tu entrenamiento. Lee node_modules/next/dist/docs/ antes de escribir.
- Fachadas YA EXISTE. Extiende, no dupliques: src/lib/fachadas/*, src/components/fachadas/*,
  src/app/(dashboard)/trabajos/fachadas/[categoriaId]/[subtipoId]/**.
- Diseño de referencia: docs/diseno/fachadas/v2/diseno/*.dc.html. Son SOLO referencia visual:
  traduce a Tailwind bajo `.fachadas-scope`; no copies estilos inline; `{{var}}`, <sc-for>, <sc-if>
  y los `const` del script son datos de ejemplo y NO van al código.
- Fuente de verdad geométrica: docs/diseno/fachadas/v2/plano/plano-bodetek-v2.svg (viewBox 0 0 1594 945)
  y fachadas-v2.json (69 fachadas).
- Tipografía: la de la app (Manrope / JetBrains Mono), no Geist.
- Colores L/R/P/H: los de src/lib/fachadas/ui.ts. Colores de ESTADO: los de la tabla de abajo
  (reemplazan COLOR_ESTADO_CALC y COLOR_CELDA_ESTADO en ui.ts, fuente única).
- Prohibido: dependencias nuevas, datos de ejemplo en componentes reales, importar Fachadas desde
  src/app/(dashboard)/trabajos/c/[categoriaId]/s/[subtipoId]/page.tsx, aplicar SQL en prod o mergear.
- Un PR draft por fase, rama `cursor/fachadas-v2-faseN-6302` desde origin/main.
  Cada fase cierra con `npm test` y `npm run build` en verde.

## Móvil: obligatorio en TODAS las fases de UI (1 a 5)
El gerente usa la sección en terreno desde el celular; los socios abren el reporte desde WhatsApp.
Referencias móviles: MainMovil.dc.html, FichaMovil.dc.html, ReporteMovil.dc.html (390 px).
- Breakpoint: < md (768 px) = layout móvil. Usar `max-md:` / `md:` bajo `.fachadas-scope`; el repo ya
  usa `@media (max-width: 767px)` en src/components/fachadas/fachadas.css, extiende ese bloque.
- Debe funcionar desde 360 px. Sin scroll horizontal de página: solo pueden scrollear en horizontal los
  chips de la leyenda y el plano ampliado.
- Áreas táctiles ≥ 44×44 px en botones, chips, filas, íconos y en la hit-area de cada fachada.
- Sin hover en táctil: tocar una fachada abre un BOTTOM SHEET (no tooltip). Construirlo sobre
  src/components/ui/dialog.tsx (base-ui), posicionado abajo, con role="dialog", foco atrapado y cierre con
  botón de 44 px, escape y tap en el fondo. No agregar vaul ni otra librería.
- Barras fijas inferiores con padding-bottom: env(safe-area-inset-bottom). El contenido deja espacio
  para que la barra no tape el último elemento.
- Formularios: reutilizar el modo pantalla completa existente (.fd-modal-form), fechas type="date"
  y montos con inputMode numeric/decimal (ya están en CamposFormulario). No crear Drawer.
- Subida desde el celular: reutilizar BotonesCapturaGaleria (ZonaFotos.tsx), que ya tiene dos inputs:
  «Cámara» (accept="image/*,video/*" capture="environment") y «Galería» (multiple). NO reemplazarlo
  por un único input con `capture`: en Android eso impide elegir fotos de la galería.

Verificación automática (se crea en la Fase 1 y cada fase agrega sus páginas):
- scripts/verificar-fachadas-movil.mjs (Playwright, ya está en devDependencies; ver el patrón de
  scripts/compare-fachadas-mobile.mjs). Recorre a 360 y 390 px las páginas /dev/fachadas-v2/* y falla si:
  (1) document.documentElement.scrollWidth > window.innerWidth;
  (2) algún elemento interactivo visible (a, button, [role=button], [role=tab], input, select, summary)
      mide < 44×44, salvo los marcados con data-tactil-exento y una razón;
  (3) tocar una fachada del plano no abre un [role="dialog"];
  (4) la tabla de fachadas está visible en vez de las tarjetas;
  (5) en la ficha, la barra de acciones no es position fixed/sticky al fondo.
  Deja capturas en docs/diseno/fachadas/v2/comparacion/ (gitignored si pesan).
- Páginas /dev/fachadas-v2/[[...vista]]: montan los componentes REALES con datos de prueba. Esos datos viven
  solo en src/app/dev/** o en tests. Responden 404 en producción; excluirlas del matcher del middleware
  igual que /dev/fachadas-mobile.
- Agregar script en package.json: "verify:fachadas:movil": "node scripts/verificar-fachadas-movil.mjs".

## Estados (derivados, nunca guardados a mano)
| estado | label | color | trazo plano (5.5) | trazo leyenda | badge bg / texto |
|---|---|---|---|---|---|
| requiere_trabajo | Requiere trabajo | #EF4444 | continuo | continuo | #FEECEB / #B42318 |
| programada | Programada | #EA8A0C | 16 9 | 8 5 | #FFF3E0 / #8A4B00 |
| en_ejecucion | En ejecución | #2563EB | 0.1 11, cap round | 0.1 6 | #EAF1FF / #1D4ED8 |
| al_dia | Al día | #166534 | continuo | continuo | #E8F5EC / #166534 |
| sin_evaluar | Sin evaluar | #9CA3AF | 6 8 | 3 4 | #F1F2F4 / #4B5563 |

---

## FASE 0 · Datos

Archivos:
- supabase/migrations/2026100XXXXXXX_fachadas_v2_plano.sql (+ supabase/rollback/..._down.sql)
- scripts/aplicar-fachadas-v2-commit.{sh,sql}, scripts/verificar-fachadas-v2.sql,
  scripts/aplicar-fachadas-v2-rollback.sql (mismo patrón que aplicar-fachada-archivos-*)
- supabase/seed-fachadas-v2.sql generado por scripts/generar-seed-fachadas-v2.mjs desde fachadas-v2.json
- src/lib/fachadas/tipos.ts, mapear.ts, cargar.ts (leer columnas nuevas)

Migración (aditiva, sin borrar nada):
1. `fachadas`: add `svg_id text unique`, `ubicacion text check in ('interior','exterior')`,
   `tipo_espacio text check in ('unidad','compartida','espacio_comun','perimetro')`,
   `unidad_label text`, `orden integer`, `largo_plano_m numeric(12,2)`, `evaluada_en date`.
   Mantener el unique (recinto_id, nombre) existente.
2. Tabla `fachada_recintos (fachada_id uuid fk on delete cascade, recinto_id uuid fk on delete cascade,
   primary key (fachada_id, recinto_id))`. `fachadas.recinto_id` = primera unidad (compatibilidad).
3. `fachada_archivos`: add `momento text not null default 'antes' check in ('antes','despues')`,
   `duracion_seg integer`. Reemplazar índice único `fachada_archivos_portada_unica` por uno parcial en
   `(fachada_id, momento) where es_portada`. Las 10 filas existentes quedan 'antes'.
4. Tabla `fachadas_reportes` (copiar el patrón de informes_seguro / informe_seguro_versiones):
   `token text unique check length>=32`, `token_activo bool default false`, `token_expira date null`,
   versiones publicadas con `contenido jsonb` (snapshot de agregados; sin arrendatarios ni documentos).
   Sin policy de UPDATE en versiones; revocar grants por defecto como en 20261006120000.
5. RLS de tablas nuevas: copiar el bloque DO $$ de 20261005120000_fachada_archivos.sql.
6. `recintos`: insertar 5 filas `tipo='area_comun'`: Taller de maestros (sitio 1), Baños comunes (1),
   Comedor (1), Bodega de maestros (2), Oficina administración (2). Acceso y Cierre Huasco NO son recintos.

Seed (idempotente, upsert por svg_id):
- Mapear unidad_ids → recintos por (sitio, codigo): s1-bodega-1a→(1,'1A'); s1-local-2-3→(1,'LOCAL 2 Y 3');
  s2-bodega-s5→(2,'S5'); s2-recinto-4→(2,'4'); s2-oficina-10→(2,'10'); s2-local-1-2→(2,'LOCAL 1 Y 2'), etc.
- La fila existente id 95c58c33-5034-4403-977b-6bd04efb4310 se ACTUALIZA a svg_id 's1-local-1-f1',
  nombre 'Local 1 · Fachada 1' (el nombre anterior va a `notas`). Conserva sus archivos e intervención.
- ancho_m = largo_m_aprox; largo_plano_m = largo_m_aprox; alto_m y superficie_m2 = NULL
  (no cargar los supuestos de 7/5/3 m salvo que el gerente lo pida).
- evaluada_en = NULL en todas.

Criterios de aceptación:
- [ ] `select count(*) from fachadas where svg_id is not null` = 69; `count(*) from fachadas` = 69 (no 70).
- [ ] 18 `ubicacion='exterior'`, 51 'interior'; 55/4/6/4 por tipo_espacio (unidad/compartida/espacio_comun/perimetro).
- [ ] Ninguna fachada vinculada a recintos de Bodega 7 u 8 (sitio 2, códigos '7' y '8').
- [ ] s1-local-4-f1 está vinculada al recinto (1,'LOCAL 4'), no al de sitio 2.
- [ ] Las 4 compartidas tienen ≥2 filas en fachada_recintos; s2-frente-iquique-f1 tiene 5.
- [ ] fachada_archivos sigue en 10 filas, todas momento='antes'; la intervención existente sigue intacta.
- [ ] Tablas fuera de Fachadas: mismos conteos que antes (baseline del HANDOFF).
- [ ] Rollback escrito y NO ejecutado. NO aplicar en prod: mostrar SQL y esperar OK.

---

## FASE 1 · `<PlanoFachadas>`

Archivos:
- src/components/fachadas/plano/PlanoFachadas.tsx ("use client")
- src/components/fachadas/plano/geometria.ts: unidades, espacios comunes y polylines del SVG v2
  como datos TS tipados, generados por scripts/generar-geometria-plano.mjs desde el SVG. No pegar a mano.
- src/lib/fachadas/plano.ts: puntoMedioPolilinea(), estiloEstado(), lógica pura del tooltip.
- src/lib/fachadas/plano.test.ts (agregar al script `test` de package.json).
- src/components/fachadas/plano/HojaFachada.tsx: bottom sheet móvil sobre ui/dialog.tsx.
- src/app/dev/fachadas-v2/[[...vista]]/page.tsx con la vista "plano" (excluida del middleware como
  /dev/fachadas-mobile; 404 en prod).
- scripts/verificar-fachadas-movil.mjs + script npm "verify:fachadas:movil" (ver sección Móvil).

Requisitos:
- Props: `modo: 'hoy'|'antes'|'vacio'`, `estados: Record<svgId, EstadoPlano>`, `filtro?`, `resaltar?`,
  `variante: 'completo' | 'movil' | 'mini'`, `ampliado?`, `onPick?(svgId)`.
  El componente NO consulta Supabase: recibe estados ya calculados.
  · completo (desktop): línea 5.5, hover con tooltip, controles + / − / encuadre (44 px).
  · movil (vista principal < md): línea más gruesa (ver «Grosores»), sin tooltip ni controles flotantes. `ampliado` pone el SVG
    al 230 % de ancho dentro de un contenedor overflow-x:auto. Pinch-zoom con 2 pointers.
  · mini (ficha y reporte compacto): sin controles ni interacción salvo resaltar.
- SVG renderizado como JSX desde geometria.ts (no dangerouslySetInnerHTML).
- Cada fachada = 2 polylines: visible (color/dash por estado, pointer-events none, linejoin round)
  + hit-area transparente 20px con hover/click/teclado (role="button", tabIndex, aria-label = nombre + estado).
- Hover (desktop): grosor 5.5 → 10 px; tooltip negro anclado al punto medio a lo largo de la polilínea;
  hacia abajo en el 30% superior; corrido a los lados cerca de los bordes; % calculado con viewBox 945.
- Táctil (pointerType 'touch' o variante movil): tocar = seleccionar + abrir <HojaFachada> con nombre,
  badge de estado, «Exterior/Interior · hacia X · m²», fecha de la última intervención y botón
  «Abrir ficha» (48 px). Un arrastre o pinch NO cuenta como toque (umbral de 8 px).
- Grosores en PÍXELES DE PANTALLA, no en unidades del viewBox: a 360 px el plano escala ~0,23, así que
  un stroke de 8 unidades se vería de ~2 px. Usar vector-effect="non-scaling-stroke" en las polylines
  visibles y en las hit-areas. Visibles: 5.5 px (completo), 4 px (movil y mini; resaltada 8 px).
- Selección táctil por cercanía: en variante movil, un toque elige la fachada cuya polilínea esté más
  cerca del punto tocado (distancia punto-segmento calculada en coordenadas del viewBox y convertida a
  px de pantalla), si está a ≤ 22 px. Así las fachadas vecinas no se pisan, aunque sus hit-areas de
  44 px se superpongan. Función pura `fachadaMasCercana(punto, escala)` en src/lib/fachadas/plano.ts, con test.
  «Ampliar» sigue siendo el camino para las fachadas muy cortas.
- Filtro: las que no coinciden a opacidad 0.14. Resaltar: el resto a 0.4 (mini: 0.16).
- Zoom sin librerías: botones + / − / encuadre completo (44px) cambiando el viewBox; pan con arrastre;
  pinch con 2 pointers (touch-action: none solo sobre el SVG mientras hay zoom > 1, para no bloquear
  el scroll vertical de la página).
- Espacios comunes en relleno #DCDFE4 con rótulo; base en grises; solo las fachadas tienen color.

Criterios:
- [ ] El plano dibuja exactamente 69 fachadas (69 polylines visibles + 69 hit-areas) y ninguna sobre Bodega 7 u 8.
- [ ] El taller es una polyline cerrada (círculo aproximado), no un <circle>.
- [ ] Test: puntoMedioPolilinea de 's2-bodega-s1-f1' cae sobre el tramo correcto (no en el promedio de vértices).
- [ ] Navegable con teclado (Tab + Enter abre); contraste del tooltip AA.
- [ ] `aislamiento-rutas.test.ts` sigue verde.

Criterios móviles (npm run verify:fachadas:movil a 360 y 390 px, sobre /dev/fachadas-v2/plano):
- [ ] Sin scroll horizontal de página; con «Ampliar» el scroll horizontal ocurre solo dentro del contenedor del plano.
- [ ] Tocar una fachada abre el bottom sheet (role="dialog") con «Abrir ficha» de ≥ 44 px; cerrar devuelve el foco.
- [ ] Ningún tooltip aparece en táctil.
- [ ] Tocar a menos de 22 px de una fachada corta (p. ej. s2-local-1-2-f1) la selecciona a ella y no a la vecina (test de fachadaMasCercana).
- [ ] Arrastrar el plano ampliado no abre el sheet; el scroll vertical de la página sigue funcionando con el plano a 100 %.
- [ ] Controles del plano y botón Ampliar ≥ 44×44.

---

## FASE 2 · Vista principal

Modificar (no reescribir desde cero): src/components/fachadas/DashboardFachadas.tsx, src/lib/fachadas/dashboard.ts,
src/lib/fachadas/indicadores.ts, src/lib/fachadas/ui.ts, src/lib/fachadas/cargar.ts.
Nuevos: src/lib/fachadas/temporada.ts (+ test), src/lib/fachadas/estado-a-fecha.ts (+ test),
src/components/fachadas/ListaFachadasAgrupada.tsx (tabla en desktop, tarjetas en móvil),
src/components/fachadas/ElegirFachada.tsx (paso previo a «Registrar intervención»),
src/components/fachadas/fachadas.css (bloque max-width 767px: nuevo orden de secciones).

Lógica:
- `inicioTemporada(hoy)`: constante MES_INICIO_TEMPORADA (julio salvo respuesta del gerente).
  El Select de temporada pasa de año calendario a temporada.
- `estadoPlano(fachada, intervenciones, hoy)`: 'sin_evaluar' si evaluada_en es null Y no tiene
  intervenciones; si no, estadoCalculadoFachada() existente.
- `estadoAFecha(fachada, intervenciones, D)`: filtra intervenciones con created_at ≤ D, infiere su estado
  en D por fechas (termino ≤ D → terminada; inicio ≤ D → en_ejecucion; si no → programada) y llama
  estadoCalculadoFachada con hoy = D. Alimenta «Ver como antes». Sin tabla de historial.
- KPIs y paneles: reutilizar conteosEstado (intervenidas = al_dia + en_ejecucion), superficieDashboard,
  trabajosRealizados, quienEjecuto, proximosVencimientos. Los 5 KPIs reaccionan al tab de ejecutor.
  Vencimientos: naranjo si diasHasta ≤ 30.

UI (referencia Main.dc.html):
- Encabezado con subtítulo «69 fachadas en 2 sitios (18 exteriores, 51 interiores)» calculado, no fijo.
  «Reporte al directorio» (secundario) + «Registrar intervención» (rojo, solo puedeEditar).
- «Registrar intervención» desde la vista principal: hoy una intervención solo se crea desde la ficha
  (crearIntervencion(fachadaId) en DetalleFachadaVista). Agregar <ElegirFachada>: pantalla completa en
  móvil / dialog en desktop, con buscador y la lista agrupada por unidad (también se puede elegir tocando
  el plano). Al elegir: crearIntervencion(fachadaId) y abrir el formulario existente.
- REEMPLAZAR la grilla «Estado de las N fachadas» por: toggle «Ver como antes · {inicio}» / «Ver hoy»,
  chips de leyenda con conteos que filtran + «Mostrar todas», y <PlanoFachadas>.
- Click en fachada → tarjeta flotante: nombre, badge de estado (color + trazo + texto), m² o «Sin m²»,
  última intervención, «Exterior/Interior · hacia X», botón «Abrir ficha completa» (link a fachadaHref).
- Tabla «Todas las fachadas»: columnas Local/unidad (sitio debajo, solo en la 1ª fila del grupo) ·
  Fachada · Tipo (Exterior = badge negro, Interior = badge borde) · Hacia · m² · Estado ·
  Última intervención · Costo neto. Orden por unidad_label y orden. Buscador + segmentado
  «Todas · 69 / Exteriores · 18 / Interiores · 51» (conteos calculados).
  Una sola función agrupa las filas por unidad; desktop la pinta como tabla y móvil como tarjetas.

UI móvil < md (referencia MainMovil.dc.html):
- Encabezado compacto: «Trabajos / Imagen», título «Fachadas» y botón «Reporte» (44 px).
- Tabs de ejecutor en grilla de 3 columnas: Todos / Maestros / Externos.
- KPIs: «Fachadas intervenidas» a todo el ancho (con barra y nota «N al día · M en obra»); los otros 4 en 2×2.
- Plano: toggle «Como antes · {inicio}» / «Hoy» a 2 columnas; chips de leyenda con scroll horizontal
  (44 px de alto); <PlanoFachadas variante="movil">; botón «Ampliar» / «Reducir» (aria-pressed) que
  activa `ampliado`; texto de ayuda «Toca un muro para ver su detalle. Usa «Ampliar» o pellizca para acercar.»
- Orden debajo del plano: Todas las fachadas → Próximos vencimientos → Trabajos realizados y Quién
  ejecutó (una sola tarjeta). Reemplazar el orden actual de fachadas.css (fd-dash-*).
- «Todas las fachadas» como TARJETAS POR LOCAL: cabecera con unidad + sitio; filas con Fachada, badge
  Exterior/Interior, «Hacia X · m²» («Sin m²» si null), badge de estado y chevron. Toda la fila es un
  link de ≥ 44 px a la ficha. Buscador (44 px, font-size ≥ 16 px para que iOS no haga zoom) y segmentado
  a 3 columnas. Mostrar los primeros 6 grupos y «Ver las 69 fachadas» para expandir (no paginar en servidor).
- Botón fijo abajo «Registrar intervención» a todo el ancho, rojo, 52 px, solo puedeEditar (abre <ElegirFachada>).
  Sin puedeEditar no se renderiza y el contenido no reserva el espacio.

Criterios:
- [ ] Con la base actual (1 fachada con datos), el plano muestra 1 fachada con su estado real y 68 'sin_evaluar'.
- [ ] Ningún número del encabezado, KPI, leyenda ni segmentado está escrito a mano en el código.
- [ ] «Ver como antes» con D = inicio de temporada no muestra 'al_dia' en fachadas cuya única intervención terminó después de D (test).
- [ ] Los tabs Maestros/Externo cambian KPIs y paneles (test de dashboard.ts).
- [ ] Ya no existe la grilla de cuadraditos.
- [ ] «Registrar intervención» desde la vista principal pide la fachada antes de crear la intervención.

Criterios móviles (verify:fachadas:movil a 360 y 390 px, sobre /dev/fachadas-v2/main con y sin puedeEditar):
- [ ] Sin scroll horizontal de página; solo scrollean en horizontal los chips y el plano ampliado.
- [ ] La tabla no se ve; se ven las tarjetas por local, y cada fila abre la ficha.
- [ ] Tocar una fachada abre el bottom sheet; «Abrir ficha» navega a la ficha.
- [ ] Tabs, toggle, chips, segmentado, filas y botón fijo miden ≥ 44 px de alto (los chips del diseño miden 40: subirlos a 44).
- [ ] El botón fijo no tapa la última tarjeta ni el panel «Trabajos realizados».
- [ ] El orden de secciones es: tabs, KPIs, plano, Todas las fachadas, Próximos vencimientos, Trabajos/Quién.

---

## FASE 3 · Ficha

Modificar: src/app/(dashboard)/trabajos/fachadas/[categoriaId]/[subtipoId]/f/[fachadaId]/page.tsx,
src/components/fachadas/DetalleFachadaVista.tsx, ComparadorAntesDespues.tsx, GaleriaEstadoFachada.tsx,
src/lib/fachadas/upload.ts (subirArchivoEstadoFachada recibe `momento` y guarda `duracion_seg`),
src/lib/fachadas/guardar.ts (marcarPortadaArchivoEstado por momento; marcarEvaluada).
Sigue siendo ruta completa (no Sheet), con columna central de ~720px en desktop y pantalla completa en móvil.

Secciones (Ficha.dc.html):
1. Encabezado: ruta con svg_id, «Unidad · Fachada N», badge Interior/Exterior + «Hacia …», badge de
   estado con texto, Largo / Alto / Superficie («Sin m²» si null), <PlanoFachadas variante="mini" resaltar>.
2. «Fotos y videos», UNA sola sección: <ComparadorAntesDespues> arriba (solo fotos, usa la destacada
   de cada momento o la más reciente; input range con aria-label, clip-path inset). Debajo dos bloques
   ANTES y DESPUÉS desde fachada_archivos: botón «Subir» (fotos y videos, reutiliza useColaSubida),
   contador «5 fotos · 1 video», grilla 3×N, play + duración en videos, estrella + borde negro en la destacada.
3. Intervenciones: línea de tiempo con letra de color, tipo, fechas, chips de ejecutor, MO / materiales /
   neto (costoNetoIntervencion), nota. SIN fotos. Arriba: total neto de la fachada y $/m².
4. Próximos vencimientos (proximasPorTipo).
5. Documentos: fachada_documentos de todas sus intervenciones + plano_key.
6. Barra fija de acciones (solo puedeEditar): «Registrar intervención», «Subir fotos o videos»,
   «Marcar como evaluada» (si evaluada_en es null) y «Programar intervención».

UI móvil < md (referencia FichaMovil.dc.html):
- Pantalla completa (ya es una ruta; no es un sheet). Barra superior sticky de 56 px: volver (44 px,
  aria-label «Volver a Fachadas», vuelve a la vista principal conservando filtros vía query string) +
  título truncado «Unidad · Fachada N».
- Encabezado a una columna; Largo / Alto / Superficie en 3 columnas; mini-plano a todo el ancho
  (<PlanoFachadas variante="mini" resaltar>).
- Fotos y videos: comparador de 240 px de alto; PESTAÑAS ANTES / DESPUÉS (role=tab, 44 px) con su
  contador «5 fotos · 1 video»; grilla de 3 columnas con miniaturas cuadradas (aspect-ratio 1/1) que abren
  el lightbox existente (components/media/MediaLightbox.tsx); debajo, BotonesCapturaGaleria con los textos
  «Cámara — antes|después» y «Galería — antes|después» según la pestaña activa. La subida usa el
  `momento` de la pestaña activa. Marcar destacada desde el lightbox (botón estrella ≥ 44 px).
- Intervenciones: tarjetas apiladas (letra de color, tipo, neto, «fechas · ejecutor», «MO · Materiales», nota).
- Barra de acciones fija abajo (safe-area): «Registrar intervención» (rojo, flex 1, 52 px) + dos botones
  de ícono con texto de 56×52: «Subir» (abre la cámara/galería de la pestaña activa) y «Estado» (abre un
  sheet con «Marcar como evaluada» y «Programar intervención»; NO existe cambio manual de estado).
- Formulario de intervención: el existente, en pantalla completa (.fd-modal-form).

Criterios:
- [ ] En la ficha no existe un selector de fotos por intervención ni por tipo de trabajo.
- [ ] Marcar una foto como destacada en ANTES no desmarca la de DESPUÉS (índice por momento).
- [ ] Un video nunca aparece en el comparador.
- [ ] La fachada 95c58c33… muestra sus 10 archivos en ANTES y su intervención en la línea de tiempo.
- [ ] Sin puedeEditar no se renderiza la barra de acciones.

Criterios móviles (verify:fachadas:movil a 360 y 390 px, sobre /dev/fachadas-v2/ficha y en un celular real):
- [ ] La ficha ocupa la pantalla completa; la barra superior queda fija al hacer scroll y «volver» mide 44×44.
- [ ] La barra de acciones es fija al fondo, respeta safe-area y no tapa el último documento.
- [ ] En móvil se ven pestañas ANTES/DESPUÉS (no dos columnas); cambiar de pestaña cambia grilla, contador y destino de la subida.
- [ ] «Cámara» abre la cámara trasera (input con capture="environment") y «Galería» permite elegir varios archivos; en Android y iOS reales.
- [ ] Una foto subida desde la pestaña DESPUÉS queda con momento='despues' (test de upload.ts).
- [ ] Sin scroll horizontal; miniaturas cuadradas en 3 columnas a 360 px; todo control ≥ 44 px.

---

## FASE 4 · Reporte al directorio

Archivos:
- src/app/reporte-fachadas/[token]/page.tsx (public, dynamic, robots noindex, referrer no-referrer;
  fuera de isProtectedDashboardPath; mismo esquema que src/app/informe-seguro/[token]/page.tsx).
- src/lib/fachadas/reporte/{snapshot.ts, publicar.ts, cargarPublico.ts, firmar.ts}: reutilizar
  src/lib/informe-seguro/firmar.ts (TTL 2h) en vez de duplicarlo.
- Modificar src/components/fachadas/ReporteDirectorio.tsx y la ruta /reporte (vista con login) para
  usar el mismo snapshot; botones «Publicar versión», «Copiar enlace para WhatsApp», «Desactivar enlace».

Contenido del snapshot (solo agregados): conteos por estado hoy y en inicio de temporada, m² intervenidos
y totales (con «calculado sobre M de N»), total neto, $/m², maestros vs externos, L/R/P/H, estado por svg_id,
4–6 pares antes/después destacados (keys, no URLs), «Próximo mes» (texto que escribe el gerente al publicar).
Nunca: arrendatario_actual, documentos, proveedores, montos por contrato.

UI (Reporte.dc.html / ReporteMovil.dc.html):
- Bloque de avance verde menta (#DCF5E5, borde #B7E8C8, texto #0B3D24, cifra #15803D):
  «X de 69 fachadas ya están recuperadas» (recuperada = al_dia), barra apilada sobre riel blanco
  (requiere = #F6B3B3, sin evaluar = #C3CBD4), tres cifras.
- «Así se ve el centro»: plano grande + toggle inicio/hoy + leyenda. Texto: «Cada línea es un muro del centro».
- «Antes y después»: grilla 2×2 en desktop; carrusel 1 a 1 en móvil.
- «Inversión», «Próximo mes», pie «Montos netos, sin IVA · Datos al {fecha}».
- @media print: ocultar botones, break-inside: avoid; «Exportar PDF» = window.print().

Criterios:
- [ ] Sin sesión, /reporte-fachadas/{token activo} responde 200; token inactivo o inexistente → 404 (mismo resultado).
- [ ] El HTML público no contiene ningún valor de recintos.arrendatario_actual (test sobre el snapshot).
- [ ] Las imágenes del público son URLs firmadas, no R2_PUBLIC_URL.
- [ ] Editar datos después de publicar no cambia el link hasta «Publicar versión».
- [ ] La impresión no corta tarjetas.
- [ ] Recordatorio: SUPABASE_SERVICE_ROLE_KEY ya está en Production y Preview (lo usa el informe).
- [ ] La página pública define metadata Open Graph sin datos sensibles (título «Fachadas Bodetek · avance»
      y fecha) para que la vista previa de WhatsApp se vea bien.

UI móvil < md (referencia ReporteMovil.dc.html): encabezado BODETEK + «Descargar PDF»; bloque verde con
titular a 34 px; plano <PlanoFachadas variante="movil"> con toggle Julio/Hoy a 2 columnas y «Pellizca o usa +
para ampliar. Toca un muro para ver su estado.»; leyenda en lista; «Antes y después» como carrusel 1 a 1
con flechas de 44 px y puntos; Inversión en 2 columnas; Próximo mes en lista.

Criterios móviles (verify:fachadas:movil a 360 y 390 px, sobre /dev/fachadas-v2/reporte y /reporte-fachadas/{token de prueba}):
- [ ] Sin scroll horizontal de página.
- [ ] El carrusel muestra un comparador a la vez; flechas y puntos funcionan; el slider del comparador se arrastra con el dedo sin mover el carrusel.
- [ ] Tocar una fachada del plano abre el bottom sheet (en el reporte, sin botón «Abrir ficha»: los socios no tienen acceso a la ficha).
- [ ] Abierto desde el navegador interno de WhatsApp (iOS y Android) carga sin login y las fotos se ven.

---

## FASE 5 · Estados vacíos y pulido

- Vacíos (Vacios.dc.html): ficha sin fotos (dos zonas Subir + tip de encuadre fijo), ficha sin intervenciones
  (L R P H + «Registrar intervención» / «Programar»), inicio de temporada (plano modo 'vacio', «0 de 69
  evaluadas», «Empezar evaluación» = lleva a la primera fachada sin evaluar).
- Accesibilidad: estados distinguibles sin color (trazo + texto), foco visible, aria en toggles (aria-pressed)
  y tabs (role=tab/aria-selected), objetivos táctiles ≥ 44px.
- Rendimiento: miniaturas (thumbnail_key) en grillas; el original solo en comparador/lightbox; loading="lazy";
  videos con preload="metadata".
- Actualizar docs/HANDOFF.md (migración, seed, ruta pública) y PROJECT.md §4.5.

Criterios:
- [ ] npm test y npm run build en verde; Lluvias sigue respondiendo 307 sin sesión (no 500).
- [ ] La demo /trabajos/fachadas/demo y sus tests siguen pasando.

Criterios móviles (verify:fachadas:movil a 360 y 390 px, sobre /dev/fachadas-v2/vacios):
- [ ] Ficha sin fotos: en móvil, las dos zonas se muestran como pestañas, y «Cámara» / «Galería» quedan visibles sin scroll horizontal.
- [ ] Ficha sin intervenciones: «Registrar intervención» y «Programar» apilados a todo el ancho, ≥ 44 px.
- [ ] Inicio de temporada: el plano en modo 'vacio' y «Empezar evaluación» caben en 360 px.
- [ ] El script completo (todas las páginas /dev/fachadas-v2/*) pasa en verde; se adjuntan capturas a 360 y 390 al PR.
```

---

## Archivos de esta entrega

- **`fachadas-v2.json` corregido.** Reemplaza al del paquete. Incluye el arreglo de `s1-local-4` y `s1-local-5`.
- **Este documento** (reemplaza a `fachadas-v2-validacion-y-prompt-cursor.md`).
