import { ObjectId } from "mongodb";
import { getDB } from "../database/database.js";

/**
 * Nombre de la colección de MongoDB que almacena los documentos de voluntariado.
 * @constant {string}
 */
const COLLECTION = "voluntariados";

/**
 * Documento de voluntariado tal como se almacena en MongoDB.
 * @typedef {Object} VoluntariadoDB
 * @property {ObjectId} _id - Identificador único generado por MongoDB.
 * @property {string} titulo - Título de la publicación.
 * @property {string} usuario - Usuario que publica.
 * @property {string} fecha - Fecha de la publicación.
 * @property {string} descripcion - Descripción del voluntariado.
 * @property {"PETICION"|"OFERTA"} tipo - Tipo de voluntariado.
 */

/**
 * Objeto de voluntariado expuesto por la API (id como string).
 * @typedef {Object} VoluntariadoAPI
 * @property {string} id - Identificador único como string.
 * @property {string} titulo
 * @property {string} usuario
 * @property {string} fecha
 * @property {string} descripcion
 * @property {"PETICION"|"OFERTA"} tipo
 */

/**
 * Convierte un documento de MongoDB (con `_id: ObjectId`) en un objeto apto para la API
 * (con `id: string`).
 * @param {VoluntariadoDB} v - El documento de voluntariado de MongoDB.
 * @returns {VoluntariadoAPI} El objeto de voluntariado mapeado.
 */
function mapVoluntariado(v) {
  return {
    id: v._id.toString(),
    titulo: v.titulo,
    usuario: v.usuario,
    fecha: v.fecha,
    descripcion: v.descripcion,
    tipo: v.tipo
  };
}

/**
 * Recupera y devuelve todos los documentos de voluntariado, mapeándolos para la API.
 * @async
 * @returns {Promise<VoluntariadoAPI[]>}
 */
export async function getAllVoluntariados() {
  const db = await getDB();
  const lista = await db.collection(COLLECTION).find().toArray();
  return lista.map(mapVoluntariado);
}

/**
 * Busca y devuelve un único voluntariado basándose en su ID de MongoDB.
 * @async
 * @param {string} id - El ID del voluntariado a buscar (string que representa un ObjectId).
 * @returns {Promise<VoluntariadoAPI | null>}
 */
export async function getVoluntariadoById(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const db = await getDB();
  const v = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });

  return v ? mapVoluntariado(v) : null;
}

/**
 * Inserta un nuevo documento de voluntariado en la colección.
 * @async
 * @param {Omit<VoluntariadoDB, "_id">} data - Datos del nuevo voluntariado.
 * @returns {Promise<VoluntariadoAPI>} El voluntariado insertado, incluyendo el ID como string.
 */
export async function createVoluntariado(data) {
  if (
    !data?.titulo ||
    !data?.usuario ||
    !data?.fecha ||
    !data?.descripcion ||
    !data?.tipo
  ) {
    throw new Error("Faltan datos obligatorios para crear el voluntariado");
  }

  const tipoValido = ["PETICION", "OFERTA"];
  if (!tipoValido.includes(data.tipo)) {
    throw new Error("El tipo de voluntariado debe ser PETICION u OFERTA");
  }

  const db = await getDB();
  const result = await db.collection(COLLECTION).insertOne(data);

  return {
    id: result.insertedId.toString(),
    ...data
  };
}

/**
 * Actualiza los campos especificados de un voluntariado por su ID.
 * @async
 * @param {string} id - El ID del voluntariado a actualizar.
 * @param {Partial<VoluntariadoDB>} data - Campos y nuevos valores a aplicar.
 * @returns {Promise<VoluntariadoAPI | null>}
 */
export async function updateVoluntariado(id, data) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  if (data.tipo) {
    const tipoValido = ["PETICION", "OFERTA"];
    if (!tipoValido.includes(data.tipo)) {
      throw new Error("El tipo de voluntariado debe ser PETICION u OFERTA");
    }
  }

  const db = await getDB();
  const result = await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(id) },
    { $set: data }
  );

  if (result.matchedCount === 0) {
    return null;
  }

  return getVoluntariadoById(id);
}

/**
 * Elimina un voluntariado basándose en su ID de MongoDB.
 * @async
 * @param {string} id - El ID del voluntariado a eliminar.
 * @returns {Promise<boolean>} `true` si se eliminó, `false` si no existía.
 */
export async function deleteVoluntariado(id) {
  if (!ObjectId.isValid(id)) {
    return false;
  }

  const db = await getDB();
  const result = await db
    .collection(COLLECTION)
    .deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount === 1;
}

/**
 * Busca y devuelve un voluntariado basándose en su posición (índice) en el array de todos los voluntariados.
 * @async
 * @param {number} index - El índice (posición) del voluntariado a buscar.
 * @returns {Promise<VoluntariadoAPI | null>}
 */
export async function getVoluntariadoByIndex(index) {
  const voluntariados = await getAllVoluntariados();

  if (!Number.isInteger(index) || index < 0 || index >= voluntariados.length) {
    return null;
  }

  return voluntariados[index];
}

/**
 * Actualiza los campos especificados de un voluntariado basándose en su índice.
 * @async
 * @param {number} index - El índice del voluntariado a actualizar.
 * @param {Partial<VoluntariadoDB>} cambios - Campos y nuevos valores a aplicar.
 * @returns {Promise<boolean>} `true` si se actualizó, `false` si el índice está fuera de rango.
 */
export async function updateVoluntariadoByIndex(index, cambios) {
  const voluntariados = await getAllVoluntariados();

  if (!Number.isInteger(index) || index < 0 || index >= voluntariados.length) {
    return false;
  }

  if (cambios.tipo) {
    const tipoValido = ["PETICION", "OFERTA"];
    if (!tipoValido.includes(cambios.tipo)) {
      throw new Error("El tipo de voluntariado debe ser PETICION u OFERTA");
    }
  }

  const voluntariado = voluntariados[index];
  const db = await getDB();

  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(voluntariado.id) },
    { $set: cambios }
  );

  return true;
}

/**
 * Elimina un voluntariado basándose en su índice.
 * @async
 * @param {number} index - El índice del voluntariado a eliminar.
 * @returns {Promise<boolean>} `true` si se eliminó, `false` si el índice está fuera de rango.
 */
export async function deleteVoluntariadoByIndex(index) {
  const voluntariados = await getAllVoluntariados();

  if (!Number.isInteger(index) || index < 0 || index >= voluntariados.length) {
    return false;
  }

  const voluntariado = voluntariados[index];
  const db = await getDB();

  await db.collection(COLLECTION).deleteOne({
    _id: new ObjectId(voluntariado.id)
  });

  return true;
}
