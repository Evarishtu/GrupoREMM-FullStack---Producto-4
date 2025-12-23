const DB_NAME = "VoluntariadoDB";
const DB_VERSION = 2;
let db = null;

/**
 * Abre la conexión con la base de datos IndexedDB.
 * Realiza la lógica de 'onupgradeneeded' (crear store 'voluntariados' y su índice 'titulo').
 * @returns {Promise<IDBDatabase>} Una promesa que resuelve con el objeto de base de datos.
 */
function abrirBD() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function (event) {
      const database = event.target.result;

      if (database.objectStoreNames.contains("voluntariados")) {
        database.deleteObjectStore("voluntariados");
      }

      const store = database.createObjectStore("voluntariados", {
        keyPath: "id",
        autoIncrement: true
      });

      store.createIndex("titulo", "titulo", { unique: false });
    };

    request.onsuccess = function (event) {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = function (event) {
      console.error("Error al abrir IndexedDB:", event);
      reject(event);
    };
  });
}

/**
 * Comprueba si la tienda de 'voluntariados' tiene datos.
 * @returns {Promise<boolean>} True si hay datos, False si está vacía o hay un error.
 */
function voluntariadosExisten() {
  return new Promise((resolve) => {
    const tx = db.transaction("voluntariados", "readonly");
    const store = tx.objectStore("voluntariados");

    const countReq = store.count();

    countReq.onsuccess = () => resolve(countReq.result > 0);
    countReq.onerror = () => resolve(false);
  });
}

/**
 * Inserta los datos iniciales de 'window.voluntariados' en IndexedDB.
 * @returns {Promise<boolean>} Una promesa que resuelve a True al completarse la transacción.
 */
function guardarVoluntariadosIniciales() {
  return new Promise((resolve) => {
    const tx = db.transaction("voluntariados", "readwrite");
    const store = tx.objectStore("voluntariados");

    window.voluntariados.forEach(v => store.add(v));

    tx.oncomplete = () => resolve(true);
  });
}

/**
 * Obtiene todos los registros de voluntariados desde IndexedDB.
 * @returns {Promise<Array<Object>>} Una promesa que resuelve con la lista de voluntariados.
 */
function obtenerVoluntariados() {
  return new Promise((resolve) => {
    const tx = db.transaction("voluntariados", "readonly");
    const store = tx.objectStore("voluntariados");

    const req = store.getAll();

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve([]);
  });
}

/**
 * Muestra el nombre del usuario activo en el campo del dashboard (por ID).
 */
function mostrarUsuarioActivoDashboard() {
  const nombre = obtenerUsuarioActivo();
  const campo = document.getElementById("usuario-logueado");

  if (campo) {
    campo.textContent = nombre || "-no login-";
  }
}

/**
 * Renderiza la lista de tarjetas de voluntariado en el dashboard.
 * Llama a addFlipCardListener después de la renderización.
 * @param {Array<Object>} voluntariadosList - Lista de voluntariados a mostrar.
 */
function mostrarDashboard(voluntariadosList) {
  const data_ofertas = document.querySelector('#ofertas');
  data_ofertas.innerHTML = '';

  voluntariadosList.forEach((item) => {
    if (!item.id) return; // Ignora elementos sin ID válido
    const typeClass = item.tipo === 'peticion' ? 'bg-dark-type text-white' : 'bg-light-type';
    const textClass = 'text-white';

    const fila = `
      <div class="flip-card" id="item-${item.id}" draggable="true" ondragstart="dragstartHandler(event)">
        <div class="flip-card-inner" data-id="${item.id}">
          <div class="card p-3 card-front ${typeClass}">
            <h5 class="card-title-lg ${textClass}">${item.titulo}</h5>
            <p class="card-subtitle-sm mb-2 ${textClass}">${item.fecha}</p>
            <p class="card-text-desc ${textClass}">${item.descripcion}</p>
            <small class="card-subtitle mt-auto ${textClass}">
              <strong>Publicado por:</strong><br> ${item.usuario}
            </small>
          </div>

          <div class="card p-3 card-back image-back-styled ${typeClass}">
            <div class="back-image-container">
              <img src="${item.imagenFondo}" alt="${item.titulo}" class="img-fluid back-image-centered">
            </div>
            <div class="back-info-text-group mt-auto ${textClass}">
              <h5>GRUPO REMM</h5>
              <p class="mb-0">Des. full stack de sol. web JavaScript y serv. web</p>
            </div>
          </div>

        </div>
      </div>
    `;

    data_ofertas.innerHTML += fila;
  });

  addFlipCardListener();
}

/**
 * Inicializa el Dashboard: Muestra los voluntariados, configura las zonas de arrastre
 * y carga el layout guardado.
 * @param {Array<Object>} voluntariadosList - La lista de voluntariados recuperada.
 */
function initDashboard(voluntariadosList) {
  mostrarDashboard(voluntariadosList);
  setupDropZones();
  loadLayout();
}

/**
 * Configura los event listeners para las zonas de soltado (drop zones).
 */
function setupDropZones() {
  document.querySelectorAll('.drop-zone').forEach(zone => {
    zone.addEventListener('dragover', dragoverHandler);
    zone.addEventListener('drop', dropHandler);
  });
}

/**
 * Manejador del evento dragstart. Guarda el ID del elemento que se está arrastrando.
 * @param {DragEvent} ev - Objeto evento de arrastre.
 */
function dragstartHandler(ev) {
  ev.dataTransfer.setData("text/plain", ev.currentTarget.id);
}

/**
 * Manejador del evento dragover. Permite que el elemento sea soltado en la zona.
 * @param {DragEvent} ev - Objeto evento de arrastre.
 */
function dragoverHandler(ev) {
  ev.preventDefault();
}

/**
 * Manejador del evento drop. Mueve el elemento arrastrado a la nueva zona y guarda el layout.
 * @param {DragEvent} ev - Objeto evento de arrastre.
 */
function dropHandler(ev) {
  ev.preventDefault();
  const data = ev.dataTransfer.getData("text/plain");
  const draggedElement = document.getElementById(data);
  const dropZone = ev.target.closest('.drop-zone');

  if (draggedElement && dropZone) {
    dropZone.appendChild(draggedElement);
  }

  saveLayout();
}

/**
 * Guarda la disposición actual de las tarjetas en las zonas de soltado en localStorage.
 */
function saveLayout() {
  const boxes = document.querySelectorAll('.drop-zone[id]')
  const layout = {};

  boxes.forEach(box => {
    const boxId = box.id;
    const childrenIds = Array.from(box.querySelectorAll('.flip-card'))
      .map(el => el.id)
      .filter(id => id);
    layout[boxId] = childrenIds;
  });

  localStorage.setItem("layout", JSON.stringify(layout));
}

/**
 * Carga la disposición de las tarjetas desde localStorage y las reubica en el DOM.
 */
function loadLayout() {
    const raw = localStorage.getItem("layout");
    if (!raw) return;
    let layout;
    try {
        layout = JSON.parse(raw);
    } catch (e) {
        console.error("Could not parse saved layout:", e);
        return;
    }
    
    // Indicador para saber si el layout de localStorage contiene referencias obsoletas
    let layoutCambiado = false; 

    Object.keys(layout).forEach(boxId => {
        const box = document.getElementById(boxId);
        if (!box) return;

        // Filtrar solo los IDs que existen realmente en el DOM (renderizados desde la DB)
        const idsExistentes = layout[boxId].filter(itemId => {
            const item = document.getElementById(itemId);
            if (item) {
                box.appendChild(item);
                return true; // Conservar el ID
            }
            layoutCambiado = true; // El elemento no existe, el layout está obsoleto
            return false; // Descartar el ID
        });

        // Si se tuvo que filtrar algún ID, actualizamos el layout para el guardado.
        if (layoutCambiado) {
             layout[boxId] = idsExistentes;
        }
    });

    // Si se encontró algún elemento eliminado, guardamos el layout limpio.
    if (layoutCambiado) {
        // Guardamos solo si fue necesario limpiar referencias
        localStorage.setItem("layout", JSON.stringify(layout));
    }
}

document.addEventListener('DOMContentLoaded', async function () {

  mostrarUsuarioActivoDashboard();

  await abrirBD();

  const existen = await voluntariadosExisten();

  if (!existen) {
    await guardarVoluntariadosIniciales();
  }

  const lista = await obtenerVoluntariados();

  initDashboard(lista);
});