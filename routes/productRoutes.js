const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// @route   POST /api/products
// @desc    Yeni Ürün Ekle (Create)
router.post('/', async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: 'Geçersiz veri', error: error.message });
    }
});

// @route   GET /api/products
// @desc    Tüm Ürünleri Listele (Read All)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
});

// @route   GET /api/products/:id
// @desc    Tekil Ürün Getir (Read One)
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Ürün bulunamadı' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
});

// @route   PUT /api/products/:id
// @desc    Ürün Güncelle (Update)
router.put('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Güncellenecek ürün bulunamadı' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Geçersiz veri', error: error.message });
    }
});

// @route   DELETE /api/products/:id
// @desc    Ürün Sil (Delete)
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (product) {
            // RMM Level 2: Silme durumunda 204 No Content veya 200 OK + Mesaj dönülür.
            res.status(200).json({ message: 'Ürün başarıyla silindi' });
        } else {
            res.status(404).json({ message: 'Silinecek ürün bulunamadı' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
});

module.exports = router;
