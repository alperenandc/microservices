const express = require('express');
const mongoose = require('mongoose');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
app.use(express.json());

app.use('/api/orders', orderRoutes);

app.get('/api/orders/health', (req, res) => {
    res.json({ message: 'Order Service Ayakta!' });
});

// Skip real DB connection while running tests.
if (process.env.NODE_ENV !== 'test') {
    const MONGO_URI = process.env.DB_URI || 'mongodb://order_db:27017/orders';
    mongoose.connect(MONGO_URI)
        .then(() => console.log('Order DB (MongoDB) baglandi!'))
        .catch((err) => console.error('Order DB baglanti hatasi:', err));
}

const PORT = process.env.PORT || 3003;
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Order Service ${PORT} portunda calisiyor`);
    });
}

module.exports = app;
