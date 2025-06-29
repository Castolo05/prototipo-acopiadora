// /js/seccion-informativa.js

document.addEventListener('DOMContentLoaded', () => {
    const info = InfoStorage.getInfo();

    const tituloElement = document.querySelector('.header .title');
    if (tituloElement) {
        tituloElement.innerHTML = info.titulo.replace(/\n/g, '<br>');
    }

    const subtituloElement = document.querySelector('.header .subtitle');
    if (subtituloElement) {
        subtituloElement.textContent = info.subtitulo;
    }

    const contenidoElement = document.querySelector('.info-content p');
    if (contenidoElement) {
        contenidoElement.textContent = info.contenido;
    }
});
