function createConfig(env = process.env) {
  return {
    port: env.PORT || 8080,
    mongoUri: env.MONGO_URI || "mongodb://localhost:27017/dispatcher_db",
    authServiceUrl: env.AUTH_SERVICE_URL || "http://localhost:3003",
    userServiceUrl: env.USER_SERVICE_URL || "http://localhost:3001",
    productServiceUrl: env.PRODUCT_SERVICE_URL || "http://localhost:3002",
    orderServiceUrl: env.ORDER_SERVICE_URL || "http://localhost:3004",
    internalGatewayKey: env.INTERNAL_GATEWAY_KEY || "dispatcher-internal-key",
  };
}

module.exports = { createConfig };
