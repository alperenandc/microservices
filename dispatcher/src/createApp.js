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

  const app = express();

  app.use(express.json());
  app.use(morgan("dev"));

  app.post("/api/auth/login", createLoginHandler(authService));
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
