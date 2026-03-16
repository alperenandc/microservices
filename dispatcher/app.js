const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const axios = require("axios"); // Gerçek yönlendirme (Proxy) için eklendi

const app = express();

app.use(express.json());
app.use(morgan("dev"));

// =========================================================================
// 1. VERİTABANI MODELİ: API Key (Yetkilendirme için)
// Proje İsteri 3.1: Yetkiler NoSQL üzerinde tutulmalıdır.
// =========================================================================
const apiKeySchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
});
const ApiKey = mongoose.model("ApiKey", apiKeySchema);

// =========================================================================
// 2. AUTH MIDDLEWARE (Gerçek Veritabanı Sorgusu)
// =========================================================================
const authMiddleware = async (req, res, next) => {
  // Sağlık kontrolü rotalarına izinsiz geçiş veriyoruz
  if (req.path.includes("/health")) {
    return next();
  }

  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({
      error: true,
      message: "Yetkilendirme hatası: Geçerli bir token bulunamadı.",
    });
  }

  try {
    // Gelen token'ı veritabanında arıyoruz
    const validToken = await ApiKey.findOne({ token: token, active: true });

    if (!validToken) {
      // Token veritabanında yoksa veya pasif ise reddet
      return res.status(401).json({
        error: true,
        message: "Yetkilendirme hatası: Geçersiz veya süresi dolmuş token.",
      });
    }

    // Token bulunduysa geçişe izin ver
    next();
  } catch (error) {
    return res.status(500).json({ error: true, message: "Veritabanı hatası oluştu." });
  }
};

// =========================================================================
// 3. GERÇEK YÖNLENDİRME (PROXY) İŞLEMLERİ (Proje İsteri 3.1)
// =========================================================================
// Docker-compose'dan veya test ortamından iç ağ adreslerini alıyoruz
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

// Kullanıcı Servisine (User Service) Yönlendirme
app.use("/api/users", authMiddleware, async (req, res) => {
  try {
    // İsteği aynen user_service'e iletiyoruz
    const response = await axios({
      method: req.method,
      url: `${USER_SERVICE_URL}/api/users${req.url === '/' ? '' : req.url}`,
      data: req.body,
    });
    // Gelen cevabı kullanıcıya dönüyoruz
    res.status(response.status).json(response.data);
  } catch (error) {
    // Mikroservis ayakta değilse veya hata döndüyse uygun hatayı ver
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(502).json({ error: true, message: "Bad Gateway - User Service ulaşılamıyor" });
    }
  }
});

// Ürün Servisine (Product Service) Yönlendirme
app.use("/api/products", authMiddleware, async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${PRODUCT_SERVICE_URL}/api/products${req.url === '/' ? '' : req.url}`,
      data: req.body,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(502).json({ error: true, message: "Bad Gateway - Product Service ulaşılamıyor" });
    }
  }
});

// =========================================================================
// 4. HATA YÖNETİMİ VE SUNUCU BAŞLATMA
// =========================================================================

// Bulunamayan Rota (Test 1)
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: "Route not found. Lütfen geçerli bir endpoint girin.",
  });
});

// Uygulama doğrudan çalıştırıldığında MongoDB'ye bağlan ve sunucuyu başlat
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/dispatcher_db";

  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log("Dispatcher veritabanına başarıyla bağlandı.");
      app.listen(PORT, () => {
        console.log(`Dispatcher (API Gateway) ${PORT} portunda çalışıyor.`);
      });
    })
    .catch((err) => {
      console.error("MongoDB Bağlantı Hatası:", err);
    });
}

module.exports = app;