/**
 * listener.js
 * Centraliza todos los escuchadores de eventos de la aplicación.
 */

document.addEventListener("DOMContentLoaded", function () {
  // --- 1. LOGIN ---
  const form_login = document.getElementById("login");
  const loginButton = document.getElementById("loginButton");

  if (form_login) {
    form_login.addEventListener("submit", function (evento) {
      evento.preventDefault();
      if (typeof manejarLogin === "function") manejarLogin();
    });
  }

  if (loginButton) {
    loginButton.addEventListener("click", function (evento) {
      evento.preventDefault();
      if (typeof manejarLogin === "function") manejarLogin();
    });
  }

  // --- 3. CARGA INICIAL DE TABLAS ---
  // Si estamos en la página de usuarios, cargamos la lista automáticamente
  if (document.getElementById("tablaUsuarios")) {
    if (typeof pintarUsuarios === "function") pintarUsuarios();
  }

  // --- 4. EVENTOS DE BORRADO (Delegación de eventos) ---
  // Usamos delegación porque los botones de borrar se crean dinámicamente
  const tablaUsuarios = document.getElementById("tablaUsuarios");
  if (tablaUsuarios) {
    tablaUsuarios.addEventListener("click", function (e) {
      if (e.target.classList.contains("btn-borrar")) {
        const email = e.target.getAttribute("data-email");
        if (
          confirm(`¿Estás seguro de que deseas borrar al usuario ${email}?`)
        ) {
          // CAMBIO AQUÍ: Usamos eliminarUsuario que es la que tienes en int_4_usuarios.js
          if (typeof eliminarUsuario === "function") {
            eliminarUsuario(email);
          } else if (typeof borrarUsuarioPorEmail === "function") {
            // O directamente a la base de datos si la otra no está
            borrarUsuarioPorEmail(email).then(() => mostrarDatosUsuarios());
          }
        }
      }
    });
  }

  // --- 5. CERRAR SESIÓN ---
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", function (e) {
      e.preventDefault();
      if (typeof cerrarSesion === "function") {
        cerrarSesion();
      } else {
        localStorage.clear();
        window.location.href = "login.html";
      }
    });
  }

  // --- 6. VOLUNTARIADOS ---
  const form_voluntariados = document.getElementById("alta");
  if (form_voluntariados) {
    form_voluntariados.addEventListener("submit", function (evento) {
      evento.preventDefault();
    });
  }

  // Inicializar efectos visuales si existen
  addFlipCardListener();
});

/**
 * Maneja el efecto visual de las tarjetas
 */
function addFlipCardListener() {
  const tarjetas = document.querySelectorAll(".flip-card-inner");
  tarjetas.forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("is-flipped");
    });
  });
}

window.addFlipCardListener = addFlipCardListener;
