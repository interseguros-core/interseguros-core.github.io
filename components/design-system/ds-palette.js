import { logoSvg } from './ds-logo.js';

const LOGO_VARIANTS = [
  { bg: 'bg-[#F6F7FA]', logo: 'text-[#7f8ea1]', word: 'text-[#0B1440]' },
  { bg: 'bg-[#3D5FEB]', logo: 'text-white', word: 'text-white' },
  { bg: 'bg-[#0B1440]', logo: 'text-[#AEB9CE]', word: 'text-white' },
  { bg: 'bg-white border-t border-[#E2E5EC]', logo: 'text-[#7f8ea1]', word: 'text-[#3D5FEB]' },
];

const PALETTE = [
  { name: 'Primary', hex: '#3D5FEB', usage: 'Acciones principales, links, foco' },
  { name: 'Primary hover', hex: '#2C46C4', usage: 'Hover / active de botones primarios' },
  { name: 'Primary light', hex: '#EEF1FD', usage: 'Fondos tintados, filas seleccionadas' },
  { name: 'Navy', hex: '#0B1440', usage: 'Wordmark, texto de alto énfasis' },
  { name: 'Slate', hex: '#7C8DA6', usage: 'Isotipo, acentos secundarios' },
  { name: 'Text primary', hex: '#16213E', usage: 'Texto principal' },
  { name: 'Text secondary', hex: '#5B6B85', usage: 'Texto de apoyo' },
  { name: 'Text muted', hex: '#94A0B8', usage: 'Placeholders, hints' },
  { name: 'Border strong', hex: '#C7CEDB', usage: 'Bordes de inputs y botones' },
  { name: 'Success', hex: '#1D9A6C', usage: 'Estados positivos, confirmaciones' },
  { name: 'Warning', hex: '#D97706', usage: 'Alertas, pendientes' },
  { name: 'Danger', hex: '#DC2626', usage: 'Errores, eliminación' },
];

class DsPalette extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="mb-12">
        <h2 class="text-[15px] font-semibold text-[#16213E] tracking-tight">Paleta de colores</h2>
        <p class="text-[13px] text-[#5B6B85] mt-1 mb-5">Isotipo sobre los fondos de marca y tokens de color del sistema</p>
        <div class="bg-white border border-[#E2E5EC] rounded-[4px] p-7">

          <span class="block text-[11px] text-[#94A0B8] font-medium mb-2.5">Isotipo sobre fondos</span>
          <div class="grid grid-cols-2 rounded-[4px] overflow-hidden border border-[#E2E5EC] mb-7">
            ${LOGO_VARIANTS.map((v) => `
              <div class="h-36 flex items-center justify-center gap-3 ${v.bg}">
                ${logoSvg({ width: 30, colorClass: v.logo })}
                <span class="text-[18px] font-bold tracking-tight ${v.word}">Holos IA</span>
              </div>
            `).join('')}
          </div>

          <span class="block text-[11px] text-[#94A0B8] font-medium mb-2.5">Tokens</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${PALETTE.map((c) => `
              <div class="flex items-center gap-3 border border-[#E2E5EC] rounded-[3px] p-3">
                <div class="w-11 h-11 rounded-[3px] shrink-0 ${c.hex === '#EEF1FD' ? 'border border-[#E2E5EC]' : ''}" style="background-color:${c.hex}"></div>
                <div class="min-w-0">
                  <div class="flex items-baseline gap-2">
                    <span class="text-[13px] font-medium text-[#16213E]">${c.name}</span>
                    <span class="text-[11px] text-[#94A0B8] font-mono">${c.hex}</span>
                  </div>
                  <p class="text-[12px] text-[#5B6B85] mt-0.5 leading-snug">${c.usage}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }
}

customElements.define('ds-palette', DsPalette);
