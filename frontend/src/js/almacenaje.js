const CLAVE_USUARIOS = 'usuarios';
const CLAVE_USUARIO_ACTIVO = 'usuarioActivo';

/**
 * Inicializa los usuarios en localStorage SOLO si:
 * - No existe aún la clave "usuarios"
 * - Y existe el array global "usuarios" definido en data.js
 */
function inicializarUsuariosSiVacio() {
  try {
    const guardados = localStorage.getItem(CLAVE_USUARIOS);

    if (!guardados && Array.isArray(window.usuarios)) {
      localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(window.usuarios));
    }
  } catch (error) {
    console.error('Error al inicializar usuarios en localStorage:', error);
  }
}

/**
 * Obtiene la lista completa de usuarios desde localStorage.
 * @returns {Array<Object>} Lista de objetos de usuario, o un array vacío si no hay datos o hay un error.
 */
function obtenerUsuarios() {
  try {
    const data = localStorage.getItem(CLAVE_USUARIOS);
    if (!data) {
      return [];
    }
    const lista = JSON.parse(data);
    return Array.isArray(lista) ? lista : [];
  } catch (error) {
    console.error('Error al leer usuarios de localStorage:', error);
    return [];
  }
}

/**
 * Guarda la lista de usuarios en localStorage, sobrescribiendo el contenido existente.
 * @param {Array<Object>} lista - La lista de usuarios a guardar.
 */
function guardarUsuarios(lista) {
  try {
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));
  } catch (error) {
    console.error('Error al guardar usuarios en localStorage:', error);
  }
}

/**
 * Crea un nuevo usuario y lo añade a la lista almacenada en localStorage.
 * @param {Object} usuario - El objeto del nuevo usuario ({nombre, email, password}).
 */
function crearUsuario(usuario) {
  const lista = obtenerUsuarios();
  lista.push(usuario);
  guardarUsuarios(lista);
}

/**
 * Borra un usuario de la lista almacenada usando su índice en el array.
 * @param {number} indice - El índice del usuario a borrar.
 */
function borrarUsuarioPorIndice(indice) {
    const lista = obtenerUsuarios();
    
    if (indice >= 0 && indice < lista.length) {
        // Obtener el nombre del usuario a borrar antes de eliminarlo
        const usuarioBorrado = lista[indice].nombre; 
        
        // Eliminar el usuario
        lista.splice(indice, 1);
        guardarUsuarios(lista);

        //  Si el usuario borrado era el activo, cerrar sesión
        if (usuarioBorrado === obtenerUsuarioActivo()) {
            limpiarUsuarioActivo();
        }
    }
}

/**
 * Borra un usuario de la lista almacenada usando su dirección de email.
 * @param {string} email - El email del usuario a borrar.
 */
function borrarUsuarioPorEmail(email) {
    const lista = obtenerUsuarios();
    
    // Buscar el usuario a borrar para ver si es el activo
    const usuarioABorrar = lista.find(u => u.email === email);
    const nombreUsuarioABorrar = usuarioABorrar ? usuarioABorrar.nombre : null;

    // Filtrar la lista
    const filtrados = lista.filter(function (u) {
        return u.email !== email;
    });
    
    guardarUsuarios(filtrados);

    // Si el usuario borrado era el activo, cerrar sesión
    if (nombreUsuarioABorrar && nombreUsuarioABorrar === obtenerUsuarioActivo()) {
        limpiarUsuarioActivo();
    }
}

/**
 * Comprueba si ya existe un usuario con la dirección de email proporcionada.
 * @param {string} email - El email a verificar.
 * @returns {boolean} True si el email ya existe, False en caso contrario.
 */
function existeEmailUsuario(email) {
  const lista = obtenerUsuarios();
  return lista.some(function (u) {
    return u.email === email;
  });
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
function loguearUsuario(email, password) {
    const listaUsuarios = obtenerUsuarios();
    let encontrado = null;

    // Buscar al usuario por email
    for (let i = 0; i < listaUsuarios.length; i++) {
        if (listaUsuarios[i].email === email) {
            encontrado = listaUsuarios[i];
            break;
        }
    }

    if (!encontrado) {
        return null; // El usuario no existe
    }

    // Verificar la contraseña
    if (encontrado.password !== password) {
        return null; // Contraseña incorrecta
    }

    // Si es exitoso, guardar el nombre del usuario activo
    guardarUsuarioActivo(encontrado.nombre); 

    return encontrado; // Retorna el objeto de usuario
}

document.addEventListener('DOMContentLoaded', function () {
  inicializarUsuariosSiVacio();
});