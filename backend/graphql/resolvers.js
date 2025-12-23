/**
 * @module resolvers
 * Contiene todos los resolvers (Queries y Mutations) para la API GraphQL del sistema de voluntariados.
 */

import {
  getAllUsuarios,
  getUsuarioByEmail,
  createUsuario,
  deleteUsuarioByEmail,
  deleteUsuarioByIndex
} from "../models/usuario.model.js";

import {
  getAllVoluntariados,
  getVoluntariadoById,
  createVoluntariado,
  updateVoluntariado,
  deleteVoluntariado,
  updateVoluntariadoByIndex,
  deleteVoluntariadoByIndex
} from "../models/voluntariado.model.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * Contexto de GraphQL con el usuario autenticado mediante JWT.
 * @typedef {Object} GraphQLContext
 * @property {{email: string, nombre: string, rol: string} | null} user - Usuario autenticado o null si no hay token válido.
 */

/**
 * Lanza un error si no hay usuario autenticado en el contexto.
 * @param {GraphQLContext} context - Contexto de GraphQL con el usuario autenticado.
 * @throws {Error} Si no existe usuario en el contexto.
 */
function requireAuth(context) {
  if (!context?.user) {
    throw new Error("No autorizado");
  }
}

/**
 * Objeto principal que contiene todos los resolvers para Queries y Mutations de GraphQL.
 *
 * @type {Object}
 */
export const root = {
  // ======================
  // Queries
  // ======================

  /**
   * Obtiene la lista completa de todos los usuarios registrados.
   * @async
   * @returns {Promise<Array<{nombre: string, email: string}>>}
   */
  usuarios: async () => {
    return getAllUsuarios();
  },

  /**
   * Busca un usuario específico por su dirección de correo electrónico.
   * @async
   * @param {{email: string}} args
   * @returns {Promise<{nombre: string, email: string} | null>}
   */
  usuarioPorEmail: async ({ email }) => {
    return getUsuarioByEmail(email);
  },

  /**
   * Obtiene la lista completa de todos los voluntariados disponibles.
   * @async
   * @returns {Promise<Array<{id: string, titulo: string, usuario: string, fecha: string, descripcion: string, tipo: string}>>}
   */
  voluntariados: async () => {
    return getAllVoluntariados();
  },

  /**
   * Busca un voluntariado específico por su ID único.
   * @async
   * @param {{id: string}} args
   * @returns {Promise<{id: string, titulo: string, usuario: string, fecha: string, descripcion: string, tipo: string} | null>}
   */
  voluntariadoPorId: async ({ id }) => {
    return getVoluntariadoById(id);
  },

  // ======================
  // Mutations
  // ======================

  /**
   * Crea un nuevo usuario en el sistema.
   * @async
   * @param {{nombre: string, email: string, password: string}} args
   * @returns {Promise<{id: string, nombre: string, email: string}>}
   */
  crearUsuario: async ({ nombre, email, password }) => {
    return createUsuario({ nombre, email, password });
  },

  /**
   * Elimina un usuario por su dirección de correo electrónico.
   * @async
   * @param {{email: string}} args
   * @param {GraphQLContext} context
   * @returns {Promise<string>}
   */
  borrarUsuarioPorEmail: async ({ email }, context) => {
    requireAuth(context);
    await deleteUsuarioByEmail(email);
    return "Usuario eliminado";
  },

  /**
   * Elimina un usuario por su posición en el array de usuarios.
   * @async
   * @param {{indice: number}} args
   * @param {GraphQLContext} context
   * @returns {Promise<string>}
   */
  borrarUsuarioPorIndice: async ({ indice }, context) => {
    requireAuth(context);
    const ok = await deleteUsuarioByIndex(indice);
    if (!ok) {
      throw new Error("Índice fuera de rango");
    }
    return "Usuario eliminado por índice";
  },

  /**
   * Inicia sesión validando credenciales y devuelve un token JWT.
   * @async
   * @param {{email: string, password: string}} args
   * @returns {Promise<{token: string, usuario: {nombre: string, email: string}}>}
   */
  login: async ({ email, password }) => {
    const user = await getUsuarioByEmail(email);
    if (!user) {
      throw new Error("Credenciales inválidas");
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new Error("Credenciales inválidas");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET no está definida en las variables de entorno");
    }

    const token = jwt.sign(
      { email: user.email, nombre: user.nombre, rol: "ADMIN" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      token,
      usuario: {
        nombre: user.nombre,
        email: user.email
      }
    };
  },

  /**
   * Crea un nuevo voluntariado validando el tipo.
   * @async
   * @param {{titulo: string, usuario: string, fecha: string, descripcion: string, tipo: 'PETICION' | 'OFERTA'}} args
   * @param {GraphQLContext} context
   * @returns {Promise<{id: string, titulo: string, usuario: string, fecha: string, descripcion: string, tipo: string}>}
   */
  crearVoluntariado: async ({ titulo, usuario, fecha, descripcion, tipo }, context) => {
    requireAuth(context);

    const tipoValido = ["PETICION", "OFERTA"];
    if (!tipoValido.includes(tipo)) {
      throw new Error("El tipo de voluntariado debe ser PETICION u OFERTA");
    }

    return createVoluntariado({
      titulo,
      usuario,
      fecha,
      descripcion,
      tipo
    });
  },

  /**
   * Actualiza un voluntariado por su ID validando el tipo.
   * @async
   * @param {{id: string}} args
   * @param {GraphQLContext} context
   * @returns {Promise<string>}
   */
  actualizarVoluntariado: async ({ id, ...cambios }, context) => {
    requireAuth(context);

    if (cambios.tipo) {
      const tipoValido = ["PETICION", "OFERTA"];
      if (!tipoValido.includes(cambios.tipo)) {
        throw new Error("El tipo de voluntariado debe ser PETICION u OFERTA");
      }
    }

    const actualizado = await updateVoluntariado(id, cambios);
    if (!actualizado) {
      throw new Error("Voluntariado no encontrado");
    }

    return "Voluntariado actualizado";
  },

  /**
   * Actualiza un voluntariado por su índice en el array.
   * @async
   * @param {{indice: number}} args
   * @param {GraphQLContext} context
   * @returns {Promise<string>}
   */
  actualizarVoluntariadoPorIndice: async ({ indice, ...cambios }, context) => {
    requireAuth(context);

    if (cambios.tipo) {
      const tipoValido = ["PETICION", "OFERTA"];
      if (!tipoValido.includes(cambios.tipo)) {
        throw new Error("El tipo de voluntariado debe ser PETICION u OFERTA");
      }
    }

    const ok = await updateVoluntariadoByIndex(indice, cambios);
    if (!ok) {
      throw new Error("Índice fuera de rango");
    }

    return "Voluntariado actualizado por índice";
  },

  /**
   * Elimina un voluntariado por su ID.
   * @async
   * @param {{id: string}} args
   * @param {GraphQLContext} context
   * @returns {Promise<string>}
   */
  eliminarVoluntariado: async ({ id }, context) => {
    requireAuth(context);

    const ok = await deleteVoluntariado(id);
    if (!ok) {
      throw new Error("Voluntariado no encontrado");
    }

    return "Voluntariado eliminado";
  },

  /**
   * Elimina un voluntariado por su índice en el array.
   * @async
   * @param {{indice: number}} args
   * @param {GraphQLContext} context
   * @returns {Promise<string>}
   */
  eliminarVoluntariadoPorIndice: async ({ indice }, context) => {
    requireAuth(context);

    const ok = await deleteVoluntariadoByIndex(indice);
    if (!ok) {
      throw new Error("Índice fuera de rango");
    }

    return "Voluntariado eliminado por índice";
  }
};
