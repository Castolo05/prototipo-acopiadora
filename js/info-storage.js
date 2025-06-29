// /js/info-storage.js

const InfoStorage = {
    KEY: 'seccionInformativa',

    getDefault: () => ({
        titulo: 'COOPERATIVA ORGANIZADA DE SUSTENTABILIDAD',
        subtitulo: 'SECCIÓN INFORMATIVA',
        contenido: 'La cooperativa informa a la comunidad que en nuestro centro de acopio se reciben materiales reciclables clasificados en las siguientes categorías: plásticos (botellas, envases de productos de limpieza y tapitas), papel y cartón (limpios y secos), vidrio (botellas y frascos sin tapa), metales (latas de aluminio y hojalata), y envases tetrabrik. Para una correcta gestión, solicitamos que todos los materiales sean entregados limpios, secos y separados por tipo, sin restos de comida ni líquidos. Esta clasificación y preparación previa es fundamental para asegurar su reciclado eficiente y cuidar el trabajo de quienes integran la cadena de reciclaje.'
    }),

    getInfo: () => {
        const data = localStorage.getItem(InfoStorage.KEY);
        return data ? JSON.parse(data) : InfoStorage.getDefault();
    },

    save: (info) => {
        localStorage.setItem(InfoStorage.KEY, JSON.stringify(info));
    },

    restaurarDefault: () => {
        const defaultInfo = InfoStorage.getDefault();
        InfoStorage.save(defaultInfo);
        return defaultInfo;
    }
};

// Exponer al scope global
window.InfoStorage = InfoStorage;
