document.addEventListener('DOMContentLoaded', function () {  
  const form_voluntariados = document.getElementById('alta');
  if (form_voluntariados) {
    form_voluntariados.addEventListener('submit', function (evento) {
      evento.preventDefault();
      addVoluntariado();
      form_voluntariados.reset();
    });
  }

  const form_login = document.getElementById('login');
  const loginButton = document.getElementById('loginButton');
  if (form_login) {
    form_login.addEventListener('submit', function (evento) {
      evento.preventDefault();
    });
  }
  if (loginButton) {
    // Escucha directa del evento CLICK en el botón
    loginButton.addEventListener('click', function (evento) {
        evento.preventDefault(); 
        manejarLogin(); 
    });
  }
});

function addFlipCardListener() {
  const tarjetas = document.querySelectorAll('.flip-card-inner');

  tarjetas.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('is-flipped');
    });
  });
}

window.addFlipCardListener = addFlipCardListener;