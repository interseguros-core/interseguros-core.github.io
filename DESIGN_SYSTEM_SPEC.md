# Design System Spec

## 1. Tecnología y dependencias visuales

| Pieza | Qué se usa | Dónde |
|---|---|---|
| CSS | **Tailwind CSS v4.1** (`@tailwindcss/cli` v4.1, `tailwindcss` v4.1) | `package.json` (`devDependencies`) |
| Compilación | `tailwindcss -i ./assets/css/ds/input.css -o ./assets/css/ds/output.css --minify`. Es un paso de build **solo de desarrollo**: GitHub Pages sirve `output.css` ya compilado como archivo estático; no hay Node/servidor en producción. | `package.json` (`scripts`), comentario en `description` |
| Entrada Tailwind | `@import "tailwindcss";` + `@import "./tokens.css";`, con `@source` apuntando a `components/design-system/**/*.js`, `frames/design-system.html` y `pages/design-system/**/*.html` (para que Tailwind detecte las clases usadas dentro de template strings JS) | `assets/css/ds/input.css` |
| Tokens | Bloque `@theme { ... }` con variables de color, radio y tipografía; un bloque `:root { ... }` aparte con tamaños de ícono (no es un `@theme`, son variables CSS planas + clases utilitarias manuales) | `assets/css/ds/tokens.css` |
| Fuente | **IBM Plex Sans**, cargada desde Google Fonts: `<link rel="preconnect" href="https://fonts.googleapis.com" />` + `<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />` | `frames/design-system.html` |
| Iconografía | **Phosphor Icons**, cargado como icon-font vía CDN sin versión fijada: `<script src="https://unpkg.com/@phosphor-icons/web"></script>` | `frames/design-system.html` |
| Componentes | **Web Components nativos** (`class extends HTMLElement`, `customElements.define(...)`). No hay React, Vue ni ningún framework de UI — cada componente hace `this.innerHTML = \`...\`` dentro de `connectedCallback()` / `attributeChangedCallback()`. Módulos ES nativos (`<script type="module">`), sin bundler ni transpilación en producción. | Los 19 archivos de `components/design-system/` |
| Otras dependencias JS | Ninguna. Dos utilidades propias sin dependencias externas: `escapeHtml()` y `nextId()` | `components/design-system/ds-utils.js` |
| Montaje de la página del Design System | `pages/design-system/index.html` (parte del "chrome" oscuro del ERP) embebe `frames/design-system.html` (el Design System en sí, tema claro) dentro de un `<iframe>` de altura fija `5400px` | `pages/design-system/index.html`, `assets/css/design-system.css` |

---

## 2. Paleta de colores

Fuente literal: bloque `@theme` en `assets/css/ds/tokens.css`. Nombres de variable exactamente como están en el código (prefijo `--color-`).

### Brand

| Token | Hex | Uso observado |
|---|---|---|
| `--color-brand-primary` | `#3D5FEB` | Fondo de botón primario, texto de links, borde de foco en inputs/select/textarea, fondo de ítem activo en sidebar, checkbox `accent`, punto de "no leído" |
| `--color-brand-primary-hover` | `#2C46C4` | Hover/active de botón primario y del texto de link |
| `--color-brand-primary-soft` | `#EEF1FD` | Fondo de badge/callout "info", fila seleccionada en tabla, ítem activo de sidebar secundario (vía `bg-white`, no soft — ver nota), chip de logo en header de layout |
| `--color-brand-navy` | `#0B1440` | Fondo de sidebar principal, avatar de usuario, wordmark de marca |
| `--color-brand-slate` | `#7C8DA6` | Isotipo del logo sobre fondo claro |

### Text

| Token | Hex | Uso observado |
|---|---|---|
| `--color-text-primary` | `#16213E` | Texto principal en casi todos los componentes (títulos, valores de celda, labels) |
| `--color-text-secondary` | `#5B6B85` | Subtítulos, descripciones de sección, texto de apoyo, fondo de botón "secondary" |
| `--color-text-muted` | `#94A0B8` | Metadata, placeholders (implícito), texto de eyebrow ("Tokens", "Variantes"), hex de color en la paleta |

### Surfaces

| Token | Hex | Uso observado |
|---|---|---|
| `--color-surface` | `#FFFFFF` | Fondo de cards, inputs, tabla, modal, botón outline |
| `--color-surface-subtle` | `#FAFBFC` | Fondo de header de tabla, hover de filas de tabla, fondo de sidebar secundario |
| `--color-surface-hover` | `#F1F2F5` | Hover de botón "text", hover de ítems de sidebar/nav, hover de icon-buttons |
| `--color-background` | `#F6F7FA` | Fondo de página, fondo de campo deshabilitado, fondo de área de contenido del layout |

### Bordes

| Token | Hex | Uso observado |
|---|---|---|
| `--color-border-default` | `#E2E5EC` | Borde estándar de cards, tablas, separadores internos, modal |
| `--color-border-strong` | `#C7CEDB` | Borde de botón outline, botones de paginación, modal (variante literal) |
| `--color-border-input` | `#AEB9CE` | Borde por defecto (no-error) de input/select/textarea |

### Semantic (feedback)

| Estado | Fuerte | Suave | Uso observado |
|---|---|---|---|
| Success | `--color-success` `#1D9A6C` | `--color-success-soft` `#E7F6EF` | Badge "Activa", toast de éxito, ícono de actividad, botón variante `success` |
| Warning | `--color-warning` `#D97706` | `--color-warning-soft` `#FDF3E2` | Badge "Pendiente", toast de advertencia, botón variante `warning` |
| Danger | `--color-danger` `#DC2626` (hover `--color-danger-hover` `#C21E1E`) | `--color-danger-soft` `#FBEAEA` | Badge "Vencida", borde/mensaje de error de input, botón variante `danger`, ícono "eliminar" en tabla (`hover:bg-danger-soft`) |
| Help | `--color-help` `#7C3AED` (hover `--color-help-hover` `#6D28D9`) | — (sin `-soft` definido) | Botón variante `help` únicamente |
| Disabled | `--color-disabled` `#A9B4E8` | — | Fondo y borde de cualquier botón `disabled` |

### ⚠️ Valores duplicados / inconsistencias de color

El código convive con **dos representaciones del mismo color**: la clase-token (`bg-brand-primary`, `border-border-default`, `text-danger`, etc.) y el valor hexadecimal literal en Tailwind arbitrario (`bg-[#3D5FEB]`, `border-[#E2E5EC]`, `text-[#DC2626]`). Ambas producen el color visual idéntico porque el hex literal coincide con el token; la diferencia es solo de mantenibilidad (el literal no se actualiza si el token cambia).

Componentes que **sí** usan las clases-token de color (`bg-brand-primary`, `text-text-secondary`, `border-border-default`, etc.): `ds-button.js`, `ds-badge.js`, `ds-card.js`, `ds-input.js`, `ds-select.js`, `ds-textarea.js`, `ds-icons.js`, `ds-layout.js`, `ds-form-fields.js`, `ds-typography.js`.

Componentes que usan **hex literal** en vez del token (mismo valor, otra sintaxis): `ds-palette.js`, `ds-buttons.js` (el markup de la sección "Botones", no `ds-button.js`), `ds-cards.js` (el markup de la sección, no `ds-card.js`), `ds-toast.js`, `ds-list.js`, `ds-data-table.js`, `ds-modal.js`.

Ejemplo concreto: `ds-modal.js` usa `border-[#C7CEDB]` (línea 8) — es exactamente `--color-border-strong`, pero escrito como hex en vez de `border-border-strong`.

**Qué se está usando realmente en pantalla:** en ambos casos el valor final renderizado es el mismo (los hex literales coinciden 1:1 con los tokens de `tokens.css`); no hay ningún color "huérfano" que no esté en la tabla de tokens de arriba.

---

## 3. Tipografía

### Familia

```
"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
```

Token: `--font-sans` en `tokens.css`. Se carga con pesos 400/500/600/700 desde Google Fonts (ver [§1](#1-tecnología-y-dependencias-visuales)).

### Escala declarada (tokens)

`tokens.css` declara **4 tamaños**, explícitamente comentados como "solo 4 a propósito: chico, mediano, grande, extragrande":

| Token | Valor |
|---|---|
| `--text-sm` | 12px |
| `--text-md` | 13.5px |
| `--text-lg` | 15px |
| `--text-xl` | 18px |

**Dónde se usan realmente estas clases-token** (`text-sm`/`text-md`/`text-lg`/`text-xl`): únicamente en el andamiaje de cada sección del catálogo — el título `<h2 class="text-lg ...">` y la descripción `<p class="text-sm ...">` que encabezan cada bloque (`ds-form-fields.js`, `ds-icons.js`, `ds-layout.js`, `ds-cards.js`, `ds-typography.js`), y en la vitrina de tamaños de `ds-typography.js` misma. **Ningún componente interactivo real (botón, input, badge, celda de tabla, toast, modal) usa estas clases-token** — todos usan tamaños literales en píxeles (ver abajo).

### ⚠️ Escala realmente renderizada (superset, no declarada como tokens)

Barriendo `text-[Npx]` en los 19 archivos aparecen **11 tamaños distintos**, no 4. Esta es la escala tipográfica real del producto:

| px real | ¿Coincide con un token? | Dónde se usa |
|---|---|---|
| 18px | = `--text-xl` | Wordmark de marca en la demo de logo (`ds-palette.js`), especimen "Aa" (`ds-typography.js`, vía clase `text-xl`) |
| 17px | Sin token — entre `text-lg` (15) y `text-xl` (18) | Título del modal (`ds-modal.js`) |
| 15px | = `--text-lg`, pero escrito literal | Título `<h2>` de cada sección en los componentes "legacy" (`ds-buttons.js`, `ds-data-table.js`, `ds-list.js`, `ds-palette.js`, `ds-toast.js`, `ds-modal.js`) — el mismo rol que `text-lg`, pero como literal en vez de token |
| 13.5px | = `--text-md`, y también como token | Texto de botón, texto de input/select/textarea, título de card (`ds-card.js`), texto de fila de lista, texto de header de layout, mensaje de campo con énfasis — **el tamaño más usado del sistema** |
| 13px | Sin token — muy cercano a `--text-md` (13.5) pero no idéntico | Descripciones de sección legacy, texto de celda de tabla, texto de ítem de icon gallery, texto de nav de ejemplo |
| 12.5px | Sin token — entre `--text-sm` (12) y `--text-md` (13.5) | Labels de campo (input/select/textarea), texto de toolbar de tabla, descripción del modal, subtítulo de actividad |
| 12px | = `--text-sm` | Mensajes de ayuda/error de campo, texto de badge, tamaño de archivo en lista de documentos |
| 11.5px | Sin token — por debajo de `--text-sm` | Encabezados de columna de tabla, texto de footer de modal, timestamp de actividad |
| 11px | Sin token | Eyebrow labels ("Tokens", "Variantes", "Íconos", "Estados"), texto del tag "Nivel 2" del modal |
| 10.5px | Sin token | `<dt>` de la grilla de definición del modal, nota de auditoría del footer del modal |
| 10px | Sin token — el más chico de todo el sistema | Texto del badge "Nivel 2" del header del modal |

**Conclusión de la inconsistencia:** el principio "solo 4 tamaños" declarado en `tokens.css` no se cumple en el resto del código — conviven la escala de 4 tokens (usada solo para títulos/descripciones de sección) con una escala mucho más fina de valores ad-hoc (usada en todos los componentes reales). Si se reconstruye en React, esta tabla de 11 valores es la que hay que replicar para que el resultado se vea igual al original; los 4 tokens de `--text-*` por sí solos no alcanzan.

### Pesos

| Clase | Peso CSS | Uso |
|---|---|---|
| `font-normal` | 400 | Texto de cuerpo por defecto |
| `font-medium` | 500 | Labels, botones, texto con algo de énfasis |
| `font-semibold` | 600 | Títulos de sección y de card, nombres en badges/filas |
| `font-bold` | 700 | Wordmark de marca (`font-bold tracking-tight`) |

### Line-height y letter-spacing

No hay tokens custom de `line-height` ni `letter-spacing`; se usan directamente las utilidades por defecto de Tailwind:

- `tracking-tight` — en todos los `<h2>` de sección, en el wordmark de marca y en el título del modal.
- `tracking-wide` — un solo uso: el label "Dashboard" (mayúscula, vía `uppercase`) sobre los submódulos del sidebar secundario (`ds-layout.js`).
- `leading-snug` / `leading-tight` — en descripciones de sección y en el título del modal.

### Opacidad como jerarquía de texto

`ds-typography.js` documenta un patrón de 4 pasos de opacidad sobre `text-primary` para variar el énfasis sin declarar un color nuevo: `text-text-primary` (100%), `text-text-primary/75`, `text-text-primary/50`, `text-text-primary/30`. Es una demostración en la vitrina; no se ve usado en los componentes funcionales fuera de `ds-typography.js`.

---

## 4. Spacing

**No existen tokens CSS de espaciado** (no hay `--space-*` en `tokens.css`). El espaciado se resuelve enteramente con la escala por defecto de Tailwind (unidad base = 4px) aplicada como clases de utilidad (`p-`, `px-`, `py-`, `m-`, `gap-`, etc.) directamente en cada componente.

### Valores de la escala Tailwind realmente observados en el código

| Clase (sufijo) | px | Ejemplos de uso |
|---|---|---|
| `0.5` | 2px | `mt-0.5` (íconos alineados con texto), `gap-0.5` |
| `1` | 4px | `mb-1`, `mt-1` (separación título/subtítulo) |
| `1.5` | 6px | `mb-1.5`, `py-1.5`, `gap-1.5` (muy frecuente en botones e icon-buttons) |
| `2` | 8px | `gap-2`, `mb-2`, `py-2` (padding vertical de botón) |
| `2.5` | 10px | `mb-2.5` (debajo de cada eyebrow label), `px-2.5` (badges) |
| `3` | 12px | `gap-3`, `p-3`, `px-3` (padding horizontal estándar de input) |
| `3.5` | 14px | `mb-3.5`, `px-3.5`, `pl-3.5` (padding de celda de tabla) |
| `4` | 16px | `gap-4`, `px-4`, `py-4` (padding horizontal de botón, header de card) |
| `5` | 20px | `mb-5` (debajo de cada descripción de sección), `py-5` |
| `6` | 24px | `gap-6`, `pt-6`, `mb-6` (separadores entre bloques dentro de una card) |
| `7` | 28px | `p-7` (padding estándar de **todas** las cards contenedoras de sección), `gap-7`, `mb-7` |
| `8` | 32px | `p-8` (mockup de mensaje interno de card en `ds-modal.js`) |
| `12` | 48px | `mb-12` (separación entre secciones del catálogo, en **todos** los componentes) |

### Valores arbitrarios puntuales (no forman parte de la escala)

Estos aparecen como excepciones explícitas en `Npx` entre corchetes, no como parte de la progresión anterior:

- `gap-[7px]` — separación ícono/texto dentro de un botón (`ds-button.js`, `ds-list.js`).
- `py-[11px]` — padding vertical de celda en `ds-data-table.js` (en vez de `py-3` o `py-2.5`).
- `pl-[30px]` — padding izquierdo del input de búsqueda de la tabla, para dejar lugar al ícono (`ds-data-table.js`).
- `py-[7px]` — padding vertical del mismo input de búsqueda.

### Patrón consistente encontrado

- **`p-7` (28px) es el padding estándar** del contenedor blanco de cada sección del catálogo (card blanca con `border-border-default rounded-card`), sin excepciones.
- **`mb-12` (48px)** separa una sección del catálogo de la siguiente, sin excepciones.
- **`mb-2.5` (10px)** separa un eyebrow label de su contenido, de forma consistente.

---

## 5. Bordes

### Border width

| Ancho | Dónde |
|---|---|
| `1px` (clase `border`, default de Tailwind) | Cards, tablas, botones, toasts, badges (no llevan borde), popovers de paginación, modal |
| `1.5px` (`border-[1.5px]`) | Input, select y textarea — deliberadamente más grueso que el resto para que el campo se note más como control interactivo |

### Border color

Ver tabla de "Bordes" en [§2](#2-paleta-de-colores) (`border-default` / `border-strong` / `border-input`). Regla de estado en campos de formulario:

- Normal → `border-border-input` (`#AEB9CE`)
- Foco → `border-brand-primary` (`#3D5FEB`), vía `focus:border-brand-primary`
- Error (`state="error"`) → `border-danger` (`#DC2626`)

### Border radius

Tokens reales en `tokens.css`:

| Token | Valor |
|---|---|
| `--radius-chip` | 2px |
| `--radius-control` | 3px |
| `--radius-card` | 4px |

No hay radios grandes (8px+) en ningún componente. `rounded-full` se usa aparte para elementos explícitamente circulares/pill: badges, avatar, punto de badge, knob y pista del switch, columna de checkbox de tabla no (esa es cuadrada).

**Duplicación (igual que con color):** el radio se referencia a veces con la clase-token (`rounded-chip`, `rounded-control`, `rounded-card` — usado en `ds-icons.js`, `ds-layout.js`, `ds-card.js`, `ds-form-fields.js`, `ds-input.js`, `ds-select.js`, `ds-textarea.js`, `ds-button.js`) y a veces con el valor literal (`rounded-[2px]`, `rounded-[3px]`, `rounded-[4px]` — usado en `ds-palette.js`, `ds-buttons.js`, `ds-toast.js`, `ds-list.js`, `ds-modal.js`, `ds-data-table.js`). A diferencia de la tipografía, **acá no hay drift de valor**: el literal siempre coincide exactamente con el token (2, 3 o 4px) — solo cambia la sintaxis, nunca el resultado visual.

| Radio real | Token equivalente | Clase literal equivalente |
|---|---|---|
| 2px | `rounded-chip` | `rounded-[2px]` |
| 3px | `rounded-control` | `rounded-[3px]` |
| 4px | `rounded-card` | `rounded-[4px]` |

---

## 6. Shadows

No hay tokens `--shadow-*` en `tokens.css` (a diferencia del sistema oscuro del portal, que sí los tiene en `assets/css/documentation.css`). Los tres niveles de sombra usados vienen directo de utilidades/valores de Tailwind:

| Sombra | Clase / valor | Dónde aparece |
|---|---|---|
| Sutil | `shadow-sm` | Toast (`ds-toast.js`), ítem de navegación activo dentro del sidebar secundario del mockup de layout (`ds-layout.js`), knob del switch (clase `shadow` sin sufijo — sombra por defecto de Tailwind, `ds-form-fields.js`) |
| Flotante | `shadow-lg` | Popover de selector de tamaño de página y de selector de página, dentro de la paginación de `ds-data-table.js` |
| Modal | `shadow-[0_18px_50px_rgba(11,20,64,0.18)]` | Único uso: el diálogo de `ds-modal.js`. Es la sombra más grande de todo el sistema y es un valor arbitrario, no una utilidad Tailwind estándar |

El fondo oscurecido (`backdrop`) del modal usa `rgba(11,20,64,0.56)` con `backdrop-filter: blur(1.5px)`, declarado en un `<style>` inline dentro del propio componente (`.enterprise-modal::backdrop`).

---

## 7. Iconografía

- **Librería oficial y única: Phosphor Icons**, cargada como icon-font (no SVG inline, no otro paquete de íconos). Documentado explícitamente en `ds-icons.js`: *"No mezclar otras librerías de iconos dentro del Design System"*.
- Cada ícono se renderiza como `<i class="{peso} ph-{slug} icon-{tamaño}">` a través de la función `phosphorIcon(name, { size, weight, className })` en `components/design-system/ds-phosphor.js`. El color siempre viene de `currentColor` — nunca un color fijo dentro del ícono.

### Tamaños (tokens reales, `tokens.css`)

| Token | px | Uso documentado en `ds-icons.js` |
|---|---|---|
| `--icon-xs` | 14px | Badges, metadata y acciones pequeñas |
| `--icon-sm` | 16px | Inputs, tablas, filtros y botones compactos |
| `--icon-md` | 20px | **Tamaño estándar general**: sidebar, navegación y botones normales |
| `--icon-lg` | 24px | Cards y acciones destacadas |
| `--icon-xl` | 32px | Empty states y estados especiales |

### Pesos

| Peso | Uso documentado |
|---|---|
| Regular | Uso estándar y por defecto en todo el sistema |
| Bold | Acciones o elementos con mayor jerarquía visual |
| Fill | Estados activos/seleccionados (ítem de sidebar activo, tab activo) |
| Duotone | Solo para empty states — no es un peso de uso habitual |

### Reglas explícitas (comentario/copy de `ds-icons.js`)

- Tamaño estándar general: 20px Regular. Inputs y tablas: 16px Regular. Sidebar: 20px Regular.
- Los elementos activos pueden usar Fill.
- Mantener tamaños consistentes dentro de un mismo contexto.
- Los íconos heredan el color con `currentColor` — nunca colores arbitrarios.
- No usar diferentes íconos para representar la misma acción.

### Mapa de nombres (acción → slug de Phosphor)

Definido en `ICON_NAMES` (`ds-phosphor.js`) — la clave corta es lo que reciben los atributos `icon="..."` de los componentes; el valor es el slug real de Phosphor:

| Clave corta | Slug Phosphor |
|---|---|
| `edit` / `pencil` | `pencil` |
| `delete` / `trash` | `trash` |
| `search` / `magnifying-glass` | `magnifying-glass` |
| `add` / `plus` | `plus` |
| `settings` / `gear` | `gear` |
| `close` / `x` | `x` |
| `download` | `download-simple` |
| `upload` | `upload-simple` |
| `more-vertical` | `dots-three-vertical` |
| `user` | `user` |
| `users` | `users` |
| `view` / `eye` | `eye` |
| `check` | `check` |
| `arrow-right` | `arrow-right` |
| `info` | `info` |
| `warning` | `warning` |
| `warning-circle` | `warning-circle` |
| `check-circle` | `check-circle` |
| `x-circle` | `x-circle` |
| `caret-down` | `caret-down` |
| `caret-left` | `caret-left` |
| `caret-right` | `caret-right` |
| `home` | `house` |
| `star` | `star` |
| `shield-check` | `shield-check` |
| `heart` | `heart` |
| `bell` | `bell` |
| `sort-ascending` | `sort-ascending` |
| `sort-descending` | `sort-descending` |
| `caret-up-down` | `caret-up-down` |
| `file` | `file` |
| `dashboard` / `squares-four` | `squares-four` |
| `buildings` / `insurers` | `buildings` |
| `certificate` | `certificate` |
| `claims` / `siren` | `siren` |

`star`, `heart`, `sort-ascending`, `sort-descending` y `caret-up-down` están **declarados en el mapa pero no se usan actualmente en ningún componente renderizado** (búsqueda exhaustiva en los 19 archivos) — quedan disponibles pero sin caso de uso real hoy.

### Íconos efectivamente renderizados hoy, y dónde

| Ícono (clave) | Dónde se usa |
|---|---|
| `search` | Ícono dentro de `ds-input`, buscador de `ds-data-table` |
| `warning-circle` | Mensaje de error de `ds-input` |
| `check` | Ejemplo de botón con ícono, checkmark de opción seleccionada en paginación |
| `arrow-right` | Ejemplo de botón con ícono a la derecha |
| `download` | Botón "Exportar" de tabla, botón de descarga de `ds-list`, ejemplos de `ds-buttons` |
| `delete` (Trash) | Icon-button de eliminar en galería, ejemplo de botón `danger` |
| `add` (Plus) | Botón "Nueva póliza" de la tabla |
| `settings` (Gear) | Galería de íconos, header del mockup de layout, ejemplo de nav |
| `close` (X) | Botón de cerrar de toast y de modal |
| `upload` | Solo en la galería de referencia |
| `more-vertical` | Galería de íconos, acción de fila de tabla de ejemplo |
| `user` | Solo en la galería de referencia |
| `users` | Galería, ejemplo de nav, módulo "Clientes" del mockup de layout |
| `view` (Eye) | Acciones de fila en tabla real y de ejemplo |
| `home` (House) | Ejemplo de ítem de sidebar activo |
| `shield-check` | Banner de "librería oficial", header del mockup de layout, header del modal |
| `bell` | Header del mockup de layout |
| `check-circle` | Toast de éxito, ítem de actividad de éxito, viñeta de reglas (íconos y layout) |
| `x-circle` | Toast de error, ítem de actividad "vencida" |
| `warning` | Toast de advertencia, ítem de actividad "pendiente de pago" |
| `info` | Callout informativo del modal |
| `file` | Ícono de documento en `ds-list` (actividad y lista de documentos) |
| `caret-down` | Select, triggers de paginación |
| `caret-left` / `caret-right` | Flechas prev/next de paginación |
| `dashboard`, `buildings`, `shield-check`, `certificate`, `users`, `siren`, `settings` | Un ícono por cada módulo del sidebar principal del mockup de layout |

---

## 8. Componentes existentes

Cada componente es un Custom Element (`customElements.define`) definido en `components/design-system/<archivo>.js`. Las props/variantes se pasan como **atributos HTML** (no JS props), leídos en cada `render()` con `this.getAttribute(...)`.

### Button — `ds-button.js`

**Variants** (atributo `variant`, default `primary`):

| Variante | Fondo | Borde | Texto | Hover |
|---|---|---|---|---|
| `primary` | `brand-primary` | `brand-primary` | Blanco | `brand-primary-hover` |
| `secondary` | `text-secondary` (`#5B6B85`) | `text-secondary` | Blanco | `#46546B` (literal, no token) |
| `outline` | Blanco | `border-strong` | `text-primary` | `#F8F9FB` (literal, no token) |
| `text` | Transparente | Transparente | `text-secondary` | `surface-hover` |
| `link` | Transparente | Transparente | `brand-primary`, subrayado al hover | `brand-primary-hover` + `underline underline-offset-4` |
| `success` | `success` | `success` | Blanco | `#17805A` (literal) |
| `danger` | `danger` | `danger` | Blanco | `danger-hover` |
| `warning` | `warning` | `warning` | Blanco | `#B96305` (literal) |
| `help` | `help` | `help` | Blanco | `help-hover` |

**Sizes:** no existe atributo de tamaño. Un único tamaño para todo el sistema.

**Visual properties (todas las variantes):**
- Layout: `inline-flex items-center justify-center`
- Gap ícono/texto: `gap-[7px]`
- Padding: `px-4 py-2` (16px / 8px)
- Font: `text-[13.5px] font-medium`
- Border: `1px` (clase `border`) + color de variante
- Radius: `rounded-control` (3px)
- Transición: `transition-colors`

**Icon:** atributos `icon` (slug corto, ver [§7](#7-iconografía)), `icon-position` (`left` default / `right`), `icon-size` (default `md` = 20px), `icon-weight` (default `regular`).

**States:**
- `default` — como en la tabla de variantes.
- `hover` — color de fondo/borde/texto oscurece un paso (ver columna Hover).
- `focus` — **no hay estilo de foco propio definido en el componente**; depende del foco nativo del navegador sobre el `<button>`.
- `active` (`:active`) — **no implementado**, no hay ninguna clase `active:` en el componente.
- `disabled` — atributo booleano `disabled`. Fuerza `bg-disabled border-disabled text-white`, quita el subrayado (`no-underline`) y pone `cursor-not-allowed`, **para las 9 variantes por igual** (mismo aspecto de disabled sin importar la variante original).
- `loading` — **no implementado**. No existe atributo ni spinner en el componente.

**Usage:** acción interactiva de la UI; es el único componente de botón del sistema (no hay `IconButton` como Custom Element separado — ver nota más abajo).

**Example (uso real, HTML):**
```html
<ds-button text="Guardar" variant="primary" icon="check"></ds-button>
<ds-button text="Exportar" variant="outline" icon="download" icon-size="sm"></ds-button>
<ds-button text="Ícono derecho" variant="primary" icon="arrow-right" icon-position="right"></ds-button>
<ds-button text="Eliminar" variant="danger" icon="trash"></ds-button>
<ds-button text="Deshabilitado" variant="primary" disabled></ds-button>
```

**Example (equivalente JSX para reconstrucción en React):**
```jsx
<Button variant="primary" icon="check">Guardar</Button>
<Button variant="outline" icon="download" iconSize="sm">Exportar</Button>
<Button variant="primary" icon="arrow-right" iconPosition="right">Ícono derecho</Button>
<Button variant="danger" icon="trash">Eliminar</Button>
<Button variant="primary" disabled>Deshabilitado</Button>
```

> **Nota — "IconButton":** no existe un componente separado para botones de solo ícono. El patrón se repite como markup manual (`<button class="w-[26px] h-[26px] flex items-center justify-center rounded-chip ...">`) en `ds-icons.js` y en las acciones de fila de `ds-data-table.js`. Tamaño consistente: **26×26px**, `rounded-chip` (2px), ícono 16px, color `text-secondary` con hover `surface-hover` (o `text-danger`/`hover:bg-danger-soft` para la acción de eliminar).

---

### Badge — `ds-badge.js`

**Variants** (atributo `variant`, default `neutral`):

| Variante | Fondo | Texto |
|---|---|---|
| `success` | `success-soft` | `success` |
| `warning` | `warning-soft` | `warning` |
| `danger` | `danger-soft` | `danger` |
| `info` | `brand-primary-soft` | `brand-primary` |
| `neutral` | `surface-hover` | `text-secondary` |

**Sizes:** un único tamaño.

**Visual properties:**
- `inline-flex items-center gap-1.5`
- Padding: `px-2.5 py-1` (10px / 4px)
- Font: `text-[12px] font-medium`
- Radius: `rounded-full`

**Icon:** no lleva ícono; atributo booleano `dot` agrega un punto de `w-1.5 h-1.5 rounded-full bg-current` (6px) antes del texto.

**States:** no interactivo — no tiene hover/focus/disabled.

**Usage:** etiqueta de estado corta (ej. "Activa", "Pendiente", "Vencida", "Renovación automática").

**Example:**
```html
<ds-badge text="Activa" variant="success" dot></ds-badge>
<ds-badge text="Vencida" variant="danger" dot></ds-badge>
<ds-badge text="Renovación automática" variant="info"></ds-badge>
```
```jsx
<Badge variant="success" dot>Activa</Badge>
<Badge variant="danger" dot>Vencida</Badge>
<Badge variant="info">Renovación automática</Badge>
```

> **StatusBadge:** no existe como componente separado — el mismo `ds-badge` (o el mismo patrón de pill con punto, ver §13) cubre ese caso de uso; en `ds-data-table.js` la píldora de estado se re-implementa a mano con el mismo patrón visual en vez de usar `<ds-badge>` (otra duplicación de markup, mismo resultado visual).

---

### Card — `ds-card.js`

**Variants:** ninguna (un solo estilo visual).

**Visual properties:**
- Contenedor: `bg-white border border-border-default rounded-card overflow-hidden`
- Header (solo si hay atributo `title`): `px-5 py-4 border-b border-border-default`; título `text-[13.5px] font-semibold text-text-primary`; subtítulo opcional (atributo `subtitle`) `text-[12px] text-text-secondary`
- Body: `p-7` (28px) salvo que el atributo `padded="false"` lo desactive

**States:** no interactivo.

**Usage:** contenedor de contenido agrupado, con o sin header.

**Example:**
```html
<ds-card title="Póliza PL-20481" subtitle="Constructora Andina S.A. · Vehicular">
  <div class="flex items-center justify-between text-[13px] text-text-primary">
    <span>Prima mensual</span>
    <span class="font-semibold">Bs 1,240.00</span>
  </div>
</ds-card>
```
```jsx
<Card title="Póliza PL-20481" subtitle="Constructora Andina S.A. · Vehicular">
  <div className="flex items-center justify-between text-[13px] text-text-primary">
    <span>Prima mensual</span>
    <span className="font-semibold">Bs 1,240.00</span>
  </div>
</Card>
```

---

### Input — `ds-input.js`

**Variants / modos:**
- `layout="default"` (implícito) — label arriba del campo.
- `layout="horizontal"` — label a la izquierda, ancho configurable con `label-width` (default `140px`).
- `icon="search"` — único ícono soportado hoy dentro del campo (a la izquierda).

**Sizes:** un único tamaño.

**Visual properties:**
- Label: `text-[12.5px] font-medium text-text-primary`, `mb-1.5` en modo default.
- Campo: `text-[13.5px] rounded-control border-[1.5px] px-3 py-1.5` (o `pl-8 pr-3` si tiene ícono de búsqueda).
- Ícono de búsqueda: `icon-sm` (16px), `absolute left-2.5`, `pointer-events-none`.

**States:**
- `default` — borde `border-input`.
- `focus` — borde `brand-primary` (`focus:border-brand-primary`). También existe un estado explícito `state="focus"` que fuerza el mismo borde sin necesidad de foco real (para capturas/demos).
- `error` (`state="error"`) — borde `danger`, `aria-invalid="true"`, mensaje con ícono `warning-circle` en `text-danger`.
- `disabled` — atributo `disabled`; fondo `background` (`#F6F7FA`), texto `text-muted`, `cursor-not-allowed`.
- `required` — asterisco rojo (`text-danger`) junto al label.
- `readonly` — **no implementado** (no hay atributo `readonly` en `observedAttributes`).

**Usage:** campo de texto de una línea; mensaje de ayuda o error opcional debajo, enlazado por `aria-describedby`.

**Example:**
```html
<ds-input label="Nombre del asegurado" placeholder="Ej. María Fernanda Rojas"></ds-input>
<ds-input label="Buscar cliente" placeholder="Buscar por nombre o CI..." icon="search"></ds-input>
<ds-input label="N° de póliza" placeholder="PL-00000" state="error" message="Este número de póliza ya existe"></ds-input>
<ds-input label="Campo deshabilitado" placeholder="No disponible" disabled></ds-input>
<ds-input layout="horizontal" label="Correo" type="email" placeholder="nombre@correo.com"></ds-input>
```
```jsx
<Input label="Nombre del asegurado" placeholder="Ej. María Fernanda Rojas" />
<Input label="Buscar cliente" placeholder="Buscar por nombre o CI..." icon="search" />
<Input label="N° de póliza" placeholder="PL-00000" state="error" message="Este número de póliza ya existe" />
<Input label="Campo deshabilitado" placeholder="No disponible" disabled />
<Input layout="horizontal" label="Correo" type="email" placeholder="nombre@correo.com" />
```

> **SearchInput:** no es un componente separado — es `ds-input` con `icon="search"`. El buscador de `ds-data-table.js` **no** usa `ds-input`; reimplementa el mismo patrón visual a mano con valores literales (`border-[#C7CEDB] rounded-[3px]`, padding `pl-[30px] pr-3 py-[7px]`) — otra duplicación de markup con resultado visualmente equivalente pero levemente distinto en el padding.

---

### Select — `ds-select.js`

Mismas convenciones visuales que `ds-input` (label, borde, estados, mensaje), con estas diferencias:

- Opciones vía atributo `options` como string separado por comas (`"Vehicular,Vida,SOAT,Incendio,Carga"`), parseado a `<option>`.
- `appearance-none` + ícono `caret-down` (16px) posicionado absoluto a la derecha, para reemplazar la flecha nativa del `<select>`.
- Padding: `pl-3 pr-8` (deja lugar al caret).
- **No tiene** soporte de ícono a la izquierda (a diferencia de `ds-input`).

**States:** `default` / `error` (borde `danger`) / `disabled` (mismo tratamiento que Input). No hay estado `focus` explícito más allá del `focus:border-brand-primary` nativo del `<select>`.

**Example:**
```html
<ds-select label="Tipo de seguro" options="Vehicular,Vida,SOAT,Incendio,Carga" value="Vehicular"></ds-select>
```
```jsx
<Select label="Tipo de seguro" options={["Vehicular", "Vida", "SOAT", "Incendio", "Carga"]} value="Vehicular" />
```

---

### Textarea — `ds-textarea.js`

Mismas convenciones que `ds-input` (label, borde 1.5px, estados, mensaje), sin ícono. Diferencias propias:

- Atributo `rows` (default `3`).
- `resize-y` (solo se puede redimensionar verticalmente).

**Example:**
```html
<ds-textarea label="Notas internas" placeholder="Observaciones sobre la póliza..."></ds-textarea>
```
```jsx
<Textarea label="Notas internas" placeholder="Observaciones sobre la póliza..." rows={3} />
```

---

### Checkbox (patrón, no Custom Element)

No existe `<ds-checkbox>`. Es un `<input type="checkbox">` nativo con clases utilitarias repetidas donde se necesita:

- `w-4 h-4 rounded-chip accent-brand-primary` (16px, radio 2px, color de check nativo = azul primario) — en formularios y en la lista de documentos seleccionables.
- Variante más chica `w-3.5 h-3.5` para el checkbox de "seleccionar todos" de la lista de documentos.
- En `ds-data-table.js` se usa la misma clase `w-4 h-4 accent-[#3D5FEB]` (hex literal, mismo valor).

**States:** `checked`/`unchecked` (nativo), `indeterminate` (seteado vía JS: `selectAllDocs.indeterminate = ...` en `ds-list.js`). No hay estado visual de error/disabled propio más allá del comportamiento nativo del navegador.

---

### Radio button

**No existe** en el Design System actual — no se documenta (ninguna referencia en los 19 archivos).

---

### Switch / Toggle (patrón, no Custom Element)

Definido inline en `ds-form-fields.js`, construido con un checkbox oculto (`sr-only peer`) + dos `<span>`:

- Pista: `w-[34px] h-[19px] rounded-full`, `bg-[#D7DBE3]` (gris, no es un token — valor único de este componente) en estado apagado, `peer-checked:bg-brand-primary` en encendido.
- Knob: `absolute w-[15px] h-[15px] rounded-full bg-white shadow`, se desliza de `left-[2px]` a `peer-checked:left-[17px]`.
- Transición: `transition-colors` (pista), `transition-all` (knob).

**States:** `on`/`off` únicamente. No hay `disabled` documentado para este control.

**Example:**
```html
<label class="inline-flex items-center gap-2.5 cursor-pointer text-[13.5px] text-text-primary">
  <input type="checkbox" checked class="peer sr-only" />
  <span class="w-[34px] h-[19px] rounded-full relative bg-[#D7DBE3] peer-checked:bg-brand-primary transition-colors">
    <span class="absolute top-[2px] left-[2px] peer-checked:left-[17px] w-[15px] h-[15px] rounded-full bg-white shadow transition-all"></span>
  </span>
  Notificaciones activas
</label>
```

---

### Toast — `ds-toast.js`

**Variants (tono):** `success` / `danger` / `warning` / `info` — cada uno define una barra izquierda sólida (`bg-{color}`) y un ícono del mismo color (`text-{color}`), usando el color "fuerte" del feedback (no el "soft").

**Visual properties:**
- Contenedor: `bg-white border border-border-default rounded-card shadow-sm`, `max-w-sm`, `overflow-hidden`.
- Barra de color: `absolute left-0 top-0 bottom-0 w-[3px]`.
- Padding: `pl-4 pr-3 py-3`.
- Ícono: `icon-md` (20px).
- Título: `text-[13.5px] font-medium`. Descripción: `text-[12.5px] text-text-secondary leading-snug`.
- Botón de cerrar: ícono `close` (16px), `text-text-muted`, sin fondo.

**States:** solo visual estático en el catálogo — no hay lógica de auto-dismiss, apilado ni animación de entrada/salida implementada en el componente (el catálogo solo muestra los 4 tonos en reposo).

**Usage:** notificación flotante para confirmaciones, errores y avisos.

**Example:**
```html
<div class="relative flex items-start gap-3 bg-white border border-[#E2E5EC] rounded-[4px] shadow-sm pl-4 pr-3 py-3 w-full max-w-sm overflow-hidden">
  <span class="absolute left-0 top-0 bottom-0 w-[3px] bg-success"></span>
  <span class="shrink-0 mt-0.5 text-success"><i class="ph ph-check-circle icon-md"></i></span>
  <div class="min-w-0 flex-1">
    <p class="text-[13.5px] font-medium text-[#16213E]">Póliza creada</p>
    <p class="text-[12.5px] text-[#5B6B85] mt-0.5 leading-snug">La póliza PL-20512 se registró correctamente.</p>
  </div>
  <span class="shrink-0 text-[#94A0B8]"><i class="ph ph-x icon-sm"></i></span>
</div>
```
```jsx
<Toast tone="success" icon="check-circle" title="Póliza creada" description="La póliza PL-20512 se registró correctamente." />
```

---

### List — `ds-list.js`

No es un único componente genérico: son **dos patrones distintos** dentro del mismo archivo, ambos dentro de un contenedor `border border-border-default rounded-card overflow-hidden` con filas separadas por `border-b` (excepto la última).

**Patrón A — Lista de actividad:**
- Ícono en chip de `w-9 h-9 rounded-[3px]` con tono semántico (`brand`/`warning`/`success`/`danger`, cada uno `bg-{color}-soft text-{color}`).
- Título `text-[13.5px]`: `font-semibold` si `unread`, `font-medium` si ya se leyó.
- Subtítulo `text-[12.5px] text-text-secondary`.
- Punto azul de 8px (`bg-[#3D5FEB]`) si no está leído; `invisible` (no `display:none`, para no mover el layout) si ya se leyó.
- Timestamp a la derecha, `text-[11.5px] text-text-muted`, ancho fijo `w-16`.
- Toda la fila es clickeable y marca como leída al hacer click; botón "Marcar todas como leídas" arriba a la derecha.

**Patrón B — Lista de documentos seleccionables:**
- Checkbox + ícono `file` (16px) + nombre/tamaño + botón de descarga individual (ícono `download`, 16px).
- Fila seleccionada: `bg-[#EEF1FD]` (= `brand-primary-soft`); no seleccionada: `hover:bg-[#FAFBFC]`.
- Header: checkbox "seleccionar todos" (`indeterminate` quando corresponde) + contador "N de M seleccionados".
- Botón "Descargar seleccionados" (variante primary, con ícono `download`) se deshabilita en 0 seleccionados.

**States:** ver arriba (leído/no-leído, seleccionado/no-seleccionado, botón habilitado/deshabilitado).

**Usage:** feeds de actividad/notificaciones, selección de documentos adjuntos a una póliza.

**Example (patrón B):**
```html
<label class="doc-item flex items-center gap-3 px-4 py-3 border-b border-[#E2E5EC] cursor-pointer bg-[#EEF1FD]">
  <input type="checkbox" checked class="w-4 h-4 accent-[#3D5FEB] shrink-0" />
  <span class="shrink-0 text-text-secondary"><i class="ph ph-file icon-sm"></i></span>
  <div class="min-w-0 flex-1">
    <p class="text-[13.5px] font-medium text-[#16213E] truncate">Condiciones generales.pdf</p>
    <p class="text-[12px] text-[#5B6B85]">240 KB</p>
  </div>
  <button type="button" class="shrink-0 text-[#5B6B85] hover:text-[#16213E]"><i class="ph ph-download-simple icon-sm"></i></button>
</label>
```
```jsx
<DocumentListItem name="Condiciones generales.pdf" size="240 KB" checked onDownload={...} />
```

---

### Table (DataTable) — `ds-data-table.js`

**Estructura:** toolbar (buscador + acciones) → tabla → barra de paginación, todo dentro de una card `p-7`.

**Header:**
- Fondo `surface-subtle`, borde inferior `border-default`.
- Celdas: `text-[11.5px] font-semibold text-text-secondary`, `px-3.5 py-2.5`, alineación `text-left` salvo la columna de monto (`text-right`).
- Primera columna: checkbox de selección (`w-9`).
- Última columna: vacía, ancho fijo `w-10` (reservada para acciones).

**Filas:**
- Altura implícita por padding `py-[11px]` (11px arriba y abajo — el único lugar del sistema con este valor exacto).
- Separador `border-b border-border-default`, sin borde en la última fila (`last:border-b-0`).
- Fondo: `brand-primary-soft` si `selected`, si no `hover:bg-surface-subtle`.
- Texto de celda: `text-[13px]` (id en `font-medium`, resto regular), columna "Tipo" en `text-secondary`.

**Badges de estado (dentro de una celda):** mismo patrón visual que `ds-badge` (pill + punto), pero reimplementado a mano con hex literales por estado: `Activa` → `bg-[#E7F6EF] text-[#1D9A6C]` (= success), `Pendiente` → `bg-[#FDF3E2] text-[#D97706]` (= warning), `Vencida` → `bg-[#FBEAEA] text-[#DC2626]` (= danger).

**Acciones de fila:** icon-buttons de 26×26px (`view`, `edit`), mismo patrón que la galería de `ds-icons.js`.

**Empty state:** **no implementado** — el componente siempre renderiza datos de ejemplo (`POLICIES`, 5 filas fijas); no hay un estado vacío ni condición para mostrarlo.

**Pagination:**
- Contador de rango a la izquierda: `"{inicio}-{fin} de {total} registros"`.
- Selector de tamaño de página: botón (`10 ▾`) + popover (`shadow-lg`) con opciones `[10, 20, 50, 100]`, checkmark en la opción activa.
- Flecha anterior/siguiente: botón cuadrado `w-7 h-7`, `disabled:opacity-40` en los extremos.
- Selector de página: mismo patrón de popover que el de tamaño, con scroll interno (`max-h-52 overflow-y-auto`) si hay muchas páginas.
- Los popovers se cierran al hacer click fuera de la barra de paginación (listener en `document`).

**States:** fila `selected`/no seleccionada; botones prev/next `disabled` en los extremos; popover abierto/cerrado.

**Usage:** listado tabular con selección múltiple, búsqueda, exportación y paginación client-side (los datos son un array fijo en memoria, no hay fetch real).

**Example (fila):**
```html
<tr class="border-b border-[#E2E5EC] last:border-b-0 bg-[#EEF1FD]">
  <td class="pl-3.5 py-[11px]"><input type="checkbox" checked class="w-4 h-4 accent-[#3D5FEB]" /></td>
  <td class="px-3.5 py-[11px] text-[13px] font-medium text-[#16213E]">PL-20481</td>
  <td class="px-3.5 py-[11px] text-[13px] text-[#16213E]">Constructora Andina S.A.</td>
  <td class="px-3.5 py-[11px] text-[13px] text-[#5B6B85]">Vehicular</td>
  <td class="px-3.5 py-[11px]">
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-full bg-[#E7F6EF] text-[#1D9A6C]">
      <span class="w-1.5 h-1.5 rounded-full bg-current"></span>Activa
    </span>
  </td>
  <td class="px-3.5 py-[11px] text-[13px] text-[#16213E] text-right">Bs 1,240.00</td>
  <td class="px-3.5 py-[11px] text-[13px] text-[#5B6B85]">14 Mar 2027</td>
  <td class="px-3.5 py-[11px]">
    <div class="flex items-center gap-1">
      <button class="w-[26px] h-[26px] flex items-center justify-center rounded-[2px] text-text-secondary hover:bg-[#F1F2F5]" aria-label="Ver póliza"><i class="ph ph-eye icon-sm"></i></button>
      <button class="w-[26px] h-[26px] flex items-center justify-center rounded-[2px] text-text-secondary hover:bg-[#F1F2F5]" aria-label="Editar póliza"><i class="ph ph-pencil icon-sm"></i></button>
    </div>
  </td>
</tr>
```
```jsx
<TableRow selected>
  <TableCell><Checkbox checked /></TableCell>
  <TableCell emphasis>PL-20481</TableCell>
  <TableCell>Constructora Andina S.A.</TableCell>
  <TableCell muted>Vehicular</TableCell>
  <TableCell><StatusPill tone="success" dot>Activa</StatusPill></TableCell>
  <TableCell align="right">Bs 1,240.00</TableCell>
  <TableCell muted>14 Mar 2027</TableCell>
  <TableCell>
    <IconButton icon="eye" ariaLabel="Ver póliza" />
    <IconButton icon="pencil" ariaLabel="Editar póliza" />
  </TableCell>
</TableRow>
```

---

### Modal — `ds-modal.js`

**Variants:** una sola composición visual (no hay atributo de variante); el componente demuestra un caso de uso concreto ("Aprobar endoso de póliza"), no un modal genérico vacío.

**Visual properties:**
- Elemento nativo `<dialog>` (`showModal()` / `close()`).
- Ancho: `w-[min(640px,calc(100vw-32px))]`.
- Fondo `bg-white`, borde `border-[#C7CEDB]` (= `border-strong`), `rounded-[4px]` (= `rounded-card`), sombra `shadow-[0_18px_50px_rgba(11,20,64,0.18)]`.
- `::backdrop`: `rgba(11,20,64,0.56)` + `backdrop-filter: blur(1.5px)`.

**Estructura interna:**
1. **Header** (`px-6 pt-5 pb-4 border-b`): ícono (`shield-check`, `lg`) + eyebrow en mayúsculas (`text-[10.5px] font-semibold uppercase tracking-[0.08em]`) + badge de nivel opcional (`text-[10px]`, borde ámbar, fondo `#FFF8E8`) + título (`text-[17px] font-semibold leading-tight`) + descripción (`text-[12.5px]`). Botón de cerrar (ícono `x`, `sm`) arriba a la derecha, `aria-label="Cerrar modal"`.
2. **Cuerpo** (`px-6 py-5`):
   - Grilla de definición 2 columnas (`grid grid-cols-2`, fondo `#FAFBFC`, bordes internos entre celdas): cada celda tiene un `<dt>` (`text-[10.5px] uppercase text-[#7F8CA3]`) y un `<dd>` (`text-[13px]`).
   - Callout de advertencia: borde izquierdo `3px` ámbar (`border-[#D39A2C]`), fondo `#FFF9EC`, ícono `info` + texto `text-[12.5px] text-[#654A17]`.
   - Campo de confirmación obligatorio: label + asterisco rojo + contador de caracteres (`0/20 caracteres`, cambia a verde `#1D7A57` al llegar al mínimo) + `<textarea rows="3">`.
3. **Footer** (`px-6 py-4 border-t`, fondo `#F8F9FB`): nota de auditoría a la izquierda (`text-[11.5px]` + `text-[10.5px]`) + botones `Cancelar` (`ds-button variant="outline"`) y `Aprobar y emitir` (`ds-button variant="primary"`, deshabilitado hasta escribir 20 caracteres).

**States:**
- Abierto / cerrado (`dialog.showModal()` / `dialog.close()`).
- Botón de confirmar: `disabled` mientras la justificación tenga menos de 20 caracteres; se habilita dinámicamente.
- Cierre por: botón "Cancelar", botón "×", click en el `::backdrop` (`if (event.target === dialog) dialog.close()`).

**Usage:** confirmación de una operación irreversible/regulada que requiere justificación escrita y deja registro de auditoría.

**Example (estructura simplificada):**
```html
<dialog class="enterprise-modal ...">
  <div class="bg-white border border-[#C7CEDB] w-[min(640px,calc(100vw-32px))] shadow-[0_18px_50px_rgba(11,20,64,0.18)] rounded-[4px] overflow-hidden">
    <header class="... border-b border-[#E2E5EC]">
      <i class="ph ph-shield-check icon-lg"></i>
      <span class="text-[10.5px] font-semibold uppercase tracking-[0.08em]">Autorización operativa</span>
      <span class="border border-[#E2B86B] bg-[#FFF8E8] ...">Nivel 2</span>
      <h3 class="text-[17px] font-semibold leading-tight">Aprobar endoso de póliza</h3>
      <p class="text-[12.5px]">Operación END-008421 · registrada hoy, 10:42</p>
      <button type="button" data-modal-close aria-label="Cerrar modal"><i class="ph ph-x icon-sm"></i></button>
    </header>
    <div class="px-6 py-5"> <!-- grilla de definición + callout + textarea --> </div>
    <footer class="... border-t bg-[#F8F9FB]">
      <ds-button text="Cancelar" variant="outline" data-modal-close></ds-button>
      <ds-button text="Aprobar y emitir" variant="primary" data-modal-confirm disabled></ds-button>
    </footer>
  </div>
</dialog>
```
```jsx
<Modal open={open} onClose={handleClose}>
  <ModalHeader icon="shield-check" eyebrow="Autorización operativa" levelBadge="Nivel 2"
    title="Aprobar endoso de póliza" description="Operación END-008421 · registrada hoy, 10:42" onClose={handleClose} />
  <ModalBody>
    <DefinitionGrid items={[...]} />
    <WarningCallout>La aprobación modifica la cobertura vigente...</WarningCallout>
    <RequiredTextarea label="Justificación de aprobación" minLength={20} />
  </ModalBody>
  <ModalFooter auditNote="Usuario, fecha, IP y motivo quedarán registrados.">
    <Button variant="outline" onClick={handleClose}>Cancelar</Button>
    <Button variant="primary" disabled={!valid}>Aprobar y emitir</Button>
  </ModalFooter>
</Modal>
```

> **Tooltip:** no existe como componente reusable. El único tooltip del sistema es el que aparece al pasar el mouse sobre un ícono del sidebar principal (`ds-layout.js`): `absolute left-full ml-2`, fondo `brand-navy`, texto blanco `text-xs font-medium`, `rounded-control`, aparece con `opacity-0 scale-95 → group-hover:opacity-100 group-hover:scale-100`.
>
> **Dropdown:** no existe como componente genérico. El único dropdown real es el popover de paginación de `ds-data-table.js` (ver arriba). El caret del `ds-select` no abre un dropdown propio — usa el nativo del navegador.
>
> **Alert / EmptyState / Skeleton:** no existen en el código actual — no se documentan (instrucción explícita: si no existe, no se agrega).

---

## 9. Formularios

Reglas consistentes entre `ds-input`, `ds-select` y `ds-textarea`:

| Regla | Comportamiento |
|---|---|
| Label | `text-[12.5px] font-medium text-text-primary`, arriba del campo (`mb-1.5`) o a la izquierda con `layout="horizontal"` (ancho configurable, default 140px) |
| Placeholder | Atributo `placeholder` nativo del input/select/textarea; sin estilo custom (color por defecto del navegador) |
| Helper text | `<div>` debajo del campo, `text-[12px] text-text-muted`, enlazado con `aria-describedby` |
| Required | Asterisco `<span class="text-danger">*</span>` junto al label; atributo `required` nativo en el control |
| Error | `state="error"` → borde `danger`, `aria-invalid="true"`, mensaje en `text-danger` con ícono `warning-circle` (12px) |
| Disabled | Atributo `disabled` → fondo `background` (`#F6F7FA`), texto `text-muted`, `cursor-not-allowed` |
| Readonly | **No implementado** en ningún campo |
| Tamaños | Un único tamaño para los tres campos (no hay `sm`/`md`/`lg`) |
| Ícono dentro del campo | Solo `ds-input` lo soporta, solo para `icon="search"`, alineado a la izquierda con `pl-8` |

---

## 10. Tablas

(Ver detalle completo en [Table — `ds-data-table.js`](#table-datatable--ds-data-tablejs).) Resumen normativo:

- **Header:** fondo `surface-subtle`, texto `11.5px semibold` `text-secondary`, padding `px-3.5 py-2.5`.
- **Filas:** padding `px-3.5 py-[11px]`, texto `13px`, separador `border-b border-border-default` (sin borde en la última).
- **Hover:** `surface-subtle`.
- **Selección:** fondo `brand-primary-soft` + checkbox marcado.
- **Acciones:** icon-buttons 26×26px al final de la fila.
- **Badges de estado:** pill con punto, mismos 3 tonos semánticos que en el resto del sistema (éxito/advertencia/peligro).
- **Empty state:** no implementado.
- **Pagination:** sí implementado — contador de registros + selector de tamaño de página + selector de página + flechas prev/next, todos como popovers/botones cuadrados de 28px (`w-7 h-7`).

---

## 11. Navegación

Documentado como **mockup de estructura** en `ds-layout.js` (no como componente reusable independiente — es una demo interactiva dentro del catálogo). Reglas explícitas (copy real del componente):

```text
Header superior fijo con logo, acciones generales y perfil del usuario.
Sidebar principal fijo a la izquierda — muestra únicamente iconos, sin texto visible.
Cada icono debe ser descriptivo y fácil de reconocer a simple vista.
Al pasar el mouse sobre un icono se muestra un tooltip con el nombre del módulo.
El módulo seleccionado tiene un estado visual activo claro (Phosphor Fill + fondo).
Al seleccionar un módulo aparece un sidebar secundario con sus submódulos — éste sí muestra texto.
El sidebar secundario cambia según el módulo activo. A la derecha queda el área de contenido principal.
```

**Navbar (header):** `h-14`, fondo blanco, borde inferior `border-default`, `px-4`. Izquierda: chip `w-6 h-6 rounded-chip bg-brand-primary-soft` con ícono `shield-check` (Fill, xs) + wordmark `text-[13.5px] font-bold`. Derecha: íconos `bell` y `gear` (`text-text-muted`, sm) + avatar `w-7 h-7 rounded-full bg-brand-navy` con iniciales blancas `text-[11px] font-semibold`.

**Sidebar principal:** ancho `w-16` (64px), fondo `brand-navy`, `flex flex-col items-center gap-1.5 py-4`. Cada módulo es un botón `w-11 h-11` (44px), `rounded-control`. Inactivo: `text-white/50`, hover `bg-white/10 text-white`. Activo: `bg-brand-primary text-white` + ícono en peso **Fill**. `aria-pressed` refleja el estado activo.

**Sidebar secundario:** ancho `w-52` (208px), fondo `surface-subtle`, borde derecho `border-default`, `p-3`, `overflow-y-auto`. Label del módulo activo arriba (`text-xs uppercase tracking-wide text-text-muted`, `px-3 mb-2`). Ítems: `px-3 py-2 rounded-control text-[13px]`; el primer submódulo de la lista se muestra activo por defecto (`bg-white text-brand-primary font-medium shadow-sm`), el resto `text-text-secondary hover:bg-surface-hover`.

**Área de contenido:** `flex-1 bg-background`, centrado, solo muestra un placeholder de texto en el catálogo (`"Área de contenido — {módulo activo}"`).

**Módulos documentados** (id / ícono / label / submódulos):

| id | Ícono | Label | Submódulos |
|---|---|---|---|
| `dashboard` | `dashboard` (squares-four) | Dashboard | Resumen general, Indicadores clave |
| `aseguradoras` | `buildings` | Aseguradoras | Listado de aseguradoras, Convenios |
| `seguros` | `shield-check` | Seguros | Pólizas, Coberturas, Renovaciones |
| `certificados` | `certificate` | Certificados | Certificados emitidos, Plantillas |
| `clientes` | `users` | Clientes | Listado de clientes, Historial |
| `siniestros` | `claims` (siren) | Siniestros | Reportes, Seguimiento |
| `configuracion` | `settings` | Configuración | Usuarios y roles, Parámetros generales |

---

## 12. Layout

| Elemento | Medida |
|---|---|
| Header / navbar | Alto `56px` (`h-14`) |
| Sidebar principal | Ancho `64px` (`w-16`) |
| Sidebar secundario | Ancho `208px` (`w-52`) |
| Card de sección del catálogo | `border border-border-default rounded-card`, padding interno `28px` (`p-7`) |
| Separación entre secciones del catálogo | `48px` (`mb-12`) |
| Grid responsive de tarjetas/campos | `grid-cols-1` en mobile, `sm:grid-cols-2` o `sm:grid-cols-3`, `lg:grid-cols-3` o `lg:grid-cols-5` según la sección (ver [§14](#14-responsive)) |
| Contenedor de la página anfitriona (`pages/design-system`) | `max-width: 1200px`, centrado, `padding: 28px 32px 80px` |
| Iframe que embebe el Design System dentro del ERP | `width: 100%`, `height: 5400px` fijo (no responsive — es una altura calculada a mano para que quepa todo el catálogo sin scroll interno) |

---

## 13. Estados semánticos

Un mismo vocabulario de color se repite en badges, toasts, callouts y mensajes de campo — ver también [§2](#2-paleta-de-colores):

| Estado | Color fuerte | Color suave | Ícono asociado | Dónde aparece |
|---|---|---|---|---|
| Activo / Éxito | `success` `#1D9A6C` | `success-soft` `#E7F6EF` | `check-circle` | Badge "Activa", toast, actividad, sidebar principal (fill + fondo azul para "módulo activo", no verde — ver nota) |
| Pendiente / Advertencia | `warning` `#D97706` | `warning-soft` `#FDF3E2` | `warning` | Badge "Pendiente", toast, actividad |
| Vencido / Error | `danger` `#DC2626` | `danger-soft` `#FBEAEA` | `x-circle` / `warning-circle` | Badge "Vencida", mensaje de error de campo, toast, actividad |
| Info | `brand-primary` `#3D5FEB` | `brand-primary-soft` `#EEF1FD` | `info` | Toast, callout del modal, fila/ítem seleccionado |
| Disabled | `disabled` `#A9B4E8` | — | — | Solo botones (fondo/borde) |
| Ayuda | `help` `#7C3AED` | — (sin `-soft`) | — | Solo variante de botón |

**Nota:** "activo" tiene dos significados distintos en el sistema y usan colores distintos — un módulo de sidebar **activo/seleccionado** usa `brand-primary` (azul), mientras que una póliza en estado **"Activa"** (badge de negocio) usa `success` (verde). No están unificados bajo un mismo color porque responden a conceptos distintos (selección de UI vs. estado de negocio).

---

## 14. Responsive

**Breakpoints realmente usados** (prefijos de Tailwind encontrados en el código): únicamente **`sm:`** (640px) y **`lg:`** (1024px). No se usa `md:`, `xl:` ni `2xl:` en ningún componente del Design System — existen en la config por defecto de Tailwind v4 pero no se invocan.

| Breakpoint | Dónde se usa |
|---|---|
| Base (mobile) | `grid-cols-1` en todos los grids del catálogo |
| `sm:` (≥640px) | `sm:grid-cols-2` (form fields, íconos - reglas), `sm:grid-cols-3` (paleta de tokens), `sm:col-span-2` (textarea de notas ocupa las 2 columnas) |
| `lg:` (≥1024px) | `lg:grid-cols-2` (cards y badges, listas), `lg:grid-cols-3` (paleta de tokens, ejemplos de íconos), `lg:grid-cols-5` (variantes de botón), `lg:col-span-2` (ejemplo de tabla en la galería de íconos) |

No hay ninguna media query CSS propia dentro de `tokens.css` ni de los componentes — todo el responsive es vía clases de Tailwind. Tampoco hay un comportamiento definido para el sidebar principal/secundario en mobile (el mockup de `ds-layout.js` no tiene una versión mobile documentada — no se inventa una acá).

La página que aloja el catálogo (`pages/design-system/index.html`, fuera del Design System en sí) sí tiene una media query propia en `assets/css/design-system.css`: `@media (max-width: 640px) { .design-system-page { padding: 20px 16px 60px; } }` — pertenece al "chrome" del ERP, no al Design System.

---

## 15. Design Tokens

Consolidado literal de `assets/css/ds/tokens.css`, reescrito como bloque `:root` plano (el original usa `@theme`, una sintaxis específica de Tailwind v4 que genera exactamente estas mismas variables CSS en tiempo de build). Valores sin modificar.

```css
:root {
  /* Brand */
  --color-brand-primary: #3D5FEB;
  --color-brand-primary-hover: #2C46C4;
  --color-brand-primary-soft: #EEF1FD;
  --color-brand-navy: #0B1440;
  --color-brand-slate: #7C8DA6;

  /* Text */
  --color-text-primary: #16213E;
  --color-text-secondary: #5B6B85;
  --color-text-muted: #94A0B8;

  /* Surfaces */
  --color-surface: #FFFFFF;
  --color-surface-subtle: #FAFBFC;
  --color-surface-hover: #F1F2F5;
  --color-background: #F6F7FA;

  /* Borders */
  --color-border-default: #E2E5EC;
  --color-border-strong: #C7CEDB;
  --color-border-input: #AEB9CE;

  /* Feedback */
  --color-success: #1D9A6C;
  --color-success-soft: #E7F6EF;
  --color-warning: #D97706;
  --color-warning-soft: #FDF3E2;
  --color-danger: #DC2626;
  --color-danger-hover: #C21E1E;
  --color-danger-soft: #FBEAEA;
  --color-help: #7C3AED;
  --color-help-hover: #6D28D9;
  --color-disabled: #A9B4E8;

  /* Radius */
  --radius-chip: 2px;
  --radius-control: 3px;
  --radius-card: 4px;

  /* Typography */
  --font-sans: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --text-sm: 12px;
  --text-md: 13.5px;
  --text-lg: 15px;
  --text-xl: 18px;

  /* Icon sizes (declarado aparte, fuera del bloque @theme, en el mismo archivo) */
  --icon-xs: 14px;
  --icon-sm: 16px;
  --icon-md: 20px;
  --icon-lg: 24px;
  --icon-xl: 32px;
}
```

**No incluido arriba porque no existe como token declarado** (documentado en detalle en sus secciones respectivas, con los valores reales observados en el código):

- Espaciado (`--space-*`) — no hay tokens; ver [§4](#4-spacing) para la escala Tailwind realmente usada.
- Sombra (`--shadow-*`) — no hay tokens; ver [§6](#6-shadows) para los 3 niveles usados.
- Tamaños tipográficos reales (superset de 11 valores) — ver [§3](#3-tipografía); los únicos 4 tokens declarados (`--text-sm/md/lg/xl`) son un subconjunto de lo que se usa en pantalla.

---

## 16. Component Inventory

```md
## Component Inventory

### Forms
- Button            (ds-button.js)   — variantes: primary, secondary, outline, text, link, success, danger, warning, help
- Input             (ds-input.js)    — con soporte de ícono "search" y layout horizontal
- Select            (ds-select.js)
- Textarea          (ds-textarea.js)
- Checkbox          (patrón, sin componente propio — <input type="checkbox"> + clases utilitarias)
- Switch / Toggle   (patrón, sin componente propio — <input type="checkbox"> oculto + <span> con peer-checked)

### Data
- Card              (ds-card.js)
- Badge             (ds-badge.js)    — variantes: success, warning, danger, info, neutral; con o sin punto
- Table (DataTable) (ds-data-table.js) — con búsqueda, selección, badges de estado y paginación integrada
- List              (ds-list.js)     — dos patrones: lista de actividad, lista de documentos seleccionables

### Navigation
- Navbar / Header   (mockup en ds-layout.js, no reusable)
- Sidebar principal (mockup en ds-layout.js, no reusable) — solo íconos, con tooltip y estado activo
- Sidebar secundario (mockup en ds-layout.js, no reusable) — texto, cambia según módulo activo

### Feedback
- Toast             (ds-toast.js)    — tonos: success, danger, warning, info
- Modal             (ds-modal.js)    — un único caso de uso documentado (confirmación con auditoría)

### Reference-only (no son componentes, son catálogos/documentación viva)
- ds-palette.js      — muestra la paleta de colores y el isotipo sobre fondos
- ds-typography.js   — muestra la escala tipográfica declarada
- ds-icons.js        — muestra pesos, tamaños, reglas y galería de íconos de Phosphor
- ds-buttons.js / ds-cards.js / ds-form-fields.js — arman las secciones del catálogo combinando los componentes de arriba
- ds-logo.js         — exporta el SVG del isotipo (`logoSvg()`)
- ds-phosphor.js     — exporta `phosphorIcon()` y el mapa `ICON_NAMES`
- ds-utils.js        — exporta `escapeHtml()` y `nextId()`
```

**No existen en el código actual** (por lo tanto no se documentan como componentes, según instrucción explícita): IconButton, SearchInput, Radio, StatusBadge (separado de Badge), Pagination (separado de Table), Tabs, Tooltip (separado de Sidebar), Dropdown (separado de Table pagination), Alert (separado de Toast), EmptyState, Skeleton.

---

## 17. Implementation Rules

Reglas para quien reconstruya estos componentes en otro proyecto (React u otro), a partir únicamente de lo documentado arriba:

1. **Respetar exactamente los tokens** de [§15](#15-design-tokens) — mismos nombres, mismos valores hex/px. No redondear ni "limpiar" valores que parezcan arbitrarios (ej. `13.5px`, `12.5px`, `11.5px` son intencionales, no errores).
2. **No inventar colores.** Si un color nuevo parece necesario, no está en este documento — hay que volver a pedir la especificación, no aproximar con el color semántico más parecido.
3. **No agregar nuevas fuentes.** Única familia: IBM Plex Sans + la pila de fallback exacta de [§3](#3-tipografía).
4. **No mezclar librerías de íconos.** Única librería: Phosphor Icons, con los nombres reales de [§7](#7-iconografía). Si un ícono necesario no está en la lista de "efectivamente renderizados", usar el slug de Phosphor más literal posible y señalarlo como nuevo — no tomarlo de otra librería.
5. **No crear variantes que no estén documentadas.** Ej.: `ds-button` tiene 9 variantes y un solo tamaño — no agregar `size="lg"` ni una variante `ghost` porque "tendría sentido"; si hace falta, es una decisión de producto nueva, no una extracción.
6. **Reutilizar componentes** en vez de duplicar markup. El propio código fuente ya duplica algunos patrones (badge de estado reimplementado en la tabla, buscador reimplementado en la tabla en vez de usar Input) — al reconstruir en React, esos son buenos candidatos a unificar en un solo componente reusable, ya que visualmente son idénticos.
7. **Mantener accesibilidad** al mismo nivel que el original: `label for=id` en todos los campos, `aria-describedby` en mensajes de ayuda/error, `aria-invalid` en error, `aria-label` en icon-buttons, `aria-pressed` en el ítem de sidebar activo. No bajar ese nivel ni "por defecto de la librería de UI" que se use en React.
8. **Mantener el aspecto visual original.** Este documento describe cómo se ve el sistema **hoy**, con sus inconsistencias incluidas (ver [§2](#2-paleta-de-colores), [§3](#3-tipografía)). Reconstruir con este documento como fuente no es una oportunidad para "corregir" esas inconsistencias sin que alguien lo pida explícitamente — la meta es paridad visual, no una v2 del sistema.
9. **Estados no implementados no se inventan.** Si este documento dice "no implementado" (loading de botón, disabled de switch, empty state de tabla, responsive de sidebar), el componente reconstruido puede dejar el mismo hueco o preguntarlo — no rellenarlo con una suposición.
10. **Los "patrones sin componente propio"** (IconButton, SearchInput, Checkbox, Switch, Tooltip, Dropdown de paginación) pueden convertirse en componentes reales de primera clase en React — eso es una mejora de arquitectura razonable, siempre que el resultado visual/interactivo sea idéntico al patrón documentado.
