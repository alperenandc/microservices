function createConfig(env = process.env) {
  return {
    port: env.PORT || 3002,
    mongoUri: env.MONGO_URI || "mongodb://localhost:27017/product_db",
    internalGatewayKey: env.INTERNAL_GATEWAY_KEY || "dispatcher-internal-key",
  };
}

module.exports = { createConfig };
