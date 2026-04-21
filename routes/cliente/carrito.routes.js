const express = require('express');
const router = express.Router();

const carritoController = require("../../controllers/cliente/carrito.controller")
const cartCount = require("../../utils/cartcount")

// carrito.routes.js
router.get('/',cartCount, carritoController.getCarrito);

// Agregar producto al carrito
router.post('/items', carritoController.agregarItem);

// Modificar cantidad
router.post('/items/:id_producto', carritoController.actualizarItem);


module.exports = router;

