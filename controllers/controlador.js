const Sequelize = require('sequelize');
const seq = require('../src/config/db/config')
const ejs = require('ejs')
const asyncHandler = require("../utils/async_handler");
const { response } = require('express');
const WebpayPlus = require("transbank-sdk").WebpayPlus;
const {encrypt, compare} = require('../utils/handleBcrypt');
const login = require('../auth/auth');
const LocalStorage = require('node-localstorage').LocalStorage; 
localStorage = new LocalStorage('./scratch');  

exports.historialDoc = asyncHandler(async function (request, response, next){
  const {username, nombreCompleto} = login.DestranformarToken()
    let documentos = await seq.query(`EXEC sp_historial_doc '${username}'`, { type: Sequelize.QueryTypes.SELECT })
    const newDoc = documentos.map(d => {
        const doc64 = Buffer.from(d.copia_documento).toString('base64')
        delete d.copia_documento
        return {
            ...d, doc64
        }
    })
    response.render('historial_documentos', {newDoc, username: username, nombreCompleto: nombreCompleto})
});

exports.tipoTramite = asyncHandler(async function (request, response){
  const {username, nombreCompleto} = login.DestranformarToken()
  const tramite = await seq.query('select * from tipo_tramite', { type: Sequelize.QueryTypes.SELECT }) 
    
    
    response.render('inicio',{tramite, username: username, nombreCompleto: nombreCompleto})
});


exports.tramitePag = asyncHandler(async function (request, response){
  const {username, nombreCompleto}  = login.DestranformarToken();
    const{id} = request.params 
    const tramite = await seq.query(`select * from tipo_tramite where cod_tramite = ${id} `, { type: Sequelize.QueryTypes.SELECT })
    let buyOrder = "O-" + Math.floor(Math.random() * 10000) + 1;
    let sessionId = "S-" + Math.floor(Math.random() * 10000) + 1;
    let amount = tramite[0].precio;
    let returnUrl =
        request.protocol + "://" + request.get("host") + "/commit";

    const createResponse = await (new WebpayPlus.Transaction()).create(
        buyOrder,
        sessionId,
        amount,
        returnUrl
    );

    let token = createResponse.token;
    let url = createResponse.url;

    let viewData = {
        buyOrder,
        sessionId,
        amount,
        returnUrl,
        token,
        url,
    };
    
    response.render('documentos',{tramite, viewData, username: username, nombreCompleto: nombreCompleto})   
});

exports.commit = asyncHandler(async function (request, response, next) {
  const {username, nombreCompleto}  = login.DestranformarToken();
    //Flujos:
    //1. Flujo normal (OK): solo llega token_ws
    //2. Timeout (más de 10 minutos en el formulario de Transbank): llegan TBK_ID_SESION y TBK_ORDEN_COMPRA
    //3. Pago abortado (con botón anular compra en el formulario de Webpay): llegan TBK_TOKEN, TBK_ID_SESION, TBK_ORDEN_COMPRA
    //4. Caso atipico: llega todos token_ws, TBK_TOKEN, TBK_ID_SESION, TBK_ORDEN_COMPRA
    console.log("================================================================================");
    console.log(request);
    console.log("================================================================================");
    let params = request.method === 'GET' ? request.query : request.body;
  
    let token = params.token_ws;
    let tbkToken = params.TBK_TOKEN;
    let tbkOrdenCompra = params.TBK_ORDEN_COMPRA;
    let tbkIdSesion = params.TBK_ID_SESION;
  
    let message = null;
    let messageDescription = null;
    let viewData = {
      token,
      tbkToken,
      tbkOrdenCompra,
      tbkIdSesion
    };
  
    if (token && !tbkToken) {//Flujo 1
      const commitResponse = await (new WebpayPlus.Transaction()).commit(token);
      message = "Compra realizada con éxito"
      messageDescription = "Puedes revisar tu documento en el historial de documentos de tu cuenta o descargarlo a continuación"
      viewData = {
        token,
        commitResponse,
      };
      response.render("webpay_commit", {viewData,  username: username, nombreCompleto: nombreCompleto});
      return;
    }
    else if (!token && !tbkToken) {//Flujo 2
      message = "El pago fue anulado por tiempo de espera.";
      messageDescription = "Tiempo de espera de pago agotado";
    }
    else if (!token && tbkToken) {//Flujo 3
      message = "Se canceló la compra del documento";
      messageDescription = "Puedes seguir navegando presionando el botón a continuación";
    }
    else if (token && tbkToken) {//Flujo 4
      message = "El pago es inválido.";
      messageDescription = "Ocurrio un error inesperado con el pago o tu tarjeta, intentalo nuevamente";
    }
    response.render("commit-error", {
      message: message,
      messageDescription: messageDescription,
      viewData: viewData,
      username: username, 
      nombreCompleto: nombreCompleto
    });
  });

exports.cargarFormReserva = (request, response) =>{
  const {username, nombreCompleto}  = login.DestranformarToken();
  response.render('newReserva', {username: username, nombreCompleto: nombreCompleto})

}

exports.CrearReserva = asyncHandler(async function (request, response) {
  const {username}  = login.DestranformarToken();
  const { fecha , motivo} = request.body
  const respuesta = await seq.query(`insert into reserva (fecha_hora, motivo, estado, usuario_rut, cod_tramite) values('${fecha}', '${motivo}', 'Reservada', '${username}', 1)`, {type: Sequelize.QueryTypes.INSERT});
  
  response.redirect('/')

})

exports.ListarReservas = asyncHandler(async function (request, response) {
  const {username, nombreCompleto}   = login.DestranformarToken();
  const reservas = await seq.query(`exec nombreTramite '${username}'`, { type: Sequelize.QueryTypes.SELECT })
  response.render('historialReservas', {reservas, username: username, nombreCompleto: nombreCompleto})
})

exports.EliminarReservas = asyncHandler(async function(request, response) {
    let id = request.params.id
    await seq.query(`DELETE FROM reserva WHERE cod_reserva = ${id}`, { type: Sequelize.QueryTypes.DELETE })
    response.redirect('/historialReservas')
})

exports.ModificarReservas = asyncHandler(async function (request, response) {
  
    let id = request.params.id
    const { motivo, fecha } = request.body
    await seq.query(`update reserva set motivo = '${motivo}', fecha_hora = '${fecha}' where cod_reserva = ${id}`, { type: Sequelize.QueryTypes.UPDATE })
    response.redirect('/historialReservas')
})

exports.FormReserva = asyncHandler(async function (request, response) {
  const {username, nombreCompleto}   = login.DestranformarToken();
    let id = request.params.id
    const reservas = await seq.query(`select fecha_hora, motivo, cod_reserva from reserva where cod_reserva = ${id}`, { type: Sequelize.QueryTypes.SELECT })
    console.log(reservas)
    response.render('modificarReserva', {reservas, username: username, nombreCompleto: nombreCompleto} )
})

exports.Encriptar = asyncHandler(async function (request, response) {
  const {email, password, name} = request.body
  const passwordHash = await encrypt(password)
  const usuario = [{
    email: email,
    password: passwordHash,
    name: name
  }]
  console.log(usuario)
  response.json(usuario)
})

exports.Comparar = async function (request, response) {
  const {email, password} = request.body
  const hashPassword = '$2a$10$rgO/yNKak0ASxx5Im4elnuJaqimibKtbeHvbHytm.IOshdx3MCZqq'
  const checkPassword = await compare(password, hashPassword)
  if (checkPassword) {
    console.log('Funciono')
    response.send('Funciono')
  }
}


