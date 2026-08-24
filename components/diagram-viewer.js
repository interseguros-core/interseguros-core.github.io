const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;
const WHEEL_FACTOR = 0.0015;

const ICON_ZOOM_IN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>`;
const ICON_ZOOM_OUT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/></svg>`;
const ICON_RESET = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>`;
const ICON_DOWNLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>`;
const ICON_FULLSCREEN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`;
const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`;

class DiagramViewer extends HTMLElement {
  constructor() {
    super();
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.dragging = false;
  }

  connectedCallback() {
    const heading = this.getAttribute('heading') || '';
    const description = this.getAttribute('description') || '';
    const src = this.getAttribute('src') || '';
    const source = this.getAttribute('source') || '';
    const alt = this.getAttribute('alt') || heading;
    const showFullscreenBtn = !this.hasAttribute('no-fullscreen');

    this.innerHTML = `
      <div class="diagram-viewer">
        <div class="diagram-viewer-head">
          <div class="diagram-viewer-text">
            ${heading ? `<h2 class="diagram-viewer-title">${heading}</h2>` : ''}
            ${description ? `<p class="diagram-viewer-desc">${description}</p>` : ''}
          </div>
          <div class="diagram-viewer-toolbar">
            <button type="button" class="dv-btn" data-action="zoom-out" aria-label="Reducir zoom">${ICON_ZOOM_OUT}</button>
            <span class="dv-zoom-readout" data-role="zoom-readout">100%</span>
            <button type="button" class="dv-btn" data-action="zoom-in" aria-label="Aumentar zoom">${ICON_ZOOM_IN}</button>
            <button type="button" class="dv-btn" data-action="reset" aria-label="Restablecer zoom">${ICON_RESET}</button>
            ${showFullscreenBtn ? `<button type="button" class="dv-btn" data-action="fullscreen" aria-label="Ver en pantalla completa">${ICON_FULLSCREEN}</button>` : ''}
            ${source ? `<a class="dv-btn dv-download" href="${source}" download>${ICON_DOWNLOAD}<span>Código fuente (.txt)</span></a>` : ''}
          </div>
        </div>
        <div class="diagram-viewer-viewport" tabindex="0" role="img" aria-label="${alt}">
          <img class="diagram-viewer-img" src="${src}" alt="${alt}" draggable="false">
        </div>
      </div>
    `;

    this.viewport = this.querySelector('.diagram-viewer-viewport');
    this.image = this.querySelector('.diagram-viewer-img');
    this.readout = this.querySelector('[data-role="zoom-readout"]');

    this.bindEvents();
    this.applyTransform();
  }

  bindEvents() {
    this.querySelector('[data-action="zoom-in"]').addEventListener('click', () => this.zoomBy(SCALE_STEP));
    this.querySelector('[data-action="zoom-out"]').addEventListener('click', () => this.zoomBy(-SCALE_STEP));
    this.querySelector('[data-action="reset"]').addEventListener('click', () => this.resetView());

    const fullscreenBtn = this.querySelector('[data-action="fullscreen"]');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => this.openFullscreen());
    }

    this.viewport.addEventListener('wheel', (event) => {
      event.preventDefault();
      const factor = 1 - event.deltaY * WHEEL_FACTOR;
      this.zoomBy(this.scale * factor - this.scale);
    }, { passive: false });

    this.viewport.addEventListener('pointerdown', (event) => {
      this.dragging = true;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.viewport.setPointerCapture(event.pointerId);
      this.viewport.classList.add('is-dragging');
    });
    this.viewport.addEventListener('pointermove', (event) => {
      if (!this.dragging) return;
      this.offsetX += event.clientX - this.lastX;
      this.offsetY += event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.applyTransform();
    });
    const stopDrag = () => {
      this.dragging = false;
      this.viewport.classList.remove('is-dragging');
    };
    this.viewport.addEventListener('pointerup', stopDrag);
    this.viewport.addEventListener('pointercancel', stopDrag);
    this.viewport.addEventListener('pointerleave', stopDrag);

    this.viewport.addEventListener('keydown', (event) => {
      const PAN_STEP = 40;
      switch (event.key) {
        case '+':
        case '=':
          event.preventDefault();
          this.zoomBy(SCALE_STEP);
          break;
        case '-':
        case '_':
          event.preventDefault();
          this.zoomBy(-SCALE_STEP);
          break;
        case '0':
          event.preventDefault();
          this.resetView();
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.offsetY += PAN_STEP;
          this.applyTransform();
          break;
        case 'ArrowDown':
          event.preventDefault();
          this.offsetY -= PAN_STEP;
          this.applyTransform();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          this.offsetX += PAN_STEP;
          this.applyTransform();
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.offsetX -= PAN_STEP;
          this.applyTransform();
          break;
      }
    });
  }

  zoomBy(delta) {
    this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this.scale + delta));
    this.applyTransform();
  }

  resetView() {
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.applyTransform();
  }

  applyTransform() {
    this.image.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    if (this.readout) {
      this.readout.textContent = `${Math.round(this.scale * 100)}%`;
    }
    this.querySelector('[data-action="zoom-in"]').disabled = this.scale >= MAX_SCALE;
    this.querySelector('[data-action="zoom-out"]').disabled = this.scale <= MIN_SCALE;
  }

  /*
   * Opens the diagram in a fullscreen popup with its own independent
   * <diagram-viewer> instance (own zoom/pan state), mirroring the PlantUML
   * editor's preview lightbox. `no-fullscreen` suppresses the button on the
   * clone so it can't nest lightboxes inside itself.
   */
  openFullscreen() {
    const heading = this.getAttribute('heading') || '';
    const description = this.getAttribute('description') || '';
    const source = this.getAttribute('source') || '';
    const alt = this.getAttribute('alt') || heading;

    const overlay = document.createElement('div');
    overlay.className = 'diagram-viewer-lightbox';
    overlay.innerHTML = `
      <button type="button" class="diagram-viewer-lightbox-close" aria-label="Cerrar vista ampliada">${ICON_CLOSE}</button>
      <div class="diagram-viewer-lightbox-content"></div>
    `;

    const viewer = document.createElement('diagram-viewer');
    viewer.setAttribute('src', this.image.src);
    if (heading) viewer.setAttribute('heading', heading);
    if (description) viewer.setAttribute('description', description);
    if (source) viewer.setAttribute('source', source);
    if (alt) viewer.setAttribute('alt', alt);
    viewer.setAttribute('no-fullscreen', '');
    overlay.querySelector('.diagram-viewer-lightbox-content').appendChild(viewer);

    const previouslyFocused = document.activeElement;
    const close = () => {
      overlay.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown);
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
    const onKeydown = (event) => {
      if (event.key === 'Escape') close();
    };

    overlay.querySelector('.diagram-viewer-lightbox-close').addEventListener('click', close);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });
    document.addEventListener('keydown', onKeydown);

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    overlay.querySelector('.diagram-viewer-lightbox-close').focus();
  }
}

customElements.define('diagram-viewer', DiagramViewer);
