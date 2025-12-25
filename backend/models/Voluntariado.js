import mongoose from "mongoose";

const voluntariadoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  usuarioEmail: { type: String, required: true }, // Referencia al email del creador
  fecha: { type: Date, default: Date.now },
  descripcion: { type: String, required: true },
  tipo: { type: String, enum: ["PETICION", "OFERTA"], required: true }
});

export const Voluntariado = mongoose.model("Voluntariado", voluntariadoSchema);