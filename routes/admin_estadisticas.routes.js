//Ruta a Estadisticas

const express = require('express');
const router = express.Router();

const estadisticasController = require('../controllers/admin_estadisticas.controller');

router.get('/admin_estadisticas', estadisticasController.getEstadisticas);
router.get('/admin_estadisticas2', estadisticasController.getEstadisticas2);

module.exports = router;
