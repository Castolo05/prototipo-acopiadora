// Módulo de reportes de residuos
const direccionReferencia = "Bariffi 798, Tandil, Buenos Aires";

document.addEventListener('DOMContentLoaded', function() {
    const reporteForm = document.getElementById('reporteForm');
    
    if (reporteForm) {
        reporteForm.addEventListener('submit', handleReporteSubmit);
    }
    
    // Configurar selección de horario y volumen
    setupTimeSelection();
    setupVolumeSelection();
    setupPhotoUpload();
});

async function geocodeNominatim(address) {
    let direccionCompleta = address;
    if (!address.toLowerCase().includes('tandil')) {
        direccionCompleta = `${address}, Tandil, Buenos Aires, Argentina`;
    }
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccionCompleta)}`;
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'cooperativa-verificador/1.0'
        }
    });

    const data = await response.json();
    if (data.length === 0) throw new Error("Dirección no encontrada");
    return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
    };
}

function calcularDistancia(coord1, coord2) {
    const toRad = x => x * Math.PI / 180;
    const R = 6371;

    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lon - coord1.lon);

    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
              Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function handleReporteSubmit(e) {
    e.preventDefault();
    const mensajeEl = document.getElementById("mensaje");
    mensajeEl.innerText = "";

    const direccionIngresada = document.getElementById("direccion").value;

    try {
        const coordUsuario = await geocodeNominatim(direccionIngresada);
        const coordReferencia = await geocodeNominatim(direccionReferencia);
        const distancia = calcularDistancia(coordUsuario, coordReferencia);

        if (distancia > 6) {
            mensajeEl.style.color = "red";
            mensajeEl.innerText = `La dirección está a ${distancia.toFixed(2)} km del centro de acopio. ¡Tendras que traer tus materiales tu mismo o mediante la cartelera!`;
        } else {
            mensajeEl.style.color = "green";
            mensajeEl.innerText = `Dirección aceptada (${distancia.toFixed(2)} km). Enviando...`;

            setTimeout(() => {
                window.location.href = "seleccion-horario.html";
            }, 1000);
        }
    } catch (error) {
        mensajeEl.style.color = "orange";
        mensajeEl.innerText = "Error al verificar dirección: " + error.message;
    }
}

function setupTimeSelection() {
    const timeOptions = document.querySelectorAll('.time-option');
    const continueBtn = document.getElementById('continueBtn');
    
    timeOptions.forEach(option => {
        option.addEventListener('click', function() {
            timeOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            if (continueBtn) {
                continueBtn.style.display = 'block';
            }
        });
    });
}

function setupVolumeSelection() {
    const volumeOptions = document.querySelectorAll('.volume-option');
    const continueBtn = document.getElementById('continueBtn');
    
    volumeOptions.forEach(option => {
        option.addEventListener('click', function() {
            volumeOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            if (continueBtn) {
                continueBtn.style.display = 'block';
            }
        });
    });
}

function setupPhotoUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        });
        
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                handleFileUpload(this.files[0]);
            }
        });
    }
}

function handleFileUpload(file) {
    if (file.type.startsWith('image/')) {
        const dropZone = document.getElementById('dropZone');
        dropZone.innerHTML = `<p>Imagen seleccionada: ${file.name}</p>`;
    } else {
        alert('Por favor seleccione un archivo de imagen válido.');
    }
}

