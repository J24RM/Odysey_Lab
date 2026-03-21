//Rutas cliente

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const productoController = require('../controllers/producto.controller');
const carritoController = require('../controllers/carrito.controller');
const cuentaController = require('../controllers/cuenta.controller');
const clienteController = require('../controllers/cliente.controllers');

//Ruta get para pagina principal
router.get('/home', authController.getClienteHome);

//Ruta get para detalle de producto
router.get('/product/:id', productoController.getProductoCliente);

//Ruta get para el carrito
router.get('/cart', carritoController.getCarrito);

//Ruta post para gregar producto al carrito
router.post('/cart/items', carritoController.agregarItem);

//Ruta put para modificar cantidad
router.put('/cart/items/:producto_id', carritoController.actualizarItem);

//Ruta delete para eliminar producto
router.delete('/cart/items/:producto_id', carritoController.eliminarItem);

//Ruta get para ver el perfil
router.get('/profile', cuentaController.getProfile);

//Cambiar de cuenta
router.post('/profile/cuenta-activa', clienteController.setCuentaActiva);

//Cambiar de sucursal
router.post('/profile/sucursal-activa', clienteController.setSucursalActiva);

module.exports = router;
