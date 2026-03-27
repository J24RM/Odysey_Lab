const express = require('express');
const router = express.Router();

const productoController = require('../../controllers/producto.controller');

// Ruta /admin/agregar_producto
router.get('/agregar_producto', productoController.getAgregarProducto);
router.post('/agregar_producto', productoController.postAgregarProducto);

// Ruta /admin/product/:id
router.get('/product/:id', productoController.getProductoAdmin);

module.exports = router;