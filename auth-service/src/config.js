function createConfig(env = process.env) {
  return {
    port: env.PORT || 3003,
    mongoUri: env.MONGO_URI || "mongodb://localhost:27017/auth_db",
    internalGatewayKey: env.INTERNAL_GATEWAY_KEY || "dispatcher-internal-key",
    defaultUsername: env.AUTH_DEFAULT_USERNAME || "admin",
    defaultPassword: env.AUTH_DEFAULT_PASSWORD || "admin123",
  };
}

module.exports = { createConfig };
