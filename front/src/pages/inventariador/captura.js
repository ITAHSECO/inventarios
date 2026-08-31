import { barridosService } from '../../services/barridos.service.js';
import { catalogosService } from '../../services/catalogos.service.js';
import { conteosService } from '../../services/conteos.service.js';
import { planillasService } from '../../services/planillas.service.js';

let barridos = [];
let unidades = [];
let currentBarrido = '';
let currentBarridoId = null;
let searchTimer = null;

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

export async function renderCaptura(container) {
  const user = getUser();

  try {
    const [barridosRes, unidadesRes] = await Promise.all([
      barridosService.getMisBarridos(),
      catalogosService.getActivos('CUNIDAD'),
    ]);
    barridos = barridosRes.data || [];
    unidades = unidadesRes.data || [];
  } catch { barridos = []; unidades = []; }

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
        <div class="capture-section" id="barridoSection">
          <h2 class="section-title">Seleccionar Barrido</h2>
          <div class="filters-bar">
            <select id="filterBarrido" class="filter-select" style="flex:1;">
              <option value="">-- Seleccione barrido --</option>
              ${barridos.map(b => `<option value="${b.id}" data-nombre="${b.nombre}">${b.nombre}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="capture-section" id="formSection" style="display:none;">
          <div id="barridoActivo" class="confirm-box" style="display:none;">
            <span>Barrido: <strong id="barridoNombre"></strong></span>
            <button class="btn btn-outline btn-sm" id="changeBarrido">Cambiar</button>
          </div>

          <h2 class="section-title">Registrar Conteo</h2>
          <form id="captureForm" novalidate>
            <div class="form-row">
              <div class="form-group">
                <label for="f_codigo">Codigo</label>
                <input type="text" id="f_codigo" maxlength="50" placeholder="Buscar por codigo o cod.fab..." list="codigo-options">
                <datalist id="codigo-options"></datalist>
                <small id="codigoStatus" class="field-hint"></small>
              </div>
              <div class="form-group">
                <label for="f_unidad">Unidad *</label>
                <select id="f_unidad" required>
                  <option value="">Seleccione...</option>
                  ${unidades.map(u => `<option value="${u.descripcion}">${u.descripcion}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="f_descripcion">Descripcion</label>
              <input type="text" id="f_descripcion" maxlength="255" placeholder="Se autollena si el codigo existe, o escriba manualmente">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="f_ubicacion">Ubicacion *</label>
                <input type="text" id="f_ubicacion" required maxlength="100" placeholder="Ej: ESTANTE-A1">
              </div>
              <div class="form-group">
                <label for="f_conteo">Conteo *</label>
                <input type="number" id="f_conteo" required min="0" step="0.0001" placeholder="0">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group" id="serieLoteGroup" style="display:none;">
                <label for="f_serie_lote">Lote/Serie</label>
                <input type="text" id="f_serie_lote" maxlength="100" placeholder="Serie o lote">
              </div>
              <div class="form-group">
                <label for="f_vcto">Vencimiento</label>
                <input type="date" id="f_vcto">
              </div>
            </div>
            <div class="form-group">
              <label for="f_observacion">Nota</label>
              <input type="text" id="f_observacion" maxlength="255" placeholder="Opcional">
            </div>
            <div id="formError" class="form-error" style="display:none;"></div>
            <div id="formSuccess" class="form-success" style="display:none;"></div>
            <div style="display:flex;gap:0.5rem;">
              <button type="submit" class="btn btn-primary" id="submitBtn">Registrar</button>
              <button type="button" class="btn btn-outline" id="resetBtn">Limpiar</button>
            </div>
          </form>
        </div>

        <div class="capture-section" id="countsSection" style="display:none;">
          <h2 class="section-title">Mis Conteos Recientes</h2>
          <div id="myCountsContainer" class="table-container"></div>
          <div id="myCountsPagination" class="pagination"></div>
        </div>
      </main>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  document.getElementById('filterBarrido').addEventListener('change', (e) => {
    const val = e.target.value;
    if (val) {
      const opt = e.target.options[e.target.selectedIndex];
      currentBarridoId = parseInt(val, 10);
      currentBarrido = opt.dataset.nombre;
      document.getElementById('barridoSection').querySelector('.section-title').textContent = 'Barrido Activo';
      document.getElementById('barridoActivo').style.display = 'flex';
      document.getElementById('barridoNombre').textContent = currentBarrido;
      document.getElementById('filterBarrido').style.display = 'none';
      document.getElementById('formSection').style.display = 'block';
      document.getElementById('countsSection').style.display = 'block';
      loadMyCounts();
      document.getElementById('f_codigo').focus();
    }
  });

  document.getElementById('changeBarrido').addEventListener('click', () => {
    currentBarrido = '';
    currentBarridoId = null;
    document.getElementById('filterBarrido').value = '';
    document.getElementById('filterBarrido').style.display = '';
    document.getElementById('barridoSection').querySelector('.section-title').textContent = 'Seleccionar Barrido';
    document.getElementById('barridoActivo').style.display = 'none';
    document.getElementById('formSection').style.display = 'none';
    document.getElementById('countsSection').style.display = 'none';
    document.getElementById('captureForm').reset();
    document.getElementById('formError').style.display = 'none';
    document.getElementById('formSuccess').style.display = 'none';
    document.getElementById('codigoStatus').textContent = '';
    clearSerieLote();
  });

  document.getElementById('f_codigo').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const codigo = e.target.value.trim();
    const statusEl = document.getElementById('codigoStatus');

    if (!codigo) {
      statusEl.textContent = '';
      statusEl.className = 'field-hint';
      return;
    }

    statusEl.textContent = 'Buscando...';
    statusEl.className = 'field-hint';

    searchTimer = setTimeout(() => searchCodigo(codigo), 400);
  });

  document.getElementById('captureForm').addEventListener('submit', handleCaptureSubmit);
  document.getElementById('resetBtn').addEventListener('click', resetForm);

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    localStorage.clear();
    window.location.hash = '#/login';
  });
}

async function searchCodigo(codigo) {
  const statusEl = document.getElementById('codigoStatus');
  const descInput = document.getElementById('f_descripcion');
  const unidadSelect = document.getElementById('f_unidad');
  const datalist = document.getElementById('codigo-options');

  try {
    const result = await planillasService.list({ barrido: currentBarrido, search: codigo, limit: 10 });
    const matches = result.data || [];

    const exactCodigo = matches.find(p => p.codigo && p.codigo.toUpperCase() === codigo.toUpperCase());
    const exactFab = matches.find(p => p.cod_fab && p.cod_fab.toUpperCase() === codigo.toUpperCase());
    const match = exactCodigo || exactFab || matches[0];

    if (match && (exactCodigo || exactFab || matches.length === 1)) {
      datalist.innerHTML = '';
      document.getElementById('f_codigo').value = match.codigo;
      descInput.value = match.descripcion || '';
      descInput.readOnly = true;
      descInput.classList.add('input-disabled');

      if (match.cunidad) {
        unidadSelect.value = match.cunidad;
      }

      if (match.maneja_serie_lote) {
        document.getElementById('serieLoteGroup').style.display = 'block';
        document.getElementById('f_serie_lote').required = true;
        document.getElementById('f_serie_lote').value = match.serie_lote || '';
      } else {
        clearSerieLote();
      }

      if (match.vcto) {
        document.getElementById('f_vcto').value = match.vcto;
      }

      statusEl.textContent = `Encontrado: ${match.codigo} - ${match.descripcion}`;
      statusEl.className = 'field-hint field-hint-ok';
    } else if (matches.length > 1) {
      datalist.innerHTML = matches.map(p => {
        const label = p.codigo + (p.cod_fab ? ` (${p.cod_fab})` : '') + ' - ' + (p.descripcion || '');
        return `<option value="${p.codigo}" label="${label}">`;
      }).join('');
      statusEl.textContent = `${matches.length} coincidencias. Escriba o seleccione una opcion.`;
      statusEl.className = 'field-hint field-hint-warn';
      descInput.value = '';
      descInput.readOnly = false;
      descInput.classList.remove('input-disabled');
      clearSerieLote();
    } else {
      datalist.innerHTML = '';
      statusEl.textContent = 'Codigo no encontrado. Escriba la descripcion manualmente.';
      statusEl.className = 'field-hint field-hint-warn';
      descInput.value = '';
      descInput.readOnly = false;
      descInput.classList.remove('input-disabled');
      clearSerieLote();
    }
  } catch (err) {
    console.error('[Captura] Search failed:', err.message);
    datalist.innerHTML = '';
    statusEl.textContent = 'Error al buscar. Escriba la descripcion manualmente.';
    statusEl.className = 'field-hint field-hint-warn';
    descInput.value = '';
    descInput.readOnly = false;
    descInput.classList.remove('input-disabled');
    clearSerieLote();
  }
}

function clearSerieLote() {
  document.getElementById('serieLoteGroup').style.display = 'none';
  document.getElementById('f_serie_lote').required = false;
  document.getElementById('f_serie_lote').value = '';
}

function resetForm() {
  document.getElementById('captureForm').reset();
  document.getElementById('f_descripcion').readOnly = false;
  document.getElementById('f_descripcion').classList.remove('input-disabled');
  document.getElementById('codigoStatus').textContent = '';
  document.getElementById('codigoStatus').className = 'field-hint';
  document.getElementById('formError').style.display = 'none';
  document.getElementById('formSuccess').style.display = 'none';
  clearSerieLote();
  document.getElementById('f_codigo').focus();
}

async function handleCaptureSubmit(e) {
  e.preventDefault();
  const errorDiv = document.getElementById('formError');
  const successDiv = document.getElementById('formSuccess');
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';

  if (!currentBarrido) {
    errorDiv.textContent = 'Debe seleccionar un barrido';
    errorDiv.style.display = 'block';
    return;
  }

  const codigo = document.getElementById('f_codigo').value.trim();
  const descripcion = document.getElementById('f_descripcion').value.trim();
  const ubicacion = document.getElementById('f_ubicacion').value.trim();
  const conteo = parseFloat(document.getElementById('f_conteo').value);
  const cunidad = document.getElementById('f_unidad').value;
  const serie_lote = document.getElementById('f_serie_lote').value.trim() || '-';
  const vcto_capturado = document.getElementById('f_vcto').value || null;
  const observacion = document.getElementById('f_observacion').value.trim() || null;

  if (!codigo) {
    errorDiv.textContent = 'El codigo es requerido';
    errorDiv.style.display = 'block';
    return;
  }
  if (!ubicacion) {
    errorDiv.textContent = 'La ubicacion es requerida';
    errorDiv.style.display = 'block';
    return;
  }
  if (isNaN(conteo) || conteo < 0) {
    errorDiv.textContent = 'El conteo debe ser un numero mayor o igual a 0';
    errorDiv.style.display = 'block';
    return;
  }
  if (!cunidad) {
    errorDiv.textContent = 'La unidad es requerida';
    errorDiv.style.display = 'block';
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;

  try {
    const data = {
      barrido_id: currentBarridoId,
      barrido: currentBarrido,
      codigo,
      descripcion: descripcion || null,
      ubicacion,
      conteo,
      cunidad,
      serie_lote,
      vcto_capturado,
      observacion,
    };

    console.log('[Captura] Submitting:', data);
    await conteosService.create(data);
    console.log('[Captura] Created');
    successDiv.textContent = 'Conteo registrado exitosamente';
    successDiv.style.display = 'block';
    resetForm();
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
            <th>Descripcion</th>
            <th>Ubicacion</th>
            <th>Conteo</th>
            <th>Unidad</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(c => `
            <tr>
              <td>${c.codigo}</td>
              <td>${c.descripcion || ''}</td>
              <td>${c.ubicacion}</td>
              <td>${c.conteo}</td>
              <td>${c.cunidad || ''}</td>
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