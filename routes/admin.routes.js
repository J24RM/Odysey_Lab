// Rutas admin

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const adminEstadisticasController = require('../controllers/admin_estadisticas.controller');
const adminHistorialOrdenesController = require('../controllers/admin_hist_ordenes.controller');
const adminClientesController = require('../controllers/admin_clientes.controller');
const productoController = require('../controllers/producto.controller');

//Ruta /adminhome
router.get('/home', authController.getAdminHome);

//Ruta /admin/home_agregarProducto
router.get('/home_agregarProducto', authController.getAdminAgregarProducto);

//Ruta /admin/home_eliminarProducto
router.get('/home_eliminarProducto', authController.getAdminEliminarProducto);

//Ruta /admin/stats
router.get('/stats', adminEstadisticasController.getEstadisticas);

//Ruta /admin/orders
router.get('/orders', adminHistorialOrdenesController.getHistorialOrdenes);
router.get('/orders/:id', adminHistorialOrdenesController.getDetalleOrden);

//Ruta /admin/clients
router.get('/clients', adminClientesController.getAdminClientes);
router.get('/clients/:id', adminClientesController.getDetalleCliente);

//Ruta /admin/product/:id
router.get('/product/:id', productoController.getProductoAdmin);

module.exports = router;
