/**
 * menu.js
 * Gestiona la carga del menú y la normalización de rutas dinámicas.
 */

function addMenu() {
  // Usamos FRONTEND_BASE para encontrar el componente menu.html
  const menuPath = `${window.FRONTEND_BASE}/src/components/menu.html`;

  return fetch(menuPath)
    .then((response) => response.text())
    .then((data) => {
      const menuContainer = document.getElementById("menu");
      if (!menuContainer) return;

      menuContainer.innerHTML = data;

      // --- CORRECCIÓN DE RUTAS DUPLICADAS ---
      document
        .querySelectorAll("#menu a[data-href], #menu .navbar-brand[data-href]")
        .forEach((link) => {
          let targetPath = link.dataset.href.replace("./", "");

          // Creamos una URL absoluta virtual para resolver la ruta correctamente
          // Esto evita el error de src/pages/src/pages
          const absolutePath = new URL(
            targetPath,
            window.location.origin +
              (window.FRONTEND_BASE === "." ? "/" : "/../../")
          ).pathname;

          // Si el enlace es index.html, va a la raíz, si no, a la ruta completa
          if (targetPath === "index.html") {
            link.setAttribute("href", `${window.FRONTEND_BASE}/index.html`);
          } else {
            // Forzamos que la ruta siempre parta desde la base del proyecto
            link.setAttribute(
              "href",
              window.location.origin + "/" + targetPath
            );
          }
        });

      mostrarUsuarioActivoMenu();
      setActiveLink();
      mobileMenuAnimation();

      // Configurar Logout
      const btnLogout = document.getElementById("logout-btn");
      if (btnLogout) {
        btnLogout.addEventListener("click", (e) => {
          e.preventDefault();
          localStorage.clear();
          window.location.href = `${window.FRONTEND_BASE}/index.html`;
        });
      }
    })
    .catch((err) => console.error("Error cargando el menú:", err));
}

function mostrarUsuarioActivoMenu() {
  const nombreUsuario = localStorage.getItem("usuarioActivo");
  const token = localStorage.getItem("jwt");
  const rol = localStorage.getItem("usuarioRol");

  const campoNombre = document.getElementById("usuario-logueado");
  const items = {
    dashboard: document.getElementById("nav-dashboard-item"),
    login: document.getElementById("nav-login-item"),
    logout: document.getElementById("nav-logout-item"),
    voluntariados: document.getElementById("nav-voluntariados-item"),
    usuarios: document.getElementById("nav-usuarios-item"),
  };

  if (campoNombre) campoNombre.textContent = nombreUsuario || "-no login-";

  if (token) {
    if (items.login) items.login.style.display = "none";
    if (items.logout) items.logout.style.display = "block";
    if (items.dashboard) items.dashboard.style.display = "block";

    if (rol === "ADMIN") {
      if (items.voluntariados) items.voluntariados.style.display = "block";
      if (items.usuarios) items.usuarios.style.display = "block";
    }
  } else {
    if (items.login) items.login.style.display = "block";
    if (items.logout) items.logout.style.display = "none";
  }
}

function setActiveLink() {
  const currentFile = window.location.pathname.split("/").pop();
  document.querySelectorAll(".navbar-nav .nav-link").forEach((link) => {
    if (link.getAttribute("href")?.includes(currentFile)) {
      link.classList.add("fw-bold", "text-primary");
    }
  });
}

function mobileMenuAnimation() {
  const menuIcon = document.getElementById("menu-icon");
  const navbarNav = document.getElementById("navbarNav");
  if (menuIcon && navbarNav) {
    navbarNav.addEventListener(
      "show.bs.collapse",
      () => (menuIcon.className = "fa-solid fa-square-xmark")
    );
    navbarNav.addEventListener(
      "hide.bs.collapse",
      () => (menuIcon.className = "fas fa-bars")
    );
  }
}

document.addEventListener("DOMContentLoaded", addMenu);
