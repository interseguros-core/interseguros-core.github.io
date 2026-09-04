# Holos IA — Design.md

> Este documento describe el aspecto y el estilo deseados de **Holos IA**: principios, marca, tokens visuales (color, tipografía, iconografía, espaciado, radios, elevación) y la especificación de cada componente de interfaz. Es la referencia de diseño para todo el producto — cualquier pantalla nueva debería poder construirse combinando lo que está documentado acá.
>
> Este es un documento **vivo**, no una decisión congelada. La fuente de verdad real es el código: `assets/css/ds/tokens.css` (tokens) y `components/design-system/*.js` (componentes), visibles en vivo en `/pages/design-system` (`frames/design-system.html`). Si algo cambia ahí, actualizá este documento en el mismo cambio. Si algo acá contradice al código, gana el código y este archivo está desactualizado.

## Tabla de contenidos

1. [Principios](#1-principios)
2. [Marca](#2-marca)
3. [Color](#3-color)
4. [Tipografía](#4-tipografía)
5. [Iconografía](#5-iconografía)
6. [Espaciado y radios](#6-espaciado-y-radios)
7. [Elevación (sombras)](#7-elevación-sombras)
8. [Componentes](#8-componentes)
9. [Layout del sistema (app shell)](#9-layout-del-sistema-app-shell)
10. [Estados e interacción](#10-estados-e-interacción)
11. [Accesibilidad](#11-accesibilidad)
12. [Voz y contenido](#12-voz-y-contenido)
13. [Cómo usar y mantener este documento](#13-cómo-usar-y-mantener-este-documento)
14. [Pendientes abiertos](#14-pendientes-abiertos)

---

## 1. Principios

Estas son las reglas que explican *por qué* el sistema se ve como se ve. Ante una duda de diseño que este documento no cubre, se resuelve volviendo a estos principios.

1. **Densidad antes que espacio en blanco.** Holos IA es una herramienta de trabajo diario (ERP de seguros), no un producto de consumo. Las pantallas muestran mucha información a la vez: tablas densas, tipografía compacta (13.5px de base), padding moderado (no generoso).
2. **Un solo camino para cada patrón.** Un solo componente de botón, un solo componente de input, una sola librería de íconos. No se resuelve el mismo problema de dos formas distintas en pantallas distintas.
3. **Preciso, no suave.** Los radios de borde son deliberadamente chicos (2–4px). Esto es una decisión de tono: transmite precisión y seriedad financiera, no la calidez redondeada de una app de consumo.
4. **El color de marca se gana su lugar.** El azul primario (`#3D5FEB`) se reserva para acción principal, foco y navegación activa. El resto de la interfaz es neutro (grises, blancos, navy). Si todo es azul, nada destaca.
5. **Los tokens son la única fuente de verdad.** Cambiar un valor en `tokens.css` (por ejemplo la fuente o un color) debe reflejarse en todo el sistema sin tocar componente por componente. Ningún componente nuevo debería declarar un color, tamaño de texto o radio "a mano" si ya existe un token para eso.
6. **Los estados de feedback son predecibles.** Éxito, advertencia, peligro y ayuda usan siempre el mismo par color-fuerte / color-suave (ver [§3](#3-color)) en badges, toasts, mensajes de campo y callouts — nunca un color de feedback distinto para el mismo significado.

## 2. Marca

**Nombre del producto:** Holos IA.

> Nota de contexto: la interfaz funcional actual (navbar, sidebar, mockups de layout) todavía muestra en varios lugares el nombre histórico "Interseguros" — es el nombre del cliente/proyecto sobre el que se construyó el producto antes del rebranding a Holos IA. Ese texto está pendiente de reemplazo en el código de la app (fuera del Design System) para alinearse con este documento.

### Logotipo

- El isotipo vive como un único SVG reutilizable en [`components/design-system/ds-logo.js`](../../components/design-system/ds-logo.js) (`logoSvg()`), para que cambiarlo en un solo lugar lo actualice en todo el sistema.
- El color del isotipo siempre se hereda con `currentColor` (nunca un color fijo dentro del SVG) para poder pintarlo según el fondo.
- El wordmark ("Holos IA" / "Interseguros" según el contexto) acompaña al isotipo en `font-bold`, `tracking-tight`.

### Fondos de marca aprobados

El isotipo + wordmark deben verse bien sobre estos cuatro fondos (definidos en `ds-palette.js`, sección "Isotipo sobre fondos"):

| Fondo | Isotipo | Wordmark |
|---|---|---|
| `#F6F7FA` (gris claro / fondo de app) | Slate `#7C8DA6` | Navy `#0B1440` |
| `#3D5FEB` (azul primario) | Blanco | Blanco |
| `#0B1440` (navy) | Slate `#AEB9CE` | Blanco |
| Blanco con borde superior | Slate `#7C8DA6` | Primario `#3D5FEB` |

### Exploración de identidad visual

Existe una propuesta de identidad visual más amplia (dos alternativas de logotipo, paletas y aplicaciones) en `/pages/branding`, elaborada por Tramado Studio. La paleta funcional del Design System (azul `#3D5FEB` como primario) es consistente con la "Opción 1" de esa propuesta. Construcción del logo, zona de resguardo y tamaño mínimo todavía no están definidos formalmente — ver [§14](#14-pendientes-abiertos).

## 3. Color

Fuente: `--theme` en [`assets/css/ds/tokens.css`](../../assets/css/ds/tokens.css). Todos los valores están pensados para **tema claro**; no existe (todavía) un tema oscuro para este Design System — ver [§14](#14-pendientes-abiertos).

### Marca

| Token | Hex | Uso |
|---|---|---|
| `--color-brand-primary` | `#3D5FEB` | Acciones principales, links, foco |
| `--color-brand-primary-hover` | `#2C46C4` | Hover/active de elementos primarios |
| `--color-brand-primary-soft` | `#EEF1FD` | Fondos tintados, filas seleccionadas, chips info |
| `--color-brand-navy` | `#0B1440` | Wordmark, texto de máximo énfasis |
| `--color-brand-slate` | `#7C8DA6` | Isotipo, acentos secundarios |

### Texto

| Token | Hex | Uso |
|---|---|---|
| `--color-text-primary` | `#16213E` | Texto principal |
| `--color-text-secondary` | `#5B6B85` | Texto de apoyo, subtítulos |
| `--color-text-muted` | `#94A0B8` | Placeholders, hints, metadata |

### Superficies

| Token | Hex | Uso |
|---|---|---|
| `--color-surface` | `#FFFFFF` | Fondo de cards, inputs, modales |
| `--color-surface-subtle` | `#FAFBFC` | Fondo de headers de tabla, paneles secundarios |
| `--color-surface-hover` | `#F1F2F5` | Hover de filas, ítems de lista, botones "text" |
| `--color-background` | `#F6F7FA` | Fondo general de la página |

### Bordes

| Token | Hex | Uso |
|---|---|---|
| `--color-border-default` | `#E2E5EC` | Borde estándar de cards, tablas, separadores |
| `--color-border-strong` | `#C7CEDB` | Borde de botones outline, controles con más énfasis |
| `--color-border-input` | `#AEB9CE` | Borde por defecto de inputs/selects/textareas |

### Feedback

Cada estado de feedback tiene un color "fuerte" (texto/ícono/borde) y un color "suave" (fondo). Se usan siempre juntos — nunca fuerte-sobre-fuerte ni un feedback con el suave de otro.

| Estado | Fuerte | Suave | Uso |
|---|---|---|---|
| Éxito | `--color-success` `#1D9A6C` | `--color-success-soft` `#E7F6EF` | Confirmaciones, estados "Activa" |
| Advertencia | `--color-warning` `#D97706` | `--color-warning-soft` `#FDF3E2` | Pendientes, vencimientos próximos |
| Peligro | `--color-danger` `#DC2626` (hover `#C21E1E`) | `--color-danger-soft` `#FBEAEA` | Errores, eliminación, vencidas |
| Ayuda | `--color-help` `#7C3AED` (hover `#6D28D9`) | — | Acciones de soporte/ayuda (variante de botón) |
| Deshabilitado | `--color-disabled` `#A9B4E8` | — | Fondo/borde de cualquier control disabled |

## 4. Tipografía

- **Familia:** `'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` — un único token, `--font-sans`. Cambiarlo ahí actualiza toda la interfaz.
- Se carga desde Google Fonts (pesos 400/500/600/700) en la página que aloja el Design System.

### Escala de tamaños

Solo existen **4 tamaños**, a propósito — no se agregan tamaños intermedios:

| Token | Tamaño | Rol |
|---|---|---|
| `--text-sm` | 12px | Metadata, badges, etiquetas de ayuda (`text-xs` de Tailwind coincide con este rol) |
| `--text-md` | 13.5px | Tamaño base: body, inputs, botones, filas de tabla |
| `--text-lg` | 15px | Títulos de sección dentro de una página (`h2` de cada bloque) |
| `--text-xl` | 18px | Reservado para títulos de mayor jerarquía (encabezados de página) — todavía sin un caso de uso real en los componentes existentes |

### Pesos

| Token | Peso | Uso |
|---|---|---|
| `font-normal` | 400 | Texto de cuerpo por defecto |
| `font-medium` | 500 | Labels, texto con algo más de énfasis, botones |
| `font-semibold` | 600 | Títulos de sección y de card |
| `font-bold` | 700 | Wordmark de marca |

### Opacidad como jerarquía

Para matices de un mismo color de texto (en vez de definir un color nuevo), se usa opacidad sobre `text-primary`: 100% / 75% / 50% / 30%.

## 5. Iconografía

- **Librería oficial y única: [Phosphor Icons](https://phosphoricons.com/).** No se mezclan otras librerías dentro del Design System.
- Los íconos son glifos de icon-font (`<i class="ph ph-{slug}">`), nunca SVG pegado a mano — ver [`ds-phosphor.js`](../../components/design-system/ds-phosphor.js) y su mapa `ICON_NAMES`, que fija una única acción → un único ícono en todo el producto (ej. "eliminar" siempre es `trash`, nunca a veces `trash` y a veces `x`).
- El color de un ícono siempre viene de `currentColor` — nunca un color arbitrario embebido en el ícono.

### Tamaños

| Token | Tamaño | Uso |
|---|---|---|
| `icon-xs` | 14px | Badges, metadata, acciones muy pequeñas |
| `icon-sm` | 16px | Inputs, tablas, filtros, botones compactos |
| `icon-md` | 20px | **Tamaño estándar general**: sidebar, navegación, botones normales |
| `icon-lg` | 24px | Cards y acciones destacadas |
| `icon-xl` | 32px | Empty states y momentos especiales |

### Pesos

| Peso | Uso |
|---|---|
| Regular | Uso estándar por defecto en todo el sistema |
| Bold | Acciones o elementos con mayor jerarquía visual |
| Fill | Estados activos/seleccionados (ítem de sidebar activo, tab activo) |
| Duotone | Solo para empty states — no es un peso de uso habitual |

### Reglas

- Tamaño estándar: 20px Regular. Inputs y tablas: 16px Regular. Sidebar: 20px Regular.
- Los elementos activos pueden pasar a peso Fill.
- Mantené tamaños consistentes dentro de un mismo contexto (no mezclar 16 y 20px en la misma fila).
- Nunca representar la misma acción con dos íconos distintos en pantallas distintas.

## 6. Espaciado y radios

El espaciado sigue la escala por defecto de Tailwind (unidad base 4px). Los patrones más frecuentes en los componentes existentes:

- Padding interno de card: `p-7` (28px).
- Separación entre bloques dentro de una card: `gap-6` / `gap-7` (24–28px).
- Padding de celda de tabla: `px-3.5 py-2.5` (14px / 10px).
- Padding de botón (mediano, el único tamaño definido hoy): `px-4 py-2` (16px / 8px).

### Radios — deliberadamente chicos

| Token | Valor | Uso |
|---|---|---|
| `--radius-chip` | 2px | Checkboxes, chips pequeños, icon-buttons compactos |
| `--radius-control` | 3px | Botones, inputs, selects, popovers, filas de menú |
| `--radius-card` | 4px | Cards, tablas, modales, toasts |

No existen radios grandes (8px+) ni `rounded-full` salvo en elementos explícitamente circulares (badges tipo pill, avatares, el knob del switch, el punto de badge/estado).

## 7. Elevación (sombras)

Todavía no hay tokens formales de sombra (a diferencia del shell oscuro de la app, que sí tokeniza `--shadow-sm/md/lg`). El uso actual, informal pero consistente, es:

| Nivel | Clase Tailwind | Uso |
|---|---|---|
| Sutil | `shadow-sm` | Toasts, ítem de navegación activo sobre fondo blanco |
| Flotante | `shadow-lg` | Menús desplegables (selector de tamaño de página, selector de página) |
| Modal | `shadow-[0_18px_50px_rgba(11,20,64,0.18)]` | Diálogos modales — la única sombra "grande" del sistema |

El fondo (`backdrop`) de un modal es `rgba(11,20,64,0.56)` con `backdrop-filter: blur(1.5px)`.

## 8. Componentes

Cada componente vive como Custom Element en `components/design-system/`, se renderiza a sí mismo en su `connectedCallback()`, y expone sus variantes vía atributos HTML (ej. `<ds-button variant="danger">`). El catálogo completo se ve en vivo en `/pages/design-system`.

### Botón — `ds-button`

Único tamaño mediano por ahora. `inline-flex`, `gap-[7px]`, `px-4 py-2`, texto 13.5px medium, `rounded-control`, ícono opcional a la izquierda o derecha.

| Variante | Fondo | Texto | Uso |
|---|---|---|---|
| `primary` | Azul primario | Blanco | Acción principal de la pantalla |
| `secondary` | `text-secondary` (gris azulado) | Blanco | Acción secundaria con peso propio |
| `outline` | Blanco, borde `border-strong` | `text-primary` | Acción secundaria de bajo énfasis |
| `text` | Transparente | `text-secondary` | Acción terciaria, "Cancelar" |
| `link` | Transparente | Azul primario, subrayado al hover | Navegación inline |
| `success` / `danger` / `warning` / `help` | Color de feedback correspondiente | Blanco | Acciones que confirman ese significado (ej. eliminar = `danger`) |

Estado `disabled`: fondo y borde `--color-disabled`, texto blanco, `cursor-not-allowed`, sin subrayado — igual para todas las variantes.

### Badge — `ds-badge`

Pill (`rounded-full`), `px-2.5 py-1`, texto 12px medium, fondo suave + texto fuerte del color de feedback correspondiente (ver tabla de [§3](#3-color)). Variante `neutral` para estados sin significado de feedback. Atributo `dot` agrega un punto de 6px `bg-current` antes del texto.

### Card — `ds-card`

Contenedor blanco, borde `border-default`, `rounded-card`, `overflow-hidden`. Header opcional (`title` + `subtitle`) separado por un borde inferior; cuerpo con `p-7` salvo que `padded="false"`.

### Campos de formulario — `ds-input`, `ds-select`, `ds-textarea`

- Label 12.5px medium arriba del campo (o a la izquierda con `layout="horizontal"`, ancho configurable con `label-width`, 140px por defecto).
- Borde 1.5px: `border-input` por defecto, `border-brand-primary` en foco, `border-danger` en `state="error"`.
- Campo deshabilitado: fondo `--color-background`, texto muted, `cursor-not-allowed`.
- Mensaje de ayuda/error debajo del campo (12px): muted en estado normal, `danger` + ícono `warning-circle` en error. Siempre enlazado con `aria-describedby`.
- Asterisco rojo (`text-danger`) junto al label cuando el campo es `required`.
- Ícono de búsqueda dentro del input (`icon="search"`) alineado a la izquierda, `pointer-events-none`.

### Controles — checkbox, switch

- Checkbox: 16px, `rounded-chip`, `accent-brand-primary`.
- Switch (toggle): pista 34×19px `rounded-full`, gris `#D7DBE3` / azul primario activo; knob blanco de 15px con sombra que se desliza de 2px a 17px. Construido con `peer` + `peer-checked` (sin JS adicional).

### Toast

Tarjeta blanca `rounded-card`, `shadow-sm`, barra de color de 3px pegada al borde izquierdo según el tono (éxito/peligro/advertencia/info), ícono del mismo tono, título 13.5px medium + descripción 12.5px, botón de cerrar (`close`) a la derecha.

### Lista — `ds-list`

Dos patrones de una sola columna dentro de un contenedor `rounded-card`:

- **Actividad:** ícono en chip de 36px con el tono correspondiente, título (bold si no leído / medium si leído), subtítulo, punto azul de "no leído", timestamp alineado a la derecha. Fila entera es clickeable y marca como leída.
- **Documentos seleccionables:** checkbox + ícono de archivo + nombre/tamaño + botón de descarga individual; fila seleccionada se tiñe con `brand-primary-soft`; contador "N de M seleccionados" y botón de descarga masiva que se deshabilita en 0 seleccionados.

### Tabla de datos — `ds-data-table`

- Header de búsqueda + acciones (`Exportar`, acción primaria de creación) arriba de la tabla.
- Encabezado de tabla: fondo `surface-subtle`, texto 11.5px semibold `text-secondary`, mayúsculas implícitas por el peso (no `uppercase` forzado).
- Columna de checkbox de selección a la izquierda; fila seleccionada con fondo `brand-primary-soft`, fila normal con hover `surface-subtle`.
- Estado como badge pill (mismo patrón que `ds-badge`), no como texto plano.
- Columnas numéricas (ej. montos) alineadas a la derecha.
- Acciones de fila como icon-buttons de 26×26px, `rounded-chip`.
- Paginación: contador de registros a la izquierda; a la derecha, selector de tamaño de página y selector de página como popovers (`shadow-lg`), más flechas prev/next que se deshabilitan en los extremos.

### Modal

- Diálogo nativo (`<dialog>`), ancho 640px, `rounded-card`, sombra grande de modal (ver [§7](#7-elevación-sombras)).
- Header: ícono + eyebrow en mayúsculas (11px) + badge de nivel opcional, título 17px semibold, descripción corta, botón de cerrar (`x`) arriba a la derecha.
- Cuerpo: grid de definición 2 columnas para datos de contexto (ej. "Póliza" / "Asegurado"), callout de advertencia con barra izquierda ámbar cuando la acción es irreversible, y el control de confirmación (ej. textarea obligatoria con contador de caracteres).
- Footer: nota de auditoría a la izquierda ("Usuario, fecha, IP y motivo quedarán registrados") + botones Cancelar/Confirmar a la derecha.
- Cierre por botón, click en el fondo, o tecla Escape.

## 9. Layout del sistema (app shell)

Estructura visual del ERP completo (no es un componente reusable, es la especificación del shell — ver `ds-layout.js`):

1. **Header** superior fijo: logo a la izquierda, acciones generales (notificaciones, ajustes) y avatar de usuario a la derecha.
2. **Sidebar principal**, fijo a la izquierda, ancho 64px (`w-16`), fondo navy, **solo íconos** (sin texto visible). Cada ícono debe ser reconocible a simple vista.
3. Al pasar el mouse sobre un ícono del sidebar principal aparece un **tooltip** con el nombre del módulo.
4. El módulo activo tiene un estado visual claro: fondo azul primario + ícono en peso **Fill**.
5. Al seleccionar un módulo aparece un **sidebar secundario** (ancho 208px / `w-52`, fondo `surface-subtle`) con sus submódulos — este sí muestra texto. Cambia según el módulo activo.
6. A la derecha del sidebar secundario queda el **área de contenido** principal, fondo `--color-background`.

## 10. Estados e interacción

- **Hover:** los fondos neutros pasan a `surface-hover` (`#F1F2F5`) o `surface-subtle` (`#FAFBFC`) según el contexto; los botones de color oscurecen un paso (ver hovers en la tabla de variantes).
- **Foco:** borde `brand-primary` en campos de formulario. Los botones y links usan el foco por defecto del navegador combinado con el `outline` del componente — no se suprime el foco visible.
- **Deshabilitado:** siempre `--color-disabled` + `cursor-not-allowed`, nunca solo una opacidad reducida sobre el color activo.
- **Selección:** filas/ítems seleccionados usan `brand-primary-soft` como fondo (tablas, listas de documentos) — es el mismo patrón en todos los listados.
- **Transiciones:** `transition-colors` / `transition-all` cortas y discretas (sin duración custom definida globalmente); no hay animación de entrada/salida especificada para modales o toasts todavía.

## 11. Accesibilidad

- Cada input/select tiene su `<label for>` correspondiente; los mensajes de ayuda o error se conectan con `aria-describedby` y los campos en error llevan `aria-invalid="true"`.
- Los botones de solo-ícono siempre llevan `aria-label` (ver iconos estándar de tabla y sidebar).
- El sidebar principal usa `aria-pressed` en el botón del módulo activo.
- El color nunca es el único portador de significado: los estados de feedback siempre combinan color + ícono (badges, mensajes de error) o color + texto (nunca un punto de color solo).
- Los íconos decorativos deben marcarse como tales (no leídos por lector de pantalla) cuando acompañan texto visible.

## 12. Voz y contenido

- Todo el copy de producto está en **español**, tono directo y profesional (sin jerga innecesaria), acorde a un ERP de seguros usado por operadores y ejecutivos comerciales.
- Los mensajes de error son específicos y accionables (ej. "Este número de póliza ya existe", no "Error").
- Los estados se nombran con una sola palabra clara y consistente en todo el sistema: **Activa**, **Pendiente**, **Vencida** — nunca sinónimos distintos para el mismo estado en pantallas distintas.
- Las confirmaciones de acciones irreversibles explican la consecuencia antes del botón de confirmar (ver el callout de advertencia del modal).

## 13. Cómo usar y mantener este documento

- **Para diseñar una pantalla nueva:** empezá por los componentes de [§8](#8-componentes); si el patrón que necesitás no existe, primero preguntate si puede resolverse combinando componentes existentes antes de crear uno nuevo.
- **Para implementar:** usá siempre las clases semánticas basadas en tokens (`text-lg`, `text-primary`, `rounded-card`, `bg-brand-primary`, etc.), nunca valores arbitrarios de Tailwind (`text-[15px]`, `bg-[#3D5FEB]`) para algo que ya tiene un token. Ver la nota de [§14](#14-pendientes-abiertos) sobre componentes antiguos que todavía no migraron a esta convención.
- **Para proponer un cambio de token** (color, tipografía, radio): el cambio se hace en `assets/css/ds/tokens.css` y debe reflejarse en este documento en el mismo cambio.
- Este archivo vive junto al Design System (`pages/design-system/design.md`) a propósito, para que diseño y código nunca se desincronicen por estar en repositorios o carpetas separadas.

## 14. Pendientes abiertos

Cosas que este documento señala como huecos reales del sistema, no como decisiones tomadas:

- **Nombre de marca en el shell de la app:** el navbar, sidebar y mockups de layout todavía dicen "Interseguros" en vez de "Holos IA". Hay que decidir el rollout del rebranding y actualizar esas pantallas.
- **Construcción del logo:** zona de resguardo, tamaño mínimo, y cuál de las dos propuestas de `/pages/branding` (Opción 1 / Opción 2) queda como final.
- **Migración de componentes antiguos:** `ds-palette.js`, `ds-buttons.js`, `ds-toast.js`, `ds-list.js` y `ds-data-table.js` todavía usan valores arbitrarios de Tailwind (`text-[13px]`, `bg-[#3D5FEB]`, `rounded-[4px]`) en vez de las clases basadas en token (`text-md`, `bg-brand-primary`, `rounded-card`) que ya usan los componentes más nuevos (`ds-icons.js`, `ds-layout.js`, `ds-typography.js`, `ds-form-fields.js`, `ds-cards.js`). El valor visual es el mismo hoy, pero si un token cambia, estos componentes no lo heredan automáticamente.
- **Tema oscuro:** no existe una versión oscura de este Design System (distinto del shell oscuro de la aplicación general, que es un sistema de color separado — ver `assets/css/variables.css`).
- **Tokens de elevación:** las sombras (§7) son consistentes en el código pero no están tokenizadas (`--shadow-*`) como sí lo están color, tipografía y radio.
- **Tamaños de botón:** solo existe el tamaño mediano; no hay variantes chico/grande definidas todavía.
- **Motion/animación:** no hay una duración, curva de easing, ni patrón de entrada/salida definido para modales, toasts o menús desplegables.
