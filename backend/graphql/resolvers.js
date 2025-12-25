/**
 * @module resolvers
 * Contiene todos los resolvers (Queries y Mutations) para la API GraphQL del sistema de voluntariados.
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Voluntariado from "../models/Voluntariado.js";
import { requireAuth, requireRole } from "./auth.js";

function emitirEventoVoluntariado(io, evento, payload, usuarios = []) {
  if (!io) {
    return;
  }

  const rooms = new Set(["admins"]);
  usuarios.filter(Boolean).forEach((email) => rooms.add(`user:${email}`));

  rooms.forEach((room) => {
    io.to(room).emit(evento, payload);
  });
}

/**
 * Contexto de GraphQL con el usuario autenticado mediante JWT.
 * @typedef {Object} GraphQLContext
 * @property {{email: string, nombre: string, role: string} | null} user - Usuario autenticado o null si no hay token válido.
 */

/**
 * Lanza un error si no hay usuario autenticado en el contexto.
 * @param {GraphQLContext} context - Contexto de GraphQL con el usuario autenticado.
 * @throws {Error} Si no existe usuario en el contexto.
 */

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
  usuarios: async (_, context) => {
    requireRole(context, "ADMIN");
    const usuarios = await User.find({});
    return usuarios.map((usuario) => ({
      id: usuario._id.toString(),
      nombre: usuario.nombre,
      email: usuario.email,
      password: usuario.passwordOriginal,
      role: usuario.role,
    }));
  },

  /**
   * Busca un usuario específico por su dirección de correo electrónico.
   * @async
   * @param {{email: string}} args
   * @returns {Promise<{nombre: string, email: string} | null>}
   */
  usuarioPorEmail: async ({ email }, context) => {
    requireAuth(context);
    if (context.user.role !== "ADMIN" && context.user.email !== email) {
      throw new Error("No tienes permisos para ver este usuario");
    }
    const usuario = await User.findOne({ email }).select("-password");
    if (!usuario) {
      return null;
    }
    return {
      id: usuario._id.toString(),
      nombre: usuario.nombre,
      email: usuario.email,
      role: usuario.role ?? usuario.rol ?? "USER",
    };
  },

  /**
   * Obtiene la lista completa de todos los voluntariados disponibles.
   * @async
   * @returns {Promise<Array<{id: string, titulo: string, usuario: string, fecha: string, descripcion: string, tipo: string}>>}
   */
  voluntariados: async (_, context) => {
    requireAuth(context);
    // Devolvemos todos los documentos sin filtrar por usuario
    return await Voluntariado.find();
  },

  /**
   * Busca un voluntariado específico por su ID único.
   * @async
   * @param {{id: string}} args
   * @returns {Promise<{id: string, titulo: string, usuario: string, fecha: string, descripcion: string, tipo: string} | null>}
   */
  voluntariadoPorId: async ({ id }, context) => {
    requireAuth(context);
    const voluntariado = await Voluntariado.findById(id);
    if (!voluntariado) {
      return null;
    }
    if (
      context.user.role !== "ADMIN" &&
      voluntariado.usuario !== context.user.email
    ) {
      throw new Error("No tienes permisos para ver este voluntariado");
    }
    emitirEventoVoluntariado(
      context.io,
      "voluntariado_seleccionado",
      { id: voluntariado._id.toString() },
      [voluntariado.usuario]
    );
    return voluntariado;
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

  crearUsuario: async ({ nombre, email, password, role }) => {
    if (!nombre || !email || !password) {
      throw new Error("Faltan datos obligatorios para crear el usuario");
    }

    const existente = await User.findOne({ email });
    if (existente) {
      throw new Error("Ya existe un usuario con ese email");
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      nombre,
      email,
      password: hashed,
      passwordOriginal: password,
      role: role || "USER",
    });

    return {
      id: user._id.toString(),
      nombre: user.nombre,
      email: user.email,
      role: user.role ?? "USER",
    };
  },

  /**
   * Elimina un usuario por su dirección de correo electrónico.
   * @async
   * @param {{email: string}} args
   * @param {GraphQLContext} context
   * @returns {Promise<string>}
   */
  borrarUsuarioPorEmail: async ({ email }, context) => {
    requireRole(context, "ADMIN");
    await User.deleteOne({ email });
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
    requireRole(context, "ADMIN");
    const usuarios = await User.find();
    if (!Number.isInteger(indice) || indice < 0 || indice >= usuarios.length) {
      throw new Error("Índice fuera de rango");
    }
    await User.deleteOne({ _id: usuarios[indice]._id });
    return "Usuario eliminado por índice";
  },

  /**
   * Inicia sesión validando credenciales y devuelve un token JWT.
   * @async
   * @param {{email: string, password: string}} args
   * @returns {Promise<{token: string, usuario: {nombre: string, email: string}}>}
   */
  login: async ({ email, password }, context) => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Credenciales inválidas");
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new Error("Credenciales inválidas");
    }

    const role = user.role ?? user.rol ?? "USER";

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    if (context?.req?.session) {
      context.req.session.user = {
        id: user._id.toString(),
        nombre: user.nombre,
        email: user.email,
        role,
      };
    }

    return {
      token,
      usuario: {
        nombre: user.nombre,
        email: user.email,
        role,
      },
    };
  },

  /**
   * Crea un nuevo voluntariado validando el tipo.
   * @async
   * @param {{titulo: string, usuario: string, fecha: string, descripcion: string, tipo: 'PETICION' | 'OFERTA', imagen: string}} args
   * @param {GraphQLContext} context
   * @returns {Promise<{id: string, titulo: string, usuario: string, fecha: string, descripcion: string, tipo: string, imagen: string}>}
   */
  crearVoluntariado: async (
    { titulo, usuario, fecha, descripcion, tipo, imagen },
    context
  ) => {
    requireAuth(context);

    const tipoValido = ["PETICION", "OFERTA"];
    if (!tipoValido.includes(tipo)) {
      throw new Error("El tipo de voluntariado debe ser PETICION u OFERTA");
    }

    const usuarioAsignado =
      context.user.role === "ADMIN" && usuario ? usuario : context.user.email;

    const voluntariado = await Voluntariado.create({
      titulo,
      usuario: usuarioAsignado,
      fecha,
      descripcion,
      tipo,
      imagen,
    });

    const nuevo = {
      id: voluntariado._id.toString(),
      titulo: voluntariado.titulo,
      usuario: voluntariado.usuario,
      fecha: voluntariado.fecha,
      descripcion: voluntariado.descripcion,
      tipo: voluntariado.tipo,
      imagen: voluntariado.imagen,
    };

    emitirEventoVoluntariado(context.io, "voluntariado_creado", nuevo, [
      nuevo.usuario,
    ]);

    return nuevo;
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

    const objetivo = await Voluntariado.findById(id);
    if (!objetivo) {
      throw new Error("Voluntariado no encontrado");
    }
    if (
      context.user.role !== "ADMIN" &&
      objetivo.usuario !== context.user.email
    ) {
      throw new Error("No tienes permisos para actualizar este voluntariado");
    }

    const actualizado = await Voluntariado.findByIdAndUpdate(id, cambios, {
      new: true,
      runValidators: true,
    });
    if (!actualizado) {
      throw new Error("Voluntariado no encontrado");
    }

    emitirEventoVoluntariado(
      context.io,
      "voluntariado_actualizado",
      { id, ...cambios },
      [objetivo.usuario, actualizado.usuario]
    );

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

    if (context.user.role !== "ADMIN") {
      throw new Error("No tienes permisos para actualizar por índice");
    }

    const voluntariados = await Voluntariado.find();

    if (
      !Number.isInteger(indice) ||
      indice < 0 ||
      indice >= voluntariados.length
    ) {
      throw new Error("Índice fuera de rango");
    }

    await Voluntariado.findByIdAndUpdate(voluntariados[indice]._id, cambios, {
      runValidators: true,
    });

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

    const voluntariado = await Voluntariado.findById(id);
    if (!voluntariado) {
      throw new Error("Voluntariado no encontrado");
    }
    if (
      context.user.role !== "ADMIN" &&
      voluntariado.usuario !== context.user.email
    ) {
      throw new Error("No tienes permisos para eliminar este voluntariado");
    }

    await Voluntariado.deleteOne({ _id: id });

    emitirEventoVoluntariado(context.io, "voluntariado_eliminado", { id }, [
      voluntariado.usuario,
    ]);

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
    requireRole(context, "ADMIN");

    const voluntariados = await Voluntariado.find();

    if (
      !Number.isInteger(indice) ||
      indice < 0 ||
      indice >= voluntariados.length
    ) {
      throw new Error("Índice fuera de rango");
    }

    await Voluntariado.deleteOne({ _id: voluntariados[indice]._id });

    return "Voluntariado eliminado por índice";
  },
};
