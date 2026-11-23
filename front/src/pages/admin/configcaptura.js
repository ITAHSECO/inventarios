import { configCapturaService } from '../../services/configcaptura.service.js';

const CAMPO_LABELS = {
  codigo: 'Codigo',
  unidad: 'Unidad',
  descripcion: 'Descripcion',
  ubicacion: 'Ubicacion',
  conteo: 'Conteo',
  almacen: 'Almacen',
  marca: 'Marca',
  serie_lote: 'Lote/Serie',
  vcto: 'Vencimiento',
  observacion: 'Nota',
};

const CAMPO_DESC = {
  codigo: 'Busqueda de articulo (siempre visible para buscar)',
  unidad: 'Unidad de medida',
  descripcion: 'Descripcion del articulo',
  ubicacion: 'Ubicacion fisica',
  conteo: 'Cantidad contada',
  almacen: 'Almacen fisico',
  marca: 'Marca del articulo',
  serie_lote: 'Se muestra solo si el articulo maneja serie/lote',
  vcto: 'Se muestra solo si el articulo maneja serie/lote',
  observacion: 'Nota opcional',
};

let currentConfig = [];

export async function renderConfigCaptura(container) {
  container.innerHTML = `
    <div class="page-container">
      <header class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <a href="#/dashboard" class="btn btn-outline btn-sm">&larr; Dashboard</a>
          <h1>Campos del Formulario de Captura</h1>
        </div>
        <button class="btn btn-primary btn-sm" id="btnGuardar" disabled>Guardar cambios</button>
      </header>

      <p class="page-hint">
        Active o desactive los campos del formulario de captura y marque cuales son obligatorios.
        Los cambios se aplican al instante para los inventariadores.
      </p>

      <div id="configContainer" class="table-container">
        <p class="loading">Cargando...</p>
      </div>

      <div id="configError" class="form-error" style="display:none;"></div>
      <div id="configSuccess" class="form-success" style="display:none;"></div>
    </div>
  `;

  document.getElementById('btnGuardar').addEventListener('click', handleSave);
  await loadConfig();
}

async function loadConfig() {
  const container = document.getElementById('configContainer');

  try {
    const result = await configCapturaService.getAll();
    currentConfig = result.data || [];

    if (currentConfig.length === 0) {
      container.innerHTML = '<p class="empty-state">No hay configuracion disponible.</p>';
      return;
    }

    renderTable();
  } catch (err) {
    console.error('[ConfigCaptura] Load failed:', err.message);
    container.innerHTML = `<p class="form-error" style="display:block;">${err.message}</p>`;
  }
}

function renderTable() {
  const container = document.getElementById('configContainer');

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Campo</th>
          <th>Activo</th>
          <th>Obligatorio</th>
        </tr>
      </thead>
      <tbody>
        ${currentConfig.map(item => `
          <tr data-campo="${item.campo}">
            <td>
              <strong>${CAMPO_LABELS[item.campo] || item.campo}</strong><br>
              <small class="field-hint">${CAMPO_DESC[item.campo] || ''}</small>
            </td>
            <td>
              <label class="checkbox-label">
                <input type="checkbox" class="chk-activo" ${item.activo ? 'checked' : ''}>
                <span>${item.activo ? 'Visible' : 'Oculto'}</span>
              </label>
            </td>
            <td>
              <label class="checkbox-label">
                <input type="checkbox" class="chk-obligatorio" ${item.obligatorio ? 'checked' : ''} ${!item.activo ? 'disabled' : ''}>
                <span>${item.obligatorio ? 'Obligatorio' : 'Opcional'}</span>
              </label>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.querySelectorAll('.chk-activo').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const row = e.target.closest('tr');
      const campo = row.dataset.campo;
      const item = currentConfig.find(c => c.campo === campo);
      item.activo = e.target.checked;

      if (!item.activo) {
        item.obligatorio = false;
        row.querySelector('.chk-obligatorio').checked = false;
        row.querySelector('.chk-obligatorio').disabled = true;
      } else {
        row.querySelector('.chk-obligatorio').disabled = false;
      }

      row.querySelector('.chk-activo').nextElementSibling.textContent = item.activo ? 'Visible' : 'Oculto';
      row.querySelector('.chk-obligatorio').nextElementSibling.textContent = item.obligatorio ? 'Obligatorio' : 'Opcional';
      markDirty();
    });
  });

  container.querySelectorAll('.chk-obligatorio').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const row = e.target.closest('tr');
      const campo = row.dataset.campo;
      const item = currentConfig.find(c => c.campo === campo);
      item.obligatorio = e.target.checked;
      e.target.nextElementSibling.textContent = item.obligatorio ? 'Obligatorio' : 'Opcional';
      markDirty();
    });
  });
}

function markDirty() {
  document.getElementById('btnGuardar').disabled = false;
  document.getElementById('configSuccess').style.display = 'none';
  document.getElementById('configError').style.display = 'none';
}

async function handleSave() {
  const btn = document.getElementById('btnGuardar');
  const errorDiv = document.getElementById('configError');
  const successDiv = document.getElementById('configSuccess');

  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';

  const payload = currentConfig.map(c => ({
    campo: c.campo,
    activo: c.activo,
    obligatorio: c.obligatorio,
  }));

  btn.disabled = true;

  try {
    await configCapturaService.update(payload);
    console.log('[ConfigCaptura] Saved:', payload.length, 'campos');
    successDiv.textContent = 'Configuracion guardada. Los inventariadores ya ven los cambios.';
    successDiv.style.display = 'block';
  } catch (err) {
    console.error('[ConfigCaptura] Save failed:', err.message);
    errorDiv.textContent = err.message;
    errorDiv.style.display = 'block';
    btn.disabled = false;
  }
}
