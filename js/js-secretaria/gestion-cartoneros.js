// js/gestion-cartoneros.js

// Mapear tipos de vehículo para mostrar
const tiposVehiculo = {
    'carrito': 'Carrito Manual',
    'bicicleta': 'Bicicleta con carro',
    'moto': 'Motocicleta con carro',
    'auto': 'Automóvil',
    'camioneta': 'Camioneta',
    'camion': 'Camión'
};

// Formatear DNI para mostrar
const formatearDNIDisplay = (dni) => {
    return dni.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
};

// Cargar y mostrar cartoneros
const cargarCartoneros = (cartoneros = null) => {
    const tbody = document.getElementById('cartoneros-tbody');
    const datos = cartoneros || CartonerosDB.getActive();
    
    tbody.innerHTML = '';
    
    if (datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No se encontraron cartoneros</td></tr>';
        return;
    }
    
    datos.forEach(cartonero => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cartonero.nombre}</td>
            <td>${cartonero.apellido}</td>
            <td>${formatearDNIDisplay(cartonero.dni)}</td>
            <td>${tiposVehiculo[cartonero.tipoVehiculo] || cartonero.tipoVehiculo}</td>
            <td>${cartonero.telefono || 'No especificado'}</td>
            <td>
                <span class="estado-badge estado-${cartonero.estado}">
                    ${cartonero.estado.charAt(0).toUpperCase() + cartonero.estado.slice(1)}
                </span>
            </td>
            <td>
                <button class="btn-table btn-edit" onclick="editarCartonero('${cartonero.id}')">
                    Editar
                </button>
                <button class="btn-table btn-delete" onclick="eliminarCartonero('${cartonero.id}')">
                    Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
};

// Buscar cartoneros
const buscarCartonero = () => {
    const query = document.getElementById('searchInput').value;
    const resultados = CartonerosDB.search(query);
    cargarCartoneros(resultados);
};

// Editar cartonero
const editarCartonero = (id) => {
    location.href = `modificar-cartonero.html?id=${id}`;
};

// Eliminar cartonero
const eliminarCartonero = (id) => {
    const cartonero = CartonerosDB.getById(id);
    
    if (!cartonero) {
        alert('Cartonero no encontrado');
        return;
    }
    
    if (confirm(`¿Está seguro de que desea eliminar a ${cartonero.nombre} ${cartonero.apellido}?\n\nNota: Los datos se mantendrán para historial.`)) {
        try {
            CartonerosDB.delete(id);
            alert('Cartonero eliminado exitosamente');
            cargarCartoneros();
        } catch (error) {
            alert('Error al eliminar el cartonero: ' + error.message);
        }
    }
};

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const buscarBtn = document.getElementById('buscarBtn');
    
    cargarCartoneros();
    
    buscarBtn.addEventListener('click', buscarCartonero);
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            buscarCartonero();
        }
    });
    
    searchInput.addEventListener('input', () => {
        setTimeout(buscarCartonero, 300);
    });
});

// CSS para estados
const style = document.createElement('style');
style.textContent = `
    .estado-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
    }
    
    .estado-activo {
        background-color: #10b981;
        color: white;
    }
    
    .estado-inactivo {
        background-color: #6b7280;
        color: white;
    }
    
    .estado-suspendido {
        background-color: #ef4444;
        color: white;
    }
    
    .estado-eliminado {
        background-color: #dc2626;
        color: white;
    }
`;
document.head.appendChild(style);