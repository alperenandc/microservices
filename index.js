const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');

const app = express();
app.use(express.json());

// RMM Seviye 2 Standartında Ürün Endpoints
app.use('/api/products', productRoutes);

// Kök Test 
app.get('/api/products/health', (req, res) => {
    res.json({ message: 'Product Service Ayakta!' });
});

// Veritabanı Bağlantısı
const MONGO_URI = process.env.DB_URI || 'mongodb://product_db:27017/products';
mongoose.connect(MONGO_URI)
    .then(() => console.log('Product DB (MongoDB) bağlandı!'))
    .catch(err => console.error('Product DB bağlantı hatası:', err));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Product Service ${PORT} portunda çalışıyor`);
});
