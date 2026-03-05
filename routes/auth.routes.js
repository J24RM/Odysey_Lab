//Rutas

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');


//Ruta get para mostrar formulario de inicio de sesion
router.get('/login', authController.getLogin);

//Ruta post para procesar la respuesta del formulario
router.post('/login', authController.postLogin);

//Ruta protegida, solo accesible si hay sesion
router.get('/admin_home', authController.getHome);

//Ruta protegida, solo accesible si hay sesion, Vista del Cliente
router.get('/cliente_home', authController.getHomeCliente);

//Ruta del boton de "Cerrar sesion"
router.get('/logout', authController.logout);

// Ruta protegida, sirve para mostrar el perfil de usuario
router.get('/mi_perfil', authController.getMiPerfil);

module.exports = router;