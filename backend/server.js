/**
 * @module server
 * Servidor Fullstack JS - Producto 4
 * Configura Express, Mongoose, GraphQL y WebSockets (Socket.io).
 */
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { graphqlHTTP } from "express-graphql";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http"; // Requerido para WebSockets
import { Server } from "socket.io";   // Requerido para WebSockets

// Importaciones de configuración propia
import { connectDB } from "./database/database.js";
import { schema } from "./graphql/schema.js";
import { root } from "./graphql/resolvers.js";

const app = express();
const port = process.env.PORT || 3000;

/**
 * 1. CONEXIÓN A BASE DE DATOS
 * Usamos la nueva configuración de Mongoose
 */
connectDB();

/**
 * 2. CONFIGURACIÓN DEL SERVIDOR HTTP Y SOCKET.IO
 */
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // En producción, especificar el dominio del frontend
    methods: ["GET", "POST"]
  }
});

// Hacemos que io sea accesible desde req para usarlo en los resolvers si fuera necesario
app.set("socketio", io);

/**
 * 3. MIDDLEWARES
 */
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Documentación JSDoc
app.use("/docs", express.static(path.join(__dirname, "docs")));

/**
 * 4. AUTENTICACIÓN MEJORADA (JWT + ROL)
 */
app.use((req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    try {
      // El payload ahora incluirá el campo 'rol' (configurado en el login)
      req.user = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
});

/**
 * 5. ENDPOINT GRAPHQL
 * Se pasa el objeto 'io' en el context para emitir eventos desde los resolvers
 */
app.use(
  "/graphql",
  graphqlHTTP((req) => ({
    schema,
    rootValue: root,
    graphiql: true,
    context: { 
      user: req.user,
      io: io // Permite enviar notificaciones en tiempo real al crear/borrar
    }
  }))
);

/**
 * 6. GESTIÓN DE EVENTOS SOCKET.IO
 */
io.on("connection", (socket) => {
  console.log(`Nuevo cliente conectado: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

/**
 * 7. ARRANQUE DEL SERVIDOR
 * IMPORTANTE: Usamos httpServer.listen, NO app.listen
 */
httpServer.listen(port, () => {
  console.log(`Servidor Fullstack listo en http://localhost:${port}`);
  console.log(`GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`WebSockets activos`);
});