const express = require('express');
const router = express.Router();

const adminHistorialController = require('../../controllers/admin_hist_ordenes.controller');

// Ruta /admin/orders
router.get('/orders', adminHistorialController.getHistorialOrdenes);

// Ruta /admin/orders/:id
router.get('/orders/:id', adminHistorialController.getDetalleOrden);

module.exports = router;