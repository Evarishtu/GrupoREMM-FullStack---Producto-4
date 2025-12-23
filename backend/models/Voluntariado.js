import mongoose from "mongoose";

const voluntariadoSchema = new mongoose.Schema(
    {
        titulo: {
            type: String,
            required: true,
            trim: true
        },
        usuario: {
            type: String,
            required: true 
        },
        descripcion: {
            type: String,
            required: true
        },
        tipo: {
            type: String,
            enum: ["PETICION", "OFERTA"],
            required: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Voluntariado", voluntariadoSchema);