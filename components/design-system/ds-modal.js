import './ds-button.js';
import { phosphorIcon } from './ds-phosphor.js';

function modalContent({ preview = false } = {}) {
  const idPrefix = preview ? 'preview' : 'dialog';

  return `
    <div class="bg-white border border-[#C7CEDB] ${preview ? 'w-full max-w-[640px]' : 'w-[min(640px,calc(100vw-32px))]'} shadow-[0_18px_50px_rgba(11,20,64,0.18)] rounded-[4px] overflow-hidden">
      <header class="flex items-start justify-between gap-6 px-6 pt-5 pb-4 border-b border-[#E2E5EC]">
        <div class="flex items-start gap-3">
          <span class="mt-0.5 shrink-0 text-[#5B6B85]">
            ${phosphorIcon('shield-check', { size: 'lg' })}
          </span>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#5B6B85]">Autorización operativa</span>
              <span class="border border-[#E2B86B] bg-[#FFF8E8] px-1.5 py-0.5 text-[10px] font-semibold text-[#8A5A00] rounded-[2px]">Nivel 2</span>
            </div>
            <h3 id="${idPrefix}-modal-title" class="text-[17px] font-semibold leading-tight text-[#16213E]">Aprobar endoso de póliza</h3>
            <p id="${idPrefix}-modal-description" class="mt-1 text-[12.5px] text-[#5B6B85]">Operación END-008421 · registrada hoy, 10:42</p>
          </div>
        </div>
        <button type="button" data-modal-close class="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] text-[#5B6B85] hover:bg-[#F1F2F5] hover:text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#3D5FEB]" aria-label="Cerrar modal">
          ${phosphorIcon('close', { size: 'sm' })}
        </button>
      </header>

      <div class="px-6 py-5">
        <div class="border border-[#E2E5EC] rounded-[3px] overflow-hidden">
          <dl class="grid grid-cols-2 bg-[#FAFBFC]">
            <div class="border-b border-r border-[#E2E5EC] px-4 py-3">
              <dt class="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#7F8CA3]">Póliza</dt>
              <dd class="mt-1 text-[13px] font-semibold text-[#16213E]">PL-20481 · Vehicular</dd>
            </div>
            <div class="border-b border-[#E2E5EC] px-4 py-3">
              <dt class="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#7F8CA3]">Asegurado</dt>
              <dd class="mt-1 truncate text-[13px] font-semibold text-[#16213E]">Constructora Andina S.A.</dd>
            </div>
            <div class="border-r border-[#E2E5EC] px-4 py-3">
              <dt class="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#7F8CA3]">Cambio solicitado</dt>
              <dd class="mt-1 text-[13px] text-[#16213E]">Ampliación de cobertura</dd>
            </div>
            <div class="px-4 py-3">
              <dt class="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#7F8CA3]">Impacto en prima</dt>
              <dd class="mt-1 text-[13px] font-semibold tabular-nums text-[#16213E]">+ Bs 1.240,00 / año</dd>
            </div>
          </dl>
        </div>

        <div class="mt-4 flex items-start gap-2.5 border-l-[3px] border-[#D39A2C] bg-[#FFF9EC] px-3.5 py-3 text-[#654A17]">
          <span class="mt-0.5 shrink-0">${phosphorIcon('info', { size: 'sm' })}</span>
          <p class="text-[12.5px] leading-[1.45]">La aprobación modifica la cobertura vigente y genera una adenda contractual. El cambio no podrá revertirse una vez emitido.</p>
        </div>

        <div class="mt-5">
          <div class="flex items-baseline justify-between gap-4">
            <label for="${idPrefix}-approval-note" class="text-[12.5px] font-medium text-[#16213E]">Justificación de aprobación <span class="text-[#C62828]">*</span></label>
            <span data-note-count class="text-[11px] text-[#7F8CA3]">0/20 caracteres</span>
          </div>
          <textarea id="${idPrefix}-approval-note" rows="3" ${preview ? 'tabindex="-1"' : ''} placeholder="Describa el criterio utilizado para autorizar la operación..." class="mt-1.5 w-full box-border resize-y rounded-[3px] border-[1.5px] border-[#AEB9CE] bg-white px-3 py-2 font-sans text-[13.5px] text-[#16213E] outline-none focus:border-[#3D5FEB]"></textarea>
        </div>
      </div>

      <footer class="flex items-center justify-between gap-4 border-t border-[#E2E5EC] bg-[#F8F9FB] px-6 py-4">
        <div class="min-w-0">
          <p class="text-[11.5px] font-medium text-[#5B6B85]">Registro de auditoría habilitado</p>
          <p class="mt-0.5 truncate text-[10.5px] text-[#8A96AA]">Usuario, fecha, IP y motivo quedarán registrados.</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <ds-button text="Cancelar" variant="outline" data-modal-close></ds-button>
          <ds-button text="Aprobar y emitir" variant="primary" data-modal-confirm ${preview ? '' : 'disabled'}></ds-button>
        </div>
      </footer>
    </div>
  `;
}

class DsModal extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        .enterprise-modal::backdrop {
          background: rgba(11, 20, 64, 0.56);
          backdrop-filter: blur(1.5px);
        }
      </style>

      <section class="mb-12">
        <div class="flex items-end justify-between gap-6 mb-5">
          <div>
            <h2 class="text-[15px] font-semibold text-[#16213E] tracking-tight">Modal</h2>
            <p class="text-[13px] text-[#5B6B85] mt-1">Confirmación transaccional con contexto, impacto y trazabilidad</p>
          </div>
          <ds-button text="Abrir modal" variant="primary" icon="arrow-right" icon-position="right" data-modal-open></ds-button>
        </div>

        <div class="relative min-h-[650px] overflow-hidden rounded-[4px] border border-[#D7DCE6] bg-[#E9ECF2] p-8">
          <div aria-hidden="true" class="absolute inset-0 opacity-55">
            <div class="h-12 border-b border-[#CFD5E0] bg-white"></div>
            <div class="grid grid-cols-[180px_1fr] h-full">
              <div class="border-r border-[#CFD5E0] bg-[#F7F8FA] p-5">
                <div class="h-2.5 w-24 bg-[#CDD3DF]"></div>
                <div class="mt-7 space-y-4"><div class="h-2 w-28 bg-[#D7DCE5]"></div><div class="h-2 w-20 bg-[#D7DCE5]"></div><div class="h-2 w-24 bg-[#D7DCE5]"></div></div>
              </div>
              <div class="p-8">
                <div class="h-3 w-44 bg-[#C9D0DC]"></div>
                <div class="mt-5 h-24 border border-[#D1D6E0] bg-white"></div>
                <div class="mt-4 h-32 border border-[#D1D6E0] bg-white"></div>
              </div>
            </div>
          </div>
          <div class="pointer-events-none relative z-10 flex min-h-[586px] items-center justify-center" aria-hidden="true" inert>
            ${modalContent({ preview: true })}
          </div>
        </div>

        <div class="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[11.5px] text-[#6B7890]">
          <span><strong class="font-semibold text-[#3E4A60]">Ancho:</strong> 640 px</span>
          <span><strong class="font-semibold text-[#3E4A60]">Uso:</strong> decisiones irreversibles o reguladas</span>
          <span><strong class="font-semibold text-[#3E4A60]">Cierre:</strong> botón, fondo o tecla Esc</span>
        </div>
      </section>

      <dialog class="enterprise-modal fixed inset-0 m-auto max-h-[calc(100vh-32px)] max-w-none overflow-y-auto border-0 bg-transparent p-0" aria-labelledby="dialog-modal-title" aria-describedby="dialog-modal-description">
        ${modalContent()}
      </dialog>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const dialog = this.querySelector('dialog');
    const openButton = this.querySelector('[data-modal-open]');
    const closeButtons = dialog.querySelectorAll('[data-modal-close]');
    const note = dialog.querySelector('textarea');
    const noteCount = dialog.querySelector('[data-note-count]');
    const confirmButton = dialog.querySelector('[data-modal-confirm]');

    openButton.addEventListener('click', () => {
      dialog.showModal();
      note.focus();
    });
    closeButtons.forEach((button) => button.addEventListener('click', () => dialog.close()));

    note.addEventListener('input', () => {
      const length = note.value.trim().length;
      noteCount.textContent = `${length}/20 caracteres`;
      noteCount.classList.toggle('text-[#1D7A57]', length >= 20);
      noteCount.classList.toggle('text-[#7F8CA3]', length < 20);
      confirmButton.disabled = length < 20;
    });

    confirmButton.addEventListener('click', () => {
      dialog.close('approved');
      note.value = '';
      note.dispatchEvent(new Event('input'));
    });

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  }
}

customElements.define('ds-modal', DsModal);
