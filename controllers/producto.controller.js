const Producto = require('../models/producto.model');

//Obtener todos los productos (admin)
exports.getProductos = async (request, response) => {

};

//Mostrar formulario de agregar producto
exports.getAgregarProducto = (request, response) => {
    response.render('admin/home_agregarProducto', {
        usuario: request.session.usuario,
        formulario: null,
        mensaje: null,
        error: null
    });
};

//Procesar formulario de agregar producto
exports.postAgregarProducto = async (request, response) => {
    try {
        const { nombre, descripcion, clave, unidad_venta, unidad_medida, peso, precio_unitario, activo } = request.body;
        const imagen = request.file;

        // Validar que todos los campos requeridos estén presentes
        if (!nombre || !descripcion || !clave || !unidad_venta || !unidad_medida || !peso || !precio_unitario || !imagen) {
            return response.render('admin/home_agregarProducto', {
                usuario: request.session.usuario,
                formulario: { nombre, descripcion, clave, unidad_venta, unidad_medida, peso, precio_unitario, activo },
                mensaje: null,
                error: 'Todos los campos son obligatorios. Por favor, llena todos los campos.'
            });
        }

        // Construir URL de acceso a la imagen (solo el filename)
        const url_imagen = imagen.filename;

        // Convertir activo a booleano
        const es_activo = activo === 'on' ? true : false;

        console.log('Datos a guardar:', {
            nombre,
            descripcion,
            url_imagen,
            unidad_venta,
            unidad_medida,
            peso: parseFloat(peso),
            precio_unitario: parseFloat(precio_unitario),
            activo: es_activo,
            clave
        });

        // Intentar crear el producto
        try {
            const nuevoProducto = await Producto.crearProducto({
                nombre,
                descripcion,
                url_imagen,
                unidad_venta,
                unidad_medida,
                peso: parseFloat(peso),
                precio_unitario: parseFloat(precio_unitario),
                activo: es_activo,
                clave
            });

            // Mostrar el mensaje de éxito
            return response.render('admin/home_agregarProducto', {
                usuario: request.session.usuario,
                formulario: null,
                mensaje: {
                    tipo: 'exito',
                    activo: es_activo
                },
                error: null
            });
        } catch (dbError) {
            // Detectar error de clave duplicada (código 23505 en PostgreSQL)
            if (dbError.code === '23505') {
                return response.render('admin/home_agregarProducto', {
                    usuario: request.session.usuario,
                    formulario: { nombre, descripcion, clave, unidad_venta, unidad_medida, peso, precio_unitario, activo },
                    mensaje: null,
                    error: 'La clave del producto ya existe. Por favor, usa una clave diferente.'
                });
            }
            throw dbError;
        }

    } catch (error) {
        console.error('Error en agregar producto:', error);
        return response.render('admin/home_agregarProducto', {
            usuario: request.session.usuario,
            formulario: request.body,
            mensaje: null,
            error: 'Error al agregar el producto. Intenta de nuevo.'
        });
    }
};

//Ver producto especifico (admin)
exports.getProductoAdmin = (request, response) => {
    const { id } = request.params;

    const productosDemo = {
        sellador_1: {
            id,
            nombre: 'Sellador Comex 5×1 Clásico Preparación de Superficies PPG Silicona o Poliuretano 4000 ml Sellador',
            precio: '800',
            peso: '2Kg',
            volumen: '0.3 m3',
            unidadVenta: 'Pieza',
            unidadMedida: 'Mililitros',
            descripcion: [
                'Alta calidad y rendimiento profesional: Fórmula acrílica premium para superficies interiores y exteriores, con gran durabilidad',
                'Excelente cobertura: Cubre fácilmente imperfecciones con una sola mano en la mayoría de las superficies'
            ],
            imagen: '/img/botePintura.png',
            similars: [
                '/img/botePintura.png',
                '/img/botePintura.png',
                '/img/botePintura.png',
                '/img/botePintura.png'
            ]
        }
    };

    const producto = productosDemo[id] || productosDemo.sellador_1;

    response.render('admin/product', {
        usuario: request.session.usuario,
        productoId: id,
        producto
    });
};

//Ver producto especifico (cliente)
exports.getProductoCliente = (request, response) => {
    response.render('cliente/product.ejs')
};
