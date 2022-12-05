const LocalStorage = require('node-localstorage').LocalStorage;   
localStorage = new LocalStorage('./scratch');

exports.verifyLogin = (request, response, next)=>{
    if (!localStorage.getItem('token')){
        return response.redirect('/login')
        
    }
    next();
}   
exports.verifyLogout = (request, response, next)=>{
    if (localStorage.getItem('token')){
        return response.redirect('/')
        
    }
    next();
}  
