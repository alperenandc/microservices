const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_GIZLI_ANAHTAR_123';

// @route   POST /api/users
// @desc    Yeni kullanıcı kaydı (Register) - RMM Level 2 (POST method)
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Kullanıcı var mı kontrolü
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'Bu kullanıcı adı zaten alınmış.' });
        }

        const user = await User.create({ username, password, role });
        
        // Başarılı oluşturma (201 Created)
        res.status(201).json({
            _id: user._id,
            username: user.username,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
});

// @route   POST /api/users/login
// @desc    Kullanıcı girişi ve JWT Üretimi (Login)
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (user && (await user.matchPassword(password))) {
            // Token üretimi
            const token = jwt.sign(
                { id: user._id, role: user.role }, 
                JWT_SECRET, 
                { expiresIn: '1d' }
            );

            res.json({
                _id: user._id,
                username: user.username,
                role: user.role,
                token: token
            });
        } else {
            res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
});


// JWT Auth Middleware
function authMiddleware(req, res, next) {
    // Sadece register ve login public, diğerleri JWT ister
    if (
        (req.method === 'POST' && req.path === '/') ||
        (req.method === 'POST' && req.path === '/login')
    ) {
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

// @route   GET /api/users
// @desc    Tüm kullanıcıları getir (Sadece test ve admin amaçlı)
// @access  Sadece JWT ile erişilebilir
router.get('/', async (req, res) => {
    try {
        const users = await User.find({}).select('-password'); // Parolayı hariç tut
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
});

module.exports = router;
