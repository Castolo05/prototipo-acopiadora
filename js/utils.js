// Funciones utilitarias compartidas
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR');
}

function showMessage(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `message ${type}`;
        element.style.display = 'block';
    }
}

function hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

// Función para validar formularios
function validateForm(formData, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
        if (!formData.get(field) || formData.get(field).trim() === '') {
            errors.push(`El campo ${field} es requerido`);
        }
    });
    
    return errors;
}

// Función para limpiar localStorage
function clearTempData() {
    const tempKeys = ['temp_postulacion', 'selected_volume', 'selected_oferta_id'];
    tempKeys.forEach(key => localStorage.removeItem(key));
}