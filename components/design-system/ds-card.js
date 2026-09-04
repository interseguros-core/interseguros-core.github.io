import { escapeHtml } from './ds-utils.js';

class DsCard extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'subtitle', 'padded'];
  }

  connectedCallback() {
    if (this._content === undefined) {
      this._content = this.innerHTML;
    }
    this.classList.add('block');
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  render() {
    const title = this.getAttribute('title') ?? '';
    const subtitle = this.getAttribute('subtitle') ?? '';
    const padded = this.getAttribute('padded') !== 'false';

    this.innerHTML = `
      <div class="bg-white border border-border-default rounded-card overflow-hidden">
        ${title ? `
          <div class="px-5 py-4 border-b border-border-default">
            <h3 class="text-[13.5px] font-semibold text-text-primary">${escapeHtml(title)}</h3>
            ${subtitle ? `<p class="mt-0.5 text-[12px] text-text-secondary">${escapeHtml(subtitle)}</p>` : ''}
          </div>
        ` : ''}
        <div class="${padded ? 'p-7' : ''}">${this._content}</div>
      </div>
    `;
  }
}

if (!customElements.get('ds-card')) {
  customElements.define('ds-card', DsCard);
}

export { DsCard };
