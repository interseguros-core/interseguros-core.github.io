import { architectureDiagrams } from '/assets/data/architecture-diagrams.js';

const HOME_HREF = '/index.html';
const DOCS_HREF = '/pages/documentacion-propuesta/index.html';
const ARCH_HREF = '/pages/arquitectura/index.html';
const BRANDING_HREF = '/pages/branding/index.html';
const PLANTUML_EDITOR_HREF = '/pages/editor-plantuml/index.html';
const QUICKOFF_HREF = '/pages/meeting/index.html';

const ICON_HOME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>`;
const ICON_DOCS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>`;
const ICON_ARCH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></svg>`;
const ICON_BRANDING = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.4 0-1.1.9-2 2-2h2.3A4.2 4.2 0 0 0 21.5 11 9.9 9.9 0 0 0 12 2Z"/><circle cx="7.5" cy="10.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="11" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="8.5" r="1.1" fill="currentColor" stroke="none"/></svg>`;
const ICON_EDITOR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>`;
const ICON_MEETINGS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
const ICON_CARET = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`;

/*
 * Every entry maps a sidebar sub-item to an id that actually exists in
 * /pages/documentacion-propuesta/index.html (either an .acc-group-body id
 * for a whole chapter, or an .acc-item id for a single step). None of these
 * are invented — they mirror the accordion structure already present in the
 * migrated documentation page.
 */
const DOC_SECTIONS = [
  ['Flujo general', 'body-flujo-diagrama'],
  ['Infraestructura', 'body-infraestructura'],
  ['Compañías', 'step-companias'],
  ['Contactos y clientes', 'step-contactos'],
  ['Productos', 'step-productos'],
  ['Certificados', 'step-certificados'],
  ['Plan de pagos', 'step-pagos'],
  ['Cobranzas', 'step-cobranzas'],
  ['Siniestros', 'step-siniestros'],
  ['Gestión de campañas', 'step-campanas'],
  ['Atención omnicanal (IA)', 'whatsapp-hub'],
  ['Cotizadores comparativos', 'cotizadores'],
  ['Firma digital', 'firma-digital'],
  ['Vencimientos de documentos', 'vencimientos-docs'],
  ['Comisiones', 'comisiones'],
  ['Conciliaciones', 'conciliaciones'],
  ['Reportería y analítica', 'reporteria'],
  ['Trazabilidad comercial', 'trazabilidad'],
  ['Integraciones', 'integraciones'],
  ['Auditoría y logs', 'auditoria-logs'],
];

function isDocsPath(pathname) {
  return pathname.startsWith('/pages/documentacion-propuesta/');
}

function isArchitecturePath(pathname) {
  return pathname.startsWith('/pages/arquitectura/');
}

function isBrandingPath(pathname) {
  return pathname.startsWith('/pages/branding/');
}

function isPlantUmlEditorPath(pathname) {
  return pathname.startsWith('/pages/editor-plantuml/');
}

function isQuickoffPath(pathname) {
  return pathname.startsWith('/pages/meeting/');
}

function isHomePath(pathname) {
  return pathname === '/' || pathname === '/index.html' || pathname === '';
}

function renderNavLink(href, active, icon, label) {
  return `
    <a class="sidebar-link${active ? ' active' : ''}" href="${href}"${active ? ' aria-current="page"' : ''}>
      <span class="sidebar-icon">${icon}</span>
      <span>${label}</span>
    </a>
  `;
}

function renderExpandableItem({ href, active, icon, label, submenuId, submenuItems }) {
  if (submenuItems.length === 0) {
    return `<li class="sidebar-item">${renderNavLink(href, active, icon, label)}</li>`;
  }
  return `
    <li class="sidebar-item has-submenu">
      <div class="sidebar-row">
        ${renderNavLink(href, active, icon, label)}
        <button type="button" class="sidebar-caret" aria-label="Mostrar secciones de ${label}" aria-expanded="${active}" aria-controls="${submenuId}">
          ${ICON_CARET}
        </button>
      </div>
      <ul class="sidebar-submenu${active ? ' open' : ''}" id="${submenuId}">
        ${submenuItems.map(([label, href]) => `<li><a href="${href}">${label}</a></li>`).join('')}
      </ul>
    </li>
  `;
}

class AppSidebar extends HTMLElement {
  connectedCallback() {
    this.render();
    this.bindEvents();
  }

  render() {
    const pathname = window.location.pathname;
    const docsActive = isDocsPath(pathname);
    const archActive = isArchitecturePath(pathname);
    const brandingActive = isBrandingPath(pathname);
    const editorActive = isPlantUmlEditorPath(pathname);
    const quickoffActive = isQuickoffPath(pathname);
    const homeActive = isHomePath(pathname);

    const docsItem = renderExpandableItem({
      href: DOCS_HREF,
      active: docsActive,
      icon: ICON_DOCS,
      label: 'Documentación propuesta',
      submenuId: 'submenu-documentacion',
      submenuItems: DOC_SECTIONS.map(([label, id]) => [label, `${DOCS_HREF}#${id}`]),
    });

    const archItem = renderExpandableItem({
      href: ARCH_HREF,
      active: archActive,
      icon: ICON_ARCH,
      label: 'Arquitectura',
      submenuId: 'submenu-arquitectura',
      submenuItems: architectureDiagrams.map((d) => [d.title, `${ARCH_HREF}#${d.id}`]),
    });

    const meetingsItem = renderExpandableItem({
      href: QUICKOFF_HREF,
      active: quickoffActive,
      icon: ICON_MEETINGS,
      label: 'Reuniones',
      submenuId: 'submenu-reuniones',
      submenuItems: [
        ['Grabación 3 — 28/08/2026', `${QUICKOFF_HREF}#grabacion-3`],
        ['Grabación 2 — 27/08/2026', `${QUICKOFF_HREF}#grabacion-2`],
        ['Grabación 1', `${QUICKOFF_HREF}#grabacion-1`],
      ],
    });

    this.innerHTML = `
      <div class="sidebar" id="primarySidebar">
        <div class="sidebar-header">
          <span class="sidebar-brand">Interseguros</span>
          <button type="button" class="sidebar-close" aria-label="Cerrar menú">${ICON_CLOSE}</button>
        </div>
        <nav aria-label="Navegación principal" class="sidebar-nav">
          <ul>
            <li class="sidebar-item">${renderNavLink(HOME_HREF, homeActive, ICON_HOME, 'Inicio')}</li>
            ${docsItem}
            ${archItem}
            <li class="sidebar-item">${renderNavLink(BRANDING_HREF, brandingActive, ICON_BRANDING, 'Branding')}</li>
            ${meetingsItem}
             <li class="sidebar-item">${renderNavLink(PLANTUML_EDITOR_HREF, editorActive, ICON_EDITOR, 'Editor PlantUML')}</li>
          </ul>
        </nav>
      </div>
      <div class="sidebar-overlay"></div>
    `;
  }

  bindEvents() {
    this.querySelectorAll('.sidebar-caret').forEach((caret) => {
      const submenu = caret.closest('.sidebar-item').querySelector('.sidebar-submenu');
      caret.addEventListener('click', () => {
        const isOpen = submenu.classList.toggle('open');
        caret.setAttribute('aria-expanded', String(isOpen));
      });
    });

    this.querySelector('.sidebar-close').addEventListener('click', () => this.close());
    this.querySelector('.sidebar-overlay').addEventListener('click', () => this.close());

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.classList.contains('is-open')) {
        this.close();
      }
    });

    document.addEventListener('sidebar:toggle', () => this.toggle());
  }

  open() {
    this.classList.add('is-open');
    document.dispatchEvent(new CustomEvent('sidebar:change', { detail: { open: true } }));
  }

  close() {
    this.classList.remove('is-open');
    document.dispatchEvent(new CustomEvent('sidebar:change', { detail: { open: false } }));
  }

  toggle() {
    if (this.classList.contains('is-open')) {
      this.close();
    } else {
      this.open();
    }
  }
}

customElements.define('app-sidebar', AppSidebar);
