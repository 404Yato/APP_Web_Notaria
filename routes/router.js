const express = require('express')
const router = express.Router()
const ejs = require('ejs')
const controller = require('../controllers/controlador')
const Sequelize = require('sequelize');
const seq = require('../src/config/db/config')
const registro = require('../controllers/registro');
const login = require('../auth/auth');
const { request, response } = require('express');
const verifyMiddleware = require('../middleware/verifyLogin');

router.get('/', controller.tipoTramite);
router.get('/historial_doc', verifyMiddleware.verifyLogin, controller.historialDoc)
router.get('/documentos/:id', controller.tramitePag)
router.get('/documento', (req, res) => {
    res.render('documentos')
})

router.get('/newReserva',verifyMiddleware.verifyLogin, controller.cargarFormReserva);
router.post('/newReserva', controller.CrearReserva);

router.get('/historialReservas', verifyMiddleware.verifyLogin, controller.ListarReservas);
router.post('/historialReservas/:id', controller.EliminarReservas);

router.post('/modificarReserva/:id', controller.ModificarReservas);
router.get('/modificarReserva/:id', verifyMiddleware.verifyLogin, controller.FormReserva);

router.post('/registro', registro.save);
router.get('/registro', verifyMiddleware.verifyLogout, (req, res)=>{
    res.render('registro')
});

router.get('/login', verifyMiddleware.verifyLogout,(req, res) => {
    res.render('login', {message: "", username: false})
})

router.post('/login', login.login);
router.get('/logout', login.logout)

router.get("/commit", controller.commit);

module.exports = router;