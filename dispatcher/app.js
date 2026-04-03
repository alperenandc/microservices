const mongoose = require("mongoose");
const { createApp } = require("./src/createApp");
const { createConfig } = require("./src/config");

const config = createConfig();
const app = createApp({ config });

// Uygulama doğrudan çalıştırıldığında MongoDB'ye bağlan ve sunucuyu başlat
if (require.main === module) {
  mongoose
    .connect(config.mongoUri)
    .then(() => {
      console.log("Dispatcher veritabanina basariyla baglandi.");
      app.listen(config.port, () => {
        console.log(`Dispatcher (API Gateway) ${config.port} portunda calisiyor.`);
      });
    })
    .catch((err) => {
      console.error("MongoDB Baglanti Hatasi:", err);
    });
}

module.exports = app;
