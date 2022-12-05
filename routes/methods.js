const express = require('express')
const router = express.Router()
const ejs = require('ejs')

let products = [
    {
        id: 1,
        name: "Mouse",
        price: 3000
    }
];

router.get('/products', (req, res) => {
    res.json(products)
})

router.post('/products', (req, res) => {
    const newProduct = {...req.body, id: products.length + 1};
    products.push(newProduct);
    res.send(newProduct);
})

router.put('/products/:id', (req, res) => {
    const newData = req.body
    const productFound = products.find(
        (product) => product.id ===parseInt(req.params.id)
    );
    if (!productFound)
        return res.status(404).json({
            message: "Product not found",
        });
    products = products.map(p => p.id === parseInt(req.params.id) ? {...p, ...newData} : p)
    res.json({
        message: "Product Updated Succefully"
    })
})

router.delete('/products/:id', (req, res) => {
    const productFound = products.find(
        (product) => product.id ===parseInt(req.params.id)
    );
    if (!productFound)
        return res.status(404).json({
            message: "Product not found",
        })
    const newProducts = products.filter(p => p.id !== parseInt(req.params.id))
        console.log(newProducts);
    res.send('Eliminando Productos')
})

router.get('/products/:id', (req, res) => {
    
    const productFound = products.find(
        (p) => p.id === parseInt(req.params.id)
    )
    
    if(!productFound) return res.status(404).json({
        message: "Product Not Found"
    })
    
    console.log(productFound)
    res.json(productFound)
})

module.exports = router;