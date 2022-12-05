//Constantes y Variables
const express = require('express');
const app = express();
const morgan = require('morgan');
const path = require('path');
const Sequelize = require('sequelize');
const routes = require('./routes/router')
const seq = require('./src/config/db/config')
const webpayPlusRouter = require("./routes/webpay_plus");
const bodyParser = require('body-parser');
const { parseArgs } = require('util');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const PassportLocal = require('passport-local').Strategy;

//Config
app.set('appName', 'AppNotariaWeb')
app.set('port', 3000)
app.set('case sensitive routing', true)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'src/static/views'))

//Middleware
app.use( bodyParser.urlencoded({ extended: true }) ); //middleware para que node reconozca lo que hay dentro de req
//app.use( express.urlencoded({ extended: true }) );
app.use(cookieParser('mi hyper super secreto'));
app.use(session({
    secret:'mi hyper super secreto',
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());

passport.use(new PassportLocal(async function(username,password,done){
    const select = await seq.query(`select rut, contraseña, nombre + ' ' + apellido_paterno + ' ' + apellido_materno as nombre from usuario where rut='${username}' and contraseña='${password}'`, {type: Sequelize.QueryTypes.SELECT});
    for(let u = 0; u < select.length; u++){
        console.log(select[u].rut);
        console.log(select[u].contraseña);
        if(username === select[u].rut && password === select[u].contraseña)
            return done(null,{ id: username, name: select[u].nombre});
        done(null, false);
    };
}));

passport.serializeUser(function(user,done){
    done(null,user.id)
})

passport.deserializeUser(function(id,done){
    done(null, { id: 1, name: "Cody"})
})

app.use(express.json());
app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, './src/static')));

app.use("/webpay_plus", webpayPlusRouter);

app.use(routes);

app.get("/registro", (req,res,next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect("/login")
},(req, res)=>{
    //si iniciamos mostrar bienvenida

    //si no mostrar login
    res.render('inicio');
})

app.get("/login",(req, res)=>{
    //mostrar formulario de login
    res.render('login');
})

app.post("/login", passport.authenticate('local',{
    successRedirect: '/',
    failureRedirect: '/login'
}));

app.listen(app.get('port'))

console.log(`Server ${app.get('appName')} on port ${app.get('port')}`);

