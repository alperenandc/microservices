const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

const app = express();
const INTERNAL_GATEWAY_KEY =
    process.env.INTERNAL_GATEWAY_KEY || 'dispatcher-internal-key';

app.use(express.json());
app.use(morgan('dev'));

function internalGatewayMiddleware(req, res, next) {
    if (req.path === '/health') {
        return next();
    }

    const gatewayKey = req.headers['x-internal-gateway-key'];

    if (gatewayKey !== INTERNAL_GATEWAY_KEY) {
        return res.status(403).json({
            error: true,
            message: "Bu servise sadece dispatcher uzerinden erisilebilir."
        });
    }

    return next();
}

app.use(internalGatewayMiddleware);

// 1. Kendi Bağımsız Veritabanı Modeli (Veri İzolasyonu Kuralı)
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 }
});
const Product = mongoose.model('Product', productSchema);

// 2. Health Check (Dispatcher'ın servisin ayakta olup olmadığını anlaması için)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'product-service' });
});

// =========================================================================
// RMM SEVİYE 2 STANDARTLARINDA RESTFUL API TASARIMI (PROJE İSTERİ 4.1)
// =========================================================================

// CREATE - Yeni Ürün Ekle (POST)
app.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json(newProduct); // 201 Created kuralı
    } catch (error) {
        res.status(400).json({ error: true, message: error.message });
    }
});

// READ - Tüm Ürünleri Getir (GET)
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: true, message: "Sunucu hatası" });
    }
});

// READ - Tek Bir Ürün Getir (GET)
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: true, message: "Ürün bulunamadı" });
        res.status(200).json(product);
    } catch (error) {
        res.status(400).json({ error: true, message: "Geçersiz ID formatı" });
    }
});

// UPDATE - Ürünü Güncelle (PUT)
app.put('/api/products/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProduct) return res.status(404).json({ error: true, message: "Ürün bulunamadı" });
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(400).json({ error: true, message: "Güncelleme hatası" });
    }
});

// DELETE - Ürünü Sil (DELETE)
app.delete('/api/products/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ error: true, message: "Ürün bulunamadı" });
        res.status(204).send(); // RMM kuralı gereği silmede 204 dönülür
    } catch (error) {
        res.status(400).json({ error: true, message: "Silme hatası" });
    }
});

// =========================================================================

// MongoDB Bağlantısı ve Sunucuyu Başlatma
const PORT = process.env.PORT || 3002;
// DİKKAT: Veritabanı ismi product_db olarak izole edildi!
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/product_db';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("Product Service veritabanına başarıyla bağlandı.");
        app.listen(PORT, () => {
            console.log(`Product Service ${PORT} portunda çalışıyor.`);
        });
    })
    .catch((err) => console.error("MongoDB Bağlantı Hatası:", err));
