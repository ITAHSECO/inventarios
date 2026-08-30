export function renderCaptura(container) {
  container.innerHTML = `
    <div class="page-container">
      <header class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <a href="#/dashboard" class="btn btn-outline btn-sm">&larr; Dashboard</a>
          <h1>Captura de Inventario</h1>
        </div>
      </header>
      <div class="page-content">
        <p class="placeholder-text">Modulo en construccion. Aqui el inventariador registrara las capturas de conteo en campo.</p>
      </div>
    </div>
  `;
}