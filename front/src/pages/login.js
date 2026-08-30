import { authService } from '../services/auth.service.js';

export async function renderLogin(container) {
  container.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <img src="/inventarios/assets/logo.png" alt="Logo" onerror="this.style.display='none'">
        </div>
        <h1 class="auth-title">Inventarios</h1>
        <p class="auth-subtitle">Inicia sesion para continuar</p>

        <form id="loginForm" novalidate>
          <div class="form-group">
            <label for="email">Correo electronico</label>
            <input type="email" id="email" name="email" required placeholder="correo@ejemplo.com">
          </div>

          <div class="form-group">
            <label for="password">Contrasena</label>
            <input type="password" id="password" name="password" required placeholder="Tu contrasena">
          </div>

          <div id="formError" class="form-error" style="display:none;"></div>

          <button type="submit" class="btn btn-primary" id="submitBtn">
            <span id="btnText">Iniciar sesion</span>
            <span id="btnSpinner" class="spinner" style="display:none;"></span>
          </button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const errorDiv = document.getElementById('formError');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');

  errorDiv.style.display = 'none';

  const data = {
    email: form.email.value.trim(),
    password: form.password.value,
  };

  submitBtn.disabled = true;
  btnText.style.display = 'none';
  btnSpinner.style.display = 'inline-block';

  try {
    console.log('[Login] Attempting login...');
    const result = await authService.login(data);
    const { user, session } = result.data;

    localStorage.setItem('access_token', session.access_token);
    localStorage.setItem('refresh_token', session.refresh_token);
    localStorage.setItem('user', JSON.stringify(user));

    console.log('[Login] Success, redirecting', user);
    window.location.hash = user.rol === 'inventariador' ? '#/captura' : '#/dashboard';
  } catch (err) {
    console.error('[Login] Failed:', err.message);
    errorDiv.textContent = err.message;
    errorDiv.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
  }
}