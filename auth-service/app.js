const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");

const app = express();
const INTERNAL_GATEWAY_KEY =
  process.env.INTERNAL_GATEWAY_KEY || "dispatcher-internal-key";

app.use(express.json());
app.use(morgan("dev"));

function internalGatewayMiddleware(req, res, next) {
  if (req.path === "/health") {
    return next();
  }

  const gatewayKey = req.headers["x-internal-gateway-key"];

  if (gatewayKey !== INTERNAL_GATEWAY_KEY) {
    return res.status(403).json({
      error: true,
      message: "Bu servise sadece dispatcher uzerinden erisilebilir.",
    });
  }

  return next();
}

app.use(internalGatewayMiddleware);

const authUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const sessionTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const AuthUser = mongoose.model("AuthUser", authUserSchema);
const SessionToken = mongoose.model("SessionToken", sessionTokenSchema);

async function seedDefaultUser() {
  const username = process.env.AUTH_DEFAULT_USERNAME || "admin";
  const password = process.env.AUTH_DEFAULT_PASSWORD || "admin123";

  await AuthUser.updateOne(
    { username },
    { $setOnInsert: { username, password } },
    { upsert: true }
  );
}

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "auth-service" });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: true,
      message: "Kullanici adi ve sifre zorunludur.",
    });
  }

  try {
    const user = await AuthUser.findOne({ username, password });

    if (!user) {
      return res.status(401).json({
        error: true,
        message: "Gecersiz kullanici adi veya sifre.",
      });
    }

    const token = crypto.randomBytes(24).toString("hex");
    await SessionToken.create({ token, username: user.username, active: true });

    return res.status(200).json({
      token,
      tokenType: "Bearer",
      username: user.username,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Auth servisinde beklenmeyen bir hata olustu.",
    });
  }
});

app.post("/api/auth/validate", async (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      error: true,
      message: "Token bulunamadi.",
    });
  }

  try {
    const session = await SessionToken.findOne({ token, active: true });

    if (!session) {
      return res.status(401).json({
        error: true,
        message: "Gecersiz veya pasif token.",
      });
    }

    return res.status(200).json({
      valid: true,
      username: session.username,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Token dogrulanirken hata olustu.",
    });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 3003;
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/auth_db";

  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      await seedDefaultUser();
      console.log("Auth Service veritabanina basariyla baglandi.");
      app.listen(PORT, () => {
        console.log(`Auth Service ${PORT} portunda calisiyor.`);
      });
    })
    .catch((err) => {
      console.error("MongoDB Baglanti Hatasi:", err);
    });
}

module.exports = { app, AuthUser, SessionToken, seedDefaultUser };
