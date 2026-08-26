# QA checklist — criterios de filtración no cubiertos por tests unitarios

Correr esto **en el navegador** contra un entorno con datos (staging o local con `.env.local`). No asumir que pasa: marcar cada casilla solo si el resultado coincide con lo esperado. Los 8 tests de `npm test` no cubren estos 5 puntos.

**Cómo llegar a las 3 pantallas**

1. Login → **Trabajos** → categoría **Techumbres y canales** → subtipo **Lluvias y temporales**.
2. Abrir un evento (si existe *Temporal 16 ago 2026*, úsalo). Esa lista es el **Consolidado**.
3. Botón **Dashboard de avance** (arriba a la derecha) = **Dashboard**.
4. En Consolidado o Dashboard: lápiz **Editar**, o botón **Nueva filtración-proyecto** = **Formulario** (título interno: *Nueva filtración* / *Editar filtración*).

**Datos de prueba**

- Una ficha que puedas editar sin miedo (o crea una nueva y no la dejes en Terminado).
- Para el criterio 5: 10–12 JPG chicos. Mejor en una ficha **ya guardada**, así la subida va directo y no queda solo “pendiente”.
- Para el criterio 6: esa misma ficha **sin** archivos en Después.

Herramientas: Chrome DevTools → dispositivo **iPhone 12 / 390×844** para el criterio 10. Para medir 44px: Inspect → computed `height` / `min-height` (y `width` en iconos).

La etiqueta se renderiza como **FALTA** (texto “Falta” + `uppercase` CSS). Cualquier `-`, `N/A` o celda en blanco en un campo vacío es fallo.

---

## Criterio 4 — Etiqueta roja **FALTA**, nunca `-` / `N/A` / vacío

Pantallas: Formulario, Consolidado (tabla desktop y cards mobile), Dashboard (tabla y cards).

- [ ] **Formulario (ficha nueva o incompleta)**
  1. En el Consolidado, **Nueva filtración-proyecto**. No rellenar nada.
  2. Recorrer chips de sección: Ubicación, Diagnóstico, Antes/Después, Planos.
  3. Esperado junto a la etiqueta del campo, texto rojo **FALTA** en: Recinto, Fecha de entrega estimada (calculada, no editable), Tipo de problema, Plano agua, Plano reparación.
  4. Ningún campo vacío muestra `-`, `N/A` ni un hueco en blanco donde debería ir el valor.
  5. En Diagnóstico, marcar **Techumbre** y dejar descripción/plan vacíos → **FALTA** en esos dos campos del bloque, y también en **Ejecutado por** y **Fecha de entrega estimada** de ese bloque.
  6. En el bloque de Techumbre, **Ejecutado por = Proveedor externo** sin elegir proveedor ni cotización → aparece el bloque Cotización de ese tipo con **FALTA**. El campo de horas **no** debe aparecer. Marcar también **Cielo** con Maestros Bodetek: horas de Cielo independientes; cotización de Techumbre no se comparte.
  7. En el mismo bloque, cambiar a **Maestros Bodetek** → desaparece Cotización de ese tipo, aparece horas trabajadas con **FALTA**. Volver a **Sin asignar** → no se ve ni cotización ni horas en ese tipo.
  8. La fecha de Ubicación es de **solo lectura**. Completar fechas distintas en Techumbre y Cielo → Ubicación muestra la más lejana (MAX). Sin fechas en los problemas → Ubicación muestra **FALTA**, no un input vacío.


- [ ] **Consolidado — tabla (viewport ≥ md, ~1280px)**
  1. En el evento, buscar una ficha sin recinto/arrendatario, sin gravedad, sin tipos, sin cotización/horas o sin fechas.
  2. Esperado: esas celdas muestran el badge rojo **FALTA**, no `-`.
  3. Expandir la fila: descripción/plan por tipo, evidencia y “Ejecutado por” vacíos también **FALTA**. Entrega real vacía = **FALTA** (no “Sin entrega real”).

- [ ] **Consolidado — cards (390px)**
  1. Mismo evento en mobile.
  2. Esperado: código de recinto / arrendatario vacíos = **FALTA**. Completitud muestra “Faltan N de M”, no un dash.

- [ ] **Dashboard — tabla y cards**
  1. Ir a **Dashboard de avance**.
  2. Esperado: Recinto, Problema (chips), Ejecución, Cotización, Entrega vacías = **FALTA**. Misma regla en las cards mobile.
  3. Fallo si ves `-`, `N/A`, “Sin entrega real” como texto gris, o celdas en blanco.

---

## Criterio 5 — Sin tope de cantidad en Antes / Después

Pantalla: Formulario → chip **Antes/Después** (sección 03 *Respaldo del trabajo · antes y después*). Contador **N archivos** (sin `/8`).

Usar JPG/PNG chicos. En ficha **nueva** quedan pendientes hasta Guardar; en ficha **existente** se suben de a uno a R2 (máx. 200 MB cada uno).

- [ ] **Antes admite más de 8**
  1. Abrir **Editar** en una ficha. Ir a **Antes**.
  2. Subir hasta **10–12** archivos. El contador debe decir p. ej. **12 archivos**, nunca `12/8`.
  3. Esperado: el botón **Subir fotos y videos** sigue visible y habilitado.
  4. Esperado: la dropzone sigue activa (no apagada, no dice “Máximo 8…”). Se puede agregar otro por click o drop.
  5. En desktop y en 390px: mismo comportamiento.

- [ ] **Después admite más de 8**
  1. Repetir en **Después**.
  2. Mismo resultado: se puede pasar de 8; botón y dropzone no se bloquean.

Fallo: el 9.º no entra, el botón desaparece, o el contador muestra `/8`.

---

## Criterio 6 — Sin “Después” no se puede cerrar la filtración

Pantalla: Formulario, sección **Antes/Después** y selector **Estado** de cada tipo de problema (sección **Diagnóstico**).

Preparar una ficha **sin** archivos en Después (ni pendientes en el recuadro verde).

- [ ] **Aviso visible sin guardar**
  1. Abrir la ficha. Ir a **Después**.
  2. Esperado, texto rojo: *Falta evidencia «Después». No se puede cerrar la filtración sin al menos un archivo.*

- [ ] **Toast al guardar (estado ≠ cierre)**
  1. Dejar Estado de los problemas en algo distinto de **Ejecutado — pendiente de entrega** / **Entregado** (p. ej. **Sin asignar**).
  2. Pulsar **Guardar** (header mobile o **Guardar reporte** del footer).
  3. Esperado: toast de advertencia *No se puede cerrar la filtración sin al menos un archivo en «Después».* El guardado **sí** puede completar (no es un cierre).

- [ ] **Bloqueo si Estado = Ejecutado / Entregado**
  1. En un tipo marcado, poner **Estado = Entregado** (o **Ejecutado — pendiente de entrega**) todavía sin Después.
  2. Pulsar **Guardar**.
  3. Esperado: **no** persiste el cierre. Aparece el mismo texto en rojo en el cuerpo del formulario y hace scroll a la sección 03. El toast de aviso también aparece.
  4. Subir 1 archivo a Después (o dejarlo pendiente en ficha nueva) y volver a guardar como Entregado → ahora sí debe persistir. Recargar: Estado sigue en Entregado y Después tiene el archivo.

---

## Criterio 8 — Click en tarjeta/indicador filtra la lista y se ve activo

Hacer cada click y **mirar la tabla/lista de abajo** más el estilo del control. El recuento dice `N de M mostrados`.

- [ ] **Dashboard — tarjetas de métrica**
  1. **Dashboard de avance**.
  2. Click en **Sin fotos/videos de después** (u otra tarjeta con count > 0).
  3. Esperado: la tarjeta queda con borde/fondo rojo (`border-[#c8102e]` / fondo `#fdeced`). El listado de abajo cambia el título a esa condición (p. ej. *Sin fotos/videos de después*) y `N de M mostrados` coincide con el número de la tarjeta.
  4. Click otra vez en la misma tarjeta → se desactiva y el título vuelve a **Todos los proyectos**.
  5. Click **Total proyectos · Ver todos** (tarjeta oscura): lista completa y esa tarjeta con ring rojo activo.

- [ ] **Dashboard — chips de gravedad del listado**
  1. Con o sin tarjeta activa, click **Crítico**.
  2. Esperado: chip con ring rojo; la lista solo muestra críticas.
  3. Click **Medio** además → se ven críticas **y** medias (OR). Ambos chips con ring.

- [ ] **Consolidado — pills KPI de la barra compacta**
  1. Consolidado del evento.
  2. Click en un pill con count > 0 (p. ej. **Sin después**, **Sin cotiz.**).
  3. Esperado: pill con borde/fondo rojo activo (`border-[#c8102e]` / `#fdeced`). La tabla/cards de abajo solo muestran esas fichas. `N de M mostrados` coincide.
  4. Click de nuevo → se limpia el filtro y se ven todas.

Fallo: el estilo activo no cambia, o el estilo cambia pero la lista no se filtra (o al revés).

---

## Criterio 10 — Mobile 390px, hit targets ≥ 44px

Chrome DevTools → iPhone 12 / **390×844**. Recorrer el flujo con el dedo (o emulación táctil). Medir `min-height` / `height` ≥ 44px y, en iconos, también el ancho.

- [ ] **Listado de eventos (entrada al flujo)**
  1. Trabajos → Lluvias y temporales (la lista de eventos, *antes* de abrir el consolidado).
  2. Botones **Dashboard de avance** / **Nueva filtración-proyecto** / abrir evento: ¿≥ 44px? (hoy el listado usa `h-10` = 40px: si mides 40, es **fail**).

- [ ] **Consolidado 390px**
  1. Botón **Dashboard de avance** y **Nueva filtración-proyecto** ≥ 44px de alto.
  2. Pills KPI de la barra (Sin antes, Sin después, Sin cotiz., …): alto ≥ 44px, se pueden tocar sin fallar el vecino.
  3. **+ Filtro**, tokens de filtro (incluida la X de quitar, `size-11`) y **Limpiar todo** ≥ 44px.
  4. Card: área de expandir usable; lápiz **Editar** es un cuadrado ≥ 44×44 (`size-11`).
  5. En ficha expandida, **Completar ficha** ≥ 44px.

- [ ] **Dashboard 390px**
  1. **Ver consolidado** / **Nueva filtración-proyecto** ≥ 44px.
  2. Cada tarjeta de métrica (Respaldo / Asignación / Avance) y **Total proyectos · Ver todos** ≥ 44px de alto y clickeable.
  3. Chips **Crítico** / **Medio** / **Bajo** y **Ver todos** ≥ 44px.
  4. Lápiz Editar en cards ≥ 44×44.

- [ ] **Formulario a 390px (full screen)**
  1. **Cancelar** y **Guardar** del header ≥ 44px.
  2. Chips de sección (Ubicación, Diagnóstico, Antes/Después, Planos, Ejecución, Cotización si aplica) ≥ 44px.
  3. Chips del indicador “Faltan N datos” (si hay faltantes) ≥ 44px.
  4. Las 4 casillas de tipo de problema (Techumbre, Cielo, Eléctrico, Suciedad en piso) ≥ 44px.
  5. Selects (bodega/recinto, ejecutado por, estado) y fechas ≥ 44px.
  6. Botón **Subir fotos y videos** y **Guardar reporte** del footer sticky ≥ 44px.

Fallo: cualquier control del flujo por debajo de 44px, o que en 390px se corte / quede inalcanzable.

---

## Resultado

| Criterio | Pass / Fail | Notas (ficha usada, captura, desviación) |
|----------|-------------|------------------------------------------|
| 4 Falta vs `-` |  |  |
| 5 Sin tope de cantidad |  |  |
| 6 Cerrar sin Después |  |  |
| 8 Filtro visual + lista |  |  |
| 10 Hit targets 390px |  |  |

Fecha: ________  Entorno: staging / local  Quién: ________
