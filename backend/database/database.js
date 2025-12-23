/**
 * @module database
 * Módulo responsable de la conexión a MongoDB.
 * Implementa un patrón Singleton para reutilizar la misma conexión
 * en todo el backend.
 */

import "dotenv/config";
import { MongoClient } from "mongodb";

/**
 * URL de conexión a la instancia de MongoDB.
 * Debe proporcionarse mediante la variable de entorno MONGO_URI.
 *
 * @type {string}
 */
const url = process.env.MONGO_URI;

/**
 * Nombre de la base de datos a utilizar dentro del servidor MongoDB.
 * Se configura mediante la variable de entorno MONGO_DB_NAME.
 *
 * @type {string}
 */
const dbName = process.env.MONGO_DB_NAME;

/**
 * Valida que las variables de entorno necesarias estén definidas.
 * Lanza un error en tiempo de arranque si falta alguna.
 */
if (!url) {
  throw new Error("La variable de entorno MONGO_URI no está definida");
}

if (!dbName) {
  throw new Error("La variable de entorno MONGO_DB_NAME no está definida");
}

/**
 * Instancia del cliente de MongoDB usada para manejar la conexión.
 *
 * @type {MongoClient}
 */
const client = new MongoClient(url);

/** @typedef {Object} Db */

/**
 * Variable que almacena la instancia de la base de datos una vez conectada.
 * Inicialmente es `null`. Implementa el patrón Singleton para mantener una única conexión.
 *
 * @type {Db | null}
 */
let db = null;

/**
 * Inicializa (si es necesario) y devuelve la instancia de la base de datos de MongoDB.
 * Si la conexión ya existe, reutiliza la misma instancia.
 *
 * @async
 * @function getDB
 * @returns {Promise<Db>} Promesa que resuelve con el objeto de la base de datos.
 * @throws {Error} Si falla la conexión con MongoDB.
 */
export async function getDB() {
  if (!db) {
    try {
      await client.connect();
      db = client.db(dbName);
      console.log("Conectado a MongoDB");
    } catch (error) {
      console.error("Error al conectar con MongoDB:", error);
      throw new Error("No se pudo establecer conexión con la base de datos");
    }
  }

  return db;
}
