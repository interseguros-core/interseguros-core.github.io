import '/components/app-sidebar.js';
import '/components/app-navbar.js';

/* ── Accordion toggle ── */
/* Migrated verbatim from the original root index.html inline <script>. */
document.querySelectorAll('.acc-group-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const body = document.getElementById(targetId);
        const isOpen = btn.classList.contains('open');
        btn.classList.toggle('open', !isOpen);
        body.classList.toggle('open', !isOpen);
    });
});
document.querySelectorAll('.acc-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const body = document.getElementById(targetId);
        const isOpen = btn.classList.contains('open');
        btn.classList.toggle('open', !isOpen);
        body.classList.toggle('open', !isOpen);
    });
});

/* ── Search ── */
(function() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    const status = document.getElementById('searchStatus');
    const groups = document.querySelectorAll('.acc-group');
    const dividers = document.querySelectorAll('.flow-divider');
    const overview = document.getElementById('overview');
    let debounceTimer;

    function normalize(str) {
        return str.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase();
    }

    function highlightText(el, query) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(node => {
            const text = node.textContent;
            const normText = normalize(text);
            const normQuery = normalize(query);
            const idx = normText.indexOf(normQuery);
            if (idx === -1) return;
            const mark = document.createElement('mark');
            mark.className = 'search-highlight';
            const before = text.substring(0, idx);
            const match = text.substring(idx, idx + query.length);
            const after = text.substring(idx + query.length);
            const frag = document.createDocumentFragment();
            if (before) frag.appendChild(document.createTextNode(before));
            mark.textContent = match;
            frag.appendChild(mark);
            if (after) frag.appendChild(document.createTextNode(after));
            node.parentNode.replaceChild(frag, node);
        });
    }

    function clearHighlights() {
        document.querySelectorAll('mark.search-highlight').forEach(m => {
            const parent = m.parentNode;
            parent.replaceChild(document.createTextNode(m.textContent), m);
            parent.normalize();
        });
    }

    function doSearch(query) {
        clearHighlights();
        const q = query.trim();
        clearBtn.style.display = q ? 'flex' : 'none';

        if (!q) {
            status.textContent = '';
            status.classList.remove('visible');
            groups.forEach(g => { g.style.display = ''; g.classList.remove('search-hit'); });
            dividers.forEach(d => d.style.display = '');
            if (overview) overview.style.display = '';
            document.querySelectorAll('.acc-item').forEach(item => {
                item.style.display = '';
                item.classList.remove('search-hit');
            });
            return;
        }

        const normQ = normalize(q);
        let totalHits = 0;

        groups.forEach((group, gi) => {
            let groupHit = false;
            group.querySelectorAll('.acc-item').forEach(item => {
                const text = normalize(item.textContent);
                if (text.includes(normQ)) {
                    item.style.display = '';
                    item.classList.add('search-hit');
                    groupHit = true;
                    totalHits++;
                    /* Open the item and its group */
                    const groupBtn = group.querySelector('.acc-group-btn');
                    const groupBody = group.querySelector('.acc-group-body');
                    if (groupBtn && !groupBtn.classList.contains('open')) {
                        groupBtn.classList.add('open');
                        groupBody.classList.add('open');
                    }
                    const itemBtn = item.querySelector('.acc-item-btn');
                    const itemBodyId = itemBtn?.getAttribute('data-target');
                    const itemBody = itemBodyId ? document.getElementById(itemBodyId) : null;
                    if (itemBtn && !itemBtn.classList.contains('open')) {
                        itemBtn.classList.add('open');
                        if (itemBody) itemBody.classList.add('open');
                    }
                    highlightText(item, q);
                } else {
                    item.style.display = 'none';
                    item.classList.remove('search-hit');
                }
            });
            group.style.display = groupHit ? '' : 'none';
            group.classList.toggle('search-hit', groupHit);
            /* Hide divider above hidden group */
            if (dividers[gi]) dividers[gi].style.display = groupHit ? '' : 'none';
        });

        if (overview) overview.style.display = totalHits > 0 ? 'none' : '';

        if (totalHits > 0) {
            status.innerHTML = `<span class="search-count">${totalHits}</span> resultado${totalHits === 1 ? '' : 's'} para "<strong>${q}</strong>"`;
            status.classList.add('visible');
        } else {
            status.innerHTML = `Sin resultados para "<strong>${q}</strong>". Intenta con otra palabra.`;
            status.classList.add('visible');
        }
    }

    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => doSearch(input.value), 200);
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        doSearch('');
        input.focus();
    });

    /* Ctrl+K shortcut */
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            input.focus();
            input.select();
        }
        if (e.key === 'Escape' && document.activeElement === input) {
            input.value = '';
            doSearch('');
            input.blur();
        }
    });
})();

/* ── Deep-link support ──
   New addition (not part of the original script): when arriving at this page
   with a hash that matches an accordion group/item id — e.g. from a sidebar
   link such as #step-certificados — open the corresponding accordion group
   (and item, if the hash targets one) before scrolling to it. Without this,
   the browser would land on a collapsed, zero-height section. */
function openAnchorTarget() {
    const hash = window.location.hash;
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;

    const group = target.closest('.acc-group');
    if (group) {
        const groupBtn = group.querySelector('.acc-group-btn');
        const groupBody = group.querySelector('.acc-group-body');
        if (groupBtn && groupBody) {
            groupBtn.classList.add('open');
            groupBody.classList.add('open');
        }
    }

    if (target.classList.contains('acc-item')) {
        const itemBtn = target.querySelector('.acc-item-btn');
        const itemBodyId = itemBtn && itemBtn.getAttribute('data-target');
        const itemBody = itemBodyId && document.getElementById(itemBodyId);
        if (itemBtn && itemBody) {
            itemBtn.classList.add('open');
            itemBody.classList.add('open');
        }
    }

    requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

window.addEventListener('DOMContentLoaded', openAnchorTarget);
window.addEventListener('hashchange', openAnchorTarget);
