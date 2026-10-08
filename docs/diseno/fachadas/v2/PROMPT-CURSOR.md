# Tarea: Fachadas v2 — plano interactivo, antes/después general y reporte para socios

## Contexto obligatorio (léelo antes de tocar nada)
- docs/diseno/fachadas/v2/DECISIONES-Y-VALIDACION.md: por qué se extiende el módulo existente en vez de
  crear tablas nuevas (sin fachada_medios, sin estado manual, sin historial). Manda sobre los .dc.html.
- Preguntas abiertas al gerente (Parte 2 de ese documento). Mientras no responda, usa estos supuestos:
  temporada julio–junio; alto_m y superficie_m2 en null; bordes inferiores del Sitio 2 = exteriores;
  link de socios sin vencimiento (se desactiva a mano); espacios comunes como recintos 'area_comun'.
  Déjalos en constantes o en el seed, fáciles de cambiar.
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
