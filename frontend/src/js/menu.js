/**
 * Carga el contenido del archivo 'menu.html' en el elemento con ID 'menu',
 * y luego inicializa la animación del menú móvil y la gestión de enlaces activos.
 * @returns {Promise<void>} Una promesa que resuelve al cargar y procesar el menú.
 */
function addMenu() {
  return fetch(`${window.FRONTEND_BASE}/src/components/menu.html`)
    .then(response => response.text())
    .then(data => {
      document.getElementById('menu').innerHTML = data;
      document.querySelectorAll('#menu a[data-href]').forEach(link =>{
        link.setAttribute(
          'href', 
          `${window.FRONTEND_BASE}/${link.dataset.href.replace('./', '')}`
        );
      });
      setActiveLink();
      mobileMenuAnimation();
      mostrarUsuarioActivoMenu();
    })
    .catch(err => console.error("Error cargando el menú:", err));
}

/**
 * Muestra el nombre del usuario activo en el campo específico del menú.
 */
function mostrarUsuarioActivoMenu() {
  const campo = document.getElementById('usuario-logueado');
  if (!campo) return;

  const usuario = obtenerUsuarioActivo();

  campo.textContent = usuario ? usuario : "-no login-";
}

/**
 * Determina el enlace del menú que corresponde a la página actual y le aplica la clase de activo.
 */
function setActiveLink() {
  const currentFile = window.location.pathname.split('/').pop();
  const links = document.querySelectorAll('.navbar-nav .nav-link');

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    const linkFile = href.split('/').pop();

    // Página activa
    if (linkFile === currentFile || 
       (currentFile === '' && linkFile === '../../index.html')) {
      link.classList.add('nav-link-active-custom');
    } else {
      link.classList.remove('nav-link-active-custom');
    }
  });
}

/**
 * Configura los eventos para la animación del menú de navegación en dispositivos móviles (icono de hamburguesa).
 */
function mobileMenuAnimation() {
  const menuIcon = document.getElementById('menu-icon');
  const navbar = document.querySelector('.navbar');
  const navbarNav = document.getElementById('navbarNav');

  if (!menuIcon || !navbar || !navbarNav) return;

  navbarNav.addEventListener('show.bs.collapse', function () {
    menuIcon.className = 'fa-solid fa-square-xmark';
    navbar.classList.add('show-fullscreen');
  });

  navbarNav.addEventListener('hide.bs.collapse', function () {
    menuIcon.className = 'fas fa-bars';
    navbar.classList.remove('show-fullscreen');
  });
}

window.addMenu = addMenu;