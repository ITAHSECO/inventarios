import { catalogosService } from '../../services/catalogos.service.js';

let currentPage = 1;
let currentTabla = '';
let currentActivo = '';
let currentSearch = '';
let tablas = [];

export async function renderMaestra(container) {
  try {
    const res = await catalogosService.getTablas();
    tablas = res.data || [];
  } catch { tablas = []; }

  container.innerHTML = `
    <div class="page-container">
      <header class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <a href="#/dashboard" class="btn btn-outline btn-sm">&larr; Dashboard</a>
          <h1>Tabla Maestra</h1>
        </div>
        <button class="btn btn-primary btn-sm" id="btnNuevo">Nuevo Parametro</button>
      </header>

      <div class="filters-bar">
        <select id="filterTabla" class="filter-select">
          <option value="">Todas las tablas</option>
          ${tablas.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
        <select id="filterActivo" class="filter-select">
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <input type="text" id="searchInput" class="filter-input" placeholder="Buscar por id_elemento o descripcion...">
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
            <button type="submit" class="btn btn-primary btn-sm" id="modalSubmit">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  bindEvents();
  await loadCatalogos();
}

function bindEvents() {
  document.getElementById('btnNuevo').addEventListener('click', () => openCreateModal());
  document.getElementById('filterTabla').addEventListener('change', (e) => {
    currentTabla = e.target.value;
    currentPage = 1;
    loadCatalogos();
  });
  document.getElementById('filterActivo').addEventListener('change', (e) => {
    currentActivo = e.target.value;
    currentPage = 1;
    loadCatalogos();
  });
  document.getElementById('searchInput').addEventListener('input', debounce(() => {
    currentSearch = document.getElementById('searchInput').value;
    currentPage = 1;
    loadCatalogos();
  }, 400));
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('modalForm').addEventListener('submit', handleFormSubmit);
}

async function loadCatalogos() {
  const tableEl = document.getElementById('tableContainer');
  tableEl.innerHTML = '<p class="loading">Cargando...</p>';

  try {
    const params = { page: currentPage, limit: 15 };
    if (currentTabla) params.id_tabla = currentTabla;
    if (currentActivo !== '') params.activo = currentActivo === 'true';
    if (currentSearch) params.search = currentSearch;

    console.log('[Maestra] Loading:', params);
    const result = await catalogosService.list(params);
    const { data, meta } = result;

    console.log('[Maestra] Loaded:', data?.length, 'items');

    if (!data || data.length === 0) {
      tableEl.innerHTML = '<p class="empty-state">No se encontraron parametros.</p>';
      document.getElementById('paginationContainer').innerHTML = '';
      return;
    }

    tableEl.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>ID Tabla</th>
            <th>ID Elemento</th>
            <th>Descripcion</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(c => `
            <tr>
              <td><span class="badge badge-tabla">${c.id_tabla}</span></td>
              <td>${c.id_elemento}</td>
              <td>${c.descripcion}</td>
              <td><span class="status ${c.activo ? 'active' : 'inactive'}">${c.activo ? 'Activo' : 'Inactivo'}</span></td>
              <td class="actions-cell">
                <button class="btn-icon" title="Editar" onclick="window._editItem(${c.id})">&#9998;</button>
                <button class="btn-icon ${c.activo ? 'btn-warn' : 'btn-success'}" title="${c.activo ? 'Desactivar' : 'Activar'}" onclick="window._toggleItem(${c.id}, ${c.activo})">${c.activo ? '&#10005;' : '&#10003;'}</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    renderPagination(meta);
    bindRowActions(data);
  } catch (err) {
    console.error('[Maestra] Load failed:', err.message);
    tableEl.innerHTML = `<p class="form-error" style="display:block;">${err.message}</p>`;
  }
}

function bindRowActions(data) {
  window._editItem = (id) => {
    const item = data.find(c => c.id === id);
    if (item) openEditModal(item);
  };
  window._toggleItem = async (id, isActive) => {
    const action = isActive ? 'desactivar' : 'activar';
    if (!confirm(`Seguro que desea ${action} este parametro?`)) return;
    try {
      console.log('[Maestra] Toggling:', id, !isActive);
      await catalogosService.update(id, { activo: !isActive });
      console.log('[Maestra] Toggle success');
      loadCatalogos();
    } catch (err) {
      console.error('[Maestra] Toggle failed:', err.message);
      alert('Error: ' + err.message);
    }
  };
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
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      loadCatalogos();
    });
  });
}

let pendingFormAction = null;
let pendingFormId = null;

function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'Nuevo Parametro';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label for="m_id_tabla">ID Tabla</label>
      <select id="m_id_tabla" required>
        <option value="">-- Seleccione --</option>
        ${tablas.map(t => `<option value="${t}">${t}</option>`).join('')}
        <option value="_custom">Otra (escribir)</option>
      </select>
    </div>
    <div class="form-group" id="customTablaGroup" style="display:none;">
      <label for="m_id_tabla_custom">Nueva tabla</label>
      <input type="text" id="m_id_tabla_custom" placeholder="Ej: MARCA, CATEGORIA">
    </div>
    <div class="form-group">
      <label for="m_id_elemento">ID Elemento</label>
      <input type="text" id="m_id_elemento" required maxlength="50" placeholder="Ej: ALM001">
    </div>
    <div class="form-group">
      <label for="m_descripcion">Descripcion</label>
      <input type="text" id="m_descripcion" required maxlength="255" placeholder="Descripcion del parametro">
    </div>
  `;
  document.getElementById('m_id_tabla').addEventListener('change', (e) => {
    document.getElementById('customTablaGroup').style.display = e.target.value === '_custom' ? 'block' : 'none';
  });
  pendingFormAction = 'create';
  pendingFormId = null;
  document.getElementById('modalOverlay').style.display = 'flex';
  document.getElementById('m_id_tabla').focus();
}

function openEditModal(item) {
  document.getElementById('modalTitle').textContent = 'Editar Parametro';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label>ID Tabla</label>
      <input type="text" value="${item.id_tabla}" disabled class="input-disabled">
    </div>
    <div class="form-group">
      <label>ID Elemento</label>
      <input type="text" value="${item.id_elemento}" disabled class="input-disabled">
    </div>
    <div class="form-group">
      <label for="m_descripcion">Descripcion</label>
      <input type="text" id="m_descripcion" required maxlength="255" value="${item.descripcion}">
    </div>
  `;
  pendingFormAction = 'edit';
  pendingFormId = item.id;
  document.getElementById('modalOverlay').style.display = 'flex';
  document.getElementById('m_descripcion').focus();
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.getElementById('modalError').style.display = 'none';
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const errorDiv = document.getElementById('modalError');
  errorDiv.style.display = 'none';

  try {
    if (pendingFormAction === 'create') {
      const tablaSelect = document.getElementById('m_id_tabla');
      const id_tabla = tablaSelect.value === '_custom'
        ? document.getElementById('m_id_tabla_custom').value.trim()
        : tablaSelect.value;
      const id_elemento = document.getElementById('m_id_elemento').value.trim();
      const descripcion = document.getElementById('m_descripcion').value.trim();

      if (!id_tabla) { throw new Error('La tabla es requerida'); }
      if (!id_elemento) { throw new Error('El ID elemento es requerido'); }
      if (!descripcion) { throw new Error('La descripcion es requerida'); }

      console.log('[Maestra] Creating:', { id_tabla, id_elemento, descripcion });
      await catalogosService.create({ id_tabla, id_elemento, descripcion });
      console.log('[Maestra] Created');
    } else {
      const descripcion = document.getElementById('m_descripcion').value.trim();
      if (!descripcion) { throw new Error('La descripcion es requerida'); }

      console.log('[Maestra] Updating:', pendingFormId, { descripcion });
      await catalogosService.update(pendingFormId, { descripcion });
      console.log('[Maestra] Updated');
    }
    closeModal();
    loadCatalogos();
  } catch (err) {
    console.error('[Maestra] Save failed:', err.message);
    errorDiv.textContent = err.message;
    errorDiv.style.display = 'block';
  }
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}