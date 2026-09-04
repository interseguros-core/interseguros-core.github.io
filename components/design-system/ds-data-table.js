import { phosphorIcon } from './ds-phosphor.js';

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

const PAGE_SIZES = [10, 20, 50, 100];
const TOTAL_RECORDS = 75;

function paginationInner({ pageSize, currentPage, openMenu }) {
  const totalPages = Math.ceil(TOTAL_RECORDS / pageSize);
  const page = Math.min(currentPage, totalPages);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, TOTAL_RECORDS);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return `
    <span class="text-[12.5px] text-text-muted">${start}-${end} de ${TOTAL_RECORDS} registros</span>
    <div class="flex items-center gap-2">

      <div class="relative">
        <button type="button" class="page-size-trigger inline-flex items-center gap-1.5 h-7 px-2.5 text-[12.5px] border border-border-strong rounded-control bg-white text-text-primary hover:bg-surface-subtle">
          ${pageSize}
          ${phosphorIcon('caret-down', { size: 'xs' })}
        </button>
        <div class="absolute bottom-full mb-1 left-0 w-20 bg-white border border-border-default rounded-control shadow-lg py-1 z-20 ${openMenu === 'size' ? '' : 'hidden'}">
          ${PAGE_SIZES.map((n) => `
            <button type="button" data-size="${n}" class="page-size-option w-full flex items-center justify-between px-3 py-1.5 text-[13px] text-text-primary hover:bg-surface-subtle">
              ${n}
              <span class="text-text-primary ${n === pageSize ? '' : 'invisible'}">${phosphorIcon('check', { size: 'xs' })}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <button type="button" class="prev-page w-7 h-7 flex items-center justify-center border border-border-strong rounded-control bg-white text-text-secondary hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white" aria-label="Página anterior" ${page === 1 ? 'disabled' : ''}>${phosphorIcon('caret-left', { size: 'xs' })}</button>

      <div class="relative">
        <button type="button" class="page-number-trigger inline-flex items-center gap-1.5 h-7 px-2.5 text-[12.5px] border border-border-strong rounded-control bg-white text-text-primary hover:bg-surface-subtle">
          Pág. ${page}
          ${phosphorIcon('caret-down', { size: 'xs' })}
        </button>
        <div class="absolute bottom-full mb-1 right-0 w-16 max-h-52 overflow-y-auto bg-white border border-border-default rounded-control shadow-lg py-1 z-20 ${openMenu === 'page' ? '' : 'hidden'}">
          ${pageNumbers.map((n) => `
            <button type="button" data-page="${n}" class="page-number-option w-full flex items-center justify-between px-3 py-1.5 text-[13px] text-text-primary hover:bg-surface-subtle">
              ${n}
              <span class="text-text-primary ${n === page ? '' : 'invisible'}">${phosphorIcon('check', { size: 'xs' })}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <button type="button" class="next-page w-7 h-7 flex items-center justify-center border border-border-strong rounded-control bg-white text-text-secondary hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white" aria-label="Página siguiente" ${page === totalPages ? 'disabled' : ''}>${phosphorIcon('caret-right', { size: 'xs' })}</button>

    </div>
  `;
}

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
          <button class="w-[26px] h-[26px] flex items-center justify-center rounded-[2px] text-text-secondary hover:bg-[#F1F2F5]" aria-label="Ver póliza">${phosphorIcon('view', { size: 'sm' })}</button>
          <button class="w-[26px] h-[26px] flex items-center justify-center rounded-[2px] text-text-secondary hover:bg-[#F1F2F5]" aria-label="Editar póliza">${phosphorIcon('edit', { size: 'sm' })}</button>
        </div>
      </td>
    </tr>
  `;
}

class DsDataTable extends HTMLElement {
  connectedCallback() {
    this.pagination = { pageSize: 10, currentPage: 1, openMenu: null };
    const selectedCount = POLICIES.filter((p) => p.selected).length;
    this.innerHTML = `
      <section class="mb-12">
        <h2 class="text-[15px] font-semibold text-[#16213E] tracking-tight">Tabla de datos</h2>
        <p class="text-[13px] text-[#5B6B85] mt-1 mb-5">Listado de pólizas con selección, orden y paginación</p>
        <div class="bg-white border border-[#E2E5EC] rounded-[4px] p-7">

          <div class="flex justify-between items-center mb-4">
            <div class="relative w-[260px]">
              <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A0B8]">${phosphorIcon('search', { size: 'sm' })}</span>
              <input placeholder="Buscar póliza o cliente..." class="w-full box-border text-[13px] border border-[#C7CEDB] rounded-[3px] outline-none pl-[30px] pr-3 py-[7px]" />
            </div>
            <div class="flex items-center gap-3">
              ${selectedCount > 0 ? `<span class="text-[12.5px] text-[#5B6B85] mr-1">${selectedCount} seleccionada${selectedCount > 1 ? 's' : ''}</span>` : ''}
              <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-[3px] bg-white text-[#16213E] border border-[#C7CEDB] hover:bg-[#F8F9FB]">${phosphorIcon('download', { size: 'sm' })} Exportar</button>
              <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-[3px] bg-[#3D5FEB] text-white hover:bg-[#2C46C4]">${phosphorIcon('add', { size: 'sm' })} Nueva póliza</button>
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

          <div class="pagination-bar flex justify-between items-center mt-3.5">
            ${paginationInner(this.pagination)}
          </div>
        </div>
      </section>
    `;
    this.bindEvents();
  }

  bindEvents() {
    const bar = this.querySelector('.pagination-bar');

    const rerender = () => {
      bar.innerHTML = paginationInner(this.pagination);
    };

    bar.addEventListener('click', (e) => {
      const sizeOption = e.target.closest('.page-size-option');
      const pageOption = e.target.closest('.page-number-option');
      const totalPages = Math.ceil(TOTAL_RECORDS / this.pagination.pageSize);

      if (e.target.closest('.page-size-trigger')) {
        this.pagination.openMenu = this.pagination.openMenu === 'size' ? null : 'size';
      } else if (e.target.closest('.page-number-trigger')) {
        this.pagination.openMenu = this.pagination.openMenu === 'page' ? null : 'page';
      } else if (sizeOption) {
        this.pagination.pageSize = Number(sizeOption.dataset.size);
        this.pagination.currentPage = 1;
        this.pagination.openMenu = null;
      } else if (pageOption) {
        this.pagination.currentPage = Number(pageOption.dataset.page);
        this.pagination.openMenu = null;
      } else if (e.target.closest('.prev-page')) {
        this.pagination.currentPage = Math.max(1, this.pagination.currentPage - 1);
        this.pagination.openMenu = null;
      } else if (e.target.closest('.next-page')) {
        this.pagination.currentPage = Math.min(totalPages, this.pagination.currentPage + 1);
        this.pagination.openMenu = null;
      } else {
        return;
      }
      rerender();
    });

    document.addEventListener('click', (e) => {
      if (this.pagination.openMenu && !bar.contains(e.target)) {
        this.pagination.openMenu = null;
        rerender();
      }
    });
  }
}

customElements.define('ds-data-table', DsDataTable);
