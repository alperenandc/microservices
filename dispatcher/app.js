const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose"); // MongoDB için eklendi

const app = express();

app.use(express.json());
app.use(morgan("dev"));

// 1. Veritabanı Modeli: API Key (Yetkilendirme için)
// Proje İsteri 3.1: Yetkiler NoSQL üzerinde tutulmalıdır.
const apiKeySchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
});
const ApiKey = mongoose.model("ApiKey", apiKeySchema);

// 2. Güncellenmiş Auth Middleware (Gerçek Veritabanı Sorgusu)
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
    // 3. Gelen token'ı veritabanında arıyoruz
    const validToken = await ApiKey.findOne({ token: token, active: true });

    if (!validToken) {
      // Token veritabanında yoksa veya pasif (active: false) ise reddet
      return res.status(401).json({
        error: true,
        message: "Yetkilendirme hatası: Geçersiz veya süresi dolmuş token.",
      });
    }

    // Token bulunduysa geçişe izin ver
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Veritabanı hatası oluştu." });
  }
};

// Yönlendirmelerden önce Auth Middleware'i çalıştır
app.use("/api/users", authMiddleware, (req, res) => {
  res.status(200).json({ message: "User servisine yönlendirildi (Mock)" });
});

app.use("/api/products", authMiddleware, (req, res) => {
  res.status(200).json({ message: "Product servisine yönlendirildi (Mock)" });
});

// Bulunamayan Rota (Test 1)
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: "Route not found. Lütfen geçerli bir endpoint girin.",
  });
});

// 4. Uygulama doğrudan çalıştırıldığında MongoDB'ye bağlan ve sunucuyu başlat
// (Test çalışırken veritabanı bağlantısını test dosyamızın kendisi yönetiyor)
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  // docker-compose dosyamızda tanımladığımız MONGO_URI ortam değişkenini alıyoruz
  const MONGO_URI =
    process.env.MONGO_URI || "mongodb://localhost:27017/dispatcher_db";

  mongoose
    .connect(MONGO_URI)
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
