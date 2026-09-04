import { escapeHtml, nextId } from './ds-utils.js';
import { phosphorIcon } from './ds-phosphor.js';

class DsSelect extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'options', 'value', 'name', 'state', 'message', 'select-id', 'disabled', 'required'];
  }

  connectedCallback() {
    this.classList.add('block', 'w-full');
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  get select() {
    return this.querySelector('select');
  }

  get value() {
    return this.select?.value ?? '';
  }

  set value(nextValue) {
    this.setAttribute('value', nextValue ?? '');
  }

  focus(options) {
    this.select?.focus(options);
  }

  render() {
    const label = this.getAttribute('label') ?? '';
    const options = (this.getAttribute('options') ?? '')
      .split(',')
      .map((option) => option.trim())
      .filter(Boolean);
    const value = this.getAttribute('value') ?? '';
    const name = this.getAttribute('name') ?? '';
    const state = this.getAttribute('state') ?? 'default';
    const message = this.getAttribute('message') ?? '';
    const disabled = this.hasAttribute('disabled');
    const required = this.hasAttribute('required');

    if (!this._selectId) {
      this._selectId = this.getAttribute('select-id') || nextId('ds-select');
    }
    const selectId = this.getAttribute('select-id') || this._selectId;
    const isError = state === 'error';
    const messageId = message ? `${selectId}-message` : '';

    const borderClass = isError ? 'border-danger' : 'border-border-input';
    const surfaceClass = disabled
      ? 'bg-background text-text-muted cursor-not-allowed'
      : 'bg-white text-text-primary cursor-pointer';

    this.innerHTML = `
      <div class="w-full">
        ${label ? `
          <label for="${escapeHtml(selectId)}" class="block text-[12.5px] font-medium text-text-primary mb-1.5">
            ${escapeHtml(label)}${required ? ' <span class="text-danger">*</span>' : ''}
          </label>
        ` : ''}

        <div class="relative">
          <select
            id="${escapeHtml(selectId)}"
            ${name ? `name="${escapeHtml(name)}"` : ''}
            ${disabled ? 'disabled' : ''}
            ${required ? 'required' : ''}
            ${isError ? 'aria-invalid="true"' : ''}
            ${messageId ? `aria-describedby="${escapeHtml(messageId)}"` : ''}
            class="w-full box-border text-[13.5px] rounded-control outline-none appearance-none border-[1.5px] ${borderClass} pl-3 pr-8 py-1.5 ${surfaceClass} focus:border-brand-primary"
          >
            ${options.map((option) => `<option ${option === value ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}
          </select>
          <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">${phosphorIcon('caret-down', { size: 'sm' })}</span>
        </div>

        ${message ? `
          <div id="${escapeHtml(messageId)}" class="mt-1.5 text-[12px] ${isError ? 'text-danger' : 'text-text-muted'}">${escapeHtml(message)}</div>
        ` : ''}
      </div>
    `;
  }
}

if (!customElements.get('ds-select')) {
  customElements.define('ds-select', DsSelect);
}

export { DsSelect };
