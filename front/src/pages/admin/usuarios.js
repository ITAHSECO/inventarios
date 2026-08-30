import { perfilesService } from '../../services/perfiles.service.js';
import { catalogosService } from '../../services/catalogos.service.js';

const ROLE_LABELS = {
  superadmin: 'Super Administrador',
  admin: 'Administrador',
  inventariador: 'Inventariador',
  reportes: 'Reportes',
};

let currentPage = 1;
let currentSearch = '';
let currentRol = '';
let currentActivo = '';
let roles = [];

export async function renderUsuarios(container) {
  try {
    const res = await catalogosService.getActivos('ROLES');
    roles = res.data || [];
  } catch { roles = []; }

  container.innerHTML = `
    <div class="page-container">
      <header class="page-header">
        <h1>Gestion de Usuarios</h1>
        <button class="btn btn-primary btn-sm" id="btnNuevo">Nuevo Usuario</button>
      </header>

      <div class="filters-bar">
        <input type="text" id="searchInput" class="filter-input" placeholder="Buscar por nombre o usuario...">
        <select id="filterRol" class="filter-select">
          <option value="">Todos los roles</option>
          ${roles.map(r => `<option value="${r.id_elemento}">${r.descripcion}</option>`).join('')}
        </select>
        <select id="filterActivo" class="filter-select">
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
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
  await loadUsuarios();
}

function bindEvents() {
  document.getElementById('btnNuevo').addEventListener('click', () => openCreateModal());
  document.getElementById('searchInput').addEventListener('input', debounce(() => {
    currentSearch = document.getElementById('searchInput').value;
    currentPage = 1;
    loadUsuarios();
  }, 400));
  document.getElementById('filterRol').addEventListener('change', (e) => {
    currentRol = e.target.value;
    currentPage = 1;
    loadUsuarios();
  });
  document.getElementById('filterActivo').addEventListener('change', (e) => {
    currentActivo = e.target.value;
    currentPage = 1;
    loadUsuarios();
  });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('modalForm').addEventListener('submit', handleFormSubmit);
}

async function loadUsuarios() {
  const tableEl = document.getElementById('tableContainer');
  tableEl.innerHTML = '<p class="loading">Cargando...</p>';

  try {
    const params = { page: currentPage, limit: 10 };
    if (currentSearch) params.search = currentSearch;
    if (currentRol) params.rol = currentRol;
    if (currentActivo !== '') params.activo = currentActivo;

    console.log('[Usuarios] Loading:', params);
    const result = await perfilesService.list(params);
    const { data, meta } = result;

    console.log('[Usuarios] Loaded:', data?.length, 'users');

    if (!data || data.length === 0) {
      tableEl.innerHTML = '<p class="empty-state">No se encontraron usuarios.</p>';
      document.getElementById('paginationContainer').innerHTML = '';
      return;
    }

    tableEl.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Nombres</th>
            <th>Apellidos</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(u => `
            <tr>
              <td>${u.username}</td>
              <td>${u.nombres}</td>
              <td>${u.apellidos}</td>
              <td><span class="badge badge-${u.rol}">${ROLE_LABELS[u.rol] || u.rol}</span></td>
              <td><span class="status ${u.activo ? 'active' : 'inactive'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
              <td class="actions-cell">
                <button class="btn-icon" title="Editar" onclick="window._editUser('${u.id}')">&#9998;</button>
                <button class="btn-icon ${u.activo ? 'btn-warn' : 'btn-success'}" title="${u.activo ? 'Desactivar' : 'Activar'}" onclick="window._toggleUser('${u.id}', ${u.activo})">${u.active ? '&#10005;' : '&#10003;'}</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    renderPagination(meta);
    bindRowActions(data);
  } catch (err) {
    console.error('[Usuarios] Load failed:', err.message);
    tableEl.innerHTML = `<p class="form-error" style="display:block;">${err.message}</p>`;
  }
}

function bindRowActions(data) {
  window._editUser = (id) => {
    const user = data.find(u => u.id === id);
    if (user) openEditModal(user);
  };
  window._toggleUser = async (id, isActive) => {
    const action = isActive ? 'desactivar' : 'activar';
    if (!confirm(`Seguro que desea ${action} este usuario?`)) return;
    try {
      console.log('[Usuarios] Toggling user:', id, !isActive);
      await perfilesService.update(id, { activo: !isActive });
      console.log('[Usuarios] Toggle success');
      loadUsuarios();
    } catch (err) {
      console.error('[Usuarios] Toggle failed:', err.message);
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
      loadUsuarios();
    });
  });
}

let pendingFormAction = null;
let pendingFormId = null;

function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'Nuevo Usuario';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label for="m_username">Usuario</label>
      <input type="text" id="m_username" required minlength="3" maxlength="50" pattern="[a-zA-Z0-9_.]+" placeholder="letras, numeros, _ .">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="m_nombres">Nombres</label>
        <input type="text" id="m_nombres" required maxlength="100">
      </div>
      <div class="form-group">
        <label for="m_apellidos">Apellidos</label>
        <input type="text" id="m_apellidos" required maxlength="100">
      </div>
    </div>
    <div class="form-group">
      <label for="m_rol">Rol</label>
      <select id="m_rol" required>
        <option value="">-- Seleccione --</option>
        ${roles.map(r => `<option value="${r.id_elemento}">${r.descripcion}</option>`).join('')}
      </select>
    </div>
  `;
  pendingFormAction = 'create';
  pendingFormId = null;
  document.getElementById('modalOverlay').style.display = 'flex';
  document.getElementById('m_username').focus();
}

function openEditModal(user) {
  document.getElementById('modalTitle').textContent = 'Editar Usuario';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label>Usuario</label>
      <input type="text" value="${user.username}" disabled class="input-disabled">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="m_nombres">Nombres</label>
        <input type="text" id="m_nombres" required maxlength="100" value="${user.nombres}">
      </div>
      <div class="form-group">
        <label for="m_apellidos">Apellidos</label>
        <input type="text" id="m_apellidos" required maxlength="100" value="${user.apellidos}">
      </div>
    </div>
    <div class="form-group">
      <label for="m_rol">Rol</label>
      <select id="m_rol" required>
        ${roles.map(r => `<option value="${r.id_elemento}" ${r.id_elemento === user.rol ? 'selected' : ''}>${r.descripcion}</option>`).join('')}
      </select>
    </div>
  `;
  pendingFormAction = 'edit';
  pendingFormId = user.id;
  document.getElementById('modalOverlay').style.display = 'flex';
  document.getElementById('m_nombres').focus();
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.getElementById('modalError').style.display = 'none';
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const errorDiv = document.getElementById('modalError');
  errorDiv.style.display = 'none';

  const data = {};
  const nombres = document.getElementById('m_nombres');
  const apellidos = document.getElementById('m_apellidos');
  const rol = document.getElementById('m_rol');

  if (nombres) data.nombres = nombres.value.trim();
  if (apellidos) data.apellidos = apellidos.value.trim();
  if (rol) data.rol = rol.value;

  if (pendingFormAction === 'create') {
    const username = document.getElementById('m_username');
    if (!username || !username.value.trim()) {
      errorDiv.textContent = 'El usuario es requerido';
      errorDiv.style.display = 'block';
      return;
    }
    data.username = username.value.trim();
  }

  try {
    if (pendingFormAction === 'create') {
      console.log('[Usuarios] Creating:', data);
      await perfilesService.create(data);
      console.log('[Usuarios] Created');
    } else {
      console.log('[Usuarios] Updating:', pendingFormId, data);
      await perfilesService.update(pendingFormId, data);
      console.log('[Usuarios] Updated');
    }
    closeModal();
    loadUsuarios();
  } catch (err) {
    console.error('[Usuarios] Save failed:', err.message);
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