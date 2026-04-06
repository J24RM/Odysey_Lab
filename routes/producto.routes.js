const express = require('express');
const router = express.Router();

const productoController = require("../controllers/producto.controller")

router.get('/',productoController.getProductos); // Aqui como le hago para limitar a 20?

router.get('/:id', productoController.getProductoCliente);


module.exports = router;