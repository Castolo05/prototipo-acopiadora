// Utilidades para localStorage
const CartonerosStorage = {
    getAll: () => {
        // Usar CartonerosDB que ya está disponible globalmente
        return window.CartonerosDB ? window.CartonerosDB.getAll() : [];
    },
    
    getActivos: () => {
        // Usar CartonerosDB que ya está disponible globalmente
        return window.CartonerosDB ? window.CartonerosDB.getActive() : [];
    }
};

const MaterialesStorage = {
    getAll: () => {
        const data = localStorage.getItem('materialesAceptados');
        return data ? JSON.parse(data) : [];
    },
    
    getActivos: () => {
        return MaterialesStorage.getAll().filter(m => m.activo !== false);
    },
    
    // Función para inicializar materiales de ejemplo
    initialize: () => {
        const materiales = MaterialesStorage.getAll();
        if (materiales.length === 0) {
            const materialesEjemplo = [
                { id: 1, nombre: 'Cartón', activo: true, precioKg: 50 },
                { id: 2, nombre: 'Papel Blanco', activo: true, precioKg: 80 },
                { id: 3, nombre: 'Papel Diario', activo: true, precioKg: 30 },
                { id: 4, nombre: 'Plástico PET', activo: true, precioKg: 120 },
                { id: 5, nombre: 'Aluminio', activo: true, precioKg: 250 },
                { id: 6, nombre: 'Vidrio', activo: true, precioKg: 40 },
                { id: 7, nombre: 'Cobre', activo: true, precioKg: 800 },
                { id: 8, nombre: 'Chatarra', activo: true, precioKg: 60 }
            ];
            localStorage.setItem('materialesAceptados', JSON.stringify(materialesEjemplo));
        }
    }
};
const RegistrosStorage = {
    getAll: () => {
        const data = localStorage.getItem('registrosMateriales');
        return data ? JSON.parse(data) : [];
    },
    
    save: (registros) => {
        localStorage.setItem('registrosMateriales', JSON.stringify(registros));
    },
    
    add: (registro) => {
        const registros = RegistrosStorage.getAll();
        registro.id = Date.now();
        registro.fechaRegistro = new Date().toISOString();
        registros.push(registro);
        RegistrosStorage.save(registros);
        return registro;
    }
};

const DomiciliosStorage = {
    getAll: () => {
        const data = localStorage.getItem('domicilios');
        return data ? JSON.parse(data) : [];
    },
    
    save: (domicilios) => {
        localStorage.setItem('domicilios', JSON.stringify(domicilios));
    }
};

// Estado de la balanza
let balanzaConectada = false;

// Inicializar datos de ejemplo
const initializeDomicilios = () => {
    const domicilios = DomiciliosStorage.getAll();
    if (domicilios.length === 0) {
        const ejemplos = [
            { id: 1, direccion: 'Av. Independencia 456', franja: '9-12hs' },
            { id: 2, direccion: 'Calle San Martín 789', franja: '13-17hs' },
            { id: 3, direccion: 'Calle Belgrano 321', franja: '9-12hs' },
            { id: 4, direccion: 'Av. Rivadavia 654', franja: '14-18hs' },
            { id: 5, direccion: 'Calle Mitre 987', franja: '8-11hs' }
        ];
        DomiciliosStorage.save(ejemplos);
    }
};

// Cargar cartoneros en el select
const cargarCartoneros = () => {
    const select = document.getElementById('cartonero-select');
    if (!select) return;
    
    const cartoneros = CartonerosStorage.getActivos();
    
    select.innerHTML = '<option value="">Seleccione un cartonero</option>';
    
    if (cartoneros.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No hay cartoneros registrados';
        option.disabled = true;
        select.appendChild(option);
        return;
    }
    
    cartoneros.forEach(cartonero => {
        const option = document.createElement('option');
        option.value = cartonero.id;
        option.textContent = `${cartonero.nombre} ${cartonero.apellido} - DNI: ${formatearDNI(cartonero.dni)}`;
        select.appendChild(option);
    });
};

// Cargar domicilios
const cargarDomicilios = () => {
    const container = document.getElementById('domicilios-visitados');
    const domicilios = DomiciliosStorage.getAll();
    
    container.innerHTML = '';
    
    domicilios.forEach(domicilio => {
        const div = document.createElement('div');
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <input type="checkbox" id="dom${domicilio.id}" value="${domicilio.id}" name="domicilios">
            <label for="dom${domicilio.id}" style="margin-left: 8px;">
                ${domicilio.direccion} - Franja: ${domicilio.franja}
            </label>
        `;
        container.appendChild(div);
    });
};

// Formatear DNI
const formatearDNI = (dni) => {
    return dni.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
};

// Crear un item de material
const crearMaterialItem = (container, esCartonero = true) => {
    const materialItem = document.createElement('div');
    materialItem.className = 'material-item';
    
    const materialesActivos = MaterialesStorage.getActivos();
    const optionsMateriales = materialesActivos.map(m => 
        `<option value="${m.id}">${m.nombre}</option>`
    ).join('');
    
    materialItem.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Tipo de Material *</label>
                <select name="tipoMaterial" required>
                    <option value="">Seleccione material</option>
                    ${optionsMateriales}
                </select>
            </div>
            <div class="form-group">
                <label>Peso (kg) *</label>
                <input type="number" name="peso" step="0.1" min="0.1" required>
                <button type="button" class="btn-secondary obtener-peso-btn">
                    Obtener de Balanza
                </button>
                <button type="button" class="btn-delete eliminar-material-btn">
                    Eliminar
                </button>
            </div>
        </div>
    `;
    
    // Event listeners para los botones
    const obtenerPesoBtn = materialItem.querySelector('.obtener-peso-btn');
    const eliminarBtn = materialItem.querySelector('.eliminar-material-btn');
    
    obtenerPesoBtn.addEventListener('click', () => obtenerPesoBalanza(materialItem));
    eliminarBtn.addEventListener('click', () => {
        if (container.children.length > 1) {
            materialItem.remove();
        } else {
            alert('Debe mantener al menos un material');
        }
    });
    
    container.appendChild(materialItem);
};

// Mostrar formulario
const mostrarFormulario = (tipo) => {
    ocultarFormularios();
    document.getElementById(`formulario-${tipo}`).style.display = 'block';
    
    // Limpiar y agregar el primer material
    const container = document.getElementById(`materiales-${tipo}`);
    container.innerHTML = '';
    crearMaterialItem(container, tipo === 'cartonero');
    
    // Recargar datos
    if (tipo === 'cartonero') {
        cargarCartoneros();
    }
    cargarDomicilios();
};


// Ocultar formularios
const ocultarFormularios = () => {
    document.getElementById('formulario-cartonero').style.display = 'none';
    document.getElementById('formulario-ciudadano').style.display = 'none';
};

// Conectar balanza (simulación)
const conectarBalanza = (statusElementId) => {
    const statusElement = document.getElementById(statusElementId);
    
    statusElement.textContent = 'Conectando...';
    statusElement.style.color = '#f59e0b';
    
    setTimeout(() => {
        balanzaConectada = true;
        statusElement.textContent = 'Conectado';
        statusElement.style.color = '#10b981';
    }, 2000);
};

// Obtener peso de la balanza
const obtenerPesoBalanza = (materialItem) => {
    if (!balanzaConectada) {
        alert('Debe conectar la balanza primero');
        return;
    }
    
    const input = materialItem.querySelector('input[name="peso"]');
    const pesoSimulado = (Math.random() * 10 + 0.1).toFixed(1);
    input.value = pesoSimulado;
    
    // Efecto visual
    input.style.backgroundColor = '#10b981';
    input.style.color = 'white';
    setTimeout(() => {
        input.style.backgroundColor = '';
        input.style.color = '';
    }, 1000);
};

// Validar formulario
const validarFormulario = (formData, esCartonero) => {
    const errores = [];
    
    if (esCartonero && !formData.get('cartoneroId')) {
        errores.push('Debe seleccionar un cartonero');
    }
    
    // Validar materiales
    const tiposMateriales = formData.getAll('tipoMaterial');
    const pesos = formData.getAll('peso');
    
    if (tiposMateriales.length === 0) {
        errores.push('Debe agregar al menos un material');
    }
    
    tiposMateriales.forEach((tipo, index) => {
        if (!tipo) {
            errores.push(`Material ${index + 1}: Debe seleccionar un tipo de material`);
        }
        if (!pesos[index] || parseFloat(pesos[index]) <= 0) {
            errores.push(`Material ${index + 1}: Debe ingresar un peso válido`);
        }
    });
    
    return errores;
};

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar datos
    MaterialesStorage.initialize();
    initializeDomicilios();
    
    // Esperar a que CartonerosDB esté disponible
    setTimeout(() => {
        cargarCartoneros();
        cargarDomicilios();
    }, 100);

    // Botones principales
    document.getElementById('registroCartoneroBtn').addEventListener('click', () => mostrarFormulario('cartonero'));
    document.getElementById('registroCiudadanoBtn').addEventListener('click', () => mostrarFormulario('ciudadano'));

    // Botones de agregar material
    document.getElementById('agregarMaterialCartonero').addEventListener('click', () => {
        const container = document.getElementById('materiales-cartonero');
        crearMaterialItem(container, true);
    });
    
    document.getElementById('agregarMaterialCiudadano').addEventListener('click', () => {
        const container = document.getElementById('materiales-ciudadano');
        crearMaterialItem(container, false);
    });

    // Botones de conectar balanza
    document.getElementById('conectarBalanzaCartonero').addEventListener('click', () => conectarBalanza('bluetooth-status'));
    document.getElementById('conectarBalanzaCiudadano').addEventListener('click', () => conectarBalanza('bluetooth-status-ciudadano'));

    // Botones de cancelar
    document.getElementById('cancelarCartonero').addEventListener('click', () => ocultarFormularios());
    document.getElementById('cancelarCiudadano').addEventListener('click', () => ocultarFormularios());

    // Formularios
    document.getElementById('formCartonero').addEventListener('submit', handleSubmitCartonero);
    document.getElementById('formCiudadano').addEventListener('submit', handleSubmitCiudadano);
});


function handleSubmitCartonero(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const errores = validarFormulario(formData, true);

    if (errores.length > 0) {
        alert("Errores:\n" + errores.join('\n'));
        return;
    }

    const cartoneroId = formData.get('cartoneroId');
    const registro = {
        tipo: 'cartonero',
        cartoneroId: cartoneroId,
        materiales: [],
        domiciliosVisitados: formData.getAll('domicilios')
    };

    const tipos = formData.getAll('tipoMaterial');
    const pesos = formData.getAll('peso');
    const materialesDisponibles = MaterialesStorage.getAll();

    for (let i = 0; i < tipos.length; i++) {
        const tipoMaterialId = tipos[i];
        const peso = parseFloat(pesos[i]);
        const materialInfo = materialesDisponibles.find(m => m.id == tipoMaterialId);
        
        const materialData = {
            tipoMaterialId: tipoMaterialId,
            tipo: materialInfo ? materialInfo.nombre : 'desconocido', // SIN toLowerCase()
            peso: peso,
            cantidad: peso,
            estado: 'acopiado',
            fechaIngreso: new Date().toISOString()
        };
        
        registro.materiales.push(materialData);

        // Guardar en CartonerosDB
        try {
            CartonerosDB.addAdditionalData(cartoneroId, 'materiales', materialData);
        } catch (error) {
            console.error('Error al guardar material en CartonerosDB:', error);
        }
    }


    // Guardar también en el registro general
    RegistrosStorage.add(registro);

    alert('Registro exitoso');
    form.reset();
    ocultarFormularios();
}
// Función para validar alta de cartonero
function validarFormularioAltaCartonero(data) {
    const errores = [];
    if (!data.nombre.trim()) errores.push('El nombre es obligatorio');
    if (!data.apellido.trim()) errores.push('El apellido es obligatorio');
    if (!/^\d{8}$/.test(data.dni)) errores.push('El DNI debe tener exactamente 8 dígitos');
    if (!data.fechaNacimiento) errores.push('La fecha de nacimiento es obligatoria');
    if (!data.direccion.trim()) errores.push('La dirección es obligatoria');
    if (!data.tipoVehiculo) errores.push('Debe seleccionar un tipo de vehículo');
    return errores;
}

// Inicialización del modal
document.getElementById('btnAbrirModalCartonero').addEventListener('click', () => {
    document.getElementById('modal-alta-cartonero').style.display = 'flex';
});

document.getElementById('cerrarModalCartonero').addEventListener('click', () => {
    document.getElementById('modal-alta-cartonero').style.display = 'none';
});

document.getElementById('altaCartoneroFormModal').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const nuevoCartonero = {
        nombre: formData.get('nombre'),
        apellido: formData.get('apellido'),
        dni: formData.get('dni'),
        fechaNacimiento: formData.get('fechaNacimiento'),
        direccion: formData.get('direccion'),
        telefono: formData.get('telefono') || '',
        tipoVehiculo: formData.get('tipoVehiculo')
    };

    const errores = validarFormularioAltaCartonero(nuevoCartonero);
    if (errores.length > 0) {
        alert('Errores:\n' + errores.join('\n'));
        return;
    }

    try {
        CartonerosDB.create(nuevoCartonero);
        alert('Cartonero registrado exitosamente');
        e.target.reset();
        document.getElementById('modal-alta-cartonero').style.display = 'none';
        cargarCartoneros(); // Recarga el select
    } catch (error) {
        alert('Error al registrar: ' + error.message);
    }
});
