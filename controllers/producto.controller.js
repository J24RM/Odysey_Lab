const Producto = require('../models/producto.model');

//Obtener todos los productos (admin)
exports.getProductos = async (request, response) => {
    try {
        const productos = await Producto.fetchAll();
        // Render or send based on requirements (currently empty in file)
    } catch (error) {
        console.error('Error fetching products for admin:', error);
        response.status(500).send('Error interno del servidor');
    }
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
            console.error('Database error details:', {
                code: dbError.code,
                message: dbError.message,
                details: dbError.details,
                hint: dbError.hint
            });

            // Supabase devuelve diferentes propiedades según el tipo de error
            if (dbError.code === '23505' ||
                dbError.message?.includes('duplicate key') ||
                dbError.message?.includes('unique constraint') ||
                dbError.details?.includes('unique')) {
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
exports.getProductoAdmin = async (request, response) => {
    try {
        const { id } = request.params;
        const productoRaw = await Producto.findById(id);

        if (!productoRaw) {
            return response.status(404).send('Producto no encontrado');
        }

        // Mapping DB fields to view structure
        const producto = {
            id: productoRaw.id_producto,
            nombre: productoRaw.nombre,
            precio: productoRaw.precio_unitario,
            peso: productoRaw.peso || 'N/A',
            volumen: productoRaw.volumen || 'N/A',
            unidadVenta: productoRaw.unidad_venta || 'N/A',
            unidadMedida: productoRaw.unidad_medida || 'N/A',
            descripcion: productoRaw.descripcion ? [productoRaw.descripcion] : ['Sin descripción disponible'],
            imagen: productoRaw.url_imagen || '/img/botePintura.png',
            similars: [
                '/img/botePintura.png',
                '/img/botePintura.png',
                '/img/botePintura.png',
                '/img/botePintura.png'
            ]
        };

        response.render('admin/product', {
            usuario: request.session.usuario,
            productoId: id,
            producto
        });
    } catch (error) {
        console.error('Error in getProductoAdmin:', error);
        response.status(500).send('Error interno del servidor');
    }
};

//Ver producto especifico (cliente)
exports.getProductoCliente = async (request, response) => {
    try {
        const { id } = request.params;
        const productoRaw = await Producto.findById(id);

        if (!productoRaw) {
            return response.status(404).send('Producto no encontrado');
        }

        const producto = {
            id: productoRaw.id_producto,
            nombre: productoRaw.nombre,
            precio: productoRaw.precio_unitario,
            peso: productoRaw.peso || 'N/A',
            volumen: productoRaw.volumen || 'N/A',
            unidadVenta: productoRaw.unidad_venta || 'N/A',
            unidadMedida: productoRaw.unidad_medida || 'N/A',
            descripcion: productoRaw.descripcion ? [productoRaw.descripcion] : ['Sin descripción disponible'],
            imagen: productoRaw.url_imagen || '/img/botePintura.png',
            similars: [
                '/img/botePintura.png',
                '/img/botePintura.png',
                '/img/botePintura.png',
                '/img/botePintura.png'
            ]
        };

        response.render('cliente/product', {
            usuario: request.session.usuario,
            productoId: id,
            producto
        });
    } catch (error) {
        console.error('Error in getProductoCliente:', error);
        response.status(500).send('Error interno del servidor');
    }
};

//Mostrar formulario de editar producto
exports.getEditarProducto = async (request, response) => {
    try {
        const productos = await Producto.fetchLimit(10);
        response.render('admin/home_editarProducto', {
            usuario: request.session.usuario,
            productos: productos,
            formulario: null,
            mensaje: null,
            error: null,
            productoSeleccionado: null
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        response.render('admin/home_editarProducto', {
            usuario: request.session.usuario,
            productos: [],
            formulario: null,
            mensaje: null,
            error: 'Error al cargar los productos',
            productoSeleccionado: null
        });
    }
};

//Buscar producto en tiempo real (API)
exports.searchProductos = async (request, response) => {
    try {
        const { q } = request.query;

        if (!q || q.trim().length === 0) {
            const productos = await Producto.fetchLimit(10);
            return response.json(productos);
        }

        const productos = await Producto.searchByNameClaveId(q.trim());
        response.json(productos);
    } catch (error) {
        console.error('Error searching products:', error);
        response.status(500).json({ error: 'Error al buscar productos' });
    }
};

//Cargar formulario de edición con datos del producto
exports.getFormEditarProducto = async (request, response) => {
    try {
        const { id } = request.params;
        const producto = await Producto.findById(id);

        if (!producto) {
            return response.status(404).json({ error: 'Producto no encontrado' });
        }

        response.json(producto);
    } catch (error) {
        console.error('Error fetching product:', error);
        response.status(500).json({ error: 'Error al cargar el producto' });
    }
};

//Procesar formulario de editar producto
exports.postEditarProducto = async (request, response) => {
    try {
        const { id } = request.params;
        const { nombre, descripcion, clave, unidad_venta, unidad_medida, peso, precio_unitario, activo } = request.body;
        const imagen = request.file;

        // Validar campos obligatorios
        if (!nombre || !descripcion || !clave || !unidad_venta || !unidad_medida || !peso || !precio_unitario) {
            return response.render('admin/home_editarProducto', {
                usuario: request.session.usuario,
                productos: [],
                formulario: { nombre, descripcion, clave, unidad_venta, unidad_medida, peso, precio_unitario, activo },
                mensaje: null,
                error: 'Todos los campos son obligatorios. Por favor, llena todos los campos.',
                productoSeleccionado: id
            });
        }

        const productoActual = await Producto.findById(id);
        let url_imagen = productoActual.url_imagen;

        // Si hay una imagen nueva, usarla
        if (imagen) {
            url_imagen = imagen.filename;
        }

        const es_activo = activo === 'on' ? true : false;

        try {
            const productoActualizado = await Producto.actualizarProducto(id, {
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

            return response.render('admin/home_editarProducto', {
                usuario: request.session.usuario,
                productos: [],
                formulario: null,
                mensaje: {
                    tipo: 'exito',
                    activo: es_activo
                },
                error: null,
                productoSeleccionado: null
            });
        } catch (dbError) {
            if (dbError.code === '23505') {
                return response.render('admin/home_editarProducto', {
                    usuario: request.session.usuario,
                    productos: [],
                    formulario: { nombre, descripcion, clave, unidad_venta, unidad_medida, peso, precio_unitario, activo },
                    mensaje: null,
                    error: 'La clave del producto ya existe. Por favor, usa una clave diferente.',
                    productoSeleccionado: id
                });
            }
            throw dbError;
        }
    } catch (error) {
        console.error('Error editing product:', error);
        return response.render('admin/home_editarProducto', {
            usuario: request.session.usuario,
            productos: [],
            formulario: request.body,
            mensaje: null,
            error: 'Error al editar el producto. Intenta de nuevo.',
            productoSeleccionado: request.params.id
        });
    }
};
