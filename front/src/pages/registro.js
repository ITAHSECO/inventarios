import { authService } from '../services/auth.service.js';
import { catalogosService } from '../services/catalogos.service.js';

export async function renderRegistro(container) {
  let roles = [];

  try {
    console.log('[Registro] Loading roles from maestra_parametros...');
    const res = await catalogosService.getActivos('ROL');
    roles = res.data || [];
    console.log('[Registro] Roles loaded:', roles);
  } catch (err) {
    console.error('[Registro] Failed to load roles:', err.message);
    roles = [];
  }

  container.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="auth-title">Registrar Usuario</h1>
        <p class="auth-subtitle">Crea una nueva cuenta en el sistema</p>

        <form id="registroForm" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label for="nombres">Nombres</label>
              <input type="text" id="nombres" name="nombres" required maxlength="100" placeholder="Ej: Juan Carlos">
            </div>
            <div class="form-group">
              <label for="apellidos">Apellidos</label>
              <input type="text" id="apellidos" name="apellidos" required maxlength="100" placeholder="Ej: Perez Lopez">
            </div>
          </div>

          <div class="form-group">
            <label for="username">Usuario</label>
            <input type="text" id="username" name="username" required minlength="3" maxlength="50"
                   pattern="[a-zA-Z0-9_.]+" placeholder="Solo letras, numeros, guiones bajos y puntos">
          </div>

          <div class="form-group">
            <label for="email">Correo electronico</label>
            <input type="email" id="email" name="email" required placeholder="correo@ejemplo.com">
          </div>

          <div class="form-group">
            <label for="password">Contrasena</label>
            <input type="password" id="password" name="password" required minlength="6" placeholder="Minimo 6 caracteres">
          </div>

          <div class="form-group">
            <label for="rol">Rol</label>
            <select id="rol" name="rol" required>
              <option value="">-- Seleccione un rol --</option>
              ${roles.map(r => `<option value="${r.id_elemento}">${r.descripcion}</option>`).join('')}
            </select>
          </div>

          <div id="formError" class="form-error" style="display:none;"></div>
          <div id="formSuccess" class="form-success" style="display:none;"></div>

          <button type="submit" class="btn btn-primary" id="submitBtn">
            <span id="btnText">Registrar</span>
            <span id="btnSpinner" class="spinner" style="display:none;"></span>
          </button>
        </form>

        <p class="auth-link">Ya tienes cuenta? <a href="#/login">Iniciar sesion</a></p>
      </div>
    </div>
  `;

  const form = document.getElementById('registroForm');
  form.addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');
  const errorDiv = document.getElementById('formError');
  const successDiv = document.getElementById('formSuccess');

  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';

  const data = {
    email: form.email.value.trim(),
    password: form.password.value,
    username: form.username.value.trim(),
    nombres: form.nombres.value.trim(),
    apellidos: form.apellidos.value.trim(),
    rol: form.rol.value || undefined,
  };

  submitBtn.disabled = true;
  btnText.style.display = 'none';
  btnSpinner.style.display = 'inline-block';

  try {
    console.log('[Registro] Submitting signup:', { email: data.email, username: data.username, rol: data.rol });
    await authService.signup(data);
    console.log('[Registro] Signup successful');
    successDiv.textContent = 'Usuario registrado exitosamente. Redirigiendo...';
    successDiv.style.display = 'block';
    form.reset();
    setTimeout(() => { window.location.hash = '#/login'; }, 2000);
  } catch (err) {
    console.error('[Registro] Signup failed:', err.message);
    errorDiv.textContent = err.message;
    errorDiv.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
  }
}