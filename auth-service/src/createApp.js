const express = require("express");
const morgan = require("morgan");
const { createConfig } = require("./config");
const { AuthUser } = require("./models/AuthUser");
const { SessionToken } = require("./models/SessionToken");
const { AuthUserRepository } = require("./repositories/AuthUserRepository");
const { SessionTokenRepository } = require("./repositories/SessionTokenRepository");
const { AuthService } = require("./services/AuthService");
const { AuthController } = require("./controllers/AuthController");
const { createInternalGatewayMiddleware } = require("./middleware/createInternalGatewayMiddleware");
const { createAuthRoutes } = require("./routes/authRoutes");

function createApp(options = {}) {
  const config = options.config || createConfig();
  const authUserRepository =
    options.authUserRepository || new AuthUserRepository(AuthUser);
  const sessionTokenRepository =
    options.sessionTokenRepository ||
    new SessionTokenRepository(SessionToken);
  const authService =
    options.authService ||
    new AuthService({
      authUserRepository,
      sessionTokenRepository,
      config,
    });
  const authController =
    options.authController || new AuthController(authService);

  const app = express();

  app.use(express.json());
  app.use(morgan("dev"));
  app.use(createInternalGatewayMiddleware(config.internalGatewayKey));
  app.use(createAuthRoutes(authController));

  return { app, authService };
}

module.exports = { createApp };
