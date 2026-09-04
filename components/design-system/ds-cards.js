import './ds-card.js';
import './ds-badge.js';

class DsCards extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="mb-12">
        <h2 class="text-lg font-semibold text-text-primary tracking-tight">Cards y badges</h2>
        <p class="text-sm text-text-secondary mt-1 mb-5">Contenedores de contenido y etiquetas de estado</p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ds-card title="Póliza PL-20481" subtitle="Constructora Andina S.A. · Vehicular">
            <div class="flex items-center justify-between text-[13px] text-text-primary">
              <span>Prima mensual</span>
              <span class="font-semibold">Bs 1,240.00</span>
            </div>
            <div class="mt-3 flex items-center gap-2">
              <ds-badge text="Activa" variant="success" dot></ds-badge>
              <ds-badge text="Renovación automática" variant="info"></ds-badge>
            </div>
          </ds-card>

          <ds-card title="Alertas de cartera">
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="text-[13px] text-text-primary">PL-20455 pendiente de pago</span>
                <ds-badge text="Pendiente" variant="warning" dot></ds-badge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[13px] text-text-primary">PL-20401 vencida</span>
                <ds-badge text="Vencida" variant="danger" dot></ds-badge>
              </div>
            </div>
          </ds-card>
        </div>

        <span class="block text-xs text-text-muted font-medium mb-2.5">Variantes de badge</span>
        <div class="flex items-center gap-2 flex-wrap">
          <ds-badge text="Success" variant="success" dot></ds-badge>
          <ds-badge text="Warning" variant="warning" dot></ds-badge>
          <ds-badge text="Danger" variant="danger" dot></ds-badge>
          <ds-badge text="Info" variant="info"></ds-badge>
          <ds-badge text="Neutral" variant="neutral"></ds-badge>
        </div>
      </section>
    `;
  }
}

if (!customElements.get('ds-cards')) {
  customElements.define('ds-cards', DsCards);
}
