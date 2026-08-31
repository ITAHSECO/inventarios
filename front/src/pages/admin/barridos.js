import { barridosService } from '../../services/barridos.service.js';

const ESTADO_LABELS = { activo: 'Activo', inactivo: 'Inactivo', cerrado: 'Cerrado' };

let currentPage = 1;
let currentEstado = '';
let currentSearch = '';

export async function renderBarridos(container) {
  container.innerHTML = `
    <div class="page-container">
      <header class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <a href="#/dashboard" class="btn btn-outline btn-sm">&larr; Dashboard</a>
          <h1>Barridos de Inventario</h1>
        </div>
        <button class="btn btn-primary btn-sm" id="btnNuevo">Nuevo Barrido</button>
      </header>

      <div class="filters-bar">
        <select id="filterEstado" class="filter-select">
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="cerrado">Cerrado</option>
        </select>
        <input type="text" id="searchInput" class="filter-input" placeholder="Buscar por nombre...">
      </div>

      <div id="tableContainer" class="table-container"></div>
      <div id="paginationContainer" class="pagination"></div>
    </div>

    <div id="modalOverlay" class="modal-overlay" style="display:none;">
      <div class="modal">
        <div class="modal-header">
          <h2 id="modalTitle"></h2>
          <button class="modal-close" id="modalClose">&times;</button>
        </div>
        <form id="modalForm" novalidate>
          <div id="modalBody"></div>
          <div id="modalError" class="form-error" style="display:none;"></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline btn-sm" id="modalCancel">Cancelar</button>
            <button type="submit" class="btn btn-primary btn-sm">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <div id="asignarOverlay" class="modal-overlay" style="display:none;">
      <div class="modal" style="max-width:560px;">
        <div class="modal-header">
          <h2>Asignar Inventariadores</h2>
          <button class="modal-close" id="asignarClose">&times;</button>
        </div>
        <div id="asignarBody"></div>
        <div id="asignarError" class="form-error" style="display:none;"></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline btn-sm" id="asignarCancel">Cerrar</button>
        </div>
      </div>
    </div>
  `;

  bindEvents();
  await loadBarridos();
}

function bindEvents() {
  document.getElementById('btnNuevo').addEventListener('click', () => openCreateModal());
  document.getElementById('filterEstado').addEventListener('change', (e) => {
    currentEstado = e.target.value;
    currentPage = 1;
    loadBarridos();
  });
  document.getElementById('searchInput').addEventListener('input', debounce(() => {
    currentSearch = document.getElementById('searchInput').value;
    currentPage = 1;
    loadBarridos();
  }, 400));
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('modalForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('asignarClose').addEventListener('click', closeAsignarModal);
  document.getElementById('asignarCancel').addEventListener('click', closeAsignarModal);
  document.getElementById('asignarOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAsignarModal();
  });
}

async function loadBarridos() {
  const tableEl = document.getElementById('tableContainer');
  tableEl.innerHTML = '<p class="loading">Cargando...</p>';

  try {
    const params = { page: currentPage, limit: 10 };
    if (currentEstado) params.estado = currentEstado;
    if (currentSearch) params.search = currentSearch;

    console.log('[Barridos] Loading:', params);
    const result = await barridosService.list(params);
    const { data, meta } = result;

    console.log('[Barridos] Loaded:', data?.length);
    if (!data || data.length === 0) {
      tableEl.innerHTML = '<p class="empty-state">No se encontraron barridos.</p>';
      document.getElementById('paginationContainer').innerHTML = '';
      return;
    }

    tableEl.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Fecha Inicio</th>
            <th>Fecha Fin</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(b => `
            <tr>
              <td><strong>${b.nombre}</strong></td>
              <td><span class="badge badge-estado-${b.estado}">${ESTADO_LABELS[b.estado] || b.estado}</span></td>
              <td>${b.fecha_inicio ? new Date(b.fecha_inicio).toLocaleDateString() : '-'}</td>
              <td>${b.fecha_fin ? new Date(b.fecha_fin).toLocaleDateString() : '-'}</td>
              <td class="actions-cell">
                <button class="btn-icon" title="Editar" onclick="window._editBarrido(${b.id})">&#9998;</button>
                <button class="btn-icon" title="Asignar usuarios" onclick="window._openAsignar(${b.id}, '${b.nombre}')">&#128101;</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    renderPagination(meta);
    bindRowActions(data);
  } catch (err) {
    console.error('[Barridos] Load failed:', err.message);
    tableEl.innerHTML = `<p class="form-error" style="display:block;">${err.message}</p>`;
  }
}

function bindRowActions(data) {
  window._editBarrido = (id) => {
    const barrido = data.find(b => b.id === id);
    if (barrido) openEditModal(barrido);
  };
  window._openAsignar = (id, nombre) => openAsignarModal(id, nombre);
}

function renderPagination(meta) {
  const pag = document.getElementById('paginationContainer');
  if (!meta || meta.totalPages <= 1) { pag.innerHTML = ''; return; }
  let html = '';
  if (currentPage > 1) html += `<button class="btn btn-outline btn-sm" data-page="${currentPage - 1}">Anterior</button>`;
  for (let i = 1; i <= meta.totalPages; i++) {
    html += `<button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline'}" data-page="${i}">${i}</button>`;
  }
  if (currentPage < meta.totalPages) html += `<button class="btn btn-outline btn-sm" data-page="${currentPage + 1}">Siguiente</button>`;
  html += `<span class="pagination-info">${meta.total} registros</span>`;
  pag.innerHTML = html;
  pag.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => { currentPage = parseInt(btn.dataset.page); loadBarridos(); });
  });
}

let pendingFormAction = null;
let pendingFormId = null;

function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'Nuevo Barrido';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label for="m_nombre">Nombre del barrido</label>
      <input type="text" id="m_nombre" required maxlength="100" placeholder="Ej: INVENTARIO Q1 2026">
    </div>
    <div class="form-group">
      <label for="m_estado">Estado</label>
      <select id="m_estado" required>
        <option value="activo">Activo</option>
        <option value="inactivo">Inactivo</option>
        <option value="cerrado">Cerrado</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="m_fecha_inicio">Fecha Inicio *</label>
        <input type="date" id="m_fecha_inicio" required>
      </div>
      <div class="form-group">
        <label for="m_fecha_fin">Fecha Fin</label>
        <input type="date" id="m_fecha_fin">
      </div>
    </div>
  `;
  pendingFormAction = 'create';
  pendingFormId = null;
  document.getElementById('modalOverlay').style.display = 'flex';
  document.getElementById('m_nombre').focus();
}

function openEditModal(barrido) {
  document.getElementById('modalTitle').textContent = 'Editar Barrido';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label for="m_nombre">Nombre del barrido</label>
      <input type="text" id="m_nombre" required maxlength="100" value="${barrido.nombre}">
    </div>
    <div class="form-group">
      <label for="m_estado">Estado</label>
      <select id="m_estado" required>
        <option value="activo" ${barrido.estado === 'activo' ? 'selected' : ''}>Activo</option>
        <option value="inactivo" ${barrido.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
        <option value="cerrado" ${barrido.estado === 'cerrado' ? 'selected' : ''}>Cerrado</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="m_fecha_inicio">Fecha Inicio *</label>
        <input type="date" id="m_fecha_inicio" required value="${barrido.fecha_inicio || ''}">
      </div>
      <div class="form-group">
        <label for="m_fecha_fin">Fecha Fin</label>
        <input type="date" id="m_fecha_fin" value="${barrido.fecha_fin || ''}">
      </div>
    </div>
  `;
  pendingFormAction = 'edit';
  pendingFormId = barrido.id;
  document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.getElementById('modalError').style.display = 'none';
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const errorDiv = document.getElementById('modalError');
  errorDiv.style.display = 'none';

  const data = {
    nombre: document.getElementById('m_nombre').value.trim(),
    estado: document.getElementById('m_estado').value,
    fecha_inicio: document.getElementById('m_fecha_inicio').value,
    fecha_fin: document.getElementById('m_fecha_fin').value || null,
  };

  if (!data.nombre) { showError(errorDiv, 'El nombre es requerido'); return; }
  if (!data.fecha_inicio) { showError(errorDiv, 'La fecha de inicio es requerida'); return; }

  try {
    if (pendingFormAction === 'create') {
      console.log('[Barridos] Creating:', data);
      await barridosService.create(data);
      console.log('[Barridos] Created');
    } else {
      console.log('[Barridos] Updating:', pendingFormId, data);
      await barridosService.update(pendingFormId, data);
      console.log('[Barridos] Updated');
    }
    closeModal();
    loadBarridos();
  } catch (err) {
    console.error('[Barridos] Save failed:', err.message);
    showError(errorDiv, err.message);
  }
}

let currentAsignarBarridoId = null;

async function openAsignarModal(barridoId, barridoNombre) {
  currentAsignarBarridoId = barridoId;
  const body = document.getElementById('asignarBody');
  body.innerHTML = '<p class="loading">Cargando...</p>';
  document.getElementById('asignarOverlay').style.display = 'flex';
  document.getElementById('asignarError').style.display = 'none';

  try {
    const [asignadosRes, inventariadoresRes] = await Promise.all([
      barridosService.getUsuarios(barridoId),
      barridosService.getInventariadores(),
    ]);

    const asignados = asignadosRes.data || [];
    const inventariadores = inventariadoresRes.data || [];
    const asignadosIds = new Set(asignados.map(a => a.usuario_id));

    body.innerHTML = `
      <p style="margin-bottom:0.75rem;font-size:0.875rem;color:var(--gray-500);">
        Barrido: <strong>${barridoNombre}</strong>
      </p>
      ${asignados.length > 0 ? `
        <div style="margin-bottom:1rem;">
          <h3 style="font-size:0.875rem;font-weight:600;margin-bottom:0.5rem;">Asignados actualmente:</h3>
          <div class="asignados-list">
            ${asignados.map(a => {
              const p = a.perfiles;
              return `
                <div class="asignado-chip">
                  <span>${p?.nombres || ''} ${p?.apellidos || ''} (${p?.username || ''})</span>
                  <button class="btn-icon btn-warn" title="Desasignar" onclick="window._desasignar('${a.usuario_id}')">&times;</button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : '<p style="margin-bottom:1rem;font-size:0.875rem;color:var(--gray-500)">No hay usuarios asignados.</p>'}
      <h3 style="font-size:0.875rem;font-weight:600;margin-bottom:0.5rem;">Asignar nuevos:</h3>
      <div id="inventariadoresList" style="max-height:200px;overflow-y:auto;">
        ${inventariadores.filter(i => !asignadosIds.has(i.id)).map(inv => `
          <label class="checkbox-label">
            <input type="checkbox" value="${inv.id}" class="inv-checkbox">
            ${inv.nombres} ${inv.apellidos} (${inv.username}) ${!inv.activo ? '<span style="color:var(--error);">(inactivo)</span>' : ''}
          </label>
        `).join('')}
      </div>
      <button class="btn btn-primary btn-sm" id="btnAsignarSeleccionados" style="margin-top:0.75rem;">Asignar seleccionados</button>
    `;

    document.getElementById('btnAsignarSeleccionados').addEventListener('click', handleAsignarSeleccionados);
    window._desasignar = handleDesasignar;
  } catch (err) {
    console.error('[Barridos] Load assign modal failed:', err.message);
    body.innerHTML = `<p class="form-error" style="display:block;">${err.message}</p>`;
  }
}

async function handleAsignarSeleccionados() {
  const checkboxes = document.querySelectorAll('.inv-checkbox:checked');
  const ids = Array.from(checkboxes).map(cb => cb.value);
  const errorDiv = document.getElementById('asignarError');
  errorDiv.style.display = 'none';

  if (ids.length === 0) {
    showError(errorDiv, 'Seleccione al menos un usuario');
    return;
  }

  try {
    console.log('[Barridos] Asignando usuarios:', ids);
    await barridosService.asignarUsuarios(currentAsignarBarridoId, ids);
    console.log('[Barridos] Asignados');
    openAsignarModal(currentAsignarBarridoId, document.querySelector('#asignarBody strong')?.textContent || '');
    loadBarridos();
  } catch (err) {
    console.error('[Barridos] Asignar failed:', err.message);
    showError(errorDiv, err.message);
  }
}

async function handleDesasignar(usuarioId) {
  if (!confirm('Seguro que desea desasignar este usuario?')) return;
  try {
    console.log('[Barridos] Desasignando:', usuarioId);
    await barridosService.desasignarUsuario(currentAsignarBarridoId, usuarioId);
    console.log('[Barridos] Desasignado');
    openAsignarModal(currentAsignarBarridoId, document.querySelector('#asignarBody strong')?.textContent || '');
    loadBarridos();
  } catch (err) {
    console.error('[Barridos] Desasignar failed:', err.message);
    alert('Error: ' + err.message);
  }
}

function closeAsignarModal() {
  document.getElementById('asignarOverlay').style.display = 'none';
}

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}