import './styles/auth.css';
import './styles/dashboard.css';
import { renderLogin } from './pages/login.js';
import { renderRegistro } from './pages/registro.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderUsuarios } from './pages/admin/usuarios.js';
import { renderMaestra } from './pages/admin/maestra.js';
import { renderCargas } from './pages/admin/cargas.js';
import { renderCaptura } from './pages/inventariador/captura.js';
import { renderReportes } from './pages/reportes/reportes.js';

const app = document.getElementById('app');

function requireAuth(renderFn) {
  return (container) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.hash = '#/login';
      return;
    }
    renderFn(container);
  };
}

function guestOnly(renderFn) {
  return (container) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      window.location.hash = '#/dashboard';
      return;
    }
    renderFn(container);
  };
}

const routes = {
  '/login': guestOnly(renderLogin),
  '/registro': guestOnly(renderRegistro),
  '/dashboard': requireAuth(renderDashboard),
  '/admin/usuarios': requireAuth(renderUsuarios),
  '/admin/maestra': requireAuth(renderMaestra),
  '/admin/cargas': requireAuth(renderCargas),
  '/captura': requireAuth(renderCaptura),
  '/reportes': requireAuth(renderReportes),
};

function router() {
  const hash = window.location.hash || '/login';
  const route = hash.replace('#', '');
  const render = routes[route];

  console.log('[Router]', route);

  if (render) {
    render(app);
  } else {
    console.warn('[Router] Route not found:', route);
    app.innerHTML = '<p style="text-align:center;padding:2rem;">Pagina no encontrada</p>';
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);