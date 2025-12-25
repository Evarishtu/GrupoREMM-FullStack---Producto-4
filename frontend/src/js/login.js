/**
 * Muestra el nombre del usuario activo en el campo del menú o vista de login.
 */
function mostrarUsuarioActivo() {
  const usuario_activo = obtenerUsuarioActivo();
  const campo = document.getElementById("usuario-logueado");

  if (!campo) return;

  if (usuario_activo) {
    campo.textContent = usuario_activo;
  } else {
    campo.textContent = "-no login-";
  }
}

/**
 * Maneja la lógica completa del formulario de login: valida campos, llama a loguearUsuario(),
 * gestiona mensajes de error/éxito y actualiza el estado del usuario activo.
 */
async function manejarLogin() {
  const emailInput = document.getElementById("id");
  const passwordInput = document.getElementById("pass");
  const alerta = document.getElementById("alertaErrores");

  // Reset alerta
  alerta.classList.add("d-none");
  alerta.classList.remove("alert-success");
  alerta.classList.add("alert-danger");
  alerta.innerHTML = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  let errores = [];

  if (!email) {
    errores.push("<li>El campo Email es obligatorio.</li>");
  } else if (!esEmailValido(email)) {
    errores.push("<li>El formato del Email no es correcto.</li>");
  }

  if (!password) {
    errores.push("<li>El campo Contraseña es obligatorio.</li>");
  } else if (!esPasswordValido(password)) {
    errores.push(
      "<li>La contraseña debe tener exactamente 8 caracteres alfanuméricos.</li>"
    );
  }

  if (errores.length > 0) {
    alerta.innerHTML = "Errores:<ul>" + errores.join("") + "</ul>";
    alerta.classList.remove("d-none");
    return;
  }

  try {
    const query = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
          usuario {
            nombre
            email
            role
          }
        }
      }
    `;

    const response = await fetch("https://hrmfz4-5000.csb.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { email, password },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    const { token, usuario } = result.data.login;

    // Guardar token y usuario
    localStorage.setItem("jwt", token);
    localStorage.setItem("usuarioActivo", usuario.nombre); // Mantener compatibilidad con almacenaje.js
    localStorage.setItem("usuarioEmail", usuario.email);
    localStorage.setItem("usuarioRol", usuario.role);

    // Exito
    mostrarUsuarioActivo();

    alerta.classList.remove("d-none");
    alerta.classList.remove("alert-danger");
    alerta.classList.add("alert-success");
    alerta.innerHTML = `¡Sesión iniciada correctamente!<br>Bienvenid@, ${usuario.nombre}.`;

    // Redirigir al dashboard después de 1 segundo
    setTimeout(() => {
      window.location.href = "../../index.html";
    }, 1000);
  } catch (error) {
    alerta.innerHTML = `<ul><li>${error.message}</li></ul>`;
    alerta.classList.remove("d-none");
    passwordInput.value = "";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  mostrarUsuarioActivo();
});

// Exponer la función globalmente para que listener.js pueda llamarla
window.manejarLogin = manejarLogin;
window.mostrarUsuarioActivo = mostrarUsuarioActivo;
