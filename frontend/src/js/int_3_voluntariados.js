const DB_NAME = "VoluntariadoDB";
const DB_VERSION = 2;
let db = null;

/**
 * Abre la conexión con la base de datos IndexedDB, creando el store 'voluntariados' si es necesario.
 * @returns {Promise<IDBDatabase>} Promesa que resuelve con la conexión a la BD.
 */
function abrirBDVoluntariados() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = function (event) {
      const database = event.target.result;

      if (!database.objectStoreNames.contains("voluntariados")) {
        const store = database.createObjectStore("voluntariados", {
          keyPath: "id",
          autoIncrement: true
        });

        store.createIndex("titulo", "titulo", { unique: false });
      }
    };

    req.onsuccess = function (event) {
      db = event.target.result;
      resolve(db);
    };

    req.onerror = function (event) {
      console.error("Error al abrir IndexedDB:", event);
      reject(event);
    };
  });
}

/**
 * Obtiene todos los registros de voluntariados desde IndexedDB.
 * @returns {Promise<Array<Object>>} Promesa que resuelve con la lista de voluntariados.
 */
async function obtenerVoluntariadosBD() {
  if (!db) {
    await abrirBDVoluntariados();
  }
  return new Promise((resolve) => {
    const tx = db.transaction("voluntariados", "readonly");
    const store = tx.objectStore("voluntariados");

    const req = store.getAll();

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve([]);
  });
}

/**
 * Comprueba si la tienda de 'voluntariados' tiene datos.
 * @returns {Promise<boolean>} True si hay datos, False si está vacía.
 */
function voluntariadosExistenBD() {
    return new Promise((resolve) => {
        if (!db) {
            resolve(false);
            return;
        }
        const tx = db.transaction("voluntariados", "readonly");
        const store = tx.objectStore("voluntariados");
        
        // Contar el número de elementos
        const req = store.count(); 

        req.onsuccess = () => resolve(req.result > 0);
        req.onerror = () => resolve(false); // Si hay un error, asumimos que no hay datos
    });
}

/**
 * Inserta la lista inicial de data.js en IndexedDB.
 * Nota: 'window.voluntariados' debe estar disponible (data.js cargado antes).
 * @returns {Promise<void>}
 */
function guardarVoluntariadosInicialesBD() {
    return new Promise((resolve, reject) => {
        // Aseguramos que window.voluntariados exista y db esté abierto
        if (!window.voluntariados || window.voluntariados.length === 0 || !db) {
            resolve(); 
            return;
        }

        const tx = db.transaction("voluntariados", "readwrite");
        const store = tx.objectStore("voluntariados");

        window.voluntariados.forEach(v => {
            // Nota: IndexedDB asignará el ID automáticamente (keyPath: "id", autoIncrement: true)
            // Por lo que podemos añadir el objeto directamente.
            store.add(v);
        });

        tx.oncomplete = () => resolve();
        tx.onerror = (e) => {
            // En caso de error (por ejemplo, si se intentan insertar datos duplicados 
            // aunque el store esté vacío), seguimos adelante.
            console.error("Error al insertar datos iniciales:", e);
            resolve();
        };
    });
}

/**
 * Ejecuta la lógica para inicializar la base de datos si está vacía.
 */
async function inicializarVoluntariadosSiVacioBD() {
    const existenDatos = await voluntariadosExistenBD();
    if (!existenDatos) {
        await guardarVoluntariadosInicialesBD();
    }
}

/**
 * Cuenta el número de 'oferta' y 'peticion' en la lista de voluntariados.
 * @param {Array<Object>} lista - Lista de voluntariados.
 * @returns {Object} Un objeto con los conteos: { Oferta: number, Peticion: number }.
 */
function contarTiposVoluntariado(lista) {
    const conteos = {
        Oferta: 0,
        Peticion: 0
    };

    lista.forEach(v => {
        const tipoNormalizado = v.tipo ? v.tipo.toLowerCase() : '';

        if (tipoNormalizado === 'oferta') {
            conteos.Oferta++;
        } else if (tipoNormalizado === 'peticion') {
            conteos.Peticion++;
        }
    });

    return conteos;
}

/**
 * Dibuja un gráfico de barras simple en el canvas para mostrar la distribución.
 * @param {Object} data - Objeto con los conteos de tipos.
 */
function dibujarGrafico(data) {
    const canvas = document.getElementById('voluntariadoChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 60;
    const barWidth = 60;
    const maxVal = Math.max(data.Oferta, data.Peticion, 1); // Asegura al menos 1 para evitar errores

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Dibujar ejes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // Dibujar etiquetas de ejes
    ctx.font = '12px Montserrat';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    
    // Etiquetas de categoría (Eje X)
    ctx.fillText('Oferta', padding + barWidth, height - padding / 2);
    ctx.fillText('Petición', padding + barWidth * 3, height - padding / 2);
    
    // Etiqueta Eje Y
    ctx.textAlign = 'right';
    ctx.fillText('Cantidad', padding - 5, padding - 10);
    
    // Dibujar las barras
    const valores = [data.Oferta, data.Peticion];
    const colores = ['#0E1353', '#330328']; // Azul para Oferta, Verde para Petición
    
    valores.forEach((valor, index) => {
        const barHeight = ((valor / maxVal) * (height - 2 * padding));
        const x = padding + barWidth * (1 + index * 2) - (barWidth / 2);
        const y = height - padding - barHeight;

        ctx.fillStyle = colores[index];
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Etiqueta de valor
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText(valor.toString(), x + barWidth / 2, y - 5);
    });
}

/**
 * Muestra los datos de los voluntariados en la tabla de Consulta y Borrado (voluntariados.html).
 */
async function mostrarDatosVoluntariados() {
  const cuerpo = document.querySelector('#consultaVoluntariados');
  cuerpo.innerHTML = "";

  const lista = await obtenerVoluntariadosBD();

  let delay = 0;

  lista.forEach(v => {
    const imagenDisplay = v.imagenFondo ? 
      `<img src="${v.imagenFondo}" alt="Imagen" style="width: 50px; height: 50px; object-fit: cover;">` :
      `<span>Sin Imagen</span>`;
    const fila = `
      <tr class="fade-in-right" style="--d:${delay}ms">
        <td>${v.titulo}</td>
        <td>${v.usuario}</td>
        <td>${v.fecha}</td>
        <td>${v.descripcion}</td>
        <td>${v.tipo}</td>
        <td>${imagenDisplay}</td>
        <td>
          <button class="btn btn-primary bg-custom-blue w-100"
                  onclick="eliminarVoluntariado(${v.id})">
            Borrar
          </button>
        </td>
      </tr>
    `;
    cuerpo.innerHTML += fila;
    delay += 100;
  });
}

/**
 * Añade un nuevo registro de voluntariado a IndexedDB, validando los campos y manejando la imagen Base64.
 * @returns {Promise<void>}
 */
async function addVoluntariado() {
  const titulo = document.getElementById('titulo').value.trim();
  const usuario = document.getElementById('usuario').value.trim();
  const fecha = document.getElementById('fecha').value;
  const descripcion = document.getElementById('descripcion').value.trim();
  const tipo = document.getElementById('tipo').value;

  // 💡 NUEVO: Obtener el archivo del input
  const imagenInput = document.getElementById('imagenFondo');
  const imagenFile = imagenInput.files[0];

  const alerta = document.getElementById('alertaErrores');
  alerta.classList.add('d-none');
  alerta.innerHTML = "";

  let errores = [];

  if (!titulo) errores.push("<li>El campo Título es obligatorio.</li>");
  if (!usuario) errores.push("<li>El campo Usuario es obligatorio.</li>");
  if (!fecha) errores.push("<li>El campo Fecha es obligatorio.</li>");
  if (!descripcion) errores.push("<li>El campo Descripción es obligatorio.</li>");
  if (!tipo) errores.push("<li>Debes seleccionar un Tipo de voluntariado.</li>");

  if (errores.length > 0) {
    alerta.innerHTML = "Errores:<ul>" + errores.join('') + "</ul>";
    alerta.classList.remove('d-none');
    alerta.classList.add('error-con-icono');
    return;
  }

  let imagenFondoBase64 = null;
    try {
        imagenFondoBase64 = await fileToBase64(imagenFile);
    } catch (e) {
        // Manejo de error si la lectura falla
        console.error("Error al convertir la imagen a Base64:", e);
        // Opcional: añadir un error al array 'errores' si la imagen es obligatoria.
    }

  const nuevoVoluntariado = {
    titulo,
    usuario,
    fecha,
    descripcion,
    tipo,
    imagenFondo: imagenFondoBase64
  };

  const tx = db.transaction("voluntariados", "readwrite");
  const store = tx.objectStore("voluntariados");

  store.add(nuevoVoluntariado);

  tx.oncomplete = () => {
    mostrarDatosVoluntariados();
    document.getElementById("alta").reset();
  };
}

/**
 * Elimina un registro de voluntariado de IndexedDB usando su ID.
 * @param {number} id - El ID del voluntariado a eliminar.
 */
function eliminarVoluntariado(id) {
  const tx = db.transaction("voluntariados", "readwrite");
  const store = tx.objectStore("voluntariados");

  store.delete(id);

  tx.oncomplete = () => {
    mostrarDatosVoluntariados();
  };
}

/**
 * Convierte un objeto File a una cadena Base64 (Data URL).
 * @param {File} file
 * @returns {Promise<string|null>} La cadena Base64 o null si no hay archivo.
 */
function fileToBase64(file) {
    if (!file) {
        return Promise.resolve(null);
    }
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

document.addEventListener("DOMContentLoaded", async function () {
  // Abrir la base de datos
  await abrirBDVoluntariados();
  // Inicializar los datos si no existen (usa los datos de data.js)
  await inicializarVoluntariadosSiVacioBD();
  // Leer los datos y dibujar/mostrar
  await mostrarDatosVoluntariados();

  // Cargar datos y dibujar gráfico
  const lista = await obtenerVoluntariadosBD();
  const conteos = contarTiposVoluntariado(lista);
  dibujarGrafico(conteos);
});

window.addVoluntariado = addVoluntariado;
window.mostrarDatosVoluntariados = mostrarDatosVoluntariados;
window.eliminarVoluntariado = eliminarVoluntariado;

