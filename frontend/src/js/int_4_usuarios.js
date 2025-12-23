/**
 * Añade un nuevo usuario a localStorage después de validar los campos (nombre, email, password) y verificar unicidad del email.
 */
function addUsuario() {
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

  if (existeEmailUsuario(email)) {
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

  crearUsuario(nuevoUsuario);

  mostrarDatosUsuarios();

  document.getElementById('altaUsuario').reset();
}

/**
 * Elimina un usuario de localStorage usando su índice y actualiza la tabla de la vista.
 * @param {number} indice - El índice del usuario a eliminar.
 */
function eliminarUsuario(indice) {
  borrarUsuarioPorIndice(indice);
  mostrarDatosUsuarios();
  actualizarUsuarioActivo();
}

/**
 * Renderiza la lista de usuarios en la tabla de Consulta de Usuarios (usuarios.html).
 */
function mostrarDatosUsuarios() {
  const cuerpo = document.querySelector('#consulta');
  const listaUsuarios = obtenerUsuarios();

  cuerpo.innerHTML = '';
  let delay = 0;

  listaUsuarios.forEach(function (u, i) {
    const fila = `
      <tr class="fade-in-right" style="--d:${delay}ms">
        <td>${u.nombre}</td>
        <td>${u.email}</td>
        <td>${u.password}</td>
        <td>
          <button type="button" class="btn btn-primary bg-custom-blue w-100"
                  onclick="eliminarUsuario(${i})">Borrar</button>
        </td>
      </tr>
    `;
    cuerpo.innerHTML += fila;
    delay += 100;
  });
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