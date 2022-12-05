//Constantes y Variables
const express = require('express');
const app = express();
const morgan = require('morgan');
const path = require('path');
const Sequelize = require('sequelize');
const routes = require('./routes/router')
const seq = require('./src/config/db/config')
const bodyParser = require('body-parser');
const { parseArgs } = require('util')
const { restart } = require('nodemon');

//Config
app.set('appName', 'AppNotariaWeb')
app.set('port', 3000)
app.set('case sensitive routing', true)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'src/static/views'))

//Middleware
app.use( bodyParser.urlencoded({ extended: true }) ); //middleware para que node reconozca lo que hay dentro de req
app.use(express.json());
app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, './src/static')));





app.use(routes)


app.listen(app.get('port'))

console.log(`Server ${app.get('appName')} on port ${app.get('port')}`);