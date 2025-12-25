(() => {
  // Configuration
  const GRAPHQL_ENDPOINT = "https://hrmfz4-5000.csb.app/graphql";
  const SOCKET_IO_ENDPOINT = "https://hrmfz4-5000.csb.app";

  // State
  let currentUser = null;
  let socket = null;

  // Images pool (since backend doesn't store images)
  const IMAGES = [
    "https://www.hillspet.com/content/dam/cp-sites-aem/hills/hills-pet/legacy-articles/inset/beagle-with-tongue-out.jpg",
    "https://image.petmd.com/files/inline-images/shiba-inu-black-and-tan-colors.jpg?VersionId=pLq84BEOjdMjXeDCUJJJLFPuIWYsVMUU",
    "https://www.minino.com/wp-content/uploads/2025/01/nota-de-blog-31-enero.png.webp",
    "https://15f8034cdff6595cbfa1-1dd67c28d3aade9d3442ee99310d18bd.ssl.cf3.rackcdn.com/uploaded_thumb_big/c1dc328c546f572dfe66453867eeffb8/cuidar_iguana_domestica_consejos_clinica_veterinaria_la_granja_aviles.png",
  ];

  function getImageForVolunteering(v) {
    let hash = 0;
    const str = v.id || v.titulo;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % IMAGES.length;
    return IMAGES[index];
  }

  // GraphQL Helper
  async function graphqlRequest(query, variables = {}) {
    const token = localStorage.getItem("jwt");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors.map((e) => e.message).join("\n"));
    }
    return result.data;
  }

  // Queries & Mutations
  const GET_USER_BY_EMAIL = `
  query UsuarioPorEmail($email: String!) {
    usuarioPorEmail(email: $email) {
      id
      nombre
      email
      role
    }
  }
`;

  const GET_VOLUNTEERINGS = `
  query Voluntariados {
    voluntariados {
      id
      titulo
      usuario
      fecha
      descripcion
      tipo
    }
  }
`;

  const CREATE_VOLUNTEERING = `
  mutation CrearVoluntariado($titulo: String!, $usuario: String!, $fecha: String!, $descripcion: String!, $tipo: TipoVoluntariado!) {
    crearVoluntariado(titulo: $titulo, usuario: $usuario, fecha: $fecha, descripcion: $descripcion, tipo: $tipo) {
      id
      titulo
      usuario
      fecha
      descripcion
      tipo
    }
  }
`;

  // Main Initialization
  document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      window.location.href = "./src/pages/login.html";
      return;
    }

    try {
      // 1. Get User Info
      const email = localStorage.getItem("usuarioEmail");
      if (!email) {
        window.location.href = "./src/pages/login.html";
        return;
      }

      const userData = await graphqlRequest(GET_USER_BY_EMAIL, { email });
      currentUser = userData.usuarioPorEmail;

      // Update UI with user name
      const userField = document.getElementById("usuario-logueado");
      if (userField) userField.textContent = currentUser.nombre;

      // 2. Load Volunteerings
      await loadVolunteerings();

      // 3. Setup Socket.io
      setupSocket();

      // 4. Setup Create Form
      setupCreateForm();
    } catch (error) {
      console.error("Error initializing dashboard:", error);
      if (
        error.message.includes("jwt") ||
        error.message.includes("auth") ||
        error.message.includes("permisos")
      ) {
        alert(
          "Sesión expirada o inválida. Por favor inicie sesión nuevamente."
        );
        window.location.href = "./src/pages/login.html";
      } else {
        alert("Error loading dashboard: " + error.message);
      }
    }
  });

  async function loadVolunteerings() {
    try {
      const data = await graphqlRequest(GET_VOLUNTEERINGS);
      let list = data.voluntariados;

      // Filter based on role
      if (currentUser.role !== "ADMIN") {
        list = list.filter((v) => v.usuario === currentUser.email);
      }

      // Map to UI format (add images)
      const uiList = list.map((v) => ({
        ...v,
        imagenFondo: getImageForVolunteering(v),
        tipo: v.tipo.toLowerCase(), // Backend is UPPERCASE, UI expects lowercase for CSS classes
      }));

      mostrarDashboard(uiList);
      setupDropZones();
      loadLayout();
    } catch (e) {
      console.error(e);
      alert("Error loading volunteerings");
    }
  }

  function setupSocket() {
    if (typeof io === "undefined") {
      console.error("Socket.io library not loaded");
      return;
    }

    const token = localStorage.getItem("jwt");
    socket = io(SOCKET_IO_ENDPOINT, {
      auth: {
        token,
      },
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.io");
    });

    socket.on("voluntariado_creado", () => loadVolunteerings());
    socket.on("voluntariado_actualizado", () => loadVolunteerings());
    socket.on("voluntariado_eliminado", () => loadVolunteerings());
    socket.on("voluntariado_seleccionado", () => loadVolunteerings());
  }

  function setupCreateForm() {
    const form = document.getElementById("createForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const titulo = document.getElementById("titulo").value;
      const descripcion = document.getElementById("descripcion").value;
      const fecha = document.getElementById("fecha").value;
      const tipo = document.getElementById("tipo").value; // OFERTA or PETICION

      try {
        await graphqlRequest(CREATE_VOLUNTEERING, {
          titulo,
          usuario: currentUser.email,
          fecha,
          descripcion,
          tipo,
        });

        // Close modal
        const modalEl = document.getElementById("createModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        // Reset form
        form.reset();

        // Refresh list (Socket.io will also trigger this, but good to be sure)
        await loadVolunteerings();
      } catch (error) {
        alert("Error creating volunteering: " + error.message);
      }
    });
  }

  // ==========================================
  // UI Logic (Adapted from original)
  // ==========================================

  function mostrarDashboard(voluntariadosList) {
    const data_ofertas = document.querySelector("#ofertas");
    data_ofertas.innerHTML = "";

    voluntariadosList.forEach((item) => {
      if (!item.id) return;
      const typeClass =
        item.tipo === "peticion" ? "bg-dark-type text-white" : "bg-light-type";
      const textClass = "text-white";

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

    // Note: addFlipCardListener was called in original but not defined in the file I read.
    // It might be in listener.js or utils.js. I should check if I need to call it.
    // The original file called it.
    if (typeof addFlipCardListener === "function") {
      addFlipCardListener();
    }
  }

  function setupDropZones() {
    document.querySelectorAll(".drop-zone").forEach((zone) => {
      zone.addEventListener("dragover", dragoverHandler);
      zone.addEventListener("drop", dropHandler);
    });
  }

  function dragstartHandler(ev) {
    ev.dataTransfer.setData("text/plain", ev.currentTarget.id);
  }

  function dragoverHandler(ev) {
    ev.preventDefault();
  }

  function dropHandler(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text/plain");
    const draggedElement = document.getElementById(data);
    const dropZone = ev.target.closest(".drop-zone");

    if (draggedElement && dropZone) {
      dropZone.appendChild(draggedElement);
    }

    saveLayout();
  }

  function saveLayout() {
    const boxes = document.querySelectorAll(".drop-zone[id]");
    const layout = {};

    boxes.forEach((box) => {
      const boxId = box.id;
      const childrenIds = Array.from(box.querySelectorAll(".flip-card"))
        .map((el) => el.id)
        .filter((id) => id);
      layout[boxId] = childrenIds;
    });

    localStorage.setItem("layout", JSON.stringify(layout));
  }

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

    let layoutCambiado = false;

    Object.keys(layout).forEach((boxId) => {
      const box = document.getElementById(boxId);
      if (!box) return;

      const idsExistentes = layout[boxId].filter((itemId) => {
        const item = document.getElementById(itemId);
        if (item) {
          box.appendChild(item);
          return true;
        }
        layoutCambiado = true;
        return false;
      });

      if (layoutCambiado) {
        layout[boxId] = idsExistentes;
      }
    });

    if (layoutCambiado) {
      localStorage.setItem("layout", JSON.stringify(layout));
    }
  }
})();
