import { escapeHtml } from './ds-utils.js';

const VARIANTS = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-brand-primary-soft text-brand-primary',
  neutral: 'bg-surface-hover text-text-secondary',
};

class DsBadge extends HTMLElement {
  static get observedAttributes() {
    return ['text', 'variant', 'dot'];
  }

  connectedCallback() {
    if (this._label === undefined) {
      this._label = this.getAttribute('text') ?? this.textContent.trim();
    }
    this.classList.add('inline-block');
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  render() {
    const label = this.getAttribute('text') ?? this._label ?? '';
    const variant = this.getAttribute('variant') ?? 'neutral';
    const showDot = this.hasAttribute('dot');
    const variantClasses = VARIANTS[variant] ?? VARIANTS.neutral;

    this.innerHTML = `
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-full ${variantClasses}">
        ${showDot ? '<span class="w-1.5 h-1.5 rounded-full bg-current"></span>' : ''}
        ${escapeHtml(label)}
      </span>
    `;
  }
}

if (!customElements.get('ds-badge')) {
  customElements.define('ds-badge', DsBadge);
}

export { DsBadge };
