/**
 * Verifica si una cadena tiene el formato básico de email válido.
 * @param {string} email - La cadena de email a validar.
 * @returns {boolean} True si el email es válido.
 */
function esEmailValido(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Verifica si una cadena es alfanumérica y tiene exactamente 8 caracteres.
 * @param {string} password - La cadena de contraseña a validar.
 * @returns {boolean} True si la contraseña es válida.
 */
function esPasswordValido(password) {
  const regex = /^[a-zA-Z0-9]{8,12}$/;
  return regex.test(password);
}
