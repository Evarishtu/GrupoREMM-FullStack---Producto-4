/**
 * Muestra el nombre del usuario activo en el campo del menú o vista de login.
 */
function mostrarUsuarioActivo() {
  const usuario_activo = obtenerUsuarioActivo();
  const campo = document.getElementById('usuario-logueado');

  if (!campo) return;

  if (usuario_activo) {
    campo.textContent = usuario_activo;
  } else {
    campo.textContent = '-no login-';
  }
}

/**
 * Maneja la lógica completa del formulario de login: valida campos, llama a loguearUsuario(),
 * gestiona mensajes de error/éxito y actualiza el estado del usuario activo.
 */
function manejarLogin() {
  const emailInput = document.getElementById('id');
  const passwordInput = document.getElementById('pass');
  const alerta = document.getElementById('alertaErrores');

  // Reset alerta
  alerta.classList.add('d-none');
  alerta.classList.remove('alert-success');
  alerta.classList.add('alert-danger');
  alerta.innerHTML = '';

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  let errores = [];

  if (!email) {
    errores.push('<li>El campo Email es obligatorio.</li>');
  } else if (!esEmailValido(email)) {
    errores.push('<li>El formato del Email no es correcto.</li>');
  }

  if (!password) {
    errores.push('<li>El campo Contraseña es obligatorio.</li>');
  } else if (!esPasswordValido(password)) {
    errores.push('<li>La contraseña debe tener exactamente 8 caracteres alfanuméricos.</li>');
  }

  if (errores.length > 0) {
    alerta.innerHTML = 'Errores:<ul>' + errores.join('') + '</ul>';
    alerta.classList.remove('d-none');
    return;
  }
  
  // loguearUsuario() es la función de almacenaje.js que busca, valida la pass, y guarda la sesión.
  const usuarioLogueado = loguearUsuario(email, password);

  if (!usuarioLogueado) {
    alerta.innerHTML = '<ul><li>Usuario o contraseña incorrectos.</li></ul>';
    alerta.classList.remove('d-none');
    passwordInput.value = '';
    return;
  }

  // Exito
  mostrarUsuarioActivo();

  alerta.classList.remove('d-none');
  alerta.classList.remove('alert-danger');
  alerta.classList.add('alert-success');
  alerta.innerHTML = `¡Sesión iniciada correctamente!<br>Bienvenid@, ${usuarioLogueado.nombre}.`;
}

document.addEventListener('DOMContentLoaded', function () {
  mostrarUsuarioActivo();
});

// Exponer la función globalmente para que listener.js pueda llamarla
window.manejarLogin = manejarLogin;
window.mostrarUsuarioActivo = mostrarUsuarioActivo;