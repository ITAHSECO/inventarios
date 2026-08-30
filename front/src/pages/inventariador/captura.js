import { planillasService } from '../../services/planillas.service.js';
import { conteosService } from '../../services/conteos.service.js';

let barridos = [];
let selectedPlanilla = null;
let currentPage = 1;
let currentBarrido = '';
let currentSearch = '';

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

export async function renderCaptura(container) {
  const user = getUser();

  try {
    const res = await planillasService.getBarridos();
    barridos = res.data || [];
  } catch { barridos = []; }

  container.innerHTML = `
    <div class="dashboard">
      <header class="dashboard-header">
        <div class="dashboard-header-left">
          <img src="/inventarios/assets/logo.png" alt="Logo" class="dashboard-logo" onerror="this.style.display='none'">
          <h1>Captura de Inventario</h1>
        </div>
        <div class="dashboard-header-right">
          <span class="user-info">
            <span class="user-name">${user?.nombres || ''} ${user?.apellidos || ''}</span>
            <span class="user-role">Inventariador</span>
          </span>
          <button class="btn btn-outline btn-sm" id="logoutBtn">Cerrar sesion</button>
        </div>
      </header>

      <main class="dashboard-main" style="max-width:800px;">
        <div class="capture-section">
          <h2 class="section-title">1. Seleccionar Barrido</h2>
          <div class="filters-bar">
            <select id="filterBarrido" class="filter-select" style="flex:1;">
              <option value="">-- Seleccione barrido --</option>
              ${barridos.map(b => `<option value="${b}">${b}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="capture-section" id="planillasSection" style="display:none;">
          <h2 class="section-title">2. Seleccionar Articulo</h2>
          <div class="filters-bar">
            <input type="text" id="searchPlanilla" class="filter-input" placeholder="Buscar por codigo o articulo...">
          </div>
          <div id="planillasTable" class="table-container"></div>
          <div id="planillasPagination" class="pagination"></div>
        </div>

        <div class="capture-section" id="formSection" style="display:none;">
          <h2 class="section-title">3. Registrar Conteo</h2>
          <div id="selectedInfo" class="selected-info"></div>
          <form id="captureForm" novalidate>
            <div class="form-group">
              <label for="f_ubicacion">Ubicacion *</label>
              <input type="text" id="f_ubicacion" required maxlength="100" placeholder="Ej: ESTANTE-A1">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="f_conteo">Conteo *</label>
                <input type="number" id="f_conteo" required min="0" step="0.0001" placeholder="0">
              </div>
              <div class="form-group" id="serieLoteGroup" style="display:none;">
                <label for="f_serie_lote">Serie/Lote *</label>
                <input type="text" id="f_serie_lote" maxlength="100" placeholder="Serie o lote">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="f_vcto">Vencimiento</label>
                <input type="date" id="f_vcto">
              </div>
              <div class="form-group">
                <label for="f_observacion">Observacion</label>
                <input type="text" id="f_observacion" maxlength="255" placeholder="Opcional">
              </div>
            </div>
            <div id="formError" class="form-error" style="display:none;"></div>
            <div id="formSuccess" class="form-success" style="display:none;"></div>
            <div style="display:flex;gap:0.5rem;">
              <button type="submit" class="btn btn-primary" id="submitBtn">Registrar Conteo</button>
              <button type="button" class="btn btn-outline" id="cancelBtn">Cancelar</button>
            </div>
          </form>
        </div>

        <div class="capture-section">
          <h2 class="section-title">Mis Conteos Recientes</h2>
          <div id="myCountsContainer" class="table-container"></div>
          <div id="myCountsPagination" class="pagination"></div>
        </div>
      </main>
    </div>
  `;

  bindEvents();
  loadMyCounts();
}

function bindEvents() {
  document.getElementById('filterBarrido').addEventListener('change', (e) => {
    currentBarrido = e.target.value;
    currentPage = 1;
    selectedPlanilla = null;
    document.getElementById('formSection').style.display = 'none';
    if (currentBarrido) {
      document.getElementById('planillasSection').style.display = 'block';
      loadPlanillas();
    } else {
      document.getElementById('planillasSection').style.display = 'none';
    }
  });

  document.getElementById('searchPlanilla').addEventListener('input', debounce(() => {
    currentSearch = document.getElementById('searchPlanilla').value;
    currentPage = 1;
    loadPlanillas();
  }, 400));

  document.getElementById('captureForm').addEventListener('submit', handleCaptureSubmit);
  document.getElementById('cancelBtn').addEventListener('click', () => {
    selectedPlanilla = null;
    document.getElementById('formSection').style.display = 'none';
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    localStorage.clear();
    window.location.hash = '#/login';
  });
}

async function loadPlanillas() {
  const tableEl = document.getElementById('planillasTable');
  tableEl.innerHTML = '<p class="loading">Cargando...</p>';

  try {
    const params = { page: currentPage, limit: 10, barrido: currentBarrido };
    if (currentSearch) params.search = currentSearch;

    console.log('[Captura] Loading planillas:', params);
    const result = await planillasService.list(params);
    const { data, meta } = result;

    if (!data || data.length === 0) {
      tableEl.innerHTML = '<p class="empty-state">No se encontraron articulos para este barrido.</p>';
      document.getElementById('planillasPagination').innerHTML = '';
      return;
    }

    tableEl.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Articulo</th>
            <th>Almacen</th>
            <th>Existencia</th>
            <th>Accion</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(p => `
            <tr>
              <td>${p.codigo}</td>
              <td>${p.articulo}</td>
              <td>${p.id_alm}</td>
              <td>${p.existencia}</td>
              <td>
                <button class="btn btn-primary btn-sm" onclick="window._selectPlanilla(${p.id})">Seleccionar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    renderPlanillasPagination(meta);
    bindPlanillaActions(data);
  } catch (err) {
    console.error('[Captura] Load planillas failed:', err.message);
    tableEl.innerHTML = `<p class="form-error" style="display:block;">${err.message}</p>`;
  }
}

function bindPlanillaActions(data) {
  window._selectPlanilla = (id) => {
    const planilla = data.find(p => p.id === id);
    if (!planilla) return;
    selectedPlanilla = planilla;
    console.log('[Captura] Selected planilla:', planilla);
    showCaptureForm(planilla);
  };
}

function showCaptureForm(planilla) {
  const formSection = document.getElementById('formSection');
  formSection.style.display = 'block';

  document.getElementById('selectedInfo').innerHTML = `
    <div class="selected-card">
      <strong>${planilla.codigo}</strong> - ${planilla.articulo}<br>
      <small>Almacen: ${planilla.id_alm} | Existencia: ${planilla.existencia} | Barrido: ${planilla.barrido}</small>
      ${planilla.serie_lote && planilla.serie_lote !== '-' ? `<br><small>Serie/Lote: ${planilla.serie_lote}</small>` : ''}
      ${planilla.vcto ? `<br><small>Vence: ${planilla.vcto}</small>` : ''}
    </div>
  `;

  const serieLoteGroup = document.getElementById('serieLoteGroup');
  if (planilla.maneja_serie_lote) {
    serieLoteGroup.style.display = 'block';
    document.getElementById('f_serie_lote').required = true;
  } else {
    serieLoteGroup.style.display = 'none';
    document.getElementById('f_serie_lote').required = false;
  }

  document.getElementById('f_ubicacion').value = '';
  document.getElementById('f_conteo').value = '';
  document.getElementById('f_serie_lote').value = planilla.serie_lote || '';
  document.getElementById('f_vcto').value = planilla.vcto || '';
  document.getElementById('f_observacion').value = '';
  document.getElementById('formError').style.display = 'none';
  document.getElementById('formSuccess').style.display = 'none';

  formSection.scrollIntoView({ behavior: 'smooth' });
  document.getElementById('f_ubicacion').focus();
}

async function handleCaptureSubmit(e) {
  e.preventDefault();
  const errorDiv = document.getElementById('formError');
  const successDiv = document.getElementById('formSuccess');
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';

  if (!selectedPlanilla) {
    errorDiv.textContent = 'Debe seleccionar un articulo';
    errorDiv.style.display = 'block';
    return;
  }

  const data = {
    planilla_id: selectedPlanilla.id,
    ubicacion: document.getElementById('f_ubicacion').value.trim(),
    conteo: parseFloat(document.getElementById('f_conteo').value),
    serie_lote: document.getElementById('f_serie_lote').value.trim() || '-',
    vcto_capturado: document.getElementById('f_vcto').value || null,
    observacion: document.getElementById('f_observacion').value.trim() || null,
  };

  if (!data.ubicacion) {
    errorDiv.textContent = 'La ubicacion es requerida';
    errorDiv.style.display = 'block';
    return;
  }
  if (isNaN(data.conteo) || data.conteo < 0) {
    errorDiv.textContent = 'El conteo debe ser un numero mayor o igual a 0';
    errorDiv.style.display = 'block';
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;

  try {
    console.log('[Captura] Submitting:', data);
    await conteosService.create(data);
    console.log('[Captura] Created');
    successDiv.textContent = 'Conteo registrado exitosamente';
    successDiv.style.display = 'block';
    document.getElementById('captureForm').reset();
    selectedPlanilla = null;
    document.getElementById('formSection').style.display = 'none';
    loadMyCounts();
  } catch (err) {
    console.error('[Captura] Submit failed:', err.message);
    errorDiv.textContent = err.message;
    errorDiv.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
  }
}

async function loadMyCounts() {
  const container = document.getElementById('myCountsContainer');
  container.innerHTML = '<p class="loading">Cargando...</p>';

  try {
    const result = await conteosService.getMisConteos({ page: 1, limit: 10 });
    const { data } = result;

    if (!data || data.length === 0) {
      container.innerHTML = '<p class="empty-state">Aun no tienes conteos registrados.</p>';
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Ubicacion</th>
            <th>Conteo</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(c => `
            <tr>
              <td>${c.codigo}</td>
              <td>${c.ubicacion}</td>
              <td>${c.conteo}</td>
              <td>${new Date(c.created_at).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error('[Captura] Load my counts failed:', err.message);
    container.innerHTML = `<p class="form-error" style="display:block;">${err.message}</p>`;
  }
}

function renderPlanillasPagination(meta) {
  const pag = document.getElementById('planillasPagination');
  if (!meta || meta.totalPages <= 1) { pag.innerHTML = ''; return; }

  let html = '';
  if (currentPage > 1) html += `<button class="btn btn-outline btn-sm" data-page="${currentPage - 1}">Anterior</button>`;
  for (let i = 1; i <= meta.totalPages; i++) {
    html += `<button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline'}" data-page="${i}">${i}</button>`;
  }
  if (currentPage < meta.totalPages) html += `<button class="btn btn-outline btn-sm" data-page="${currentPage + 1}">Siguiente</button>`;
  pag.innerHTML = html;

  pag.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      loadPlanillas();
    });
  });
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}