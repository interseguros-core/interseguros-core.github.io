import './ds-button.js';
import './ds-input.js';
import { phosphorIcon } from './ds-phosphor.js';

const WEIGHTS = [
  { weight: 'regular', label: 'Regular', use: 'Uso estándar y principal. Es el peso por defecto en todo el sistema.' },
  { weight: 'bold', label: 'Bold', use: 'Acciones o elementos con mayor jerarquía visual.' },
  { weight: 'fill', label: 'Fill', use: 'Estados activos o seleccionados (ítem de sidebar activo, tab activo, etc.).' },
  { weight: 'duotone', label: 'Duotone', use: 'Solo para empty states o elementos especiales — no es un estilo de uso habitual.' },
];

const SIZES = [
  { size: 'xs', px: '14px', use: 'Badges, metadata y acciones pequeñas' },
  { size: 'sm', px: '16px', use: 'Inputs, tablas, filtros y botones compactos' },
  { size: 'md', px: '20px', use: 'Sidebar, navegación y botones normales (tamaño estándar general)' },
  { size: 'lg', px: '24px', use: 'Cards y acciones destacadas' },
  { size: 'xl', px: '32px', use: 'Empty states y estados especiales' },
];

const STANDARD_ICONS = [
  { icon: 'edit', name: 'Pencil', action: 'Editar' },
  { icon: 'delete', name: 'Trash', action: 'Eliminar' },
  { icon: 'search', name: 'MagnifyingGlass', action: 'Buscar' },
  { icon: 'add', name: 'Plus', action: 'Agregar' },
  { icon: 'settings', name: 'Gear', action: 'Configuración' },
  { icon: 'close', name: 'X', action: 'Cerrar' },
  { icon: 'download', name: 'DownloadSimple', action: 'Descargar' },
  { icon: 'upload', name: 'UploadSimple', action: 'Subir' },
  { icon: 'more-vertical', name: 'DotsThreeVertical', action: 'Más opciones' },
  { icon: 'user', name: 'User', action: 'Usuario' },
  { icon: 'users', name: 'Users', action: 'Usuarios' },
  { icon: 'view', name: 'Eye', action: 'Ver' },
];

const RULES = [
  'Tamaño estándar general: 20px Regular.',
  'Inputs y tablas: 16px Regular.',
  'Sidebar: 20px Regular.',
  'Los elementos activos pueden usar Fill.',
  'Mantener tamaños consistentes dentro de un mismo contexto.',
  'Los iconos heredan el color con currentColor — nunca colores arbitrarios.',
  'No usar diferentes iconos para representar la misma acción.',
];

class DsIcons extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="mb-12">
        <h2 class="text-lg font-semibold text-text-primary tracking-tight">Iconografía</h2>
        <p class="text-sm text-text-secondary mt-1 mb-5">Phosphor Icons es la librería oficial del Design System — pesos, tamaños, reglas de uso y galería de referencia.</p>

        <div class="bg-white border border-border-default rounded-card p-7">

          <!-- Librería oficial -->
          <div class="flex items-start gap-3 bg-brand-primary-soft border border-border-default rounded-control px-4 py-3 mb-7">
            <span class="text-brand-primary mt-0.5">${phosphorIcon('shield-check', { size: 'md' })}</span>
            <div>
              <p class="text-[13.5px] font-semibold text-text-primary">Librería oficial: Phosphor Icons</p>
              <p class="text-xs text-text-secondary mt-0.5">No mezclar otras librerías de iconos dentro del Design System.</p>
            </div>
          </div>

          <!-- Pesos -->
          <span class="block text-xs text-text-muted font-medium mb-2.5">Pesos</span>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-6 mb-6 border-b border-border-default">
            ${WEIGHTS.map((w) => `
              <div class="border border-border-default rounded-control p-3.5 flex flex-col items-center text-center gap-2">
                <span class="text-text-primary">${phosphorIcon('settings', { size: 'xl', weight: w.weight })}</span>
                <span class="text-[13px] font-semibold text-text-primary">${w.label}</span>
                <span class="text-xs text-text-secondary leading-snug">${w.use}</span>
              </div>
            `).join('')}
          </div>

          <!-- Tamaños -->
          <span class="block text-xs text-text-muted font-medium mb-2.5">Tamaños</span>
          <div class="flex flex-col gap-3 pb-6 mb-6 border-b border-border-default">
            ${SIZES.map((s) => `
              <div class="flex items-center gap-4">
                <span class="w-8 flex items-center justify-center text-text-primary">${phosphorIcon('settings', { size: s.size })}</span>
                <span class="w-[130px] shrink-0 text-xs text-text-muted font-mono">icon-${s.size} · ${s.px}</span>
                <span class="text-sm text-text-secondary">${s.use}</span>
              </div>
            `).join('')}
          </div>

          <!-- Reglas -->
          <span class="block text-xs text-text-muted font-medium mb-2.5">Reglas</span>
          <ul class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pb-6 mb-6 border-b border-border-default">
            ${RULES.map((rule) => `
              <li class="flex items-start gap-2 text-sm text-text-secondary">
                <span class="text-success mt-0.5">${phosphorIcon('check-circle', { size: 'xs' })}</span>
                <span>${rule}</span>
              </li>
            `).join('')}
          </ul>

          <!-- Galería de iconos estándar -->
          <span class="block text-xs text-text-muted font-medium mb-2.5">Galería de iconos estándar</span>
          <div class="border border-border-default rounded-control overflow-hidden mb-7">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-surface-subtle border-b border-border-default">
                  <th class="px-3.5 py-2 text-xs font-semibold text-text-secondary text-left w-12">Ícono</th>
                  <th class="px-3.5 py-2 text-xs font-semibold text-text-secondary text-left">Nombre Phosphor</th>
                  <th class="px-3.5 py-2 text-xs font-semibold text-text-secondary text-left">Acción</th>
                  <th class="px-3.5 py-2 text-xs font-semibold text-text-secondary text-left">Tamaño</th>
                  <th class="px-3.5 py-2 text-xs font-semibold text-text-secondary text-left">Peso</th>
                </tr>
              </thead>
              <tbody>
                ${STANDARD_ICONS.map((row, i) => `
                  <tr class="${i === STANDARD_ICONS.length - 1 ? '' : 'border-b border-border-default'}">
                    <td class="px-3.5 py-2.5 text-text-primary">${phosphorIcon(row.icon, { size: 'md' })}</td>
                    <td class="px-3.5 py-2.5 text-[13px] font-mono text-text-primary">${row.name}</td>
                    <td class="px-3.5 py-2.5 text-[13px] text-text-primary">${row.action}</td>
                    <td class="px-3.5 py-2.5 text-xs text-text-secondary">16–20px</td>
                    <td class="px-3.5 py-2.5 text-xs text-text-secondary">Regular</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Ejemplos de uso -->
          <span class="block text-xs text-text-muted font-medium mb-3">Ejemplos de uso</span>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div class="border border-border-default rounded-control p-4">
              <p class="text-xs font-semibold text-text-secondary mb-3">Sidebar · estado activo con Fill</p>
              <nav class="flex flex-col gap-1">
                <a class="flex items-center gap-2.5 px-3 py-2 rounded-control bg-brand-primary-soft text-brand-primary text-[13px] font-medium">
                  ${phosphorIcon('home', { size: 'md', weight: 'fill' })} Inicio
                </a>
                <a class="flex items-center gap-2.5 px-3 py-2 rounded-control text-text-secondary text-[13px] hover:bg-surface-hover">
                  ${phosphorIcon('users', { size: 'md' })} Usuarios
                </a>
                <a class="flex items-center gap-2.5 px-3 py-2 rounded-control text-text-secondary text-[13px] hover:bg-surface-hover">
                  ${phosphorIcon('settings', { size: 'md' })} Configuración
                </a>
              </nav>
            </div>

            <div class="border border-border-default rounded-control p-4">
              <p class="text-xs font-semibold text-text-secondary mb-3">Input con ícono (16px)</p>
              <ds-input label="Buscar cliente" placeholder="Buscar por nombre o CI..." icon="search"></ds-input>
            </div>

            <div class="border border-border-default rounded-control p-4">
              <p class="text-xs font-semibold text-text-secondary mb-3">Botones (20px estándar, 16px compacto)</p>
              <div class="flex items-center gap-3 flex-wrap">
                <ds-button text="Guardar" variant="primary" icon="check"></ds-button>
                <ds-button text="Eliminar" variant="danger" icon="delete"></ds-button>
                <ds-button text="Exportar" variant="outline" icon="download" icon-size="sm"></ds-button>
              </div>
            </div>

            <div class="border border-border-default rounded-control p-4">
              <p class="text-xs font-semibold text-text-secondary mb-3">Icon buttons (16px, compactos)</p>
              <div class="flex items-center gap-1">
                <button class="w-[26px] h-[26px] flex items-center justify-center rounded-chip text-text-secondary hover:bg-surface-hover" aria-label="Ver">${phosphorIcon('view', { size: 'sm' })}</button>
                <button class="w-[26px] h-[26px] flex items-center justify-center rounded-chip text-text-secondary hover:bg-surface-hover" aria-label="Editar">${phosphorIcon('edit', { size: 'sm' })}</button>
                <button class="w-[26px] h-[26px] flex items-center justify-center rounded-chip text-danger hover:bg-danger-soft" aria-label="Eliminar">${phosphorIcon('delete', { size: 'sm' })}</button>
                <button class="w-[26px] h-[26px] flex items-center justify-center rounded-chip text-text-secondary hover:bg-surface-hover" aria-label="Más opciones">${phosphorIcon('more-vertical', { size: 'sm' })}</button>
              </div>
            </div>

            <div class="border border-border-default rounded-control p-4 lg:col-span-2">
              <p class="text-xs font-semibold text-text-secondary mb-3">Tabla (16px en acciones de fila)</p>
              <div class="border border-border-default rounded-control overflow-hidden">
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="bg-surface-subtle border-b border-border-default">
                      <th class="px-3.5 py-2 text-xs font-semibold text-text-secondary text-left">N° Póliza</th>
                      <th class="px-3.5 py-2 text-xs font-semibold text-text-secondary text-left">Cliente</th>
                      <th class="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-border-default">
                      <td class="px-3.5 py-2.5 text-[13px] font-medium text-text-primary">PL-20481</td>
                      <td class="px-3.5 py-2.5 text-[13px] text-text-primary">Constructora Andina S.A.</td>
                      <td class="px-3.5 py-2.5">
                        <div class="flex items-center gap-1">
                          <button class="w-[26px] h-[26px] flex items-center justify-center rounded-chip text-text-secondary hover:bg-surface-hover" aria-label="Ver">${phosphorIcon('view', { size: 'sm' })}</button>
                          <button class="w-[26px] h-[26px] flex items-center justify-center rounded-chip text-text-secondary hover:bg-surface-hover" aria-label="Editar">${phosphorIcon('edit', { size: 'sm' })}</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td class="px-3.5 py-2.5 text-[13px] font-medium text-text-primary">PL-20482</td>
                      <td class="px-3.5 py-2.5 text-[13px] text-text-primary">María Fernanda Rojas</td>
                      <td class="px-3.5 py-2.5">
                        <div class="flex items-center gap-1">
                          <button class="w-[26px] h-[26px] flex items-center justify-center rounded-chip text-text-secondary hover:bg-surface-hover" aria-label="Ver">${phosphorIcon('view', { size: 'sm' })}</button>
                          <button class="w-[26px] h-[26px] flex items-center justify-center rounded-chip text-text-secondary hover:bg-surface-hover" aria-label="Editar">${phosphorIcon('edit', { size: 'sm' })}</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </section>
    `;
  }
}

if (!customElements.get('ds-icons')) {
  customElements.define('ds-icons', DsIcons);
}
