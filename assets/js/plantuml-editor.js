import '/components/app-sidebar.js';
import '/components/app-navbar.js';
import '/components/diagram-viewer.js';
import { buildPlantUmlSvgUrl, buildPlantUmlPngUrl } from '/assets/js/plantuml-encode.js';

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
const STORAGE_KEY = 'interseguros:plantuml-editor:draft';
const SAVE_DEBOUNCE_MS = 400;

const sourceEl = document.getElementById('plantuml-source');
const loadBtn = document.getElementById('plantuml-load-btn');
const fileInput = document.getElementById('plantuml-file-input');
const filenameEl = document.getElementById('plantuml-filename');
const renderBtn = document.getElementById('plantuml-render-btn');
const statusEl = document.getElementById('plantuml-status');
const previewEl = document.getElementById('plantuml-preview');
const downloadPumlBtn = document.getElementById('plantuml-download-puml-btn');
const downloadSvgBtn = document.getElementById('plantuml-download-svg-btn');
const downloadPngBtn = document.getElementById('plantuml-download-png-btn');
const openSvgBtn = document.getElementById('plantuml-open-svg-btn');
const lightbox = document.getElementById('plantuml-lightbox');
const lightboxClose = document.getElementById('plantuml-lightbox-close');
const lightboxContent = document.getElementById('plantuml-lightbox-content');

let loadedFileBaseName = null; // base name (no extension) of a loaded .puml, if any
let renderedBaseName = null;   // base name to use for the next SVG download
let lastRenderedSource = null; // textarea content at the time of the last successful render
let lastSvgText = null;        // raw SVG markup, only when the fetch path succeeded
let lastRenderUrl = null;      // last PlantUML server URL we attempted, for "Abrir SVG"
let lastObjectUrl = null;      // blob: URL currently shown in the preview, to revoke later
let hasRenderedOnce = false;
let saveDebounceTimer = null;

/*
 * Persistence: this is a static multi-page site, so moving to another tab
 * (Arquitectura, Inicio...) and back is a full page reload — nothing kept
 * only in JS variables survives that. To avoid losing the draft, the
 * editor's state is mirrored into localStorage and restored on load.
 */
function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // private mode / storage disabled — degrade silently
  }
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      source: sourceEl.value,
      loadedFileName: loadedFileBaseName ? `${loadedFileBaseName}.puml` : null,
      renderedSource: lastRenderedSource,
      renderedBaseName,
      svgText: lastSvgText,
      renderUrl: lastRenderUrl,
    }));
  } catch {
    // Quota exceeded or storage disabled — the editor still works for this
    // page view, it just won't be restored on the next one.
  }
}

function scheduleSave() {
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(persistState, SAVE_DEBOUNCE_MS);
}

function setStatus(message, level) {
  statusEl.textContent = message;
  if (level) {
    statusEl.setAttribute('data-level', level);
  } else {
    statusEl.removeAttribute('data-level');
  }
}

function currentBaseName() {
  return loadedFileBaseName || 'diagrama';
}

/*
 * Download filenames come from the diagram's own content, not the loaded
 * file name: PlantUML's `title ...` directive if present, otherwise the
 * second line of the code (the first is normally @startuml/@startmindmap...).
 * Falls back to "diagrama" when neither yields anything usable.
 */
function deriveDiagramName(source) {
  if (!source) return 'diagrama';

  const titleMatch = source.match(/^[ \t]*title[ \t]+(.+?)[ \t]*$/im);
  let raw = titleMatch ? titleMatch[1] : null;

  if (!raw) {
    const lines = source.split(/\r?\n/);
    raw = lines.length > 1 ? lines[1] : null;
  }
  if (!raw) return 'diagrama';

  const sanitized = raw.trim().replace(/[\\/:*?"<>|]/g, '').trim();
  return sanitized || 'diagrama';
}

function updateDownloadPumlAvailability() {
  downloadPumlBtn.disabled = !sourceEl.value.trim();
}

function setStale() {
  if (!hasRenderedOnce) return;
  downloadSvgBtn.disabled = true;
  downloadPngBtn.disabled = true;
  setStatus('El código cambió después del último render. La vista previa está desactualizada — presione "Renderizar" para actualizarla.', 'warning');
}

function looksLikePlantUml(text) {
  const trimmed = text.trim();
  return /^@start\w*/i.test(trimmed) && /@end\w*\s*$/i.test(trimmed);
}

function clearPreviewObjectUrl() {
  if (lastObjectUrl) {
    URL.revokeObjectURL(lastObjectUrl);
    lastObjectUrl = null;
  }
}

function showPreviewImage(src) {
  previewEl.innerHTML = '';
  const img = document.createElement('img');
  img.src = src;
  img.alt = 'Diagrama PlantUML renderizado';
  img.className = 'plantuml-preview-img';
  previewEl.appendChild(img);

  previewEl.classList.add('has-image');
  previewEl.setAttribute('role', 'button');
  previewEl.setAttribute('tabindex', '0');
  previewEl.setAttribute('aria-label', 'Ampliar diagrama a pantalla completa');
}

function openLightbox() {
  const img = previewEl.querySelector('.plantuml-preview-img');
  if (!img) return;

  lightboxContent.innerHTML = '';
  const viewer = document.createElement('diagram-viewer');
  viewer.setAttribute('src', img.src);
  viewer.setAttribute('heading', 'Vista previa ampliada');
  viewer.setAttribute('no-fullscreen', '');
  lightboxContent.appendChild(viewer);

  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxContent.innerHTML = '';
  document.body.style.overflow = '';
  previewEl.focus();
}

function showSvgFromText(svgText) {
  clearPreviewObjectUrl();
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const objectUrl = URL.createObjectURL(blob);
  lastObjectUrl = objectUrl;
  showPreviewImage(objectUrl);
}

function preloadImage(url) {
  return new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => resolve(true);
    probe.onerror = () => resolve(false);
    probe.src = url;
  });
}

function setBusy(busy) {
  renderBtn.disabled = busy;
}

async function renderDiagram() {
  const source = sourceEl.value;

  if (!source.trim()) {
    setStatus('Escriba o cargue código PlantUML antes de renderizar.', 'error');
    return;
  }
  if (!looksLikePlantUml(source)) {
    setStatus('El código debe abrir con @start... y cerrar con @end... (por ejemplo @startuml / @enduml).', 'error');
    return;
  }

  setBusy(true);
  setStatus('Renderizando…', 'info');

  const url = buildPlantUmlSvgUrl(source);
  lastRenderUrl = url;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`el servidor de PlantUML respondió con el código ${response.status}`);
    }
    const svgText = await response.text();
    if (!svgText.includes('<svg')) {
      throw new Error('la respuesta del servidor no contiene un SVG válido');
    }

    showSvgFromText(svgText);
    lastSvgText = svgText;
    lastRenderedSource = source;
    renderedBaseName = currentBaseName();
    hasRenderedOnce = true;

    downloadSvgBtn.disabled = false;
    downloadPngBtn.disabled = false;
    openSvgBtn.disabled = false;
    setStatus('Diagrama renderizado correctamente.', 'success');
  } catch (err) {
    // Network error or a CORS-opaque failure on fetch: fall back to plain
    // <img> display, which doesn't need CORS to just show the picture — we
    // just lose the ability to read the SVG markup for the download button.
    const displayed = await preloadImage(url);
    lastSvgText = null;

    if (displayed) {
      showPreviewImage(url);
      lastRenderedSource = source;
      renderedBaseName = currentBaseName();
      hasRenderedOnce = true;

      downloadSvgBtn.disabled = true;
      downloadPngBtn.disabled = false;
      openSvgBtn.disabled = false;
      setStatus('El diagrama se muestra, pero no se pudo leer el SVG para descargarlo directamente (posible bloqueo CORS del servidor). Use "Abrir SVG" para verlo y guardarlo desde esa pestaña.', 'warning');
    } else {
      downloadSvgBtn.disabled = true;
      downloadPngBtn.disabled = true;
      openSvgBtn.disabled = true;
      setStatus(`No se pudo renderizar el diagrama: ${err.message}. El código no se modificó.`, 'error');
    }
  } finally {
    setBusy(false);
    persistState();
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadPuml() {
  const text = sourceEl.value;
  if (!text.trim()) {
    setStatus('No hay código para descargar.', 'error');
    return;
  }
  const suggested = `${deriveDiagramName(text)}.puml`;
  const name = window.prompt('Nombre del archivo .puml:', suggested);
  if (!name) return;
  const finalName = /\.puml$/i.test(name) ? name : `${name}.puml`;
  triggerDownload(new Blob([text], { type: 'text/plain;charset=utf-8' }), finalName);
}

function downloadSvg() {
  if (!lastSvgText) return;
  const suggested = `${deriveDiagramName(lastRenderedSource)}.svg`;
  const name = window.prompt('Nombre del archivo SVG:', suggested);
  if (!name) return;
  const finalName = /\.svg$/i.test(name) ? name : `${name}.svg`;
  triggerDownload(new Blob([lastSvgText], { type: 'image/svg+xml;charset=utf-8' }), finalName);
}

async function downloadPng() {
  if (!lastRenderedSource) return;
  const suggested = `${deriveDiagramName(lastRenderedSource)}.png`;
  const name = window.prompt('Nombre del archivo PNG:', suggested);
  if (!name) return;
  const finalName = /\.png$/i.test(name) ? name : `${name}.png`;
  const pngUrl = buildPlantUmlPngUrl(lastRenderedSource);

  downloadPngBtn.disabled = true;
  setStatus('Generando PNG…', 'info');
  try {
    const response = await fetch(pngUrl);
    if (!response.ok) throw new Error(`el servidor respondió con el código ${response.status}`);
    const blob = await response.blob();
    triggerDownload(blob, finalName);
    setStatus('PNG descargado correctamente.', 'success');
  } catch {
    // Same CORS caveat as the SVG fetch path: if we can't read the bytes,
    // open it in a new tab so the user can save it manually from there.
    window.open(pngUrl, '_blank', 'noopener');
    setStatus('No se pudo descargar el PNG directamente (posible bloqueo CORS del servidor). Se abrió en una pestaña nueva — guárdelo desde ahí.', 'warning');
  } finally {
    downloadPngBtn.disabled = false;
  }
}

function openSvgInNewTab() {
  if (!lastRenderUrl) return;
  window.open(lastRenderUrl, '_blank', 'noopener');
}

function handleFileChosen() {
  const file = fileInput.files[0];
  fileInput.value = '';
  if (!file) return;

  if (!/\.puml$/i.test(file.name)) {
    setStatus('El archivo debe tener extensión .puml.', 'error');
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    setStatus('El archivo supera el tamaño máximo permitido (1 MB).', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    sourceEl.value = String(reader.result);
    loadedFileBaseName = file.name.replace(/\.puml$/i, '');
    filenameEl.textContent = file.name;
    updateDownloadPumlAvailability();
    setStale();
    setStatus('Archivo cargado. Presione "Renderizar" para verlo — no se renderiza automáticamente.', 'info');
    persistState();
  };
  reader.onerror = () => setStatus('No se pudo leer el archivo.', 'error');
  reader.readAsText(file);
}

function handleTabKey(event) {
  if (event.key !== 'Tab') return;
  event.preventDefault();
  const { selectionStart, selectionEnd, value } = sourceEl;
  sourceEl.value = `${value.slice(0, selectionStart)}\t${value.slice(selectionEnd)}`;
  sourceEl.selectionStart = sourceEl.selectionEnd = selectionStart + 1;
  sourceEl.dispatchEvent(new Event('input'));
}

loadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileChosen);
renderBtn.addEventListener('click', renderDiagram);
downloadPumlBtn.addEventListener('click', downloadPuml);
downloadSvgBtn.addEventListener('click', downloadSvg);
downloadPngBtn.addEventListener('click', downloadPng);
openSvgBtn.addEventListener('click', openSvgInNewTab);

previewEl.addEventListener('click', () => {
  if (previewEl.classList.contains('has-image')) openLightbox();
});
previewEl.addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && previewEl.classList.contains('has-image')) {
    event.preventDefault();
    openLightbox();
  }
});
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
});

sourceEl.addEventListener('keydown', handleTabKey);
sourceEl.addEventListener('input', () => {
  updateDownloadPumlAvailability();
  if (sourceEl.value !== lastRenderedSource) {
    setStale();
  }
  scheduleSave();
});

function restoreState() {
  const saved = loadStoredState();
  if (!saved) {
    updateDownloadPumlAvailability();
    return;
  }

  if (typeof saved.source === 'string') {
    sourceEl.value = saved.source;
  }
  if (saved.loadedFileName) {
    loadedFileBaseName = saved.loadedFileName.replace(/\.puml$/i, '');
    filenameEl.textContent = saved.loadedFileName;
  }
  updateDownloadPumlAvailability();

  const hadPriorRender = Boolean(saved.svgText || saved.renderUrl);
  if (!hadPriorRender) return;

  lastRenderedSource = saved.renderedSource || null;
  renderedBaseName = saved.renderedBaseName || null;
  lastRenderUrl = saved.renderUrl || null;
  hasRenderedOnce = true;

  if (saved.svgText) {
    lastSvgText = saved.svgText;
    showSvgFromText(saved.svgText);
    downloadSvgBtn.disabled = false;
  } else {
    lastSvgText = null;
    showPreviewImage(saved.renderUrl);
    downloadSvgBtn.disabled = true;
  }
  downloadPngBtn.disabled = false;
  openSvgBtn.disabled = !lastRenderUrl;

  if (sourceEl.value === lastRenderedSource) {
    setStatus('Diagrama restaurado — seguía disponible de tu última visita.', 'success');
  } else {
    setStale();
  }
}

restoreState();
