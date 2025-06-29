// js/js-secretaria/cartoneros-storage.js
const CartonerosDB = {
    // Configuración
    STORAGE_KEY: 'cooperativa_cartoneros',
    VERSION: '1.0',
    
    // Inicialización
    init() {
        this.migrateIfNeeded();
        this.initializeData();
    },
    
    // Función para limpiar objetos de referencias circulares
    cleanObject(obj, seen = new WeakSet()) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (seen.has(obj)) {
            return '[Circular Reference]';
        }
        
        seen.add(obj);
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.cleanObject(item, seen));
        }
        
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            // Evitar copiar propiedades de funciones o elementos DOM
            if (typeof value === 'function' || 
                (value && typeof value === 'object' && value.nodeType)) {
                continue;
            }
            cleaned[key] = this.cleanObject(value, seen);
        }
        
        return cleaned;
    },
    
    // Migración de datos (para futuras versiones)
    migrateIfNeeded() {
        const data = this.getRawData();
        if (!data.version) {
            data.version = this.VERSION;
            data.cartoneros = data.cartoneros || [];
            data.metadata = {
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            this.saveRawData(data);
        }
    },
    
    // Obtener datos completos
    getRawData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : { cartoneros: [], version: this.VERSION };
        } catch (error) {
            console.error('Error al leer datos del localStorage:', error);
            return { cartoneros: [], version: this.VERSION };
        }
    },
    
    // Guardar datos completos
    saveRawData(data) {
        try {
            // Limpiar datos antes de guardar
            const cleanData = this.cleanObject(data);
            cleanData.metadata = cleanData.metadata || {};
            cleanData.metadata.lastModified = new Date().toISOString();
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanData));
            return true;
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
            return false;
        }
    },
    
    // Obtener todos los cartoneros
    getAll() {
        return this.getRawData().cartoneros || [];
    },
    
    // Guardar cartoneros
    saveAll(cartoneros) {
        const data = this.getRawData();
        data.cartoneros = cartoneros;
        return this.saveRawData(data);
    },
    
    // Obtener cartonero por ID
    getById(id) {
        const cartoneros = this.getAll();
        return cartoneros.find(c => c.id == id);
    },
    
    // Crear nuevo cartonero
    create(cartoneroData) {
        const cartoneros = this.getAll();
        
        // Validar DNI único
        if (this.existsDNI(cartoneroData.dni)) {
            throw new Error('Ya existe un cartonero con este DNI');
        }
        
        // Crear copia limpia de los datos
        const datosLimpios = this.cleanObject(cartoneroData);
        
        const nuevoCartonero = {
            ...datosLimpios,
            id: this.generateId(),
            estado: 'activo',
            fechaRegistro: new Date().toISOString(),
            datosAdicionales: {},
            historial: [{
                fecha: new Date().toISOString(),
                accion: 'creacion',
                datos: { ...datosLimpios }
            }]
        };
        
        cartoneros.push(nuevoCartonero);
        
        if (this.saveAll(cartoneros)) {
            return nuevoCartonero;
        } else {
            throw new Error('Error al guardar el cartonero');
        }
    },
    
    // Actualizar cartonero
    update(id, datosActualizados) {
        const cartoneros = this.getAll();
        const index = cartoneros.findIndex(c => c.id == id);
        
        if (index === -1) {
            throw new Error('Cartonero no encontrado');
        }
        
        // Crear copia limpia del cartonero original
        const cartoneroOriginal = this.cleanObject(cartoneros[index]);
        
        // Validar DNI único (excluyendo el actual)
        if (datosActualizados.dni && this.existsDNI(datosActualizados.dni, id)) {
            throw new Error('Ya existe otro cartonero con este DNI');
        }
        
        // Limpiar datos actualizados
        const datosLimpios = this.cleanObject(datosActualizados);
        
        // Actualizar datos
        cartoneros[index] = {
            ...cartoneros[index],
            ...datosLimpios,
            fechaModificacion: new Date().toISOString()
        };
        
        // Agregar al historial (solo los campos que cambiaron)
        const cambios = {};
        Object.keys(datosLimpios).forEach(key => {
            if (cartoneroOriginal[key] !== datosLimpios[key]) {
                cambios[key] = {
                    anterior: cartoneroOriginal[key],
                    nuevo: datosLimpios[key]
                };
            }
        });
        
        cartoneros[index].historial = cartoneros[index].historial || [];
        cartoneros[index].historial.push({
            fecha: new Date().toISOString(),
            accion: 'modificacion',
            cambios: cambios
        });
        
        if (this.saveAll(cartoneros)) {
            return cartoneros[index];
        } else {
            throw new Error('Error al actualizar el cartonero');
        }
    },
    
    // Eliminar cartonero (soft delete)
    delete(id) {
        const cartoneros = this.getAll();
        const index = cartoneros.findIndex(c => c.id == id);
        
        if (index === -1) {
            throw new Error('Cartonero no encontrado');
        }
        
        // Soft delete - marcar como eliminado pero mantener datos
        cartoneros[index].estado = 'eliminado';
        cartoneros[index].fechaEliminacion = new Date().toISOString();
        
        // Agregar al historial
        cartoneros[index].historial = cartoneros[index].historial || [];
        cartoneros[index].historial.push({
            fecha: new Date().toISOString(),
            accion: 'eliminacion'
        });
        
        return this.saveAll(cartoneros);
    },
    
    // Obtener cartoneros activos (no eliminados)
    getActive() {
        return this.getAll().filter(c => c.estado !== 'eliminado');
    },
    
    // Buscar cartoneros
    search(query, includeDeleted = false) {
        const cartoneros = includeDeleted ? this.getAll() : this.getActive();
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) return cartoneros;
        
        return cartoneros.filter(c => 
            c.nombre.toLowerCase().includes(searchTerm) ||
            c.apellido.toLowerCase().includes(searchTerm) ||
            c.dni.includes(searchTerm)
        );
    },
    
    // Verificar si existe DNI
    existsDNI(dni, excludeId = null) {
        const cartoneros = this.getActive();
        return cartoneros.some(c => c.dni === dni && c.id != excludeId);
    },
    
    // Agregar datos adicionales a un cartonero
    addAdditionalData(id, clave, datos) {
        const cartoneros = this.getAll();
        const index = cartoneros.findIndex(c => c.id == id);
        
        if (index === -1) {
            throw new Error('Cartonero no encontrado');
        }
        
        const datosLimpios = this.cleanObject(datos);
        
        cartoneros[index].datosAdicionales = cartoneros[index].datosAdicionales || {};
        cartoneros[index].datosAdicionales[clave] = cartoneros[index].datosAdicionales[clave] || [];
        cartoneros[index].datosAdicionales[clave].push({
            ...datosLimpios,
            fecha: new Date().toISOString(),
            id: this.generateId()
        });
        
        return this.saveAll(cartoneros);
    },
    
    // Obtener datos adicionales de un cartonero
    getAdditionalData(id, clave = null) {
        const cartonero = this.getById(id);
        if (!cartonero || !cartonero.datosAdicionales) {
            return clave ? [] : {};
        }
        
        return clave ? (cartonero.datosAdicionales[clave] || []) : cartonero.datosAdicionales;
    },
    
    // Generar ID único
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    },
    
    // Inicializar datos de ejemplo
    initializeData() {
        const cartoneros = this.getAll();
        if (cartoneros.length === 0) {
            const ejemplos = [
                {
                    nombre: 'Juan',
                    apellido: 'Pérez',
                    dni: '12345678',
                    fechaNacimiento: '1985-05-15',
                    direccion: 'Av. Independencia 123',
                    telefono: '011-1234-5678',
                    tipoVehiculo: 'carrito'
                },
                {
                    nombre: 'María',
                    apellido: 'González',
                    dni: '23456789',
                    fechaNacimiento: '1990-08-22',
                    direccion: 'Calle San Martín 456',
                    telefono: '011-2345-6789',
                    tipoVehiculo: 'bicicleta'
                }
            ];
            
            ejemplos.forEach(ejemplo => {
                try {
                    this.create(ejemplo);
                } catch (error) {
                    console.error('Error al crear cartonero de ejemplo:', error);
                }
            });
        }
    }
};

// Inicializar automáticamente
CartonerosDB.init();

// Hacer disponible globalmente
window.CartonerosDB = CartonerosDB;