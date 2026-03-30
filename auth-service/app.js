const mongoose = require("mongoose");
const { createApp } = require("./src/createApp");
const { createConfig } = require("./src/config");
const { AuthUser } = require("./src/models/AuthUser");
const { SessionToken } = require("./src/models/SessionToken");

const config = createConfig();
const { app, authService } = createApp({ config });

if (require.main === module) {
  mongoose
    .connect(config.mongoUri)
    .then(async () => {
      await authService.seedDefaults();
      console.log("Auth Service veritabanina basariyla baglandi.");
      app.listen(config.port, () => {
        console.log(`Auth Service ${config.port} portunda calisiyor.`);
      });
    })
    .catch((err) => {
      console.error("MongoDB Baglanti Hatasi:", err);
    });
}

module.exports = { app, AuthUser, SessionToken };
