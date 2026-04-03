const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken'); // Yeni eklendi
const mongoose = require('mongoose');
const Log = require('./models/Log');

// Loglama mekanizması vs..
if (process.env.NODE_ENV !== 'test') {
    const mongoUri = process.env.DB_URI || 'mongodb://dispatcher_db:27017/dispatcher_logs';
    mongoose.connect(mongoUri)
        .then(() => console.log('Dispatcher DB (Logs) bağlandı!'))
        .catch(err => console.error('Dispatcher DB bağlantı hatası:', err));
}

const app = express();
app.use(express.json());

// ARAYÜZ DOSYALARI (UI) İÇİN STATİK KLASÖR
app.use('/ui', express.static(__dirname + '/public'));

// TÜM İSTEKLERİ LOGLA
app.use(async (req, res, next) => {
    try {
        await Log.create({
            method: req.method,
            url: req.originalUrl || req.url,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
    } catch (error) {
        console.error("Loglama hatası:", error);
    }
    next();
});

// GÜVENLİK KONTROLÜ (JWT AUTH) [Network Isolation Merkezi Yeri]
const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_GIZLI_ANAHTAR_123';

// Bu rotalar Kimlik/Authorization gerektirmez
const publicRoutesPost = ['/api/users/login', '/api/users'];
const publicRoutesGet = ['/api/logs', '/ui'];

app.use((req, res, next) => {
    if (req.method === 'POST' && publicRoutesPost.includes(req.url)) return next();
    if (req.method === 'GET' && publicRoutesGet.some(route => req.url.startsWith(route))) return next();

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Access Denied: No Token Provided" });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Tokeni Çöz (Gerçek JWT onayı)
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; // Alt servislere gönderilmek istenirse header'a inject edilebilir
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid Token" });
    }
});

// YÖNLENDİRME (PROXY) - RMM Seviye 2

// UI Log Listesi Endpointi
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await Log.find().sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Logs fetching error" });
    }
});

// Tüm kullanıcı isteklerini yönlendir (User Service)
app.use('/api/users', async (req, res) => {
    try {
        const targetUrl = `http://user_service:3001/api/users${req.url === '/' ? '' : req.url}`;
        const result = await axios({
            method: req.method,
            url: targetUrl,
            data: req.body,
            headers: { 'Authorization': req.headers['authorization'] }
        });
        res.status(result.status).json(result.data);
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        const data = error.response ? error.response.data : { error: "Service Unavailable" };
        res.status(status).json(data);
    }
});

// Tüm ürün isteklerini yönlendir (Product Service)
app.use('/api/products', async (req, res) => {
    try {
        const targetUrl = `http://product_service:3002/api/products${req.url === '/' ? '' : req.url}`;
        const result = await axios({
            method: req.method,
            url: targetUrl,
            data: req.body,
            headers: { 'Authorization': req.headers['authorization'] }
        });
        res.status(result.status).json(result.data);
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        const data = error.response ? error.response.data : { error: "Service Unavailable" };
        res.status(status).json(data);
    }
});

// Tüm sipariş isteklerini yönlendir (Order Service)
app.use('/api/orders', async (req, res) => {
    try {
        const targetUrl = `http://order_service:3003/api/orders${req.url === '/' ? '' : req.url}`;
        const result = await axios({
            method: req.method,
            url: targetUrl,
            data: req.body,
            headers: { 'Authorization': req.headers['authorization'] }
        });
        res.status(result.status).json(result.data);
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        const data = error.response ? error.response.data : { error: "Service Unavailable" };
        res.status(status).json(data);
    }
});

module.exports = app;