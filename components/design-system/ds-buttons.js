import './ds-button.js';

class DsButtons extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="mb-12">
        <h2 class="text-[15px] font-semibold text-[#16213E] tracking-tight">Botones</h2>
        <p class="text-[13px] text-[#5B6B85] mt-1 mb-5">Variantes, posición de íconos y estados en tamaño mediano</p>

        <div class="bg-white border border-[#E2E5EC] rounded-[4px] p-7">
          <div class="flex flex-col gap-7">
            <div>
              <span class="block text-[11px] text-[#94A0B8] font-medium mb-3">Variantes</span>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
                <ds-button text="Primary" variant="primary"></ds-button>
                <ds-button text="Disabled" variant="primary" disabled></ds-button>
                <ds-button text="Text" variant="text"></ds-button>
                <ds-button text="Link" variant="link"></ds-button>
                <ds-button text="Secondary" variant="secondary"></ds-button>
                <ds-button text="Help" variant="help"></ds-button>
                <ds-button text="Success" variant="success"></ds-button>
                <ds-button text="Danger" variant="danger"></ds-button>
                <ds-button text="Warning" variant="warning"></ds-button>
                <ds-button text="Exportar" variant="outline" icon="download"></ds-button>
                <ds-button text="Cancelar" variant="text"></ds-button>
              </div>
            </div>

            <div class="border-t border-[#E2E5EC] pt-6">
              <span class="block text-[11px] text-[#94A0B8] font-medium mb-3">Íconos</span>
              <div class="flex items-center gap-3 flex-wrap">
                <ds-button text="Ícono izquierdo" variant="primary" icon="check"></ds-button>
                <ds-button text="Ícono derecho" variant="primary" icon="arrow-right" icon-position="right"></ds-button>
                <ds-button text="Buscar" variant="outline" icon="search"></ds-button>
                <ds-button text="Eliminar" variant="danger" icon="trash"></ds-button>
              </div>
            </div>

            <div class="border-t border-[#E2E5EC] pt-6">
              <span class="block text-[11px] text-[#94A0B8] font-medium mb-3">Estados</span>
              <div class="flex items-center gap-3 flex-wrap">
                <ds-button text="Habilitado" variant="primary" icon="check"></ds-button>
                <ds-button text="Deshabilitado" variant="primary" icon="check" disabled></ds-button>
                <ds-button text="Habilitado" variant="outline"></ds-button>
                <ds-button text="Deshabilitado" variant="outline" disabled></ds-button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}

if (!customElements.get('ds-buttons')) {
  customElements.define('ds-buttons', DsButtons);
}
