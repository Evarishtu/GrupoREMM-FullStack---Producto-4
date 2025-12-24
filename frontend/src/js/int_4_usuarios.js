/**
 * Añade un nuevo usuario en el backend después de validar los campos.
 */
async function addUsuario() {
  const nombreInput = document.getElementById('nombre');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const alerta = document.getElementById('alertaErrores');

  // Reset alertas
  alerta.classList.add('d-none');
  alerta.classList.remove('error-con-icono');
  alerta.innerHTML = '';

  const nombre = nombreInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  let errores = [];

  if (!nombre) errores.push('<li>El campo Nombre es obligatorio.</li>');

  if (!email) {
    errores.push('<li>El campo Email es obligatorio.</li>');
  } else if (!esEmailValido(email)) {
    errores.push('<li>El formato del Email no es correcto.</li>');
  }

  if (!password) {
    errores.push('<li>El campo Password es obligatorio.</li>');
  } else if (!esPasswordValido(password)) {
    errores.push('<li>La contraseña debe ser alfanumérica y tener exactamente 8 caracteres.</li>');
  }

  const existeEmail = await existeEmailUsuario(email);
  if (existeEmail) {
    errores.push('<li>Ya existe un usuario con ese email.</li>');
  }

  if (errores.length > 0) {
    alerta.innerHTML = 'Errores:<ul>' + errores.join('') + '</ul>';
    alerta.classList.add('error-con-icono');
    alerta.classList.remove('d-none');
    return;
  }

  const nuevoUsuario = {
    nombre,
    email,
    password
  };

  try {
    setUsuariosLoading(true);
    await crearUsuario(nuevoUsuario);
    await mostrarDatosUsuarios();
    document.getElementById('altaUsuario').reset();
  } catch (error) {
    alerta.innerHTML = `<ul><li>${error.message}</li></ul>`;
    alerta.classList.add('error-con-icono');
    alerta.classList.remove('d-none');
  } finally {
    setUsuariosLoading(false);
  }
}

/**
 * Elimina un usuario de localStorage usando su índice y actualiza la tabla de la vista.
 * @param {number} indice - El índice del usuario a eliminar.
 */
async function eliminarUsuario(indice) {
  const alerta = document.getElementById('alertaErrores');
  alerta.classList.add('d-none');
  alerta.classList.remove('error-con-icono');
  alerta.innerHTML = '';

  try {
    setUsuariosLoading(true);
    await borrarUsuarioPorIndice(indice);
    await mostrarDatosUsuarios();
    actualizarUsuarioActivo();
  } catch (error) {
    alerta.innerHTML = `<ul><li>${error.message}</li></ul>`;
    alerta.classList.add('error-con-icono');
    alerta.classList.remove('d-none');
  } finally {
    setUsuariosLoading(false);
  }
}

/**
 * Renderiza la lista de usuarios en la tabla de Consulta de Usuarios (usuarios.html).
 */
async function mostrarDatosUsuarios() {
  const cuerpo = document.querySelector('#consulta');
  const alerta = document.getElementById('alertaErrores');
  setUsuariosLoading(true);
  alerta.classList.add('d-none');
  alerta.classList.remove('error-con-icono');
  alerta.innerHTML = '';

  cuerpo.innerHTML = '';
  cuerpo.innerHTML = `
    <tr>
      <td colspan="4" class="text-center text-muted">Cargando usuarios...</td>
    </tr>
  `;

  try {
    const listaUsuarios = await obtenerUsuarios();
    cuerpo.innerHTML = '';
    let delay = 0;

    listaUsuarios.forEach(function (u, i) {
      const fila = `
        <tr class="fade-in-right" style="--d:${delay}ms">
          <td>${u.nombre}</td>
          <td>${u.email}</td>
          <td>********</td>
          <td>
            <button type="button" class="btn btn-primary bg-custom-blue w-100"
                    onclick="eliminarUsuario(${i})">Borrar</button>
          </td>
        </tr>
      `;
      cuerpo.innerHTML += fila;
      delay += 100;
    });

    if (listaUsuarios.length === 0) {
      cuerpo.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-muted">No hay usuarios disponibles.</td>
        </tr>
      `;
    }
  } catch (error) {
    cuerpo.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-danger">Error al cargar usuarios.</td>
      </tr>
    `;
    alerta.innerHTML = `<ul><li>${error.message}</li></ul>`;
    alerta.classList.add('error-con-icono');
    alerta.classList.remove('d-none');
  } finally {
    setUsuariosLoading(false);
  }
}

function setUsuariosLoading(isLoading) {
  const submitButton = document.querySelector('#altaUsuario input[type="submit"]');
  if (submitButton) {
    submitButton.disabled = isLoading;
  }
}

/**
 * Actualiza el campo de usuario logueado en la vista actual.
 */
function actualizarUsuarioActivo() {
  const activo = obtenerUsuarioActivo();
  const campo = document.getElementById('usuario-logueado');
  if (campo) {
    campo.textContent = activo || '-no login-';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  actualizarUsuarioActivo();
  mostrarDatosUsuarios();
});

window.addUsuario = addUsuario;
window.eliminarUsuario = eliminarUsuario;
window.mostrarDatosUsuarios = mostrarDatosUsuarios;
