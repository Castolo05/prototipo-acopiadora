// js/js-secretaria/alta-cartoneros.js

// Validaciones
const validarDNI = (dni) => {
    return dni.length === 8 && /^\d+$/.test(dni);
};

const validarFormulario = (formData) => {
    const errores = [];
    
    if (!formData.nombre.trim()) errores.push('El nombre es obligatorio');
    if (!formData.apellido.trim()) errores.push('El apellido es obligatorio');
    if (!validarDNI(formData.dni)) errores.push('El DNI debe tener exactamente 8 dígitos');
    if (!formData.fechaNacimiento) errores.push('La fecha de nacimiento es obligatoria');
    if (!formData.direccion.trim()) errores.push('La dirección es obligatoria');
    if (!formData.tipoVehiculo) errores.push('Debe seleccionar un tipo de vehículo');
    
    return errores;
};

// Formatear DNI mientras se escribe
const formatearDNI = (input) => {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 8) {
        value = value.substring(0, 8);
    }
    input.value = value;
};

// Manejar envío del formulario
const manejarEnvioFormulario = (e) => {
    e.preventDefault();
    
    console.log('Formulario enviado'); // Debug
    
    const formData = new FormData(e.target);
    const cartonero = {
        nombre: formData.get('nombre'),
        apellido: formData.get('apellido'),
        dni: formData.get('dni'),
        fechaNacimiento: formData.get('fechaNacimiento'),
        direccion: formData.get('direccion'),
        telefono: formData.get('telefono') || '',
        tipoVehiculo: formData.get('tipoVehiculo')
    };
    
    console.log('Datos del cartonero:', cartonero); // Debug
    
    const errores = validarFormulario(cartonero);
    
    if (errores.length > 0) {
        alert('Errores encontrados:\n' + errores.join('\n'));
        return;
    }
    
    try {
        const nuevoCartonero = CartonerosDB.create(cartonero);
        console.log('Cartonero creado:', nuevoCartonero); // Debug
        alert('Cartonero registrado exitosamente');
        location.href = 'gestion-cartoneros.html';
    } catch (error) {
        console.error('Error al crear cartonero:', error); // Debug
        alert('Error al registrar el cartonero: ' + error.message);
    }
};

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando alta cartoneros'); // Debug
    console.log('CartonerosDB disponible:', typeof CartonerosDB !== 'undefined'); // Debug
    
    const form = document.getElementById('altaCartoneroForm');
    const dniInput = document.getElementById('dni');
    
    if (!form) {
        console.error('No se encontró el formulario');
        return;
    }
    
    form.addEventListener('submit', manejarEnvioFormulario);
    
    if (dniInput) {
        dniInput.addEventListener('input', (e) => formatearDNI(e.target));
    }
    
    console.log('Event listeners agregados correctamente'); // Debug
});