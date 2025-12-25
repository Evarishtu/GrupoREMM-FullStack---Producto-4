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

  // Usuario NO logueado
  if (!nombre || !localStorage.getItem("jwt")) {
    if (itemLogin) itemLogin.style.setProperty("display", "block", "important");
    if (contenedorInfo)
      contenedorInfo.style.setProperty("display", "none", "important");
    if (itemLogout)
      itemLogout.style.setProperty("display", "none", "important");
    if (itemDashboard)
      itemDashboard.style.setProperty("display", "none", "important");
    if (itemVoluntariados)
      itemVoluntariados.style.setProperty("display", "none", "important");
    if (itemUsuarios)
      itemUsuarios.style.setProperty("display", "none", "important");
    return;
  }

  // Usuario logueado (Cualquier rol)
  if (spanNombre) spanNombre.textContent = nombre;
  if (contenedorInfo)
    contenedorInfo.style.setProperty("display", "block", "important");
  if (itemLogout) itemLogout.style.setProperty("display", "block", "important");
  if (itemLogin) itemLogin.style.setProperty("display", "none", "important");

  // Dashboard lo ven todos los logueados
  if (itemDashboard)
    itemDashboard.style.setProperty("display", "block", "important");

  if (rol === "ADMIN") {
    // Si es ADMIN, mostramos ambas gestiones
    if (itemVoluntariados)
      itemVoluntariados.style.setProperty("display", "block", "important");
    if (itemUsuarios)
      itemUsuarios.style.setProperty("display", "block", "important");
  } else {
    // Si no es ADMIN, ocultamos explícitamente ambas
    if (itemVoluntariados)
      itemVoluntariados.style.setProperty("display", "none", "important");
    if (itemUsuarios)
      itemUsuarios.style.setProperty("display", "none", "important");
  }
}

// Hacer disponibles globalmente
window.inicializarInterfazUsuario = inicializarInterfazUsuario;
window.esEmailValido = esEmailValido;
window.esPasswordValido = esPasswordValido;
