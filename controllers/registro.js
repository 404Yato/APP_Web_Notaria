const seq = require('../src/config/db/config');
const Sequelize = require('sequelize');
const asyncHandler = require("../utils/async_handler");
const { response } = require('express');
const ejs = require('ejs');
const express = require('express');
const app = express();
const {encrypt} = require('../utils/handleBcrypt');

exports.save = asyncHandler(async function (req, res) {
    const rut = req.body.rut;
    const nombre = req.body.nombre;
    const apaterno = req.body.apaterno;
    const amaterno = req.body.amaterno;
    const celular = req.body.celular;
    const pass = await encrypt(req.body.pass);
    const email = req.body.email;
    const comuna = req.body.comuna;
    console.log(rut + " - " + nombre + " - " + apaterno + " - " + amaterno + " - " + celular + " - " + pass + " - " + email + " - " + comuna);
    const insert = await seq.query(`insert into usuario (rut, nombre, apellido_paterno, apellido_materno, fono, contraseña, email, cod_comuna) values('${rut}', '${nombre}', '${apaterno}', '${amaterno}', '${celular}', '${pass}', '${email}', '${comuna}')`, {type: Sequelize.QueryTypes.INSERT});
    res.redirect('/login');
})