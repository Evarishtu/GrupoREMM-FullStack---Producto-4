/**
 * @module server
 * Servidor principal de la API GraphQL para el sistema de voluntariados.
 * Configura Express.js con middleware y el endpoint GraphQL.
 */
import dotenv from "dotenv";

/**
 * Carga las variables de entorno desde el archivo .env.
 */
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { graphqlHTTP } from "express-graphql";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

import { schema } from "./graphql/schema.js";
import { root } from "./graphql/resolvers.js";
import { connectMongo } from "./database/mongoose.js";


/** @typedef {Object} Express */

/**
 * Aplicación Express principal.
 * @type {Express}
 */
const app = express();

/**
 * Puerto en el que escuchará el servidor.
 * Usa la variable de entorno PORT o 3000 por defecto.
 * @type {number|string}
 */
const port = process.env.PORT || 3000;

/**
 * Middleware para parsear cuerpos JSON en las peticiones entrantes.
 */
app.use(bodyParser.json());

/**
 * Middleware CORS que permite peticiones desde cualquier origen.
 */
app.use(cors());

/**
 * Variables para resolver la ruta absoluta del archivo y directorio actual.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Middleware estático para servir la documentación JSDoc desde /docs.
 */
app.use("/docs", express.static(path.join(__dirname, "docs")));

/**
 * Middleware para extraer JWT del header Authorization: Bearer <token>.
 * Si el token es válido, se añade el usuario decodificado en req.user.
 */
app.use((req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
});

/**
 * Middleware GraphQL principal en la ruta /graphql.
 * Expone la API GraphQL completa con interfaz GraphiQL en desarrollo.
 */
app.use(
  "/graphql",
  graphqlHTTP((req) => ({
    schema,
    rootValue: root,
    graphiql: true,
    context: { user: req.user }
  }))
);

/**
 * Inicia el servidor HTTP escuchando en el puerto configurado.
 */

async function startServer() {
  await connectMongo();

  app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
  });
}

startServer();
