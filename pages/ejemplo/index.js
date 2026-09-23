'use strict';

/* =========================================================
   Catálogos fijos
   ========================================================= */
const MONEDAS = {
    BOB: { nombre: 'Bolivianos', simbolo: 'Bs' },
    USD: { nombre: 'Dólares', simbolo: '$us' },
};

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
const REGLAS_BENEF = { no: 'No aplica', opcional: 'Opcionales', requerido: 'Obligatorios' };

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1YPWC66ecbzcHsILRlAHJNe-0rfyGxhUlTV2HP5OyK18/edit';
const CONN_KEY = 'emision-polizas-conexion';
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbw3_GFuoKPNpOOw2nEdU7zoqG4mJ6h48OgF0Nw5GEWBMrccztKJp-W6HXeMBYd02YGE/exec';

/* =========================================================
   Estado (espejo en memoria de la hoja)
   ========================================================= */
let state = { config: { tipoCambio: 6.96 }, ramos: [], productos: [], clientes: [], polizas: [], certificados: [], beneficiarios: [] };
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
    monedaRef: MONEDAS[str(r.moneda_ref)] ? str(r.moneda_ref) : 'BOB',
    prima: { tipo: str(r.prima_tipo) === 'fija' ? 'fija' : 'tasa', tasa: num(r.tasa), montoFijo: num(r.prima_fija), minima: num(r.prima_minima) },
    sumaMin: num(r.suma_min),
    sumaMax: num(r.suma_max),
    vigenciaMeses: parseInt(r.vigencia_meses, 10) || 12,
    coberturas: json(r.coberturas, []),
    beneficiarios: REGLAS_BENEF[str(r.beneficiarios)] ? str(r.beneficiarios) : 'no',
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
});

const polizaFromRow = r => ({
    id: str(r.id),
    numero: str(r.numero),
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
    primaNeta: num(r.prima_neta),
    ajuste: num(r.ajuste),
    ajusteLabel: str(r.ajuste_concepto),
    primaTotal: num(r.prima_total),
    tipoCambio: num(r.tipo_cambio),
    estado: str(r.estado) || 'vigente',
    fechaEmision: str(r.fecha_emision),
    fechaAnulacion: str(r.fecha_anulacion),
    coberturas: json(r.coberturas, []),
    cronograma: json(r.cronograma, []),
});

const certificadoFromRow = r => ({
    id: str(r.id),
    polizaId: str(r.poliza_id),
    numero: str(r.numero_certificado),
    clienteId: str(r.asegurado_id),
    nombre: str(r.asegurado_nombre),
    doc: str(r.asegurado_doc),
    suma: num(r.suma_asegurada),
    prima: num(r.prima),
    estado: str(r.estado),
});

const beneficiarioFromRow = r => ({
    id: str(r.id),
    polizaId: str(r.poliza_id),
    clienteId: str(r.cliente_id),
    nombre: str(r.nombre),
    doc: str(r.doc),
    parentesco: str(r.parentesco),
    porcentaje: num(r.porcentaje),
});

function aplicarDatos(data) {
    state.ramos = data.ramos.map(ramoFromRow);
    state.productos = data.productos.map(productoFromRow);
    state.polizas = data.polizas.map(polizaFromRow).sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));
    state.certificados = data.certificados.map(certificadoFromRow);
    state.clientes = (data.clientes || []).map(clienteFromRow).sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b)));
    state.beneficiarios = (data.beneficiarios || []).map(beneficiarioFromRow);
    const tc = num(data.config?.tipoCambio);
    state.config.tipoCambio = tc > 0 ? tc : 6.96;
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

function convertir(monto, de, a) {
    if (de === a) return monto;
    const tc = state.config.tipoCambio;
    if (de === 'USD' && a === 'BOB') return monto * tc;
    if (de === 'BOB' && a === 'USD') return monto / tc;
    return monto;
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
const modal = $('#modal');
let modalOnSubmit = null;

function openModal({ title, body, onSubmit, submitLabel = 'Guardar', readonly = false, onOpen }) {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = body;
    $('#modal-error').textContent = '';
    const foot = $('#modal-foot');
    foot.innerHTML = readonly
        ? '<button type="button" class="btn" data-close>Cerrar</button>'
        : `<button type="button" class="btn" data-close>Cancelar</button><button type="submit" class="btn primary">${esc(submitLabel)}</button>`;
    modalOnSubmit = onSubmit;
    modal.showModal();
    onOpen?.($('#modal-body'));
}

function closeModal() {
    modal.close();
    modalOnSubmit = null;
}

modal.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) closeModal();
});

$('#modal-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (!modalOnSubmit) return closeModal();
    const btn = $('#modal-foot [type=submit]');
    btn.disabled = true;
    try {
        // onSubmit devuelve un mensaje (error de validación) o nada si todo salió bien
        const error = await modalOnSubmit($('#modal-body'));
        if (error) $('#modal-error').textContent = error;
        else closeModal();
    } catch (err) {
        $('#modal-error').textContent = err.message;
    } finally {
        btn.disabled = false;
    }
});

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
                    <td><strong>${esc(p.nombre)}</strong><div class="muted">${esc(p.codigo)} · ${p.vigenciaMeses} meses</div></td>
                    <td>${esc(ramo?.nombre ?? '—')}</td>
                    <td>${p.monedas.map(m => `<span class="badge">${MONEDAS[m].simbolo}</span>`).join('')}</td>
                    <td>${prima}</td>
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
        pago: {
            medios: ['efectivo'],
            contado: { habilitado: true, descuento: 0 },
            credito: { habilitado: false, cuotas: [], recargo: 0, inicial: 0 },
        },
    };
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
                <label class="check"><input type="checkbox" name="activo" ${chk(p.activo)}> Activo (disponible para emitir)</label>
            </fieldset>

            <fieldset><legend>Monedas de emisión</legend>
                <div class="checks">
                    ${Object.entries(MONEDAS).map(([k, m]) => `<label class="check"><input type="checkbox" name="monedas" value="${k}" ${chk(p.monedas.includes(k))}> ${m.nombre} (${m.simbolo})</label>`).join('')}
                </div>
                <label>Moneda de referencia para los montos de este producto
                    <select name="monedaRef">
                        ${Object.entries(MONEDAS).map(([k, m]) => `<option value="${k}" ${k === p.monedaRef ? 'selected' : ''}>${m.nombre}</option>`).join('')}
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

            const saved = await api.post('upsert', { sheet: 'productos', record: productoToRow(data) });
            upsertLocal(state.productos, productoFromRow(saved));
            renderAll();
            toast('Producto guardado en la hoja');
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
let benefRows = [];

function addBenefRow() {
    const row = document.createElement('div');
    row.className = 'benef-row';
    row.innerHTML = `
        <div class="picker-host"></div>
        <select data-b="parentesco">${PARENTESCOS.map(p => `<option>${p}</option>`).join('')}</select>
        <input data-b="porcentaje" type="number" min="0" max="100" step="0.01" placeholder="%">
        <button type="button" class="btn small danger" data-b-del title="Quitar">✕</button>`;
    $('#em-benef-list').appendChild(row);
    const item = { row, picker: crearPicker($('.picker-host', row), { onChange: () => recalcular() }) };
    benefRows.push(item);
    // Reparte 100% en partes iguales entre todos los beneficiarios
    const parte = round2(100 / benefRows.length);
    benefRows.forEach((b, i) => {
        $('[data-b=porcentaje]', b.row).value = i === benefRows.length - 1 ? round2(100 - parte * (benefRows.length - 1)) : parte;
    });
    recalcular();
}

function clearBenefRows() {
    benefRows = [];
    $('#em-benef-list').innerHTML = '';
}

$('#btn-add-benef').addEventListener('click', addBenefRow);
$('#em-benef-list').addEventListener('click', e => {
    const del = e.target.closest('[data-b-del]');
    if (!del) return;
    const row = del.closest('.benef-row');
    benefRows = benefRows.filter(b => b.row !== row);
    row.remove();
    recalcular();
});

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
    const regla = p?.beneficiarios || 'no';
    $('#em-benef-block').hidden = regla === 'no';
    $('#em-benef-regla').textContent = regla === 'requerido' ? '(obligatorio)' : '(opcional)';
    if (regla === 'no') clearBenefRows();
    else if (regla === 'requerido' && !benefRows.length) addBenefRow();
    if (!p) {
        info.innerHTML = '';
        ['#em-moneda', '#em-modalidad', '#em-medio', '#em-cuotas'].forEach(s => { $(s).innerHTML = ''; });
        $('#em-suma-hint').textContent = '';
        recalcular();
        return;
    }
    info.innerHTML = `
        <p>${esc(p.descripcion)}</p>
        ${p.coberturas.length ? `<p><strong>Coberturas:</strong> ${p.coberturas.map(c => esc(c.nombre)).join(', ')}</p>` : ''}
        <p>Vigencia: ${p.vigenciaMeses} meses</p>`;

    setOptions($('#em-moneda'), p.monedas.map(m => [m, `${MONEDAS[m].nombre} (${MONEDAS[m].simbolo})`]));
    const mods = [];
    if (p.pago.contado.habilitado) mods.push(['contado', MODALIDADES.contado]);
    if (p.pago.credito.habilitado) mods.push(['credito', MODALIDADES.credito]);
    setOptions($('#em-modalidad'), mods);
    setOptions($('#em-medio'), p.pago.medios.map(m => [m, MEDIOS_PAGO[m]]));
    setOptions($('#em-cuotas'), p.pago.credito.cuotas.map(c => [c, `${c} cuotas`]));

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

/** Calcula prima y cronograma. Devuelve { error } o el detalle completo. */
function calcularPrima(p, { moneda, suma, modalidad, cuotas, desde }) {
    if (!p) return { error: 'Selecciona un producto.' };
    if (!p.monedas.includes(moneda)) return { error: 'Moneda no permitida para este producto.' };
    const { min, max } = limitesSuma(p, moneda);
    if (!(suma > 0)) return { error: 'Ingresa la suma asegurada.' };
    if (suma < min) return { error: `La suma asegurada mínima es ${money(min, moneda)}.` };
    if (max && suma > max) return { error: `La suma asegurada máxima es ${money(max, moneda)}.` };
    if (!desde) return { error: 'Indica la fecha de inicio de vigencia.' };

    let primaNeta = p.prima.tipo === 'tasa'
        ? suma * p.prima.tasa / 100
        : convertir(p.prima.montoFijo, p.monedaRef, moneda);
    let aplicoMinima = false;
    if (p.prima.tipo === 'tasa' && p.prima.minima > 0) {
        const minima = convertir(p.prima.minima, p.monedaRef, moneda);
        if (primaNeta < minima) { primaNeta = minima; aplicoMinima = true; }
    }
    primaNeta = round2(primaNeta);

    let ajuste = 0;
    let ajusteLabel = '';
    let cronograma;

    if (modalidad === 'contado') {
        if (!p.pago.contado.habilitado) return { error: 'Pago al contado no permitido.' };
        const d = p.pago.contado.descuento;
        if (d) { ajuste = -round2(primaNeta * d / 100); ajusteLabel = `Descuento contado (${d}%)`; }
        cronograma = [{ n: 1, fecha: desde, monto: round2(primaNeta + ajuste) }];
    } else if (modalidad === 'credito') {
        const c = p.pago.credito;
        if (!c.habilitado) return { error: 'Pago a crédito no permitido.' };
        if (!c.cuotas.includes(cuotas)) return { error: 'Número de cuotas no permitido.' };
        if (c.recargo) { ajuste = round2(primaNeta * c.recargo / 100); ajusteLabel = `Recargo financiamiento (${c.recargo}%)`; }
        const total = round2(primaNeta + ajuste);
        cronograma = [];
        let restante = total;
        let n = cuotas;
        let inicio = 0;
        if (c.inicial > 0) {
            const ini = round2(total * c.inicial / 100);
            cronograma.push({ n: 1, fecha: desde, monto: ini, inicial: true });
            restante = round2(total - ini);
            n = cuotas - 1;
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
        primaNeta, aplicoMinima, ajuste, ajusteLabel,
        primaTotal: round2(primaNeta + ajuste),
        cronograma,
        hasta: sumarMeses(desde, p.vigenciaMeses),
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
        tomadorId,
        aseguradoId: $('#em-aseg-mismo').checked ? tomadorId : aseguradoPicker.value,
        beneficiarios: benefRows.map(b => ({
            clienteId: b.picker.value,
            parentesco: $('[data-b=parentesco]', b.row).value,
            porcentaje: parseFloat($('[data-b=porcentaje]', b.row).value) || 0,
        })),
    };
}

/** Valida tomador, asegurado y beneficiarios. Devuelve un mensaje de error o ''. */
function validarParticipantes(p, d) {
    if (!d.tomadorId) return 'Selecciona el tomador.';
    if (!d.aseguradoId) return 'Selecciona el asegurado.';
    const regla = p?.beneficiarios || 'no';
    if (regla === 'requerido' && !d.beneficiarios.length) return 'Este producto requiere al menos un beneficiario.';
    if (!d.beneficiarios.length) return '';
    if (d.beneficiarios.some(b => !b.clienteId)) return 'Selecciona el cliente de cada beneficiario (o quita la fila vacía).';
    if (d.beneficiarios.some(b => b.porcentaje <= 0)) return 'Cada beneficiario debe tener un porcentaje mayor a 0.';
    const ids = d.beneficiarios.map(b => b.clienteId);
    if (new Set(ids).size !== ids.length) return 'Un mismo cliente está repetido como beneficiario.';
    if (ids.includes(d.aseguradoId)) return 'El asegurado no puede ser su propio beneficiario.';
    const total = round2(d.beneficiarios.reduce((acc, b) => acc + b.porcentaje, 0));
    if (total !== 100) return `Los porcentajes de beneficiarios suman ${total}%; deben sumar 100%.`;
    return '';
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
    const total = round2(d.beneficiarios.reduce((acc, b) => acc + b.porcentaje, 0));
    $('#em-benef-total').textContent = d.beneficiarios.length ? `Total: ${total}%` : '';
    $('#em-benef-total').style.color = d.beneficiarios.length && total !== 100 ? 'var(--danger)' : '';
    let r = calcularPrima(p, d);
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
            <dt>${p.prima.tipo === 'tasa' ? `Prima neta (tasa ${p.prima.tasa}%)` : 'Prima neta (fija)'}</dt><dd>${money(r.primaNeta, d.moneda)}</dd>
            ${r.aplicoMinima ? '<dt></dt><dd class="hint">Se aplicó la prima mínima</dd>' : ''}
            ${r.ajusteLabel ? `<dt>${esc(r.ajusteLabel)}</dt><dd>${money(r.ajuste, d.moneda)}</dd>` : ''}
            <dt class="total">Prima total</dt><dd class="total">${money(r.primaTotal, d.moneda)}</dd>
        </dl>
        ${tablaCronograma(r.cronograma, d.moneda)}`;
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
    const r = calcularPrima(p, d);
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
        suma_asegurada: d.suma,
        vigencia_desde: d.desde,
        vigencia_hasta: r.hasta,
        modalidad: d.modalidad,
        medio_pago: d.medio,
        cuotas: d.modalidad === 'credito' ? d.cuotas : 1,
        prima_neta: r.primaNeta,
        ajuste: r.ajuste,
        ajuste_concepto: r.ajusteLabel,
        prima_total: r.primaTotal,
        tipo_cambio: state.config.tipoCambio,
        coberturas: JSON.stringify(p.coberturas),
        cronograma: JSON.stringify(r.cronograma),
    };
    const certificadosRows = [{
        asegurado_id: d.aseguradoId,
        suma_asegurada: d.suma,
        prima: r.primaTotal,
    }];
    const beneficiariosRows = d.beneficiarios.map(b => ({
        cliente_id: b.clienteId,
        parentesco: b.parentesco,
        porcentaje: b.porcentaje,
    }));

    const btn = $('#btn-emitir');
    btn.disabled = true;
    try {
        const res = await conCarga('Emitiendo póliza…', () => api.post('emitir', { poliza: polizaRow, certificados: certificadosRows, beneficiarios: beneficiariosRows }));
        const poliza = polizaFromRow(res.poliza);
        state.polizas.unshift(poliza);
        state.certificados.push(...res.certificados.map(certificadoFromRow));
        state.beneficiarios.push(...res.beneficiarios.map(beneficiarioFromRow));

        // Limpiar participantes pero conservar el producto para emitir otra rápido
        tomadorPicker.clear();
        aseguradoPicker.clear();
        $('#em-aseg-mismo').checked = true;
        clearBenefRows();
        onProductoChange(false);
        renderPolizas();
        renderClientes();
        recalcular();
        verPoliza(poliza);
        toast(`Póliza ${poliza.numero} emitida`);
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
                <td><strong>${esc(p.numero)}</strong><div class="muted">${fecha(p.fechaEmision)}</div></td>
                <td>${esc(p.tomador.nombre)}<div class="muted">${esc(p.tomador.doc)}</div></td>
                <td>${esc(p.producto.nombre)}<div class="muted">${esc(p.ramo.nombre)}</div></td>
                <td>${fecha(p.desde)} – ${fecha(p.hasta)}</td>
                <td class="num">${money(p.primaTotal, p.moneda)}</td>
                <td>${p.modalidad === 'credito' ? `${p.cuotas} cuotas` : 'Contado'}<div class="muted">${esc(MEDIOS_PAGO[p.medio] ?? p.medio)}</div></td>
                <td>${p.estado === 'anulada' ? '<span class="badge danger">Anulada</span>' : '<span class="badge ok">Vigente</span>'}</td>
                <td class="actions">
                    <button class="btn small" data-pol-ver="${esc(p.id)}">Ver</button>
                    ${p.estado !== 'anulada' ? `<button class="btn small danger" data-pol-anular="${esc(p.id)}">Anular</button>` : ''}
                </td>
            </tr>`).join('')}
            </tbody>
        </table></div>`;
}

function certificadoHTML(p) {
    const t = p.tomador;
    const certs = certificadosDe(p.id);
    const benefs = beneficiariosDe(p.id);
    return `<div class="cert">
        <h2>Póliza de seguro</h2>
        <div class="cert-num">${esc(p.numero)} ${p.estado === 'anulada' ? '<span class="badge danger">ANULADA</span>' : ''}</div>
        <p class="muted">${esc(p.ramo.nombre)} · ${esc(p.producto.nombre)} (${esc(p.producto.codigo)}) · Emitida el ${fecha(p.fechaEmision)}</p>

        <section><h4>Tomador</h4>
            <dl class="kv">
                <dt>Nombre</dt><dd>${esc(t.nombre)}</dd>
                <dt>Documento</dt><dd>${esc(t.doc)}</dd>
                ${t.email ? `<dt>Correo</dt><dd>${esc(t.email)}</dd>` : ''}
                ${t.tel ? `<dt>Teléfono</dt><dd>${esc(t.tel)}</dd>` : ''}
                ${t.direccion ? `<dt>Dirección</dt><dd>${esc(t.direccion)}</dd>` : ''}
            </dl>
        </section>

        ${certs.length ? `<section><h4>Certificados / Asegurados</h4>
            <table>
                <thead><tr><th>Certificado</th><th>Asegurado</th><th>Documento</th><th class="num">Suma asegurada</th></tr></thead>
                <tbody>${certs.map(c => `<tr><td>${esc(c.numero)}</td><td>${esc(c.nombre)}</td><td>${esc(c.doc)}</td><td class="num">${money(c.suma, p.moneda)}</td></tr>`).join('')}</tbody>
            </table>
        </section>` : ''}

        ${benefs.length ? `<section><h4>Beneficiarios</h4>
            <table>
                <thead><tr><th>Nombre</th><th>Documento</th><th>Parentesco</th><th class="num">%</th></tr></thead>
                <tbody>${benefs.map(b => `<tr><td>${esc(b.nombre)}</td><td>${esc(b.doc)}</td><td>${esc(b.parentesco)}</td><td class="num">${b.porcentaje}%</td></tr>`).join('')}</tbody>
            </table>
        </section>` : ''}

        <section><h4>Condiciones</h4>
            <dl class="kv">
                <dt>Vigencia</dt><dd>${fecha(p.desde)} al ${fecha(p.hasta)}</dd>
                <dt>Moneda</dt><dd>${esc(MONEDAS[p.moneda]?.nombre ?? p.moneda)}</dd>
                <dt>Suma asegurada</dt><dd>${money(p.suma, p.moneda)}</dd>
                <dt>Prima neta</dt><dd>${money(p.primaNeta, p.moneda)}</dd>
                ${p.ajusteLabel ? `<dt>${esc(p.ajusteLabel)}</dt><dd>${money(p.ajuste, p.moneda)}</dd>` : ''}
                <dt class="total">Prima total</dt><dd class="total">${money(p.primaTotal, p.moneda)}</dd>
                <dt>Forma de pago</dt><dd>${esc(MODALIDADES[p.modalidad] ?? p.modalidad)} · ${esc(MEDIOS_PAGO[p.medio] ?? p.medio)}</dd>
            </dl>
        </section>

        ${p.coberturas.length ? `<section><h4>Coberturas</h4>
            <table><tbody>${p.coberturas.map(c => `<tr><td>${esc(c.nombre)}</td><td class="num">${esc(c.detalle)}</td></tr>`).join('')}</tbody></table>
        </section>` : ''}

        ${p.cronograma.length ? `<section><h4>Plan de pagos</h4>${tablaCronograma(p.cronograma, p.moneda)}</section>` : ''}
    </div>`;
}

function verPoliza(p) {
    openModal({
        title: `Póliza ${p.numero}`,
        body: certificadoHTML(p) + '<div class="row" style="margin-top:16px"><button type="button" class="btn" id="btn-imprimir">Imprimir</button></div>',
        readonly: true,
        onOpen: body => {
            $('#btn-imprimir', body).addEventListener('click', () => {
                $('#print-area').innerHTML = certificadoHTML(p);
                window.print();
            });
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
    $('#form-config').elements.tipoCambio.value = state.config.tipoCambio;
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

$('#form-config').addEventListener('submit', async e => {
    e.preventDefault();
    const tc = parseFloat(e.target.elements.tipoCambio.value);
    if (!(tc > 0)) return;
    try {
        await conCarga('Guardando…', () => api.post('config', { clave: 'tipoCambio', valor: tc }));
        state.config.tipoCambio = tc;
        recalcular();
        toast('Tipo de cambio guardado en la hoja');
    } catch (err) {
        alert(err.message);
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
    ].map(p => ({ beneficiarios: 'no', ...p }));
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
                await api.post('batch', { ops: productosDemo(ids).map(p => ({ sheet: 'productos', record: productoToRow(p) })) });
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
