// Módulo de postulaciones
document.addEventListener('DOMContentLoaded', function() {
    const postulacionForm = document.getElementById('postulacionForm');
    if (postulacionForm) {
        postulacionForm.addEventListener('submit', handlePostulacionSubmit);
        loadOfertaInfo();
    }
    
    setupVolumeSelectionForPostulacion();
});

function handlePostulacionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const postulacion = {
        nombre: formData.get('nombre'),
        telefono: formData.get('telefono'),
        direccion: formData.get('direccion'),
        ofertaId: localStorage.getItem('selected_oferta_id')
    };
    
    localStorage.setItem('temp_postulacion', JSON.stringify(postulacion));
    window.location.href = 'postulacion-volumen.html';
}

function loadOfertaInfo() {
    const ofertaId = localStorage.getItem('selected_oferta_id');
    if (ofertaId) {
        const ofertas = JSON.parse(localStorage.getItem('ofertas_transporte') || '[]');
        const oferta = ofertas.find(o => o.id == ofertaId);
        
        if (oferta) {
            const ofertaInfo = document.getElementById('ofertaInfo');
            if (ofertaInfo) {
                ofertaInfo.innerHTML = `
                    <div class="selected-oferta">
                        <h3>Oferta seleccionada:</h3>
                        <p><strong>Espacio:</strong> ${oferta.espacio}</p>
                        <p><strong>Zona:</strong> ${oferta.zona}</p>
                    </div>
                `;
            }
        }
    }
}

function setupVolumeSelectionForPostulacion() {
    const volumeOptions = document.querySelectorAll('.volume-option');
    const finalizarBtn = document.getElementById('finalizarBtn');
    
    volumeOptions.forEach(option => {
        option.addEventListener('click', function() {
            volumeOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            if (finalizarBtn) {
                finalizarBtn.style.display = 'block';
            }
            
            const volumen = this.getAttribute('data-volume');
            localStorage.setItem('selected_volume', volumen);
        });
    });
}

function finalizarPostulacion() {
    const postulacion = JSON.parse(localStorage.getItem('temp_postulacion'));
    const volumen = localStorage.getItem('selected_volume');
    const ofertaId = localStorage.getItem('selected_oferta_id');
    
    if (postulacion && volumen && ofertaId) {
        const postulacionCompleta = {
            ...postulacion,
            volumen: volumen,
            fecha: new Date().toISOString(),
            id: Date.now()
        };
        
        const postulaciones = getPostulaciones();
        postulaciones.push(postulacionCompleta);
        savePostulaciones(postulaciones);
        
        // Limpiar datos temporales
        localStorage.removeItem('temp_postulacion');
        localStorage.removeItem('selected_volume');
        localStorage.removeItem('selected_oferta_id');
        
        window.location.href = 'confirmacion-postulacion.html';
    }
}

function getPostulaciones() {
    const postulaciones = localStorage.getItem('postulaciones');
    return postulaciones ? JSON.parse(postulaciones) : [];
}

function savePostulaciones(postulaciones) {
    localStorage.setItem('postulaciones', JSON.stringify(postulaciones));
}