const express = require('express');
const router = express.Router();

const productoController = require('../../controllers/producto.controller');

// Ruta /admin/agregar_producto
router.get('/agregar_producto', productoController.getAgregarProducto);
router.post('/agregar_producto', productoController.postAgregarProducto);
router.post('/cargar_imagenes', productoController.postCargarImagenes);
router.post('/cargar_csv', productoController.postCargarCSV);
router.post('/cargar_bulk', productoController.postCargarBulk);

// Ruta /admin/editar_producto - API
router.get('/api/productos', productoController.searchProductos);
router.get('/api/productos/:id', productoController.getFormEditarProducto);
router.post('/editar_producto/:id', productoController.postEditarProducto);

// Ruta /admin/product/:id
router.get('/product/:id', productoController.getProductoAdmin);

module.exports = router;