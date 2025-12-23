import Voluntariado from "./Voluntariado.js";

/**
 * Obtiene todos los voluntariados.
 */
export async function getAllVoluntariados(){
    return Voluntariado.find();
}

/**
 * Obtiene un voluntariado por ID.
 */
export async function getVoluntariadoById(id){
    return Voluntariado.findById(id);
}

/**
 * Crea un nuevo voluntariado.
 */
export async function createVoluntariado(data){
    if(
        !data?.titulo ||
        !data?.usuario ||
        !data?.fecha ||
        !data?.descripcion ||
        !data?.tipo 
    ) {
        throw new Error("Faltan datos obligatorios para crear el voluntariado");
    }
    const voluntariado = new Voluntariado(data);
    await voluntariado.save();

    return {
        id: voluntariado._id.toString(),
        titulo: voluntariado.titulo,
        usuario: voluntariado.usuario,
        fecha: voluntariado.fecha,
        descripcion: voluntariado.descripcion,
        tipo: voluntariado.tipo
    };
}
/**
 * Actualizar un voluntariado por ID
 */

export async function updateVoluntariado(id, cambios){
    const actualizado = await Voluntariado.fundByIdAndUpdate(
        id,
        cambios,
        {new: true, runValidators: true}
    );
    return actualizado;
}
/**
 * Elimina un voluntariado por ID
 */
export async function deleteVoluntariado(id){
    const result = await Voluntariado.deleteOne({_id: id});
    return result.deletedCount === 1;
}
/**
 * Obtiene un voluntariado por índice
 */
export async function getVoluntariadoByIndex(index){
    const voluntariados = await Voluntariado.find();

    if(!Number.isInteger(index) || index < 0 || index >= voluntariados.length){
        return null;
    }
    return voluntariados[index];
}
/**
 * Actualiza un voluntariado por índice
 */
export async function updateVoluntariadoByIndex(index, cambios){
    const voluntariados = await Voluntariado.find();

    if (!Number.isInteger(index) || index < 0 || index >= voluntariados.length){
        return false;
    }
    await Voluntariado.findByIdAndUpdate(
        voluntariados[index]._id,
        cambios,
        {runValidators: true}
    );
    return true;
}
/**
 * Elimina un voluntariado por índice
 */
export async function deleteVoluntariadoByIndex(index){
    const voluntariados = await Voluntariado.find();

    if(!Number.isInteger(index) || index < 0 || index >= voluntariados.length){
        return false;
    }
    await Voluntariado.deleteOne({_id: voluntariados[index]._id});
    return true;
}

