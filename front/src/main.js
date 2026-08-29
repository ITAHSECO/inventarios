import './styles/auth.css';
import { renderRegistro } from './pages/registro.js';

const app = document.getElementById('app');

const routes = {
  '/registro': renderRegistro,
};

function router() {
  const hash = window.location.hash || '/registro';
  const render = routes[hash];

  if (render) {
    render(app);
  } else {
    app.innerHTML = '<p style="text-align:center;padding:2rem;">Pagina no encontrada</p>';
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);