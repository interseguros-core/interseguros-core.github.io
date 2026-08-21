import '/components/app-sidebar.js';
import '/components/app-navbar.js';
import '/components/diagram-viewer.js';
import { architectureDiagrams } from '/assets/data/architecture-diagrams.js';

function renderEmptyState(container) {
  container.innerHTML = `
    <div class="architecture-empty">
      Todavía no hay diagramas cargados.<br><br>
      Para agregar el primero: copia el archivo <code>.svg</code> (y, si
      quieres, un <code>.txt</code> con su código fuente como reserva) en
      <code>/assets/img/arquitectura/</code>, y agrega una entrada en
      <code>/assets/data/architecture-diagrams.js</code>. El README dentro
      de esa carpeta trae el paso a paso.
    </div>
  `;
}

function renderDiagrams(container, diagrams) {
  diagrams.forEach((diagram) => {
    const viewer = document.createElement('diagram-viewer');
    viewer.id = diagram.id;
    viewer.setAttribute('heading', diagram.title);
    viewer.setAttribute('description', diagram.description);
    viewer.setAttribute('src', diagram.svg);
    viewer.setAttribute('alt', diagram.title);
    if (diagram.source) {
      viewer.setAttribute('source', diagram.source);
    }
    container.appendChild(viewer);
  });
}

const container = document.getElementById('architectureList');
if (container) {
  if (architectureDiagrams.length === 0) {
    renderEmptyState(container);
  } else {
    renderDiagrams(container, architectureDiagrams);
  }
}
