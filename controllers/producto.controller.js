const Producto = require('../models/producto.model');
const Configuracion = require('../models/configuracion.model');
const Calificacion = require('../models/calificacion.model');
const Estadisticas = require('../models/estadisticas.model');
const Log = require('../models/log.model');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { log } = require('../utils/logger');


//Mostrar formulario de agregar producto
exports.getAgregarProducto = async (request, response) => {
    try {
        const campanias = await Configuracion.fetchAllCampanias();
        response.render('admin/home_agregarProducto', {
            usuario: request.session.usuario,
            formulario: null,
            mensaje: null,
            mensajeBulk: null,
            errorBulk: null,
            resultadoCSV: null,
            error: null,
            campanias
        });
    } catch (error) {
        console.error('Error cargando campañas:', error);
        response.render('admin/home_agregarProducto', {
            usuario: request.session.usuario,
            formulario: null,
            mensaje: null,
            mensajeBulk: null,
            errorBulk: null,
            resultadoCSV: null,
            error: null,
            campanias: []
        });
    }
};

//Procesar formulario de agregar producto
exports.postAgregarProducto = async (request, response) => {
    let campanias = [];
    try { campanias = await Configuracion.fetchAllCampanias(); } catch (_) {}

    try {
        const { nombre, descripcion, clave, unidad_venta, unidad_medida, peso, precio_unitario, activo, id_campania } = request.body;
        const imagen = request.files?.['imagen']?.[0];
        const imagenFilename = imagen?.filename || request.body.imagen_temp || null;

        // Validar que todos los campos requeridos estén presentes
        if (!nombre || !descripcion || !clave || !unidad_venta || !unidad_medida || !peso || !precio_unitario || !imagenFilename) {
            return response.render('admin/home_agregarProducto', {
                usuario: request.session.usuario,
                formulario: { nombre, descripcion, clave, unidad_venta, unidad_medida, peso, precio_unitario, activo, id_campania, imagen_temp: imagenFilename },
                mensaje: null,
                mensajeBulk: null,
                errorBulk: null,
                resultadoCSV: null,
                error: 'Todos los campos son obligatorios. Por favor, llena todos los campos.',
                campanias
            });
        }

        // Construir URL de acceso a la imagen (solo el filename)
        const url_imagen = imagenFilename;

        // Convertir activo a booleano y aplicar regla de campaña inactiva
        let es_activo = activo === 'on' ? true : false;
        if (id_campania) {
            const campanaSeleccionada = campanias.find(c => c.id_campania === parseInt(id_campania));
            if (campanaSeleccionada && !campanaSeleccionada.activo) {
                es_activo = false;
            }
        }

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

            // Asociar a campaña si fue seleccionada
            if (id_campania) {
                try {
                    await Configuracion.asociarProductoCampania(parseInt(id_campania), nuevoProducto.id_producto);
                } catch (campError) {
                    console.error('Error asociando producto a campaña:', campError);
                }
            }

            log('ADMIN', 'PRODUCTO AGREGADO', `id_admin: ${request.session.usuario}, producto: "${nombre}" (clave: ${clave})`);
            try { await Log.registrar(request.session.usuario, `Agregó producto: ${clave}`); } catch (_) {}

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
                error: null,
                campanias
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
                    formulario: { nombre, descripcion, clave, unidad_venta, unidad_medida, peso, precio_unitario, activo, id_campania, imagen_temp: imagenFilename },
                    mensaje: null,
                    mensajeBulk: null,
                    errorBulk: null,
                    resultadoCSV: null,
                    error: 'La clave del producto ya existe. Por favor, usa una clave diferente.',
                    campanias
                });
            }
            throw dbError;
        }

    } catch (error) {
        console.error('Error en agregar producto:', error);
        return response.render('admin/home_agregarProducto', {
            usuario: request.session.usuario,
            formulario: { ...request.body, imagen_temp: request.files?.['imagen']?.[0]?.filename || request.body.imagen_temp || null },
            mensaje: null,
            mensajeBulk: null,
            errorBulk: null,
            resultadoCSV: null,
            error: 'Error al agregar el producto. Intenta de nuevo.',
            campanias
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
            clave: productoRaw.clave,
            precio: productoRaw.precio_unitario,
            peso: productoRaw.peso || 'N/A',
            volumen: productoRaw.volumen || 'N/A',
            unidadVenta: productoRaw.unidad_venta || 'N/A',
            unidadMedida: productoRaw.unidad_medida || 'N/A',
            descripcion: productoRaw.descripcion ? [productoRaw.descripcion] : ['Sin descripción disponible'],
            imagen: productoRaw.url_imagen || '/img/botePintura.png',
        };

        const productosDestacados = await Estadisticas.getTop5ProductosDestacados();


        response.render('admin/product', {
            usuario: request.session.usuario,
            productoId: id,
            producto,
            productosDestacados
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
            clave: productoRaw.clave,
            precio: productoRaw.precio_unitario,
            peso: productoRaw.peso || 0,
            volumen: productoRaw.volumen || 'N/A',
            unidadVenta: productoRaw.unidad_venta || 'N/A',
            unidadMedida: productoRaw.unidad_medida || 'N/A',
            descripcion: productoRaw.descripcion ? [productoRaw.descripcion] : ['Sin descripción disponible'],
            imagen: productoRaw.url_imagen || '/img/botePintura.png',
        };
        const [calificacionExistente, resenas, productosDestacados] = await Promise.all([
            Calificacion.buscarPorUsuarioYProducto(request.session.usuario, id),
            Calificacion.obtenerPorProducto(id),
            Estadisticas.getTop5ProductosDestacados()
        ]);

        console.log(productosDestacados)

        response.render('cliente/product', {
            usuario: request.session.usuario,
            productoId: id,
            producto,
            calificacion: calificacionExistente,
            resenas,
            productosDestacados
        });
    } catch (error) {
        console.error('Error in getProductoCliente:', error);
        response.status(500).send('Error interno del servidor');
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

    let mensajeBulk = null;
    let errorBulk = null;
    const advertenciasImagenes = [];

    // Mapa originalname → filename en disco (nuevo o ya existente)
    const imageMapByOriginalName = {};

    // --- Procesar imágenes y detectar duplicados ---
    if (archivos.length > 0) {
        const archivosEnDisco = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];

        for (const f of archivos) {
            const ext = path.extname(f.originalname).toLowerCase();
            const base = path.basename(f.originalname, path.extname(f.originalname))
                .replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const patronNombre = `_${base}${ext}`;

            const existente = archivosEnDisco.find(
                e => e !== f.filename && e.endsWith(patronNombre)
            );

            if (existente) {
                // Eliminar la copia recién subida y reutilizar la existente
                try { fs.unlinkSync(path.join(uploadsDir, f.filename)); } catch (_) {}
                imageMapByOriginalName[f.originalname] = existente;
                advertenciasImagenes.push(`La imagen "${f.originalname}" ya existe en el sistema (${existente}). Se usará la imagen existente.`);
            } else {
                imageMapByOriginalName[f.originalname] = f.filename;
            }
        }

        const nuevasGuardadas = archivos.filter(f => imageMapByOriginalName[f.originalname] === f.filename);
        mensajeBulk = {
            total: archivos.length,
            guardadas: nuevasGuardadas.length,
            duplicadas: archivos.length - nuevasGuardadas.length,
            nombres: nuevasGuardadas.map(f => f.filename)
        };
    }

    // --- Procesar CSV/Excel ---
    let resultadoCSV = null;

    if (archivoCSV) {
        try {
            const workbook = xlsx.readFile(archivoCSV.path, { codepage: 65001 });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

            try { fs.unlinkSync(archivoCSV.path); } catch (_) {}

            if (rows.length === 0) {
                resultadoCSV = { insertados: [], errores: ['El archivo está vacío.'], advertencias: advertenciasImagenes };
            } else {
                const columnasRequeridas = ['nombre', 'descripcion', 'url_imagen', 'unidad_venta', 'unidad_medida', 'peso', 'precio_unitario', 'activo', 'clave', 'id_campania'];
                const columnasArchivo = Object.keys(rows[0]).map(k => k.trim().toLowerCase());
                const faltantes = columnasRequeridas.filter(c => !columnasArchivo.includes(c));

                if (faltantes.length > 0) {
                    resultadoCSV = {
                        insertados: [],
                        errores: [`El archivo no tiene el formato correcto. Columnas faltantes: ${faltantes.join(', ')}.`],
                        advertencias: advertenciasImagenes
                    };
                } else {
                    // Verificar campaña activa
                    const campaniaActiva = await Configuracion.ObtenerConfiguracionActiva();
                    if (!campaniaActiva) {
                        resultadoCSV = {
                            insertados: [],
                            errores: ['No hay ninguna campaña activa. Los productos deben pertenecer a la campaña activa para poder agregarse.'],
                            advertencias: advertenciasImagenes
                        };
                    } else {
                        // Pre-cargar claves existentes para detección rápida de duplicados
                        const clavesExistentes = await Producto.fetchAllClaves();

                        const insertados = [];
                        const errores = [];
                        const archivosEnDisco = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];

                        for (let i = 0; i < rows.length; i++) {
                            const row = rows[i];
                            const numFila = i + 2;

                            const datos = {};
                            for (const [k, v] of Object.entries(row)) {
                                datos[k.trim().toLowerCase()] = String(v).trim();
                            }

                            const { nombre, descripcion, url_imagen, unidad_venta, unidad_medida, peso, precio_unitario, activo, clave, id_campania } = datos;
                            const etiqueta = `Fila ${numFila}${nombre ? ` — "${nombre}"` : ''}`;

                            // Validar campos completos
                            const camposVacios = [];
                            if (!nombre) camposVacios.push('nombre');
                            if (!descripcion) camposVacios.push('descripcion');
                            if (!url_imagen) camposVacios.push('url_imagen');
                            if (!unidad_venta) camposVacios.push('unidad_venta');
                            if (!unidad_medida) camposVacios.push('unidad_medida');
                            if (!peso) camposVacios.push('peso');
                            if (!precio_unitario) camposVacios.push('precio_unitario');
                            if (!clave) camposVacios.push('clave');
                            if (!id_campania) camposVacios.push('id_campania');

                            if (camposVacios.length > 0) {
                                errores.push(`${etiqueta}: Campos vacíos — ${camposVacios.join(', ')}.`);
                                continue;
                            }

                            // Validar que id_campania coincide con la campaña activa
                            if (parseInt(id_campania) !== campaniaActiva.id_campania) {
                                errores.push(`${etiqueta}: El id_campania "${id_campania}" no corresponde a la campaña activa "${campaniaActiva.nombre}" (id: ${campaniaActiva.id_campania}).`);
                                continue;
                            }

                            // Validar longitud de clave
                            if (clave.length > 12) {
                                errores.push(`${etiqueta}: La clave "${clave}" excede 12 caracteres (tiene ${clave.length}).`);
                                continue;
                            }

                            // Detección anticipada de clave duplicada
                            if (clavesExistentes.has(clave)) {
                                errores.push(`${etiqueta}: La clave "${clave}" ya existe en la base de datos.`);
                                continue;
                            }

                            // Resolver filename de la imagen
                            let storedImageFilename;
                            if (imageMapByOriginalName[url_imagen]) {
                                storedImageFilename = imageMapByOriginalName[url_imagen];
                            } else {
                                const rutaExacta = path.join(uploadsDir, url_imagen);
                                if (fs.existsSync(rutaExacta)) {
                                    storedImageFilename = url_imagen;
                                } else {
                                    const encontrado = archivosEnDisco.find(
                                        e => e === url_imagen || e.endsWith('_' + url_imagen)
                                    );
                                    if (!encontrado) {
                                        errores.push(`${etiqueta}: La imagen "${url_imagen}" no existe. Sube las imágenes primero.`);
                                        continue;
                                    }
                                    storedImageFilename = encontrado;
                                }
                            }

                            // Validar precio y peso
                            const precioNum = parseFloat(precio_unitario);
                            const pesoNum = parseFloat(peso);
                            if (isNaN(precioNum) || precioNum < 0) {
                                errores.push(`${etiqueta}: El precio "${precio_unitario}" no es un número válido.`);
                                continue;
                            }
                            if (isNaN(pesoNum) || pesoNum < 0) {
                                errores.push(`${etiqueta}: El peso "${peso}" no es un número válido.`);
                                continue;
                            }

                            const esActivo = ['true', '1', 'si', 'sí', 'yes'].includes(activo.toLowerCase());

                            try {
                                const nuevoProducto = await Producto.crearProducto({
                                    nombre, descripcion, url_imagen: storedImageFilename,
                                    unidad_venta, unidad_medida,
                                    peso: pesoNum, precio_unitario: precioNum,
                                    activo: esActivo, clave
                                });

                                try {
                                    await Configuracion.asociarProductoCampania(campaniaActiva.id_campania, nuevoProducto.id_producto);
                                } catch (campError) {
                                    console.error(`Error asociando producto ${clave} a campaña:`, campError);
                                }

                                // Registrar en el set local para detectar duplicados dentro del mismo archivo
                                clavesExistentes.add(clave);
                                insertados.push(`${nombre} (clave: ${clave})`);
                            } catch (dbError) {
                                if (dbError.code === '23505' || dbError.message?.includes('duplicate key')) {
                                    errores.push(`${etiqueta}: La clave "${clave}" ya existe en la base de datos.`);
                                } else {
                                    errores.push(`${etiqueta}: Error al insertar — ${dbError.message || 'error desconocido'}.`);
                                }
                            }
                        }

                        resultadoCSV = { insertados, errores, advertencias: advertenciasImagenes };
                    }
                }
            }
        } catch (parseError) {
            console.error('Error al parsear el archivo:', parseError);
            try { fs.unlinkSync(archivoCSV.path); } catch (_) {}
            resultadoCSV = { insertados: [], errores: ['No se pudo leer el archivo. Verifica que sea un CSV o Excel válido.'], advertencias: advertenciasImagenes };
        }
    } else if (advertenciasImagenes.length > 0) {
        // Solo se subieron imágenes, pero hay advertencias de duplicados
        resultadoCSV = { insertados: [], errores: [], advertencias: advertenciasImagenes };
    }

    if (!mensajeBulk && !resultadoCSV) {
        errorBulk = 'No se recibió ningún archivo. Selecciona al menos un CSV o imágenes.';
    }

    if (resultadoCSV?.insertados?.length > 0) {
        try { await Log.registrar(request.session.usuario, `Agregó archivo con productos: ${resultadoCSV.insertados.length} insertados`); } catch (_) {}
    }

    let campanias = [];
    try { campanias = await Configuracion.fetchAllCampanias(); } catch (_) {}

    return response.render('admin/home_agregarProducto', {
        usuario: request.session.usuario,
        formulario: null,
        mensaje: null,
        mensajeBulk,
        errorBulk,
        resultadoCSV,
        error: null,
        campanias
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
            error: null,
            campanias: []
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
        error: null,
        campanias: []
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
        error: null,
        campanias: []
    });

    if (!archivo) {
        return renderError('No se recibió ningún archivo. Asegúrate de seleccionar un CSV o Excel.');
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads');

    try {
        const workbook = xlsx.readFile(archivo.path, { codepage: 65001 });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

        // Eliminar el archivo temporal del CSV de la carpeta uploads
        try { fs.unlinkSync(archivo.path); } catch (_) {}

        if (rows.length === 0) {
            return renderError('El archivo está vacío. Asegúrate de que tenga al menos una fila de datos.');
        }

        // Validar que existan todas las columnas requeridas
        const columnasRequeridas = ['nombre', 'descripcion', 'url_imagen', 'unidad_venta', 'unidad_medida', 'peso', 'precio_unitario', 'activo', 'clave', 'id_campania'];
        const columnasArchivo = Object.keys(rows[0]).map(k => k.trim().toLowerCase());
        const faltantes = columnasRequeridas.filter(c => !columnasArchivo.includes(c));

        if (faltantes.length > 0) {
            return renderError(`El archivo no tiene el formato correcto. Columnas faltantes: ${faltantes.join(', ')}. Columnas requeridas: nombre, descripcion, url_imagen, unidad_venta, unidad_medida, peso, precio_unitario, activo, clave, id_campania.`);
        }

        // Verificar campaña activa
        const campaniaActiva = await Configuracion.ObtenerConfiguracionActiva();
        if (!campaniaActiva) {
            return renderError('No hay ninguna campaña activa. Los productos deben pertenecer a la campaña activa para poder agregarse.');
        }

        // Pre-cargar claves existentes para detección rápida de duplicados
        const clavesExistentes = await Producto.fetchAllClaves();

        const insertados = [];
        const errores = [];
        const archivosEnDisco = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const numFila = i + 2; // +1 por header, +1 base 1

            // Normalizar claves del objeto
            const datos = {};
            for (const [k, v] of Object.entries(row)) {
                datos[k.trim().toLowerCase()] = String(v).trim();
            }

            const { nombre, descripcion, url_imagen, unidad_venta, unidad_medida, peso, precio_unitario, activo, clave, id_campania } = datos;
            const etiqueta = `Fila ${numFila}${nombre ? ` — "${nombre}"` : ''}`;

            // Validar que todos los campos estén completos
            const camposVacios = [];
            if (!nombre) camposVacios.push('nombre');
            if (!descripcion) camposVacios.push('descripcion');
            if (!url_imagen) camposVacios.push('url_imagen');
            if (!unidad_venta) camposVacios.push('unidad_venta');
            if (!unidad_medida) camposVacios.push('unidad_medida');
            if (!peso) camposVacios.push('peso');
            if (!precio_unitario) camposVacios.push('precio_unitario');
            if (!clave) camposVacios.push('clave');
            if (!id_campania) camposVacios.push('id_campania');

            if (camposVacios.length > 0) {
                errores.push(`${etiqueta}: Campos vacíos — ${camposVacios.join(', ')}.`);
                continue;
            }

            // Validar que id_campania coincide con la campaña activa
            if (parseInt(id_campania) !== campaniaActiva.id_campania) {
                errores.push(`${etiqueta}: El id_campania "${id_campania}" no corresponde a la campaña activa "${campaniaActiva.nombre}" (id: ${campaniaActiva.id_campania}).`);
                continue;
            }

            // Validar longitud de clave (máximo 12 caracteres)
            if (clave.length > 12) {
                errores.push(`${etiqueta}: La clave "${clave}" excede 12 caracteres (tiene ${clave.length}).`);
                continue;
            }

            // Detección anticipada de clave duplicada
            if (clavesExistentes.has(clave)) {
                errores.push(`${etiqueta}: La clave "${clave}" ya existe en la base de datos.`);
                continue;
            }

            // Validar que la imagen exista en la carpeta uploads.
            let storedImageFilename;
            const rutaExacta = path.join(uploadsDir, url_imagen);
            if (fs.existsSync(rutaExacta)) {
                storedImageFilename = url_imagen;
            } else {
                const encontrado = archivosEnDisco.find(f => f === url_imagen || f.endsWith('_' + url_imagen));
                if (!encontrado) {
                    errores.push(`${etiqueta}: La imagen "${url_imagen}" no existe en la carpeta de uploads. Sube las imágenes primero.`);
                    continue;
                }
                storedImageFilename = encontrado;
            }

            // Validar precio y peso sean números válidos
            const precioNum = parseFloat(precio_unitario);
            const pesoNum = parseFloat(peso);
            if (isNaN(precioNum) || precioNum < 0) {
                errores.push(`${etiqueta}: El precio "${precio_unitario}" no es un número válido.`);
                continue;
            }
            if (isNaN(pesoNum) || pesoNum < 0) {
                errores.push(`${etiqueta}: El peso "${peso}" no es un número válido.`);
                continue;
            }

            // Interpretar campo activo
            const esActivo = ['true', '1', 'si', 'sí', 'yes'].includes(activo.toLowerCase());

            try {
                const nuevoProducto = await Producto.crearProducto({
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

                try {
                    await Configuracion.asociarProductoCampania(campaniaActiva.id_campania, nuevoProducto.id_producto);
                } catch (campError) {
                    console.error(`Error asociando producto ${clave} a campaña:`, campError);
                }

                clavesExistentes.add(clave);
                insertados.push(`${nombre} (clave: ${clave})`);
            } catch (dbError) {
                if (dbError.code === '23505' ||
                    dbError.message?.includes('duplicate key') ||
                    dbError.message?.includes('unique constraint')) {
                    errores.push(`${etiqueta}: La clave "${clave}" ya existe en la base de datos.`);
                } else {
                    errores.push(`${etiqueta}: Error al insertar — ${dbError.message || 'error desconocido'}.`);
                }
            }
        }

        if (insertados.length > 0) {
            try { await Log.registrar(request.session.usuario, `Agregó archivo con productos: ${insertados.length} insertados`); } catch (_) {}
        }

        return response.render('admin/home_agregarProducto', {
            usuario: request.session.usuario,
            formulario: null,
            mensaje: null,
            mensajeBulk: null,
            errorBulk: null,
            resultadoCSV: { insertados, errores },
            error: null,
            campanias: []
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

            log('ADMIN', 'PRODUCTO EDITADO', `id_admin: ${request.session.usuario}, id_producto: ${id} (clave: ${clave})`);
            try { await Log.registrar(request.session.usuario, `Editó información de producto: ${clave}`); } catch (_) {}

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
