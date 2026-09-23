'use strict';

/* =========================================================
   Catálogos fijos
   ========================================================= */
// Catálogo de monedas: se carga desde la hoja "monedas". tc = cuántos Bs vale 1 unidad (Bs = 1).
const MONEDAS_DEFAULT = {
    BOB: { id: '', nombre: 'Bolivianos', simbolo: 'Bs', tc: 1, base: true, activo: true },
    USD: { id: '', nombre: 'Dólares', simbolo: '$us', tc: 6.96, base: false, activo: true },
};
let MONEDAS = { ...MONEDAS_DEFAULT };
const MONEDA_BASE = 'BOB';

const MEDIOS_PAGO = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia bancaria',
    qr: 'Pago QR',
    tarjeta: 'Tarjeta de crédito/débito',
    cheque: 'Cheque',
    debito: 'Débito automático',
};

const MODALIDADES = {
    contado: 'Contado',
    credito: 'Crédito (en cuotas)',
};

const TIPOS_DOC = { CI: 'Cédula de identidad', NIT: 'NIT', PAS: 'Pasaporte', CE: 'Carnet de extranjero' };
const EXPEDIDO = ['LP', 'SC', 'CB', 'OR', 'PT', 'CH', 'TJ', 'BE', 'PD'];
const PARENTESCOS = ['Cónyuge', 'Hijo(a)', 'Padre', 'Madre', 'Hermano(a)', 'Nieto(a)', 'Otro'];
const TIPOS_POLIZA = { individual: 'Individual', colectiva: 'Colectiva (póliza madre con certificados)' };
const REGLAS_BENEF = { no: 'No aplica', opcional: 'Opcionales', requerido: 'Obligatorios' };

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1YPWC66ecbzcHsILRlAHJNe-0rfyGxhUlTV2HP5OyK18/edit';
const CONN_KEY = 'emision-polizas-conexion';
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbw3_GFuoKPNpOOw2nEdU7zoqG4mJ6h48OgF0Nw5GEWBMrccztKJp-W6HXeMBYd02YGE/exec';

/* =========================================================
   Estado (espejo en memoria de la hoja)
   ========================================================= */
let state = { config: {}, ramos: [], productos: [], clientes: [], polizas: [], certificados: [], beneficiarios: [], carteras: [] };
let conectado = false;

/* =========================================================
   API Google Sheets (Apps Script)
   ========================================================= */
function getConexion() {
    try {
        return JSON.parse(localStorage.getItem(CONN_KEY)) || { url: DEFAULT_API_URL };
    } catch (e) {
        return { url: DEFAULT_API_URL };
    }
}

function setConexion(c) {
    try { localStorage.setItem(CONN_KEY, JSON.stringify(c)); } catch (e) { /* sin almacenamiento */ }
}

const api = {
    async get() {
        const { url, key } = getConexion();
        if (!url) throw new Error('Configura la URL de la hoja en Configuración.');
        const res = await fetch(`${url}?key=${encodeURIComponent(key || '')}`);
        return api._unwrap(res);
    },
    async post(action, payload = {}) {
        const { url, key } = getConexion();
        if (!url) throw new Error('Configura la URL de la hoja en Configuración.');
        // text/plain evita el "preflight" CORS que Apps Script no soporta
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action, key: key || '', ...payload }),
        });
        return api._unwrap(res);
    },
    async _unwrap(res) {
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        let json;
        try {
            json = await res.json();
        } catch (e) {
            throw new Error('Respuesta inválida. ¿La aplicación web está publicada con acceso "Cualquier usuario"?');
        }
        if (!json.ok) throw new Error(json.error || 'Error desconocido');
        return json.data;
    },
};

/** Muestra el indicador de carga mientras se ejecuta fn. */
async function conCarga(texto, fn) {
    $('#loading-text').textContent = texto;
    $('#loading').hidden = false;
    try {
        return await fn();
    } finally {
        $('#loading').hidden = true;
    }
}

/* =========================================================
   Conversión filas de la hoja <-> objetos de la app
   ========================================================= */
const bool = v => v === true || /^(true|verdadero|si|sí|1)$/i.test(String(v ?? '').trim());
const num = v => (typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.')) || 0);
const list = v => String(v ?? '').split(/[,;\s]+/).filter(Boolean);
const str = v => String(v ?? '');

function json(v, fallback) {
    if (v && typeof v === 'object') return v;
    try { return JSON.parse(v) ?? fallback; } catch (e) { return fallback; }
}

const ramoFromRow = r => ({
    id: str(r.id), codigo: str(r.codigo), nombre: str(r.nombre), descripcion: str(r.descripcion), activo: bool(r.activo),
});

const ramoToRow = r => ({
    id: r.id || '', codigo: r.codigo, nombre: r.nombre, descripcion: r.descripcion, activo: r.activo,
});

const clienteFromRow = r => ({
    id: str(r.id),
    tipoDoc: TIPOS_DOC[str(r.tipo_doc)] ? str(r.tipo_doc) : 'CI',
    doc: str(r.doc),
    expedido: str(r.expedido),
    nombres: str(r.nombres),
    apellidos: str(r.apellidos),
    fechaNacimiento: str(r.fecha_nacimiento),
    telefono: str(r.telefono),
    email: str(r.email),
    direccion: str(r.direccion),
    activo: r.activo === '' || r.activo === undefined ? true : bool(r.activo),
});

const clienteToRow = c => ({
    id: c.id || '',
    tipo_doc: c.tipoDoc,
    doc: c.doc,
    expedido: c.expedido,
    nombres: c.nombres,
    apellidos: c.apellidos,
    fecha_nacimiento: c.fechaNacimiento,
    telefono: c.telefono,
    email: c.email,
    direccion: c.direccion,
    activo: c.activo,
});

const nombreCompleto = c => `${c.nombres} ${c.apellidos}`.trim();
const documento = c => [c.tipoDoc, c.doc, c.expedido].filter(Boolean).join(' ');

const productoFromRow = r => ({
    id: str(r.id),
    ramoId: str(r.ramo_id),
    codigo: str(r.codigo),
    nombre: str(r.nombre),
    descripcion: str(r.descripcion),
    activo: bool(r.activo),
    monedas: list(r.monedas).filter(m => MONEDAS[m]),
    monedaRef: MONEDAS[str(r.moneda_ref)] ? str(r.moneda_ref) : MONEDA_BASE,
    prima: { tipo: str(r.prima_tipo) === 'fija' ? 'fija' : 'tasa', tasa: num(r.tasa), montoFijo: num(r.prima_fija), minima: num(r.prima_minima) },
    sumaMin: num(r.suma_min),
    sumaMax: num(r.suma_max),
    vigenciaMeses: parseInt(r.vigencia_meses, 10) || 12,
    coberturas: json(r.coberturas, []),
    beneficiarios: REGLAS_BENEF[str(r.beneficiarios)] ? str(r.beneficiarios) : 'no',
    tipoPoliza: str(r.tipo_poliza) === 'colectiva' ? 'colectiva' : 'individual',
    pago: {
        medios: list(r.medios_pago).filter(m => MEDIOS_PAGO[m]),
        contado: { habilitado: bool(r.contado), descuento: num(r.descuento_contado) },
        credito: {
            habilitado: bool(r.credito),
            cuotas: list(r.cuotas_permitidas).map(Number).filter(n => n >= 2),
            recargo: num(r.recargo_credito),
            inicial: num(r.cuota_inicial),
        },
    },
});

const productoToRow = p => ({
    id: p.id || '',
    ramo_id: p.ramoId,
    codigo: p.codigo,
    nombre: p.nombre,
    descripcion: p.descripcion,
    activo: p.activo,
    monedas: p.monedas.join(','),
    moneda_ref: p.monedaRef,
    prima_tipo: p.prima.tipo,
    tasa: p.prima.tasa,
    prima_fija: p.prima.montoFijo,
    prima_minima: p.prima.minima,
    suma_min: p.sumaMin,
    suma_max: p.sumaMax,
    vigencia_meses: p.vigenciaMeses,
    medios_pago: p.pago.medios.join(','),
    contado: p.pago.contado.habilitado,
    descuento_contado: p.pago.contado.descuento,
    credito: p.pago.credito.habilitado,
    cuotas_permitidas: p.pago.credito.cuotas.join(','),
    recargo_credito: p.pago.credito.recargo,
    cuota_inicial: p.pago.credito.inicial,
    coberturas: JSON.stringify(p.coberturas),
    beneficiarios: p.beneficiarios,
    tipo_poliza: p.tipoPoliza,
});

const polizaFromRow = r => ({
    id: str(r.id),
    numero: str(r.numero),
    tipo: str(r.tipo) === 'madre' ? 'madre' : 'individual',
    productoId: str(r.producto_id),
    ramo: { codigo: str(r.ramo_codigo), nombre: str(r.ramo_nombre) },
    producto: { codigo: str(r.producto_codigo), nombre: str(r.producto_nombre) },
    tomadorId: str(r.tomador_id),
    tomador: { nombre: str(r.tomador_nombre), doc: str(r.tomador_doc), email: str(r.email), tel: str(r.telefono), direccion: str(r.direccion) },
    moneda: str(r.moneda),
    suma: num(r.suma_asegurada),
    desde: str(r.vigencia_desde),
    hasta: str(r.vigencia_hasta),
    modalidad: str(r.modalidad),
    medio: str(r.medio_pago),
    cuotas: parseInt(r.cuotas, 10) || 1,
    prima: num(r.prima_neta),
    ajuste: num(r.ajuste),
    ajusteLabel: str(r.ajuste_concepto),
    primaTotal: num(r.prima_total),
    tipoCambio: num(r.tipo_cambio),
    estado: str(r.estado) || 'vigente',
    fechaEmision: str(r.fecha_emision),
    fechaAnulacion: str(r.fecha_anulacion),
    coberturas: json(r.coberturas, []),
    cronograma: json(r.cronograma, []),
    ...carteraSnapshot(r),
});

const certificadoFromRow = r => ({
    id: str(r.id),
    polizaId: str(r.poliza_id),
    numero: str(r.numero_certificado),
    clienteId: str(r.asegurado_id),
    nombre: str(r.asegurado_nombre),
    doc: str(r.asegurado_doc),
    suma: num(r.suma_asegurada),
    prima: num(r.prima_neta),
    ajuste: num(r.ajuste),
    prima: num(r.prima),
    cronograma: json(r.cronograma, []),
    desde: str(r.vigencia_desde),
    hasta: str(r.vigencia_hasta),
    estado: str(r.estado) || 'vigente',
    fechaEmision: str(r.fecha_emision),
    ...carteraSnapshot(r),
});

const carteraFromRow = r => ({
    id: str(r.id),
    productoId: str(r.producto_id),
    polizaId: str(r.poliza_id),
    nombre: str(r.nombre),
    tasa: num(r.tasa),
    primaFija: num(r.prima_fija),
    activo: r.activo === '' || r.activo === undefined ? true : bool(r.activo),
});

const carteraToRow = c => ({
    id: c.id || '',
    producto_id: c.productoId,
    poliza_id: c.polizaId || '',
    nombre: c.nombre,
    tasa: c.tasa,
    prima_fija: c.primaFija,
    activo: c.activo,
});

/** Datos de cartera copiados a una póliza o certificado al emitir. */
const carteraSnapshot = r => ({ carteraId: str(r.cartera_id), carteraNombre: str(r.cartera_nombre), carteraTasa: num(r.cartera_tasa) });

const beneficiarioFromRow = r => ({
    id: str(r.id),
    polizaId: str(r.poliza_id),
    certificadoId: str(r.certificado_id),
    clienteId: str(r.cliente_id),
    nombre: str(r.nombre),
    doc: str(r.doc),
    parentesco: str(r.parentesco),
    porcentaje: num(r.porcentaje),
});

function aplicarDatos(data) {
    // Las monedas van primero: los productos filtran sus monedas contra este catálogo
    const monedas = (data.monedas || []).map(m => [str(m.codigo).toUpperCase(), {
        id: str(m.id),
        nombre: str(m.nombre),
        simbolo: str(m.simbolo) || str(m.codigo),
        tc: bool(m.es_base) ? 1 : num(m.tipo_cambio) || 1,
        base: bool(m.es_base),
        activo: m.activo === '' || m.activo === undefined ? true : bool(m.activo),
    }]);
    MONEDAS = monedas.length ? Object.fromEntries(monedas) : { ...MONEDAS_DEFAULT };
    state.ramos = data.ramos.map(ramoFromRow);
    state.productos = data.productos.map(productoFromRow);
    state.polizas = data.polizas.map(polizaFromRow).sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));
    state.certificados = data.certificados.map(certificadoFromRow);
    state.clientes = (data.clientes || []).map(clienteFromRow).sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b)));
    state.beneficiarios = (data.beneficiarios || []).map(beneficiarioFromRow);
    state.carteras = (data.carteras || []).map(carteraFromRow);
    state.config = data.config || {};
}

async function recargar() {
    try {
        const data = await conCarga('Leyendo la hoja…', () => api.get());
        aplicarDatos(data);
        setEstadoConexion(true);
    } catch (err) {
        setEstadoConexion(false, err.message);
        throw err;
    } finally {
        renderAll();
    }
}

function setEstadoConexion(ok, msg = '') {
    conectado = ok;
    const b = $('#estado-conexion');
    b.className = `badge ${ok ? 'ok' : 'danger'}`;
    b.textContent = ok ? 'Conectado a Google Sheets' : 'Sin conexión';
    b.title = msg;
}

/* =========================================================
   Utilidades
   ========================================================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

function money(n, moneda) {
    const f = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
    return `${MONEDAS[moneda]?.simbolo ?? ''} ${f}`;
}

/** Convierte pasando por Bs: monto × TC(origen) / TC(destino). */
function convertir(monto, de, a) {
    if (de === a) return monto;
    const tcDe = MONEDAS[de]?.tc || 1;
    const tcA = MONEDAS[a]?.tc || 1;
    return monto * tcDe / tcA;
}

const monedasActivas = () => Object.entries(MONEDAS).filter(([, m]) => m.activo);

function fmtTc(n) {
    return new Intl.NumberFormat('es-BO', { maximumFractionDigits: 6 }).format(n);
}

function hoyISO() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function sumarMeses(iso, meses) {
    const [y, m, d] = iso.split('-').map(Number);
    const target = new Date(Date.UTC(y, m - 1 + meses, 1));
    const ultimoDia = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(d, ultimoDia));
    return target.toISOString().slice(0, 10);
}

const diasEntre = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/** Cuántas cuotas mensuales caben desde "desde" hasta antes de "hasta" (mínimo 1). */
function mesesRestantes(desde, hasta) {
    let n = 1;
    while (sumarMeses(desde, n) < hasta) n++;
    return n;
}

function fecha(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.slice(0, 10).split('-');
    return d ? `${d}/${m}/${y}` : iso;
}

function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

const ramoById = id => state.ramos.find(r => r.id === id);
const productoById = id => state.productos.find(p => p.id === id);
const clienteById = id => state.clientes.find(c => c.id === id);
const carteraById = id => state.carteras.find(c => c.id === id);
const carterasProducto = (productoId, soloActivas = true) => state.carteras.filter(c => c.productoId === productoId && !c.polizaId && (!soloActivas || c.activo));
const carterasPoliza = (polizaId, soloActivas = true) => state.carteras.filter(c => c.polizaId === polizaId && (!soloActivas || c.activo));

/** Tarifa de una cartera según el tipo de prima del producto: tasa % o prima fija. */
const valorCartera = (prod, c) => (prod?.prima.tipo === 'fija' ? c.primaFija : c.tasa);
function textoTarifa(prod, valor, moneda) {
    return prod?.prima.tipo === 'fija' ? `prima fija ${money(valor, moneda || prod.monedaRef)}` : `tasa ${fmtTc(valor)}%`;
}

function upsertLocal(arr, item) {
    const i = arr.findIndex(x => x.id === item.id);
    if (i >= 0) arr[i] = item; else arr.push(item);
}

/* =========================================================
   Pestañas
   ========================================================= */
$('#tabs').addEventListener('click', e => {
    const btn = e.target.closest('button[data-tab]');
    if (btn) showTab(btn.dataset.tab);
});

function showTab(name) {
    $$('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    $$('.tab').forEach(t => t.classList.toggle('active', t.id === `tab-${name}`));
    renderAll();
}

function renderAll() {
    renderRamos();
    renderProductos();
    renderClientes();
    renderEmisionProductos();
    renderPolizas();
    renderConfig();
}

function sinConexionHTML() {
    return '<div class="notice">No hay conexión con la hoja de Google. Ve a <strong>Configuración</strong> y pega la URL de la aplicación web.</div>';
}

/* =========================================================
   Modal genérico
   ========================================================= */
/**
 * Abre un diálogo. Se pueden apilar (p. ej. registrar un cliente mientras se agrega un certificado).
 * onSubmit(body) devuelve un mensaje de error de validación, o nada si salió bien y el diálogo se cierra.
 */
function openModal({ title, body, onSubmit, submitLabel = 'Guardar', readonly = false, onOpen, wide = false }) {
    const dlg = document.createElement('dialog');
    if (wide) dlg.classList.add('wide');
    dlg.innerHTML = `<form method="dialog" autocomplete="off">
        <header class="modal-head"><h3></h3><button type="button" class="icon-btn" data-close aria-label="Cerrar">✕</button></header>
        <div class="modal-body">${body}</div>
        <p class="error modal-error"></p>
        <footer class="modal-foot">${readonly
            ? '<button type="button" class="btn" data-close>Cerrar</button>'
            : `<button type="button" class="btn" data-close>Cancelar</button><button type="submit" class="btn primary">${esc(submitLabel)}</button>`}</footer>
    </form>`;
    $('h3', dlg).textContent = title;
    document.body.appendChild(dlg);
    const bodyEl = $('.modal-body', dlg);

    const cerrar = () => { dlg.close(); dlg.remove(); };
    dlg.addEventListener('cancel', e => { e.preventDefault(); cerrar(); }); // tecla Escape
    dlg.addEventListener('click', e => { if (e.target.closest('[data-close]')) cerrar(); });
    $('form', dlg).addEventListener('submit', async e => {
        e.preventDefault();
        if (!onSubmit) return cerrar();
        const btn = $('.modal-foot [type=submit]', dlg);
        btn.disabled = true;
        try {
            const error = await onSubmit(bodyEl);
            if (error) $('.modal-error', dlg).textContent = error;
            else cerrar();
        } catch (err) {
            $('.modal-error', dlg).textContent = err.message;
        } finally {
            btn.disabled = false;
        }
    });
    dlg.showModal();
    onOpen?.(bodyEl, dlg);
    return dlg;
}

/* =========================================================
   RAMOS
   ========================================================= */
function renderRamos() {
    const cont = $('#lista-ramos');
    if (!conectado) { cont.innerHTML = sinConexionHTML(); return; }
    if (!state.ramos.length) {
        cont.innerHTML = '<div class="empty">Aún no hay ramos. Crea el primero para empezar.</div>';
        return;
    }
    cont.innerHTML = `
        <div class="table-wrap"><table>
            <thead><tr><th>Código</th><th>Nombre</th><th>Descripción</th><th class="num">Productos</th><th>Estado</th><th></th></tr></thead>
            <tbody>
            ${state.ramos.map(r => {
                const n = state.productos.filter(p => p.ramoId === r.id).length;
                return `<tr>
                    <td><strong>${esc(r.codigo)}</strong></td>
                    <td>${esc(r.nombre)}</td>
                    <td class="muted">${esc(r.descripcion)}</td>
                    <td class="num">${n}</td>
                    <td>${r.activo ? '<span class="badge ok">Activo</span>' : '<span class="badge off">Inactivo</span>'}</td>
                    <td class="actions">
                        <button class="btn small" data-ramo-edit="${esc(r.id)}">Editar</button>
                        <button class="btn small danger" data-ramo-del="${esc(r.id)}">Eliminar</button>
                    </td>
                </tr>`;
            }).join('')}
            </tbody>
        </table></div>`;
}

function formRamo(ramo) {
    const r = ramo || { codigo: '', nombre: '', descripcion: '', activo: true };
    openModal({
        title: ramo ? 'Editar ramo' : 'Nuevo ramo',
        body: `
            <div class="grid2">
                <label>Código<input name="codigo" value="${esc(r.codigo)}" maxlength="10" required placeholder="AUT"></label>
                <label>Nombre<input name="nombre" value="${esc(r.nombre)}" required placeholder="Automotores"></label>
            </div>
            <label>Descripción<textarea name="descripcion" rows="2">${esc(r.descripcion)}</textarea></label>
            <label class="check"><input type="checkbox" name="activo" ${r.activo ? 'checked' : ''}> Activo</label>`,
        onSubmit: async body => {
            const codigo = $('[name=codigo]', body).value.trim().toUpperCase();
            const nombre = $('[name=nombre]', body).value.trim();
            if (!codigo || !nombre) return 'Código y nombre son obligatorios.';
            if (state.ramos.some(x => x.codigo === codigo && x.id !== ramo?.id)) return `Ya existe un ramo con código ${codigo}.`;
            const data = { id: ramo?.id, codigo, nombre, descripcion: $('[name=descripcion]', body).value.trim(), activo: $('[name=activo]', body).checked };
            const saved = await api.post('upsert', { sheet: 'ramos', record: ramoToRow(data) });
            upsertLocal(state.ramos, ramoFromRow(saved));
            renderAll();
            toast('Ramo guardado en la hoja');
        },
    });
}

$('#btn-nuevo-ramo').addEventListener('click', () => {
    if (!conectado) return showTab('config');
    formRamo();
});

$('#lista-ramos').addEventListener('click', async e => {
    const edit = e.target.closest('[data-ramo-edit]');
    const del = e.target.closest('[data-ramo-del]');
    if (edit) formRamo(ramoById(edit.dataset.ramoEdit));
    if (del) {
        const r = ramoById(del.dataset.ramoDel);
        if (state.productos.some(p => p.ramoId === r.id)) {
            alert('No se puede eliminar un ramo que tiene productos. Desactívalo o elimina sus productos primero.');
            return;
        }
        if (!confirm(`¿Eliminar el ramo "${r.nombre}"?`)) return;
        try {
            await conCarga('Eliminando…', () => api.post('delete', { sheet: 'ramos', id: r.id }));
            state.ramos = state.ramos.filter(x => x.id !== r.id);
            renderAll();
        } catch (err) {
            alert(err.message);
        }
    }
});

/* =========================================================
   PRODUCTOS
   ========================================================= */
function renderProductos() {
    const filtro = $('#filtro-ramo-productos');
    const actual = filtro.value;
    filtro.innerHTML = '<option value="">Todos los ramos</option>' +
        state.ramos.map(r => `<option value="${esc(r.id)}">${esc(r.nombre)}</option>`).join('');
    filtro.value = state.ramos.some(r => r.id === actual) ? actual : '';

    const lista = state.productos.filter(p => !filtro.value || p.ramoId === filtro.value);
    const cont = $('#lista-productos');
    if (!conectado) { cont.innerHTML = sinConexionHTML(); return; }
    if (!state.ramos.length) {
        cont.innerHTML = '<div class="empty">Primero crea al menos un ramo.</div>';
        return;
    }
    if (!lista.length) {
        cont.innerHTML = '<div class="empty">No hay productos para este filtro.</div>';
        return;
    }
    cont.innerHTML = `
        <div class="table-wrap"><table>
            <thead><tr><th>Producto</th><th>Ramo</th><th>Monedas</th><th>Prima</th><th>Pago</th><th>Estado</th><th></th></tr></thead>
            <tbody>
            ${lista.map(p => {
                const ramo = ramoById(p.ramoId);
                const prima = p.prima.tipo === 'tasa'
                    ? `Tasa ${p.prima.tasa}%${p.prima.minima ? ` · mín. ${money(p.prima.minima, p.monedaRef)}` : ''}`
                    : `Fija ${money(p.prima.montoFijo, p.monedaRef)}`;
                const mods = [];
                if (p.pago.contado.habilitado) mods.push(`Contado${p.pago.contado.descuento ? ` (-${p.pago.contado.descuento}%)` : ''}`);
                if (p.pago.credito.habilitado) mods.push(`Crédito ${p.pago.credito.cuotas.join('/')} cuotas`);
                return `<tr>
                    <td><strong>${esc(p.nombre)}</strong>${p.tipoPoliza === 'colectiva' ? ' <span class="badge">Colectiva</span>' : ''}<div class="muted">${esc(p.codigo)} · ${p.vigenciaMeses} meses</div></td>
                    <td>${esc(ramo?.nombre ?? '—')}</td>
                    <td>${p.monedas.map(m => `<span class="badge${MONEDAS[m]?.activo === false ? ' off' : ''}">${esc(MONEDAS[m]?.simbolo ?? m)}</span>`).join('')}</td>
                    <td>${prima}${carterasProducto(p.id).length ? `<div class="muted">${carterasProducto(p.id).length} carteras</div>` : ''}</td>
                    <td>${mods.map(esc).join('<br>')}<div class="muted">${p.pago.medios.map(m => MEDIOS_PAGO[m]).join(', ')}</div></td>
                    <td>${p.activo ? '<span class="badge ok">Activo</span>' : '<span class="badge off">Inactivo</span>'}</td>
                    <td class="actions">
                        <button class="btn small" data-prod-edit="${esc(p.id)}">Editar</button>
                        <button class="btn small" data-prod-dup="${esc(p.id)}">Duplicar</button>
                        <button class="btn small danger" data-prod-del="${esc(p.id)}">Eliminar</button>
                    </td>
                </tr>`;
            }).join('')}
            </tbody>
        </table></div>`;
}

function productoVacio() {
    return {
        ramoId: $('#filtro-ramo-productos').value || state.ramos.find(r => r.activo)?.id || '',
        codigo: '', nombre: '', descripcion: '', activo: true,
        monedas: ['BOB'], monedaRef: 'BOB',
        prima: { tipo: 'tasa', tasa: 1, montoFijo: 0, minima: 0 },
        sumaMin: 0, sumaMax: 0, vigenciaMeses: 12,
        coberturas: [],
        beneficiarios: 'no',
        tipoPoliza: 'individual',
        pago: {
            medios: ['efectivo'],
            contado: { habilitado: true, descuento: 0 },
            credito: { habilitado: false, cuotas: [], recargo: 0, inicial: 0 },
        },
    };
}

function carteraRow(c = { id: '', nombre: '', tasa: '', primaFija: '', activo: true }) {
    return `<div class="cart-row" data-cart-id="${esc(c.id)}">
        <input data-cart="nombre" placeholder="Nombre de la cartera" value="${esc(c.nombre)}">
        <input data-cart="tasa" data-show="tasa" type="number" step="0.0001" min="0" placeholder="Tasa %" value="${c.tasa === '' ? '' : c.tasa}">
        <input data-cart="primaFija" data-show="fija" type="number" step="0.01" min="0" placeholder="Prima fija" value="${c.primaFija === '' ? '' : c.primaFija}">
        <label class="check" style="margin:0"><input type="checkbox" data-cart="activo" ${c.activo ? 'checked' : ''}> Activa</label>
        <button type="button" class="btn small danger" data-cart-del title="Quitar">✕</button>
    </div>`;
}

/**
 * Guarda las carteras editadas en un formulario: crea/actualiza las filas presentes y elimina las quitadas.
 * Si una cartera quitada ya se usó en pólizas, se desactiva en lugar de eliminarse.
 */
async function sincronizarCarteras(filas, anteriores, base) {
    const ids = new Set(filas.map(f => f.id).filter(Boolean));
    const avisos = [];
    for (const c of anteriores.filter(a => !ids.has(a.id))) {
        try {
            await api.post('delete', { sheet: 'carteras', id: c.id });
            state.carteras = state.carteras.filter(x => x.id !== c.id);
        } catch (err) {
            filas.push({ ...c, activo: false });
            avisos.push(`"${c.nombre}" ya se usó; quedó desactivada.`);
        }
    }
    if (filas.length) {
        const saved = await api.post('batch', { ops: filas.map(f => ({ sheet: 'carteras', record: carteraToRow({ ...f, ...base }) })) });
        saved.map(carteraFromRow).forEach(c => upsertLocal(state.carteras, c));
    }
    return avisos;
}

function leerCarteras(body) {
    return $$('.cart-row', body).map(row => ({
        id: row.dataset.cartId,
        nombre: $('[data-cart=nombre]', row).value.trim(),
        tasa: parseFloat($('[data-cart=tasa]', row).value) || 0,
        primaFija: parseFloat($('[data-cart=primaFija]', row).value) || 0,
        activo: $('[data-cart=activo]', row).checked,
    })).filter(c => c.nombre);
}

function validarCarteras(carteras, tipoPrima) {
    const nombres = carteras.map(c => c.nombre.toUpperCase());
    if (new Set(nombres).size !== nombres.length) return 'Hay carteras con el mismo nombre.';
    const malas = carteras.filter(c => (tipoPrima === 'fija' ? c.primaFija : c.tasa) <= 0);
    if (malas.length) return `La cartera "${malas[0].nombre}" necesita ${tipoPrima === 'fija' ? 'una prima fija' : 'una tasa'} mayor a 0.`;
    return '';
}

function coberturaRow(c = { nombre: '', detalle: '' }) {
    return `<div class="cob-row">
        <input data-cob="nombre" placeholder="Cobertura" value="${esc(c.nombre)}">
        <input data-cob="detalle" placeholder="Límite / detalle" value="${esc(c.detalle)}">
        <button type="button" class="btn small danger" data-cob-del>✕</button>
    </div>`;
}

function formProducto(producto, { duplicar = false } = {}) {
    const p = structuredClone(producto || productoVacio());
    if (duplicar) { p.codigo += '-COPIA'; p.nombre += ' (copia)'; }
    const editando = producto && !duplicar;
    const chk = cond => (cond ? 'checked' : '');

    openModal({
        title: editando ? 'Editar producto' : 'Nuevo producto',
        body: `
            <fieldset><legend>Datos generales</legend>
                <div class="grid2">
                    <label>Ramo
                        <select name="ramoId" required>
                            ${state.ramos.map(r => `<option value="${esc(r.id)}" ${r.id === p.ramoId ? 'selected' : ''}>${esc(r.nombre)}${r.activo ? '' : ' (inactivo)'}</option>`).join('')}
                        </select>
                    </label>
                    <label>Código<input name="codigo" value="${esc(p.codigo)}" required maxlength="15" placeholder="AUT-TR"></label>
                </div>
                <label>Nombre<input name="nombre" value="${esc(p.nombre)}" required></label>
                <label>Descripción<textarea name="descripcion" rows="2">${esc(p.descripcion)}</textarea></label>
                <label>Tipo de póliza
                    <select name="tipoPoliza">
                        ${Object.entries(TIPOS_POLIZA).map(([k, t]) => `<option value="${k}" ${k === p.tipoPoliza ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </label>
                <p class="hint" style="margin:-4px 0 10px">Colectiva: se emite una póliza madre al tomador y luego se agregan certificados, cada uno con su asegurado y su suma asegurada. Cada certificado tiene su propia vigencia; si su plazo difiere del producto, la prima se calcula a prorrata.</p>
                <label class="check"><input type="checkbox" name="activo" ${chk(p.activo)}> Activo (disponible para emitir)</label>
            </fieldset>

            <fieldset><legend>Monedas de emisión</legend>
                <div class="checks">
                    ${Object.entries(MONEDAS).filter(([k, m]) => m.activo || p.monedas.includes(k)).map(([k, m]) => `<label class="check"><input type="checkbox" name="monedas" value="${k}" ${chk(p.monedas.includes(k))}> ${esc(m.nombre)} (${esc(m.simbolo)})${m.activo ? '' : ' — inactiva'}</label>`).join('')}
                </div>
                <label>Moneda de referencia para los montos de este producto
                    <select name="monedaRef">
                        ${Object.entries(MONEDAS).filter(([k, m]) => m.activo || k === p.monedaRef).map(([k, m]) => `<option value="${k}" ${k === p.monedaRef ? 'selected' : ''}>${esc(m.nombre)}</option>`).join('')}
                    </select>
                </label>
                <p class="hint">Los montos (prima fija, mínima, límites de suma asegurada) se definen en esta moneda y se convierten con el tipo de cambio al emitir en la otra.</p>
            </fieldset>

            <fieldset><legend>Prima y suma asegurada</legend>
                <div class="checks">
                    <label class="check"><input type="radio" name="primaTipo" value="tasa" ${chk(p.prima.tipo === 'tasa')}> Tasa sobre suma asegurada</label>
                    <label class="check"><input type="radio" name="primaTipo" value="fija" ${chk(p.prima.tipo === 'fija')}> Prima fija</label>
                </div>
                <div class="grid3">
                    <label data-show="tasa">Tasa (%)<input name="tasa" type="number" step="0.0001" min="0" value="${p.prima.tasa}"></label>
                    <label data-show="tasa">Prima mínima<input name="minima" type="number" step="0.01" min="0" value="${p.prima.minima}"></label>
                    <label data-show="fija">Prima fija<input name="montoFijo" type="number" step="0.01" min="0" value="${p.prima.montoFijo}"></label>
                </div>
                <div class="grid3">
                    <label>Suma aseg. mínima<input name="sumaMin" type="number" step="0.01" min="0" value="${p.sumaMin}"></label>
                    <label>Suma aseg. máxima<input name="sumaMax" type="number" step="0.01" min="0" value="${p.sumaMax}"></label>
                    <label>Vigencia (meses)<input name="vigenciaMeses" type="number" min="1" max="120" value="${p.vigenciaMeses}" required></label>
                </div>
                <p class="hint">Suma máxima en 0 = sin límite. Si mínima = máxima, la suma asegurada queda fija.</p>
            </fieldset>

            <fieldset><legend>Formas de pago</legend>
                <p class="hint" style="margin-top:0">Medios de pago aceptados:</p>
                <div class="checks">
                    ${Object.entries(MEDIOS_PAGO).map(([k, n]) => `<label class="check"><input type="checkbox" name="medios" value="${k}" ${chk(p.pago.medios.includes(k))}> ${n}</label>`).join('')}
                </div>

                <label class="check"><input type="checkbox" name="contado" ${chk(p.pago.contado.habilitado)}> Permitir pago al contado</label>
                <div class="sub grid3" data-sub="contado">
                    <label>Descuento por contado (%)<input name="descuento" type="number" step="0.01" min="0" max="100" value="${p.pago.contado.descuento}"></label>
                </div>

                <label class="check"><input type="checkbox" name="credito" ${chk(p.pago.credito.habilitado)}> Permitir pago a crédito (cuotas)</label>
                <div class="sub" data-sub="credito">
                    <label>Cantidades de cuotas permitidas (separadas por coma)<input name="cuotas" value="${p.pago.credito.cuotas.join(', ')}" placeholder="3, 6, 12"></label>
                    <div class="grid2">
                        <label>Recargo por financiamiento (%)<input name="recargo" type="number" step="0.01" min="0" value="${p.pago.credito.recargo}"></label>
                        <label>Cuota inicial (% del total)<input name="inicial" type="number" step="0.01" min="0" max="100" value="${p.pago.credito.inicial}"></label>
                    </div>
                </div>
            </fieldset>

            <fieldset><legend>Beneficiarios</legend>
                <label>¿La póliza lleva beneficiarios?
                    <select name="beneficiarios">
                        ${Object.entries(REGLAS_BENEF).map(([k, t]) => `<option value="${k}" ${k === p.beneficiarios ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </label>
                <p class="hint" style="margin:-4px 0 10px">Por ejemplo: obligatorios en Vida, no aplica en Automotores.</p>
            </fieldset>

            <fieldset><legend>Carteras</legend>
                <p class="hint" style="margin:0 0 10px">Subclasificaciones con su propia tasa (o prima fija). Si el producto tiene carteras, al emitir hay que elegir una y la prima se calcula con su tarifa. En pólizas colectivas, la póliza madre recibe una copia que luego se puede ajustar.</p>
                <div id="carteras">${(editando ? carterasProducto(producto.id, false) : duplicar ? carterasProducto(producto.id, false).map(c => ({ ...c, id: '' })) : []).map(carteraRow).join('')}</div>
                <button type="button" class="btn small" id="btn-add-cart">+ Agregar cartera</button>
                <div style="height:10px"></div>
            </fieldset>

            <fieldset><legend>Coberturas</legend>
                <div id="coberturas">${p.coberturas.map(coberturaRow).join('')}</div>
                <button type="button" class="btn small" id="btn-add-cob">+ Agregar cobertura</button>
                <div style="height:10px"></div>
            </fieldset>`,
        onOpen: body => {
            const sync = () => {
                const tipo = $('[name=primaTipo]:checked', body).value;
                $$('[data-show]', body).forEach(el => { el.hidden = el.dataset.show !== tipo; });
                $('[data-sub=contado]', body).hidden = !$('[name=contado]', body).checked;
                $('[data-sub=credito]', body).hidden = !$('[name=credito]', body).checked;
            };
            body.addEventListener('change', sync);
            sync();
            $('#btn-add-cart', body).addEventListener('click', () => {
                $('#carteras', body).insertAdjacentHTML('beforeend', carteraRow());
                sync();
            });
            $('#carteras', body).addEventListener('click', e => {
                if (e.target.closest('[data-cart-del]')) e.target.closest('.cart-row').remove();
            });
            $('#btn-add-cob', body).addEventListener('click', () => {
                $('#coberturas', body).insertAdjacentHTML('beforeend', coberturaRow());
            });
            $('#coberturas', body).addEventListener('click', e => {
                if (e.target.closest('[data-cob-del]')) e.target.closest('.cob-row').remove();
            });
        },
        onSubmit: async body => {
            const v = name => $(`[name=${name}]`, body).value.trim();
            const n = name => parseFloat($(`[name=${name}]`, body).value) || 0;
            const checked = name => $$(`[name=${name}]:checked`, body).map(i => i.value);

            const data = {
                id: editando ? producto.id : '',
                ramoId: v('ramoId'),
                codigo: v('codigo').toUpperCase(),
                nombre: v('nombre'),
                descripcion: v('descripcion'),
                activo: $('[name=activo]', body).checked,
                monedas: checked('monedas'),
                monedaRef: v('monedaRef'),
                prima: { tipo: $('[name=primaTipo]:checked', body).value, tasa: n('tasa'), montoFijo: n('montoFijo'), minima: n('minima') },
                sumaMin: n('sumaMin'),
                sumaMax: n('sumaMax'),
                vigenciaMeses: parseInt(v('vigenciaMeses'), 10) || 0,
                coberturas: $$('.cob-row', body)
                    .map(row => ({ nombre: $('[data-cob=nombre]', row).value.trim(), detalle: $('[data-cob=detalle]', row).value.trim() }))
                    .filter(c => c.nombre),
                beneficiarios: v('beneficiarios'),
                tipoPoliza: v('tipoPoliza'),
                pago: {
                    medios: checked('medios'),
                    contado: { habilitado: $('[name=contado]', body).checked, descuento: n('descuento') },
                    credito: {
                        habilitado: $('[name=credito]', body).checked,
                        cuotas: [...new Set(v('cuotas').split(/[,\s;]+/).map(x => parseInt(x, 10)).filter(x => x >= 2))].sort((a, b) => a - b),
                        recargo: n('recargo'),
                        inicial: n('inicial'),
                    },
                },
            };

            if (!data.ramoId) return 'Selecciona un ramo.';
            if (!data.codigo || !data.nombre) return 'Código y nombre son obligatorios.';
            if (state.productos.some(x => x.codigo === data.codigo && x.id !== data.id)) return `Ya existe un producto con código ${data.codigo}.`;
            if (!data.monedas.length) return 'Selecciona al menos una moneda de emisión.';
            if (data.prima.tipo === 'tasa' && data.prima.tasa <= 0) return 'La tasa debe ser mayor a 0.';
            if (data.prima.tipo === 'fija' && data.prima.montoFijo <= 0) return 'La prima fija debe ser mayor a 0.';
            if (data.sumaMax > 0 && data.sumaMax < data.sumaMin) return 'La suma asegurada máxima no puede ser menor que la mínima.';
            if (data.vigenciaMeses < 1) return 'La vigencia debe ser de al menos 1 mes.';
            if (!data.pago.medios.length) return 'Selecciona al menos un medio de pago.';
            if (!data.pago.contado.habilitado && !data.pago.credito.habilitado) return 'Habilita al menos una modalidad: contado o crédito.';
            if (data.pago.credito.habilitado && !data.pago.credito.cuotas.length) return 'Indica al menos una cantidad de cuotas (2 o más) para crédito.';

            const carteras = leerCarteras(body);
            const errCart = validarCarteras(carteras, data.prima.tipo);
            if (errCart) return errCart;

            const saved = productoFromRow(await api.post('upsert', { sheet: 'productos', record: productoToRow(data) }));
            upsertLocal(state.productos, saved);
            const avisos = await sincronizarCarteras(carteras, editando ? carterasProducto(saved.id, false) : [], { productoId: saved.id, polizaId: '' });
            renderAll();
            toast(avisos.length ? `Producto guardado. ${avisos.join(' ')}` : 'Producto guardado en la hoja');
        },
    });
}

$('#btn-nuevo-producto').addEventListener('click', () => {
    if (!conectado) return showTab('config');
    if (!state.ramos.length) return alert('Primero crea un ramo.');
    formProducto();
});
$('#filtro-ramo-productos').addEventListener('change', renderProductos);

$('#lista-productos').addEventListener('click', async e => {
    const edit = e.target.closest('[data-prod-edit]');
    const dup = e.target.closest('[data-prod-dup]');
    const del = e.target.closest('[data-prod-del]');
    if (edit) formProducto(productoById(edit.dataset.prodEdit));
    if (dup) formProducto(productoById(dup.dataset.prodDup), { duplicar: true });
    if (del) {
        const p = productoById(del.dataset.prodDel);
        if (state.polizas.some(x => x.productoId === p.id)) {
            alert('Este producto ya tiene pólizas emitidas. No se puede eliminar; desactívalo para que no se emitan más.');
            return;
        }
        if (!confirm(`¿Eliminar el producto "${p.nombre}"?`)) return;
        try {
            await conCarga('Eliminando…', () => api.post('delete', { sheet: 'productos', id: p.id }));
            state.productos = state.productos.filter(x => x.id !== p.id);
            renderAll();
        } catch (err) {
            alert(err.message);
        }
    }
});

/* =========================================================
   CLIENTES
   ========================================================= */
/** Pólizas donde participa el cliente, con el rol que cumple en cada una. */
function participaciones(clienteId) {
    const res = [];
    state.polizas.forEach(p => {
        const roles = [];
        if (p.tomadorId === clienteId) roles.push('Tomador');
        if (certificadosDe(p.id).some(c => c.clienteId === clienteId)) roles.push('Asegurado');
        const b = beneficiariosDe(p.id).find(x => x.clienteId === clienteId);
        if (b) roles.push(`Beneficiario (${b.porcentaje}%)`);
        if (roles.length) res.push({ poliza: p, roles });
    });
    return res;
}

function buscarClientes(q, { soloActivos = false, limite = 0 } = {}) {
    const t = q.trim().toLowerCase();
    let lista = state.clientes.filter(c => (!soloActivos || c.activo) && (!t ||
        nombreCompleto(c).toLowerCase().includes(t) ||
        c.doc.toLowerCase().includes(t) ||
        c.email.toLowerCase().includes(t) ||
        c.telefono.includes(t)));
    if (limite) lista = lista.slice(0, limite);
    return lista;
}

function renderClientes() {
    const cont = $('#lista-clientes');
    if (!conectado) { cont.innerHTML = sinConexionHTML(); return; }
    if (!state.clientes.length) {
        cont.innerHTML = '<div class="empty">Aún no hay clientes registrados.</div>';
        return;
    }
    const lista = buscarClientes($('#buscar-cliente').value);
    if (!lista.length) {
        cont.innerHTML = '<div class="empty">Sin resultados.</div>';
        return;
    }
    cont.innerHTML = `
        <div class="table-wrap"><table>
            <thead><tr><th>Documento</th><th>Nombre</th><th>Contacto</th><th class="num">Pólizas</th><th>Estado</th><th></th></tr></thead>
            <tbody>
            ${lista.map(c => {
                const n = participaciones(c.id).length;
                return `<tr>
                    <td><strong>${esc(documento(c))}</strong></td>
                    <td>${esc(nombreCompleto(c))}${c.fechaNacimiento ? `<div class="muted">Nac. ${fecha(c.fechaNacimiento)}</div>` : ''}</td>
                    <td>${esc(c.telefono)}<div class="muted">${esc(c.email)}</div></td>
                    <td class="num">${n ? `<button class="btn small" data-cli-pol="${esc(c.id)}">${n}</button>` : '0'}</td>
                    <td>${c.activo ? '<span class="badge ok">Activo</span>' : '<span class="badge off">Inactivo</span>'}</td>
                    <td class="actions">
                        <button class="btn small" data-cli-edit="${esc(c.id)}">Editar</button>
                        <button class="btn small danger" data-cli-del="${esc(c.id)}">Eliminar</button>
                    </td>
                </tr>`;
            }).join('')}
            </tbody>
        </table></div>`;
}

/** Abre el formulario de cliente. onSaved recibe el cliente guardado (útil al crear desde la emisión). */
function formCliente(cliente, onSaved) {
    const c = cliente || { tipoDoc: 'CI', doc: '', expedido: '', nombres: '', apellidos: '', fechaNacimiento: '', telefono: '', email: '', direccion: '', activo: true };
    openModal({
        title: cliente ? 'Editar cliente' : 'Nuevo cliente',
        body: `
            <div class="grid3">
                <label>Tipo de documento
                    <select name="tipoDoc">${Object.entries(TIPOS_DOC).map(([k, t]) => `<option value="${k}" ${k === c.tipoDoc ? 'selected' : ''}>${t}</option>`).join('')}</select>
                </label>
                <label>N° de documento<input name="doc" value="${esc(c.doc)}" required></label>
                <label>Expedido en
                    <select name="expedido"><option value="">—</option>${EXPEDIDO.map(e => `<option ${e === c.expedido ? 'selected' : ''}>${e}</option>`).join('')}</select>
                </label>
            </div>
            <div class="grid2">
                <label>Nombres<input name="nombres" value="${esc(c.nombres)}" required></label>
                <label>Apellidos<input name="apellidos" value="${esc(c.apellidos)}" required></label>
                <label>Teléfono<input name="telefono" type="tel" value="${esc(c.telefono)}"></label>
                <label>Correo electrónico<input name="email" type="email" value="${esc(c.email)}"></label>
                <label>Fecha de nacimiento<input name="fechaNacimiento" type="date" value="${esc(c.fechaNacimiento)}"></label>
            </div>
            <label>Dirección<input name="direccion" value="${esc(c.direccion)}"></label>
            <label class="check"><input type="checkbox" name="activo" ${c.activo ? 'checked' : ''}> Activo</label>`,
        onSubmit: async body => {
            const v = n => $(`[name=${n}]`, body).value.trim();
            const data = {
                id: cliente?.id || '',
                tipoDoc: v('tipoDoc'),
                doc: v('doc').toUpperCase(),
                expedido: v('tipoDoc') === 'CI' ? v('expedido') : '',
                nombres: v('nombres'),
                apellidos: v('apellidos'),
                fechaNacimiento: v('fechaNacimiento'),
                telefono: v('telefono'),
                email: v('email'),
                direccion: v('direccion'),
                activo: $('[name=activo]', body).checked,
            };
            if (!data.doc || !data.nombres || !data.apellidos) return 'Documento, nombres y apellidos son obligatorios.';
            if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'El correo no es válido.';
            const dup = state.clientes.find(x => x.tipoDoc === data.tipoDoc && x.doc === data.doc && x.id !== data.id);
            if (dup) return `Ya existe un cliente con ${data.tipoDoc} ${data.doc}: ${nombreCompleto(dup)}.`;
            const saved = clienteFromRow(await api.post('upsert', { sheet: 'clientes', record: clienteToRow(data) }));
            upsertLocal(state.clientes, saved);
            renderClientes();
            onSaved?.(saved);
            toast('Cliente guardado en la hoja');
        },
    });
}

function verPolizasCliente(c) {
    const lista = participaciones(c.id);
    openModal({
        title: `Pólizas de ${nombreCompleto(c)}`,
        readonly: true,
        body: `<div class="table-wrap"><table>
            <thead><tr><th>Póliza</th><th>Producto</th><th>Rol</th><th>Vigencia</th><th>Estado</th></tr></thead>
            <tbody>${lista.map(({ poliza: p, roles }) => `<tr>
                <td><strong>${esc(p.numero)}</strong></td>
                <td>${esc(p.producto.nombre)}</td>
                <td>${roles.map(r => `<span class="badge">${esc(r)}</span>`).join('')}</td>
                <td>${fecha(p.desde)} – ${fecha(p.hasta)}</td>
                <td>${p.estado === 'anulada' ? '<span class="badge danger">Anulada</span>' : '<span class="badge ok">Vigente</span>'}</td>
            </tr>`).join('')}</tbody>
        </table></div>`,
    });
}

$('#btn-nuevo-cliente').addEventListener('click', () => {
    if (!conectado) return showTab('config');
    formCliente();
});
$('#buscar-cliente').addEventListener('input', renderClientes);
$('#lista-clientes').addEventListener('click', async e => {
    const edit = e.target.closest('[data-cli-edit]');
    const pol = e.target.closest('[data-cli-pol]');
    const del = e.target.closest('[data-cli-del]');
    if (edit) formCliente(clienteById(edit.dataset.cliEdit));
    if (pol) verPolizasCliente(clienteById(pol.dataset.cliPol));
    if (del) {
        const c = clienteById(del.dataset.cliDel);
        if (participaciones(c.id).length) {
            alert('El cliente participa en pólizas. No se puede eliminar; desactívalo si ya no debe usarse.');
            return;
        }
        if (!confirm(`¿Eliminar al cliente "${nombreCompleto(c)}"?`)) return;
        try {
            await conCarga('Eliminando…', () => api.post('delete', { sheet: 'clientes', id: c.id }));
            state.clientes = state.clientes.filter(x => x.id !== c.id);
            renderAll();
        } catch (err) {
            alert(err.message);
        }
    }
});

/**
 * Selector de cliente con búsqueda y alta rápida.
 * Devuelve { value, set(id), clear() }; el id elegido también queda en host.dataset.value.
 */
function crearPicker(host, { onChange } = {}) {
    host.innerHTML = `
        <div class="picker">
            <input type="search" placeholder="Buscar cliente por nombre o documento…" autocomplete="off">
            <div class="picker-results"></div>
            <div class="picker-selected" hidden></div>
        </div>
        <button type="button" class="btn small" data-nuevo title="Registrar nuevo cliente">+ Nuevo</button>`;
    const input = $('input', host);
    const results = $('.picker-results', host);
    const selected = $('.picker-selected', host);

    const api_ = {
        get value() { return host.dataset.value || ''; },
        set(id) {
            const c = clienteById(id);
            host.dataset.value = c ? c.id : '';
            input.hidden = !!c;
            selected.hidden = !c;
            results.innerHTML = '';
            input.value = '';
            if (c) {
                selected.innerHTML = `<div><strong>${esc(nombreCompleto(c))}</strong><p class="muted">${esc(documento(c))}${c.telefono ? ` · ${esc(c.telefono)}` : ''}</p></div>
                    <button type="button" class="btn small" data-cambiar>Cambiar</button>`;
            }
            onChange?.(host.dataset.value);
        },
        clear() { api_.set(''); },
    };

    const mostrar = () => {
        const lista = buscarClientes(input.value, { soloActivos: true, limite: 8 });
        results.innerHTML = lista.length
            ? lista.map(c => `<button type="button" data-id="${esc(c.id)}">${esc(nombreCompleto(c))}<div class="muted">${esc(documento(c))}</div></button>`).join('')
            : `<button type="button" data-crear>Sin coincidencias — registrar nuevo cliente</button>`;
    };

    input.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const first = $('[data-id]', results);
        if (first) api_.set(first.dataset.id);
    });
    input.addEventListener('input', mostrar);
    input.addEventListener('focus', mostrar);
    input.addEventListener('blur', () => setTimeout(() => { results.innerHTML = ''; }, 150));
    host.addEventListener('click', e => {
        const opt = e.target.closest('[data-id]');
        if (opt) api_.set(opt.dataset.id);
        if (e.target.closest('[data-cambiar]')) { api_.clear(); input.focus(); }
        if (e.target.closest('[data-nuevo], [data-crear]')) formCliente(null, c => api_.set(c.id));
    });
    host.dataset.value = '';
    return api_;
}

/* =========================================================
   EMISIÓN
   ========================================================= */
const fe = $('#form-emision');
const tomadorPicker = crearPicker($('#em-tomador'), { onChange: () => recalcular() });
const aseguradoPicker = crearPicker($('#em-asegurado'), { onChange: () => recalcular() });

/**
 * Lista editable de beneficiarios (cliente + parentesco + %). Se usa en la emisión y al agregar certificados.
 */
function crearBeneficiarios(listEl, onChange) {
    let rows = [];
    const comp = {
        get length() { return rows.length; },
        add() {
            const row = document.createElement('div');
            row.className = 'benef-row';
            row.innerHTML = `
                <div class="picker-host"></div>
                <select data-b="parentesco">${PARENTESCOS.map(p => `<option>${p}</option>`).join('')}</select>
                <input data-b="porcentaje" type="number" min="0" max="100" step="0.01" placeholder="%">
                <button type="button" class="btn small danger" data-b-del title="Quitar">✕</button>`;
            listEl.appendChild(row);
            rows.push({ row, picker: crearPicker($('.picker-host', row), { onChange }) });
            // Reparte 100% en partes iguales entre todos los beneficiarios
            const parte = round2(100 / rows.length);
            rows.forEach((b, i) => {
                $('[data-b=porcentaje]', b.row).value = i === rows.length - 1 ? round2(100 - parte * (rows.length - 1)) : parte;
            });
            onChange();
        },
        clear() {
            rows = [];
            listEl.innerHTML = '';
        },
        values() {
            return rows.map(b => ({
                clienteId: b.picker.value,
                parentesco: $('[data-b=parentesco]', b.row).value,
                porcentaje: parseFloat($('[data-b=porcentaje]', b.row).value) || 0,
            }));
        },
        rows: () => rows,
    };
    listEl.addEventListener('click', e => {
        const del = e.target.closest('[data-b-del]');
        if (!del) return;
        const row = del.closest('.benef-row');
        rows = rows.filter(b => b.row !== row);
        row.remove();
        onChange();
    });
    listEl.addEventListener('input', onChange);
    listEl.addEventListener('change', onChange);
    return comp;
}

/** Valida la lista de beneficiarios según la regla del producto. Devuelve un mensaje de error o ''. */
function validarBeneficiarios(regla, benefs, aseguradoId) {
    if (regla === 'requerido' && !benefs.length) return 'Este producto requiere al menos un beneficiario.';
    if (!benefs.length) return '';
    if (benefs.some(b => !b.clienteId)) return 'Selecciona el cliente de cada beneficiario (o quita la fila vacía).';
    if (benefs.some(b => b.porcentaje <= 0)) return 'Cada beneficiario debe tener un porcentaje mayor a 0.';
    const ids = benefs.map(b => b.clienteId);
    if (new Set(ids).size !== ids.length) return 'Un mismo cliente está repetido como beneficiario.';
    if (aseguradoId && ids.includes(aseguradoId)) return 'El asegurado no puede ser su propio beneficiario.';
    const total = round2(benefs.reduce((acc, b) => acc + b.porcentaje, 0));
    if (total !== 100) return `Los porcentajes de beneficiarios suman ${total}%; deben sumar 100%.`;
    return '';
}

/** Muestra el total de % debajo de la lista (en rojo si no suma 100). */
function pintarTotalBenef(el, benefs) {
    const total = round2(benefs.reduce((acc, b) => acc + b.porcentaje, 0));
    el.textContent = benefs.length ? `Total: ${total}%` : '';
    el.style.color = benefs.length && total !== 100 ? 'var(--danger)' : '';
}

const benefEm = crearBeneficiarios($('#em-benef-list'), () => recalcular());
$('#btn-add-benef').addEventListener('click', () => benefEm.add());

const esColectiva = p => p?.tipoPoliza === 'colectiva';

function productosEmitibles() {
    return state.productos.filter(p => p.activo && ramoById(p.ramoId)?.activo);
}

function renderEmisionProductos() {
    const sel = $('#em-producto');
    const actual = sel.value;
    const lista = productosEmitibles();
    const porRamo = state.ramos
        .map(r => ({ r, ps: lista.filter(p => p.ramoId === r.id) }))
        .filter(g => g.ps.length);
    sel.innerHTML = '<option value="">— Selecciona —</option>' + porRamo.map(({ r, ps }) =>
        `<optgroup label="${esc(r.nombre)}">${ps.map(p => `<option value="${esc(p.id)}">${esc(p.codigo)} · ${esc(p.nombre)}</option>`).join('')}</optgroup>`
    ).join('');
    sel.value = lista.some(p => p.id === actual) ? actual : '';
    // Refresca opciones por si el producto seleccionado cambió su configuración
    onProductoChange(sel.value !== actual);
}

function setOptions(sel, entries, keep = true) {
    const prev = sel.value;
    sel.innerHTML = entries.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('');
    if (keep && entries.some(([v]) => String(v) === prev)) sel.value = prev;
}

function onProductoChange(resetSuma = true) {
    const p = productoById($('#em-producto').value);
    const info = $('#em-producto-info');
    // En la póliza madre el asegurado es el tomador; asegurados, sumas y beneficiarios van en cada certificado
    const colectiva = esColectiva(p);
    const regla = colectiva ? 'no' : p?.beneficiarios || 'no';
    $('#em-aseg-block').hidden = colectiva;
    $('#em-suma-wrap').hidden = colectiva;
    $('#em-suma-hint').hidden = colectiva;
    $('#em-madre-note').hidden = !colectiva;
    $('#em-benef-block').hidden = regla === 'no';
    $('#em-benef-regla').textContent = regla === 'requerido' ? '(obligatorio)' : '(opcional)';
    if (regla === 'no') benefEm.clear();
    else if (regla === 'requerido' && !benefEm.length) benefEm.add();
    if (!p) {
        $('#em-cartera-wrap').hidden = true;
        info.innerHTML = '';
        ['#em-moneda', '#em-modalidad', '#em-medio', '#em-cuotas'].forEach(s => { $(s).innerHTML = ''; });
        $('#em-suma-hint').textContent = '';
        recalcular();
        return;
    }
    info.innerHTML = `
        <p>${esc(p.descripcion)}</p>
        ${p.coberturas.length ? `<p><strong>Coberturas:</strong> ${p.coberturas.map(c => esc(c.nombre)).join(', ')}</p>` : ''}
        <p>Vigencia: ${p.vigenciaMeses} meses${colectiva ? ' · <strong>Póliza colectiva</strong>' : ''}</p>`;

    setOptions($('#em-moneda'), p.monedas.filter(m => MONEDAS[m]?.activo).map(m => [m, `${MONEDAS[m].nombre} (${MONEDAS[m].simbolo})`]));
    const mods = [];
    if (p.pago.contado.habilitado) mods.push(['contado', MODALIDADES.contado]);
    if (p.pago.credito.habilitado) mods.push(['credito', MODALIDADES.credito]);
    setOptions($('#em-modalidad'), mods);
    setOptions($('#em-medio'), p.pago.medios.map(m => [m, MEDIOS_PAGO[m]]));
    setOptions($('#em-cuotas'), p.pago.credito.cuotas.map(c => [c, `${c} cuotas`]));
    const carts = colectiva ? [] : carterasProducto(p.id);
    $('#em-cartera-wrap').hidden = !carts.length;
    setOptions($('#em-cartera'), carts.map(c => [c.id, `${c.nombre} · ${textoTarifa(p, valorCartera(p, c))}`]));

    if (!$('#em-desde').value) $('#em-desde').value = hoyISO();
    onMonedaChange(resetSuma);
}

function limitesSuma(p, moneda) {
    return {
        min: round2(convertir(p.sumaMin, p.monedaRef, moneda)),
        max: p.sumaMax > 0 ? round2(convertir(p.sumaMax, p.monedaRef, moneda)) : 0,
    };
}

function onMonedaChange(resetSuma = false) {
    const p = productoById($('#em-producto').value);
    if (!p) return;
    const moneda = $('#em-moneda').value;
    const { min, max } = limitesSuma(p, moneda);
    const suma = $('#em-suma');
    suma.min = min;
    if (max) suma.max = max; else suma.removeAttribute('max');
    const fija = max && min === max;
    suma.readOnly = !!fija;
    if (fija || resetSuma) suma.value = fija ? min : (min || '');
    $('#em-suma-hint').textContent = fija
        ? `Suma asegurada fija del producto: ${money(min, moneda)}`
        : `Rango permitido: ${money(min, moneda)}${max ? ` a ${money(max, moneda)}` : ' en adelante'}`;
    recalcular();
}

/**
 * Calcula prima y cronograma. Devuelve { error } o el detalle completo.
 * Para certificados de una póliza madre se pasa "hasta" (fin de la madre) y "factor" de prorrata;
 * las cuotas se limitan a los meses que quedan de vigencia.
 */
function calcularPrima(p, { moneda, suma, modalidad, cuotas, desde, hasta, factor = 1, cartera = null }) {
    if (!p) return { error: 'Selecciona un producto.' };
    if (!p.monedas.includes(moneda) || !MONEDAS[moneda]?.activo) return { error: 'Moneda no permitida para este producto.' };
    const { min, max } = limitesSuma(p, moneda);
    if (!(suma > 0)) return { error: 'Ingresa la suma asegurada.' };
    if (suma < min) return { error: `La suma asegurada mínima es ${money(min, moneda)}.` };
    if (max && suma > max) return { error: `La suma asegurada máxima es ${money(max, moneda)}.` };
    if (!desde) return { error: 'Indica la fecha de inicio de vigencia.' };

    // La cartera reemplaza la tasa (o la prima fija) del producto
    const tasa = cartera ? cartera.tasa : p.prima.tasa;
    const montoFijo = cartera ? cartera.primaFija : p.prima.montoFijo;
    let prima = p.prima.tipo === 'tasa'
        ? suma * tasa / 100
        : convertir(montoFijo, p.monedaRef, moneda);
    const primaTarifa = round2(prima * factor); // lo que da la tasa, antes de aplicar la mínima
    const primaMinima = p.prima.tipo === 'tasa' && p.prima.minima > 0 ? round2(convertir(p.prima.minima, p.monedaRef, moneda) * factor) : 0;
    let aplicoMinima = false;
    if (primaMinima && prima * factor < primaMinima) { prima = primaMinima / factor; aplicoMinima = true; }
    prima = round2(prima * factor);
    const fin = hasta || sumarMeses(desde, p.vigenciaMeses);

    let ajuste = 0;
    let ajusteLabel = '';
    let cronograma;

    if (modalidad === 'contado') {
        if (!p.pago.contado.habilitado) return { error: 'Pago al contado no permitido.' };
        const d = p.pago.contado.descuento;
        if (d) { ajuste = -round2(prima * d / 100); ajusteLabel = `Descuento contado (${d}%)`; }
        cronograma = [{ n: 1, fecha: desde, monto: round2(prima + ajuste) }];
    } else if (modalidad === 'credito') {
        const c = p.pago.credito;
        if (!c.habilitado) return { error: 'Pago a crédito no permitido.' };
        if (!c.cuotas.includes(cuotas)) return { error: 'Número de cuotas no permitido.' };
        if (c.recargo) { ajuste = round2(prima * c.recargo / 100); ajusteLabel = `Recargo financiamiento (${c.recargo}%)`; }
        const total = round2(prima + ajuste);
        const nCuotas = Math.min(cuotas, mesesRestantes(desde, fin));
        cronograma = [];
        let restante = total;
        let n = nCuotas;
        let inicio = 0;
        if (c.inicial > 0 && nCuotas > 1) {
            const ini = round2(total * c.inicial / 100);
            cronograma.push({ n: 1, fecha: desde, monto: ini, inicial: true });
            restante = round2(total - ini);
            n = nCuotas - 1;
            inicio = 1;
        }
        const cuota = round2(restante / n);
        for (let i = 0; i < n; i++) {
            const monto = i === n - 1 ? round2(restante - cuota * (n - 1)) : cuota;
            cronograma.push({ n: inicio + i + 1, fecha: sumarMeses(desde, inicio + i), monto });
        }
    } else {
        return { error: 'Selecciona la modalidad de pago.' };
    }

    return {
        prima, primaTarifa, primaMinima, aplicoMinima, ajuste, ajusteLabel,
        primaTotal: round2(prima + ajuste),
        cronograma,
        hasta: fin,
    };
}

function leerEmision() {
    const fd = new FormData(fe);
    const tomadorId = tomadorPicker.value;
    return {
        productoId: fd.get('productoId'),
        moneda: fd.get('moneda'),
        suma: parseFloat(fd.get('suma')),
        modalidad: fd.get('modalidad'),
        medio: fd.get('medio'),
        cuotas: parseInt(fd.get('cuotas'), 10),
        desde: fd.get('desde'),
        cartera: $('#em-cartera-wrap').hidden ? null : carteraById(fd.get('cartera')) || null,
        tomadorId,
        aseguradoId: $('#em-aseg-mismo').checked ? tomadorId : aseguradoPicker.value,
        beneficiarios: benefEm.values(),
    };
}

/** Valida tomador, asegurado y beneficiarios. Devuelve un mensaje de error o ''. */
function validarParticipantes(p, d) {
    if (!d.tomadorId) return 'Selecciona el tomador.';
    if (esColectiva(p)) return '';
    if (!d.aseguradoId) return 'Selecciona el asegurado.';
    return validarBeneficiarios(p?.beneficiarios || 'no', d.beneficiarios, d.aseguradoId);
}

/** Valida las condiciones de la póliza madre (sin suma ni prima propias). */
function validarMadre(p, d) {
    if (!p.monedas.includes(d.moneda) || !MONEDAS[d.moneda]?.activo) return 'Moneda no permitida para este producto.';
    if (!d.desde) return 'Indica la fecha de inicio de vigencia.';
    if (!d.modalidad) return 'Selecciona la modalidad de pago.';
    if (d.modalidad === 'credito' && !p.pago.credito.cuotas.includes(d.cuotas)) return 'Número de cuotas no permitido.';
    return '';
}

/**
 * Filas del resumen que explican la prima: lo que da la tasa y, si no alcanza, la prima mínima aplicada.
 */
function lineasPrima(prod, r, moneda, cartera) {
    if (prod.prima.tipo !== 'tasa') return `<dt>Prima (fija)</dt><dd>${money(r.prima, moneda)}</dd>`;
    const tasa = cartera ? cartera.tasa : prod.prima.tasa;
    const tarifa = `<dt>Prima por tasa (${fmtTc(tasa)}%)</dt><dd${r.aplicoMinima ? ' class="tachado"' : ''}>${money(r.primaTarifa, moneda)}</dd>`;
    if (!r.aplicoMinima) return tarifa;
    return tarifa + `<dt>Prima mínima aplicada</dt><dd>${money(r.prima, moneda)}</dd>
        <dt></dt><dd class="hint">La prima por tasa no alcanza la mínima del producto (${money(r.primaMinima, moneda)}).</dd>`;
}

function tablaCronograma(cron, moneda) {
    return `<table class="cronograma">
        <thead><tr><th>#</th><th>Vencimiento</th><th class="num">Monto</th></tr></thead>
        <tbody>${cron.map(c => `<tr><td>${c.n}${c.inicial ? ' (inicial)' : ''}</td><td>${fecha(c.fecha)}</td><td class="num">${money(c.monto, moneda)}</td></tr>`).join('')}</tbody>
    </table>`;
}

function recalcular() {
    const d = leerEmision();
    const p = productoById(d.productoId);
    $('#em-cuotas-wrap').hidden = d.modalidad !== 'credito';
    $('#em-aseg-wrap').hidden = $('#em-aseg-mismo').checked;
    pintarTotalBenef($('#em-benef-total'), d.beneficiarios);
    if (esColectiva(p)) return resumenMadre(p, d);
    let r = calcularPrima(p, d);
    if (!r.error && !$('#em-cartera-wrap').hidden && !d.cartera) r = { error: 'Selecciona una cartera.' };
    if (!r.error) {
        const errP = validarParticipantes(p, d);
        if (errP) r = { ...r, error: errP, soloParticipantes: true };
    }
    $('#em-hasta').value = p && d.desde ? sumarMeses(d.desde, p.vigenciaMeses) : '';
    const res = $('#em-resumen');
    if (r.error && !r.soloParticipantes) {
        res.innerHTML = `<span class="muted">${esc(conectado ? r.error : 'Sin conexión con la hoja.')}</span>`;
        $('#btn-emitir').disabled = true;
        return;
    }
    $('#btn-emitir').disabled = !!r.error;
    res.innerHTML = (r.error ? `<p class="error">${esc(r.error)}</p>` : '') + `
        <dl class="kv">
            <dt>Suma asegurada</dt><dd>${money(d.suma, d.moneda)}</dd>
            ${d.moneda !== MONEDA_BASE ? `<dt>Tipo de cambio</dt><dd>1 ${esc(d.moneda)} = ${fmtTc(MONEDAS[d.moneda].tc)} Bs</dd>` : ''}
            ${d.cartera ? `<dt>Cartera</dt><dd>${esc(d.cartera.nombre)}</dd>` : ''}
            ${lineasPrima(p, r, d.moneda, d.cartera)}
            ${r.ajusteLabel ? `<dt>${esc(r.ajusteLabel)}</dt><dd>${money(r.ajuste, d.moneda)}</dd>` : ''}
            <dt class="total">Prima total</dt><dd class="total">${money(r.primaTotal, d.moneda)}</dd>
        </dl>
        ${tablaCronograma(r.cronograma, d.moneda)}`;
}

function resumenMadre(p, d) {
    const error = validarMadre(p, d) || validarParticipantes(p, d);
    $('#em-hasta').value = d.desde ? sumarMeses(d.desde, p.vigenciaMeses) : '';
    const tarifa = carterasProducto(p.id).length ? 'Según la cartera de cada certificado'
        : p.prima.tipo === 'tasa' ? `Tasa ${fmtTc(p.prima.tasa)}% sobre la suma asegurada`
        : `Prima fija ${money(convertir(p.prima.montoFijo, p.monedaRef, d.moneda), d.moneda)}`;
    const pago = d.modalidad === 'credito' ? `Crédito, hasta ${d.cuotas} cuotas` : 'Contado';
    $('#btn-emitir').disabled = !!error;
    $('#em-resumen').innerHTML = (error ? `<p class="error">${esc(conectado ? error : 'Sin conexión con la hoja.')}</p>` : '') + `
        <p><strong>Póliza madre</strong>: se emite sin suma ni prima propias.</p>
        <dl class="kv">
            <dt>Tarifa por certificado</dt><dd>${esc(tarifa)}</dd>
            ${d.moneda && d.moneda !== MONEDA_BASE ? `<dt>Tipo de cambio</dt><dd>1 ${esc(d.moneda)} = ${fmtTc(MONEDAS[d.moneda]?.tc ?? 1)} Bs</dd>` : ''}
            <dt>Forma de pago</dt><dd>${esc(pago)}</dd>
            ${carterasProducto(p.id).length ? `<dt>Carteras</dt><dd>${carterasProducto(p.id).map(c => `${esc(c.nombre)} (${textoTarifa(p, valorCartera(p, c), d.moneda)})`).join('<br>')}</dd>` : ''}
        </dl>
        ${carterasProducto(p.id).length ? '<p class="hint">Estas carteras se copian a la póliza madre, donde podrás editarlas o crear otras.</p>' : ''}
        <p class="hint">Después de emitirla, agrega los certificados desde <strong>Pólizas emitidas → Ver</strong>. Cada certificado tiene su propia vigencia, independiente de la madre.</p>`;
}

$('#em-producto').addEventListener('change', () => onProductoChange(true));
$('#em-moneda').addEventListener('change', () => onMonedaChange(true));
fe.addEventListener('input', e => { if (e.target.id !== 'em-producto' && e.target.id !== 'em-moneda') recalcular(); });
fe.addEventListener('change', e => { if (['em-modalidad', 'em-cuotas', 'em-desde', 'em-aseg-mismo'].includes(e.target.id) || e.target.dataset.b) recalcular(); });

fe.addEventListener('submit', async e => {
    e.preventDefault();
    const d = leerEmision();
    const p = productoById(d.productoId);
    const err = $('#em-error');
    err.textContent = '';
    const errP = validarParticipantes(p, d);
    if (errP) { err.textContent = errP; return; }
    if (!p.pago.medios.includes(d.medio)) { err.textContent = 'Medio de pago no permitido.'; return; }
    const colectiva = esColectiva(p);
    const r = colectiva
        ? { error: validarMadre(p, d), prima: 0, ajuste: 0, ajusteLabel: '', primaTotal: 0, cronograma: [], hasta: sumarMeses(d.desde, p.vigenciaMeses) }
        : calcularPrima(p, d);
    if (!r.error && !colectiva && !$('#em-cartera-wrap').hidden && !d.cartera) r.error = 'Selecciona una cartera.';
    if (r.error) { err.textContent = r.error; return; }

    const ramo = ramoById(p.ramoId);
    // Se guarda una copia de las condiciones del producto: cambios futuros no afectan pólizas ya emitidas
    const polizaRow = {
        producto_id: p.id,
        ramo_codigo: ramo.codigo,
        ramo_nombre: ramo.nombre,
        producto_codigo: p.codigo,
        producto_nombre: p.nombre,
        tomador_id: d.tomadorId, // nombre, documento y contacto los completa el servidor desde la hoja clientes
        moneda: d.moneda,
        suma_asegurada: colectiva ? 0 : d.suma,
        vigencia_desde: d.desde,
        vigencia_hasta: r.hasta,
        modalidad: d.modalidad,
        medio_pago: d.medio,
        cuotas: d.modalidad === 'credito' ? d.cuotas : 1,
        prima_neta: r.prima,
        ajuste: r.ajuste,
        ajuste_concepto: r.ajusteLabel,
        prima_total: r.primaTotal,
        tipo_cambio: MONEDAS[d.moneda].tc,
        coberturas: JSON.stringify(p.coberturas),
        cronograma: JSON.stringify(r.cronograma),
        cartera_id: d.cartera?.id || '',
    };
    const certificadosRows = colectiva ? [] : [{
        asegurado_id: d.aseguradoId,
        suma_asegurada: d.suma,
        prima_neta: r.prima,
        ajuste: r.ajuste,
        prima: r.primaTotal,
        cronograma: JSON.stringify(r.cronograma),
    }];
    const beneficiariosRows = d.beneficiarios.map(b => ({
        cliente_id: b.clienteId,
        parentesco: b.parentesco,
        porcentaje: b.porcentaje,
    }));

    const btn = $('#btn-emitir');
    btn.disabled = true;
    try {
        const res = await conCarga(colectiva ? 'Emitiendo póliza madre…' : 'Emitiendo póliza…', () => api.post('emitir', { poliza: polizaRow, certificados: certificadosRows, beneficiarios: beneficiariosRows }));
        const poliza = polizaFromRow(res.poliza);
        state.polizas.unshift(poliza);
        state.certificados.push(...res.certificados.map(certificadoFromRow));
        state.beneficiarios.push(...res.beneficiarios.map(beneficiarioFromRow));
        state.carteras.push(...(res.carteras || []).map(carteraFromRow));

        // Limpiar participantes pero conservar el producto para emitir otra rápido
        tomadorPicker.clear();
        aseguradoPicker.clear();
        $('#em-aseg-mismo').checked = true;
        benefEm.clear();
        onProductoChange(false);
        renderPolizas();
        renderClientes();
        recalcular();
        verPoliza(poliza);
        toast(colectiva ? `Póliza madre ${poliza.numero} emitida: ya puedes agregar certificados` : `Póliza ${poliza.numero} emitida`);
    } catch (ex) {
        err.textContent = ex.message;
    } finally {
        btn.disabled = false;
    }
});

/* =========================================================
   PÓLIZAS
   ========================================================= */
const certificadosDe = polizaId => state.certificados.filter(c => c.polizaId === polizaId);
const beneficiariosDe = polizaId => state.beneficiarios.filter(b => b.polizaId === polizaId);
const beneficiariosCert = certId => state.beneficiarios.filter(b => b.certificadoId === certId);
const certificadosVigentes = polizaId => certificadosDe(polizaId).filter(c => c.estado !== 'anulada');
const badgeEstado = (estado, anulado = 'Anulada') => (estado === 'anulada' ? `<span class="badge danger">${anulado}</span>` : '<span class="badge ok">Vigente</span>');

function renderPolizas() {
    const q = $('#buscar-poliza').value.trim().toLowerCase();
    const lista = state.polizas.filter(p => !q ||
        p.numero.toLowerCase().includes(q) ||
        p.tomador.nombre.toLowerCase().includes(q) ||
        p.tomador.doc.toLowerCase().includes(q) ||
        [...certificadosDe(p.id), ...beneficiariosDe(p.id)].some(c => c.nombre.toLowerCase().includes(q) || c.doc.toLowerCase().includes(q)));
    const cont = $('#lista-polizas');
    if (!conectado) { cont.innerHTML = sinConexionHTML(); return; }
    if (!state.polizas.length) {
        cont.innerHTML = '<div class="empty">Todavía no se emitieron pólizas.</div>';
        return;
    }
    if (!lista.length) {
        cont.innerHTML = '<div class="empty">Sin resultados.</div>';
        return;
    }
    cont.innerHTML = `
        <div class="table-wrap"><table>
            <thead><tr><th>Número</th><th>Tomador</th><th>Producto</th><th>Vigencia</th><th class="num">Prima total</th><th>Pago</th><th>Estado</th><th></th></tr></thead>
            <tbody>
            ${lista.map(p => `<tr>
                <td><strong>${esc(p.numero)}</strong>${p.tipo === 'madre' ? ` <span class="badge">Madre · ${certificadosVigentes(p.id).length} cert.</span>` : ''}<div class="muted">${fecha(p.fechaEmision)}</div></td>
                <td>${esc(p.tomador.nombre)}<div class="muted">${esc(p.tomador.doc)}</div></td>
                <td>${esc(p.producto.nombre)}<div class="muted">${esc(p.ramo.nombre)}</div></td>
                <td>${fecha(p.desde)} – ${fecha(p.hasta)}</td>
                <td class="num">${money(p.primaTotal, p.moneda)}</td>
                <td>${p.modalidad === 'credito' ? `${p.cuotas} cuotas` : 'Contado'}<div class="muted">${esc(MEDIOS_PAGO[p.medio] ?? p.medio)}</div></td>
                <td>${badgeEstado(p.estado)}</td>
                <td class="actions">
                    <button class="btn small" data-pol-ver="${esc(p.id)}">Ver</button>
                    ${p.estado !== 'anulada' ? `<button class="btn small danger" data-pol-anular="${esc(p.id)}">Anular</button>` : ''}
                </td>
            </tr>`).join('')}
            </tbody>
        </table></div>`;
}

function tablaBeneficiarios(benefs) {
    return `<table>
        <thead><tr><th>Nombre</th><th>Documento</th><th>Parentesco</th><th class="num">%</th></tr></thead>
        <tbody>${benefs.map(b => `<tr><td>${esc(b.nombre)}</td><td>${esc(b.doc)}</td><td>${esc(b.parentesco)}</td><td class="num">${b.porcentaje}%</td></tr>`).join('')}</tbody>
    </table>`;
}

function seccionTomador(t) {
    return `<section><h4>Tomador</h4>
        <dl class="kv">
            <dt>Nombre</dt><dd>${esc(t.nombre)}</dd>
            <dt>Documento</dt><dd>${esc(t.doc)}</dd>
            ${t.email ? `<dt>Correo</dt><dd>${esc(t.email)}</dd>` : ''}
            ${t.tel ? `<dt>Teléfono</dt><dd>${esc(t.tel)}</dd>` : ''}
            ${t.direccion ? `<dt>Dirección</dt><dd>${esc(t.direccion)}</dd>` : ''}
        </dl>
    </section>`;
}

const textoMoneda = p => `${esc(MONEDAS[p.moneda]?.nombre ?? p.moneda)}${p.moneda !== MONEDA_BASE && p.tipoCambio ? ` (TC ${fmtTc(p.tipoCambio)} Bs)` : ''}`;
const textoPago = p => `${esc(MODALIDADES[p.modalidad] ?? p.modalidad)}${p.modalidad === 'credito' ? ` (hasta ${p.cuotas} cuotas)` : ''} · ${esc(MEDIOS_PAGO[p.medio] ?? p.medio)}`;

function seccionCoberturas(p) {
    return p.coberturas.length ? `<section><h4>Coberturas</h4>
        <table><tbody>${p.coberturas.map(c => `<tr><td>${esc(c.nombre)}</td><td class="num">${esc(c.detalle)}</td></tr>`).join('')}</tbody></table>
    </section>` : '';
}

/** HTML de la póliza. Con acciones=true la tabla de certificados de una madre incluye botones. */
function certificadoHTML(p, { acciones = false } = {}) {
    if (p.tipo === 'madre') return polizaMadreHTML(p, acciones);
    const certs = certificadosDe(p.id);
    const benefs = beneficiariosDe(p.id);
    return `<div class="cert">
        <h2>Póliza de seguro</h2>
        <div class="cert-num">${esc(p.numero)} ${p.estado === 'anulada' ? '<span class="badge danger">ANULADA</span>' : ''}</div>
        <p class="muted">${esc(p.ramo.nombre)} · ${esc(p.producto.nombre)} (${esc(p.producto.codigo)}) · Emitida el ${fecha(p.fechaEmision)}</p>

        ${seccionTomador(p.tomador)}

        ${certs.length ? `<section><h4>Certificados / Asegurados</h4>
            <table>
                <thead><tr><th>Certificado</th><th>Asegurado</th><th>Documento</th><th class="num">Suma asegurada</th></tr></thead>
                <tbody>${certs.map(c => `<tr><td>${esc(c.numero)}</td><td>${esc(c.nombre)}</td><td>${esc(c.doc)}</td><td class="num">${money(c.suma, p.moneda)}</td></tr>`).join('')}</tbody>
            </table>
        </section>` : ''}

        ${benefs.length ? `<section><h4>Beneficiarios</h4>${tablaBeneficiarios(benefs)}</section>` : ''}

        <section><h4>Condiciones</h4>
            <dl class="kv">
                <dt>Vigencia</dt><dd>${fecha(p.desde)} al ${fecha(p.hasta)}</dd>
                <dt>Moneda</dt><dd>${textoMoneda(p)}</dd>
                <dt>Suma asegurada</dt><dd>${money(p.suma, p.moneda)}</dd>
                ${p.carteraNombre ? `<dt>Cartera</dt><dd>${esc(p.carteraNombre)} · ${textoTarifa(productoById(p.productoId), p.carteraTasa, p.moneda)}</dd>` : ''}
                <dt>Prima </dt><dd>${money(p.prima, p.moneda)}</dd>
                ${p.ajusteLabel ? `<dt>${esc(p.ajusteLabel)}</dt><dd>${money(p.ajuste, p.moneda)}</dd>` : ''}
                <dt class="total">Prima total</dt><dd class="total">${money(p.primaTotal, p.moneda)}</dd>
                <dt>Forma de pago</dt><dd>${textoPago(p)}</dd>
            </dl>
        </section>

        ${seccionCoberturas(p)}

        ${p.cronograma.length ? `<section><h4>Plan de pagos</h4>${tablaCronograma(p.cronograma, p.moneda)}</section>` : ''}
    </div>`;
}

function polizaMadreHTML(p, acciones) {
    const certs = certificadosDe(p.id);
    const vigentes = certs.filter(c => c.estado !== 'anulada');
    const puedeAgregar = acciones && p.estado !== 'anulada';
    return `<div class="cert">
        <h2>Póliza colectiva (madre)</h2>
        <div class="cert-num">${esc(p.numero)} ${p.estado === 'anulada' ? '<span class="badge danger">ANULADA</span>' : ''}</div>
        <p class="muted">${esc(p.ramo.nombre)} · ${esc(p.producto.nombre)} (${esc(p.producto.codigo)}) · Emitida el ${fecha(p.fechaEmision)}</p>

        ${seccionTomador(p.tomador)}

        <section><h4>Condiciones</h4>
            <dl class="kv">
                <dt>Vigencia</dt><dd>${fecha(p.desde)} al ${fecha(p.hasta)}</dd>
                <dt>Moneda</dt><dd>${textoMoneda(p)}</dd>
                <dt>Forma de pago</dt><dd>${textoPago(p)}</dd>
                <dt>Certificados vigentes</dt><dd>${vigentes.length}</dd>
                <dt>Suma asegurada total</dt><dd>${money(p.suma, p.moneda)}</dd>
                <dt class="total">Prima total</dt><dd class="total">${money(p.primaTotal, p.moneda)}</dd>
            </dl>
        </section>

        ${seccionCarterasMadre(p, acciones)}

        <section>
            <div class="row" style="justify-content:space-between">
                <h4 style="margin:0">Certificados</h4>
                ${puedeAgregar ? '<button type="button" class="btn small primary" data-cert-nuevo>+ Nuevo certificado</button>' : ''}
            </div>
            ${certs.length ? `<div class="table-wrap" style="margin-top:8px"><table>
                <thead><tr><th>Certificado</th><th>Asegurado</th><th>Cartera</th><th>Vigencia</th><th class="num">Suma asegurada</th><th class="num">Prima</th><th>Estado</th>${acciones ? '<th></th>' : ''}</tr></thead>
                <tbody>${certs.map(c => `<tr>
                    <td>${esc(c.numero)}</td>
                    <td>${esc(c.nombre)}<div class="muted">${esc(c.doc)}</div></td>
                    <td>${c.carteraNombre ? `${esc(c.carteraNombre)}<div class="muted">${textoTarifa(productoById(p.productoId), c.carteraTasa, p.moneda)}</div>` : '—'}</td>
                    <td>${fecha(c.desde)} – ${fecha(c.hasta)}</td>
                    <td class="num">${money(c.suma, p.moneda)}</td>
                    <td class="num">${money(c.prima, p.moneda)}</td>
                    <td>${badgeEstado(c.estado, 'Excluido')}</td>
                    ${acciones ? `<td class="actions">
                        <button type="button" class="btn small" data-cert-ver="${esc(c.id)}">Ver</button>
                        ${c.estado !== 'anulada' && p.estado !== 'anulada' ? `<button type="button" class="btn small danger" data-cert-excluir="${esc(c.id)}">Excluir</button>` : ''}
                    </td>` : ''}
                </tr>`).join('')}</tbody>
            </table></div>` : '<p class="muted">Aún no hay certificados.</p>'}
        </section>

        ${seccionCoberturas(p)}
    </div>`;
}

function seccionCarterasMadre(p, acciones) {
    const carts = carterasPoliza(p.id, false);
    const prod = productoById(p.productoId);
    const editable = acciones && p.estado !== 'anulada';
    if (!carts.length && !editable) return '';
    return `<section>
        <div class="row" style="justify-content:space-between">
            <h4 style="margin:0">Carteras de la póliza</h4>
            ${editable ? '<button type="button" class="btn small" data-cart-nueva>+ Nueva cartera</button>' : ''}
        </div>
        ${carts.length ? `<div class="table-wrap" style="margin-top:8px"><table>
            <thead><tr><th>Cartera</th><th>Tarifa</th><th class="num">Certificados vigentes</th><th>Estado</th>${editable ? '<th></th>' : ''}</tr></thead>
            <tbody>${carts.map(c => `<tr>
                <td>${esc(c.nombre)}</td>
                <td>${textoTarifa(prod, valorCartera(prod, c), p.moneda)}</td>
                <td class="num">${certificadosVigentes(p.id).filter(x => x.carteraId === c.id).length}</td>
                <td>${c.activo ? '<span class="badge ok">Activa</span>' : '<span class="badge off">Inactiva</span>'}</td>
                ${editable ? `<td class="actions"><button type="button" class="btn small" data-cart-edit="${esc(c.id)}">Editar</button></td>` : ''}
            </tr>`).join('')}</tbody>
        </table></div>` : '<p class="muted">Sin carteras: los certificados usan la tarifa del producto.</p>'}
    </section>`;
}

/** Crear o editar una cartera de la póliza madre. Los certificados ya emitidos conservan la tasa que tenían. */
function formCarteraMadre(p, cartera, onSaved) {
    const prod = productoById(p.productoId);
    if (!prod) return alert('El producto de esta póliza ya no existe.');
    const fija = prod.prima.tipo === 'fija';
    const c = cartera || { nombre: '', tasa: prod.prima.tasa, primaFija: prod.prima.montoFijo, activo: true };
    openModal({
        title: cartera ? `Editar cartera · ${p.numero}` : `Nueva cartera · ${p.numero}`,
        body: `
            <label>Nombre<input name="nombre" value="${esc(c.nombre)}" required></label>
            ${fija
                ? `<label>Prima fija (${esc(MONEDAS[prod.monedaRef]?.simbolo ?? prod.monedaRef)})<input name="valor" type="number" step="0.01" min="0.01" value="${c.primaFija}" required></label>`
                : `<label>Tasa (%)<input name="valor" type="number" step="0.0001" min="0.0001" value="${c.tasa}" required></label>`}
            <label class="check"><input type="checkbox" name="activo" ${c.activo ? 'checked' : ''}> Activa (disponible para nuevos certificados)</label>
            ${cartera ? '<p class="hint">Cambiar la tarifa solo afecta a los certificados que se emitan desde ahora.</p>' : ''}`,
        onSubmit: async body => {
            const nombre = $('[name=nombre]', body).value.trim();
            const valor = parseFloat($('[name=valor]', body).value) || 0;
            if (!nombre) return 'El nombre es obligatorio.';
            if (valor <= 0) return fija ? 'La prima fija debe ser mayor a 0.' : 'La tasa debe ser mayor a 0.';
            if (carterasPoliza(p.id, false).some(x => x.nombre.toUpperCase() === nombre.toUpperCase() && x.id !== cartera?.id)) return 'Ya existe una cartera con ese nombre en la póliza.';
            const saved = await api.post('upsert', {
                sheet: 'carteras',
                record: carteraToRow({
                    id: cartera?.id || '', productoId: p.productoId, polizaId: p.id, nombre,
                    tasa: fija ? c.tasa || 0 : valor, primaFija: fija ? valor : c.primaFija || 0,
                    activo: $('[name=activo]', body).checked,
                }),
            });
            upsertLocal(state.carteras, carteraFromRow(saved));
            onSaved?.();
            toast('Cartera guardada');
        },
    });
}

/** Certificado individual dentro de una póliza madre. */
function certificadoMadreHTML(p, c) {
    const benefs = beneficiariosCert(c.id);
    return `<div class="cert">
        <h2>Certificado de cobertura</h2>
        <div class="cert-num">${esc(c.numero)} ${c.estado === 'anulada' ? '<span class="badge danger">EXCLUIDO</span>' : ''}</div>
        <p class="muted">Póliza madre ${esc(p.numero)} · ${esc(p.producto.nombre)} · Tomador: ${esc(p.tomador.nombre)}</p>
        <section><h4>Asegurado</h4>
            <dl class="kv">
                <dt>Nombre</dt><dd>${esc(c.nombre)}</dd>
                <dt>Documento</dt><dd>${esc(c.doc)}</dd>
            </dl>
        </section>
        ${benefs.length ? `<section><h4>Beneficiarios</h4>${tablaBeneficiarios(benefs)}</section>` : ''}
        <section><h4>Condiciones</h4>
            <dl class="kv">
                <dt>Vigencia</dt><dd>${fecha(c.desde)} al ${fecha(c.hasta)}</dd>
                <dt>Moneda</dt><dd>${textoMoneda(p)}</dd>
                <dt>Suma asegurada</dt><dd>${money(c.suma, p.moneda)}</dd>
                ${c.carteraNombre ? `<dt>Cartera</dt><dd>${esc(c.carteraNombre)} · ${textoTarifa(productoById(p.productoId), c.carteraTasa, p.moneda)}</dd>` : ''}
                <dt>Prima </dt><dd>${money(c.prima, p.moneda)}</dd>
                ${c.ajuste ? `<dt>${c.ajuste < 0 ? 'Descuento' : 'Recargo'}</dt><dd>${money(c.ajuste, p.moneda)}</dd>` : ''}
                <dt class="total">Prima total</dt><dd class="total">${money(c.prima, p.moneda)}</dd>
                <dt>Forma de pago</dt><dd>${textoPago(p)}</dd>
            </dl>
        </section>
        ${seccionCoberturas(p)}
        ${c.cronograma.length ? `<section><h4>Plan de pagos</h4>${tablaCronograma(c.cronograma, p.moneda)}</section>` : ''}
    </div>`;
}

function imprimir(html) {
    $('#print-area').innerHTML = html;
    window.print();
}

function verPoliza(p) {
    const dlg = openModal({
        title: `Póliza ${p.numero}`,
        wide: p.tipo === 'madre',
        body: '<div data-detalle></div><div class="row" style="margin-top:16px"><button type="button" class="btn" data-imprimir>Imprimir</button></div>',
        readonly: true,
        onOpen: body => {
            const pintar = () => { $('[data-detalle]', body).innerHTML = certificadoHTML(p, { acciones: true }); };
            pintar();
            body.addEventListener('click', async e => {
                if (e.target.closest('[data-imprimir]')) imprimir(certificadoHTML(p));
                if (e.target.closest('[data-cert-nuevo]')) formCertificado(p, pintar);
                if (e.target.closest('[data-cart-nueva]')) formCarteraMadre(p, null, pintar);
                const ce = e.target.closest('[data-cart-edit]');
                if (ce) formCarteraMadre(p, carteraById(ce.dataset.cartEdit), pintar);
                const ver = e.target.closest('[data-cert-ver]');
                if (ver) verCertificado(p, state.certificados.find(c => c.id === ver.dataset.certVer));
                const exc = e.target.closest('[data-cert-excluir]');
                if (exc) {
                    const c = state.certificados.find(x => x.id === exc.dataset.certExcluir);
                    if (!confirm(`¿Excluir el certificado ${c.numero} de ${c.nombre}?`)) return;
                    try {
                        const res = await conCarga('Excluyendo…', () => api.post('excluir', { id: c.id }));
                        c.estado = 'anulada';
                        aplicarTotales(p, res.totales);
                        pintar();
                        renderPolizas();
                    } catch (err) {
                        alert(err.message);
                    }
                }
            });
        },
    });
    return dlg;
}

function verCertificado(p, c) {
    openModal({
        title: `Certificado ${c.numero}`,
        body: certificadoMadreHTML(p, c) + '<div class="row" style="margin-top:16px"><button type="button" class="btn" data-imprimir>Imprimir certificado</button></div>',
        readonly: true,
        onOpen: body => {
            $('[data-imprimir]', body).addEventListener('click', () => imprimir(certificadoMadreHTML(p, c)));
        },
    });
}

function aplicarTotales(p, t) {
    p.suma = num(t.suma_asegurada);
    p.prima = num(t.prima_neta);
    p.ajuste = num(t.ajuste);
    p.primaTotal = num(t.prima_total);
}

/** Formulario para agregar un certificado (asegurado + suma + inclusión + beneficiarios) a una póliza madre. */
function formCertificado(p, onSaved) {
    const prod = productoById(p.productoId);
    if (!prod) return alert('El producto de esta póliza ya no existe.');
    const regla = prod.beneficiarios;
    const { min, max } = limitesSuma(prod, p.moneda);
    const fija = max && min === max;
    const vigenciaProducto = desde => sumarMeses(desde, prod.vigenciaMeses);
    const carts = carterasPoliza(p.id);
    let pickerAseg, benefs;
    let hastaManual = false; // mientras el usuario no edite la fecha hasta, se recalcula al cambiar desde

    const leer = body => ({
        aseguradoId: pickerAseg.value,
        suma: parseFloat($('[name=suma]', body).value),
        desde: $('[name=desde]', body).value,
        hasta: $('[name=hasta]', body).value,
        cartera: carts.length ? carteraById($('[name=cartera]', body).value) || null : null,
        beneficiarios: benefs ? benefs.values() : [],
    });

    const calcular = body => {
        if (!hastaManual && $('[name=desde]', body).value) $('[name=hasta]', body).value = vigenciaProducto($('[name=desde]', body).value);
        const d = leer(body);
        // La tarifa del producto corresponde a su vigencia estándar; un plazo distinto paga a prorrata
        const diasTot = d.desde ? diasEntre(d.desde, vigenciaProducto(d.desde)) : 0;
        const dias = d.desde && d.hasta ? diasEntre(d.desde, d.hasta) : 0;
        let r;
        if (!d.desde || !d.hasta) r = { error: 'Indica la vigencia desde y hasta del certificado.' };
        else if (d.hasta <= d.desde) r = { error: 'La vigencia hasta debe ser posterior a la vigencia desde.' };
        else if (carts.length && !d.cartera) r = { error: 'Selecciona la cartera del certificado.' };
        else r = calcularPrima(prod, { moneda: p.moneda, suma: d.suma, modalidad: p.modalidad, cuotas: p.cuotas, desde: d.desde, hasta: d.hasta, factor: dias / diasTot, cartera: d.cartera });
        if (!r.error) {
            const dup = certificadosVigentes(p.id).some(c => c.clienteId === d.aseguradoId);
            r.error = !d.aseguradoId ? 'Selecciona el asegurado.'
                : dup ? 'Este cliente ya tiene un certificado vigente en la póliza.'
                : validarBeneficiarios(regla, d.beneficiarios, d.aseguradoId);
            r.soloValidacion = true;
        }
        if (benefs) pintarTotalBenef($('[data-benef-total]', body), d.beneficiarios);
        const res = $('[data-resumen]', body);
        if (r.error && !r.soloValidacion) {
            res.innerHTML = `<p class="muted">${esc(r.error)}</p>`;
        } else {
            res.innerHTML = (r.error ? `<p class="error">${esc(r.error)}</p>` : '') + `
                <dl class="kv">
                    ${d.cartera ? `<dt>Cartera</dt><dd>${esc(d.cartera.nombre)} · ${textoTarifa(prod, valorCartera(prod, d.cartera), p.moneda)}</dd>` : `<dt>Tarifa</dt><dd>${textoTarifa(prod, prod.prima.tipo === 'fija' ? prod.prima.montoFijo : prod.prima.tasa, prod.monedaRef)} (producto)</dd>`}
                    ${prod.prima.tipo === 'tasa' && prod.prima.minima > 0 ? `<dt>Prima mínima</dt><dd>${money(convertir(prod.prima.minima, prod.monedaRef, p.moneda), p.moneda)}</dd>` : ''}
                    <dt>Plazo</dt><dd>${dias} días${dias !== diasTot ? ` · prorrata ${fmtTc(round2(dias / diasTot * 100))}% de ${prod.vigenciaMeses} meses` : ''}</dd>
                    ${lineasPrima(prod, r, p.moneda, d.cartera)}
                    ${r.ajusteLabel ? `<dt>${esc(r.ajusteLabel)}</dt><dd>${money(r.ajuste, p.moneda)}</dd>` : ''}
                    <dt class="total">Prima del certificado</dt><dd class="total">${money(r.primaTotal, p.moneda)}</dd>
                </dl>
                ${tablaCronograma(r.cronograma, p.moneda)}`;
        }
        return { d, r };
    };

    openModal({
        title: `Nuevo certificado · ${p.numero}`,
        submitLabel: 'Emitir certificado',
        body: `
            <p class="muted" style="margin:0 0 12px">${esc(p.producto.nombre)} · Tomador: ${esc(p.tomador.nombre)} · Vigencia ${fecha(p.desde)} al ${fecha(p.hasta)} · ${textoPago(p)}</p>
            ${carts.length ? `<label>Cartera
                <select name="cartera" required>
                    <option value="">— Selecciona —</option>
                    ${carts.map(c => `<option value="${esc(c.id)}">${esc(c.nombre)} · ${textoTarifa(prod, valorCartera(prod, c), p.moneda)}</option>`).join('')}
                </select>
            </label>` : ''}
            <div class="field-label">Asegurado</div>
            <div data-aseg class="picker-host"></div>
            <div class="grid2" style="margin-top:12px">
                <label>Suma asegurada (${esc(MONEDAS[p.moneda]?.simbolo ?? p.moneda)})<input name="suma" type="number" step="0.01" min="${min}" ${max ? `max="${max}"` : ''} value="${fija ? min : ''}" ${fija ? 'readonly' : ''} required></label>
                <label>Vigencia desde<input name="desde" type="date" value="${hoyISO()}" required></label>
                <label>Vigencia hasta<input name="hasta" type="date" value="${vigenciaProducto(hoyISO())}" required></label>
            </div>
            <p class="hint" style="margin-top:-4px">La vigencia del certificado es independiente de la póliza madre. Por defecto dura lo que el producto (${prod.vigenciaMeses} meses).</p>
            <p class="hint" style="margin-top:-4px">${fija ? `Suma fija del producto: ${money(min, p.moneda)}` : `Rango permitido: ${money(min, p.moneda)}${max ? ` a ${money(max, p.moneda)}` : ' en adelante'}`}</p>
            ${regla !== 'no' ? `
                <div class="field-label" style="margin-top:12px">Beneficiarios ${regla === 'requerido' ? '(obligatorio)' : '(opcional)'}</div>
                <div data-benef-list></div>
                <div class="row">
                    <button type="button" class="btn small" data-benef-add>+ Agregar beneficiario</button>
                    <span data-benef-total class="hint" style="margin:0"></span>
                </div>` : ''}
            <div class="card" style="margin:14px 0 0" data-resumen></div>`,
        onOpen: body => {
            const recalc = () => calcular(body);
            pickerAseg = crearPicker($('[data-aseg]', body), { onChange: recalc });
            if (regla !== 'no') {
                benefs = crearBeneficiarios($('[data-benef-list]', body), recalc);
                $('[data-benef-add]', body).addEventListener('click', () => benefs.add());
                if (regla === 'requerido') benefs.add();
            }
            $('[name=hasta]', body).addEventListener('input', () => { hastaManual = true; });
            body.addEventListener('input', recalc);
            body.addEventListener('change', recalc);
            recalc();
        },
        onSubmit: async body => {
            const { d, r } = calcular(body);
            if (r.error) return r.error;
            const res = await api.post('certificado', {
                poliza_id: p.id,
                certificado: {
                    asegurado_id: d.aseguradoId,
                    suma_asegurada: d.suma,
                    vigencia_desde: d.desde,
                    vigencia_hasta: d.hasta,
                    prima_neta: r.prima,
                    ajuste: r.ajuste,
                    prima: r.primaTotal,
                    cronograma: JSON.stringify(r.cronograma),
                    cartera_id: d.cartera?.id || '',
                },
                beneficiarios: d.beneficiarios.map(b => ({ cliente_id: b.clienteId, parentesco: b.parentesco, porcentaje: b.porcentaje })),
            });
            state.certificados.push(certificadoFromRow(res.certificado));
            state.beneficiarios.push(...res.beneficiarios.map(beneficiarioFromRow));
            aplicarTotales(p, res.totales);
            onSaved?.();
            renderPolizas();
            renderClientes();
            toast(`Certificado ${res.certificado.numero_certificado} emitido`);
        },
    });
}

$('#buscar-poliza').addEventListener('input', renderPolizas);
$('#lista-polizas').addEventListener('click', async e => {
    const ver = e.target.closest('[data-pol-ver]');
    const anular = e.target.closest('[data-pol-anular]');
    if (ver) verPoliza(state.polizas.find(p => p.id === ver.dataset.polVer));
    if (anular) {
        const p = state.polizas.find(x => x.id === anular.dataset.polAnular);
        if (!confirm(`¿Anular la póliza ${p.numero}?`)) return;
        try {
            const res = await conCarga('Anulando…', () => api.post('anular', { id: p.id }));
            p.estado = 'anulada';
            p.fechaAnulacion = res.fecha_anulacion;
            certificadosDe(p.id).forEach(c => { c.estado = 'anulada'; });
            renderPolizas();
        } catch (err) {
            alert(err.message);
        }
    }
});

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */
function renderConfig() {
    const c = getConexion();
    const fc = $('#form-conexion').elements;
    if (document.activeElement !== fc.url) fc.url.value = c.url || '';
    if (document.activeElement !== fc.key) fc.key.value = c.key || '';
    renderMonedas();
    $('#btn-demo').disabled = !conectado || (state.ramos.length > 0 && state.clientes.length > 0);
}

$('#link-hoja').href = SHEET_URL;

$('#form-conexion').addEventListener('submit', async e => {
    e.preventDefault();
    const el = e.target.elements;
    setConexion({ url: el.url.value.trim(), key: el.key.value });
    try {
        await recargar();
        toast('Conectado a la hoja');
    } catch (err) {
        alert(`No se pudo conectar: ${err.message}`);
    }
});

function renderMonedas() {
    const cont = $('#lista-monedas');
    if (!conectado) { cont.innerHTML = ''; return; }
    cont.innerHTML = `<div class="table-wrap"><table>
        <thead><tr><th>Código</th><th>Moneda</th><th class="num">Tipo de cambio (Bs)</th><th>Estado</th><th></th></tr></thead>
        <tbody>${Object.entries(MONEDAS).map(([k, m]) => `<tr>
            <td><strong>${esc(k)}</strong></td>
            <td>${esc(m.nombre)} <span class="muted">(${esc(m.simbolo)})</span></td>
            <td class="num">${m.base ? '1 <span class="badge">base</span>' : fmtTc(m.tc)}</td>
            <td>${m.activo ? '<span class="badge ok">Activa</span>' : '<span class="badge off">Inactiva</span>'}</td>
            <td class="actions">
                ${m.id ? `<button class="btn small" data-mon-edit="${esc(k)}">Editar</button>` : ''}
                ${m.id && !m.base ? `<button class="btn small danger" data-mon-del="${esc(k)}">Eliminar</button>` : ''}
            </td>
        </tr>`).join('')}</tbody>
    </table></div>`;
}

function formMoneda(codigo) {
    const m = codigo ? MONEDAS[codigo] : { nombre: '', simbolo: '', tc: 1, base: false, activo: true };
    openModal({
        title: codigo ? `Editar moneda ${codigo}` : 'Nueva moneda',
        body: `
            <div class="grid3">
                <label>Código (ISO)<input name="codigo" value="${esc(codigo || '')}" maxlength="3" required placeholder="EUR" ${codigo ? 'readonly' : ''}></label>
                <label>Nombre<input name="nombre" value="${esc(m.nombre)}" required placeholder="Euros"></label>
                <label>Símbolo<input name="simbolo" value="${esc(m.simbolo)}" required placeholder="€"></label>
            </div>
            <label>Tipo de cambio: cuántos Bs vale 1 unidad
                <input name="tc" type="number" step="0.000001" min="0.000001" value="${m.tc}" ${m.base ? 'readonly' : ''} required>
            </label>
            ${m.base ? '<p class="hint">Es la moneda base: su tipo de cambio siempre es 1.</p>' : ''}
            <label class="check"><input type="checkbox" name="activo" ${m.activo ? 'checked' : ''} ${m.base ? 'disabled' : ''}> Activa (disponible en productos y emisión)</label>`,
        onSubmit: async body => {
            const v = n => $(`[name=${n}]`, body).value.trim();
            const cod = v('codigo').toUpperCase();
            const tc = parseFloat(v('tc'));
            if (!/^[A-Z]{3}$/.test(cod)) return 'El código debe tener 3 letras (ej. EUR, PEN, BRL).';
            if (!codigo && MONEDAS[cod]) return `La moneda ${cod} ya existe.`;
            if (!v('nombre') || !v('simbolo')) return 'Nombre y símbolo son obligatorios.';
            if (!(tc > 0)) return 'El tipo de cambio debe ser mayor a 0.';
            await api.post('upsert', {
                sheet: 'monedas',
                record: { id: m.id || '', codigo: cod, nombre: v('nombre'), simbolo: v('simbolo'), tipo_cambio: m.base ? 1 : tc, es_base: !!m.base, activo: m.base || $('[name=activo]', body).checked },
            });
            await recargar();
            toast(`Moneda ${cod} guardada`);
        },
    });
}

$('#btn-nueva-moneda').addEventListener('click', () => {
    if (!conectado) return;
    formMoneda();
});
$('#lista-monedas').addEventListener('click', async e => {
    const edit = e.target.closest('[data-mon-edit]');
    const del = e.target.closest('[data-mon-del]');
    if (edit) formMoneda(edit.dataset.monEdit);
    if (del) {
        const cod = del.dataset.monDel;
        if (!confirm(`¿Eliminar la moneda ${cod}?`)) return;
        try {
            await conCarga('Eliminando…', () => api.post('delete', { sheet: 'monedas', id: MONEDAS[cod].id }));
            await recargar();
        } catch (err) {
            alert(err.message);
        }
    }
});

$('#btn-recargar').addEventListener('click', () => recargar().catch(err => toast(err.message)));

function productosDemo(ids) {
    const base = { activo: true, vigenciaMeses: 12, descripcion: '' };
    return [
        {
            ...base, ramoId: ids.AUT, codigo: 'AUT-TR', nombre: 'Automóvil Todo Riesgo',
            descripcion: 'Cobertura amplia para vehículos particulares',
            monedas: ['BOB', 'USD'], monedaRef: 'USD',
            prima: { tipo: 'tasa', tasa: 3.5, montoFijo: 0, minima: 250 },
            sumaMin: 5000, sumaMax: 150000,
            coberturas: [
                { nombre: 'Daños propios', detalle: 'Hasta la suma asegurada' },
                { nombre: 'Responsabilidad civil', detalle: '$us 20.000' },
                { nombre: 'Robo total', detalle: 'Hasta la suma asegurada' },
            ],
            pago: {
                medios: ['efectivo', 'transferencia', 'qr', 'tarjeta'],
                contado: { habilitado: true, descuento: 5 },
                credito: { habilitado: true, cuotas: [3, 6, 10, 12], recargo: 4, inicial: 20 },
            },
        },
        {
            ...base, ramoId: ids.SAL, codigo: 'SAL-IND', nombre: 'Salud Individual Plan Plata',
            descripcion: 'Plan individual con red de clínicas',
            monedas: ['BOB'], monedaRef: 'BOB',
            prima: { tipo: 'fija', tasa: 0, montoFijo: 4200, minima: 0 },
            sumaMin: 70000, sumaMax: 70000,
            coberturas: [
                { nombre: 'Hospitalización', detalle: '100%' },
                { nombre: 'Consultas ambulatorias', detalle: '80%' },
            ],
            pago: {
                medios: ['efectivo', 'qr', 'debito'],
                contado: { habilitado: true, descuento: 0 },
                credito: { habilitado: true, cuotas: [12], recargo: 0, inicial: 0 },
            },
        },
        {
            ...base, ramoId: ids.INC, codigo: 'INC-HOG', nombre: 'Hogar Protegido',
            descripcion: 'Incendio, rayo y explosión para viviendas',
            monedas: ['USD'], monedaRef: 'USD',
            prima: { tipo: 'tasa', tasa: 0.25, montoFijo: 0, minima: 80 },
            sumaMin: 10000, sumaMax: 500000,
            coberturas: [{ nombre: 'Incendio y rayo', detalle: 'Hasta la suma asegurada' }],
            pago: {
                medios: ['transferencia', 'cheque'],
                contado: { habilitado: true, descuento: 0 },
                credito: { habilitado: false, cuotas: [], recargo: 0, inicial: 0 },
            },
        },
        {
            ...base, ramoId: ids.VID, codigo: 'VID-TEMP', nombre: 'Vida Temporal Anual',
            descripcion: 'Indemnización a beneficiarios por fallecimiento del asegurado',
            monedas: ['BOB', 'USD'], monedaRef: 'USD',
            prima: { tipo: 'tasa', tasa: 0.6, montoFijo: 0, minima: 60 },
            sumaMin: 5000, sumaMax: 100000,
            beneficiarios: 'requerido',
            coberturas: [
                { nombre: 'Muerte por cualquier causa', detalle: '100% suma asegurada' },
                { nombre: 'Invalidez total y permanente', detalle: '100% suma asegurada' },
            ],
            pago: {
                medios: ['efectivo', 'qr', 'debito'],
                contado: { habilitado: true, descuento: 3 },
                credito: { habilitado: true, cuotas: [4, 12], recargo: 2, inicial: 0 },
            },
        },
        {
            ...base, ramoId: ids.VID, codigo: 'DES-COL', nombre: 'Desgravamen Hipotecario Colectivo',
            descripcion: 'Póliza madre para cartera de créditos: un certificado por prestatario',
            tipoPoliza: 'colectiva',
            monedas: ['BOB', 'USD'], monedaRef: 'USD',
            prima: { tipo: 'tasa', tasa: 0.45, montoFijo: 0, minima: 10 },
            sumaMin: 1000, sumaMax: 300000,
            beneficiarios: 'opcional',
            coberturas: [{ nombre: 'Muerte e invalidez total', detalle: 'Saldo insoluto de la deuda' }],
            pago: {
                medios: ['transferencia', 'debito'],
                contado: { habilitado: true, descuento: 0 },
                credito: { habilitado: true, cuotas: [12], recargo: 0, inicial: 0 },
            },
        },
    ].map(p => ({ beneficiarios: 'no', tipoPoliza: 'individual', ...p }));
}

const CLIENTES_DEMO = [
    { tipoDoc: 'CI', doc: '4567890', expedido: 'LP', nombres: 'Juan Carlos', apellidos: 'Pérez Mamani', telefono: '70012345', email: 'juan.perez@example.com', fechaNacimiento: '1985-04-12', direccion: 'Av. Arce 123, La Paz' },
    { tipoDoc: 'CI', doc: '5678901', expedido: 'LP', nombres: 'María Elena', apellidos: 'Quispe de Pérez', telefono: '70023456', email: 'maria.quispe@example.com', fechaNacimiento: '1988-09-30', direccion: 'Av. Arce 123, La Paz' },
    { tipoDoc: 'CI', doc: '9876543', expedido: 'SC', nombres: 'Lucía', apellidos: 'Pérez Quispe', telefono: '', email: '', fechaNacimiento: '2012-02-15', direccion: '' },
    { tipoDoc: 'NIT', doc: '1023456027', expedido: '', nombres: 'Comercial', apellidos: 'Andina S.R.L.', telefono: '22445566', email: 'contacto@andina.example.com', fechaNacimiento: '', direccion: 'Calle Comercio 45, Cochabamba' },
];

$('#btn-demo').addEventListener('click', async () => {
    try {
        await conCarga('Cargando datos de ejemplo…', async () => {
            if (!state.ramos.length) {
                const ramos = await api.post('batch', {
                    ops: [
                        { codigo: 'AUT', nombre: 'Automotores', descripcion: 'Seguros de vehículos' },
                        { codigo: 'SAL', nombre: 'Salud', descripcion: 'Gastos médicos y hospitalización' },
                        { codigo: 'INC', nombre: 'Incendio y aliados', descripcion: 'Inmuebles y contenidos' },
                        { codigo: 'VID', nombre: 'Vida', descripcion: 'Seguros de personas' },
                    ].map(r => ({ sheet: 'ramos', record: ramoToRow({ ...r, activo: true }) })),
                });
                const ids = Object.fromEntries(ramos.map(r => [r.codigo, r.id]));
                const prods = await api.post('batch', { ops: productosDemo(ids).map(p => ({ sheet: 'productos', record: productoToRow(p) })) });
                const pid = Object.fromEntries(prods.map(p => [p.codigo, p.id]));
                const carteras = [
                    ['AUT-TR', 'Particular', 3.5], ['AUT-TR', 'Taxi / servicio público', 5.2], ['AUT-TR', 'Flota empresarial', 3],
                    ['DES-COL', 'Hipotecario de vivienda', 0.45], ['DES-COL', 'Consumo', 0.6], ['DES-COL', 'PyME', 0.75],
                ];
                await api.post('batch', { ops: carteras.map(([cod, nombre, tasa]) => ({ sheet: 'carteras', record: carteraToRow({ productoId: pid[cod], nombre, tasa, primaFija: 0, activo: true }) })) });
            }
            if (!state.clientes.length) {
                await api.post('batch', { ops: CLIENTES_DEMO.map(c => ({ sheet: 'clientes', record: clienteToRow({ ...c, activo: true }) })) });
            }
        });
        await recargar();
        toast('Datos de ejemplo cargados en la hoja');
    } catch (err) {
        alert(err.message);
    }
});

/* =========================================================
   Inicio
   ========================================================= */
if (getConexion().url) {
    recargar().catch(() => showTab('config'));
} else {
    renderAll();
    showTab('config');
}
