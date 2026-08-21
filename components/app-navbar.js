const ICON_MENU = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`;

class AppNavbar extends HTMLElement {
  connectedCallback() {
    const heading = this.getAttribute('heading') || document.title;

    this.innerHTML = `
      <header class="navbar">
        <button type="button" class="navbar-toggle" aria-label="Abrir menú" aria-controls="primarySidebar" aria-expanded="false">
          ${ICON_MENU}
        </button>
        <h1 class="navbar-title"></h1>
      </header>
    `;

    this.querySelector('.navbar-title').textContent = heading;

    const toggle = this.querySelector('.navbar-toggle');
    toggle.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('sidebar:toggle'));
    });

    document.addEventListener('sidebar:change', (event) => {
      toggle.setAttribute('aria-expanded', String(event.detail.open));
    });
  }
}

customElements.define('app-navbar', AppNavbar);
