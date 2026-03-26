const express = require('express');
const router = express.Router();

const productoController = require('../../controllers/producto.controller');

// Ruta /admin/product/:id
router.get('/product/:id', productoController.getProductoAdmin);

module.exports = router;