async function manejarLogin() {
  const emailInput = document.getElementById("id");
  const passwordInput = document.getElementById("pass");
  const alerta = document.getElementById("alertaErrores");

  alerta.classList.add("d-none");
  alerta.innerHTML = "";

  const emailValue = emailInput.value.trim();
  const password = passwordInput.value;

  if (!emailValue || !password) {
    alerta.innerHTML = "Por favor, completa todos los campos.";
    alerta.classList.remove("d-none");
    return;
  }

  try {
    const query = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
          usuario {
            nombre
            role
            email
          }
        }
      }
    `;

    const response = await fetch(window.GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { email: emailValue, password: password },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    const { token, usuario } = result.data.login;

    // --- GUARDADO DE DATOS (Mantenemos los tuyos y aseguramos el email) ---
    localStorage.setItem("jwt", token);
    localStorage.setItem("usuarioActivo", usuario.nombre);
    localStorage.setItem("usuarioRol", usuario.role);
    localStorage.setItem("usuarioEmail", usuario.email || emailValue);

    // --- ACTUALIZACIÓN INMEDIATA DEL HEADER (Opcional pero recomendado) ---
    // Si el header ya existe en la página de login, se verá el nombre antes de redirigir
    const headerNombre = document.getElementById("usuario-logueado-span");
    if (headerNombre) headerNombre.textContent = usuario.nombre;

    alerta.classList.replace("alert-danger", "alert-success");
    alerta.innerHTML = `¡Bienvenido ${usuario.nombre}! Redirigiendo...`;
    alerta.classList.remove("d-none");

    // Mantenemos tu lógica de redirección por roles
    setTimeout(() => {
      if (usuario.role === "ADMIN") {
        window.location.href =
          window.location.origin + "/src/pages/usuarios.html";
      } else {
        window.location.href =
          window.location.origin + "/src/pages/dashboard.html";
      }
    }, 1000);
  } catch (error) {
    alerta.classList.add("alert-danger");
    alerta.classList.remove("alert-success");
    alerta.innerHTML = `Error: ${error.message}`;
    alerta.classList.remove("d-none");
  }
}

window.manejarLogin = manejarLogin;
