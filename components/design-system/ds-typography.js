const SIZES = [
  { token: 'text-sm', label: 'Chico', px: '12px' },
  { token: 'text-md', label: 'Mediano', px: '13.5px' },
  { token: 'text-lg', label: 'Grande', px: '15px' },
  { token: 'text-xl', label: 'Extra grande', px: '18px' },
];

const WEIGHTS = [
  { token: 'font-normal', label: 'Regular', css: '400' },
  { token: 'font-medium', label: 'Medium', css: '500' },
  { token: 'font-semibold', label: 'Semibold', css: '600' },
  { token: 'font-bold', label: 'Bold', css: '700' },
];

const OPACITIES = [
  { token: 'text-text-primary', label: '100%' },
  { token: 'text-text-primary/75', label: '75%' },
  { token: 'text-text-primary/50', label: '50%' },
  { token: 'text-text-primary/30', label: '30%' },
];

class DsTypography extends HTMLElement {
  connectedCallback() {
    const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim();

    this.innerHTML = `
      <section class="mb-12">
        <h2 class="text-lg font-semibold text-text-primary tracking-tight">Tipografía</h2>
        <p class="text-sm text-text-secondary mt-1 mb-5">Tamaños, pesos y opacidad de texto que usa el sistema. Cambiar la fuente en un solo lugar (token <code>--font-sans</code>) actualiza todo el Design System.</p>

        <div class="bg-white border border-border-default rounded-card p-7">

          <span class="block text-xs text-text-muted font-medium mb-2.5">Tipo de letra</span>
          <div class="flex items-baseline gap-3 pb-6 mb-6 border-b border-border-default">
            <span class="text-xl font-semibold text-text-primary">Aa</span>
            <div class="min-w-0">
              <p class="text-md font-medium text-text-primary truncate">${fontFamily}</p>
              <p class="text-xs text-text-muted mt-0.5">Definida en un solo token (<code>--font-sans</code>); si se cambia ahí, se refleja en todo el sistema.</p>
            </div>
          </div>

          <span class="block text-xs text-text-muted font-medium mb-2.5">Tamaños (solo 4: chico, mediano, grande, extra grande)</span>
          <div class="flex flex-col gap-3 pb-6 mb-6 border-b border-border-default">
            ${SIZES.map((s) => `
              <div class="flex items-baseline gap-4">
                <span class="w-[130px] shrink-0 text-xs text-text-muted font-mono">${s.token} · ${s.px}</span>
                <span class="${s.token} text-text-primary">${s.label} — Interseguros</span>
              </div>
            `).join('')}
          </div>

          <span class="block text-xs text-text-muted font-medium mb-2.5">Peso (delgada → gruesa)</span>
          <div class="flex flex-col gap-3 pb-6 mb-6 border-b border-border-default">
            ${WEIGHTS.map((w) => `
              <div class="flex items-baseline gap-4">
                <span class="w-[130px] shrink-0 text-xs text-text-muted font-mono">${w.token} · ${w.css}</span>
                <span class="text-md ${w.token} text-text-primary">${w.label} — Interseguros</span>
              </div>
            `).join('')}
          </div>

          <span class="block text-xs text-text-muted font-medium mb-2.5">Opacidad de texto</span>
          <div class="flex flex-col gap-3">
            ${OPACITIES.map((o) => `
              <div class="flex items-baseline gap-4">
                <span class="w-[130px] shrink-0 text-xs text-text-muted font-mono">${o.label}</span>
                <span class="text-md font-medium ${o.token}">Interseguros — texto de ejemplo</span>
              </div>
            `).join('')}
          </div>

        </div>
      </section>
    `;
  }
}

if (!customElements.get('ds-typography')) {
  customElements.define('ds-typography', DsTypography);
}
