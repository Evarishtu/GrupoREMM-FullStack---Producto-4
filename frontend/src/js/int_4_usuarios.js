

/* =========================
   Helper GraphQL
========================= */
function fetchGraphQL(query, variables = {}) {
  const token = localStorage.getItem("token");

  return fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {})
    },
    body: JSON.stringify({ query, variables })
  }).then(res => res.json());
}

/* =========================
   Alta de usuario
   (visible para no login y ADMIN)
========================= */
async function addUsuario() {
  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const alerta = document.getElementById('alertaErrores');

  alerta.classList.add('d-none');
  alerta.innerHTML = '';

  let errores = [];

  if (!nombre) errores.push('<li>El nombre es obligatorio</li>');
  if (!email) errores.push('<li>El email es obligatorio</li>');
  else if (!esEmailValido(email)) errores.push('<li>Email no válido</li>');
  if (!password) errores.push('<li>La contraseña es obligatoria</li>');
  else if (!esPasswordValido(password))
    errores.push('<li>La contraseña debe tener 8 caracteres alfanuméricos</li>');

  if (errores.length > 0) {
    alerta.innerHTML = `<ul>${errores.join('')}</ul>`;
    alerta.classList.remove('d-none');
    return;
  }

  const mutation = `
    mutation CrearUsuario($nombre: String!, $email: String!, $password: String!) {
      crearUsuario(nombre: $nombre, email: $email, password: $password) {
        id
        nombre
        email
        rol
      }
    }
  `;

  const res = await fetchGraphQL(mutation, {
    nombre,
    email,
    password
  });

  if (res.errors) {
    alerta.innerHTML = res.errors[0].message;
    alerta.classList.remove('d-none');
    return;
  }

  document.getElementById('altaUsuario').reset();
  mostrarDatosUsuarios();
}

/* =========================
   Mostrar usuarios
========================= */
async function mostrarDatosUsuarios() {
  const cuerpo = document.querySelector('#consulta');
  const rol = localStorage.getItem("rol");
  const token = localStorage.getItem("token");

  cuerpo.innerHTML = '';
  let delay = 0;

  // No autenticado → no mostrar tabla
  if (!token) return;

  // USER → solo su usuario
if (rol === "USER") {
  const nombre = obtenerUsuarioActivo();
  const email = localStorage.getItem("email");

  cuerpo.innerHTML = `
    <tr class="fade-in-right">
      <td>${nombre}</td>
      <td>${email}</td>
      <td>********</td>
      <td>-</td>
    </tr>
  `;
  return;
  }

  // ADMIN → todos
  const query = `
    query {
      usuarios {
        nombre
        email
      }
    }
  `;

  const res = await fetchGraphQL(query);
  const lista = res.data?.usuarios ?? [];

  lista.forEach(u => {
    cuerpo.innerHTML += `
      <tr class="fade-in-right" style="--d:${delay}ms">
        <td>${u.nombre}</td>
        <td>${u.email}</td>
        <td>********</td>
        <td>
          <button class="btn btn-primary bg-custom-blue w-100"
            onclick="eliminarUsuario('${u.email}')">
            Borrar
          </button>
        </td>
      </tr>
    `;
    delay += 100;
  });
}

/* =========================
   Eliminar usuario (ADMIN)
========================= */
async function eliminarUsuario(email) {
  const mutation = `
    mutation ($email: String!) {
      borrarUsuarioPorEmail(email: $email)
    }
  `;

  await fetchGraphQL(mutation, { email });
  mostrarDatosUsuarios();
}

/* =========================
   Usuario activo en menú
========================= */
function actualizarUsuarioActivo() {
  const campo = document.getElementById('usuario-logueado');
  if (!campo) return;

  campo.textContent = obtenerUsuarioActivo() || '-no login-';
}

/* =========================
   Init
========================= */
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("rol");
  const formAlta = document.getElementById("altaUsuario");
  const tabla = document.querySelector('.contenedor-consulta');

   if (formAlta) {
    formAlta.addEventListener("submit", (e) => {
      e.preventDefault();
      addUsuario();
    });
  }

  // NO LOGUEADO → solo registro
  if (!token) {
    if (tabla) tabla.style.display = "none";
    actualizarUsuarioActivo();
    return;
  }

  // USER → solo su fila
  if (rol === "USER") {
    if (formAlta) formAlta.style.display = "none";
  }

  // ADMIN → todo visible
  actualizarUsuarioActivo();
  mostrarDatosUsuarios();
});

/* =========================
   Exponer global
========================= */
window.addUsuario = addUsuario;
window.eliminarUsuario = eliminarUsuario;
window.mostrarDatosUsuarios = mostrarDatosUsuarios;