const POLICIES = [
  { id: 'PL-20481', client: 'Constructora Andina S.A.', type: 'Vehicular', status: 'Activa', prima: 'Bs 1,240.00', venc: '14 Mar 2027', selected: true },
  { id: 'PL-20482', client: 'María Fernanda Rojas', type: 'Vida', status: 'Activa', prima: 'Bs 380.00', venc: '02 Ene 2027' },
  { id: 'PL-20455', client: 'Textiles del Sur EIRL', type: 'Incendio', status: 'Pendiente', prima: 'Bs 2,950.00', venc: '28 Feb 2026' },
  { id: 'PL-20401', client: 'Carlos Mendoza Vargas', type: 'SOAT', status: 'Vencida', prima: 'Bs 145.00', venc: '11 Sep 2025' },
  { id: 'PL-20470', client: 'Grupo Minero Altiplano', type: 'Carga', status: 'Activa', prima: 'Bs 6,120.00', venc: '19 Jun 2027' },
];

const STATUS_STYLE = {
  Activa: 'bg-[#E7F6EF] text-[#1D9A6C]',
  Pendiente: 'bg-[#FDF3E2] text-[#D97706]',
  Vencida: 'bg-[#FBEAEA] text-[#DC2626]',
};

const ICON_EYE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5B6B85" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_EDIT = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5B6B85" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>';

function row(p) {
  return `
    <tr class="border-b border-[#E2E5EC] last:border-b-0 ${p.selected ? 'bg-[#EEF1FD]' : 'hover:bg-[#FAFBFC]'}">
      <td class="pl-3.5 py-[11px]"><input type="checkbox" ${p.selected ? 'checked' : ''} class="w-4 h-4 accent-[#3D5FEB]" /></td>
      <td class="px-3.5 py-[11px] text-[13px] font-medium text-[#16213E]">${p.id}</td>
      <td class="px-3.5 py-[11px] text-[13px] text-[#16213E]">${p.client}</td>
      <td class="px-3.5 py-[11px] text-[13px] text-[#5B6B85]">${p.type}</td>
      <td class="px-3.5 py-[11px]">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-full ${STATUS_STYLE[p.status]}">
          <span class="w-1.5 h-1.5 rounded-full bg-current"></span>${p.status}
        </span>
      </td>
      <td class="px-3.5 py-[11px] text-[13px] text-[#16213E] text-right">${p.prima}</td>
      <td class="px-3.5 py-[11px] text-[13px] text-[#5B6B85]">${p.venc}</td>
      <td class="px-3.5 py-[11px]">
        <div class="flex items-center gap-1">
          <button class="w-[26px] h-[26px] flex items-center justify-center rounded-[2px] hover:bg-[#F1F2F5]">${ICON_EYE}</button>
          <button class="w-[26px] h-[26px] flex items-center justify-center rounded-[2px] hover:bg-[#F1F2F5]">${ICON_EDIT}</button>
        </div>
      </td>
    </tr>
  `;
}

class DsDataTable extends HTMLElement {
  connectedCallback() {
    const selectedCount = POLICIES.filter((p) => p.selected).length;
    this.innerHTML = `
      <section class="mb-12">
        <h2 class="text-[15px] font-semibold text-[#16213E] tracking-tight">Tabla de datos</h2>
        <p class="text-[13px] text-[#5B6B85] mt-1 mb-5">Listado de pólizas con selección, orden y paginación</p>
        <div class="bg-white border border-[#E2E5EC] rounded-[4px] p-7">

          <div class="flex justify-between items-center mb-4">
            <div class="relative w-[260px]">
              <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A0B8]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input placeholder="Buscar póliza o cliente..." class="w-full box-border text-[13px] border border-[#C7CEDB] rounded-[3px] outline-none pl-[30px] pr-3 py-[7px]" />
            </div>
            <div class="flex items-center gap-3">
              ${selectedCount > 0 ? `<span class="text-[12.5px] text-[#5B6B85] mr-1">${selectedCount} seleccionada${selectedCount > 1 ? 's' : ''}</span>` : ''}
              <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-[3px] bg-white text-[#16213E] border border-[#C7CEDB] hover:bg-[#F8F9FB]">Exportar</button>
              <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-[3px] bg-[#3D5FEB] text-white hover:bg-[#2C46C4]">Nueva póliza</button>
            </div>
          </div>

          <div class="border border-[#E2E5EC] rounded-[4px] overflow-hidden">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-[#FAFBFC] border-b border-[#E2E5EC]">
                  <th class="pl-3.5 py-2.5 w-9"><input type="checkbox" class="w-4 h-4 accent-[#3D5FEB]" /></th>
                  <th class="px-3.5 py-2.5 text-[11.5px] font-semibold text-[#5B6B85] text-left">N° Póliza</th>
                  <th class="px-3.5 py-2.5 text-[11.5px] font-semibold text-[#5B6B85] text-left">Cliente</th>
                  <th class="px-3.5 py-2.5 text-[11.5px] font-semibold text-[#5B6B85] text-left">Tipo</th>
                  <th class="px-3.5 py-2.5 text-[11.5px] font-semibold text-[#5B6B85] text-left">Estado</th>
                  <th class="px-3.5 py-2.5 text-[11.5px] font-semibold text-[#5B6B85] text-right">Prima</th>
                  <th class="px-3.5 py-2.5 text-[11.5px] font-semibold text-[#5B6B85] text-left">Vencimiento</th>
                  <th class="w-10"></th>
                </tr>
              </thead>
              <tbody>
                ${POLICIES.map(row).join('')}
              </tbody>
            </table>
          </div>

          <div class="flex justify-between items-center mt-3.5">
            <span class="text-[12.5px] text-[#94A0B8]">Mostrando ${POLICIES.length} de 128 pólizas</span>
            <div class="flex items-center gap-1">
              <button class="min-w-[30px] h-7 px-2 text-[12.5px] border border-[#C7CEDB] rounded-[3px] bg-white text-[#5B6B85]">Anterior</button>
              <button class="min-w-[30px] h-7 px-2 text-[12.5px] border border-[#3D5FEB] rounded-[3px] bg-[#3D5FEB] text-white">1</button>
              <button class="min-w-[30px] h-7 px-2 text-[12.5px] border border-[#C7CEDB] rounded-[3px] bg-white text-[#5B6B85]">2</button>
              <button class="min-w-[30px] h-7 px-2 text-[12.5px] border border-[#C7CEDB] rounded-[3px] bg-white text-[#5B6B85]">3</button>
              <button class="min-w-[30px] h-7 px-2 text-[12.5px] border border-[#C7CEDB] rounded-[3px] bg-white text-[#5B6B85]">Siguiente</button>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}

customElements.define('ds-data-table', DsDataTable);
