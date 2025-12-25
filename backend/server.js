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
import session from "express-session";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
//import { createServer } from "https";
import http from "http";
import https from "https";
import { Server } from "socket.io";

import { schema } from "./graphql/schema.js";
import { root } from "./graphql/resolvers.js";
import { connectMongo } from "./database/mongoose.js";

/** @typedef {Object} Express */

/**
 * Aplicación Express principal.
 * @type {Express}
 */
const app = express();
const isCodeSandbox = !!process.env.CODESANDBOX;

let httpServer;

if (isCodeSandbox) {
  console.log("codesandbox");
  // CodeSandbox: HTTP intern (el proxy ja et dona HTTPS públic)
  httpServer = http.createServer(app);
} else {
  console.log("localhost");
  // Local: HTTPS self-signed
  const keyPath = path.join(process.cwd(), "certs", "dev.key");
  const certPath = path.join(process.cwd(), "certs", "dev.crt");
  httpServer = https.createServer(
    { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) },
    app
  );
}

/**
 * Middleware para parsear cuerpos JSON en las peticiones entrantes.
 */
app.use(bodyParser.json());

const allowedOrigins = [
  "http://localhost:5500",
  "https://localhost:5500",
  "https://hrmfz4-4000.csb.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permet peticions sense Origin (curl, Postman, alguns redirects)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// IMPORTANT: abans de routes
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next();
  }
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = {
      ...user,
      role: user.role ?? user.rol ?? "USER",
    };
    return next();
  } catch (error) {
    return next();
  }
});

io.on("connection", (socket) => {
  if (socket.user?.role === "ADMIN") {
    socket.join("admins");
  }
  if (socket.user?.email) {
    socket.join(`user:${socket.user.email}`);
  }
});

/**
 * Puerto en el que escuchará el servidor.
 * Usa la variable de entorno PORT o 3000 por defecto.
 * @type {number|string}
 */
const port = process.env.PORT || 4000;

/**
 * Middleware de sesión para mantener estado de usuario en servidor.
 */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    },
  })
);

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
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      if (req.user?.rol && !req.user.role) {
        req.user.role = req.user.rol;
      }
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
});

app.use((req, res, next) => {
  console.log("REQ", req.method, req.url, "ORIGIN", req.headers.origin);
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
    context: { user: req.user, io, req },
  }))
);

/**
 * Inicia el servidor HTTP escuchando en el puerto configurado.
 */

async function startServer() {
  await connectMongo();

  httpServer.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
  });
}

startServer();
