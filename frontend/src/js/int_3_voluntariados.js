

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
   Obtener voluntariados
========================= */
async function obtenerVoluntariados() {
  const query = `
    query {
      voluntariados {
        id
        titulo
        usuario
        fecha
        descripcion
        tipo
      }
    }
  `;

  const res = await fetchGraphQL(query);
    if (res.errors) {
    console.error(res.errors);
    return [];
  }
  return res.data.voluntariados;
}

/* =========================
   Mostrar tabla
========================= */
async function mostrarDatosVoluntariados() {
  const cuerpo = document.querySelector('#consultaVoluntariados');
    cuerpo.innerHTML = "";

    const lista = await obtenerVoluntariados();
    let delay = 0;

    lista.forEach(v => {
      cuerpo.innerHTML += `
        <tr class="fade-in-right" style="--d:${delay}ms">
          <td>${v.titulo}</td>
          <td>${v.usuario}</td>
          <td>${v.fecha}</td>
          <td>${v.descripcion}</td>
          <td>${v.tipo}</td>
          <td>
            ${
              esAdmin()
                ? `<button class="btn btn-primary bg-custom-blue w-100"
                    onclick="eliminarVoluntariado('${v.id}')">
                    Borrar
                  </button>`
                : ''
            }
          </td>
        </tr>
      `;
      delay += 100;
    });
}

/* =========================
   Crear voluntariado
========================= */
async function addVoluntariado() {
  const titulo = document.getElementById('titulo').value.trim();
  const usuario = localStorage.getItem("usuarioEmail");
  const fecha = document.getElementById('fecha').value;
  const descripcion = document.getElementById('descripcion').value.trim();
  const tipo = document.getElementById('tipo').value;

  if (!titulo || !usuario || !fecha || !descripcion || !tipo) {
    alert("Todos los campos son obligatorios");
    return;
  }

  const mutation = `
    mutation Crear(
      $titulo: String!
      $usuario: String!
      $fecha: String!
      $descripcion: String!
      $tipo: TipoVoluntariado!
    ) {
      crearVoluntariado(
        titulo: $titulo
        usuario: $usuario
        fecha: $fecha
        descripcion: $descripcion
        tipo: $tipo
      ) {
        id
      }
    }
  `;

  const res = await fetchGraphQL(mutation, {
    titulo,
    usuario,
    fecha,
    descripcion,
    tipo
  });

  if (res.errors) {
    alert(res.errors[0].message);
    return;
  }

  document.getElementById("alta").reset();
  mostrarDatosVoluntariados();
}

/* =========================
   Eliminar voluntariado
========================= */
async function eliminarVoluntariado(id) {
  const mutation = `
    mutation ($id: ID!) {
      eliminarVoluntariado(id: $id)
    }
  `;

  await fetchGraphQL(mutation, { id });
  mostrarDatosVoluntariados();
}

/* =========================
   Init
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  // Si no hay sesión, redirigir
  if (!localStorage.getItem("token")) {
    window.location.href = "/frontend/src/pages/login.html";
    return;
  }

  await mostrarDatosVoluntariados();

  const lista = await obtenerVoluntariados();
  const conteos = contarTiposVoluntariado(lista);
  dibujarGrafico(conteos);
});


window.addVoluntariado = addVoluntariado;
window.eliminarVoluntariado = eliminarVoluntariado;