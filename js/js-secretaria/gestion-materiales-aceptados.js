// /js-secretaria/gestion-seccion-informativa.js

document.addEventListener('DOMContentLoaded', () => {
    cargarInformacionFormulario();

    document.getElementById('guardarInfoBtn').addEventListener('click', guardarInformacion);
    document.getElementById('restaurarInfoBtn').addEventListener('click', restaurarInformacion);
});

const cargarInformacionFormulario = () => {
    const info = InfoStorage.getInfo();

    document.getElementById('tituloInformativo').value = info.titulo;
    document.getElementById('subtituloInformativo').value = info.subtitulo;
    document.getElementById('contenidoInformativo').value = info.contenido;
};

const guardarInformacion = () => {
    const titulo = document.getElementById('tituloInformativo').value.trim();
    const subtitulo = document.getElementById('subtituloInformativo').value.trim();
    const contenido = document.getElementById('contenidoInformativo').value.trim();

    if (!titulo || !subtitulo || !contenido) {
        alert('Todos los campos son obligatorios');
        return;
    }

    const info = {
        titulo,
        subtitulo,
        contenido,
        fechaModificacion: new Date().toISOString()
    };

    try {
        InfoStorage.save(info);
        alert('Información guardada exitosamente');
    } catch (error) {
        alert('Error al guardar la información: ' + error.message);
    }
};

const restaurarInformacion = () => {
    if (confirm('¿Está seguro de que desea restaurar la información por defecto? Se perderán los cambios actuales.')) {
        try {
            InfoStorage.restaurarDefault();
            cargarInformacionFormulario();
            alert('Información restaurada a valores por defecto');
        } catch (error) {
            alert('Error al restaurar la información: ' + error.message);
        }
    }
};
