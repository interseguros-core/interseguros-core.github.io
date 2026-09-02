class DsFormFields extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="mb-12">
        <h2 class="text-[15px] font-semibold text-[#16213E] tracking-tight">Campos de formulario</h2>
        <p class="text-[13px] text-[#5B6B85] mt-1 mb-5">Inputs, select, textarea y controles</p>
        <div class="bg-white border border-[#E2E5EC] rounded-[4px] p-7">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <div class="w-full">
              <label class="block text-[12.5px] font-medium text-[#16213E] mb-1.5">Nombre del asegurado</label>
              <input type="text" placeholder="Ej. María Fernanda Rojas" class="w-full box-border text-[13.5px] rounded-[3px] outline-none border-[1.5px] border-[#3D5FEB] px-3 py-2 bg-white text-[#16213E]" />
            </div>

            <div class="w-full">
              <label class="block text-[12.5px] font-medium text-[#16213E] mb-1.5">Buscar cliente</label>
              <div class="relative">
                <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A0B8]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input type="text" placeholder="Buscar por nombre o CI..." class="w-full box-border text-[13.5px] rounded-[3px] outline-none border-[1.5px] border-[#AEB9CE] pl-8 pr-3 py-2 bg-white text-[#16213E]" />
              </div>
            </div>

            <div class="w-full">
              <label class="block text-[12.5px] font-medium text-[#16213E] mb-1.5">N° de póliza</label>
              <input type="text" placeholder="PL-00000" class="w-full box-border text-[13.5px] rounded-[3px] outline-none border-[1.5px] border-[#DC2626] px-3 py-2 bg-white text-[#16213E]" />
              <div class="flex items-center gap-1 mt-1.5 text-[12px] text-[#DC2626]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Este número de póliza ya existe
              </div>
            </div>

            <div class="w-full">
              <label class="block text-[12.5px] font-medium text-[#16213E] mb-1.5">Campo deshabilitado</label>
              <input type="text" placeholder="No disponible" disabled class="w-full box-border text-[13.5px] rounded-[3px] outline-none border-[1.5px] border-[#AEB9CE] px-3 py-2 bg-[#F6F7FA] text-[#94A0B8]" />
            </div>

            <div class="w-full">
              <label class="block text-[12.5px] font-medium text-[#16213E] mb-1.5">Tipo de seguro</label>
              <div class="relative">
                <select class="w-full box-border text-[13.5px] text-[#16213E] bg-white border-[1.5px] border-[#AEB9CE] rounded-[3px] outline-none appearance-none cursor-pointer pl-3 pr-8 py-2">
                  <option>Vehicular</option><option>Vida</option><option>SOAT</option><option>Incendio</option><option>Carga</option>
                </select>
                <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A0B8] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            <div class="w-full">
              <label class="block text-[12.5px] font-medium text-[#16213E] mb-1.5">Prima mensual</label>
              <input type="text" placeholder="Bs 0.00" class="w-full box-border text-[13.5px] rounded-[3px] outline-none border-[1.5px] border-[#AEB9CE] px-3 py-2 bg-white text-[#16213E]" />
              <div class="mt-1.5 text-[12px] text-[#94A0B8]">Incluye IVA</div>
            </div>

            <div class="sm:col-span-2 w-full">
              <label class="block text-[12.5px] font-medium text-[#16213E] mb-1.5">Notas internas</label>
              <textarea rows="3" placeholder="Observaciones sobre la póliza..." class="w-full box-border text-[13.5px] text-[#16213E] bg-white border-[1.5px] border-[#AEB9CE] rounded-[3px] outline-none resize-y px-3 py-2 font-sans"></textarea>
            </div>
          </div>

          <div class="mt-6 pt-6 border-t border-[#E2E5EC]">
            <span class="block text-[11px] text-[#94A0B8] font-medium mb-2.5">Controles</span>
            <div class="flex items-center gap-7 flex-wrap">
              <label class="inline-flex items-center gap-2 cursor-pointer text-[13.5px] text-[#16213E]">
                <input type="checkbox" checked class="w-4 h-4 rounded-[2px] accent-[#3D5FEB]" />
                Recordar datos del cliente
              </label>
              <label class="inline-flex items-center gap-2 cursor-pointer text-[13.5px] text-[#16213E]">
                <input type="checkbox" class="w-4 h-4 rounded-[2px] accent-[#3D5FEB]" />
                Enviar copia por correo
              </label>
              <label class="inline-flex items-center gap-2.5 cursor-pointer text-[13.5px] text-[#16213E]">
                <input type="checkbox" checked class="peer sr-only" />
                <span class="w-[34px] h-[19px] rounded-full relative bg-[#D7DBE3] peer-checked:bg-[#3D5FEB] transition-colors">
                  <span class="absolute top-[2px] left-[2px] peer-checked:left-[17px] w-[15px] h-[15px] rounded-full bg-white shadow transition-all"></span>
                </span>
                Notificaciones activas
              </label>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}

customElements.define('ds-form-fields', DsFormFields);
