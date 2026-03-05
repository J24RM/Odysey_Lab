const express = require('express');
const router = express.Router();

const cliente_navbarController = require("../controllers/cliente_navbar.controllers")

router.get('/mis_pedidos', cliente_navbarController.getMisPedidos);

router.get('/mi_carrito', cliente_navbarController.getMiCarrito);




module.exports = router;