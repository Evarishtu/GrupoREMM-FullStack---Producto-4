import mongoose from "mongoose";
import "dotenv/config";

const url = process.env.MONGO_URI;

if (!url) {
  throw new Error("La variable de entorno MONGO_URI no está definida");
}
/**
 * Establece la conexión con MongoDB usando Mongoose.
 */
export const connectDB = async () => {
  try {
    await mongoose.connect(url);
    console.log("Conectado a MongoDB con Mongoose");
  } catch (error) {
    console.error("Error al conectar con MongoDB:", error);
    process.exit(1); // Detenemos la app si no hay base de datos
  }
};