const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");

const app = express();
app.use(express.json());
app.use(morgan("dev"));

// 1. Kendi Bağımsız Veritabanı Modeli (Network Isolation & Data Isolation)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number },
});
const User = mongoose.model("User", userSchema);

// 2. Health Check (Dispatcher'ın servisin ayakta olup olmadığını anlaması için)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "user-service" });
});

// =========================================================================
// RMM SEVİYE 2 STANDARTLARINDA RESTFUL API TASARIMI (PROJE İSTERİ 4.1)
// =========================================================================

// CREATE (Oluşturma) - HTTP POST
app.post("/api/users", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    // Başarıyla oluşturulduğunda 201 Created dönülmeli
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: true, message: error.message });
  }
});

// READ (Okuma - Tümü) - HTTP GET
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: true, message: "Sunucu hatası" });
  }
});

// READ (Okuma - Tekil) - HTTP GET
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ error: true, message: "Kullanıcı bulunamadı" });
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: true, message: "Geçersiz ID formatı" });
  }
});

// UPDATE (Güncelleme) - HTTP PUT
app.put("/api/users/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedUser)
      return res
        .status(404)
        .json({ error: true, message: "Kullanıcı bulunamadı" });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: true, message: "Güncelleme hatası" });
  }
});

// DELETE (Silme) - HTTP DELETE
app.delete("/api/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res
        .status(404)
        .json({ error: true, message: "Kullanıcı bulunamadı" });
    // Silme işlemi başarılıysa 204 No Content dönülür (RMM kuralı)
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: true, message: "Silme hatası" });
  }
});

// =========================================================================

// MongoDB Bağlantısı ve Sunucuyu Başlatma
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/user_db";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("User Service veritabanına başarıyla bağlandı.");
    app.listen(PORT, () => {
      console.log(`User Service ${PORT} portunda çalışıyor.`);
    });
  })
  .catch((err) => console.error("MongoDB Bağlantı Hatası:", err));
