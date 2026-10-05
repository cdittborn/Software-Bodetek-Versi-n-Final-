# Referencia visual — Fachadas (Claude Design)

Fuente de verdad para layout, color, tipografía y chips. No son datos de
producción; las cifras de las capturas son de ejemplo.

La demo pública (sin login, sin base de datos) vive en
`/trabajos/fachadas/demo` y usa estas capturas como referencia.

| Archivo | Pantalla |
| --- | --- |
| `1_Resumen_dashboard.png` | Listado + indicadores (FASE 4) |
| `2_Ficha_fachada.png` | Ficha de una fachada (FASE 3) |
| `3_Nueva_intervencion.png` | Formulario de intervención (FASE 2) |
| `4_Nueva_fachada.png` | Formulario de nueva fachada (FASE 2) |
| `5_Reporte_directorio.png` | Informe al directorio (FASE 5) |

Móvil (390 px), en `mobile/`. Mandan el layout de celular; las de arriba siguen mandando en escritorio.

| Archivo | Pantalla |
| --- | --- |
| `mobile/1_Movil_Dashboard.png` | Dashboard |
| `mobile/2_Movil_Ficha_fachada.png` | Ficha |
| `mobile/3_Movil_Nueva_intervencion.png` | Nueva intervención |
| `mobile/4_Movil_Nueva_fachada.png` | Nueva fachada |

Los estilos de estas pantallas viven solo bajo `.fachadas-scope` (no se
aplican a Lluvias ni al resto de Trabajos).
