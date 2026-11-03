# Rediseño Bodetek · Menú lateral y Lluvias y temporales

Especificación aprobada por Cristóbal (noviembre 2026). Los diseños de referencia están dentro de `docs/rediseno-lluvias/DISENOS-REFERENCIA.md` (cada uno bajo su título `NombreArchivo.dc.html`). Son HTML de un editor de diseño: léelos como referencia de estructura, textos, tamaños y colores. No se pueden abrir solos en el navegador y **no se copian tal cual**. Se reimplementan con los componentes del repo (Next.js, Tailwind y shadcn/ui).

`ESTADO-ACTUAL.md` sigue siendo la fuente de las reglas de negocio. Este documento solo cambia lo que dice aquí.

---

## 1. Principios de diseño

- **Limpio y minimalista.** Pocas distracciones, fácil de leer.
- **Información en bloques pequeños.** Cuando hay muchos datos, se dividen en cuadros con título (borde de 1 px, radio de 10 px, encabezado con una línea debajo), para recorrerlos de a poco.
- **Pocos colores:**
  - Texto en negro y grises.
  - Azul solo para el botón principal, la pestaña activa y lo seleccionado.
  - Los estados se muestran con **un puntito y la palabra**, sin fondos de color.
    - Verde `#2F9E5B`: listo o entregado.
    - Ámbar `#D9822B`: hay que mirarlo, atrasado o falta algo.
    - Gris `#A3A8B6`: pendiente sin urgencia.
    - Rojo `#D64545`: solo para la gravedad Crítico.
  - Un número en 0 en "Por completar" se muestra en gris, no en verde.
- **Sin fondos de color en chips o etiquetas.** Los tipos de problema se escriben como texto ("Techumbre y cielo").
- **Mayúscula solo al inicio de frase.** La única excepción son las etiquetas pequeñas de sección (eyebrow).
- **Escala tipográfica fija:**

  | Uso | Tamaño y peso |
  |---|---|
  | Título de página | 22 px, 600 |
  | Título de bloque | 14–16 px, 600 |
  | Texto | 13.5–14 px |
  | Texto secundario | 12–12.5 px |
  | Eyebrow | 10.5 px, 700, mayúsculas, espaciado de letras 1.3 px |

- **Botón Editar** en cada fila: botón secundario (borde gris, icono de lápiz y texto "Editar") en la **última columna a la derecha**. El lápiz rojo grande desaparece.

### Tokens

| Token | Valor |
|---|---|
| Fuente | IBM Plex Sans (400, 500, 600, 700), desde Google Fonts o `next/font` |
| ink | `#1b1d28` |
| mute | `#5f6474` |
| faint (texto pequeño) | `#6E7383` |
| line | `#E8EBF2` |
| line-soft | `#F0F2F6` |
| Fondo del menú lateral | `#F7F8FC` |
| Fondo de página | `#FFFFFF` |
| primary | `#4363E0` |
| primary-hover | `#3550C4` |
| Ítem activo del menú | fondo `#E9EEFD`, texto `#2B4FCF` |
| Rojo de marca Bodetek `#c8102e` | solo en el logo del menú |

## 2. Navegación y menú lateral (afecta a todo el software)

**Desaparece la barra superior** (`NavPrincipal`). Todo pasa a un menú lateral único, al estilo del software Núcleo. Contiene, en orden:

1. Logo de Bodetek (cuadrado rojo con "B"), nombre y fecha de hoy.
2. Módulos con icono: Trabajos, Recintos, Proveedores y Usuarios, según los permisos de cada rol.
3. "Categorías" (eyebrow), con un botón de lápiz que abre el modo de edición. Solo admin y Pablo editan categorías (ver sección 9).
4. Las categorías de Trabajos:
   - Cada categoría tiene un **color propio, apagado**. Se ve como un cuadrito de 9 px junto al nombre (12.5 px, 600). Se abre y se cierra con un chevron.
   - Sus subcategorías cuelgan de una **línea vertical fina** con una versión clara del mismo color. Cada una tiene un **puntito de 5 px** del color de su categoría.
   - Subcategoría activa: fondo blanco, borde de 1 px y texto en negrita.
5. Pie del menú: nombre del usuario, rol y "Salir".

**Paleta de colores de las categorías** (color / tinte de la línea):

| Color | Color | Tinte |
|---|---|---|
| Azul | `#5E87D6` | `#C9D8F2` |
| Lavanda | `#9682CF` | `#DDD6F0` |
| Turquesa | `#4E9E92` | `#C6E2DE` |
| Ocre | `#C9973F` | `#EDDDBF` |
| Rosa | `#C7707D` | `#EFD0D5` |
| Gris | `#8A90A0` | `#DADDE4` |
| Verde | `#5E9E70` | `#CBE3D2` |

**Celular (bajo 760 px):** el menú se oculta. Arriba queda una barra con el logo, "Bodetek" y un botón de hamburguesa de 44 px que despliega el menú.

**Inicio de Trabajos (`/trabajos`):** ya **no** redirige a Lluvias y temporales. Muestra un estado vacío: "Nada seleccionado · Abre una categoría del menú de la izquierda para empezar."

## 3. Editar categorías (función nueva)

Al tocar el lápiz de "Categorías", el menú entra en modo edición. Ahí se puede:

- **Renombrar** una categoría o subcategoría escribiendo sobre el nombre.
- **Cambiar el color** de una categoría tocando su cuadrito. Recorre la paleta de 7 colores.
- **Ordenar** con flechas de subir y bajar y con arrastre desde el asa (⋮⋮). Se ordenan las categorías y, dentro de cada una, sus subcategorías.
- **Agregar** subcategorías ("Agregar subcategoría" al final de cada categoría) y categorías ("Nueva categoría" al final del menú).
- **Eliminar** con el icono de basurero. Siempre pide una confirmación en la misma fila, por ejemplo: "¿Eliminar la categoría y sus N subcategorías? Eliminar / No".
- Salir con el botón "Listo".

**Datos:** `trabajo_categorias` y `trabajo_subtipos` necesitan columnas `orden` (int) y `color` (texto, solo en categorías). Hay que hacer la migración y actualizar las políticas RLS.

**Regla al eliminar (propuesta, confirmar con Cristóbal):** no se puede eliminar una categoría o subcategoría que tenga trabajos asociados. En ese caso se avisa "Tiene N trabajos; muévelos antes de eliminar". **Lluvias y temporales** no se puede eliminar ni renombrar, porque el código la busca por su nombre exacto. Lo mejor es dejar de buscarla por nombre y marcarla con un id o un flag.

## 4. Lluvias y temporales · Listado de eventos

- Cabecera: eyebrow "Techumbres y canales", título "Lluvias y temporales", bajada y botón "Nuevo evento".
- **Lista en un solo cuadro**, no tarjetas. Cada fila tiene:
  - Nombre del evento, y debajo la fecha y la cantidad de recintos.
  - Barra de avance verde con el texto "18 de 29 entregados".
  - Estado con puntito: "En curso" (ámbar) o "Terminado" (verde).
  - Chevron.
- En celular, la barra de avance baja a una segunda línea.

## 5. Vista del evento

**Pestañas** (reemplazan los cuatro botones actuales):

| Pestaña | Contenido |
|---|---|
| Resumen | El actual Dashboard general |
| Filtraciones | El actual consolidado |
| Materiales | Sin cambios |
| Cotizaciones y facturas | Nueva, vacía |
| Informe para el seguro | Solo se muestra a admin y Pablo |

**Pestaña Filtraciones:**

1. Dos cuadros arriba (en celular, uno debajo del otro):
   - **Avance:** número grande ("18 de 29 recintos entregados"), una barra verde y cuatro cifras (Entregado, Ejecutado, En proceso, Sin empezar).
   - **Por completar:** lista de filas "etiqueta … número". Primero van las que tienen pendientes, con puntito ámbar, y después las que están en 0, en gris. Las filas son: Sin fotos de después, Entregas atrasadas, Sin gravedad, Sin fotos de antes, Sin planos y Sin ejecutor asignado. Tocar una fila filtra la lista, igual que las píldoras de hoy.
2. Búsqueda y botón "Filtros".
3. **Un cuadro por gravedad**, en este orden: Crítico, Medio, Bajo y Sin gravedad. Cada cuadro muestra la cantidad de recintos.
4. **Columnas de cada tabla:**
   - Recinto (código, y debajo el arrendatario).
   - Estado (puntito y texto).
   - Problemas (texto, por ejemplo "Techumbre, cielo y eléctrico").
   - Fotos ("8 antes", y debajo "24 después" o "Sin después" en ámbar).
   - Ejecución (ejecutor, y debajo el proveedor).
   - Entrega (fecha, y debajo "Entregado", "Estimada" o "Atrasada").
   - Pendiente (qué falta, o "—").
   - Botón Editar.
5. **Se elimina la columna Cotización.** Las columnas Planos y Completitud se reemplazan por "Pendiente".
6. **Celular:** cada fila se vuelve una tarjeta con pares "etiqueta · valor", sin desplazamiento horizontal.

## 6. Formulario "Editar filtración"

- **Cabecera:** "FLT-0001 · Temporal 16 ago 2026", el título "1B · Servicios Norte" (código y arrendatario) y una barra fina de avance con el texto de lo que falta.
- **Cinco cuadros numerados.** Cada uno muestra en su esquina "Completo" (puntito verde) o "Falta N dato" (puntito ámbar).
  1. **Datos generales:**
     - Recinto: el selector muestra "código · arrendatario" y **nunca el UUID**.
     - Entrega estimada, en solo lectura.
     - **Gravedad**: control segmentado Crítico / Medio / Bajo. Es nuevo y se guarda en `trabajos.gravedad`.
  2. **Fotos antes:** grilla de miniaturas con un botón "Agregar".
  3. **Fotos después:** igual, con la nota "Se necesita al menos una para marcar Ejecutado o Entregado".
  4. **Diagnóstico y plan:**
     - Casillas de tipo de problema.
     - Un bloque por tipo activo con descripción, plan, ejecutado por, proveedor (si es externo), horas (si son maestros), estado, entrega estimada y entrega real.
     - Los tipos ya completos se pueden mostrar colapsados, con la opción "Abrir".
  5. **Planos:** "Dónde cayó agua" y "Dónde hay que reparar", con máximo 4 archivos cada uno.
- **Se eliminan del formulario todas las partes de cotización:** N° de cotización, valor del recinto, valor total y archivos de cotización.
  - Los datos ya guardados **no se borran** de la base. Solo dejan de mostrarse y editarse aquí.
  - `calcularCompletitud` deja de contar la cotización. Avisar que esto cambia el porcentaje.
  - El selector de proveedor **se mantiene**.
- En celular, el formulario ocupa toda la pantalla, en una columna, con fotos en 3 columnas.

## 7. Cotizaciones y facturas de proveedores (nueva, vacía)

- Pestaña del evento con el título "Cotizaciones y facturas de proveedores", el texto "0 documentos" y un estado vacío: "Sección en preparación. Aquí se registrarán todas las cotizaciones y facturas de proveedores del evento, en un solo listado, y desde aquí se asignarán a cada recinto."
- Todavía no tiene lógica.

## 8. Informe para el seguro

Se mantiene el flujo actual. Cambia la presentación, en este orden:

1. **Barra de acciones:**
   - Estado "Cambios sin guardar", con un puntito ámbar.
   - Botones: "Ver como liquidador", "Copiar link" y "Guardar" (el primario).
   - Las opciones del link (desactivar y generar uno nuevo) se mantienen en un menú.
2. **Cuadro resumen con 5 cifras:** Recintos, Validados ("9 de 29"), Sin fotos de antes, Sin fotos de después y Fotos para el liquidador ("214 de 612").
3. **Cuadro "Lo que falta", en 3 columnas:**
   - Recintos sin fotos de después, como chips con el código. Cada chip abre ese recinto.
   - Recintos sin ninguna foto elegida para el liquidador, también como chips.
   - Cuántos recintos faltan por validar.
4. **Lista de recintos** a la izquierda: código, "X de Y fotos" y estado (Validado, Por validar o Sin fotos).
5. **Recinto abierto,** en cuadros separados:
   - "Qué pasó": textos con su estado, "Editar texto" y "Pasar al informe".
   - "Fotos antes".
   - "Fotos después".
   - Las fotos se marcan y desmarcan con un clic. Las elegidas tienen borde oscuro y un ✓; las no elegidas se ven atenuadas.
   - Abajo: Anterior, Siguiente y "Validar recinto".
6. **"Ver como liquidador"** muestra el documento final, igual a la vista pública:
   - Logo, "Informe de daños para el seguro" y el **nombre del evento** (no el texto fijo de "agosto 2026").
   - Datos del encabezado, índice de recintos y, por cada recinto, "Qué pasó" con solo las fotos elegidas.
   - Arriba, una franja blanca con "Volver a editar".

## 9. Reglas que no cambian

- Siguen vigentes todas las de `ESTADO-ACTUAL.md` sección 8 y los tests de `src/lib/filtracion/*` y `src/lib/informe-seguro/*`.
- Socio y cliente solo miran. No ven el lápiz de editar categorías, ni "Editar", ni "Nueva filtración".
- Editar categorías: solo admin y Pablo (propuesta).
- No inventar funciones fuera de esta especificación: exportar, imprimir, borrar eventos, fichas o compras.
- Todo debe funcionar a **360 px de ancho** sin desplazamiento horizontal de la página, con zonas táctiles de 44 px o más.

## 10. Protección de datos (obligatoria)

En producción hay información real: fichas, textos, fotos y videos que subieron Pablo y el equipo, compras y el informe. **Este rediseño no puede perder ni un dato.**

1. **Migraciones solo aditivas.** Se permite agregar columnas, tablas, índices y políticas. Están prohibidos `DROP`, `DELETE`, `TRUNCATE`, cambiar tipos y renombrar columnas. Antes de aplicar una migración se la muestras a Cristóbal. Nunca la apliques tú contra producción.
2. **Nunca borrar archivos de R2 ni filas de `trabajo_media`** como efecto de un cambio de diseño. Las fotos, videos, planos y archivos de cotización existentes se quedan donde están.
3. **Cotizaciones ocultas, no borradas.** El formulario deja de mostrar la cotización, pero al guardar debe **conservar intactos** dentro del JSON `problemas` los campos `numeroCotizacion`, `valorRecinto` y `valorTotalCotizacion` (y `proveedorId`). También debe conservar las columnas agregadas que hoy salen de ellos: `numero_cotizacion`, `valor_reparacion` y `valor_total_cotizacion`. Guardar una ficha nunca puede escribir vacío o null encima de un valor que ya existía. Agrega un test que lo pruebe: una ficha con cotización se guarda desde el formulario nuevo y conserva sus valores.
4. **En general, el guardado conserva todo campo que no se muestra.** Se parte de lo que hay en la base y solo se cambia lo que el usuario editó.
5. **Eliminar categorías:**
   - Primero revisa el `ON DELETE` de las llaves que apuntan a `trabajo_categorias` y `trabajo_subtipos`. Si alguna es `CASCADE`, borrar una categoría podría borrar trabajos y sus fotos.
   - El botón de eliminar solo funciona si la categoría o subcategoría tiene **cero** trabajos. Esa regla se valida en la interfaz **y** en la base (función o RLS), no solo en la interfaz.
   - Lluvias y temporales no se puede eliminar.
6. **Renombrar no rompe nada.** Si el código busca "Lluvias y temporales" por su nombre, primero se cambia a un identificador estable. Recién después se permite renombrar.
7. **Pruebas sin tocar datos reales.**
   - Si las vistas previas de Vercel usan la base de producción, prueba la edición solo en un **evento de prueba** creado para eso, nunca en "Temporal 16 ago 2026".
   - Lo ideal es un proyecto de Supabase de staging o una base local.
8. Ante cualquier duda que pueda afectar datos: **detente y pregunta.**

## 11. "Otros trabajos CD" se archiva

Cristóbal ya no usa esta categoría privada. **Se archiva, no se borra.**

- Agrega una columna `archivada boolean not null default false` en `trabajo_categorias` y márcala en `true` para "Otros trabajos CD".
- Las categorías archivadas no aparecen en el menú, ni en el editor del menú, ni en la pantalla de permisos de Usuarios.
- Sus trabajos, archivos y subcategorías quedan intactos en la base.
- No hay que construir una pantalla para desarchivar. Si algún día hace falta, se cambia directo en la base.

## 12. Usuarios: categorías visibles por persona (función nueva)

Diseño de referencia: `Usuarios.dc.html` dentro de `DISENOS-REFERENCIA.md`.

**Pantalla:**
- Está en el módulo Usuarios.
- A la izquierda, la lista de personas, con su rol y un resumen ("ve todo" o "ve 4 de 10").
- A la derecha, el cuadro "Categorías que puede ver", con:
  - una casilla por categoría, que marca o desmarca todas sus subcategorías y muestra un estado parcial (–) si solo algunas están marcadas;
  - una casilla por subcategoría, con el mismo cuadrito de color y la misma línea vertical del menú;
  - una casilla propia para las categorías que no tienen subcategorías;
  - accesos rápidos "Todas" y "Ninguna".
- Botones "Guardar" y "Cancelar".
- **Solo admin** usa esta pantalla. Los administradores ven siempre todo, y no se les puede restringir.

**Reglas:**
- Se configura a todos los que no son admin: Pablo, asistente, socio y cliente.
- **Valor inicial:** al crear esta función, todos los usuarios existentes quedan viendo **todo**, para que nadie pierda acceso de un día para otro. Un usuario nuevo también parte viendo todo, hasta que admin lo cambie.
- Lo que no está marcado:
  - no aparece en su menú;
  - si abre un link directo, ve una página "No tienes acceso" o un 404;
  - **la base tampoco le entrega esos datos**, con RLS de lectura sobre `trabajos`, `eventos`, `trabajo_media`, las compras y las tablas de Fachadas, si Fachadas no está marcada.
- Esto solo cambia lo que cada persona **ve**. No cambia si puede editar; eso sigue dependiendo del rol.
- **El link público del liquidador no se ve afectado.**
- **Datos:** una tabla nueva de visibilidad por usuario, por ejemplo `usuario_visibilidad (usuario_id, categoria_id, subtipo_id null)`. El diseño exacto queda a criterio de Cursor. La migración es solo aditiva.
- **Riesgo:** una política de lectura mal hecha podría ocultarle datos a alguien que sí debe verlos. No se pierde nada, pero hay que probarla con cada rol antes de pasarla a producción.
