const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');
const seq = require('../src/config/db/config')
const asyncHandler = require("../utils/async_handler");
const LocalStorage = require('node-localstorage').LocalStorage;   
const {compare} = require('../utils/handleBcrypt');



exports.login = asyncHandler(async function (request, response) {
    const {username, password} = request.body
    
    const select = await seq.query(`select rut, nombre + ' ' + apellido_paterno as nombreCompleto, contraseña from usuario where rut='${username}'`, {type: Sequelize.QueryTypes.SELECT});
    
    if(select.length == 0){
        return response.render('login', {message: 'Rut no encontrado'})
    } 
    const checkPassword = await compare(password, select[0].contraseña)
    
    if(!checkPassword){
        return response.render('login', {message: 'Contraseña incorrecta'})
    }
    const token = createToken(username, select[0].nombreCompleto)
    localStorage = new LocalStorage('./scratch');
    localStorage.setItem('token', token);
    response.redirect('/')
})



const createToken = (username, nombreCompleto) => {

    try {
        const token = jwt.sign({username: username, nombreCompleto: nombreCompleto}, 'key', { expiresIn: '1h' });  
        return token;
        
    } catch (error) {
        return error.message || 'error inesperado'
    }
}

exports.logout = asyncHandler(async function (request, response){
    localStorage.removeItem('token')
    console.log(localStorage.getItem('token'))
    response.redirect('/')
  })

exports.DestranformarToken = () => {
    let rutLogin = ""
    if (localStorage.getItem('token')){
      const {username, nombreCompleto} = JSON.parse(Buffer.from(localStorage.getItem('token').split('.')[1], 'base64').toString());
      rutLogin = {username, nombreCompleto}
    }
    return rutLogin
}




