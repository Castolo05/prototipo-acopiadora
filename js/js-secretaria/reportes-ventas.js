// reportes-ventas.js
const ReportesVentas = {
    materialSeleccionado: null,
    distribucionActual: [],

    init() {
        this.cargarMaterialesDisponibles();
        this.cargarHistorialVentas();
    },

    // NUEVA FUNCIÓN: Cargar materiales disponibles
    cargarMaterialesDisponibles() {
        const select = document.getElementById('selectMaterial');
        const materiales = this.obtenerMaterialesStorage();
        
        // Limpiar opciones existentes (excepto la primera)
        select.innerHTML = '<option value="">-- Seleccionar Material --</option>';
        
        // Agregar materiales disponibles
        materiales.forEach(material => {
            const option = document.createElement('option');
            option.value = material.nombre.toLowerCase(); // Usar nombre en minúsculas para consistencia
            option.textContent = material.nombre;
            option.dataset.materialId = material.id; // Guardar ID para referencia
            select.appendChild(option);
        });
    },

    // NUEVA FUNCIÓN: Obtener materiales del storage
    obtenerMaterialesStorage() {
        try {
            const data = localStorage.getItem('materialesAceptados');
            const materiales = data ? JSON.parse(data) : [];
            return materiales.filter(m => m.activo !== false);
        } catch (error) {
            console.error('Error al cargar materiales:', error);
            return [];
        }
    },

    // MODIFICADA: Función cargarDistribucion para usar nombres exactos
    cargarDistribucion() {
        const materialSeleccionado = document.getElementById('selectMaterial').value;
        
        if (!materialSeleccionado) {
            document.getElementById('tablaDistribucion').style.display = 'none';
            document.getElementById('formularioVenta').style.display = 'none';
            document.getElementById('totalAcopiado').textContent = '0 kg';
            return;
        }

        this.materialSeleccionado = materialSeleccionado;
        const cartoneros = CartonerosDB.getActive();
        const distribucion = [];
        let totalKilos = 0;

        // Calcular distribución por cartonero
        cartoneros.forEach(cartonero => {
            const materialesAcopiados = CartonerosDB.getAdditionalData(cartonero.id, 'materiales') || [];
            
            let kilosCartonero = 0;
            let kilosDisponibles = 0;

            materialesAcopiados.forEach(registro => {
                // CAMBIO IMPORTANT: Comparar con el tipo exacto del material
                if (registro.tipo && registro.tipo.toLowerCase() === materialSeleccionado.toLowerCase() && registro.estado !== 'vendido') {
                    kilosCartonero += parseFloat(registro.cantidad || 0);
                    kilosDisponibles += parseFloat(registro.cantidad || 0);
                }
            });

            if (kilosCartonero > 0) {
                distribucion.push({
                    cartonero: cartonero,
                    kilosAcopiados: kilosCartonero,
                    kilosDisponibles: kilosDisponibles
                });
                totalKilos += kilosCartonero;
            }
        });

        // Calcular porcentajes
        distribucion.forEach(item => {
            item.porcentaje = totalKilos > 0 ? (item.kilosAcopiados / totalKilos * 100).toFixed(2) : 0;
        });

        this.distribucionActual = distribucion;
        this.mostrarDistribucion(distribucion, totalKilos);
    },

    // Mostrar tabla de distribución
    mostrarDistribucion(distribucion, totalKilos) {
        document.getElementById('totalAcopiado').textContent = `${totalKilos.toFixed(2)} kg`;
        
        const tbody = document.getElementById('tablaBody');
        tbody.innerHTML = '';

        if (distribucion.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">No hay datos para este material</td></tr>';
            document.getElementById('tablaDistribucion').style.display = 'block';
            document.getElementById('formularioVenta').style.display = 'none';
            return;
        }

        distribucion.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.cartonero.nombre} ${item.cartonero.apellido}</td>
                <td>${item.cartonero.dni}</td>
                <td>${item.kilosAcopiados.toFixed(2)} kg</td>
                <td>${item.porcentaje}%</td>
                
            `;
            tbody.appendChild(row);
        });

        document.getElementById('tablaDistribucion').style.display = 'block';
        document.getElementById('formularioVenta').style.display = 'block';
    },

    // Registrar venta (SIMPLIFICADA)
    registrarVenta() {
        const kilosVendidos = parseFloat(document.getElementById('kilosVendidos').value);

        if (!kilosVendidos || kilosVendidos <= 0) {
            this.mostrarAlerta('error', 'Debe ingresar una cantidad válida de kilos vendidos');
            return;
        }

        const totalDisponible = this.distribucionActual.reduce((sum, item) => sum + item.kilosDisponibles, 0);
        
        if (kilosVendidos > totalDisponible) {
            this.mostrarAlerta('error', `Solo hay ${totalDisponible.toFixed(2)} kg disponibles para venta`);
            return;
        }

        try {
            // Procesar la venta distribuyendo proporcionalmente
            const ventaData = {
                fecha: new Date().toISOString(),
                material: this.materialSeleccionado,
                kilosVendidos: kilosVendidos,
                distribucion: []
            };

            const totalAcopiado = this.distribucionActual.reduce((sum, item) => sum + item.kilosAcopiados, 0);

            this.distribucionActual.forEach(item => {
                const proporcion = item.kilosAcopiados / totalAcopiado;
                const kilosDescontados = kilosVendidos * proporcion;
                
                // Registrar la venta en el historial del cartonero
                const ventaCartonero = {
                    tipo: this.materialSeleccionado,
                    cantidad: kilosDescontados,
                    fecha: new Date().toISOString(),
                    estado: 'vendido'
                };

                CartonerosDB.addAdditionalData(item.cartonero.id, 'ventas', ventaCartonero);
                
                // Marcar materiales como vendidos (proporcional)
                this.marcarMaterialesVendidos(item.cartonero.id, this.materialSeleccionado, kilosDescontados);

                ventaData.distribucion.push({
                    cartoneroId: item.cartonero.id,
                    nombre: `${item.cartonero.nombre} ${item.cartonero.apellido}`,
                    dni: item.cartonero.dni,
                    kilosDescontados: kilosDescontados.toFixed(2)
                });
            });

            // Guardar la venta en el historial general
            this.guardarVentaHistorial(ventaData);

            this.mostrarAlerta('success', `Venta registrada exitosamente. ${kilosVendidos} kg distribuidos entre ${this.distribucionActual.length} cartoneros`);
            
            // Limpiar formulario y recargar datos
            this.limpiarFormulario();
            this.cargarDistribucion();
            this.cargarHistorialVentas();

        } catch (error) {
            console.error('Error al registrar venta:', error);
            this.mostrarAlerta('error', 'Error al registrar la venta: ' + error.message);
        }
    },

    // Marcar materiales como vendidos proporcionalmente
    marcarMaterialesVendidos(cartoneroId, material, kilosADescontar) {
        const cartoneros = CartonerosDB.getAll();
        const cartonero = cartoneros.find(c => c.id === cartoneroId);
        
        if (!cartonero || !cartonero.datosAdicionales || !cartonero.datosAdicionales.materiales) {
            return;
        }

        let kilosRestantes = kilosADescontar;
        
        // Marcar materiales como vendidos hasta completar la cantidad
        cartonero.datosAdicionales.materiales.forEach(registro => {
            if (registro.tipo && registro.tipo.toLowerCase() === material.toLowerCase() && 
                registro.estado !== 'vendido' && kilosRestantes > 0) {
                
                const cantidadRegistro = parseFloat(registro.cantidad || 0);
                
                if (cantidadRegistro <= kilosRestantes) {
                    registro.estado = 'vendido';
                    registro.fechaVenta = new Date().toISOString();
                    kilosRestantes -= cantidadRegistro;
                } else {
                    // Dividir el registro
                    const kilosVendidos = kilosRestantes;
                    const kilosRestantesRegistro = cantidadRegistro - kilosRestantes;
                    
                    registro.cantidad = kilosVendidos;
                    registro.estado = 'vendido';
                    registro.fechaVenta = new Date().toISOString();
                    
                    // Crear nuevo registro con lo que queda
                    const nuevoRegistro = {
                        ...registro,
                        id: CartonerosDB.generateId(),
                        cantidad: kilosRestantesRegistro,
                        estado: 'acopiado'
                    };
                    delete nuevoRegistro.fechaVenta;
                    
                    cartonero.datosAdicionales.materiales.push(nuevoRegistro);
                    kilosRestantes = 0;
                }
            }
        });

        CartonerosDB.saveAll(cartoneros);
    },

    // Guardar venta en historial general
    guardarVentaHistorial(ventaData) {
        let historial = JSON.parse(localStorage.getItem('historial_ventas') || '[]');
        historial.unshift(ventaData); // Agregar al inicio
        
        // Mantener solo las últimas 50 ventas
        if (historial.length > 50) {
            historial = historial.slice(0, 50);
        }
        
        localStorage.setItem('historial_ventas', JSON.stringify(historial));
    },

    // Cargar historial de ventas (SIMPLIFICADO)
    cargarHistorialVentas() {
        const historial = JSON.parse(localStorage.getItem('historial_ventas') || '[]');
        const container = document.getElementById('historialContainer');
        
        if (historial.length === 0) {
            container.innerHTML = '<p style="color: #666;">No hay ventas registradas</p>';
            document.getElementById('historialVentas').style.display = 'block';
            return;
        }

        let html = '';
        historial.slice(0, 10).forEach(venta => { // Mostrar últimas 10
            const fecha = new Date(venta.fecha).toLocaleDateString('es-AR');
            const materialCapitalizado = venta.material.charAt(0).toUpperCase() + venta.material.slice(1);
            
            html += `
                <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong>${materialCapitalizado} - ${venta.kilosVendidos} kg</strong>
                        <span style="color: #666;">${fecha}</span>
                    </div>
                    <p><strong>Cartoneros involucrados:</strong> ${venta.distribucion.length}</p>
                </div>
            `;
        });

        container.innerHTML = html;
        document.getElementById('historialVentas').style.display = 'block';
    },

    // Limpiar formulario (SIMPLIFICADO)
    limpiarFormulario() {
        document.getElementById('kilosVendidos').value = '';
    },

    // Mostrar alertas
    mostrarAlerta(tipo, mensaje) {
        const container = document.getElementById('alertContainer');
        const alert = document.createElement('div');
        alert.className = `alert alert-${tipo === 'error' ? 'error' : 'success'}`;
        alert.textContent = mensaje;
        
        container.innerHTML = '';
        container.appendChild(alert);
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
};

// Funciones globales para los eventos
function cargarDistribucion() {
    ReportesVentas.cargarDistribucion();
}

function registrarVenta() {
    ReportesVentas.registrarVenta();
}

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', function() {
    ReportesVentas.init();
});