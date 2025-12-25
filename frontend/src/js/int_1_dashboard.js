if (!localStorage.getItem("jwt")) {
  window.location.href = window.location.origin + "/src/pages/login.html";
}

(() => {
  const GRAPHQL_ENDPOINT =
    window.GRAPHQL_ENDPOINT ||
    `https://${window.location.host.replace("-4000", "-5000")}/graphql`;
  const SOCKET_IO_ENDPOINT = GRAPHQL_ENDPOINT.replace("/graphql", "");

  let currentUser = null;
  let socket = null;
  let todosLosVoluntariados = [];

  const IMAGES = [
    "https://www.hillspet.com/content/dam/cp-sites-aem/hills/hills-pet/legacy-articles/inset/beagle-with-tongue-out.jpg",
    "https://image.petmd.com/files/inline-images/shiba-inu-black-and-tan-colors.jpg?VersionId=pLq84BEOjdMjXeDCUJJJLFPuIWYsVMUU",
    "https://www.minino.com/wp-content/uploads/2025/01/nota-de-blog-31-enero.png.webp",
    "https://15f8034cdff6595cbfa1-1dd67c28d3aade9d3442ee99310d18bd.ssl.cf3.rackcdn.com/uploaded_thumb_big/c1dc328c546f572dfe66453867eeffb8/cuidar_iguana_domestica_consejos_clinica_veterinaria_la_granja_aviles.png",
  ];

  function getImageForVolunteering(v) {
    let hash = 0;
    const str = v.id || v.titulo || "";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % IMAGES.length;
    return IMAGES[index];
  }

  async function graphqlRequest(query, variables = {}) {
    const token = localStorage.getItem("jwt");
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors.map((e) => e.message).join("\n"));
    }
    return result.data;
  }

  const GET_USER_BY_EMAIL = `
    query UsuarioPorEmail($email: String!) {
      usuarioPorEmail(email: $email) { id nombre email role }
    }
  `;

  const GET_VOLUNTEERINGS = `
    query Voluntariados {
      voluntariados { id titulo usuario fecha descripcion tipo imagen }
    }
  `;

  const CREATE_VOLUNTEERING = `
    mutation CrearVoluntariado($titulo: String!, $usuario: String!, $fecha: String!, $descripcion: String!, $tipo: TipoVoluntariado!, $imagen: String) {
      crearVoluntariado(titulo: $titulo, usuario: $usuario, fecha: $fecha, descripcion: $descripcion, tipo: $tipo, imagen: $imagen) {
        id titulo usuario fecha descripcion tipo
      }
    }
  `;

  document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("jwt");
    const email = localStorage.getItem("usuarioEmail");

    if (!token || !email) {
      window.location.href = window.location.origin + "/src/pages/login.html";
      return;
    }

    try {
      const userData = await graphqlRequest(GET_USER_BY_EMAIL, { email });
      currentUser = userData.usuarioPorEmail;

      // LLAMADA A UTILS PARA EL HEADER
      if (typeof inicializarInterfazUsuario === "function") {
        inicializarInterfazUsuario();
        setTimeout(inicializarInterfazUsuario, 500);
      }

      if (
        currentUser.role !== "ADMIN" &&
        window.location.pathname.includes("usuarios.html")
      ) {
        window.location.href =
          window.location.origin + "/src/pages/dashboard.html";
        return;
      }

      if (typeof addMenu === "function") addMenu();

      const userField = document.getElementById("usuario-logueado");
      if (userField) userField.textContent = currentUser.nombre;

      await loadVolunteerings();
      setupSocket();
      setupCreateForm();
      configurarFiltros();
    } catch (error) {
      console.error("Error initializing dashboard:", error);
      if (
        error.message.toLowerCase().includes("autenticado") ||
        error.message.includes("jwt")
      ) {
        localStorage.clear();
        window.location.href = window.location.origin + "/src/pages/login.html";
      }
    }
  });

  async function loadVolunteerings() {
    try {
      const data = await graphqlRequest(GET_VOLUNTEERINGS);
      todosLosVoluntariados = data.voluntariados || [];

      const uiList = todosLosVoluntariados.map((v) => ({
        ...v,
        imagenFondo: getImageForVolunteering(v),
        tipo: v.tipo.toLowerCase(),
      }));

      mostrarDashboard(uiList);
      setupDropZones();
      loadLayout();
    } catch (e) {
      console.error("Error al cargar:", e);
    }
  }

  function configurarFiltros() {
    const btnPropias = document.getElementById("btn-propias");
    const btnOtras = document.getElementById("btn-otras");
    const btnTodas = document.getElementById("btn-todas");
    const emailActivo = localStorage.getItem("usuarioEmail");

    const aplicarFiltro = (listaFiltrada) => {
      const uiList = listaFiltrada.map((v) => ({
        ...v,
        imagenFondo: getImageForVolunteering(v),
        tipo: v.tipo.toLowerCase(),
      }));
      mostrarDashboard(uiList);
    };

    btnPropias?.addEventListener("click", () => {
      aplicarFiltro(
        todosLosVoluntariados.filter((v) => v.usuario === emailActivo)
      );
    });

    btnOtras?.addEventListener("click", () => {
      aplicarFiltro(
        todosLosVoluntariados.filter((v) => v.usuario !== emailActivo)
      );
    });

    btnTodas?.addEventListener("click", () => {
      aplicarFiltro(todosLosVoluntariados);
    });
  }

  function setupSocket() {
    if (typeof io === "undefined") return;
    socket = io(SOCKET_IO_ENDPOINT, {
      auth: { token: localStorage.getItem("jwt") },
    });
    socket.on("voluntariado_creado", () => loadVolunteerings());
    socket.on("voluntariado_actualizado", () => loadVolunteerings());
    socket.on("voluntariado_eliminado", () => loadVolunteerings());
  }

  const leerComoBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  function setupCreateForm() {
    const form = document.getElementById("createForm");
    if (!form || form.dataset.bound === "true") return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btnSubmit = form.querySelector('[type="submit"]');
      if (btnSubmit) btnSubmit.disabled = true;

      const inputImagen = document.getElementById("imagenInput");
      let imagenBase64 = "";
      if (inputImagen?.files?.[0]) {
        imagenBase64 = await leerComoBase64(inputImagen.files[0]);
      }

      const variables = {
        titulo: document.getElementById("titulo").value,
        descripcion: document.getElementById("descripcion").value,
        fecha: document.getElementById("fecha").value,
        tipo: document.getElementById("tipo").value,
        usuario: currentUser.email,
        imagen: imagenBase64,
      };

      try {
        await graphqlRequest(CREATE_VOLUNTEERING, variables);
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("createModal")
        );
        if (modal) modal.hide();
        form.reset();
        await loadVolunteerings();
      } catch (error) {
        alert("Error: " + error.message);
      } finally {
        if (btnSubmit) btnSubmit.disabled = false;
      }
    });
    form.dataset.bound = "true";
  }

  function mostrarDashboard(voluntariadosList) {
    const data_ofertas = document.querySelector("#ofertas");
    if (!data_ofertas) return;
    data_ofertas.innerHTML = "";

    voluntariadosList.forEach((item) => {
      const typeClass =
        item.tipo === "peticion" ? "bg-dark-type text-white" : "bg-light-type";
      const imagenAUsar =
        item.imagen || item.imagenFondo || getImageForVolunteering(item);

      const fila = `
        <div class="flip-card" id="item-${item.id}" draggable="true" ondragstart="dragstartHandler(event)">
          <div class="flip-card-inner" data-id="${item.id}">
            <div class="card p-3 card-front ${typeClass}">
              <h5 class="card-title-lg text-white">${item.titulo}</h5>
              <p class="card-subtitle-sm mb-2 text-white">${item.fecha}</p>
              <p class="card-text-desc text-white">${item.descripcion}</p>
              <small class="card-subtitle mt-auto text-white">
                <strong>Publicado por:</strong><br> ${item.usuario}
              </small>
            </div>
            <div class="card p-3 card-back image-back-styled ${typeClass}">
              <div class="back-image-container">
                <img src="${imagenAUsar}" class="img-fluid back-image-centered" onerror="this.src='https://via.placeholder.com/150'">
              </div>
              <div class="back-info-text-group mt-auto text-white text-center">
                <h5>GRUPO REMM</h5>
                <p class="mb-0">Soluciones Web JavaScript</p>
              </div>
            </div>
          </div>
        </div>
      `;
      data_ofertas.innerHTML += fila;
    });
    if (typeof addFlipCardListener === "function") addFlipCardListener();
  }

  function setupDropZones() {
    document.querySelectorAll(".drop-zone").forEach((zone) => {
      zone.addEventListener("dragover", (e) => e.preventDefault());
      zone.addEventListener("drop", dropHandler);
    });
  }

  function dropHandler(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text/plain");
    const draggedElement = document.getElementById(data);
    const dropZone = ev.target.closest(".drop-zone");
    if (draggedElement && dropZone) {
      dropZone.appendChild(draggedElement);
      saveLayout();
    }
  }

  function saveLayout() {
    const layout = {};
    document.querySelectorAll(".drop-zone[id]").forEach((box) => {
      layout[box.id] = Array.from(box.querySelectorAll(".flip-card")).map(
        (el) => el.id
      );
    });
    localStorage.setItem("layout", JSON.stringify(layout));
  }

  function loadLayout() {
    const raw = localStorage.getItem("layout");
    if (!raw) return;
    const layout = JSON.parse(raw);
    Object.keys(layout).forEach((boxId) => {
      const box = document.getElementById(boxId);
      if (!box) return;
      layout[boxId].forEach((itemId) => {
        const item = document.getElementById(itemId);
        if (item) box.appendChild(item);
      });
    });
  }
})();
