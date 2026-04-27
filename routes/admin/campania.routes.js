const express = require('express');
const router = express.Router();
const campaniaController = require('../../controllers/admin_campania.controller');

router.get('/campania', campaniaController.getCampania);
router.post('/campania', campaniaController.postCampania);

module.exports = router;
