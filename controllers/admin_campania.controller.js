const Configuracion = require('../models/configuracion.model');
const { log } = require('../utils/logger');

exports.getCampania = async (req, res) => {
    try {
        const config = await Configuracion.ObtenerConfig();
        res.render('admin/campania', {
            usuario: req.session.usuario,
            config: config || {},
            mensaje: null,
            error: null
        });
    } catch (err) {
        console.error('Error cargando campaña:', err);
        res.render('admin/campania', {
            usuario: req.session.usuario,
            config: {},
            mensaje: null,
            error: 'Error al cargar la configuración'
        });
    }
};

exports.postCampania = async (req, res) => {
    try {
        const { nombre, fecha_de_fin, activo } = req.body;

        const campos = {
            nombre:       nombre       || null,
            fecha_de_fin: fecha_de_fin || null,
            activo:       activo === 'true',
        };

        if (req.files && req.files['banner_login'] && req.files['banner_login'][0]) {
            campos.banner_login_url = req.files['banner_login'][0].filename;
        }
        if (req.files && req.files['banner_timer'] && req.files['banner_timer'][0]) {
            campos.banner_general_url = req.files['banner_timer'][0].filename;
        }

        await Configuracion.GuardarConfig(campos);
        log('ADMIN', 'CAMPANIA', `id: ${req.session.usuario} — configuración actualizada`);

        const config = await Configuracion.ObtenerConfig();
        res.render('admin/campania', {
            usuario: req.session.usuario,
            config: config || {},
            mensaje: 'Configuración guardada correctamente',
            error: null
        });
    } catch (err) {
        console.error('Error guardando campaña:', err);
        const config = await Configuracion.ObtenerConfig().catch(() => null);
        res.render('admin/campania', {
            usuario: req.session.usuario,
            config: config || {},
            mensaje: null,
            error: 'Error al guardar la configuración'
        });
    }
};
