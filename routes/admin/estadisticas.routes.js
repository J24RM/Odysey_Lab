const express = require('express');
const router = express.Router();

const adminEstadisticasController = require('../../controllers/admin_estadisticas.controller');

// Ruta /admin/stats
router.get('/stats', adminEstadisticasController.getEstadisticas);
router.get('/stats/sucursales', adminEstadisticasController.getEstadisticasSucursales);
router.get('/stats/productos', adminEstadisticasController.getEstadisticasProductos);
router.get('/stats/productos/exportar', adminEstadisticasController.exportarEstadisticasProductosCSV);
router.get('/stats/productos/:id_producto', adminEstadisticasController.getEstadisticasDetalleProducto)

module.exports = router;