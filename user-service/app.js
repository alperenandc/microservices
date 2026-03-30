const mongoose = require("mongoose");
const { createApp } = require("./src/createApp");
const { createConfig } = require("./src/config");

const config = createConfig();
const { app } = createApp({ config });

mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log("User Service veritabanına başarıyla bağlandı.");
    app.listen(config.port, () => {
      console.log(`User Service ${config.port} portunda çalışıyor.`);
    });
  })
  .catch((err) => console.error("MongoDB Bağlantı Hatası:", err));

module.exports = { app };
