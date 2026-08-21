const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;
const WHEEL_FACTOR = 0.0015;

const ICON_ZOOM_IN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>`;
const ICON_ZOOM_OUT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/></svg>`;
const ICON_RESET = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>`;
const ICON_DOWNLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>`;

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
}

customElements.define('diagram-viewer', DiagramViewer);
