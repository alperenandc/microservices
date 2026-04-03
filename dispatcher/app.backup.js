const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// GÜVENLİK KONTROLÜ (AUTH) [cite: 40]
app.use((req, res, next) => {
    const token = req.headers['authorization'];
    if (token === 'SECRET123') return next(); // Biletin varsa geç
    res.status(401).json({ error: "Hop hemşerim biletin yok!" }); // Yoksa 401 hatası [cite: 41]
});

// YÖNLENDİRME (PROXY) [cite: 39]
app.use('/api/users', async (req, res) => {
    const result = await axios.get('http://user_service:3001/api/users');
    res.json(result.data);
});

module.exports = app;
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Dispatcher ${PORT} portunda nöbette!`));