const Configuracion = require('../models/configuracion.model');
const { log } = require('../utils/logger');

// ─── AGREGAR CAMPAÑA ──────────────────────────────────────────────────────────

exports.getAgregarCampania = async (req, res) => {
    try {
        const hayActiva = await Configuracion.hayOtraActiva();
        res.render('admin/home_agregarCampania', {
            usuario: req.session.usuario,
            hayActiva,
            mensaje: null,
            error: null
        });
    } catch (err) {
        console.error('Error cargando formulario campaña:', err);
        res.render('admin/home_agregarCampania', {
            usuario: req.session.usuario,
            hayActiva: false,
            mensaje: null,
            error: 'Error al cargar el formulario'
        });
    }
};

exports.postAgregarCampania = async (req, res) => {
    const renderError = async (msg) => {
        const hayActiva = await Configuracion.hayOtraActiva().catch(() => false);
        return res.render('admin/home_agregarCampania', {
            usuario: req.session.usuario,
            hayActiva,
            mensaje: null,
            error: msg
        });
    };

    try {
        const { nombre, fecha_de_inicio, fecha_de_fin, activo, tiempo_de_cancelacion } = req.body;
        const quiereActiva = activo === 'true';

        if (quiereActiva && await Configuracion.hayOtraActiva()) {
            return renderError('Ya existe una campaña activa. Desactívala antes de crear una nueva activa.');
        }

        if (!req.files?.banner_login?.[0] || !req.files?.banner_general?.[0]) {
            return renderError('Debes subir ambos banners para crear la campaña.');
        }

        const nuevaCampania = await Configuracion.crearCampania({
            nombre,
            fecha_de_inicio: fecha_de_inicio || null,
            fecha_de_fin:    fecha_de_fin    || null,
            activo:          quiereActiva,
            tiempo_de_cancelacion: tiempo_de_cancelacion ? parseInt(tiempo_de_cancelacion) : null
        });

        const loginFilename   = req.files['banner_login'][0].filename;
        const generalFilename = req.files['banner_general'][0].filename;

        const cfgLogin   = await Configuracion.agregarBanner(nuevaCampania.id_campania, loginFilename);
        const cfgGeneral = await Configuracion.agregarBanner(nuevaCampania.id_campania, generalFilename);

        await Configuracion.actualizarCampania(nuevaCampania.id_campania, {
            banner_login:   cfgLogin.id_configuraciones,
            banner_general: cfgGeneral.id_configuraciones
        });

        log('ADMIN', 'CAMPANIA', `id: ${req.session.usuario} — campaña creada: ${nuevaCampania.id_campania}`);

        const hayActiva = await Configuracion.hayOtraActiva();
        res.render('admin/home_agregarCampania', {
            usuario: req.session.usuario,
            hayActiva,
            mensaje: `Campaña "${nombre}" creada correctamente.`,
            error: null
        });
    } catch (err) {
        console.error('Error creando campaña:', err);
        renderError('Error al crear la campaña. Inténtalo de nuevo.');
    }
};

// ─── CONFIGURAR CAMPAÑA ───────────────────────────────────────────────────────

const MENSAJES = {
    banner_agregado:   'Banner agregado correctamente.',
    banner_login_ok:   'Banner de login actualizado.',
    banner_general_ok: 'Banner general actualizado.',
    estado_ok:         'Estado de campaña actualizado.',
    cancelacion_ok:    'Tiempo de cancelación actualizado.',
    campania_activada: 'Campaña activada correctamente.'
};

const ERRORES = {
    no_banner:        'Selecciona una imagen para subir.',
    ya_activa:        'Ya existe otra campaña activa. No pueden coexistir dos campañas activas.',
    error_banner:     'Error al procesar el banner.',
    error_estado:     'Error al cambiar el estado.',
    error_cancelacion:'Error al actualizar el tiempo de cancelación.',
    sin_campania:     'Selecciona una campaña para activar.'
};

exports.getConfigurarCampania = async (req, res) => {
    const mensaje = MENSAJES[req.query.mensaje] || null;
    const error   = ERRORES[req.query.error]   || null;

    try {
        const campania = await Configuracion.ObtenerConfiguracionActiva();
        let banners = [];
        if (campania) {
            banners = await Configuracion.obtenerBannersDeCampania(campania.id_campania);
        }
        const todasCampanias = await Configuracion.fetchAllCampanias();

        res.render('admin/home_configurarCampania', {
            usuario: req.session.usuario,
            campania: campania || null,
            banners,
            todasCampanias,
            mensaje,
            error
        });
    } catch (err) {
        console.error('Error cargando configuración:', err);
        res.render('admin/home_configurarCampania', {
            usuario: req.session.usuario,
            campania: null,
            banners: [],
            todasCampanias: [],
            mensaje: null,
            error: 'Error al cargar la configuración'
        });
    }
};

exports.postAgregarBanner = async (req, res) => {
    try {
        if (!req.files?.banner?.[0]) {
            return res.redirect('/admin/configurar_campania?error=no_banner');
        }
        const { id_camp } = req.body;
        const filename = req.files['banner'][0].filename;
        await Configuracion.agregarBanner(parseInt(id_camp), filename);
        log('ADMIN', 'CAMPANIA', `id: ${req.session.usuario} — banner agregado a campaña ${id_camp}`);
        res.redirect('/admin/configurar_campania?mensaje=banner_agregado');
    } catch (err) {
        console.error('Error agregando banner:', err);
        res.redirect('/admin/configurar_campania?error=error_banner');
    }
};

exports.postCambiarBannerLogin = async (req, res) => {
    try {
        const { id_campania, id_configuraciones } = req.body;
        await Configuracion.actualizarCampania(parseInt(id_campania), {
            banner_login: parseInt(id_configuraciones)
        });
        log('ADMIN', 'CAMPANIA', `id: ${req.session.usuario} — banner login → cfg ${id_configuraciones}`);
        res.redirect('/admin/configurar_campania?mensaje=banner_login_ok');
    } catch (err) {
        console.error('Error cambiando banner login:', err);
        res.redirect('/admin/configurar_campania?error=error_banner');
    }
};

exports.postCambiarBannerGeneral = async (req, res) => {
    try {
        const { id_campania, id_configuraciones } = req.body;
        await Configuracion.actualizarCampania(parseInt(id_campania), {
            banner_general: parseInt(id_configuraciones)
        });
        log('ADMIN', 'CAMPANIA', `id: ${req.session.usuario} — banner general → cfg ${id_configuraciones}`);
        res.redirect('/admin/configurar_campania?mensaje=banner_general_ok');
    } catch (err) {
        console.error('Error cambiando banner general:', err);
        res.redirect('/admin/configurar_campania?error=error_banner');
    }
};

exports.postCambiarEstado = async (req, res) => {
    try {
        const { id_campania, activo } = req.body;
        const quiereActiva = activo === 'true';

        if (quiereActiva && await Configuracion.hayOtraActiva(parseInt(id_campania))) {
            return res.redirect('/admin/configurar_campania?error=ya_activa');
        }

        await Configuracion.actualizarCampania(parseInt(id_campania), { activo: quiereActiva });
        
        if (quiereActiva) {
            await Configuracion.activarProductosDeCampania(parseInt(id_campania));
        } else {
            await Configuracion.desactivarProductosDeCampania(parseInt(id_campania));
        }
        
        log('ADMIN', 'CAMPANIA', `id: ${req.session.usuario} — estado campaña ${id_campania}: ${quiereActiva}`);
        res.redirect('/admin/configurar_campania?mensaje=estado_ok');
    } catch (err) {
        console.error('Error cambiando estado:', err);
        res.redirect('/admin/configurar_campania?error=error_estado');
    }
};

exports.postActivarCampania = async (req, res) => {
    try {
        const { id_campania } = req.body;
        if (!id_campania) {
            return res.redirect('/admin/configurar_campania?error=sin_campania');
        }
        if (await Configuracion.hayOtraActiva()) {
            return res.redirect('/admin/configurar_campania?error=ya_activa');
        }
        await Configuracion.actualizarCampania(parseInt(id_campania), { activo: true });
        await Configuracion.activarProductosDeCampania(parseInt(id_campania));
        log('ADMIN', 'CAMPANIA', `id: ${req.session.usuario} — campaña ${id_campania} activada`);
        res.redirect('/admin/configurar_campania?mensaje=campania_activada');
    } catch (err) {
        console.error('Error activando campaña:', err);
        res.redirect('/admin/configurar_campania?error=error_estado');
    }
};

exports.postCambiarCancelacion = async (req, res) => {
    try {
        const { id_campania, tiempo_de_cancelacion } = req.body;
        await Configuracion.actualizarCampania(parseInt(id_campania), {
            tiempo_de_cancelacion: parseInt(tiempo_de_cancelacion)
        });
        log('ADMIN', 'CAMPANIA', `id: ${req.session.usuario} — tiempo cancelación campaña ${id_campania}: ${tiempo_de_cancelacion} min`);
        res.redirect('/admin/configurar_campania?mensaje=cancelacion_ok');
    } catch (err) {
        console.error('Error cambiando tiempo cancelación:', err);
        res.redirect('/admin/configurar_campania?error=error_cancelacion');
    }
};
