/**
 * Verificación de sesión: Si no existe el token JWT,
 * se redirige inmediatamente al login.
 */
if (!localStorage.getItem("jwt")) {
  window.location.href = "/src/pages/login.html";
}

/**
 * Alterna la visibilidad de la contraseña en la tabla de usuarios.
 */
window.togglePassword = function (index) {
  const passwordSpan = document.getElementById(`pass-${index}`);
  const icon = document.getElementById(`icon-${index}`);

  if (passwordSpan.dataset.visible === "false") {
    passwordSpan.textContent = passwordSpan.dataset.realpass;
    passwordSpan.dataset.visible = "true";
    icon.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    passwordSpan.textContent = "********";
    passwordSpan.dataset.visible = "false";
    icon.classList.replace("fa-eye-slash", "fa-eye");
  }
};

/**
 * Añade un nuevo usuario en el backend después de validar los campos.
 */
async function addUsuario() {
  const nombreInput = document.getElementById("nombre");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const roleInput = document.getElementById("role");
  const alerta = document.getElementById("alertaErrores");
  const submitButton = document.querySelector(
    '#altaUsuario input[type="submit"]'
  );

  if (submitButton && submitButton.disabled) return;

  alerta.classList.add("d-none");
  alerta.classList.remove("error-con-icono");
  alerta.innerHTML = "";

  const nombre = nombreInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const role = roleInput ? roleInput.value : "USER";
  let errores = [];

  if (!nombre) errores.push("<li>El campo Nombre es obligatorio.</li>");

  if (!email) {
    errores.push("<li>El campo Email es obligatorio.</li>");
  } else if (typeof esEmailValido === "function" && !esEmailValido(email)) {
    errores.push("<li>El formato del Email no es correcto.</li>");
  }

  if (!password) {
    errores.push("<li>El campo Password es obligatorio.</li>");
  } else if (
    typeof esPasswordValido === "function" &&
    !esPasswordValido(password)
  ) {
    errores.push(
      "<li>La contraseña debe ser alfanumérica y tener exactamente 8 caracteres.</li>"
    );
  }

  try {
    if (errores.length === 0 && typeof existeEmailUsuario === "function") {
      const existeEmail = await existeEmailUsuario(email);
      if (existeEmail) {
        errores.push("<li>Ya existe un usuario con ese email.</li>");
      }
    }
  } catch (err) {
    console.error("Error al verificar email:", err);
  }

  if (errores.length > 0) {
    alerta.innerHTML = "Errores:<ul>" + errores.join("") + "</ul>";
    alerta.classList.add("error-con-icono");
    alerta.classList.remove("d-none");
    return;
  }

  const nuevoUsuario = { nombre, email, password, role };

  try {
    setUsuariosLoading(true);
    await crearUsuario(nuevoUsuario);
    await mostrarDatosUsuarios();
    document.getElementById("altaUsuario").reset();
  } catch (error) {
    alerta.innerHTML = `<ul><li>${error.message}</li></ul>`;
    alerta.classList.add("error-con-icono");
    alerta.classList.remove("d-none");
  } finally {
    setUsuariosLoading(false);
  }
}

/**
 * Elimina un usuario. Si el usuario eliminado es el actual, cierra sesión.
 */
async function eliminarUsuario(email) {
  const alerta = document.getElementById("alertaErrores");
  alerta.classList.add("d-none");
  alerta.innerHTML = "";

  if (!confirm(`¿Estás seguro de que deseas eliminar a ${email}?`)) return;

  try {
    setUsuariosLoading(true);
    await borrarUsuarioPorEmail(email);

    const usuarioActivoEmail = localStorage.getItem("usuarioEmail");

    if (usuarioActivoEmail === email) {
      alert("Tu cuenta ha sido eliminada. Serás redirigido al login.");
      if (typeof cerrarSesion === "function") {
        cerrarSesion();
      } else {
        localStorage.clear();
        window.location.href = "login.html";
      }
      return;
    }

    await mostrarDatosUsuarios();
  } catch (error) {
    alerta.innerHTML = `<ul><li>${error.message}</li></ul>`;
    alerta.classList.add("error-con-icono");
    alerta.classList.remove("d-none");
  } finally {
    setUsuariosLoading(false);
  }
}

/**
 * Renderiza la lista de usuarios obtenida del backend.
 */
async function mostrarDatosUsuarios() {
  const cuerpo = document.querySelector("#consulta");
  const alerta = document.getElementById("alertaErrores");
  setUsuariosLoading(true);
  alerta.classList.add("d-none");

  if (cuerpo) {
    cuerpo.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Cargando usuarios...</td></tr>`;
  }

  try {
    const listaUsuarios = await obtenerUsuarios();
    if (!cuerpo) return;

    cuerpo.innerHTML = "";
    let delay = 0;

    listaUsuarios.forEach(function (u, i) {
      const badgeClass = u.role === "ADMIN" ? "bg-danger" : "bg-primary";
      const roleText = u.role || "USER";
      const realPassword = u.passwordOriginal || u.password || "********";

      const fila = `
        <tr class="fade-in-right" style="--d:${delay}ms">
          <td>${u.nombre}</td>
          <td>${u.email}</td>
          <td><span class="badge ${badgeClass}">${roleText}</span></td>
          <td class="text-nowrap"> 
            <span id="pass-${i}" class="font-monospace" data-realpass="${realPassword}" data-visible="false">********</span>
            <button class="btn btn-sm text-muted border-0 p-0 ms-2" onclick="togglePassword(${i})">
              <i id="icon-${i}" class="fa-solid fa-eye"></i>
            </button>
          </td>
          <td>
            <button type="button" class="btn btn-primary bg-custom-blue w-100"
                    onclick="eliminarUsuario('${u.email}')">Borrar</button>
          </td>
        </tr>
      `;
      cuerpo.innerHTML += fila;
      delay += 100;
    });

    if (listaUsuarios.length === 0) {
      cuerpo.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay usuarios disponibles.</td></tr>`;
    }
  } catch (error) {
    if (cuerpo) {
      cuerpo.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error al cargar usuarios.</td></tr>`;
    }
    alerta.innerHTML = `<ul><li>${error.message}</li></ul>`;
    alerta.classList.add("error-con-icono");
    alerta.classList.remove("d-none");
  } finally {
    setUsuariosLoading(false);
  }
}

function setUsuariosLoading(isLoading) {
  const submitButton = document.querySelector(
    '#altaUsuario input[type="submit"]'
  );
  if (submitButton) {
    submitButton.disabled = isLoading;
  }
}

/**
 * Evento principal al cargar el DOM.
 * Conecta con la lógica global de utils.js
 */
document.addEventListener("DOMContentLoaded", function () {
  // 1. LLAMADA A UTILS: Inyecta el nombre y configura el header global
  if (typeof inicializarInterfazUsuario === "function") {
    inicializarInterfazUsuario();
    // Re-intento por si el menú (navbar) carga de forma asíncrona
    setTimeout(inicializarInterfazUsuario, 500);
  }

  // 2. Carga de la tabla de la página actual
  mostrarDatosUsuarios();

  // 3. Manejo del formulario de alta (limpieza de duplicados)
  const form = document.getElementById("altaUsuario");
  if (form) {
    const formClon = form.cloneNode(true);
    form.parentNode.replaceChild(formClon, form);

    formClon.addEventListener("submit", function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      addUsuario();
    });
  }
});

// Exportaciones para acceso global
window.addUsuario = addUsuario;
window.eliminarUsuario = eliminarUsuario;
window.mostrarDatosUsuarios = mostrarDatosUsuarios;
