import { buildSchema } from "graphql";

/**
 * Esquema GraphQL Actualizado - Producto 4
 * Incluye: Roles de usuario, IDs y tipos de datos para Mongoose.
 */
export const schema = buildSchema(`
    """
    Representa un usuario del sistema con control de roles.
    """
    type Usuario {
        id: ID!
        nombre: String!
        email: String!
        rol: String!
    }

    """
    Respuesta de autenticación que incluye el token JWT y los datos del usuario logueado.
    """
    type AuthPayload {
        token: String!
        usuario: Usuario!
    }

    """
    Enum que define los tipos posibles de voluntariado.
    """
    enum TipoVoluntariado {
        PETICION
        OFERTA
    }

    """
    Representa un voluntariado. 
    Nota: El campo 'usuario' ahora suele referenciar al email o ID del creador.
    """
    type Voluntariado {
        id: ID!
        titulo: String!
        usuario: String!
        fecha: String!
        descripcion: String!
        tipo: TipoVoluntariado!
    }

    """
    Queries para recuperación de datos.
    El acceso a estas queries será filtrado en los resolvers según el ROL.
    """
    type Query {
        """
        Obtiene todos los usuarios (Solo para Admin).
        """
        usuarios: [Usuario!]!

        """
        Busca un usuario por email.
        """
        usuarioPorEmail(email: String!): Usuario

        """
        Lista todos los voluntariados (Los usuarios ven todos, los Admin gestionan todos).
        """
        voluntariados: [Voluntariado!]!

        """
        Busca un voluntariado específico por su ID de MongoDB.
        """
        voluntariadoPorId(id: ID!): Voluntariado
    }

    """
    Mutations para modificar datos. 
    Se implementa lógica de seguridad: 'admin' puede todo, 'user' solo lo propio.
    """
    type Mutation {

        """
        Crea un usuario. Ahora permite especificar el rol (opcional, por defecto 'user').
        """
        crearUsuario(nombre: String!, email: String!, password: String!, rol: String): Usuario!

        """
        Elimina un usuario (Normalmente restringido a Admin).
        """
        borrarUsuarioPorEmail(email: String!): String!

        """
        Inicia sesión y genera el token con la información del ROL.
        """
        login(email: String!, password: String!): AuthPayload!

        """
        Crea un voluntariado y emite un evento por WebSockets.
        """
        crearVoluntariado(
            titulo: String!,
            usuario: String!,
            fecha: String!,
            descripcion: String!,
            tipo: TipoVoluntariado!
        ): Voluntariado!

        """
        Actualiza un voluntariado por ID. 
        El servidor verificará si el usuario es dueño del post o es Admin.
        """
        actualizarVoluntariado(
            id: ID!,
            titulo: String,
            usuario: String,
            fecha: String,
            descripcion: String,
            tipo: TipoVoluntariado
        ): String!

        """
        Elimina un voluntariado por ID.
        """
        eliminarVoluntariado(id: ID!): String!

        # Nota: Se recomienda eliminar los métodos 'PorIndice' ya que al usar 
        # MongoDB/Mongoose, el ID es el identificador único fiable.
    }
`);