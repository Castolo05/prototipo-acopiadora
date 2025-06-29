// offers.js corregido y funcional

// Configuración EmailJS
const EMAILJS_SERVICE_ID = 'service_1fvh4yb';
const EMAILJS_TEMPLATE_ID = 'template_hycp953';
const EMAILJS_PUBLIC_KEY = 'r7Z6auOWmPCoTtese';

let emailJSReady = false;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await emailjs.init(EMAILJS_PUBLIC_KEY);
        emailJSReady = true;
        console.log('EmailJS inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar EmailJS:', error);
    }

    initializeExampleOffers();

    const ofertaForm = document.getElementById('ofertaForm');
    if (ofertaForm) {
        ofertaForm.addEventListener('submit', handleOfertaSubmit);
    }

    const postulacionForm = document.getElementById('postulacionForm');
    if (postulacionForm) {
        postulacionForm.addEventListener('submit', handlePostulacionSubmit);
        loadOfertaInfo();
    }

    if (document.getElementById('ofertasList')) {
        loadOfertas();
    }

    setupVolumeSelectionForPostulacion();
});

function initializeExampleOffers() {
    const ofertas = getOfertas();
    if (ofertas.length === 0) {
        const ejemploOfertas = [
            {
                id: 1,
                nombre: "María González",
                telefono: "2249-123456",
                email: "maria@email.com",
                direccion: "San Martín 456",
                espacio: "Baúl de auto",
                descripcion: "Disponible fines de semana",
                zona: "El Calvario",
                fecha: new Date().toISOString()
            }
        ];
        saveOfertas(ejemploOfertas);
    }
}

function getOfertas() {
    const ofertas = localStorage.getItem('ofertas_transporte');
    return ofertas ? JSON.parse(ofertas) : [];
}

function saveOfertas(ofertas) {
    localStorage.setItem('ofertas_transporte', JSON.stringify(ofertas));
}

function handleOfertaSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const nombre = formData.get('nombre');
    const telefono = formData.get('telefono');
    const email = formData.get('email');
    const direccion = formData.get('direccion');
    const espacio = formData.get('espacio');

    if (!nombre || !telefono || !email || !direccion || !espacio) {
        alert('Completa todos los campos requeridos');
        return;
    }

    const oferta = {
        id: Date.now(),
        nombre,
        telefono,
        email,
        direccion,
        espacio,
        descripcion: formData.get('descripcion') || 'Sin descripción',
        zona: extractZone(direccion),
        fecha: new Date().toISOString()
    };

    const ofertas = getOfertas();
    ofertas.push(oferta);
    saveOfertas(ofertas);
    window.location.href = 'confirmacion-oferta.html';
}

function extractZone(direccion) {
    const zonas = ['El Calvario', 'Movediza', 'Tunitas'];
    return zonas[Math.floor(Math.random() * zonas.length)];
}

function loadOfertas() {
    const ofertas = getOfertas();
    const ofertasList = document.getElementById('ofertasList');
    if (!ofertasList) return;

    ofertasList.innerHTML = ofertas.map(oferta => `
        <div class="oferta-card">
            <div class="oferta-header">
                <h3>${oferta.nombre}</h3>
                <span class="oferta-fecha">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="oferta-content">
                <p class="oferta-field"><strong>Zona:</strong> ${oferta.zona}</p>
                <p class="oferta-field"><strong>Espacio:</strong> ${oferta.espacio}</p>
                <p class="oferta-field"><strong>Texto Libre:</strong> ${oferta.descripcion}</p>
            </div>
            <button class="btn-postularse" onclick="postularse(${oferta.id})">Postularme</button>
        </div>
    `).join('');
}

function postularse(ofertaId) {
    localStorage.setItem('selected_oferta_id', ofertaId);
    window.location.href = 'postulacion.html';
}

function handlePostulacionSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const postulacion = {
        nombre: formData.get('nombre'),
        telefono: formData.get('telefono'),
        email: formData.get('email'),
        direccion: formData.get('direccion'),
        ofertaId: localStorage.getItem('selected_oferta_id')
    };

    if (!postulacion.nombre || !postulacion.telefono || !postulacion.direccion || !postulacion.email) {
        alert('Completa todos los campos requeridos');
        return;
    }

    localStorage.setItem('temp_postulacion', JSON.stringify(postulacion));
    window.location.href = 'postulacion-volumen.html';
}

function loadOfertaInfo() {
    const ofertaId = localStorage.getItem('selected_oferta_id');
    const ofertas = getOfertas();
    const oferta = ofertas.find(o => o.id == ofertaId);

    const ofertaInfo = document.getElementById('ofertaInfo');
    if (oferta && ofertaInfo) {
        ofertaInfo.innerHTML = `
            <div class="selected-oferta">
                <h3>Oferta seleccionada</h3>
                <p class="oferta-field"><strong>Nombre:</strong> ${oferta.nombre}</p>
                <p class="oferta-field"><strong>Zona:</strong> ${oferta.zona}</p>
                <p class="oferta-field"><strong>Espacio:</strong> ${oferta.espacio}</p>
                <p class="oferta-field"><strong>Texto Libre:</strong> ${oferta.descripcion}</p>
            </div>
        `;
    }
}


function setupVolumeSelectionForPostulacion() {
    const options = document.querySelectorAll('.volume-option');
    const finalizarBtn = document.getElementById('finalizarBtn');

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            localStorage.setItem('selected_volume', opt.dataset.volume);
            if (finalizarBtn) finalizarBtn.style.display = 'block';
        });
    });
}

async function finalizarPostulacion() {
    const postulacion = JSON.parse(localStorage.getItem('temp_postulacion'));
    const volumen = localStorage.getItem('selected_volume');
    const ofertaId = localStorage.getItem('selected_oferta_id');

    if (!postulacion || !volumen || !ofertaId) {
        alert('Datos incompletos para finalizar la postulación');
        return;
    }

    const postulacionCompleta = {
        ...postulacion,
        volumen,
        fecha: new Date().toISOString(),
        id: Date.now()
    };

    const postulaciones = getPostulaciones();
    postulaciones.push(postulacionCompleta);
    savePostulaciones(postulaciones);

    if (emailJSReady) {
        await enviarEmailPostulacion(postulacionCompleta, ofertaId);
    }

    window.location.href = 'confirmacion-postulacion.html';
}

function getPostulaciones() {
    const p = localStorage.getItem('postulaciones');
    return p ? JSON.parse(p) : [];
}

function savePostulaciones(p) {
    localStorage.setItem('postulaciones', JSON.stringify(p));
}

function getVolumeText(volume) {
    const map = {
        caja: 'Entran en una caja',
        baul: 'Entran en el baúl de un auto',
        camioneta: 'Entran en la caja de una camioneta',
        camion: 'Necesito un camión'
    };
    return map[volume] || volume;
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('es-AR');
}

function generateToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getTokens() {
    const tokens = localStorage.getItem('email_tokens');
    return tokens ? JSON.parse(tokens) : {};
}

function saveTokens(tokens) {
    localStorage.setItem('email_tokens', JSON.stringify(tokens));
}

async function enviarEmailPostulacion(postulacion, ofertaId) {
    const ofertas = getOfertas();
    const oferta = ofertas.find(o => o.id == ofertaId);
    if (!oferta) return;

    // ✅ Habilitamos links de aceptación/rechazo
    const tokenAceptar = generateToken();
    const tokenRechazar = generateToken();
    const tokens = getTokens();
    tokens[tokenAceptar] = { action: 'aceptar', postulacionId: postulacion.id, ofertaId: ofertaId };
    tokens[tokenRechazar] = { action: 'rechazar', postulacionId: postulacion.id, ofertaId: ofertaId };
    saveTokens(tokens);

    const urlAceptar = `http://127.0.0.1:5501/pages/mails/confirmacion-aceptacion.html?token=${tokenAceptar}`;
    const urlRechazar = `http://127.0.0.1:5501/pages/mails/confirmacion-rechazo.html?token=${tokenRechazar}`;

    const templateParams = {
        to_email: oferta.email,
        to_name: oferta.nombre,
        postulante_nombre: postulacion.nombre,
        postulante_telefono: postulacion.telefono,
        postulante_direccion: postulacion.direccion,
        volumen: getVolumeText(postulacion.volumen),
        oferta_espacio: oferta.espacio,
        oferta_zona: oferta.zona,
        url_aceptar: urlAceptar,
        url_rechazar: urlRechazar,
        fecha: formatDate(postulacion.fecha)
    };

    try {
        const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        console.log('Correo enviado:', response);
    } catch (error) {
        console.error('Error al enviar correo:', error);
    }
}
