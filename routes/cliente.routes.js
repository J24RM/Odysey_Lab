//Rutas cliente

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const productoController = require('../controllers/producto.controller');
const cuentaController = require('../controllers/cuenta.controller');
const clienteController = require('../controllers/cliente.controllers');
const calificacionController = require('../controllers/calificacion.controller');

//Ruta get para pagina principal
router.get('/home', authController.getClienteHome);

//Ruta get para detalle de producto
router.get('/product/:id', productoController.getProductoCliente);

//Ruta get para ver mis pedidos
router.get('/mis-pedidos', clienteController.getMisPedidos);

//Ruta get para ver el perfil
router.get('/profile', cuentaController.getProfile);

//Cambiar de cuenta
router.post('/profile/cuenta-activa', clienteController.setCuentaActiva);

//Cambiar de sucursal
router.post('/profile/sucursal-activa', clienteController.setSucursalActiva);

//Calificar producto
router.post('/product/:id/calificacion', calificacionController.postCalificacion);

module.exports = router;
