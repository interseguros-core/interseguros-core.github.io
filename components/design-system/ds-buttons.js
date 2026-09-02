class DsButtons extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="mb-12">
        <h2 class="text-[15px] font-semibold text-[#16213E] tracking-tight">Botones</h2>
        <p class="text-[13px] text-[#5B6B85] mt-1 mb-5">Variantes, tamaños y estados</p>
        <div class="bg-white border border-[#E2E5EC] rounded-[4px] p-7">
          <div class="flex flex-col gap-5">
            <div>
              <span class="block text-[11px] text-[#94A0B8] font-medium mb-2.5">Variantes</span>
              <div class="flex items-center gap-3 flex-wrap">
                <button class="inline-flex items-center gap-[7px] px-4 py-2 text-[13.5px] font-medium rounded-[3px] bg-[#3D5FEB] text-white hover:bg-[#2C46C4]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Nueva póliza
                </button>
                <button class="inline-flex items-center gap-[7px] px-4 py-2 text-[13.5px] font-medium rounded-[3px] bg-white text-[#16213E] border border-[#C7CEDB] hover:bg-[#F8F9FB]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Exportar
                </button>
                <button class="inline-flex items-center px-4 py-2 text-[13.5px] font-medium rounded-[3px] bg-transparent text-[#5B6B85] hover:bg-[#F1F2F5]">Cancelar</button>
                <button class="inline-flex items-center gap-[7px] px-4 py-2 text-[13.5px] font-medium rounded-[3px] bg-[#DC2626] text-white hover:bg-[#C21E1E]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Eliminar
                </button>
              </div>
            </div>
            <div>
              <span class="block text-[11px] text-[#94A0B8] font-medium mb-2.5">Tamaños</span>
              <div class="flex items-center gap-3 flex-wrap">
                <button class="px-3 py-1.5 text-[13px] font-medium rounded-[3px] bg-[#3D5FEB] text-white">Pequeño</button>
                <button class="px-4 py-2 text-[13.5px] font-medium rounded-[3px] bg-[#3D5FEB] text-white">Mediano</button>
                <button class="px-5 py-2.5 text-[14.5px] font-medium rounded-[3px] bg-[#3D5FEB] text-white">Grande</button>
              </div>
            </div>
            <div>
              <span class="block text-[11px] text-[#94A0B8] font-medium mb-2.5">Estados</span>
              <div class="flex items-center gap-3 flex-wrap">
                <button class="px-4 py-2 text-[13.5px] font-medium rounded-[3px] bg-[#3D5FEB] text-white">Normal</button>
                <button class="inline-flex items-center gap-[7px] px-4 py-2 text-[13.5px] font-medium rounded-[3px] bg-[#3D5FEB] text-white">
                  <svg class="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Guardando
                </button>
                <button disabled class="px-4 py-2 text-[13.5px] font-medium rounded-[3px] bg-[#A9B4E8] text-white cursor-not-allowed">Deshabilitado</button>
                <button disabled class="px-4 py-2 text-[13.5px] font-medium rounded-[3px] bg-white text-[#94A0B8] border border-[#C7CEDB] cursor-not-allowed">Deshabilitado</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}

customElements.define('ds-buttons', DsButtons);
