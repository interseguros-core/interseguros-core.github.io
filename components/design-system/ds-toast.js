const TOASTS = [
  {
    bar: '#1D9A6C',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    iconColor: '#1D9A6C',
    title: 'Póliza creada',
    description: 'La póliza PL-20512 se registró correctamente.',
  },
  {
    bar: '#DC2626',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    iconColor: '#DC2626',
    title: 'No se pudo guardar',
    description: 'Verificá los datos del formulario e intentá de nuevo.',
  },
  {
    bar: '#D97706',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    iconColor: '#D97706',
    title: 'Vencimiento próximo',
    description: '3 pólizas vencen en los próximos 7 días.',
  },
  {
    bar: '#3D5FEB',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    iconColor: '#3D5FEB',
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
            ${TOASTS.map((t) => `
              <div class="relative flex items-start gap-3 bg-white border border-[#E2E5EC] rounded-[4px] shadow-sm pl-4 pr-3 py-3 w-full max-w-sm overflow-hidden">
                <span class="absolute left-0 top-0 bottom-0 w-[3px]" style="background-color:${t.bar}"></span>
                <span class="shrink-0 mt-0.5" style="color:${t.iconColor}">${t.icon}</span>
                <div class="min-w-0 flex-1">
                  <p class="text-[13.5px] font-medium text-[#16213E]">${t.title}</p>
                  <p class="text-[12.5px] text-[#5B6B85] mt-0.5 leading-snug">${t.description}</p>
                </div>
                <svg class="shrink-0 text-[#94A0B8]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }
}

customElements.define('ds-toast', DsToast);
