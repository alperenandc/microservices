const express = require("express");
const morgan = require("morgan");
const { createConfig } = require("./config");
const { ProxyClient } = require("./http/ProxyClient");
const { GatewayHeaderFactory } = require("./services/GatewayHeaderFactory");
const { AuthService } = require("./services/AuthService");
const { RouteProxyService } = require("./services/RouteProxyService");
const { createAuthMiddleware } = require("./middleware/createAuthMiddleware");
const { createLoginHandler } = require("./handlers/createLoginHandler");
const { createProxyHandler } = require("./handlers/createProxyHandler");
const { GatewayAuditLog } = require("./models/GatewayAuditLog");
const { GatewayAuditLogRepository } = require("./repositories/GatewayAuditLogRepository");
const { createGatewayObservability } = require("./monitoring/createGatewayObservability");

function createApp(options = {}) {
  const config = options.config || createConfig();
  const proxyClient = options.proxyClient || new ProxyClient();
  const headerFactory =
    options.headerFactory || new GatewayHeaderFactory(config.internalGatewayKey);

  const authService =
    options.authService ||
    new AuthService({
      proxyClient,
      authServiceUrl: config.authServiceUrl,
      headerFactory,
    });

  const userRouteProxy =
    options.userRouteProxy ||
    new RouteProxyService({
      proxyClient,
      baseUrl: config.userServiceUrl,
      resourceBasePath: "/api/users",
      headerFactory,
    });

  const productRouteProxy =
    options.productRouteProxy ||
    new RouteProxyService({
      proxyClient,
      baseUrl: config.productServiceUrl,
      resourceBasePath: "/api/products",
      headerFactory,
    });

  const authMiddleware =
    options.authMiddleware || createAuthMiddleware(authService);
  const gatewayAuditLogRepository =
    options.gatewayAuditLogRepository ||
    new GatewayAuditLogRepository(GatewayAuditLog);
  const gatewayObservability =
    options.gatewayObservability ||
    createGatewayObservability({ auditLogRepository: gatewayAuditLogRepository });

  const app = express();

  app.use(express.json());
  app.use(morgan("dev"));
  app.use(gatewayObservability.middleware);

  app.get("/metrics", gatewayObservability.metricsHandler);

  app.post("/api/auth/login", createLoginHandler(authService));
  app.get("/api/admin/logs", authMiddleware, async (req, res) => {
    try {
      const limit = Number(req.query.limit || 100);
      const logs = await gatewayAuditLogRepository.listRecent(limit);
      return res.status(200).json(logs);
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Gateway loglari okunurken hata olustu.",
      });
    }
  });

  app.use(
    "/api/users",
    authMiddleware,
    createProxyHandler(userRouteProxy, "Bad Gateway - User Service ulasilamiyor")
  );
  app.use(
    "/api/products",
    authMiddleware,
    createProxyHandler(
      productRouteProxy,
      "Bad Gateway - Product Service ulasilamiyor"
    )
  );

  app.use((req, res) => {
    res.status(404).json({
      error: true,
      message: "Route not found. Lutfen gecerli bir endpoint girin.",
    });
  });

  return app;
}

module.exports = { createApp };
