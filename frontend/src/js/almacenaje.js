var GRAPHQL_ENDPOINT = window.GRAPHQL_ENDPOINT || 'https://localhost:4000/graphql';
window.GRAPHQL_ENDPOINT = GRAPHQL_ENDPOINT;
const CLAVE_USUARIO_ACTIVO = 'usuarioActivo';

async function graphqlRequest(query, variables = {}) {
  const token = localStorage.getItem('jwt');
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ query, variables })
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors.map((e) => e.message).join('\n'));
  }
  return result.data;
}

/**
 * Obtiene la lista completa de usuarios desde el backend.
 * @returns {Promise<Array<Object>>} Lista de usuarios.
 */
async function obtenerUsuarios() {
  const query = `
    query Usuarios {
      usuarios {
        id
        nombre
        email
        role
      }
    }
  `;
  const data = await graphqlRequest(query);
  return data.usuarios || [];
}

/**
 * Crea un nuevo usuario en el backend.
 * @param {Object} usuario - El objeto del nuevo usuario ({nombre, email, password}).
 */
async function crearUsuario(usuario) {
  const mutation = `
    mutation CrearUsuario($nombre: String!, $email: String!, $password: String!) {
      crearUsuario(nombre: $nombre, email: $email, password: $password) {
        id
        nombre
        email
        role
      }
    }
  `;
  const data = await graphqlRequest(mutation, usuario);
  return data.crearUsuario;
}

/**
 * Borra un usuario usando su índice en el listado del backend.
 * @param {number} indice - El índice del usuario a borrar.
 */
async function borrarUsuarioPorIndice(indice) {
  const mutation = `
    mutation BorrarUsuarioPorIndice($indice: Int!) {
      borrarUsuarioPorIndice(indice: $indice)
    }
  `;
  await graphqlRequest(mutation, { indice });
}

/**
 * Borra un usuario usando su dirección de email.
 * @param {string} email - El email del usuario a borrar.
 */
async function borrarUsuarioPorEmail(email) {
  const mutation = `
    mutation BorrarUsuarioPorEmail($email: String!) {
      borrarUsuarioPorEmail(email: $email)
    }
  `;
  await graphqlRequest(mutation, { email });
}

/**
 * Comprueba si ya existe un usuario con la dirección de email proporcionada.
 * @param {string} email - El email a verificar.
 * @returns {boolean} True si el email ya existe, False en caso contrario.
 */
async function existeEmailUsuario(email) {
  const lista = await obtenerUsuarios();
  return lista.some((u) => u.email === email);
}

/**
 * Almacena el nombre del usuario que ha iniciado sesión en localStorage.
 * @param {string} nombre - El nombre del usuario activo.
 */
function guardarUsuarioActivo(nombre) {
  try {
    localStorage.setItem(CLAVE_USUARIO_ACTIVO, nombre);
  } catch (error) {
    console.error('Error al guardar el usuario activo:', error);
  }
}

/**
 * Obtiene el nombre del usuario actualmente activo desde localStorage.
 * @returns {string|null} El nombre del usuario activo, o null si no hay sesión activa o hay un error.
 */
function obtenerUsuarioActivo() {
  try {
    return localStorage.getItem(CLAVE_USUARIO_ACTIVO);
  } catch (error) {
    console.error('Error al obtener el usuario activo:', error);
    return null;
  }
}

/**
 * Elimina la clave de usuario activo de localStorage, cerrando la sesión.
 */
function limpiarUsuarioActivo() {
  try {
    localStorage.removeItem(CLAVE_USUARIO_ACTIVO);
  } catch (error) {
    console.error('Error al limpiar el usuario activo:', error);
  }
}

/**
 * Autentica un usuario verificando las credenciales contra la lista almacenada.
 * Cumple con el requisito de encapsular la lógica de autenticación en el módulo de persistencia.
 * @param {string} email - Email proporcionado por el usuario.
 * @param {string} password - Contraseña proporcionada por el usuario.
 * @returns {Object|null} El objeto de usuario encontrado y logueado, o null si falla.
 */
async function loguearUsuario(email, password) {
  const mutation = `
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

  const data = await graphqlRequest(mutation, { email, password });
  return data.login;
}
