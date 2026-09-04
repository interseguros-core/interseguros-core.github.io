import './ds-input.js';
import './ds-select.js';
import './ds-textarea.js';

class DsFormFields extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="mb-12">
        <h2 class="text-lg font-semibold text-text-primary tracking-tight">Campos de formulario</h2>
        <p class="text-sm text-text-secondary mt-1 mb-5">Inputs, select, textarea y controles</p>
        <div class="bg-white border border-border-default rounded-card p-7">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <ds-input
              label="Nombre del asegurado"
              placeholder="Ej. María Fernanda Rojas">
            </ds-input>

            <ds-input
              label="Buscar cliente"
              placeholder="Buscar por nombre o CI..."
              icon="search">
            </ds-input>

            <ds-input
              label="N° de póliza"
              placeholder="PL-00000"
              state="error"
              message="Este número de póliza ya existe">
            </ds-input>

            <ds-input
              label="Campo deshabilitado"
              placeholder="No disponible"
              disabled>
            </ds-input>

            <ds-select
              label="Tipo de seguro"
              options="Vehicular,Vida,SOAT,Incendio,Carga"
              value="Vehicular">
            </ds-select>

            <ds-input
              label="Prima mensual"
              placeholder="Bs 0.00"
              inputmode="decimal"
              message="Incluye IVA">
            </ds-input>

            <div class="sm:col-span-2">
              <ds-textarea
                label="Notas internas"
                placeholder="Observaciones sobre la póliza...">
              </ds-textarea>
            </div>
          </div>

          <div class="mt-6 pt-6 border-t border-border-default">
            <span class="block text-xs text-text-muted font-medium mb-2.5">Controles</span>
            <div class="flex items-center gap-7 flex-wrap">
              <label class="inline-flex items-center gap-2 cursor-pointer text-[13.5px] text-text-primary">
                <input type="checkbox" checked class="w-4 h-4 rounded-chip accent-brand-primary" />
                Recordar datos del cliente
              </label>
              <label class="inline-flex items-center gap-2 cursor-pointer text-[13.5px] text-text-primary">
                <input type="checkbox" class="w-4 h-4 rounded-chip accent-brand-primary" />
                Enviar copia por correo
              </label>
              <label class="inline-flex items-center gap-2.5 cursor-pointer text-[13.5px] text-text-primary">
                <input type="checkbox" checked class="peer sr-only" />
                <span class="w-[34px] h-[19px] rounded-full relative bg-[#D7DBE3] peer-checked:bg-brand-primary transition-colors">
                  <span class="absolute top-[2px] left-[2px] peer-checked:left-[17px] w-[15px] h-[15px] rounded-full bg-white shadow transition-all"></span>
                </span>
                Notificaciones activas
              </label>
            </div>
          </div>
        </div>

        <div class="bg-white border border-border-default rounded-card p-7 mt-6">
          <span class="block text-xs text-text-muted font-medium mb-3">Label a la izquierda</span>
          <div class="flex flex-col gap-4 max-w-[420px]">
            <ds-input
              layout="horizontal"
              label="Nombre completo"
              placeholder="Ej. María Fernanda Rojas"
              required>
            </ds-input>
            <ds-input
              layout="horizontal"
              label="Correo"
              type="email"
              placeholder="nombre@correo.com">
            </ds-input>
            <ds-input
              layout="horizontal"
              label="N° de póliza"
              placeholder="PL-00000"
              state="error"
              message="Este número de póliza ya existe">
            </ds-input>
          </div>
        </div>
      </section>
    `;
  }
}

if (!customElements.get('ds-form-fields')) {
  customElements.define('ds-form-fields', DsFormFields);
}
