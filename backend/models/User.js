import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true
        },
        rol: {
            type: String,
            enum: ["ADMIN", "USER"],
            default: "USER"
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("User", userSchema);
