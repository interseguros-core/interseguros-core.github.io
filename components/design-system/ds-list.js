const ACTIVITIES = [
  {
    unread: true,
    iconBg: '#EEF1FD',
    iconColor: '#3D5FEB',
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    title: 'Póliza PL-20481 creada',
    subtitle: 'Constructora Andina S.A. · Vehicular',
    time: 'Hace 5 min',
  },
  {
    unread: true,
    iconBg: '#FDF3E2',
    iconColor: '#D97706',
    icon: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    title: 'Póliza PL-20455 pendiente de pago',
    subtitle: 'Textiles del Sur EIRL · Incendio',
    time: 'Hace 2 h',
  },
  {
    unread: false,
    iconBg: '#E7F6EF',
    iconColor: '#1D9A6C',
    icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    title: 'Pago registrado',
    subtitle: 'María Fernanda Rojas · Bs 380.00',
    time: 'Ayer',
  },
  {
    unread: true,
    iconBg: '#FBEAEA',
    iconColor: '#DC2626',
    icon: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    title: 'Póliza PL-20401 vencida',
    subtitle: 'Carlos Mendoza Vargas · SOAT',
    time: 'Hace 3 días',
  },
];

const DOCS = [
  { name: 'Condiciones generales.pdf', size: '240 KB', checked: true },
  { name: 'Cédula de identidad.pdf', size: '1.1 MB', checked: true },
  { name: 'Tarjeta de propiedad.pdf', size: '380 KB', checked: false },
  { name: 'Comprobante de pago.pdf', size: '95 KB', checked: false },
];

const ICON_DOC = '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>';
const ICON_DOWNLOAD = '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>';

function activityRow(a, isLast) {
  return `
    <div data-unread="${a.unread}" class="activity-item flex items-center gap-3 px-4 py-3 ${isLast ? '' : 'border-b border-[#E2E5EC]'} hover:bg-[#FAFBFC] cursor-pointer">
      <span class="w-9 h-9 rounded-[3px] flex items-center justify-center shrink-0" style="background-color:${a.iconBg}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${a.iconColor}" stroke-width="2">${a.icon}</svg>
      </span>
      <div class="min-w-0 flex-1">
        <p class="activity-title text-[13.5px] ${a.unread ? 'font-semibold' : 'font-medium'} text-[#16213E] truncate">${a.title}</p>
        <p class="text-[12.5px] text-[#5B6B85] truncate">${a.subtitle}</p>
      </div>
      <span class="unread-dot w-2 h-2 rounded-full bg-[#3D5FEB] shrink-0 ${a.unread ? '' : 'invisible'}"></span>
      <span class="text-[11.5px] text-[#94A0B8] shrink-0 w-16 text-right">${a.time}</span>
    </div>
  `;
}

function docRow(d, isLast) {
  return `
    <label class="doc-item flex items-center gap-3 px-4 py-3 ${isLast ? '' : 'border-b border-[#E2E5EC]'} cursor-pointer transition-colors ${d.checked ? 'bg-[#EEF1FD]' : 'hover:bg-[#FAFBFC]'}">
      <input type="checkbox" ${d.checked ? 'checked' : ''} class="doc-checkbox w-4 h-4 accent-[#3D5FEB] shrink-0" />
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B6B85" stroke-width="2" class="shrink-0">${ICON_DOC}</svg>
      <div class="min-w-0 flex-1">
        <p class="text-[13.5px] font-medium text-[#16213E] truncate">${d.name}</p>
        <p class="text-[12px] text-[#5B6B85]">${d.size}</p>
      </div>
      <button type="button" class="shrink-0 text-[#5B6B85] hover:text-[#16213E]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ICON_DOWNLOAD}</svg>
      </button>
    </label>
  `;
}

class DsList extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="mb-12">
        <h2 class="text-[15px] font-semibold text-[#16213E] tracking-tight">Lista</h2>
        <p class="text-[13px] text-[#5B6B85] mt-1 mb-5">Listados de una sola columna para actividad, notificaciones o selección de ítems</p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div class="bg-white border border-[#E2E5EC] rounded-[4px] p-7">
            <div class="flex items-center justify-between mb-2.5">
              <span class="block text-[11px] text-[#94A0B8] font-medium">Actividad reciente</span>
              <button type="button" class="mark-all-read text-[12px] font-medium text-[#3D5FEB] hover:text-[#2C46C4]">Marcar todas como leídas</button>
            </div>
            <div class="activity-list border border-[#E2E5EC] rounded-[4px] overflow-hidden">
              ${ACTIVITIES.map((a, i) => activityRow(a, i === ACTIVITIES.length - 1)).join('')}
            </div>
          </div>

          <div class="bg-white border border-[#E2E5EC] rounded-[4px] p-7">
            <div class="flex items-center justify-between mb-2.5">
              <label class="flex items-center gap-2 text-[11px] text-[#94A0B8] font-medium cursor-pointer">
                <input type="checkbox" class="select-all-docs w-3.5 h-3.5 accent-[#3D5FEB]" />
                Documentos de la póliza
              </label>
              <span class="doc-counter text-[12px] text-[#5B6B85]"></span>
            </div>
            <div class="doc-list border border-[#E2E5EC] rounded-[4px] overflow-hidden">
              ${DOCS.map((d, i) => docRow(d, i === DOCS.length - 1)).join('')}
            </div>
            <button type="button" class="download-btn mt-4 inline-flex items-center gap-[7px] px-4 py-2 text-[13.5px] font-medium rounded-[3px] bg-[#3D5FEB] text-white hover:bg-[#2C46C4] disabled:bg-[#A9B4E8] disabled:cursor-not-allowed">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ICON_DOWNLOAD}</svg>
              Descargar seleccionados
            </button>
          </div>

        </div>
      </section>
    `;
    this.bindEvents();
  }

  bindEvents() {
    const activityItems = this.querySelectorAll('.activity-item');
    const markAllReadBtn = this.querySelector('.mark-all-read');

    const setRead = (item) => {
      item.dataset.unread = 'false';
      item.querySelector('.activity-title').classList.remove('font-semibold');
      item.querySelector('.activity-title').classList.add('font-medium');
      item.querySelector('.unread-dot').classList.add('invisible');
    };

    activityItems.forEach((item) => {
      item.addEventListener('click', () => setRead(item));
    });
    markAllReadBtn.addEventListener('click', () => activityItems.forEach(setRead));

    const docItems = this.querySelectorAll('.doc-item');
    const docCheckboxes = this.querySelectorAll('.doc-checkbox');
    const selectAllDocs = this.querySelector('.select-all-docs');
    const docCounter = this.querySelector('.doc-counter');
    const downloadBtn = this.querySelector('.download-btn');

    const updateDocState = () => {
      const total = docCheckboxes.length;
      const checked = this.querySelectorAll('.doc-checkbox:checked').length;

      docItems.forEach((item) => {
        const cb = item.querySelector('.doc-checkbox');
        item.classList.toggle('bg-[#EEF1FD]', cb.checked);
        item.classList.toggle('hover:bg-[#FAFBFC]', !cb.checked);
      });

      docCounter.textContent = `${checked} de ${total} seleccionados`;
      selectAllDocs.checked = checked === total;
      selectAllDocs.indeterminate = checked > 0 && checked < total;
      downloadBtn.disabled = checked === 0;
    };

    docCheckboxes.forEach((cb) => {
      cb.addEventListener('click', (e) => e.stopPropagation());
      cb.addEventListener('change', updateDocState);
    });

    selectAllDocs.addEventListener('change', () => {
      docCheckboxes.forEach((cb) => { cb.checked = selectAllDocs.checked; });
      updateDocState();
    });

    downloadBtn.addEventListener('click', () => {
      const files = Array.from(docItems)
        .filter((item) => item.querySelector('.doc-checkbox').checked)
        .map((item) => item.querySelector('p').textContent);
      alert('Descargando:\n' + files.join('\n'));
    });

    updateDocState();
  }
}

customElements.define('ds-list', DsList);
