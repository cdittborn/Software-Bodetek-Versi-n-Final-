# Lluvias y temporales — estado actual para rediseño

Documento de la sección tal como está en `main`. No propone diseño nuevo.

**Cómo leerlo**

- **Confirmado:** está en el código o en una migración del repo. Cada bloque cita la ruta.
- **No verificado:** hace falta la base en producción. Este entorno no pudo consultarla (ver sección 6).
- **Supuesto:** inferencia marcada como tal. No usarla como regla de diseño.

Convención de pantallas: `md` es el breakpoint de Tailwind por defecto (768px). No hay `screens` propios en `src/app/globals.css`. El informe del seguro usa además un corte propio en 760px (`min-[760px]` / `max-[759px]`).

El modelo mental de la sección:

1. Un **evento** es un temporal (por ejemplo “Temporal 16 ago 2026”).
2. Cada **filtración-proyecto** es una ficha de un recinto dentro de ese evento. En base vive en `trabajos`.
3. Cada ficha tiene uno o más **subproyectos** (tipos de problema) guardados en el JSON `trabajos.problemas`.
4. El **dashboard**, el **consolidado** y el **informe** leen esa misma ficha. No son tablas distintas.

---

## 1. Rutas

Todas las de trabajos exigen sesión. Sin sesión el middleware redirige a `/login?redirectedFrom=…`.

`src/lib/supabase/middleware.ts`, `src/lib/modulos.ts`, `middleware.ts`.

Los identificadores de categoría, subtipo, evento y trabajo son UUID de la base. Este documento no lista URLs concretas con UUID porque la base no se pudo consultar. El patrón es fijo.

| URL | Quién entra | Qué muestra |
| --- | --- | --- |
| `/trabajos` | Cualquier rol con `modulo_permisos.puede_ver` en `trabajos` | No es un listado. Busca el subtipo cuyo nombre es exactamente `Lluvias y temporales` y redirige al evento de fecha más reciente. Si no hay eventos, muestra un texto y dos links: al subtipo y a `/trabajos/todos`. |
| `/trabajos/c/{categoriaId}/s/{subtipoId}` | Igual, y el subtipo debe ser Lluvias (también acepta el nombre legado `Emergencias`) | Listado de eventos de ese subtipo. |
| `/trabajos/c/{categoriaId}/s/{subtipoId}/e/{eventoId}` | Igual. Si categoría, subtipo o evento no calzan, `notFound`. | Consolidado del evento. |
| `…/e/{eventoId}/dashboard` | Igual | Dashboard general del evento. |
| `…/e/{eventoId}/materiales` | Igual | Compras de materiales del evento. |
| `…/e/{eventoId}/informe` | Solo rol `admin` o `pablo`. El resto, con sesión, es redirigido al dashboard del mismo evento. | Editor del informe para el seguro. Si la tabla del informe no existe, un aviso y nada más. |
| `/trabajos/c/{categoriaId}/s/{subtipoId}/{trabajoId}` | Igual que el consolidado | Detalle de una ficha. No está en la navegación principal; el dashboard de faltantes del informe enlaza aquí. |
| `/informe-seguro/{token}` | Pública. Sin login, sin menú, `robots` noindex. | Vista del liquidador: solo lo último guardado. Token inválido → 404. Error al cargar → “No se pudo abrir el informe”. |
| `/dev/informe-seguro` y `/dev/informe-seguro/publico` | Solo si `NODE_ENV !== "production"`. En producción `notFound`. El matcher del middleware las excluye. | Demo local del editor y de la vista pública, con datos de `src/lib/informe-seguro/demo-datos.ts`. No escribe en la base. |

Archivos de página:

- `src/app/(dashboard)/trabajos/page.tsx`
- `src/app/(dashboard)/trabajos/c/[categoriaId]/s/[subtipoId]/page.tsx`
- `src/app/(dashboard)/trabajos/c/[categoriaId]/s/[subtipoId]/e/[eventoId]/page.tsx`
- `…/dashboard/page.tsx`, `…/materiales/page.tsx`, `…/informe/page.tsx`
- `src/app/(dashboard)/trabajos/c/[categoriaId]/s/[subtipoId]/[trabajoId]/page.tsx`
- `src/app/informe-seguro/[token]/page.tsx`
- `src/app/dev/informe-seguro/page.tsx`, `src/app/dev/informe-seguro/publico/page.tsx`

Helpers de URL: `eventoHref`, `eventoDashboardHref`, `eventoMaterialesHref` en `src/lib/trabajos.ts`. Informe: `eventoInformeHref` y `informeSeguroPublicoHref` en `src/lib/informe-seguro/rutas.ts`.

El link que se copia para el liquidador **no** usa el origen del navegador. Siempre se arma contra `https://software-bodetek-versi-n-final.vercel.app` (`ORIGEN_INFORME_LIQUIDADOR`).

Chrome común de las rutas de `/trabajos`:

- Barra superior `NavPrincipal` (`src/app/(dashboard)/layout.tsx`).
- Sidebar de categorías y subtipos, colapsable en desktop y cajón en móvil (`src/app/(dashboard)/trabajos/layout.tsx`, `src/components/shared/SidebarTrabajos.tsx`). Lluvias aparece como un subtipo más, no como ítem fijo del código: el nombre sale de `trabajo_subtipos.nombre`.

La ruta pública `/informe-seguro/{token}` no usa ese layout.

**Supuesto:** no hay otra URL pública de Lluvias. La búsqueda de rutas en `src/app` no mostró otra.

---

## 2. Pantallas

### 2.1 Listado de eventos

`src/components/emergencias/EventosListado.tsx`

Orden, igual en desktop y móvil (el grid pasa de 1 a 2 columnas desde `sm`, 640px):

1. Título “Lluvias y temporales” y bajada “Eventos — cada uno agrupa filtración-proyectos por bodega”.
2. Botón “Nuevo evento” solo si `puedeEditar`.
3. Vacío: texto punteado que invita a crear un evento, con el ejemplo “Lluvias agosto 2026”.
4. Si hay eventos: tarjetas con nombre, fecha larga en `es-CL`, y conteo “N filtración-proyectos”. La tarjeta entera navega al consolidado de ese evento.

El diálogo “Nuevo evento” (`FormularioEvento.tsx`) pide nombre y fecha. La fecha arranca en hoy (UTC del navegador, `toISOString().slice(0, 10)`).

No hay edición ni borrado de eventos en la interfaz.

### 2.2 Consolidado del evento

`src/components/emergencias/evento-consolidado/EventoFiltracionConsolidado.tsx`

Orden:

1. **Cabecera** (`EventoFiltracionHeader.tsx`). Migas: “Lluvias y temporales / Eventos”. Título = nombre del evento. Bajada: “N filtración-proyectos · actualizado {hace…}”.
2. Cuatro links, en este orden (`EventoPantallasNav.tsx`): Dashboard general, Ver consolidado, Materiales comprados, Informe para seguro. El link del informe se muestra a todos los que ven la pantalla; el permiso se aplica al entrar (sección 3).
3. Botón rojo “Nueva filtración-proyecto” si `puedeEditar`.
4. Si no hay fichas: vacío con el mismo botón, texto “Crear la primera filtración-proyecto”.
5. **Barra de completitud** (`EventoFiltracionBarraCompacta.tsx`): porcentaje global, “X de Y completas”, y píldoras de filtro (sección 5). En desktop la barra va a la izquierda y las píldoras en fila con scroll horizontal. En móvil se apilan.
6. **Filtros** (`EventoFiltracionFiltros.tsx`): búsqueda y “Añadir filtro” (en móvil el botón dice “+ Filtro”). El panel es un diálogo.
7. **Tabla** solo desde `md` (`EventoFiltracionTabla.tsx`, `hidden` bajo `md`).
8. **Tarjetas** solo bajo `md` (`EventoFiltracionCardLista.tsx`, `md:hidden`).
9. **Pie** (`EventoFiltracionPie.tsx`): cantidad de fichas, “Valor de este evento” (suma de `valor_reparacion`) y “Cotizaciones asociadas” (suma de `valor_total_cotizacion`). En móvil se apila; desde `md` el dinero va a la derecha.

Columnas de la tabla, de izquierda a derecha:

1. Recinto (código en negrita, arrendatario o, si no hay, nombre del recinto) y botón lápiz si se puede editar.
2. Gravedad.
3. Estado (el agregado de la ficha, no el de cada subproyecto).
4. Diagnóstico y plan (chips por tipo).
5. Antes / Después.
6. Planos (Agua y Rep.).
7. Cotización (horas si el agregado es solo maestros; número y montos si hay proveedor o ambos).
8. Ejecución (Maestros Bodetek / Proveedor externo / Ambos, y nombre del proveedor de la ficha).
9. Entrega est. / real.
10. Completitud (barra y “Faltan N de M” o “Completo”).

Clic en la fila abre el detalle. Clic en el lápiz abre el formulario y no expande.

**Tarjeta móvil:** código, arrendatario, gravedad, estado, chips de problema, antes/después, entrega, barra de completitud, y el mismo lápiz. No repite planos ni cotización en la cara de la tarjeta; eso queda al expandir.

**Fila o tarjeta expandida** (`EventoFiltracionFilaExpandida.tsx`), tres columnas desde `md`, una en móvil:

1. Diagnóstico y plan de cada tipo activo: problema, plan, ejecutado por, estado, fecha estimada.
2. Evidencia y planos: grilla de archivos (antes, después, plano agua, plano reparación). Las cotizaciones no entran en esta grilla.
3. “Falta por llenar” (chips rojos) y ejecución/entrega. Botón “Completar ficha” si `puedeEditar`, que abre el mismo formulario.

Orden de las fichas (`ordenarProyectos` en `src/lib/filtracion/filtrosEvento.ts`): gravedad crítico → medio → bajo → sin gravedad; dentro de eso, más faltantes primero; luego código de recinto (`es`).

### 2.3 Formulario de filtración-proyecto

`src/components/emergencias/filtracion-form/FormularioFiltracion.tsx`, abierto como diálogo de pantalla completa en móvil y panel de 1000px centrado desde `md` (`FiltracionFormShell.tsx`).

Orden interno:

1. **Cabecera.** Móvil: Cancelar y Guardar arriba. Desktop: título, código `FLT-…` si existe, gravedad si existe, recinto, arrendatario, fecha de reporte, autor, badge “Atrasada”, y X para cerrar. La gravedad no se edita aquí.
2. Indicador de completitud (clic lleva a la sección del faltante).
3. Resumen de archivos (antes, después, planos, cotización si algún tipo es proveedor).
4. Nav de anclas **solo móvil:** Ubicación, Diagnóstico, Antes/Después, Planos.
5. **01 Ubicación.** Selector “Bodega y recinto” (`código — arrendatario`). Debajo, la fecha estimada de la ficha en solo lectura (el máximo de los subproyectos) y el badge Atrasada.
6. **02 Diagnóstico y plan.** Aviso “Anotar acá mucho detalle”. Casillas de tipo: Techumbre, Cielo, Eléctrico, Suciedad en piso (2 columnas en móvil, 3 en `md`, 5 en `lg`). Cada tipo activo abre un bloque:
   - descripción y plan (texto libre);
   - ejecutado por: Sin asignar / Maestros Bodetek / Proveedor externo;
   - estado: — / Sin empezar / En proceso / la etiqueta larga de “Ejecutado…” / Entregado;
   - fecha estimada y fecha real;
   - si maestros: horas trabajadas;
   - si proveedor: proveedor (se puede crear uno), N° cotización, valor recinto, valor total, y hasta 5 archivos de cotización.
7. **03 Antes y después.** Dos columnas desde `md`. Antes y Después, sin tope de cantidad. JPG, PNG o MP4, 200 MB.
8. **04 Plano con marcas.** Dos columnas desde `md`. “Donde cayó agua” y “Donde hay que reparar”, máximo 4 archivos cada uno.
9. Error de servidor, si lo hay.
10. **Pie desktop:** Cancelar y “Guardar” o “Crear filtración”. **Pie móvil:** “Guardar reporte” a ancho completo. En móvil también está el Guardar de la cabecera.

### 2.4 Dashboard general

`src/components/emergencias/evento-dashboard/EventoDashboardAvance.tsx` y `…/faltantes/DashboardFaltantesVista.tsx`

Orden:

1. Cabecera igual a la del consolidado, con título “Dashboard general” y el nombre del evento en la miga (`EventoDashboardHeader.tsx`). Mismos cuatro links y el botón de nueva ficha.
2. Vacío: el mismo mensaje que el consolidado.
3. **Alerta roja del informe**, solo si hay subproyectos sin ejecutor o de maestros sin horas (`AlertaFaltantesInforme.tsx`). Cada ítem enlaza al detalle de la ficha. En `md` la alerta se parte en dos columnas.
4. Texto: “Cifras en negativo: lo que falta. Haz clic en un número para ver las fichas.”
5. **Cuatro tarjetas hero**, grilla de 2 columnas en móvil y 4 desde `md`:
   - Proyectos-Filtraciones (fondo negro): cantidad, barra y chips por gravedad.
   - Subproyectos: cantidad, barra y chips por tipo.
   - Sin asignar (rojo si hay): de N subproyectos, más chips Proveedor externo y Maestros Bodetek.
   - Sin fotos después: de N proyectos, barra y chips por gravedad.
6. Tabla **“Datos generales ‘Proyectos-Filtraciones’”**. Columnas: (nombre de fila), Crítico, Medio, Bajo, Total. Filas: cantidad; sin fotos de antes; sin fotos después; sin plano agua; sin plano reparación; 100% proveedor; 100% maestros; mix. Ancho mínimo 520px, scroll horizontal en móvil.
7. Tabla **“Datos generales ‘Subproyectos’”**. Columnas: Techumbre, Cielo, Eléctrico, Suciedad en piso, Total. Filas: cantidad; sin asignar; ejecutados por proveedor; ejecutados por maestros. Ancho mínimo 640px.
8. **“Completitud ‘Subproyectos’ (Textos)”**. Tarjeta negra “Total subproyectos” y tabla Descripción / Plan de acción con columnas Anotado, Falta llenar, Total. Desde `lg` van lado a lado.
9. **“Info subproyectos ‘Ejecutados por proveedor externo’”**. Desde `lg`, dos columnas:
   - 4.1 Datos generales: tabla por gravedad (total, sin cotización adjunta, sin valor recinto, sin valor total) y tres montos grandes: costo estimado de proveedores (suma de valor recinto), materiales comprados (bruto), costo total estimado (esas dos sumas).
   - 4.2 Estados, con punto y barra de color (sección 5).
10. **“Info subproyectos ‘Ejecutados por maestros Bodetek’”**, misma estructura: total por gravedad, “con horas anotadas”, “horas de trabajo” (informativo, no entra al costo) y estados.

Clic en un número abre un popup (`DashboardPopup.tsx`) con las fichas de esa celda y, si `puedeEditar`, botón para editar. El popup de materiales lista compras, no fichas.

### 2.5 Materiales comprados

`src/components/emergencias/evento-materiales/EventoMaterialesVista.tsx`

Orden:

1. Cabecera “Materiales comprados” y los mismos cuatro links. Esta cabecera **no** tiene “Nueva filtración-proyecto”.
2. Si las tablas de compras no existen: aviso ámbar “Las tablas de compras aún no existen en producción…”.
3. Cuatro resúmenes, 2 columnas en móvil y 4 desde `md`: Total bruto, Total neto, IVA, Sin factura adjunta.
4. Botón “+ Registrar compra” si `puedeEditar` y las tablas existen. Al abrirse el formulario el botón pasa a “Cerrar formulario”.
5. Formulario (`FormularioCompraMateriales.tsx`), grilla de 4 columnas desde `md`: fecha, proveedor (texto libre, no el catálogo), N° factura, material, valor neto, IVA, valor bruto (solo lectura), factura adjunta, y chips para asociar uno o más proyectos del evento.
6. **Compras registradas.** Tabla desde `md` (Fecha, Material y proveedor, Proyectos, Neto, IVA, Bruto, Factura). Bajo `md`, tarjetas.
7. **Reparto por proyecto.** Misma dualidad tabla / tarjetas. El reparto es en partes iguales (sección 4). No se edita a mano.

No hay botón de editar ni borrar una compra en esta pantalla.

### 2.6 Informe para el seguro (editor)

`src/components/informe-seguro/PantallaInformeSeguro.tsx`, montado por `EditorInformeAcciones.tsx`.

Corte propio en 760px, no el `md` de Tailwind.

**Lista (siempre visible en desktop; en móvil se oculta al abrir un recinto):**

1. Miga “Dashboard general / Informe para el seguro”. El link al dashboard pide confirmación si hay cambios sin guardar.
2. Título “Informe para el seguro”.
3. Subtítulo fijo “Daños por temporal agosto 2026” (no usa el nombre del evento; ver sección 9).
4. Botones, en columna bajo 760px y en fila desde ahí: “Ver como liquidador” / “Volver a editar”, “Copiar link del liquidador”, menú “Más opciones del link” (Desactivar link, Generar link nuevo), “Guardar cambios”.
5. Bajada: “El liquidador ve siempre lo último que guardes…”.
6. Cuatro datos: Recintos afectados, Descripciones validadas, Fotos y videos para el liquidador, Con fotos de después. Grilla 2×2 bajo 760px y 4 columnas desde ahí.
7. Banda de estado: “Cambios sin guardar”, “Guardando…”, “Guardado a las HH:MM”, error o resultado.
8. Aside “Recintos (N)”: código, arrendatario, “X de Y” archivos, badge Validada (verde) o Por validar (ámbar).

**Detalle del recinto** (en desktop al lado del aside; en móvil reemplaza a la lista):

1. “Recinto i de N · código”, título `código · arrendatario`, chips “Zonas dañadas”.
2. “Qué pasó”: por cada subproyecto, el texto de la ficha y el texto que irá al informe. Acciones: pasar al informe, quitar, editar el texto del informe. Badges “En el informe” (verde) o “Solo en la ficha” (gris).
3. Fotos y videos, con filtro Todos / En el informe / Fuera, y marcar o desmarcar. El liquidador no ve las que quedan fuera.
4. Validar recinto (pasa a “Validada”).
5. Anterior / siguiente.

El modo “Ver como liquidador” es la misma pantalla sin controles de edición, con una banda azul: “Así verá el informe el liquidador…”.

### 2.7 Informe público

Misma `PantallaInformeSeguro` con `controles={false}` y `modo="liquidador"` (`src/app/informe-seguro/[token]/page.tsx`).

No hay botones de edición, de guardar ni de imprimir en esta pantalla. `BotonImprimirInforme` existe pero solo lo usa `VistaInformeSeguro`, que no está montada en ninguna ruta (sección 9).

Query `?recinto={codigo}` abre ese recinto sin recargar el servidor (`InformeSeguroRuta.tsx`).

### 2.8 Detalle de una ficha

`src/components/emergencias/DetalleEmergencia.tsx`, ruta `…/{trabajoId}`.

Es una página aparte del diálogo del consolidado. Muestra los mismos datos (estado, gravedad, ejecución, textos, fechas, archivos) y, si `puedeEditar`, vuelve a abrir `FormularioFiltracion` más dos `EvidenciaUploader` (antes y después). No es la pantalla principal de trabajo diario: el consolidado y el dashboard editan en el diálogo.

---

## 3. Funciones y roles

Roles del sistema: `admin`, `pablo`, `asistente`, `socio`, `cliente` (`src/components/usuarios/FormCrearUsuario.tsx`).

Permiso de módulo, semilla en `supabase/seed.sql`:

| Rol | Ver módulo `trabajos` | `puede_editar` |
| --- | --- | --- |
| admin, pablo | sí | sí |
| asistente | sí | sí |
| socio, cliente | sí | no |

La interfaz usa ese booleano (`puedeEditar`). La base, además, tiene RLS propio. Las dos capas no son idénticas: el informe exige `admin` o `pablo` aunque el asistente tenga `puede_editar` en trabajos.

| Acción | Dónde | Quién, en la interfaz | Quién, en RLS (confirmado en migraciones) |
| --- | --- | --- | --- |
| Ver eventos, fichas, dashboard, materiales | Rutas de la sección | Rol con `puede_ver` en trabajos | `admin`, `pablo`, `asistente`, `socio`, `cliente` |
| Crear evento (nombre, fecha) | Listado | `puedeEditar` | insert: `admin`, `pablo`, `asistente` (`20260818192100_eventos_gravedad_inbox.sql`) |
| Editar o borrar evento | No hay botón | Nadie en la UI | update: admin, pablo, asistente. delete: admin, pablo |
| Crear y editar filtración-proyecto | Consolidado, dashboard, detalle | `puedeEditar` | insert/update de `trabajos`: admin, pablo, asistente (`20260820181500_categoria_privada_otros_trabajos_cd.sql`) |
| Borrar filtración-proyecto | No hay botón | Nadie en la UI | delete: admin, pablo |
| Subir y borrar archivos de la ficha | Formulario | Quien puede abrir el formulario (`puedeSubir` está fijo en `true` dentro del form; el form solo se abre si `puedeEditar`) | insert/update de `trabajo_media` con `trabajo_id`: admin, pablo, asistente. delete: admin y pablo (`20260818192100_…sql`) |
| Cajón de media sin ficha (`trabajo_id` null) | No hay pantalla en el código actual que lo use | — | select: admin, pablo, asistente. insert: admin, pablo |
| Registrar compra y subir factura | Materiales | `puedeEditar` y tablas creadas | insert/update: admin, pablo, asistente. delete: admin, pablo. La UI no borra |
| Ver informe y editarlo, guardar, activar, desactivar o regenerar el link | `…/informe` | Solo `admin` y `pablo`. El servidor repite el chequeo en `src/lib/informe-seguro/acciones.ts` | Políticas del informe en `20261006120000_informe_seguro.sql` (no reescritas aquí; el acceso de UI está confirmado en la página y en las acciones) |
| Ver el link público | `/informe-seguro/{token}` | Cualquiera con el token, sin cuenta | El loader público no usa la sesión (`cargarPublico.ts`) |
| Exportar CSV, Excel o PDF de fichas | No existe en esta sección | — | — |
| Imprimir | Solo en `VistaInformeSeguro`, componente sin ruta | — | — |
| Filtrar y buscar | Consolidado | Todos los que ven la pantalla, también sin editar | Solo lectura |
| Crear proveedor desde el bloque de cotización | Formulario | Quien edita la ficha | Depende del módulo proveedores, no de esta pantalla |
| Marcar gravedad | No hay control | Nadie en la UI | La columna existe; el formulario reescribe el valor que ya tenía la ficha, o `null` si es nueva |

`puedeEditar` se calcula en `cargarDatosEventoFiltracion` (`src/lib/filtracion/cargarDatosEventoFiltracion.ts`): `modulo_permisos.puede_editar === true` para el rol del perfil y el módulo `trabajos`.

---

## 4. Datos

### 4.1 Tablas que usa la sección

| Tabla | Para qué |
| --- | --- |
| `trabajo_categorias`, `trabajo_subtipos` | Ubicar el subtipo “Lluvias y temporales”. |
| `eventos` | Un temporal. Columnas: `id`, `subtipo_id`, `nombre`, `fecha`, `created_at`. Único `(subtipo_id, nombre)`. |
| `trabajos` | Una filtración-proyecto. |
| `trabajo_media` | Archivos de la ficha. |
| `recintos` | Bodegas. La ficha guarda `recinto_id`. En pantalla se muestran `codigo`, `nombre`, `arrendatario_actual`. |
| `proveedores` | Catálogo. La ficha guarda `proveedor_id`. |
| `perfiles` | Autor (`created_by`) y rol. |
| `modulo_permisos` | Ver / editar. |
| `compras_materiales`, `compra_material_trabajos` | Compras del evento y a qué fichas se asocian. |
| `informes_seguro` y hijas | Borrador del informe, uno por evento. |
| `informe_seguro_versiones` | Copias publicadas. La ruta pública lee la versión, no el borrador vivo. |

### 4.2 `trabajos`: qué se escribe a mano y qué se calcula

Al guardar (`FormularioFiltracion.tsx`, función `onSubmit`) el formulario **no** manda cada campo de columna por separado como lo ve el usuario. Manda el JSON `problemas` y, además, columnas agregadas.

**A mano, por subproyecto, dentro de `problemas[tipo]`:**

| Campo JSON | Control |
| --- | --- |
| `activo` | Casilla del tipo |
| `descripcion`, `plan` | Textos |
| `ejecutadoPor` | `""`, `maestros_bodetek`, `proveedor_externo` |
| `estado` | `""`, `sin_empezar`, `en_proceso`, `ejecutado_pendiente_entrega`, `entregado` |
| `fechaEntregaEstimada`, `fechaEntregaReal` | `input type="date"` |
| `horasMaestros` | Texto, solo si ejecutado por maestros |
| `proveedorId`, `numeroCotizacion`, `valorRecinto`, `valorTotalCotizacion` | Solo si ejecutado por proveedor |

Tipos válidos hoy: `techumbre`, `cielo`, `electrico`, `suciedad_piso` (`src/lib/filtracion/problemas.ts`). `canaleta` ya no es tipo: al leer, si el JSON viejo trae `canaleta`, se absorbe dentro de Techumbre (`absorberCanaletaEnTechumbre`).

**Calculado al guardar y escrito en columnas de `trabajos`:**

| Columna | Cómo |
| --- | --- |
| `titulo` | `Filtración — {arrendatario}` o, si no hay arrendatario, `Filtración — {código}`. Si no se resuelve el recinto: `Filtración`. |
| `descripcion` | Textos de descripción de los tipos activos, unidos con un renglón en blanco y prefijo `[Techumbre]` etc. (`concatenarDescripcion`). |
| `plan_accion` | Igual, con los planes (`concatenarPlan`). |
| `estado` | El estado **menos avanzado** de los tipos activos. Orden: vacío < Sin empezar < En proceso < Ejecutado… < Entregado (`estadoAgregadoFicha`). Sin tipos activos, queda `""`. |
| `ejecutado_por` | Si solo hay un ejecutor entre los tipos activos, ese. Si hay maestros y proveedor, `ambos`. Si ninguno, `null`. |
| `proveedor_id` | El del **primer** tipo activo con proveedor. No se concatenan varios. |
| `numero_cotizacion` | El número de ese mismo primer tipo. |
| `valor_reparacion` | Suma de `valorRecinto` de los tipos activos con proveedor. |
| `valor_total_cotizacion` | Suma de `valorTotalCotizacion` de esos tipos. |
| `horas_maestros_bodetek` | Suma de horas de los tipos activos con maestros. Acepta coma decimal. |
| `fecha_entrega_estimada` | Fecha máxima entre los tipos activos. |
| `fecha_termino` | Fecha máxima **solo si todos** los tipos activos tienen fecha real. Si falta una, la columna queda null. Se reutiliza `fecha_termino`; no hay columna `fecha_entrega_real`. |
| `gravedad` | No se edita. En alta queda `null`. En edición se reescribe la que ya tenía la fila. |
| `codigo_filtracion` | Trigger `trabajos_codigo_filtracion` **antes del insert**, solo si `evento_id` no es null y el código viene vacío: `FLT-` + secuencia a 4 dígitos (`20260824200000_filtracion_formulario_campos.sql`). Único. |
| `created_by` | El usuario de la sesión, solo en el insert. |
| `evento_id`, `categoria_id`, `subtipo_id`, `recinto_id` | Los de la ruta y el selector. |
| `updated_at` | `new Date().toISOString()` en el cliente. |

**Leído y recalculado en pantalla, sin escribir** (`enriquecerProyecto` en `src/lib/filtracion/completitud.ts`): estado, ejecutor, fechas y horas de la ficha se vuelven a derivar del JSON. Completitud, “sin después” y “entrega atrasada” solo existen en memoria.

**Hidratación al leer** (`hidratarProblemasDesdeFicha` en `problemas.ts`): si un bloque activo tiene la fecha vacía, copia `fecha_entrega_estimada` / `fecha_termino` de la columna. Horas y cotización de la ficha se copian al primer bloque compatible solo si ningún bloque activo las tiene. **No** copia `estado` ni `ejecutado_por` desde la columna (eso inflaba “En proceso” en subproyectos vacíos; el comentario del código cita el desfase 51 vs 49).

Valores permitidos en columnas, según el check vigente de `20260901220000_estado_independiente_ejecutor.sql` y `20260820140000_lluvias_estados_gravedad_proveedor.sql`:

- `estado`: además de los de otras secciones (`planificado`, `en_curso`, `completado`, `mantencion_periodica`, `pendiente`, `en_proceso`, `terminado`), Lluvias usa `""`, `sin_empezar`, `en_proceso`, `ejecutado_pendiente_entrega`, `entregado`. Los valores `asignado_*` ya no pasan el check de la columna. Siguen en el código de lectura por si una fila vieja no se reescribió (`ESTADOS_LLUVIAS_LEGACY` en `src/lib/trabajos.ts`).
- `gravedad`: `critico`, `medio`, `bajo`, o null. `alta` / `media` / `baja` se remapean en esa migración y ya no son válidos.
- `ejecutado_por`: `maestros_bodetek`, `proveedor_externo`, `ambos`, o null.

Un recinto no puede repetirse dentro del mismo evento: índice único `trabajos_evento_recinto_key` sobre `(evento_id, recinto_id)`.

### 4.3 `trabajo_media`

Columnas que lee la sección: `id`, `trabajo_id`, `tipo`, `tipo_archivo`, `url` (key de R2), `thumbnail_key`, `nombre_archivo`, `created_at`, `proveedor_id`, `problema_tipo`.

`tipo` usado aquí:

| Valor | Dónde se muestra |
| --- | --- |
| `antes`, `despues` | Evidencia |
| `plano_agua` | Plano “donde cayó agua” |
| `plano_filtraciones` | Se lee como plano agua (legado) |
| `plano_reparacion` | Plano “donde hay que reparar” |
| `cotizacion` | Cotización del subproyecto (`problema_tipo`) |
| `tipo` null y `trabajo_id` null | Cajón inbox. No hay UI actual que lo asigne |

`tipo_archivo`: `foto`, `video`, `documento` (`kindFromFile` en `trabajos.ts`).

Límites de subida (`ZonaEvidenciaUpload.tsx`): JPG, PNG, MP4; PDF solo en cotización (`acceptExtra`). 200 MB. Antes y después sin tope. Planos: 4. Cotización: 5 por tipo.

Carpeta R2: `trabajos/{trabajoId}` (`src/lib/media/upload.ts`). Facturas de compras: key en `compras_materiales.factura_key`, comentario de migración `compras/{id}/…`.

### 4.4 Compras

`compras_materiales`: `evento_id`, `fecha_compra`, `proveedor` (texto), `numero_factura`, `material`, `valor_neto`, `valor_iva`, `valor_bruto`, `factura_key`, `factura_nombre`, `created_by`. Check: bruto = neto + iva, los tres ≥ 0.

IVA por defecto: `Math.round(neto * 0.19)`. Si el usuario edita el IVA, se respeta hasta que cambie el neto; el próximo cambio de neto lo recalcula (`src/lib/filtracion/materiales.ts`).

`compra_material_trabajos`: `(compra_id, trabajo_id)`. Trigger: el trabajo tiene que ser del mismo evento. La app exige al menos un proyecto.

Reparto mostrado por proyecto: partes iguales del neto, del IVA y del bruto. El resto de la división entera se suma a las primeras partes, ordenadas por id. No se guarda el reparto.

En el dashboard, el total de materiales suma cada compra **una vez**, aunque esté ligada a varias fichas (`totalMaterialesDeCompras`).

### 4.5 Informe

`informes_seguro`: uno por `evento_id`. Encabezado (`nombre`, `nombre_evento`, `fecha_evento`, `direccion_centro`, `numero_siniestro`, `numero_poliza`, `contacto_bodetek`, `fecha_emision`), `token` (único, mínimo 32 caracteres), `token_activo`, `token_expira`.

El guardado actual de la pantalla (`EditorInformeAcciones`) llama `guardarInforme` con `publicar: false`. Lo que el liquidador ve es lo último guardado, según el texto de la propia pantalla. El test `guardar el borrador va por una función y no escribe el encabezado` (`src/lib/informe-seguro/informe.test.ts`) fija que ese guardado no reescribe el encabezado.

Hijas:

- `informe_seguro_recintos`: `incluido`, `descripcion_seguro`, `descripcion_validada`, `version` (≥ 1), más `validada_at` / `validada_por` en la migración de guardado.
- `informe_seguro_subproyectos`: `tipo_problema`, `incluido`, `descripcion_seguro`.
- `informe_seguro_media`: `incluido`, `orden`, `es_portada`, `tipo_problema` opcional.
- `informe_seguro_versiones`: `numero`, `contenido` jsonb. No se editan (la migración no da UPDATE).

El texto del informe es independiente de `trabajos.descripcion`. Parte de la nota de la ficha y solo entra al informe si el editor lo pasa.

### 4.6 Completitud (calculada, no es columna)

`calcularCompletitud` en `src/lib/filtracion/completitud.ts`. Porcentaje = ítems completos / ítems aplicables, redondeado. Si no hay ítems aplicables, 100.

Siempre cuenta:

- recinto elegido;
- al menos un tipo activo;
- por cada tipo activo: descripción, plan, ejecutado por, fecha estimada;
- si ese tipo es proveedor: proveedor distinto de `none`, y cotización completa (número + valor recinto + valor total + al menos un archivo de ese tipo);
- si ese tipo es maestros: horas > 0;
- plano agua (cuenta `plano_agua` + `plano_filtraciones`);
- plano reparación.

No cuenta: gravedad, estado, fotos de antes, fotos de después, fecha real.

“Atrasada”: hay fecha estimada, no hay fecha real, y la estimada es anterior a hoy (hora local del navegador, comparada a las 12:00 de esa fecha). Se evalúa **por subproyecto**; la ficha está atrasada si alguno lo está (`entregaAtrasadaDesdeProblemas`).

---

## 5. Estados, etiquetas, colores y reglas

Colores en clases Tailwind. El rojo de marca de la sección es `#c8102e` (hover `#a4131f` o, en el pie del form, `#a80d26`).

### 5.1 Gravedad de la ficha

`GRAVEDAD_LLUVIAS_LABEL` y `GRAVEDAD_LLUVIAS_BADGE` en `src/lib/trabajos.ts`.

| Valor | Etiqueta | Badge |
| --- | --- | --- |
| `critico` | Crítico | `bg-red-100 text-red-800` |
| `medio` | Medio | `bg-amber-100 text-amber-800` |
| `bajo` | Bajo | `bg-emerald-100 text-emerald-800` |
| null o valor desconocido | badge “Falta” | ver 5.6 |

No hay control para cambiarla. Una ficha nueva queda sin gravedad y el consolidado muestra “Falta”.

### 5.2 Estado

Etiquetas en `ESTADO_TRABAJO_LABEL`, badges en `ESTADO_LLUVIAS_BADGE` (`src/lib/trabajos.ts`).

| Valor | Etiqueta en UI | Badge |
| --- | --- | --- |
| `""` o `sin_asignar` (legado) | — | `bg-zinc-200 text-zinc-700` |
| `sin_empezar` y los `asignado_*_sin_empezar` | Sin empezar | `bg-sky-100 text-sky-800` |
| `en_proceso`, `asignado_proveedor_en_proceso` | En proceso | `bg-amber-100 text-amber-800` |
| `asignado_maestros_en_proceso` | En proceso | `bg-orange-100 text-orange-800` |
| `ejecutado_pendiente_entrega` | “Ejecutado - Se hizo 1era revisión y se esta terminando detalles” (texto literal del código, con “esta”) | `bg-lime-100 text-lime-800` |
| `entregado`, `terminado` (legado) | Entregado / Terminado | `bg-emerald-100 text-emerald-800` |

El selector solo ofrece los cuatro valores nuevos más “—”. Al leer, `normalizarEstadoProblema` convierte legado: `asignado_*_en_proceso` → `en_proceso`, `terminado` → `entregado`, `asignado_*_sin_empezar` → `sin_empezar`, `sin_asignar` → vacío. Si el estado legado nombraba al ejecutor y el bloque no tiene ejecutor, se rellena el ejecutor (`remapearEstadoEjecutorDesdeLegado`).

Regla de cierre (`esEstadoCierreFiltracion`): `ejecutado_pendiente_entrega` o `entregado`. Si algún tipo activo está en cierre y no hay ningún archivo en Después (ni subido ni pendiente), el guardado se aborta y se muestra el error. Si no hay Después pero nadie está en cierre, solo un toast de advertencia y **sí** guarda.

### 5.3 Ejecutado por

| Valor | Etiqueta |
| --- | --- |
| `""` / null | “Sin asignar” en el selector; en listas, badge “Falta” |
| `maestros_bodetek` | Maestros Bodetek |
| `proveedor_externo` | Proveedor externo |
| `ambos` | Ambos (solo agregado de ficha; no está en el selector del subproyecto) |

### 5.4 Tipos de problema

`TIPO_PROBLEMA_CHIP` y `TIPO_PROBLEMA_BARRA` en `src/lib/filtracion/dashboardFaltantes.ts`.

| Valor | Etiqueta | Chip | Barra |
| --- | --- | --- | --- |
| `techumbre` | Techumbre | `bg-sky-100 text-sky-800` | `bg-sky-500` |
| `cielo` | Cielo | `bg-violet-100 text-violet-800` | `bg-violet-500` |
| `electrico` | Eléctrico | `bg-amber-100 text-amber-800` | `bg-amber-500` |
| `suciedad_piso` | Suciedad en piso | `bg-stone-200 text-stone-800` | `bg-stone-500` |

Casilla activa del formulario: borde y fondo `#c8102e` / `#fdeced`.

### 5.5 Píldoras del consolidado (filtran al hacer clic; un segundo clic quita el filtro)

`KPI_INDICADOR_DEFS` en `KpiIndicadorPill.tsx`. Activa: borde `#c8102e`, fondo `#fdeced`.

| Id | Etiqueta | Punto | Regla (`coincideKpi`) |
| --- | --- | --- | --- |
| `sin_antes` | Sin antes | `bg-amber-500` | cero archivos antes |
| `sin_despues` | Sin después | `bg-orange-500` | cero archivos después |
| `sin_plano_agua` | Sin pl. agua | `bg-sky-500` | cero plano agua |
| `sin_plano_reparacion` | Sin pl. rep. | `bg-indigo-500` | cero plano reparación |
| `sin_asignar` | Sin asignar | `bg-zinc-500` | `ejecutado_por` de la ficha es null |
| `asignados_proveedor` | Proveedor ext. | `bg-sky-600` | agregado exactamente `proveedor_externo` (no cuenta `ambos`) |
| `sin_cotizacion` | Sin cotiz. | `bg-[#c8102e]` | hay algún tipo con proveedor y la cotización de ese tipo no está completa |
| `sin_fecha_entrega` | Sin f. entrega | `bg-violet-500` | la ficha no tiene fecha estimada |
| `sin_empezar` | Sin empezar | `bg-stone-600` | estado agregado `sin_empezar` |

La búsqueda (AND con las píldoras y con los filtros de campo) mira código de recinto, arrendatario y número de cotización de la **columna**, sin tildes normalizadas más allá de minúsculas.

Filtros de campo (`filtrosCampoEvento.ts`): dentro del mismo campo es OR; entre campos es AND. Campos: gravedad, tipo de problema, estado (incluye “—” = vacío), ejecutado por, proveedor, recinto, arrendatario, plano agua, plano reparación, antes, después, cotización (completa / incompleta / no aplica), entrega (atrasada / a tiempo / sin fecha).

### 5.6 Otras alertas

| Etiqueta | Color | Regla |
| --- | --- | --- |
| Falta | borde `#f2c3c8`, fondo `#fdeced`, texto `#a4131f`, mayúsculas | Hueco de un campo visible (`EtiquetaFaltaBadge`) |
| Atrasada | `border-amber-300 bg-amber-100 text-amber-900` | Sección 4.6 |
| Después con 0 archivos | `bg-amber-100 text-amber-900` en el contador “Después 0” | `IndicadorAntesDespues` |
| Plano presente | texto `text-emerald-700` y ✓ | `IndicadorPlanos` |
| Plano ausente | texto `#a4131f` + badge Falta | igual |
| Barra de completitud ≥ 100 | `bg-emerald-600` | `colorBarraCompletitud` |
| Barra ≥ 50 y &lt; 100 | `bg-amber-500` | igual |
| Barra &lt; 50 | `bg-[#c8102e]` | igual |
| Pista de la barra | `bg-[#efdcde]` | `BarraCompletitud` |
| “Completo” bajo la barra | `text-emerald-700` | `todoCompleto` |
| Filas del dashboard en alerta con total &gt; 0 | texto `#c8102e` | filas marcadas `alerta: true` (sin fotos, sin planos, sin asignar, sin cotización, sin valores) |
| Sin estado definido (dashboard 4.2) | punto y barra `bg-[#c8102e]` | subproyecto activo cuyo estado normalizado no es uno de los cuatro |
| Estados proveedor en 4.2 | Sin empezar `bg-sky-500`; En proceso `bg-amber-500`; Ejecutado `bg-orange-500`; Entregado `bg-emerald-500` | `ESTADO_DOT_PROVEEDOR` |
| Estados maestros en 4.2 | Sin empezar `bg-violet-500`; el resto igual que proveedor | `ESTADO_DOT_MAESTROS` |
| Alerta de informe en el dashboard | borde `#c8102e`, fondo `bg-red-50`, texto `#a4131f` | subproyecto incluido sin ejecutor, o maestros con horas ≤ 0 |
| Informe: Validada / En el informe | fondo `#DDF2E8`, texto `#0B5E3E` | `descripcionValidada` o texto pasado al informe |
| Informe: Por validar | fondo `#FBEBD0`, texto `#7A4300` | recinto no validado |
| Informe: Solo en la ficha | fondo `#F0F1EE`, texto `#5B6169` | texto aún no pasado |
| Informe: cambios sin guardar | lo pinta `EstadoGuardado` | firma del borrador distinta de la base |
| Informe: vista liquidador | fondo `#E8EEFC`, texto `#163A9E` | modo previsualización |
| Compras: tablas pendientes | borde y fondo ámbar | `tablasPendientes` |
| Compras: “Sin factura adjunta” &gt; 0 | la tarjeta marca alerta | `totales.sinFactura` |
| Costo estimado parcial | texto `#c8102e` | incluidos &lt; total de subproyectos con proveedor |

“Entregados” en el dashboard de costos no es el estado `entregado`. `esEntregado` es “la ficha tiene `fecha_termino`” (`filtrosEvento.ts`). Ese predicado no es una píldora del consolidado; existe para filtros de tarjeta que el dashboard actual no muestra como botón suelto.

### 5.7 Informe: reglas de validación visibles

- “Para validar este recinto, pasa al menos un texto al informe.”
- “No hay texto para pasar al informe.”
- Al salir con cambios: `AVISO_CAMBIOS_SIN_GUARDAR` (confirm del navegador y `beforeunload`).
- El menú del link dice “El link no vence.” El test homónimo fija que token inválido y token apagado dan el mismo resultado (`informe.test.ts`).
- Error público: “No se pudo abrir el informe. Pide a Bodetek que te envíe el link de nuevo.”

---

## 6. Datos reales de ejemplo

**No verificado en la base viva.**

`SUPABASE_DB_URL` está definido en el entorno, pero el host solo resuelve por IPv6 y la conexión falla con “Network is unreachable”. No hay registro IPv4. No hay conteo de producción en este documento: ni cantidad de eventos, ni de fichas, ni de compras, ni de informes.

Lo que sí está en el repo, y **no** es el estado de hoy:

La migración `supabase/migrations/20260819222100_temporal_16ago2026_proyectos.sql` dice “26 Filtración-Proyecto” e inserta 26 filas en una tabla temporal para el evento de nombre `Temporal 16 ago 2026` y fecha `2026-08-16` (id escrito en esa migración: `703356ea-67df-4490-9f92-bb88886973e4`). Gravedad de ese import, en el vocabulario viejo: 8 `alta`, 3 `media`, 15 `baja`. Esos valores, si la migración siguiente corrió, pasaron a `critico`, `medio` y `bajo` (`20260820140000_lluvias_estados_gravedad_proveedor.sql`). Esa misma migración pisa el estado de esas 26 fichas con valores que luego el modelo nuevo ya no guarda en la columna (`sin_asignar`, `asignado_proveedor_en_proceso`, `asignado_proveedor_sin_empezar`). La migración `20260901220000_estado_independiente_ejecutor.sql` vuelve a calcular `estado` desde el JSON, solo en filas que ya tenían `problemas`.

Esas 26 filas pueden haber cambiado después (más eventos, fichas editadas, gravedad nunca rellenada en altas nuevas). Tratarlas como el inventario actual sería un supuesto.

Cinco formas que el import describe, sin nombres de arrendatario ni texto del daño. Sirven para el rediseño como variedad de fichas, no como datos vigentes:

| Recinto (código) | Gravedad de origen → mapeo de la migración | Situación que el import intentaba representar |
| --- | --- | --- |
| `1B` | alta → critico | Varios daños a la vez (techumbre y cielo; el texto menciona eléctrico). Ejecución mixta, luego estado de columna `asignado_proveedor_en_proceso`. |
| `2A` | alta → critico | Techumbre, sin ejecutor (“Por asignar”), estado de columna `sin_asignar`. |
| `LOCAL 1 Y 2` (sitio 2) | media → medio | Un tipo de daño (ductos / filtración), pendiente de asignación. |
| `LOCAL 4` (sitio 2) | baja → bajo | Canaletas, sin empezar, sin asignar. |
| `ADMINISTRACION` | baja → bajo | Área común, sin arrendatario en el import, filtración puntual. |

Los códigos de recinto están en la migración; los nombres de arrendatario también, y no se copian aquí.

`src/lib/informe-seguro/demo-datos.ts` tiene dos fichas de mentira, `FLT-0001` y `FLT-0002`, solo para `/dev/informe-seguro`. No son registros.

---

## 7. Componentes

### 7.1 Los que esta sección monta hoy

Listado y evento:

- `EventosListado`, `FormularioEvento`, `EventoPantallasNav`
- `EventoFiltracionConsolidado`, `EventoFiltracionHeader`, `EventoFiltracionBarraCompacta`, `EventoFiltracionFiltros`, `EventoFiltracionPanelFiltros`, `EventoFiltracionTabla`, `EventoFiltracionCardLista`, `EventoFiltracionFilaExpandida`, `EventoFiltracionPie`

Átomos del consolidado (reutilizables dentro de la sección):

- `BarraCompletitud`, `KpiIndicadorPill`, `ChipsProblemaCompletitud`, `IndicadorAntesDespues`, `IndicadorPlanos`, `IndicadorEntrega`, `EtiquetaFaltaBadge`, `EtiquetaAtrasadaBadge`, `ValorOFalta`, `TokenFiltroCampo`

Dashboard:

- `EventoDashboardAvance`, `EventoDashboardHeader`, `DashboardFaltantesVista`, `DashboardPopup`
- `BarraSegmentadaGravedad`, `BarraSegmentadaTipo`, `ChipsGravedad`, `NumeroClicable`

Materiales:

- `EventoMaterialesHeader`, `EventoMaterialesVista`, `FormularioCompraMateriales`, `MaterialesPopup`

Formulario:

- `FormularioFiltracion` (reexportado como `FormularioEmergencia` en `FormularioEmergencia.tsx`)
- `FiltracionFormShell`, `FiltracionFormHeader`, `FiltracionFormFooter`, `FiltracionCompletitudIndicador`, `FiltracionMediaResumen`, `FiltracionSectionNav`
- `Seccion01Ubicacion`, `Seccion02Diagnostico`, `Seccion03AntesDespues`, `Seccion04Planos`
- `BloqueEjecucionProblema`, `ZonaEvidenciaUpload`

Detalle legado aún enrutado:

- `DetalleEmergencia`, `EvidenciaUploader`

Informe:

- `EditorInformeAcciones`, `InformeSeguroRuta`, `PantallaInformeSeguro`
- `AlertaFaltantesInforme` (también en el dashboard)
- `InformePublicoNoDisponible`

### 7.2 Ya existen y conviene reutilizar

| Pieza | Ruta | Uso actual |
| --- | --- | --- |
| Botón, diálogo, input, label, select, tabla, textarea | `src/components/ui/*` | Formularios y tablas |
| Toasts | `src/components/ui/sonner.tsx` | Avisos del formulario |
| `SelectorProveedor` | `src/components/shared/SelectorProveedor.tsx` | Bloque de cotización |
| `MediaGrid`, `MediaUploadCounter` | `src/components/media/` | Grilla de evidencia y contador de subida |
| `NavPrincipal`, `SidebarTrabajos` | `src/components/shared/` | Chrome. Un rediseño de Lluvias no debería redibujar el sidebar de las otras secciones |
| `formatFechaCl`, `formatMontoClp`, `etiquetaRecintoSelector` | `src/lib/trabajos.ts` | Fechas `es-CL` y montos CLP sin decimales |
| Lógica pura | `src/lib/filtracion/*`, `src/lib/informe-seguro/*` | Completitud, filtros, dashboard, IVA, informe. Los tests viven ahí |

### 7.3 Escritos y no montados en ninguna ruta

Confirmado: la única referencia es su propio archivo, o solo los usa otro componente de esta lista.

- `EmergenciasListado.tsx` — listado viejo, con `InfoProyectoDialog` y `BotonMediaListado`.
- `InfoProyectoDialog.tsx`, `BotonMediaListado.tsx` — solo los usa ese listado.
- `EditorInformeSeguro.tsx` — editor anterior, con “Guardar borrador” y “publicar”. La ruta usa `PantallaInformeSeguro`.
- `VistaInformeSeguro.tsx` y `BotonImprimirInforme.tsx` — vista anterior con botón de imprimir. La ruta pública usa `PantallaInformeSeguro`.

---

## 8. Restricciones que un rediseño no debe romper

Negocio y datos:

- Un evento agrupa fichas. Una ficha es un `trabajos` con `evento_id`. Un recinto, una ficha por evento (índice único).
- El JSON `problemas` es la fuente de los subproyectos. Las columnas de estado, ejecutor, fechas, horas y montos son agregados. Volver a editar estado o ejecutor solo en la columna desincroniza el dashboard (el comentario `HIDRATACION_FICHA_HACIA_BLOQUE` en `problemas.ts` explica el bug que ya se corrigió).
- No reintroducir Canaleta como quinto tipo. Al leer, se fusiona en Techumbre. Hay un test: `dashboard faltantes — sin Canaleta`.
- “Cielo americano” en un texto no debe clasificarse como tipo Cielo (`blobSinCieloAmericano`).
- Estado y ejecutor son independientes. El estado no nombra a quién ejecuta.
- No se puede pasar un subproyecto a “Ejecutado…” o “Entregado” sin al menos un archivo en Después.
- Cotización “completa” exige número, valor recinto, valor total **y** archivo. El costo estimado del dashboard suma valor recinto solo cuando hay archivo y valor (`dashboardFaltantes.ts`, bloque `costoEstimado`).
- Horas de maestros no entran al costo. El costo del evento es valor recinto (con la regla anterior) más bruto de compras, cada compra una sola vez.
- IVA 19% redondeado, editable hasta el próximo cambio de neto. Bruto = neto + IVA, también en el check de la tabla.
- El reparto por proyecto es partes iguales en enteros y no se persiste.
- `codigo_filtracion` lo asigna el trigger. No pedirlo en el formulario.
- `fecha_termino` es la entrega real de Lluvias y, en otras secciones, otra cosa. No reciclar el campo para un significado nuevo sin mirar Patentes.
- El informe no debe escribir `trabajos.descripcion` ni `problemas`. Su texto vive en `informe_seguro_*`.
- El link público no debe mostrar el plan interno ni los archivos con `incluido = false`. Lo fija el test “la vista del liquidador no muestra edición, plan ni archivos ocultos”.
- El link del liquidador sale siempre del dominio de producción, no del host actual.
- Guardar un recinto manda solo los recintos cambiados y su `version`. Un guardado con versión vieja se rechaza y no borra el informe (tests en `informe.test.ts`).
- Roles: socio y cliente miran y no editan. El informe lo editan solo admin y pablo, aunque el asistente edite fichas. El token público no pide login.

Aislamiento de rutas (tests que fallan si se cruzan árboles de Next):

- `src/lib/informe-seguro/aislamiento-rutas.test.ts`: la página compartida de subtipos no importa el informe. La página pública no vive bajo el dashboard y no carga el árbol de Lluvias.
- `src/lib/fachadas/aislamiento-rutas.test.ts`: la ficha de Fachadas no puede vivir en el segmento `c/…/s/…` porque Next lo comparte con Lluvias. Un rediseño de Lluvias no debe mover Fachadas a esa carpeta ni al revés.

Tests de reglas, por archivo:

- `src/lib/filtracion/reglas.test.ts` — tipos, completitud, fecha de ficha, atraso, filtros OR/AND, estado independiente del ejecutor.
- `src/lib/filtracion/dashboardFaltantes.test.ts` — fotos en negativo, la cifra y el popup salen de la misma lista, 100% vs mix, textos/cotización/horas, sin canaleta, estados 4.2, costo 4a.
- `src/lib/filtracion/dashboardCostosEvento.test.ts` — materiales sin doble conteo y total estimado.
- `src/lib/filtracion/materiales.test.ts` — IVA, reparto, obligatorios.
- `src/lib/informe-seguro/informe.test.ts` — los puntos de informe citados arriba, más “la ruta pública no exige login”.
- `src/lib/media/urls.test.ts` — URLs de media; lo usa la evidencia.

Dependencias de producto alrededor, que no son Lluvias pero comparten tablas:

- `trabajos` también guarda Patentes, Techos, Fachadas y tareas privadas. Un cambio de check de `estado` o de `trabajo_media.tipo` las afecta.
- `recintos` y `proveedores` son módulos propios.
- Fachadas tiene rutas aparte a propósito (`next.config.ts` lo comenta: “Fachadas no comparte segmento App Router con Lluvias”).

---

## 9. Problemas visibles

Confirmados en código:

1. **No se puede asignar gravedad.** El formulario la muestra y, al guardar, escribe `emergencia?.gravedad ?? null`. Una ficha nueva queda sin gravedad y el consolidado muestra “Falta”. No hay otro control en `src/` que escriba `gravedad`.
2. **El subtítulo del informe está fijo:** “Daños por temporal agosto 2026” en `PantallaInformeSeguro.tsx`, aunque el evento tenga otro nombre. El encabezado que arma la página (`nombreEvento`) no se usa en ese `<h2>`.
3. **El informe se ofrece a quien no puede abrirlo.** `EventoPantallasNav` pinta “Informe para seguro” para todos. La página redirige a asistente, socio y cliente al dashboard.
4. **Código muerto.** `EmergenciasListado`, `InfoProyectoDialog`, `BotonMediaListado`, `EditorInformeSeguro`, `VistaInformeSeguro`, `BotonImprimirInforme` no tienen ruta. El botón de imprimir no llega al liquidador.
5. **Dos editores de la misma ficha.** El trabajo diario es el diálogo. Sigue existiendo la página `DetalleEmergencia`, enlazada desde la alerta del dashboard, con uploaders propios (`EvidenciaUploader`) además de `ZonaEvidenciaUpload`.
6. **Datos duplicados a propósito, con riesgo conocido.** Columnas vs JSON. La hidratación de fechas, horas y cotización sigue activa y el propio código pide no ampliarla (`problemas.ts`).
7. **Agregados que se quedan con el primer proveedor.** Si dos tipos son de proveedor, `proveedor_id` y `numero_cotizacion` de la columna guardan solo el primero. Los montos sí se suman. La celda “Cotización” del consolidado lee esas columnas, no cada bloque.
8. **`ambos` no se elige, se calcula.** El selector del subproyecto no lo ofrece. La píldora “Proveedor ext.” no incluye fichas `ambos`.
9. **Etiqueta de estado incómoda para UI:** “Ejecutado - Se hizo 1era revisión y se esta terminando detalles”. Es el texto que ve el usuario en el selector, la tabla y el dashboard 4.2.
10. **Sin borrar ni editar eventos, fichas o compras en la UI**, aunque el RLS de delete existe para admin y pablo en esas tablas. No es un bug por sí solo; es una función incompleta si el rediseño la da por existente.
11. **Sin exportar** listados, dashboard ni compras.
12. **Aviso de compras desactualizado si la migración ya corrió**, o vigente si no. El texto “falta el COMMIT” sale cuando `cargarComprasEvento` marca `tablasPendientes`. No se pudo comprobar en la base cuál de los dos es hoy.
13. **Cajón inbox de media** (archivo sin ficha) sigue en el esquema y en el RLS, y ninguna pantalla de Lluvias lo lista.
14. **`codigo_filtracion` se muestra en el informe y en la cabecera del formulario, no en la tabla del consolidado.** La tabla identifica por código de recinto.
15. **La fecha “hoy” del formulario de evento** sale de `toISOString()` (UTC). En Chile, de noche, puede quedar en el día siguiente. No está cubierto por un test.
16. **Búsqueda del consolidado** no incluye descripción, plan ni código `FLT-`.
17. **Fotos de antes y de después no entran en la completitud**, pero el dashboard y las píldoras las tratan como faltantes. Un rediseño que unifique “completo” con “sin faltantes del dashboard” cambiaría el porcentaje.
18. **El pie del consolidado suma columnas de montos de todas las fichas**, incluidas las de solo maestros (ahí `valor_reparacion` suele ser null). No suma las compras de materiales. El costo “de verdad” del evento está en el dashboard 4a, con otra regla.

No verificado, y por eso no se afirma:

- Cuántos registros hay, si la gravedad sigue vacía en las fichas nuevas, si el informe ya tiene token activo, si las tablas de compras ya existen en producción.
- Que el id de evento escrito en la migración de agosto 2026 siga siendo el evento que abre `/trabajos`.
