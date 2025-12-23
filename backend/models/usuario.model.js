import bcrypt from "bcrypt";
import User from "./User.js";

/** 
* Recupera todos los usuarios
* @returns {Promise<Array>}   
*/
export async function getAllUsuarios(){
    return User.find({}, {password: 0});
}

/**
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
export async function getUsuarioByEmail(email){
    return User.findOne({email});
}
/**
 * Crea un nuevo usuario
 * @param {{nombre: string, email: string, password: string}} data
 * @returns {Promise<{id: string, nombre: string, email: string}>}
 */
export async function createUsuario(data){
    if(!data?.nombre || !data?.email || !data?.password){
        throw new Error("Faltan datos obligatorios para crear el usuario");
    }
    const existente = await User.findOne({email: data.email});
    if (existente){
        throw new Error ("Ya existe un usuario con ese email");
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const user = new User({
        nombre: data.nombre,
        email: data.email,
        password: hashed
    });

    await user.save();

    return {
        id: user._id.toString(),
        nombre: user.nombre,
        email: user.email
    };
}

/**
 * @param {string} email
 * @returns {Promise<boolean>}
 */
export async function deleteUsuarioByEmail(email){
    const result = await User.deleteOne({email});
    return result.deleteCount === 1;
}

/**
 * Elimina un usuario por índice
 * @param {number} index
 * @returns {Promise<boolean>}
 */
export async function deleteUsuarioByIndex(index){
    const usuarios = await User.find();

    if(!Number.isInteger(index) || index < 0 || index >= usuarios.length){
        return false;
    }
    await User.deleteOne({_id: usuarios[index]._id});
    return true;
}