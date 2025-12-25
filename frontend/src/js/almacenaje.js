// almacenaje.js

// Configuración del Endpoint
window.GRAPHQL_ENDPOINT = null;

function determinarEndpoint() {
  const hostActual = window.location.host;
  if (hostActual.includes("csb.app")) {
    const hostBackend = hostActual.replace("-4000", "-5000");
    return `https://${hostBackend}/graphql`;
  }
  return "http://localhost:5000/graphql";
}

const GRAPHQL_ENDPOINT = determinarEndpoint();
window.GRAPHQL_ENDPOINT = GRAPHQL_ENDPOINT;

// Helper de Peticiones GraphQL
async function graphqlRequest(query, variables = {}) {
  const token = localStorage.getItem("jwt");
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(window.GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      if (result.errors.some((e) => e.message.includes("autenticado"))) {
        console.warn("Token inválido o expirado.");
        localStorage.removeItem("jwt");
      }
      throw new Error(result.errors.map((e) => e.message).join("\n"));
    }
    return result.data;
  } catch (error) {
    console.error("Fallo en graphqlRequest:", error);
    throw error;
  }
}

// Gestión de Usuarios
async function obtenerUsuarios() {
  const query = `query ObtenerUsuarios {
    usuarios {
      id
      nombre
      email
      role
      password
    }
  }`;
  const data = await graphqlRequest(query);
  return data.usuarios;
}

async function crearUsuario(usuario) {
  const mutation = `mutation CrearUsuario($nombre: String!, $email: String!, $password: String!, $role: String) {
    crearUsuario(nombre: $nombre, email: $email, password: $password, role: $role) { 
      id 
      nombre 
      email 
      role 
    }
  }`;

  // Enviamos el objeto usuario completo que ya contiene el role
  const data = await graphqlRequest(mutation, usuario);
  return data.crearUsuario;
}

async function borrarUsuarioPorEmail(email) {
  const mutation = `mutation BorrarUsuarioPorEmail($email: String!) { borrarUsuarioPorEmail(email: $email) }`;
  await graphqlRequest(mutation, { email });
}

// Gestión de Sesión
async function loguearUsuario(email, password) {
  const mutation = `mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      usuario { nombre email role }
    }
  }`;
  const data = await graphqlRequest(mutation, { email, password });
  return data.login;
}

function cerrarSesion() {
  localStorage.clear();
  window.location.href = "/src/pages/login.html";
}
window.cerrarSesion = cerrarSesion;

// Utilidades de Voluntariados
const IMAGES_POOL = [
  "https://www.hillspet.com/content/dam/cp-sites-aem/hills/hills-pet/legacy-articles/inset/beagle-with-tongue-out.jpg",
  "https://image.petmd.com/files/inline-images/shiba-inu-black-and-tan-colors.jpg?VersionId=pLq84BEOjdMjXeDCUJJJLFPuIWYsVMUU",
  "https://www.minino.com/wp-content/uploads/2025/01/nota-de-blog-31-enero.png.webp",
  "https://15f8034cdff6595cbfa1-1dd67c28d3aade9d3442ee99310d18bd.ssl.cf3.rackcdn.com/uploaded_thumb_big/c1dc328c546f572dfe66453867eeffb8/cuidar_iguana_domestica_consejos_clinica_veterinaria_la_granja_aviles.png",
];

function getImageForVolunteering(v) {
  let hash = 0;
  const str = v.id || v.titulo || "";
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % IMAGES_POOL.length;
  return IMAGES_POOL[index];
}

const leerComoBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

// Handlers de Drag & Drop (Globales)
window.dragstartHandler = function (ev) {
  ev.dataTransfer.setData("text/plain", ev.currentTarget.id);
};
window.dragoverHandler = function (ev) {
  ev.preventDefault();
};
window.dropHandler = function (ev) {
  ev.preventDefault();
  const data = ev.dataTransfer.getData("text/plain");
  const draggedElement = document.getElementById(data);
  const dropZone = ev.target.closest(".drop-zone");
  if (draggedElement && dropZone) {
    dropZone.appendChild(draggedElement);
  }
};

/**
 * Comprueba si un email ya existe consultando la base de datos.
 */
async function existeEmailUsuario(email) {
  try {
    // Obtenemos la lista actualizada directamente del servidor
    const usuarios = await obtenerUsuarios();
    if (!usuarios) return false;

    // Buscamos coincidencia exacta (ignorando mayúsculas/minúsculas)
    return usuarios.some(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
  } catch (error) {
    console.error("Error en existeEmailUsuario:", error);
    return false;
  }
}

// Exportamos la función al objeto window
window.existeEmailUsuario = existeEmailUsuario;
