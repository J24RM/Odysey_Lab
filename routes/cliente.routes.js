//Rutas cliente

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const productoController = require('../controllers/producto.controller');
const cuentaController = require('../controllers/cuenta.controller');
const clienteController = require('../controllers/cliente.controllers');
const calificacionController = require('../controllers/calificacion.controller');
const cartCount = require("../utils/cartcount")


//Ruta get para pagina principal
router.get('/home',cartCount ,authController.getClienteHome);

//Ruta get para detalle de producto
router.get('/product/:id',cartCount, productoController.getProductoCliente);

//Ruta get para ver mis pedidos
router.get('/mis-pedidos', cartCount,clienteController.getMisPedidos);

//Ruta get para ver el perfil
router.get('/profile', cartCount,cuentaController.getProfile);

//Ruta get para datos del perfil (AJAX)
router.get('/perfil-datos', cuentaController.getProfileData);

//Cambiar de cuenta
router.post('/profile/cuenta-activa', clienteController.setCuentaActiva);

//Cambiar de sucursal
router.post('/profile/sucursal-activa', clienteController.setSucursalActiva);

//Calificar producto
router.post('/product/:id/calificacion', calificacionController.postCalificacion);

module.exports = router;
