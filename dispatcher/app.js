const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const axios = require("axios");

const app = express();

app.use(express.json());
app.use(morgan("dev"));

const authMiddleware = async (req, res, next) => {
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
    await axios({
      method: "post",
      url: `${AUTH_SERVICE_URL}/api/auth/validate`,
      headers: buildInternalHeaders(token),
    });
    next();
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return res.status(401).json({
        error: true,
        message: "Yetkilendirme hatasi: Gecersiz veya suresi dolmus token.",
      });
    }

    return res
      .status(502)
      .json({ error: true, message: "Bad Gateway - Auth Service ulasilamiyor" });
  }
};

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3003";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:3002";
const INTERNAL_GATEWAY_KEY =
  process.env.INTERNAL_GATEWAY_KEY || "dispatcher-internal-key";

const buildInternalHeaders = (token) => ({
  "x-internal-gateway-key": INTERNAL_GATEWAY_KEY,
  ...(token ? { authorization: token } : {}),
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const response = await axios({
      method: "post",
      url: `${AUTH_SERVICE_URL}/api/auth/login`,
      data: req.body,
      headers: buildInternalHeaders(),
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res
      .status(502)
      .json({ error: true, message: "Bad Gateway - Auth Service ulasilamiyor" });
  }
});

app.use("/api/users", authMiddleware, async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${USER_SERVICE_URL}/api/users${req.url === '/' ? '' : req.url}`,
      data: req.body,
      headers: buildInternalHeaders(req.headers["authorization"]),
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(502).json({ error: true, message: "Bad Gateway - User Service ulaşılamıyor" });
    }
  }
});

app.use("/api/products", authMiddleware, async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${PRODUCT_SERVICE_URL}/api/products${req.url === '/' ? '' : req.url}`,
      data: req.body,
      headers: buildInternalHeaders(req.headers["authorization"]),
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
