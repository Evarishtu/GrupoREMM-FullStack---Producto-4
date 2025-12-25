(() => {
  const GRAPHQL_ENDPOINT = "https://hrmfz4-5000.csb.app/graphql";

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

  const GET_VOLUNTARIADOS = `
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

  const CREATE_VOLUNTARIADO = `
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

  const DELETE_VOLUNTARIADO = `
  mutation EliminarVoluntariado($id: ID!) {
    eliminarVoluntariado(id: $id)
  }
`;

  /**
   * Cuenta el número de 'oferta' y 'peticion' en la lista de voluntariados.
   * @param {Array<Object>} lista - Lista de voluntariados.
   * @returns {Object} Un objeto con los conteos: { Oferta: number, Peticion: number }.
   */
  function contarTiposVoluntariado(lista) {
    const conteos = {
      Oferta: 0,
      Peticion: 0,
    };

    lista.forEach((v) => {
      const tipoNormalizado = v.tipo ? v.tipo.toLowerCase() : "";

      if (tipoNormalizado === "oferta") {
        conteos.Oferta++;
      } else if (tipoNormalizado === "peticion") {
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
    const canvas = document.getElementById("voluntariadoChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const padding = 60;
    const barWidth = 60;
    const maxVal = Math.max(data.Oferta, data.Peticion, 1);

    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.strokeStyle = "#000";
    ctx.stroke();

    ctx.font = "12px Montserrat";
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";

    ctx.fillText("Oferta", padding + barWidth, height - padding / 2);
    ctx.fillText("Petición", padding + barWidth * 3, height - padding / 2);

    ctx.textAlign = "right";
    ctx.fillText("Cantidad", padding - 5, padding - 10);

    const valores = [data.Oferta, data.Peticion];
    const colores = ["#0E1353", "#330328"];

    valores.forEach((valor, index) => {
      const barHeight = (valor / maxVal) * (height - 2 * padding);
      const x = padding + barWidth * (1 + index * 2) - barWidth / 2;
      const y = height - padding - barHeight;

      ctx.fillStyle = colores[index];
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.fillText(valor.toString(), x + barWidth / 2, y - 5);
    });
  }

  async function obtenerVoluntariados() {
    const data = await graphqlRequest(GET_VOLUNTARIADOS);
    return data.voluntariados || [];
  }

  function mostrarEstadoTabla(mensaje, clase = "text-muted") {
    const cuerpo = document.querySelector("#consultaVoluntariados");
    if (!cuerpo) return;
    cuerpo.innerHTML = `
    <tr>
      <td colspan="7" class="text-center ${clase}">${mensaje}</td>
    </tr>
  `;
  }

  /**
   * Muestra los datos de los voluntariados en la tabla de Consulta y Borrado (voluntariados.html).
   */
  async function mostrarDatosVoluntariados() {
    const alerta = document.getElementById("alertaErrores");
    alerta.classList.add("d-none");
    alerta.classList.remove("error-con-icono");
    alerta.innerHTML = "";

    mostrarEstadoTabla("Cargando voluntariados...");

    try {
      const lista = await obtenerVoluntariados();
      const cuerpo = document.querySelector("#consultaVoluntariados");
      cuerpo.innerHTML = "";

      let delay = 0;

      lista.forEach((v) => {
        const imagenDisplay = `<span class="text-muted">No disponible</span>`;
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
                    onclick="eliminarVoluntariado('${v.id}')">
              Borrar
            </button>
          </td>
        </tr>
      `;
        cuerpo.innerHTML += fila;
        delay += 100;
      });

      if (lista.length === 0) {
        mostrarEstadoTabla("No hay voluntariados disponibles.");
      }

      const conteos = contarTiposVoluntariado(lista);
      dibujarGrafico(conteos);
    } catch (error) {
      mostrarEstadoTabla("Error al cargar voluntariados.", "text-danger");
      alerta.innerHTML = `<ul><li>${error.message}</li></ul>`;
      alerta.classList.add("error-con-icono");
      alerta.classList.remove("d-none");
    }
  }

  /**
   * Añade un nuevo registro de voluntariado mediante GraphQL.
   * @returns {Promise<void>}
   */
  async function addVoluntariado() {
    const titulo = document.getElementById("titulo").value.trim();
    const usuario = document.getElementById("usuario").value.trim();
    const fecha = document.getElementById("fecha").value;
    const descripcion = document.getElementById("descripcion").value.trim();
    const tipoInput = document.getElementById("tipo").value;

    const alerta = document.getElementById("alertaErrores");
    alerta.classList.add("d-none");
    alerta.innerHTML = "";

    const errores = [];

    if (!titulo) errores.push("<li>El campo Título es obligatorio.</li>");
    if (!usuario) errores.push("<li>El campo Usuario es obligatorio.</li>");
    if (!fecha) errores.push("<li>El campo Fecha es obligatorio.</li>");
    if (!descripcion)
      errores.push("<li>El campo Descripción es obligatorio.</li>");
    if (!tipoInput)
      errores.push("<li>Debes seleccionar un Tipo de voluntariado.</li>");

    if (errores.length > 0) {
      alerta.innerHTML = "Errores:<ul>" + errores.join("") + "</ul>";
      alerta.classList.remove("d-none");
      alerta.classList.add("error-con-icono");
      return;
    }

    const tipo = tipoInput.toUpperCase();

    try {
      setVoluntariadosLoading(true);
      await graphqlRequest(CREATE_VOLUNTARIADO, {
        titulo,
        usuario,
        fecha,
        descripcion,
        tipo,
      });

      document.getElementById("alta").reset();
      await mostrarDatosVoluntariados();
    } catch (error) {
      alerta.innerHTML = `<ul><li>${error.message}</li></ul>`;
      alerta.classList.remove("d-none");
      alerta.classList.add("error-con-icono");
    } finally {
      setVoluntariadosLoading(false);
    }
  }

  /**
   * Elimina un registro de voluntariado usando su ID.
   * @param {string} id - El ID del voluntariado a eliminar.
   */
  async function eliminarVoluntariado(id) {
    const alerta = document.getElementById("alertaErrores");
    alerta.classList.add("d-none");
    alerta.classList.remove("error-con-icono");
    alerta.innerHTML = "";

    try {
      setVoluntariadosLoading(true);
      await graphqlRequest(DELETE_VOLUNTARIADO, { id });
      await mostrarDatosVoluntariados();
    } catch (error) {
      alerta.innerHTML = `<ul><li>${error.message}</li></ul>`;
      alerta.classList.remove("d-none");
      alerta.classList.add("error-con-icono");
    } finally {
      setVoluntariadosLoading(false);
    }
  }

  function setVoluntariadosLoading(isLoading) {
    const submitButton = document.querySelector('#alta input[type="submit"]');
    if (submitButton) {
      submitButton.disabled = isLoading;
    }
  }

  document.addEventListener("DOMContentLoaded", async function () {
    await mostrarDatosVoluntariados();
  });

  window.addVoluntariado = addVoluntariado;
  window.mostrarDatosVoluntariados = mostrarDatosVoluntariados;
  window.eliminarVoluntariado = eliminarVoluntariado;
})();
