import mongoose from "mongoose";

export async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME
    });

    console.log("Conectado a MongoDB (Mongoose)");
  } catch (error) {
    console.error("Error conectando MongoDB:", error);
    process.exit(1);
  }
}