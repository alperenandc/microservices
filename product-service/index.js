const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');

const app = express();
app.use(express.json());

app.use('/api/products', productRoutes);

app.get('/api/products/health', (req, res) => {
    res.json({ message: 'Product Service Ayakta!' });
});

// Skip real DB connection while running tests.
if (process.env.NODE_ENV !== 'test') {
    const MONGO_URI = process.env.DB_URI || 'mongodb://product_db:27017/products';
    mongoose.connect(MONGO_URI)
        .then(() => console.log('Product DB (MongoDB) baglandi!'))
        .catch((err) => console.error('Product DB baglanti hatasi:', err));
}

const PORT = process.env.PORT || 3002;
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Product Service ${PORT} portunda calisiyor`);
    });
}

module.exports = app;
