import { escapeHtml } from './ds-utils.js';
import { phosphorIcon } from './ds-phosphor.js';

const VARIANTS = {
  primary: 'bg-brand-primary text-white border-brand-primary hover:bg-brand-primary-hover hover:border-brand-primary-hover',
  secondary: 'bg-text-secondary text-white border-text-secondary hover:bg-[#46546B] hover:border-[#46546B]',
  outline: 'bg-white text-text-primary border-border-strong hover:bg-[#F8F9FB]',
  text: 'bg-transparent text-text-secondary border-transparent hover:bg-surface-hover',
  link: 'bg-transparent text-brand-primary border-transparent hover:text-brand-primary-hover hover:underline underline-offset-4',
  success: 'bg-success text-white border-success hover:bg-[#17805A] hover:border-[#17805A]',
  danger: 'bg-danger text-white border-danger hover:bg-danger-hover hover:border-danger-hover',
  warning: 'bg-warning text-white border-warning hover:bg-[#B96305] hover:border-[#B96305]',
  help: 'bg-help text-white border-help hover:bg-help-hover hover:border-help-hover',
};

class DsButton extends HTMLElement {
  static get observedAttributes() {
    return ['text', 'label', 'variant', 'icon', 'icon-size', 'icon-weight', 'icon-position', 'type', 'name', 'value', 'disabled', 'aria-label'];
  }

  connectedCallback() {
    if (this._label === undefined) {
      this._label = this.getAttribute('text') ?? this.getAttribute('label') ?? this.textContent.trim();
    }

    this.classList.add('inline-block');
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  get button() {
    return this.querySelector('button');
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    this.toggleAttribute('disabled', Boolean(value));
  }

  focus(options) {
    this.button?.focus(options);
  }

  render() {
    const label = this.getAttribute('text') ?? this.getAttribute('label') ?? this._label ?? '';
    const variant = this.getAttribute('variant') ?? 'primary';
    const icon = this.getAttribute('icon') ?? '';
    const iconSize = this.getAttribute('icon-size') ?? 'md';
    const iconWeight = this.getAttribute('icon-weight') ?? 'regular';
    const iconPosition = this.getAttribute('icon-position') ?? 'left';
    const type = this.getAttribute('type') ?? 'button';
    const name = this.getAttribute('name') ?? '';
    const value = this.getAttribute('value') ?? '';
    const ariaLabel = this.getAttribute('aria-label') ?? '';
    const disabled = this.hasAttribute('disabled');
    const variantClasses = VARIANTS[variant] ?? VARIANTS.primary;
    const iconMarkup = icon ? phosphorIcon(icon, { size: iconSize, weight: iconWeight }) : '';

    this.innerHTML = `
      <button
        type="${escapeHtml(type)}"
        ${name ? `name="${escapeHtml(name)}"` : ''}
        ${value ? `value="${escapeHtml(value)}"` : ''}
        ${ariaLabel ? `aria-label="${escapeHtml(ariaLabel)}"` : ''}
        ${disabled ? 'disabled' : ''}
        class="inline-flex items-center justify-center gap-[7px] px-4 py-2 text-[13.5px] font-medium rounded-control border ${variantClasses} transition-colors disabled:bg-disabled disabled:border-disabled disabled:text-white disabled:no-underline disabled:cursor-not-allowed"
      >
        ${iconMarkup && iconPosition !== 'right' ? iconMarkup : ''}
        ${label ? `<span>${escapeHtml(label)}</span>` : ''}
        ${iconMarkup && iconPosition === 'right' ? iconMarkup : ''}
      </button>
    `;
  }
}

if (!customElements.get('ds-button')) {
  customElements.define('ds-button', DsButton);
}

export { DsButton };
