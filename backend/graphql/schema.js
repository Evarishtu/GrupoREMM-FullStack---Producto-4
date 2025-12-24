import { buildSchema } from "graphql";

/** @typedef {Object} GraphQLSchema */

/**
 * Esquema GraphQL completo de la aplicación.
 * Define todos los tipos, queries y mutations disponibles en la API.
 *
 * @type {GraphQLSchema}
 */
export const schema = buildSchema(`
    """
    Enum que define los roles de usuario.
    """
    enum RolUsuario {
        ADMIN
        USER
    }

    """
    Representa un usuario del sistema con sus datos públicos.
    """
    type Usuario {
        id: ID!
        nombre: String!
        email: String!
        rol: RolUsuario!
    }

    """
    Respuesta de autenticación: token JWT y datos públicos del usuario.
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
    Representa un voluntariado publicado en el sistema.
    """
    type Voluntariado {
        id: ID!
        titulo: String!
        usuario: String!
        fecha: String!
        descripcion: String!
        tipo: TipoVoluntariado!
    }

    type Query {
        usuarios: [Usuario!]!
        usuarioPorEmail(email: String!): Usuario
        voluntariados: [Voluntariado!]!
        voluntariadoPorId(id: ID!): Voluntariado
    }

    type Mutation {
        crearUsuario(
            nombre: String!
            email: String!
            password: String!
            rol: RolUsuario
        ): Usuario!

        borrarUsuarioPorEmail(email: String!): String!
        borrarUsuarioPorIndice(indice: Int!): String!

        login(email: String!, password: String!): AuthPayload!

        crearVoluntariado(
            titulo: String!
            fecha: String!
            descripcion: String!
            tipo: TipoVoluntariado!
        ): Voluntariado!

        actualizarVoluntariado(
            id: ID!
            titulo: String
            fecha: String
            descripcion: String
            tipo: TipoVoluntariado
        ): String!

        actualizarVoluntariadoPorIndice(
            indice: Int!
            titulo: String
            fecha: String
            descripcion: String
            tipo: TipoVoluntariado
        ): String!

        eliminarVoluntariado(id: ID!): String!
        eliminarVoluntariadoPorIndice(indice: Int!): String!
    }
`);
