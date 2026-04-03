const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(express.json());

// Skip real DB connection while running tests.
if (process.env.NODE_ENV !== 'test') {
    const MONGO_URI = process.env.DB_URI || 'mongodb://user_db:27017/users';
    mongoose.connect(MONGO_URI)
        .then(() => console.log('User DB (MongoDB) baglandi!'))
        .catch((err) => console.error('User DB baglanti hatasi:', err));
}

app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`User Service ${PORT} portunda calisiyor`);
    });
}

module.exports = app;
