const Producto = require('../models/producto.model');
const Calificacion = require('../models/calificacion.model');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

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
        mensajeBulk: null,
        errorBulk: null,
        resultadoCSV: null,
        error: null
    });
};

//Procesar formulario de agregar producto
exports.postAgregarProducto = async (request, response) => {
    try {
        const { nombre, descripcion, clave, unidad_venta, unidad_medida, peso, precio_unitario, activo } = request.body;
        const imagen = request.files?.['imagen']?.[0];

        // Validar que todos los campos requeridos estén presentes
        if (!nombre || !descripcion || !clave || !unidad_venta || !unidad_medida || !peso || !precio_unitario || !imagen) {
            return response.render('admin/home_agregarProducto', {
                usuario: request.session.usuario,
                formulario: { nombre, descripcion, clave, unidad_venta, unidad_medida, peso, precio_unitario, activo },
                mensaje: null,
                mensajeBulk: null,
                errorBulk: null,
                resultadoCSV: null,
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
                mensajeBulk: null,
                errorBulk: null,
                resultadoCSV: null,
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
                    mensajeBulk: null,
                    errorBulk: null,
                    resultadoCSV: null,
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
            mensajeBulk: null,
            errorBulk: null,
            resultadoCSV: null,
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
        const [calificacionExistente, resenas] = await Promise.all([
            Calificacion.buscarPorUsuarioYProducto(request.session.usuario, id),
            Calificacion.obtenerPorProducto(id)
        ]);

        response.render('cliente/product', {
            usuario: request.session.usuario,
            productoId: id,
            producto,
            calificacion: calificacionExistente,
            resenas
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

//Procesar carga masiva combinada (imágenes + CSV en un solo submit)
exports.postCargarBulk = async (request, response) => {
    const archivos = request.files?.['imagenes'] || [];
    const archivoCSV = request.files?.['archivoCSV']?.[0];

    const uploadsDir = path.join(__dirname, '..', 'uploads');

    // Procesar imágenes
    let mensajeBulk = null;
    let errorBulk = null;

    if (archivos.length > 0) {
        mensajeBulk = {
            cantidad: archivos.length,
            nombres: archivos.map(f => f.filename)
        };
    }

    // Procesar CSV/Excel
    let resultadoCSV = null;

    if (archivoCSV) {
        try {
            const workbook = xlsx.readFile(archivoCSV.path);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

            try { fs.unlinkSync(archivoCSV.path); } catch (_) {}

            if (rows.length === 0) {
                resultadoCSV = { insertados: [], errores: ['El archivo está vacío. Asegúrate de que tenga al menos una fila de datos.'] };
            } else {
                const columnasRequeridas = ['nombre', 'descripcion', 'url_imagen', 'unidad_venta', 'unidad_medida', 'peso', 'precio_unitario', 'activo', 'clave'];
                const columnasArchivo = Object.keys(rows[0]).map(k => k.trim().toLowerCase());
                const faltantes = columnasRequeridas.filter(c => !columnasArchivo.includes(c));

                if (faltantes.length > 0) {
                    resultadoCSV = { insertados: [], errores: [`El archivo no tiene el formato correcto. Columnas faltantes: ${faltantes.join(', ')}.`] };
                } else {
                    const insertados = [];
                    const errores = [];

                    // Mapa de nombre original → nombre real guardado por multer
                    const imageMapByOriginalName = {};
                    for (const f of archivos) {
                        imageMapByOriginalName[f.originalname] = f.filename;
                    }

                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        const numFila = i + 2;

                        const datos = {};
                        for (const [k, v] of Object.entries(row)) {
                            datos[k.trim().toLowerCase()] = String(v).trim();
                        }

                        const { nombre, descripcion, url_imagen, unidad_venta, unidad_medida, peso, precio_unitario, activo, clave } = datos;

                        if (!nombre || !descripcion || !url_imagen || !unidad_venta || !unidad_medida || !peso || !precio_unitario || !clave) {
                            errores.push(`Fila ${numFila}: Hay campos vacíos obligatorios.`);
                            continue;
                        }

                        if (clave.length > 7) {
                            errores.push(`Fila ${numFila}: La clave "${clave}" excede 7 caracteres (tiene ${clave.length}).`);
                            continue;
                        }

                        // Resolver el nombre real del archivo: primero buscar en las imágenes
                        // subidas en esta misma solicitud (multer les cambia el nombre),
                        // luego verificar si ya existe en disco con ese nombre exacto.
                        let storedImageFilename;
                        if (imageMapByOriginalName[url_imagen]) {
                            storedImageFilename = imageMapByOriginalName[url_imagen];
                        } else {
                            const rutaImagen = path.join(uploadsDir, url_imagen);
                            if (!fs.existsSync(rutaImagen)) {
                                errores.push(`Fila ${numFila}: La imagen "${url_imagen}" no existe en uploads. Sube las imágenes primero.`);
                                continue;
                            }
                            storedImageFilename = url_imagen;
                        }

                        const precioNum = parseFloat(precio_unitario);
                        const pesoNum = parseFloat(peso);
                        if (isNaN(precioNum) || precioNum < 0) { errores.push(`Fila ${numFila}: El precio "${precio_unitario}" no es válido.`); continue; }
                        if (isNaN(pesoNum) || pesoNum < 0) { errores.push(`Fila ${numFila}: El peso "${peso}" no es válido.`); continue; }

                        const esActivo = ['true', '1', 'si', 'sí', 'yes'].includes(activo.toLowerCase());

                        try {
                            await Producto.crearProducto({ nombre, descripcion, url_imagen: storedImageFilename, unidad_venta, unidad_medida, peso: pesoNum, precio_unitario: precioNum, activo: esActivo, clave });
                            insertados.push(`${nombre} (clave: ${clave})`);
                        } catch (dbError) {
                            if (dbError.code === '23505' || dbError.message?.includes('duplicate key')) {
                                errores.push(`Fila ${numFila}: La clave "${clave}" ya existe en la base de datos.`);
                            } else {
                                errores.push(`Fila ${numFila}: Error al insertar "${nombre}" — ${dbError.message || 'error desconocido'}.`);
                            }
                        }
                    }

                    resultadoCSV = { insertados, errores };
                }
            }
        } catch (parseError) {
            console.error('Error al parsear el archivo:', parseError);
            try { fs.unlinkSync(archivoCSV.path); } catch (_) {}
            resultadoCSV = { insertados: [], errores: ['No se pudo leer el archivo. Verifica que sea un CSV o Excel válido.'] };
        }
    }

    if (!mensajeBulk && !resultadoCSV) {
        errorBulk = 'No se recibió ningún archivo. Selecciona al menos un CSV o imágenes.';
    }

    return response.render('admin/home_agregarProducto', {
        usuario: request.session.usuario,
        formulario: null,
        mensaje: null,
        mensajeBulk,
        errorBulk,
        resultadoCSV,
        error: null
    });
};

//Procesar carga masiva de imágenes
exports.postCargarImagenes = (request, response) => {
    const archivos = request.files?.['imagenes'] || [];

    if (archivos.length === 0) {
        return response.render('admin/home_agregarProducto', {
            usuario: request.session.usuario,
            formulario: null,
            mensaje: null,
            mensajeBulk: null,
            errorBulk: 'No se recibió ninguna imagen. Asegúrate de seleccionar archivos PNG, JPG o JPEG.',
            resultadoCSV: null,
            error: null
        });
    }

    const nombresGuardados = archivos.map(f => f.filename);

    return response.render('admin/home_agregarProducto', {
        usuario: request.session.usuario,
        formulario: null,
        mensaje: null,
        mensajeBulk: {
            cantidad: archivos.length,
            nombres: nombresGuardados
        },
        errorBulk: null,
        resultadoCSV: null,
        error: null
    });
};

//Procesar carga masiva de productos desde CSV o Excel
exports.postCargarCSV = async (request, response) => {
    const archivo = request.files?.['archivoCSV']?.[0];

    const renderError = (msg) => response.render('admin/home_agregarProducto', {
        usuario: request.session.usuario,
        formulario: null,
        mensaje: null,
        mensajeBulk: null,
        errorBulk: null,
        resultadoCSV: { insertados: [], errores: [msg] },
        error: null
    });

    if (!archivo) {
        return renderError('No se recibió ningún archivo. Asegúrate de seleccionar un CSV o Excel.');
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads');

    try {
        const workbook = xlsx.readFile(archivo.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

        // Eliminar el archivo temporal del CSV de la carpeta uploads
        try { fs.unlinkSync(archivo.path); } catch (_) {}

        if (rows.length === 0) {
            return renderError('El archivo está vacío. Asegúrate de que tenga al menos una fila de datos.');
        }

        // Validar que existan todas las columnas requeridas
        const columnasRequeridas = ['nombre', 'descripcion', 'url_imagen', 'unidad_venta', 'unidad_medida', 'peso', 'precio_unitario', 'activo', 'clave'];
        const columnasArchivo = Object.keys(rows[0]).map(k => k.trim().toLowerCase());
        const faltantes = columnasRequeridas.filter(c => !columnasArchivo.includes(c));

        if (faltantes.length > 0) {
            return renderError(`El archivo no tiene el formato correcto. Columnas faltantes: ${faltantes.join(', ')}. El orden debe ser: nombre, descripcion, url_imagen, unidad_venta, unidad_medida, peso, precio_unitario, activo, clave.`);
        }

        const insertados = [];
        const errores = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const numFila = i + 2; // +1 por header, +1 base 1

            // Normalizar claves del objeto
            const datos = {};
            for (const [k, v] of Object.entries(row)) {
                datos[k.trim().toLowerCase()] = String(v).trim();
            }

            const { nombre, descripcion, url_imagen, unidad_venta, unidad_medida, peso, precio_unitario, activo, clave } = datos;

            // Validar que los campos no estén vacíos
            if (!nombre || !descripcion || !url_imagen || !unidad_venta || !unidad_medida || !peso || !precio_unitario || !clave) {
                errores.push(`Fila ${numFila}: Hay campos vacíos obligatorios.`);
                continue;
            }

            // Validar longitud de clave (máximo 7 caracteres)
            if (clave.length > 7) {
                errores.push(`Fila ${numFila}: La clave "${clave}" excede 7 caracteres (tiene ${clave.length}).`);
                continue;
            }

            // Validar que la imagen exista en la carpeta uploads.
            // Multer renombra los archivos con timestamp, así que si no coincide
            // exacto buscamos un archivo que termine con el nombre indicado.
            let storedImageFilename;
            const rutaExacta = path.join(uploadsDir, url_imagen);
            if (fs.existsSync(rutaExacta)) {
                storedImageFilename = url_imagen;
            } else {
                const archivosEnDisco = fs.readdirSync(uploadsDir);
                const encontrado = archivosEnDisco.find(f => f === url_imagen || f.endsWith('_' + url_imagen));
                if (!encontrado) {
                    errores.push(`Fila ${numFila}: La imagen "${url_imagen}" no existe en la carpeta de uploads. Sube las imágenes primero.`);
                    continue;
                }
                storedImageFilename = encontrado;
            }

            // Validar precio y peso sean números válidos
            const precioNum = parseFloat(precio_unitario);
            const pesoNum = parseFloat(peso);
            if (isNaN(precioNum) || precioNum < 0) {
                errores.push(`Fila ${numFila}: El precio "${precio_unitario}" no es un número válido.`);
                continue;
            }
            if (isNaN(pesoNum) || pesoNum < 0) {
                errores.push(`Fila ${numFila}: El peso "${peso}" no es un número válido.`);
                continue;
            }

            // Interpretar campo activo
            const activoStr = activo.toLowerCase();
            const esActivo = ['true', '1', 'si', 'sí', 'yes'].includes(activoStr);

            try {
                await Producto.crearProducto({
                    nombre,
                    descripcion,
                    url_imagen: storedImageFilename,
                    unidad_venta,
                    unidad_medida,
                    peso: pesoNum,
                    precio_unitario: precioNum,
                    activo: esActivo,
                    clave
                });
                insertados.push(`${nombre} (clave: ${clave})`);
            } catch (dbError) {
                if (dbError.code === '23505' ||
                    dbError.message?.includes('duplicate key') ||
                    dbError.message?.includes('unique constraint')) {
                    errores.push(`Fila ${numFila}: La clave "${clave}" ya existe en la base de datos.`);
                } else {
                    errores.push(`Fila ${numFila}: Error al insertar "${nombre}" — ${dbError.message || 'error desconocido'}.`);
                }
            }
        }

        return response.render('admin/home_agregarProducto', {
            usuario: request.session.usuario,
            formulario: null,
            mensaje: null,
            mensajeBulk: null,
            errorBulk: null,
            resultadoCSV: { insertados, errores },
            error: null
        });

    } catch (parseError) {
        console.error('Error al parsear el archivo:', parseError);
        // Limpiar archivo si existe
        try { fs.unlinkSync(archivo.path); } catch (_) {}
        return renderError('No se pudo leer el archivo. Verifica que sea un CSV o Excel válido.');
    }
};

//Procesar formulario de editar producto
exports.postEditarProducto = async (request, response) => {
    try {
        const { id } = request.params;
        const { nombre, descripcion, clave, unidad_venta, unidad_medida, peso, precio_unitario, activo } = request.body;
        const imagen = request.files?.['imagen']?.[0];

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
