const express = require('express');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_GIZLI_ANAHTAR_123';

// JWT Auth Middleware
function authMiddleware(req, res, next) {
    // Sadece health endpointi public, diğerleri JWT ister
    if (req.method === 'GET' && req.path === '/health') {
        return next();
    }
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token gerekli veya format hatalı' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token' });
    }
}

// Auth middleware'i tüm route'lara uygula
router.use(authMiddleware);

// @route   POST /api/orders
// @desc    Yeni Sipariş Ekle
router.post('/', async (req, res) => {
    try {
        const order = await Order.create(req.body);
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: 'Geçersiz veri', error: error.message });
    }
});

// @route   GET /api/orders
// @desc    Tüm Siparişleri Listele
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find({});
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
});

// @route   GET /api/orders/:id
// @desc    Tekil Sipariş Getir
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Sipariş bulunamadı' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
});

// @route   PUT /api/orders/:id
// @desc    Sipariş Durumunu Güncelle
router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Güncellenecek Sipariş bulunamadı' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Geçersiz veri', error: error.message });
    }
});

// @route   DELETE /api/orders/:id
// @desc    Siparişi Sil
router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (order) {
            res.status(200).json({ message: 'Sipariş başarıyla iptal edildi / silindi' });
        } else {
            res.status(404).json({ message: 'Silinecek sipariş bulunamadı' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
});

module.exports = router;
