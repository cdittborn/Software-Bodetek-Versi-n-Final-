# Brief para Claude Design — Bodetek · Sección "Fachadas"

## 1. Contexto

Bodetek es un centro comercial y de bodegas en Antofagasta (2 sitios, 31 unidades entre bodegas, locales y oficinas). Tenemos un software interno de gestión (Next.js + Tailwind + shadcn/ui, desplegado en Vercel, datos en Supabase). Dentro del módulo **Trabajos › Imagen** está la sección **Fachadas**, que hoy existe pero no comunica bien el trabajo.

Hoy las fachadas están en mal estado y estamos en plena campaña de **limpieza, reparación, pintura y hojalatería**. Quiero rediseñar esta sección para que cuente esa historia.

## 2. Para quién es

| Usuario | Qué necesita |
|---|---|
| **Gerente general** (yo, uso diario) | Registrar intervenciones, subir fotos antes/después, ver qué falta, qué vence y cuánto ha costado. |
| **Socios / directorio** (uso esporádico) | Van muy poco al centro; algunos no van hace años. Necesitan entender **en 30 segundos** qué se ha hecho, dónde y cómo se veía antes vs. ahora, sin explicación. |

**El objetivo principal del rediseño es el segundo usuario:** mostrar el trabajo de forma visual, simple y convincente.

## 3. Qué es una fachada

- Cada **frente** de una unidad es una fachada independiente.
- Una unidad puede tener 1 a 6 fachadas (frente al pasillo, trasera a la calle interior, lateral, etc.).
- En el plano, cada fachada es **un tramo de muro** (segmento de línea) de la unidad que da a un espacio abierto: calle, pasillo, patio o estacionamiento. Los muros compartidos entre dos unidades (medianeros) **no** son fachadas.
- **Nomenclatura:** `Unidad · Fachada N (hacia X)`. Ejemplo: *Local 1 · Fachada 1 (hacia calle interior Sitio 1)*.
  - La numeración parte por el lado de arriba del plano y sigue en sentido horario.
- **Identificador técnico:** `s1-local-1-f1` (sitio · unidad · número de fachada).

Adjunto el plano en SVG, que ya trae las **84 fachadas** dibujadas como elementos `<line class="fachada">`, cada una con su `id`. También adjunto `fachadas.json` con los datos de cada fachada:

| Campo | Contenido |
|---|---|
| `id` | Identificador técnico |
| `unidad` | Nombre de la unidad |
| `nombre` | Nombre legible de la fachada |
| `lado` | Lado en el plano |
| `hacia` | A qué da la fachada |
| `largo_m_aprox` | Largo aproximado en metros |
| `p1`, `p2` | Coordenadas en el plano |

## 4. Qué quiero que diseñes

### 4.1 Vista principal: "Estado de las fachadas" con plano interactivo

Reemplaza la grilla actual de cuadraditos ("Estado de las N fachadas") por el **plano del centro**.

- **Plano limpio:** calles, sitios y unidades con su número, sin nombre de arrendatario.
- **Cada fachada pintada según su estado:**
  - Requiere trabajo → rojo
  - Programada → naranjo
  - En ejecución → azul
  - Al día → verde
  - Sin evaluar → gris
- **Hover sobre una fachada:** se engrosa y muestra un tooltip con nombre, estado y fecha de la última intervención.
- **Click:** abre la ficha de la fachada (4.2).
- **Leyenda** con el conteo por estado, que también sirve como filtro (click en "En ejecución" atenúa el resto).
- **Zoom y desplazamiento** simples. En móvil, el plano se puede ampliar con los dedos.
- **Toggle "Ver como antes / Ver hoy":** el plano se pinta según el estado al inicio de la temporada versus hoy. Es el momento "wow" para socios: el mapa pasa de rojo a verde.

### 4.2 Ficha de fachada (panel lateral o modal)

1. **Encabezado:** nombre de la fachada, unidad, a qué da, m² y estado actual. Incluye un mini-plano con la fachada resaltada.
2. **Antes / Después:** comparador con **slider deslizante** sobre dos fotos del mismo encuadre. Si hay varias intervenciones, se elige cuál comparar. Es el elemento más importante de la ficha.
3. **Línea de tiempo de intervenciones**, con las 4 categorías de trabajo:
   - Tipos y colores actuales: L Limpieza, R Reparación, P Pintura, H Hojalatería.
   - Cada intervención muestra fechas, ejecutor (Maestros Bodetek / Proveedor externo), costo neto (mano de obra + materiales), fotos de avance y nota.
4. **Próximos vencimientos** de mantención periódica de esa fachada.
5. **Documentos:** cotizaciones, facturas y fichas técnicas de pintura.
6. **Acciones (solo gerente):** "Registrar intervención", "Subir fotos", "Cambiar estado".

### 4.3 Modo socios / "Reporte al directorio"

Ya existe un botón "Reporte al directorio". Diseña la vista que abre, como una página de lectura, no de gestión:

- **Titular de avance**, por ejemplo: "Llevamos 38 de 84 fachadas recuperadas (45%)" y "1.240 m² intervenidos".
- **Plano grande** con el estado y el toggle antes/hoy.
- **Galería de "Antes y después destacados":** 4 a 6 comparaciones con slider, las más impactantes.
- **Resumen de inversión:**
  - Total neto
  - Costo por m²
  - Maestros vs. externos
  - Desglose por tipo de trabajo
- **Próximos pasos:** qué viene el próximo mes.
- Debe verse bien en un celular (lo reenviaré por WhatsApp) y poder exportarse a PDF.
- **Sin datos sensibles:** nada de nombres de arrendatarios ni montos de contratos.

### 4.4 Lo que se mantiene de la pantalla actual (reordenar y simplificar)

- KPIs superiores: fachadas intervenidas, superficie, costo total, materiales, costo por m². Hoy son 5 tarjetas con mucha letra chica; propón una versión más legible.
- Tabs Todos / Maestros Bodetek / Proveedor externo y filtros de temporada.
- Panel "Trabajos realizados" (L/R/P/H) y "Quién ejecutó".
- Próximos vencimientos.
- Tabla "Todas las fachadas" con buscador, agrupable por unidad.

## 5. Estilo visual

- Mantener la identidad actual:
  - Fondo gris muy claro, tarjetas blancas con bordes suaves.
  - Tipografía sans moderna.
  - Rojo Bodetek (`#E30613` aprox.) como acento y en el botón primario.
  - Negro para contrastes.
- Look sobrio y ejecutivo, que transmita orden y control.
- El plano usa grises neutros para que **solo las fachadas tengan color**.
- Los colores de estado se distinguen también por forma o texto (no solo por color) para que sean accesibles.

## 6. Datos (para que el diseño sea implementable)

**Tablas en Supabase (español):**

- **`fachadas`**
  - Campos: `id`, `recinto_id`, `svg_id` (ej. `s1-local-1-f1`), `nombre`, `hacia`, `largo_m`, `alto_m`, `superficie_m2`, `estado`, `orden`.
  - Valores de `estado`: `requiere_trabajo`, `programada`, `en_ejecucion`, `al_dia`, `sin_evaluar`.
- **`fachada_intervenciones`**
  - Campos: `id`, `fachada_id`, `tipo`, `fecha_inicio`, `fecha_termino`, `ejecutor`, `costo_mano_obra`, `costo_materiales`, `nota`.
  - Valores de `tipo`: `limpieza`, `reparacion`, `pintura`, `hojalateria`.
  - Valores de `ejecutor`: `maestros`, `externo`.
- **`fachada_fotos`**
  - Campos: `id`, `fachada_id`, `intervencion_id`, `tipo`, `storage_path`, `tomada_en`, `destacada`.
  - Valores de `tipo`: `antes`, `despues`, `avance`.
  - `destacada` es booleano: marca las fotos que van a la galería del reporte.
- **`fachada_estado_historial`**
  - Campos: `fachada_id`, `estado`, `fecha`.
  - Alimenta el toggle antes/hoy.

**Conexión plano ↔ datos:** el componente de plano carga el SVG y pinta cada `<line id="...">` según el `estado` de la fila de `fachadas` con ese mismo `svg_id`.

## 7. Entregables que pido

1. Vista principal de Fachadas con el plano interactivo (desktop).
2. Ficha de fachada con comparador antes/después y línea de tiempo.
3. Vista "Reporte al directorio" en desktop y móvil.
4. Estados vacíos:
   - Fachada sin fotos.
   - Fachada sin intervenciones.
   - Inicio de temporada.

Usa datos de ejemplo realistas, por ejemplo:
- Local 1 · Fachada 1 (hacia calle interior Sitio 1), 180 m², pintura terminada.
- Bodega 4A · Fachada 1, en ejecución.
- La mayoría de las fachadas en "Requiere trabajo".

## 8. Archivos adjuntos

- `plano-bodetek.svg`: plano simplificado con unidades y las 84 fachadas como elementos clickeables.
- `plano-bodetek.png`: vista previa del plano.
- `fachadas.json`: listado de fachadas con id, unidad, nombre, a qué da y largo aproximado.
- Captura de la pantalla actual de Fachadas.
