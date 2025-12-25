/**
 * voluntariados.js
 * Maneja la lógica de consulta, creación y borrado de voluntariados.
 */

// Protección de ruta: si no hay token, al login.
if (!localStorage.getItem("jwt")) {
  window.location.href = "login.html";
}

(() => {
  // Usar el endpoint dinámico definido en almacenaje.js
  const GRAPHQL_ENDPOINT =
    window.GRAPHQL_ENDPOINT ||
    `https://${window.location.host.replace("-4000", "-5000")}/graphql`;

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

  // Queries y Mutations
  const GET_VOLUNTARIADOS = `
    query Voluntariados {
      voluntariados {
        id
        titulo
        usuario
        fecha
        descripcion
        tipo
        imagen
      }
    }
  `;

  const CREATE_VOLUNTARIADO = `
    mutation CrearVoluntariado($titulo: String!, $usuario: String!, $fecha: String!, $descripcion: String!, $tipo: TipoVoluntariado!, $imagen: String) {
      crearVoluntariado(titulo: $titulo, usuario: $usuario, fecha: $fecha, descripcion: $descripcion, tipo: $tipo, imagen: $imagen) {
        id
        titulo
      }
    }
  `;

  const DELETE_VOLUNTARIADO = `
    mutation EliminarVoluntariado($id: ID!) {
      eliminarVoluntariado(id: $id)
    }
  `;

  // Lógica de Interfaz

  async function obtenerVoluntariados() {
    const data = await graphqlRequest(GET_VOLUNTARIADOS);
    return data.voluntariados || [];
  }

  async function mostrarDatosVoluntariados() {
    const cuerpo = document.querySelector("#consultaVoluntariados");
    if (!cuerpo) return;

    cuerpo.innerHTML =
      '<tr><td colspan="7" class="text-center">Cargando...</td></tr>';

    try {
      const lista = await obtenerVoluntariados();
      cuerpo.innerHTML = "";

      lista.forEach((v) => {
        const imagenHtml = v.imagen
          ? `<img src="${v.imagen}" alt="foto" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">`
          : '<span class="text-muted">N/D</span>';

        const fila = `
          <tr>
            <td>${v.titulo}</td>
            <td>${v.usuario}</td>
            <td>${v.fecha}</td>
            <td>${v.descripcion}</td>
            <td>${v.tipo}</td>
            <td>${imagenHtml}</td>
            <td>
              <button class="btn btn-danger btn-sm" onclick="eliminarVoluntariado('${v.id}')">
                Borrar
              </button>
            </td>
          </tr>
        `;
        cuerpo.innerHTML += fila;
      });

      if (lista.length === 0) {
        cuerpo.innerHTML =
          '<tr><td colspan="7" class="text-center">No hay datos.</td></tr>';
      }

      const conteos = contarTiposVoluntariado(lista);
      dibujarGrafico(conteos);
    } catch (error) {
      console.error("Error cargando tabla:", error);
      cuerpo.innerHTML =
        '<tr><td colspan="7" class="text-center text-danger">Error de conexión con el servidor.</td></tr>';
    }
  }

  function leerArchivo(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  async function addVoluntariado(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const titulo = document.getElementById("titulo").value;
    const usuario = document.getElementById("usuario").value;
    const fecha = document.getElementById("fecha").value;
    const descripcion = document.getElementById("descripcion").value;
    const tipo = document.getElementById("tipo").value.toUpperCase();

    const inputImagen = document.getElementById("imagen");
    let imagenData = "";

    if (inputImagen && inputImagen.files && inputImagen.files[0]) {
      try {
        imagenData = await leerArchivo(inputImagen.files[0]);
      } catch (e) {
        console.error("Error leyendo imagen", e);
      }
    }

    try {
      await graphqlRequest(CREATE_VOLUNTARIADO, {
        titulo,
        usuario,
        fecha,
        descripcion,
        tipo,
        imagen: imagenData,
      });
      document.getElementById("alta").reset();
      await mostrarDatosVoluntariados();
    } catch (error) {
      alert("Error al crear: " + error.message);
    }
  }

  async function eliminarVoluntariado(id) {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await graphqlRequest(DELETE_VOLUNTARIADO, { id });
      await mostrarDatosVoluntariados();
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  }

  function contarTiposVoluntariado(lista) {
    const conteos = { Oferta: 0, Peticion: 0 };
    lista.forEach((v) => {
      if (v.tipo?.toLowerCase() === "oferta") conteos.Oferta++;
      else if (v.tipo?.toLowerCase() === "peticion") conteos.Peticion++;
    });
    return conteos;
  }

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

    const valores = [data.Oferta, data.Peticion];
    const colores = ["#0E1353", "#330328"];

    valores.forEach((valor, index) => {
      const barHeight = (valor / maxVal) * (height - 2 * padding);
      const x = padding + barWidth * (1 + index * 2) - barWidth / 2;
      const y = height - padding - barHeight;

      ctx.fillStyle = colores[index];
      ctx.fillRect(x, y, barWidth, barHeight);
      ctx.fillStyle = "#000";
      ctx.fillText(valor.toString(), x + barWidth / 2, y - 5);
    });
  }

  // Carga inicial
  document.addEventListener("DOMContentLoaded", () => {
    // Llamada a Utils para el Header
    if (typeof inicializarInterfazUsuario === "function") {
      inicializarInterfazUsuario();
      setTimeout(inicializarInterfazUsuario, 500);
    }
    mostrarDatosVoluntariados();
  });

  window.addVoluntariado = addVoluntariado;
  window.eliminarVoluntariado = eliminarVoluntariado;
  window.mostrarDatosVoluntariados = mostrarDatosVoluntariados;
})();
