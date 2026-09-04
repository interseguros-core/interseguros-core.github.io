import { escapeHtml, nextId } from './ds-utils.js';

class DsTextarea extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'placeholder', 'value', 'name', 'rows', 'state', 'message', 'textarea-id', 'disabled', 'required'];
  }

  connectedCallback() {
    this.classList.add('block', 'w-full');
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  get textarea() {
    return this.querySelector('textarea');
  }

  get value() {
    return this.textarea?.value ?? '';
  }

  set value(nextValue) {
    this.setAttribute('value', nextValue ?? '');
  }

  focus(options) {
    this.textarea?.focus(options);
  }

  render() {
    const label = this.getAttribute('label') ?? '';
    const placeholder = this.getAttribute('placeholder') ?? '';
    const value = this.getAttribute('value') ?? '';
    const name = this.getAttribute('name') ?? '';
    const rows = this.getAttribute('rows') ?? '3';
    const state = this.getAttribute('state') ?? 'default';
    const message = this.getAttribute('message') ?? '';
    const disabled = this.hasAttribute('disabled');
    const required = this.hasAttribute('required');

    if (!this._textareaId) {
      this._textareaId = this.getAttribute('textarea-id') || nextId('ds-textarea');
    }
    const textareaId = this.getAttribute('textarea-id') || this._textareaId;
    const isError = state === 'error';
    const messageId = message ? `${textareaId}-message` : '';

    const borderClass = isError ? 'border-danger' : 'border-border-input';
    const surfaceClass = disabled
      ? 'bg-background text-text-muted cursor-not-allowed'
      : 'bg-white text-text-primary';

    this.innerHTML = `
      <div class="w-full">
        ${label ? `
          <label for="${escapeHtml(textareaId)}" class="block text-[12.5px] font-medium text-text-primary mb-1.5">
            ${escapeHtml(label)}${required ? ' <span class="text-danger">*</span>' : ''}
          </label>
        ` : ''}

        <textarea
          id="${escapeHtml(textareaId)}"
          ${name ? `name="${escapeHtml(name)}"` : ''}
          rows="${escapeHtml(rows)}"
          placeholder="${escapeHtml(placeholder)}"
          ${disabled ? 'disabled' : ''}
          ${required ? 'required' : ''}
          ${isError ? 'aria-invalid="true"' : ''}
          ${messageId ? `aria-describedby="${escapeHtml(messageId)}"` : ''}
          class="w-full box-border text-[13.5px] rounded-control outline-none resize-y border-[1.5px] ${borderClass} px-3 py-1.5 font-sans ${surfaceClass} focus:border-brand-primary"
        >${escapeHtml(value)}</textarea>

        ${message ? `
          <div id="${escapeHtml(messageId)}" class="mt-1.5 text-[12px] ${isError ? 'text-danger' : 'text-text-muted'}">${escapeHtml(message)}</div>
        ` : ''}
      </div>
    `;
  }
}

if (!customElements.get('ds-textarea')) {
  customElements.define('ds-textarea', DsTextarea);
}

export { DsTextarea };
