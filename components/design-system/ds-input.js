import { escapeHtml, nextId } from './ds-utils.js';
import { phosphorIcon } from './ds-phosphor.js';

class DsInput extends HTMLElement {
  static get observedAttributes() {
    return [
      'label',
      'placeholder',
      'type',
      'name',
      'value',
      'state',
      'message',
      'icon',
      'input-id',
      'autocomplete',
      'inputmode',
      'disabled',
      'required',
      'layout',
      'label-width',
    ];
  }

  connectedCallback() {
    this.classList.add('block', 'w-full');
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  get input() {
    return this.querySelector('input');
  }

  get value() {
    return this.input?.value ?? '';
  }

  set value(nextValue) {
    this.setAttribute('value', nextValue ?? '');
  }

  focus(options) {
    this.input?.focus(options);
  }

  render() {
    const label = this.getAttribute('label') ?? '';
    const placeholder = this.getAttribute('placeholder') ?? '';
    const type = this.getAttribute('type') ?? 'text';
    const name = this.getAttribute('name') ?? '';
    const value = this.getAttribute('value') ?? '';
    const state = this.getAttribute('state') ?? 'default';
    const message = this.getAttribute('message') ?? '';
    const icon = this.getAttribute('icon') ?? '';
    const autocomplete = this.getAttribute('autocomplete');
    const inputmode = this.getAttribute('inputmode');
    const disabled = this.hasAttribute('disabled');
    const required = this.hasAttribute('required');
    const isHorizontal = this.getAttribute('layout') === 'horizontal';
    const labelWidth = this.getAttribute('label-width') || '140px';

    if (!this._inputId) {
      this._inputId = this.getAttribute('input-id') || nextId('ds-input');
    }

    const inputId = this.getAttribute('input-id') || this._inputId;
    const isError = state === 'error';
    const isFocused = state === 'focus';
    const hasSearchIcon = icon === 'search';
    const messageId = message ? `${inputId}-message` : '';

    const borderClass = isError
      ? 'border-danger'
      : isFocused
        ? 'border-brand-primary'
        : 'border-border-input';

    const surfaceClass = disabled
      ? 'bg-background text-text-muted cursor-not-allowed'
      : 'bg-white text-text-primary';

    const labelMarkup = label ? `
      <label
        for="${escapeHtml(inputId)}"
        class="${isHorizontal ? 'shrink-0' : 'block mb-1.5'} text-[12.5px] font-medium text-text-primary"
        ${isHorizontal ? `style="width:${escapeHtml(labelWidth)}"` : ''}
      >
        ${escapeHtml(label)}${required ? ' <span class="text-danger">*</span>' : ''}
      </label>
    ` : '';

    const fieldMarkup = `
      <div class="relative ${isHorizontal ? 'flex-1 min-w-0' : ''}">
        ${hasSearchIcon ? `<span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">${phosphorIcon('search', { size: 'sm' })}</span>` : ''}
        <input
          id="${escapeHtml(inputId)}"
          type="${escapeHtml(type)}"
          placeholder="${escapeHtml(placeholder)}"
          ${name ? `name="${escapeHtml(name)}"` : ''}
          ${value ? `value="${escapeHtml(value)}"` : ''}
          ${autocomplete ? `autocomplete="${escapeHtml(autocomplete)}"` : ''}
          ${inputmode ? `inputmode="${escapeHtml(inputmode)}"` : ''}
          ${disabled ? 'disabled' : ''}
          ${required ? 'required' : ''}
          ${isError ? 'aria-invalid="true"' : ''}
          ${messageId ? `aria-describedby="${escapeHtml(messageId)}"` : ''}
          class="w-full box-border text-[13.5px] rounded-control outline-none border-[1.5px] ${borderClass} ${hasSearchIcon ? 'pl-8 pr-3' : 'px-3'} py-1.5 ${surfaceClass} focus:border-brand-primary"
        />
      </div>
    `;

    this.innerHTML = `
      <div class="w-full">
        <div class="${isHorizontal ? 'flex items-center gap-3' : ''}">
          ${labelMarkup}
          ${fieldMarkup}
        </div>

        ${message ? `
          <div id="${escapeHtml(messageId)}" class="flex items-center gap-1 mt-1.5 text-[12px] ${isError ? 'text-danger' : 'text-text-muted'}">
            ${isError ? phosphorIcon('warning-circle', { size: 'xs' }) : ''}
            <span>${escapeHtml(message)}</span>
          </div>
        ` : ''}
      </div>
    `;
  }
}

if (!customElements.get('ds-input')) {
  customElements.define('ds-input', DsInput);
}

export { DsInput };
