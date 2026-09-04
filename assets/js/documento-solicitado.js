/* ── Renderizado de contenido Markdown para el módulo Documento Solicitado ── */

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function renderInline(text) {
    return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>');
}

function markdownToHtml(markdown) {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let listOpen = false;

    const closeList = () => {
        if (listOpen) {
            html.push('</ul>');
            listOpen = false;
        }
    };

    for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line) {
            closeList();
            continue;
        }

        const heading = line.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
            closeList();
            const level = heading[1].length;
            html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
            continue;
        }

        const listItem = line.match(/^[-*]\s+(.*)$/);
        if (listItem) {
            if (!listOpen) {
                html.push('<ul>');
                listOpen = true;
            }
            html.push(`<li>${renderInline(listItem[1])}</li>`);
            continue;
        }

        closeList();
        html.push(`<p>${renderInline(line)}</p>`);
    }

    closeList();
    return html.join('\n');
}

function initCollapsibleCards() {
    document.querySelectorAll('[data-collapse-target]').forEach(head => {
        const body = document.getElementById(head.getAttribute('data-collapse-target'));
        if (!body) return;
        head.addEventListener('click', () => {
            const isOpen = head.getAttribute('aria-expanded') === 'true';
            head.setAttribute('aria-expanded', String(!isOpen));
            body.hidden = isOpen;
        });
    });
}

async function loadMarkdownSections() {
    const containers = document.querySelectorAll('[data-md-src]');
    for (const container of containers) {
        const src = container.getAttribute('data-md-src');
        try {
            const response = await fetch(src);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const markdown = await response.text();
            container.innerHTML = markdownToHtml(markdown);
        } catch (err) {
            container.innerHTML = '<p>No se pudo cargar el contenido.</p>';
            console.error(`Error cargando ${src}:`, err);
        }
    }
}

/* ── Explorador de "Documentación recibida" (carpetas + PDFs) ── */

const DOC_ICONS = {
    folderClosed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>',
    folderOpen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2H9l-2 8H3V7Z"/><path d="M5 19h14l2-8H7l-2 8Z"/></svg>',
    pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6"/><path d="M9 17v-4h1.5a1.5 1.5 0 0 1 0 3H9"/><path d="M13 17v-4h1.3c.9 0 1.7.9 1.7 2s-.8 2-1.7 2H13Z"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    externalLink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
    kebab: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>',
};

let docTreeIdSeq = 0;
const nextDocTreeId = () => `doc-node-${++docTreeIdSeq}`;

function countPdfs(node) {
    if (node.type === 'pdf') return 1;
    return (node.children || []).reduce((total, child) => total + countPdfs(child), 0);
}

function filenameFromPath(filePath) {
    try {
        return decodeURIComponent(filePath.split('/').pop());
    } catch {
        return filePath.split('/').pop();
    }
}

function createIconSpan(svgMarkup, extraClass) {
    const span = document.createElement('span');
    span.className = `doc-row-icon${extraClass ? ` ${extraClass}` : ''}`;
    span.innerHTML = svgMarkup;
    return span;
}

function buildFileRow(node, breadcrumb) {
    const li = document.createElement('li');
    li.className = 'doc-tree-item';

    const row = document.createElement('div');
    row.className = 'doc-row doc-row-file';

    row.appendChild(createIconSpan(DOC_ICONS.pdf, 'doc-icon-pdf'));

    const name = document.createElement('span');
    name.className = 'doc-row-name';
    name.textContent = node.name;
    name.title = node.name;
    row.appendChild(name);

    const size = document.createElement('span');
    size.className = 'doc-row-size';
    size.textContent = node.size || '';
    row.appendChild(size);

    const handleAction = (action) => {
        if (action === 'view') openPdfModal(node, breadcrumb);
        else if (action === 'open') window.open(node.path, '_blank', 'noopener');
        else if (action === 'download') downloadDocument(node);
    };

    const makeActionButton = (action, label, icon) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'doc-icon-btn';
        btn.setAttribute('aria-label', `${label}: ${node.name}`);
        btn.title = label;
        btn.innerHTML = icon;
        btn.addEventListener('click', () => handleAction(action));
        return btn;
    };

    const actions = document.createElement('span');
    actions.className = 'doc-row-actions';
    actions.appendChild(makeActionButton('view', 'Ver documento', DOC_ICONS.eye));
    actions.appendChild(makeActionButton('open', 'Abrir en pestaña nueva', DOC_ICONS.externalLink));
    actions.appendChild(makeActionButton('download', 'Descargar', DOC_ICONS.download));
    row.appendChild(actions);

    const menu = document.createElement('details');
    menu.className = 'doc-row-menu';
    const summary = document.createElement('summary');
    summary.className = 'doc-icon-btn';
    summary.setAttribute('aria-label', `Más acciones: ${node.name}`);
    summary.innerHTML = DOC_ICONS.kebab;
    menu.appendChild(summary);

    const menuList = document.createElement('div');
    menuList.className = 'doc-row-menu-list';
    [
        ['view', 'Ver documento'],
        ['open', 'Abrir en pestaña nueva'],
        ['download', 'Descargar'],
    ].forEach(([action, label]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.addEventListener('click', () => {
            menu.open = false;
            handleAction(action);
        });
        menuList.appendChild(btn);
    });
    menu.appendChild(menuList);
    row.appendChild(menu);

    li.appendChild(row);
    return li;
}

function buildFolderRow(node, breadcrumb) {
    const li = document.createElement('li');
    li.className = 'doc-tree-item';

    const childListId = nextDocTreeId();
    const docCount = countPdfs(node);

    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'doc-row doc-row-folder';
    row.setAttribute('aria-expanded', 'false');
    row.setAttribute('aria-controls', childListId);

    const chevron = createIconSpan(DOC_ICONS.chevron, 'doc-row-chevron');
    row.appendChild(chevron);

    const folderIcon = createIconSpan(DOC_ICONS.folderClosed, 'doc-icon-folder');
    row.appendChild(folderIcon);

    const name = document.createElement('span');
    name.className = 'doc-row-name';
    name.textContent = node.name;
    name.title = node.name;
    row.appendChild(name);

    const count = document.createElement('span');
    count.className = 'doc-row-count';
    count.textContent = `${docCount} documento${docCount === 1 ? '' : 's'}`;
    row.appendChild(count);

    const childList = buildTreeList(node.children || [], [...breadcrumb, node.name]);
    childList.id = childListId;
    childList.hidden = true;

    row.addEventListener('click', () => {
        const isOpen = row.getAttribute('aria-expanded') === 'true';
        row.setAttribute('aria-expanded', String(!isOpen));
        childList.hidden = isOpen;
        folderIcon.innerHTML = isOpen ? DOC_ICONS.folderClosed : DOC_ICONS.folderOpen;
    });

    li.appendChild(row);
    li.appendChild(childList);
    return li;
}

function buildTreeList(children, breadcrumb) {
    const ul = document.createElement('ul');
    ul.className = 'doc-tree-list';
    children.forEach((child) => {
        if (child.type === 'folder') {
            ul.appendChild(buildFolderRow(child, breadcrumb));
        } else if (child.type === 'pdf') {
            ul.appendChild(buildFileRow(child, breadcrumb));
        }
    });
    return ul;
}

function renderDocTree(container, rootNode) {
    container.innerHTML = '';
    const children = rootNode.children || [];
    if (children.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'doc-tree-status';
        empty.textContent = 'No hay documentos disponibles.';
        container.appendChild(empty);
        return;
    }
    container.appendChild(buildTreeList(children, []));
}

async function loadDocTree() {
    const container = document.getElementById('doc-tree');
    if (!container) return;
    const src = container.getAttribute('data-doc-src');
    try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        renderDocTree(container, data);
    } catch (err) {
        container.innerHTML = '<p class="doc-tree-status doc-tree-error">No se pudo cargar la documentación.</p>';
        console.error(`Error cargando ${src}:`, err);
    }
}

function downloadDocument(node) {
    const link = document.createElement('a');
    link.href = node.path;
    link.download = filenameFromPath(node.path);
    document.body.appendChild(link);
    link.click();
    link.remove();
}

/* ── Modal de visualización de PDF (renderizado con PDF.js, sin visor nativo) ── */

const PDFJS_VERSION = '4.7.76';
const PDFJS_BASE_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

let pdfjsLibPromise = null;
function loadPdfjsLib() {
    if (!pdfjsLibPromise) {
        pdfjsLibPromise = import(/* webpackIgnore: true */ `${PDFJS_BASE_URL}/pdf.min.mjs`).then((lib) => {
            lib.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE_URL}/pdf.worker.min.mjs`;
            return lib;
        });
    }
    return pdfjsLibPromise;
}

/* Estado del render en curso: permite cancelar la carga/páginas pendientes
   si el usuario cierra el modal o abre otro documento antes de que termine. */
let activePdfRender = null;

function cancelActivePdfRender() {
    if (!activePdfRender) return;
    activePdfRender.cancelled = true;
    if (activePdfRender.abortController) {
        try { activePdfRender.abortController.abort(); } catch { /* noop */ }
    }
    if (activePdfRender.currentPageTask) {
        try { activePdfRender.currentPageTask.cancel(); } catch { /* noop */ }
    }
    if (activePdfRender.pdfDoc) {
        try { activePdfRender.pdfDoc.destroy(); } catch { /* noop */ }
    }
    activePdfRender = null;
}

async function renderPdfIntoModal(path) {
    cancelActivePdfRender();
    const renderState = { pdfDoc: null, cancelled: false, currentPageTask: null, abortController: new AbortController() };
    activePdfRender = renderState;

    const loadingEl = document.getElementById('pdf-loading');
    const errorEl = document.getElementById('pdf-error');
    const pagesEl = document.getElementById('pdf-pages');

    pagesEl.replaceChildren();
    errorEl.hidden = true;
    errorEl.textContent = '';
    loadingEl.hidden = false;
    loadingEl.textContent = 'Cargando documento…';

    try {
        const response = await fetch(path, { signal: renderState.abortController.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        if (renderState.cancelled) return;

        const pdfjsLib = await loadPdfjsLib();
        if (renderState.cancelled) return;

        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (renderState.cancelled) {
            pdfDoc.destroy();
            return;
        }
        renderState.pdfDoc = pdfDoc;
        loadingEl.hidden = true;

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            if (renderState.cancelled) break;
            const page = await pdfDoc.getPage(pageNum);
            if (renderState.cancelled) break;

            const containerWidth = pagesEl.clientWidth || 600;
            const outputScale = window.devicePixelRatio || 1;
            const baseViewport = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({ scale: containerWidth / baseViewport.width });

            const canvas = document.createElement('canvas');
            canvas.className = 'pdf-page-canvas';
            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);
            canvas.style.width = `${Math.floor(viewport.width)}px`;
            canvas.style.height = `${Math.floor(viewport.height)}px`;
            pagesEl.appendChild(canvas);

            const renderTask = page.render({
                canvasContext: canvas.getContext('2d'),
                viewport,
                transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
            });
            renderState.currentPageTask = renderTask;
            await renderTask.promise;
            renderState.currentPageTask = null;
        }
    } catch (err) {
        if (renderState.cancelled || err?.name === 'AbortError') return;
        loadingEl.hidden = true;
        errorEl.hidden = false;
        errorEl.textContent = 'No se pudo cargar la vista previa del documento. Usa los botones inferiores para abrirlo o descargarlo.';
        console.error(`Error renderizando PDF ${path}:`, err);
    }
}

function buildPdfBreadcrumb(breadcrumb, node) {
    const nav = document.getElementById('pdf-breadcrumb');
    nav.replaceChildren();
    const ol = document.createElement('ol');
    [...breadcrumb, filenameFromPath(node.path)].forEach((segment) => {
        const li = document.createElement('li');
        li.textContent = segment;
        ol.appendChild(li);
    });
    nav.appendChild(ol);
}

function openPdfModal(node, breadcrumb) {
    const modal = document.getElementById('pdf-modal');
    if (!modal) return;

    document.getElementById('pdf-modal-title').textContent = node.name;
    buildPdfBreadcrumb(breadcrumb, node);

    const openTab = document.getElementById('pdf-open-tab');
    const download = document.getElementById('pdf-download');
    openTab.href = node.path;
    download.href = node.path;
    download.download = filenameFromPath(node.path);

    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    renderPdfIntoModal(node.path);
}

function closePdfModal() {
    const modal = document.getElementById('pdf-modal');
    if (!modal || modal.hidden) return;

    cancelActivePdfRender();
    modal.hidden = true;
    document.getElementById('pdf-pages').replaceChildren();
    document.getElementById('pdf-loading').hidden = false;
    document.getElementById('pdf-error').hidden = true;
    document.body.style.overflow = '';
}

function initPdfModal() {
    const modal = document.getElementById('pdf-modal');
    if (!modal) return;

    document.getElementById('pdf-modal-close-icon').addEventListener('click', closePdfModal);
    document.getElementById('pdf-modal-close-button').addEventListener('click', closePdfModal);
    document.getElementById('pdf-modal-backdrop').addEventListener('click', closePdfModal);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.hidden) closePdfModal();
    });
}

initCollapsibleCards();
loadMarkdownSections();
loadDocTree();
initPdfModal();
