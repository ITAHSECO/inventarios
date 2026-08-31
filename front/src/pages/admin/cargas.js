import { authService } from '../../services/auth.service.js';
import { catalogosService } from '../../services/catalogos.service.js';
import { planillasService } from '../../services/planillas.service.js';
import { barridosService } from '../../services/barridos.service.js';
import { parseCSVFile, rowsToObjects } from '../../utils/csv.js';

const USUARIOS_HEADERS = ['email', 'password', 'username', 'nombres', 'apellidos', 'rol'];
const CATALOGOS_HEADERS = ['id_tabla', 'id_elemento', 'descripcion', 'activo'];
const PLANILLAS_HEADERS = ['codigo', 'cod_fab', 'existencia', 'articulo', 'cunidad', 'id_alm', 'id_marca', 'id_categoria', 'serie_lote', 'vcto', 'maneja_serie_lote'];

export async function renderCargas(container) {
  container.innerHTML = `
    <div class="page-container">
      <header class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <a href="#/dashboard" class="btn btn-outline btn-sm">&larr; Dashboard</a>
          <h1>Cargas Masivas</h1>
        </div>
      </header>

      <div class="tabs">
        <button class="tab active" data-tab="usuarios">Usuarios</button>
        <button class="tab" data-tab="maestra">Tablas Maestras</button>
        <button class="tab" data-tab="planilla">Planilla de Inventario</button>
      </div>

      <div id="tab-usuarios" class="tab-content active">
        <div class="carga-panel">
          <h2>Carga Masiva de Usuarios</h2>
          <p class="carga-hint">CSV con columnas: <code>email, password, username, nombres, apellidos, rol</code></p>

          <div class="form-group">
            <label for="u-file">Seleccionar archivo CSV</label>
            <input type="file" id="u-file" accept=".csv" class="file-input">
          </div>

          <div id="u-preview" class="preview-container" style="display:none;"></div>

          <div id="u-result" class="result-container" style="display:none;"></div>

          <button id="u-upload" class="btn btn-primary btn-sm" style="display:none;">Cargar N usuarios</button>
        </div>
      </div>

      <div id="tab-maestra" class="tab-content">
        <div class="carga-panel">
          <h2>Carga Masiva de Tablas Maestras</h2>
          <p class="carga-hint">CSV con columnas: <code>id_elemento, descripcion, activo</code></p>

          <div class="form-group">
            <label for="m-tabla">Tabla destino</label>
            <select id="m-tabla" class="filter-select" required>
              <option value="">Seleccione una tabla...</option>
            </select>
          </div>

          <div class="form-group">
            <label for="m-file">Seleccionar archivo CSV</label>
            <input type="file" id="m-file" accept=".csv" class="file-input" disabled>
          </div>

          <div id="m-preview" class="preview-container" style="display:none;"></div>

          <div id="m-result" class="result-container" style="display:none;"></div>

          <button id="m-upload" class="btn btn-primary btn-sm" style="display:none;">Cargar N registros</button>
        </div>
      </div>

      <div id="tab-planilla" class="tab-content">
        <div class="carga-panel">
          <h2>Carga Masiva de Planilla de Inventario</h2>
          <p class="carga-hint">CSV con columnas: <code>codigo, cod_fab, existencia, articulo, cunidad, id_alm, id_marca, id_categoria, serie_lote, vcto, maneja_serie_lote</code></p>

          <div class="form-group">
            <label for="p-barrido">Barrido destino</label>
            <select id="p-barrido" class="filter-select" required>
              <option value="">Seleccione un barrido...</option>
            </select>
          </div>

          <div id="p-barrido-confirm" style="display:none;">
            <div class="confirm-box">
              <span>Barrido seleccionado: <strong id="p-barrido-nombre"></strong></span>
              <button id="p-barrido-change" class="btn btn-outline btn-sm">Cambiar</button>
            </div>
          </div>

          <div id="p-file-section" style="display:none;">
            <div class="form-group">
              <label for="p-file">Seleccionar archivo CSV</label>
              <input type="file" id="p-file" accept=".csv" class="file-input">
            </div>
          </div>

          <div id="p-preview" class="preview-container" style="display:none;"></div>

          <div id="p-result" class="result-container" style="display:none;"></div>

          <button id="p-upload" class="btn btn-primary btn-sm" style="display:none;">Cargar N registros</button>
        </div>
      </div>
    </div>
  `;

  bindTabs();
  await initUsuarios();
  await initMaestra();
  await initPlanilla();
}

function bindTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });
}

function renderPreviewTable(headers, rows, maxRows = 50) {
  const displayRows = rows.slice(0, maxRows);
  return `
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${displayRows.map(row => `
            <tr>${row.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ${rows.length > maxRows ? `<p class="preview-more">Mostrando ${maxRows} de ${rows.length} filas</p>` : ''}
    <p class="preview-count">${rows.length} registros para cargar</p>
  `;
}

function maskPassword(val) {
  return val ? '****' : '';
}

function showResult(el, data, type) {
  const isError = type === 'error';
  el.innerHTML = `
    <div class="result-box ${isError ? 'result-error' : 'result-success'}">
      <p>${isError ? data.message || 'Error en la carga' : `Operacion completada. Registros procesados: ${data.inserted || data.created || 0}`}</p>
      ${data.errors && data.errors.length > 0 ? `
        <ul class="result-errors">
          ${data.errors.map(e => `<li>Fila ${e.row || ''}: ${e.message}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `;
  el.style.display = 'block';
}

async function initUsuarios() {
  let parsedData = null;

  document.getElementById('u-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { headers, rows } = await parseCSVFile(file);
      const missing = USUARIOS_HEADERS.filter(h => !headers.includes(h));
      if (missing.length > 0) {
        document.getElementById('u-preview').innerHTML = `<p class="form-error" style="display:block;">Faltan columnas: ${missing.join(', ')}</p>`;
        document.getElementById('u-preview').style.display = 'block';
        document.getElementById('u-upload').style.display = 'none';
        return;
      }

      parsedData = rowsToObjects(headers, rows);
      const previewRows = rows.map((row, i) => {
        const obj = {};
        headers.forEach((h, j) => { obj[h] = row[j] || ''; });
        return USUARIOS_HEADERS.map(h => h === 'password' ? maskPassword(obj[h]) : obj[h]);
      });

      document.getElementById('u-preview').innerHTML = renderPreviewTable(USUARIOS_HEADERS, previewRows);
      document.getElementById('u-preview').style.display = 'block';
      document.getElementById('u-upload').style.display = 'inline-block';
      document.getElementById('u-upload').textContent = `Cargar ${parsedData.length} usuarios`;
      document.getElementById('u-result').style.display = 'none';
    } catch (err) {
      console.error('[Cargas] CSV parse error:', err.message);
      document.getElementById('u-preview').innerHTML = `<p class="form-error" style="display:block;">Error al leer el CSV: ${err.message}</p>`;
      document.getElementById('u-preview').style.display = 'block';
    }
  });

  document.getElementById('u-upload').addEventListener('click', async () => {
    if (!parsedData) return;
    const btn = document.getElementById('u-upload');
    btn.disabled = true;
    btn.textContent = 'Cargando...';

    try {
      console.log('[Cargas] Uploading usuarios:', parsedData.length);
      const result = await authService.bulkSignup(parsedData);
      console.log('[Cargas] Usuarios uploaded:', result);
      showResult(document.getElementById('u-result'), result, 'success');
      parsedData = null;
      document.getElementById('u-preview').style.display = 'none';
      document.getElementById('u-file').value = '';
    } catch (err) {
      console.error('[Cargas] Usuarios upload failed:', err.message);
      showResult(document.getElementById('u-result'), err, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Cargar usuarios';
    }
  });
}

async function initMaestra() {
  let tablas = [];
  let parsedData = null;

  try {
    const result = await catalogosService.getTablas();
    tablas = result.data || [];
    const select = document.getElementById('m-tabla');
    tablas.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('[Cargas] Load tablas failed:', err.message);
  }

  document.getElementById('m-tabla').addEventListener('change', (e) => {
    const hasTabla = !!e.target.value;
    document.getElementById('m-file').disabled = !hasTabla;
    if (!hasTabla) {
      document.getElementById('m-preview').style.display = 'none';
      document.getElementById('m-upload').style.display = 'none';
      parsedData = null;
    }
  });

  document.getElementById('m-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { headers, rows } = await parseCSVFile(file);
      const missing = CATALOGOS_HEADERS.filter(h => !headers.includes(h));
      if (missing.length > 0) {
        document.getElementById('m-preview').innerHTML = `<p class="form-error" style="display:block;">Faltan columnas: ${missing.join(', ')}</p>`;
        document.getElementById('m-preview').style.display = 'block';
        document.getElementById('m-upload').style.display = 'none';
        return;
      }

      parsedData = rowsToObjects(headers, rows);
      const previewRows = rows.map(row => {
        const obj = {};
        headers.forEach((h, j) => { obj[h] = row[j] || ''; });
        return CATALOGOS_HEADERS.map(h => obj[h]);
      });

      document.getElementById('m-preview').innerHTML = renderPreviewTable(CATALOGOS_HEADERS, previewRows);
      document.getElementById('m-preview').style.display = 'block';
      document.getElementById('m-upload').style.display = 'inline-block';
      document.getElementById('m-upload').textContent = `Cargar ${parsedData.length} registros`;
      document.getElementById('m-result').style.display = 'none';
    } catch (err) {
      console.error('[Cargas] CSV parse error:', err.message);
      document.getElementById('m-preview').innerHTML = `<p class="form-error" style="display:block;">Error al leer el CSV: ${err.message}</p>`;
      document.getElementById('m-preview').style.display = 'block';
    }
  });

  document.getElementById('m-upload').addEventListener('click', async () => {
    if (!parsedData) return;
    const btn = document.getElementById('m-upload');
    btn.disabled = true;
    btn.textContent = 'Cargando...';

    try {
      const catalogos = parsedData.map(row => ({
        id_tabla: document.getElementById('m-tabla').value,
        id_elemento: row.id_elemento,
        descripcion: row.descripcion,
        activo: row.activo !== 'false' && row.activo !== '0',
      }));

      console.log('[Cargas] Uploading catalogos:', catalogos.length);
      const result = await catalogosService.bulkCreate(catalogos);
      console.log('[Cargas] Catalogos uploaded:', result);
      showResult(document.getElementById('m-result'), result, 'success');
      parsedData = null;
      document.getElementById('m-preview').style.display = 'none';
      document.getElementById('m-file').value = '';
    } catch (err) {
      console.error('[Cargas] Catalogos upload failed:', err.message);
      showResult(document.getElementById('m-result'), err, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Cargar registros';
    }
  });
}

async function initPlanilla() {
  let barridos = [];
  let selectedBarrido = null;
  let parsedData = null;

  try {
    const result = await barridosService.list({ limit: 100, estado: 'activo' });
    barridos = result.data || [];
    const select = document.getElementById('p-barrido');
    barridos.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.nombre;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('[Cargas] Load barridos failed:', err.message);
  }

  document.getElementById('p-barrido').addEventListener('change', (e) => {
    const id = parseInt(e.target.value);
    selectedBarrido = barridos.find(b => b.id === id);

    if (selectedBarrido) {
      document.getElementById('p-barrido-nombre').textContent = selectedBarrido.nombre;
      document.getElementById('p-barrido-confirm').style.display = 'block';
      document.getElementById('p-file-section').style.display = 'block';
      document.getElementById('p-barrido').style.display = 'none';
    }
  });

  document.getElementById('p-barrido-change').addEventListener('click', () => {
    selectedBarrido = null;
    document.getElementById('p-barrido').value = '';
    document.getElementById('p-barrido').style.display = '';
    document.getElementById('p-barrido-confirm').style.display = 'none';
    document.getElementById('p-file-section').style.display = 'none';
    document.getElementById('p-preview').style.display = 'none';
    document.getElementById('p-upload').style.display = 'none';
    document.getElementById('p-file').value = '';
    parsedData = null;
  });

  document.getElementById('p-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { headers, rows } = await parseCSVFile(file);
      const missing = PLANILLAS_HEADERS.filter(h => !headers.includes(h));
      if (missing.length > 0) {
        document.getElementById('p-preview').innerHTML = `<p class="form-error" style="display:block;">Faltan columnas: ${missing.join(', ')}</p>`;
        document.getElementById('p-preview').style.display = 'block';
        document.getElementById('p-upload').style.display = 'none';
        return;
      }

      parsedData = rowsToObjects(headers, rows);
      const previewRows = rows.map(row => {
        const obj = {};
        headers.forEach((h, j) => { obj[h] = row[j] || ''; });
        return PLANILLAS_HEADERS.map(h => obj[h]);
      });

      document.getElementById('p-preview').innerHTML = renderPreviewTable(PLANILLAS_HEADERS, previewRows);
      document.getElementById('p-preview').style.display = 'block';
      document.getElementById('p-upload').style.display = 'inline-block';
      document.getElementById('p-upload').textContent = `Cargar ${parsedData.length} registros`;
      document.getElementById('p-result').style.display = 'none';
    } catch (err) {
      console.error('[Cargas] CSV parse error:', err.message);
      document.getElementById('p-preview').innerHTML = `<p class="form-error" style="display:block;">Error al leer el CSV: ${err.message}</p>`;
      document.getElementById('p-preview').style.display = 'block';
    }
  });

  document.getElementById('p-upload').addEventListener('click', async () => {
    if (!parsedData || !selectedBarrido) return;
    const btn = document.getElementById('p-upload');
    btn.disabled = true;
    btn.textContent = 'Cargando...';

    try {
      const planillas = parsedData.map(row => ({
        codigo: row.codigo,
        cod_fab: row.cod_fab || null,
        existencia: parseFloat(row.existencia) || 0,
        articulo: row.articulo,
        cunidad: row.cunidad || null,
        id_alm: row.id_alm,
        id_marca: row.id_marca || null,
        id_categoria: row.id_categoria || null,
        serie_lote: row.serie_lote || '-',
        vcto: row.vcto || null,
        maneja_serie_lote: row.maneja_serie_lote === 'true' || row.maneja_serie_lote === '1',
      }));

      console.log('[Cargas] Uploading planillas:', planillas.length, 'barrido:', selectedBarrido.nombre);
      const result = await planillasService.bulkCreate(selectedBarrido.nombre, planillas);
      console.log('[Cargas] Planillas uploaded:', result);
      showResult(document.getElementById('p-result'), result, 'success');
      parsedData = null;
      document.getElementById('p-preview').style.display = 'none';
      document.getElementById('p-file').value = '';
    } catch (err) {
      console.error('[Cargas] Planillas upload failed:', err.message);
      showResult(document.getElementById('p-result'), err, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Cargar registros';
    }
  });
}