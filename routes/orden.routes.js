const express = require('express');
const router = express.Router();

const ordenesController = require("../controllers/orden.controller.js")
const cartCount = require("../utils/cartcount")


router.get("/pdf/:id_orden", ordenesController.getPdfOrden);
router.get("/detalle/:id_orden",cartCount ,ordenesController.getDetalleOrden);

// Registrar Orden
router.post("/registrar", ordenesController.registrarOrden);

router.get('/exportar-historial', ordenesController.exportarHistorialPedidosExcel);

// Cancelar Orden
router.post("/cancelar/:id_orden", ordenesController.postCancelarOrden);

router.get("/:id_orden", cartCount, ordenesController.getOrdenes);

router.get("/",cartCount ,  ordenesController.getOrdenes);

module.exports = router;
