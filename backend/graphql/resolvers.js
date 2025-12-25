import { Usuario } from "../models/Usuario.js";
import { Voluntariado } from "../models/Voluntariado.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const root = {
  // --- QUERIES ---
  usuarios: async (args, context) => {
    // Control de acceso: Solo admin puede ver la lista completa
    if (!context.user || context.user.rol !== "admin") {
      throw new Error("Acceso denegado: Se requieren permisos de administrador");
    }
    return await Usuario.find();
  },

  usuarioPorEmail: async ({ email }, context) => {
    // Un usuario solo puede ver su propio perfil, a menos que sea admin
    if (!context.user || (context.user.email !== email && context.user.rol !== "admin")) {
      throw new Error("No tienes permiso para ver este perfil");
    }
    return await Usuario.findOne({ email });
  },

  voluntariados: async () => {
    return await Voluntariado.find();
  },

  voluntariadoPorId: async ({ id }) => {
    return await Voluntariado.findById(id);
  },

  // --- MUTATIONS ---
  crearUsuario: async ({ nombre, email, password, rol }) => {
    const existe = await Usuario.findOne({ email });
    if (existe) throw new Error("El email ya está registrado");

    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password: hashedPassword,
      rol: rol || "user"
    });

    return await nuevoUsuario.save();
  },

  login: async ({ email, password }) => {
    const usuario = await Usuario.findOne({ email });
    if (!usuario) throw new Error("Usuario no encontrado");

    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) throw new Error("Contraseña incorrecta");

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "1h" }
    );

    return { token, usuario };
  },

  crearVoluntariado: async (args, context) => {
    if (!context.user) throw new Error("Debes estar autenticado");

    const nuevoVol = new Voluntariado(args);
    const guardado = await nuevoVol.save();

    // NOTIFICACIÓN EN TIEMPO REAL (Websocket)
    // Avisamos a todos los clientes que hay un nuevo voluntariado
    context.io.emit("voluntariado-creado", guardado);

    return guardado;
  },

  actualizarVoluntariado: async ({ id, ...cambios }, context) => {
    if (!context.user) throw new Error("No autenticado");

    const vol = await Voluntariado.findById(id);
    if (!vol) throw new Error("Voluntariado no encontrado");

    // Seguridad: Solo el dueño o el admin pueden editar
    if (vol.usuarioEmail !== context.user.email && context.user.rol !== "admin") {
      throw new Error("No tienes permiso para editar esto");
    }

    await Voluntariado.findByIdAndUpdate(id, cambios);
    
    // Notificamos la actualización
    context.io.emit("voluntariado-actualizado", { id, ...cambios });
    
    return "Actualizado correctamente";
  },

  eliminarVoluntariado: async ({ id }, context) => {
    if (!context.user) throw new Error("No autenticado");

    const vol = await Voluntariado.findById(id);
    if (!vol) throw new Error("No existe");

    if (vol.usuarioEmail !== context.user.email && context.user.rol !== "admin") {
      throw new Error("No tienes permiso para eliminar esto");
    }

    await Voluntariado.findByIdAndDelete(id);
    
    // Notificamos la eliminación
    context.io.emit("voluntariado-eliminado", id);
    
    return "Eliminado correctamente";
  }
};