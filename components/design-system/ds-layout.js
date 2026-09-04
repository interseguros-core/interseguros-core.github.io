import { phosphorIcon } from './ds-phosphor.js';

/*
 * Documents the visual structure of the Interseguros app shell — not a real,
 * reusable component. Header fijo + sidebar principal (solo iconos) +
 * sidebar secundario (dinámico) + contenido. See ds-icons.js for why these
 * icons render as Phosphor glyphs.
 */
const MODULES = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', submodules: ['Resumen general', 'Indicadores clave'] },
  { id: 'aseguradoras', icon: 'buildings', label: 'Aseguradoras', submodules: ['Listado de aseguradoras', 'Convenios'] },
  { id: 'seguros', icon: 'shield-check', label: 'Seguros', submodules: ['Pólizas', 'Coberturas', 'Renovaciones'] },
  { id: 'certificados', icon: 'certificate', label: 'Certificados', submodules: ['Certificados emitidos', 'Plantillas'] },
  { id: 'clientes', icon: 'users', label: 'Clientes', submodules: ['Listado de clientes', 'Historial'] },
  { id: 'siniestros', icon: 'claims', label: 'Siniestros', submodules: ['Reportes', 'Seguimiento'] },
  { id: 'configuracion', icon: 'settings', label: 'Configuración', submodules: ['Usuarios y roles', 'Parámetros generales'] },
];

const RULES = [
  'Header superior fijo con logo, acciones generales y perfil del usuario.',
  'Sidebar principal fijo a la izquierda — muestra únicamente iconos, sin texto visible.',
  'Cada icono debe ser descriptivo y fácil de reconocer a simple vista.',
  'Al pasar el mouse sobre un icono se muestra un tooltip con el nombre del módulo.',
  'El módulo seleccionado tiene un estado visual activo claro (Phosphor Fill + fondo).',
  'Al seleccionar un módulo aparece un sidebar secundario con sus submódulos — éste sí muestra texto.',
  'El sidebar secundario cambia según el módulo activo. A la derecha queda el área de contenido principal.',
];

function primaryIconButton(m, isActive) {
  return `
    <button
      type="button"
      data-module="${m.id}"
      aria-label="${m.label}"
      aria-pressed="${isActive}"
      class="layout-module-btn group relative w-11 h-11 flex items-center justify-center rounded-control shrink-0 transition-colors ${isActive ? 'bg-brand-primary text-white' : 'text-white/50 hover:bg-white/10 hover:text-white'}"
    >
      ${phosphorIcon(m.icon, { size: 'md', weight: isActive ? 'fill' : 'regular' })}
      <span class="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-brand-navy text-white text-xs font-medium px-2.5 py-1.5 rounded-control opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all z-10">
        ${m.label}
      </span>
    </button>
  `;
}

function secondaryPanel(m) {
  return `
    <p class="text-xs font-semibold text-text-muted uppercase tracking-wide px-3 mb-2">${m.label}</p>
    <nav class="flex flex-col gap-0.5">
      ${m.submodules.map((s, i) => `
        <a class="px-3 py-2 rounded-control text-[13px] ${i === 0 ? 'bg-white text-brand-primary font-medium shadow-sm' : 'text-text-secondary hover:bg-surface-hover'}">${s}</a>
      `).join('')}
    </nav>
  `;
}

function renderBody(activeId) {
  const active = MODULES.find((m) => m.id === activeId);
  return `
    <div class="layout-primary-sidebar w-16 bg-brand-navy flex flex-col items-center gap-1.5 py-4 shrink-0">
      ${MODULES.map((m) => primaryIconButton(m, m.id === activeId)).join('')}
    </div>
    <div class="layout-secondary-sidebar w-52 bg-surface-subtle border-r border-border-default p-3 shrink-0 overflow-y-auto">
      ${secondaryPanel(active)}
    </div>
    <div class="layout-content flex-1 bg-background flex items-center justify-center">
      <p class="text-sm text-text-muted">Área de contenido — <span class="layout-content-label font-medium text-text-secondary">${active.label}</span></p>
    </div>
  `;
}

class DsLayout extends HTMLElement {
  connectedCallback() {
    this.active = MODULES[0].id;
    this.innerHTML = `
      <section class="mb-12">
        <h2 class="text-lg font-semibold text-text-primary tracking-tight">Layout del Sistema</h2>
        <p class="text-sm text-text-secondary mt-1 mb-5">Estructura visual del ERP — header fijo, sidebar principal de iconos, sidebar secundario dinámico y área de contenido. Solo estructura, sin pantallas ni funcionalidades internas.</p>

        <div class="bg-white border border-border-default rounded-card p-7">

          <!-- Reglas -->
          <span class="block text-xs text-text-muted font-medium mb-2.5">Reglas de estructura</span>
          <ul class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pb-6 mb-7 border-b border-border-default">
            ${RULES.map((rule) => `
              <li class="flex items-start gap-2 text-sm text-text-secondary">
                <span class="text-success mt-0.5">${phosphorIcon('check-circle', { size: 'xs' })}</span>
                <span>${rule}</span>
              </li>
            `).join('')}
          </ul>

          <!-- Mockup en vivo -->
          <span class="block text-xs text-text-muted font-medium mb-2.5">Estructura visual (pasa el mouse por los iconos y hacé clic para cambiar de módulo)</span>
          <div class="layout-mockup border border-border-default rounded-card overflow-hidden">

            <!-- Header -->
            <div class="h-14 flex items-center justify-between px-4 bg-white border-b border-border-default">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-chip bg-brand-primary-soft text-brand-primary flex items-center justify-center">${phosphorIcon('shield-check', { size: 'xs', weight: 'fill' })}</span>
                <span class="text-[13.5px] font-bold text-text-primary tracking-tight">Interseguros</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-text-muted">${phosphorIcon('bell', { size: 'sm' })}</span>
                <span class="text-text-muted">${phosphorIcon('gear', { size: 'sm' })}</span>
                <span class="w-7 h-7 rounded-full bg-brand-navy text-white text-[11px] font-semibold flex items-center justify-center">EM</span>
              </div>
            </div>

            <!-- Body: sidebar principal + sidebar secundario + contenido -->
            <div class="layout-body flex" style="height: 320px;">
              ${renderBody(this.active)}
            </div>
          </div>

        </div>
      </section>
    `;
    this.bindEvents();
  }

  bindEvents() {
    const body = this.querySelector('.layout-body');
    body.addEventListener('click', (e) => {
      const btn = e.target.closest('.layout-module-btn');
      if (!btn || btn.dataset.module === this.active) return;
      this.active = btn.dataset.module;
      body.innerHTML = renderBody(this.active);
    });
  }
}

if (!customElements.get('ds-layout')) {
  customElements.define('ds-layout', DsLayout);
}
