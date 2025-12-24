const CLAVE_USUARIO_ACTIVO = 'usuarioActivo';

/** Definición del helpler común para GraphQL */

const GRAPHQL_URL = "http://localhost:3000/graphql";

function fetchGraphQL(query, variables = {}) {
  const token = localStorage.getItem("token");

  return fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": "Bearer " + token } : {})
    },
    body: JSON.stringify({
      query,
      variables
    })
  }).then(res => res.json());
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
  const query = `
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        token
        usuario {
          nombre
          email
          rol
        }
      }
    }
  `;

  try {
    const result = await fetchGraphQL(query, { email, password });

    if (result.errors) {
      return null;
    }

    const { token, usuario } = result.data.login;

    
    localStorage.setItem("token", token);
    localStorage.setItem(CLAVE_USUARIO_ACTIVO, usuario.nombre);
    localStorage.setItem("rol", usuario.rol);
    localStorage.setItem("email", usuario.email);

    return usuario;
  } catch (error) {
    console.error("Error en login:", error);
    return null;
  }
}

