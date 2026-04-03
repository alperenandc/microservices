const express = require('express');
const app = express();

// ÜRÜN LİSTESİ 
app.get('/api/products', (req, res) => {
    res.json([{ id: 101, name: "Klavye" }, { id: 102, name: "Mouse" }]);
});

app.listen(3002, () => console.log("Product odası 3002 portunda hazır!"));