const ROLE_LABELS = {
  superadmin: 'Super Administrador',
  admin: 'Administrador',
  inventariador: 'Inventariador',
  reportes: 'Reportes',
};

const ROLE_MENU = {
  superadmin: [
    { label: 'Gestion de Usuarios', icon: '👥', hash: '#/admin/usuarios' },
    { label: 'Tabla Maestra', icon: '📋', hash: '#/admin/maestra' },
    { label: 'Cargas Masivas', icon: '📁', hash: '#/admin/cargas' },
    { label: 'Reportes', icon: '📊', hash: '#/reportes' },
  ],
  admin: [
    { label: 'Gestion de Usuarios', icon: '👥', hash: '#/admin/usuarios' },
    { label: 'Tabla Maestra', icon: '📋', hash: '#/admin/maestra' },
    { label: 'Cargas Masivas', icon: '📁', hash: '#/admin/cargas' },
    { label: 'Reportes', icon: '📊', hash: '#/reportes' },
  ],
  inventariador: [
    { label: 'Captura de Inventario', icon: '📦', hash: '#/captura' },
  ],
  reportes: [
    { label: 'Reportes', icon: '📊', hash: '#/reportes' },
  ],
};

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function renderDashboard(container) {
  const user = getUser();

  if (!user) {
    window.location.hash = '#/login';
    return;
  }

  const roleLabel = ROLE_LABELS[user.rol] || user.rol;
  const menuItems = ROLE_MENU[user.rol] || [];

  container.innerHTML = `
    <div class="dashboard">
      <header class="dashboard-header">
        <div class="dashboard-header-left">
          <img src="/inventarios/assets/logo.png" alt="Logo" class="dashboard-logo" onerror="this.style.display='none'">
          <h1>Inventarios</h1>
        </div>
        <div class="dashboard-header-right">
          <span class="user-info">
            <span class="user-name">${user.nombres || ''} ${user.apellidos || ''}</span>
            <span class="user-role">${roleLabel}</span>
          </span>
          <button class="btn btn-outline btn-sm" id="logoutBtn">Cerrar sesion</button>
        </div>
      </header>

      <main class="dashboard-main">
        <div class="welcome-card">
          <h2>Bienvenido, ${user.nombres || user.username}</h2>
          <p class="welcome-role">Rol: <strong>${roleLabel}</strong></p>
        </div>

        <div class="menu-grid">
          ${menuItems.map(item => `
            <a href="${item.hash}" class="menu-card">
              <span class="menu-icon">${item.icon}</span>
              <span class="menu-label">${item.label}</span>
            </a>
          `).join('')}
        </div>
      </main>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await authService.logout();
    } catch {}
    localStorage.clear();
    window.location.hash = '#/login';
  });
}