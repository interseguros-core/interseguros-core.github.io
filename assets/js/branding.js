import '/components/app-sidebar.js';
import '/components/app-navbar.js';
import '/components/diagram-viewer.js';
import { brandingItems } from '/assets/data/branding-items.js';

function renderEmptyState(container) {
  container.innerHTML = `
    <div class="branding-empty">
      Todavía no hay láminas cargadas.<br><br>
      Para agregar la primera: copia la imagen en
      <code>/assets/img/branding/&lt;proyecto&gt;/</code> y agrega una entrada
      en <code>/assets/data/branding-items.js</code>.
    </div>
  `;
}

function renderItems(container, items) {
  items.forEach((item) => {
    const viewer = document.createElement('diagram-viewer');
    viewer.id = item.id;
    viewer.setAttribute('heading', item.title);
    viewer.setAttribute('description', item.description);
    viewer.setAttribute('src', item.image);
    viewer.setAttribute('alt', item.title);
    container.appendChild(viewer);
  });
}

const container = document.getElementById('brandingList');
if (container) {
  if (brandingItems.length === 0) {
    renderEmptyState(container);
  } else {
    renderItems(container, brandingItems);
  }
}
