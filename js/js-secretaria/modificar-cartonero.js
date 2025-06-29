// js/js-secretaria/modificar-cartonero.js
let cartoneroActual = null;
let cartoneroId = null;

// Obtener ID de la URL
const obtenerIdDeURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
};

// Cargar datos del cartonero
const cargarDatosCartonero = (id) => {
    console.log('Cargando cartonero con ID:', id);
    
    const cartonero = CartonerosDB.getById(id);
    
    if (!cartonero) {
        alert('Cartonero no encontrado');
        location.href = 'gestion-cartoneros.html';
        return;
    }
    
    if (cartonero.estado === 'eliminado') {
        alert('Este cartonero ha sido eliminado');
        location.href = 'gestion-cartoneros.html';
        return;
    }
    
    cartoneroActual = cartonero;
    
    // Llenar el formulario
    document.getElementById('nombre').value = cartonero.nombre;
    document.getElementById('apellido').value = cartonero.apellido;
    document.getElementById('dni').value = cartonero.dni;
    document.getElementById('fechaNacimiento').value = cartonero.fechaNacimiento;
    document.getElementById('direccion').value = cartonero.direccion;
    document.getElementById('telefono').value = cartonero.telefono || '';
    document.getElementById('tipoVehiculo').value = cartonero.tipoVehiculo;
    document.getElementById('estado').value = cartonero.estado || 'activo';
    
    // Actualizar información del cartonero
    document.getElementById('cartoneroInfo').textContent = 
        `${cartonero.nombre} ${cartonero.apellido} (DNI: ${cartonero.dni})`;
    
    console.log('Cartonero cargado:', cartonero);
};

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
    if (!formData.estado) errores.push('Debe seleccionar un estado');
    
    // Verificar DNI duplicado (excluyendo el actual)
    if (CartonerosDB.existsDNI(formData.dni, cartoneroId)) {
        errores.push('Ya existe otro cartonero con este DNI');
    }
    
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

// Mostrar cambios realizados
const mostrarCambios = (datosAnteriores, datosNuevos) => {
    const cambios = [];
    
    Object.keys(datosNuevos).forEach(campo => {
        if (datosAnteriores[campo] !== datosNuevos[campo]) {
            cambios.push(`${campo}: "${datosAnteriores[campo]}" → "${datosNuevos[campo]}"`);
        }
    });
    
    if (cambios.length > 0) {
        const mensaje = 'Cambios realizados:\n' + cambios.join('\n');
        console.log(mensaje);
        return mensaje;
    }
    
    return null;
};

// Manejar envío del formulario
const manejarEnvioFormulario = (e) => {
    e.preventDefault();
    
    console.log('Enviando formulario de modificación');
    
    const formData = new FormData(e.target);
    const datosActualizados = {
        nombre: formData.get('nombre'),
        apellido: formData.get('apellido'),
        dni: formData.get('dni'),
        fechaNacimiento: formData.get('fechaNacimiento'),
        direccion: formData.get('direccion'),
        telefono: formData.get('telefono') || '',
        tipoVehiculo: formData.get('tipoVehiculo'),
        estado: formData.get('estado')
    };
    
    console.log('Datos a actualizar:', datosActualizados);
    
    const errores = validarFormulario(datosActualizados);
    
    if (errores.length > 0) {
        alert('Errores encontrados:\n' + errores.join('\n'));
        return;
    }
    
    // Verificar si hay cambios
    const cambiosMsg = mostrarCambios(cartoneroActual, datosActualizados);
    if (!cambiosMsg) {
        alert('No se han realizado cambios');
        return;
    }
    
    // Confirmar cambios
    if (!confirm('¿Está seguro de que desea guardar los cambios?\n\n' + cambiosMsg)) {
        return;
    }
    
    try {
        const cartoneroActualizado = CartonerosDB.update(cartoneroId, datosActualizados);
        console.log('Cartonero actualizado:', cartoneroActualizado);
        
        alert('Datos del cartonero actualizados exitosamente');
        location.href = 'gestion-cartoneros.html';
    } catch (error) {
        console.error('Error al actualizar:', error);
        alert('Error al actualizar los datos: ' + error.message);
    }
};

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando modificación de cartonero');
    console.log('CartonerosDB disponible:', typeof CartonerosDB !== 'undefined');
    
    cartoneroId = obtenerIdDeURL();
    
    if (!cartoneroId) {
        alert('ID de cartonero no especificado');
        location.href = 'gestion-cartoneros.html';
        return;
    }
    
    // Verificar que CartonerosDB esté disponible
    if (typeof CartonerosDB === 'undefined') {
        console.error('CartonerosDB no está disponible');
        alert('Error: Sistema de base de datos no disponible');
        return;
    }
    
    // Cargar datos del cartonero
    cargarDatosCartonero(cartoneroId);
    
    const form = document.getElementById('modificarCartoneroForm');
    const dniInput = document.getElementById('dni');
    
    if (!form) {
        console.error('Formulario no encontrado');
        return;
    }
    
    // Event listeners
    form.addEventListener('submit', manejarEnvioFormulario);
    
    if (dniInput) {
        dniInput.addEventListener('input', (e) => formatearDNI(e.target));
    }
    
    console.log('Event listeners agregados correctamente');
});