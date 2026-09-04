import { phosphorIcon } from './ds-phosphor.js';

const TONE = {
  success: 'bg-success text-success',
  danger: 'bg-danger text-danger',
  warning: 'bg-warning text-warning',
  info: 'bg-brand-primary text-brand-primary',
};

const TOASTS = [
  {
    tone: 'success',
    icon: 'check-circle',
    title: 'Póliza creada',
    description: 'La póliza PL-20512 se registró correctamente.',
  },
  {
    tone: 'danger',
    icon: 'x-circle',
    title: 'No se pudo guardar',
    description: 'Verificá los datos del formulario e intentá de nuevo.',
  },
  {
    tone: 'warning',
    icon: 'warning',
    title: 'Vencimiento próximo',
    description: '3 pólizas vencen en los próximos 7 días.',
  },
  {
    tone: 'info',
    icon: 'info',
    title: 'Sincronización en curso',
    description: 'Actualizando datos del cliente desde el core.',
  },
];

class DsToast extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="mb-12">
        <h2 class="text-[15px] font-semibold text-[#16213E] tracking-tight">Toast</h2>
        <p class="text-[13px] text-[#5B6B85] mt-1 mb-5">Notificaciones flotantes para confirmaciones, errores y avisos</p>
        <div class="bg-white border border-[#E2E5EC] rounded-[4px] p-7">
          <div class="flex flex-col gap-3">
            ${TOASTS.map((t) => {
              const [barClass, iconClass] = TONE[t.tone].split(' ');
              return `
              <div class="relative flex items-start gap-3 bg-white border border-[#E2E5EC] rounded-[4px] shadow-sm pl-4 pr-3 py-3 w-full max-w-sm overflow-hidden">
                <span class="absolute left-0 top-0 bottom-0 w-[3px] ${barClass}"></span>
                <span class="shrink-0 mt-0.5 ${iconClass}">${phosphorIcon(t.icon, { size: 'md' })}</span>
                <div class="min-w-0 flex-1">
                  <p class="text-[13.5px] font-medium text-[#16213E]">${t.title}</p>
                  <p class="text-[12.5px] text-[#5B6B85] mt-0.5 leading-snug">${t.description}</p>
                </div>
                <span class="shrink-0 text-[#94A0B8]">${phosphorIcon('close', { size: 'sm' })}</span>
              </div>
            `;
            }).join('')}
          </div>
        </div>
      </section>
    `;
  }
}

customElements.define('ds-toast', DsToast);
