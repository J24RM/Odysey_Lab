const express = require('express');
const router  = express.Router();
const campaniaController = require('../../controllers/admin_campania.controller');

// Agregar campaña
router.get('/agregar_campania',  campaniaController.getAgregarCampania);
router.post('/agregar_campania', campaniaController.postAgregarCampania);

// Configurar campaña activa
router.get('/configurar_campania',                        campaniaController.getConfigurarCampania);
router.post('/configurar_campania/activar',               campaniaController.postActivarCampania);
router.post('/configurar_campania/agregar_banner',        campaniaController.postAgregarBanner);
router.post('/configurar_campania/banner_login',          campaniaController.postCambiarBannerLogin);
router.post('/configurar_campania/banner_general',        campaniaController.postCambiarBannerGeneral);
router.post('/configurar_campania/estado',                campaniaController.postCambiarEstado);
router.post('/configurar_campania/cancelacion',           campaniaController.postCambiarCancelacion);

// Redirigir URL antigua
router.get('/campania', (req, res) => res.redirect('/admin/configurar_campania'));

module.exports = router;
