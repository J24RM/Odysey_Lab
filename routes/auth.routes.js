//Rutas de autenticacion

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');

//Ruta get para mostrar formulario de inicio de sesion
router.get('/login', authController.getLogin);

//Ruta post para procesar la respuesta del formulario
router.post('/login', authController.postLogin);

//Ruta para cerrar sesion
router.get('/logout', authController.logout);

module.exports = router;