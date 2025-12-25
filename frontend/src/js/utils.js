/**
 * Verifica si una cadena tiene el formato básico de email válido.
 * @param {string} email - La cadena de email a validar.
 * @returns {boolean} True si el email es válido.
 */
function esEmailValido(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Verifica si una cadena es alfanumérica y tiene exactamente 8 caracteres.
 * @param {string} password - La cadena de contraseña a validar.
 * @returns {boolean} True si la contraseña es válida.
 */
function esPasswordValido(password) {
  const regex = /^[a-zA-Z0-9]{8,12}$/;
  return regex.test(password);
}

/**
 * utils.js
 * Funciones globales para toda la aplicación.
 */

function inicializarInterfazUsuario() {
  // Recuperamos los datos del usuario logueado
  const nombre = localStorage.getItem("usuarioActivo");
  const rol = localStorage.getItem("usuarioRol");

  // Referencias a los elementos del header
  const contenedorInfo = document.getElementById("nav-user-info");
  const spanNombre = document.getElementById("usuario-logueado-span");
  const itemUsuarios = document.getElementById("nav-usuarios-item");
  const itemLogout = document.getElementById("nav-logout-item");
  const itemLogin = document.getElementById("nav-login-item");
  const itemDashboard = document.getElementById("nav-dashboard-item");
  const itemVoluntariados = document.getElementById("nav-voluntariados-item");

  // Si hay un usuario logueado, ajustamos la visibilidad
  if (nombre && spanNombre && contenedorInfo) {
    // Inyectamos el nombre en el span
    spanNombre.textContent = nombre;

    // Mostramos info de usuario y botón salir
    contenedorInfo.style.setProperty("display", "block", "important");
    if (itemLogout)
      itemLogout.style.setProperty("display", "block", "important");

    // Ocultamos el botón de Login
    if (itemLogin) itemLogin.style.setProperty("display", "none", "important");

    // Mostramos Dashboard y Voluntariados para cualquier usuario logueado
    if (itemDashboard)
      itemDashboard.style.setProperty("display", "block", "important");
    if (itemVoluntariados)
      itemVoluntariados.style.setProperty("display", "block", "important");

    // Lógica de Rol: Solo el ADMIN ve Gestión de Usuarios
    if (rol === "ADMIN" && itemUsuarios) {
      itemUsuarios.style.setProperty("display", "block", "important");
    }
  }
}

// Hacemos la función disponible globalmente
window.inicializarInterfazUsuario = inicializarInterfazUsuario;
