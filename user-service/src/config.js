function createConfig(env = process.env) {
  return {
    port: env.PORT || 3001,
    mongoUri: env.MONGO_URI || "mongodb://localhost:27017/user_db",
    internalGatewayKey: env.INTERNAL_GATEWAY_KEY || "dispatcher-internal-key",
  };
}

module.exports = { createConfig };
