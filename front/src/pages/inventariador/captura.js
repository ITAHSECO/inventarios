import { barridosService } from '../../services/barridos.service.js';
import { catalogosService } from '../../services/catalogos.service.js';
import { conteosService } from '../../services/conteos.service.js';
import { planillasService } from '../../services/planillas.service.js';
import { configCapturaService } from '../../services/configcaptura.service.js';

let barridos = [];
let unidades = [];
let almacenes = [];
let marcas = [];
let estados = [];
let currentBarrido = '';
let currentBarridoId = null;
let searchTimer = null;
let fieldConfig = [];   // Config de campos del formulario (admin)
let serieLoteRequerido = false;  // El articulo actual maneja serie/lote

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

export async function renderCaptura(container) {
  const user = getUser();

  try {
    const [barridosRes, unidadesRes, configRes, almacenesRes, marcasRes, estadosRes] = await Promise.all([
      barridosService.getMisBarridos(),
      catalogosService.getActivos('CUNIDAD'),
      configCapturaService.getAll(),
      catalogosService.getActivos('ALMACEN'),
      catalogosService.getActivos('MARCA'),
      catalogosService.getActivos('ESTADO'),
    ]);
    barridos = barridosRes.data || [];
    unidades = unidadesRes.data || [];
    fieldConfig = configRes.data || [];
    almacenes = almacenesRes.data || [];
    marcas = marcasRes.data || [];
    estados = estadosRes.data || [];
  } catch { barridos = []; unidades = []; fieldConfig = []; almacenes = []; marcas = []; estados = []; }

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
              <div class="form-group" id="grp_codigo">
                <label for="f_codigo">Codigo</label>
                <input type="text" id="f_codigo" maxlength="50" placeholder="Buscar por codigo o cod.fab..." list="codigo-options">
                <datalist id="codigo-options"></datalist>
                <small id="codigoStatus" class="field-hint"></small>
              </div>
              <div class="form-group" id="grp_unidad">
                <label for="f_unidad">Unidad *</label>
                <select id="f_unidad" required>
                  <option value="">Seleccione...</option>
                  ${unidades.map(u => `<option value="${u.descripcion}">${u.descripcion}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-group" id="grp_descripcion">
              <label for="f_descripcion">Descripcion</label>
              <input type="text" id="f_descripcion" maxlength="255" placeholder="Se autollena si el codigo existe, o escriba manualmente">
            </div>
            <div class="form-row">
              <div class="form-group" id="grp_ubicacion">
                <label for="f_ubicacion">Ubicacion *</label>
                <input type="text" id="f_ubicacion" required maxlength="100" placeholder="Ej: ESTANTE-A1">
              </div>
              <div class="form-group" id="grp_conteo">
                <label for="f_conteo">Conteo *</label>
                <input type="number" id="f_conteo" required min="0" step="0.0001" placeholder="0">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group" id="grp_almacen">
                <label for="f_almacen">Almacen</label>
                <select id="f_almacen">
                  <option value="">Seleccione...</option>
                  ${almacenes.map(a => `<option value="${a.id_elemento}">${a.id_elemento} - ${a.descripcion}</option>`).join('')}
                </select>
              </div>
              <div class="form-group" id="grp_marca">
                <label for="f_marca">Marca</label>
                <input type="text" id="f_marca" maxlength="100" list="marca-options" autocomplete="off" placeholder="Escriba o seleccione la marca...">
                <datalist id="marca-options">
                  ${marcas.map(m => `<option value="${m.descripcion}">${m.id_elemento}</option>`).join('')}
                </datalist>
              </div>
              <div class="form-group" id="grp_estado">
                <label for="f_estado">Estado</label>
                <select id="f_estado">
                  <option value="">Seleccione...</option>
                  ${estados.map(e => `<option value="${e.id_elemento}">${e.id_elemento} - ${e.descripcion}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-row" id="loteVctoRow" style="display:none;">
              <div class="form-group" id="serieLoteGroup">
                <label for="f_serie_lote">Lote/Serie</label>
                <input type="text" id="f_serie_lote" maxlength="100" placeholder="Serie o lote">
              </div>
              <div class="form-group" id="vctoGroup">
                <label for="f_vcto">Vencimiento</label>
                <input type="date" id="f_vcto">
              </div>
            </div>
            <div class="form-group" id="grp_observacion">
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
  applyFieldConfig();
}

// ------------------------------------------------------------
// Config de campos (gestionada por admin en #/admin/config-captura)
// ------------------------------------------------------------
function cfgDe(campo) {
  return fieldConfig.find(c => c.campo === campo) || null;
}

function applyFieldConfig() {
  if (!fieldConfig.length) return;

  const GRUPOS = {
    codigo: 'grp_codigo',
    unidad: 'grp_unidad',
    descripcion: 'grp_descripcion',
    ubicacion: 'grp_ubicacion',
    conteo: 'grp_conteo',
    almacen: 'grp_almacen',
    marca: 'grp_marca',
    estado: 'grp_estado',
    serie_lote: 'serieLoteGroup',
    vcto: 'vctoGroup',
    observacion: 'grp_observacion',
  };

  for (const [campo, groupId] of Object.entries(GRUPOS)) {
    const cfg = cfgDe(campo);
    if (!cfg) continue;
    const group = document.getElementById(groupId);
    if (!group) continue;

    // La fila de serie/vcto se controla aparte (depende de maneja_serie_lote)
    if (campo === 'serie_lote' || campo === 'vcto') continue;

    group.style.display = cfg.activo ? '' : 'none';

    const label = group.querySelector('label');
    const input = group.querySelector('input, select');
    if (label) {
      const base = label.textContent.replace(/\s*\*$/, '');
      label.textContent = base + (cfg.activo && cfg.obligatorio ? ' *' : '');
    }
    if (input && input.type !== 'checkbox') {
      input.required = cfg.activo && cfg.obligatorio;
    }
  }

  updateSerieVctoRow();
}

// Muestra/oculta la fila Lote+Serie segun: config admin Y maneja_serie_lote
function updateSerieVctoRow() {
  const row = document.getElementById('loteVctoRow');
  if (!row) return;

  const cfgSerie = cfgDe('serie_lote');
  const cfgVcto = cfgDe('vcto');
  // Si el articulo requiere serie/lote, el campo se fuerza (lo exige la BD)
  const serieActivo = serieLoteRequerido ? true : (cfgSerie ? cfgSerie.activo : true);
  const vctoActivo = cfgVcto ? cfgVcto.activo : true;

  document.getElementById('serieLoteGroup').style.display = serieActivo ? '' : 'none';
  document.getElementById('vctoGroup').style.display = vctoActivo ? '' : 'none';

  const mostrarFila = serieLoteRequerido && (serieActivo || vctoActivo);
  row.style.display = mostrarFila ? 'flex' : 'none';

  const serieInput = document.getElementById('f_serie_lote');
  serieInput.required = serieLoteRequerido;
}

// Valida el payload segun la configuracion de campos del admin.
// Devuelve mensaje de error o null si todo esta bien.
function validarSegunConfig(valores) {
  // Estos campos son NOT NULL en la BD: siempre obligatorios
  if (!valores.codigo) return 'El codigo es requerido';
  if (!valores.ubicacion) return 'La ubicacion es requerida';
  if (isNaN(valores.conteo) || valores.conteo < 0) {
    return 'El conteo debe ser un numero mayor o igual a 0';
  }

  // Los demas siguen la config del admin (si no hay config, se comporta como antes)
  const obligatorio = (campo, porDefecto) => {
    const cfg = cfgDe(campo);
    return cfg ? (cfg.activo && cfg.obligatorio) : porDefecto;
  };
  const activo = (campo) => {
    const cfg = cfgDe(campo);
    return cfg ? cfg.activo : true;
  };

  if (activo('unidad') && obligatorio('unidad', true) && !valores.cunidad) {
    return 'La unidad es requerida';
  }
  if (activo('descripcion') && obligatorio('descripcion', false) && !valores.descripcion) {
    return 'La descripcion es requerida';
  }
  if (activo('almacen') && obligatorio('almacen', false) && !valores.almacen) {
    return 'El almacen es requerido';
  }
  if (activo('marca') && obligatorio('marca', false) && !valores.marca) {
    return 'La marca es requerida';
  }
  if (activo('estado') && obligatorio('estado', false) && !valores.estado) {
    return 'El estado es requerido';
  }
  if (serieLoteRequerido && (valores.serie_lote === '-' || !valores.serie_lote)) {
    return 'Este articulo requiere un numero de Serie/Lote valido';
  }
  if (activo('vcto') && serieLoteRequerido && obligatorio('vcto', false) && !valores.vcto_capturado) {
    return 'El vencimiento es requerido';
  }
  if (activo('observacion') && obligatorio('observacion', false) && !valores.observacion) {
    return 'La nota es requerida';
  }

  return null;
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

    const uniqueByCodigo = [];
    const seenCodigos = new Set();
    for (const p of matches) {
      if (!seenCodigos.has(p.codigo)) {
        seenCodigos.add(p.codigo);
        uniqueByCodigo.push(p);
      }
    }

    const exactCodigo = uniqueByCodigo.find(p => p.codigo && p.codigo.toUpperCase() === codigo.toUpperCase());
    const exactFab = uniqueByCodigo.find(p => p.cod_fab && p.cod_fab.toUpperCase() === codigo.toUpperCase());
    const match = exactCodigo || exactFab || uniqueByCodigo[0];

    if (match && (exactCodigo || exactFab || matches.length === 1)) {
      datalist.innerHTML = '';
      document.getElementById('f_codigo').value = match.codigo;
      descInput.value = match.descripcion || '';
      descInput.readOnly = true;
      descInput.classList.add('input-disabled');

      if (match.cunidad) {
        unidadSelect.value = match.cunidad;
      }

      clearSerieLote();
      document.getElementById('f_vcto').value = '';

      if (match.maneja_serie_lote) {
        serieLoteRequerido = true;
        updateSerieVctoRow();
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
  serieLoteRequerido = false;
  document.getElementById('f_serie_lote').required = false;
  document.getElementById('f_serie_lote').value = '';
  updateSerieVctoRow();
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
  const almacen = document.getElementById('f_almacen').value.trim() || null;
  const marca = document.getElementById('f_marca').value.trim() || null;
  const estado = document.getElementById('f_estado').value.trim() || null;
  const serie_lote = document.getElementById('f_serie_lote').value.trim() || '-';
  const vcto_capturado = document.getElementById('f_vcto').value || null;
  const observacion = document.getElementById('f_observacion').value.trim() || null;

  // Validacion segun config del admin. codigo/ubicacion/conteo son NOT NULL
  // en la BD, siempre se exigen sin importar la configuracion.
  const err = validarSegunConfig({ codigo, ubicacion, conteo, cunidad, almacen, marca, estado, serie_lote, vcto_capturado, observacion });
  if (err) {
    errorDiv.textContent = err;
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
      cunidad: cunidad || null,
      almacen,
      marca,
      estado,
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